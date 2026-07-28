# sayori.org home

静态主页。可直接部署到 Cloudflare Pages。

推荐 Pages 设置：

- Build command: 空
- Build output directory: `sayori-home/public`
- Custom domain: `sayori.org`

当前入口文件在 `public/`：

- `index.html` — 唯一主页 URL；按浏览器语言或 `sayori:ui-language` 加载中英文内容
- `about/index.html` — 唯一「关于我」URL；长期名片信 + 底部 FAQ；使用同一语言偏好渲染中英文内容
- `services/index.html` — 唯一公共服务 URL；使用同一语言偏好渲染中英文内容
- `zh/` / `en/` — 旧链接的 noindex 重定向页，不再作为独立内容入口
- `i18n-router.js` — 语言检测、偏好保存和同 URL 切换
- `about/about.css` / `about/about.js` — 关于页样式与数据渲染
- `services/services.css` — 公共服务页共享样式
- `services/services-i18n.js` — 公共服务页双语内容与渲染
- `styles.notebook.css` — 共享样式
- `script.notebook.js` — 共享脚本（按当前界面语言加载对应数据）
- `assets/data/home-zh.json` / `assets/data/home-en.json` — 表层纸面配置
- `assets/data/about-zh.json` / `assets/data/about-en.json` — 关于页信件配置
- `assets/data/lines-zh.json` / `assets/data/lines-en.json` — 底层终端配置
- `assets/svg/` — 原创手绘 SVG 角色和 cameo 插画

## Obsidian 内容源

主站内容由公开的 [sayori-articles](https://github.com/Amiyadesi/sayori-articles)
仓库中的 `home/` 管理：

- `surface.zh.json` / `surface.en.json`：标题、入口、公共服务快捷入口、音乐按钮、贴纸短句。03 号入口指向 `/about/`。
- `about.zh.json` / `about.en.json`：`/about/` 长期名片信的分节、落款、底部 FAQ 和联系方式。
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

- `https://sayori.org`：主页导航
- `https://sayori.org/about/`：关于我（长期名片信）
- `https://sayori.org/services/`：公共服务说明
