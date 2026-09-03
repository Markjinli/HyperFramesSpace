using System.Text.Json;
using System.Text.RegularExpressions;

namespace HyperFramesSpace.Core;

public static class ProjectHydrator
{
    static readonly HashSet<string> Skip = new(StringComparer.OrdinalIgnoreCase)
    {
        "node_modules", ".git", "dist", "build", "out", "coverage",
        "windows", "program files", "program files (x86)", "programdata"
    };

    public static long StatMtime(string dir)
    {
        long latest = 0;
        foreach (var name in new[] { "hyperframes.json", "BRIEF.md", "package.json" })
        {
            var f = Path.Combine(dir, name);
            try
            {
                var t = File.GetLastWriteTimeUtc(f).Ticks;
                if (t > latest) latest = t;
            }
            catch { }
        }
        if (latest == 0)
        {
            try { latest = Directory.GetLastWriteTimeUtc(dir).Ticks; } catch { }
        }
        return latest;
    }

    public static ProjectRow ReadListRow(string dir)
    {
        var hf = ReadJson(Path.Combine(dir, "hyperframes.json"));
        var pkg = ReadJson(Path.Combine(dir, "package.json"));
        var meta = ReadJson(Path.Combine(dir, "meta.json"));
        var briefText = ReadText(Path.Combine(dir, "BRIEF.md"));
        var fm = ParseFrontMatter(briefText);
        var pin = ParsePin(pkg);
        var duration = ParseDuration(fm.GetValueOrDefault("length"));
        var aspectRaw = fm.GetValueOrDefault("aspect") ?? "";
        var thumb = FirstImage(Path.Combine(dir, "snapshots"))
                    ?? FirstImage(Path.Combine(dir, ".thumbnails"));
        var id = SanitizeId(Str(meta, "id") ?? Str(pkg, "name") ?? Path.GetFileName(dir));
        var message = fm.GetValueOrDefault("message") ?? FirstBriefLine(briefText);
        return new ProjectRow
        {
            Id = id,
            Name = Str(meta, "name") ?? Str(pkg, "name") ?? Path.GetFileName(dir) ?? id,
            Path = dir,
            Mtime = StatMtime(dir),
            Duration = duration,
            Aspect = string.IsNullOrWhiteSpace(aspectRaw) ? "—" : aspectRaw.Replace("x", "×", StringComparison.OrdinalIgnoreCase),
            Workflow = fm.GetValueOrDefault("workflow") ?? Str(hf, "authoringSkill") ?? "general-video",
            Pin = string.IsNullOrEmpty(pin) ? "unpinned" : pin,
            Status = "ready",
            Thumb = thumb,
            Brief = string.IsNullOrWhiteSpace(message) ? "尚未写 BRIEF 一句话。" : message,
            Collection = InferCollection(dir),
            Tags = string.Join(" ", new[] { fm.GetValueOrDefault("workflow"), fm.GetValueOrDefault("destination") }.Where(s => !string.IsNullOrWhiteSpace(s)))
        };
    }

    public static ProjectDetail ReadDetail(string dir)
    {
        var row = ReadListRow(dir);
        var frames = ListImages(Path.Combine(dir, "snapshots"), 9);
        if (frames.Count == 0) frames = ListImages(Path.Combine(dir, ".thumbnails"), 9);
        return new ProjectDetail
        {
            Id = row.Id,
            Name = row.Name,
            Path = row.Path,
            Mtime = row.Mtime,
            Duration = row.Duration,
            Aspect = row.Aspect,
            Workflow = row.Workflow,
            Pin = row.Pin,
            Status = row.Status,
            Thumb = row.Thumb ?? (frames.Count > 0 ? frames[0] : null),
            Brief = row.Brief,
            Collection = row.Collection,
            Tags = row.Tags,
            Frames = frames.ToArray(),
            IndexHtml = Path.Combine(dir, "index.html")
        };
    }

