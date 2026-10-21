import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { collectStrings } from './lib/content.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const data = (p) => JSON.parse(read(p));
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const routes = data('pages/routes.json');
const redirects = data('data/redirects.json');
const guides = data('data/service-guides.json');
const statements = data('data/financial-statements.json');
const contacts = data('data/contacts.json');
const officials = data('data/officials.json');
const version = data('version.json').version;

function guide(id) {
  const g = guides[id];
  if (!g) throw Error(`Unknown guide: ${id}`);
  const head = officials.departments.find((d) => d.office === g.headOffice)?.head;
  return `<section class="section"><div class="container">
    <div class="quick-stats"><div class="stat-card"><h4>Responsible office</h4><p>${esc(g.office)}</p></div><div class="stat-card"><h4>Source edition</h4><p>${g.edition} Citizen’s Charter</p></div><div class="stat-card"><h4>Fees and release time</h4><p>Use the transaction-specific checklist and current office assessment.</p></div></div>
    <div class="section-header"><h2>Find the right official checklist</h2><p>Open the relevant page of the city’s published Charter before preparing documents or paying fees.</p></div>
    <div class="grid grid-2">${g.services.map(([name, p]) => `<a class="office-card" href="${g.source}#page=${p + 11}"><div class="office-card-content"><h3>${esc(name)}</h3><p>Citizen’s Charter · printed page ${p}</p><span class="office-card-link">Open official checklist <i class="bi bi-arrow-up-right" aria-hidden="true"></i></span></div></a>`).join('')}</div>
    ${g.checklist ? `<div class="info-box"><h2>Before you visit</h2><ul>${g.checklist.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
    ${g.notes ? `<div class="info-box"><h2>What to know</h2>${g.notes.map((s) => `<p>${esc(s)}</p>`).join('')}</div>` : ''}
    <div class="contact-card"><div class="contact-card-content"><h2>${esc(g.office)}</h2>${head ? `<p>Office head: ${esc(head)}</p>` : ''}<p>For office locations and direct contacts, use the <a href="https://bayawancity.gov.ph/info/directory/directory.php">official city directory</a>. City Hall general enquiries: <a href="tel:${contacts.mayor.tel}">${esc(contacts.mayor.phone)}</a>.</p></div></div>
    ${g.links ? `<ul>${g.links.map(([s, u]) => `<li><a href="${esc(u)}">${esc(s)}</a></li>`).join('')}</ul>` : ''}
    <p class="content-source">Source: <a href="${g.source}">2025 City Citizen’s Charter</a>. Checked October 21, 2026. The transaction pages specify eligibility, requirements, fees, and processing standards; later office issuances may apply.</p>
  </div></section>`;
}

export function renderRoute(r) {
  if (r.redirect)
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${r.redirect}"><link rel="canonical" href="https://betterbayawan.org${r.redirect}"><meta name="robots" content="noindex"><title>Page moved</title></head><body><a href="${r.redirect}">Continue to the current city service guide</a></body></html>`;
  const main = read(r.source)
    .replace(/\{\{include:([\w-]+)\}\}/g, (_, id) => read(`layouts/${id}.html`))
    .replace(/\{\{guide:([\w-]+)\}\}/g, (_, id) => guide(id))
    .replace(
      /\{\{financial:(\w+)\}\}/g,
      (_, key) => '₱' + (statements.periods.at(-1)[key] / 1e6).toFixed(2) + ' M'
    );
  const common = [
    'content-data',
    'translations-data',
    'translations',
    'info-bar',
    'main',
    'version',
    'site',
  ].map((n) => ({ src: `/assets/js/${n}.js` }));
  const scripts = [...common, ...(r.scripts || [])]
    .map(({ src, type }) => `<script defer src="${src}"${type ? ` type="${type}"` : ''}></script>`)
    .join('\n');
  const preserved = { '/': 'home', '/services/': 'services', '/services/health': 'health' }[r.url];
  const styles = [
    ...(r.styles || []),
    ...(preserved ? [`/assets/css/pages/deployed-${preserved}.css`] : []),
    '/assets/css/polish.css',
  ]
    .map((h) => `<link rel="stylesheet" href="${h}">`)
    .join('\n');
  const values = {
    main,
    title: esc(`${r.title?.replace(/\s*\|\s*BetterBayawan.*$/, '')} | BetterBayawan.org`),
    description: esc(r.description || ''),
    url: r.url,
    styles,
    scripts,
    version,
  };
  let html = r.standalone
    ? main.replace('</body>', scripts + '</body>')
    : read(`layouts/${r.layout}.html`).replace(
        /\{\{(main|title|description|url|styles|scripts|version)\}\}/g,
        (_, key) => values[key]
      );
  html = html.replace(/\{\{(contact|official):([\w.]+)\}\}/g, (_, kind, key) => {
    const value = key
      .split('.')
      .reduce((record, part) => record?.[part], kind === 'contact' ? contacts : officials);
    if (value === undefined) throw Error(`Unknown ${kind} binding: ${key}`);
    return esc(value);
  });
  const $ = load(html);
  $('a[href]').each((i, e) => {
    const h = $(e).attr('href');
    if (redirects[h]) $(e).attr('href', redirects[h]);
    if (/^https?:/.test(h) && $(e).attr('target') === '_blank')
      $(e).attr('rel', 'noopener noreferrer');
  });
  $('.main-nav > ul > li > a').each((i, e) => {
    const h = $(e).attr('href');
    const active = h === '/' ? r.url === '/' : r.url.startsWith(h.replace(/\/$/, ''));
    $(e).toggleClass('active', active);
    if (active) $(e).attr('aria-current', 'page');
    else $(e).removeAttr('aria-current');
  });
  $('html').attr('lang', 'en');
  $(
    'head meta[name="robots"],head meta[property="og:url"],head meta[name="twitter:card"]'
  ).remove();
  $('meta[name="twitter:title"]').attr('content', r.title || 'BetterBayawan.org');
  $('meta[name="twitter:description"]').attr(
    'content',
    r.description || 'Independent community information for Bayawan City.'
  );
  if (r.url === '/')
    $('head').append(
      '<link rel="preload" as="image" href="/assets/images/banners/bayawan-banner.jpg">'
    );
  $('head').append(
    `<meta name="robots" content="${r.standalone ? 'noindex,follow' : 'index,follow'}"><meta property="og:url" content="https://betterbayawan.org${r.url}"><meta name="twitter:card" content="summary_large_image">`
  );
  if (!r.standalone) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: r.title,
      description: r.description,
      url: `https://betterbayawan.org${r.url}`,
      isPartOf: {
        '@type': 'WebSite',
        name: 'BetterBayawan.org',
        url: 'https://betterbayawan.org/',
        description: 'Independent community civic information portal for Bayawan City.',
      },
      inLanguage: 'en-PH',
    };
    if (r.url !== '/')
      schema.breadcrumb = {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://betterbayawan.org/' },
          {
            '@type': 'ListItem',
            position: 2,
            name: r.title,
            item: `https://betterbayawan.org${r.url}`,
          },
        ],
      };
    $('head').append(
      `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`
    );
  }
  if (r.url === '/budget/') {
    const p = statements.periods.at(-1);
    const money = (n) => '₱' + (n / 1e6).toFixed(2) + ' M';
    for (const [id, v] of Object.entries({
      'sre-total-income': p.income,
      'sre-total-expense': p.expenditures,
      'sre-net-income': p.netIncome,
      'sre-fund-balance': p.fundBalance,
      'sre-income-local': p.local,
      'sre-income-external': p.external,
      'sre-exp-gps': p.gps,
      'sre-exp-social': p.social,
      'sre-exp-economic': p.economic,
      'sre-exp-debt': p.debt,
    }))
      $('#' + id).text(money(v));
    for (const [id, v, total] of [
      ['sre-income-local-pct', p.local, p.income],
      ['sre-income-external-pct', p.external, p.income],
      ...['gps', 'social', 'economic', 'debt'].map((k) => [
        'sre-exp-' + k + '-pct',
        p[k],
        p.expenditures,
      ]),
    ])
      $('#' + id).text(((v / total) * 100).toFixed(1) + '%');
    $('.sre-period-btn')
      .first()
      .parent()
      .html(
        statements.periods
          .map(
            (p) =>
              `<button type="button" class="sre-period-btn${p.id === 'q3-2026' ? ' active' : ''}" data-quarter="${p.id}">${p.year} · ${esc(p.label)}</button>`
          )
          .join('')
      );
  }
  if (r.url === '/statistics/') {
    $('.metric-value[data-count="126744"]').text('126,744');
    $('.economy-value[data-count="3"]').text('3');
  }
  const news = data('data/news.json')
    .news.slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  const newsCard = (a, home) =>
    `<article class="${home ? 'home-news-card' : 'news-card'}"><div class="${home ? 'home-news-meta' : 'news-card-meta'}"><span>${esc(a.category)}</span><time datetime="${a.date}">${a.date}</time></div><div class="${home ? '' : 'news-card-body'}"><h3><a href="${esc(a.url)}" rel="noopener noreferrer">${esc(a.title)}</a></h3><p>${esc(a.summary)}</p><p><a href="${esc(a.url)}">${esc(a.source || 'View official source')}</a></p></div></article>`;
  if (r.url === '/')
    $('#home-news-grid').html(
      news
        .slice(0, 3)
        .map((a) => newsCard(a, true))
        .join('')
    );
  if (r.url === '/news/') $('#news-grid').html(news.map((a) => newsCard(a, false)).join(''));
  const seen = new Set();
  $('script[src]').each((i, e) => {
    const src = $(e).attr('src');
    if (seen.has(src)) $(e).remove();
    else seen.add(src);
  });
  return $.html();
}

