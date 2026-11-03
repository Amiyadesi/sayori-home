import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const blog = path.resolve(root, '../sayori-blog/.codex-tmp/p34-native-build');
await fs.access(path.join(blog, 'index.html')).catch(() => {
  throw new Error('先在 sayori-blog 运行 pnpm exec astro build --outDir .codex-tmp/p34-native-build');
});
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
for (const [folder, port] of [[path.join(root, 'public'), 8970], [blog, 8971]]) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/analytics/event') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    try {
      const url = new URL(req.url, 'http://preview');
      const file = path.resolve(folder, '.' + decodeURIComponent(url.pathname));
      if (!file.startsWith(folder + path.sep) && file !== folder) { res.writeHead(403); res.end(); return; }
      const stat = await fs.stat(file);
      const target = stat.isDirectory() ? path.join(file, 'index.html') : file;
      const ext = path.extname(target);
      let body = await fs.readFile(target);
      if (['.html', '.js', '.json'].includes(ext)) body = body.toString().replaceAll('https://blog.sayori.org', 'http://127.0.0.1:8971').replaceAll('https://sayori.org', 'http://127.0.0.1:8970');
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') { res.writeHead(404); res.end('Not found'); }
      else if (error instanceof URIError) { res.writeHead(400); res.end('Invalid path'); }
      else { console.error(error); res.writeHead(500); res.end('Preview failed'); }
    }
  });
  server.listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/?paper=0617`));
  server.on('error', error => { console.error(error); process.exitCode = 1; });
}
