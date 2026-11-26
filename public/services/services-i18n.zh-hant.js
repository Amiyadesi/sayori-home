(() => {
	"use strict";

	const CATALOG = {
		zh: {
			navLabel: "頁面導航",
			documentTitle: "軟件與服務 · Amiya的書桌",
			description: "獨立軟件開發者 Amiya_desi 開發和維護的 Web 軟件、Godot 遊戲、開源工具與公開服務。",
			siteName: "Amiya的書桌",
			nav: [
				["#service-status", "當前軟件"],
				["#planned-services", "計劃"],
				["#operating-boundaries", "邊界"],
			],
			hero: {
				eyebrow: "sayori.org / 軟件與服務",
				title: "Amiya_desi 的軟件與服務",
				lead: "獨立開發和維護 Web 軟件服務、開發者工具與 Godot 遊戲",
				note: "GeoScore 是當前主要 SaaS，現階段免費開放，沒有付費訂閱或站內結賬。其他軟件和遊戲按真實開發進度展示",
				legend: "服務狀態說明",
				statuses: [
					["public", "公開運行"],
					["source", "開源自部署"],
					["invite", "邀請制計劃"],
					["private", "私有基礎設施"],
				],
			},
			current: {
				title: "當前軟件與項目",
				intro: "可用軟件給出直接入口；適合自行部署的項目給出源碼；尚未發行的項目不會僞裝成已經銷售的產品",
				items: [
					{
						status: "public", statusLabel: "當前 SaaS", title: "GeoScore",
						description: "面向公開網頁的 SEO 與 GEO 事實審計，提供站點畫像、Evidence Map、優先修復項和 Markdown 報告",
						meta: ["當前免費", "無需註冊", "MIT 開源"],
						links: [["https://geo.sayori.org/", "打開服務"], ["https://github.com/Amiyadesi/geoscore", "查看源碼"]],
					},
					{
						status: "public", statusLabel: "公開軟件", title: "絡箋 Relakeep",
						description: "本地優先的個人數字資產與關係記憶軟件，把郵箱、賬號、電話卡、訂閱和付款卡關聯管理，支持加密備份與自建同步",
						meta: ["本地免費", "加密存儲", "支持自建"],
						links: [["https://atlas.sayori.org/", "打開官網"], ["https://github.com/Amiyadesi/amiya-atlas", "查看源碼"]],
					},
					{
						status: "public", statusLabel: "公開運行", title: "Amiya 的白板",
						description: "無需註冊的輕量瀏覽器白板，適合臨時畫圖、整理草圖和講清楚一個頁面結構",
						meta: ["無需賬號", "臨時草圖", "自行保存"],
						links: [["https://board.sayori.org/", "打開白板"]],
					},
					{
						status: "public", statusLabel: "公開運行", title: "資源導航",
						description: "按分類整理常用工具、資料、社區和開源站點，支持站內與外部搜索",
						meta: ["無需賬號", "分類索引", "持續整理"],
						links: [["https://nav.sayori.org/", "打開導航"]],
					},
					{
						status: "public", statusLabel: "公開運行", title: "GeoScore 公開審計 API",
						description: "爲公開域名提供事實審計、PageSpeed 證據、Evidence Map 與 FixPack 接口，使用 SSE 和 JSON 返回可複驗結果",
						meta: ["OpenAPI 3.1", "公網目標限定", "有限額度"],
						links: [["https://geo-api.sayori.org/openapi.json", "查看 OpenAPI"], ["https://geo.sayori.org/docs", "閱讀使用文檔"]],
					},
					{
						status: "public", statusLabel: "公開運行", title: "公開技術文章與 RSS",
						description: "記錄建站、自託管、Cloudflare、Godot、AI 輔助開發和項目復盤。文章可以網頁閱讀，也可以通過 RSS 訂閱",
						meta: ["無需賬號", "允許公開引用", "持續整理"],
						links: [["https://blog.sayori.org/", "進入博客"], ["https://blog.sayori.org/rss.xml", "訂閱 RSS"]],
					},
					{
						status: "source", statusLabel: "開源自部署", title: "Search Gateway",
						description: "統一多個搜索來源、保留證據快照，並提供兼容接口與 MCP 接入方式的開源項目",
						meta: ["Python", "Docker", "MIT 開源"],
						links: [["https://github.com/Amiyadesi/search-gateway", "源碼與自部署文檔"]],
					},
					{
						status: "public", statusLabel: "公開運行", title: "留言與問題反饋",
						description: "可以提交讀後感、服務問題和改進建議。涉及濫用、隱私或安全的問題也可以直接發郵件",
						meta: ["公開留言", "郵件聯繫", "人工處理"],
						links: [["https://blog.sayori.org/guestbook/", "打開留言板"], ["mailto:me@sayori.org", "發送郵件"]],
					},
				],
				sourceTitle: "公開 GeoScore API 與內部 Search Gateway 是兩套邊界",
				sourceBody: "GeoScore API 可以按公開文檔調用，並受線上限流和公網目標校驗約束。Search Gateway 實例只供站長自己的站點與維護任務使用，不開放共享 Token、匿名調用或公共額度",
			},
			plans: {
				title: "適合小範圍試驗的方向",
				intro: "這些不是已經承諾上線的產品，只是更值得佔用維護精力的低風險方向。先通過邀請和人工審覈驗證需求，再決定是否長期提供",
				items: [
					["invite", "邀請制計劃", "網站體檢互助", "爲個人博客、開源項目頁和小型社區主頁跑一次 GeoScore，再補充人工判斷和可複驗的修復順序"],
					["invite", "邀請制計劃", "靜態站上線協助", "幫助個人或開源項目整理倉庫、部署 Cloudflare Pages 或 GitHub Pages，並留下可自行維護的文檔"],
					["invite", "邀請制計劃", "搜索證據額度", "給開源文檔覈對或社區資料整理提供少量 Search Gateway 查詢額度，不開放匿名註冊和批量抓取"],
					["invite", "邀請制計劃", "RSS 通知中轉", "爲缺少訂閱能力的小站試驗 RSS 到郵件或 Webhook 的低頻通知，不處理營銷羣發"],
					["private", "私有基礎設施", "短期證據快照", "優先考慮把閒置對象存儲用於 GeoScore 的短期證據快照，而不是重新開放匿名文件上傳"],
					["private", "私有基礎設施", "加密備份", "把剩餘存儲用於站點配置、文章源和關鍵數據的加密備份，保留恢復演練記錄"],
				],
			},
			boundaries: {
				title: "使用邊界與停止規則",
				intro: "小型個人服務只有把邊界講清楚，纔不會因爲一時熱情變成長期失控的維護債",
				items: [
					"服務按盡力而爲原則維護，不承諾可用性、響應時間或永久保存",
					"公開服務優先不要求註冊，確需賬號或數據保存時會單獨說明",
					"遇到濫用、爬蟲壓力、額度耗盡或安全風險時可以限流、暫停或關閉",
					"不會把私有存儲、內部搜索實例或管理 Token 當成公共資源發佈",
					"不提供匿名文件託管、營銷羣發、緊急通信或高風險賬戶服務",
					"濫用、隱私與安全問題統一聯繫 me@sayori.org",
				],
				asideTitle: "爲什麼不繼續堆服務",
				asideBody: [
					"每多一個公開入口，都意味着域名、監控、依賴更新、垃圾內容處理和故障恢復",
					"因此優先保留能複用現有能力、沒有公開上傳面、可以限額並且容易下線的服務。暫停的實驗不會繼續出現在首頁和搜索入口裏",
				],
				links: [["https://status.sayori.org/", "查看運行狀態"], ["mailto:me@sayori.org", "聯繫維護者"]],
			},
			faq: {
				title: "常見問題",
				intro: "這個頁面描述當前軟件、業務方向和公開邊界，不是尚未發佈產品的購買承諾",
				items: [
					["Amiya_desi 開發什麼", "目前以 GeoScore 這類 Web 軟件服務爲主，也開發 Godot 遊戲、桌面與開發者工具和開源軟件"],
					["現在有付費方案嗎", "沒有。GeoScore 當前免費開放，網站沒有付費訂閱或結賬。未來上線收費方案或軟件銷售時，會先公開價格、交付、退款和取消規則"],
					["可以調用 GeoScore API 嗎", "可以。穩定公開接口寫在 OpenAPI 文檔中，運行限制以 API 的 /api/meta 響應爲準。它只審查公開 hostname，不是任意 URL 代理"],
					["可以申請 Search Gateway Token 嗎", "當前沒有公開申請入口。源碼可以自行部署，小範圍試驗額度採用人工邀請和明確限額"],
				],
			},
			footer: {
				text: "Amiya_desi · 獨立軟件開發者 · 最後更新 2026-08-16",
				links: [["/", "返回書桌"], ["https://blog.sayori.org/", "博客"], ["https://github.com/Amiyadesi", "GitHub"], ["mailto:me@sayori.org", "聯繫"]],
				label: "頁腳導航",
			},
		},
		en: {
			navLabel: "Page navigation",
			documentTitle: "Software & Services · Amiya's Desk",
			description: "Web software, Godot games, open-source tools, and public services developed and maintained by independent software developer Amiya_desi.",
			siteName: "Amiya's Desk",
			nav: [["#service-status", "Current software"], ["#planned-services", "Plans"], ["#operating-boundaries", "Boundaries"]],
			hero: {
				eyebrow: "sayori.org / software and services",
				title: "Software and services by Amiya_desi",
				lead: "Independently developed web software, developer tools, and Godot games",
				note: "GeoScore is the main SaaS project and is currently free, with no paid subscription or on-site checkout. Other software and games are shown at their actual development stage",
				legend: "Service status legend",
				statuses: [["public", "Public"], ["source", "Self-hostable"], ["invite", "Invitation plan"], ["private", "Private infrastructure"]],
			},
			current: {
				title: "Current software and projects",
				intro: "Available software gets a direct link; self-hostable projects get source links; unreleased projects are not presented as products already for sale",
				items: [
					{ status: "public", statusLabel: "Current SaaS", title: "GeoScore", description: "Evidence-first SEO and GEO audits for public pages, with a site profile, Evidence Map, prioritized fixes, and a Markdown report", meta: ["Currently free", "No registration", "MIT licensed"], links: [["https://geo.sayori.org/", "Open service"], ["https://github.com/Amiyadesi/geoscore", "View source"]] },
					{ status: "public", statusLabel: "Public software", title: "Relakeep", description: "Local-first encrypted memory for personal digital assets and their relationships across emails, accounts, SIMs, subscriptions, and payment cards", meta: ["Free local use", "Encrypted vault", "Self-hostable"], links: [["https://atlas.sayori.org/en", "Open website"], ["https://github.com/Amiyadesi/amiya-atlas", "View source"]] },
					{ status: "public", statusLabel: "Public", title: "Amiya Whiteboard", description: "A lightweight browser whiteboard for quick sketches, rough diagrams, and explaining a page structure", meta: ["No account", "Temporary sketches", "Save your work"], links: [["https://board.sayori.org/", "Open whiteboard"]] },
					{ status: "public", statusLabel: "Public", title: "Resource directory", description: "A categorized shelf of useful tools, references, communities, and open-source sites with local and external search", meta: ["No account", "Categorized index", "Ongoing archive"], links: [["https://nav.sayori.org/", "Open directory"]] },
					{ status: "public", statusLabel: "Public", title: "GeoScore Public Audit API", description: "Factual audits, PageSpeed evidence, Evidence Maps, and FixPacks for public domains, exposed as bounded SSE and JSON endpoints", meta: ["OpenAPI 3.1", "Public targets only", "Limited quota"], links: [["https://geo-api.sayori.org/openapi.json", "Open OpenAPI"], ["https://geo.sayori.org/docs", "Read the guides"]] },
					{ status: "public", statusLabel: "Public", title: "Public writing and RSS", description: "Notes on websites, self-hosting, Cloudflare, Godot, AI-assisted development, and project retrospectives, available on the web and by RSS", meta: ["No account", "Public citation allowed", "Ongoing archive"], links: [["https://blog.sayori.org/", "Open blog"], ["https://blog.sayori.org/rss.xml", "Subscribe by RSS"]] },
					{ status: "source", statusLabel: "Self-hostable", title: "Search Gateway", description: "An open-source project that unifies search sources, keeps evidence snapshots, and provides compatible APIs and an MCP integration", meta: ["Python", "Docker", "MIT licensed"], links: [["https://github.com/Amiyadesi/search-gateway", "Source and deployment guide"]] },
					{ status: "public", statusLabel: "Public", title: "Guestbook and issue reports", description: "Leave a reading response, report a service issue, or send privacy, abuse, and security concerns by email", meta: ["Public notes", "Email contact", "Manual response"], links: [["https://blog.sayori.org/guestbook/", "Open guestbook"], ["mailto:me@sayori.org", "Send email"]] },
				],
				sourceTitle: "The public GeoScore API and internal Search Gateway have separate boundaries",
				sourceBody: "GeoScore API follows the public specification, runtime limits, and public-target validation. Search Gateway remains reserved for the maintainer's sites and maintenance work, with no shared tokens, anonymous calls, or public quotas",
			},
			plans: {
				title: "Low-risk ideas worth testing",
				intro: "These are not promised products. They start with invitations and manual review so demand, abuse risk, and maintenance cost can be measured before any long-term commitment",
				items: [
					["invite", "Invitation plan", "Website audit exchange", "Run GeoScore for personal blogs, open-source project pages, and small communities, then add a short human review and a verifiable repair order"],
					["invite", "Invitation plan", "Static site launch help", "Help personal or open-source projects prepare a repository, deploy to Cloudflare Pages or GitHub Pages, and leave maintainable documentation"],
					["invite", "Invitation plan", "Search evidence quota", "Provide a small Search Gateway quota for open-source documentation checks or community research, without anonymous signup or bulk crawling"],
					["invite", "Invitation plan", "RSS notification relay", "Test low-frequency RSS-to-email or webhook notifications for small sites that lack subscription tooling, excluding marketing campaigns"],
					["private", "Private infrastructure", "Short-lived evidence snapshots", "Prefer using idle object storage for short-lived GeoScore evidence snapshots instead of reopening anonymous file uploads"],
					["private", "Private infrastructure", "Encrypted backups", "Use remaining storage for encrypted copies of site configuration, article sources, and critical data, with restore drills"],
				],
			},
			boundaries: {
				title: "Operating boundaries and stop rules",
				intro: "A small personal service stays sustainable only when its limits are visible before enthusiasm turns into permanent operational debt",
				items: [
					"Services are best-effort with no uptime, response-time, or permanent-retention guarantee",
					"Public services avoid registration unless an account or stored data is genuinely required",
					"Abuse, crawler pressure, exhausted quotas, or security risk may trigger limits, pauses, or shutdown",
					"Private storage, internal search instances, and management tokens are never published as public resources",
					"No anonymous file hosting, marketing mail, emergency communications, or high-risk account services",
					"Send abuse, privacy, and security reports to me@sayori.org",
				],
				asideTitle: "Why not keep adding services",
				asideBody: ["Every public entry adds domains, monitoring, dependency updates, abuse handling, and recovery work", "Priority goes to services that reuse existing skills, avoid public upload surfaces, can be rate-limited, and can be retired cleanly. Paused experiments do not stay in home or search entry points"],
				links: [["https://status.sayori.org/", "View status"], ["mailto:me@sayori.org", "Contact maintainer"]],
			},
			faq: {
				title: "Common questions",
				intro: "This page describes current software, business direction, and public boundaries, not a purchase promise for unreleased products",
				items: [
					["What does Amiya_desi develop", "The current focus is web software such as GeoScore, alongside Godot games, desktop and developer tools, and open-source software"],
					["Are paid plans available now", "No. GeoScore is currently free, and this site has no paid subscription or checkout. Prices, delivery, refund, and cancellation terms will be published before any paid plan or software sale launches"],
					["Can I call the GeoScore API", "Yes. Stable public endpoints are listed in the OpenAPI document, and current limits come from /api/meta. The API audits public hostnames and is not an arbitrary URL proxy"],
					["Can I request a Search Gateway token", "There is no public request flow. You can self-host the source. Small experiments use manual invitations and explicit quotas"],
				],
			},
			footer: {
				text: "Amiya_desi · Independent software developer · Updated 2026-08-16",
				links: [["/", "Back to desk"], ["https://blog.sayori.org/", "Blog"], ["https://github.com/Amiyadesi", "GitHub"], ["mailto:me@sayori.org", "Contact"]],
				label: "Footer navigation",
			},
		},
		ja: {
			documentTitle: "ソフトウェアとサービス · Amiya の機",
			description: "個人開発者 Amiya_desi が開発・運用するウェブソフト、Godot ゲーム、オープンソースツール、公開サービス。",
			siteName: "Amiya の機",
			nav: [
				["#service-status", "公開中のソフト"],
				["#planned-services", "計畫"],
				["#operating-boundaries", "利用範囲"],
			],
			hero: {
				eyebrow: "sayori.org / ソフトウェアとサービス",
				title: "Amiya_desi のソフトウェアとサービス",
				lead: "個人で開発・運用しているウェブソフト、開発ツール、Godot ゲーム。",
				note: "主な SaaS は GeoScore です。現在は無料で、有料プランやサイト內決済はありません。ほかのソフトやゲームも、実際の開発狀況に沿って紹介します。",
				legend: "サービスの公開狀況",
				statuses: [
					["public", "公開中"],
					["source", "セルフホスト可"],
					["invite", "招待制の計畫"],
					["private", "非公開の基盤"],
				],
			},
			current: {
				title: "公開中のソフトとプロジェクト",
				intro: "利用できるソフトには入口を、自分で運用できるものにはソースを載せています。未公開の作品を発売済みとして紹介することはありません。",
				items: [
					{
						status: "public",
						statusLabel: "提供中の SaaS",
						title: "GeoScore",
						description: "公開ページを対象に根拠に基づいて SEO・GEO を監査。サイトの概要、Evidence Map、優先修正項目、Markdown レポートを提供します。",
						meta: ["現在無料", "登録不要", "MIT ライセンス"],
						links: [
							["https://geo.sayori.org/", "サービスを開く"],
							["https://github.com/Amiyadesi/geoscore", "ソースを見る"],
						],
					},
					{
						status: "public",
						statusLabel: "公開ソフト",
						title: "Relakeep",
						description: "メール、アカウント、SIM、定期契約、決済カードの関係を手元でまとめるソフト。暗號化バックアップと自前の同期に対応。",
						meta: ["ローカル利用は無料", "暗號化保管", "セルフホスト可"],
						links: [
							["https://atlas.sayori.org/en", "公式サイトへ"],
							["https://github.com/Amiyadesi/amiya-atlas", "ソースを見る"],
						],
					},
					{
						status: "public",
						statusLabel: "公開中",
						title: "Amiya Whiteboard",
						description: "ラフスケッチや簡単な図を描き、ページ構成を説明できる軽量なブラウザー白板。",
						meta: ["アカウント不要", "一時スケッチ", "保存は各自で"],
						links: [
							["https://board.sayori.org/", "白板を開く"],
						],
					},
					{
						status: "public",
						statusLabel: "公開中",
						title: "資料リンク集",
						description: "ツール、資料、コミュニティ、オープンソースのサイトを分類。サイト內検索と外部検索が使えます。",
						meta: ["アカウント不要", "分野別索引", "隨時整理"],
						links: [
							["https://nav.sayori.org/", "リンク集へ"],
						],
					},
					{
						status: "public",
						statusLabel: "公開中",
						title: "GeoScore 公開監査 API",
						description: "公開ドメインの監査結果、PageSpeed の根拠、Evidence Map、FixPack を、利用制限付きの SSE・JSON API で取得できます。",
						meta: ["OpenAPI 3.1", "公開対象のみ", "利用枠あり"],
						links: [
							["https://geo-api.sayori.org/openapi.json", "OpenAPI を見る"],
							["https://geo.sayori.org/docs", "使い方を読む"],
						],
					},
					{
						status: "public",
						statusLabel: "公開中",
						title: "公開記事と RSS",
						description: "ウェブ製作、セルフホスティング、Cloudflare、Godot、AI を使った開発、製作の振り返り。ウェブでも RSS でも読めます。",
						meta: ["アカウント不要", "公開引用可", "隨時整理"],
						links: [
							["https://blog.sayori.org/", "ブログへ"],
							["https://blog.sayori.org/rss.xml", "RSS を購読"],
						],
					},
					{
						status: "source",
						statusLabel: "セルフホスト可",
						title: "Search Gateway",
						description: "複數の検索元をまとめ、根拠のスナップショットを殘すオープンソースのプロジェクト。互換 API と MCP 連攜を提供します。",
						meta: ["Python", "Docker", "MIT ライセンス"],
						links: [
							["https://github.com/Amiyadesi/search-gateway", "ソースと運用ガイド"],
						],
					},
					{
						status: "public",
						statusLabel: "公開中",
						title: "ゲストブックと不具合報告",
						description: "感想や不具合、改善案を送れます。悪用、プライバシー、セキュリティの問題はメールでも受け付けています。",
						meta: ["公開メッセージ", "メール連絡", "手動で対応"],
						links: [
							["https://blog.sayori.org/guestbook/", "ゲストブックへ"],
							["mailto:me@sayori.org", "メールを送る"],
						],
					},
				],
				sourceTitle: "GeoScore の公開 API と內部用 Search Gateway は別のサービスです",
				sourceBody: "GeoScore API は公開仕様に沿って利用できます。アクセス制限があり、対象が公開ホストか確認します。Search Gateway は管理者自身のサイトと保守用です。トークン共有、匿名呼び出し、公開利用枠はありません。",
			},
			plans: {
				title: "小さく試したいこと",
				intro: "製品化の約束ではありません。まず招待制と個別確認で需要、悪用リスク、運用コストを見て、続けるか決めます。",
				items: [
					["invite", "招待制の計畫", "サイト診斷の助け合い", "個人ブログやオープンソースのプロジェクト、小規模コミュニティのサイトを GeoScore で調べ、人の目で確認して検証可能な修正順を添えます。"],
					["invite", "招待制の計畫", "靜的サイト公開の手伝い", "個人・オープンソースのリポジトリを整え、Cloudflare Pages または GitHub Pages に公開し、自分で保守できる手順書を殘します。"],
					["invite", "招待制の計畫", "調査用の検索枠", "オープンソース文書の確認やコミュニティ資料の調査向けに、少量の Search Gateway 利用枠を提供する案です。匿名登録や一括収集は対象外です。"],
					["invite", "招待制の計畫", "RSS 通知の中継", "購読機能のない小さなサイト向けに、RSS からメールや Webhook への低頻度の通知を試します。広告の一斉配信は扱いません。"],
					["private", "非公開の基盤", "根拠の短期スナップショット", "空いているオブジェクトストレージは、匿名アップロードの再開よりも GeoScore の根拠の短期保存に使います。"],
					["private", "非公開の基盤", "暗號化バックアップ", "殘りの容量にはサイト設定、記事の原稿、重要データを暗號化して保存し、復元訓練を記録します。"],
				],
			},
			boundaries: {
				title: "利用範囲と停止條件",
				intro: "小さな個人サービスを無理なく続けるために、最初からできることの範囲を明確にしています。",
				items: ["できる範囲で運用します。稼働率、応答時間、永久保存は保証しません。", "公開サービスは原則として登録不要です。アカウントやデータ保存が必要な場合は明示します。", "悪用、クローラーの負荷、利用枠切れ、セキュリティ上の問題があれば制限・休止・終了することがあります。", "非公開ストレージ、內部検索インスタンス、管理トークンは公開しません。", "匿名ファイルホスティング、広告メールの一斉配信、緊急通信、高リスクのアカウントサービスは提供しません。", "悪用、プライバシー、セキュリティのご連絡は me@sayori.org へ。"],
				asideTitle: "サービスを増やし続けない理由",
				asideBody: ["入口が増えるたび、ドメイン管理、監視、依存関係の更新、迷惑行為への対応、障害復舊も増えます。", "経験を生かせて、公開アップロードがなく、利用制限や終了がしやすいものを優先します。休止した実験はトップや検索の入口から外します。"],
				links: [
					["https://status.sayori.org/", "稼働狀況を見る"],
					["mailto:me@sayori.org", "管理者に連絡"],
				],
			},
			faq: {
				title: "よくある質問",
				intro: "現在のソフトウェア、取り組み、公開範囲を紹介するページです。未発売製品の購入を約束するものではありません。",
				items: [
					["Amiya_desi は何を開発していますか？", "現在は GeoScore のようなウェブソフトが中心です。Godot ゲーム、デスクトップ・開発ツール、オープンソースソフトも作っています。"],
					["有料プランはありますか？", "ありません。現在 GeoScore は無料で、サイトに有料購読や決済機能はありません。有料化やソフト販売の前に価格、提供方法、返金・解約條件を公開します。"],
					["GeoScore API を呼び出せますか？", "はい。安定版の公開エンドポイントは OpenAPI に、現在の制限は /api/meta にあります。対象は公開ホスト名のみで、任意 URL のプロキシではありません。"],
					["Search Gateway のトークンは申請できますか？", "公開申請はありません。ソースから自分で運用できます。小規模な試行は個別招待制で、利用枠を明示します。"],
				],
			},
			footer: {
				text: "Amiya_desi · 個人ソフトウェア開発者 · 更新 2026-08-16",
				links: [
					["/ja/", "機に戻る"],
					["https://blog.sayori.org/", "ブログ"],
					["https://github.com/Amiyadesi", "GitHub"],
					["mailto:me@sayori.org", "連絡先"],
				],
				label: "フッターナビゲーション",
			},
			navLabel: "ページ內ナビゲーション",
		},
		fr: {
			documentTitle: "Logiciels et services · Le bureau d’Amiya",
			description: "Logiciels web, jeux Godot, outils libres et services publics développés et entretenus par Amiya_desi en indépendant.",
			siteName: "Le bureau d’Amiya",
			nav: [
				["#service-status", "Logiciels actuels"],
				["#planned-services", "Pistes"],
				["#operating-boundaries", "Limites"],
			],
			hero: {
				eyebrow: "sayori.org / logiciels et services",
				title: "Les logiciels et services d’Amiya_desi",
				lead: "Des logiciels web, des outils de développement et des jeux Godot que je développe en indépendant.",
				note: "GeoScore est mon principal SaaS. Il est gratuit pour le moment, sans abonnement payant ni paiement sur le site. Les autres logiciels et jeux sont présentés à leur stade réel.",
				legend: "États des services",
				statuses: [
					["public", "En ligne"],
					["source", "À héberger soi-même"],
					["invite", "Projet sur invitation"],
					["private", "Infrastructure privée"],
				],
			},
			current: {
				title: "Logiciels et projets actuels",
				intro: "Les logiciels disponibles ont un lien direct ; les projets à héberger soi-même, un lien vers le code. Un projet inédit n’est pas présenté comme déjà en vente.",
				items: [
					{
						status: "public",
						statusLabel: "SaaS actuel",
						title: "GeoScore",
						description: "Audit SEO et GEO des pages publiques à partir de constats vérifiables : profil du site, Evidence Map, corrections prioritaires et rapport Markdown.",
						meta: ["Gratuit actuellement", "Sans inscription", "Licence MIT"],
						links: [
							["https://geo.sayori.org/", "Ouvrir le service"],
							["https://github.com/Amiyadesi/geoscore", "Voir le code"],
						],
					},
					{
						status: "public",
						statusLabel: "Logiciel public",
						title: "Relakeep",
						description: "Un outil local pour relier adresses mail, comptes, SIM, abonnements et cartes de paiement, avec sauvegarde chiffrée et synchronisation auto-hébergée.",
						meta: ["Usage local gratuit", "Stockage chiffré", "À héberger soi-même"],
						links: [
							["https://atlas.sayori.org/en", "Visiter le site"],
							["https://github.com/Amiyadesi/amiya-atlas", "Voir le code"],
						],
					},
					{
						status: "public",
						statusLabel: "En ligne",
						title: "Amiya Whiteboard",
						description: "Un tableau blanc léger dans le navigateur pour croquer une idée, tracer un schéma ou expliquer la structure d’une page.",
						meta: ["Sans compte", "Croquis temporaires", "À sauvegarder soi-même"],
						links: [
							["https://board.sayori.org/", "Ouvrir le tableau"],
						],
					},
					{
						status: "public",
						statusLabel: "En ligne",
						title: "Répertoire de ressources",
						description: "Outils, références, communautés et sites libres classés par thème, avec recherche interne et externe.",
						meta: ["Sans compte", "Index thématique", "Mis à jour au fil du temps"],
						links: [
							["https://nav.sayori.org/", "Ouvrir le répertoire"],
						],
					},
					{
						status: "public",
						statusLabel: "En ligne",
						title: "API publique d’audit GeoScore",
						description: "Audits vérifiables des domaines publics, données PageSpeed, Evidence Map et FixPack via des points d’accès SSE et JSON à usage limité.",
						meta: ["OpenAPI 3.1", "Cibles publiques uniquement", "Quota limité"],
						links: [
							["https://geo-api.sayori.org/openapi.json", "Consulter OpenAPI"],
							["https://geo.sayori.org/docs", "Lire les guides"],
						],
					},
					{
						status: "public",
						statusLabel: "En ligne",
						title: "Articles publics et RSS",
						description: "Notes sur le web, l’auto-hébergement, Cloudflare, Godot, le développement assisté par IA et les retours de projet, à lire en ligne ou par RSS.",
						meta: ["Sans compte", "Citation publique autorisée", "Mis à jour au fil du temps"],
						links: [
							["https://blog.sayori.org/", "Lire le blog"],
							["https://blog.sayori.org/rss.xml", "S’abonner par RSS"],
						],
					},
					{
						status: "source",
						statusLabel: "À héberger soi-même",
						title: "Search Gateway",
						description: "Projet libre qui réunit plusieurs sources de recherche, garde des instantanés des résultats et propose des API compatibles ainsi qu’une intégration MCP.",
						meta: ["Python", "Docker", "Licence MIT"],
						links: [
							["https://github.com/Amiyadesi/search-gateway", "Code et guide de déploiement"],
						],
					},
					{
						status: "public",
						statusLabel: "En ligne",
						title: "Livre d’or et signalements",
						description: "Laissez une impression de lecture ou signalez un problème. Pour les abus, la confidentialité ou la sécurité, vous pouvez aussi m’écrire.",
						meta: ["Messages publics", "Contact par mail", "Réponse personnelle"],
						links: [
							["https://blog.sayori.org/guestbook/", "Ouvrir le livre d’or"],
							["mailto:me@sayori.org", "Envoyer un mail"],
						],
					},
				],
				sourceTitle: "L’API publique GeoScore et le Search Gateway interne ont des usages distincts",
				sourceBody: "L’API GeoScore suit sa documentation publique, limite les requêtes et vérifie que les cibles sont publiques. L’instance Search Gateway est réservée à mes sites et à leur maintenance : ni jeton partagé, ni appel anonyme, ni quota public.",
			},
			plans: {
				title: "Des idées à tester à petite échelle",
				intro: "Ces pistes ne sont pas des produits annoncés. Invitations et examen manuel permettront d’évaluer la demande, les risques d’abus et l’entretien avant de s’engager.",
				items: [
					["invite", "Projet sur invitation", "Entraide pour les audits de sites", "Auditer avec GeoScore des blogs, des pages de projets libres et de petites communautés, puis proposer une relecture humaine et un ordre de correction vérifiable."],
					["invite", "Projet sur invitation", "Aide à la mise en ligne d’un site statique", "Aider à préparer le dépôt d’un projet personnel ou libre, le déployer sur Cloudflare Pages ou GitHub Pages et laisser une documentation utilisable."],
					["invite", "Projet sur invitation", "Petit quota de recherche", "Un petit quota Search Gateway pour vérifier une documentation libre ou rassembler des sources pour une communauté, sans inscription anonyme ni collecte en masse."],
					["invite", "Projet sur invitation", "Relais de notifications RSS", "Tester des notifications peu fréquentes par mail ou webhook depuis RSS pour les petits sites sans outil d’abonnement, hors campagnes marketing."],
					["private", "Infrastructure privée", "Instantanés de preuves temporaires", "Affecter le stockage objet inutilisé aux instantanés temporaires de GeoScore plutôt que rouvrir le dépôt anonyme de fichiers."],
					["private", "Infrastructure privée", "Sauvegardes chiffrées", "Garder des copies chiffrées de la configuration, des articles sources et des données essentielles dans l’espace restant, et tester leur restauration."],
				],
			},
			boundaries: {
				title: "Limites d’utilisation et conditions d’arrêt",
				intro: "Rendre les limites visibles dès le départ évite qu’un élan d’enthousiasme ne se transforme en charge permanente.",
				items: ["Maintenance au mieux, sans garantie de disponibilité, de délai de réponse ni de conservation permanente.", "Pas d’inscription par défaut. Les cas nécessitant un compte ou des données conservées sont précisés.", "Abus, pression des robots, quota épuisé ou risque de sécurité peuvent entraîner une limitation, une pause ou un arrêt.", "Le stockage privé, les instances de recherche internes et les jetons d’administration restent privés.", "Pas d’hébergement anonyme de fichiers, de publipostage marketing, de communications d’urgence ni de services de comptes à haut risque.", "Pour les abus, la confidentialité ou la sécurité : me@sayori.org."],
				asideTitle: "Pourquoi limiter le nombre de services ?",
				asideBody: ["Chaque service ajoute des domaines, de la surveillance, des mises à jour, du traitement des abus et du travail de rétablissement.", "Je privilégie les services que je sais déjà maintenir, sans dépôt public, faciles à limiter et à arrêter. Les expériences suspendues disparaissent de l’accueil et des entrées de recherche."],
				links: [
					["https://status.sayori.org/", "Voir l’état des services"],
					["mailto:me@sayori.org", "Contacter le responsable"],
				],
			},
			faq: {
				title: "Questions fréquentes",
				intro: "Cette page décrit les logiciels actuels, les pistes envisagées et leurs limites. Elle ne propose pas à l’achat de produits inédits.",
				items: [
					["Que développe Amiya_desi ?", "Surtout des logiciels web comme GeoScore, mais aussi des jeux Godot, des outils de bureau et de développement, et des logiciels libres."],
					["Y a-t-il des offres payantes ?", "Non. GeoScore est gratuit et le site ne propose ni abonnement payant ni paiement. Prix, livraison, remboursement et résiliation seront précisés avant toute vente."],
					["Puis-je appeler l’API GeoScore ?", "Oui. Les points d’accès stables figurent dans OpenAPI et les limites actuelles dans /api/meta. Seuls les noms d’hôte publics sont audités : ce n’est pas un proxy pour URL arbitraires."],
					["Puis-je demander un jeton Search Gateway ?", "Il n’y a pas de demande publique. Vous pouvez héberger le code vous-même. Les essais se font sur invitation personnelle, avec un quota explicite."],
				],
			},
			footer: {
				text: "Amiya_desi · Développement logiciel indépendant · Mise à jour : 2026-08-16",
				links: [
					["/fr/", "Retour au bureau"],
					["https://blog.sayori.org/", "Blog"],
					["https://github.com/Amiyadesi", "GitHub"],
					["mailto:me@sayori.org", "Contact"],
				],
				label: "Navigation de pied de page",
			},
			navLabel: "Navigation de la page",
		},
		ko: {
			documentTitle: "소프트웨어와 서비스 · Amiya의 책상",
			description: "Amiya_desi가 독립적으로 개발하고 관리하는 웹 소프트웨어, Godot 게임, 오픈 소스 도구와 공개 서비스입니다.",
			siteName: "Amiya의 책상",
			nav: [
				["#service-status", "현재 소프트웨어"],
				["#planned-services", "계획"],
				["#operating-boundaries", "이용 범위"],
			],
			hero: {
				eyebrow: "sayori.org / 소프트웨어와 서비스",
				title: "Amiya_desi의 소프트웨어와 서비스",
				lead: "독립적으로 개발하고 관리하는 웹 소프트웨어, 개발 도구, Godot 게임입니다.",
				note: "주력 SaaS인 GeoScore는 현재 무료이며 유료 구독이나 사이트 내 결제가 없습니다. 다른 소프트웨어와 게임도 실제 개발 단계대로 소개합니다.",
				legend: "서비스 상태 안내",
				statuses: [
					["public", "운영 중"],
					["source", "직접 호스팅 가능"],
					["invite", "초대제 계획"],
					["private", "비공개 인프라"],
				],
			},
			current: {
				title: "현재 소프트웨어와 프로젝트",
				intro: "사용 가능한 소프트웨어는 바로 가기를, 직접 호스팅할 수 있는 프로젝트는 소스를 제공합니다. 미출시 프로젝트를 판매 중인 제품처럼 소개하지 않습니다.",
				items: [
					{
						status: "public",
						statusLabel: "현재 SaaS",
						title: "GeoScore",
						description: "공개 페이지의 근거를 바탕으로 SEO·GEO를 점검하고 사이트 개요, Evidence Map, 우선 수정 항목, Markdown 보고서를 제공합니다.",
						meta: ["현재 무료", "가입 불필요", "MIT 라이선스"],
						links: [
							["https://geo.sayori.org/", "서비스 열기"],
							["https://github.com/Amiyadesi/geoscore", "소스 보기"],
						],
					},
					{
						status: "public",
						statusLabel: "공개 소프트웨어",
						title: "Relakeep",
						description: "이메일, 계정, SIM, 구독, 결제 카드를 로컬에서 연결해 관리하며 암호화 백업과 자체 호스팅 동기화를 지원합니다.",
						meta: ["로컬 사용 무료", "암호화 저장", "직접 호스팅 가능"],
						links: [
							["https://atlas.sayori.org/en", "공식 사이트 열기"],
							["https://github.com/Amiyadesi/amiya-atlas", "소스 보기"],
						],
					},
					{
						status: "public",
						statusLabel: "운영 중",
						title: "Amiya Whiteboard",
						description: "스케치와 간단한 도식을 그리고 페이지 구조를 설명할 수 있는 가벼운 브라우저 화이트보드입니다.",
						meta: ["계정 불필요", "임시 스케치", "직접 저장"],
						links: [
							["https://board.sayori.org/", "화이트보드 열기"],
						],
					},
					{
						status: "public",
						statusLabel: "운영 중",
						title: "자료 모음",
						description: "도구, 자료, 커뮤니티, 오픈 소스 사이트를 분류해 모았습니다. 내부 검색과 외부 검색을 지원합니다.",
						meta: ["계정 불필요", "분류별 색인", "지속적으로 정리"],
						links: [
							["https://nav.sayori.org/", "목록 열기"],
						],
					},
					{
						status: "public",
						statusLabel: "운영 중",
						title: "GeoScore 공개 점검 API",
						description: "공개 도메인의 점검 결과, PageSpeed 근거, Evidence Map과 FixPack을 제한된 SSE·JSON 엔드포인트로 제공합니다.",
						meta: ["OpenAPI 3.1", "공개 대상만", "할당량 제한"],
						links: [
							["https://geo-api.sayori.org/openapi.json", "OpenAPI 보기"],
							["https://geo.sayori.org/docs", "사용 안내 읽기"],
						],
					},
					{
						status: "public",
						statusLabel: "운영 중",
						title: "공개 기술 글과 RSS",
						description: "사이트 구축, 셀프 호스팅, Cloudflare, Godot, AI 보조 개발과 프로젝트 회고를 웹이나 RSS로 읽을 수 있습니다.",
						meta: ["계정 불필요", "공개 인용 가능", "지속적으로 정리"],
						links: [
							["https://blog.sayori.org/", "블로그 열기"],
							["https://blog.sayori.org/rss.xml", "RSS 구독"],
						],
					},
					{
						status: "source",
						statusLabel: "직접 호스팅 가능",
						title: "Search Gateway",
						description: "여러 검색 소스를 모으고 근거 스냅샷을 보관하며 호환 API와 MCP 연동을 제공하는 오픈 소스 프로젝트입니다.",
						meta: ["Python", "Docker", "MIT 라이선스"],
						links: [
							["https://github.com/Amiyadesi/search-gateway", "소스와 배포 안내"],
						],
					},
					{
						status: "public",
						statusLabel: "운영 중",
						title: "방명록과 문제 제보",
						description: "감상이나 서비스 문제, 개선 의견을 남겨 주세요. 악용, 개인정보, 보안 문제는 이메일로도 알려 주세요.",
						meta: ["공개 메시지", "이메일 연락", "직접 답변"],
						links: [
							["https://blog.sayori.org/guestbook/", "방명록 열기"],
							["mailto:me@sayori.org", "이메일 보내기"],
						],
					},
				],
				sourceTitle: "GeoScore 공개 API와 내부 Search Gateway는 이용 범위가 다릅니다",
				sourceBody: "GeoScore API는 공개 문서에 따라 호출하며 요청 제한과 공개 대상 검증을 적용합니다. Search Gateway 인스턴스는 운영자의 사이트와 유지 관리에만 쓰며 토큰 공유, 익명 호출, 공개 할당량을 제공하지 않습니다.",
			},
			plans: {
				title: "작게 시험해 볼 아이디어",
				intro: "출시를 약속한 제품은 아닙니다. 먼저 초대와 수동 검토로 수요, 악용 위험, 관리 비용을 살핀 뒤 지속 여부를 정합니다.",
				items: [
					["invite", "초대제 계획", "사이트 점검 품앗이", "개인 블로그, 오픈 소스 프로젝트, 소규모 커뮤니티 사이트를 GeoScore로 점검한 뒤 직접 검토하고 검증 가능한 수정 순서를 제안합니다."],
					["invite", "초대제 계획", "정적 사이트 출시 지원", "개인·오픈 소스 프로젝트의 저장소를 정리해 Cloudflare Pages나 GitHub Pages에 배포하고 직접 관리할 문서를 남깁니다."],
					["invite", "초대제 계획", "자료 검증용 검색 할당량", "오픈 소스 문서 확인과 커뮤니티 자료 조사를 위한 소량의 Search Gateway 할당량입니다. 익명 가입과 대량 수집은 제외합니다."],
					["invite", "초대제 계획", "RSS 알림 중계", "구독 도구가 없는 작은 사이트를 위해 RSS를 이메일이나 웹훅으로 가끔 전송하는 실험입니다. 마케팅 대량 발송은 하지 않습니다."],
					["private", "비공개 인프라", "단기 근거 스냅샷", "남는 객체 스토리지는 익명 업로드 재개보다 GeoScore 점검 근거의 단기 보관에 우선 사용합니다."],
					["private", "비공개 인프라", "암호화 백업", "남은 공간에 사이트 설정, 글 원본, 중요 데이터를 암호화해 백업하고 복구 훈련을 기록합니다."],
				],
			},
			boundaries: {
				title: "이용 범위와 중단 기준",
				intro: "작은 개인 서비스를 오래 유지하려면 처음의 의욕이 감당하기 어려운 부담이 되기 전에 한계를 밝혀야 합니다.",
				items: ["가능한 범위에서 운영하며 가동 시간, 응답 시간, 영구 보관은 보장하지 않습니다.", "공개 서비스는 기본적으로 가입이 필요 없습니다. 계정이나 데이터 저장이 필요할 때는 따로 안내합니다.", "악용, 크롤러 부하, 할당량 소진, 보안 위험이 있으면 제한하거나 일시 중지 또는 종료할 수 있습니다.", "비공개 저장소, 내부 검색 인스턴스, 관리 토큰은 공개하지 않습니다.", "익명 파일 호스팅, 마케팅 대량 메일, 긴급 통신, 고위험 계정 서비스는 제공하지 않습니다.", "악용, 개인정보, 보안 문제는 me@sayori.org로 알려 주세요."],
				asideTitle: "서비스를 계속 늘리지 않는 이유",
				asideBody: ["서비스마다 도메인, 모니터링, 의존성 업데이트, 스팸 대응, 장애 복구가 따라옵니다.", "기존 경험을 살리고 공개 업로드가 없으며 사용량 제한과 종료가 쉬운 서비스를 우선합니다. 중지된 실험은 홈과 검색 진입점에서 내립니다."],
				links: [
					["https://status.sayori.org/", "운영 상태 보기"],
					["mailto:me@sayori.org", "운영자에게 연락"],
				],
			},
			faq: {
				title: "자주 묻는 질문",
				intro: "현재 소프트웨어와 사업 방향, 공개 범위를 설명하는 페이지이며 미출시 제품 구매를 약속하는 곳이 아닙니다.",
				items: [
					["Amiya_desi는 무엇을 개발하나요?", "현재 GeoScore 같은 웹 소프트웨어를 주로 만들며 Godot 게임, 데스크톱·개발 도구, 오픈 소스 소프트웨어도 개발합니다."],
					["현재 유료 요금제가 있나요?", "없습니다. GeoScore는 현재 무료이고 사이트 내 유료 구독이나 결제가 없습니다. 판매나 유료화 전 가격, 제공 방식, 환불 및 해지 규정을 공개합니다."],
					["GeoScore API를 호출할 수 있나요?", "네. 안정된 공개 엔드포인트는 OpenAPI, 현재 제한은 /api/meta에서 확인하세요. 공개 호스트 이름만 점검하며 임의 URL 프록시가 아닙니다."],
					["Search Gateway 토큰을 신청할 수 있나요?", "공개 신청은 받지 않습니다. 소스를 직접 호스팅할 수 있습니다. 소규모 실험은 개별 초대로 진행하며 한도를 명시합니다."],
				],
			},
			footer: {
				text: "Amiya_desi · 독립 소프트웨어 개발자 · 업데이트 2026-08-16",
				links: [
					["/ko/", "책상으로"],
					["https://blog.sayori.org/", "블로그"],
					["https://github.com/Amiyadesi", "GitHub"],
					["mailto:me@sayori.org", "연락처"],
				],
				label: "하단 탐색",
			},
			navLabel: "페이지 탐색",
		},
		es: {
			documentTitle: "Software y servicios · El escritorio de Amiya",
			description: "Software web, juegos de Godot, herramientas de código abierto y servicios públicos que Amiya_desi desarrolla y mantiene de forma independiente.",
			siteName: "El escritorio de Amiya",
			nav: [
				["#service-status", "Software actual"],
				["#planned-services", "Planes"],
				["#operating-boundaries", "Límites"],
			],
			hero: {
				eyebrow: "sayori.org / software y servicios",
				title: "Software y servicios de Amiya_desi",
				lead: "Desarrollo independiente de software web, herramientas de desarrollo y juegos de Godot.",
				note: "GeoScore es mi principal SaaS y por ahora es gratuito, sin suscripción de pago ni cobros en el sitio. Los demás programas y juegos se muestran en su estado real.",
				legend: "Estados de los servicios",
				statuses: [
					["public", "En línea"],
					["source", "Alojamiento propio"],
					["invite", "Proyecto por invitación"],
					["private", "Infraestructura privada"],
				],
			},
			current: {
				title: "Software y proyectos actuales",
				intro: "El software disponible tiene un enlace directo; los proyectos para alojamiento propio enlazan al código. No presento como vendidos productos que aún no se han publicado.",
				items: [
					{
						status: "public",
						statusLabel: "SaaS actual",
						title: "GeoScore",
						description: "Auditorías SEO y GEO de páginas públicas basadas en datos: perfil del sitio, Evidence Map, mejoras prioritarias e informe en Markdown.",
						meta: ["Gratis por ahora", "Sin registro", "Licencia MIT"],
						links: [
							["https://geo.sayori.org/", "Abrir servicio"],
							["https://github.com/Amiyadesi/geoscore", "Ver código"],
						],
					},
					{
						status: "public",
						statusLabel: "Software público",
						title: "Relakeep",
						description: "Organiza en local las relaciones entre correos, cuentas, SIM, suscripciones y tarjetas, con copias cifradas y sincronización propia.",
						meta: ["Uso local gratuito", "Almacén cifrado", "Alojamiento propio"],
						links: [
							["https://atlas.sayori.org/en", "Abrir sitio"],
							["https://github.com/Amiyadesi/amiya-atlas", "Ver código"],
						],
					},
					{
						status: "public",
						statusLabel: "En línea",
						title: "Amiya Whiteboard",
						description: "Una pizarra ligera de navegador para bocetos, diagramas y esquemas de páginas.",
						meta: ["Sin cuenta", "Bocetos temporales", "Guarda tu trabajo"],
						links: [
							["https://board.sayori.org/", "Abrir pizarra"],
						],
					},
					{
						status: "public",
						statusLabel: "En línea",
						title: "Directorio de recursos",
						description: "Herramientas, referencias, comunidades y sitios de código abierto por categorías, con búsqueda interna y externa.",
						meta: ["Sin cuenta", "Índice por categorías", "En actualización"],
						links: [
							["https://nav.sayori.org/", "Abrir directorio"],
						],
					},
					{
						status: "public",
						statusLabel: "En línea",
						title: "API pública de auditoría de GeoScore",
						description: "Auditorías verificables de dominios públicos, datos de PageSpeed, Evidence Map y FixPack mediante endpoints SSE y JSON con límites de uso.",
						meta: ["OpenAPI 3.1", "Solo destinos públicos", "Cuota limitada"],
						links: [
							["https://geo-api.sayori.org/openapi.json", "Ver OpenAPI"],
							["https://geo.sayori.org/docs", "Leer las guías"],
						],
					},
					{
						status: "public",
						statusLabel: "En línea",
						title: "Artículos públicos y RSS",
						description: "Notas sobre sitios web, alojamiento propio, Cloudflare, Godot, desarrollo con IA y retrospectivas, disponibles en la web y por RSS.",
						meta: ["Sin cuenta", "Se permite citar", "En actualización"],
						links: [
							["https://blog.sayori.org/", "Ir al blog"],
							["https://blog.sayori.org/rss.xml", "Suscribirse por RSS"],
						],
					},
					{
						status: "source",
						statusLabel: "Alojamiento propio",
						title: "Search Gateway",
						description: "Proyecto de código abierto que reúne fuentes de búsqueda, conserva instantáneas de las pruebas y ofrece API compatibles e integración MCP.",
						meta: ["Python", "Docker", "Licencia MIT"],
						links: [
							["https://github.com/Amiyadesi/search-gateway", "Código y guía de despliegue"],
						],
					},
					{
						status: "public",
						statusLabel: "En línea",
						title: "Libro de visitas y avisos de problemas",
						description: "Deja una impresión de lectura o avisa de un problema. Para asuntos de privacidad, abuso o seguridad, también puedes escribirme.",
						meta: ["Notas públicas", "Contacto por correo", "Respuesta personal"],
						links: [
							["https://blog.sayori.org/guestbook/", "Abrir libro de visitas"],
							["mailto:me@sayori.org", "Enviar correo"],
						],
					},
				],
				sourceTitle: "La API pública de GeoScore y el Search Gateway interno tienen distintos límites",
				sourceBody: "La API de GeoScore sigue la especificación pública, limita las peticiones y valida los destinos públicos. Search Gateway se reserva para mis sitios y su mantenimiento: sin tokens compartidos, llamadas anónimas ni cuotas públicas.",
			},
			plans: {
				title: "Ideas para probar a pequeña escala",
				intro: "No son productos prometidos. Primero usaré invitaciones y revisión manual para evaluar la demanda, los riesgos de abuso y el coste de mantenimiento.",
				items: [
					["invite", "Proyecto por invitación", "Intercambio de auditorías web", "Auditar con GeoScore blogs personales, páginas de proyectos abiertos y comunidades pequeñas, y añadir una revisión humana con un orden de corrección verificable."],
					["invite", "Proyecto por invitación", "Ayuda para publicar sitios estáticos", "Ayudar a preparar el repositorio, desplegar en Cloudflare Pages o GitHub Pages y dejar documentación para mantener el sitio personal o de código abierto."],
					["invite", "Proyecto por invitación", "Cuota para verificar fuentes", "Una pequeña cuota de Search Gateway para verificar documentación abierta o investigar para una comunidad, sin altas anónimas ni rastreo masivo."],
					["invite", "Proyecto por invitación", "Reenvío de avisos RSS", "Probar avisos poco frecuentes de RSS a correo o webhook para sitios pequeños sin sistema de suscripción, sin campañas comerciales."],
					["private", "Infraestructura privada", "Instantáneas temporales de evidencias", "Destinar el almacenamiento de objetos disponible a pruebas temporales de GeoScore en vez de reabrir las subidas anónimas."],
					["private", "Infraestructura privada", "Copias cifradas", "Usar el espacio restante para copias cifradas de configuración, artículos originales y datos críticos, con pruebas de restauración."],
				],
			},
			boundaries: {
				title: "Límites de uso y criterios de cierre",
				intro: "Definir los límites desde el principio evita que el entusiasmo inicial se convierta en una carga permanente.",
				items: ["Mantenimiento según disponibilidad, sin garantía de actividad, tiempo de respuesta ni conservación permanente.", "Los servicios públicos evitan el registro. Si hacen falta cuentas o datos guardados, se indica.", "Los abusos, la carga de rastreadores, las cuotas agotadas o los riesgos de seguridad pueden causar límites, pausas o cierres.", "El almacenamiento privado, las instancias internas de búsqueda y los tokens de gestión no son públicos.", "Sin alojamiento anónimo de archivos, correo comercial masivo, comunicaciones de emergencia ni servicios de cuentas de alto riesgo.", "Para avisos sobre abuso, privacidad o seguridad: me@sayori.org."],
				asideTitle: "Por qué no añadir más servicios",
				asideBody: ["Cada servicio añade dominios, supervisión, actualizaciones, gestión de abusos y recuperación de fallos.", "Priorizo los servicios que sé mantener, sin subidas públicas, fáciles de limitar y retirar. Retiro los experimentos en pausa de la portada y de los accesos de búsqueda."],
				links: [
					["https://status.sayori.org/", "Ver estado"],
					["mailto:me@sayori.org", "Contactar con el responsable"],
				],
			},
			faq: {
				title: "Preguntas frecuentes",
				intro: "Esta página describe el software actual, los planes y los límites públicos; no ofrece comprar productos sin publicar.",
				items: [
					["¿Qué desarrolla Amiya_desi?", "Principalmente software web como GeoScore, además de juegos de Godot, herramientas de escritorio y desarrollo y software de código abierto."],
					["¿Hay planes de pago?", "No. GeoScore es gratuito y no hay suscripciones de pago ni cobros en el sitio. Antes de vender publicaré precios y condiciones de entrega, reembolso y cancelación."],
					["¿Puedo usar la API de GeoScore?", "Sí. Los endpoints estables figuran en OpenAPI y los límites actuales en /api/meta. Audita nombres de host públicos; no es un proxy de URL arbitrarias."],
					["¿Puedo solicitar un token de Search Gateway?", "No hay solicitudes públicas. Puedes alojar el código por tu cuenta. Los ensayos pequeños usan invitaciones personales y cuotas explícitas."],
				],
			},
			footer: {
				text: "Amiya_desi · Desarrollo de software independiente · Actualizado el 2026-08-16",
				links: [
					["/es/", "Volver al escritorio"],
					["https://blog.sayori.org/", "Blog"],
					["https://github.com/Amiyadesi", "GitHub"],
					["mailto:me@sayori.org", "Contacto"],
				],
				label: "Navegación del pie",
			},
			navLabel: "Navegación de la página",
		},
		de: {
			documentTitle: "Software und Dienste · Amiyas Schreibtisch",
			description: "Websoftware, Godot-Spiele, Open-Source-Werkzeuge und öffentliche Dienste, die Amiya_desi unabhängig entwickelt und pflegt.",
			siteName: "Amiyas Schreibtisch",
			nav: [
				["#service-status", "Aktuelle Software"],
				["#planned-services", "Pläne"],
				["#operating-boundaries", "Grenzen"],
			],
			hero: {
				eyebrow: "sayori.org / Software und Dienste",
				title: "Software und Dienste von Amiya_desi",
				lead: "Websoftware, Entwicklungswerkzeuge und Godot-Spiele aus eigener Entwicklung.",
				note: "Mein wichtigster SaaS-Dienst ist GeoScore. Er ist derzeit kostenlos, ohne Bezahlabo oder Kasse auf der Website. Andere Software und Spiele zeige ich mit ihrem tatsächlichen Entwicklungsstand.",
				legend: "Legende zum Dienststatus",
				statuses: [
					["public", "Öffentlich"],
					["source", "Selbst hostbar"],
					["invite", "Geplant auf Einladung"],
					["private", "Private Infrastruktur"],
				],
			},
			current: {
				title: "Aktuelle Software und Projekte",
				intro: "Verfügbare Software ist direkt verlinkt, selbst hostbare Projekte über ihren Quellcode. Unveröffentlichte Projekte erscheinen nicht als bereits erhältliche Produkte.",
				items: [
					{
						status: "public",
						statusLabel: "Aktueller SaaS-Dienst",
						title: "GeoScore",
						description: "Beleggestützte SEO- und GEO-Prüfung öffentlicher Seiten mit Websiteprofil, Evidence Map, priorisierten Korrekturen und Markdown-Bericht.",
						meta: ["Derzeit kostenlos", "Ohne Registrierung", "MIT-Lizenz"],
						links: [
							["https://geo.sayori.org/", "Dienst öffnen"],
							["https://github.com/Amiyadesi/geoscore", "Quellcode ansehen"],
						],
					},
					{
						status: "public",
						statusLabel: "Öffentliche Software",
						title: "Relakeep",
						description: "Verknüpft E-Mails, Konten, SIM-Karten, Abos und Zahlungskarten lokal. Unterstützt verschlüsselte Sicherungen und selbst gehostete Synchronisierung.",
						meta: ["Lokal kostenlos", "Verschlüsselter Speicher", "Selbst hostbar"],
						links: [
							["https://atlas.sayori.org/en", "Zur Website"],
							["https://github.com/Amiyadesi/amiya-atlas", "Quellcode ansehen"],
						],
					},
					{
						status: "public",
						statusLabel: "Öffentlich",
						title: "Amiya Whiteboard",
						description: "Ein schlankes Browser-Whiteboard für schnelle Skizzen, Diagramme und Seitenentwürfe.",
						meta: ["Ohne Konto", "Flüchtige Skizzen", "Selbst speichern"],
						links: [
							["https://board.sayori.org/", "Whiteboard öffnen"],
						],
					},
					{
						status: "public",
						statusLabel: "Öffentlich",
						title: "Ressourcenverzeichnis",
						description: "Nach Themen geordnete Werkzeuge, Quellen, Communitys und Open-Source-Websites mit interner und externer Suche.",
						meta: ["Ohne Konto", "Thematischer Index", "Fortlaufend gepflegt"],
						links: [
							["https://nav.sayori.org/", "Verzeichnis öffnen"],
						],
					},
					{
						status: "public",
						statusLabel: "Öffentlich",
						title: "Öffentliche GeoScore-Prüf-API",
						description: "Prüfbefunde für öffentliche Domains, PageSpeed-Daten, Evidence Map und FixPack über begrenzte SSE- und JSON-Endpunkte.",
						meta: ["OpenAPI 3.1", "Nur öffentliche Ziele", "Begrenztes Kontingent"],
						links: [
							["https://geo-api.sayori.org/openapi.json", "OpenAPI ansehen"],
							["https://geo.sayori.org/docs", "Anleitung lesen"],
						],
					},
					{
						status: "public",
						statusLabel: "Öffentlich",
						title: "Öffentliche Artikel und RSS",
						description: "Notizen über Websites, Selbsthosting, Cloudflare, Godot, KI-gestützte Entwicklung und Projektrückblicke – im Web und per RSS.",
						meta: ["Ohne Konto", "Zitieren erlaubt", "Fortlaufend gepflegt"],
						links: [
							["https://blog.sayori.org/", "Zum Blog"],
							["https://blog.sayori.org/rss.xml", "RSS abonnieren"],
						],
					},
					{
						status: "source",
						statusLabel: "Selbst hostbar",
						title: "Search Gateway",
						description: "Ein Open-Source-Projekt, das Suchquellen bündelt, Belege als Momentaufnahmen sichert und kompatible APIs sowie eine MCP-Anbindung bietet.",
						meta: ["Python", "Docker", "MIT-Lizenz"],
						links: [
							["https://github.com/Amiyadesi/search-gateway", "Quellcode und Betriebsanleitung"],
						],
					},
					{
						status: "public",
						statusLabel: "Öffentlich",
						title: "Gästebuch und Fehlermeldungen",
						description: "Hinterlasse einen Leseeindruck oder melde ein Problem. Bei Missbrauch, Datenschutz- oder Sicherheitsfragen kannst du mir auch mailen.",
						meta: ["Öffentliche Einträge", "Kontakt per E-Mail", "Persönliche Antwort"],
						links: [
							["https://blog.sayori.org/guestbook/", "Gästebuch öffnen"],
							["mailto:me@sayori.org", "E-Mail schreiben"],
						],
					},
				],
				sourceTitle: "Die öffentliche GeoScore-API und das interne Search Gateway sind getrennte Dienste",
				sourceBody: "Die GeoScore-API folgt ihrer öffentlichen Spezifikation, begrenzt Anfragen und prüft, ob Ziele öffentlich sind. Die Search-Gateway-Instanz bleibt meinen Websites und ihrer Wartung vorbehalten: keine geteilten Tokens, anonymen Aufrufe oder öffentlichen Kontingente.",
			},
			plans: {
				title: "Ideen für kleine Versuche",
				intro: "Das sind keine Produktzusagen. Einladungen und manuelle Prüfung sollen zuerst Bedarf, Missbrauchsrisiko und Wartungsaufwand zeigen.",
				items: [
					["invite", "Geplant auf Einladung", "Gegenseitige Websiteprüfung", "Private Blogs, Open-Source-Projektseiten und kleine Communitys mit GeoScore prüfen und die Befunde persönlich einordnen, mit nachvollziehbarer Reihenfolge der Korrekturen."],
					["invite", "Geplant auf Einladung", "Starthilfe für statische Websites", "Persönlichen und offenen Projekten beim Einrichten des Repositorys und beim Start auf Cloudflare Pages oder GitHub Pages helfen, mit Anleitung zur weiteren Pflege."],
					["invite", "Geplant auf Einladung", "Suchkontingent für Belege", "Ein kleines Search-Gateway-Kontingent für offene Dokumentation und Community-Recherchen, ohne anonyme Anmeldung oder massenhaftes Crawling."],
					["invite", "Geplant auf Einladung", "Weiterleitung von RSS-Meldungen", "Seltene RSS-Benachrichtigungen per E-Mail oder Webhook für kleine Websites ohne Abo-Funktion erproben, ohne Werbeversand."],
					["private", "Private Infrastruktur", "Kurzlebige Belegschnappschüsse", "Freien Objektspeicher lieber für kurzzeitige GeoScore-Belege nutzen, statt anonyme Uploads wieder zu öffnen."],
					["private", "Private Infrastruktur", "Verschlüsselte Sicherungen", "Im übrigen Speicher verschlüsselte Kopien von Konfiguration, Artikelquellen und wichtigen Daten ablegen und die Wiederherstellung üben."],
				],
			},
			boundaries: {
				title: "Nutzungsgrenzen und Abschaltregeln",
				intro: "Klare Grenzen verhindern, dass aus anfänglicher Begeisterung eine dauerhafte Betriebslast wird.",
				items: ["Betrieb nach Möglichkeit, ohne Garantie für Verfügbarkeit, Antwortzeiten oder dauerhafte Aufbewahrung.", "Öffentliche Dienste kommen möglichst ohne Anmeldung aus. Nötige Konten oder Datenspeicherung werden ausgewiesen.", "Missbrauch, hohe Crawlerlast, erschöpfte Kontingente oder Sicherheitsrisiken können zu Begrenzungen, Pausen oder Abschaltung führen.", "Private Speicher, interne Suchinstanzen und Verwaltungstokens werden nicht veröffentlicht.", "Kein anonymes Dateihosting, keine Massenwerbung, Notfallkommunikation oder risikoreichen Kontodienste.", "Missbrauch, Datenschutz- oder Sicherheitsfragen bitte an me@sayori.org melden."],
				asideTitle: "Warum nicht immer mehr Dienste?",
				asideBody: ["Jeder öffentliche Dienst braucht Domains, Überwachung, Updates, Missbrauchskontrolle und Wiederherstellung.", "Vorrang haben Dienste, die vorhandene Fähigkeiten nutzen, keine öffentlichen Uploads brauchen und sich begrenzen und abschalten lassen. Pausierte Versuche entferne ich von Startseite und Sucheinstiegen."],
				links: [
					["https://status.sayori.org/", "Status ansehen"],
					["mailto:me@sayori.org", "Kontakt zur Betreuung"],
				],
			},
			faq: {
				title: "Häufige Fragen",
				intro: "Hier geht es um aktuelle Software, Pläne und öffentliche Nutzungsgrenzen, nicht um den Kauf unveröffentlichter Produkte.",
				items: [
					["Was entwickelt Amiya_desi?", "Der Schwerpunkt liegt auf Websoftware wie GeoScore, daneben entstehen Godot-Spiele, Desktop- und Entwicklungswerkzeuge sowie Open-Source-Software."],
					["Gibt es Bezahlangebote?", "Nein. GeoScore ist kostenlos; Bezahlabos und eine Kasse gibt es hier nicht. Vor einem Verkauf veröffentliche ich Preise sowie Liefer-, Erstattungs- und Kündigungsbedingungen."],
					["Kann ich die GeoScore-API nutzen?", "Ja. Stabile öffentliche Endpunkte stehen in OpenAPI, aktuelle Limits in /api/meta. Geprüft werden öffentliche Hostnamen; die API ist kein Proxy für beliebige URLs."],
					["Kann ich ein Search-Gateway-Token beantragen?", "Es gibt keinen öffentlichen Antrag. Du kannst den Code selbst hosten. Kleine Versuche laufen mit persönlicher Einladung und klarem Kontingent."],
				],
			},
			footer: {
				text: "Amiya_desi · Unabhängige Softwareentwicklung · Stand: 2026-08-16",
				links: [
					["/de/", "Zurück zum Schreibtisch"],
					["https://blog.sayori.org/", "Blog"],
					["https://github.com/Amiyadesi", "GitHub"],
					["mailto:me@sayori.org", "Kontakt"],
				],
				label: "Fußnavigation",
			},
			navLabel: "Seitennavigation",
		},
		"pt-br": {
			documentTitle: "Software e serviços · A mesa de Amiya",
			description: "Software web, jogos em Godot, ferramentas de código aberto e serviços públicos que Amiya_desi desenvolve e mantém de forma independente.",
			siteName: "A mesa de Amiya",
			nav: [
				["#service-status", "Software atual"],
				["#planned-services", "Planos"],
				["#operating-boundaries", "Limites"],
			],
			hero: {
				eyebrow: "sayori.org / software e serviços",
				title: "Software e serviços de Amiya_desi",
				lead: "Software web, ferramentas de desenvolvimento e jogos em Godot que desenvolvo de forma independente.",
				note: "Meu principal SaaS é o GeoScore, gratuito no momento, sem assinatura paga nem cobrança pelo site. Os demais programas e jogos aparecem no estágio real de desenvolvimento.",
				legend: "Situação dos serviços",
				statuses: [
					["public", "No ar"],
					["source", "Hospedagem própria"],
					["invite", "Plano por convite"],
					["private", "Infraestrutura privada"],
				],
			},
			current: {
				title: "Software e projetos atuais",
				intro: "Software disponível tem link direto; projetos para hospedagem própria têm link para o código. Não apresento projetos inéditos como produtos já à venda.",
				items: [
					{
						status: "public",
						statusLabel: "SaaS atual",
						title: "GeoScore",
						description: "Auditorias de SEO e GEO de páginas públicas com base em evidências: perfil do site, Evidence Map, correções prioritárias e relatório em Markdown.",
						meta: ["Gratuito no momento", "Sem cadastro", "Licença MIT"],
						links: [
							["https://geo.sayori.org/", "Abrir serviço"],
							["https://github.com/Amiyadesi/geoscore", "Ver código"],
						],
					},
					{
						status: "public",
						statusLabel: "Software público",
						title: "Relakeep",
						description: "Organiza localmente as relações entre e-mails, contas, chips SIM, assinaturas e cartões, com backup criptografado e sincronização própria.",
						meta: ["Uso local gratuito", "Armazenamento criptografado", "Hospedagem própria"],
						links: [
							["https://atlas.sayori.org/en", "Abrir site"],
							["https://github.com/Amiyadesi/amiya-atlas", "Ver código"],
						],
					},
					{
						status: "public",
						statusLabel: "No ar",
						title: "Amiya Whiteboard",
						description: "Quadro branco leve no navegador para esboços, diagramas e explicações sobre a estrutura de uma página.",
						meta: ["Sem conta", "Esboços temporários", "Salve seu trabalho"],
						links: [
							["https://board.sayori.org/", "Abrir quadro"],
						],
					},
					{
						status: "public",
						statusLabel: "No ar",
						title: "Diretório de recursos",
						description: "Ferramentas, referências, comunidades e sites de código aberto por categoria, com busca interna e externa.",
						meta: ["Sem conta", "Índice por categoria", "Atualização contínua"],
						links: [
							["https://nav.sayori.org/", "Abrir diretório"],
						],
					},
					{
						status: "public",
						statusLabel: "No ar",
						title: "API pública de auditoria do GeoScore",
						description: "Auditorias verificáveis de domínios públicos, dados do PageSpeed, Evidence Map e FixPack por endpoints SSE e JSON com limites de uso.",
						meta: ["OpenAPI 3.1", "Somente alvos públicos", "Cota limitada"],
						links: [
							["https://geo-api.sayori.org/openapi.json", "Ver OpenAPI"],
							["https://geo.sayori.org/docs", "Ler os guias"],
						],
					},
					{
						status: "public",
						statusLabel: "No ar",
						title: "Artigos públicos e RSS",
						description: "Notas sobre sites, hospedagem própria, Cloudflare, Godot, desenvolvimento com IA e retrospectivas, na web e via RSS.",
						meta: ["Sem conta", "Citação pública permitida", "Atualização contínua"],
						links: [
							["https://blog.sayori.org/", "Abrir blog"],
							["https://blog.sayori.org/rss.xml", "Assinar por RSS"],
						],
					},
					{
						status: "source",
						statusLabel: "Hospedagem própria",
						title: "Search Gateway",
						description: "Projeto de código aberto que reúne fontes de busca, guarda registros das evidências e oferece APIs compatíveis e integração MCP.",
						meta: ["Python", "Docker", "Licença MIT"],
						links: [
							["https://github.com/Amiyadesi/search-gateway", "Código e guia de implantação"],
						],
					},
					{
						status: "public",
						statusLabel: "No ar",
						title: "Livro de visitas e relatos de problemas",
						description: "Deixe uma impressão de leitura ou relate um problema. Para casos de abuso, privacidade ou segurança, você também pode enviar um e-mail.",
						meta: ["Recados públicos", "Contato por e-mail", "Resposta pessoal"],
						links: [
							["https://blog.sayori.org/guestbook/", "Abrir livro de visitas"],
							["mailto:me@sayori.org", "Enviar e-mail"],
						],
					},
				],
				sourceTitle: "A API pública do GeoScore e o Search Gateway interno têm limites distintos",
				sourceBody: "A API do GeoScore segue a documentação pública, limita as chamadas e verifica se os alvos são públicos. A instância do Search Gateway é reservada aos meus sites e à manutenção: sem tokens compartilhados, chamadas anônimas ou cotas públicas.",
			},
			plans: {
				title: "Ideias para testar em pequena escala",
				intro: "Não são produtos prometidos. Convites e revisão manual permitem medir a demanda, o risco de abuso e o custo de manutenção antes de assumir um compromisso.",
				items: [
					["invite", "Plano por convite", "Troca de auditorias de sites", "Avaliar blogs pessoais, páginas de projetos abertos e pequenas comunidades com GeoScore e acrescentar revisão humana e uma ordem verificável de correções."],
					["invite", "Plano por convite", "Ajuda para publicar sites estáticos", "Ajudar projetos pessoais ou abertos a preparar o repositório, publicar no Cloudflare Pages ou GitHub Pages e documentar a manutenção."],
					["invite", "Plano por convite", "Cota de busca para verificar fontes", "Uma pequena cota do Search Gateway para verificar documentação aberta ou pesquisar para comunidades, sem cadastro anônimo nem coleta em massa."],
					["invite", "Plano por convite", "Encaminhamento de avisos RSS", "Testar avisos de baixa frequência do RSS por e-mail ou webhook para pequenos sites sem ferramenta de assinatura, sem campanhas de marketing."],
					["private", "Infraestrutura privada", "Registros temporários de evidências", "Priorizar o armazenamento de objetos ocioso para registros temporários do GeoScore, em vez de reabrir uploads anônimos."],
					["private", "Infraestrutura privada", "Backups criptografados", "Usar o espaço restante para cópias criptografadas da configuração, dos artigos originais e de dados críticos, com testes de restauração."],
				],
			},
			boundaries: {
				title: "Limites de uso e critérios de suspensão",
				intro: "Deixar os limites claros desde o início evita que o entusiasmo vire uma carga permanente de manutenção.",
				items: ["Manutenção na medida do possível, sem garantia de disponibilidade, prazo de resposta ou retenção permanente.", "Serviços públicos evitam cadastro. Quando uma conta ou dados salvos forem necessários, isso será informado.", "Abuso, carga de rastreadores, cotas esgotadas ou riscos de segurança podem levar a limites, pausas ou encerramento.", "Armazenamento privado, instâncias de busca internas e tokens de administração não são recursos públicos.", "Sem hospedagem anônima de arquivos, disparos de marketing, comunicações de emergência ou serviços de contas de alto risco.", "Relatos de abuso, privacidade e segurança: me@sayori.org."],
				asideTitle: "Por que não acrescentar mais serviços?",
				asideBody: ["Cada serviço acrescenta domínios, monitoramento, atualizações, tratamento de abuso e recuperação de falhas.", "Priorizo serviços que sei manter, sem uploads públicos, fáceis de limitar e desativar. Experimentos pausados saem da página inicial e dos pontos de acesso da busca."],
				links: [
					["https://status.sayori.org/", "Ver status"],
					["mailto:me@sayori.org", "Falar com o responsável"],
				],
			},
			faq: {
				title: "Perguntas frequentes",
				intro: "Esta página descreve o software atual, os planos e os limites públicos; não oferece compra de produtos inéditos.",
				items: [
					["O que Amiya_desi desenvolve?", "Principalmente software web como o GeoScore, além de jogos em Godot, ferramentas de desktop e desenvolvimento e software de código aberto."],
					["Há planos pagos?", "Não. O GeoScore é gratuito, sem assinatura paga nem cobrança no site. Antes de vender, publicarei preços e condições de entrega, reembolso e cancelamento."],
					["Posso chamar a API do GeoScore?", "Sim. Os endpoints públicos estáveis estão no OpenAPI, e os limites atuais, em /api/meta. A API verifica nomes de host públicos; não é um proxy de URLs arbitrárias."],
					["Posso pedir um token do Search Gateway?", "Não há pedido público. Você pode hospedar o código por conta própria. Os pequenos testes usam convites pessoais e cotas definidas."],
				],
			},
			footer: {
				text: "Amiya_desi · Desenvolvimento independente de software · Atualizado em 2026-08-16",
				links: [
					["/pt-br/", "Voltar à mesa"],
					["https://blog.sayori.org/", "Blog"],
					["https://github.com/Amiyadesi", "GitHub"],
					["mailto:me@sayori.org", "Contato"],
				],
				label: "Navegação do rodapé",
			},
			navLabel: "Navegação da página",
		},
	};

	const language = window.SayoriI18n?.language || document.documentElement.dataset.sayoriCurrentLanguage || "zh-Hans";
	const copy = CATALOG[language.startsWith("zh") ? "zh" : language.toLowerCase()] || CATALOG.en;

	function element(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function setMeta(selector, value) {
		const node = document.head.querySelector(selector);
		if (node) node.setAttribute("content", value);
	}

	function renderLinks(container, links) {
		container.replaceChildren();
		for (const [href, label] of links) {
			const link = element("a", "", label);
			link.href = href;
			if (/^https?:/i.test(href)) link.rel = "noopener";
			container.append(link);
		}
	}

	function renderPage() {
		document.title = copy.documentTitle;
		setMeta('meta[name="description"]', copy.description);
		setMeta('meta[property="og:site_name"]', copy.siteName);
		setMeta('meta[property="og:title"]', copy.documentTitle);
		setMeta('meta[property="og:description"]', copy.description);

		const brand = document.querySelector(".brand");
		brand?.replaceChildren(element("span", "brand-mark", "A"), document.createTextNode(copy.siteName));
		brand?.querySelector(".brand-mark")?.setAttribute("aria-hidden", "true");

		const topNav = document.querySelector(".top-nav");
		if (topNav) {
			topNav.replaceChildren();
			topNav.setAttribute("aria-label", copy.navLabel);
			for (const [href, label] of copy.nav) {
				const link = element("a", "", label);
				link.href = href;
				topNav.append(link);
			}
			topNav.append(window.SayoriI18n.createSelect());
		}

		document.querySelector(".eyebrow").textContent = copy.hero.eyebrow;
		document.querySelector(".hero-copy h1").textContent = copy.hero.title;
		document.querySelector(".lead").textContent = copy.hero.lead;
		document.querySelector(".hero-note").textContent = copy.hero.note;
		const statusKey = document.querySelector(".status-key");
		statusKey.setAttribute("aria-label", copy.hero.legend);
		statusKey.replaceChildren(...copy.hero.statuses.map(([status, label]) => {
			const stamp = element("span", "status-stamp", label);
			stamp.dataset.status = status;
			return stamp;
		}));

		document.getElementById("service-status-title").textContent = copy.current.title;
		document.querySelector("#service-status .section-heading p").textContent = copy.current.intro;
		const serviceGrid = document.querySelector(".service-grid");
		serviceGrid.replaceChildren(...copy.current.items.map((item) => {
			const card = element("article", "service-card");
			const stamp = element("span", "status-stamp", item.statusLabel);
			stamp.dataset.status = item.status;
			const meta = element("div", "service-meta");
			meta.append(...item.meta.map((value) => element("span", "", value)));
			const links = element("div", "service-links");
			renderLinks(links, item.links);
			card.append(stamp, element("h3", "", item.title), element("p", "", item.description), meta, links);
			return card;
		}));
		const sourceNote = document.querySelector(".source-note");
		sourceNote.replaceChildren(element("strong", "", copy.current.sourceTitle), document.createTextNode(copy.current.sourceBody));

		document.getElementById("planned-services-title").textContent = copy.plans.title;
		document.querySelector("#planned-services .section-heading p").textContent = copy.plans.intro;
		const planGrid = document.querySelector(".plan-grid");
		planGrid.replaceChildren(...copy.plans.items.map(([status, statusLabel, title, description]) => {
			const card = element("article", "plan-card");
			const stamp = element("span", "status-stamp", statusLabel);
			stamp.dataset.status = status;
			card.append(stamp, element("h3", "", title), element("p", "", description));
			return card;
		}));

		document.getElementById("operating-boundaries-title").textContent = copy.boundaries.title;
		document.querySelector("#operating-boundaries .section-heading p").textContent = copy.boundaries.intro;
		const boundaryList = document.querySelector(".boundary-list");
		boundaryList.replaceChildren(...copy.boundaries.items.map((value) => element("li", "", value)));
		const privateNote = document.querySelector(".private-note");
		const privateLinks = element("div", "service-links");
		renderLinks(privateLinks, copy.boundaries.links);
		privateNote.replaceChildren(
			element("h3", "", copy.boundaries.asideTitle),
			...copy.boundaries.asideBody.map((value) => element("p", "", value)),
			privateLinks,
		);

		document.getElementById("faq-title").textContent = copy.faq.title;
		document.querySelector('[aria-labelledby="faq-title"] .section-heading p').textContent = copy.faq.intro;
		const faqList = document.querySelector(".faq-list");
		faqList.replaceChildren(...copy.faq.items.map(([question, answer]) => {
			const details = element("details");
			details.append(element("summary", "", question), element("p", "", answer));
			return details;
		}));

		const footer = document.querySelector(".site-footer");
		footer.querySelector("p").textContent = copy.footer.text;
		const footerNav = footer.querySelector("nav");
		footerNav.setAttribute("aria-label", copy.footer.label);
		renderLinks(footerNav, copy.footer.links);
	}

	renderPage();
	if (new URLSearchParams(window.location.search).get("paper") === "0617") {
		import("/paper-material.js?v=20261126-playable").then(({ initPaperMaterial }) => {
			initPaperMaterial();
		}).catch(error => console.error("Abnormal page unavailable", error));
	}
	window.SayoriI18n?.ready?.();
})();
