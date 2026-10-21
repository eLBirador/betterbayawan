import fs from 'node:fs';
import path from 'node:path';
import { renderRoute, root } from './build-site.mjs';
import { collectStrings } from './lib/content.mjs';
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const strings = new Set();
for (const route of read('pages/routes.json'))
  if (!route.redirect) collectStrings(renderRoute(route)).forEach((s) => strings.add(s));
for (const item of read('data/services.json').services)
  for (const k of ['title', 'description', 'category', 'fee', 'processingTime', 'office'])
    if (item[k]) strings.add(item[k]);
for (const item of read('data/news.json').news)
  for (const k of ['title', 'summary', 'category', 'source']) if (item[k]) strings.add(item[k]);
for (const value of read('locales/interface.json')) strings.add(value);
for (const language of ['en', 'fil', 'ceb']) {
  const previous = read(`locales/${language}.json`);
  const next = Object.fromEntries(
    [...strings].sort().map((s) => [s, language === 'en' ? s : previous[s] || ''])
  );
  fs.writeFileSync(
    path.join(root, `locales/${language}.json`),
    JSON.stringify(next, null, 2) + '\n'
  );
}
console.log(
  `Extracted ${strings.size} unique phrases. Fill empty Filipino and Cebuano values before submitting a PR.`
);
