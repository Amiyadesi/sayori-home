# sayori.org home

静态主页。可直接部署到 Cloudflare Pages。

推荐 Pages 设置：

- Build command: 空
- Build output directory: `sayori-home/public`
- Custom domain: `sayori.org`

当前入口文件在 `public/`：

- `index.html`、`en/index.html`、`zh-hant/index.html` — 简体中文、English、繁體中文的独立首页 URL
- `about/index.html`、`en/about/index.html`、`zh-hant/about/index.html` — 三语关于页
- `social/index.html`、`en/social/index.html`、`zh-hant/social/index.html` — 三语社交聚合页，由同步命令生成，勿直接改账号列表
- `services/index.html`、`en/services/index.html`、`zh-hant/services/index.html` — 三语公共服务页
- `zh/` 与 `zh/services/` — 旧链接的 noindex 兼容页；旧 `?lang=` 参数会迁移至对应语言 URL
- `i18n-bootstrap.js` / `i18n-router.js` — 语言检测、偏好保存与真实语言路径切换
- `about/about.css` / `about/about.js` — 关于页样式与数据渲染
- `services/services.css` — 公共服务页共享样式
- `services/services-i18n.js` — 公共服务页双语内容与渲染
- `styles.notebook.css` — 共享样式
- `script.notebook.js` — 共享脚本（按当前界面语言加载对应数据）
- `assets/data/home-zh.json`、`home-zh-hant.json`、`home-en.json` — 表层纸面配置
- `assets/data/about-zh.json`、`about-zh-hant.json`、`about-en.json` — 关于页信件配置
- `assets/data/lines-zh.json` / `assets/data/lines-en.json` — 底层终端配置
- `assets/svg/` — 原创手绘 SVG 角色和 cameo 插画

## Obsidian 内容源

主站内容由公开的 [sayori-articles](https://github.com/Amiyadesi/sayori-articles)
仓库中的 `home/` 管理：

- `surface.zh.json` / `surface.en.json`：标题、入口、公共服务快捷入口、音乐按钮、贴纸短句。03 号入口指向 `/about/`。
- `about.zh.json` / `about.en.json`：`/about/` 长期名片信的分节、落款、底部 FAQ 和联系方式。
- 社交页复用 `about.*.json` 的 `contact.links` 和 `contact.email`。添加账号只需修改此列表，`label` 为平台名，`href` 为 HTTPS 链接，可选 `handle` 展示用户名；简体源会自动转换为繁体。页面模板在 `scripts/social-page.html`，样式在 `public/social/social.css`。
- `truth.zh.json` / `truth.en.json`：终端命令、隐藏彩蛋、角色 `.chr` 对话、终端标题和提示。

同步命令：

```powershell
git clone https://github.com/Amiyadesi/sayori-articles.git content
$env:CONTENT_DIR = './content'
node .\scripts\sync-home-content.mjs
```

没有设置 `CONTENT_DIR` 时，脚本默认读取同级 `../sayori-articles` 本地仓库。JSON 写错时脚本会直接退出，避免部署半坏页面。`about.*.json` 存在时才同步关于页数据，缺失不会阻塞其余同步。

版权说明：

- 不再托管任何 DDLC 官方素材（立绘、CG、官方 OST 文件）。
- 角色立绘为原创笔记本风简笔画 SVG。
- 背景音乐通过 YouTube nocookie / 网易云 outchain iframe 嵌入；曲目 ID 在 `articles/home/surface.*.json` 里配置。
- 过渡音效改为 Web Audio API 程序化生成（白噪声+正弦扫频），不依赖任何外部音频文件。

入口规划：

- `https://sayori.org/`：简体中文主页
- `https://sayori.org/zh-hant/`：繁體中文主页
- `https://sayori.org/en/`：English homepage
- 对应语言的 `about/` 与 `services/` 路径分别展示关于页和公共服务说明
- 对应语言的 `social/` 路径汇总公开社交账号、作品和联系入口；首页第二个入口指向该页，Bilibili 终端命令仍指向真实 B站账号


## Luminous Atelier & Full-Page Breakout (`/?paper=0617`)

当 URL 带有 `?paper=0617`（如 `https://sayori.org/?paper=0617`、`/en/?paper=0617`、`/zh-hant/?paper=0617`）时，首页切换为冷白青调全屏活页画室与全页经典挡板打砖块。不带 `?paper=0617` 时正常首页完全不受影响。

- **游玩入口**：访问 `/?paper=0617`，点击画室中的 **「开始打弹球 / Play Breakout」** 按钮（或展开对话选择开局）。
- **操作方式（仅在进入游戏后显示）**：
  - 移动挡板：鼠标水平移动、触摸拖拽、或键盘 `A` / `D`、`ArrowLeft` / `ArrowRight`
  - 发球：鼠标点击页面或按 `Space`
  - 暂停 / 继续：按 `Esc` 或点击顶部 HUD 的 `Esc ⏸`
  - 重开 / 退出：在暂停面板点击 **「重新开始 / Restart」** 或 **「收起球板 · 浏览页面 / Put Paddle Away · Browse Page」**，完整恢复画室页面与全部目标元素的原始子节点
- **导航与返回**：
  - 顶部栏 **「← 返回原主页 / ← Normal Home」**（或对话选项中的折回原主页）恢复常驻笔记本主页
  - 下方次级抽屉 **「原站入口与工具 / Original Site & Tools」** 保留原始首页入口与工具节点
- **跨站状态契约**：
  - 共享 Cookie `p34_breakout_v1`：`v1.<runs>.<bestScore>.<maxCombo>.luminous`（仅在清场或球耗尽完赛时写入）
  - localStorage `p34_breakout_recent_v1`：独立记录最近游玩场次列表
  - 保留 `p34_world_v1`、`p34_story`、`p34_play_v1` 兼容导出
- **本地测试命令**：

```powershell
node --test scripts/p34-breakout.test.mjs
```
