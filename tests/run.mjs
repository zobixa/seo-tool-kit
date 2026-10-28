import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { generateOpenGraph, renderOgVisual } from '../lib/og.js';
import { generateRobots, parseRobots } from '../lib/robots.js';
import { generateSitemap, parseSitemapLocs, isSitemapIndex } from '../lib/sitemap.js';
import { buildSchema, schemaToScript, missingRequired, renderSchemaVisual } from '../lib/schema.js';
import { extractPageData, renderPageInfo } from '../lib/readpage.js';

let n = 0;
const ok = (name, cond) => { assert(cond, name); n += 1; console.log('ok -', name); };

// ---- Open Graph ----
const og = generateOpenGraph({
  title: 'My "Great" Page', description: 'Desc & more', url: 'https://ex.com/a', siteName: 'Ex',
  type: 'article', locale: 'en_US', image: 'https://ex.com/i.jpg',
  includeTwitter: true, twitterCard: 'summary', twitterSite: '@ex',
  includeArticle: true, articlePublished: '2026-01-02', articleTags: 'seo, tools',
});
ok('og core tags', og.includes('property="og:title"') && og.includes('property="og:type" content="article"'));
ok('og escapes quotes', og.includes('My &quot;Great&quot; Page'));
ok('og twitter card', og.includes('name="twitter:card" content="summary"'));
ok('og article tags x2', (og.match(/article:tag/g) || []).length === 2);
const ogp = generateOpenGraph({ title: 'Shoe', type: 'product', includeProduct: true, productPrice: '49', productCurrency: 'USD' });
ok('og product price', ogp.includes('product:price:amount" content="49"'));

// ---- OG VISUAL preview (share-card look, not code) ----
const ogv = renderOgVisual({ title: 'My Page', description: 'Nice desc', url: 'https://www.ex.com/a', image: 'https://ex.com/i.jpg' });
ok('og visual shows card not code', ogv.includes('My Page') && ogv.includes('EX.COM') && !ogv.includes('<meta'));
ok('og visual hides twitter when off', !ogv.includes('X (Twitter)'));
const ogvT = renderOgVisual({ title: 'T', url: 'https://ex.com', includeTwitter: true, twitterCard: 'summary', twitterSite: '@ex' });
ok('og visual twitter summary card', ogvT.includes('X (Twitter)') && ogvT.includes('og-pv-xsmall'));
ok('og visual placeholders when empty', renderOgVisual({}).includes('og-ph'));
ok('og visual escapes html', renderOgVisual({ title: '<b>Hi</b>' }).includes('&lt;b&gt;Hi'));
ok('og visual img no-referrer (hotlink-safe)', ogv.includes('referrerpolicy="no-referrer"'));
ok('schema visual img no-referrer', renderSchemaVisual('Product', { image: 'https://ex.com/i.jpg' }).includes('referrerpolicy="no-referrer"'));

// ---- robots.txt ----
const rb = generateRobots({
  groups: [
    { agent: '*', rules: [{ type: 'Disallow', path: '/admin/' }] },
    { agent: 'GPTBot', rules: [{ type: 'Disallow', path: '/' }] },
  ],
  crawlDelay: '5', sitemapUrl: 'https://ex.com/sitemap.xml',
});
ok('robots groups', rb.includes('User-agent: GPTBot') && rb.includes('Disallow: /admin/'));
ok('robots crawl-delay in * group', rb.includes('Crawl-delay: 5'));
ok('robots sitemap line', rb.trimEnd().endsWith('Sitemap: https://ex.com/sitemap.xml'));
ok('robots blockAll', generateRobots({ blockAll: true }).includes('Disallow: /'));
const parsed = parseRobots(rb);
ok('robots parse round-trip', parsed.groups.length === 2 && parsed.sitemapUrl === 'https://ex.com/sitemap.xml' && parsed.crawlDelay === '5');

// ---- sitemap.xml ----
const sm = generateSitemap([
  { loc: 'https://ex.com/', lastmod: '2026-10-28', changefreq: 'weekly', priority: '1.0', images: ['https://ex.com/a.jpg'] },
  { loc: 'https://ex.com/about?x=1&y=2', priority: 0.5 },
]);
ok('sitemap image ns', sm.includes('xmlns:image') && sm.includes('<image:loc>https://ex.com/a.jpg</image:loc>'));
ok('sitemap escapes &', sm.includes('about?x=1&amp;y=2'));
ok('sitemap priority format', sm.includes('<priority>0.5</priority>'));
ok('sitemap parse locs', parseSitemapLocs(sm).length === 2);
ok('sitemap index detect', isSitemapIndex('<sitemapindex><sitemap><loc>x</loc></sitemap></sitemapindex>'));
writeFileSync('/tmp/test-sitemap.xml', sm);

