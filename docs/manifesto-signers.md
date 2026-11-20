# 宣言名册：审核与发布

读者在宣言页填昵称，申请进入 Cloudflare D1 私有队列 `sayori-manifesto-signatures`。网站只展示 [宣言仓库的 signers.json](https://github.com/Amiyadesi/creative-freedom-manifesto/blob/main/signers.json) 中已审核的条目。「我宣誓」仍是私人副本，不会发出网络请求。

## 审核

在 Cloudflare 控制台打开 **Workers & Pages → D1 → sayori-manifesto-signatures → Console**，查看需要处理的申请：

```sql
SELECT id, nickname, received_at, approved_at, removal_requested_at
FROM signature_requests
WHERE approved_at IS NULL OR removal_requested_at IS NOT NULL
ORDER BY received_at, id;
```

- **新增**：检查昵称不冒充他人、不含隐私信息、不与现有署名混淆。先把下文的 `123` 改成审核行号，执行审核语句。只在它返回该行时，将昵称和实际加入日写入 `signers.json`；普通署名不写 `github` 或 `role`。如果 D1 已标记审核但 Git 提交失败，按原行号核对撤回状态后重试提交。
- **撤回**：有 `removal_requested_at` 的待审申请不加入名册；此前已核准的申请，从名册删掉对应昵称。线上更新后可删除已处理的 D1 行。旧 Git 历史仍可能保留公开过的昵称。
- **拒绝**：不改名册，删除未通过的行。定期清理超过 90 天的待审申请；保留已列名的私有行，以便读者凭码撤名。
- **上线**：更新名册的 `updated`，按加入时间排序并提交宣言仓库。主站定时检查，最长约 6 小时；要立即同步，手动运行主站的 **Verify and Deploy Sayori Home** 工作流。

```sql
UPDATE signature_requests SET approved_at = CURRENT_TIMESTAMP
WHERE id = 123 AND approved_at IS NULL AND removal_requested_at IS NULL
RETURNING id, nickname;
```

不要把排队信息、撤名码或其摘要写入名册。系统无法凭昵称核验真实身份，也不声称一人只签一次。

## 部署

生产绑定 `MANIFESTO_SIGNATURES` 指向独立 D1；运行时 Secret `MANIFESTO_RATE_SECRET` 在 Pages 的生产环境，不在 GitHub。只保留撤名码摘要；防刷每个连接来源每 10 分钟最多处理 8 次申请或撤名，短期计数键用带密钥的摘要，不写入原始 IP，过期计数在后续请求清理。预览不连生产待审队列。

修改数据库结构时，在部署前先运行：

```sh
npx wrangler@4.111.0 d1 migrations apply sayori-manifesto-signatures --env production --remote
```

正文、译文和名册由 `node scripts/build-manifesto.mjs` 从宣言仓库生成。用 `MANIFESTO_DIR` 指定本地内容；不要提交生成页面、名册 JSON 或 sitemap。生产构建的 `/deployment.json` 用 `manifestoSha` 记录内容版本。
