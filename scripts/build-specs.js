// Generates the supplier spec sheet files in specs/ from the demo data,
// plus page images in specs/pages/ that the Mail attachment viewer shows.
// Run with: npm run build:specs
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'specs');
const PAGES = path.join(OUT, 'pages');
const PHOTO = (f) => path.join(ROOT, 'photos', f);
fs.mkdirSync(PAGES, { recursive: true });

const SUPP = '/System/Library/Fonts/Supplemental/';
const FONTS = {
  cond: fs.existsSync(SUPP + 'DIN Condensed Bold.ttf') ? SUPP + 'DIN Condensed Bold.ttf' : 'Helvetica-Bold',
  narrow: fs.existsSync(SUPP + 'Arial Narrow.ttf') ? SUPP + 'Arial Narrow.ttf' : 'Helvetica',
  narrowBold: fs.existsSync(SUPP + 'Arial Narrow Bold.ttf') ? SUPP + 'Arial Narrow Bold.ttf' : 'Helvetica-Bold',
};

const cm = (inch) => (inch * 2.54).toFixed(1);
const kg = (lb) => (lb * 0.45359237).toFixed(1);

// ---------- PDF helpers ----------
function newDoc(title) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: false, info: { Title: title } });
  doc.registerFont('Cond', FONTS.cond);
  doc.registerFont('Narrow', FONTS.narrow);
  doc.registerFont('NarrowBold', FONTS.narrowBold);
  return doc;
}

function savePdf(file, title, pageFns) {
  const write = (target, fns) =>
    new Promise((resolve) => {
      const doc = newDoc(title);
      const stream = fs.createWriteStream(target);
      doc.pipe(stream);
      fns.forEach((fn) => { doc.addPage(); fn(doc); });
      doc.end();
      stream.on('finish', resolve);
    });
  const base = path.basename(file, '.pdf');
  return write(path.join(OUT, file), pageFns).then(async () => {
    // One single-page PDF per page, rasterized for the in-app viewer.
    for (let i = 0; i < pageFns.length; i++) {
      const tmp = path.join(PAGES, `${base}__p${i + 1}.pdf`);
      await write(tmp, [pageFns[i]]);
      rasterize(tmp, path.join(PAGES, `${base}__p${i + 1}.png`));
      fs.unlinkSync(tmp);
    }
  });
}

function rasterize(pdf, png) {
  const dir = path.dirname(pdf);
  try {
    execFileSync('qlmanage', ['-t', '-s', '1700', '-o', dir, pdf], { stdio: 'ignore' });
    fs.renameSync(pdf + '.png', png);
  } catch (e) {
    execFileSync('sips', ['-s', 'format', 'png', pdf, '--out', png], { stdio: 'ignore' });
  }
}

// Two-column table of label/value rows.
function kvTable(doc, x, y, w, rows, opts = {}) {
  const labelW = opts.labelW || w * 0.38;
  const rowH = opts.rowH || 20;
  rows.forEach(([k, v], i) => {
    const ry = y + i * rowH;
    if (i % 2 === 0 && opts.zebra) doc.rect(x, ry, w, rowH).fill(opts.zebra);
    doc.fillColor(opts.labelColor || '#555').font(opts.labelFont || 'NarrowBold').fontSize(opts.size || 10).text(k, x + 6, ry + 5, { width: labelW - 8 });
    doc.fillColor('#1d1d1d').font(opts.valueFont || 'Helvetica').fontSize(opts.size || 10).text(v, x + labelW, ry + 5, { width: w - labelW - 6 });
    doc.moveTo(x, ry + rowH).lineTo(x + w, ry + rowH).lineWidth(0.5).strokeColor(opts.rule || '#d9d2c9').stroke();
  });
  return y + rows.length * rowH;
}

// ---------- Northfield Upholstery ----------
const RUST = '#8b3a1e';

