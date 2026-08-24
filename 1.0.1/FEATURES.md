# Framespace — HyperFrames 工作台功能规划

静态设计稿产品名：**Framespace**（帧仓）。它不是又一个代码编辑器，也不是 HyperFrames Studio 的替代品。它是一层**项目管理壳**：把散落在磁盘各处的 HyperFrames 工程收成库，在选中的工程上做调整/修改入口，并一键用 Grok Build、Codex 等 agent 把终端工作目录切到该工程。

本规划对齐真实工程模型，而不是通用 IDE 草图。识别一个工程靠的是目录里的 `hyperframes.json`（再加上 `index.html` / `package.json`），意图读 `BRIEF.md`，预览走 `npx hyperframes preview`，门禁走 `lint` / `check`，抽帧走 `snapshot`，交付走 `render`，环境走 `doctor`，新建走 `init`。

---

## 1. 为什么要做

本机已经出现的实际摩擦（据此规划，而不是凭空列功能）：

- 工程散落：`C:\Users\M\claw8ex-g3e-spec-film`、`C:\Users\M\Videos\hx370-g3e-lineage`、`C:\Users\M\Documents\转转视觉优化\` 下一整族 changestyle / image-faithful 变体。没有统一库。
- 同一产品片有十几套视觉变体，要比对、要复用，却只能靠文件夹记忆。
- CLI 钉死在 `package.json` 的 `hyperframes@x.y.z`。有的停在 `0.7.68`，有的 `0.7.109`，有的 `0.8.3`。升级要按工程 bump，不能混成全局一键。
- 改片的真实动作是：在工程目录里开 Grok Build / Codex，让 agent 读 `BRIEF.md` 和 composition，再跑 `check` / `preview` / `render`。资源管理器里找不到「在此打开 grok」。
- `node_modules` 体积巨大；诊断（Node ≥ 22、FFmpeg、bundled Chrome）每次出问题都要重新想命令。

Framespace 的工作方式：**扫目录 → 选工程 → 看状态 → 发出正确的 CLI / agent 命令**。设计稿阶段只展示/复制命令，不真正拉起进程。

---

## 2. 工程身份（库里每一张卡片从哪来）

扫描根目录，命中同时满足：

| 文件 | 用途 |
| --- | --- |
| `hyperframes.json` | 工程标记。读 `authoringSkill`、`paths.assets`、registry |
| `package.json` | 读钉死的 CLI 版本（`npx --yes hyperframes@<pin>`） |
| `index.html` | 主 composition；`data-composition-id` / `data-duration` / `data-width` / `data-height` |
| `BRIEF.md` | 工作流、flow、画幅、时长、口播、意图一句话 |
| `meta.json` | id / createdAt |
| `index.motion.json` | 运动断言，给 `check` 用 |
| `STORYBOARD.md` / `SCRIPT.md` / `frame.md` | 规划与设计规格（有则展示） |
| `snapshots/` | 联系表、抽帧、finding 裁切 → 库封面 |
| `renders/` 或输出 mp4 | 已交付产物 |

忽略 `node_modules/`。一个父目录下多个 `hyperframes.json` 记成**系列**（例如转转笔记本 8 台变体）。

卡片上至少要能扫到：名称、路径、工作流、时长、画幅、CLI pin、相对 latest 是否落后、最近 `check` 结论、封面帧、标签/系列。

---

## 3. 功能地图

### 3.1 项目库 — 管理各种 HyperFrames 项目

这是主界面，也是本工具存在的理由。

- **扫描根**：用户指定若干根路径（本机默认：`C:\Users\M`、`C:\Users\M\Videos`、`C:\Users\M\Documents\转转视觉优化`）。递归查找 `hyperframes.json`，可手动刷新。
- **编目**：网格 / 列表切换。图标大小可调（小 / 中 / 大 / 特大）。
- **封面**：扫描后自动把时间轴等距切成 **9 帧（含第一帧和最后一帧）**。设置里可选封面为单图（中间帧）、四宫格（首 / ⅓ / ⅔ / 尾）或九宫格。CLI 对应 `npx hyperframes snapshot --frames 9`，不难。
- **悬停大图**：鼠标停在卡片上弹出大图 + 9 帧胶片条。离开后 **1 秒** 才关；指针进预览窗则保持。右下角可拖动改大小。
- **定时扫描**：关闭 / 30 秒 / 1 分钟 / 5 分钟 / 15 分钟。扫完可自动抽 9 帧。
- **检索**：名称、路径、BRIEF 一句话、工作流、pin、标签。空格分词，全部命中才保留。
- **过滤**：工作流（`general-video` / `motion-graphics` / `product-launch-video` / …）、状态（草稿 / 有 finding / 可预览 / 已渲染 / pin 落后）、系列（掌机芯片、转转笔记本、字体实验）。
- **收藏 / 归档 / 在资源管理器中显示**。
- **自定义项目**：左侧分组由用户建，不是自动系列。可点 + 新建；在「全部」里把工程拖进某个自定义项目（可属于多组）。封面仍是 4 宫格马赛克。
- **文件夹视图**：可切到有工程的文件夹树。点文件夹会摊平列出其下所有 HyperFrames 工程。名称旁 pin 可把该文件夹钉在左侧当快捷入口；钉住后可改别名，并用该目录下工程封面拼 4 宫格预览。
- **导入**：把已有文件夹登记进库（不移动文件）。
- **克隆为变体**：复制工程目录结构，改 `meta.json` id，用于「同一数据、另一套视觉」。
- **磁盘卫生**：标出异常大的 `node_modules`，提供「清理依赖（展示命令）」入口。

不在这一层做时间轴剪辑。库只负责找到工程、看健康度、打开下一步。

### 3.2 调整修改 — 选中工程的工作台

点进一张卡片进入工作台。这里是「对着这个工程做事」，不是通用文件树。

分区：

1. **概览**：BRIEF 意图、画幅、时长、口播、目的地、CLI pin vs latest、上次 check。
2. **动作条**（每项生成真实 CLI，设计稿只展示/复制）：
   - Studio 预览 → `npx hyperframes preview <dir>`
   - 轻量播放 → `npx hyperframes play <dir>`
   - 静态检查 → `npx hyperframes lint <dir>`
   - 门禁 check → `npx hyperframes check <dir>`（可附加 `--snapshots`）
   - 抽帧 → `npx hyperframes snapshot <dir>`
   - 渲染草稿 / 成片 → `npx hyperframes render <dir> --quality draft|high`
   - 升级探针 → `npx hyperframes@latest upgrade --project <dir> --check`
3. **时间轴只读**：从 `data-start` / `data-duration` / `data-track-index` 列 clip，点选后提示「用 agent 改这段」而不是内置运动编辑器。
4. **快照墙**：`snapshots/` 联系表与 finding 裁切，便于对照 check 结果。
5. **文件**：`index.html`、`compositions/`、`BRIEF.md`、`frame.md`、`assets/`。双击 = 用默认程序打开；「在此修改」= 打开 agent。
6. **变量 / 批量**：若 composition 声明了 `data-composition-variables`，展示 schema，并给出 `render --batch rows.json` 命令模板。

明确不做：像素级 motion 编辑、替代 Studio timeline。改画面的正路是 **Studio 预览** 或 **在工程里开 agent**。

### 3.3 在项目中打开 Grok Build / Codex

这是用户点名的能力，必须是一等公民，不能藏在「用终端打开」里。

对选中工程 `path`：

| Agent | 设计稿生成的命令 |
| --- | --- |
| Grok Build | `grok --cwd "<path>"` |
| Codex | `codex --cd "<path>"` |
| Cursor | `cursor "<path>"` |
| Claude Code | `wt -d "<path>" claude` |
| VS Code | `code "<path>"` |

行为（产品，不只是设计稿）：

- 工作目录 **必须是该 HyperFrames 工程根**（有 `hyperframes.json` 的那一层），而不是仓库上一级或 `compositions/`。
- Windows 下优先用 Windows Terminal：`wt -d "<path>" grok`，保证新会话 cwd 正确。
- 可选「顺手带一句」：打开后自动贴上任务模板，例如「先读 BRIEF.md 和 index.html，跑 `npx hyperframes check`，再改第 3 段高亮」。
- 设计稿：弹出确认层，展示将要执行的命令，复制到剪贴板，toast 说明「设计稿不真正拉起进程」。

后续可接 Grok headless：`grok --cwd "<path>" -p "修复 check 里的 contrast 错误"`，仍然不在设计稿里执行。

### 3.4 进程 / 残留

右侧和标题栏常驻一块 **HyperFrames 占用**：CPU / 内存 / 显卡百分比，旁边是 **一键清理**（杀残留 preview/Chrome）和 **暂停渲染**（ffmpeg / headless Chrome）。详情仍可进进程页。

HyperFrames 的 `preview` / `render` 会留下 node、bundled Chrome、FFmpeg。工作台单独一页列出：

- 活着的任务（正在 encode 的 ffmpeg / headless Chrome）
- 残留（昨天开的 Studio 还占着 3002）
- 单条 `taskkill /PID … /F`
- 一键清理所有 `orphan`

设计稿只生成命令并从列表里拿掉该行，不真的杀进程。

### 3.5 小功能（全部对齐 HyperFrames CLI）

至少覆盖这些，工作台上以命令面板呈现：

| 小功能 | 命令 | 作用 |
| --- | --- | --- |
| 新建工程 | `npx hyperframes init <name> --non-interactive --example blank` | 空白 / 模板脚手架 |
| 从 URL 抓站 | `npx hyperframes capture <url>` | 产品片入口 |
| Studio 预览 | `preview` | 时间线编辑与审片 |
| 静态 lint | `lint` | 写 HTML 时的快反馈 |
| 门禁 check | `check` | lint + runtime + layout + motion + contrast |
| 抽帧 | `snapshot` | 封面、对比、finding 裁切 |
| 等距 9 帧 | `snapshot --frames 9` | 含首尾；比写死 1,3,5,7,9 秒更稳（8s 片和 80s 片都能铺满） |
| 渲染 | `render --quality draft\|high` | 迭代稿 / 成片 |
| 环境诊断 | `npx hyperframes doctor --json` | Node / FFmpeg / Chrome / 内存 |
| 确保 Chrome | `npx hyperframes browser ensure` | 渲染用的钉死浏览器 |
| 列出 compositions | `compositions --json` | 主片 + 子合成 |
| 升级探针 | `upgrade --project . --check` | pin 是否落后 |
| 目录块 | `catalog --query "…"` / `add <name>` | 先搜可安装的运动，再手写 |

另外几个库级小工具（展示命令或状态，不执行）：

- pin 落后总览（哪些工程还钉在旧 CLI）
- 并排 compare：`npx hyperframes compare <a> <b> --at <sec>`
- 任务队列 UI（草稿渲染 / 成片 / 批量），设计稿用静态队列

### 3.6 Skills

环境诊断上面单独一页。管理已安装 skill（删除、备注、1–5 分、更新），以及热门 skill：检查 = 读取你指定的 GitHub `catalog.json`（raw.githubusercontent.com），下载 = `git clone` 到 `~/.agents/skills/`。HyperFrames 包走 `npx hyperframes skills update <name>`。

### 3.7 环境诊断（全局）

独立页，对应 `doctor`：Node ≥ 22、CLI latest、FFmpeg/FFprobe、bundled Chrome、磁盘、Docker（仅 docker 渲染需要）。按工程列出 pin 漂移。

### 3.8 设置

扫描根、默认 agent（Grok Build / Codex）、终端（Windows Terminal / PowerShell）、忽略规则、主题。设计稿给面板，不写真实配置文件。

---

## 4. 界面结构（设计稿实现）

桌面软件壳，不是官网落地页。

```
标题栏（窗口控件 · 标志 · 全局搜索 · 扫描）
左图标轨：项目库 · 调整修改 · 任务 · 诊断 · 规划 · 设置
左栏：过滤 / 文件树
主画布：库网格 或 工程工作台
右栏：BRIEF 摘要 · agent 启动 · 最近命令
状态栏：工程数 · CLI · 选中路径
```

交互（无后端，纯静态）：

1. 搜索/过滤立刻收窄卡片。
2. 点卡片 → 切到该工程的调整修改工作台。
3. 「打开 Grok Build / Codex」→ 用同一套命令构造器生成 `grok --cwd <path>` / `codex --cd <path>`，弹层确认。
4. 预览 / lint / check / snapshot / render / doctor / init 按钮写入命令面板，不执行。

---

## 5. 以后再做（明确非目标）

- 真的 spawn grok / codex / `npx hyperframes …`
- 监听文件系统、Electron/Tauri 安装包
- 改用户现有 HyperFrames 工程里的文件
- 云渲染 / Lambda / Cloud Run / 登录
- 在管理器里当运动编辑器改 `index.html`

第一版产品（设计稿之后）建议顺序：扫盘编目 → 打开 agent → 包装 preview/check/render 为任务 → pin 升级探针。

---

## 6. 和本设计稿的对应

| 规划 | 设计稿 |
| --- | --- |
| 项目库 | `index.html` 视图 `library`，数据 `CATALOG` |
| 调整修改 | 视图 `project` |
| Grok Build / Codex | `buildAgentCommand()` + 确认层 |
| CLI 小功能 | `buildCliCommand()` + 命令面板 |
| 本文件 | 应用内「功能规划」页同样可读 |
