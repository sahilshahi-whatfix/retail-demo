// Oracle Retail Merchandising (port 4002): the retailer's item master, styled after the classic Merchandising cloud UI.
const store = require('../lib/store');
const { html, raw, esc, makeApp, money, num, fmtDate, fmtDateTime, url, whatfixTag } = require('../lib/util');
const { imgSrc, thumbSrc, locate, kindOf, imageInfo } = require('../lib/files');
const { pdfPages, sheetHtml } = require('../lib/docview');
const { pickerAssets } = require('../lib/picker');
const { releaseToShopify, className } = require('../lib/sync');

const app = makeApp('Oracle Retail Merchandising');
const USER = 'Item Coordinator';
const USER_NAME = 'Seek (Item Coordinator)';

const REQUIRED = [
  ['code', 'Item code'], ['description', 'Description'], ['supplierId', 'Supplier'], ['dept', 'Department'], ['cls', 'Class'],
  ['color', 'Color'], ['width', 'Overall width'], ['depth', 'Overall depth'], ['height', 'Overall height'], ['weight', 'Product weight'],
  ['materials', 'Materials'], ['cost', 'Unit cost'], ['retail', 'Retail price'],
];
const isBlank = (v) => v === null || v === undefined || String(v).trim() === '';
const missing = (it) => REQUIRED.filter(([k]) => isBlank(it[k])).map(([, l]) => l);

const STATUS_STYLE = {
  Worksheet: ['#eef1f4', '#3d4a56'], Submitted: ['#e6f0fb', '#1f5aa6'], 'On hold': ['#fdf0e1', '#9a4b00'],
  Approved: ['#e5f4ec', '#17703f'], Released: ['#dff1f3', '#0b5c6b'],
};
const badge = (s) => { const [bg, fg] = STATUS_STYLE[s] || STATUS_STYLE.Worksheet; return html`<span class="badge" style="background:${bg};color:${fg}">${s}</span>`; };

const ICON = {
  home: '<path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z"/>', items: '<path d="M4 7l8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10"/>',
  suppliers: '<path d="M3 20V8l6 4V8l6 4V4h6v16z"/>', hierarchy: '<path d="M12 3v6M6 15v-3h12v3M4 15h4v5H4zM10 15h4v5h-4zM16 15h4v5h-4zM9 3h6v6H9z"/>',
  po: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>', pricing: '<path d="M4 12l8-8h8v8l-8 8zM15 9h.01"/>',
  inventory: '<path d="M3 7h18v13H3zM3 7l3-4h12l3 4M9 11h6"/>', release: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  reports: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
  chev: '<path d="M6 9l6 6 6-6"/>', bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20h4"/>', clip: '<path d="M8 12l6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l7-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>', export: '<path d="M12 3v12M7 8l5-5 5 5M5 21h14"/>', alert: '<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>',
};
const ic = (n, s = 16) => raw(`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`);

// Tasks menu, grouped the way the Merchandising task list is: [group, [[key, label, href], ...]].
const TASKS = [
  ['Items', [['items', 'Manage Items', '/items'], ['create', 'Create Item', '/items/new'], ['itemlists', 'Item Lists', '/items?status=all'], ['release', 'Release Items to Channels', '/channel-release']]],
  ['Foundation Data', [['suppliers', 'Manage Suppliers', '/suppliers'], ['hierarchy', 'Merchandise Hierarchy', '/hierarchy']]],
  ['Purchase Orders', [['po', 'Manage Purchase Orders', '/module/purchase-orders']]],
  ['Pricing', [['pricing', 'Manage Price Changes', '/module/pricing']]],
  ['Inventory', [['inventory', 'Inventory Adjustments', '/module/inventory']]],
  ['Reports', [['reports', 'Item Reports', '/module/reports']]],
];
const MODULES = TASKS.flatMap(([, t]) => t);

const LOGO = raw(`<svg width="98" height="14" viewBox="0 0 98 14" aria-label="Oracle"><text x="0" y="13" fill="#c74634" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="16.5" letter-spacing="1.6">ORACLE</text></svg>`);

