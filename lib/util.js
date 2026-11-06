// Small helpers shared by every app.
const express = require('express');
const store = require('./store');

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Tagged template that escapes interpolations unless they are wrapped with raw().
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
const raw = (s) => new Raw(s);
function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) out += render(vals[i]);
  });
  return raw(out);
}
function render(v) {
  if (v === null || v === undefined || v === false) return '';
  if (Array.isArray(v)) return v.map(render).join('');
  if (v instanceof Raw) return v.s;
  return esc(v);
}

const { PORTS, appUrl } = require('./realurl');
const url = (app, p = '/') => appUrl(app, p);

const money = (n, cents = true) =>
  n === null || n === undefined || n === '' || isNaN(Number(n))
    ? ''
    : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const num = (v) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function fmtDate(iso, opts = { month: 'short', day: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-US', opts);
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + fmtTime(iso);
}
function isToday(iso) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

// Express app with body parsing, the hidden reset URL and shared files.
function makeApp(name) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(express.json({ limit: '5mb' }));
  app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/__reset', (req, res) => {
    const mode = req.query.mode === 'noah' ? 'noah' : 'default';
    store.reset(mode);
    res.send(`<!doctype html><meta charset="utf-8"><title>Reset</title><body style="font:15px system-ui;padding:40px">
      <h2>Demo data reset</h2><p>All apps are back to the starting state for both stories${mode === 'noah' ? `: Noah’s two requests are not written yet; compose and send them from Noah’s Gmail (${url('noahmail')})` : ''}.</p>
      <p><a href="/">Back to ${esc(name)}</a></p></body>`);
  });
  require('./files').mount(app);
  return app;
}

// Whatfix in-app guidance (Smart Tips, self-help), loaded on the business apps:
// Oracle Retail Merchandising, Shopify admin and Amazon Seller Central.
// Content shown is managed in Whatfix Studio. Start with WHATFIX=off to leave it out.
const WHATFIX_SRC = 'https://cdn.whatfix.com/prod/e7817f15-91df-440e-906c-959e507b7b6d/initiator/initiator.nocache.js';
const whatfixTag = () => (process.env.WHATFIX === 'off' ? '' : `<script language="javascript" async="true" type="text/javascript" src="${WHATFIX_SRC}"></script>`);

module.exports = { whatfixTag, esc, html, raw, render, PORTS, url, money, slug, num, fmtTime, fmtDate, fmtDateTime, isToday, makeApp };
