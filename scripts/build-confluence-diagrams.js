// Draws the Story 1 and Story 2 process diagrams for the Confluence page
// (docs/confluence/*.svg and *.png). PNGs need Google Chrome (macOS path below).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = path.join(__dirname, '..', 'docs', 'confluence');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(OUT, { recursive: true });

// Each system has its own tint, shown as a labelled badge on the step.
const SYS = {
  'Gmail': ['#fce8e6', '#b3261e'],
  'Oracle': ['#fdeee0', '#9a4a0b'],
  'Shopify': ['#e6f4ea', '#146c2e'],
  'Amazon': ['#fff4d6', '#7a5200'],
  'Website': ['#eef0f3', '#3c4043'],
  'Google Sheets': ['#e8f0fe', '#1a56b4'],
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function box(n) {
  const [bg, fg] = n.sys ? SYS[n.sys[0]] : ['#ffffff', '#3c4043'];
  const x = n.cx - n.w / 2;
  let s = `<rect x="${x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${bg}" stroke="${fg}" stroke-opacity=".45" stroke-width="1.5"/>`;
  let bx = x + 12;
  for (const name of n.sys || []) {
    const c = SYS[name][1];
    const bw = name.length * 6.6 + 16;
    s += `<rect x="${bx}" y="${n.y + 10}" width="${bw}" height="18" rx="9" fill="${c}"/><text x="${bx + bw / 2}" y="${n.y + 23}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff" letter-spacing=".3">${esc(name.toUpperCase())}</text>`;
    bx += bw + 6;
  }
  const top = n.sys ? 47 : 28;
  n.lines.forEach((l, i) => {
    s += `<text x="${x + 14}" y="${n.y + top + i * 18}" font-size="14" fill="#1f1f1f"${i === 0 ? ' font-weight="600"' : ''}>${esc(l)}</text>`;
  });
  return s;
}

function diamond(d) {
  const { cx, y, w, h } = d;
  const pts = `${cx},${y} ${cx + w / 2},${y + h / 2} ${cx},${y + h} ${cx - w / 2},${y + h / 2}`;
  return `<polygon points="${pts}" fill="#fff" stroke="#5f6368" stroke-width="1.5"/>` +
    d.lines.map((l, i) => `<text x="${cx}" y="${y + h / 2 - (d.lines.length - 1) * 9 + i * 18 + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="#1f1f1f">${esc(l)}</text>`).join('');
}

const arrow = (pts, label, lx, ly, anchor = 'middle') =>
  `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#5f6368" stroke-width="1.6" marker-end="url(#a)"/>` +
  (label ? `<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-size="13" font-weight="600" fill="#3c4043">${esc(label)}</text>` : '');

function lane(x, y, w, h, title) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#f8f9fa" stroke="#dadce0" stroke-dasharray="5 4"/>` +
    `<text x="${x + 16}" y="${y + 24}" font-size="13" font-weight="700" fill="#5f6368" letter-spacing=".4">${esc(title)}</text>`;
}

