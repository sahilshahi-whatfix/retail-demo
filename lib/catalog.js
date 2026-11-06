// Shared product presentation helpers for Shopify and its storefront.
const COLOR_HEX = {
  oatmeal: '#d9cdb8', slate: '#6b7177', 'slate grey': '#6b7177', navy: '#26324f', 'natural oak, matte': '#c9a274', 'natural oak': '#c9a274',
  walnut: '#6b4a32', 'brushed brass': '#b08d57', 'charcoal and cream': '#55524d', sand: '#d8c7a8', 'linen shade, stone base': '#d6cfc2',
};
const colorHex = (c) => COLOR_HEX[String(c || '').toLowerCase()] || '#b9b2a8';

const fmtIn = (v) => (v === null || v === undefined || v === '' ? null : `${v} in`);

// "Dimensions and details" rows for a product, in display order.
function detailRows(p) {
  const rows = [];
  if (p.width != null && p.depth != null && p.height != null) rows.push(['Dimensions', `${p.width} W x ${p.depth} D x ${p.height} H in`]);
  if (p.seatHeight != null) rows.push(['Seat height', fmtIn(p.seatHeight)]);
  if (p.weight != null) rows.push(['Weight', `${p.weight} lb`]);
  if (p.capacity != null) rows.push(['Weight capacity', `${p.capacity} lb`]);
  if (p.color) rows.push(['Color', p.color]);
  if (p.materials) rows.push(['Materials', p.materials]);
  if (p.assembly) rows.push(['Assembly', p.assembly]);
  if (p.care) rows.push(['Care', p.care]);
  if (p.sku) rows.push(['Item number', p.sku]);
  return rows;
}

const visibleOnline = (p) => p.status === 'active' && p.channels && p.channels.online;

module.exports = { colorHex, detailRows, visibleOnline };
