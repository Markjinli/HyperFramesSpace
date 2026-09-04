using HyperFramesSpace.Core;

namespace HyperFramesSpace.Tests;

public class CatalogTests
{
    [Fact]
    public void RoundTrip_ListRow_DoesNotNeedIndexHtml()
    {
        var dir = Path.Combine(Path.GetTempPath(), "hfs3-" + Guid.NewGuid().ToString("N"));
        var proj = Path.Combine(dir, "demo-film");
        Directory.CreateDirectory(proj);
        File.WriteAllText(Path.Combine(proj, "hyperframes.json"), """{"authoringSkill":"general-video"}""");
        File.WriteAllText(Path.Combine(proj, "package.json"), """{"name":"demo-film","scripts":{"preview":"npx hyperframes@0.8.3 preview"}}""");
        File.WriteAllText(Path.Combine(proj, "BRIEF.md"), """
            ---
            workflow: general-video
            length: 12s
            aspect: 1920x1080
            message: list row only
            ---
            body
            """);
        var row = ProjectHydrator.ReadListRow(proj);
        Assert.Equal("demo-film", row.Id);
        Assert.Equal(12, row.Duration);
        Assert.Contains("list row only", row.Brief);
        Assert.True(row.Mtime > 0);
        Directory.Delete(dir, true);
    }

