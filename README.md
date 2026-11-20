# Amiya 的书桌

[**sayori.org**](https://sayori.org/) 是 Amiya 的个人网站。从一页手记出发，可以找到独立游戏、文章和在做的小东西。

- [关于 Amiya](https://sayori.org/about/) · [社交与作品](https://sayori.org/social/) · [公共服务](https://sayori.org/services/)
- [创作自由宣言](https://sayori.org/manifesto/) · [繁體中文](https://sayori.org/zh-hant/manifesto/) · [English](https://sayori.org/en/manifesto/)
- [Project 34：她的空间](https://sayori.org/?paper=0617) · [博客](https://blog.sayori.org/)

网站用静态 HTML、CSS 和浏览器 JavaScript 构建，部署于 Cloudflare Pages。Project 34 只在进入时加载 Three.js。

## 本地运行

将 [sayori-articles](https://github.com/Amiyadesi/sayori-articles) 和 [creative-freedom-manifesto](https://github.com/Amiyadesi/creative-freedom-manifesto) 克隆到与本仓库同级的目录。使用 Node.js 22 或更新版本：

```sh
npm ci
node scripts/sync-home-content.mjs
node scripts/build-manifesto.mjs
npx wrangler pages dev public
```

也可用静态服务器浏览 `public/`（不运行 Pages Functions）。`npm test` 运行站点测试；跨站 Project 34 检查可使用相邻的 `sayori-blog` 仓库或指定 `P34_BLOG_PUBLIC`。

## 贡献与许可

欢迎反馈站点问题。主站文案维护于 [sayori-articles 的 home/](https://github.com/Amiyadesi/sayori-articles/tree/main/home)；宣言修订、翻译和公开署名请去[宣言仓库](https://github.com/Amiyadesi/creative-freedom-manifesto)。

站点原创插画、标识、音乐和其他素材保留各自权利。第三方素材遵循随附许可；宣言正文及译文采用 [CC BY 4.0](https://github.com/Amiyadesi/creative-freedom-manifesto/blob/main/LICENSE.md)。

- [宣言构建与名册](docs/manifesto-signers.md)
- [Project 34 开发说明](docs/project-34.md)
