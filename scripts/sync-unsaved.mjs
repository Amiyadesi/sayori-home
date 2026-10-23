import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2).filter((arg) => arg !== "--check");
if (args.length > 1 || args.some((arg) => arg.startsWith("--")))
  throw new Error(
    "Usage: node scripts/sync-unsaved.mjs [blog-checkout] [--check]",
  );
const blog = resolve(args[0] || resolve(root, "../sayori-blog"));
if (
  !existsSync(resolve(blog, "src/components/features/posts/DeskIntro.astro"))
) {
  throw new Error(
    "Pass the sayori-blog checkout path, not its public directory.",
  );
}
const files = ["app.js", "core.js", "sites.js", "game.css"];
const target = resolve(blog, "public/unsaved");
mkdirSync(target, { recursive: true });
for (const file of files) {
  const source = resolve(root, "public/unsaved", file);
  const destination = resolve(target, file);
  // Keep the blog's authored HTML; only these shared runtime files have a canonical home copy.
  if (process.argv.includes("--check")) {
    if (readFileSync(source, "utf8") !== readFileSync(destination, "utf8"))
      throw new Error(`Shared file drift: ${file}`);
  } else copyFileSync(source, destination);
}
console.log(
  `${process.argv.includes("--check") ? "Verified" : "Copied"} four shared ARG files. No HTML, production config, or remote state changed.`,
);
