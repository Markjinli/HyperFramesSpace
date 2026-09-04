# HyperFramesSpace

Windows 上的 HyperFrames 工程工作台。把本机工程收成库，点进去就能预览、抽帧、出片，并在正确目录里用 Grok Build / ChatGPT / Claude Code / Cursor 调整。

当前版本是 **3.0.0**：原生 WPF 宿主 + SQLite 索引 + NTFS USN 扫描。界面仍是原来的工作台外观。

## 它做什么

- 按 `hyperframes.json` 收本机工程；启动先读本地索引，扫描可增量
- 项目库用封面、时长、画幅、CLI pin、BRIEF 编目
- 选中工程后轻量预览（按视频比例缩放）
- 一键在工程目录里用 Grok Build、ChatGPT、Codex CLI、Claude Code、Claude、Cursor 调整
- 直接跑 HyperFrames 的 preview / lint / check / snapshot / render

## 运行

需要 [.NET 8 桌面运行时](https://dotnet.microsoft.com/download/dotnet/8.0) 和 Windows 10/11。

```bat
git clone https://github.com/Markjinli/HyperFramesSpace.git
cd HyperFramesSpace
dotnet test
dotnet run --project src\HyperFramesSpace.App
```

发布：

```bat
dotnet publish src\HyperFramesSpace.App -c Release -r win-x64 --self-contained false
```

数据在 `%LOCALAPPDATA%\HyperFramesSpace\catalog.sqlite`。

NTFS USN 全盘索引可能需要一次管理员权限；没有权限时会扫用户目录兜底。

## 目录

```
src/HyperFramesSpace.Core   索引、USN、预览服务、agent
src/HyperFramesSpace.App    WPF 窗口（WebView2 承载界面）
ui/                         工作台 HTML / CSS / JS
vendor/                     HyperFrames 播放器
tests/                      单元测试
```

## 开源

本项目免费开源，欢迎使用、提 issue 和 PR。
