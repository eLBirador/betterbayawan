import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './build-site.mjs';
import { createStaticServer } from './static-server.mjs';
function rebuild() {
  // A fresh process reloads JSON and route metadata rather than retaining module caches.
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Build failed; check the source error above.');
}
rebuild();
const port = Number(process.env.PORT || 3000);
createStaticServer(path.join(root, 'dist')).listen(port, '127.0.0.1', () =>
  console.log(`Development: http://localhost:${port}`)
);
let timer;
for (const dir of ['pages', 'layouts', 'assets', 'data', 'locales'])
  fs.watch(path.join(root, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        rebuild();
      } catch (error) {
        console.error(error.message);
      }
    }, 250);
  });