    [Fact]
    public void Sqlite_QueryAndIncrementalMtime()
    {
        var file = Path.Combine(Path.GetTempPath(), "hfs3-" + Guid.NewGuid().ToString("N") + ".sqlite");
        using var db = new CatalogDb(file);
        var dir = Path.Combine(Path.GetTempPath(), "hfs3p-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "hyperframes.json"), "{}");
        File.WriteAllText(Path.Combine(dir, "BRIEF.md"), "---\nmessage: first\n---\n");
        var row = ProjectHydrator.ReadListRow(dir);
        db.Upsert(row);
        Assert.Equal(1, db.Count());
        Assert.Equal(row.Mtime, db.AllMtimes()[dir]);

        var index = new IndexService(db);
        // Walk fallback won't find this temp path unless we upsert again after change
        File.WriteAllText(Path.Combine(dir, "BRIEF.md"), "---\nmessage: second\n---\n");
        var again = ProjectHydrator.ReadListRow(dir);
        Assert.NotEqual(row.Mtime, again.Mtime);
        db.Upsert(again);
        var got = db.Query("second");
        Assert.Single(got);
        Directory.Delete(dir, true);
        try { File.Delete(file); } catch { }
    }

    [Fact]
    public void WalkFallback_FindsNestedMarker()
    {
        var root = Path.Combine(Path.GetTempPath(), "hfs3w-" + Guid.NewGuid().ToString("N"));
        var nested = Path.Combine(root, "outer", "project");
        Directory.CreateDirectory(nested);
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "hidden"));
        File.WriteAllText(Path.Combine(nested, "hyperframes.json"), "{}");
        File.WriteAllText(Path.Combine(root, "node_modules", "hidden", "hyperframes.json"), "{}");
        var found = ProjectHydrator.WalkFallback(new[] { root }).ToList();
        Assert.Contains(nested, found);
        Assert.DoesNotContain(found, p => p.Contains("node_modules", StringComparison.OrdinalIgnoreCase));
        Directory.Delete(root, true);
    }

    [Fact]
    public void SnapshotNine_MapsToSameCommandAsSnapshot()
    {
        var dir = @"C:\films\demo";
        var a = AgentLauncher.BuildJobCommand("snapshot", dir, "");
        var b = AgentLauncher.BuildJobCommand("snapshot-9", dir, "");
        Assert.Equal(a, b);
        Assert.Contains("--frames 9", a, StringComparison.Ordinal);
        Assert.Contains("snapshot", a, StringComparison.Ordinal);
    }

    [Fact]
    public void Open_UnknownAgent_Throws()
    {
        var dir = Path.Combine(Path.GetTempPath(), "hfs3a-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        try
        {
            var ex = Assert.Throws<InvalidOperationException>(() => AgentLauncher.Open("nope", dir));
            Assert.Contains("未知 agent", ex.Message);
        }
        finally
        {
            Directory.Delete(dir, true);
        }
    }

    [Fact]
    public void BuildJobCommand_UnknownAction_Throws()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => AgentLauncher.BuildJobCommand("nope", @"C:\films\demo", ""));
        Assert.Contains("未知任务", ex.Message);
    }

    [Fact]
    public void ScanRequest_EverythingCoercesToAuto()
    {
        Assert.Equal("auto", ScanRequest.NormalizeEngine("everything"));
        Assert.Equal("auto", ScanRequest.NormalizeEngine("nope"));
        Assert.Equal("usn", ScanRequest.NormalizeEngine("USN"));
        Assert.Equal("walk", ScanRequest.NormalizeEngine("walk"));
        Assert.Equal("auto", ScanRequest.NormalizeEngine(null));
        var req = ScanRequest.FromSettings(new AppSettings { ScanEngine = "everything", ScanScope = "roots" });
        Assert.Equal("auto", req.Engine);
        Assert.Equal("roots", req.Scope);
    }

    [Fact]
    public void FilterToRoots_KeepsOnlyPrefixedDirs()
    {
        var keep = Path.Combine(Path.GetTempPath(), "hfs3f-keep-" + Guid.NewGuid().ToString("N"));
        var drop = Path.Combine(Path.GetTempPath(), "hfs3f-drop-" + Guid.NewGuid().ToString("N"));
        var a = Path.Combine(keep, "proj");
        var b = Path.Combine(drop, "proj");
        var filtered = IndexService.FilterToRoots(new[] { a, b }, new[] { keep });
        Assert.Contains(a, filtered);
        Assert.DoesNotContain(b, filtered);
    }

    [Fact]
    public void Refresh_Walk_ScopeRoots_OnlyThoseTrees()
    {
        var file = Path.Combine(Path.GetTempPath(), "hfs3s-" + Guid.NewGuid().ToString("N") + ".sqlite");
        var keepRoot = Path.Combine(Path.GetTempPath(), "hfs3k-" + Guid.NewGuid().ToString("N"));
        var dropRoot = Path.Combine(Path.GetTempPath(), "hfs3d-" + Guid.NewGuid().ToString("N"));
        var keep = WriteProject(Path.Combine(keepRoot, "film"));
        WriteProject(Path.Combine(dropRoot, "other"));
        Directory.CreateDirectory(Path.Combine(keepRoot, "node_modules", "hidden"));
        File.WriteAllText(Path.Combine(keepRoot, "node_modules", "hidden", "hyperframes.json"), "{}");
        using var db = new CatalogDb(file);
        var index = new IndexService(db, (_, _) => new UsnLocateResult { Ok = true });
        var result = index.Refresh(new ScanRequest { Engine = "walk", Scope = "roots", Roots = new[] { keepRoot } });
        Assert.True(result.Ok);
        Assert.Equal("walk", result.Engine);
        var rows = db.Query();
        Assert.Contains(rows, r => PathsEqual(r.Path, keep));
        Assert.DoesNotContain(rows, r => r.Path.Contains("other", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(rows, r => r.Path.Contains("node_modules", StringComparison.OrdinalIgnoreCase));
        Directory.Delete(keepRoot, true);
        Directory.Delete(dropRoot, true);
        try { File.Delete(file); } catch { }
    }

    [Fact]
    public void Refresh_UsnResults_FilteredToRoots()
    {
        var file = Path.Combine(Path.GetTempPath(), "hfs3u-" + Guid.NewGuid().ToString("N") + ".sqlite");
        var keepRoot = Path.Combine(Path.GetTempPath(), "hfs3uk-" + Guid.NewGuid().ToString("N"));
        var dropRoot = Path.Combine(Path.GetTempPath(), "hfs3ud-" + Guid.NewGuid().ToString("N"));
        var keep = WriteProject(Path.Combine(keepRoot, "film"));
        var drop = WriteProject(Path.Combine(dropRoot, "other"));
        using var db = new CatalogDb(file);
        var index = new IndexService(db, (_, _) => new UsnLocateResult
        {
            Ok = true,
            Dirs = new[] { keep, drop }
        });
        var result = index.Refresh(new ScanRequest { Engine = "usn", Scope = "roots", Roots = new[] { keepRoot } });
        Assert.True(result.Ok);
        var rows = db.Query();
        Assert.Contains(rows, r => PathsEqual(r.Path, keep));
        Assert.DoesNotContain(rows, r => PathsEqual(r.Path, drop));
        Directory.Delete(keepRoot, true);
        Directory.Delete(dropRoot, true);
        try { File.Delete(file); } catch { }
    }

    [Fact]
    public void Refresh_EmptyRoots_DoesNotWipeCatalog()
    {
        var file = Path.Combine(Path.GetTempPath(), "hfs3e-" + Guid.NewGuid().ToString("N") + ".sqlite");
        var dir = Path.Combine(Path.GetTempPath(), "hfs3ep-" + Guid.NewGuid().ToString("N"));
        var proj = WriteProject(dir);
        using var db = new CatalogDb(file);
        db.Upsert(ProjectHydrator.ReadListRow(proj));
        Assert.Equal(1, db.Count());
        var index = new IndexService(db, (_, _) => new UsnLocateResult { Ok = true, Dirs = new[] { proj } });
        var result = index.Refresh(new ScanRequest { Engine = "walk", Scope = "roots", Roots = Array.Empty<string>() });
        Assert.True(result.Ok);
        Assert.Equal("empty-roots", result.Error);
        Assert.Equal(1, db.Count());
        Assert.NotNull(db.GetByPath(proj));
        Directory.Delete(dir, true);
        try { File.Delete(file); } catch { }
    }

    static string WriteProject(string dir)
    {
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "hyperframes.json"), "{}");
        File.WriteAllText(Path.Combine(dir, "BRIEF.md"), "---\nmessage: test\n---\n");
        return Path.GetFullPath(dir);
    }

    static bool PathsEqual(string a, string b)
        => string.Equals(Path.GetFullPath(a).TrimEnd('\\'), Path.GetFullPath(b).TrimEnd('\\'), StringComparison.OrdinalIgnoreCase);
}
