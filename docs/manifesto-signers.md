# 宣言构建与名册

宣言的正文、三个语言版本的誓词、版本和审核后名册均来自 [creative-freedom-manifesto](https://github.com/Amiyadesi/creative-freedom-manifesto)。在该仓库的[贡献指南](https://github.com/Amiyadesi/creative-freedom-manifesto/blob/main/CONTRIBUTING.md)查看如何审核署名、撤下署名或修订正文。

主站通过 `node scripts/build-manifesto.mjs` 生成三个静态页面、`public/manifesto/signers.json` 和网站 sitemap。默认读同级仓库；可用 `MANIFESTO_DIR` 明确指定 checkout。修改普通站点的 sitemap 入口时编辑 `scripts/sitemap-base.xml`；宣言条目由构建生成。不要提交生成文件。

生产 Actions 拉取宣言仓库的 main。每 6 小时检查生产宣言版本，发现新提交时自动部署；也可在主站 Actions 手动触发。仅使用公开 checkout 和既有 Cloudflare 部署配置，无需新增跨库 Secret。`/deployment.json` 的 `manifestoSha` 记录生产源版本。

昵称只在浏览器生成副本，不写入本地存储、不发请求。公开名册构建时验证，直接渲染为静态文本和 GitHub 资料链接；Issue 文本永不进入构建。
