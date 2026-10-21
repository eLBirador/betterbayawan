import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import { build, root } from './build-site.mjs';
import { collectStrings } from './lib/content.mjs';

build();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const routes = json('pages/routes.json'),
  redirects = json('data/redirects.json');
const locales = Object.fromEntries(['en', 'fil', 'ceb'].map((l) => [l, json(`locales/${l}.json`)]));
const issues = [];
const check = (ok, message) => {
  if (!ok) issues.push(message);
};
const hasTarget = (pathname) => {
  const base = path.join(root, 'dist', decodeURIComponent(pathname));
  return [base, base + '.html', path.join(base, 'index.html')].some(
    (p) => fs.existsSync(p) && fs.statSync(p).isFile()
  );
};
const titles = new Set();
const factsText = [];
for (const r of routes) {
  const html = read('dist/' + r.output),
    dom = load(html);
  check(!/\{\{[^}]+\}\}/.test(html), `${r.url}: unresolved template`);
  check(!/\/_next\/|react-dom|__next_f|jsx-[a-f0-9]+/.test(html), `${r.url}: framework residue`);
  if (r.redirect) continue;
  if (!r.standalone) {
    check(
      dom('link[rel="manifest"]').attr('href') === '/manifest.webmanifest',
      `${r.url}: missing install manifest`
    );
    check(dom('h1').length === 1, `${r.url}: expected one h1`);
    check(
      dom('link[rel="canonical"]').attr('href') === `https://betterbayawan.org${r.url}`,
      `${r.url}: canonical mismatch`
    );
    check(!titles.has(dom('title').text()), `${r.url}: duplicate title`);
    titles.add(dom('title').text());
    check(
      (dom('meta[name="description"]').attr('content') || '').length > 30,
      `${r.url}: missing useful description`
    );
    check(
      dom('script[type="application/ld+json"]').length > 0,
      `${r.url}: missing structured data`
    );
    dom('script[type="application/ld+json"]').each((i, e) => {
      try {
        JSON.parse(dom(e).html());
      } catch {
        issues.push(`${r.url}: malformed structured data`);
      }
    });
  }
  dom('[href],[src],[action]').each((i, e) => {
    for (const attr of ['href', 'src', 'action']) {
      const value = dom(e).attr(attr);
      if (!value || /^(?:[a-z]+:|#|\/\/)/i.test(value)) continue;
      const url = new URL(value, `https://betterbayawan.org${r.url}`);
      check(hasTarget(url.pathname), `${r.url}: broken ${attr} ${value}`);
    }
  });
  for (const phrase of collectStrings(html))
    for (const lang of ['en', 'fil', 'ceb'])
      check(Boolean(locales[lang][phrase]?.trim()), `${lang}: missing ${JSON.stringify(phrase)}`);
  const text = dom('main').text().replace(/\s+/g, ' ');
  factsText.push(text);
  check(
    !/\bMunicipal (?:Treasurer|Engineering|Budget|Accounting|Agriculture)|\bMSWDO\b|\bMDRRMO\b|MTOF|Sa Uhog|Barangay Osmeña|Parental Advice \(if 22|18-21|₱158\.47/.test(
      text
    ),
    `${r.url}: audited error returned`
  );
}
const combined = factsText.join(' ');
for (const lang of ['fil', 'ceb']) {
  const hours = Object.keys(locales.en).find((phrase) =>
    phrase.includes('Frontline transactions are subject to the No Noon Break policy')
  );
  check(
    locales[lang][hours]?.includes('No Noon Break'),
    `${lang}: preserve the No Noon Break policy name`
  );
}
check(
  !/deleted (?:within 1 year|after 90 days)|with a lunch break from|minimum purchase amount per establishment|PWD ID is valid for 3 years/.test(
    combined
  ),
  'A corrected policy/benefit claim returned'
);
for (const lang of ['fil', 'ceb']) {
  assert.deepEqual(
    Object.keys(locales[lang]).sort(),
    Object.keys(locales.en).sort(),
    `${lang}: dictionary key parity`
  );
  for (const [key, value] of Object.entries(locales[lang]))
    check(typeof value === 'string' && value.trim().length > 0, `${lang}: empty ${key}`);
  for (const [key, value] of Object.entries(locales[lang])) {
    for (const brand of key.match(/Better\s?Bayawan(?:\.org)?/g) || [])
      check(value.includes(brand), `${lang}: brand name changed in ${key}`);
  }
}
const demo = json('data/demographics.json');
assert.equal(Object.keys(demo.barangay_populations).length, 28);
assert.equal(
  Object.values(demo.barangay_populations).reduce((a, b) => a + b, 0),
  126744
);
assert.equal(demo.income_class, '1st');
for (const p of json('data/financial-statements.json').periods) {
  assert.ok(Math.abs(p.local + p.external - p.income) < 0.02, `${p.id}: income total`);
  assert.ok(Math.abs(p.income - p.expenditures - p.netIncome) < 0.02, `${p.id}: net income`);
  assert.ok(
    Math.abs(p.gps + p.social + p.economic + p.debt - p.expenditures) < 0.02,
    `${p.id}: spending total`
  );
  check(p.source.startsWith('https://www.bayawancity.gov.ph/'), `${p.id}: source missing`);
}
const vercel = json('vercel.json');
for (const [from, to] of Object.entries(redirects))
  check(
    vercel.redirects.some((r) => r.source === from && r.destination === to),
    `Missing Vercel alias: ${from}`
  );
check(vercel.framework === null && vercel.outputDirectory === 'dist', 'Vercel static settings');
for (const s of json('data/services.json').services) {
  check(Boolean(s.source && s.lastChecked), `${s.id}: no source/date`);
  const url = new URL(s.url, 'https://betterbayawan.org/services/');
  if (url.hostname === 'betterbayawan.org')
    check(hasTarget(url.pathname.replace(/\.html$/, '')), `${s.id}: broken directory link`);
}
if (issues.length) {
  console.error([...new Set(issues)].join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Passed: ${routes.length} routes, internal assets/links, SEO, ${Object.keys(locales.en).length} phrases × 3 languages, census totals, financial reconciliation, and hosting aliases.`
  );
