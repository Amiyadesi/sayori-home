"use strict";

const form = document.getElementById("sign-form");
const nickname = document.getElementById("nickname");
const signedCopy = document.getElementById("signed-copy");
const cert = document.getElementById("certificate");
const name = document.querySelector("#signed-name bdi");
const status = document.getElementById("sign-status");
const url = document.getElementById("signed-url");

nickname.addEventListener("input", () => nickname.setCustomValidity(""));
form.addEventListener("submit", event => {
	event.preventDefault();
	const value = nickname.value.trim();
	if (!value) {
		nickname.setCustomValidity(form.dataset.blank);
		nickname.reportValidity();
		return;
	}
	name.textContent = value;
	status.textContent = "";
	signedCopy.hidden = false;
	cert.focus();
});
document.getElementById("copy").addEventListener("click", async () => {
	const copy = [name.textContent + " " + document.getElementById("signed-verb").textContent,
		document.getElementById("signed-oath").textContent, document.getElementById("signed-clause").textContent,
		url.href].join("\n");
	try {
		await navigator.clipboard.writeText(copy);
		status.textContent = form.dataset.copied;
	} catch {
		status.textContent = form.dataset.copyError;
	}
});
document.getElementById("print").addEventListener("click", () => {
	document.body.classList.add("printing-copy");
	try {
		window.print();
	} finally {
		document.body.classList.remove("printing-copy");
	}
});
document.getElementById("swear").disabled = false;
