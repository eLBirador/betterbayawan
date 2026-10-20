import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function run(script, args = [], cwd = root) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
if (process.argv.includes('--no-react'))
  throw new Error('React is required for the homepage. Use npm run build.');
if (!process.argv.includes('--no-bump'))
  run(path.join(root, 'scripts/bump-version.js'), [
    process.argv.find((arg) => ['major', 'minor', 'patch'].includes(arg)) || 'patch',
  ]);
run(path.join(root, 'scripts/prepare-react.mjs'));
run(
  path.join(root, 'react-app/node_modules/next/dist/bin/next'),
  ['build'],
  path.join(root, 'react-app')
);

// Stage the complete build before replacing dist, so failed builds retain the last output.
const stage = path.join(root, '.build-stage');
const dist = path.join(root, 'dist');
for (const target of [stage, dist]) {
  if (path.dirname(path.resolve(target)) !== root)
    throw new Error('Build target must stay directly inside the workspace.');
}
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
run(path.join(root, 'scripts/copy-dist.js'), [root, stage]);
fs.cpSync(path.join(root, 'react-app/out'), stage, { recursive: true });
// React owns these routes, including requests with a trailing slash.
for (const route of ['services']) {
  fs.copyFileSync(
    path.join(root, 'react-app/out', `${route}.html`),
    path.join(stage, route, 'index.html')
  );
}
// These literal, workspace-contained directories are the only build replacement targets.
fs.rmSync(dist, { recursive: true, force: true });
fs.renameSync(stage, dist);
console.log(
  'Built dist/: React homepage, services, and health; remaining portal routes preserved.'
);
