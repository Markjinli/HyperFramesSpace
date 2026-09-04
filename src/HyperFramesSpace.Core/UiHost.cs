using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;

namespace HyperFramesSpace.Core;

public static class HostBridge
{
    public static Action<string>? WindowAction { get; set; }
    public static Func<string?>? PickFolder { get; set; }
}

public sealed class UiHost : IDisposable
{
    readonly string _uiRoot;
    readonly string _vendorRoot;
    readonly CatalogDb _db;
    readonly IndexService _index;
    readonly PreviewServer _preview = new();
    HttpListener? _http;
    int _port;
    volatile bool _scanning;
    volatile bool _scanDone;
    string _scanError = "";
    IndexProgress _progress = new();
    IndexResult? _lastResult;
    CancellationTokenSource? _scanCts;
    static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public UiHost(string uiRoot, string vendorRoot)
    {
        _uiRoot = Path.GetFullPath(uiRoot);
        _vendorRoot = Path.GetFullPath(vendorRoot);
        _db = new CatalogDb();
        _index = new IndexService(_db);
    }

    public string Start()
    {
        for (var port = 3720; port < 3760; port++)
        {
            var http = new HttpListener();
            http.Prefixes.Add($"http://127.0.0.1:{port}/");
            try
            {
                http.Start();
                _http = http;
                _port = port;
                _ = Task.Run(Loop);
                return $"http://127.0.0.1:{port}/";
            }
            catch { try { http.Close(); } catch { } }
        }
        throw new InvalidOperationException("无法绑定本地 UI 端口");
    }

    public string Url => $"http://127.0.0.1:{_port}/";

    async Task Loop()
    {
        while (_http is { IsListening: true })
        {
            HttpListenerContext ctx;
            try { ctx = await _http.GetContextAsync(); }
            catch { break; }
            _ = Task.Run(() => Serve(ctx));
        }
    }

