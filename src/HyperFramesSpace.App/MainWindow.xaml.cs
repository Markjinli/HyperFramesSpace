using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Interop;
using HyperFramesSpace.Core;
using Microsoft.Web.WebView2.Core;

namespace HyperFramesSpace.App;

public partial class MainWindow : Window
{
    UiHost? _host;

    public MainWindow()
    {
        InitializeComponent();
    }

    async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            Topmost = true;
            var root = FindRoot();
            var ui = Path.Combine(root, "ui");
            var vendor = Path.Combine(root, "vendor");
            if (!Directory.Exists(ui))
                ui = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "ui"));
            if (!Directory.Exists(vendor))
                vendor = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "vendor"));

            _host = new UiHost(ui, vendor);
            var url = _host.Start();

            HostBridge.WindowAction = HandleWindow;
            HostBridge.PickFolder = () => Dispatcher.Invoke(() =>
            {
                using var dlg = new System.Windows.Forms.FolderBrowserDialog { Description = "选择扫描根目录" };
                return dlg.ShowDialog() == System.Windows.Forms.DialogResult.OK ? dlg.SelectedPath : null;
            });

            await Web.EnsureCoreWebView2Async();
            Web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            Web.CoreWebView2.Settings.IsStatusBarEnabled = false;
            Web.CoreWebView2.WebMessageReceived += OnWebMessage;
            Web.Source = new Uri(url);
            Topmost = false;
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show(ex.ToString(), "HyperFramesSpace 启动失败");
        }
    }

    void OnWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            var json = JsonDocument.Parse(e.TryGetWebMessageAsString());
            var type = json.RootElement.TryGetProperty("type", out var t) ? t.GetString() : "";
            var action = json.RootElement.TryGetProperty("action", out var a) ? a.GetString() : "";
            if (type == "window" || type == "drag") HandleWindow(action ?? type);
        }
        catch { }
    }

    void HandleWindow(string? action)
    {
        Dispatcher.Invoke(() =>
        {
            switch (action)
            {
                case "min":
                    WindowState = WindowState.Minimized;
                    break;
                case "max":
                    WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
                    break;
                case "close":
                    Close();
                    break;
                case "drag":
                    try { DragMove(); } catch { }
                    break;
            }
        });
    }

    static string FindRoot()
    {
        var dir = AppContext.BaseDirectory;
        for (var i = 0; i < 8; i++)
        {
            if (File.Exists(Path.Combine(dir, "ui", "index.html"))) return dir;
            var parent = Directory.GetParent(dir);
            if (parent == null) break;
            dir = parent.FullName;
        }
        return AppContext.BaseDirectory;
    }

    protected override void OnClosed(EventArgs e)
    {
        _host?.Dispose();
        base.OnClosed(e);
    }
}
