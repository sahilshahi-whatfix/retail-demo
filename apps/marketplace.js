// Amazon (port 4005): Seller Central at /seller and amazon.com-style shopper listing pages.
// Listings are entered only through Seller Central; nothing syncs in from other systems.
const store = require('../lib/store');
const { html, raw, esc, makeApp, money, num, fmtDate, whatfixTag } = require('../lib/util');
const { imgSrc, thumbSrc, imageInfo } = require('../lib/files');
const { pickerAssets } = require('../lib/picker');

const app = makeApp('Amazon');

const CATEGORIES = ['Accent Chairs', 'Sofas and Couches', 'Ottomans', 'Coffee and Side Tables', 'Dining Tables', 'Bookcases', 'Floor Lamps', 'Table Lamps', 'Area Rugs'];
const SEATING = ['Accent Chairs', 'Sofas and Couches'];
const TITLE_MAX = 150, FEATURE_MAX = 250;

function deliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Amazon wordmark with the orange smile; `sub` adds a product name such as "seller central".
const amazonLogo = (sub = '', w = 98) => raw(`<svg width="${w + (sub ? 104 : 0)}" height="30" viewBox="0 0 ${w + (sub ? 104 : 0)} 30" aria-label="amazon${sub ? ' ' + sub : ''}"><text x="0" y="19" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="23" letter-spacing="-.8">amazon</text><path d="M6 22.5c13 7 40 8 62 -1" fill="none" stroke="#ff9900" stroke-width="2.6" stroke-linecap="round"/><path d="M63 19l6.5 1.6-3.4 5.4" fill="none" stroke="#ff9900" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${sub ? `<text x="${w + 4}" y="18" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="15">${sub}</text>` : ''}</svg>`);

// ---------- Seller Central ----------
const HUB_STYLE = `
:root{--nav:#002f36;--teal:#008296;--line:#d5dbdb;--text:#0f1111;--muted:#565959;--bg:#f2f4f4;--pk-accent:#008296;--pk-radius:8px}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 "Amazon Ember",Arial,Helvetica,sans-serif}
a{color:var(--teal);text-decoration:none}a:hover{text-decoration:underline;color:#c45500}
button,input,select,textarea{font:inherit;color:inherit}
.hub{background:var(--nav);color:#fff;display:flex;align-items:center;gap:14px;padding:0 16px;height:52px}
.hub .burger{font-size:22px;color:#fff;line-height:1}
.hub .lg{display:flex;align-items:center;color:#fff;text-decoration:none}
.hub .acct{display:flex;align-items:center;gap:6px;border:1px solid #3f6066;border-radius:6px;padding:3px 10px;font-size:13px;color:#fff;white-space:nowrap}
.hub .acct span{color:#9fbfc3}
.hub .hs{flex:1;max-width:520px;margin-left:auto;display:flex;align-items:center;background:#fff;border-radius:6px;height:32px;overflow:hidden}
.hub .hs input{flex:1;border:0;outline:0;padding:0 10px;font-size:13px}
.hub .hs span{padding:0 10px;color:#565959}
.hub .ico{display:flex;gap:14px;color:#fff;font-size:13px;align-items:center;white-space:nowrap}
.bm{background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:2px;padding:0 12px;height:40px;font-size:13px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.bm a{color:#0f1111;padding:9px 10px;border-bottom:3px solid transparent}
.bm a:hover{text-decoration:none;color:var(--teal)}
.bm a.on{border-bottom-color:var(--teal);font-weight:700}
.bm .ed{margin-left:auto;color:var(--teal);font-size:12px}
.wrap{padding:16px 20px 40px;max-width:1440px;margin:0 auto}
.welcome{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.welcome h1{font-size:24px;margin:0;font-weight:400}
.welcome .sp{flex:1}
.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #d5d9d9;background:#fff;padding:0 14px;height:31px;cursor:pointer;color:#0f1111;text-decoration:none;border-radius:8px;box-shadow:0 2px 5px rgba(213,217,217,.5);font-size:13px}
.btn:hover{background:#f7fafa;text-decoration:none;color:#0f1111}
.btn.go{background:#ffd814;border-color:#fcd200}
.btn.go:hover{background:#f7ca00}
.figs{display:grid;grid-template-columns:repeat(6,1fr);gap:0;margin-bottom:16px;background:#fff;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.fig{padding:12px 16px;border-right:1px solid var(--line)}
.fig:last-child{border-right:0}
.fig .l{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.02em}.fig .v{font-size:22px;margin-top:2px}
.box{background:#fff;border:1px solid var(--line);border-radius:8px;margin-bottom:16px;overflow:hidden}
.box h2{margin:0;font-size:16px;font-weight:700;padding:12px 16px;border-bottom:1px solid var(--line)}
.box .in{padding:12px 16px}
.cols{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:16px;align-items:start}
table.lt{width:100%;border-collapse:collapse;font-size:13px}
table.lt th{background:#f7fafa;text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);font-size:12px;font-weight:700;color:#0f1111}
table.lt td{padding:8px 10px;border-bottom:1px solid #e7eaea;vertical-align:middle}
table.lt img{width:44px;height:44px;object-fit:contain;border:1px solid #e7eaea;background:#fff}
.st{font-weight:700;font-size:12px;border-radius:4px;padding:1px 6px}.st.Active{color:#067d62;background:#e8f6f3}.st.Draft{color:#7a5c00;background:#fff4d4}
.notes li{margin-bottom:10px}
.notes .new{background:#c40000;color:#fff;font-size:10px;padding:1px 5px;margin-right:6px;font-weight:700;border-radius:3px}
.msg{border:1px solid;border-radius:8px;padding:12px 14px;margin-bottom:14px;background:#fff;box-shadow:inset 12px 0 0 0 currentColor;padding-left:26px}
.msg.ok{border-color:#067d62;color:#067d62}.msg.ok *{color:#0f1111}.msg.ok a{color:var(--teal)}
.msg.err{border-color:#cc0c39;color:#cc0c39}.msg.err *{color:#0f1111}
.tabs{display:flex;border-bottom:1px solid var(--line);background:#fff;border-radius:8px 8px 0 0;border:1px solid var(--line);padding:0 8px}
.tabs button{border:0;border-bottom:3px solid transparent;background:none;padding:12px 14px 9px;cursor:pointer;color:#0f1111;font-size:14px}
.tabs button:hover{color:var(--teal)}
.tabs button.on{border-bottom-color:var(--teal);font-weight:700;color:#0f1111}
.tabs button .e{background:#cc0c39;color:#fff;font-size:11px;padding:0 6px;margin-left:6px;font-weight:700;border-radius:9px}
.pane{display:none;background:#fff;border:1px solid var(--line);border-top:0;border-radius:0 0 8px 8px;padding:8px 20px}
.pane.on{display:block}
.fr{display:grid;grid-template-columns:260px 1fr;gap:14px;padding:12px 0;border-bottom:1px solid #eef0f0;align-items:start}
.fr:last-child{border-bottom:0}
.fr > label{font-weight:700;padding-top:5px;text-align:right}
.fr .req{color:#cc0c39}
.fr input[type=text],.fr input:not([type]),.fr select,.fr textarea{border:1px solid #888c8c;border-radius:3px;padding:4px 8px;min-height:31px;width:100%;max-width:640px;background:#fff;box-shadow:0 1px 0 rgba(255,255,255,.5),0 1px 0 rgba(0,0,0,.07) inset}
.fr input:focus,.fr select:focus,.fr textarea:focus{outline:0;border-color:#007185;box-shadow:0 0 0 3px #c8f3fa}
.fr select{background:#f0f2f2;border-color:#d5d9d9;border-radius:8px}
.fr textarea{min-height:58px}
.fr .help{color:var(--muted);font-size:12px;margin-top:3px}
.fr .cnt{color:var(--muted);font-size:12px;margin-top:3px}
.fr .cnt.over{color:#cc0c39;font-weight:700}
.fr .err{color:#cc0c39;font-size:12px;margin-top:4px;display:flex;gap:4px}
.fr .err::before{content:"!";font-weight:700;border:1.5px solid #cc0c39;border-radius:50%;width:14px;height:14px;font-size:10px;display:inline-flex;align-items:center;justify-content:center;flex:none;margin-top:1px}
.fr.bad input,.fr.bad select,.fr.bad textarea{border-color:#cc0c39;box-shadow:0 0 0 3px #f8d7da}
.units{display:flex;gap:6px;align-items:center}.units input{max-width:120px!important}
.imgslots{display:flex;gap:12px;flex-wrap:wrap}
.slot{width:130px;border:1px solid #d5d9d9;border-radius:8px;background:#fff;text-align:center;font-size:12px;overflow:hidden;padding-bottom:6px}
.slot .im{height:120px;display:flex;align-items:center;justify-content:center;background:#fff;border-bottom:1px solid #e7eaea}
.slot img{max-width:100%;max-height:100%}
.slot .cap{padding:4px;word-break:break-all}
.slot.main{border:2px solid var(--teal)}
.slot .btn{height:26px;font-size:12px;padding:0 8px;margin:2px}
.rule{background:#f3fbfc;border:1px solid #9fd4dc;border-radius:8px;padding:10px 14px;margin:8px 0 10px}
.actions{display:flex;gap:8px;justify-content:flex-end;padding:14px 0}
.qual .bar{height:10px;background:#e7eaea;border-radius:5px;margin:6px 0 10px;overflow:hidden}
.qual .bar i{display:block;height:100%;background:#067d62}
.qual li{margin-bottom:6px;list-style:none;padding-left:20px;position:relative;font-size:13px}
.qual li::before{position:absolute;left:0;font-weight:700}
.qual li.ok::before{content:"✓";color:#067d62}.qual li.no::before{content:"!";color:#cc0c39}
`;

