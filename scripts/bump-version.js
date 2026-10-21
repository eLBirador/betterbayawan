// Explicit release utility. Normal builds never modify versions or source pages.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const save = (name, value) =>
  fs.writeFileSync(path.join(root, name), JSON.stringify(value, null, 2) + '\n');
const version = read('version.json');
const kind = process.argv[2];
if (!kind) {
  console.log(version.version);
} else {
  if (!['major', 'minor', 'patch'].includes(kind)) throw new Error('Use major, minor, or patch.');
  const parts = version.version.split('.').map(Number);
  const index = ['major', 'minor', 'patch'].indexOf(kind);
  parts[index]++;
  for (let i = index + 1; i < parts.length; i++) parts[i] = 0;
  const next = parts.join('.');
  Object.assign(version, {
    version: next,
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
    lastUpdated: new Date().toISOString().slice(0, 10),
  });
  save('version.json', version);
  const pkg = read('package.json');
  pkg.version = next;
  save('package.json', pkg);
  const lock = read('package-lock.json');
  lock.version = next;
  lock.packages[''].version = next;
  save('package-lock.json', lock);
  console.log(next);
}
