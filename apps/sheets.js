// Google Sheets (port 4006): two spreadsheets. "Seek audit log" is where Seek
// records every action; "Catalog audit" is Noah's audit list for Story 2.
// Cells are typed in on screen like a real sheet. Web addresses are stored and
// shown in their real-looking form; clicking one opens the local demo app.
const store = require('../lib/store');
const { html, raw, esc, makeApp } = require('../lib/util');
const { SHEET_IDS, toReal, CLIENT_JS } = require('../lib/realurl');

const app = makeApp('Google Sheets');
const NC = 12; // columns A to L
const MAX_R = 1000;
// key: where the sheet lives in the store. start: which cell is selected when it opens.
const DOCS = {
  [SHEET_IDS.log]: { key: 'sheet', start: 'empty', widths: [150, 120, 130, 165, 190, 270, 175, 300, 380, 100, 100, 100] },
  [SHEET_IDS.list]: { key: 'auditSheet', start: 'top', widths: [135, 170, 165, 250, 300, 250, 330, 300, 270, 120, 120, 380] },
};

const LOGO = raw(`<svg width="26" height="36" viewBox="0 0 26 36" aria-hidden="true"><path d="M17 0H3C1.3 0 0 1.3 0 3v30c0 1.7 1.3 3 3 3h20c1.7 0 3-1.3 3-3V9z" fill="#0f9d58"/><path d="M17 0v6c0 1.7 1.3 3 3 3h6z" fill="#87ceac"/><path d="M6 15h14v12H6zm2 2v2.5h4V17zm6 0v2.5h4V17zm-6 4.5V25h4v-3.5zm6 0V25h4v-3.5z" fill="#fff"/></svg>`);
const ic = (d, s = 18) => raw(`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`);
const I = {
  star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  folder: '<path d="M4 6h6l2 2h8v10H4z"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/><path d="M9.5 13.5l2 2 3.5-3.5"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5M12 8v4l3 2"/>',
  comment: '<path d="M5 5h14v10H9l-4 4z"/>',
  video: '<path d="M4 7h11v10H4zM15 10l5-3v10l-5-3"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="1.5"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  undo: '<path d="M9 7L5 11l4 4M5 11h9a5 5 0 0 1 0 10h-2"/>',
  redo: '<path d="M15 7l4 4-4 4M19 11h-9a5 5 0 0 0 0 10h2"/>',
  print: '<path d="M7 9V4h10v5M7 17H5v-7h14v7h-2M7 14h10v6H7z"/>',
  paint: '<path d="M5 4h12v5H5zM17 6.5h2v5h-8v3M10 14.5h2V20h-2z"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  italic: '<path d="M11 5h6M7 19h6M14 5l-4 14"/>',
  strike: '<path d="M5 12h14M16 7a4 3 0 0 0-8 0c0 3 8 2 8 6a4 3 0 0 1-8 0"/>',
  color: '<path d="M8 16l4-11 4 11M9.5 12h5"/><path d="M5 20h14" stroke-width="3"/>',
  fill: '<path d="M6 11l6-6 6 6-6 6z"/><path d="M4 20h16" stroke-width="3"/>',
  borders: '<rect x="4" y="4" width="16" height="16"/><path d="M12 4v16M4 12h16"/>',
  merge: '<path d="M4 6v12M20 6v12M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3"/>',
  align: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  fx: '',
};
const colLetter = (n) => String.fromCharCode(65 + n);
const isUrl = (v) => /^https?:\/\/\S+$/.test(String(v || '').trim());

