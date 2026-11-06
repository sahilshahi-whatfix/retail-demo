// Builds "(Render)" editions of the SOP PDFs, with every http://localhost:400N
// address replaced by the Render address of that app.
// Usage: node scripts/build-render-sops.js https://<service>.onrender.com
// Needs Google Chrome installed (macOS path below) to print the PDFs.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE = String(process.argv[2] || '').replace(/\/+$/, '');
if (!/^https?:\/\/\S+$/.test(BASE)) {
  console.error('Usage: node scripts/build-render-sops.js https://<service>.onrender.com');
  process.exit(1);
}
const PREFIX = { 4001: '/gmail', 4002: '/oracle', 4003: '/shopify', 4004: '/store', 4005: '/amazon', 4006: '/sheets', 4007: '/noah-gmail' };
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DOCS = path.join(__dirname, '..', 'docs');
const SOPS = [
  ['sop-new-product-setup.html', 'SOP New Product Setup from Supplier Spec Sheets (Render).pdf'],
  ['seek-run-sheet-new-items.html', 'Seek run sheet - New item setup (Render).pdf'],
  ['sop-live-product-audit.html', 'SOP Live Product Page Audit Against Spec Sheets (Render).pdf'],
];

for (const [src, out] of SOPS) {
  let html = fs.readFileSync(path.join(DOCS, src), 'utf8');
  html = html.replace(/http:\/\/localhost:(400[1-7])/g, (m, port) => BASE + PREFIX[port]);
  const tmp = path.join(DOCS, `.render-${src}`);
  fs.writeFileSync(tmp, html);
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000',
      `--print-to-pdf=${path.join(DOCS, out)}`, 'file://' + tmp], { stdio: 'ignore' });
  } finally {
    fs.unlinkSync(tmp);
  }
  console.log('Wrote docs/' + out);
}
