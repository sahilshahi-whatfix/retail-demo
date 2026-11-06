// Alder & Vale Home storefront (port 4004): the customer-facing site on Shopify.
// It shows only Active products published to the Online Store, read live from Shopify data.
const store = require('../lib/store');
const { html, raw, esc, makeApp, money, slug } = require('../lib/util');
const { imgSrc } = require('../lib/files');
const { colorHex, detailRows, visibleOnline } = require('../lib/catalog');

const app = makeApp('Alder & Vale Home');

const DEPTS = [['Living Room', 'living-room'], ['Dining', 'dining'], ['Storage', 'storage'], ['Lighting', 'lighting'], ['Rugs', 'rugs']];

const STYLE = `
:root{--bg:#fbf8f4;--text:#2f2a25;--muted:#7a6f64;--line:#e7dfd5;--accent:#7b5a3c;--dark:#2f2a25}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 Karla,system-ui,sans-serif}
a{color:inherit;text-decoration:none}
button,input{font:inherit;color:inherit}
.banner{background:var(--dark);color:#efe6da;text-align:center;font-size:12.5px;letter-spacing:.06em;padding:7px 0}
header.top{border-bottom:1px solid var(--line);background:var(--bg)}
.hrow{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:18px 32px 10px}
.logo{font-family:"Cormorant Garamond",Georgia,serif;font-size:34px;font-weight:600;letter-spacing:.01em;text-align:center;line-height:1}
.logo small{display:block;font-family:Karla,sans-serif;font-size:10.5px;letter-spacing:.42em;color:var(--muted);margin-top:6px;font-weight:500}
.srch{display:flex;align-items:center;gap:8px;border-bottom:1px solid #cbbfb0;max-width:260px;padding:4px 2px;color:var(--muted)}
.srch input{border:0;background:transparent;outline:0;flex:1;color:var(--text)}
.util{display:flex;justify-content:flex-end;gap:22px;font-size:14px}
.util .cart{display:inline-flex;align-items:center;gap:6px}
.util .cart b{background:var(--dark);color:#fff;border-radius:10px;font-size:11px;padding:0 7px}
nav.depts{display:flex;justify-content:center;gap:34px;padding:8px 0 14px;font-size:14px;letter-spacing:.08em;text-transform:uppercase}
nav.depts a{padding-bottom:3px;border-bottom:1px solid transparent}
nav.depts a:hover,nav.depts a.on{border-bottom-color:var(--text)}
main{max-width:1280px;margin:0 auto;padding:22px 32px 70px}
.crumb{font-size:13px;color:var(--muted);margin-bottom:18px}
.crumb a:hover{text-decoration:underline}
.pdp{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:56px;align-items:start}
.gallery{display:grid;grid-template-columns:84px 1fr;gap:14px}
.thumbs{display:flex;flex-direction:column;gap:10px}
.thumbs button{border:1px solid var(--line);padding:0;background:#fff;cursor:pointer;width:84px;height:84px}
.thumbs button.on{border:1.5px solid var(--text)}
.thumbs img{width:100%;height:100%;object-fit:cover;display:block}
.mainimg{background:#fff;border:1px solid var(--line);aspect-ratio:4/3.2;display:flex;align-items:center;justify-content:center;overflow:hidden}
.mainimg img{width:100%;height:100%;object-fit:cover}
.coll{font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
h1.pn{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:46px;line-height:1.05;margin:8px 0 12px}
.price{font-size:22px;margin-bottom:22px}
.price s{color:var(--muted);font-size:17px;margin-left:8px}
.lab{font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.lab span{text-transform:none;letter-spacing:0;color:var(--muted)}
.sw{display:flex;gap:10px;margin-bottom:22px}
.sw span{width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,.15);box-shadow:0 0 0 3px var(--bg),0 0 0 4px var(--text)}
.desc{color:#4a4239;margin:0 0 24px}
.buy{display:flex;gap:12px;margin-bottom:22px}
.qty{display:flex;align-items:center;border:1px solid #cbbfb0;height:50px}
.qty button{width:40px;height:100%;border:0;background:none;cursor:pointer;font-size:18px}
.qty input{width:40px;text-align:center;border:0;background:transparent;outline:0}
.add{flex:1;height:50px;background:var(--dark);color:#fff;border:0;letter-spacing:.12em;text-transform:uppercase;font-size:13.5px;cursor:pointer}
.add:hover{background:#4a4038}
.notes{border-top:1px solid var(--line);font-size:14px}
.notes div{padding:12px 0;border-bottom:1px solid var(--line);display:flex;gap:12px}
.notes b{min-width:90px;font-weight:600}
.dims{margin-top:56px;border-top:1px solid var(--line);padding-top:34px;display:grid;grid-template-columns:320px 1fr;gap:40px}
.dims h2{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:32px;margin:0}
.dims dl{margin:0;display:grid;grid-template-columns:200px 1fr}
.dims dt,.dims dd{padding:11px 0;border-bottom:1px solid var(--line);margin:0}
.dims dt{color:var(--muted)}
.hero{position:relative;height:440px;overflow:hidden;margin-bottom:46px}
.hero img{width:100%;height:100%;object-fit:cover}
.hero .cap{position:absolute;left:56px;bottom:56px;background:rgba(251,248,244,.94);padding:28px 34px;max-width:430px}
.hero h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:42px;font-weight:500;margin:0 0 6px;line-height:1.05}
.sec-t{font-family:"Cormorant Garamond",Georgia,serif;font-size:34px;font-weight:500;margin:0 0 18px}
.pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:26px}
.card img{width:100%;aspect-ratio:1/1;object-fit:cover;background:#fff;border:1px solid var(--line);display:block}
.card .n{margin-top:10px;font-size:16px}
.card .c{font-size:13px;color:var(--muted)}
.card:hover .n{text-decoration:underline}
.msg{background:#efe6da;padding:12px 16px;margin-bottom:18px}
footer{border-top:1px solid var(--line);padding:30px 32px;text-align:center;color:var(--muted);font-size:13px}
`;