    public static IEnumerable<string> WalkFallback(IEnumerable<string> roots, int maxDepth = 12)
    {
        var found = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var root in roots)
        {
            if (string.IsNullOrWhiteSpace(root) || !Directory.Exists(root)) continue;
            var stack = new Stack<(string dir, int depth)>();
            stack.Push((root, maxDepth));
            while (stack.Count > 0)
            {
                var (dir, depth) = stack.Pop();
                if (depth < 0) continue;
                IEnumerable<string> entries;
                try { entries = Directory.EnumerateFileSystemEntries(dir); }
                catch { continue; }
                var hit = false;
                var subs = new List<string>();
                foreach (var entry in entries)
                {
                    var name = Path.GetFileName(entry);
                    if (name.Equals("hyperframes.json", StringComparison.OrdinalIgnoreCase) && File.Exists(entry))
                    {
                        found.Add(dir);
                        hit = true;
                        break;
                    }
                    if (Directory.Exists(entry) && !Skip.Contains(name)) subs.Add(entry);
                }
                if (hit) continue;
                foreach (var sub in subs) stack.Push((sub, depth - 1));
            }
        }
        return found;
    }

    static string? FirstImage(string dir)
    {
        var list = ListImages(dir, 1);
        return list.Count > 0 ? list[0] : null;
    }

    static List<string> ListImages(string dir, int max)
    {
        var acc = new List<string>();
        if (!Directory.Exists(dir)) return acc;
        try
        {
            foreach (var file in Directory.EnumerateFiles(dir).OrderBy(f => f, StringComparer.OrdinalIgnoreCase))
            {
                var ext = Path.GetExtension(file);
                if (!Regex.IsMatch(ext, @"^\.(png|jpe?g|webp|gif)$", RegexOptions.IgnoreCase)) continue;
                if (Path.GetFileName(file).StartsWith("finding-", StringComparison.OrdinalIgnoreCase)) continue;
                acc.Add(file);
                if (acc.Count >= max) break;
            }
        }
        catch { }
        return acc;
    }

    static Dictionary<string, object?>? ReadJson(string file)
    {
        try
        {
            if (!File.Exists(file)) return null;
            return JsonSerializer.Deserialize<Dictionary<string, object?>>(File.ReadAllText(file));
        }
        catch { return null; }
    }

    static string ReadText(string file)
    {
        try { return File.Exists(file) ? File.ReadAllText(file) : ""; }
        catch { return ""; }
    }

    static string? Str(Dictionary<string, object?>? doc, string key)
    {
        if (doc == null || !doc.TryGetValue(key, out var v) || v is null) return null;
        if (v is JsonElement el)
        {
            return el.ValueKind == JsonValueKind.String ? el.GetString() : el.ToString();
        }
        return v.ToString();
    }

    static Dictionary<string, string> ParseFrontMatter(string text)
    {
        var outDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var m = Regex.Match(text ?? "", @"^---\r?\n([\s\S]*?)\r?\n---");
        if (!m.Success) return outDict;
        foreach (var line in m.Groups[1].Value.Split('\n'))
        {
            var kv = Regex.Match(line.TrimEnd('\r'), @"^([A-Za-z0-9_-]+):\s*(.*)$");
            if (!kv.Success) continue;
            var v = kv.Groups[2].Value.Trim().Trim('"').Trim('\'');
            outDict[kv.Groups[1].Value] = v;
        }
        return outDict;
    }

    static double ParseDuration(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return 0;
        var s = Regex.Replace(raw, @"s$", "", RegexOptions.IgnoreCase).Trim();
        return double.TryParse(s, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var n) ? n : 0;
    }

    static string ParsePin(Dictionary<string, object?>? pkg)
    {
        if (pkg == null) return "";
        try
        {
            var blob = JsonSerializer.Serialize(pkg.TryGetValue("scripts", out var s) ? s : pkg);
            var m = Regex.Match(blob, @"hyperframes@([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.]+)?)");
            return m.Success ? m.Groups[1].Value : "";
        }
        catch { return ""; }
    }

    static string FirstBriefLine(string text)
    {
        foreach (var line in (text ?? "").Split('\n'))
        {
            var t = line.TrimEnd('\r').Trim();
            if (t.Length == 0 || t.StartsWith('#') || t.StartsWith('-') || t.StartsWith("---")) continue;
            return t;
        }
        return "";
    }

    static string SanitizeId(string raw)
    {
        return Regex.Replace(raw ?? "project", @"\s+", "-");
    }

    static string InferCollection(string dir)
    {
        var lower = dir.ToLowerInvariant();
        if (lower.Contains("转转")) return "转转笔记本";
        if (lower.Contains("hx370") || lower.Contains("claw") || lower.Contains("g3e") || lower.Contains("掌机")) return "掌机芯片";
        var parent = Path.GetFileName(Path.GetDirectoryName(dir) ?? "");
        return string.IsNullOrEmpty(parent) ? "未分组" : parent;
    }
}
