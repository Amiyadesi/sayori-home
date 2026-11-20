"use strict";

const applyForm = document.getElementById("public-apply");
const removeForm = document.getElementById("public-remove");
const messages = JSON.parse(applyForm.dataset.messages);
const receiptPanel = document.getElementById("receipt-panel");
const receiptText = document.getElementById("receipt-value");
const nickname = document.getElementById("public-nickname");
const consent = document.getElementById("public-consent");
let application;

function connect(form, payload, success) {
	const button = form.querySelector('button[type="submit"]');
	const status = document.getElementById(form.id + "-status");
	form.addEventListener("submit", async event => {
		event.preventDefault();
		if (button.disabled) return;
		button.disabled = true;
		status.textContent = messages.sending;
		try {
			const body = payload();
			const response = await fetch(form.action, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const result = await response.json();
			if (!response.ok || result.ok !== true) {
				status.textContent = Object.hasOwn(messages, result.error) ? messages[result.error] : messages.unavailable;
				return;
			}
			status.textContent = "";
			success(body, status);
		} catch {
			status.textContent = messages.unavailable;
		} finally {
			button.disabled = false;
		}
	});
	button.disabled = false;
}

connect(applyForm, () => {
	const name = nickname.value.trim();
	if (application?.nickname !== name) {
		const receipt = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, "0")).join("");
		application = { action: "apply", nickname: name, receipt };
	}
	return { ...application, consent: consent.checked };
}, ({ receipt }) => {
	receiptText.textContent = receipt.match(/.{12}/g).join("-");
	receiptPanel.hidden = false;
	receiptPanel.focus();
	applyForm.hidden = true;
});

document.getElementById("copy-receipt").addEventListener("click", async () => {
	const status = document.getElementById("receipt-status");
	try {
		await navigator.clipboard.writeText(receiptText.textContent);
		status.textContent = messages.receiptCopied;
	} catch {
		status.textContent = messages.receiptCopyError;
	}
});

const removeCode = document.getElementById("remove-code");
connect(removeForm, () => ({ action: "remove", receipt: removeCode.value.replace(/[\s-]/g, "").toLowerCase() }), (_, status) => {
	removeForm.reset();
	status.textContent = messages.removed;
});
