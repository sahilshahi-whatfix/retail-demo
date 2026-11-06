// Mail (port 4001): Gmail-styled web mail where supplier spec sheets arrive.
const baseStore = require('../lib/store');

// Each Gmail app shows one mailbox: Seek's (the store's top-level messages) or
// another account in db.mailboxes (Noah's). The route code below reads and
// writes db.messages and db.me; this view points them at the right mailbox.
function boxView(root, key) {
  return new Proxy(root, {
    get(t, p) {
      if (p === '__root') return t;
      if (key !== 'seek' && (p === 'messages' || p === 'me')) return t.mailboxes[key][p];
      return t[p];
    },
    set(t, p, v) {
      if (key !== 'seek' && (p === 'messages' || p === 'me')) t.mailboxes[key][p] = v; else t[p] = v;
      return true;
    },
  });
}
const mailStore = (key) => ({
  read: () => boxView(baseStore.read(), key),
  update: (fn) => baseStore.update((d) => fn(boxView(d, key))),
});

// Every mailbox in the store, so mail sent to one account lands in its inbox.
function allBoxes(root) {
  return [{ me: root.me, messages: root.messages }, ...Object.values(root.mailboxes || {})];
}
const { html, raw, esc, makeApp, fmtTime, fmtDate, fmtDateTime, isToday } = require('../lib/util');
const { locate, kindOf } = require('../lib/files');
const { pickerAssets } = require('../lib/picker');
const { pdfPages, sheetHtml } = require('../lib/docview');
const { toReal, toLocal, realifyText } = require('../lib/realurl');

// Product name shown in the top bar and page titles.
const BRAND = 'Gmail';

const FOLDERS = [
  { key: 'inbox', label: 'Inbox', icon: 'inbox' },
  { key: 'starred', label: 'Starred', icon: 'star' },
  { key: 'snoozed', label: 'Snoozed', icon: 'clock' },
  { key: 'sent', label: 'Sent', icon: 'send' },
  { key: 'drafts', label: 'Drafts', icon: 'draft' },
];
const LABELS = [
  { key: 'suppliers', label: 'Suppliers', color: '#0f766e' },
  { key: 'archive', label: 'Spec sheet archive', color: '#b45309' },
];