function northfieldHeader(doc, docLabel) {
  doc.rect(0, 0, 612, 78).fill(RUST);
  doc.fillColor('#fff').font('Cond').fontSize(30).text('NORTHFIELD', 40, 22, { characterSpacing: 1.5, lineBreak: false });
  doc.font('Cond').fontSize(13).fillColor('#f3d9c9').text('UPHOLSTERY CO.', 42, 52, { characterSpacing: 3, lineBreak: false });
  doc.fillColor('#f6e6dc').font('Narrow').fontSize(9.5)
    .text('Greensboro, North Carolina', 330, 24, { width: 242, align: 'right' })
    .text('northfieldupholstery.com  |  wholesale@northfieldupholstery.com', 330, 37, { width: 242, align: 'right' })
    .text(docLabel, 330, 50, { width: 242, align: 'right' });
  doc.rect(0, 78, 612, 4).fill('#d9a183');
}

function northfieldFooter(doc, page, total) {
  doc.moveTo(40, 752).lineTo(572, 752).lineWidth(0.6).strokeColor('#c9b5a8').stroke();
  doc.fillColor('#7a6a60').font('Narrow').fontSize(8.5)
    .text('Northfield Upholstery Co.  |  Wholesale specification. Confidential to authorized retail partners.', 40, 758, { lineBreak: false })
    .text(`Page ${page} of ${total}`, 472, 758, { width: 100, align: 'right' });
}

function sectionTitle(doc, text, x, y, color = RUST) {
  doc.fillColor(color).font('Cond').fontSize(14).text(text.toUpperCase(), x, y, { characterSpacing: 1, lineBreak: false });
  doc.moveTo(x, y + 15).lineTo(x + 30, y + 15).lineWidth(2).strokeColor(color).stroke();
  return y + 22;
}

function northfieldSpecPage(doc, p, pageNo, totalPages) {
  northfieldHeader(doc, `Product specification  |  ${p.rev}`);
  doc.fillColor('#2b1d16').font('Cond').fontSize(34).text(p.name.toUpperCase(), 40, 102, { characterSpacing: 0.5 });
  doc.fillColor('#6b5a50').font('Narrow').fontSize(11).text(`${p.subtitle}  |  Issued ${p.issued}`, 40, 138);

  // Photo
  doc.rect(40, 162, 250, 210).lineWidth(0.6).strokeColor('#d9d2c9').stroke();
  doc.image(PHOTO(p.photo), 45, 167, { fit: [240, 200], align: 'center', valign: 'center' });

  // Key facts
  let y = sectionTitle(doc, 'Item summary', 312, 162);
  kvTable(doc, 312, y, 260, [
    ['Item code', p.code],
    ['Colorway', p.color],
    ['UPC', p.upc],
    ['Wholesale cost', p.cost],
    ['MSRP', p.msrp],
    ['Availability', p.availability],
    ['Reorder lead time', p.leadTime],
    ['Ships from', 'Greensboro, NC warehouse'],
  ], { rowH: 22, labelW: 100, zebra: '#faf5f1' });

  // Dimensions
  y = sectionTitle(doc, 'Dimensions', 40, 392);
  const cols = [40, 250, 380, 510];
  doc.rect(40, y, 532, 20).fill('#3a2a22');
  doc.fillColor('#fff').font('NarrowBold').fontSize(10)
    .text('MEASUREMENT', cols[0] + 6, y + 6).text('INCHES', cols[1], y + 6).text('CENTIMETERS', cols[2], y + 6);
  y += 20;
  p.dims.forEach(([label, inch, unit], i) => {
    if (i % 2 === 1) doc.rect(40, y, 532, 19).fill('#f6efe9');
    const metric = unit === 'lb' ? `${kg(inch)} kg` : `${cm(inch)} cm`;
    doc.fillColor('#1d1d1d').font('Helvetica').fontSize(10)
      .text(label, cols[0] + 6, y + 5)
      .text(unit === 'lb' ? `${inch} lb` : `${inch} in`, cols[1], y + 5)
      .text(metric, cols[2], y + 5);
    y += 19;
  });
  doc.moveTo(40, y).lineTo(572, y).lineWidth(0.6).strokeColor('#c9b5a8').stroke();

  // Materials, care, assembly, packaging
  y += 16;
  const colY = y;
  y = sectionTitle(doc, 'Materials and construction', 40, colY);
  doc.fillColor('#1d1d1d').font('Helvetica').fontSize(9.5);
  p.materials.forEach((m) => { doc.text('•  ' + m, 44, y, { width: 250 }); y = doc.y + 3; });
  let y2 = sectionTitle(doc, 'Care', 312, colY);
  doc.fillColor('#1d1d1d').font('Helvetica').fontSize(9.5).text(p.care, 312, y2, { width: 260 });
  y2 = doc.y + 12;
  y2 = sectionTitle(doc, 'Assembly', 312, y2);
  doc.fillColor('#1d1d1d').font('Helvetica').fontSize(9.5).text(p.assembly, 312, y2, { width: 260 });
  y2 = doc.y + 12;
  y2 = sectionTitle(doc, 'Packaging', 312, y2);
  doc.fillColor('#1d1d1d').font('Helvetica').fontSize(9.5).text(p.packaging, 312, y2, { width: 260 });
  if (p.note) {
    doc.fillColor('#6b5a50').font('Narrow').fontSize(9).text(p.note, 40, 724, { width: 532 });
  }
  northfieldFooter(doc, pageNo, totalPages);
}

