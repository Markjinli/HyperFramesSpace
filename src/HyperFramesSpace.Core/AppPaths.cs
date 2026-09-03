namespace HyperFramesSpace.Core;

public static class AppPaths
{
    public const string AppId = "local.hyperframesspace.app";
    public const string ProductName = "HyperFramesSpace";
    public const string Version = "3.0.0";

    public static string Root
    {
        get
        {
            var dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                ProductName);
            Directory.CreateDirectory(dir);
            return dir;
        }
    }

    public static string Database => Path.Combine(Root, "catalog.sqlite");
    public static string Settings => Path.Combine(Root, "settings.json");
}
