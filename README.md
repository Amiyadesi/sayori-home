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


## Project 34：她的空间 (`/?paper=0617`)

异常主页就是她的独立站，不是原站叠加主题。蓝色空间、折射光带与原生大字交流；点击光点时，真实导航和文字会重新摆位。普通入口仍使用原站。

- 首页、作品、实验室、旧稿与留言通过 `room` 查询参数切换，支持深链接、刷新和历史前后退；她的博客只保留一个跨站入口。
- 作品页展示一个明确标记的交互试作。实验室的四个光点支持拖动、触屏和方向键；Shift 加大步长。
- 「留住这个形状」仅在当前浏览器保存最近八条光线。旧稿可以逐条比较，不伪造作品发布历史。
- 「聊两句」中可以请她送回原站，恢复原始 DOM 和已有交互。留言后端未接入，输入不会发送。声音由访客主动开启。

共享实现为 `p34-space.js/css`、`p34-light.js`、`p34-space-content.js`；现有 `p34-motion.js` 提供文字与布局动效，原有世界 Cookie 契约保留。无弹球、后期剧情或正式人物定稿。

```powershell
python -m http.server 8980 --bind 127.0.0.1 --directory public
node scripts/sync-p34-space.mjs # 同步到相邻 sayori-blog/public
node --test scripts/p34-space.test.mjs scripts/p34-living.test.mjs scripts/p34-dialogue.test.mjs scripts/p34-story.test.mjs scripts/paper-trace.test.mjs
```

字体为 Noto Serif SC 的局部字集，许可在 `public/assets/p34/OFL.txt`。光带、折射与粒子由 Canvas 绘制；静态场景缓存，闲置时停帧，支持 reduced-motion。没有把参考图做成整页截图。
