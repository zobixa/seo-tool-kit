import { generateOpenGraph, renderOgVisual } from './lib/og.js';
import { generateRobots, parseRobots, KNOWN_BOTS } from './lib/robots.js';
import { generateSitemap, parseSitemapLocs, isSitemapIndex } from './lib/sitemap.js';
import { SCHEMA_TYPES, schemaToScript, missingRequired, renderSchemaVisual } from './lib/schema.js';
import { extractPageData, renderPageInfo } from './lib/readpage.js';

const $ = (id) => document.getElementById(id);
const val = (id) => ($(id)?.value ?? '').trim();
const isChecked = (id) => !!$(id)?.checked;
const TOOLS = ['og', 'robots', 'sitemap', 'schema'];
const TOOL_NAMES = { og: 'Open Graph tags', robots: 'robots.txt', sitemap: 'sitemap.xml', schema: 'Schema (JSON-LD)' };
let pageData = null;
const results = {};

// ---------- storage shim (chrome.storage with localStorage fallback) ----------
const store = {
  async get(key) {
    if (globalThis.chrome?.storage?.local) return (await chrome.storage.local.get(key))[key];
    try { return JSON.parse(localStorage.getItem(key)); } catch { return undefined; }
  },
  async set(key, value) {
    if (globalThis.chrome?.storage?.local) return chrome.storage.local.set({ [key]: value });
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// ---------- STEP 1: tool selector dropdown ----------
const selected = new Set();
function refreshSelector() {
  for (const t of TOOLS) $(`section-${t}`).hidden = !selected.has(t);
  $('toolDropdownLabel').textContent =
    selected.size === 0 ? 'Select tools' : `${selected.size} tool${selected.size > 1 ? 's' : ''} selected: ${[...selected].map((t) => TOOL_NAMES[t]).join(', ')}`;
  $('generateBtn').disabled = selected.size === 0;
  $('generateHint').textContent = selected.size === 0
    ? 'Tick at least one tool above to generate.'
    : `Generate will run only: ${[...selected].map((t) => TOOL_NAMES[t]).join(', ')}.`;
  document.querySelectorAll('#toolDropdownPanel input[data-tool]').forEach((cb) => { cb.checked = selected.has(cb.dataset.tool); });
  store.set('seoToolkitSelected', [...selected]);
}
$('toolDropdownBtn').addEventListener('click', () => {
  const p = $('toolDropdownPanel');
  p.hidden = !p.hidden;
  $('toolDropdownBtn').setAttribute('aria-expanded', String(!p.hidden));
});
document.addEventListener('click', (e) => {
  if (!$('toolDropdownPanel').hidden && !e.target.closest('.selector')) {
    $('toolDropdownPanel').hidden = true;
  }
});
document.querySelectorAll('#toolDropdownPanel input[data-tool]').forEach((cb) => {
  cb.addEventListener('change', () => {
    cb.checked ? selected.add(cb.dataset.tool) : selected.delete(cb.dataset.tool);
    refreshSelector();
  });
});

// ---------- generic checkbox -> sub-fields toggles ----------
function bindToggle(checkId, fieldsId) {
  const c = $(checkId), f = $(fieldsId);
  if (!c || !f) return;
  const sync = () => { f.hidden = !c.checked; };
  c.addEventListener('change', sync);
  sync();
}
bindToggle('og-twitter', 'og-twitter-fields');
bindToggle('og-fbappid-check', 'og-fbappid-fields');
bindToggle('og-article', 'og-article-fields');
bindToggle('og-product', 'og-product-fields');
bindToggle('rb-crawldelay-check', 'rb-crawldelay-fields');
bindToggle('rb-sitemap-check', 'rb-sitemap-fields');
bindToggle('sm-src-crawl', 'sm-crawl-fields');
bindToggle('sm-src-manual', 'sm-manual-fields');

// ---------- read current page ----------
// Reading needs access to the tab's site. activeTab alone is fragile (Chrome
// revokes it when the tab navigates), so on button click we ask for the site's
// host permission (declared as optional_host_permissions) before injecting.
async function ensureSiteAccess(tab, prompt) {
  if (!tab?.url) return false;
  let u;
  try { u = new URL(tab.url); } catch { return false; }
  if (!/^https?:$/.test(u.protocol)) return false;
  const pattern = `${u.origin}/*`;
  try {
    if (await chrome.permissions.contains({ origins: [pattern] })) return true;
    if (!prompt) return false;
    return await chrome.permissions.request({ origins: [pattern] });
  } catch { return false; }
}

function fillFormsFromPage(d) {
  $('og-title').value = d.ogTitle || d.title || '';
  $('og-description').value = d.ogDescription || d.description || '';
  $('og-url').value = d.canonical || d.url || '';
  $('og-sitename').value = d.siteName || '';
  const imgSel = $('og-image-select');
  imgSel.innerHTML = '<option value="">— choose —</option>' + (d.images || []).map((u) => `<option value="${u}">${u}</option>`).join('');
  if (d.ogImage) $('og-image').value = d.ogImage;
  else if (d.images?.[0]) { $('og-image').value = d.images[0]; imgSel.value = d.images[0]; }
  $('sm-base').value = d.origin;
  $('rb-sitemap').value = `${d.origin}/sitemap.xml`;
  prefillSchemaFromPage();
  updateOgPreview();
}

let reading = false;
async function readCurrentPage({ prompt = false } = {}) {
  if (reading) return;
  reading = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
      $('pageInfo').textContent = 'Open a normal website (http/https) in this tab first — Chrome itself blocks reading on chrome:// pages, the Web Store and the PDF viewer.';
      return;
    }
    const granted = await ensureSiteAccess(tab, prompt);
    if (!granted && prompt) {
      // activeTab may still let the injection through; the attempt below decides.
    }
    let res;
    try {
      [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractPageData });
    } catch (e) {
      if (!granted) {
        if (prompt) $('pageInfo').textContent = 'Chrome did not allow reading this site. Click "Read current page" again and choose Allow when Chrome asks for site access.';
        return;
      }
      $('pageInfo').textContent = `Could not read this page: ${e.message}`;
      return;
    }
    const d = res?.result;
    if (!d) {
      if (prompt) $('pageInfo').textContent = 'The page returned no data (it may still be loading). Wait a moment, then click "Read current page" again.';
      return;
    }
    pageData = d;
    fillFormsFromPage(d);
    $('pageInfo').textContent = `Reading: ${d.url}`;
    const box = $('pageDataBox');
    box.innerHTML = renderPageInfo(d);
    box.hidden = false;
  } catch (e) {
    if (prompt) $('pageInfo').textContent = `Could not read this page: ${e.message}`;
  } finally {
    reading = false;
  }
}
$('readPageBtn').addEventListener('click', () => readCurrentPage({ prompt: true }));
// Auto-read on panel open, on tab switch, and when a page finishes loading.
readCurrentPage();
if (globalThis.chrome?.tabs?.onActivated) chrome.tabs.onActivated.addListener(() => readCurrentPage());
if (globalThis.chrome?.tabs?.onUpdated) chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.status === 'complete') readCurrentPage(); });
$('og-image-select').addEventListener('change', (e) => { if (e.target.value) $('og-image').value = e.target.value; });

