// robots.txt generator + basic parser - pure functions (also run in Node tests).

export const KNOWN_BOTS = [
  '*', 'Googlebot', 'Googlebot-Image', 'Bingbot', 'DuckDuckBot',
  'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'CCBot', 'Google-Extended',
  'PerplexityBot', 'Bytespider', 'facebookexternalhit', 'Twitterbot',
];

// groups: [{ agent: 'Googlebot', rules: [{ type: 'Allow'|'Disallow', path: '/x' }] }]
export function generateRobots({ groups = [], crawlDelay = '', sitemapUrl = '', blockAll = false, allowAll = false } = {}) {
  if (blockAll) {
    return finish(['User-agent: *', 'Disallow: /'], sitemapUrl);
  }
  if (allowAll && groups.length === 0) {
    return finish(['User-agent: *', 'Disallow:'], sitemapUrl);
  }
  const out = [];
  let starGroupSeen = false;
  for (const g of groups) {
    if (!g.agent) continue;
    if (g.agent === '*') starGroupSeen = true;
    out.push(`User-agent: ${g.agent}`);
    const rules = g.rules && g.rules.length ? g.rules : [{ type: 'Disallow', path: '' }];
    for (const r of rules) {
      out.push(`${r.type}: ${r.path ?? ''}`);
    }
    if (crawlDelay !== '' && crawlDelay !== null && crawlDelay !== undefined && g.agent === '*') {
      out.push(`Crawl-delay: ${crawlDelay}`);
    }
    out.push('');
  }
  if (crawlDelay !== '' && crawlDelay !== null && crawlDelay !== undefined && !starGroupSeen) {
    out.push('User-agent: *', `Crawl-delay: ${crawlDelay}`, '');
  }
  return finish(out, sitemapUrl);
}

function finish(lines, sitemapUrl) {
  const body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
  return (sitemapUrl ? `${body}\n\nSitemap: ${sitemapUrl}` : body) + '\n';
}

// Parse an existing robots.txt back into the groups model (best-effort).
export function parseRobots(text) {
  const groups = [];
  let current = null;
  let sitemapUrl = '';
  let crawlDelay = '';
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      if (!current || current.rules.length) {
        current = { agent: val, rules: [] };
        groups.push(current);
      } else {
        current.agent = val;
      }
    } else if ((key === 'allow' || key === 'disallow') && current) {
      current.rules.push({ type: key === 'allow' ? 'Allow' : 'Disallow', path: val });
    } else if (key === 'sitemap') {
      sitemapUrl = val;
    } else if (key === 'crawl-delay') {
      crawlDelay = val;
    }
  }
  return { groups: groups.filter((g) => g.agent), sitemapUrl, crawlDelay };
}
