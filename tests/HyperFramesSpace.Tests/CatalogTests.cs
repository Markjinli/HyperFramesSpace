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
}
