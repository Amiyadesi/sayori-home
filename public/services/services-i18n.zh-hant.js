(() => {
	"use strict";

	const CATALOG = {
		zh: {
			documentTitle: "軟件與服務 · Amiya的書桌",
			description: "Godot 獨立遊戲開發者 Amiya_desi 維護的 Web 工具、開源項目與公開服務；品牌主線是獨立遊戲與創作工作臺。",
			siteName: "Amiya的書桌",
			nav: [
				["#service-status", "當前軟件"],
				["#planned-services", "計劃"],
				["#operating-boundaries", "邊界"],
			],
			hero: {
				eyebrow: "sayori.org / 軟件與服務",
				title: "Amiya_desi 的軟件與服務",
				lead: "獨立開發和維護 Web 工具、開源項目與 Godot 遊戲",
				note: "品牌主線是獨立遊戲與創作工作臺；GeoScore 等公開工具可按需使用，不代表主業方向。",
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
						status: "public", statusLabel: "公開工具", title: "GeoScore",
						description: "面向公開網頁的 SEO / GEO 事實審計。有免費額度；完整報告與持續監控等能力走 Site Pass（一次性）。",
						meta: ["公開工具", "有免費額度", "MIT 開源"],
						links: [["https://geo.sayori.org/", "打開服務"], ["https://github.com/Amiyadesi/geoscore", "查看源碼"]],
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
					["Amiya_desi 開發什麼", "主線是 Godot 獨立遊戲（時間機制 / 多窗口 / 敘事解謎），也維護網站、開源項目與公開旁路工具"],
					["現在有付費方案嗎", "無訂閱。GeoScore 提供免費額度；完整報告與持續監控等能力可走一次性 Site Pass，細則以產品頁爲準"],
					["可以調用 GeoScore API 嗎", "可以。穩定公開接口寫在 OpenAPI 文檔中，運行限制以 API 的 /api/meta 響應爲準。它只審查公開 hostname，不是任意 URL 代理"],
					["可以申請 Search Gateway Token 嗎", "當前沒有公開申請入口。源碼可以自行部署，小範圍試驗額度採用人工邀請和明確限額"],
				],
			},
			footer: {
				text: "Amiya_desi · Godot 獨立遊戲開發者 · 最後更新 2026-09-23",
				links: [["/", "返回書桌"], ["https://blog.sayori.org/", "博客"], ["https://github.com/Amiyadesi", "GitHub"], ["mailto:me@sayori.org", "聯繫"]],
				label: "頁腳導航",
			},
		},
		en: {
			documentTitle: "Software & Services · Amiya's Desk",
			description: "Web tools, open-source projects, and public services by Godot indie game developer Amiya_desi. The brand focus is indie games and a maker's desk.",
			siteName: "Amiya's Desk",
			nav: [["#service-status", "Current software"], ["#planned-services", "Plans"], ["#operating-boundaries", "Boundaries"]],
			hero: {
				eyebrow: "sayori.org / software and services",
				title: "Software and services by Amiya_desi",
				lead: "Independent tools, open-source projects, and Godot games",
				note: "The brand focus is indie games and a maker's desk—public utilities like GeoScore are optional side tools, not the main line.",
				legend: "Service status legend",
				statuses: [["public", "Public"], ["source", "Self-hostable"], ["invite", "Invitation plan"], ["private", "Private infrastructure"]],
			},
			current: {
				title: "Current software and projects",
				intro: "Available software gets a direct link; self-hostable projects get source links; unreleased projects are not presented as products already for sale",
				items: [
					{ status: "public", statusLabel: "Public tool", title: "GeoScore", description: "Fact-based SEO/GEO audits for public pages. Free quota available; full reports and monitoring need a one-time Site Pass.", meta: ["Public tool", "Free quota", "MIT licensed"], links: [["https://geo.sayori.org/", "Open service"], ["https://github.com/Amiyadesi/geoscore", "View source"]] },
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
					["What does Amiya_desi develop", "The main line is Godot indie games (time mechanics / multi-window / narrative puzzle), alongside websites, open-source projects, and optional public side tools"],
					["Are paid plans available now", "No subscription. GeoScore has a free quota; fuller reports and monitoring can use a one-time Site Pass—details on the product page"],
					["Can I call the GeoScore API", "Yes. Stable public endpoints are listed in the OpenAPI document, and current limits come from /api/meta. The API audits public hostnames and is not an arbitrary URL proxy"],
					["Can I request a Search Gateway token", "There is no public request flow. You can self-host the source. Small experiments use manual invitations and explicit quotas"],
				],
			},
			footer: {
				text: "Amiya_desi · Godot indie game developer · Updated 2026-09-23",
				links: [["/", "Back to desk"], ["https://blog.sayori.org/", "Blog"], ["https://github.com/Amiyadesi", "GitHub"], ["mailto:me@sayori.org", "Contact"]],
				label: "Footer navigation",
			},
		},
	};

	const language = window.SayoriI18n?.language === "en" || document.documentElement.dataset.sayoriCurrentLanguage === "en" ? "en" : "zh";
	const copy = CATALOG[language];

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
			topNav.setAttribute("aria-label", language === "zh" ? "頁面導航" : "Page navigation");
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
	window.SayoriI18n?.ready?.();
})();
