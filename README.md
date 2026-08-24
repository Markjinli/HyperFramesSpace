# Framespace

用 HyperFrames 做 vibe coding 视频时，工程会很快散落在磁盘各处。变体一多，只能靠文件夹名字记；要改片还得自己 `cd` 进目录，再开 Grok / Codex / Claude，再跑 `preview` / `check` / `render`。Framespace 就是为这件事做的免费开源工作台：把本机 HyperFrames 工程收成库，点进去就能预览、抽帧、出片，并在正确的工程根打开 agent。

当前提供 **Windows** 桌面版。**Mac 版即将更新。**

## 下载使用

1. 打开 [Releases](https://github.com/Markjinli/framespace/releases/latest)
2. 下载 `Framespace-1.0.2.exe`
3. 双击打开，不用安装

这是绿色便携版，拷到别的文件夹也能用。

## 它做什么

- 扫描你指定的根目录，识别带 `hyperframes.json` 的工程
- 项目库用封面、时长、画幅、CLI pin、BRIEF 一句话编目
- 选中工程后轻量预览，可拖动进度条
- 一键在工程目录打开 Grok Build、ChatGPT 桌面、Codex CLI、Claude Code、Cursor
- 直接跑 HyperFrames 的 preview / lint / check / snapshot / render
- 看本机占用，清理残留的 preview / Chrome / FFmpeg

它不是 Studio 的替代品，也不做像素级运动编辑。改画面仍走 Studio 或在工程里开 agent。

## 开发

需要 Node.js 22+。

```bat
cd 1.0.2
npm install
npm start
```

打包 Windows exe：

```bat
cd 1.0.2
npm run dist
```

输出在 `1.0.2/dist/Framespace-1.0.2.exe`。给 tag `v1.0.x` 推上去后，GitHub Actions 也会自动打 exe 并挂到 Release。

## 开源

本项目免费开源，欢迎使用、提 issue 和 PR。

Mac 版做好后会发在本仓库。

## Contributors

- [ChatGPT](https://chatgpt.com)