// ---------- ROBOTS: rule rows ----------
function addRuleRow(agent = '*', type = 'Disallow', path = '/') {
  const row = document.createElement('div');
  row.className = 'rule-row';
  const botOptions = KNOWN_BOTS.map((b) => `<option ${b === agent ? 'selected' : ''}>${b}</option>`).join('');
  row.innerHTML = `
    <label>User-agent <select class="rb-agent">${botOptions}<option value="__custom" ${!KNOWN_BOTS.includes(agent) ? 'selected' : ''}>Custom…</option></select></label>
    <label>Rule <select class="rb-type"><option ${type === 'Allow' ? 'selected' : ''}>Allow</option><option ${type === 'Disallow' ? 'selected' : ''}>Disallow</option></select></label>
    <label>Path <input class="rb-path" type="text" value="${path.replace(/"/g, '&quot;')}"></label>
    <button class="btn btn-small btn-danger rb-remove" type="button">✕</button>
    <label class="rb-custom-wrap" ${!KNOWN_BOTS.includes(agent) ? '' : 'hidden'}>Custom agent <input class="rb-custom" type="text" value="${!KNOWN_BOTS.includes(agent) ? agent.replace(/"/g, '&quot;') : ''}"></label>`;
  row.querySelector('.rb-remove').addEventListener('click', () => row.remove());
  row.querySelector('.rb-agent').addEventListener('change', (e) => {
    row.querySelector('.rb-custom-wrap').hidden = e.target.value !== '__custom';
  });
  $('rb-rules').appendChild(row);
}
$('rb-addrule').addEventListener('click', () => addRuleRow());
function collectRobotsGroups() {
  const byAgent = new Map();
  document.querySelectorAll('#rb-rules .rule-row').forEach((row) => {
    let agent = row.querySelector('.rb-agent').value;
    if (agent === '__custom') agent = row.querySelector('.rb-custom').value.trim() || '*';
    const rule = { type: row.querySelector('.rb-type').value, path: row.querySelector('.rb-path').value };
    if (!byAgent.has(agent)) byAgent.set(agent, []);
    byAgent.get(agent).push(rule);
  });
  return [...byAgent.entries()].map(([agent, rules]) => ({ agent, rules }));
}
$('rb-load').addEventListener('click', async () => {
  const origin = pageData?.origin || val('sm-base');
  if (!origin) { $('rb-status').textContent = 'Read the current page first, or fill the site base URL in the sitemap tool.'; return; }
  $('rb-status').textContent = 'Loading…';
  try {
    await ensureHostPermission(origin);
    const res = await fetch(`${origin}/robots.txt`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = parseRobots(await res.text());
    $('rb-rules').innerHTML = '';
    for (const g of parsed.groups) for (const r of g.rules) addRuleRow(g.agent, r.type, r.path);
    if (parsed.sitemapUrl) { $('rb-sitemap-check').checked = true; $('rb-sitemap-fields').hidden = false; $('rb-sitemap').value = parsed.sitemapUrl; }
    if (parsed.crawlDelay) { $('rb-crawldelay-check').checked = true; $('rb-crawldelay-fields').hidden = false; $('rb-crawldelay').value = parsed.crawlDelay; }
    $('rb-status').textContent = `Loaded ${parsed.groups.length} rule group(s) from ${origin}/robots.txt — edit below as needed.`;
  } catch (e) {
    $('rb-status').textContent = `Could not load robots.txt (${e.message}). The site may not have one.`;
  }
});
addRuleRow('*', 'Disallow', '/admin/');

// ---------- host permission helper ----------
async function ensureHostPermission(origin) {
  if (!origin || !globalThis.chrome?.permissions?.request) return true;
  try {
    const has = await chrome.permissions.contains({ origins: [`${origin}/*`] });
    if (has) return true;
    return await chrome.permissions.request({ origins: [`${origin}/*`] });
  } catch { return true; }
}

// ---------- SITEMAP: fetch / crawl / import ----------
let smCollected = []; // [{loc, images:[]}]
function smAddUrl(loc, images = []) {
  loc = (loc || '').split('#')[0];
  if (!loc || !/^https?:\/\//.test(loc)) return;
  const existing = smCollected.find((u) => u.loc === loc);
  if (existing) {
    for (const im of images) if (!existing.images.includes(im)) existing.images.push(im);
  } else smCollected.push({ loc, images: [...images] });
}
function renderSmList() {
  const wrap = $('sm-urllist');
  wrap.innerHTML = '';
  for (const u of smCollected) {
    const lab = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = true; cb.dataset.loc = u.loc;
    lab.append(cb, document.createTextNode(u.loc + (u.images.length ? `  (${u.images.length} img)` : '')));
    wrap.appendChild(lab);
  }
  $('sm-count').textContent = String(smCollected.length);
  $('sm-urllist-wrap').hidden = smCollected.length === 0;
}
$('sm-fetch').addEventListener('click', async () => {
  const base = val('sm-base').replace(/\/$/, '');
  if (!base) { $('sm-status').textContent = 'Set the site base URL first (or click "Read current page").'; return; }
  smCollected = [];
  await ensureHostPermission(base);
  const status = (t) => { $('sm-status').textContent = t; };

  if (isChecked('sm-src-manual')) {
    val('sm-manual').split(/\r?\n/).forEach((l) => smAddUrl(l.trim()));
  }
  if (isChecked('sm-src-import')) {
    status('Importing existing sitemap.xml…');
    try {
      const res = await fetch(`${base}/sitemap.xml`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      let locs = parseSitemapLocs(text);
      if (isSitemapIndex(text)) {
        const children = locs.slice(0, 5);
        locs = [];
        for (const child of children) {
          try { const r2 = await fetch(child); if (r2.ok) locs.push(...parseSitemapLocs(await r2.text())); } catch {}
        }
      }
      locs.forEach((l) => smAddUrl(l));
      status(`Imported ${locs.length} URLs from the existing sitemap.`);
    } catch (e) { status(`Could not import sitemap.xml (${e.message}). Continuing with other sources.`); }
  }
  if (isChecked('sm-src-crawl')) {
    const maxDepth = Number(val('sm-depth') || 2);
    const maxPages = Number(val('sm-max') || 100);
    const withImages = isChecked('sm-opt-images');
    const seen = new Set();
    const queue = [{ url: `${base}/`, depth: 0 }];
    let fetched = 0;
    status('Crawling…');
    while (queue.length && fetched < maxPages) {
      const { url, depth } = queue.shift();
      const clean = url.split('#')[0];
      if (seen.has(clean)) continue;
      seen.add(clean);
      let html = '';
      try {
        const res = await fetch(clean);
        if (!res.ok) continue;
        if (!(res.headers.get('content-type') || '').includes('html')) continue;
        html = await res.text();
      } catch { continue; }
      fetched += 1;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const images = withImages ? [...doc.images].map((i) => { try { return new URL(i.getAttribute('src') || '', clean).href; } catch { return ''; } }).filter(Boolean).slice(0, 5) : [];
      smAddUrl(clean, images);
      status(`Crawling… ${fetched} pages, ${smCollected.length} URLs found.`);
      if (depth < maxDepth) {
        for (const a of doc.querySelectorAll('a[href]')) {
          try {
            const u = new URL(a.getAttribute('href'), clean);
            if (u.origin !== base) continue;
            if (/\.(pdf|zip|jpg|jpeg|png|gif|svg|mp4|mp3|css|js)(\?|$)/i.test(u.pathname)) continue;
            const next = u.href.split('#')[0];
            if (!seen.has(next)) queue.push({ url: next, depth: depth + 1 });
          } catch {}
        }
      }
    }
    status(`Crawl done: ${smCollected.length} URLs from ${fetched} pages fetched.`);
  }
  if (!isChecked('sm-src-crawl') && !isChecked('sm-src-import') && !isChecked('sm-src-manual')) {
    status('Tick at least one "Get URLs from" source, then Fetch URLs.');
  }
  renderSmList();
});

// ---------- SCHEMA: dynamic form ----------
const scTypeSel = $('sc-type');
scTypeSel.innerHTML = SCHEMA_TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('');
function fieldInput(f, prefill = '') {
  const ph = f.placeholder ? ` placeholder="${f.placeholder}"` : '';
  if (f.type === 'textarea' || f.type === 'lines') return `<textarea data-key="${f.key}" rows="${f.type === 'lines' ? 3 : 2}"${ph}>${prefill}</textarea>`;
  if (f.type === 'select') {
    const opts = (f.options || []).map((o, i) => `<option value="${o}">${(f.labels || f.options)[i]}</option>`).join('');
    return `<select data-key="${f.key}">${opts}</select>`;
  }
  const type = f.type === 'datetime' ? 'datetime-local' : f.type;
  return `<input data-key="${f.key}" type="${type}" value="${prefill.replace(/"/g, '&quot;')}"${ph}>`;
}
function renderSchemaForm() {
  const spec = SCHEMA_TYPES.find((t) => t.id === scTypeSel.value);
  const form = $('sc-form');
  let html = '';
  for (const f of spec.fields) {
    html += `<label>${f.label}${f.required ? ' *' : ''} ${fieldInput(f)}</label>`;
  }
  for (const g of spec.optional || []) {
    html += `<label class="check"><input type="checkbox" class="sc-opt-toggle" data-group="${g.id}"> ${g.label}</label>`;
    html += `<div class="sub sc-opt-group" data-group="${g.id}" hidden>`;
    for (const f of g.fields) html += `<label>${f.label}${f.required ? ' *' : ''} ${fieldInput(f)}</label>`;
    html += `</div>`;
  }
  form.innerHTML = html;
  form.querySelectorAll('.sc-opt-toggle').forEach((cb) => {
    cb.addEventListener('change', () => {
      form.querySelector(`.sc-opt-group[data-group="${cb.dataset.group}"]`).hidden = !cb.checked;
      updateSchemaPreview();
    });
  });
  // repeater
  const rep = $('sc-repeater');
  rep.innerHTML = '';
  if (spec.repeater) {
    const kinds = {
      faq: { add: '+ Add question', fields: [['q', 'Question', 'text'], ['a', 'Answer', 'textarea']] },
      steps: { add: '+ Add step', fields: [['name', 'Step title', 'text'], ['text', 'Step instructions', 'textarea']] },
      crumbs: { add: '+ Add breadcrumb', fields: [['name', 'Page name', 'text'], ['url', 'Page URL', 'url']] },
    };
    const kind = kinds[spec.repeater];
    const list = document.createElement('div');
    list.id = 'sc-repeater-list';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-small'; addBtn.type = 'button'; addBtn.textContent = kind.add;
    const addRow = () => {
      const row = document.createElement('div');
      row.className = 'repeater-row';
      const fieldsHtml = kind.fields.map(([k, lab, t]) =>
        t === 'textarea'
          ? `<label>${lab} <textarea data-rk="${k}" rows="2"></textarea></label>`
          : `<label>${lab} <input data-rk="${k}" type="${t}"></label>`).join('');
      row.innerHTML = `<div class="fields">${fieldsHtml}</div><button class="btn btn-small btn-danger" type="button">✕</button>`;
      row.querySelector('button').addEventListener('click', () => { row.remove(); updateSchemaPreview(); });
      list.appendChild(row);
      updateSchemaPreview();
    };
    addBtn.addEventListener('click', addRow);
    addRow();
    rep.append(list, addBtn);
  }
  prefillSchemaFromPage();
  updateSchemaWarnings();
}
function prefillSchemaFromPage() {
  if (!pageData) return;
  const setIfEmpty = (key, value) => {
    const el = document.querySelector(`#sc-form [data-key="${key}"]`);
    if (el && !el.value && value) el.value = value;
  };
  setIfEmpty('name', pageData.siteName || pageData.title);
  setIfEmpty('headline', pageData.h1 || pageData.title);
  setIfEmpty('title', pageData.h1 || pageData.title);
  setIfEmpty('url', pageData.origin + '/');
  setIfEmpty('image', pageData.ogImage || pageData.images?.[0] || '');
  setIfEmpty('thumbnailUrl', pageData.ogImage || pageData.images?.[0] || '');
  setIfEmpty('description', pageData.description);
}
function collectSchemaValues() {
  const spec = SCHEMA_TYPES.find((t) => t.id === scTypeSel.value);
  const v = {};
  const enabledGroups = new Set(
    [...document.querySelectorAll('#sc-form .sc-opt-toggle')].filter((c) => c.checked).map((c) => c.dataset.group)
  );
  document.querySelectorAll('#sc-form [data-key]').forEach((el) => {
    const groupEl = el.closest('.sc-opt-group');
    if (groupEl && !enabledGroups.has(groupEl.dataset.group)) return;
    v[el.dataset.key] = el.value;
  });
  if (spec.repeater) {
    v._items = [...document.querySelectorAll('#sc-repeater-list .repeater-row')].map((row) => {
      const item = {};
      row.querySelectorAll('[data-rk]').forEach((el) => { item[el.dataset.rk] = el.value; });
      return item;
    });
  }
  return v;
}
function updateSchemaWarnings() {
  updateSchemaPreview();
  if (!selected.has('schema')) { $('sc-warnings').textContent = ''; return; }
  const missing = missingRequired(scTypeSel.value, collectSchemaValues());
  $('sc-warnings').textContent = missing.length ? `Still empty (recommended): ${missing.join(', ')}` : '';
}
function updateSchemaPreview() {
  const box = $('sc-preview');
  if (!box) return;
  try {
    box.innerHTML = renderSchemaVisual(scTypeSel.value, collectSchemaValues());
    wireImgFallbacks(box, 'Image could not be loaded in this preview (hotlink protection or dead URL).');
  } catch (e) {
    box.textContent = `Preview unavailable: ${e.message}`;
  }
}
$('sc-copy-preview').addEventListener('click', async (e) => {
  await navigator.clipboard.writeText(schemaToScript(scTypeSel.value, collectSchemaValues()));
  e.target.textContent = 'Copied ✓';
  setTimeout(() => (e.target.textContent = 'Copy code'), 1500);
});
scTypeSel.addEventListener('change', renderSchemaForm);
$('sc-form').addEventListener('input', updateSchemaWarnings);
$('sc-repeater').addEventListener('input', updateSchemaWarnings);
renderSchemaForm();

// ---------- OPEN GRAPH: live visual preview ----------
function collectOgValues() {
  return {
    title: val('og-title'), description: val('og-description'), url: val('og-url'),
    siteName: val('og-sitename'), type: val('og-type'), locale: val('og-locale'),
    image: val('og-image'), imageAlt: val('og-imagealt'),
    includeTwitter: isChecked('og-twitter'), twitterCard: val('og-twittercard'),
    twitterSite: val('og-twittersite'), twitterCreator: val('og-twittercreator'),
    includeFbAppId: isChecked('og-fbappid-check'), fbAppId: val('og-fbappid'),
    includeArticle: isChecked('og-article'), articlePublished: val('og-article-published'),
    articleModified: val('og-article-modified'), articleAuthor: val('og-article-author'),
    articleSection: val('og-article-section'), articleTags: val('og-article-tags'),
    includeProduct: isChecked('og-product'), productPrice: val('og-product-price'),
    productCurrency: val('og-product-currency'), productAvailability: val('og-product-availability'),
    productBrand: val('og-product-brand'), productSku: val('og-product-sku'),
  };
}
// Replace any preview <img> that fails to load with a labeled placeholder
// (some sites block hotlinking, so a good URL can still fail inside a preview).
function wireImgFallbacks(scope, label) {
  scope.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      const fb = document.createElement('div');
      fb.className = `${img.className} og-img-empty`;
      fb.textContent = label;
      img.replaceWith(fb);
    });
  });
}

