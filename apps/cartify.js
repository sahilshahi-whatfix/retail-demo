// Shopify admin (port 4003): the retailer's hosted commerce platform, styled after the Shopify admin.
const store = require('../lib/store');
const { html, raw, esc, makeApp, money, num, fmtDate, fmtDateTime, fmtTime, isToday, url, whatfixTag } = require('../lib/util');
const { imgSrc, thumbSrc } = require('../lib/files');
const { pickerAssets } = require('../lib/picker');
const { colorHex } = require('../lib/catalog');

const app = makeApp('Shopify');
const ACTOR = 'Seek';

const IC = {
  home: '<path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z"/>', orders: '<path d="M5 7h14l-1 13H6zM9 7a3 3 0 0 1 6 0"/>', products: '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  customers: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', content: '<path d="M4 4h16v16H4zM4 9h16M9 9v11"/>', analytics: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  marketing: '<path d="M3 11v2l13 5V6zM16 9a3 3 0 0 1 0 6M6 13l1 6h3l-1-5"/>', discounts: '<path d="M9 15l6-6M9.5 9.5h.01M14.5 14.5h.01"/><circle cx="12" cy="12" r="9"/>',
  store: '<path d="M4 9l2-5h12l2 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>', bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20h4"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3M4 4v4h4M20 20v-4h-4"/>', check: '<path d="M5 12l5 5 9-10"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>', mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', pos: '<path d="M4 4h16v10H4zM8 20h8M12 14v6"/>',
};
const ic = (n, s = 18) => raw(`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`);

const NAV = [['home', 'Home', '/'], ['orders', 'Orders', '/section/orders'], ['products', 'Products', '/products'], ['customers', 'Customers', '/section/customers'],
  ['content', 'Content', '/section/content'], ['analytics', 'Analytics', '/section/analytics'], ['marketing', 'Marketing', '/section/marketing'], ['discounts', 'Discounts', '/section/discounts']];

// Shopify mark: green bag with the white S, followed by the wordmark.
const LOGO = raw(`<svg width="26" height="29" viewBox="0 0 26 29" aria-hidden="true"><path d="M21.9 5.6c0-.1-.1-.2-.2-.2l-2.3-.2-1.7-1.7c-.2-.2-.5-.1-.6-.1l-.8.3C15.8 2.3 15 1.5 13.6 1.5h-.1C13.1 1 12.6.8 12.2.8 9 .8 7.4 4.8 6.9 6.9l-2.3.7c-.7.2-.7.2-.8.9L2 23.4l14.6 2.7 7.9-1.7S21.9 5.7 21.9 5.6z" fill="#95bf47"/><path d="M21.7 5.4l-2.3-.2-1.7-1.7c-.1-.1-.2-.1-.3-.1l-1.1 22.6 7.9-1.7L21.9 5.6c0-.1-.1-.2-.2-.2z" fill="#5e8e3e"/><path d="M13.9 9.8l-1 2.9s-.8-.4-1.9-.4c-1.5 0-1.6 1-1.6 1.2 0 1.3 3.4 1.8 3.4 4.9 0 2.4-1.5 4-3.6 4-2.5 0-3.7-1.5-3.7-1.5l.7-2.2s1.3 1.1 2.4 1.1c.7 0 1-.6 1-1 0-1.7-2.8-1.8-2.8-4.6 0-2.4 1.7-4.7 5.2-4.7 1.3 0 1.9.3 1.9.3z" fill="#fff"/></svg>`);

