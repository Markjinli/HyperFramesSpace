using System.Diagnostics;
using System.Net;
using System.Text;

namespace HyperFramesSpace.Core;

public sealed class PreviewServer : IDisposable
{
    HttpListener? _http;
    string _root = "";
    string _vendor = "";
    string _name = "";
    double _duration;
    int _gen;
    int _port;

    public string? Url => _http == null ? null : $"http://127.0.0.1:{_port}/";

    public string Start(string projectDir, string vendorDir, string? name = null, double duration = 0)
    {
        Stop();
        _root = projectDir;
        _vendor = vendorDir;
        _name = name ?? Path.GetFileName(projectDir);
        _duration = duration;
        _gen++;
        for (var port = 3317; port <= 3347; port++)
        {
            var http = new HttpListener();
            http.Prefixes.Add($"http://127.0.0.1:{port}/");
            try
            {
                http.Start();
                _http = http;
                _port = port;
                _ = Task.Run(Loop);
                return Url!;
            }
            catch
            {
                http.Close();
            }
        }
        throw new InvalidOperationException("无法绑定预览端口 3317-3347");
    }

    public void Stop()
    {
        try { _http?.Stop(); } catch { }
        try { _http?.Close(); } catch { }
        _http = null;
    }

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
            var path = Uri.UnescapeDataString(ctx.Request.Url?.AbsolutePath ?? "/");
            if (path is "/" or "/index.html")
            {
                WriteBytes(ctx, "text/html; charset=utf-8", Encoding.UTF8.GetBytes(PlayerPage()));
                return;
            }
            if (path is "/runtime.js" or "/vendor/hyperframe-runtime.js")
            {
                WriteDisk(ctx, Path.Combine(_vendor, "hyperframe-runtime.js"), _vendor);
                return;
            }
            if (path.Equals("/vendor/hyperframes-player.global.js", StringComparison.OrdinalIgnoreCase))
            {
                WriteDisk(ctx, Path.Combine(_vendor, "hyperframes-player.global.js"), _vendor);
                return;
            }
            if (path.StartsWith("/vendor/", StringComparison.OrdinalIgnoreCase))
            {
                WriteDisk(ctx, Path.Combine(_vendor, path["/vendor/".Length..].Replace('/', Path.DirectorySeparatorChar)), _vendor);
                return;
            }
            if (path.StartsWith("/p/", StringComparison.OrdinalIgnoreCase))
            {
                var rel = path[3..];
                if (string.IsNullOrWhiteSpace(rel) || rel == "/") rel = "index.html";
                WriteDisk(ctx, Path.Combine(_root, rel.Replace('/', Path.DirectorySeparatorChar)), _root, injectRuntime: true);
                return;
            }
            ctx.Response.StatusCode = 404;
            ctx.Response.Close();
        }
        catch
        {
            try { ctx.Response.Abort(); } catch { }
        }
    }

    string PlayerPage()
    {
        var name = (_name ?? "").Replace("<", "").Replace(">", "");
        var dur = _duration;
        var gen = _gen;
        return $$"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>{{name}}</title>
  <script src="/vendor/hyperframes-player.global.js"></script>
  <style>
    html, body { margin: 0; height: 100%; background: #07090d; color: #e8edf4; font-family: "Segoe UI", "Microsoft YaHei UI", sans-serif; overflow: hidden; }
    hyperframes-player { display: block; width: 100%; height: calc(100% - 58px); background: #000; }
    .dock {
      height: 58px; display: grid; grid-template-columns: 44px 1fr 108px;
      gap: 10px; align-items: center; padding: 0 12px;
      background: #10141b; border-top: 1px solid #2a3140;
    }
    button {
      width: 36px; height: 32px; border: 0; border-radius: 8px;
      background: #e8a317; color: #1a1203; font-weight: 700; cursor: pointer;
    }
    input[type=range] { width: 100%; accent-color: #e8a317; cursor: ew-resize; }
    .time { font: 12px/1 "Cascadia Mono", Consolas, monospace; color: #8d96a8; text-align: right; }
  </style>
</head>
<body>
  <hyperframes-player id="player" src="/p/index.html?g={{gen}}" width="1920" height="1080" muted></hyperframes-player>
  <div class="dock">
    <button type="button" id="pp" title="播放/暂停">▶</button>
    <input id="seek" type="range" min="0" max="1000" value="0" step="1">
    <div class="time" id="time">0.0 / {{(dur > 0 ? dur.ToString("0.0") : "—")}}</div>
  </div>
  <script>
    const player = document.getElementById('player');
    const seek = document.getElementById('seek');
    const time = document.getElementById('time');
    const pp = document.getElementById('pp');
    let dragging = false;
    const fallbackDur = {{dur.ToString(System.Globalization.CultureInfo.InvariantCulture)}};
    function dur() { return player.duration > 0 ? player.duration : fallbackDur; }
    function fmt(n) { n = Number(n) || 0; return (Math.round(n * 10) / 10).toFixed(1); }
    function paint() {
      const d = dur();
      const t = player.currentTime || 0;
      if (!dragging && d > 0) seek.value = String(Math.round(t / d * 1000));
      time.textContent = fmt(t) + ' / ' + (d ? fmt(d) : '—');
      pp.textContent = player.paused ? '▶' : '❚❚';
    }
    function toggle() {
      if (player.paused) player.play(); else player.pause();
      paint();
    }
    player.addEventListener('timeupdate', paint);
    player.addEventListener('loadedmetadata', paint);
    setInterval(paint, 400);
    pp.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    seek.addEventListener('input', () => {
      const d = dur();
      if (!d) return;
      player.currentTime = (Number(seek.value) / 1000) * d;
      paint();
    });
    window.addEventListener('message', (e) => {
      if (e.data === 'toggle' || e.data === 'play' || e.data === 'pause') {
        if (e.data === 'play') player.play();
        else if (e.data === 'pause') player.pause();
        else toggle();
        paint();
      }
    });
  </script>
</body>
</html>
""";
    }

    void WriteDisk(HttpListenerContext ctx, string file, string root, bool injectRuntime = false)
    {
        var full = Path.GetFullPath(file);
        var allowed = Path.GetFullPath(root);
        if (!full.StartsWith(allowed, StringComparison.OrdinalIgnoreCase) || !File.Exists(full))
        {
            ctx.Response.StatusCode = 404;
            ctx.Response.Close();
            return;
        }
        if (injectRuntime && full.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            var html = File.ReadAllText(full);
            if (html.IndexOf("hyperframe-runtime", StringComparison.OrdinalIgnoreCase) < 0 &&
                html.IndexOf("/runtime.js", StringComparison.OrdinalIgnoreCase) < 0)
            {
                html = System.Text.RegularExpressions.Regex.Replace(
                    html, "<head[^>]*>", "$0\n<script src=\"/runtime.js\"></script>",
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            }
            WriteBytes(ctx, "text/html; charset=utf-8", Encoding.UTF8.GetBytes(html));
            return;
        }
        var bytes = File.ReadAllBytes(full);
        WriteBytes(ctx, Mime(full), bytes);
    }

    static void WriteBytes(HttpListenerContext ctx, string type, byte[] bytes)
    {
        ctx.Response.ContentType = type;
        ctx.Response.Headers["Cache-Control"] = "no-store";
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
        ".webp" => "image/webp",
        ".gif" => "image/gif",
        ".svg" => "image/svg+xml",
        ".mp4" => "video/mp4",
        ".woff2" => "font/woff2",
        _ => "application/octet-stream"
    };

    public void Dispose() => Stop();
}

public static class ProcessSampler
{
    public static IReadOnlyList<string> ListInteresting()
    {
        var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "node", "ffmpeg", "chrome", "msedge", "electron" };
        var lines = new List<string>();
        foreach (var p in Process.GetProcesses())
        {
            try
            {
                if (!names.Contains(p.ProcessName)) continue;
                lines.Add($"{p.ProcessName}  pid={p.Id}  {Math.Round(p.WorkingSet64 / 1048576.0)} MB");
            }
            catch { }
            finally { p.Dispose(); }
        }
        return lines;
    }
}

public static class NativeApp
{
    [System.Runtime.InteropServices.DllImport("shell32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
    static extern int SetCurrentProcessExplicitAppUserModelID(string appID);

    public static void SetAppId()
    {
        try { SetCurrentProcessExplicitAppUserModelID(AppPaths.AppId); } catch { }
    }
}
