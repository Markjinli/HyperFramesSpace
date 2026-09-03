using System.Text.Json;

namespace HyperFramesSpace.Core;

public sealed class AppSettings
{
    public List<string> ScanRoots { get; set; } = new()
    {
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile)),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyVideos))
    };
    public string DefaultAgent { get; set; } = "grok";
    public string Terminal { get; set; } = "wt";
    public string CoverLayout { get; set; } = "9";
    public string CoverAtSec { get; set; } = "auto";
    public int HoverShowMs { get; set; } = 450;
    public int HoverHideMs { get; set; } = 1000;
    public string CardSize { get; set; } = "m";
    public int ScanIntervalSec { get; set; }
    public bool AutoScanOnLaunch { get; set; }
    public string ScanScope { get; set; } = "all-fixed";
    public string ScanEngine { get; set; } = "auto";
    public bool AutoSnapshot { get; set; }
    public string Locale { get; set; } = "zh";
    public string CatalogUrl { get; set; } = "";
    public List<object> CustomCollections { get; set; } = new();
    public List<object> PinnedFolders { get; set; } = new();
}

public static class SettingsStore
{
    static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public static AppSettings Load()
    {
        try
        {
            if (File.Exists(AppPaths.Settings))
                return JsonSerializer.Deserialize<AppSettings>(File.ReadAllText(AppPaths.Settings), JsonOpts) ?? new AppSettings();
        }
        catch { }
        return new AppSettings();
    }

    public static AppSettings Save(AppSettings settings)
    {
        Directory.CreateDirectory(AppPaths.Root);
        File.WriteAllText(AppPaths.Settings, JsonSerializer.Serialize(settings, JsonOpts));
        return settings;
    }

    public static AppSettings Merge(JsonElement patch)
    {
        var cur = Load();
        var merged = JsonSerializer.Deserialize<AppSettings>(
            JsonSerializer.Serialize(cur, JsonOpts), JsonOpts) ?? cur;
        foreach (var p in patch.EnumerateObject())
        {
            var name = char.ToUpperInvariant(p.Name[0]) + p.Name[1..];
            var prop = typeof(AppSettings).GetProperty(name);
            if (prop == null) continue;
            try
            {
                var val = JsonSerializer.Deserialize(p.Value.GetRawText(), prop.PropertyType, JsonOpts);
                prop.SetValue(merged, val);
            }
            catch { }
        }
        return Save(merged);
    }
}
