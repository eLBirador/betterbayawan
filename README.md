# BetterBayawan.org

An independent, volunteer-maintained civic information portal for **Bayawan City,
Negros Oriental, Philippines**. It links residents to government services,
published financial records, and original sources. It is not an official LGU site.

## Run locally

Use Node.js 22 or newer.

```sh
git clone https://github.com/rodneydelacruz/betterbayawan.git
cd betterbayawan
npm ci
npm run dev
```

Open **http://localhost:3000**. Changes to pages, layouts, data, translations, and
assets rebuild automatically. There is one application and one package lockfile.

```sh
npm run build          # generate dist/ without changing the version
npm run preview        # http://localhost:8080
npm run check          # source coverage, links, SEO, and data consistency
npm test               # browser checks; install Chromium first if needed
```

Install the test browser with `npx playwright install chromium`. Windows tests can
also use an installed Microsoft Edge. No browser installation is needed to build.

## Where to contribute

- **Page wording:** `pages/`; shared navigation and footer: `layouts/`.
- **Service guidance:** `data/service-guides.json` and `data/services.json`.
- **Quiz questions and translations:** `data/quiz.json`; see [the quiz guide](docs/quiz.md).
- **Facts and contacts:** the relevant JSON file in `data/`.
- **Translations:** `locales/fil.json` and `locales/ceb.json`.
- **Design and interactions:** `assets/css/` and `assets/js/`.
- **SEO and routes:** `pages/routes.json`.

Read [CONTRIBUTING.md](CONTRIBUTING.md), the [architecture guide](docs/architecture.md),
and the [content policy](docs/content-policy.md) before opening a PR. The
[audit checklist](docs/content-audit.md) records the October 2026 corrections and
the remaining limits of publicly available evidence.

After changing visible text, run `npm run i18n:extract`, complete the two
translation dictionaries, and run the checks. Preserve source dates and original
document links when changing citizen instructions. Do not edit generated `dist/`.

## Deploy

Vercel and Cloudflare build from the repository root with `npm run build` and
serve `dist/`. Apache/cPanel deployments upload the contents of `dist/`, including
`.htaccess`. Older municipal office URLs remain compatible through redirects.

The unfinished React migration was removed. The deployed civic-page markup,
styles, images, animation, and brand assets were preserved in the static site.

## License and attribution

Software: MIT. Original site content: CC BY 4.0. Third-party source documents and
assets retain their own terms. See [LICENSE](LICENSE).

Developed and maintained by Rodney Dela Cruz. The project builds on the
BetterGov.ph / BetterLGU initiative and the BetterSolano.org template by Ramon
Logan. Contributions from researchers, translators, developers, and residents
are welcome.
