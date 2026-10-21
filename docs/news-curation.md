# Maintaining news

`data/news.json` is the single dataset for the homepage and news page. Each entry
needs a stable ID, original title, ISO publication date, category, summary, source
URL, and source-link label. Verify the source before adding dates or paraphrases.

Do not present an expired deadline or past event as currently open. Preserve the
original date and provide archive context. The homepage shows the newest selected
records, not a claim to mirror every LGU announcement in real time.

The local editor in `tools/news-editor.html` can prepare an export for review.
Its output is not a deployment. Commit reviewed changes through a pull request,
update the translations, and run the normal site checks.

The optional **Prepare Facebook news for review** GitHub workflow runs manually
and requires the `FB_PAGE_ID` variable and `FB_ACCESS_TOKEN` secret. It produces a
candidate JSON artifact. Review dates, claims, source links, and summaries before
using it. The workflow does not post to Facebook or deploy automatically.