// ---- schema ----
const prod = buildSchema('Product', { name: 'Shoe', price: '49', currency: 'USD', availability: 'https://schema.org/InStock', brand: 'Acme', ratingValue: '4.5', reviewCount: '12' });
ok('schema product offers', prod.offers.price === 49 && prod.offers.priceCurrency === 'USD');
ok('schema product rating', prod.aggregateRating.ratingValue === 4.5 && prod.brand.name === 'Acme');
const faq = buildSchema('FAQPage', { _items: [{ q: 'Q1?', a: 'A1.' }, { q: '', a: '' }] });
ok('schema faq items filtered', faq.mainEntity.length === 1 && faq.mainEntity[0].acceptedAnswer.text === 'A1.');
const org = buildSchema('Organization', { name: 'Zobixa', contactTelephone: '+1-555', contactType: 'sales', sameAs: 'https://x.com/z\nhttps://fb.com/z' });
ok('schema org contact+sameAs', org.contactPoint.telephone === '+1-555' && org.sameAs.length === 2);
const script = schemaToScript('Article', { headline: 'Hello' });
const json = script.replace(/<\/?script[^>]*>/g, '').trim();
ok('schema script wraps valid JSON', JSON.parse(json)['@type'] === 'Article');
ok('schema missing required', missingRequired('Article', {}).includes('Headline'));
ok('schema website searchaction', buildSchema('WebSite', { name: 'Ex', url: 'https://ex.com', searchTarget: 'https://ex.com/s?q={search_term_string}' }).potentialAction['@type'] === 'SearchAction');

// ---- schema VISUAL preview (what the public sees, not code) ----
const vis = renderSchemaVisual('Product', { name: 'Red Shoe', price: '49', currency: 'USD', ratingValue: '4', availability: 'https://schema.org/InStock' });
ok('visual shows name not code', vis.includes('Red Shoe') && !vis.includes('@context') && !vis.includes('application/ld+json'));
ok('visual shows stars + price + badge', vis.includes('★★★★') && vis.includes('USD') && vis.includes('In stock'));
ok('visual placeholders when empty', renderSchemaVisual('Product', {}).includes('sv-ph'));
ok('visual faq renders questions', renderSchemaVisual('FAQPage', { _items: [{ q: 'Free shipping?', a: 'Yes.' }] }).includes('Free shipping?'));
ok('visual escapes html', renderSchemaVisual('Article', { headline: '<b>Hi</b>' }).includes('&lt;b&gt;Hi'));

// ---- page reading (extractPageData against a fake DOM) ----
const metas = {
  'meta[name="description"]': { content: 'Desc here' },
  'meta[property="og:title"]': { content: 'OG Title' },
  'meta[property="og:description"]': { content: 'OG Desc' },
  'meta[property="og:image"]': { content: '/img/hero.jpg' },
  'meta[property="og:site_name"]': { content: 'Ex' },
};
globalThis.location = { href: 'https://ex.com/a/b', origin: 'https://ex.com' };
globalThis.document = {
  title: 'Page Title',
  querySelector: (sel) => sel === 'link[rel="canonical"]' ? { href: 'https://ex.com/a' }
    : sel === 'h1' ? { innerText: ' Hello World ' } : (metas[sel] ?? null),
  images: [{ currentSrc: '/x.png', src: '' }, { currentSrc: 'https://ex.com/y.png', src: '' }],
  querySelectorAll: (sel) => sel === 'a[href]'
    ? [{ getAttribute: () => '/p1' }, { getAttribute: () => 'https://other.com/z' }] : [],
};
const pd = extractPageData();
ok('read meta title+description', pd.title === 'Page Title' && pd.description === 'Desc here');
ok('read og fields', pd.ogTitle === 'OG Title' && pd.ogDescription === 'OG Desc' && pd.siteName === 'Ex');
ok('read og image absolutized', pd.ogImage === 'https://ex.com/img/hero.jpg');
ok('read canonical + h1', pd.canonical === 'https://ex.com/a' && pd.h1 === 'Hello World');
ok('read images absolutized', pd.images[0] === 'https://ex.com/x.png' && pd.images.length === 2);
ok('read links internal only', pd.links.length === 1 && pd.links[0] === 'https://ex.com/p1');
ok('page info box lists fields', renderPageInfo(pd).includes('Meta description') && renderPageInfo(pd).includes('Desc here'));
ok('page info marks missing fields', renderPageInfo({ ...pd, siteName: '' }).includes('not found on this page'));
delete globalThis.document; delete globalThis.location;

console.log(`\nAll ${n} checks passed.`);