// Thumbnail preview of the selected share image, with real size feedback.
function updateOgThumb() {
  const thumb = $('og-image-thumb');
  const note = $('og-image-thumb-note');
  if (!thumb || !note) return;
  const url = val('og-image');
  if (!url) {
    thumb.hidden = true;
    thumb.dataset.url = '';
    note.textContent = 'No image selected yet — the share preview below will show a placeholder.';
    return;
  }
  if (thumb.dataset.url !== url) {
    thumb.dataset.url = url;
    thumb.src = url;
    note.textContent = 'Loading image…';
  }
  thumb.hidden = false;
}
$('og-image-thumb')?.addEventListener('load', (e) => {
  const img = e.target;
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return;
  $('og-image-thumb-note').textContent = Math.abs(w / h - 1.91) < 0.06 && w >= 600
    ? `✓ Image loaded — ${w} × ${h} (good share size).`
    : `Image loaded — ${w} × ${h}. Recommended share size is 1200 × 630; other sizes still work but platforms may crop them.`;
});
$('og-image-thumb')?.addEventListener('error', () => {
  const thumb = $('og-image-thumb');
  thumb.hidden = true;
  $('og-image-thumb-note').textContent = '⚠ This image could not be loaded for preview — the site may block hotlinking, or the URL may be dead. The generated tag will still use the URL; open the URL in a browser tab to double-check it.';
});