const STYLE = `
:root{--line:#e1e1e1;--hdr:#f8f9fa;--hdr-line:#c0c0c0;--sel:#1a73e8;--sel-soft:#d3e3fd;--text:#1f1f1f;--muted:#444746}
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden}
body{background:#f9fbfd;color:var(--text);font:14px "Google Sans",Roboto,Arial,sans-serif;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:10px;padding:8px 16px 0 14px;height:64px}
.top .lg{display:flex;padding:0 4px}
.top .tt{display:flex;flex-direction:column;min-width:0;flex:1;overflow:hidden}
.top .nm,.top .menu{white-space:nowrap}
.top .nm{display:flex;align-items:center;gap:6px;font-size:18px;color:#1f1f1f}
.top .nm .ib{color:#444746;display:flex;padding:2px;border-radius:50%}
.top .menu{display:flex;gap:2px;font-size:14px;margin-left:-6px}
.top .menu span{padding:2px 7px;border-radius:4px;color:#1f1f1f;cursor:default}
.top .menu span:hover{background:#e8eaed}
.top .menu .saved{color:#5f6368;font-size:12.5px;margin-left:10px;padding-top:4px}
.top .r{margin-left:auto;flex:none;display:flex;align-items:center;gap:6px;color:#444746}
.top .r .ib{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.top .r .ib:hover{background:#e8eaed}
.share{display:flex;align-items:center;gap:8px;background:#c2e7ff;color:#001d35;border-radius:20px;height:40px;padding:0 18px 0 16px;font-weight:500;margin:0 6px}
.av{width:32px;height:32px;border-radius:50%;background:#0b57d0;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:500;margin-left:4px}
.tbar{margin:8px 16px 0;background:#edf2fa;border-radius:24px;height:40px;display:flex;align-items:center;gap:2px;padding:0 10px;color:#444746;font-size:14px;white-space:nowrap;overflow:hidden}
.tbar .b{min-width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;padding:0 4px}
.tbar .b:hover{background:#dfe4ec}
.tbar .sep{width:1px;height:20px;background:#c7c7c7;margin:0 6px}
.tbar .dd{padding:0 6px}
.fbar{display:flex;align-items:center;height:30px;margin-top:8px;border-top:1px solid #e0e0e0;border-bottom:1px solid #e0e0e0;background:#fff}
.fbar .nb{width:90px;padding:0 10px;font-size:13px;border-right:1px solid #e0e0e0;height:100%;display:flex;align-items:center}
.fbar .fx{width:40px;text-align:center;color:#888;font-style:italic;font-family:serif;font-size:15px;border-right:1px solid #e0e0e0;height:100%;display:flex;align-items:center;justify-content:center}
.fbar input{flex:1;border:0;outline:0;font:13px Arial,sans-serif;padding:0 10px;height:100%}
.gridwrap{flex:1;overflow:auto;position:relative;background:#fff}
table.g{border-collapse:separate;border-spacing:0;table-layout:fixed;font:13px Arial,sans-serif}
table.g th{background:var(--hdr);color:#575757;font-weight:400;font-size:11px;height:22px;border-right:1px solid var(--hdr-line);border-bottom:1px solid var(--hdr-line);position:sticky;top:0;z-index:3;user-select:none}
table.g th.on{background:var(--sel-soft);color:#0b57d0;font-weight:700}
table.g th.corner{left:0;z-index:4;width:46px}
table.g td{height:21px;padding:0 3px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);white-space:nowrap;overflow:hidden;vertical-align:bottom;cursor:cell;line-height:20px}
table.g td.rn{position:sticky;left:0;z-index:2;background:var(--hdr);color:#575757;font-size:11px;text-align:center;border-right:1px solid var(--hdr-line);border-bottom:1px solid var(--hdr-line);cursor:default;user-select:none}
table.g td.rn.on{background:var(--sel-soft);color:#0b57d0;font-weight:700}
table.g td.sp{overflow:visible;position:relative;z-index:1}
table.g tr.r0 td:not(.rn){font-weight:700;background:#f3f3f3}
table.g tr.r0 td.rn{border-bottom:3px solid #bdc1c6}
table.g td.lnk{color:#1155cc;text-decoration:underline}
.selbox{position:absolute;border:2px solid var(--sel);pointer-events:none;z-index:5;box-shadow:0 0 0 1px rgba(255,255,255,.6)}
.selbox::after{content:"";position:absolute;right:-4px;bottom:-4px;width:6px;height:6px;background:var(--sel);border:1px solid #fff}
#ed{position:absolute;z-index:6;border:0;outline:0;resize:none;overflow:hidden;font:13px Arial,sans-serif;padding:0 3px;line-height:20px;background:transparent;color:transparent;caret-color:transparent;white-space:pre}
#ed.on{background:#fff;color:#1f1f1f;caret-color:#1f1f1f;box-shadow:0 0 0 2px var(--sel),0 2px 6px rgba(60,64,67,.3);min-width:60px}
.chip{position:absolute;z-index:7;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(60,64,67,.3),0 4px 8px 3px rgba(60,64,67,.15);padding:10px 14px;display:none;align-items:center;gap:10px;font:13px Roboto,Arial,sans-serif;max-width:520px}
.chip.on{display:flex}
.chip a{color:#1155cc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tabs{height:40px;display:flex;align-items:center;gap:4px;padding:0 10px;background:#f9fbfd;border-top:1px solid #e0e0e0;color:#444746}
.tabs .b{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%}
.tabs .tab{background:#e1e9f7;color:#0b57d0;font-weight:500;padding:6px 16px;border-radius:6px 6px 0 0;font-size:14px;margin-left:6px}
`;