const HARLOW = {
  name: 'Harlow Accent Chair', subtitle: 'Upholstered accent chair', rev: 'Rev A', issued: 'October 2026',
  photo: 'harlow_front.jpg', code: 'NF-HAR-AC-OAT', color: 'Oatmeal', upc: '841256300924',
  cost: '$298.00', msrp: '$649.00',
  availability: 'In stock', leadTime: '6 to 8 weeks',
  dims: [['Overall width', 29], ['Overall depth', 31], ['Overall height', 32], ['Seat height', 18], ['Product weight', 38, 'lb'], ['Weight capacity', 300, 'lb']],
  materials: ['Cover: polyester boucle, Oatmeal', 'Frame: kiln-dried hardwood', 'Legs: solid oak, walnut stain', 'Seat: high-resilience foam with fiber wrap'],
  care: 'Spot clean with a mild, water-based cleaner. Vacuum regularly with a soft brush attachment. Keep out of direct sunlight.',
  assembly: 'Legs attach, no tools required. Estimated time 5 minutes.',
  packaging: '1 carton, 31 x 33 x 27 in, 46 lb gross.',
};

const ASHBY = {
  name: 'Ashby 3-Seat Sofa', subtitle: 'Track-arm sofa, three seats', rev: 'Rev B', issued: 'October 2026',
  photo: 'ashby_front.jpg', code: 'NF-ASH-3S-SLT', color: 'Slate', upc: '841256300917',
  cost: '$1,140.00', msrp: '$2,199.00',
  availability: 'In stock. Ships from Nov 18', leadTime: '8 to 10 weeks',
  dims: [['Overall width', 84], ['Overall depth', 38], ['Overall height', 34], ['Seat height', 19], ['Product weight', 142, 'lb'], ['Weight capacity', 750, 'lb']],
  materials: ['Cover: polyester performance weave, Slate', 'Back: button-tufted back cushions', 'Arms: track arms', 'Frame: kiln-dried hardwood', 'Legs: oak, walnut stain'],
  care: 'Spot clean with a mild, water-based cleaner. Vacuum regularly. Rotate seat cushions to keep wear even.',
  assembly: 'Screw-in legs, no tools required. Estimated time 10 minutes.',
  packaging: '1 carton, 88 x 40 x 36 in, 168 lb gross.',
  note: 'Technical drawings: see page 2.',
};

