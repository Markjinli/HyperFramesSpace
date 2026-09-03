namespace HyperFramesSpace.Core;

public sealed class IndexService
{
    readonly CatalogDb _db;

    public IndexService(CatalogDb db) => _db = db;

    public IndexResult Refresh(IProgress<IndexProgress>? progress = null, CancellationToken ct = default)
    {
        progress?.Report(new IndexProgress { Phase = "locate", Engine = "usn", Percent = 5, Message = "NTFS USN" });
        var usn = UsnIndexer.Locate();
        IReadOnlyList<string> dirs = usn.Dirs;
        var engine = "usn";
        if (usn.NeedsElevation || dirs.Count == 0)
        {
            progress?.Report(new IndexProgress { Phase = "locate", Engine = "walk", Percent = 15, Message = "用户目录" });
            engine = usn.NeedsElevation ? "walk" : (dirs.Count == 0 ? "walk" : "usn");
            var roots = new[]
            {
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                Environment.GetFolderPath(Environment.SpecialFolder.MyVideos)
            };
            var walked = ProjectHydrator.WalkFallback(roots).ToList();
            if (walked.Count > dirs.Count) dirs = walked;
            if (usn.Dirs.Count > 0 && walked.Count > 0)
            {
                var set = new HashSet<string>(usn.Dirs, StringComparer.OrdinalIgnoreCase);
                foreach (var d in walked) set.Add(d);
                dirs = set.ToList();
                engine = "usn+walk";
            }
        }

        ct.ThrowIfCancellationRequested();
        progress?.Report(new IndexProgress { Phase = "hydrate", Engine = engine, Found = dirs.Count, Percent = 40, Message = $"{dirs.Count} 个工程" });

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
                    Engine = engine,
                    Found = dirs.Count,
                    Fresh = fresh,
                    Reused = reused,
                    Percent = 40 + (int)(50.0 * i / Math.Max(1, dirs.Count)),
                    Current = dir
                });
            }
        }

        _db.DeleteMissing(dirs);
        _db.SetMeta("lastEngine", engine);
        _db.SetMeta("lastScan", DateTime.UtcNow.ToString("o"));
        return new IndexResult
        {
            Ok = true,
            Engine = engine,
            NeedsElevation = usn.NeedsElevation,
            Total = _db.Count(),
            Fresh = fresh,
            Reused = reused,
            Error = usn.NeedsElevation ? "usn-needs-admin" : ""
        };
    }
}
