// Starts all seven demo apps.
// Locally each app gets its own port (4001 to 4007). On Render (or with
// SINGLE_SERVER=1) they all run on one port, each under a path prefix.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { PORTS, PREFIX, SINGLE, LOCAL } = require('./lib/realurl');
const { prefixer } = require('./lib/prefix');
require('./lib/store').read(); // creates the store from the seed on first run

const APPS = [
  ['Mail', 'mail', './apps/mail'],
  ['Oracle Retail Merchandising', 'merch', './apps/merch'],
  ['Shopify admin', 'cartify', './apps/cartify'],
  ['Alder & Vale Home storefront', 'store', './apps/storefront'],
  ['Amazon (Seller Central + listings)', 'market', './apps/marketplace'],
  ['Google Sheets (Seek audit log)', 'sheets', './apps/sheets'],
  ['Gmail (Noah Bennett)', 'noahmail', './apps/mail-noah'],
];

if (!fs.existsSync(path.join(__dirname, 'specs', 'Harlow_Accent_Chair_Spec.pdf'))) {
  console.warn('Spec sheets are missing. Run: npm run build:specs');
}

const loaded = [];
for (const [label, key, mod] of APPS) {
  if (!fs.existsSync(path.join(__dirname, mod + '.js'))) continue;
  const app = require(mod);
  app.use((req, res) => res.status(404).send(`<!doctype html><meta charset="utf-8"><title>Page not found</title><body style="font:15px system-ui,sans-serif;padding:40px"><h2>Page not found</h2><p>${label} has no page at <b>${req.path.replace(/[<>&"]/g, '')}</b>.</p><p><a href="/">Go to the ${label} home page</a></p></body>`));
  app.use((err, req, res, next) => {
    console.error(`[${label}]`, err);
    res.status(500).send('Something went wrong. Check the server log.');
  });
  loaded.push([label, key, app]);
}

if (SINGLE) {
  const front = express();
  front.disable('x-powered-by');
  front.get('/healthz', (req, res) => res.send('ok'));
  for (const [, key, app] of loaded) front.use(PREFIX[key], prefixer(PREFIX[key]), app);
  const reset = (mode) => `${LOCAL.mail}/__reset${mode ? '?mode=' + mode : ''}`;
  front.get('/', (req, res) => res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Seek demo apps</title><style>body{font:15px system-ui,sans-serif;margin:40px auto;max-width:720px;padding:0 16px;color:#1f1f1f}a{color:#0b57d0}td{padding:6px 16px 6px 0}</style></head><body>
<h1>Seek demo apps: Alder &amp; Vale Home</h1><table>${loaded.map(([label, key]) => `<tr><td>${label}</td><td><a href="${LOCAL[key]}/">${LOCAL[key]}/</a></td></tr>`).join('')}</table>
<p>Reset demo data: <a href="${reset()}">both requests already in Seek's inbox</a> · <a href="${reset('noah')}">Noah sends them on camera</a></p></body></html>`));
  front.use((req, res) => res.status(404).send('<!doctype html><meta charset="utf-8"><title>Page not found</title><body style="font:15px system-ui;padding:40px"><h2>Page not found</h2><p><a href="/">See all demo apps</a></p>'));
  const port = Number(process.env.PORT) || 10000;
  front.listen(port, () => {
    console.log(`Seek demo apps on port ${port}`);
    for (const [label, key] of loaded) console.log(`${label.padEnd(36)} ${LOCAL[key]}/`);
  });
} else {
  for (const [label, key, app] of loaded) app.listen(PORTS[key], () => console.log(`${label.padEnd(30)} http://localhost:${PORTS[key]}`));
}
console.log('Reset demo data any time: npm run reset, or open /__reset on any app.');
