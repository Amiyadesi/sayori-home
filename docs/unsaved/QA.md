# 首轮验收记录

日期：2026-10-23。候选：`feat/amiya-unsaved-arg`。这是作者试玩版，非已获发布许可的正式版。

## 已验证的实际行为

使用本地 Chrome/Playwright、两个独立 origin（4321 博客、4322 主页）完成：

- 从新局入口读三个介绍、推箱、放回边注、连接兴趣、删改 Jam 模块并试玩、交回证据，到三个后记。主线完成通过真实控件，没有注入完成标记。
- Jam 缺桥与缺结束条件实际阻止通关；第一关方向键与撤销有效；音乐支线静音也能完成，声音按钮能启用与关闭 AudioContext。
- 纪念与 JSON 下载、文件恢复、错误 JSON/携带码、同局旧令牌、另一局确认/取消、重新开始、刷新和前后退。
- 同局两个标签从过期快照写入不同记录后，合并结果持久化；关掉第二标签再刷新仍保留两条记录。
- 禁用 localStorage 的独立浏览器上下文显示警告，仍能跨域读完三个版本并继续。
- 新局直达结尾被挡住且能返回当前线索。
- 9 个区域在 390px、320px 下无横向溢出；实际检查桌面入口、旧作及手机结尾截图。减少动态偏好下同样可操作。
- 主线浏览器流程零 pageerror、零 HTTP 4xx/5xx、零外部运行请求。真实来源链接没有自动访问。

发现并修复：320px 棋盘最小宽度溢出、结尾浅底浅字按钮、多标签竞态只合并内存、同页 URL 片段导航未重新导入、边注回访未呈现已放回的内容。

## 工程检查

- home 原有测试及新测试：49/49 通过（先运行既有公开内容生成脚本）。
- ARG 核心测试：6/6，覆盖存档结构/版本/依赖/边界、合并、三棋盘、预算、后记、固定 origin。
- blog 定向回归：7/7，覆盖 ARG 入口整页导航、独立页面标记、日记三语言裁剪、service worker 排除及原有行为、语言 URL。
- blog `pnpm run check`：0 errors，2 个既有 hints。
- blog 最终三语言完整构建及 `verify-build-output` 已通过；产物与源码四个共享文件逐项相同，三个语言首页均保留整页入口，游戏排除搜索/缓存的标记仍存在。
- `node scripts/sync-unsaved.mjs --check` 确认两站四个共享文件内容一致。
- 博客游戏入口 HTML 与四个共享资源合计 69,374 字节（未压缩），无额外字体/图片/音频下载；没有以桌面本地速度冒充移动网络性能评分。
- `pnpm run type-check` 仍失败于既有 `src/scripts/twikoo-loader.ts:25` 对 `twikoo-runtime.js` 缺少声明（TS7016）。这两个文件未修改；没有把全仓 tsc 标为通过。CI 使用的 Astro check 已通过。

## 复现命令

home 根目录：

```sh
node scripts/sync-unsaved.mjs --check
node --test scripts/unsaved.test.mjs
node scripts/preview-unsaved.mjs
```

另一个终端，home 根目录，需要已安装 Playwright CLI 及 Chrome：

```sh
mkdir -p output/playwright
printf '{' > output/playwright/unsaved-bad.json
playwright-cli -s=amiya-unsaved open http://127.0.0.1:4321/unsaved/
playwright-cli -s=amiya-unsaved run-code --filename=scripts/unsaved.browser.js
```

PowerShell 可用 `New-Item -ItemType Directory -Force output/playwright` 和 `Set-Content output/playwright/unsaved-bad.json '{'` 代替前两条。测试会在独立浏览器上下文开始新局，不会清除试玩窗口的存档。失败后应阅读输出中的 `Error`，CLI 的进程返回码不总能反映页面断言失败。

`output/playwright/` 包含截图、下载的存档、纪念文本和本轮日志，仅本地保留，不提交运行产物。分享导出的存档也会分享当前局进度。

## 发布仍需的验收

- 作者审阅：新增第一人称对白是否愿意以自己的名义呈现；允许自行改写，不能把原文章推演成作者已经解决了人生问题。
- 陌生玩家：35–60 分钟只是设计目标，未有首次盲测时长，也未验收谜题的实际吸引力。目标仍为完整 30–90 分钟作品；若不足，继续内容迭代。
- 真实手机触摸、Safari/Firefox、屏幕阅读器未实测。已有语义按钮、焦点、键盘、声音替代及减少动态样式，不等于完成全部辅助技术认证。
- 未合并、未生产部署。真实域名缓存、已有 service worker 更新以及两个站点的发布先后必须在获准发布时验收。
- 本次完整游戏离线运行不是契约：代码与页面需联网加载；不新增 service worker，旧博客 worker 绕过 ARG 以免旧资源混版。需要长时间断网前应导出存档。
