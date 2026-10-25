import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

export function createStaticServer(directory) {
  const root = path.resolve(directory);
  const redirectsFile = path.join(root, 'data', 'redirects.json');
  const redirects = fs.existsSync(redirectsFile)
    ? JSON.parse(fs.readFileSync(redirectsFile, 'utf8'))
    : {};
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const cleanPath = pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (redirects[cleanPath]) {
      const query = new URL(req.url, 'http://localhost').search;
      res.writeHead(301, { Location: redirects[cleanPath] + query }).end();
      return;
    }
    const base = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, base);
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      relative.split(path.sep).some((part) => part.startsWith('.') || part === 'node_modules')
    ) {
      res.writeHead(403).end();
      return;
    }
    const candidates = [base, base.replace(/[\\/]$/, '') + '.html', path.join(base, 'index.html')];
    const file = candidates.find(
      (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    );
    const fallback = path.join(root, '404.html');
    if (!file && !fs.existsSync(fallback)) {
      res.writeHead(404).end('Not found');
      return;
    }
    const target = file || fallback;
    res.writeHead(file ? 200 : 404, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(target).pipe(res);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createStaticServer(process.argv[2] || 'dist');
  const port = Number(process.env.PORT || 8080);
  server.listen(port, process.env.HOST || '127.0.0.1', () =>
    console.log(`Preview: http://localhost:${port}`)
  );
}
