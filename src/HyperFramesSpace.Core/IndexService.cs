namespace HyperFramesSpace.Core;

public sealed class ScanRequest
{
    public string Engine { get; init; } = "auto";
    public string Scope { get; init; } = "all-fixed";
    public IReadOnlyList<string> Roots { get; init; } = Array.Empty<string>();

    public static string NormalizeEngine(string? engine)
    {
        var e = (engine ?? "auto").Trim().ToLowerInvariant();
        return e is "usn" or "walk" ? e : "auto";
    }

    public static string NormalizeScope(string? scope)
        => (scope ?? "all-fixed").Trim().Equals("roots", StringComparison.OrdinalIgnoreCase) ? "roots" : "all-fixed";

    public static ScanRequest FromSettings(AppSettings settings)
    {
        settings ??= new AppSettings();
        return new ScanRequest
        {
            Engine = NormalizeEngine(settings.ScanEngine),
            Scope = NormalizeScope(settings.ScanScope),
            Roots = (settings.ScanRoots ?? new List<string>())
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .ToList()
        };
    }
}

public sealed class IndexService
{
    readonly CatalogDb _db;
    readonly Func<string, IReadOnlyList<string>?, UsnLocateResult> _locate;

    public IndexService(CatalogDb db, Func<string, IReadOnlyList<string>?, UsnLocateResult>? locate = null)
    {
        _db = db;
        _locate = locate ?? ((name, drives) => UsnIndexer.Locate(name, drives));
    }

    public IndexResult Refresh(IProgress<IndexProgress>? progress = null, CancellationToken ct = default)
        => Refresh(ScanRequest.FromSettings(SettingsStore.Load()), progress, ct);

    public IndexResult Refresh(ScanRequest request, IProgress<IndexProgress>? progress = null, CancellationToken ct = default)
    {
        request ??= new ScanRequest();
        var engine = ScanRequest.NormalizeEngine(request.Engine);
        var scope = ScanRequest.NormalizeScope(request.Scope);
        var roots = ExistingDirs(request.Roots);

        if (scope == "roots" && roots.Count == 0)
        {
            progress?.Report(new IndexProgress { Phase = "locate", Engine = engine, Percent = 100, Message = "empty-roots" });
            return new IndexResult
            {
                Ok = true,
                Engine = engine,
                Total = _db.Count(),
                Error = "empty-roots"
            };
        }

        var usn = new UsnLocateResult();
        IReadOnlyList<string> dirs;
        var usedEngine = engine;

        if (engine == "walk")
        {
            progress?.Report(new IndexProgress { Phase = "locate", Engine = "walk", Percent = 15, Message = "用户目录" });
            dirs = ProjectHydrator.WalkFallback(WalkRoots(scope, roots)).ToList();
            usedEngine = "walk";
        }
        else
        {
            var drives = scope == "roots" ? roots : null;
            progress?.Report(new IndexProgress { Phase = "locate", Engine = "usn", Percent = 5, Message = "NTFS USN" });
            usn = _locate("hyperframes.json", drives);
            dirs = usn.Dirs;
            usedEngine = "usn";
            if (scope == "roots")
                dirs = FilterToRoots(dirs, roots);

            var allowWalk = engine == "auto";
            if (allowWalk && (usn.NeedsElevation || dirs.Count == 0))
            {
                progress?.Report(new IndexProgress { Phase = "locate", Engine = "walk", Percent = 15, Message = "用户目录" });
                var walked = ProjectHydrator.WalkFallback(WalkRoots(scope, roots)).ToList();
                if (walked.Count > dirs.Count) dirs = walked;
                if (usn.Dirs.Count > 0 && walked.Count > 0)
                {
                    var set = new HashSet<string>(scope == "roots" ? dirs : usn.Dirs, StringComparer.OrdinalIgnoreCase);
                    foreach (var d in walked) set.Add(d);
                    dirs = set.ToList();
                    if (scope == "roots") dirs = FilterToRoots(dirs, roots);
                    usedEngine = "usn+walk";
                }
                else if (dirs.Count == 0)
                {
                    dirs = walked;
                    usedEngine = usn.NeedsElevation ? "walk" : (walked.Count > 0 ? "walk" : "usn");
                }
            }
        }

        ct.ThrowIfCancellationRequested();
        progress?.Report(new IndexProgress { Phase = "hydrate", Engine = usedEngine, Found = dirs.Count, Percent = 40, Message = $"{dirs.Count} 个工程" });

        var known = _db.AllMtimes();
        var reused = 0;
        var fresh = 0;
        var i = 0;
        foreach (var dir in dirs)
        {
            ct.ThrowIfCancellationRequested();
            i++;
            var mtime = ProjectHydrator.StatMtime(dir);
            if (known.TryGetValue(dir, out var prev) && prev == mtime)
            {
                reused++;
            }
            else
            {
                try
                {
                    _db.Upsert(ProjectHydrator.ReadListRow(dir));
                    fresh++;
                }
                catch
                {
                    // skip unreadable project
                }
            }
            if (i % 8 == 0)
            {
                progress?.Report(new IndexProgress
                {
                    Phase = "hydrate",
                    Engine = usedEngine,
                    Found = dirs.Count,
                    Fresh = fresh,
                    Reused = reused,
                    Percent = 40 + (int)(50.0 * i / Math.Max(1, dirs.Count)),
                    Current = dir
                });
            }
        }

        _db.DeleteMissing(dirs);
        _db.SetMeta("lastEngine", usedEngine);
        _db.SetMeta("lastScan", DateTime.UtcNow.ToString("o"));
        return new IndexResult
        {
            Ok = true,
            Engine = usedEngine,
            NeedsElevation = usn.NeedsElevation,
            Total = _db.Count(),
            Fresh = fresh,
            Reused = reused,
            Error = usn.NeedsElevation && engine != "walk" ? "usn-needs-admin" : ""
        };
    }

    public static List<string> FilterToRoots(IEnumerable<string> dirs, IReadOnlyList<string> roots)
    {
        var list = dirs?.ToList() ?? new List<string>();
        if (roots == null || roots.Count == 0) return list;
        var prefixes = new List<string>();
        foreach (var r in roots)
        {
            if (string.IsNullOrWhiteSpace(r)) continue;
            try { prefixes.Add(NormalizeDir(r)); }
            catch { }
        }
        if (prefixes.Count == 0) return list;

        var hits = new List<string>();
        foreach (var dir in list)
        {
            string full;
            try { full = NormalizeDir(dir); }
            catch { continue; }
            foreach (var p in prefixes)
            {
                if (full.Equals(p, StringComparison.OrdinalIgnoreCase) ||
                    full.StartsWith(p + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                {
                    hits.Add(dir);
                    break;
                }
            }
        }
        return hits;
    }

    static string NormalizeDir(string path)
        => Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

    static List<string> ExistingDirs(IReadOnlyList<string> roots)
    {
        var list = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in roots ?? Array.Empty<string>())
        {
            if (string.IsNullOrWhiteSpace(r)) continue;
            try
            {
                var full = Path.GetFullPath(r);
                if (!Directory.Exists(full)) continue;
                if (seen.Add(full)) list.Add(full);
            }
            catch { }
        }
        return list;
    }

    static IReadOnlyList<string> WalkRoots(string scope, IReadOnlyList<string> roots)
    {
        if (scope == "roots") return roots;
        if (roots.Count > 0) return roots;
        return DefaultWalkRoots();
    }

    static List<string> DefaultWalkRoots() => new()
    {
        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
        Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
        Environment.GetFolderPath(Environment.SpecialFolder.MyVideos)
    };
}