const STYLE = `
:root{--hdr:#1a1a1a;--bg:#f1f1f1;--nav:#ebebeb;--card:#fff;--line:#e3e3e3;--text:#303030;--muted:#616161;--link:#005bd3;--focus:#005bd3;--pk-accent:#303030;--pk-radius:12px}
*{box-sizing:border-box}
body{margin:0;background:var(--hdr);color:var(--text);font:13px/20px Inter,-apple-system,BlinkMacSystemFont,"San Francisco","Segoe UI",Roboto,sans-serif;font-feature-settings:"calt" 0}
a{color:inherit;text-decoration:none}
button,input,select,textarea{font:inherit;color:inherit}
svg{flex:none}
.hdr{height:56px;background:var(--hdr);display:flex;align-items:center;padding:0 12px 0 16px;gap:16px;position:sticky;top:0;z-index:20}
.logo{display:flex;align-items:center;gap:6px;color:#fff;font-weight:700;font-size:21px;width:228px;letter-spacing:-.04em}
.hsearch{flex:1;max-width:600px;margin:0 auto;display:flex;align-items:center;gap:8px;background:#303030;border:1px solid #4a4a4a;border-radius:10px;height:36px;padding:0 10px;color:#b5b5b5}
.hsearch:focus-within{border-color:#8a8a8a;background:#2a2a2a}
.hsearch input{flex:1;background:transparent;border:0;outline:0;color:#fff}
.hsearch input::placeholder{color:#b5b5b5}
.hsearch kbd{font:11px Inter,system-ui;color:#b5b5b5;background:#3d3d3d;border-radius:5px;padding:1px 6px}
.hright{display:flex;align-items:center;gap:8px;color:#e3e3e3}
.hright .ib{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.hright .ib:hover{background:#303030}
.store{display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;border-radius:10px;color:#e3e3e3;font-weight:550}
.store:hover{background:#303030}
.store .av{width:28px;height:28px;border-radius:8px;background:#36fba1;color:#0b3b25;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center}
.frame{display:flex;background:var(--bg);border-radius:12px 12px 0 0;min-height:calc(100vh - 56px);overflow:clip}
.side{width:240px;flex:none;background:var(--nav);padding:12px 8px;position:sticky;top:56px;align-self:flex-start;height:calc(100vh - 56px);display:flex;flex-direction:column;border-right:1px solid #e0e0e0}
.side a{display:flex;align-items:center;gap:8px;padding:4px 8px;min-height:32px;border-radius:8px;color:#303030;font-weight:550;margin-bottom:1px}
.side a svg{color:#4a4a4a}
.side a:hover{background:#f1f1f1}
.side a.on{background:#fafafa;font-weight:650;box-shadow:0 1px 0 rgba(0,0,0,.05)}
.side a.on svg{color:#303030}
.side a .cnt{margin-left:auto;font-size:12px;background:#e3e3e3;border-radius:8px;padding:0 6px;font-weight:550}
.side .sub{margin:0 0 4px}.side .sub a{padding:3px 8px 3px 36px;min-height:28px;font-weight:450;color:#4a4a4a}
.side .sub a.on{background:transparent;box-shadow:none;font-weight:650;color:#303030}
.side h5{margin:16px 8px 4px;font-size:12px;color:var(--muted);font-weight:550;display:flex;align-items:center}
.side h5 span{margin-left:auto;font-size:15px;color:#8a8a8a}
.side .end{margin-top:auto}
.main{flex:1;padding:20px 32px 60px;min-width:0}
.inner{max-width:1000px;margin:0 auto}
.inner.wide{max-width:1200px}
.ttl{display:flex;align-items:center;gap:8px;margin-bottom:16px;min-height:32px}
.ttl h1{font-size:20px;line-height:24px;font-weight:700;margin:0;letter-spacing:-.01em}
.ttl .sp{flex:1}
.back{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#4a4a4a}
.back:hover{background:#e3e3e3}
.crumb{display:none}
.card{background:var(--card);border-radius:12px;box-shadow:0 1px 0 0 rgba(26,26,26,.07),inset 0 1px 0 0 rgba(204,204,204,.5),inset 0 -1px 0 0 rgba(0,0,0,.17),inset -1px 0 0 0 rgba(0,0,0,.13),inset 1px 0 0 0 rgba(0,0,0,.13);margin-bottom:16px}
.card .ch{display:flex;align-items:center;gap:8px;padding:16px 16px 0;font-weight:650;font-size:13px}
.card .ch .r{margin-left:auto;font-weight:450}
.card .cb{padding:12px 16px 16px}
.pill{display:inline-flex;align-items:center;gap:4px;font-size:12px;line-height:16px;font-weight:550;border-radius:8px;padding:2px 8px;white-space:nowrap}
.pill.active{background:#affebf;color:#014b40}.pill.draft{background:#d5ebff;color:#003a5a}.pill.archived{background:#e3e3e3;color:#616161}
.btn{display:inline-flex;align-items:center;gap:4px;border:0;background:#fff;border-radius:8px;padding:6px 12px;min-height:28px;cursor:pointer;font-weight:550;font-size:12px;line-height:16px;color:#303030;
  box-shadow:inset 0 -1px 0 0 #b5b5b5,inset 0 0 0 1px rgba(0,0,0,.1),inset 0 .5px 0 1.5px #fff}
.btn:hover{background:#f7f7f7}
.btn.primary{background:linear-gradient(180deg,rgba(48,48,48,0) 63.53%,rgba(255,255,255,.15) 100%),#303030;color:#fff;box-shadow:inset 0 -1px 0 1px rgba(0,0,0,.8),inset 0 0 0 1px #303030,inset 0 .5px 0 1.5px rgba(255,255,255,.25)}
.btn.primary:hover{background:#1a1a1a}
.btn.sm{padding:4px 8px;min-height:24px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.figs{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:16px;overflow:hidden}
.fig{padding:12px 16px;border-right:1px solid var(--line)}
.fig:last-child{border:0}
.figs.card .fig{box-shadow:none;margin:0;border-radius:0}
.fig .l{color:var(--muted);font-size:12px;font-weight:550;border-bottom:1px dashed #b5b5b5;display:inline-block}
.fig .v{font-size:20px;line-height:28px;font-weight:700;margin-top:2px}
.fig .d{font-size:12px;color:#29845a;font-weight:550}
.grid2{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px;align-items:start}
.todo{display:flex;gap:12px;align-items:center;padding:10px 16px;border-top:1px solid var(--line)}
.todo:hover{background:#f7f7f7}
.todo img{width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid var(--line);background:#fff}
.todo .t{font-weight:550}.todo .s{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px}
.todo .go{margin-left:auto}
.badge-new{font-size:11px;font-weight:550;background:#ffd6a4;color:#5e4200;border-radius:6px;padding:0 6px;margin-left:4px}
.tabs{display:flex;gap:4px;padding:6px 8px;border-bottom:1px solid var(--line)}
.tabs a{padding:4px 12px;border-radius:8px;font-weight:550;color:#616161}
.tabs a:hover{background:#f1f1f1;color:#303030}
.tabs a.on{background:#e3e3e3;color:#303030}
.tabs a span{display:none}
.filters{display:flex;gap:8px;padding:8px;border-bottom:1px solid var(--line);align-items:center}
.filters .s{flex:1;display:flex;align-items:center;gap:6px;border:1px solid #8a8a8a;border-radius:8px;padding:0 8px;height:30px;color:var(--muted);background:#fdfdfd}
.filters .s input{border:0;outline:0;flex:1;background:transparent}
.filters select{border:1px dashed #b5b5b5;border-radius:8px;height:26px;padding:0 6px;background:#fff;font-size:12px;font-weight:550;color:#616161}
table.t{width:100%;border-collapse:collapse}
table.t th{text-align:left;font-size:12px;color:var(--muted);font-weight:550;padding:6px 12px;border-bottom:1px solid var(--line);background:#f7f7f7}
table.t td{padding:8px 12px;border-bottom:1px solid #ebebeb;vertical-align:middle}
table.t tr:last-child td{border-bottom:0}
table.t tr.click:hover td{background:#f7f7f7;cursor:pointer}
table.t img{width:40px;height:40px;object-fit:cover;border-radius:8px;border:1px solid var(--line);vertical-align:middle;background:#fff}
.f{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}
.f label{font-weight:450;font-size:13px}
.f input,.f select,.f textarea{border:1px solid #8a8a8a;border-radius:8px;padding:5px 12px;min-height:32px;background:#fdfdfd;width:100%}
.f input:hover,.f select:hover,.f textarea:hover{border-color:#616161;background:#fafafa}
.f textarea{min-height:170px;resize:vertical;line-height:20px}
.f input:focus,.f textarea:focus,.f select:focus,.prefix:focus-within{outline:2px solid var(--focus);outline-offset:1px;border-color:#1a1a1a}
.f .hint{font-size:12px;color:var(--muted)}
.rte{border:1px solid #8a8a8a;border-radius:8px;overflow:hidden;background:#fdfdfd}
.rte .tb{display:flex;align-items:center;gap:2px;padding:4px 6px;background:#f7f7f7;border-bottom:1px solid #e3e3e3;color:#4a4a4a;font-weight:650;font-size:12px}
.rte .tb span{padding:2px 7px;border-radius:6px}
.rte textarea{border:0!important;border-radius:0!important;background:transparent!important}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.prefix{display:flex;align-items:center;border:1px solid #8a8a8a;border-radius:8px;background:#fdfdfd;padding-left:12px;color:var(--muted)}
.prefix input{border:0!important;outline:0!important;background:transparent!important;color:var(--text)}
.media{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.mt{position:relative;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#fff}
.mt.feat{grid-column:span 2;grid-row:span 2}
.mt img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}
.mt .lbl{position:absolute;left:6px;top:6px;background:rgba(255,255,255,.92);color:#303030;font-size:11px;font-weight:550;padding:0 6px;border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
.mt .fn{font-size:11px;color:var(--muted);padding:3px 8px;border-top:1px solid var(--line);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt .ops{display:flex;flex-wrap:wrap;gap:4px;padding:6px;border-top:1px solid var(--line);background:#f7f7f7}
.mt .ops button{border:0;background:#fff;border-radius:6px;padding:2px 6px;font-size:11px;font-weight:550;cursor:pointer;display:inline-flex;align-items:center;gap:3px;box-shadow:inset 0 -1px 0 0 #b5b5b5,inset 0 0 0 1px rgba(0,0,0,.1)}
.mt .ops button:hover{background:#f1f1f1}
.addm{border:1px dashed #8a8a8a;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#303030;cursor:pointer;background:#fff;min-height:120px;font-weight:550}
.addm .up{background:#fff;border-radius:8px;padding:4px 10px;box-shadow:inset 0 -1px 0 0 #b5b5b5,inset 0 0 0 1px rgba(0,0,0,.1)}
.addm:hover{background:#f7f7f7}
.chk{display:flex;align-items:center;gap:8px;padding:6px 0}
.chk input{width:16px;height:16px;accent-color:#303030}
.seo .u{font-size:12px;color:#616161}.seo .h{color:#1a0dab;font-size:16px;margin:2px 0}.seo .d{font-size:13px;color:#4d5156}
.act{padding:4px 16px 14px;max-height:420px;overflow:auto}
.act div{position:relative;padding:6px 0 10px 16px;border-left:2px solid #e3e3e3}
.act div::before{content:"";position:absolute;left:-6px;top:10px;width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid #8a8a8a}
.act small{display:block;color:var(--muted);font-size:12px}
.flash{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;margin-bottom:16px;font-weight:450}
.flash.ok{background:#cdfee1;color:#0c5132}
.flash.err{background:#fee9e8;color:#8e1f0b}
.flash a{color:inherit}
.swatch{display:inline-block;width:16px;height:16px;border-radius:50%;border:1px solid rgba(0,0,0,.15);vertical-align:middle;margin-right:6px}
.chan{display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid var(--line)}
.chan .st{margin-left:auto}
.savebar{position:fixed;top:0;left:0;right:0;height:56px;z-index:30;background:#1a1a1a;color:#e3e3e3;display:none;align-items:center;gap:8px;padding:0 16px;font-weight:550}
.savebar.on{display:flex}
.savebar .sp{flex:1}
.savebar .msg{display:flex;align-items:center;gap:8px;margin-left:244px}
.savebar .btn{background:#303030;color:#e3e3e3;box-shadow:none}
.savebar .btn.primary{background:#fff;color:#303030}
.empty{padding:28px;text-align:center;color:var(--muted)}
.ro{background:#f7f7f7!important;color:#616161;border-color:#e3e3e3!important}
.lnk{color:var(--link);font-weight:450}
.lnk:hover{text-decoration:underline}
`;