const ICONS = {
  inbox: '<path d="M4 13h4l2 3h4l2-3h4M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>',
  star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  draft: '<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',
  label: '<path d="M4 6h11l5 6-5 6H4z"/>',
  reply: '<path d="M10 8L5 12l5 4M5 12h9a5 5 0 0 1 5 5v1"/>',
  replyAll: '<path d="M8 8l-4 4 4 4M12 8l-4 4 4 4M8 12h7a5 5 0 0 1 5 5v1"/>',
  forward: '<path d="M14 8l5 4-5 4M19 12h-9a5 5 0 0 0-5 5v1"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  mail: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>',
  unread: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  tune: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4M4 12h16"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4M12 17h.01"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1z"/>',
  clip: '<path d="M16.5 6.5l-8 8a2.5 2.5 0 0 0 3.5 3.5l8.5-8.5a4.5 4.5 0 0 0-6.4-6.4L5.6 11.6a6.5 6.5 0 0 0 9.2 9.2L20 15.5"/>',
  apps: '<path d="M5 5h.01M12 5h.01M19 5h.01M5 12h.01M12 12h.01M19 12h.01M5 19h.01M12 19h.01M19 19h.01" stroke-width="3.2"/>',
};
// Gmail mark, matching the reference screenshot for the demo.
const LOGO = raw(`<svg width="32" height="24" viewBox="52 42 88 66" aria-hidden="true"><path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"/><path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"/><path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"/><path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92"/><path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"/></svg>`);
const icon = (n, size = 18) => raw(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`);

const STYLE = `
:root{--bg:#f6f8fc;--panel:#fff;--accent:#0b57d0;--accent-soft:#d3e3fd;--compose:#c2e7ff;--compose-h:#b3dcf9;--text:#1f1f1f;--muted:#444746;--line:#e3e7ec;--hover:#f2f6fc;--read:#f2f6fc;--pk-accent:#0b57d0;--pk-radius:12px}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--text);font:14px/1.45 Roboto,"Helvetica Neue",Arial,sans-serif}
a{color:inherit;text-decoration:none}
button{font:inherit}
.top{height:64px;display:flex;align-items:center;gap:8px;padding:8px 16px 8px 8px}
.menu{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--muted);flex:none}
.menu:hover{background:rgba(68,71,70,.08)}
.brand{display:flex;align-items:center;gap:6px;width:190px;font-size:22px;color:#444746;font-weight:400;letter-spacing:-.01em}
.brand .mk{display:flex;align-items:center}
.search{flex:1;max-width:720px;display:flex;align-items:center;gap:14px;background:#e9eef6;border-radius:28px;padding:0 10px 0 16px;height:48px;color:var(--muted);margin-left:56px}
.search input{border:0;background:transparent;flex:1;font:inherit;font-size:16px;outline:none;color:var(--text)}
.search input::placeholder{color:#444746}
.search:focus-within{background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.1),0 1px 3px 1px rgba(60,64,67,.15)}
.search .tune{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.search .tune:hover{background:rgba(68,71,70,.08)}
.acct{margin-left:auto;display:flex;align-items:center;gap:6px}
.acct .ib{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--muted)}
.acct .ib:hover{background:rgba(68,71,70,.08)}
.acct .who{text-align:right;line-height:1.25;margin:0 8px 0 10px}
.acct .who b{display:block;font-size:14px;font-weight:500;color:var(--text)}
.acct .who span{font-size:12.5px;color:var(--muted)}
.avatar{width:36px;height:36px;border-radius:50%;background:#1a6ad6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:500;font-size:14px;flex:none}
.layout{display:flex;height:calc(100vh - 64px);padding:0 16px 16px 0}
.side{width:256px;flex:none;padding:8px 0 0 0}
.compose{display:inline-flex;align-items:center;gap:14px;background:var(--compose);color:#001d35;border-radius:16px;padding:0 24px 0 20px;height:56px;font-weight:500;margin:0 0 16px 8px;transition:box-shadow .15s}
.compose:hover{box-shadow:0 1px 2px rgba(60,64,67,.3),0 1px 3px 1px rgba(60,64,67,.15)}
.nav a{display:flex;align-items:center;gap:18px;padding:0 12px 0 26px;height:32px;border-radius:0 16px 16px 0;color:var(--text);margin-right:16px}
.nav a:hover{background:#e8ebee}
.nav a.on{background:var(--accent-soft);color:#001d35;font-weight:700}
.nav a svg{color:#444746}
.nav a.on svg{color:#001d35}
.nav .cnt{margin-left:auto;font-size:12px;font-weight:700}
.nav h4{margin:16px 0 4px 26px;font-size:16px;font-weight:500;color:var(--text)}
.dot{width:10px;height:10px;border-radius:3px;flex:none;margin:0 4px}
.main{flex:1;display:flex;background:var(--panel);border-radius:16px;overflow:hidden;min-width:0}
.list{width:530px;flex:none;border-right:1px solid var(--line);display:flex;flex-direction:column}
.tools{display:flex;align-items:center;gap:4px;height:56px;padding:0 20px 0 16px;color:var(--muted);border-bottom:1px solid var(--line)}
.tools .ib{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:0;background:none;cursor:pointer;color:inherit}
.tools .ib:hover{background:rgba(68,71,70,.08)}
.tools input[type=checkbox]{width:16px;height:16px;margin:0 10px;accent-color:#0b57d0}
.tools .range{margin-left:auto;font-size:12.5px;color:var(--muted)}
.tools h2{font-size:14px;margin:0 0 0 4px;font-weight:500;color:var(--text)}
.rows{overflow:auto;flex:1}
.row{display:flex;gap:10px;padding:12px 20px 12px 14px;border-bottom:1px solid #eef1f5;cursor:pointer;position:relative;background:var(--read)}
.row:hover{box-shadow:inset 1px 0 0 #dadce0,inset -1px 0 0 #dadce0,0 1px 2px 0 rgba(60,64,67,.3),0 1px 3px 1px rgba(60,64,67,.15);z-index:1}
.row.sel{background:#c2dbff}
.row.unread{background:#fff}
.row.unread .from,.row.unread .subj,.row.unread .when{font-weight:700;color:var(--text)}
.row .cb{margin-top:3px;accent-color:#0b57d0}
.row .st{color:#b5bac0;margin-top:1px}
.row .st.on{color:#f4b400}
.row .bd{flex:1;min-width:0}
.row .l1{display:flex;gap:8px;align-items:baseline}
.row .from{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text);font-size:15px}
.row .when{font-size:13px;color:var(--muted);white-space:nowrap}
.row .subj{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text);font-size:15px;margin-top:2px}
.row .snip{color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;margin-top:2px}
.chips{display:flex;gap:6px;margin-top:8px;flex-wrap:nowrap;overflow:hidden}
.chip{display:inline-flex;align-items:center;gap:8px;border:1px solid #c4c7c5;border-radius:16px;padding:3px 12px 3px 8px;font-size:13px;color:var(--text);white-space:nowrap;max-width:330px;background:#fff}
.chip span.n{overflow:hidden;text-overflow:ellipsis}
.chip .sq{width:16px;height:16px;border-radius:3px;flex:none}
.sq.pdf{background:#d93025}.sq.sheet{background:#188038}.sq.image{background:#d93025}.sq.file{background:#5f6368}
.chip .more{color:var(--muted)}
.ft{font-size:9.5px;font-weight:700;color:#fff;border-radius:3px;padding:2px 4px;letter-spacing:.02em}
.ft.pdf{background:#d93025}.ft.sheet{background:#188038}.ft.image{background:#d93025}.ft.file{background:#5f6368}
.empty-list{padding:40px;text-align:center;color:var(--muted)}
.read{flex:1;overflow:auto;min-width:0}
.placeholder{padding-top:150px;text-align:center;color:var(--muted);font-size:15px}
.msg{padding:20px 32px 40px}
.msg h1{font-size:22px;font-weight:400;margin:0 0 20px;line-height:1.3;padding-left:52px}
.hdr{display:flex;gap:12px;align-items:flex-start}
.hdr .avatar{width:40px;height:40px}
.hdr .who{flex:1}
.hdr .who b{font-weight:700;font-size:14px}
.hdr .who .em{color:#5e5e5e;font-size:12.5px}
.hdr .to{color:#5e5e5e;font-size:12.5px}
.hdr .time{color:#5e5e5e;font-size:12.5px;white-space:nowrap}
.acts{display:flex;gap:10px;margin:22px 0 0 52px}
.btn{display:inline-flex;align-items:center;gap:8px;border:1px solid #747775;background:#fff;border-radius:18px;padding:8px 20px;cursor:pointer;color:var(--text);font-weight:500}
.btn:hover{background:#f2f2f2}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.btn.primary:hover{background:#0842a0;box-shadow:0 1px 2px rgba(60,64,67,.3)}
.body{white-space:pre-wrap;margin:22px 0 0 52px;font-size:14px;line-height:1.6;max-width:760px}
.atts{margin:28px 0 0 52px;border-top:1px solid var(--line);padding-top:18px}
.atts h3{font-size:14px;color:var(--text);font-weight:500;margin:0 0 12px}
.agrid{display:flex;flex-wrap:wrap;gap:12px}
.att{width:180px;border:1px solid #dadce0;border-radius:8px;overflow:hidden;background:#fff;display:block}
.att:hover{box-shadow:0 1px 2px rgba(60,64,67,.3),0 1px 3px 1px rgba(60,64,67,.15)}
.att .pv{height:112px;background:#f1f3f4;display:flex;align-items:center;justify-content:center;overflow:hidden}
.att .pv img{width:100%;height:100%;object-fit:cover}
.att .pv .ft{font-size:15px;padding:6px 10px}
.att .nm{display:flex;gap:8px;align-items:center;padding:8px 10px;font-size:12.5px}
.att .nm span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cform{padding:20px 28px}
.cform h1{font-size:18px;margin:0 0 14px;font-weight:400}
.fld{display:flex;align-items:center;border-bottom:1px solid var(--line);min-height:44px}
.fld label{width:70px;color:var(--muted)}
.fld input{flex:1;border:0;outline:none;font:inherit;padding:10px 0}
.cform textarea{width:100%;min-height:300px;border:0;outline:none;font:inherit;font-size:14px;line-height:1.6;padding:14px 0;resize:vertical}
.cbar{display:flex;gap:10px;align-items:center;padding-top:12px;border-top:1px solid var(--line)}
.quote{color:var(--muted);border-left:3px solid var(--line);padding-left:12px;white-space:pre-wrap;font-size:13px;margin-top:8px}
.toast{position:fixed;left:24px;bottom:24px;background:#303030;color:#f2f2f2;padding:14px 24px;border-radius:4px;box-shadow:0 3px 5px rgba(0,0,0,.2);font-size:14px}
.err{color:#b3261e;font-size:13px;margin:8px 0}
.viewer{flex:1;display:flex;flex-direction:column;background:var(--panel);border-radius:16px;overflow:hidden;min-width:0}
.vbar{display:flex;align-items:center;gap:12px;height:56px;padding:0 16px;border-bottom:1px solid var(--line)}
.vbar .title{font-weight:500;display:flex;align-items:center;gap:10px}
.vbar .meta{color:var(--muted);font-size:13px}
.vbar .sp{flex:1}
.vbody{flex:1;overflow:auto;background:#e8eaed;padding:24px}
.pdfpage{display:block;margin:0 auto 20px;max-width:900px;width:100%;background:#fff;box-shadow:0 1px 3px rgba(60,64,67,.3)}
.pgl{text-align:center;color:var(--muted);font-size:12px;margin:-12px 0 20px}
.imgv{display:flex;justify-content:center}
.imgv img{max-width:100%;background:#fff;box-shadow:0 1px 3px rgba(60,64,67,.3)}
.sheetwrap{background:#fff;box-shadow:0 1px 3px rgba(60,64,67,.3);overflow:auto;max-height:calc(100vh - 200px)}
table.xl{border-collapse:collapse;font:13px Calibri,Carlito,Arial,sans-serif;table-layout:fixed}
table.xl th{background:#f3f4f6;color:#555;font-weight:400;border:1px solid #d4d4d8;height:22px;font-size:12px;position:sticky;top:0}
table.xl th.rn{width:42px;position:sticky;left:0;z-index:1}
table.xl td{border:1px solid #e4e4e7;height:22px;padding:1px 5px;white-space:nowrap;overflow:hidden}
table.xl td.rn{background:#f3f4f6;color:#555;text-align:center;font-size:12px;border-color:#d4d4d8}
.tabs{display:flex;gap:2px;padding:0 10px;background:#f3f4f6;border-top:1px solid #d4d4d8}
.tabs a{padding:7px 16px;font-size:13px;color:#444;border-bottom:3px solid transparent}
.tabs a.on{background:#fff;color:#188038;font-weight:600;border-bottom-color:#188038}
`;

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<style>${STYLE}</style></head><body>${body}</body></html>`;
}

function topBar(db, q = '') {
  return html`<header class="top">
    <span class="menu" aria-hidden="true">${icon('menu', 22)}</span>
    <a class="brand" href="/mail/inbox"><span class="mk">${LOGO}</span>${BRAND}</a>
    <form class="search" action="/mail/search" method="get" role="search">${icon('search', 22)}
      <input name="q" value="${q}" placeholder="Search mail" aria-label="Search mail"><span class="tune" title="Show search options">${icon('tune', 20)}</span></form>
    <div class="acct"><span class="ib" title="Support">${icon('help', 22)}</span><span class="ib" title="Settings">${icon('settings', 22)}</span><span class="ib" title="Apps">${icon('apps', 22)}</span>
      <div class="who"><b>${db.me.name}</b><span>${db.me.email}</span></div><div class="avatar">${db.me.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div></div>
  </header>`;
}

const domainOf = (e) => (e || '').split('@')[1] || '';
const isSupplier = (m) => m.folder !== 'sent' && m.folder !== 'drafts' && domainOf(m.from.email) !== 'aldervalehome.com';

function inFolder(db, folder, q) {
  let list;
  if (folder === 'search') {
    const t = (q || '').toLowerCase();
    list = db.messages.filter((m) => [m.subject, m.body, m.from.name, m.from.email, ...(m.to || []).map((x) => x.email + ' ' + x.name), ...(m.attachments || [])].join(' ').toLowerCase().includes(t));
  } else if (folder === 'starred') list = db.messages.filter((m) => m.starred);
  else if (folder === 'suppliers') list = db.messages.filter(isSupplier);
  else list = db.messages.filter((m) => m.folder === folder);
  return list.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

function sidebar(db, folder) {
  const unread = db.messages.filter((m) => m.folder === 'inbox' && !m.read).length;
  const drafts = db.messages.filter((m) => m.folder === 'drafts').length;
  return html`<aside class="side">
    <a class="compose" href="/compose?f=${folder}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>Compose</a>
    <nav class="nav">
      ${FOLDERS.map((f) => html`<a href="/mail/${f.key}" class="${folder === f.key ? 'on' : ''}">${icon(f.icon)}${f.label}
        ${f.key === 'inbox' && unread ? html`<span class="cnt">${unread}</span>` : ''}${f.key === 'drafts' && drafts ? html`<span class="cnt">${drafts}</span>` : ''}</a>`)}
      <h4>Labels</h4>
      ${LABELS.map((l) => html`<a href="/mail/${l.key}" class="${folder === l.key ? 'on' : ''}"><span class="dot" style="background:${l.color}"></span>${l.label}</a>`)}
    </nav>
  </aside>`;
}

function whenLabel(iso) {
  if (isToday(iso)) return fmtTime(iso);
  const d = new Date(iso);
  if (d.getFullYear() !== new Date().getFullYear()) return fmtDate(iso, { month: 'short', day: 'numeric', year: 'numeric' });
  return fmtDate(iso);
}

function chipsFor(atts) {
  if (!atts || !atts.length) return '';
  const a = atts[0];
  return html`<div class="chips"><span class="chip"><span class="sq ${kindOf(a)}" title="${badge(a)}"></span><span class="n">${a}</span>${atts.length > 1 ? html`<span class="more">+${atts.length - 1}</span>` : ''}</span></div>`;
}
function badge(a) {
  const k = kindOf(a);
  return k === 'pdf' ? 'PDF' : k === 'sheet' ? 'XLS' : k === 'image' ? 'IMG' : 'FILE';
}

// Message text with web addresses made clickable (opened in a new tab).
// Links show the real-looking address and open the matching demo app.
const linkify = (s) => raw(esc(s).replace(/https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g, (u) => {
  const href = toLocal(u.replace(/&amp;/g, '&'));
  return `<a href="${esc(href)}" target="_blank" rel="noopener" style="color:#0b57d0;text-decoration:underline">${toReal(u)}</a>`;
}));
const firstLine = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 120);
const nameList = (arr) => (arr || []).map((x) => x.name || x.email).join(', ');

function listPane(db, folder, msgs, selId, q) {
  const label = folder === 'search' ? `Results for “${q}”` : ([...FOLDERS, ...LABELS].find((f) => f.key === folder) || {}).label;
  const n = msgs.length;
  return html`<section class="list" aria-label="Message list">
    <div class="tools">
      <input type="checkbox" aria-label="Select all" onclick="document.querySelectorAll('.row .cb').forEach(c=>c.checked=this.checked)">
      <a class="ib" href="${folder === 'search' ? `/mail/search?q=${encodeURIComponent(q)}` : `/mail/${folder}`}" title="Refresh" aria-label="Refresh">${icon('refresh')}</a>
      <h2>${label}</h2>
      <span class="range">${n ? `1–${n} of ${n}` : '0 of 0'}</span>
    </div>
    <div class="rows">
      ${n ? msgs.map((m) => {
        const href = `/mail/${folder}?id=${m.id}${q ? '&q=' + encodeURIComponent(q) : ''}`;
        const who = m.folder === 'sent' || m.folder === 'drafts' ? 'To: ' + nameList(m.to) : (m.from.org && isSupplier(m) ? `${m.from.name}, ${m.from.org}` : m.from.name);
        return html`<div class="row ${m.read ? '' : 'unread'} ${m.id === selId ? 'sel' : ''}" onclick="location.href='${href}'" data-id="${m.id}">
          <input type="checkbox" class="cb" aria-label="Select message" onclick="event.stopPropagation()">
          <form method="post" action="/msg/${m.id}/star" onclick="event.stopPropagation()" style="margin:0"><input type="hidden" name="back" value="${href}"><button class="st ${m.starred ? 'on' : ''}" style="border:0;background:none;padding:0;cursor:pointer" title="${m.starred ? 'Starred' : 'Not starred'}" aria-label="Star">${raw(`<svg width="18" height="18" viewBox="0 0 24 24" fill="${m.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">${ICONS.star}</svg>`)}</button></form>
          <div class="bd">
            <div class="l1"><span class="from">${m.folder === 'drafts' ? raw('<span style="color:#b91c1c">Draft</span> ') : ''}${who}</span><span class="when">${whenLabel(m.date)}</span></div>
            <div class="subj"><a href="${href}">${m.subject || '(no subject)'}</a></div>
            <div class="snip">${firstLine(m.body)}</div>
            ${chipsFor(m.attachments)}
          </div></div>`;
      }) : html`<div class="empty-list">No messages here.</div>`}
    </div></section>`;
}

function readingPane(db, m, folder) {
  if (!m) {
    return html`<section class="read"><div class="placeholder">Select a message to read</div></section>`;
  }
  const initials = (m.from.name || m.from.email).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return html`<section class="read" aria-label="Reading pane"><article class="msg">
    <h1>${m.subject || '(no subject)'}</h1>
    <div class="hdr"><div class="avatar" style="background:${m.from.email === db.me.email ? '#0f766e' : '#4f46e5'}">${initials}</div>
      <div class="who"><b>${m.from.name}</b> <span class="em">&lt;${m.from.email}&gt;</span>${m.from.org ? html`<div class="em">${m.from.org}</div>` : ''}
        <div class="to">to ${m.to.map((t) => (t.email === db.me.email ? 'me' : `${t.name ? t.name + ' ' : ''}<${t.email}>`)).join(', ')}${m.cc && m.cc.length ? ', cc ' + m.cc.map((t) => t.email).join(', ') : ''}</div></div>
      <div class="time">${fmtDateTime(m.date)}</div></div>
    <div class="body">${linkify(m.body)}</div>
    ${m.attachments && m.attachments.length ? html`<div class="atts"><h3>${m.attachments.length} attachment${m.attachments.length > 1 ? 's' : ''}</h3><div class="agrid">
      ${m.attachments.map((a, i) => html`<a class="att" href="/view/${m.id}/${i}?f=${folder}" title="Open ${a}">
        <div class="pv">${kindOf(a) === 'image' ? html`<img src="/files/${encodeURIComponent(a)}" alt="${a}">` : html`<span class="ft ${kindOf(a)}">${badge(a)}</span>`}</div>
        <div class="nm"><span class="ft ${kindOf(a)}">${badge(a)}</span><span>${a}</span></div></a>`)}
    </div></div>` : ''}
    ${m.folder === 'drafts' ? html`<div class="acts"><a class="btn primary" href="/compose?draft=${m.id}&f=${folder}">Edit draft</a></div>` : html`<div class="acts">
      <a class="btn" href="/compose?reply=${m.id}&mode=reply&f=${folder}">${icon('reply')}Reply</a>
      <a class="btn" href="/compose?reply=${m.id}&mode=all&f=${folder}">${icon('replyAll')}Reply all</a>
      <a class="btn" href="/compose?reply=${m.id}&mode=fwd&f=${folder}">${icon('forward')}Forward</a>
      <form method="post" action="/msg/${m.id}/unread" style="margin:0"><input type="hidden" name="f" value="${folder}"><button class="btn">${icon('unread')}Mark as unread</button></form>
    </div>`}
  </article></section>`;
}

function createMail(key) {
const store = mailStore(key);
const app = makeApp('Gmail');

app.get('/', (req, res) => res.redirect('/mail/inbox'));

app.get('/mail/:folder', (req, res) => {
  const folder = req.params.folder;
  const q = req.query.q || '';
  const db = store.read();
  const sel = req.query.id && db.messages.find((m) => m.id === req.query.id);
  // Shown as read here; the page script saves it, so link prefetchers and
  // scanners that load the URL don't mark mail read.
  const markRead = sel && !sel.read;
  if (markRead) sel.read = true;
  const msgs = inFolder(db, folder, q);
  const unread = db.messages.filter((m) => m.folder === 'inbox' && !m.read).length;
  const title = sel ? `${sel.subject} - ${BRAND}` : `${folder === 'inbox' ? `Inbox (${unread})` : folder} - ${BRAND}`;
  res.send(page(title, html`${topBar(db, q)}<div class="layout">${sidebar(db, folder)}
    <main class="main">${listPane(db, folder, msgs, sel && sel.id, q)}${readingPane(db, sel, folder)}</main></div>
    ${req.query.sent ? html`<div class="toast" role="status">Message sent</div>` : ''}${req.query.saved ? html`<div class="toast" role="status">Draft saved</div>` : ''}
    ${markRead ? raw(`<script>fetch('/msg/${encodeURIComponent(sel.id)}/read', { method: 'POST' });</script>`) : ''}`));
});

app.post('/msg/:id/read', (req, res) => {
  store.update((d) => { const m = d.messages.find((x) => x.id === req.params.id); if (m) m.read = true; });
  res.sendStatus(204);
});

app.post('/msg/:id/star', (req, res) => {
  store.update((d) => { const m = d.messages.find((x) => x.id === req.params.id); if (m) m.starred = !m.starred; });
  res.redirect(req.body.back || '/mail/inbox');
});
app.post('/msg/:id/unread', (req, res) => {
  store.update((d) => { const m = d.messages.find((x) => x.id === req.params.id); if (m) m.read = false; });
  res.redirect('/mail/' + (req.body.f || 'inbox'));
});

// ---------- Compose / reply ----------
function parseAddresses(s) {
  return String(s || '').split(/[,;]+/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = p.match(/^(.*)<([^>]+)>$/);
    if (m) return { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() };
    return { name: '', email: p };
  });
}
const fmtAddr = (a) => (a.name ? `${a.name} <${a.email}>` : a.email);
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

app.get('/compose', (req, res) => {
  const db = store.read();
  const folder = req.query.f || 'inbox';
  let to = '', cc = '', subject = '', body = '', quote = null, title = 'New message', replyId = '', draftId = '', atts = [], fwd = false;
  if (req.query.reply) {
    const m = db.messages.find((x) => x.id === req.query.reply);
    if (m) {
      replyId = m.id;
      const mode = req.query.mode || 'reply';
      const base = m.subject.replace(/^(re|fwd):\s*/i, '');
      if (mode === 'fwd') {
        // As in Gmail: the original message goes into the body under a
        // "Forwarded message" header, and its attachments come along.
        subject = 'Fwd: ' + base; title = 'Forward'; fwd = true;
        const d = new Date(m.date);
        const when = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + fmtTime(m.date);
        // (Browsers drop the first line break inside a textarea, hence three.)
        body = `\n\n\n---------- Forwarded message ---------\nFrom: ${m.from.name} <${m.from.email}>\nDate: ${when}\nSubject: ${m.subject}\nTo: ${m.to.map(fmtAddr).join(', ')}\n\n${m.body}`;
        atts = (m.attachments || []).slice();
      } else {
        const sender = m.folder === 'sent' ? m.to[0] : m.from;
        to = fmtAddr(sender);
        if (mode === 'all') {
          cc = [...m.to, ...(m.cc || [])].filter((a) => a.email !== db.me.email && a.email !== sender.email).map(fmtAddr).join(', ');
          title = 'Reply all';
        } else title = 'Reply';
        subject = 'Re: ' + base;
      }
      if (!fwd) quote = { who: `On ${fmtDateTime(m.date)}, ${m.from.name} <${m.from.email}> wrote:`, body: m.body };
    }
  }
  if (req.query.draft) {
    const d = db.messages.find((x) => x.id === req.query.draft);
    if (d) { draftId = d.id; to = d.to.map(fmtAddr).join(', '); cc = (d.cc || []).map(fmtAddr).join(', '); subject = d.subject; body = d.body; title = 'Draft'; replyId = d.inReplyTo || ''; atts = d.attachments || []; }
  }
  if (req.query.to) to = req.query.to;
  if (req.query.err) {
    // Coming back from a send that failed: keep everything that was typed.
    if (req.query.cc !== undefined) cc = req.query.cc;
    if (req.query.subject !== undefined) subject = req.query.subject;
    if (req.query.body !== undefined) body = req.query.body;
    if (req.query.atts !== undefined) atts = String(req.query.atts).split('|').filter(Boolean);
    if (req.query.draftId) draftId = req.query.draftId;
  }
  const selMsg = replyId && db.messages.find((x) => x.id === replyId);
  const err = req.query.err;
  res.send(page(`${title} - ${BRAND}`, html`${topBar(db)}<div class="layout">${sidebar(db, folder)}
    <main class="main">${listPane(db, folder, inFolder(db, folder), selMsg && selMsg.id)}
    <section class="read"><form class="cform" method="post" action="/send" aria-label="${title}">
      <h1>${title}${selMsg ? html`<span style="color:var(--muted);font-weight:400;font-size:14px"> · ${selMsg.subject}</span>` : ''}</h1>
      ${err ? html`<div class="err" role="alert">${err}</div>` : ''}
      <input type="hidden" name="inReplyTo" value="${replyId}"><input type="hidden" name="draftId" value="${draftId}"><input type="hidden" name="f" value="${folder}"><input type="hidden" name="mode" value="${fwd ? 'fwd' : ''}">
      <div class="fld"><label for="to">To</label><input id="to" name="to" value="${to}" placeholder="Recipients" autocomplete="off"></div>
      <div class="fld"><label for="cc">Cc</label><input id="cc" name="cc" value="${cc}" autocomplete="off"></div>
      <div class="fld"><label for="subject">Subject</label><input id="subject" name="subject" value="${subject}"></div>
      <textarea name="body" aria-label="Message body" placeholder="Write your message"${fwd ? raw(' style="min-height:420px"') : ''}>${body}</textarea>
      <input type="hidden" name="attachments" id="atts" value="${atts.join('|')}">
      <div class="chips" id="attchips" style="flex-wrap:wrap;margin:0 0 12px" aria-label="Attachments"></div>
      ${quote ? html`<details><summary style="color:var(--muted);cursor:pointer;font-size:13px">Show quoted text</summary><div class="quote">${quote.who}\n\n${quote.body}</div></details>` : ''}
      <div class="cbar"><button class="btn primary" name="action" value="send">${icon('send')}Send</button>
        <button type="button" class="btn" id="attachbtn" onclick="openPicker({ multiple: true, title: 'Attach files' }, addAtts)" title="Attach files">${icon('clip')}Attach files</button>
        <button class="btn" name="action" value="draft">Save draft</button>
        <a class="btn" href="${selMsg ? `/mail/${folder}?id=${selMsg.id}` : `/mail/${folder}`}">Discard</a></div>
    </form></section></main></div>
    ${raw(pickerAssets())}
    ${raw(`<script>
    const attsIn = document.getElementById('atts'), chipsEl = document.getElementById('attchips');
    const kindOf = (n) => /\.pdf$/i.test(n) ? 'pdf' : /\.xlsx?$/i.test(n) ? 'sheet' : /\.(jpe?g|png|gif|webp)$/i.test(n) ? 'image' : 'file';
    const escH = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    function list() { return attsIn.value.split('|').filter(Boolean); }
    function drawAtts() {
      chipsEl.innerHTML = list().map((a, i) => '<span class="chip"><span class="sq ' + kindOf(a) + '"></span><span class="n">' + escH(a) + '</span>' +
        '<button type="button" onclick="removeAtt(' + i + ')" aria-label="Remove ' + escH(a) + '" title="Remove" style="border:0;background:none;cursor:pointer;font-size:16px;line-height:1;color:#444746;padding:0 0 0 4px">&times;</button></span>').join('');
    }
    function addAtts(files) { const cur = list(); files.forEach((f) => { if (!cur.includes(f)) cur.push(f); }); attsIn.value = cur.join('|'); drawAtts(); }
    function removeAtt(i) { const cur = list(); cur.splice(i, 1); attsIn.value = cur.join('|'); drawAtts(); }
    drawAtts();
    ${fwd ? `// Like Gmail, a forward starts with the cursor above the forwarded message.
    const bodyEl = document.querySelector('textarea[name=body]');
    let placed = false;
    const toTop = () => { if (placed) return; placed = true; bodyEl.setSelectionRange(0, 0); bodyEl.scrollTop = 0; };
    bodyEl.addEventListener('click', toTop);
    bodyEl.addEventListener('keyup', (e) => { if (e.key === 'Tab') toTop(); });` : ''}
    </script>`)}`));
});

app.post('/send', (req, res) => {
  const { to, cc, subject, body, inReplyTo, draftId, action, f } = req.body;
  const formAtts = req.body.attachments !== undefined ? String(req.body.attachments).split('|').filter(Boolean) : null;
  const toList = parseAddresses(to);
  const ccList = parseAddresses(cc);
  const back = (msg) => {
    const qs = new URLSearchParams({ err: msg, to: to || '', cc: cc || '', subject: subject || '', body: body || '', atts: (formAtts || []).join('|'), draftId: draftId || '', f: f || 'inbox' });
    if (inReplyTo) { qs.set('reply', inReplyTo); qs.set('mode', req.body.mode === 'fwd' ? 'fwd' : 'reply'); }
    return res.redirect('/compose?' + qs.toString());
  };
  if (action !== 'draft') {
    if (!toList.length) return back('Add at least one recipient.');
    const bad = [...toList, ...ccList].find((a) => !validEmail(a.email));
    if (bad) return back(`“${bad.email}” is not a valid email address.`);
  }
  let quoted = '';
  const db = store.read();
  const orig = inReplyTo && db.messages.find((m) => m.id === inReplyTo);
  if (orig && action !== 'draft' && req.body.mode !== 'fwd') {
    quoted = `\n\nOn ${fmtDateTime(orig.date)}, ${orig.from.name} <${orig.from.email}> wrote:\n` + orig.body.split('\n').map((l) => '> ' + l).join('\n');
  }
  store.update((d) => {
    const draft = draftId && d.messages.find((m) => m.id === draftId);
    const atts = formAtts !== null ? formAtts : draft ? draft.attachments || [] : [];
    if (draftId) d.messages = d.messages.filter((m) => m.id !== draftId);
    const known = (a) => {
      const all = d.messages.flatMap((m) => [m.from, ...(m.to || [])]);
      const k = all.find((x) => x.email.toLowerCase() === a.email.toLowerCase() && x.name);
      return k ? { name: k.name, email: a.email } : a;
    };
    d.messages.push({
      id: 'm-' + Date.now().toString(36), folder: action === 'draft' ? 'drafts' : 'sent', read: true, starred: false,
      date: new Date().toISOString(), from: d.me, to: toList.map(known), cc: ccList.map(known),
      subject: subject || '', body: realifyText(body || '') + quoted, attachments: atts, inReplyTo: inReplyTo || undefined,
    });
    if (action === 'draft') return;
    // Deliver to any recipient who has a mailbox in this demo (Seek or Noah).
    const sent = d.messages[d.messages.length - 1];
    const rcpt = [...sent.to, ...sent.cc].map((a) => a.email.toLowerCase());
    for (const b of allBoxes(d.__root)) {
      if (!rcpt.includes(b.me.email.toLowerCase())) continue;
      b.messages.push({ ...sent, id: 'm-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), folder: 'inbox', read: false, inReplyTo: undefined });
    }
  });
  if (action === 'draft') return res.redirect('/mail/drafts?saved=1');
  res.redirect(`/mail/${f && f !== 'drafts' ? f : 'sent'}?sent=1${inReplyTo && f !== 'drafts' ? '&id=' + inReplyTo : ''}`);
});

// ---------- Attachment viewer ----------
app.get('/view/:id/:idx', async (req, res, next) => {
  try {
    const db = store.read();
    const m = db.messages.find((x) => x.id === req.params.id);
    const name = m && m.attachments[Number(req.params.idx)];
    if (!name) return res.status(404).send('Attachment not found');
    const folder = req.query.f || 'inbox';
    const file = locate(name);
    const kind = kindOf(name);
    let content = '', meta = '';
    if (kind === 'pdf') {
      const pages = pdfPages(name);
      meta = pages.length ? `${pages.length} page${pages.length > 1 ? 's' : ''}` : 'PDF';
      content = pages.length
        ? pages.map((p, i) => `<img class="pdfpage" src="/spec-pages/${encodeURIComponent(p)}" alt="${esc(name)} page ${i + 1}"><div class="pgl">Page ${i + 1} of ${pages.length}</div>`).join('')
        : `<iframe src="/files/${encodeURIComponent(name)}" style="width:100%;height:100%;border:0;background:#fff" title="${esc(name)}"></iframe>`;
    } else if (kind === 'sheet') {
      const s = await sheetHtml(file, Number(req.query.sheet || 0), `/view/${m.id}/${req.params.idx}?f=${folder}`);
      meta = `Sheet: ${s.sheetName} · ${s.count} sheets`;
      content = `<div class="sheetwrap">${s.table}</div><div class="tabs" role="tablist">${s.tabs}</div>`;
    } else if (kind === 'image') {
      const { imageInfo } = require('../lib/files');
      const info = imageInfo(name);
      meta = info && info.w ? `${info.w} × ${info.h} px` : '';
      content = `<div class="imgv"><img src="/files/${encodeURIComponent(name)}" alt="${esc(name)}"></div>`;
    } else {
      content = '<p>Preview not available.</p>';
    }
    res.send(page(`${name} - ${BRAND}`, html`${topBar(db)}<div class="layout">${sidebar(db, folder)}
      <main class="viewer"><div class="vbar">
        <a class="btn" href="/mail/${folder}?id=${m.id}">${icon('back')}Back to message</a>
        <span class="title"><span class="ft ${kind}">${badge(name)}</span>${name}</span><span class="meta">${meta}</span>
        <span class="sp"></span>
        ${m.attachments.length > 1 ? html`<span class="meta">Attachment ${Number(req.params.idx) + 1} of ${m.attachments.length}</span>
          ${Number(req.params.idx) > 0 ? html`<a class="btn" href="/view/${m.id}/${Number(req.params.idx) - 1}?f=${folder}">Previous</a>` : ''}
          ${Number(req.params.idx) < m.attachments.length - 1 ? html`<a class="btn" href="/view/${m.id}/${Number(req.params.idx) + 1}?f=${folder}">Next</a>` : ''}` : ''}
        <a class="btn" href="/files/${encodeURIComponent(name)}?download=1">${icon('download')}Download</a>
      </div><div class="vbody">${raw(content)}</div></main></div>`));
  } catch (e) { next(e); }
});

return app;
}

const seekMail = createMail('seek');
seekMail.createMail = createMail;
module.exports = seekMail;
