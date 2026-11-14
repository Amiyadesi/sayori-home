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

正式入口为 `https://sayori.org/?paper=0617`，正常主页也可点「翻看纸角」。普通页面不加载 Three.js；进入后才加载网页背面的回廊、书库与阁楼。

- WASD 移动，拖动画面环视，双击锁定鼠标，E 互动，Esc 暂停。暂停菜单可返回正常网页；触屏提供方向控制。
- 普通门洞在实际跨槛时切层。侧廊、窗室和夹层可自由探索；西侧巡行异物与东窗异物会对观察、靠近作出反应。
- 折页台的 2D 草图改变回廊桥面；书库通往 `blog.sayori.org` 的 3D 阅览室，在真实笔记内调草图，再返回书库投射。
- 对话是中央逐字出现、退场的立体字，没有蓝色蒙层、取景框或装饰光带。支持减少动态效果。
- 浏览器前后退、刷新和返回原网页可用。探索进度用 `.sayori.org` Cookie 在两站间传递；旧存档保留兼容。公开留言复用既有评论服务，只有主动提交才发送。

共享真源为 `public/p34-*`，3D 建筑在 `p34-world3d.js`，美术与居民在 `p34-building.js`、`p34-residents.js`，台词在 `p34-script.js`。少女身份与后续剧情未定。

```powershell
python -m http.server 8980 --bind 127.0.0.1 --directory public
node scripts/sync-p34-space.mjs # 同步到相邻 sayori-blog/public
npm test
```

生产发布沿用 `.github/workflows/deploy.yml`：以最新 `main` 构建，先发布 Blog 再发布 Home，保留内容同步、双站一致性测试与线上健康检查。`p34-preview.yml` 仍用于隔离试玩。两站 `/deployment.json` 记录实际版本；回滚使用 Cloudflare Pages 中上一份成功的生产部署，不使用预览部署替代生产包。

字体为 Noto Serif SC 的局部字集，许可在 `public/assets/p34/OFL.txt`。建筑与居民暂用程序材质和低模；未接在线 Gemini，移动真机和 Safari 性能仍待实测。
