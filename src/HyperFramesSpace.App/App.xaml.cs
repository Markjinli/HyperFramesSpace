using System.Windows;
using HyperFramesSpace.Core;

namespace HyperFramesSpace.App;

public partial class App : System.Windows.Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        NativeApp.SetAppId();
        base.OnStartup(e);
    }
}
