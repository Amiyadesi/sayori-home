# sayori.org home

静态主页。可直接部署到 Cloudflare Pages。

推荐 Pages 设置：

- Build command: 空
- Build output directory: `sayori-home/public`
- Custom domain: `sayori.org`

当前入口文件在 `public/`：

- `index.html` — 根路径，按 `navigator.language` 重定向到 `/zh/` 或 `/en/`
- `zh/index.html` — 中文版页面
- `en/index.html` — 英文版页面
- `styles.notebook.css` — 共享样式
- `script.notebook.js` — 共享脚本（按路径加载对应语言数据）
- `assets/data/home-zh.json` / `assets/data/home-en.json` — 表层纸面配置
- `assets/data/lines-zh.json` / `assets/data/lines-en.json` — 底层终端配置
- `assets/svg/` — 原创手绘 SVG 角色和 cameo 插画

## Obsidian 内容源

主站内容由公开的 [sayori-articles](https://github.com/Amiyadesi/sayori-articles)
仓库中的 `home/` 管理：

- `surface.zh.json` / `surface.en.json`：标题、入口、关于我、小服务、音乐按钮、贴纸短句。
- `truth.zh.json` / `truth.en.json`：终端命令、隐藏彩蛋、角色 `.chr` 对话、终端标题和提示。

同步命令：

```powershell
git clone https://github.com/Amiyadesi/sayori-articles.git content
$env:CONTENT_DIR = './content'
node .\scripts\sync-home-content.mjs
```

没有设置 `CONTENT_DIR` 时，脚本仍兼容旧的 `../articles` 本地目录。JSON 写错时脚本会直接退出，避免部署半坏页面。

版权说明：

- 不再托管任何 DDLC 官方素材（立绘、CG、官方 OST 文件）。
- 角色立绘为原创笔记本风简笔画 SVG。
- 背景音乐通过 YouTube nocookie / 网易云 outchain iframe 嵌入；曲目 ID 在 `articles/home/surface.*.json` 里配置。
- 过渡音效改为 Web Audio API 程序化生成（白噪声+正弦扫频），不依赖任何外部音频文件。

入口规划：

- `https://sayori.org`：主页导航