const STYLE = `
:root{--link:#0572ce;--line:#d6dfe6;--line2:#e5eaee;--text:#333;--muted:#666;--label:#4f4f4f;--hdr:#fff;--pane:#f4f6f7;--cta:#0572ce;--pk-accent:#0572ce;--pk-radius:2px}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--text);font:12px/1.4 "Helvetica Neue",Helvetica,Arial,sans-serif}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
button,input,select,textarea{font:inherit;color:inherit}
svg{flex:none}
.bar{height:46px;background:var(--hdr);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:14px;padding:0 14px 0 16px;position:sticky;top:0;z-index:20}
.bar .logo{display:flex;align-items:center;gap:10px;color:#3a3a3a;font-size:15px;white-space:nowrap}
.bar .logo .pn{border-left:1px solid #c4ced7;padding-left:10px;color:#4f4f4f}
.env{font-size:10.5px;padding:1px 7px;border:1px solid #c4ced7;border-radius:2px;color:#666;letter-spacing:.02em;white-space:nowrap}
.gsearch{margin-left:auto;width:300px;display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #c4ced7;border-radius:2px;padding:0 8px;height:26px;color:#7a8a96}
.gsearch input{background:transparent;border:0;outline:0;flex:1;font-size:12px}
.bar .right{display:flex;align-items:center;gap:4px;color:#5c6b77}
.bar .right .ib{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:2px;position:relative}
.bar .right .ib:hover{background:#eef1f3}
.bar .right .ib .n{position:absolute;top:3px;right:2px;background:#c74634;color:#fff;font-size:9px;line-height:13px;min-width:13px;border-radius:7px;text-align:center;font-weight:700}
.role{display:flex;align-items:center;gap:6px;padding:0 6px 0 10px;color:#333;border-left:1px solid var(--line2);margin-left:4px;white-space:nowrap}
.role .av{width:26px;height:26px;border-radius:50%;background:#5c6b77;color:#fff;font-weight:700;font-size:10.5px;display:flex;align-items:center;justify-content:center}
.shell{display:flex;min-height:calc(100vh - 46px)}
.rail{width:40px;flex:none;background:#3a4a56;display:flex;flex-direction:column;align-items:center;padding-top:6px;gap:2px;position:sticky;top:46px;height:calc(100vh - 46px)}
.rail span{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#c5d0d8;border-radius:2px}
.rail span.on{background:#56687a;color:#fff}
.mods{width:220px;flex:none;background:var(--pane);border-right:1px solid var(--line);position:sticky;top:46px;height:calc(100vh - 46px);overflow:auto}
.mods .ttl{font-size:14px;color:#333;padding:10px 12px 8px;border-bottom:1px solid var(--line);display:flex;align-items:center}
.mods .ttl span{margin-left:auto;color:#7a8a96;font-size:11px}
.mods .grp{padding:6px 0 2px}
.mods .gh{display:flex;align-items:center;gap:4px;padding:3px 10px;font-weight:700;color:#333}
.mods .gh svg{color:#5c6b77}
.mods a{display:block;padding:3px 10px 3px 28px;color:var(--link)}
.mods a:hover{background:#e6ecf0;text-decoration:none}
.mods a.on{background:#d6ebff;color:#000}
.work{flex:1;min-width:0;display:flex;flex-direction:column}
.tabs{display:flex;align-items:flex-end;gap:2px;background:#eef1f3;border-bottom:1px solid var(--line);padding:6px 10px 0;position:sticky;top:46px;z-index:15}
.tabs a{display:flex;align-items:center;gap:8px;padding:5px 12px;background:#e1e7eb;border:1px solid var(--line);border-bottom:0;color:#333;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tabs a:hover{text-decoration:none;background:#eaf0f4}
.tabs a.on{background:#fff;border-top:2px solid var(--cta);margin-bottom:-1px;padding-bottom:6px;font-weight:700}
.tabs a .x{color:#7a8a96;font-weight:400}
.content{flex:1;padding:12px 16px 80px;min-width:0}
.crumb{display:none}
h1{font-size:18px;font-weight:400;color:#333;margin:2px 0 10px;display:flex;align-items:center;gap:10px;min-height:28px}
h1 .acts{margin-left:auto;display:flex;gap:4px;font-size:12px}
.badge{display:inline-block;font-size:11px;font-weight:700;padding:1px 6px;border-radius:2px;white-space:nowrap;border:1px solid rgba(0,0,0,.08)}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
.tile{background:#fff;border:1px solid var(--line);border-left:4px solid;padding:8px 12px}
.tile .n{font-size:26px;color:#333;margin-top:2px}
.tile .l{color:#333;font-weight:700}
.tile .s{font-size:11px;color:var(--muted);margin-top:2px}
.cols{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:12px;align-items:start}
.panel{background:#fff;border:1px solid var(--line);margin-bottom:12px}
.ph{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--line);font-size:14px;color:#333;background:#fff}
.ph .tools{margin-left:auto;display:flex;gap:2px;font-size:12px}
.pb{padding:8px 10px}
.tb{display:inline-flex;align-items:center;gap:4px;border:1px solid transparent;background:transparent;padding:2px 6px;border-radius:2px;cursor:pointer;color:#333;font-size:12px}
.tb:hover{background:#eef1f3;border-color:var(--line);text-decoration:none}
table.grid{width:100%;border-collapse:collapse}
table.grid th{background:#f9fafb;text-align:left;font-weight:700;color:#4f4f4f;padding:5px 8px;border:1px solid var(--line2);border-top:0;white-space:nowrap;font-size:12px}
table.grid th:first-child,table.grid td:first-child{border-left:0}
table.grid td{padding:4px 8px;border-bottom:1px solid var(--line2);border-right:1px solid #f1f4f6;vertical-align:middle}
table.grid tr:hover td{background:#eaf4fd}
.thumb{width:28px;height:28px;object-fit:cover;border:1px solid var(--line);background:#fff;vertical-align:middle}
.qt a{display:flex;align-items:center;gap:8px;padding:5px 2px;color:var(--link)}
.qt a span.i{width:22px;height:22px;color:#5c6b77;display:flex;align-items:center;justify-content:center}
.rr{display:flex;gap:10px;align-items:center;padding:5px 0;border-bottom:1px solid var(--line2)}
.rr:last-child{border-bottom:0}
.rr img{width:38px;height:38px;object-fit:cover;border:1px solid var(--line)}
.rr .m{color:var(--muted);font-size:11px}
.btn{display:inline-flex;align-items:center;gap:5px;border:1px solid #c4ced7;background:linear-gradient(#fdfdfd,#eef1f3);padding:0 10px;height:26px;border-radius:2px;cursor:pointer;font-weight:700;color:#333;font-size:12px;white-space:nowrap}
.btn:hover{background:linear-gradient(#fff,#e4eaee);border-color:#a6b4bf;text-decoration:none}
.btn.primary{background:var(--cta);border-color:#0466b8;color:#fff}
.btn.primary:hover{background:#0466b8}
.btn:disabled{opacity:1;cursor:default;background:#f6f7f8;color:#a6b0b8;border-color:#dfe4e7}
.btn.warn{color:#333}
.sect{background:#fff;margin-bottom:6px}
.sect summary{list-style:none;cursor:pointer;padding:6px 0 5px;font-size:15px;color:#333;display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--line)}
.sect summary::-webkit-details-marker{display:none}
.sect summary .chev{color:#5c6b77;display:flex}
.sect:not([open]) summary .chev{transform:rotate(-90deg)}
.sect summary .meta{margin-left:auto;font-weight:400;color:var(--muted);font-size:11px}
.fgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 20px;padding:10px 4px 12px}
.f{display:grid;grid-template-columns:150px minmax(0,1fr);align-items:center;gap:8px}
.f.w2,.f.w3{grid-column:1/-1}
.f.w2>:not(label),.f.w3>:not(label){max-width:620px}
.f label{color:var(--label);text-align:right;font-size:12px}
.f .hint{grid-column:2;font-size:11px;color:var(--muted);margin-top:-4px}
.req{color:#c74634;margin-right:2px}
.f input,.f select,.f textarea{border:1px solid #c4ced7;border-radius:2px;padding:2px 6px;height:24px;background:#fff;width:100%;font-size:12px}
.f input[readonly]{background:transparent;border-color:transparent;padding-left:0;font-weight:700;color:#333}
.f select:disabled{background:#f6f7f8}
.f textarea{height:auto;min-height:48px;resize:vertical}
.f input:focus,.f select:focus,.f textarea:focus{outline:1px solid var(--cta);border-color:var(--cta)}
.f.bad input,.f.bad select,.f.bad textarea{border-color:#c74634;background:#fff6f5}
.f .unit{display:flex;align-items:center;gap:6px;max-width:220px}.f .unit input{flex:1;min-width:0}.f .unit span{color:var(--muted)}
.ihdr{border:1px solid var(--line);background:#f9fafb;padding:8px 12px;margin-bottom:10px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px 18px}
.ihdr div{display:flex;gap:6px;min-width:0}.ihdr dt{color:var(--label);white-space:nowrap}.ihdr dd{margin:0;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.alert{display:flex;gap:10px;padding:8px 12px;border:1px solid;border-left-width:4px;margin-bottom:10px;align-items:flex-start;background:#fff}
.alert.hold{border-color:#e8b85c;background:#fffaf0;color:#333}
.alert.hold svg{color:#d98a00}
.alert.err{border-color:#e3a59b;color:#333;background:#fff6f5}
.alert.err svg{color:#c74634}
.alert.ok{border-color:#9fcf9f;color:#333;background:#f5fbf4}
.alert.info{border-color:#a7c9e8;color:#333;background:#f3f8fd}
.alert b{display:block;margin-bottom:2px}
.alert ul{margin:4px 0 0 18px;padding:0}
.abar{position:fixed;left:260px;right:0;bottom:0;background:#f9fafb;border-top:1px solid var(--line);padding:8px 16px;display:flex;gap:6px;align-items:center;z-index:5}
.abar .sp{flex:1}
.abar .why{color:var(--muted);font-size:11.5px;margin-right:8px}
.side .photo{width:100%;aspect-ratio:1/1;object-fit:contain;background:#fff;border-bottom:1px solid var(--line);display:block}
.kv{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;padding:8px 10px}
.kv dt{color:var(--label)}.kv dd{margin:0;text-align:right;font-weight:700}
.files a{display:flex;gap:6px;align-items:center;padding:4px 0}
.ft{font-size:9px;font-weight:700;color:#fff;padding:1px 4px;border-radius:2px}
.ft.pdf{background:#c74634}.ft.sheet{background:#2e7d32}.ft.image{background:#6a4fb3}.ft.file{background:#607d8b}
.hist{padding:4px 10px 8px}
.hist div{padding:4px 0;border-bottom:1px solid var(--line2)}
.hist div:last-child{border-bottom:0}
.hist small{color:var(--muted);display:block}
.imgs{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px}
.imgs .im{position:relative;width:60px}
.imgs img{width:60px;height:60px;object-fit:cover;border:1px solid var(--line);display:block}
.imgs .im button{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;border:1px solid #c4ced7;background:#fff;cursor:pointer;line-height:14px;padding:0;font-size:12px}
.imgs .im small{display:block;font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.35);display:none;align-items:center;justify-content:center;z-index:50}
.modal-bg.open{display:flex}
.modal{background:#fff;width:500px;border:1px solid #a6b4bf;box-shadow:0 4px 18px rgba(0,0,0,.3)}
.modal .ph{background:#f9fafb;font-size:14px}
.modal .pb textarea{width:100%;min-height:100px;border:1px solid #c4ced7;padding:6px 8px}
.modal .foot{display:flex;justify-content:flex-end;gap:6px;padding:8px 10px;border-top:1px solid var(--line);background:#f9fafb}
.crit{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 20px;padding:10px 4px}
.crit .go{grid-column:1/-1;display:flex;justify-content:flex-end;gap:6px;padding-right:6px}
.ch-ok{color:#2e7d32;font-weight:700}.ch-no{color:var(--muted)}
`;