export function build() {
  const dist = path.join(root, 'dist');
  if (path.dirname(dist) !== root) throw Error('Unsafe build path');
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist);
  fs.mkdirSync(path.join(root, '.artifacts'), { recursive: true });
  for (const n of ['assets', 'data', 'manifest.webmanifest', 'sw.js', 'version.json', '.htaccess'])
    fs.cpSync(path.join(root, n), path.join(dist, n), { recursive: true });
  const dictionaries = Object.fromEntries(
    ['en', 'fil', 'ceb'].map((l) => [l, data(`locales/${l}.json`)])
  );
  const financial = Object.fromEntries(
    statements.periods.map((p) => [
      p.id,
      {
        period: p.label,
        source: p.source,
        income: { local: p.local / 1e6, external: p.external / 1e6, total: p.income / 1e6 },
        expenditures: {
          gps: p.gps / 1e6,
          social: p.social / 1e6,
          economic: p.economic / 1e6,
          debt: p.debt / 1e6,
          total: p.expenditures / 1e6,
        },
        netIncome: p.netIncome / 1e6,
        fundBalance: p.fundBalance / 1e6,
      },
    ])
  );
  const demo = data('data/demographics.json');
  const publicData = {
    financial,
    barangays: Object.entries(demo.barangay_populations)
      .map(([name, pop]) => ({ name, pop }))
      .sort((a, b) => b.pop - a.pop),
    services: data('data/services.json').services.map((s) => {
      const url = new URL(s.url, 'https://betterbayawan.org/services/');
      const local = url.pathname.replace(/\.html$/, '');
      return {
        ...s,
        url:
          url.origin === 'https://betterbayawan.org'
            ? (redirects[local] || local) + url.search + url.hash
            : url.href,
      };
    }),
  };
  fs.writeFileSync(
    path.join(dist, 'assets/js/content-data.js'),
    `window.BayawanData=${JSON.stringify(publicData).replaceAll('<', '\\u003c')};\n`
  );
  fs.writeFileSync(
    path.join(dist, 'assets/js/translations-data.js'),
    `window.BayawanTranslations=${JSON.stringify(dictionaries)};\n`
  );
  const all = new Set();
  for (const r of routes) {
    const html = renderRoute(r),
      p = path.join(dist, r.output);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, html);
    if (!r.redirect) collectStrings(html).forEach((s) => all.add(s));
  }
  for (const [from, to] of Object.entries(redirects)) {
    const p = path.join(dist, from.slice(1) + '.html');
    if (!fs.existsSync(p)) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, renderRoute({ redirect: to }));
    }
  }
  fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes
      .filter((r) => !r.redirect && !r.standalone)
      .map((r) => `<url><loc>https://betterbayawan.org${r.url}</loc></url>`)
      .join('')}</urlset>`
  );
  fs.writeFileSync(
    path.join(dist, 'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: https://betterbayawan.org/sitemap.xml\n'
  );
  fs.writeFileSync(
    path.join(dist, '_redirects'),
    Object.entries(redirects)
      .map(([a, b]) => `${a} ${b} 301`)
      .join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(root, '.artifacts/content-strings.json'),
    JSON.stringify([...all].sort(), null, 2)
  );
  console.log(`Built ${routes.length} static routes. No React runtime. Version ${version}.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