const BOOKMARKS = [['home', 'Home', '/seller'], ['add', 'Add Products', '/seller/add'], ['catalog', 'Manage All Inventory', '/seller/listings'], ['orders', 'Manage Orders', '/seller/orders'],
  ['reports', 'Business Reports', '/seller/reports'], ['performance', 'Account Health', '/seller/performance']];

function hubPage(title, active, body, extra = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)} - Amazon Seller Central</title><style>${HUB_STYLE}</style>${whatfixTag()}</head><body>
<header class="hub"><span class="burger" aria-hidden="true">☰</span><a class="lg" href="/seller">${amazonLogo('seller central', 86)}</a>
<span class="acct">Alder &amp; Vale Home <span>|</span> United States ▾</span>
<form class="hs" action="/seller/listings" role="search"><input name="q" placeholder="Search" aria-label="Search Seller Central"><span>🔍</span></form>
<div class="ico"><span title="Messages">✉</span><span title="Settings">⚙</span><span>EN ▾</span><span>Help</span></div></header>
<nav class="bm">${BOOKMARKS.map(([k, l, h]) => `<a href="${h}" class="${active === k ? 'on' : ''}">${l}</a>`).join('')}<span class="ed">Edit</span></nav>
<div class="wrap">${body}</div>${extra}</body></html>`;
}

app.get('/seller', (req, res) => {
  const db = store.read();
  const ls = db.listings.slice().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const active = ls.filter((l) => l.status === 'Active').length;
  const drafts = ls.filter((l) => l.status === 'Draft').length;
  const done = req.query.submitted && db.listings.find((l) => l.id === req.query.submitted);
  res.send(hubPage('Home', 'home', html`
    ${done ? html`<div class="msg ok"><b>Listing submitted.</b> “${done.title.slice(0, 80)}${done.title.length > 80 ? '…' : ''}” is now Active. <a href="/dp/${done.id}" target="_blank" rel="noopener">View listing</a></div>` : ''}
    ${req.query.draft ? html`<div class="msg ok">Draft saved.</div>` : ''}
    <div class="welcome"><h1>Global Snapshot</h1><span class="sp"></span><a class="btn" href="/seller/bulk">Add Products via Upload</a><a class="btn go" href="/seller/add">Add a Product</a></div>
    <div class="figs">
      <div class="fig"><div class="l">Sales</div><div class="v">$18,420</div><div style="font-size:12px;color:#565959">Last 7 days</div></div>
      <div class="fig"><div class="l">Open Orders</div><div class="v">9</div><div style="font-size:12px;color:#565959">Total count</div></div>
      <div class="fig"><div class="l">Buyer Messages</div><div class="v">2</div><div style="font-size:12px;color:#565959">Cases requiring attention</div></div>
      <div class="fig"><div class="l">Featured Offer %</div><div class="v">98%</div><div style="font-size:12px;color:#565959">2 days ago</div></div>
      <div class="fig"><div class="l">Active Listings</div><div class="v">${active + db.offsets.activeListings}</div><div style="font-size:12px;color:#565959">${drafts} draft${drafts === 1 ? '' : 's'}</div></div>
      <div class="fig"><div class="l">Account Health</div><div class="v" style="color:#067d62">Healthy</div><div style="font-size:12px;color:#565959">Policy compliance</div></div></div>
    <div class="cols"><div>
      <div class="box"><h2>Recently updated listings</h2><table class="lt"><thead><tr><th></th><th>Product</th><th>Seller SKU</th><th>Price</th><th>Available</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
      ${ls.map((l) => html`<tr><td><img src="${thumbSrc(l.images[0])}" alt=""></td><td>${l.status === 'Active' ? html`<a href="/dp/${l.id}" target="_blank" rel="noopener">${l.title.slice(0, 70)}${l.title.length > 70 ? '…' : ''}</a>` : l.title.slice(0, 70)}<div style="color:var(--muted);font-size:12px">ASIN ${l.id}</div></td>
        <td>${l.sku}</td><td>${money(l.price)}</td><td>${l.qty}</td><td><span class="st ${l.status}">${l.status}</span></td><td>${fmtDate(l.updatedAt)}</td><td><a href="/seller/edit/${l.id}">Edit</a></td></tr>`)}
      </tbody></table><div class="in" style="color:var(--muted)">Showing ${ls.length} recently updated listings. <a href="/seller/listings">Manage All Inventory</a></div></div>
    </div><div>
      <div class="box"><h2>Inventory summary</h2><div class="in"><table class="lt"><tbody>
        <tr><td>Active</td><td style="text-align:right"><b>${active + db.offsets.activeListings}</b></td></tr><tr><td>Drafts</td><td style="text-align:right">${drafts}</td></tr>
        <tr><td>Inactive</td><td style="text-align:right">0</td></tr><tr><td>Suppressed</td><td style="text-align:right">0</td></tr></tbody></table></div></div>
      <div class="box"><h2>News</h2><div class="in"><ul class="notes" style="margin:0;padding-left:16px">
        <li><span class="new">NEW</span><b>Policy update:</b> chairs and sofas now require a maximum weight recommendation. Listings without one will be rejected.</li>
        <li>Main images must show the product only on a pure white background, at least 1000 px.</li>
        <li>Holiday shipping cutoffs are posted. Review your handling times.</li></ul></div></div>
    </div></div>`));
});

app.get('/seller/listings', (req, res) => {
  const db = store.read();
  res.send(hubPage('Manage All Inventory', 'catalog', html`<div class="welcome"><h1>Manage All Inventory</h1><span class="sp"></span><a class="btn go" href="/seller/add">Add a Product</a></div>
    <div class="box"><h2>${db.listings.length} products</h2><table class="lt"><thead><tr><th></th><th>Product name</th><th>ASIN</th><th>Seller SKU</th><th>Category</th><th>Price</th><th>Available</th><th>Status</th><th></th></tr></thead><tbody>
    ${db.listings.map((l) => html`<tr><td><img src="${thumbSrc(l.images[0])}" alt=""></td><td>${l.title}</td><td>${l.id}</td><td>${l.sku}</td><td>${l.category}</td><td>${money(l.price)}</td><td>${l.qty}</td><td><span class="st ${l.status}">${l.status}</span></td><td><a href="/seller/edit/${l.id}">Edit</a>${l.status === 'Active' ? html` · <a href="/dp/${l.id}" target="_blank" rel="noopener">View</a>` : ''}</td></tr>`)}
    </tbody></table></div>`));
});

for (const [p, key, name] of [['/seller/orders', 'orders', 'Manage Orders'], ['/seller/reports', 'reports', 'Business Reports'], ['/seller/performance', 'performance', 'Account Health'], ['/seller/bulk', 'add', 'Add Products via Upload']]) {
  app.get(p, (req, res) => res.send(hubPage(name, key, html`<div class="welcome"><h1>${name}</h1></div><div class="box"><h2>${name}</h2><div class="in">${name === 'Add Products via Upload' ? 'Download the category template, fill it in and upload it here. Bulk uploads are processed within 24 hours.' : 'Nothing needs your attention right now.'}</div></div>`)));
}

// ---------- Add / edit a product ----------
function blankListing() {
  return { title: '', brand: 'Alder & Vale Home', sku: '', idType: 'UPC', idValue: '', category: '', color: '', material: '', features: ['', '', '', '', ''], description: '',
    images: [], width: null, depth: null, height: null, weight: null, maxWeight: null, seatHeight: null, assembly: '',
    price: null, qty: null, condition: 'New', fulfillment: 'Seller fulfilled', handling: null, origin: '', prop65: '', compliance: '' };
}

function fromBody(b) {
  const l = blankListing();
  for (const k of ['title', 'brand', 'sku', 'idType', 'idValue', 'category', 'color', 'material', 'description', 'assembly', 'condition', 'fulfillment', 'origin', 'prop65']) l[k] = String(b[k] ?? '').trim();
  l.features = [0, 1, 2, 3, 4].map((i) => String(b['feature' + i] ?? '').trim());
  for (const k of ['width', 'depth', 'height', 'weight', 'maxWeight', 'seatHeight', 'price', 'qty', 'handling']) l[k] = num(String(b[k] ?? '').replace(/[$,\s]|lbs?|in(ches)?|"/gi, ''));
  const main = String(b.mainImage || '').trim();
  const others = String(b.images || '').split('|').filter(Boolean).filter((f) => f !== main);
  l.images = main ? [main, ...others] : others;
  l.mainImage = main;
  l.compliance = b.compliance === '1' ? '1' : '';
  return l;
}

// Field errors keyed by field name, with the tab each belongs to.
const TAB_OF = { title: 'identity', brand: 'identity', sku: 'identity', idValue: 'identity', category: 'identity', color: 'identity', features: 'description', mainImage: 'images',
  width: 'details', depth: 'details', height: 'details', weight: 'details', maxWeight: 'details', assembly: 'details', price: 'offer', qty: 'offer', condition: 'offer', fulfillment: 'offer', handling: 'offer' };

function validate(l) {
  const e = {};
  const need = (k, label) => { if (l[k] === null || l[k] === undefined || l[k] === '') e[k] = `${label} is required.`; };
  need('title', 'Item Name');
  if (l.title.length > TITLE_MAX) e.title = `Item Name is ${l.title.length} characters. The maximum is ${TITLE_MAX}.`;
  need('brand', 'Brand Name'); need('sku', 'Seller SKU'); need('category', 'Product Type'); need('color', 'Color');
  if (l.idType !== 'GTIN exempt') {
    if (!l.idValue) e.idValue = 'Product Id is required, or choose GTIN exempt.';
    else if (l.idType === 'UPC' && !/^\d{12}$/.test(l.idValue)) e.idValue = 'A UPC must be exactly 12 digits.';
    else if (l.idType === 'EAN' && !/^\d{13}$/.test(l.idValue)) e.idValue = 'An EAN must be exactly 13 digits.';
  }
  const feats = l.features.filter(Boolean);
  if (!feats.length) e.features = 'Add at least one bullet point.';
  else if (l.features.some((f) => f.length > FEATURE_MAX)) e.features = `Each bullet point can be at most ${FEATURE_MAX} characters.`;
  if (!l.mainImage) e.mainImage = 'A main image is required.';
  else {
    const info = imageInfo(l.mainImage);
    if (!info) e.mainImage = 'The main image file could not be found.';
    else if (info.whiteBg === false) e.mainImage = 'Main image rejected: it must show the product only on a pure white background. Lifestyle or room scenes can be added as additional images.';
    else if (Math.max(info.w, info.h) < 1000) e.mainImage = `Main image rejected: it is ${info.w} × ${info.h} px. It must be at least 1000 px on the longest side.`;
  }
  need('width', 'Item Width'); need('depth', 'Item Depth'); need('height', 'Item Height'); need('weight', 'Item Weight');
  if (SEATING.includes(l.category) && (l.maxWeight === null || l.maxWeight === undefined)) e.maxWeight = 'Maximum Weight Recommendation is required for chairs and sofas.';
  need('assembly', 'Is Assembly Required');
  need('price', 'Your Price'); if (l.price !== null && l.price <= 0) e.price = 'Price must be greater than 0.';
  need('qty', 'Quantity'); need('condition', 'Condition'); need('fulfillment', 'Fulfillment Channel'); need('handling', 'Handling Time');
  return e;
}

function form(req, res, l, opts = {}) {
  const e = opts.errors || {};
  const errCount = (tab) => Object.keys(e).filter((k) => (TAB_OF[k] || 'identity') === tab).length;
  const tabs = [['identity', 'Product Details'], ['description', 'Description'], ['details', 'Dimensions'], ['images', 'Images'], ['offer', 'Offer'], ['compliance', 'Safety & Compliance']];
  const firstBad = tabs.find(([k]) => errCount(k));
  const openTab = (firstBad && firstBad[0]) || req.query.tab || 'identity';
  const row = (key, label, input, o = {}) => html`<div class="fr ${e[key] ? 'bad' : ''}" id="row-${key}"><label for="${o.for || key}">${label}${o.req ? html` <span class="req">*</span>` : ''}</label><div>${input}${o.help ? html`<div class="help">${o.help}</div>` : ''}${o.after || ''}${e[key] ? html`<div class="err" role="alert">${e[key]}</div>` : ''}</div></div>`;
  const txt = (k, v, attrs = '') => html`<input id="${k}" name="${k}" value="${v ?? ''}" ${raw(attrs)}>`;
  const sel = (k, v, options) => html`<select id="${k}" name="${k}"><option value="">- Select -</option>${options.map((o) => html`<option ${String(v) === o ? 'selected' : ''}>${o}</option>`)}</select>`;
  const unit = (k, v, u) => html`<span class="units"><input id="${k}" name="${k}" value="${v ?? ''}" inputmode="decimal"> ${u}</span>`;
  const action = opts.id ? `/seller/edit/${opts.id}` : '/seller/add';
  const errorList = Object.keys(e).length;

  const body = html`
    <div class="welcome"><h1>${opts.id ? 'Edit Product' : 'Add a Product'}</h1><span class="sp"></span><a href="/seller">Back to Seller Central</a></div>
    ${errorList ? html`<div class="msg err" role="alert"><b>Your listing was not submitted.</b> Fix ${errorList} problem${errorList > 1 ? 's' : ''} marked below, then submit again.</div>` : ''}
    <form method="post" action="${action}" id="lf" novalidate>
    <input type="hidden" name="mainImage" id="mainImage" value="${l.images[0] || ''}">
    <input type="hidden" name="images" id="images" value="${l.images.slice(1).join('|')}">
    <div class="cols"><div>
      <div class="tabs" role="tablist">${tabs.map(([k, n]) => html`<button type="button" role="tab" data-tab="${k}" class="${openTab === k ? 'on' : ''}" onclick="tab('${k}')">${n}${errCount(k) ? html`<span class="e">${errCount(k)}</span>` : ''}</button>`)}</div>

      <div class="pane ${openTab === 'identity' ? 'on' : ''}" data-pane="identity">
        ${row('title', 'Item Name', html`<textarea id="title" name="title" rows="2" oninput="count(this,${TITLE_MAX},'tc')">${l.title}</textarea>`, { req: true, after: html`<div class="cnt" id="tc">${l.title.length} / ${TITLE_MAX} characters</div>`, help: 'Brand, product name, key attributes, color. No promotional language.' })}
        ${row('brand', 'Brand Name', txt('brand', l.brand), { req: true })}
        ${row('sku', 'Seller SKU', txt('sku', l.sku), { req: true, help: 'Your own identifier for this product.' })}
        ${row('idValue', 'Product Id', html`<span class="units"><select name="idType" aria-label="Product Id Type" style="max-width:150px">${['UPC', 'EAN', 'GTIN exempt'].map((o) => html`<option ${l.idType === o ? 'selected' : ''}>${o}</option>`)}</select><input id="idValue" name="idValue" value="${l.idValue}" style="max-width:240px!important"></span>`, { req: true, help: 'Product Id Type and Product Id. Choose GTIN exempt if the product has no barcode.' })}
        ${row('category', 'Product Type', sel('category', l.category, CATEGORIES), { req: true })}
        ${row('color', 'Color', txt('color', l.color), { req: true })}
        ${row('material', 'Material', txt('material', l.material))}
      </div>

      <div class="pane ${openTab === 'description' ? 'on' : ''}" data-pane="description">
        ${row('features', 'Bullet Point', html`${[0, 1, 2, 3, 4].map((i) => html`<div style="margin-bottom:8px"><textarea id="${i === 0 ? 'features' : 'feature' + i}" name="feature${i}" rows="2" aria-label="Bullet point ${i + 1}" oninput="count(this,${FEATURE_MAX},'fc${i}')">${l.features[i] || ''}</textarea><div class="cnt" id="fc${i}">${(l.features[i] || '').length} / ${FEATURE_MAX}</div></div>`)}`, { req: true, help: 'Up to five bullet points shown under “About this item”.' })}
        ${row('description', 'Product Description', html`<textarea id="description" name="description" rows="5">${l.description}</textarea>`)}
      </div>

      <div class="pane ${openTab === 'details' ? 'on' : ''}" data-pane="details">
        ${row('width', 'Item Width', unit('width', l.width, 'inches'), { req: true })}
        ${row('depth', 'Item Depth', unit('depth', l.depth, 'inches'), { req: true })}
        ${row('height', 'Item Height', unit('height', l.height, 'inches'), { req: true })}
        ${row('weight', 'Item Weight', unit('weight', l.weight, 'pounds'), { req: true })}
        ${row('maxWeight', 'Maximum Weight Recommendation', unit('maxWeight', l.maxWeight, 'pounds'), { req: true, help: 'Required for chairs and sofas.' })}
        ${row('seatHeight', 'Seat Height', unit('seatHeight', l.seatHeight, 'inches'))}
        ${row('assembly', 'Is Assembly Required', sel('assembly', l.assembly, ['Yes', 'No']), { req: true })}
      </div>

      <div class="pane ${openTab === 'images' ? 'on' : ''}" data-pane="images">
        <div class="rule"><b>Image rules:</b> main image must show the product only on a pure white background, at least 1000 px. Up to 6 additional images may show the product in use.</div>
        ${row('mainImage', 'Images', html`<div class="imgslots" id="slots"></div>`, { req: true, for: 'addimg' })}
      </div>

      <div class="pane ${openTab === 'offer' ? 'on' : ''}" data-pane="offer">
        ${row('price', 'Your Price', html`<span class="units">USD <input id="price" name="price" value="${l.price ?? ''}" inputmode="decimal"></span>`, { req: true })}
        ${row('qty', 'Quantity', txt('qty', l.qty, 'inputmode="numeric" style="max-width:120px"'), { req: true })}
        ${row('condition', 'Condition', sel('condition', l.condition, ['New', 'Renewed', 'Used - Like New']), { req: true })}
        ${row('fulfillment', 'Fulfillment Channel', sel('fulfillment', l.fulfillment, ['Seller fulfilled', 'Fulfilled by Amazon']), { req: true })}
        ${row('handling', 'Handling Time', unit('handling', l.handling, 'business days'), { req: true })}
      </div>

      <div class="pane ${openTab === 'compliance' ? 'on' : ''}" data-pane="compliance">
        ${row('origin', 'Country of Origin', sel('origin', l.origin, ['United States', 'Canada', 'Mexico', 'Vietnam', 'China', 'Other']))}
        ${row('prop65', 'California Proposition 65 warning', sel('prop65', l.prop65, ['No warning applicable', 'Warning required']))}
        ${row('compliance', 'Seller Declaration', html`<label style="font-weight:normal"><input type="checkbox" name="compliance" value="1" ${l.compliance ? 'checked' : ''}> This product meets all applicable safety standards for its category.</label>`)}
      </div>

      <div class="actions"><a class="btn" href="/seller">Cancel</a><button class="btn" name="action" value="draft">Save as draft</button><button class="btn go" name="action" value="submit">Save and finish</button></div>
    </div>
    <div class="box qual"><h2>Listing quality</h2><div class="in"><div>Score: <b id="qs">0</b> / 100</div><div class="bar"><i id="qb" style="width:0"></i></div><ul style="padding:0;margin:0" id="ql"></ul></div></div>
    </div></form>`;

  const script = `<script>
  function tab(k){ document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === k)); document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === k)); }
  function count(el, max, id){ const c = document.getElementById(id); c.textContent = el.value.length + ' / ' + max + (id === 'tc' ? ' characters' : ''); c.classList.toggle('over', el.value.length > max); quality(); }
  const src = (f) => f.startsWith('art:') ? '/art/' + f.slice(4) + '.svg' : '/thumbs/' + encodeURIComponent(f);
  const escH = (s) => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function imgs(){ const m = document.getElementById('mainImage').value; const o = document.getElementById('images').value; return { main: m, others: o ? o.split('|') : [] }; }
  function setImgs(main, others){ document.getElementById('mainImage').value = main || ''; document.getElementById('images').value = others.join('|'); drawSlots(); quality(); }
  function drawSlots(){
    const { main, others } = imgs();
    let h = '<div class="slot main"><div class="im">' + (main ? '<img src="' + src(main) + '" alt="">' : 'No main image') + '</div><div class="cap"><b>MAIN</b>' + (main ? '<br>' + escH(main) : '') + '</div>' +
      '<button type="button" class="btn" id="addimg" onclick="pickMain()">' + (main ? 'Change' : 'Choose main image') + '</button></div>';
    others.forEach((f, i) => { h += '<div class="slot"><div class="im"><img src="' + src(f) + '" alt=""></div><div class="cap">' + escH(f) + '</div><button type="button" class="btn" onclick="makeMain(' + i + ')">Make main</button> <button type="button" class="btn" onclick="removeImg(' + i + ')">Remove</button></div>'; });
    if (others.length < 6) h += '<div class="slot"><div class="im" style="color:#5d6762">+</div><div class="cap">Additional image</div><button type="button" class="btn" onclick="pickOthers()">Add images</button></div>';
    document.getElementById('slots').innerHTML = h;
  }
  function pickMain(){ openPicker({ kind: 'image', title: 'Choose main image' }, f => { const { others } = imgs(); setImgs(f[0], others.filter(x => x !== f[0])); }); }
  function pickOthers(){ openPicker({ kind: 'image', multiple: true, title: 'Add additional images' }, f => { const { main, others } = imgs(); setImgs(main, others.concat(f.filter(x => x !== main && !others.includes(x))).slice(0, 6)); }); }
  function makeMain(i){ const { main, others } = imgs(); const n = others[i]; const rest = others.filter((_, j) => j !== i); if (main) rest.unshift(main); setImgs(n, rest); }
  function removeImg(i){ const { main, others } = imgs(); setImgs(main, others.filter((_, j) => j !== i)); }
  function quality(){
    const v = (id) => (document.getElementById(id) || {}).value || '';
    const feats = [0,1,2,3,4].map(i => v(i === 0 ? 'features' : 'feature' + i)).filter(Boolean).length;
    const { main, others } = imgs();
    const checks = [
      ['Title between 60 and 150 characters', v('title').length >= 60 && v('title').length <= 150],
      ['Five key product features', feats === 5],
      ['Main image added', !!main],
      ['At least 3 images', (main ? 1 : 0) + others.length >= 3],
      ['Dimensions and weight complete', ['width','depth','height','weight'].every(k => v(k))],
      ['Maximum weight recommendation', !!v('maxWeight') || !['Accent Chairs','Sofas and Couches'].includes(v('category'))],
      ['Price and quantity set', !!v('price') && !!v('qty')],
    ];
    const score = Math.round(checks.filter(c => c[1]).length / checks.length * 100);
    document.getElementById('qs').textContent = score; document.getElementById('qb').style.width = score + '%';
    document.getElementById('ql').innerHTML = checks.map(c => '<li class="' + (c[1] ? 'ok' : 'no') + '">' + c[0] + '</li>').join('');
  }
  document.getElementById('lf').addEventListener('input', quality);
  drawSlots(); quality();
  </script>`;
  res.send(hubPage(opts.id ? 'Edit Product' : 'Add a Product', 'add', body, pickerAssets() + script));
}

app.get('/seller/add', (req, res) => form(req, res, blankListing()));
app.get('/seller/edit/:id', (req, res) => {
  const l = store.read().listings.find((x) => x.id === req.params.id);
  if (!l) return res.status(404).send(hubPage('Not found', 'catalog', html`<p>Listing not found.</p>`));
  form(req, res, { ...blankListing(), ...l, features: [...l.features, '', '', '', '', ''].slice(0, 5) }, { id: l.id });
});

function newId() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'B0';
  for (let i = 0; i < 8; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

function saveListing(req, res, existingId) {
  const l = fromBody(req.body);
  const isDraft = req.body.action === 'draft';
  const errors = isDraft ? (l.title ? (l.title.length > TITLE_MAX ? { title: `Item Name is ${l.title.length} characters. The maximum is ${TITLE_MAX}.` } : {}) : { title: 'Item Name is required.' }) : validate(l);
  if (Object.keys(errors).length) return form(req, res, l, { errors, id: existingId });
  const now = new Date().toISOString();
  let id = existingId;
  store.update((db) => {
    const rec = { ...l, features: l.features.filter(Boolean), status: isDraft ? 'Draft' : 'Active', updatedAt: now };
    delete rec.mainImage;
    const cur = existingId && db.listings.find((x) => x.id === existingId);
    if (cur) Object.assign(cur, rec, { status: isDraft && cur.status === 'Active' ? 'Active' : rec.status });
    else { id = newId(); db.listings.push({ id, createdAt: now, rating: null, reviews: 0, ...rec }); }
  });
  res.redirect(isDraft ? '/seller?draft=1' : `/seller?submitted=${id}`);
}
app.post('/seller/add', (req, res) => saveListing(req, res, null));
app.post('/seller/edit/:id', (req, res) => saveListing(req, res, req.params.id));

// ---------- Shopper pages ----------
const SHOP_STYLE = `
:root{--line:#e7e7e7;--text:#0f1111;--muted:#565959;--link:#007185}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--text);font:14px/20px "Amazon Ember",Arial,Helvetica,sans-serif}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline;color:#c7511f}
.top{background:#131921;display:flex;align-items:center;gap:6px;padding:0 10px;height:60px;color:#fff}
.top .lg{display:flex;align-items:center;padding:8px 8px 4px;border:1px solid transparent;border-radius:2px}
.top .lg:hover,.top .acct:hover,.top .deliver:hover{border-color:#fff}
.top .lg small{color:#fff;font-size:12px;margin:-6px 0 0 -2px}
.top .deliver{font-size:12px;color:#ccc;line-height:15px;padding:6px 8px;border:1px solid transparent;border-radius:2px;white-space:nowrap}.top .deliver b{color:#fff;display:block;font-size:14px}
.top form{flex:1;display:flex;height:40px;border-radius:4px;overflow:hidden;margin:0 6px}
.top form:focus-within{box-shadow:0 0 0 3px #f90}
.top form select{border:0;background:#e6e6e6;padding:0 8px;font-size:12px;color:#555;border-right:1px solid #cdcdcd}
.top form input{flex:1;border:0;padding:0 10px;font-size:15px;outline:0}
.top form button{width:45px;border:0;background:#febd69;cursor:pointer;font-size:17px}
.top form button:hover{background:#f3a847}
.top .acct{font-size:12px;line-height:15px;color:#fff;padding:6px 8px;border:1px solid transparent;border-radius:2px;white-space:nowrap}.top .acct b{color:#fff;font-size:14px;display:block}
.top .cart{display:flex;align-items:flex-end;gap:2px;font-weight:700;font-size:14px}
.top .cart span{font-size:26px;line-height:26px}
.cats{background:#232f3e;display:flex;gap:2px;padding:0 10px;font-size:14px;height:39px;align-items:center}
.cats a{color:#fff;padding:6px 8px;border:1px solid transparent;border-radius:2px;white-space:nowrap}
.cats a:hover{border-color:#fff;text-decoration:none;color:#fff}
.cats a.all{font-weight:700}
main{max-width:1500px;margin:0 auto;padding:14px 18px 50px}
.crumb{font-size:12px;color:var(--muted);margin-bottom:12px}
.crumb a{color:var(--muted)}
.lp{display:grid;grid-template-columns:50px minmax(0,520px) minmax(0,1fr) 245px;gap:20px;align-items:start}
.th{display:flex;flex-direction:column;gap:10px}
.th button{width:42px;height:52px;border:1px solid #a2a6ac;border-radius:8px;padding:2px;background:#fff;cursor:pointer}
.th button.on{border-color:#007185;box-shadow:0 0 0 2px #c8f3fa}
.th img{width:100%;height:100%;object-fit:contain}
.big{height:520px;display:flex;align-items:center;justify-content:center;background:#fff}
.big img{max-width:100%;max-height:100%;object-fit:contain}
h1.t{font-size:24px;font-weight:400;line-height:32px;margin:0 0 4px}
.rate{color:var(--muted);font-size:14px;margin:4px 0;display:flex;gap:6px;align-items:center}
.stars{color:#de7921;letter-spacing:1px;font-size:16px}
hr{border:0;border-top:1px solid var(--line);margin:10px 0}
.pr{font-size:28px;line-height:32px}.pr sup{font-size:13px;position:relative;top:-.3em;vertical-align:top}
.kv{display:grid;grid-template-columns:150px 1fr;gap:6px;margin:10px 0}
.kv b{font-weight:700}
.about h3{font-size:16px;margin:14px 0 6px;font-weight:700}
.about ul{margin:0;padding-left:18px}.about li{margin-bottom:5px}
.buy{border:1px solid #d5d9d9;border-radius:8px;padding:18px}
.buy .pr{font-size:28px}
.buy .del{margin:10px 0;font-size:14px}.buy .del b{font-weight:700}
.buy .del a{display:block}
.buy .stock{color:#007600;font-size:18px;margin:10px 0}
.buy select{border:1px solid #d5d9d9;border-radius:8px;padding:6px;background:#f0f2f2;width:100%;margin-bottom:12px;box-shadow:0 2px 5px rgba(15,17,17,.15)}
.buy .b{display:block;width:100%;border:0;border-radius:100px;padding:8px;margin-bottom:8px;cursor:pointer;font-size:13px}
.buy .cart{background:#ffd814}.buy .cart:hover{background:#f7ca00}.buy .now{background:#ffa41c}.buy .now:hover{background:#fa8900}
.buy table{font-size:12px;color:var(--muted)}.buy td{padding:2px 10px 2px 0}.buy td+td{color:var(--text)}
.det{margin-top:28px;border-top:1px solid var(--line);padding-top:16px}
.det h2{font-size:24px;font-weight:700;margin:0 0 12px}
.det table{border-collapse:collapse;min-width:640px}
.det th{background:#f3f3f3;text-align:left;font-weight:700;padding:7px 14px;border-bottom:1px solid #e7e7e7;width:270px}
.det td{padding:7px 14px;border-bottom:1px solid #e7e7e7}
.rbar{border-bottom:1px solid var(--line);box-shadow:0 2px 4px rgba(0,0,0,.05);padding:8px 18px;margin:-14px -18px 14px;font-size:14px}
.rbar b{color:#c45500}
.res{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.res a.card{border:1px solid #e3e6e6;border-radius:4px;color:var(--text);display:block;overflow:hidden}
.res a.card:hover{text-decoration:none}
.res .ib{background:#f7f7f7;padding:12px}
.res img{width:100%;height:220px;object-fit:contain;mix-blend-mode:multiply}
.res .tx{padding:8px 12px 14px}
.res .tx .n{font-size:16px;line-height:24px;max-height:72px;overflow:hidden}
.res a.card:hover .n{color:#c7511f}
`;

function shopPage(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${SHOP_STYLE}</style></head><body>
<header class="top"><a class="lg" href="/">${amazonLogo()}<small>.com</small></a><div class="deliver">Deliver to<b>📍 Raleigh 27601</b></div>
<form action="/s" role="search"><select aria-label="Department"><option>All</option><option>Home &amp; Kitchen</option></select><input name="k" placeholder="Search Amazon" aria-label="Search Amazon"><button aria-label="Go">🔍</button></form>
<div class="acct">🇺🇸 <b style="display:inline">EN</b></div><div class="acct">Hello, Alder &amp; Vale<b>Account &amp; Lists ▾</b></div><div class="acct">Returns<b>&amp; Orders</b></div><div class="acct cart"><span>🛒</span>Cart</div></header>
<nav class="cats"><a class="all" href="/s?k=">☰ All</a><a href="/s?k=">Today's Deals</a><a href="/s?k=furniture">Furniture</a><a href="/s?k=sofa">Living Room</a><a href="/s?k=dining">Dining</a><a href="/s?k=lamp">Lighting</a><a href="/s?k=rug">Rugs</a><a href="/s?k=">Customer Service</a><a href="/s?k=">Registry</a></nav>
<main>${body}</main></body></html>`;
}

const stars = (r) => (r ? '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r)) : '☆☆☆☆☆');
const priceHtml = (p) => { const [d, c] = Number(p).toFixed(2).split('.'); return raw(`<sup>$</sup>${Number(d).toLocaleString('en-US')}<sup>${c}</sup>`); };

app.get('/', (req, res) => res.redirect('/s?k='));

app.get('/s', (req, res) => {
  const db = store.read();
  const k = String(req.query.k || '').toLowerCase();
  const list = db.listings.filter((l) => l.status === 'Active' && [l.title, l.category, l.color, l.brand].join(' ').toLowerCase().includes(k));
  res.send(shopPage(`Amazon.com${k ? ' : ' + req.query.k : ''}`, html`<div class="rbar">1-${list.length} of ${list.length} results${k ? html` for <b>“${req.query.k}”</b>` : ''}</div><h2 style="font-size:20px;margin:0 0 4px">Results</h2><div style="color:#565959;font-size:13px;margin-bottom:12px">Check each product page for other buying options.</div>
    <div class="res">${list.map((l) => html`<a class="card" href="/dp/${l.id}"><div class="ib"><img src="${thumbSrc(l.images[0])}" alt=""></div><div class="tx"><div class="n">${l.title.slice(0, 110)}${l.title.length > 110 ? '…' : ''}</div><div><span class="stars">${stars(l.rating)}</span> <span style="color:#007185;font-size:13px">${l.reviews}</span></div><div class="pr" style="font-size:28px;margin-top:4px">${priceHtml(l.price)}</div><div style="font-size:13px;margin-top:6px">FREE delivery <b>${deliveryDate()}</b></div></div></a>`)}</div>`));
});

app.get('/dp/:id', (req, res) => {
  const db = store.read();
  const l = db.listings.find((x) => x.id === req.params.id);
  if (!l || l.status !== 'Active') return res.status(404).send(shopPage('Page not found', html`<h1 class="t">Sorry, we couldn’t find that page.</h1><p><a href="/">Go to the Amazon.com home page</a></p>`));
  const rows = [
    ['Brand', l.brand], ['Color', l.color], ['Material', l.material], ['Product Dimensions', `${l.depth}"D x ${l.width}"W x ${l.height}"H`],
    ['Item Weight', `${l.weight} Pounds`], ['Maximum Weight Recommendation', l.maxWeight ? `${l.maxWeight} Pounds` : null], ['Seat Height', l.seatHeight ? `${l.seatHeight} Inches` : null],
    ['Assembly Required', l.assembly], ['Product type', l.category], ['ASIN', l.id], ['Item model number', l.sku], ['Date First Available', fmtDate(l.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })],
  ].filter(([, v]) => v);
  res.send(shopPage(`Amazon.com: ${l.title.slice(0, 90)} : Home & Kitchen`, html`
    <div class="crumb"><a href="/s?k=">Home &amp; Kitchen</a> › <a href="/s?k=furniture">Furniture</a> › <a href="/s?k=${encodeURIComponent(l.category)}">${l.category}</a></div>
    <div class="lp">
      <div class="th">${l.images.map((f, i) => html`<button type="button" class="${i === 0 ? 'on' : ''}" onclick="show(${i})" aria-label="Image ${i + 1}"><img src="${thumbSrc(f)}" alt=""></button>`)}</div>
      <div class="big"><img id="main" src="${imgSrc(l.images[0])}" alt="${l.title}" data-file="${l.images[0]}"></div>
      <div>
        <h1 class="t">${l.title}</h1>
        <a href="/s?k=${encodeURIComponent(l.brand)}">Visit the ${l.brand} Store</a>
        <div class="rate"><span>${l.rating || ''}</span><span class="stars">${stars(l.rating)}</span><a href="#">${l.reviews} ratings</a></div><hr>
        <div class="pr">${priceHtml(l.price)}</div>
        <div class="kv"><b>Color</b><span>${l.color}</span><b>Brand</b><span>${l.brand}</span>${l.material ? html`<b>Material</b><span>${l.material}</span>` : ''}<b>Product Dimensions</b><span>${l.depth}"D x ${l.width}"W x ${l.height}"H</span></div><hr>
        <div class="about"><h3>About this item</h3><ul>${l.features.map((f) => html`<li>${f}</li>`)}</ul></div>
      </div>
      <div class="buy"><div class="pr">${priceHtml(l.price)}</div>
        <div class="del">FREE delivery <b>${deliveryDate()}</b><a href="#">📍 Deliver to Raleigh 27601</a></div>
        <div class="stock">${l.qty > 0 ? 'In Stock' : 'Currently unavailable'}</div>
        <select aria-label="Quantity">${[1, 2, 3, 4, 5].map((n) => html`<option>Quantity: ${n}</option>`)}</select>
        <button class="b cart">Add to Cart</button><button class="b now">Buy Now</button>
        <table><tr><td>Ships from</td><td>${l.fulfillment === 'Seller fulfilled' ? l.brand : 'Amazon'}</td></tr><tr><td>Sold by</td><td><a href="/s?k=${encodeURIComponent(l.brand)}">${l.brand}</a></td></tr><tr><td>Returns</td><td>30-day refund or replacement</td></tr></table>
      </div>
    </div>
    <section class="det"><h2>Product details</h2><table>${rows.map(([k, v]) => html`<tr><th>${k}</th><td>${v}</td></tr>`)}</table>
    ${l.description ? html`<h2 style="margin-top:22px">Product description</h2><p style="max-width:900px">${l.description}</p>` : ''}</section>
    ${raw(`<script>const imgs=${JSON.stringify(l.images.map(imgSrc))};function show(i){document.getElementById('main').src=imgs[i];document.querySelectorAll('.th button').forEach((b,j)=>b.classList.toggle('on',i===j));}</script>`)}`));
});

// Addresses people (and agents) often guess for Seller Central pages.
const ALIASES = {
  '/seller/listings': ['/seller/inventory', '/seller/manage-inventory', '/seller/manage-all-inventory', '/seller/myinventory', '/seller/inventory/manage', '/inventory', '/myinventory/inventory'],
  '/seller/add': ['/seller/add-product', '/seller/add-a-product', '/seller/add-products', '/seller/product/add', '/seller/listing/add', '/seller/listings/add', '/product-search', '/abis/listing/create'],
  '/seller': ['/seller/home', '/seller/dashboard', '/seller-central', '/home'],
};
for (const [to, froms] of Object.entries(ALIASES)) for (const f of froms) app.get(f, (req, res) => res.redirect(to));
app.get(['/seller/edit', '/seller/listings/:id'], (req, res) => res.redirect('/seller/listings'));
app.use('/seller', (req, res) => res.status(404).send(hubPage('Page not found', '', html`<div class="welcome"><h1>We couldn’t find that page</h1></div>
  <div class="box"><div class="in">The address <b>${req.originalUrl}</b> doesn’t match a Seller Central page. Use the shortcuts above, or go to:
  <ul><li><a href="/seller">Home (Global Snapshot)</a></li><li><a href="/seller/listings">Manage All Inventory</a></li><li><a href="/seller/add">Add a Product</a></li></ul></div></div>`)));

module.exports = app;