const RAIL = { tasks: '<path d="M4 6h16M4 12h16M4 18h16"/>', reports: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' };
const rail = (n) => raw(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${RAIL[n]}</svg>`);

function page(title, active, body, extra = '') {
  const db = store.read();
  const notes = db.items.filter((i) => i.status === 'Submitted' || i.status === 'On hold').length;
  const tab = active === 'home' ? '' : title;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)} - Oracle Retail Merchandising</title>
<style>${STYLE}</style>${whatfixTag()}</head><body>
<header class="bar"><a class="logo" href="/" style="text-decoration:none">${LOGO}<span class="pn">Retail Merchandising</span></a><span class="env">PRODUCTION · AVH-US</span>
<form class="gsearch" action="/items" role="search">${ic('search', 13)}<input name="q" placeholder="Search Items" aria-label="Search items"></form>
<div class="right"><a class="ib" href="/" title="Home">${ic('home', 17)}</a><span class="ib" title="Favorites">${rail('star')}</span><span class="ib" title="Notifications">${ic('bell', 17)}${notes ? `<span class="n">${notes}</span>` : ''}</span><span class="ib" title="Help" style="font-weight:700;font-size:14px">?</span>
<span class="role"><span class="av">IC</span>${USER} ▾</span></div></header>
<div class="shell"><div class="rail" aria-hidden="true"><span class="on" title="Tasks">${rail('tasks')}</span><span title="Reports">${rail('reports')}</span><span title="Favorites">${rail('star')}</span><span title="Recent">${rail('clock')}</span></div>
<nav class="mods" aria-label="Tasks"><div class="ttl">Tasks<span>«</span></div>
${TASKS.map(([g, list]) => `<div class="grp"><div class="gh">${ic('chev', 12)}${g}</div>${list.map(([k, l, h]) => `<a href="${h}" class="${active === k ? 'on' : ''}">${l}</a>`).join('')}</div>`).join('')}</nav>
<div class="work"><div class="tabs" role="tablist"><a href="/" class="${tab ? '' : 'on'}" role="tab">Dashboard</a>${tab ? `<a class="on" role="tab" href="#">${esc(tab)}<span class="x" onclick="event.preventDefault();location.href='/'" title="Close tab">✕</span></a>` : ''}</div>
<main class="content">${body}</main></div></div>${extra}</body></html>`;
}

const supplierName = (db, id) => (db.suppliers.find((s) => s.id === id) || {}).name || '';
const deptLabel = (it) => { const n = className(it.dept, it.cls); return `${it.dept} / ${it.cls} ${n.cls}`; };
const firstImg = (it) => thumbSrc(it.images && it.images[0]);

// ---------- Home ----------
app.get('/', (req, res) => {
  const db = store.read();
  const o = db.offsets;
  const setup = db.items.filter((i) => ['Worksheet', 'Submitted', 'On hold', 'Approved'].includes(i.status));
  const weekAgo = Date.now() - 7 * 864e5;
  const recent = db.items.filter((i) => i.status === 'Released').sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5);
  const tiles = [
    ['Items in setup', setup.length + o.inSetup, '#0b5c6b', 'All departments'],
    ['On hold', db.items.filter((i) => i.status === 'On hold').length + o.onHold, '#d9822b', 'Needs supplier follow-up'],
    ['Awaiting approval', db.items.filter((i) => i.status === 'Submitted').length + o.awaiting, '#2f6fbf', 'Submitted for review'],
    ['Released this week', db.items.filter((i) => i.status === 'Released' && Date.parse(i.updatedAt) > weekAgo).length + o.released, '#2e8b57', 'To all channels'],
  ];
  res.send(page('Home', 'home', html`
    <div class="crumb">Home</div>
    <h1>Item Coordinator Dashboard</h1>
    <div class="tiles">${tiles.map(([l, n, c, s]) => html`<div class="tile" style="border-top-color:${c}"><div class="l">${l}</div><div class="n">${n}</div><div class="s">${s}</div></div>`)}</div>
    <div class="cols"><div>
      <div class="panel"><div class="ph">My items in setup <span class="badge" style="background:#eef1f4;color:#3d4a56">${setup.length}</span>
        <span class="tools"><span class="tb">Actions ${ic('chev', 12)}</span><span class="tb">View: Standard ${ic('chev', 12)}</span><span class="tb">${ic('filter', 12)}Filter</span><span class="tb">${ic('export', 12)}Export</span></span></div>
        <table class="grid"><thead><tr><th></th><th>Item</th><th>Description</th><th>Supplier</th><th>Dept / class</th><th>Status</th><th>Last updated</th></tr></thead><tbody>
        ${setup.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).map((i) => html`<tr><td><img class="thumb" src="${firstImg(i)}" alt=""></td>
          <td><a href="/items/${i.code}">${i.code}</a></td><td>${i.description}</td><td>${supplierName(db, i.supplierId)}</td><td>${deptLabel(i)}</td><td>${badge(i.status)}</td><td>${fmtDate(i.updatedAt)}</td></tr>`)}
        </tbody></table></div>
    </div><div>
      <div class="panel"><div class="ph">Quick tasks</div><div class="pb qt">
        <a href="/items/new"><span class="i">${ic('plus')}</span>Create item</a>
        <a href="/items"><span class="i">${ic('search')}</span>Find items</a>
        <a href="/items?status=all"><span class="i">${ic('items')}</span>Item lists</a>
        <a href="/channel-release"><span class="i">${ic('release')}</span>Release items to channels</a></div></div>
      <div class="panel"><div class="ph">Recently released items</div><div class="pb">
        ${recent.map((i) => html`<div class="rr"><img src="${firstImg(i)}" alt=""><div><a href="/items/${i.code}">${i.description}</a><div class="m">${i.code} · ${fmtDate(i.updatedAt)}</div></div></div>`)}
      </div></div>
    </div></div>`));
});

