// Open Graph generator - pure function, no DOM access (also runs in Node tests).
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function generateOpenGraph(f) {
  const lines = [];
  const tag = (attr, key, val) => {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      lines.push(`<meta ${attr}="${key}" content="${esc(val)}">`);
    }
  };
  const prop = (k, v) => tag('property', k, v);

  // Core Open Graph
  prop('og:title', f.title);
  prop('og:description', f.description);
  prop('og:type', f.type || 'website');
  prop('og:url', f.url);
  prop('og:site_name', f.siteName);
  prop('og:locale', f.locale);
  prop('og:image', f.image);
  if (f.image) {
    prop('og:image:alt', f.imageAlt || f.title);
  }

  // Article extras
  if (f.includeArticle) {
    prop('article:published_time', f.articlePublished);
    prop('article:modified_time', f.articleModified);
    prop('article:author', f.articleAuthor);
    prop('article:section', f.articleSection);
    if (f.articleTags) {
      for (const t of String(f.articleTags).split(',').map((s) => s.trim()).filter(Boolean)) {
        prop('article:tag', t);
      }
    }
  }

  // Product extras
  if (f.includeProduct && f.type === 'product') {
    prop('product:price:amount', f.productPrice);
    prop('product:price:currency', f.productCurrency);
    prop('product:availability', f.productAvailability);
    prop('product:brand', f.productBrand);
    prop('product:retailer_item_id', f.productSku);
  }

  if (f.includeFbAppId) prop('fb:app_id', f.fbAppId);

  // Twitter Card
  if (f.includeTwitter) {
    const name = (k, v) => tag('name', k, v);
    name('twitter:card', f.twitterCard || 'summary_large_image');
    name('twitter:title', f.title);
    name('twitter:description', f.description);
    name('twitter:image', f.image);
    name('twitter:site', f.twitterSite);
    name('twitter:creator', f.twitterCreator);
  }

  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// VISUAL preview: render how the shared link will LOOK on social platforms -
// NOT the meta tags. Pure string builder (Node-testable). Empty fields show
// as muted placeholders so the layout is still visible.
// ---------------------------------------------------------------------------
function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function ph(value, placeholder) {
  const t = String(value ?? '').trim();
  return t ? escHtml(t) : `<span class="og-ph">${placeholder}</span>`;
}
function hostOf(url) {
  try { return new URL(String(url)).hostname.replace(/^www\./, '').toUpperCase(); } catch { return ''; }
}
function ogImg(url, cls) {
  const u = String(url ?? '').trim();
  if (u) return `<img class="${cls}" src="${escHtml(u)}" alt="" referrerpolicy="no-referrer">`;
  return `<div class="${cls} og-img-empty">No image set — shares look plain without one (best: 1200 × 630)</div>`;
}

export function renderOgVisual(f = {}) {
  const domain = hostOf(f.url);
  const domainHtml = domain ? escHtml(domain) : ph(f.siteName, 'YOURSITE.COM');
  const titleHtml = ph(f.title, 'Your page title will appear here');
  const descHtml = ph(f.description, 'Your page description will appear here — one or two lines that make people want to click…');

  // Extra meta lines (article / product) shown under the Facebook card.
  let extra = '';
  if (f.includeArticle) {
    const bits = [f.articleSection, f.articlePublished, f.articleAuthor].filter((x) => String(x || '').trim());
    extra = `<div class="og-meta">${bits.length ? escHtml(bits.join(' · ')) : '<span class="og-ph">Article date / section / author</span>'}</div>`;
  } else if (f.includeProduct && f.type === 'product') {
    const bits = [];
    if (f.productPrice) bits.push(`${f.productCurrency || ''} ${f.productPrice}`.trim());
    if (f.productAvailability) bits.push(f.productAvailability);
    if (f.productBrand) bits.push(f.productBrand);
    extra = `<div class="og-meta">${bits.length ? escHtml(bits.join(' · ')) : '<span class="og-ph">Price · availability · brand</span>'}</div>`;
  }

  let html = `<div class="og-pv-label">Facebook / LinkedIn — how your link looks when shared</div>
  <div class="og-pv-card">${ogImg(f.image, 'og-pv-img')}
    <div class="og-pv-body"><div class="og-domain">${domainHtml}</div>
    <div class="og-pv-title">${titleHtml}</div>
    <div class="og-pv-desc">${descHtml}</div>${extra}</div>
  </div>`;

  if (f.includeTwitter) {
    if ((f.twitterCard || 'summary_large_image') === 'summary') {
      html += `<div class="og-pv-label">X (Twitter) — small summary card</div>
      <div class="og-pv-card og-pv-xsmall">${ogImg(f.image, 'og-x-img')}
        <div class="og-pv-body"><div class="og-pv-title">${titleHtml}</div>
        <div class="og-pv-desc">${descHtml}</div>
        <div class="og-domain">🔗 ${domainHtml}</div></div>
      </div>`;
    } else {
      html += `<div class="og-pv-label">X (Twitter) — large image card</div>
      <div class="og-pv-card">${ogImg(f.image, 'og-pv-img')}
        <div class="og-pv-body"><div class="og-pv-title">${titleHtml}</div>
        <div class="og-pv-desc">${descHtml}</div>
        <div class="og-domain">🔗 ${domainHtml}${f.twitterSite ? ` · ${escHtml(f.twitterSite)}` : ''}</div></div>
      </div>`;
    }
  }
  return html;
}