function sheetPage(db, id) {
  const doc = DOCS[id];
  const sh = db[doc.key];
  const WIDTHS = doc.widths;
  const NR = Math.min(MAX_R, Math.max(60, sh.rows.length + 30));
  const val = (r, c) => (sh.rows[r] && sh.rows[r][c]) || '';
  const rows = [];
  for (let r = 0; r < NR; r++) {
    let tds = `<td class="rn" id="rn${r}">${r + 1}</td>`;
    for (let c = 0; c < NC; c++) {
      const v = val(r, c);
      const spill = v && c < NC - 1 && !val(r, c + 1);
      tds += `<td id="c${r}_${c}" data-r="${r}" data-c="${c}" class="${isUrl(v) ? 'lnk ' : ''}${spill ? 'sp' : ''}">${esc(isUrl(v) ? toReal(v.trim()) : v)}</td>`;
    }
    rows.push(`<tr class="r${r}">${tds}</tr>`);
  }
  const tool = (d, title) => `<span class="b" title="${title}">${ic(d, 18)}</span>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(sh.title)} - Google Sheets</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
<style>${STYLE}</style></head><body>
<header class="top"><a class="lg" href="/" aria-label="Sheets home">${LOGO}</a>
  <div class="tt"><div class="nm"><span>${esc(sh.title)}</span><span class="ib" title="Star">${ic(I.star, 18)}</span><span class="ib" title="Move">${ic(I.folder, 18)}</span><span class="ib" title="See document status">${ic(I.cloud, 18)}</span></div>
    <div class="menu">${['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Extensions', 'Help'].map((m) => `<span>${m}</span>`).join('')}<span class="saved" id="saved" role="status">Saved to Drive</span></div></div>
  <div class="r"><span class="ib" title="Last edit">${ic(I.history, 22)}</span><span class="ib" title="Comments">${ic(I.comment, 22)}</span><span class="ib" title="Join a call">${ic(I.video, 22)}</span>
    <span class="share">${ic(I.lock, 18)}Share</span><span class="av" title="Seek (seek.agent@whatfix.com)">S</span></div>
</header>
<div class="tbar" aria-hidden="true">${tool(I.search, 'Search')}${tool(I.undo, 'Undo')}${tool(I.redo, 'Redo')}${tool(I.print, 'Print')}${tool(I.paint, 'Paint format')}<span class="b dd">100% ▾</span><span class="sep"></span>
  <span class="b">$</span><span class="b">%</span><span class="b">.0</span><span class="b">.00</span><span class="b">123</span><span class="sep"></span><span class="b dd">Default… ▾</span><span class="sep"></span>
  <span class="b">−</span><span class="b dd" style="border:1px solid #747775;border-radius:4px;height:24px">10</span><span class="b">+</span><span class="sep"></span>
  ${tool(I.bold, 'Bold')}${tool(I.italic, 'Italic')}${tool(I.strike, 'Strikethrough')}${tool(I.color, 'Text color')}<span class="sep"></span>${tool(I.fill, 'Fill color')}${tool(I.borders, 'Borders')}${tool(I.merge, 'Merge cells')}<span class="sep"></span>${tool(I.align, 'Horizontal align')}${tool(I.link, 'Insert link')}</div>
<div class="fbar"><div class="nb" id="nb">A1</div><div class="fx">fx</div><input id="fx" aria-label="Formula bar" autocomplete="off"></div>
<div class="gridwrap" id="gw">
<table class="g" id="g" aria-label="${esc(sh.tab)}"><colgroup><col style="width:46px">${WIDTHS.map((w) => `<col style="width:${w}px">`).join('')}</colgroup>
<thead><tr><th class="corner"></th>${WIDTHS.map((_, i) => `<th id="ch${i}">${colLetter(i)}</th>`).join('')}</tr></thead>
<tbody>${rows.join('')}</tbody></table>
<div class="selbox" id="sb"></div><textarea id="ed" aria-label="Cell editor" spellcheck="false" autocomplete="off"></textarea>
<div class="chip" id="chip">${ic(I.link, 16)}<a id="chipa" href="#" target="_blank" rel="noopener"></a></div>
</div>
<div class="tabs"><span class="b" title="Add sheet">${ic(I.plus, 20)}</span><span class="b" title="All sheets">${ic(I.list, 20)}</span><span class="tab">${esc(sh.tab)}</span></div>
<script>
${CLIENT_JS}
const DOC = ${JSON.stringify(id)};
const DATA = ${JSON.stringify(sh.rows.map((row) => row.map((v) => (isUrl(v) ? toReal(v.trim()) : v)))).replace(/</g, '\\u003c')};
const NC = ${NC}, NR = ${NR};
const $ = (id) => document.getElementById(id);
const gw = $('gw'), ed = $('ed'), fx = $('fx'), sb = $('sb'), chip = $('chip');
let sel = { r: 1, c: 0 }, editing = false, typed = false, tabCol = null, viaFx = false;
const hist = [];
const isUrl = (v) => /^https?:\\/\\/\\S+$/.test(String(v || '').trim());
const val = (r, c) => (DATA[r] && DATA[r][c]) || '';
const td = (r, c) => $('c' + r + '_' + c);

function paint(r) {
  for (let c = 0; c < NC; c++) {
    const t = td(r, c), v = val(r, c);
    t.textContent = v;
    t.classList.toggle('lnk', isUrl(v));
    t.classList.toggle('sp', !!v && c < NC - 1 && !val(r, c + 1));
  }
}

let pending = [], timer = null;
function save() {
  if (!pending.length) return;
  const cells = pending; pending = [];
  $('saved').textContent = 'Saving…';
  fetch('/api/cells?doc=' + DOC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cells }) })
    .then((r) => { $('saved').textContent = r.ok ? 'Saved to Drive' : 'Could not save. Check your connection.'; })
    .catch(() => { $('saved').textContent = 'Could not save. Check your connection.'; });
}
function setCell(r, c, v, noHist) {
  if (r < 0 || c < 0 || r >= NR || c >= NC) return;
  if (isUrl(v)) v = toReal(v.trim());
  const old = val(r, c);
  if (old === v) return;
  if (!noHist) hist.push({ r, c, v: old });
  while (DATA.length <= r) DATA.push([]);
  while (DATA[r].length <= c) DATA[r].push('');
  DATA[r][c] = v;
  paint(r);
  pending.push({ r, c, v });
  clearTimeout(timer); timer = setTimeout(save, 150);
}

function place() {
  const t = td(sel.r, sel.c);
  const top = t.offsetTop, left = t.offsetLeft;
  sb.style.cssText = 'top:' + (top - 1) + 'px;left:' + (left - 1) + 'px;width:' + (t.offsetWidth + 1) + 'px;height:' + (t.offsetHeight + 1) + 'px';
  ed.style.top = top + 'px'; ed.style.left = left + 'px';
  ed.style.width = (editing ? Math.max(t.offsetWidth, Math.min(600, ed.scrollWidth + 8)) : t.offsetWidth) + 'px';
  ed.style.height = t.offsetHeight + 'px';
  const v = val(sel.r, sel.c);
  if (!editing && isUrl(v)) {
    $('chipa').textContent = v.trim(); $('chipa').href = toLocal(v.trim());
    chip.style.top = (top + t.offsetHeight + 4) + 'px'; chip.style.left = left + 'px'; chip.classList.add('on');
  } else chip.classList.remove('on');
}
function select(r, c, keepTab) {
  r = Math.max(0, Math.min(NR - 1, r)); c = Math.max(0, Math.min(NC - 1, c));
  document.querySelectorAll('th.on,td.rn.on').forEach((e) => e.classList.remove('on'));
  sel = { r, c };
  if (!keepTab) tabCol = null;
  $('ch' + c).classList.add('on'); $('rn' + r).classList.add('on');
  $('nb').textContent = String.fromCharCode(65 + c) + (r + 1);
  fx.value = val(r, c);
  place();
  const t = td(r, c);
  const view = gw.getBoundingClientRect(), b = t.getBoundingClientRect();
  if (b.bottom > view.bottom) gw.scrollTop += b.bottom - view.bottom + 4;
  if (b.top < view.top + 23) gw.scrollTop -= view.top + 23 - b.top;
  if (b.right > view.right) gw.scrollLeft += b.right - view.right + 4;
  if (b.left < view.left + 46) gw.scrollLeft -= view.left + 46 - b.left;
  if (!viaFx) ed.focus({ preventScroll: true });
}
function startEdit(v, byTyping) {
  editing = true; typed = byTyping; ed.value = v; ed.classList.add('on'); chip.classList.remove('on');
  place(); ed.focus({ preventScroll: true });
  ed.setSelectionRange(ed.value.length, ed.value.length);
}
function stopEdit() { editing = false; typed = false; ed.value = ''; ed.classList.remove('on'); place(); }
function commit() { if (!editing) return; setCell(sel.r, sel.c, ed.value); stopEdit(); fx.value = val(sel.r, sel.c); }
function nextRow() { const c = tabCol !== null ? tabCol : sel.c; select(sel.r + 1, c); }
function nextCol(back) { if (tabCol === null) tabCol = sel.c; select(sel.r, sel.c + (back ? -1 : 1), true); }

// Typed or pasted text may carry tabs and line breaks: each one moves on to the next cell.
function feed() {
  const parts = ed.value.split(/(\\t|\\r?\\n)/);
  if (parts.length === 1) { place(); fx.value = ed.value; return; }
  ed.value = parts[0];
  for (let i = 1; i < parts.length; i += 2) {
    commit();
    if (parts[i] === '\\t') nextCol(false); else nextRow();
    const next = parts[i + 1] || '';
    if (next) startEdit(next, true);
  }
}

ed.addEventListener('input', () => {
  if (!editing) {
    if (!ed.value) return;
    editing = true; typed = true; ed.classList.add('on'); chip.classList.remove('on');
  }
  feed();
});
ed.addEventListener('keydown', (e) => {
  const k = e.key, mod = e.metaKey || e.ctrlKey;
  if (!editing) {
    if (mod && k.toLowerCase() === 'z') { e.preventDefault(); const h = hist.pop(); if (h) { setCell(h.r, h.c, h.v, true); select(h.r, h.c); } return; }
    if (mod && k.toLowerCase() === 'c') { navigator.clipboard && navigator.clipboard.writeText(val(sel.r, sel.c)); return; }
    if (k === 'ArrowUp') { e.preventDefault(); select(sel.r - 1, sel.c); }
    else if (k === 'ArrowDown') { e.preventDefault(); select(sel.r + 1, sel.c); }
    else if (k === 'ArrowLeft') { e.preventDefault(); select(sel.r, sel.c - 1); }
    else if (k === 'ArrowRight') { e.preventDefault(); select(sel.r, sel.c + 1); }
    else if (k === 'Tab') { e.preventDefault(); nextCol(e.shiftKey); }
    else if (k === 'Enter' || k === 'F2') { e.preventDefault(); startEdit(val(sel.r, sel.c), false); }
    else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); setCell(sel.r, sel.c, ''); fx.value = ''; place(); }
    return;
  }
  if (k === 'Enter' && !e.altKey) { e.preventDefault(); commit(); nextRow(); }
  else if (k === 'Enter' && e.altKey) { e.preventDefault(); }
  else if (k === 'Tab') { e.preventDefault(); commit(); nextCol(e.shiftKey); }
  else if (k === 'Escape') { e.preventDefault(); stopEdit(); fx.value = val(sel.r, sel.c); }
  else if (typed && k.startsWith('Arrow')) {
    e.preventDefault(); commit();
    if (k === 'ArrowUp') select(sel.r - 1, sel.c); else if (k === 'ArrowDown') select(sel.r + 1, sel.c);
    else if (k === 'ArrowLeft') select(sel.r, sel.c - 1); else select(sel.r, sel.c + 1);
  }
});
$('g').addEventListener('mousedown', (e) => {
  const t = e.target.closest('td[data-r]');
  if (!t) return;
  e.preventDefault();
  if (e.metaKey || e.ctrlKey) { const v = t.textContent.trim(); if (isUrl(v)) { window.open(toLocal(v), '_blank', 'noopener'); return; } }
  commit(); viaFx = false; select(+t.dataset.r, +t.dataset.c);
});
$('g').addEventListener('dblclick', (e) => { const t = e.target.closest('td[data-r]'); if (t) startEdit(val(sel.r, sel.c), false); });
fx.addEventListener('focus', () => { commit(); viaFx = true; });
fx.addEventListener('input', () => { td(sel.r, sel.c).textContent = fx.value; });
fx.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); setCell(sel.r, sel.c, fx.value); viaFx = false; nextRow(); }
  else if (e.key === 'Escape') { e.preventDefault(); fx.value = val(sel.r, sel.c); paint(sel.r); viaFx = false; ed.focus(); }
});
fx.addEventListener('blur', () => { if (viaFx) { setCell(sel.r, sel.c, fx.value); viaFx = false; } });
window.addEventListener('beforeunload', save);
// The audit log starts on the first empty row, so the next entry goes below the last one.
let first = DATA.length; while (first > 1 && !DATA[first - 1].some(Boolean)) first--;
select(${doc.start === 'top' ? '0' : 'Math.max(1, first)'}, 0);
</script></body></html>`;
}