function updateOgPreview() {
  const box = $('og-preview');
  if (!box) return;
  try {
    box.innerHTML = renderOgVisual(collectOgValues());
    wireImgFallbacks(box, 'Image could not be loaded in this preview (hotlink protection or dead URL) — the tag will still use the URL.');
  } catch (e) {
    box.textContent = `Preview unavailable: ${e.message}`;
  }
  updateOgThumb();
}
$('section-og').addEventListener('input', updateOgPreview);
$('section-og').addEventListener('change', updateOgPreview);
updateOgPreview();

// ---------- GENERATE (only the selected tools) ----------
function download(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  if (globalThis.chrome?.downloads?.download) {
    chrome.downloads.download({ url, filename, saveAs: false });
  } else {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function renderResults() {
  const wrap = $('results');
  wrap.innerHTML = '';
  for (const t of TOOLS) {
    if (!results[t]) continue;
    const { title, filename, content } = results[t];
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `<h3>${title}</h3>`;
    const ta = document.createElement('textarea');
    ta.rows = 10; ta.readOnly = true; ta.value = content;
    const actions = document.createElement('div');
    actions.className = 'result-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-small'; copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => { await navigator.clipboard.writeText(content); copyBtn.textContent = 'Copied ✓'; setTimeout(() => (copyBtn.textContent = 'Copy'), 1500); });
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-small'; dlBtn.textContent = `Download ${filename}`;
    dlBtn.addEventListener('click', () => download(filename, content));
    actions.append(copyBtn, dlBtn);
    card.append(ta, actions);
    wrap.appendChild(card);
  }
  $('downloadAllBtn').hidden = Object.keys(results).length === 0;
}
$('downloadAllBtn').addEventListener('click', () => {
  for (const t of TOOLS) if (results[t]) download(results[t].filename, results[t].content);
});
$('generateBtn').addEventListener('click', () => {
  for (const t of TOOLS) delete results[t];
  const notes = [];

  if (selected.has('og')) {
    results.og = {
      title: 'Open Graph tags — paste into your page <head>',
      filename: 'open-graph-tags.html',
      content: generateOpenGraph(collectOgValues()),
    };
  }

  if (selected.has('robots')) {
    results.robots = {
      title: 'robots.txt — upload to your domain root',
      filename: 'robots.txt',
      content: generateRobots({
        groups: collectRobotsGroups(),
        blockAll: isChecked('rb-blockall'), allowAll: isChecked('rb-allowall'),
        crawlDelay: isChecked('rb-crawldelay-check') ? val('rb-crawldelay') : '',
        sitemapUrl: isChecked('rb-sitemap-check') ? val('rb-sitemap') : '',
      }),
    };
  }

  if (selected.has('sitemap')) {
    const excludes = val('sm-exclude').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const checkedLocs = new Set(
      [...document.querySelectorAll('#sm-urllist input[type=checkbox]')].filter((c) => c.checked).map((c) => c.dataset.loc)
    );
    let entries = smCollected.filter((u) => (checkedLocs.size === 0 || checkedLocs.has(u.loc)) && !excludes.some((x) => u.loc.includes(x)));
    if (entries.length === 0 && val('sm-manual')) {
      entries = val('sm-manual').split(/\r?\n/).map((l) => ({ loc: l.trim(), images: [] })).filter((u) => u.loc);
    }
    if (entries.length === 0) {
      notes.push('Sitemap skipped: no URLs yet — use "Fetch URLs" or add URLs manually first.');
    } else {
      const base = val('sm-base').replace(/\/$/, '');
      const today = new Date().toISOString().slice(0, 10);
      const freq = val('sm-opt-changefreq');
      const prioSel = val('sm-opt-priority');
      const urls = entries.map((u) => ({
        loc: u.loc,
        lastmod: isChecked('sm-opt-lastmod') ? today : '',
        changefreq: freq || '',
        priority: prioSel === '' ? '' : prioSel === '1.0' ? (u.loc === `${base}/` || u.loc === base ? '1.0' : '0.8') : prioSel,
        images: isChecked('sm-opt-images') ? u.images : [],
      }));
      if (urls.length > 50000) notes.push('Warning: sitemap has over 50,000 URLs — split it into multiple sitemaps for Google.');
      results.sitemap = { title: `sitemap.xml — ${urls.length} URLs`, filename: 'sitemap.xml', content: generateSitemap(urls) };
    }
  }

  if (selected.has('schema')) {
    const missing = missingRequired(scTypeSel.value, collectSchemaValues());
    if (missing.length) notes.push(`Schema note: these recommended fields are still empty — ${missing.join(', ')}. Generated anyway.`);
    results.schema = {
      title: `Schema (${scTypeSel.value}) — paste before </body> or in <head>`,
      filename: 'schema-jsonld.html',
      content: schemaToScript(scTypeSel.value, collectSchemaValues()),
    };
  }

  renderResults();
  $('generateHint').textContent = notes.length ? notes.join(' ') : 'Done — copy or download your files below.';
});

// ---------- init ----------
(async () => {
  const saved = await store.get('seoToolkitSelected');
  const initial = Array.isArray(saved) && saved.length ? saved : TOOLS;
  for (const t of initial) if (TOOLS.includes(t)) selected.add(t);
  refreshSelector();
})();
