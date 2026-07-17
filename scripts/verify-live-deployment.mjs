import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export async function verifyHomeDeployment(
	baseUrl,
	expected,
	{ fetchImpl = fetch, attempts = 12, delayMs = 5_000 } = {},
) {
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			const root = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
			const manifestResponse = await requireOk(fetchImpl, new URL("deployment.json", root));
			const manifest = await manifestResponse.json();
			for (const [key, value] of Object.entries(expected)) {
				if (manifest[key] !== value) throw new Error(`deployment manifest mismatch for ${key}`);
			}
			const home = await requireOk(fetchImpl, root);
			if ((await home.text()).length < 100) throw new Error("home page is unexpectedly small");
			return;
		} catch (error) {
			lastError = error;
			if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
	throw lastError;
}

async function requireOk(fetchImpl, url) {
	const response = await fetchImpl(url);
	if (!response.ok) throw new Error(`${url.pathname} returned HTTP ${response.status}`);
	return response;
}

function required(name) {
	const value = String(process.env[name] || "").trim();
	if (!value) throw new Error(`${name} is required`);
	return value;
}

const isMain = process.argv[1]
	&& path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
	await verifyHomeDeployment(process.argv[2] || "https://sayori.org", {
		codeSha: required("DEPLOYMENT_CODE_SHA"),
		contentSha: required("DEPLOYMENT_CONTENT_SHA"),
		builtAt: required("DEPLOYMENT_BUILT_AT"),
		workflowRun: required("DEPLOYMENT_WORKFLOW_RUN"),
	});
	console.log("[deployment-smoke] Home page and deployment manifest passed");
}