// Page 2 of the Ashby sheet: line drawings. The overall width is marked 86"
// here, which conflicts with the 84 in in the page 1 table (deliberate).
function ashbyDrawings(doc) {
  northfieldHeader(doc, 'Product specification  |  Rev B');
  doc.fillColor('#2b1d16').font('Cond').fontSize(28).text('ASHBY 3-SEAT SOFA  |  TECHNICAL DRAWINGS', 40, 102);
  doc.fillColor('#6b5a50').font('Narrow').fontSize(10.5).text('Front, side and top views. Dimensions in inches. Not to scale.', 40, 132);
  const ink = '#2b2b2b';
  doc.lineWidth(1.2).strokeColor(ink);

  const dimH = (x1, x2, y, label) => {
    doc.lineWidth(0.7).strokeColor('#8b3a1e');
    doc.moveTo(x1, y).lineTo(x2, y).stroke();
    doc.moveTo(x1, y - 5).lineTo(x1, y + 5).stroke();
    doc.moveTo(x2, y - 5).lineTo(x2, y + 5).stroke();
    doc.polygon([x1, y], [x1 + 7, y - 3], [x1 + 7, y + 3]).fill('#8b3a1e');
    doc.polygon([x2, y], [x2 - 7, y - 3], [x2 - 7, y + 3]).fill('#8b3a1e');
    const w = 40;
    doc.rect((x1 + x2) / 2 - w / 2, y - 8, w, 16).fill('#fff');
    doc.fillColor('#8b3a1e').font('NarrowBold').fontSize(12).text(label, (x1 + x2) / 2 - w / 2, y - 6, { width: w, align: 'center' });
    doc.lineWidth(1.2).strokeColor(ink);
  };
  const dimV = (x, y1, y2, label) => {
    doc.lineWidth(0.7).strokeColor('#8b3a1e');
    doc.moveTo(x, y1).lineTo(x, y2).stroke();
    doc.moveTo(x - 5, y1).lineTo(x + 5, y1).stroke();
    doc.moveTo(x - 5, y2).lineTo(x + 5, y2).stroke();
    doc.polygon([x, y1], [x - 3, y1 + 7], [x + 3, y1 + 7]).fill('#8b3a1e');
    doc.polygon([x, y2], [x - 3, y2 - 7], [x + 3, y2 - 7]).fill('#8b3a1e');
    doc.rect(x - 18, (y1 + y2) / 2 - 8, 36, 16).fill('#fff');
    doc.fillColor('#8b3a1e').font('NarrowBold').fontSize(12).text(label, x - 18, (y1 + y2) / 2 - 6, { width: 36, align: 'center' });
    doc.lineWidth(1.2).strokeColor(ink);
  };
  const label = (t, x, y) => doc.fillColor('#6b5a50').font('NarrowBold').fontSize(11).text(t, x, y, { characterSpacing: 1.5 });

  // FRONT VIEW (scale 3.6 pt per inch, 86 in wide)
  const s = 3.6, fx = 80, fyBase = 360;
  const W = 86 * s, H = 34 * s, seat = 19 * s, leg = 5 * s, arm = 6 * s, armH = 25 * s;
  label('FRONT VIEW', fx, 172);
  doc.rect(fx, fyBase - armH, arm, armH - leg).stroke();
  doc.rect(fx + W - arm, fyBase - armH, arm, armH - leg).stroke();
  doc.rect(fx + arm, fyBase - H, W - 2 * arm, H - seat).stroke();
  for (let i = 0; i < 3; i++) {
    const cw = (W - 2 * arm) / 3;
    doc.rect(fx + arm + i * cw + 2, fyBase - H + 4, cw - 4, H - seat - 6).stroke();
    doc.circle(fx + arm + i * cw + cw / 2, fyBase - H + (H - seat) / 2, 2).stroke();
    doc.rect(fx + arm + i * cw + 2, fyBase - seat, cw - 4, seat - leg - 18).stroke();
  }
  doc.rect(fx + arm, fyBase - leg - 18, W - 2 * arm, 18).stroke();
  [fx + 10, fx + W - 16].forEach((lx) => doc.polygon([lx, fyBase - leg], [lx + 6, fyBase - leg], [lx + 5, fyBase], [lx + 1, fyBase]).stroke());
  dimH(fx, fx + W, fyBase + 26, '86"');
  dimV(fx + W + 26, fyBase - H, fyBase, '34"');

  // SIDE VIEW
  const sx = 80, sBase = 600, D = 38 * s;
  label('SIDE VIEW', sx, 432);
  doc.moveTo(sx, sBase - leg).lineTo(sx + D, sBase - leg).lineTo(sx + D, sBase - armH).lineTo(sx + 14, sBase - armH).lineTo(sx + 6, sBase - H).lineTo(sx, sBase - H).closePath().stroke();
  doc.moveTo(sx + 18, sBase - seat).lineTo(sx + D, sBase - seat).stroke();
  [sx + 6, sx + D - 12].forEach((lx) => doc.polygon([lx, sBase - leg], [lx + 6, sBase - leg], [lx + 5, sBase], [lx + 1, sBase]).stroke());
  dimH(sx, sx + D, sBase + 26, '38"');
  dimV(sx - 26, sBase - H, sBase, '34"');
  dimV(sx + D + 26, sBase - seat, sBase, '19"');

  // TOP VIEW (smaller scale)
  const t = 2.6, tx = 300, ty = 470, TW = 86 * t, TD = 38 * t;
  label('TOP VIEW', tx, 432);
  doc.rect(tx, ty, TW, TD).stroke();
  doc.rect(tx, ty, 6 * t, TD).stroke();
  doc.rect(tx + TW - 6 * t, ty, 6 * t, TD).stroke();
  doc.rect(tx + 6 * t, ty, TW - 12 * t, 9 * t).stroke();
  for (let i = 1; i < 3; i++) {
    const cx = tx + 6 * t + (i * (TW - 12 * t)) / 3;
    doc.moveTo(cx, ty + 9 * t).lineTo(cx, ty + TD).stroke();
  }
  dimH(tx, tx + TW, ty + TD + 24, '86"');
  dimV(tx + TW + 24, ty, ty + TD, '38"');

  // Title block
  doc.rect(312, 652, 260, 80).lineWidth(0.8).strokeColor('#8b3a1e').stroke();
  doc.fillColor('#2b1d16').font('NarrowBold').fontSize(9.5);
  [['DRAWING', 'NF-ASH-3S-SLT-D1'], ['REVISION', 'B'], ['UNITS', 'Inches'], ['DRAWN', 'R. Malloy, Oct 2026']].forEach(([k, v], i) => {
    doc.fillColor('#8b3a1e').text(k, 320, 660 + i * 17);
    doc.fillColor('#2b1d16').font('Narrow').text(v, 400, 660 + i * 17).font('NarrowBold');
  });
  northfieldFooter(doc, 2, 2);
}

