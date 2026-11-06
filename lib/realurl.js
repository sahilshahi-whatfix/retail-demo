// Where each demo app lives, and how its links are shown.
//
// Two ways to run:
// - Ports (local default): each app on its own port, http://localhost:4001 ... 4007.
// - Single server (Render, or SINGLE_SERVER=1): every app under a path prefix on
//   one address, e.g. https://<service>.onrender.com/oracle/items/...
//
// Links in the demo show the company's real-looking web addresses
// (merch.aldervalehome.com, admin.shopify.com, amazon.com, docs.google.com...)
// while clicking them opens the matching demo app.
//   toReal(url):  demo address -> real-looking address (for display and storage)
//   toLocal(url): real-looking address -> demo address (for href)
// Anything that does not match is returned unchanged.

const PORTS = { mail: 4001, merch: 4002, cartify: 4003, store: 4004, market: 4005, sheets: 4006, noahmail: 4007 };
const PREFIX = { mail: '/gmail', merch: '/oracle', cartify: '/shopify', store: '/store', market: '/amazon', sheets: '/sheets', noahmail: '/noah-gmail' };
const SINGLE = !!(process.env.RENDER || process.env.SINGLE_SERVER);
const BASE = String(process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 10000}`).replace(/\/+$/, '');
// The address each app is reached at, without a trailing slash.
const LOCAL = Object.fromEntries(Object.keys(PORTS).map((k) => [k, SINGLE ? BASE + PREFIX[k] : `http://localhost:${PORTS[k]}`]));
// Local port addresses always count too, so links typed from older docs still map.
const PORT_BASES = Object.fromEntries(Object.keys(PORTS).map((k) => [k, `http://localhost:${PORTS[k]}`]));

const SHOP = '/store/alder-vale-home';
// Google Sheets document ids for the two demo spreadsheets.
const SHEET_IDS = { log: '1Qm7vXc2Rk9LpT4wZs8NaYh3Bd6FjE0uGi5oKr2VtHw', list: '1Bf3kWn8Yp2TzR6qLx9MdC4vHs7JgA1eUo5iNc0QwPa' };

// Which app a demo address belongs to, and the path within that app.
function localApp(url) {
  const u = String(url || '').trim().replace(/^http:\/\/127\.0\.0\.1:/i, 'http://localhost:');
  for (const bases of [LOCAL, PORT_BASES]) {
    for (const k of Object.keys(bases)) {
      const b = bases[k];
      if (u.toLowerCase().startsWith(b.toLowerCase()) && /^([/?#]|$)/.test(u.slice(b.length))) {
        const rest = u.slice(b.length);
        return { key: k, path: rest.startsWith('/') ? rest : '/' + rest };
      }
    }
  }
  return null;
}

function toReal(url) {
  const m = localApp(url);
  if (!m) return url;
  const p = m.path;
  if (m.key === 'merch') return 'https://merch.aldervalehome.com' + p;
  if (m.key === 'cartify') return 'https://admin.shopify.com' + SHOP + (p === '/' ? '' : p);
  if (m.key === 'store') return 'https://aldervalehome.com' + p;
  if (m.key === 'market') {
    if (/^\/seller\/listings(?=[/?#]|$)/.test(p)) return 'https://sellercentral.amazon.com/inventory' + p.slice('/seller/listings'.length);
    if (/^\/seller(?=[/?#]|$)/.test(p)) return 'https://sellercentral.amazon.com' + (p.slice('/seller'.length) || '/home');
    return 'https://www.amazon.com' + p;
  }
  if (m.key === 'sheets') return 'https://docs.google.com' + (p === '/' ? '/spreadsheets/d/' + SHEET_IDS.log + '/edit' : p);
  return url;
}

function toLocal(url) {
  const m = /^https?:\/\/([^/\s?#]+)(\/[^\s]*)?$/i.exec(String(url || '').trim());
  if (!m) return url;
  const host = m[1].toLowerCase();
  const p = m[2] || '/';
  if (host === 'merch.aldervalehome.com') return LOCAL.merch + p;
  if (host === 'admin.shopify.com') return LOCAL.cartify + (p.startsWith(SHOP) ? p.slice(SHOP.length) || '/' : p);
  if (host === 'aldervalehome.com' || host === 'www.aldervalehome.com' || host === 'alder-vale-home.myshopify.com') return LOCAL.store + p;
  if (host === 'sellercentral.amazon.com') {
    if (/^\/inventory(?=[/?#]|$)/.test(p)) return LOCAL.market + '/seller/listings' + p.slice('/inventory'.length);
    if (p === '/' || p === '/home') return LOCAL.market + '/seller';
    return LOCAL.market + '/seller' + p;
  }
  if (host === 'amazon.com' || host === 'www.amazon.com') return LOCAL.market + p;
  if (host === 'docs.google.com') return LOCAL.sheets + p;
  return url;
}

// Rewrites every demo address inside a block of text to its real-looking form.
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BASE_RE = new RegExp(`(?:https?://(?:localhost|127\\.0\\.0\\.1):\\d+|${[...new Set(Object.values(LOCAL))].map(escRe).join('|')})[^\\s<>"']*`, 'gi');
const realifyText = (s) => String(s || '').replace(BASE_RE, (u) => {
  const tail = /[.,;:!?)]+$/.exec(u);
  const core = tail ? u.slice(0, -tail[0].length) : u;
  return toReal(core) + (tail ? tail[0] : '');
});

// Address of a page in one of the demo apps, e.g. appUrl('merch', '/items/X').
const appUrl = (key, p = '/') => LOCAL[key] + p;

// The same functions, as source text for pages that need them in the browser.
const CLIENT_JS = `/*no-prefix*/const LOCAL = ${JSON.stringify(LOCAL)}, PORT_BASES = ${JSON.stringify(PORT_BASES)}, SHOP = ${JSON.stringify(SHOP)}, SHEET_IDS = ${JSON.stringify(SHEET_IDS)};
${localApp.toString()}
${toReal.toString()}
${toLocal.toString()}
/*end-no-prefix*/`;

module.exports = { PORTS, PREFIX, SINGLE, BASE, LOCAL, SHEET_IDS, appUrl, toReal, toLocal, realifyText, CLIENT_JS };