function svg(w, h, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Inter, 'Segoe UI', Helvetica, Arial, sans-serif">
<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5f6368"/></marker></defs>
<rect width="100%" height="100%" fill="#ffffff"/>
<text x="${w / 2}" y="34" text-anchor="middle" font-size="20" font-weight="700" fill="#1f1f1f">${esc(title)}</text>
${body}
</svg>`;
}

const bottom = (n) => n.y + n.h;

// ---------- Story 1 ----------
function story1() {
  const W = 1120, C = W / 2, L = 300, R = 830;
  const n1 = { cx: C, y: 60, w: 520, h: 74, sys: ['Gmail'], lines: ['Noah forwards the supplier email to Seek', 'Dana’s email with 2 spec sheets and 5 photos attached'] };
  const n2 = { cx: C, y: 166, w: 520, h: 92, sys: ['Gmail'], lines: ['Seek reads the email and every attachment once', 'PDF spec tables, the line drawings, each photo full size', 'Writes a spec ledger: one line per value, with its source'] };
  const d = { cx: C, y: 292, w: 300, h: 110, lines: ['Any value missing', 'or in conflict?'] };
  const a1 = { cx: L, y: 470, w: 440, h: 92, sys: ['Oracle'], lines: ['Create the item from the ledger', 'Attributes, cost, MSRP, photos, spec sheet', 'Save → Approve → Release to Channels'] };
  const a2 = { cx: L, y: 594, w: 440, h: 74, sys: ['Shopify'], lines: ['Product arrives by sync; check media', 'Publish to Online Store and Mobile App'] };
  const a3 = { cx: L, y: 700, w: 440, h: 74, sys: ['Amazon'], lines: ['Create the listing in Seller Central', 'All tabs from the ledger, then submit'] };
  const a4 = { cx: L, y: 806, w: 440, h: 74, sys: ['Website', 'Amazon'], lines: ['Check what customers see', 'Name, price, color, dimensions, main image'] };
  const b1 = { cx: R, y: 470, w: 440, h: 92, sys: ['Oracle'], lines: ['Save the item, leave the conflict empty', 'Put on Hold, with a note: width 84 in', '(spec table) vs 86 in (front-view drawing)'] };
  const b2 = { cx: R, y: 594, w: 440, h: 74, sys: ['Shopify', 'Amazon'], lines: ['Not created', 'Blocked until the supplier confirms the width'] };
  const b3 = { cx: R, y: 700, w: 440, h: 58, lines: ['Seek does not contact the supplier', 'Only Noah is told; he follows up with the brand'] };
  const m1 = { cx: C, y: 930, w: 440, h: 92, sys: ['Google Sheets'], lines: ['Log every action in the Seek audit log', '3 rows per product: Oracle, Shopify,', 'Amazon, each with its status and link'] };
  const m2 = { cx: C, y: 1054, w: 560, h: 92, sys: ['Gmail'], lines: ['Reply to Noah, once, on the same thread', 'Harlow: live, with website, Amazon and Shopify links', 'Ashby: on hold, the conflict and what is needed'] };
  const H = 1178;
  const body = [
    lane(70, 432, 460, 470, 'HARLOW: LIVE PATH'),
    lane(600, 432, 460, 362, 'ASHBY: HOLD PATH'),
    ...[n1, n2, a1, a2, a3, a4, b1, b2, b3, m1, m2].map(box), diamond(d),
    arrow([[C, bottom(n1)], [C, n2.y - 2]]),
    arrow([[C, bottom(n2)], [C, d.y - 2]]),
    arrow([[C - d.w / 2, d.y + d.h / 2], [L, d.y + d.h / 2], [L, a1.y - 2]], 'No: Harlow', L + 12, d.y + d.h / 2 - 8, 'start'),
    arrow([[C + d.w / 2, d.y + d.h / 2], [R, d.y + d.h / 2], [R, b1.y - 2]], 'Yes: Ashby', R - 12, d.y + d.h / 2 - 8, 'end'),
    arrow([[L, bottom(a1)], [L, a2.y - 2]]), arrow([[L, bottom(a2)], [L, a3.y - 2]]), arrow([[L, bottom(a3)], [L, a4.y - 2]]),
    arrow([[R, bottom(b1)], [R, b2.y - 2]]), arrow([[R, bottom(b2)], [R, b3.y - 2]]),
    arrow([[L, bottom(a4)], [L, m1.y + m1.h / 2], [m1.cx - m1.w / 2 - 2, m1.y + m1.h / 2]]),
    arrow([[R, bottom(b3)], [R, m1.y + m1.h / 2], [m1.cx + m1.w / 2 + 2, m1.y + m1.h / 2]]),
    arrow([[C, bottom(m1)], [C, m2.y - 2]]),
  ].join('\n');
  return { name: 'story1-new-product-setup', w: W, h: H, svg: svg(W, H, 'Story 1: New product setup from a forwarded supplier email', body) };
}

// ---------- Story 2 ----------
function story2() {
  const W = 1120, C = W / 2, L = 300, R = 830;
  const n1 = { cx: C, y: 60, w: 540, h: 74, sys: ['Gmail'], lines: ['Noah emails Seek this week’s catalog audit', 'A link to the audit list in Google Sheets, no attachments'] };
  const n2 = { cx: C, y: 166, w: 540, h: 92, sys: ['Google Sheets'], lines: ['Seek opens the audit list', 'One row per product: why it is on the list, page links,', 'spec sheet link, approved photos, what to check'] };
  const n3 = { cx: C, y: 290, w: 540, h: 92, sys: ['Oracle'], lines: ['Opens each spec sheet and the approved photos', 'From the item’s attachments and images, read-only', 'Writes the audit ledger, ignoring old or struck-out values'] };
  const n4 = { cx: C, y: 414, w: 540, h: 74, sys: ['Website', 'Amazon'], lines: ['Compares each live product page with the ledger', 'Name, dimensions, materials, color, weight, photos'] };
  const d = { cx: C, y: 520, w: 300, h: 110, lines: ['Clear mismatch', 'with the spec sheet?'] };
  const a1 = { cx: L, y: 700, w: 440, h: 76, lines: ['Merriam Dining Table', 'Every value matches on both channels', 'Verified, no changes'] };
  const b1 = { cx: R, y: 700, w: 440, h: 92, sys: ['Website'], lines: ['Calder Loveseat (2 “color not as pictured” returns)', 'Main photo shows the navy colorway;', 'spec sheet and approved photos say Slate Grey'] };
  const b2 = { cx: R, y: 824, w: 440, h: 74, sys: ['Shopify'], lines: ['Replace the featured image', 'with the approved calder_slate_front.jpg'] };
  const b3 = { cx: R, y: 930, w: 440, h: 74, sys: ['Website'], lines: ['Re-verify on the live product page', 'The slate photo now shows first'] };
  const m1 = { cx: C, y: 1056, w: 440, h: 92, sys: ['Google Sheets'], lines: ['Record the results', 'Audit list: the three result columns', 'Audit log: a row per product per channel'] };
  const m2 = { cx: C, y: 1180, w: 580, h: 74, sys: ['Gmail'], lines: ['Reply to Noah on the same thread', 'What was verified, what was fixed and why, with links'] };
  const H = 1286;
  const body = [
    lane(70, 662, 460, 136, 'NO: VERIFIED'),
    lane(600, 662, 460, 372, 'YES: FIX, THEN PROVE IT'),
    ...[n1, n2, n3, n4, a1, b1, b2, b3, m1, m2].map(box), diamond(d),
    arrow([[C, bottom(n1)], [C, n2.y - 2]]), arrow([[C, bottom(n2)], [C, n3.y - 2]]), arrow([[C, bottom(n3)], [C, n4.y - 2]]),
    arrow([[C, bottom(n4)], [C, d.y - 2]]),
    arrow([[C - d.w / 2, d.y + d.h / 2], [L, d.y + d.h / 2], [L, a1.y - 2]], 'No: Merriam', L + 12, d.y + d.h / 2 - 8, 'start'),
    arrow([[C + d.w / 2, d.y + d.h / 2], [R, d.y + d.h / 2], [R, b1.y - 2]], 'Yes: Calder', R - 12, d.y + d.h / 2 - 8, 'end'),
    arrow([[R, bottom(b1)], [R, b2.y - 2]]), arrow([[R, bottom(b2)], [R, b3.y - 2]]),
    arrow([[L, bottom(a1)], [L, m1.y + m1.h / 2], [m1.cx - m1.w / 2 - 2, m1.y + m1.h / 2]]),
    arrow([[R, bottom(b3)], [R, m1.y + m1.h / 2], [m1.cx + m1.w / 2 + 2, m1.y + m1.h / 2]]),
    arrow([[C, bottom(m1)], [C, m2.y - 2]]),
  ].join('\n');
  return { name: 'story2-live-product-audit', w: W, h: H, svg: svg(W, H, 'Story 2: Live product page audit from a linked audit list', body) };
}

for (const d of [story1(), story2()]) {
  const svgPath = path.join(OUT, d.name + '.svg');
  fs.writeFileSync(svgPath, d.svg);
  const htmlPath = path.join(OUT, '.' + d.name + '.html');
  fs.writeFileSync(htmlPath, `<!doctype html><html><body style="margin:0">${d.svg}</body></html>`);
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
      `--window-size=${d.w},${d.h}`, `--screenshot=${path.join(OUT, d.name + '.png')}`, 'file://' + htmlPath], { stdio: 'ignore' });
  } finally { fs.unlinkSync(htmlPath); }
  console.log('Wrote docs/confluence/' + d.name + '.svg and .png');
}