// ---------- Brightline Living ----------
function calderSheet(doc) {
  const dark = '#1f2a30', accent = '#5f8f8b';
  doc.rect(0, 0, 612, 96).fill(dark);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(26).text('brightline', 40, 30, { lineBreak: false, characterSpacing: -0.5 });
  doc.fillColor('#9fc3bf').font('Helvetica').fontSize(10).text('LIVING CO.', 42, 60, { characterSpacing: 3.2 });
  doc.fillColor('#c9d3d6').font('Helvetica').fontSize(9.5)
    .text('PRODUCT DATA SHEET', 372, 32, { width: 200, align: 'right', characterSpacing: 1.5 })
    .text('Issued March 2026  |  brightlineliving.com', 372, 48, { width: 200, align: 'right' });

  // Hero
  doc.rect(40, 120, 300, 225).fill('#f4f5f5');
  doc.image(PHOTO('calder_slate_front.jpg'), 44, 124, { fit: [292, 217], align: 'center', valign: 'center' });

  doc.fillColor(dark).font('Helvetica-Bold').fontSize(26).text('Calder Loveseat', 360, 122);
  doc.fillColor('#65737a').font('Helvetica').fontSize(10).text('Item code  BL-CAL-LS-SLT', 360, 156);
  doc.fillColor('#65737a').font('Helvetica').fontSize(9).text('COLOR', 360, 186, { characterSpacing: 1.2 });
  doc.roundedRect(360, 200, 26, 26, 4).fill('#6b7177');
  doc.fillColor(dark).font('Helvetica-Bold').fontSize(14).text('Slate Grey', 394, 206);
  doc.fillColor('#65737a').font('Helvetica').fontSize(9).text('PRICING', 360, 244, { characterSpacing: 1.2 });
  doc.fillColor(dark).font('Helvetica').fontSize(11).text('Wholesale cost   $640.00', 360, 258).text('MSRP                  $1,299.00', 360, 275);
  doc.fillColor('#65737a').font('Helvetica').fontSize(9).text('LEAD TIME', 360, 302, { characterSpacing: 1.2 });
  doc.fillColor(dark).font('Helvetica').fontSize(11).text('4 to 6 weeks', 360, 316);

  // Dimension tiles
  const tiles = [['62', 'WIDTH'], ['36', 'DEPTH'], ['33', 'HEIGHT'], ['19', 'SEAT HEIGHT']];
  const tw = 124, gap = 12.6;
  tiles.forEach(([v, l], i) => {
    const x = 40 + i * (tw + gap);
    doc.roundedRect(x, 368, tw, 78, 6).fill('#eef3f2');
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(32).text(v, x + 14, 380, { continued: true }).font('Helvetica').fontSize(13).text(' in');
    doc.fillColor(accent).font('Helvetica-Bold').fontSize(8.5).text(l, x + 14, 424, { characterSpacing: 1.2 });
  });

  const table = (title, rows, x, y, w) => {
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text(title, x, y);
    y += 18;
    rows.forEach(([k, v]) => {
      doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.6).strokeColor('#d5dddc').stroke();
      doc.fillColor('#65737a').font('Helvetica').fontSize(9.5).text(k, x, y + 6, { width: 100 });
      doc.fillColor(dark).font('Helvetica').fontSize(9.5).text(v, x + 104, y + 6, { width: w - 104 });
      y = Math.max(doc.y, y + 18) + 4;
    });
    doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.6).strokeColor('#d5dddc').stroke();
    return y;
  };
  table('Construction', [
    ['Upholstery', 'Polyester performance weave'],
    ['Back cushions', '2 loose back cushions'],
    ['Legs', 'Oak, walnut stain'],
    ['Product weight', '96 lb'],
    ['Weight capacity', '500 lb'],
    ['Assembly', 'Screw-in legs, no tools'],
  ], 40, 468, 256);
  table('Care', [
    ['Cleaning', 'Spot clean with a water-based cleaner'],
    ['Routine', 'Vacuum regularly; fluff cushions weekly'],
    ['Avoid', 'Bleach, solvents and direct sunlight'],
  ], 316, 468, 256);

  // Approved images
  doc.rect(40, 618, 532, 108).fill('#f4f5f5');
  doc.fillColor(dark).font('Helvetica-Bold').fontSize(10).text('APPROVED IMAGES  |  SLATE GREY', 52, 628, { characterSpacing: 1 });
  ['calder_slate_front.jpg', 'calder_slate_side.jpg', 'calder_lifestyle.jpg'].forEach((f, i) => {
    const x = 52 + i * 172;
    doc.rect(x, 644, 160, 62).fill('#fff');
    doc.image(PHOTO(f), x + 2, 646, { fit: [156, 58], align: 'center', valign: 'center' });
    doc.fillColor('#65737a').font('Helvetica').fontSize(8).text(f, x, 710, { width: 160, align: 'center' });
  });
  doc.fillColor('#8a969b').font('Helvetica').fontSize(8)
    .text('Use only the approved images above for this colorway. Brightline Living Co. product data. Specifications may change without notice.', 40, 742, { width: 532, align: 'center' });
}

