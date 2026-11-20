import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const page = fs.readFileSync(path.join(root, "public/manifesto/index.html"), "utf8");
const registry = JSON.parse(fs.readFileSync(path.join(root, "public/manifesto/signers.json"), "utf8"));
const template = fs.readFileSync(path.join(root, ".github/ISSUE_TEMPLATE/creative-manifesto-signature.yml"), "utf8");

test("creative manifesto retains its stable public route and author credit", () => {
  assert.match(page, /https:\/\/sayori\.org\/manifesto\//);
  assert.match(page, /创作自由宣言/);
  assert.match(page, /Amiya_desi × 栖弦（Lyra）/);
});

test("the public signer registry has unique non-empty public names", () => {
  assert.equal(registry.version, 1);
  assert.ok(Array.isArray(registry.signers));
  assert.ok(registry.signers.length > 0);
  const names = new Set();
  for (const signer of registry.signers) {
    assert.equal(typeof signer.name, "string");
    assert.ok(signer.name.trim());
    assert.ok(signer.name.length <= 80);
    assert.ok(!names.has(signer.name), `duplicate signer: ${signer.name}`);
    names.add(signer.name);
    if (signer.github !== undefined) {
      assert.match(signer.github, /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i);
    }
    assert.doesNotMatch(JSON.stringify(signer), /@(?:gmail|outlook|qq)\.com/i);
  }
});

test("joining the public roster stays an explicit opt-in review flow", () => {
  assert.match(template, /公开署名确认/);
  assert.match(template, /required: true/);
  assert.match(page, /creative-manifesto-signature\.yml/);
  assert.match(page, /signers\.json/);
  assert.match(page, /本地签署/);
  assert.doesNotMatch(page, /localStorage\.setItem\(/);
});