// ---------- Find items ----------
app.get('/items', (req, res) => {
  const db = store.read();
  const q = req.query;
  const t = (s) => String(s || '').toLowerCase();
  let list = db.items.slice();
  if (q.q) list = list.filter((i) => [i.code, i.description, supplierName(db, i.supplierId)].some((v) => t(v).includes(t(q.q))));
  if (q.item) list = list.filter((i) => t(i.code).includes(t(q.item)));
  if (q.description) list = list.filter((i) => t(i.description).includes(t(q.description)));
  if (q.supplier) list = list.filter((i) => i.supplierId === q.supplier);
  if (q.dept) list = list.filter((i) => i.dept === q.dept);
  if (q.status && q.status !== 'all') list = list.filter((i) => i.status === q.status);
  list.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  res.send(page('Manage Items', 'items', html`
    <div class="crumb"><a href="/">Home</a> / Items</div>
    <h1>Item Search<span class="acts"><a class="btn" href="/items/new">${ic('plus', 13)}Create Item</a></span></h1>
    <form class="panel" method="get"><div class="ph">${ic('chev', 12)}Search<span class="tools" style="color:var(--muted)">Basic · <a href="#">Advanced</a> · Saved Search: Item Coordinator Default</span></div><div class="crit">
      <div class="f"><label for="item">Item</label><input id="item" name="item" value="${q.item || ''}"></div>
      <div class="f"><label for="description">Description</label><input id="description" name="description" value="${q.description || q.q || ''}"></div>
      <div class="f"><label for="supplier">Supplier</label><select id="supplier" name="supplier"><option value="">Any</option>${db.suppliers.map((s) => html`<option value="${s.id}" ${q.supplier === s.id ? 'selected' : ''}>${s.name} (${s.id})</option>`)}</select></div>
      <div class="f"><label for="dept">Department</label><select id="dept" name="dept"><option value="">Any</option>${db.hierarchy.map((d) => html`<option value="${d.dept}" ${q.dept === d.dept ? 'selected' : ''}>${d.dept} ${d.name}</option>`)}</select></div>
      <div class="f"><label for="status">Status</label><select id="status" name="status"><option value="all">Any</option>${Object.keys(STATUS_STYLE).map((s) => html`<option ${q.status === s ? 'selected' : ''}>${s}</option>`)}</select></div>
      <div class="go"><button class="btn">Search</button><a class="btn" href="/items">Reset</a></div></div></form>
    <div class="panel"><div class="ph">${ic('chev', 12)}Results <span style="color:var(--muted);font-size:12px">(${list.length})</span><span class="tools"><span class="tb">Actions ${ic('chev', 11)}</span><span class="tb">View ${ic('chev', 11)}</span><span class="tb">Format ${ic('chev', 11)}</span><span class="tb">${ic('plus', 12)}</span><span class="tb">${ic('export', 12)}</span></span></div>
      <table class="grid"><thead><tr><th></th><th>Item</th><th>Description</th><th>Supplier</th><th>Dept / class</th><th>Color</th><th>Retail</th><th>Status</th><th>Updated</th></tr></thead><tbody>
      ${list.map((i) => html`<tr><td><img class="thumb" src="${firstImg(i)}" alt=""></td><td><a href="/items/${i.code}">${i.code}</a></td><td>${i.description}</td><td>${supplierName(db, i.supplierId)}</td><td>${deptLabel(i)}</td><td>${i.color}</td><td>${money(i.retail)}</td><td>${badge(i.status)}</td><td>${fmtDate(i.updatedAt)}</td></tr>`)}
      ${list.length ? '' : html`<tr><td colspan="9" style="padding:20px;color:var(--muted)">No items match these criteria.</td></tr>`}
      </tbody></table></div>`));
});

// ---------- Item maintenance ----------
const MSG = {
  saved: ['ok', 'Item saved.'], created: ['ok', 'Item created with status Worksheet.'], approved: ['ok', 'Item approved. It can now be released to channels.'],
  released: ['ok', 'Item released to channels. A draft product was created in Shopify for review.'], held: ['info', 'Item put on hold.'], unheld: ['ok', 'Hold removed. Item returned to Worksheet.'],
  submitted: ['ok', 'Item submitted for approval.'],
};

function field(it, key, label, opts = {}) {
  const req = REQUIRED.some(([k]) => k === key);
  const bad = opts.bad && opts.bad.includes(label);
  const v = it[key] ?? '';
  const id = 'f-' + key;
  let input;
  if (opts.type === 'textarea') input = html`<textarea id="${id}" name="${key}" ${opts.ro ? 'readonly' : ''}>${v}</textarea>`;
  else if (opts.options) input = html`<select id="${id}" name="${key}" ${opts.ro ? 'disabled' : ''}><option value="">Select…</option>${opts.options.map(([val, lab]) => html`<option value="${val}" ${String(v) === String(val) ? 'selected' : ''}>${lab}</option>`)}</select>`;
  else input = html`<input id="${id}" name="${key}" value="${v}" ${opts.ro ? 'readonly' : ''} ${opts.num ? raw('inputmode="decimal"') : ''} ${opts.placeholder ? raw(`placeholder="${esc(opts.placeholder)}"`) : ''}>`;
  if (opts.unit) input = html`<span class="unit">${input}<span>${opts.unit}</span></span>`;
  return html`<div class="f ${opts.cls || ''} ${bad ? 'bad' : ''}"><label for="${id}">${req ? html`<span class="req" aria-label="required">*</span>` : ''}${label}</label>${input}${opts.hint ? html`<span class="hint">${opts.hint}</span>` : ''}</div>`;
}

