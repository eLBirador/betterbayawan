# How the site works

BetterBayawan is one static HTML/CSS/JavaScript site. Node is needed to build and
check it; the deployed site has no React, Next.js, PHP, or database dependency.

## Source locations

| Location                                  | Edit here for                                                  |
| ----------------------------------------- | -------------------------------------------------------------- |
| `pages/`                                  | Page content, written as HTML fragments                        |
| `pages/routes.json`                       | Routes, page titles/descriptions, styles, and scripts          |
| `layouts/`                                | Shared navigation, footer, and civil-registry guide            |
| `data/service-guides.json`                | Office guides and exact Citizen’s Charter page references      |
| `data/services.json`                      | Searchable service directory                                   |
| `data/contacts.json`                      | Sourced city and emergency contacts                            |
| `data/officials.json`                     | Officials and department heads                                 |
| `data/demographics.json`                  | Census and barangay counts                                     |
| `data/financial-statements.json`          | SRE amounts in pesos, period scope, original spreadsheets      |
| `data/news.json`                          | Curated announcements and original source links                |
| `data/redirects.json`                     | Permanent aliases for older municipal office URLs              |
| `locales/en.json`, `fil.json`, `ceb.json` | Unique source phrases and sentence translations                |
| `assets/`                                 | Preserved images, animation, brand styles, and browser scripts |
| `scripts/`                                | Build, checks, preview, and contributor utilities              |
| `dist/`                                   | Generated deployment output; never edit or commit              |

The `civic` layout preserves the deployed homepage, directory, and health-page
design. The `portal` layout preserves the other pages’ established presentation.
These are two static visual layouts, not separate applications. They use the same
language engine and content data. `assets/css/pages/deployed-home.css` preserves
the former homepage’s scoped history styles without React-generated classes.

## Build

`npm run build` renders page fragments into their layouts, resolves shared guide
includes, generates browser data from the JSON sources, and writes `dist/`.
Initial HTML includes news, financial figures, headings, and service instructions;
it does not depend on JavaScript for indexing or reading the main content.

The build generates canonical URLs, social metadata, WebPage/BreadcrumbList
structured data, `sitemap.xml`, `robots.txt`, and hosting redirects. It never
increments versions or changes source files. Version changes are explicit.

## Languages

English is the source text. The browser translates text nodes and descriptive
attributes without flattening nested links, icons, or formatting. Cebuano uses
the `ceb` document-language code; old `bis` preferences are migrated. All pages
share `BetterBayawan_lang` in local storage.

Run `npm run i18n:extract` after changing visible copy. It preserves existing
translations and leaves new phrases blank. Complete both dictionaries and run
`npm run check`. Identical proper names are intentional; copying English into
untranslated sentences to satisfy coverage is not acceptable.

Scripts use source phrases directly, without a second set of translation keys.
Dictionaries were initially repaired with machine-assisted sentence translations; citizen-facing
legal, medical, and Cebuano terminology needs editorial review when changed.
Original linked government documents remain the authority for transactions.

## Hosting

Vercel: repository root, `npm ci`, `npm run build`, output `dist/`, framework Other.
Cloudflare: the same build/output; `wrangler.jsonc` points to `dist/`.
Apache/cPanel: upload the **contents of `dist/`**, including `.htaccess`.
Do not upload the source repository, `tools/`, or `node_modules/`.

The old partial React migration and one-off replacement/translation scripts were
removed because they maintained competing versions of the same content. Git
history retains the previous implementation.