const docOf = (req) => DOCS[req.query.doc] || DOCS[SHEET_IDS.log];
app.get('/', (req, res) => res.redirect(`/spreadsheets/d/${SHEET_IDS.log}/edit`));
app.get('/spreadsheets/d/seek-audit-log/edit', (req, res) => res.redirect(`/spreadsheets/d/${SHEET_IDS.log}/edit`));
app.get('/spreadsheets/d/:id/edit', (req, res, next) => (DOCS[req.params.id] ? res.send(sheetPage(store.read(), req.params.id)) : next()));
app.get('/spreadsheets/d/:id', (req, res, next) => (DOCS[req.params.id] ? res.redirect(`/spreadsheets/d/${req.params.id}/edit`) : next()));
app.get('/api/sheet', (req, res) => res.json(store.read()[docOf(req).key]));
app.post('/api/cells', (req, res) => {
  const cells = Array.isArray(req.body && req.body.cells) ? req.body.cells : [];
  const key = docOf(req).key;
  store.update((db) => {
    const rows = db[key].rows;
    for (const { r, c, v } of cells) {
      if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= MAX_R || c >= NC) continue;
      while (rows.length <= r) rows.push([]);
      while (rows[r].length <= c) rows[r].push('');
      const t = String(v ?? '').slice(0, 2000);
      rows[r][c] = isUrl(t) ? toReal(t.trim()) : t;
    }
    for (const row of rows) while (row.length && !row[row.length - 1]) row.pop();
    while (rows.length > 1 && !rows[rows.length - 1].length) rows.pop();
  });
  res.sendStatus(204);
});
app.use((req, res) => res.status(404).send(`<!doctype html><meta charset="utf-8"><title>Google Sheets</title><body style="font:15px Roboto,Arial;padding:40px"><p>Sorry, the file you have requested does not exist.</p><p><a href="/">Open Seek audit log</a></p>`));

module.exports = app;
