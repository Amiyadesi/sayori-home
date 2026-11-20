# 创作自由宣言 · 公开署名册维护

宣言页面：<https://sayori.org/manifesto/>

## 公开署名原则

- 任何人都可以在网页本地签署，无需账号、不会上传签名
- 申请加入**公开名册**需要主动通过 GitHub Issue 表单提交；GitHub Issue 内容本身公开
- 公示只展示经维护者审核的 `public/manifesto/signers.json` 中的记录，不从用户填写的 Issue 直接渲染内容
- 申请人提交一个公开昵称，名单可附 GitHub 用户名（提交 Issue 的账号），但不包含邮箱或其他个人资料
- 可以通过新的 Issue 请求撤下；维护者应及时从 JSON 删除记录
- `栖弦（Lyra）` 是共同起草的 AI 伙伴，明确标记身份，不计为真人社区成员

## 审核及发布

1. 检查 GitHub Issues 中 `[宣言署名]` 的新申请，确认昵称和同意公开的勾选状态
2. 检查昵称是否包含辱骂、冒充、联系方式、隐私信息或过长内容；有问题则拒绝并解释
3. 修改 `public/manifesto/signers.json`，在 `signers` 末尾添加：
   `{"name":"创作者昵称","github":"申请 Issue 的 GitHub 用户名","joined":"YYYY-MM-DD"}`
4. 保持严格 JSON、保持已有署名顺序、不得编造签名或导入未经同意的身份
5. 合并 / 推送后，静态页面从同源 `signers.json` 加载并显示最新署名
6. 在 Issue 中回复申请结果并关闭。撤名同样删除 JSON 并部署

此方案无需 GitHub API Token 或暴露访客隐私，后续也可以迁移到专门的 manifesto 仓库，使用构建期同步。