const SHOP = 'Alder & Vale Home';

function page(title, active, body, extra = '', opts = {}) {
  const db = store.read();
  const drafts = db.products.filter((p) => p.status === 'draft').length;
  const crumb = [title, active === 'products' && title !== 'Products' ? 'Products' : '', SHOP, 'Shopify'].filter(Boolean).join(' · ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(crumb)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;650;700&display=swap" rel="stylesheet">
<style>${STYLE}</style>${whatfixTag()}</head><body>
<header class="hdr"><a class="logo" href="/">${LOGO}shopify</a>
<form class="hsearch" action="/products" role="search">${ic('search', 16)}<input name="q" placeholder="Search" aria-label="Search"><kbd>⌘ K</kbd></form>
<div class="hright"><span class="ib" title="Alerts">${ic('bell')}</span><span class="store"><span class="av">AV</span>${esc(SHOP)}</span></div></header>
<div class="frame"><nav class="side" aria-label="Main">
${NAV.map(([k, l, h]) => `<a href="${h}" class="${active === k ? 'on' : ''}">${ic(k)}${l}${k === 'products' && drafts ? `<span class="cnt">${drafts}</span>` : ''}</a>` +
  (k === 'products' && active === 'products' ? `<div class="sub"><a href="/section/collections">Collections</a><a href="/section/inventory">Inventory</a><a href="/section/purchase-orders">Purchase orders</a><a href="/section/transfers">Transfers</a><a href="/section/gift-cards">Gift cards</a></div>` : '')).join('')}
<h5>Sales channels<span>›</span></h5>
<a href="${url('store')}" target="_blank" rel="noopener">${ic('store')}Online Store</a><a href="/section/point-of-sale">${ic('pos')}Point of Sale</a><a href="/section/mobile-app">${ic('mobile')}Mobile App</a>
<h5>Apps<span>›</span></h5>
<a href="/section/apps">${ic('sync')}Oracle Retail Connector</a>
<a class="end" href="/section/settings">${ic('settings')}Settings</a>
</nav><main class="main"><div class="inner${opts.wide ? ' wide' : ''}">${body}</div></main></div>${extra}</body></html>`;
}

const pill = (s) => html`<span class="pill ${s}">${s[0].toUpperCase() + s.slice(1)}</span>`;
const thumb = (p) => thumbSrc(p.media && p.media[0]);
const totalStock = (p) => (p.inventory || []).reduce((a, b) => a + (Number(b.qty) || 0), 0);
const channelsLabel = (p) => [p.channels.online && 'Online Store', p.channels.mobile && 'Mobile App'].filter(Boolean).join(', ') || '—';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// ---------- Home ----------
app.get('/', (req, res) => {
  const db = store.read();
  const drafts = db.products.filter((p) => p.status === 'draft').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const recent = db.products.slice().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5);
  const figs = [['Orders today', '46', '+8% vs. last Tuesday'], ['Sales today', '$38,915', '+12% vs. last Tuesday'], ['Online Store sessions', '5,284', '+4% vs. last Tuesday'], ['Drafts to review', String(drafts.length), drafts.length ? 'From Oracle Retail Merchandising' : 'All caught up']];
  res.send(page('Home', 'home', html`
    <div class="ttl"><h1>${greeting()}, Alder &amp; Vale Home</h1></div>
    <div class="figs card">${figs.map(([l, v, d]) => html`<div class="fig"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`)}</div>
    <div class="grid2"><div>
      <div class="card"><div class="ch">Things to do</div><div style="padding:4px 16px 12px;color:var(--muted);font-size:13px">${drafts.length ? `${drafts.length} new draft product${drafts.length > 1 ? 's' : ''} synced from Oracle Retail Merchandising ${drafts.length > 1 ? 'are' : 'is'} ready for review and publishing.` : 'No drafts waiting for review.'}</div>
        ${drafts.map((p) => html`<a class="todo" href="/products/${p.id}"><img src="${thumb(p)}" alt=""><div><div class="t">Review and publish ${p.title} ${isToday(p.createdAt) ? html`<span class="badge-new">New</span>` : ''}</div>
          <div class="s">${ic('sync', 12)} Synced from Oracle Retail Merchandising · ${p.sku} · ${isToday(p.createdAt) ? 'Today at ' + fmtTime(p.createdAt) : fmtDate(p.createdAt)}</div></div><span class="go btn sm">Review</span></a>`)}
        <a class="todo" href="/section/orders"><div style="width:44px;height:44px;border-radius:9px;background:#f4f4f5;display:flex;align-items:center;justify-content:center">${ic('orders')}</div><div><div class="t">12 orders to fulfill</div><div class="s">Oldest from yesterday</div></div><span class="go btn sm">View</span></a>
      </div>
      <div class="card"><div class="ch">Recently updated products<span class="r"><a class="lnk" href="/products">View all</a></span></div><div class="cb" style="padding:8px 0 0">
        <table class="t"><tbody>${recent.map((p) => html`<tr class="click" onclick="location.href='/products/${p.id}'"><td style="width:56px"><img src="${thumb(p)}" alt=""></td><td><a href="/products/${p.id}"><b>${p.title}</b></a><div style="color:var(--muted);font-size:12.5px">${p.sku}</div></td><td>${pill(p.status)}</td><td style="color:var(--muted);font-size:13px">${fmtDateTime(p.updatedAt)}</td></tr>`)}</tbody></table></div></div>
    </div><div>
      <div class="card"><div class="ch">Sales channels</div><div style="height:8px"></div>
        <div class="chan">${ic('globe')}<div><b>Online Store</b><div style="font-size:12.5px;color:var(--muted)">aldervalehome.com</div></div><span class="st pill active">Active</span></div>
        <div class="chan">${ic('mobile')}<div><b>Mobile App</b><div style="font-size:12.5px;color:var(--muted)">iOS and Android</div></div><span class="st pill active">Active</span></div>
        <div class="chan">${ic('pos')}<div><b>Point of sale</b><div style="font-size:12.5px;color:var(--muted)">14 store locations</div></div><span class="st pill active">Active</span></div>
      </div>
      <div class="card"><div class="ch">Apps</div><div class="cb" style="font-size:13px;color:var(--muted)">
        <div style="display:flex;gap:10px;align-items:center;color:var(--text)"><span style="width:32px;height:32px;border-radius:8px;background:#c74634;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">OR</span><div><b>Oracle Retail Connector</b><div style="color:var(--muted);font-size:12.5px">Creates draft products when items are released</div></div></div>
      </div></div>
    </div></div>`));
});

// ---------- Products list ----------
app.get('/products', (req, res) => {
  const db = store.read();
  const tab = req.query.tab || 'all';
  const q = (req.query.q || '').toLowerCase();
  const all = db.products;
  const count = (s) => all.filter((p) => s === 'all' || p.status === s).length;
  let list = all.filter((p) => tab === 'all' || p.status === tab);
  if (q) list = list.filter((p) => [p.title, p.sku, p.vendor, p.type].join(' ').toLowerCase().includes(q));
  if (req.query.type) list = list.filter((p) => p.type === req.query.type);
  if (req.query.vendor) list = list.filter((p) => p.vendor === req.query.vendor);
  if (req.query.channel === 'online') list = list.filter((p) => p.channels.online);
  if (req.query.channel === 'mobile') list = list.filter((p) => p.channels.mobile);
  list.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const types = [...new Set(all.map((p) => p.type))].sort();
  const vendors = [...new Set(all.map((p) => p.vendor))].sort();
  res.send(page('Products', 'products', html`
    <div class="ttl"><h1>Products</h1><span class="sp"></span><span class="btn">Export</span><span class="btn">Import</span><span class="btn">More actions ${ic('down', 14)}</span><span class="btn primary">Add product</span></div>
    <div class="card" style="overflow:hidden">
      <div class="tabs" role="tablist">${['all', 'active', 'draft', 'archived'].map((t) => html`<a role="tab" href="/products?tab=${t}" class="${tab === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}<span>${count(t)}</span></a>`)}</div>
      <form class="filters" method="get"><input type="hidden" name="tab" value="${tab}">
        <label class="s">${ic('search', 15)}<input name="q" value="${req.query.q || ''}" placeholder="Search products" aria-label="Search products"></label>
        <select name="type" aria-label="Product type" onchange="this.form.submit()"><option value="">Product type</option>${types.map((t) => html`<option ${req.query.type === t ? 'selected' : ''}>${t}</option>`)}</select>
        <select name="vendor" aria-label="Vendor" onchange="this.form.submit()"><option value="">Vendor</option>${vendors.map((t) => html`<option ${req.query.vendor === t ? 'selected' : ''}>${t}</option>`)}</select>
        <select name="channel" aria-label="Sales channel" onchange="this.form.submit()"><option value="">Sales channel</option><option value="online" ${req.query.channel === 'online' ? 'selected' : ''}>Online Store</option><option value="mobile" ${req.query.channel === 'mobile' ? 'selected' : ''}>Mobile App</option></select>
      </form>
      <table class="t"><thead><tr><th style="width:56px"></th><th>Product</th><th>Status</th><th>Inventory</th><th>Sales channels</th><th>Type</th><th>Vendor</th></tr></thead><tbody>
      ${list.map((p) => html`<tr class="click" onclick="location.href='/products/${p.id}'"><td><img src="${thumb(p)}" alt=""></td><td><a href="/products/${p.id}"><b>${p.title}</b></a></td><td>${pill(p.status)}</td>
        <td>${totalStock(p)} in stock</td><td>${channelsLabel(p)}</td><td>${p.type}</td><td>${p.vendor}</td></tr>`)}
      ${list.length ? '' : html`<tr><td colspan="7" class="empty">No products found</td></tr>`}
      </tbody></table></div>`));
});

// ---------- Product editor ----------
const FLASH = {
  saved: ['ok', 'Product saved'], published: ['ok', 'Product published. It is now live on the selected sales channels.'], media: ['ok', 'Media updated'],
};

app.get('/products/:id', (req, res) => {
  const db = store.read();
  const p = db.products.find((x) => String(x.id) === req.params.id);
  if (!p) return res.status(404).send(page('Not found', 'products', html`<div class="empty">Product not found. <a href="/products">Back to products</a></div>`));
  const margin = p.price && p.cost ? Math.round(((p.price - p.cost) / p.price) * 1000) / 10 : null;
  const fl = FLASH[req.query.m];
  const errs = req.query.err ? String(req.query.err).split('|') : [];
  const storeUrl = url('store', `/products/${p.handle}${p.status === 'active' ? '' : '?preview=1'}`);

  const body = html`
    <form id="pf" method="post" action="/products/${p.id}">
    <input type="hidden" name="mediaPick" id="mediaPick" value="">
    <div class="savebar" id="savebar"><span class="msg">${ic('bell', 16)}Unsaved changes</span><span class="sp"></span><a class="btn" href="/products/${p.id}">Discard</a><button class="btn primary" name="action" value="save">Save</button></div>
    <div class="crumb"><a href="/products">Products</a> › ${p.title}</div>
    <div class="ttl"><a class="back" href="/products" aria-label="Back to products">${ic('left', 16)}</a><h1>${p.title}</h1>${pill(p.status)}<span class="sp"></span>
      <span class="btn">Duplicate</span><a class="btn" href="${storeUrl}" target="_blank" rel="noopener">Preview</a><span class="btn">More actions ${ic('down', 14)}</span></div>
    ${fl ? html`<div class="flash ${fl[0]}" role="status">${ic('check', 16)}${fl[1]}${req.query.m === 'published' || (req.query.m === 'media' && p.status === 'active') ? html` · <a href="${storeUrl}" target="_blank" rel="noopener" style="text-decoration:underline">View on online store</a>` : ''}</div>` : ''}
    ${errs.length ? html`<div class="flash err" role="alert">${errs.join(' ')}</div>` : ''}
    <div class="grid2"><div>
      <div class="card"><div class="cb">
        <div class="f"><label for="title">Title</label><input id="title" name="title" value="${p.title}"></div>
        <div class="f" style="margin-bottom:0"><label for="description">Description</label><div class="rte"><div class="tb" aria-hidden="true"><span>Paragraph ⌄</span><span>B</span><span style="font-style:italic">I</span><span style="text-decoration:underline">U</span><span>A ⌄</span><span>≡ ⌄</span><span>🔗</span><span>⋯</span><span style="margin-left:auto">&lt;/&gt;</span></div><textarea id="description" name="description">${p.description}</textarea></div></div>
      </div></div>

      <div class="card"><div class="ch">Media<span class="r" style="font-size:12px;color:var(--muted)">The first image is the featured image on the Online Store</span></div><div class="cb">
        <div class="media">
          ${p.media.map((m, i) => html`<div class="mt ${i === 0 ? 'feat' : ''}">
            ${i === 0 ? html`<span class="lbl">Featured</span>` : ''}<img src="${imgSrc(m)}" alt="${m}">
            <div class="fn" title="${m}">${m.replace(/^art:/, '')}</div>
            <div class="ops">
              ${i > 0 ? html`<button name="media" value="feature:${i}" title="Set as featured">${ic('star', 12)}Set as featured</button>` : ''}
              ${i > 0 ? html`<button name="media" value="left:${i}" title="Move earlier" aria-label="Move ${m} earlier">${ic('left', 12)}</button>` : ''}
              ${i < p.media.length - 1 ? html`<button name="media" value="right:${i}" title="Move later" aria-label="Move ${m} later">${ic('right', 12)}</button>` : ''}
              <button type="button" onclick="replaceMedia(${i})" title="Replace image">${ic('swap', 12)}Replace</button>
              <button name="media" value="remove:${i}" title="Remove" aria-label="Remove ${m}">${ic('x', 12)}Remove</button>
            </div></div>`)}
          <button type="button" class="addm" onclick="addMedia()"><span class="up">Upload new</span><span style="font-size:12px;color:var(--link);font-weight:450">Select existing</span></button>
        </div></div></div>

      <div class="card"><div class="ch">Pricing</div><div class="cb">
        <div class="row2"><div class="f"><label for="price">Price</label><div class="prefix">$<input id="price" name="price" value="${p.price ?? ''}" inputmode="decimal"></div></div>
          <div class="f"><label for="compareAt">Compare-at price</label><div class="prefix">$<input id="compareAt" name="compareAt" value="${p.compareAt ?? ''}" inputmode="decimal"></div></div></div>
        <div class="row3"><div class="f"><label for="cost">Cost per item</label><div class="prefix">$<input id="cost" name="cost" value="${p.cost ?? ''}" inputmode="decimal"></div><span class="hint">Customers won't see this</span></div>
          <div class="f"><label>Profit</label><input class="ro" readonly value="${p.price && p.cost ? money(p.price - p.cost) : '--'}"></div>
          <div class="f"><label>Margin</label><input class="ro" readonly value="${margin === null ? '--' : margin + '%'}"></div></div>
      </div></div>

      <div class="card"><div class="ch">Inventory</div><div class="cb">
        <div class="row2"><div class="f"><label for="sku">SKU (stock keeping unit)</label><input id="sku" name="sku" value="${p.sku}"></div>
          <div class="f"><label for="upc">Barcode (UPC)</label><input id="upc" name="upc" value="${p.upc || ''}"></div></div>
        <table class="t" style="border:1px solid var(--line);border-radius:9px"><thead><tr><th>Location</th><th style="width:160px">Available</th></tr></thead><tbody>
          ${p.inventory.map((l, i) => html`<tr><td>${l.location}</td><td><input name="inv_${i}" value="${l.qty}" aria-label="Available at ${l.location}" style="width:100%;border:1px solid #d4d4d8;border-radius:8px;padding:5px 8px"></td></tr>`)}
        </tbody></table></div></div>

      <div class="card"><div class="ch">Shipping and dimensions</div><div class="cb">
        <div class="row3"><div class="f"><label for="width">Width (in)</label><input id="width" name="width" value="${p.width ?? ''}"></div>
          <div class="f"><label for="depth">Depth (in)</label><input id="depth" name="depth" value="${p.depth ?? ''}"></div>
          <div class="f"><label for="height">Height (in)</label><input id="height" name="height" value="${p.height ?? ''}"></div></div>
        <div class="row3"><div class="f"><label for="seatHeight">Seat height (in)</label><input id="seatHeight" name="seatHeight" value="${p.seatHeight ?? ''}"></div>
          <div class="f"><label for="weight">Product weight (lb)</label><input id="weight" name="weight" value="${p.weight ?? ''}"></div>
          <div class="f"><label for="capacity">Weight capacity (lb)</label><input id="capacity" name="capacity" value="${p.capacity ?? ''}"></div></div>
        <div class="f"><label for="materials">Materials</label><input id="materials" name="materials" value="${p.materials || ''}"></div>
        <div class="row2"><div class="f"><label for="assembly">Assembly</label><input id="assembly" name="assembly" value="${p.assembly || ''}"></div>
          <div class="f"><label for="care">Care</label><input id="care" name="care" value="${p.care || ''}"></div></div>
      </div></div>

      <div class="card"><div class="ch">Variants</div><div class="cb">
        <div class="f" style="max-width:320px"><label for="color">Color</label><input id="color" name="color" value="${p.color || ''}"></div>
        <table class="t" style="border:1px solid var(--line)"><thead><tr><th>Variant</th><th>Price</th><th>SKU</th><th>Available</th></tr></thead><tbody>
          <tr><td><span class="swatch" style="background:${colorHex(p.color)}"></span>${p.color || 'Default'}</td><td>${money(p.price)}</td><td>${p.sku}</td><td>${totalStock(p)}</td></tr></tbody></table>
      </div></div>

      <div class="card"><div class="ch">Search engine listing</div><div class="cb">
        <div class="seo"><div style="font-size:12px;color:#616161;margin-bottom:6px">Alder &amp; Vale Home</div><div class="u">aldervalehome.com › products › ${p.handle}</div><div class="h">${p.title} | Alder &amp; Vale Home</div><div class="d">${p.description.slice(0, 155)}${p.description.length > 155 ? '…' : ''}</div></div>
        <div class="f" style="margin:12px 0 0"><label for="handle">URL handle</label><div class="prefix" style="color:var(--muted)">aldervalehome.com/products/<input id="handle" name="handle" value="${p.handle}"></div></div>
      </div></div>
    </div>

    <div>
      <div class="card"><div class="ch">Status</div><div class="cb"><div class="f" style="margin:0"><select name="status" aria-label="Status">
        ${['active', 'draft', 'archived'].map((s) => html`<option value="${s}" ${p.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`)}</select></div></div></div>
      <div class="card"><div class="ch">Publishing</div><div class="cb">
        <label class="chk"><input type="checkbox" name="online" value="1" ${p.channels.online ? 'checked' : ''}>${ic('globe', 16)}Online Store</label>
        <label class="chk"><input type="checkbox" name="mobile" value="1" ${p.channels.mobile ? 'checked' : ''}>${ic('mobile', 16)}Mobile App</label>
        <div style="font-size:12.5px;color:var(--muted);margin:4px 0 12px">${p.status === 'active' ? html`Published ${p.publishedAt ? 'on ' + fmtDate(p.publishedAt) : ''} to ${channelsLabel(p)}` : 'Not published. Choose channels, then publish.'}</div>
        <button class="btn primary" name="action" value="publish" style="width:100%;justify-content:center">${p.status === 'active' ? 'Update publishing' : 'Publish'}</button>
      </div></div>
      <div class="card"><div class="ch">Product organization</div><div class="cb">
        <div class="f"><label for="type">Product type</label><input id="type" name="type" value="${p.type}"></div>
        <div class="f"><label for="vendor">Vendor</label><input id="vendor" name="vendor" value="${p.vendor}"></div>
        <div class="f"><label for="collections">Collections</label><input id="collections" name="collections" value="${p.collections.join(', ')}"></div>
        <div class="f" style="margin:0"><label for="tags">Tags</label><input id="tags" name="tags" value="${p.tags.join(', ')}"></div>
      </div></div>
      <div class="card"><div class="ch">Activity</div><div class="act" style="margin-top:10px">
        ${p.activity.slice().reverse().map((a) => html`<div>${a.text}<small>${a.by} · ${fmtDateTime(a.at)}</small></div>`)}
      </div></div>
    </div></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e3e3e3;padding-top:16px;margin-top:4px"><span class="btn">Archive product</span><span class="btn" style="color:#8e1f0b">Delete product</span><button class="btn primary" name="action" value="save">Save</button></div></form>`;

  const script = `<script>
  const form = document.getElementById('pf');
  form.addEventListener('input', () => document.getElementById('savebar').classList.add('on'));
  function submitPick(v){ document.getElementById('mediaPick').value = v; const a = document.createElement('input'); a.type='hidden'; a.name='action'; a.value='save'; form.appendChild(a); form.submit(); }
  function addMedia(){ openPicker({ kind: 'image', multiple: true, title: 'Add media' }, (f) => submitPick('add:' + f.join('|'))); }
  function replaceMedia(i){ openPicker({ kind: 'image', multiple: false, title: 'Replace image' }, (f) => submitPick('replace:' + i + ':' + f[0])); }
  </script>`;
  res.send(page(p.title, 'products', body, pickerAssets() + script));
});