function page(title, body, active = '') {
  const db = store.read();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Karla:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${STYLE}</style></head><body>
<div class="banner">FREE WHITE-GLOVE DELIVERY ON FURNITURE OVER $999 · 30-DAY RETURNS</div>
<header class="top"><div class="hrow">
<form class="srch" action="/search" role="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg><input name="q" placeholder="Search" aria-label="Search the store"></form>
<a class="logo" href="/">Alder &amp; Vale<small>HOME</small></a>
<div class="util"><a href="/account">Account</a><a class="cart" href="/cart">Cart <b>${db.cartCount || 0}</b></a></div></div>
<nav class="depts" aria-label="Departments">${DEPTS.map(([n, s]) => `<a href="/collections/${s}" class="${active === s ? 'on' : ''}">${esc(n)}</a>`).join('')}<a href="/collections/new">New arrivals</a></nav></header>
<main>${body}</main>
<footer>© ${new Date().getFullYear()} Alder &amp; Vale Home · aldervalehome.com · Customer care 1-800-555-0142</footer></body></html>`;
}

const card = (p) => html`<a class="card" href="/products/${p.handle}"><img src="${imgSrc(p.media[0])}" alt="${p.title}"><div class="n">${p.title}</div><div class="c">${money(p.price)}</div></a>`;

app.get('/', (req, res) => {
  const db = store.read();
  const live = db.products.filter(visibleOnline).sort((a, b) => Date.parse(b.publishedAt || b.updatedAt) - Date.parse(a.publishedAt || a.updatedAt));
  res.send(page('Alder & Vale Home | Furniture and home furnishings', html`
    <section class="hero"><img src="/files/merriam_lifestyle.jpg" alt=""><div class="cap"><h2>Gather well this season</h2><p style="margin:0 0 12px;color:#4a4239">Solid wood dining, soft seating and warm light for the months indoors.</p><a href="/collections/dining" style="text-decoration:underline">Shop dining</a></div></section>
    <h2 class="sec-t">New and notable</h2><div class="pgrid">${live.map(card)}</div>`));
});

app.get('/collections/:slug', (req, res) => {
  const db = store.read();
  const dep = DEPTS.find(([, s]) => s === req.params.slug);
  let list = db.products.filter(visibleOnline);
  let name = 'New arrivals';
  if (dep) { name = dep[0]; list = list.filter((p) => p.collections.includes(dep[0])); }
  else list = list.sort((a, b) => Date.parse(b.publishedAt || b.updatedAt) - Date.parse(a.publishedAt || a.updatedAt)).slice(0, 8);
  res.send(page(`${name} | Alder & Vale Home`, html`<div class="crumb"><a href="/">Home</a> / ${name}</div><h1 class="pn" style="margin-bottom:24px">${name}</h1>
    ${list.length ? html`<div class="pgrid">${list.map(card)}</div>` : html`<p>New pieces are on their way. Check back soon.</p>`}`, req.params.slug));
});

app.get('/search', (req, res) => {
  const db = store.read();
  const q = String(req.query.q || '').toLowerCase();
  const list = db.products.filter(visibleOnline).filter((p) => [p.title, p.type, p.color, p.description].join(' ').toLowerCase().includes(q));
  res.send(page(`Search: ${req.query.q || ''} | Alder & Vale Home`, html`<div class="crumb"><a href="/">Home</a> / Search</div><h1 class="pn" style="font-size:36px">Results for “${req.query.q || ''}”</h1>
    ${list.length ? html`<div class="pgrid">${list.map(card)}</div>` : html`<p>No products match your search.</p>`}`));
});

app.get('/products/:handle', (req, res) => {
  const db = store.read();
  const p = db.products.find((x) => x.handle === req.params.handle);
  const preview = req.query.preview === '1';
  if (!p || (!visibleOnline(p) && !preview)) {
    return res.status(404).send(page('Page not found | Alder & Vale Home', html`<h1 class="pn">This page isn’t available</h1><p>The product may no longer be sold online. <a href="/" style="text-decoration:underline">Continue shopping</a></p>`));
  }
  const dept = DEPTS.find(([n]) => p.collections.includes(n));
  const sub = p.collections.find((c) => !DEPTS.some(([n]) => n === c)) || p.type;
  const delivery = /sofa|loveseat|chair|table|bookcase/i.test(p.type) ? 'White-glove delivery in 2 to 3 weeks. We bring it to the room of your choice and remove the packaging.' : 'Ships in 3 to 5 business days by standard parcel delivery.';
  res.send(page(`${p.title} | Alder & Vale Home`, html`
    ${preview && !visibleOnline(p) ? html`<div class="msg">Preview of an unpublished product. Customers can’t see this page yet.</div>` : ''}
    ${req.query.added ? html`<div class="msg" role="status">Added to your cart.</div>` : ''}
    <div class="crumb"><a href="/">Home</a> / ${dept ? html`<a href="/collections/${dept[1]}">${dept[0]}</a> / ` : ''}${sub ? html`${sub} / ` : ''}${p.title}</div>
    <div class="pdp">
      <div class="gallery">
        <div class="thumbs">${p.media.map((m, i) => html`<button type="button" class="${i === 0 ? 'on' : ''}" onclick="show(${i})" aria-label="Show image ${i + 1}"><img src="${imgSrc(m)}" alt=""></button>`)}</div>
        <div class="mainimg"><img id="main" src="${imgSrc(p.media[0])}" alt="${p.title}${p.color ? ' in ' + p.color : ''}" data-file="${p.media[0] || ''}"></div>
      </div>
      <div>
        <div class="coll">${sub ? sub : 'Collection'}</div>
        <h1 class="pn">${p.title}</h1>
        <div class="price">${money(p.price)}${p.compareAt ? html`<s>${money(p.compareAt)}</s>` : ''}</div>
        ${p.color ? html`<div class="lab">Color: <span>${p.color}</span></div><div class="sw"><span style="background:${colorHex(p.color)}" title="${p.color}"></span></div>` : ''}
        <p class="desc">${p.description}</p>
        <form class="buy" method="post" action="/cart/add"><input type="hidden" name="handle" value="${p.handle}">
          <div class="qty"><button type="button" onclick="q(-1)" aria-label="Decrease quantity">−</button><input id="qty" name="qty" value="1" aria-label="Quantity"><button type="button" onclick="q(1)" aria-label="Increase quantity">+</button></div>
          <button class="add">Add to cart</button></form>
        <div class="notes"><div><b>Delivery</b><span>${delivery}</span></div><div><b>Returns</b><span>Return within 30 days in original condition. Free returns on furniture.</span></div></div>
      </div>
    </div>
    <section class="dims"><h2>Dimensions and details</h2><dl>${detailRows(p).map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl></section>
    ${raw(`<script>const media=${JSON.stringify(p.media.map(imgSrc))};function show(i){const m=document.getElementById('main');m.src=media[i];document.querySelectorAll('.thumbs button').forEach((b,j)=>b.classList.toggle('on',i===j));}
    function q(d){const e=document.getElementById('qty');e.value=Math.max(1,(parseInt(e.value)||1)+d);}</script>`)}`, dept && dept[1]));
});

app.post('/cart/add', (req, res) => {
  const n = Math.max(1, parseInt(req.body.qty, 10) || 1);
  store.update((d) => { d.cartCount = (d.cartCount || 0) + n; });
  res.redirect(`/products/${encodeURIComponent(req.body.handle)}?added=1`);
});

app.get('/cart', (req, res) => {
  const db = store.read();
  res.send(page('Cart | Alder & Vale Home', html`<h1 class="pn">Your cart</h1><p>${db.cartCount ? `${db.cartCount} item${db.cartCount > 1 ? 's' : ''} in your cart. Checkout is unavailable in this demo.` : 'Your cart is empty.'}</p>`));
});
app.get('/account', (req, res) => res.send(page('Account | Alder & Vale Home', html`<h1 class="pn">Account</h1><p>Sign in to see your orders.</p>`)));

module.exports = app;
