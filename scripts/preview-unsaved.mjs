import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const blog = resolve(process.argv[2] || resolve(root, "../sayori-blog"));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
const servers = [];
for (const [port, repo] of [
  [4321, blog],
  [4322, root],
]) {
  const publicRoot = resolve(repo, "public");
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let file = resolve(publicRoot, "." + pathname);
      if (file !== publicRoot && !file.startsWith(publicRoot + sep)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      });
      res.end(body);
    } catch (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 400, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(error.code === "ENOENT" ? "Not found" : "Invalid local request");
    }
  });
  server.on("error", (error) => {
    console.error(`Cannot listen on ${port}: ${error.message}`);
    servers.forEach((item) => item.close());
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Local ${port === 4321 ? "blog" : "home"}: http://127.0.0.1:${port}/unsaved/`,
    ),
  );
  servers.push(server);
}
process.on("SIGINT", () => {
  servers.forEach((server) => server.close());
});
