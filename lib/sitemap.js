// sitemap.xml generator + sitemap loc parser - pure functions (Node-testable).
function escXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// urls: [{ loc, lastmod?, changefreq?, priority?, images?: [url, ...] }]
export function generateSitemap(urls) {
  const hasImages = urls.some((u) => u.images && u.images.length);
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
  lines.push(
    hasImages
      ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
      : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  );
  for (const u of urls) {
    if (!u.loc) continue;
    lines.push('  <url>');
    lines.push(`    <loc>${escXml(u.loc)}</loc>`);
    if (u.lastmod) lines.push(`    <lastmod>${escXml(u.lastmod)}</lastmod>`);
    if (u.changefreq) lines.push(`    <changefreq>${escXml(u.changefreq)}</changefreq>`);
    if (u.priority !== undefined && u.priority !== null && u.priority !== '') {
      lines.push(`    <priority>${Number(u.priority).toFixed(1)}</priority>`);
    }
    if (hasImages && u.images) {
      for (const img of u.images) {
        lines.push('    <image:image>');
        lines.push(`      <image:loc>${escXml(img)}</image:loc>`);
        lines.push('    </image:image>');
      }
    }
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n') + '\n';
}

// Extract <loc> values from a sitemap (or sitemap index) XML document.
export function parseSitemapLocs(xmlText) {
  const locs = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(String(xmlText || ''))) !== null) {
    locs.push(
      m[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
    );
  }
  return locs;
}

export function isSitemapIndex(xmlText) {
  return /<sitemapindex/i.test(String(xmlText || ''));
}
