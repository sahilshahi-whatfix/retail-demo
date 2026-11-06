// Shared document previews: PDF spec sheets (pre-rendered page images) and
// spreadsheets (rendered as a grid), used by Gmail's attachment viewer and
// Oracle's item attachments.
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { esc } = require('./util');
const { SPEC_DIR } = require('./files');
const { toReal, toLocal } = require('./realurl');

function pdfPages(name) {
  const base = path.basename(name, '.pdf');
  const pages = [];
  for (let i = 1; i < 50; i++) {
    const f = `${base}__p${i}.png`;
    if (!fs.existsSync(path.join(SPEC_DIR, 'pages', f))) break;
    pages.push(f);
  }
  return pages;
}

const colLetter = (n) => { let s = ''; n++; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };

function argbToCss(argb) {
  if (!argb || argb.length < 6) return null;
  return '#' + argb.slice(-6);
}

function cellText(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((r) => r.text).join('');
    if (v.text) return v.text;
    if (v.result !== undefined) return String(v.result);
    if (v instanceof Date) return v.toLocaleDateString('en-US');
  }
  return String(v);
}

async function sheetHtml(file, sheetIdx, baseHref) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const sheets = wb.worksheets;
  const ws = sheets[sheetIdx] || sheets[0];
  const cols = Math.max(ws.columnCount, 1) + 3;
  const rows = Math.max(ws.rowCount, 1) + 8;
  const widths = [];
  for (let c = 1; c <= cols; c++) widths.push(Math.round(((ws.getColumn(c).width || 9) * 7.4) + 10));
  // A fixed table layout only applies with an explicit width; without it, long text widens its column.
  const total = 42 + widths.reduce((a, b) => a + b, 0);
  let out = `<table class="xl" style="width:${total}px" aria-label="${esc(ws.name)}"><colgroup><col style="width:42px">${widths.map((w) => `<col style="width:${w}px">`).join('')}</colgroup>`;
  out += `<thead><tr><th class="rn"></th>${widths.map((_, i) => `<th>${colLetter(i)}</th>`).join('')}</tr></thead><tbody>`;
  for (let r = 1; r <= rows; r++) {
    out += `<tr><td class="rn">${r}</td>`;
    for (let c = 1; c <= cols; c++) {
      const cell = ws.getRow(r).getCell(c);
      const st = [];
      const f = cell.font || {};
      if (f.bold) st.push('font-weight:700');
      if (f.italic) st.push('font-style:italic');
      if (f.strike) st.push('text-decoration:line-through');
      if (f.size) st.push(`font-size:${Math.round(f.size * 1.3)}px`);
      const fc = f.color && argbToCss(f.color.argb);
      if (fc) st.push('color:' + fc);
      const fill = cell.fill && cell.fill.fgColor && argbToCss(cell.fill.fgColor.argb);
      if (fill) st.push('background:' + fill);
      const align = (cell.alignment && cell.alignment.horizontal) || (typeof cell.value === 'number' ? 'right' : null);
      if (align) st.push('text-align:' + align);
      const text = cellText(cell.value);
      const link = (cell.value && typeof cell.value === 'object' && cell.value.hyperlink) || (/^https?:\/\/\S+$/.test(text.trim()) ? text.trim() : '');
      if (text && c < cols) {
        // Let long text spill into empty neighbouring cells, as spreadsheets do.
        const next = ws.getRow(r).getCell(c + 1).value;
        if (next === null || next === undefined) st.push('overflow:visible;position:relative;z-index:1');
      }
      out += link
        ? `<td style="${st.join(';')}"><a href="${esc(toLocal(link))}" target="_blank" rel="noopener" style="color:#1155cc">${esc(link === text.trim() ? toReal(text.trim()) : text)}</a></td>`
        : `<td style="${st.join(';')}">${esc(text)}</td>`;
    }
    out += '</tr>';
  }
  out += '</tbody></table>';
  const tabs = sheets.map((s, i) => `<a href="${baseHref}&sheet=${i}" class="${s === ws ? 'on' : ''}">${esc(s.name)}</a>`).join('');
  return { table: out, tabs, sheetName: ws.name, count: sheets.length };
}


module.exports = { pdfPages, sheetHtml };
