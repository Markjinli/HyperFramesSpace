namespace HyperFramesSpace.Core;

public class ProjectRow
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Path { get; set; } = "";
    public long Mtime { get; set; }
    public double Duration { get; set; }
    public string Aspect { get; set; } = "—";
    public string Workflow { get; set; } = "";
    public string Pin { get; set; } = "";
    public string Status { get; set; } = "ready";
    public string? Thumb { get; set; }
    public string Brief { get; set; } = "";
    public string Collection { get; set; } = "";
    public string Tags { get; set; } = "";
}

public sealed class ProjectDetail : ProjectRow
{
    public string[] Frames { get; set; } = Array.Empty<string>();
    public string? IndexHtml { get; set; }
}

public sealed class IndexProgress
{
    public string Phase { get; init; } = "";
    public string Engine { get; init; } = "";
    public int Found { get; init; }
    public int Fresh { get; init; }
    public int Reused { get; init; }
    public int Percent { get; init; }
    public string Current { get; init; } = "";
    public string Message { get; init; } = "";
}

public sealed class IndexResult
{
    public bool Ok { get; init; }
    public string Engine { get; init; } = "";
    public bool NeedsElevation { get; init; }
    public int Total { get; init; }
    public int Fresh { get; init; }
    public int Reused { get; init; }
    public string Error { get; init; } = "";
}
