// Page reading for the side panel.
//
// extractPageData is INJECTED into the web page via chrome.scripting, so it
// must stay fully self-contained: no imports, no references to module scope.
// It runs against the page's real document/location.
export function extractPageData() {
  const abs = (u) => {
    const s = String(u || '').trim();
    if (!s) return '';
    try { return new URL(s, location.href).href; } catch { return ''; }
  };
  const meta = (sel) => { try { return document.querySelector(sel)?.content || ''; } catch { return ''; } };
  let images = [];
  try { images = [...document.images].map((i) => abs(i.currentSrc || i.src)).filter(Boolean); } catch { /* keep [] */ }
  let links = [];
  try {
    links = [...document.querySelectorAll('a[href]')]
      .map((a) => abs(a.getAttribute('href')))
      .filter((u) => u && u.startsWith(location.origin));
  } catch { /* keep [] */ }
  return {
    url: location.href,
    origin: location.origin,
    title: document.title || '',
    description: meta('meta[name="description"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    ogImage: abs(meta('meta[property="og:image"]')),
    siteName: meta('meta[property="og:site_name"]'),
    h1: document.querySelector('h1')?.innerText?.trim() || '',
    images: [...new Set(images)].slice(0, 30),
    links: [...new Set(links)].slice(0, 500),
  };
}

// Render the "what we read from this page" box - the visible proof the read
// worked, like other SEO extensions show. Pure string builder (Node-testable).
function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function renderPageInfo(d) {
  if (!d) return '';
  const row = (label, value) => `<div class="pd-row"><span class="pd-label">${label}</span><span class="pd-value">${value ? escHtml(value) : '<em class="pd-missing">not found on this page</em>'}</span></div>`;
  return `<div class="pd-title">✓ Page read — this is what the page itself declares:</div>`
    + row('URL', d.url)
    + row('Meta title', d.title)
    + row('Meta description', d.description)
    + row('Canonical', d.canonical)
    + row('og:title', d.ogTitle)
    + row('og:description', d.ogDescription)
    + row('og:image', d.ogImage)
    + row('og:site_name', d.siteName)
    + row('H1', d.h1)
    + `<div class="pd-row"><span class="pd-label">Found</span><span class="pd-value">${(d.images || []).length} images · ${(d.links || []).length} internal links</span></div>`;
}
