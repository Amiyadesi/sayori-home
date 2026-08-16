(() => {
	"use strict";

	const CATALOG = {
		zh: {
			documentTitle: "软件与服务 · Amiya的书桌",
			description: "独立软件开发者 Amiya_desi 开发和维护的 Web 软件、Godot 游戏、开源工具与公开服务。",
			siteName: "Amiya的书桌",
			nav: [
				["#service-status", "当前软件"],
				["#planned-services", "计划"],
				["#operating-boundaries", "边界"],
			],
			hero: {
				eyebrow: "sayori.org / 软件与服务",
				title: "Amiya_desi 的软件与服务",
				lead: "独立开发和维护 Web 软件服务、开发者工具与 Godot 游戏",
				note: "GeoScore 是当前主要 SaaS，现阶段免费开放，没有付费订阅或站内结账。其他软件和游戏按真实开发进度展示",
				legend: "服务状态说明",
				statuses: [
					["public", "公开运行"],
					["source", "开源自部署"],
					["invite", "邀请制计划"],
					["private", "私有基础设施"],
				],
			},
			current: {
				title: "当前软件与项目",
				intro: "可用软件给出直接入口；适合自行部署的项目给出源码；尚未发行的项目不会伪装成已经销售的产品",
				items: [
					{
						status: "public", statusLabel: "当前 SaaS", title: "GeoScore",
						description: "面向公开网页的 SEO 与 GEO 事实审计，提供站点画像、Evidence Map、优先修复项和 Markdown 报告",
						meta: ["当前免费", "无需注册", "MIT 开源"],
						links: [["https://geo.sayori.org/", "打开服务"], ["https://github.com/Amiyadesi/geoscore", "查看源码"]],
					},
					{
						status: "public", statusLabel: "公开运行", title: "Amiya 的白板",
						description: "无需注册的轻量浏览器白板，适合临时画图、整理草图和讲清楚一个页面结构",
						meta: ["无需账号", "临时草图", "自行保存"],
						links: [["https://board.sayori.org/", "打开白板"]],
					},
					{
						status: "public", statusLabel: "公开运行", title: "资源导航",
						description: "按分类整理常用工具、资料、社区和开源站点，支持站内与外部搜索",
						meta: ["无需账号", "分类索引", "持续整理"],
						links: [["https://nav.sayori.org/", "打开导航"]],
					},
					{
						status: "public", statusLabel: "公开运行", title: "GeoScore 公开审计 API",
						description: "为公开域名提供事实审计、PageSpeed 证据、Evidence Map 与 FixPack 接口，使用 SSE 和 JSON 返回可复验结果",
						meta: ["OpenAPI 3.1", "公网目标限定", "有限额度"],
						links: [["https://geo-api.sayori.org/openapi.json", "查看 OpenAPI"], ["https://geo.sayori.org/docs", "阅读使用文档"]],
					},
					{
						status: "public", statusLabel: "公开运行", title: "公开技术文章与 RSS",
						description: "记录建站、自托管、Cloudflare、Godot、AI 辅助开发和项目复盘。文章可以网页阅读，也可以通过 RSS 订阅",
						meta: ["无需账号", "允许公开引用", "持续整理"],
						links: [["https://blog.sayori.org/", "进入博客"], ["https://blog.sayori.org/rss.xml", "订阅 RSS"]],
					},
					{
						status: "source", statusLabel: "开源自部署", title: "Search Gateway",
						description: "统一多个搜索来源、保留证据快照，并提供兼容接口与 MCP 接入方式的开源项目",
						meta: ["Python", "Docker", "MIT 开源"],
						links: [["https://github.com/Amiyadesi/search-gateway", "源码与自部署文档"]],
					},
					{
						status: "public", statusLabel: "公开运行", title: "留言与问题反馈",
						description: "可以提交读后感、服务问题和改进建议。涉及滥用、隐私或安全的问题也可以直接发邮件",
						meta: ["公开留言", "邮件联系", "人工处理"],
						links: [["https://blog.sayori.org/guestbook/", "打开留言板"], ["mailto:me@sayori.org", "发送邮件"]],
					},
				],
				sourceTitle: "公开 GeoScore API 与内部 Search Gateway 是两套边界",
				sourceBody: "GeoScore API 可以按公开文档调用，并受线上限流和公网目标校验约束。Search Gateway 实例只供站长自己的站点与维护任务使用，不开放共享 Token、匿名调用或公共额度",
			},
			plans: {
				title: "适合小范围试验的方向",
				intro: "这些不是已经承诺上线的产品，只是更值得占用维护精力的低风险方向。先通过邀请和人工审核验证需求，再决定是否长期提供",
				items: [
					["invite", "邀请制计划", "网站体检互助", "为个人博客、开源项目页和小型社区主页跑一次 GeoScore，再补充人工判断和可复验的修复顺序"],
					["invite", "邀请制计划", "静态站上线协助", "帮助个人或开源项目整理仓库、部署 Cloudflare Pages 或 GitHub Pages，并留下可自行维护的文档"],
					["invite", "邀请制计划", "搜索证据额度", "给开源文档核对或社区资料整理提供少量 Search Gateway 查询额度，不开放匿名注册和批量抓取"],
					["invite", "邀请制计划", "RSS 通知中转", "为缺少订阅能力的小站试验 RSS 到邮件或 Webhook 的低频通知，不处理营销群发"],
					["private", "私有基础设施", "短期证据快照", "优先考虑把闲置对象存储用于 GeoScore 的短期证据快照，而不是重新开放匿名文件上传"],
					["private", "私有基础设施", "加密备份", "把剩余存储用于站点配置、文章源和关键数据的加密备份，保留恢复演练记录"],
				],
			},
			boundaries: {
				title: "使用边界与停止规则",
				intro: "小型个人服务只有把边界讲清楚，才不会因为一时热情变成长期失控的维护债",
				items: [
					"服务按尽力而为原则维护，不承诺可用性、响应时间或永久保存",
					"公开服务优先不要求注册，确需账号或数据保存时会单独说明",
					"遇到滥用、爬虫压力、额度耗尽或安全风险时可以限流、暂停或关闭",
					"不会把私有存储、内部搜索实例或管理 Token 当成公共资源发布",
					"不提供匿名文件托管、营销群发、紧急通信或高风险账户服务",
					"滥用、隐私与安全问题统一联系 me@sayori.org",
				],
				asideTitle: "为什么不继续堆服务",
				asideBody: [
					"每多一个公开入口，都意味着域名、监控、依赖更新、垃圾内容处理和故障恢复",
					"因此优先保留能复用现有能力、没有公开上传面、可以限额并且容易下线的服务。暂停的实验不会继续出现在首页和搜索入口里",
				],
				links: [["https://status.sayori.org/", "查看运行状态"], ["mailto:me@sayori.org", "联系维护者"]],
			},
			faq: {
				title: "常见问题",
				intro: "这个页面描述当前软件、业务方向和公开边界，不是尚未发布产品的购买承诺",
				items: [
					["Amiya_desi 开发什么", "目前以 GeoScore 这类 Web 软件服务为主，也开发 Godot 游戏、桌面与开发者工具和开源软件"],
					["现在有付费方案吗", "没有。GeoScore 当前免费开放，网站没有付费订阅或结账。未来上线收费方案或软件销售时，会先公开价格、交付、退款和取消规则"],
					["可以调用 GeoScore API 吗", "可以。稳定公开接口写在 OpenAPI 文档中，运行限制以 API 的 /api/meta 响应为准。它只审查公开 hostname，不是任意 URL 代理"],
					["可以申请 Search Gateway Token 吗", "当前没有公开申请入口。源码可以自行部署，小范围试验额度采用人工邀请和明确限额"],
				],
			},
			footer: {
				text: "Amiya_desi · 独立软件开发者 · 最后更新 2026-08-16",
				links: [["/", "返回书桌"], ["https://blog.sayori.org/", "博客"], ["https://github.com/Amiyadesi", "GitHub"], ["mailto:me@sayori.org", "联系"]],
				label: "页脚导航",
			},
		},
		en: {
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
	};

	const language = window.SayoriI18n?.language === "en" || document.documentElement.dataset.sayoriCurrentLanguage === "en" ? "en" : "zh";
	const copy = CATALOG[language];
	const nextLanguage = language === "zh" ? "en" : "zh";

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
			topNav.setAttribute("aria-label", language === "zh" ? "页面导航" : "Page navigation");
			for (const [href, label] of copy.nav) {
				const link = element("a", "", label);
				link.href = href;
				topNav.append(link);
			}
			const languageLink = element("a", "", nextLanguage === "zh" ? "中文" : "EN");
			languageLink.href = "/services/";
			languageLink.lang = nextLanguage === "zh" ? "zh-CN" : "en";
			languageLink.dataset.sayoriLanguage = nextLanguage;
			topNav.append(languageLink);
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