// ---------- Oakhaven spreadsheet (deliberately messy) ----------
async function merriamXlsx() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'tom';
  const s = wb.addWorksheet('Sheet1');
  s.columns = [{ width: 18 }, { width: 30 }, { width: 34 }, { width: 12 }];
  const rows = [
    ['OAKHAVEN WOODWORKS - product info sheet'],
    ['Merriam dining table  (72")'],
    [],
    ['item #', 'OH-MER-DT72-NAT', 'old sku OH-MDT-72 dont use'],
    ['Name', 'Merriam Dining Table'],
    ['Lenght', '72" in', '183cm'],
    ['Width', '38 inches'],
    ['Hight', '30"'],
    ['OLD - Hight 31 in, top 1.75 in - updated 3/14 per Tom'],
    ['top thickness', '1.5 in'],
    ['Weight', '110lbs'],
    ['Matrial', 'solid white oak (top + legs)'],
    ['Finish', 'natural oak, matte'],
    ['Seats', 6, '8 w/ leaf -- N/A this model!!'],
    ['assembly', 'legs bolt on, allen key incl.'],
    ['MSRP', '$1,849'],
    ['photos', 'merriam_front.jpg, merriam_lifestyle.jpg'],
    ['ships', '2 cartons (top + legs)'],
  ];
  rows.forEach((r) => s.addRow(r));
  s.getCell('A1').font = { bold: true, size: 14 };
  s.getCell('A2').font = { italic: true, color: { argb: 'FF555555' } };
  s.getCell('C4').font = { color: { argb: 'FFC00000' } };
  s.getCell('C14').font = { bold: true, color: { argb: 'FFC00000' } };
  s.getCell('C6').font = { italic: true, color: { argb: 'FF777777' } };
  for (const c of ['A', 'B', 'C', 'D']) {
    const cell = s.getCell(c + '9');
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    cell.font = { strike: true };
  }
  ['A4', 'A5', 'A6', 'A7', 'A8', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16'].forEach((a) => (s.getCell(a).font = { bold: true }));
  s.getCell('B16').alignment = { horizontal: 'right' };

  const c = wb.addWorksheet('Copy of Sheet1');
  c.columns = [{ width: 18 }, { width: 30 }, { width: 30 }];
  [
    ['OAKHAVEN WOODWORKS - product info sheet'],
    ['Merriam dining table'],
    [],
    ['item #', 'OH-MDT-72'],
    ['Lenght', '72"'],
    ['Width', '38"'],
    ['Hight', '31 in'],
    ['top', '1.75 in'],
    ['Weight', '118 lbs?'],
    ['Matrial', 'white oak'],
    ['Seats', '6 (8 w/ leaf)'],
    ['MSRP', '$1,795'],
  ].forEach((r) => c.addRow(r));
  c.getCell('A1').font = { bold: true, size: 14 };

  const p = wb.addWorksheet('pricing (old)');
  p.columns = [{ width: 24 }, { width: 14 }, { width: 14 }, { width: 16 }];
  [
    ['pricing - 2025 DO NOT USE'],
    [],
    ['model', 'wholesale', 'msrp', 'note'],
    ['Merriam 72 (old sku)', '$880', '$1,795', 'discontinued finish'],
    ['Merriam 84 w/ leaf', '$1,040', '$2,095', 'not offered to AVH'],
    ['Rowan bookcase', '$395', '$849', ''],
  ].forEach((r) => p.addRow(r));
  p.getCell('A1').font = { bold: true, color: { argb: 'FFC00000' } };
  p.getRow(3).font = { bold: true };

  await wb.xlsx.writeFile(path.join(OUT, 'Merriam_specs_FINAL_v3 (2).xlsx'));
}

(async () => {
  await savePdf('Harlow_Accent_Chair_Spec.pdf', 'Harlow Accent Chair Specification', [(d) => northfieldSpecPage(d, HARLOW, 1, 1)]);
  await savePdf('Ashby_3-Seat_Sofa_Spec_RevB.pdf', 'Ashby 3-Seat Sofa Specification Rev B', [(d) => northfieldSpecPage(d, ASHBY, 1, 2), ashbyDrawings]);
  await savePdf('Calder_Loveseat_Data_Sheet.pdf', 'Calder Loveseat Product Data Sheet', [calderSheet]);
  await merriamXlsx();
  console.log('Spec sheets written to specs/');
})();
