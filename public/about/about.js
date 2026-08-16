(() => {
	'use strict';

	const LANG = window.SayoriI18n?.language || document.documentElement.dataset.sayoriCurrentLanguage || (document.documentElement.lang?.startsWith('zh') ? 'zh' : 'en');
	const DATA_URL = `/assets/data/about-${LANG}.json`;
	const FALLBACK_URL = `/assets/data/about-${LANG === 'zh' ? 'en' : 'zh'}.json`;

	const $ = (id) => document.getElementById(id);

	function setText(node, value) {
		if (node && typeof value === 'string') node.textContent = value;
	}

	function safeHref(href) {
		if (typeof href !== 'string') return '#';
		if (/^(https?:|mailto:|\/)/i.test(href)) return href;
		return '#';
	}

	/* Render text with optional {label, href} link substitutions, like the home page. */
	function appendRichText(parent, item) {
		if (typeof item === 'string') {
			parent.textContent = item;
			return;
		}
		if (!item || typeof item !== 'object') return;
		const text = String(item.text || '');
		const links = Array.isArray(item.links) ? item.links : [];
		if (!links.length) {
			parent.textContent = text;
			return;
		}
		let cursor = 0;
		for (const linkDef of links) {
			const label = String(linkDef?.label || '');
			const idx = label ? text.indexOf(label, cursor) : -1;
			if (idx < 0) continue;
			parent.append(text.slice(cursor, idx));
			const link = document.createElement('a');
			link.href = safeHref(linkDef.href);
			link.target = '_blank';
			link.rel = 'noopener';
			link.textContent = label;
			parent.append(link);
			cursor = idx + label.length;
		}
		parent.append(text.slice(cursor));
	}

	function renderMeta(meta) {
		if (!meta) return;
		if (typeof meta.title === 'string') document.title = meta.title;
		const desc = document.querySelector('meta[name="description"]');
		if (desc && typeof meta.description === 'string') desc.setAttribute('content', meta.description);
	}

	function renderLetter(letter) {
		if (!letter) return;
		const paper = $('main-content');
		if (paper && letter.ariaLabel) paper.setAttribute('aria-label', letter.ariaLabel);

		const back = $('letter-back');
		if (back) {
			setText(back, letter.backLabel);
			if (letter.backHref) back.href = safeHref(letter.backHref);
		}

		setText($('letter-kicker'), letter.kicker);
		setText($('letter-title'), letter.title);
		setText($('letter-stamp'), letter.dateStamp);
		setText($('letter-intro'), letter.intro);

		const wrap = $('letter-sections');
		if (wrap && Array.isArray(letter.sections)) {
			wrap.replaceChildren();
			for (const section of letter.sections) {
				if (!section || typeof section !== 'object') continue;
				const sec = document.createElement('section');
				sec.className = 'letter-section';
				if (section.heading) {
					const h = document.createElement('h2');
					h.textContent = section.heading;
					sec.append(h);
				}
				for (const para of Array.isArray(section.paragraphs) ? section.paragraphs : []) {
					const p = document.createElement('p');
					appendRichText(p, para);
					sec.append(p);
				}
				if (typeof section.code === 'string' && section.code.trim()) {
					const code = document.createElement('code');
					code.className = 'letter-code';
					code.textContent = section.code;
					sec.append(code);
				}
				if (typeof section.intro === 'string' && section.intro.trim()) {
					const p = document.createElement('p');
					p.className = 'letter-list-intro';
					p.textContent = section.intro;
					sec.append(p);
				}
				if (Array.isArray(section.items) && section.items.length) {
					const ul = document.createElement('ul');
					ul.className = 'letter-list';
					for (const item of section.items) {
						const li = document.createElement('li');
						appendRichText(li, item);
						ul.append(li);
					}
					sec.append(ul);
				}
				wrap.append(sec);
			}
		}

		if (letter.signature) {
			setText($('sign-line'), letter.signature.line);
			const ps = $('letter-ps');
			if (ps && typeof letter.signature.ps === 'string') {
				ps.textContent = letter.signature.ps;
			}
		}
	}

	function renderFaq(faq) {
		const section = $('letter-faq');
		if (!section) return;
		const items = Array.isArray(faq?.items) ? faq.items : [];
		if (!items.length) {
			section.hidden = true;
			return;
		}
		setText($('faq-title'), faq.title);
		const wrap = $('faq-items');
		wrap.replaceChildren();
		for (const item of items) {
			if (!item?.question || !item?.answer) continue;
			const details = document.createElement('details');
			const summary = document.createElement('summary');
			const answer = document.createElement('p');
			summary.textContent = item.question;
			answer.textContent = item.answer;
			details.append(summary, answer);
			wrap.append(details);
		}
	}

	function renderContact(contact) {
		if (!contact) return;
		setText($('contact-title'), contact.title);
		const email = $('contact-email');
		if (email && contact.email) {
			email.textContent = contact.email;
			email.title = contact.emailLabel || '';
			email.addEventListener('click', async (event) => {
				event.preventDefault();
				try {
					await navigator.clipboard.writeText(contact.email);
					const original = contact.email;
					email.textContent = '✓ ' + original;
					window.setTimeout(() => { email.textContent = original; }, 1400);
				} catch {
					window.location.href = `mailto:${contact.email}`;
				}
			});
		}
		const wrap = $('contact-links');
		if (wrap && Array.isArray(contact.links)) {
			wrap.replaceChildren();
			if (contact.linksAriaLabel) wrap.setAttribute('aria-label', contact.linksAriaLabel);
			for (const item of contact.links) {
				if (!item?.href || !item?.label) continue;
				const link = document.createElement('a');
				link.href = safeHref(item.href);
				link.target = '_blank';
				link.rel = 'noopener';
				link.textContent = item.label;
				wrap.append(link);
			}
		}
	}

	function buildFaqSchema(faq) {
		const items = Array.isArray(faq?.items) ? faq.items : [];
		if (!items.length) return;
		const graph = {
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			'@id': 'https://sayori.org/about/#faq',
			url: 'https://sayori.org/about/',
			name: faq.title || 'FAQ',
			mainEntity: items.map((item) => ({
				'@type': 'Question',
				name: item.question,
				acceptedAnswer: { '@type': 'Answer', text: item.answer },
			})),
		};
		const script = document.createElement('script');
		script.type = 'application/ld+json';
		script.textContent = JSON.stringify(graph);
		document.head.append(script);
	}

	function updateFootLink() {
		setText($('foot-notice'), LANG === 'zh' ? 'Amiya_desi · 独立软件开发者' : 'Amiya_desi · Independent software developer');
		const link = document.querySelector('.desk-foot a[data-sayori-language]');
		if (!link) return;
		const next = LANG === 'zh' ? 'en' : 'zh';
		link.dataset.sayoriLanguage = next;
		link.lang = next === 'zh' ? 'zh-CN' : 'en';
		link.textContent = next === 'zh' ? '中文' : 'EN';
	}

	async function loadData() {
		try {
			const res = await fetch(DATA_URL, { cache: 'default' });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} catch {
			const res = await fetch(FALLBACK_URL, { cache: 'default' });
			if (!res.ok) return null;
			return res.json();
		}
	}

	async function init() {
		const data = await loadData();
		if (data) {
			renderMeta(data.meta);
			renderLetter(data.letter);
			renderFaq(data.faq);
			renderContact(data.contact);
			buildFaqSchema(data.faq);
		}
		updateFootLink();
		window.SayoriI18n?.ready?.();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once: true });
	} else {
		init();
	}
})();
