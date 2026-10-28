# SEO Toolkit — Chrome Extension by Zobixa AI

Generate **Open Graph tags**, **robots.txt**, **sitemap.xml** and **Schema (JSON-LD)**
for any website, right from your browser. Free, open source, no server, no account —
everything runs locally, nothing is uploaded anywhere.

## How it works

1. **Select tools first.** The dropdown at the top lists all 4 tools with checkboxes.
   Only the tools you tick show their options, and Generate runs *only* the selected
   tasks. Your selection is remembered for next time.
2. **The current page is read automatically** when the panel opens (and when you
   switch tabs) — a Page Info box shows exactly what was found (meta title,
   description, canonical, OG tags, H1, image/link counts) and the forms auto-fill
   from it. If a read is blocked, click **Read current page** and allow site access
   when Chrome asks; that one approval lets the reader run on that site.
3. **Generate** — copy the output or download it as a file
   (`open-graph-tags.html`, `robots.txt`, `sitemap.xml`, `schema-jsonld.html`).

## The 4 tools

- **Open Graph** — core OG tags plus checkbox extras: Twitter Card, Facebook App ID,
  Article fields (dates, author, tags), Product fields (price, brand, SKU). Pick the
  share image from the page's own images. A **live preview** shows how the shared
  link will look on Facebook/LinkedIn and X (Twitter) as you fill the options.
- **robots.txt** — visual rule builder for 14 known crawlers (Googlebot, Bingbot,
  GPTBot, ClaudeBot, CCBot, …) plus custom agents, Allow/Disallow per path,
  block-all / allow-all shortcuts, crawl-delay, Sitemap line, and one-click loading
  of the site's *existing* robots.txt so you can edit it.
- **sitemap.xml** — get URLs three ways: crawl the site (depth + page caps),
  import its existing sitemap.xml (index files supported), or paste URLs manually.
  Options: lastmod, changefreq, priority, image sitemap entries, exclude patterns,
  per-URL checkboxes, 50,000-URL warning.
- **Schema (JSON-LD)** — 16 types with a tailored form each: Organization,
  LocalBusiness, WebSite (+ site search), Article, BlogPosting, Product (offers,
  aggregate rating, review), FAQPage, HowTo, Recipe, Event, Person, VideoObject,
  BreadcrumbList, Course, JobPosting, SoftwareApplication. Optional property groups
  are behind checkboxes; repeaters for FAQ questions, HowTo steps and breadcrumbs;
  a **live preview box** that shows a visual mock of the rich result the public
  will see in Google search (stars, price, FAQ dropdowns, steps…) updating as you
  fill the options — the code itself stays in the Generate results, with a
  "Copy code" button beside the preview; required-field hints and links to
  Google's Rich Results Test.

## Install (unpacked, 1 minute)

1. Download/clone this folder.
2. Chrome → `chrome://extensions` → turn on **Developer mode**.
3. **Load unpacked** → select this folder.
4. Click the SEO Toolkit icon in the toolbar — the side panel opens.

## Permissions, honestly

- `activeTab` + `scripting`: read the page *you* click "Read current page" on.
- `storage`: remember which tools you ticked. `downloads`: save generated files.
- Site access is **optional** and requested per-site, only when you crawl a site,
  import its sitemap, or load its robots.txt.

## Limits

- Crawling happens in your browser: big sites are slow, so depth/page caps apply.
  For a 10,000-page site, use a server-side crawler instead.
- Schema validation is basic (required-field hints) — always run the output through
  Google's Rich Results Test before shipping it.

## Development

Generator engines live in `lib/` as pure functions and are covered by a smoke test:

```bash
node tests/run.mjs
```

MIT licensed. Built by [Zobixa AI](https://github.com/zobixa).