    void Serve(HttpListenerContext ctx)
    {
        try
        {
            var path = ctx.Request.Url?.AbsolutePath ?? "/";
            if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
            {
                Api(ctx, path["/api/".Length..]);
                return;
            }
            if (path.Equals("/media", StringComparison.OrdinalIgnoreCase))
            {
                var p = GetQuery(ctx.Request.Url, "p");
                WriteFile(ctx, p ?? "", allowAnyLocal: true);
                return;
            }
            if (path == "/") path = "/index.html";
            string file;
            if (path.StartsWith("/vendor/", StringComparison.OrdinalIgnoreCase))
                file = Path.GetFullPath(Path.Combine(_vendorRoot, path["/vendor/".Length..].Replace('/', Path.DirectorySeparatorChar)));
            else
                file = Path.GetFullPath(Path.Combine(_uiRoot, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
            WriteFile(ctx, file, allowAnyLocal: false, root: path.StartsWith("/vendor/") ? _vendorRoot : _uiRoot);
        }
        catch
        {
            try { ctx.Response.Abort(); } catch { }
        }
    }

    void Api(HttpListenerContext ctx, string route)
    {
        var method = ctx.Request.HttpMethod.ToUpperInvariant();
        using var reader = new StreamReader(ctx.Request.InputStream, ctx.Request.ContentEncoding);
        var body = reader.ReadToEnd();
        JsonElement json = default;
        if (!string.IsNullOrWhiteSpace(body))
        {
            try { json = JsonDocument.Parse(body).RootElement; } catch { }
        }
        var qsQuery = GetQuery(ctx.Request.Url, "query");
        var qsWorkflow = GetQuery(ctx.Request.Url, "workflow");
        var qsLimit = GetQuery(ctx.Request.Url, "limit");
        var qsId = GetQuery(ctx.Request.Url, "id");

        object result = new { ok = true };
        try
        {
            if (route == "settings" && method == "GET") result = SettingsStore.Load();
            else if (route == "settings" && method == "POST") result = SettingsStore.Merge(json);
            else if (route == "catalog" && method == "GET")
            {
                var rows = _db.Query(qsQuery, qsWorkflow, ParseInt(qsLimit, 10000));
                result = new { total = rows.Count, projects = rows.Select(ToClient).ToList() };
            }
            else if (route == "project" && method == "GET")
            {
                var id = qsId ?? "";
                var row = _db.GetById(id);
                result = row == null ? null! : ToClient(ProjectHydrator.ReadDetail(row.Path));
            }
            else if (route == "scan/start" && method == "POST")
            {
                StartScan();
                result = new { ok = true, running = true };
            }
            else if (route == "scan/cancel" && method == "POST")
            {
                _scanCts?.Cancel();
                result = new { ok = true, running = false };
            }
            else if (route == "scan/status" && method == "GET")
            {
                result = new
                {
                    running = _scanning,
                    done = _scanDone && !_scanning,
                    error = _scanError,
                    progress = _progress,
                    result = _lastResult
                };
            }
            else if (route == "usn" && method == "GET")
            {
                result = new { helper = true, cached = _db.Count() > 0 };
            }
            else if (route == "occupancy" && method == "GET")
            {
                result = new { cpu = 0, mem = 0, gpu = 0, gpuKnown = false };
            }
            else if (route == "processes" && method == "GET")
            {
                var lines = ProcessSampler.ListInteresting();
                result = new { processes = lines.Select(l => new { name = l }).ToList(), load = new { cpu = 0, mem = 0, gpu = 0 } };
            }
            else if (route == "kill" && method == "POST") result = new { killed = Array.Empty<int>() };
            else if (route == "jobs" && method == "GET") result = Array.Empty<object>();
            else if (route == "job" && method == "POST")
            {
                var action = Str(json, "action");
                var project = json.TryGetProperty("project", out var p) ? p : default;
                var dir = project.ValueKind == JsonValueKind.Object ? Str(project, "path") : "";
                var pin = project.ValueKind == JsonValueKind.Object ? Str(project, "pin") : "";
                if (!string.IsNullOrEmpty(dir) && !string.IsNullOrEmpty(action))
                    AgentLauncher.StartJob(action, dir, pin);
                result = new { ok = true };
            }
            else if (route == "agent" && method == "POST")
            {
                var agent = Str(json, "agent");
                var project = json.TryGetProperty("project", out var p) ? p : default;
                var dir = project.ValueKind == JsonValueKind.Object ? Str(project, "path") : "";
                result = new { ok = true, command = AgentLauncher.Open(agent, dir) };
            }
            else if (route == "open" && method == "POST")
            {
                var target = Str(json, "target");
                var reveal = json.TryGetProperty("reveal", out var r) && r.ValueKind == JsonValueKind.True;
                if (!string.IsNullOrEmpty(target))
                    Process.Start(new ProcessStartInfo { FileName = "explorer.exe", Arguments = reveal ? "/select," + target : target, UseShellExecute = true });
                result = new { ok = true };
            }
            else if (route == "window" && method == "POST")
            {
                HostBridge.WindowAction?.Invoke(Str(json, "action"));
                result = new { ok = true };
            }
            else if (route == "choose-dir" && method == "POST")
            {
                result = (object?)HostBridge.PickFolder?.Invoke() ?? "";
            }
            else if (route == "preview/start" && method == "POST")
            {
                var dir = Str(json, "path");
                var name = Str(json, "name");
                var duration = 0d;
                if (json.ValueKind == JsonValueKind.Object && json.TryGetProperty("duration", out var durEl))
                {
                    if (durEl.ValueKind == JsonValueKind.Number) duration = durEl.GetDouble();
                    else double.TryParse(durEl.ToString(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out duration);
                }
                var url = _preview.Start(dir, _vendorRoot, name, duration);
                result = new { url, reused = false };
            }
            else if (route == "preview/stop" && method == "POST")
            {
                _preview.Stop();
                result = new { ok = true };
            }
            else if (route == "preview/status" && method == "GET")
            {
                result = new { url = _preview.Url };
            }
            else if (route == "reset" && method == "POST")
            {
                try { File.Delete(AppPaths.Settings); } catch { }
                result = SettingsStore.Load();
            }
            else result = new { ok = false, error = "unknown " + route };
        }
        catch (Exception ex)
        {
            WriteJson(ctx, new { ok = false, error = ex.Message }, 500);
            return;
        }
        WriteJson(ctx, result);
    }

    void StartScan()
    {
        if (_scanning) return;
        _scanning = true;
        _scanDone = false;
        _scanError = "";
        _lastResult = null;
        _progress = new IndexProgress { Phase = "start", Percent = 2, Message = "scanning" };
        _scanCts = new CancellationTokenSource();
        var ct = _scanCts.Token;
        var progress = new Progress<IndexProgress>(p => _progress = p);
        _ = Task.Run(() =>
        {
            try
            {
                _lastResult = _index.Refresh(ScanRequest.FromSettings(SettingsStore.Load()), progress, ct);
            }
            catch (OperationCanceledException)
            {
                _lastResult = new IndexResult { Ok = false, Error = "cancelled" };
            }
            catch (Exception ex)
            {
                _scanError = ex.Message;
            }
            finally
            {
                _scanning = false;
                _scanDone = true;
            }
        }, ct);
    }

    static object ToClient(ProjectRow row)
    {
        var detail = row as ProjectDetail;
        return new
        {
            id = row.Id,
            name = row.Name,
            path = row.Path,
            mtime = row.Mtime,
            duration = row.Duration,
            aspect = row.Aspect,
            workflow = row.Workflow,
            pin = row.Pin,
            status = row.Status,
            thumb = Media(row.Thumb),
            brief = row.Brief,
            collection = row.Collection,
            tags = string.IsNullOrEmpty(row.Tags) ? Array.Empty<string>() : row.Tags.Split(' ', StringSplitOptions.RemoveEmptyEntries),
            frameSrcs = detail?.Frames.Select(Media).ToArray() ?? Array.Empty<string>(),
            frames = detail?.Frames.Select(Media).ToArray() ?? Array.Empty<string>()
        };
    }

    static string? Media(string? path)
    {
        if (string.IsNullOrEmpty(path)) return null;
        if (path.StartsWith("/media") || path.StartsWith("http")) return path;
        return "/media?p=" + Uri.EscapeDataString(path);
    }

    static string? GetQuery(Uri? url, string key)
    {
        var q = url?.Query;
        if (string.IsNullOrEmpty(q)) return null;
        foreach (var part in q.TrimStart('?').Split('&'))
        {
            var i = part.IndexOf('=');
            var k = Uri.UnescapeDataString(i < 0 ? part : part[..i]);
            if (!k.Equals(key, StringComparison.OrdinalIgnoreCase)) continue;
            return i < 0 ? "" : Uri.UnescapeDataString(part[(i + 1)..].Replace('+', ' '));
        }
        return null;
    }

    static string Str(JsonElement json, string name)
    {
        if (json.ValueKind != JsonValueKind.Object) return "";
        return json.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() ?? "" : "";
    }

    static int ParseInt(string? s, int fallback) => int.TryParse(s, out var n) ? n : fallback;

    void WriteJson(HttpListenerContext ctx, object? data, int status = 200)
    {
        var bytes = Encoding.UTF8.GetBytes(data == null ? "null" : JsonSerializer.Serialize(data, JsonOpts));
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        ctx.Response.Headers["Cache-Control"] = "no-store";
        ctx.Response.ContentLength64 = bytes.Length;
        ctx.Response.OutputStream.Write(bytes);
        ctx.Response.Close();
    }

    void WriteFile(HttpListenerContext ctx, string file, bool allowAnyLocal, string? root = null)
    {
        if (string.IsNullOrEmpty(file) || !File.Exists(file))
        {
            ctx.Response.StatusCode = 404;
            ctx.Response.Close();
            return;
        }
        var full = Path.GetFullPath(file);
        if (!allowAnyLocal && root != null && !full.StartsWith(Path.GetFullPath(root), StringComparison.OrdinalIgnoreCase))
        {
            ctx.Response.StatusCode = 403;
            ctx.Response.Close();
            return;
        }
        var bytes = File.ReadAllBytes(full);
        ctx.Response.ContentType = Mime(full);
        ctx.Response.ContentLength64 = bytes.Length;
        ctx.Response.OutputStream.Write(bytes);
        ctx.Response.Close();
    }

    static string Mime(string file) => Path.GetExtension(file).ToLowerInvariant() switch
    {
        ".html" => "text/html; charset=utf-8",
        ".js" => "text/javascript; charset=utf-8",
        ".css" => "text/css; charset=utf-8",
        ".json" => "application/json",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".ico" => "image/x-icon",
        ".svg" => "image/svg+xml",
        ".webp" => "image/webp",
        ".woff2" => "font/woff2",
        _ => "application/octet-stream"
    };

    public void Dispose()
    {
        _scanCts?.Cancel();
        _preview.Dispose();
        try { _http?.Stop(); } catch { }
        try { _http?.Close(); } catch { }
        _db.Dispose();
    }
}
