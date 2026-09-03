using System.Diagnostics;

namespace HyperFramesSpace.Core;

public static class AgentLauncher
{
    public static string Open(string agent, string projectDir)
    {
        if (string.IsNullOrWhiteSpace(projectDir) || !Directory.Exists(projectDir))
            throw new InvalidOperationException("先选一个存在的工程目录");
        var a = (agent ?? "").Trim().ToLowerInvariant().Replace(" ", "-");
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

        if (a is "cursor")
        {
            var exe = Path.Combine(home, "AppData", "Local", "Programs", "cursor", "Cursor.exe");
            if (!File.Exists(exe)) throw new InvalidOperationException("找不到 Cursor.exe");
            Process.Start(new ProcessStartInfo(exe, Quote(projectDir)) { UseShellExecute = true, WorkingDirectory = projectDir });
            return exe + " " + projectDir;
        }

        if (a is "grok" or "grok-build")
        {
            var exe = Path.Combine(home, ".grok", "bin", "grok.exe");
            if (!File.Exists(exe)) throw new InvalidOperationException("找不到 Grok Build");
            return StartConsole("Grok Build", projectDir, exe, "--cwd", Quote(projectDir), "--fullscreen");
        }

        if (a is "claude" or "claude-code")
        {
            var exe = Path.Combine(home, "AppData", "Local", "Microsoft", "WinGet", "Links", "claude.exe");
            if (!File.Exists(exe)) throw new InvalidOperationException("找不到 Claude Code");
            return StartConsole("Claude Code", projectDir, exe);
        }

        if (a is "codex" or "codex-cli")
        {
            var js = Path.Combine(home, "AppData", "Roaming", "npm", "node_modules", "@openai", "codex", "bin", "codex.js");
            var node = @"C:\Program Files\nodejs\node.exe";
            if (!File.Exists(js)) throw new InvalidOperationException("找不到 Codex CLI");
            return StartConsole("Codex CLI", projectDir, File.Exists(node) ? node : "node", Quote(js), "--cd", Quote(projectDir));
        }

        if (a is "chatgpt" or "chatgpt-app")
        {
            Process.Start(new ProcessStartInfo("codex:") { UseShellExecute = true });
            return "codex:";
        }

        throw new InvalidOperationException("未知 agent：" + agent);
    }

    public static string StartJob(string action, string projectDir, string pin)
    {
        var pinSpec = string.IsNullOrWhiteSpace(pin) || pin == "unpinned" ? "" : "@" + pin;
        var quoted = Quote(projectDir);
        var rest = action switch
        {
            "preview" => $"preview {quoted}",
            "lint" => $"lint {quoted}",
            "check" => $"check {quoted}",
            "snapshot" => $"snapshot {quoted} --frames 9",
            "render" => $"render {quoted} --quality high --output out.mp4",
            "render-draft" => $"render {quoted} --quality draft",
            _ => throw new InvalidOperationException("未知任务：" + action)
        };
        var cmd = $"npx --yes hyperframes{pinSpec} {rest}";
        StartConsole("HyperFrames " + action, projectDir, Environment.GetEnvironmentVariable("ComSpec") ?? "cmd.exe", "/k", cmd);
        return cmd;
    }

    static string StartConsole(string title, string cwd, string exe, params string[] args)
    {
        var parts = new List<string> { "start", Quote(title), "/D", Quote(cwd), Quote(exe) };
        parts.AddRange(args);
        var line = string.Join(" ", parts);
        Process.Start(new ProcessStartInfo(Environment.GetEnvironmentVariable("ComSpec") ?? "cmd.exe", "/c " + line)
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = cwd
        });
        return line;
    }

    static string Quote(string s) => "\"" + s.Replace("\"", "\"\"") + "\"";
}