function itemPage(req, res, it, isNew) {
  const db = store.read();
  const miss = missing(it);
  const showVal = req.query.v === '1';
  const bad = showVal || req.query.m === 'blocked' ? miss : [];
  const onHold = it.status === 'On hold';
  const canApprove = !isNew && !miss.length && !onHold && ['Worksheet', 'Submitted'].includes(it.status);
  const canRelease = !isNew && !miss.length && !onHold && it.status === 'Approved';
  const why = isNew ? 'Save the item to enable approval.' : onHold ? 'Approve and Release are unavailable while the item is on hold.' : miss.length ? `${miss.length} required field${miss.length > 1 ? 's' : ''} missing.` : it.status === 'Released' ? 'Item has been released.' : '';
  const product = !isNew && db.products.find((p) => p.sourceCode === it.code);
  const cartifyReq = ['description', 'color', 'width', 'depth', 'height', 'weight', 'materials', 'retail', 'images'];
  const cartifyDone = cartifyReq.filter((k) => (k === 'images' ? it.images && it.images.length : !isBlank(it[k]))).length;
  const supOpts = db.suppliers.map((s) => [s.id, `${s.name} (${s.id})`]);
  const deptOpts = db.hierarchy.map((d) => [d.dept, `${d.dept} ${d.name}`]);
  const clsOpts = db.hierarchy.flatMap((d) => d.classes.map(([c, n]) => [c, `${c} ${n}`, d.dept]));
  const margin = it.cost && it.retail ? Math.round(((it.retail - it.cost) / it.retail) * 1000) / 10 : null;
  const m = MSG[req.query.m];
  const title = isNew ? 'Create Item' : `Item ${it.code}`;

  const body = html`
    <div class="crumb"><a href="/">Home</a> / <a href="/items">Items</a> / ${isNew ? 'Create item' : it.code}</div>
    <h1>${isNew ? 'Create Item' : 'Item'} ${isNew ? badge('Worksheet') : badge(it.status)}<span class="acts">
      <span class="tb">Actions ${ic('chev', 11)}</span>
      ${!isNew && it.status === 'Worksheet' ? html`<button class="btn" form="itemform" name="action" value="submit" ${miss.length ? 'disabled' : ''}>Submit</button>` : ''}
      <button class="btn" form="itemform" name="action" value="approve" ${canApprove ? '' : 'disabled'} title="${canApprove ? 'Approve item' : why}">Approve</button>
      <button class="btn" form="itemform" name="action" value="release" ${canRelease ? '' : 'disabled'} title="${canRelease ? 'Send to Shopify as a draft product' : why}">${ic('release', 13)}Release to Channels</button>
      <button class="btn" form="itemform" name="action" value="validate">Validate</button>
      ${!isNew && !onHold && it.status !== 'Released' ? html`<button type="button" class="btn warn" onclick="document.getElementById('hold').classList.add('open');document.getElementById('holdtext').focus()">Put on Hold</button>` : ''}
      ${onHold ? html`<button class="btn" form="itemform" name="action" value="unhold">Remove Hold</button>` : ''}
    </span></h1>
    ${isNew ? '' : html`<dl class="ihdr"><div><dt>Item</dt><dd>${it.code}</dd></div><div><dt>Description</dt><dd title="${it.description}">${it.description}</dd></div><div><dt>Status</dt><dd>${it.status}</dd></div><div><dt>Item Type</dt><dd>Regular Item</dd></div>
      <div><dt>Department</dt><dd>${it.dept ? deptLabel(it).split(' / ')[0] + ' ' + ((db.hierarchy.find((d) => d.dept === it.dept) || {}).name || '') : '—'}</dd></div><div><dt>Class</dt><dd>${it.cls ? deptLabel(it).split(' / ')[1] : '—'}</dd></div><div><dt>Supplier</dt><dd>${supplierName(db, it.supplierId) || '—'}</dd></div><div><dt>Item Level</dt><dd>1 of 1 (Transaction level)</dd></div></dl>`}
    ${onHold ? html`<div class="alert hold" role="alert">${ic('alert', 18)}<div><b>On hold</b>${it.holdNote}</div></div>` : ''}
    ${req.query.m === 'blocked' ? html`<div class="alert err" role="alert">${ic('alert', 18)}<div><b>Action not available</b>${req.query.why || 'Complete the required fields first.'}${miss.length ? html`<ul>${miss.map((x) => html`<li>${x}</li>`)}</ul>` : ''}</div></div>` : ''}
    ${req.query.m === 'dup' ? html`<div class="alert err" role="alert">${ic('alert', 18)}<div><b>Item code already exists</b>Use a different item code.</div></div>` : ''}
    ${showVal ? (miss.length
      ? html`<div class="alert err" role="alert">${ic('alert', 18)}<div><b>Validation found ${miss.length} missing required field${miss.length > 1 ? 's' : ''}</b><ul>${miss.map((x) => html`<li>${x}</li>`)}</ul></div></div>`
      : html`<div class="alert ok" role="status"><div><b>Validation passed</b>All required fields are complete.</div></div>`) : ''}
    ${m ? html`<div class="alert ${m[0]}" role="status"><div>${m[1]}${req.query.m === 'released' && product ? html` <a href="${url('cartify', '/products/' + product.id)}">Open in Shopify</a>` : ''}</div></div>` : ''}
    <form id="itemform" method="post" action="${isNew ? '/items/new' : '/items/' + it.code}">
    <input type="hidden" name="images" id="images" value="${(it.images || []).join('|')}">
    <input type="hidden" name="attachments" id="attachments" value="${(it.attachments || []).join('|')}">
    <input type="hidden" name="holdNote" id="holdNote" value="${it.holdNote || ''}">
    <div class="cols"><div>
      <details class="sect" open><summary><span class="chev">${ic('chev', 14)}</span>Item Details<span class="meta">Fields marked <span class="req">*</span> are required</span></summary>
        <div class="fgrid">
          ${field(it, 'code', 'Item code', { bad, ro: !isNew, placeholder: 'e.g. NF-XXX-XX-XXX' })}
          ${field(it, 'description', 'Description', { bad, cls: 'w2' })}
          ${field(it, 'dept', 'Department', { bad, options: deptOpts })}
          <div class="f ${bad.includes('Class') ? 'bad' : ''}"><label for="f-cls"><span class="req">*</span>Class</label><select id="f-cls" name="cls"><option value="">Select…</option>
            ${clsOpts.map(([c, n, d]) => html`<option value="${c}" data-dept="${d}" ${it.cls === c && it.dept === d ? 'selected' : ''}>${n}</option>`)}</select></div>
          ${field(it, 'brand', 'Brand')}
          ${field(it, 'color', 'Color', { bad })}
          ${field(it, 'upc', 'UPC', { hint: '12-digit UPC-A, if assigned' })}
          ${field(it, 'leadTime', 'Lead time')}
          ${field(it, 'onlineDescription', 'Online description', { type: 'textarea', cls: 'w3', hint: 'Sent to Shopify as the product description on release.' })}
        </div></details>
      <details class="sect" open><summary><span class="chev">${ic('chev', 14)}</span>Dimensions and Weight<span class="meta">Inches and pounds</span></summary>
        <div class="fgrid">
          ${field(it, 'width', 'Overall width', { bad, unit: 'in', num: true })}
          ${field(it, 'depth', 'Overall depth', { bad, unit: 'in', num: true })}
          ${field(it, 'height', 'Overall height', { bad, unit: 'in', num: true })}
          ${field(it, 'seatHeight', 'Seat height', { unit: 'in', num: true })}
          ${field(it, 'weight', 'Product weight', { bad, unit: 'lb', num: true })}
          ${field(it, 'capacity', 'Weight capacity', { unit: 'lb', num: true })}
          ${field(it, 'materials', 'Materials', { bad, type: 'textarea', cls: 'w2' })}
          ${field(it, 'assembly', 'Assembly', { type: 'textarea' })}
          ${field(it, 'care', 'Care', { type: 'textarea', cls: 'w3' })}
        </div></details>
      <details class="sect" open><summary><span class="chev">${ic('chev', 14)}</span>Supplier and Cost</summary>
        <div class="fgrid">
          ${field(it, 'supplierId', 'Supplier', { bad, options: supOpts })}
          ${field(it, 'supplierItem', 'Supplier item number')}
          <div class="f"><label>Currency</label><input value="USD" readonly></div>
          ${field(it, 'cost', 'Unit cost', { bad, unit: 'USD', num: true })}
          ${field(it, 'retail', 'Retail price', { bad, unit: 'USD', num: true })}
          <div class="f"><label>Initial margin</label><input value="${margin === null ? '' : margin + '%'}" readonly></div>
        </div></details>
      <details class="sect" open><summary><span class="chev">${ic('chev', 14)}</span>Channels</summary>
        <table class="grid"><thead><tr><th>Channel</th><th>Required attributes</th><th>Release status</th><th>Integration</th></tr></thead><tbody>
          <tr><td><b>Shopify</b> · Online Store and Mobile App</td><td><span class="${cartifyDone === cartifyReq.length ? 'ch-ok' : 'ch-no'}">${cartifyDone} of ${cartifyReq.length} complete</span></td>
            <td>${product ? html`Released · Shopify status: <b>${product.status === 'active' ? 'Active' : product.status === 'draft' ? 'Draft' : 'Archived'}</b>` : 'Not released'}</td><td>Automatic sync on release</td></tr>
          <tr><td><b>Stores</b> · Point of sale</td><td><span class="ch-no">Not required</span></td><td>${it.status === 'Released' ? 'Released' : 'Not released'}</td><td>Nightly batch</td></tr>
          <tr><td><b>Amazon</b> · Marketplace</td><td><span class="ch-no">n/a</span></td><td>Not connected</td><td>Listings managed manually in Seller Central</td></tr>
        </tbody></table></details>
    </div>
    <aside class="side">
      <div class="panel"><img class="photo" id="mainphoto" src="${firstImg(it)}" alt="Item photo">
        <dl class="kv"><dt>Unit cost</dt><dd>${money(it.cost) || '—'}</dd><dt>Retail</dt><dd>${money(it.retail) || '—'}</dd><dt>Margin</dt><dd>${margin === null ? '—' : margin + '%'}</dd><dt>Supplier</dt><dd>${supplierName(db, it.supplierId) || '—'}</dd></dl></div>
      <div class="panel"><div class="ph">Images<span class="tools"><button type="button" class="tb" onclick="openPicker({kind:'image',multiple:true,title:'Add item images'},f=>addFiles('images',f))">${ic('plus', 12)}Add images</button></span></div>
        <div class="imgs" id="imgs-list"></div></div>
      <div class="panel"><div class="ph">Attachments<span class="tools"><button type="button" class="tb" onclick="openPicker({kind:'doc',multiple:true,title:'Attach spec sheet or document'},f=>addFiles('attachments',f))">${ic('clip', 12)}Attach file</button></span></div>
        <div class="pb files" id="atts-list"></div></div>
      ${!isNew ? html`<div class="panel"><div class="ph">History</div><div class="hist">
        ${it.history.slice().reverse().map((h) => html`<div>${h.text}<small>${h.by} · ${fmtDateTime(h.at)}</small></div>`)}</div></div>` : ''}
    </aside></div>

    <div class="abar"><span class="sp"></span><span class="why">${why}</span>
      <button class="btn" name="action" value="save">Save</button>
      <button class="btn primary" name="action" value="saveclose">Save and Close</button>
      <a class="btn" href="/">Cancel</a>
    </div></form>

    <div class="modal-bg" id="hold" role="dialog" aria-modal="true" aria-labelledby="holdtitle"><div class="modal">
      <div class="ph" id="holdtitle">Put Item on Hold</div>
      <div class="pb"><label for="holdtext" style="display:block;margin-bottom:6px"><span class="req">*</span>Hold Note</label>
        <textarea id="holdtext" placeholder="Describe why the item is on hold"></textarea><div id="holderr" class="hint" style="color:#d0212a;display:none">Enter a hold note.</div></div>
      <div class="foot"><button type="button" class="btn" onclick="document.getElementById('hold').classList.remove('open')">Cancel</button>
        <button type="button" class="btn primary" onclick="submitHold()">OK</button></div></div></div>`;

  const viewBase = isNew ? '' : '/items/' + encodeURIComponent(it.code) + '/attachments/';
  const script = `<script>
  const VIEW_BASE = ${JSON.stringify(viewBase)};
  const form = document.getElementById('itemform');
  function list(name){ const v = document.getElementById(name).value; return v ? v.split('|') : []; }
  function setList(name, arr){ document.getElementById(name).value = arr.join('|'); draw(); }
  function addFiles(name, files){ setList(name, list(name).concat(files.filter(f => !list(name).includes(f)))); }
  function removeFile(name, f){ setList(name, list(name).filter(x => x !== f)); }
  const src = (f) => f.startsWith('art:') ? '/art/' + f.slice(4) + '.svg' : '/files/' + encodeURIComponent(f);
  const escH = (s) => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function draw(){
    const imgs = list('images');
    document.getElementById('imgs-list').innerHTML = imgs.length ? imgs.map(f => '<div class="im"><img src="' + src(f) + '" alt=""><button type="button" title="Remove" aria-label="Remove ' + escH(f) + '" onclick="removeFile(\\'images\\',\\'' + f.replace(/'/g, "\\\\'") + '\\')">&times;</button><small>' + escH(f.replace(/^art:/,'')) + '</small></div>').join('') : '<span class="hint" style="color:#5f6f7a">No images added</span>';
    document.getElementById('mainphoto').src = imgs.length ? src(imgs[0]) : '/art/tables.svg';
    const atts = list('attachments');
    document.getElementById('atts-list').innerHTML = atts.length ? atts.map(f => { const k = /\\.pdf$/i.test(f) ? 'pdf' : /\\.xlsx?$/i.test(f) ? 'sheet' : 'file'; return '<div style="display:flex;align-items:center;gap:6px;padding:3px 0"><span class="ft ' + k + '">' + (k === 'pdf' ? 'PDF' : k === 'sheet' ? 'XLS' : 'FILE') + '</span><a href="' + (VIEW_BASE ? VIEW_BASE : '/files/') + encodeURIComponent(f) + '" target="_blank">' + escH(f) + '</a><button type="button" class="tb" style="margin-left:auto;padding:0 6px" aria-label="Remove ' + escH(f) + '" onclick="removeFile(\\'attachments\\',\\'' + f.replace(/'/g, "\\\\'") + '\\')">&times;</button></div>'; }).join('') : '<span style="color:#5f6f7a">No attachments</span>';
  }
  draw();
  // Class list follows the chosen department.
  const dept = document.getElementById('f-dept'), cls = document.getElementById('f-cls');
  function filterCls(){ [...cls.options].forEach(o => { if (o.value) o.hidden = dept.value && o.dataset.dept !== dept.value; }); if (cls.selectedOptions[0] && cls.selectedOptions[0].hidden) cls.value = ''; }
  dept.addEventListener('change', filterCls); filterCls();
  function submitHold(){
    const t = document.getElementById('holdtext').value.trim();
    if (!t) { document.getElementById('holderr').style.display = 'block'; return; }
    document.getElementById('holdNote').value = t;
    const a = document.createElement('input'); a.type = 'hidden'; a.name = 'action'; a.value = 'hold'; form.appendChild(a); form.submit();
  }
  </script>`;
  res.send(page(title, isNew ? 'create' : 'items', body, pickerAssets() + script));
}

