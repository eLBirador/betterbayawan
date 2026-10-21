# Contributing

Work from `main`. There is one static site; no React branch or second installation
is required. See [README.md](README.md) for setup and [docs/architecture.md](docs/architecture.md)
for the source map.

## A useful pull request

1. Create a branch for one coherent change.
2. Edit the maintained source, not `dist/`.
3. For factual changes, include the original source URL, edition/period, and date
   checked. For fees, processing standards, and legal requirements, identify the
   exact document page or provision. Follow the [content policy](docs/content-policy.md).
4. After copy changes, run `npm run i18n:extract`. Complete Filipino and Cebuano
   translations as full sentences; preserve proper names, numbers, qualifications,
   and legal meaning. Do not use word-by-word replacements or fill missing values
   with English to pass coverage checks.
5. Run `npm run check` and `npm test`. Preview important changes on a narrow screen
   and navigate controls with a keyboard. For a text-only change, explain if browser
   checks are not relevant.
6. Describe the problem, resulting behavior, source evidence, and checks in the PR.

## Source conventions

- Keep fees/times in the specific source-linked guide; do not copy a second price
  list into category pages or FAQs.
- Preserve official legislative titles verbatim. Add a separate explanation when
  an official catalogue contains an apparent error.
- Use `City`, `CSWDO`, `CDRRMO`, `SP`, and the office’s published name for current
  Bayawan institutions. Historical references to the former municipality remain
  valid.
- Add aliases in `data/redirects.json` when changing a public route. Update Vercel
  configuration too; `npm run check` verifies the two agree.
- Cite data as historical when its reference year is old. Never represent a loan
  authorization, budget appropriation, operating income, and cash balance as the
  same measure.
- Do not publish estimated staff names, invented response times, guaranteed aid
  amounts, or unverified emergency numbers.
- Keep existing brand assets and responsive patterns. Prefer small, accessible
  improvements over unrelated visual redesigns.

## Reports and questions

Use [GitHub issues](https://github.com/rodneydelacruz/betterbayawan/issues). Include
the affected page, observed wording, proposed correction, and supporting evidence.
Do not post private identity documents, health records, or credentials. Security
reports should follow [SECURITY.md](SECURITY.md).

## News

Edit `data/news.json` with an original source link and accurate publication date.
Past events and closed opportunities belong in the archive. The optional local
editor is `tools/news-editor.html`; it exports data for review and does not publish
to the live website. The manual Facebook workflow produces a review artifact.
