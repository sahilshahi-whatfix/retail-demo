// Simulated integration: releasing an item in Oracle Retail Merchandising creates
// (or refreshes) a draft product in Shopify. Nothing syncs to the marketplace.
const { slug } = require('./util');
const { hierarchy } = require('./seed');

function className(dept, cls) {
  const d = hierarchy.find((h) => h.dept === dept);
  const c = d && d.classes.find(([code]) => code === cls);
  return { dept: d ? d.name : '', cls: c ? c[1] : '' };
}

const COLLECTION_FOR_DEPT = { '410': 'Living Room', '420': 'Dining', '440': 'Storage', '450': 'Lighting', '460': 'Rugs' };

function describe(item) {
  if (item.onlineDescription) return item.onlineDescription;
  const parts = [`The ${item.description} in ${item.color}.`];
  if (item.materials) parts.push(item.materials.replace(/;/g, ',') + '.');
  if (item.assembly) parts.push(item.assembly + '.');
  return parts.join(' ');
}

function releaseToShopify(db, item, by) {
  const now = new Date().toISOString();
  const supplier = db.suppliers.find((s) => s.id === item.supplierId);
  const names = className(item.dept, item.cls);
  const fields = {
    title: item.description,
    sku: item.code,
    upc: item.upc || '',
    description: describe(item),
    media: item.images.filter((i) => !i.startsWith('art:')).length ? item.images.filter((i) => !i.startsWith('art:')) : item.images.slice(),
    price: item.retail,
    cost: item.cost,
    type: names.cls,
    vendor: supplier ? supplier.name : '',
    collections: [COLLECTION_FOR_DEPT[item.dept], names.cls].filter(Boolean),
    color: item.color,
    width: item.width, depth: item.depth, height: item.height, seatHeight: item.seatHeight,
    weight: item.weight, capacity: item.capacity,
    materials: item.materials, assembly: item.assembly, care: item.care,
    sourceCode: item.code,
  };
  let p = db.products.find((x) => x.sourceCode === item.code);
  if (p) {
    Object.assign(p, fields, { updatedAt: now });
    p.activity.push({ at: now, by: 'Shopify', text: 'Product data updated by Oracle Retail Connector' });
  } else {
    let handle = slug(item.description);
    if (db.products.some((x) => x.handle === handle)) handle += '-' + slug(item.code);
    p = {
      id: Math.max(...db.products.map((x) => x.id)) + 1,
      handle, status: 'draft', channels: { online: false, mobile: false }, compareAt: null, tags: [],
      inventory: [{ location: 'Main warehouse', qty: 20 }],
      createdAt: now, updatedAt: now, ...fields,
      activity: [{ at: now, by: 'Shopify', text: `Draft created by Oracle Retail Connector (released by ${by})` }],
    };
    db.products.push(p);
  }
  return p;
}

module.exports = { releaseToShopify, className, COLLECTION_FOR_DEPT };