function blankItem() {
  return { code: '', description: '', supplierId: '', supplierItem: '', dept: '', cls: '', brand: 'Alder & Vale Home', color: '', width: null, depth: null, height: null, seatHeight: null, weight: null, capacity: null,
    materials: '', assembly: '', care: '', cost: null, retail: null, upc: '', leadTime: '', onlineDescription: '', images: [], attachments: [], status: 'Worksheet', holdNote: '', history: [] };
}

function applyForm(it, b) {
  const strs = ['description', 'supplierId', 'supplierItem', 'dept', 'cls', 'brand', 'color', 'materials', 'assembly', 'care', 'upc', 'leadTime', 'onlineDescription'];
  for (const k of strs) if (b[k] !== undefined) it[k] = String(b[k]).trim();
  for (const k of ['width', 'depth', 'height', 'seatHeight', 'weight', 'capacity', 'cost', 'retail']) {
    if (b[k] !== undefined) it[k] = num(String(b[k]).replace(/[$,"\s]|in|lb/gi, ''));
  }
  if (b.images !== undefined) it.images = b.images ? b.images.split('|').filter(Boolean) : [];
  if (b.attachments !== undefined) it.attachments = b.attachments ? b.attachments.split('|').filter(Boolean) : [];
}

app.get('/items/new', (req, res) => itemPage(req, res, blankItem(), true));

app.post('/items/new', (req, res) => {
  const b = req.body;
  const code = String(b.code || '').trim().toUpperCase();
  const it = blankItem();
  it.code = code;
  applyForm(it, b);
  const db = store.read();
  if (!code) { req.query = { v: '1' }; return itemPage(req, res, it, true); }
  if (db.items.some((i) => i.code === code)) { req.query = { m: 'dup' }; return itemPage(req, res, it, true); }
  const now = new Date().toISOString();
  it.createdAt = now; it.updatedAt = now;
  it.history = [{ at: now, by: USER_NAME, text: 'Item created' }];
  if (it.attachments.length) it.history.push({ at: now, by: USER_NAME, text: 'Attached ' + it.attachments.join(', ') });
  store.update((d) => d.items.push(it));
  const action = b.action;
  if (action === 'saveclose') return res.redirect('/');
  if (action === 'validate') return res.redirect(`/items/${code}?v=1`);
  if (action === 'hold') return holdItem(code, b.holdNote, res);
  res.redirect(`/items/${code}?m=created`);
});

// Item attachment and image viewer: spec sheets open as pages or a sheet grid, photos full size.
const VIEW_CSS = `
.docv-bar{display:flex;align-items:center;gap:12px;margin:0 0 12px}
.docv-bar h1{margin:0;font-size:18px;font-weight:400;display:flex;align-items:center;gap:8px}
.docv-bar .meta{color:#5f6f7a;font-size:12.5px}
.docv-bar .sp{flex:1}
.docv-body{background:#e8eaed;border:1px solid #d6dde2;padding:18px;overflow:auto;max-height:calc(100vh - 210px)}
.docv-body .pdfpage{display:block;margin:0 auto 16px;max-width:880px;width:100%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.docv-body .pgl{text-align:center;color:#5f6f7a;font-size:12px;margin:-8px 0 16px}
.docv-body .imgv{display:flex;justify-content:center}.docv-body .imgv img{max-width:100%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.docv-body .sheetwrap{background:#fff;overflow:auto;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.docv-body table.xl{border-collapse:collapse;font:13px Calibri,Carlito,Arial,sans-serif;table-layout:fixed}
.docv-body table.xl th{background:#f3f4f6;color:#555;font-weight:400;border:1px solid #d4d4d8;height:22px;font-size:12px;position:sticky;top:0}
.docv-body table.xl td{border:1px solid #e4e4e7;height:22px;padding:1px 5px;white-space:nowrap;overflow:hidden}
.docv-body table.xl td.rn{background:#f3f4f6;color:#555;text-align:center;font-size:12px;border-color:#d4d4d8}
.docv-tabs{display:flex;gap:2px;padding:0 10px;background:#f3f4f6;border-top:1px solid #d4d4d8}
.docv-tabs a{padding:7px 16px;font-size:13px;color:#444;border-bottom:3px solid transparent}
.docv-tabs a.on{background:#fff;color:#188038;font-weight:600;border-bottom-color:#188038}`;

app.get('/items/:code/attachments/:name', async (req, res, next) => {
  try {
    const it = store.read().items.find((i) => i.code === req.params.code);
    const name = req.params.name;
    const known = it && [...(it.attachments || []), ...(it.images || [])].includes(name);
    const file = known && locate(name);
    if (!file) return res.status(404).send(page('Not found', 'items', html`<h1>Attachment not found</h1><p>This item has no attachment named “${name}”.</p><p><a href="/items/${encodeURIComponent(req.params.code)}">Back to item</a></p>`));
    const kind = kindOf(name);
    const base = `/items/${encodeURIComponent(it.code)}/attachments/${encodeURIComponent(name)}`;
    let content = '', meta = '';
    if (kind === 'pdf') {
      const pages = pdfPages(name);
      meta = pages.length ? `PDF · ${pages.length} page${pages.length > 1 ? 's' : ''}` : 'PDF';
      content = pages.length
        ? pages.map((p, i) => `<img class="pdfpage" src="/spec-pages/${encodeURIComponent(p)}" alt="${esc(name)} page ${i + 1}"><div class="pgl">Page ${i + 1} of ${pages.length}</div>`).join('')
        : `<iframe src="/files/${encodeURIComponent(name)}" style="width:100%;height:70vh;border:0;background:#fff" title="${esc(name)}"></iframe>`;
    } else if (kind === 'sheet') {
      const sh = await sheetHtml(file, Number(req.query.sheet || 0), base + '?x=1');
      meta = `Spreadsheet · sheet: ${sh.sheetName} · ${sh.count} sheets`;
      content = `<div class="sheetwrap">${sh.table}</div><div class="docv-tabs" role="tablist">${sh.tabs}</div>`;
    } else if (kind === 'image') {
      const info = imageInfo(name);
      meta = info && info.w ? `Image · ${info.w} × ${info.h} px` : 'Image';
      content = `<div class="imgv"><img src="/files/${encodeURIComponent(name)}" alt="${esc(name)}"></div>`;
    } else content = '<p>Preview not available. Download the file to open it.</p>';
    res.send(page(`${it.code} attachment`, 'items', html`<div class="docv-bar">
        <a class="btn" href="/items/${encodeURIComponent(it.code)}">‹ Back to item</a>
        <h1>${name}</h1><span class="meta">${meta} · Item ${it.code}, ${it.description}</span><span class="sp"></span>
        <a class="btn" href="/files/${encodeURIComponent(name)}?download=1">Download</a></div>
      <div class="docv-body">${raw(content)}</div>`, `<style>${VIEW_CSS}</style>`));
  } catch (e) { next(e); }
});

app.get('/items/:code', (req, res) => {
  const it = store.read().items.find((i) => i.code === req.params.code);
  if (!it) return res.status(404).send(page('Not found', 'items', html`<h1>Item not found</h1><p><a href="/items">Find items</a></p>`));
  itemPage(req, res, it, false);
});

function holdItem(code, note, res) {
  store.update((d) => {
    const it = d.items.find((i) => i.code === code);
    const now = new Date().toISOString();
    it.status = 'On hold'; it.holdNote = String(note || '').trim(); it.updatedAt = now;
    it.history.push({ at: now, by: USER_NAME, text: 'Put on hold: ' + it.holdNote });
  });
  res.redirect(`/items/${encodeURIComponent(code)}?m=held`);
}

app.post('/items/:code', (req, res) => {
  const code = req.params.code;
  const b = req.body;
  const action = b.action || 'save';
  const before = store.read().items.find((i) => i.code === code);
  if (!before) return res.status(404).send('Item not found');

  // Every action saves the form first.
  const changed = [];
  store.update((d) => {
    const it = d.items.find((i) => i.code === code);
    const prev = JSON.stringify(it);
    const prevAtt = it.attachments.slice();
    applyForm(it, b);
    if (JSON.stringify(it) !== prev) {
      const now = new Date().toISOString();
      it.updatedAt = now;
      const added = it.attachments.filter((a) => !prevAtt.includes(a));
      if (added.length) it.history.push({ at: now, by: USER_NAME, text: 'Attached ' + added.join(', ') });
      it.history.push({ at: now, by: USER_NAME, text: 'Item details saved' });
      changed.push(true);
    }
  });
  const it = store.read().items.find((i) => i.code === code);
  const miss = missing(it);
  const blocked = (why) => res.redirect(`/items/${code}?m=blocked&why=${encodeURIComponent(why)}`);
  const now = new Date().toISOString();

  switch (action) {
    case 'saveclose': return res.redirect('/');
    case 'validate': return res.redirect(`/items/${code}?v=1`);
    case 'hold': return holdItem(code, b.holdNote, res);
    case 'unhold':
      store.update((d) => { const x = d.items.find((i) => i.code === code); x.status = 'Worksheet'; x.holdNote = ''; x.updatedAt = now; x.history.push({ at: now, by: USER_NAME, text: 'Hold removed' }); });
      return res.redirect(`/items/${code}?m=unheld`);
    case 'submit':
      if (miss.length) return blocked('Complete the required fields before submitting.');
      store.update((d) => { const x = d.items.find((i) => i.code === code); x.status = 'Submitted'; x.updatedAt = now; x.history.push({ at: now, by: USER_NAME, text: 'Submitted for approval' }); });
      return res.redirect(`/items/${code}?m=submitted`);
    case 'approve':
      if (it.status === 'On hold') return blocked('The item is on hold. Remove the hold before approving.');
      if (miss.length) return blocked('Complete the required fields before approving.');
      if (!['Worksheet', 'Submitted'].includes(it.status)) return blocked(`Items with status ${it.status} cannot be approved.`);
      store.update((d) => { const x = d.items.find((i) => i.code === code); x.status = 'Approved'; x.updatedAt = now; x.history.push({ at: now, by: USER_NAME, text: 'Approved' }); });
      return res.redirect(`/items/${code}?m=approved`);
    case 'release':
      if (it.status === 'On hold') return blocked('The item is on hold and cannot be released.');
      if (miss.length) return blocked('Complete the required fields before releasing.');
      if (it.status !== 'Approved') return blocked('Approve the item before releasing it to channels.');
      store.update((d) => {
        const x = d.items.find((i) => i.code === code);
        x.status = 'Released'; x.updatedAt = now;
        x.history.push({ at: now, by: USER_NAME, text: 'Released to channels (Shopify draft created)' });
        releaseToShopify(d, x, USER_NAME);
      });
      return res.redirect(`/items/${code}?m=released`);
    default:
      return res.redirect(`/items/${code}?m=saved`);
  }
});

// ---------- Other modules ----------
app.get('/suppliers', (req, res) => {
  const db = store.read();
  res.send(page('Manage Suppliers', 'suppliers', html`<h1>Supplier Search</h1>
    <div class="panel"><table class="grid"><thead><tr><th>Supplier</th><th>Name</th><th>Contact</th><th>Email</th><th>Location</th><th>Terms</th><th>Active items</th></tr></thead><tbody>
    ${db.suppliers.map((s) => html`<tr><td>${s.id}</td><td><a href="/items?supplier=${s.id}">${s.name}</a></td><td>${s.contact}</td><td>${s.email}</td><td>${s.city}</td><td>${s.terms}</td><td>${s.items + db.items.filter((i) => i.supplierId === s.id && i.createdAt > db.seededAt).length}</td></tr>`)}
    </tbody></table></div>`));
});

app.get('/hierarchy', (req, res) => {
  const db = store.read();
  res.send(page('Merchandise Hierarchy', 'hierarchy', html`<div class="crumb"><a href="/">Home</a> / Merchandise hierarchy</div><h1>Merchandise Hierarchy</h1>
    <div class="panel"><table class="grid"><thead><tr><th>Department</th><th>Class</th><th>Class name</th><th>Items</th></tr></thead><tbody>
    ${db.hierarchy.flatMap((d) => d.classes.map(([c, n], i) => html`<tr><td>${i === 0 ? `${d.dept} ${d.name}` : ''}</td><td>${c}</td><td>${n}</td><td>${db.items.filter((x) => x.dept === d.dept && x.cls === c).length}</td></tr>`))}
    </tbody></table></div>`));
});

app.get('/channel-release', (req, res) => {
  const db = store.read();
  const ready = db.items.filter((i) => i.status === 'Approved');
  const done = db.items.filter((i) => i.status === 'Released').sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  res.send(page('Release Items to Channels', 'release', html`<h1>Release Items to Channels</h1>
    <div class="panel"><div class="ph">Approved, ready to release <span class="badge" style="background:#eef1f4;color:#3d4a56">${ready.length}</span></div>
    <table class="grid"><thead><tr><th>Item</th><th>Description</th><th>Approved</th><th></th></tr></thead><tbody>
    ${ready.map((i) => html`<tr><td><a href="/items/${i.code}">${i.code}</a></td><td>${i.description}</td><td>${fmtDate(i.updatedAt)}</td><td><a href="/items/${i.code}">Open to release</a></td></tr>`)}
    ${ready.length ? '' : html`<tr><td colspan="4" style="color:var(--muted);padding:14px">No approved items waiting for release.</td></tr>`}</tbody></table></div>
    <div class="panel"><div class="ph">Released</div><table class="grid"><thead><tr><th>Item</th><th>Description</th><th>Released</th><th>Shopify status</th></tr></thead><tbody>
    ${done.map((i) => { const p = db.products.find((x) => x.sourceCode === i.code); return html`<tr><td><a href="/items/${i.code}">${i.code}</a></td><td>${i.description}</td><td>${fmtDate(i.updatedAt)}</td><td>${p ? p.status[0].toUpperCase() + p.status.slice(1) : '—'}</td></tr>`; })}
    </tbody></table></div>`));
});

app.get('/module/:name', (req, res) => {
  const name = req.params.name.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  const key = { 'purchase-orders': 'po', pricing: 'pricing', inventory: 'inventory', reports: 'reports' }[req.params.name];
  const name2 = (MODULES.find(([k]) => k === key) || [])[1] || name;
  res.send(page(name2, key, html`<h1>${name2}</h1>
    <div class="panel"><div class="pb" style="color:var(--muted)">${name} is not part of the Item Coordinator role. Contact your Merchandising administrator for access.</div></div>`));
});

module.exports = app;