app.post('/products/:id', (req, res) => {
  const b = req.body;
  const id = req.params.id;
  let flash = 'saved';
  const errors = [];
  store.update((db) => {
    const p = db.products.find((x) => String(x.id) === id);
    if (!p) return;
    const now = new Date().toISOString();
    const log = (text) => p.activity.push({ at: now, by: ACTOR, text });

    // Field changes
    const labels = { title: 'Title', description: 'Description', price: 'Price', compareAt: 'Compare-at price', cost: 'Cost per item', sku: 'SKU', upc: 'Barcode',
      width: 'Width', depth: 'Depth', height: 'Height', seatHeight: 'Seat height', weight: 'Weight', capacity: 'Weight capacity', materials: 'Materials', assembly: 'Assembly', care: 'Care',
      color: 'Color', type: 'Product type', vendor: 'Vendor', handle: 'URL handle' };
    const numeric = ['price', 'compareAt', 'cost', 'width', 'depth', 'height', 'seatHeight', 'weight', 'capacity'];
    for (const k of Object.keys(labels)) {
      if (b[k] === undefined) continue;
      let v = numeric.includes(k) ? num(String(b[k]).replace(/[$,\s]/g, '')) : String(b[k]).trim();
      if (k === 'title' && !v) { errors.push('Title can’t be blank.'); continue; }
      if (k === 'handle') v = String(v).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      if (String(p[k] ?? '') !== String(v ?? '')) {
        const short = (x) => (x === null || x === '' ? 'blank' : numeric.includes(k) && ['price', 'compareAt', 'cost'].includes(k) ? money(x) : String(x).length > 40 ? null : x);
        const from = short(p[k]), to = short(v);
        log(from !== null && to !== null && k !== 'description' ? `${labels[k]} changed from ${from} to ${to}` : `${labels[k]} updated`);
        p[k] = v;
      }
    }
    for (const k of ['collections', 'tags']) {
      if (b[k] === undefined) continue;
      const v = String(b[k]).split(',').map((s) => s.trim()).filter(Boolean);
      if (v.join(',') !== p[k].join(',')) { log(`${k === 'tags' ? 'Tags' : 'Collections'} updated`); p[k] = v; }
    }
    p.inventory.forEach((l, i) => {
      const v = b['inv_' + i];
      if (v !== undefined && num(v) !== null && Number(v) !== Number(l.qty)) { log(`Inventory at ${l.location} changed from ${l.qty} to ${num(v)}`); l.qty = num(v); }
    });

    // Media operations
    const op = [].concat(b.media || []).filter(Boolean).pop() || b.mediaPick || '';
    if (op) {
      flash = 'media';
      const [kind, a, c] = op.split(':');
      const i = Number(a);
      if (kind === 'add') {
        const files = a.split('|').filter((f) => f && !p.media.includes(f));
        p.media.push(...files);
        if (files.length) log(`Media added: ${files.join(', ')}`);
      } else if (kind === 'replace' && p.media[i] && c) {
        const old = p.media[i];
        p.media[i] = c;
        p.media = p.media.filter((m, j) => j === i || m !== c);
        log(i === 0 ? `Featured image replaced: ${old.replace(/^art:/, '')} → ${c}` : `Image replaced: ${old.replace(/^art:/, '')} → ${c}`);
      } else if (kind === 'remove' && p.media[i]) {
        const [old] = p.media.splice(i, 1);
        log(`Media removed: ${old.replace(/^art:/, '')}${i === 0 && p.media[0] ? `. ${p.media[0].replace(/^art:/, '')} is now the featured image` : ''}`);
      } else if (kind === 'feature' && p.media[i]) {
        const [m] = p.media.splice(i, 1);
        p.media.unshift(m);
        log(`Featured image set to ${m.replace(/^art:/, '')}`);
      } else if ((kind === 'left' || kind === 'right') && p.media[i]) {
        const j = kind === 'left' ? i - 1 : i + 1;
        if (p.media[j]) { [p.media[i], p.media[j]] = [p.media[j], p.media[i]]; log(`Media reordered${j === 0 || i === 0 ? `: ${p.media[0].replace(/^art:/, '')} is now featured` : ''}`); }
      }
    }

    // Status, channels and publishing
    const online = b.online === '1', mobile = b.mobile === '1';
    if (b.action === 'publish') {
      if (!online && !mobile) errors.push('Select at least one sales channel to publish.');
      else if (!p.media.length) errors.push('Add at least one image before publishing.');
      else if (!p.price) errors.push('Add a price before publishing.');
      else {
        const was = p.status;
        p.channels = { online, mobile };
        p.status = 'active';
        p.publishedAt = p.publishedAt && was === 'active' ? p.publishedAt : now;
        log(`${was === 'active' ? 'Publishing updated' : 'Published'} to ${channelsLabel(p)}`);
        if (was !== 'active') log('Status changed from ' + was[0].toUpperCase() + was.slice(1) + ' to Active');
        flash = 'published';
      }
    } else {
      if (online !== p.channels.online || mobile !== p.channels.mobile) {
        p.channels = { online, mobile };
        log(`Sales channels updated: ${channelsLabel(p)}`);
      }
      if (b.status && b.status !== p.status) {
        log(`Status changed from ${p.status[0].toUpperCase() + p.status.slice(1)} to ${b.status[0].toUpperCase() + b.status.slice(1)}`);
        p.status = b.status;
        if (b.status === 'active' && !p.publishedAt) p.publishedAt = now;
      }
    }
    p.updatedAt = now;
  });
  if (errors.length) return res.redirect(`/products/${id}?err=${encodeURIComponent(errors.join('|'))}`);
  res.redirect(`/products/${id}?m=${flash}`);
});

app.get('/section/:name', (req, res) => {
  const name = req.params.name.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  const key = NAV.find(([k]) => k === req.params.name) ? req.params.name : req.params.name === 'collections' || req.params.name === 'inventory' ? 'products' : '';
  res.send(page(name, key, html`<div class="ttl"><h1>${name}</h1></div><div class="card"><div class="empty">${name} is managed by another team. Nothing needs your attention here today.</div></div>`));
});

// Real Shopify admin addresses start with /admin; send them to the same pages here.
app.get(['/admin', '/admin/*'], (req, res) => res.redirect(req.originalUrl.replace(/^\/admin/, '') || '/'));

module.exports = app;
