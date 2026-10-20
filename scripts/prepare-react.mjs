import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'react-app/public');
// Root assets/data remain the shared source for pages still awaiting migration.
for (const name of [
  'assets',
  'data',
  'manifest.webmanifest',
  'offline.html',
  'sw.js',
  'version.json',
  'robots.txt',
  'sitemap.xml',
]) {
  fs.cpSync(path.join(root, name), path.join(publicDir, name), { recursive: true });
}
const source = fs.readFileSync(path.join(root, 'assets/js/translations.js'), 'utf8');
const dictionary = vm.runInNewContext(
  source.split('const TranslationEngine =')[0] + '\ntranslations;',
  {},
  { timeout: 1000 }
);
fs.mkdirSync(path.join(root, 'react-app/src/data'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'react-app/src/data/translations.json'),
  JSON.stringify(dictionary)
);
console.log('React assets and complete language dictionaries prepared.');
