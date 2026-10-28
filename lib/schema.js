// Schema (JSON-LD) generator: type specs drive the UI form; buildSchema is a
// pure function (also runs in Node tests).

const F = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
const AVAIL = ['https://schema.org/InStock', 'https://schema.org/OutOfStock', 'https://schema.org/PreOrder', 'https://schema.org/Discontinued'];
const AVAIL_LABELS = ['In stock', 'Out of stock', 'Pre-order', 'Discontinued'];

export const SCHEMA_TYPES = [
  {
    id: 'Organization', label: 'Organization',
    fields: [F('name', 'Organization name', 'text', { required: true }), F('url', 'Website URL', 'url'), F('logo', 'Logo URL', 'url'), F('description', 'Description', 'textarea'), F('sameAs', 'Social profile URLs (one per line)', 'lines')],
    optional: [
      { id: 'contact', label: 'Contact point', fields: [F('contactTelephone', 'Telephone', 'tel'), F('contactType', 'Contact type', 'select', { options: ['customer service', 'sales', 'technical support', 'billing support'] })] },
      { id: 'address', label: 'Postal address', fields: [F('streetAddress', 'Street address'), F('addressLocality', 'City'), F('addressRegion', 'State / region'), F('postalCode', 'Postal code'), F('addressCountry', 'Country code (e.g. US)')] },
    ],
  },
  {
    id: 'LocalBusiness', label: 'Local Business',
    fields: [F('name', 'Business name', 'text', { required: true }), F('image', 'Image URL', 'url'), F('url', 'Website URL', 'url'), F('telephone', 'Telephone', 'tel'), F('priceRange', 'Price range (e.g. $$)'), F('description', 'Description', 'textarea')],
    optional: [
      { id: 'address', label: 'Address', fields: [F('streetAddress', 'Street address'), F('addressLocality', 'City'), F('addressRegion', 'State / region'), F('postalCode', 'Postal code'), F('addressCountry', 'Country code (e.g. US)')] },
      { id: 'geo', label: 'Geo coordinates', fields: [F('geoLat', 'Latitude', 'number'), F('geoLng', 'Longitude', 'number')] },
      { id: 'hours', label: 'Opening hours', fields: [F('openingHours', 'Opening hours (e.g. Mo-Fr 09:00-17:00)')] },
    ],
  },
  {
    id: 'WebSite', label: 'WebSite',
    fields: [F('name', 'Site name', 'text', { required: true }), F('url', 'Site URL', 'url', { required: true }), F('description', 'Description', 'textarea')],
    optional: [
      { id: 'search', label: 'Site search (SearchAction)', fields: [F('searchTarget', 'Search URL template, e.g. https://example.com/search?q={search_term_string}', 'url')] },
    ],
  },
  {
    id: 'Article', label: 'Article',
    fields: [F('headline', 'Headline', 'text', { required: true }), F('image', 'Image URL', 'url'), F('authorName', 'Author name'), F('publisherName', 'Publisher name'), F('datePublished', 'Date published', 'date'), F('dateModified', 'Date modified', 'date'), F('description', 'Description', 'textarea')],
    optional: [],
  },
  {
    id: 'BlogPosting', label: 'Blog Posting',
    fields: [F('headline', 'Headline', 'text', { required: true }), F('image', 'Image URL', 'url'), F('authorName', 'Author name'), F('publisherName', 'Publisher name'), F('datePublished', 'Date published', 'date'), F('dateModified', 'Date modified', 'date'), F('description', 'Description', 'textarea')],
    optional: [],
  },
  {
    id: 'Product', label: 'Product',
    fields: [F('name', 'Product name', 'text', { required: true }), F('image', 'Image URL', 'url'), F('description', 'Description', 'textarea'), F('price', 'Price', 'number'), F('currency', 'Currency (e.g. USD)'), F('availability', 'Availability', 'select', { options: AVAIL, labels: AVAIL_LABELS })],
    optional: [
      { id: 'brand', label: 'Brand, SKU & identifiers', fields: [F('brand', 'Brand name'), F('sku', 'SKU'), F('mpn', 'MPN')] },
      { id: 'rating', label: 'Aggregate rating', fields: [F('ratingValue', 'Rating value (e.g. 4.5)', 'number'), F('reviewCount', 'Review count', 'number')] },
      { id: 'review', label: 'One featured review', fields: [F('reviewAuthor', 'Reviewer name'), F('reviewRating', 'Review rating (1-5)', 'number'), F('reviewBody', 'Review text', 'textarea')] },
    ],
  },
  { id: 'FAQPage', label: 'FAQ Page', fields: [], optional: [], repeater: 'faq' },
  {
    id: 'HowTo', label: 'How-To',
    fields: [F('name', 'How-to title', 'text', { required: true }), F('description', 'Description', 'textarea'), F('totalTime', 'Total time (ISO 8601, e.g. PT30M)')],
    optional: [{ id: 'supply', label: 'Supplies needed', fields: [F('supply', 'Supplies (one per line)', 'lines')] }],
    repeater: 'steps',
  },
  {
    id: 'Recipe', label: 'Recipe',
    fields: [F('name', 'Recipe name', 'text', { required: true }), F('image', 'Image URL', 'url'), F('description', 'Description', 'textarea'), F('authorName', 'Author name'), F('prepTime', 'Prep time (e.g. PT15M)'), F('cookTime', 'Cook time (e.g. PT30M)'), F('recipeYield', 'Yield (e.g. 4 servings)'), F('ingredients', 'Ingredients (one per line)', 'lines'), F('instructions', 'Instruction steps (one per line)', 'lines'), F('calories', 'Calories (number only)', 'number')],
    optional: [],
  },
  {
    id: 'Event', label: 'Event',
    fields: [F('name', 'Event name', 'text', { required: true }), F('startDate', 'Start date & time', 'datetime', { required: true }), F('endDate', 'End date & time', 'datetime'), F('locationName', 'Venue name'), F('locationAddress', 'Venue address'), F('description', 'Description', 'textarea'), F('image', 'Image URL', 'url')],
    optional: [{ id: 'offers', label: 'Ticket offer', fields: [F('price', 'Ticket price', 'number'), F('currency', 'Currency (e.g. USD)'), F('offerUrl', 'Ticket page URL', 'url')] }],
  },
  {
    id: 'Person', label: 'Person',
    fields: [F('name', 'Full name', 'text', { required: true }), F('jobTitle', 'Job title'), F('url', 'Website URL', 'url'), F('image', 'Photo URL', 'url'), F('worksFor', 'Works for (organization)'), F('sameAs', 'Social profile URLs (one per line)', 'lines')],
    optional: [],
  },
  {
    id: 'VideoObject', label: 'Video',
    fields: [F('name', 'Video title', 'text', { required: true }), F('description', 'Description', 'textarea', { required: true }), F('thumbnailUrl', 'Thumbnail URL', 'url', { required: true }), F('uploadDate', 'Upload date', 'date', { required: true }), F('duration', 'Duration (e.g. PT5M30S)'), F('contentUrl', 'Video file URL', 'url'), F('embedUrl', 'Embed URL', 'url')],
    optional: [],
  },
  { id: 'BreadcrumbList', label: 'Breadcrumb List', fields: [], optional: [], repeater: 'crumbs' },
  {
    id: 'Course', label: 'Course',
    fields: [F('name', 'Course name', 'text', { required: true }), F('description', 'Description', 'textarea', { required: true }), F('providerName', 'Provider name'), F('providerUrl', 'Provider URL', 'url')],
    optional: [],
  },
  {
    id: 'JobPosting', label: 'Job Posting',
    fields: [F('title', 'Job title', 'text', { required: true }), F('description', 'Full job description', 'textarea', { required: true }), F('datePosted', 'Date posted', 'date'), F('validThrough', 'Valid through', 'date'), F('hiringOrg', 'Hiring organization', 'text', { required: true }), F('jobLocation', 'Job city / location'), F('employmentType', 'Employment type', 'select', { options: ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER'] })],
    optional: [{ id: 'salary', label: 'Base salary', fields: [F('salaryValue', 'Salary amount', 'number'), F('salaryCurrency', 'Currency (e.g. USD)'), F('salaryUnit', 'Per', 'select', { options: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'] })] }],
  },
  {
    id: 'SoftwareApplication', label: 'Software / App',
    fields: [F('name', 'App name', 'text', { required: true }), F('operatingSystem', 'Operating system (e.g. Android, Windows)'), F('applicationCategory', 'Category (e.g. BusinessApplication)'), F('price', 'Price (0 = free)', 'number'), F('currency', 'Currency (e.g. USD)')],
    optional: [{ id: 'rating', label: 'Aggregate rating', fields: [F('ratingValue', 'Rating value', 'number'), F('ratingCount', 'Rating count', 'number')] }],
  },
];

function clean(o) {
  const out = {};
  for (const [k, val] of Object.entries(o)) {
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    out[k] = val;
  }
  return out;
}
const lines = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const address = (v) => {
  const a = clean({ '@type': 'PostalAddress', streetAddress: v.streetAddress, addressLocality: v.addressLocality, addressRegion: v.addressRegion, postalCode: v.postalCode, addressCountry: v.addressCountry });
  return Object.keys(a).length > 1 ? a : undefined;
};
const num = (x) => (x === '' || x === undefined || x === null ? undefined : Number(x));

export function buildSchema(type, v = {}) {
  const base = { '@context': 'https://schema.org', '@type': type };
  switch (type) {
    case 'Organization':
      return clean({ ...base, name: v.name, url: v.url, logo: v.logo, description: v.description, sameAs: lines(v.sameAs),
        contactPoint: v.contactTelephone ? clean({ '@type': 'ContactPoint', telephone: v.contactTelephone, contactType: v.contactType }) : undefined,
        address: address(v) });
    case 'LocalBusiness':
      return clean({ ...base, name: v.name, image: v.image, url: v.url, telephone: v.telephone, priceRange: v.priceRange, description: v.description,
        address: address(v),
        geo: v.geoLat && v.geoLng ? { '@type': 'GeoCoordinates', latitude: num(v.geoLat), longitude: num(v.geoLng) } : undefined,
        openingHours: v.openingHours });
    case 'WebSite':
      return clean({ ...base, name: v.name, url: v.url, description: v.description,
        potentialAction: v.searchTarget ? { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: v.searchTarget }, 'query-input': 'required name=search_term_string' } : undefined });
    case 'Article':
    case 'BlogPosting':
      return clean({ ...base, headline: v.headline, image: v.image, description: v.description, datePublished: v.datePublished, dateModified: v.dateModified,
        author: v.authorName ? { '@type': 'Person', name: v.authorName } : undefined,
        publisher: v.publisherName ? { '@type': 'Organization', name: v.publisherName } : undefined });
    case 'Product': {
      const rating = v.ratingValue ? clean({ '@type': 'AggregateRating', ratingValue: num(v.ratingValue), reviewCount: num(v.reviewCount) }) : undefined;
      const review = v.reviewBody || v.reviewAuthor ? clean({ '@type': 'Review', author: v.reviewAuthor ? { '@type': 'Person', name: v.reviewAuthor } : undefined, reviewRating: v.reviewRating ? { '@type': 'Rating', ratingValue: num(v.reviewRating) } : undefined, reviewBody: v.reviewBody }) : undefined;
      const offers = v.price !== undefined && v.price !== '' ? clean({ '@type': 'Offer', price: num(v.price), priceCurrency: v.currency, availability: v.availability }) : undefined;
      return clean({ ...base, name: v.name, image: v.image, description: v.description,
        brand: v.brand ? { '@type': 'Brand', name: v.brand } : undefined, sku: v.sku, mpn: v.mpn,
        aggregateRating: rating, review, offers });
    }
    case 'FAQPage': {
      const items = (v._items || []).filter((i) => i.q || i.a);
      return clean({ ...base, mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) });
    }
    case 'HowTo': {
      const steps = (v._items || []).filter((i) => i.name || i.text);
      return clean({ ...base, name: v.name, description: v.description, totalTime: v.totalTime,
        supply: lines(v.supply).map((s) => ({ '@type': 'HowToSupply', name: s })),
        step: steps.map((s) => clean({ '@type': 'HowToStep', name: s.name, text: s.text })) });
    }
    case 'Recipe':
      return clean({ ...base, name: v.name, image: v.image, description: v.description,
        author: v.authorName ? { '@type': 'Person', name: v.authorName } : undefined,
        prepTime: v.prepTime, cookTime: v.cookTime, recipeYield: v.recipeYield,
        recipeIngredient: lines(v.ingredients),
        recipeInstructions: lines(v.instructions).map((t) => ({ '@type': 'HowToStep', text: t })),
        nutrition: v.calories ? { '@type': 'NutritionInformation', calories: `${v.calories} calories` } : undefined });
    case 'Event':
      return clean({ ...base, name: v.name, startDate: v.startDate, endDate: v.endDate, description: v.description, image: v.image,
        location: v.locationName || v.locationAddress ? clean({ '@type': 'Place', name: v.locationName, address: v.locationAddress }) : undefined,
        offers: v.price !== undefined && v.price !== '' ? clean({ '@type': 'Offer', price: num(v.price), priceCurrency: v.currency, url: v.offerUrl, availability: 'https://schema.org/InStock' }) : undefined });
    case 'Person':
      return clean({ ...base, name: v.name, jobTitle: v.jobTitle, url: v.url, image: v.image,
        worksFor: v.worksFor ? { '@type': 'Organization', name: v.worksFor } : undefined, sameAs: lines(v.sameAs) });
    case 'VideoObject':
      return clean({ ...base, name: v.name, description: v.description, thumbnailUrl: v.thumbnailUrl, uploadDate: v.uploadDate, duration: v.duration, contentUrl: v.contentUrl, embedUrl: v.embedUrl });
    case 'BreadcrumbList': {
      const items = (v._items || []).filter((i) => i.name);
      return clean({ ...base, itemListElement: items.map((c, idx) => clean({ '@type': 'ListItem', position: idx + 1, name: c.name, item: c.url })) });
    }
    case 'Course':
      return clean({ ...base, name: v.name, description: v.description,
        provider: v.providerName ? clean({ '@type': 'Organization', name: v.providerName, url: v.providerUrl }) : undefined });
    case 'JobPosting':
      return clean({ ...base, title: v.title, description: v.description, datePosted: v.datePosted, validThrough: v.validThrough, employmentType: v.employmentType,
        hiringOrganization: v.hiringOrg ? { '@type': 'Organization', name: v.hiringOrg } : undefined,
        jobLocation: v.jobLocation ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: v.jobLocation } } : undefined,
        baseSalary: v.salaryValue ? { '@type': 'MonetaryAmount', currency: v.salaryCurrency, value: { '@type': 'QuantitativeValue', value: num(v.salaryValue), unitText: v.salaryUnit } } : undefined });
    case 'SoftwareApplication':
      return clean({ ...base, name: v.name, operatingSystem: v.operatingSystem, applicationCategory: v.applicationCategory,
        offers: v.price !== undefined && v.price !== '' ? { '@type': 'Offer', price: num(v.price), priceCurrency: v.currency } : undefined,
        aggregateRating: v.ratingValue ? clean({ '@type': 'AggregateRating', ratingValue: num(v.ratingValue), ratingCount: num(v.ratingCount) }) : undefined });
    default:
      return { ...base, name: v.name };
  }
}

export function schemaToScript(type, v) {
  const obj = buildSchema(type, v);
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>\n`;
}

// ---------------------------------------------------------------------------
// VISUAL preview: render a Google-rich-result style mock of what the public
// sees for this schema - NOT the code. Pure string builder (Node-testable).
// Empty fields render as muted placeholder text so the layout still shows.
// ---------------------------------------------------------------------------
function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function ph(value, placeholder) {
  const t = String(value ?? '').trim();
  return t ? escHtml(t) : `<span class="sv-ph">${placeholder}</span>`;
}
function stars(rating, count) {
  const r = Number(rating);
  if (!rating || Number.isNaN(r)) return '<span class="sv-ph">☆☆☆☆☆ rating</span>';
  const full = Math.max(0, Math.min(5, Math.round(r)));
  return `<span class="sv-stars">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span> ${escHtml(rating)}${count ? ` <span class="sv-dim">(${escHtml(count)} reviews)</span>` : ''}`;
}
function imgBox(url, label = '') {
  const u = String(url ?? '').trim();
  if (u) return `<img class="sv-img" src="${escHtml(u)}" alt="" referrerpolicy="no-referrer">`;
  return `<div class="sv-img sv-img-empty">${label}</div>`;
}
function priceLine(price, currency) {
  if (price === undefined || price === null || String(price).trim() === '') return '<span class="sv-ph">Price</span>';
  return `<strong>${escHtml(currency || '')} ${escHtml(price)}</strong>`;
}
function availBadge(av) {
  const map = { 'https://schema.org/InStock': 'In stock', 'https://schema.org/OutOfStock': 'Out of stock', 'https://schema.org/PreOrder': 'Pre-order', 'https://schema.org/Discontinued': 'Discontinued' };
  return av ? `<span class="sv-badge">${map[av] || 'Availability'}</span>` : '';
}
function card(inner) { return `<div class="sv-card">${inner}</div>`; }
function titleLine(v, fallback) { return `<div class="sv-title">${ph(v, fallback)}</div>`; }
function siteLine(name, url) { return `<div class="sv-site"><span class="sv-dot"></span><span>${ph(name, 'Your site')}</span><span class="sv-dim">${ph(url, 'https://your-site.com')}</span></div>`; }
function descLine(v) { return `<div class="sv-desc">${ph(v, 'A short description of this page will appear here in search results…')}</div>`; }

export function renderSchemaVisual(type, v = {}) {
  const items = (v._items || []).filter((i) => Object.values(i).some((x) => String(x || '').trim()));
  switch (type) {
    case 'Product':
      return card(`<div class="sv-flex">${imgBox(v.image, 'IMG')}<div class="sv-grow">
        ${siteLine(v.brand, '')}
        ${titleLine(v.name, 'Your product name')}
        <div class="sv-line">${stars(v.ratingValue, v.reviewCount)}</div>
        <div class="sv-line">${priceLine(v.price, v.currency)} ${availBadge(v.availability)}</div>
        ${descLine(v.description)}</div></div>`);
    case 'Article':
    case 'BlogPosting':
      return card(`${siteLine(v.publisherName, '')}${titleLine(v.headline, 'Your article headline')}
        <div class="sv-line sv-dim">${ph(v.datePublished, 'Publish date')} · by ${ph(v.authorName, 'Author name')}</div>
        ${descLine(v.description)}`);
    case 'FAQPage': {
      const qs = items.length ? items : [{ q: 'A question people ask?', a: 'The answer appears here when someone expands the question in search results.' }];
      return card(`<div class="sv-type">FAQ — expandable in Google search</div>` + qs.map((i) =>
        `<details class="sv-faq"><summary>${ph(i.q, 'Question?')}</summary><p>${ph(i.a, 'Answer text…')}</p></details>`).join(''));
    }
    case 'HowTo': {
      const steps = items.length ? items : [{ name: 'Step one', text: 'What to do in this step…' }];
      return card(`<div class="sv-type">How-to${v.totalTime ? ` · ⏱ ${escHtml(v.totalTime)}` : ''}</div>${titleLine(v.name, 'How to do something')}
        <ol class="sv-steps">${steps.map((s) => `<li><strong>${ph(s.name, 'Step title')}</strong> — ${ph(s.text, 'Step instructions…')}</li>`).join('')}</ol>`);
    }
    case 'Recipe': {
      const ings = String(v.ingredients || '').split(/\r?\n/).filter(Boolean).slice(0, 6);
      return card(`<div class="sv-flex">${imgBox(v.image, 'IMG')}<div class="sv-grow">
        ${titleLine(v.name, 'Your recipe name')}
        <div class="sv-line">⏱ Prep ${ph(v.prepTime, 'PT15M')} · Cook ${ph(v.cookTime, 'PT30M')} · Yield ${ph(v.recipeYield, '4 servings')}</div>
        ${v.calories ? `<div class="sv-line sv-dim">${escHtml(v.calories)} calories</div>` : ''}
        <div class="sv-chips">${(ings.length ? ings : ['Ingredient 1', 'Ingredient 2']).map((i) => `<span class="sv-chip">${escHtml(i)}</span>`).join('')}</div>
        ${descLine(v.description)}</div></div>`);
    }
    case 'Event':
      return card(`<div class="sv-type">Event</div>${titleLine(v.name, 'Your event name')}
        <div class="sv-line">📅 ${ph(String(v.startDate || '').replace('T', ' '), 'Start date & time')}${v.endDate ? ` → ${escHtml(String(v.endDate).replace('T', ' '))}` : ''}</div>
        <div class="sv-line">📍 ${ph(v.locationName, 'Venue')}${v.locationAddress ? `, ${escHtml(v.locationAddress)}` : ''}</div>
        <div class="sv-line">${priceLine(v.price, v.currency)} tickets</div>${descLine(v.description)}`);
    case 'LocalBusiness':
    case 'Organization': {
      const addr = [v.streetAddress, v.addressLocality, v.addressRegion, v.postalCode, v.addressCountry].filter((x) => String(x || '').trim()).join(', ');
      return card(`<div class="sv-type">${type === 'LocalBusiness' ? 'Local business' : 'Organization'} — knowledge panel style</div>
        <div class="sv-flex">${imgBox(v.logo || v.image, 'LOGO')}<div class="sv-grow">
        ${titleLine(v.name, 'Your business name')}
        ${v.priceRange ? `<div class="sv-line sv-dim">${escHtml(v.priceRange)}</div>` : ''}
        <div class="sv-line">📍 ${addr ? escHtml(addr) : '<span class="sv-ph">Street, City, Country</span>'}</div>
        ${v.telephone || v.contactTelephone ? `<div class="sv-line">📞 ${escHtml(v.telephone || v.contactTelephone)}</div>` : ''}
        ${v.openingHours ? `<div class="sv-line">🕐 ${escHtml(v.openingHours)}</div>` : ''}
        </div></div>`);
    }
    case 'WebSite':
      return card(`${titleLine(v.name, 'Your site name')}<div class="sv-line sv-dim">${ph(v.url, 'https://your-site.com')}</div>
        ${v.searchTarget ? `<div class="sv-search"><span>Search this site…</span><span class="sv-search-btn">Search</span></div>` : descLine(v.description)}`);
    case 'Person':
      return card(`<div class="sv-flex">${imgBox(v.image, 'PHOTO')}<div class="sv-grow">
        ${titleLine(v.name, 'Full name')}
        <div class="sv-line">${ph(v.jobTitle, 'Job title')}${v.worksFor ? ` · ${escHtml(v.worksFor)}` : ''}</div>
        ${descLine(v.url)}</div></div>`);
    case 'VideoObject':
      return card(`<div class="sv-flex"><div class="sv-video">${v.thumbnailUrl ? `<img class="sv-img" src="${escHtml(v.thumbnailUrl)}" alt="" referrerpolicy="no-referrer">` : '<span>▶</span>'}${v.duration ? `<span class="sv-dur">${escHtml(v.duration)}</span>` : ''}</div>
        <div class="sv-grow">${titleLine(v.name, 'Your video title')}
        <div class="sv-line sv-dim">Uploaded ${ph(v.uploadDate, 'date')}</div>${descLine(v.description)}</div></div>`);
    case 'BreadcrumbList': {
      const crumbs = items.length ? items : [{ name: 'Home' }, { name: 'Category' }, { name: 'This page' }];
      return card(`<div class="sv-type">Shown above the title in search results</div>
        <div class="sv-crumbs">${crumbs.map((c) => `<span>${ph(c.name, 'Page')}</span>`).join('<span class="sv-dim"> › </span>')}</div>
        ${titleLine('', 'Your page title')}${descLine('')}`);
    }
    case 'Course':
      return card(`<div class="sv-type">Course</div>${titleLine(v.name, 'Your course name')}
        <div class="sv-line sv-dim">by ${ph(v.providerName, 'Provider')}</div>${descLine(v.description)}`);
    case 'JobPosting':
      return card(`<div class="sv-type">Job — appears in Google Jobs</div>${titleLine(v.title, 'Job title')}
        <div class="sv-line">${ph(v.hiringOrg, 'Company')} · ${ph(v.jobLocation, 'Location')} · ${ph(v.employmentType, 'FULL_TIME')}</div>
        ${v.salaryValue ? `<div class="sv-line">${priceLine(v.salaryValue, v.salaryCurrency)} / ${escHtml(v.salaryUnit || 'YEAR')}</div>` : ''}
        ${descLine(v.description)}`);
    case 'SoftwareApplication':
      return card(`<div class="sv-flex">${imgBox('', 'APP')}<div class="sv-grow">
        ${titleLine(v.name, 'Your app name')}
        <div class="sv-line sv-dim">${ph(v.applicationCategory, 'Category')} · ${ph(v.operatingSystem, 'OS')}</div>
        <div class="sv-line">${stars(v.ratingValue, v.ratingCount)}</div>
        <div class="sv-line">${v.price && Number(v.price) > 0 ? priceLine(v.price, v.currency) : '<strong>Free</strong>'}</div></div></div>`);
    default:
      return card(`${titleLine(v.name || v.headline || v.title, 'Your title')}${descLine(v.description)}`);
  }
}

// Return names of required fields (from the spec) that are empty in v.
export function missingRequired(type, v = {}) {
  const spec = SCHEMA_TYPES.find((t) => t.id === type);
  if (!spec) return [];
  const missing = [];
  for (const f of [...spec.fields, ...spec.optional.flatMap((g) => g.fields)]) {
    if (f.required && !String(v[f.key] ?? '').trim()) missing.push(f.label);
  }
  if (spec.repeater && !(v._items || []).some((i) => Object.values(i).some((x) => String(x || '').trim()))) {
    missing.push('At least one list item');
  }
  return missing;
}
