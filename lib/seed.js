const { SHEET_IDS } = require('./realurl');
// Starting state for both demo stories. Dates are relative to the day the
// store is reset, so the inbox always reads as "today".

function at(daysAgo, h, m) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function onDate(y, mo, day, h, m) {
  return new Date(y, mo - 1, day, h, m).toISOString();
}
// Date line in a forwarded message, as Gmail writes it.
function fwdDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const ME = { name: 'Seek', email: 'seek.agent@whatfix.com' };
const NOAH = { name: 'Noah Bennett', email: 'noah.bennett@aldervalehome.com', org: 'Catalog Manager, Alder & Vale Home' };
const DANA = { name: 'Dana Ruiz', email: 'd.ruiz@northfieldupholstery.com', org: 'Northfield Upholstery Co.' };
const BRIGHTLINE = { name: 'Brightline Living Co.', email: 'productdata@brightlineliving.com' };
const TOM = { name: 'Tom', email: 'tom@oakhavenwoodworks.com', org: 'Oakhaven Woodworks' };

const suppliers = [
  { id: '20512', name: 'Northfield Upholstery Co.', contact: 'Dana Ruiz', email: DANA.email, site: 'northfieldupholstery.com', city: 'Greensboro, NC', terms: 'Net 60', items: 41 },
  { id: '20418', name: 'Brightline Living Co.', contact: 'Product data team', email: BRIGHTLINE.email, site: 'brightlineliving.com', city: 'High Point, NC', terms: 'Net 45', items: 28 },
  { id: '20391', name: 'Oakhaven Woodworks', contact: 'Tom', email: TOM.email, site: '', city: 'Hickory, NC', terms: 'Net 30', items: 17 },
  { id: '20455', name: 'Lanterne Lighting Co.', contact: 'Orders desk', email: 'orders@lanternelighting.com', site: '', city: 'Dallas, TX', terms: 'Net 45', items: 33 },
  { id: '20467', name: 'Weaverly Rug Studio', contact: 'Wholesale team', email: 'wholesale@weaverlyrugs.com', site: '', city: 'Dalton, GA', terms: 'Net 30', items: 52 },
];

const hierarchy = [
  { dept: '410', name: 'Upholstered Seating', classes: [['12', 'Sofas and Loveseats'], ['14', 'Accent Chairs'], ['18', 'Occasional Tables'], ['20', 'Ottomans']] },
  { dept: '420', name: 'Dining', classes: [['05', 'Dining Tables']] },
  { dept: '440', name: 'Storage', classes: [['07', 'Bookcases']] },
  { dept: '450', name: 'Lighting', classes: [['03', 'Floor Lamps'], ['04', 'Table Lamps']] },
  { dept: '460', name: 'Rugs', classes: [['02', 'Area Rugs']] },
];

function messages() {
  return [
    {
      id: 'm-newitems', folder: 'inbox', read: false, starred: false, date: at(0, 9, 5),
      from: NOAH, to: [ME], cc: [],
      subject: 'Fwd: New items: Harlow Accent Chair and Ashby 3-Seat Sofa, spec sheets attached',
      body:
`Hi Seek,

Please set up these two new items from Northfield and publish them on our website and on Amazon. Dana's email is below, with the spec sheets and photos attached. Retail price as per MSRP.

Send me the links once they're live.

Thanks,
Noah

---------- Forwarded message ---------
From: Dana Ruiz <${DANA.email}>
Date: ${fwdDate(at(1, 16, 12))}
Subject: New items: Harlow Accent Chair and Ashby 3-Seat Sofa, spec sheets attached
To: Noah Bennett <${NOAH.email}>

Hi Noah,

Please find attached the spec sheets and product photos for two new items:

1. Harlow Accent Chair in Oatmeal boucle (item code NF-HAR-AC-OAT). The front and side photos are on a white background, so they are ready for marketplace use. The lifestyle shot is for your website.

2. Ashby 3-Seat Sofa in Slate (item code NF-ASH-3S-SLT). This is the Rev B spec sheet: page 1 has the specifications and dimension table, and page 2 has the front, side and top view drawings. Two product photos are attached as well.

Wholesale cost, MSRP and lead time are on page 1 of each spec sheet. Both ship from our Greensboro warehouse.

Best,
Dana Ruiz
Account Manager, Northfield Upholstery Co.`,
      attachments: ['Harlow_Accent_Chair_Spec.pdf', 'harlow_front.jpg', 'harlow_side.jpg', 'harlow_lifestyle.jpg', 'Ashby_3-Seat_Sofa_Spec_RevB.pdf', 'ashby_front.jpg', 'ashby_angle.jpg'],
    },
    {
      id: 'm-audit', folder: 'inbox', read: false, starred: false, date: at(0, 8, 30),
      from: NOAH, to: [ME], cc: [],
      subject: "This week's catalog audit: 2 products",
      body:
`Hi Seek,

This week's catalog audit list is ready: two live products, with links to their website and Amazon pages and to the spec sheets in Oracle.

https://docs.google.com/spreadsheets/d/${SHEET_IDS.list}/edit

Please work through the sheet and fill in the result columns, fix anything that is clearly wrong, then reply to this email with what you found.

Thanks,
Noah

Noah Bennett
Catalog Manager, Alder & Vale Home`,
      attachments: [],
    },
    {
      id: 'm-access', folder: 'inbox', read: true, starred: false, date: at(1, 11, 20),
      from: { name: 'Alder & Vale IT Service Desk', email: 'it.servicedesk@aldervalehome.com' }, to: [ME], cc: [NOAH],
      subject: 'Your system access is ready',
      body:
`Hi Seek,

Your access for catalog work is set up:

- Oracle Retail Merchandising: Item Coordinator
- Shopify admin: Products (create, edit, publish)
- Amazon Seller Central: Inventory (add and edit listings)
- Google Sheets: Seek audit log (edit)

Noah Bennett is your point of contact for catalog requests.

Thanks,
IT Service Desk
Alder & Vale Home`,
      attachments: [],
    },
    {
      id: 'm-calder-archive', folder: 'archive', read: true, starred: false, date: onDate(2026, 3, 12, 10, 4),
      from: BRIGHTLINE, to: [ME], cc: [],
      subject: 'Calder Loveseat product data sheet',
      body:
`Hello Alder & Vale Home,

Attached is the product data sheet for the Calder Loveseat in Slate Grey (BL-CAL-LS-SLT), together with the three approved product images.

Please use only the approved images listed on the data sheet for this colorway.

Kind regards,
Product Data Team
Brightline Living Co.
brightlineliving.com`,
      attachments: ['Calder_Loveseat_Data_Sheet.pdf', 'calder_slate_front.jpg', 'calder_slate_side.jpg', 'calder_lifestyle.jpg'],
    },
    {
      id: 'm-merriam-archive', folder: 'archive', read: true, starred: false, date: onDate(2026, 9, 22, 15, 47),
      from: TOM, to: [ME], cc: [],
      subject: 'merriam specs attached',
      body:
`hey,

merriam specs attached, this is the final one (ignore the earlier version). 2 pics too.

let me know if u need anything else

tom
Oakhaven Woodworks`,
      attachments: ['Merriam_specs_FINAL_v3 (2).xlsx', 'merriam_front.jpg', 'merriam_lifestyle.jpg'],
    },
  ];
}

function hist(date, by, text) { return { at: date, by, text }; }

function items() {
  const base = { brand: 'Alder & Vale Home', care: '', leadTime: '', onlineDescription: '', upc: '', supplierItem: '', holdNote: '', attachments: [], images: [] };
  return [
    {
      ...base, code: 'BL-CAL-LS-SLT', description: 'Calder Loveseat', supplierId: '20418', supplierItem: 'CAL-LS-SG', dept: '410', cls: '12',
      color: 'Slate Grey', width: 62, depth: 36, height: 33, seatHeight: 19, weight: 96, capacity: 500,
      materials: 'Polyester performance weave; 2 loose back cushions; oak legs, walnut stain', assembly: 'Screw-in legs, no tools',
      care: 'Spot clean with a water-based cleaner. Vacuum regularly.', cost: 640, retail: 1299, leadTime: '4 to 6 weeks',
      onlineDescription: 'A compact loveseat with a relaxed, rounded profile, upholstered in a durable slate grey performance weave. Two loose back cushions and oak legs in a walnut stain.',
      images: ['calder_slate_front.jpg', 'calder_slate_side.jpg', 'calder_lifestyle.jpg'], attachments: ['Calder_Loveseat_Data_Sheet.pdf'],
      status: 'Released', createdAt: onDate(2026, 3, 13, 9, 20), updatedAt: onDate(2026, 3, 18, 14, 2),
      history: [hist(onDate(2026, 3, 13, 9, 20), 'K. Osei', 'Item created'), hist(onDate(2026, 3, 16, 11, 5), 'K. Osei', 'Approved'), hist(onDate(2026, 3, 18, 14, 2), 'K. Osei', 'Released to Shopify')],
    },
    {
      ...base, code: 'OH-MER-DT72-NAT', description: 'Merriam Dining Table', supplierId: '20391', supplierItem: 'MER-72', dept: '420', cls: '05',
      color: 'Natural oak, matte', width: 72, depth: 38, height: 30, seatHeight: null, weight: 110, capacity: null,
      materials: 'Solid white oak top and legs; top 1.5 in thick; seats 6', assembly: 'Legs bolt on, Allen key included',
      care: 'Wipe with a soft, damp cloth. Use coasters and trivets.', cost: null, retail: 1849, leadTime: '6 to 8 weeks',
      onlineDescription: 'A generous dining table in solid white oak with a natural matte finish. The 1.5 inch top and tapered legs seat six comfortably.',
      images: ['merriam_front.jpg', 'merriam_lifestyle.jpg'], attachments: ['Merriam_specs_FINAL_v3 (2).xlsx'],
      status: 'Released', createdAt: onDate(2026, 9, 23, 10, 0), updatedAt: onDate(2026, 9, 29, 16, 40),
      history: [hist(onDate(2026, 9, 23, 10, 0), 'K. Osei', 'Item created'), hist(onDate(2026, 9, 29, 16, 31), 'K. Osei', 'Approved'), hist(onDate(2026, 9, 29, 16, 40), 'K. Osei', 'Released to Shopify')],
    },
    {
      ...base, code: 'OH-ROW-BC-WAL', description: 'Rowan Open Bookcase', supplierId: '20391', dept: '440', cls: '07',
      color: 'Walnut', width: 36, depth: 14, height: 72, weight: 64, materials: 'Walnut veneer over solid wood frame; 4 fixed shelves', assembly: 'Wall anchor included',
      cost: 410, retail: 899, images: ['art:bookcase'], status: 'Released', createdAt: at(6, 9, 15), updatedAt: at(2, 15, 10),
      history: [hist(at(6, 9, 15), 'K. Osei', 'Item created'), hist(at(2, 15, 4), 'K. Osei', 'Approved'), hist(at(2, 15, 10), 'K. Osei', 'Released to Shopify')],
    },
    {
      ...base, code: 'BL-WRN-ST-OAK', description: 'Wren Nesting Side Tables, set of 2', supplierId: '20418', dept: '410', cls: '18',
      color: 'Natural oak', width: 22, depth: 18, height: 22, weight: 31, materials: 'Oak veneer; solid oak legs', assembly: 'No assembly',
      cost: 150, retail: 349, images: ['art:tables'], status: 'On hold', holdNote: 'Finish sample from Brightline is darker than the approved swatch. Waiting for a new sample before approval.',
      createdAt: at(9, 13, 40), updatedAt: at(3, 10, 22),
      history: [hist(at(9, 13, 40), 'J. Park', 'Item created'), hist(at(3, 10, 22), 'J. Park', 'Put on hold: finish sample darker than approved swatch')],
    },
    {
      ...base, code: 'NF-TAM-OT-SND', description: 'Tamsin Storage Ottoman', supplierId: '20512', dept: '410', cls: '20',
      color: 'Sand', width: 36, depth: 18, height: 18, seatHeight: 18, weight: 29, capacity: 250, materials: 'Polyester linen-look weave; hinged lid; pine frame', assembly: 'No assembly',
      cost: 128, retail: 299, images: ['art:ottoman'], status: 'Submitted', createdAt: at(4, 11, 0), updatedAt: at(1, 17, 12),
      history: [hist(at(4, 11, 0), 'K. Osei', 'Item created'), hist(at(1, 17, 12), 'K. Osei', 'Submitted for approval')],
    },
    {
      ...base, code: 'LT-INE-TL-LIN', description: 'Ines Ceramic Table Lamp', supplierId: '20455', dept: '450', cls: '04',
      color: 'Linen shade, stone base', width: 15, depth: 15, height: 26, weight: null, materials: 'Ceramic base; linen shade', assembly: '',
      cost: 72, retail: 189, images: ['art:tablelamp'], status: 'Worksheet', createdAt: at(1, 10, 30), updatedAt: at(1, 10, 30),
      history: [hist(at(1, 10, 30), 'J. Park', 'Item created')],
    },
    {
      ...base, code: 'LT-LIN-FL-BRS', description: 'Linden Arc Floor Lamp', supplierId: '20455', dept: '450', cls: '03',
      color: 'Brushed brass', width: 40, depth: 14, height: 76, weight: 22, materials: 'Steel with brushed brass finish; linen shade; marble base', assembly: 'Arm and shade attach, no tools',
      cost: 170, retail: 429, images: ['art:floorlamp'], status: 'Released', createdAt: onDate(2026, 8, 4, 9, 0), updatedAt: onDate(2026, 8, 11, 12, 0),
      history: [hist(onDate(2026, 8, 4, 9, 0), 'J. Park', 'Item created'), hist(onDate(2026, 8, 11, 12, 0), 'J. Park', 'Released to Shopify')],
    },
    {
      ...base, code: 'WV-SAB-RG-810', description: 'Sable Wool Area Rug, 8 x 10', supplierId: '20467', dept: '460', cls: '02',
      color: 'Charcoal and cream', width: 96, depth: 120, height: 0.5, weight: 48, materials: '100% wool pile; cotton backing', assembly: 'No assembly',
      cost: 480, retail: 1199, images: ['art:rug'], status: 'Released', createdAt: onDate(2026, 7, 14, 9, 0), updatedAt: onDate(2026, 7, 21, 12, 0),
      history: [hist(onDate(2026, 7, 14, 9, 0), 'J. Park', 'Item created'), hist(onDate(2026, 7, 21, 12, 0), 'J. Park', 'Released to Shopify')],
    },
  ];
}

function act(date, text, by = 'Shopify') { return { at: date, by, text }; }

function products() {
  const base = { compareAt: null, upc: '', tags: [], seatHeight: null, capacity: null, care: '', channels: { online: true, mobile: true }, inventory: [{ location: 'Main warehouse', qty: 0 }] };
  return [
    {
      ...base, id: 8123401, handle: 'calder-loveseat', title: 'Calder Loveseat', sku: 'BL-CAL-LS-SLT', status: 'active',
      description: 'A compact loveseat with a relaxed, rounded profile, upholstered in a durable slate grey performance weave. Two loose back cushions and oak legs in a walnut stain make it an easy fit for apartments and reading corners.',
      media: ['calder_navy_front.jpg', 'calder_slate_side.jpg', 'calder_lifestyle.jpg'],
      price: 1299, cost: 640, type: 'Sofas and Loveseats', vendor: 'Brightline Living Co.', collections: ['Living Room', 'Sofas and Loveseats'], tags: ['performance fabric', 'small space'],
      color: 'Slate Grey', width: 62, depth: 36, height: 33, seatHeight: 19, weight: 96, capacity: 500,
      materials: 'Polyester performance weave; 2 loose back cushions; oak legs, walnut stain', assembly: 'Screw-in legs, no tools', care: 'Spot clean with a water-based cleaner. Vacuum regularly.',
      inventory: [{ location: 'Main warehouse', qty: 14 }, { location: 'Greensboro DC', qty: 6 }],
      sourceCode: 'BL-CAL-LS-SLT', createdAt: onDate(2026, 3, 18, 14, 2), updatedAt: onDate(2026, 8, 27, 11, 41),
      activity: [
        act(onDate(2026, 3, 18, 14, 2), 'Draft created by Oracle Retail Connector'),
        act(onDate(2026, 3, 19, 10, 15), 'Published to Online Store and Mobile App', 'K. Osei'),
        act(onDate(2026, 8, 27, 11, 38), 'Media added: calder_navy_front.jpg', 'Fall refresh import'),
        act(onDate(2026, 8, 27, 11, 41), 'Media reordered', 'Fall refresh import'),
      ],
    },
    {
      ...base, id: 8123402, handle: 'merriam-dining-table', title: 'Merriam Dining Table', sku: 'OH-MER-DT72-NAT', status: 'active',
      description: 'A generous dining table in solid white oak with a natural matte finish. The 1.5 inch top and tapered legs seat six comfortably, and the legs bolt on with the Allen key included.',
      media: ['merriam_front.jpg', 'merriam_lifestyle.jpg'],
      price: 1849, cost: null, type: 'Dining Tables', vendor: 'Oakhaven Woodworks', collections: ['Dining', 'Dining Tables'], tags: ['solid wood', 'seats 6'],
      color: 'Natural oak, matte', width: 72, depth: 38, height: 30, weight: 110,
      materials: 'Solid white oak top and legs; top 1.5 in thick; seats 6', assembly: 'Legs bolt on, Allen key included', care: 'Wipe with a soft, damp cloth. Use coasters and trivets.',
      inventory: [{ location: 'Main warehouse', qty: 9 }],
      sourceCode: 'OH-MER-DT72-NAT', createdAt: onDate(2026, 9, 29, 16, 40), updatedAt: onDate(2026, 9, 30, 9, 12),
      activity: [act(onDate(2026, 9, 29, 16, 40), 'Draft created by Oracle Retail Connector'), act(onDate(2026, 9, 30, 9, 12), 'Published to Online Store and Mobile App', 'K. Osei')],
    },
    {
      ...base, id: 8123403, handle: 'linden-arc-floor-lamp', title: 'Linden Arc Floor Lamp', sku: 'LT-LIN-FL-BRS', status: 'active',
      description: 'A sweeping arc floor lamp in brushed brass with a linen shade and a weighted marble base.',
      media: ['art:floorlamp'], price: 429, cost: 170, type: 'Floor Lamps', vendor: 'Lanterne Lighting Co.', collections: ['Lighting'],
      color: 'Brushed brass', width: 40, depth: 14, height: 76, weight: 22, materials: 'Steel with brushed brass finish; linen shade; marble base', assembly: 'Arm and shade attach, no tools',
      inventory: [{ location: 'Main warehouse', qty: 31 }], sourceCode: 'LT-LIN-FL-BRS', createdAt: onDate(2026, 8, 11, 12, 0), updatedAt: onDate(2026, 8, 12, 9, 0),
      activity: [act(onDate(2026, 8, 11, 12, 0), 'Draft created by Oracle Retail Connector'), act(onDate(2026, 8, 12, 9, 0), 'Published to Online Store and Mobile App', 'J. Park')],
    },
    {
      ...base, id: 8123404, handle: 'sable-wool-area-rug-8-x-10', title: 'Sable Wool Area Rug, 8 x 10', sku: 'WV-SAB-RG-810', status: 'active',
      description: 'A hand-tufted wool rug in charcoal and cream with a soft, dense pile.',
      media: ['art:rug'], price: 1199, cost: 480, type: 'Area Rugs', vendor: 'Weaverly Rug Studio', collections: ['Rugs'],
      color: 'Charcoal and cream', width: 96, depth: 120, height: 0.5, weight: 48, materials: '100% wool pile; cotton backing', assembly: 'No assembly',
      inventory: [{ location: 'Main warehouse', qty: 12 }], sourceCode: 'WV-SAB-RG-810', createdAt: onDate(2026, 7, 21, 12, 0), updatedAt: onDate(2026, 7, 22, 9, 0),
      activity: [act(onDate(2026, 7, 21, 12, 0), 'Draft created by Oracle Retail Connector'), act(onDate(2026, 7, 22, 9, 0), 'Published to Online Store and Mobile App', 'J. Park')],
    },
    {
      ...base, id: 8123405, handle: 'rowan-open-bookcase', title: 'Rowan Open Bookcase', sku: 'OH-ROW-BC-WAL', status: 'draft', channels: { online: false, mobile: false },
      description: 'An open walnut bookcase with four fixed shelves.',
      media: ['art:bookcase'], price: 899, cost: 410, type: 'Bookcases', vendor: 'Oakhaven Woodworks', collections: ['Storage'],
      color: 'Walnut', width: 36, depth: 14, height: 72, weight: 64, materials: 'Walnut veneer over solid wood frame; 4 fixed shelves', assembly: 'Wall anchor included',
      inventory: [{ location: 'Main warehouse', qty: 20 }], sourceCode: 'OH-ROW-BC-WAL', createdAt: at(2, 15, 10), updatedAt: at(2, 15, 10),
      activity: [act(at(2, 15, 10), 'Draft created by Oracle Retail Connector')],
    },
  ];
}

function listings() {
  return [
    {
      id: 'B0D7Q4K2CL', status: 'Active', sku: 'AVH-BL-CAL-LS-SLT', category: 'Sofas and Couches',
      title: 'Alder & Vale Home Calder Loveseat, 62 Inch Small Sofa with Performance Weave Upholstery, 2 Loose Back Cushions and Oak Legs, Slate Grey',
      brand: 'Alder & Vale Home', idType: 'GTIN exempt', idValue: '', color: 'Slate Grey', material: 'Polyester performance weave',
      features: [
        'COMPACT LOVESEAT: 62 in wide x 36 in deep x 33 in high, sized for apartments, reading corners and smaller living rooms',
        'PERFORMANCE WEAVE: durable slate grey polyester performance weave upholstery that stands up to everyday use',
        'COMFORTABLE SEAT: 19 in seat height with 2 loose back cushions; supports up to 500 lb',
        'WALNUT-STAINED OAK LEGS: tapered oak legs in a walnut stain screw in by hand, no tools needed',
        'EASY CARE: spot clean with a water-based cleaner and vacuum regularly',
      ],
      images: ['calder_slate_front.jpg', 'calder_slate_side.jpg', 'calder_lifestyle.jpg'],
      width: 62, depth: 36, height: 33, weight: 96, maxWeight: 500, seatHeight: 19, assembly: 'Yes',
      price: 1299, qty: 8, condition: 'New', fulfillment: 'Seller fulfilled', handling: 3,
      rating: 4.6, reviews: 38, createdAt: onDate(2026, 3, 24, 10, 0), updatedAt: onDate(2026, 3, 24, 10, 0),
    },
    {
      id: 'B0C3H8N5MR', status: 'Active', sku: 'AVH-OH-MER-DT72-NAT', category: 'Dining Tables',
      title: 'Alder & Vale Home Merriam Dining Table, 72 Inch Solid White Oak Rectangular Table, Seats 6, Natural Matte Finish',
      brand: 'Alder & Vale Home', idType: 'GTIN exempt', idValue: '', color: 'Natural oak, matte', material: 'Solid white oak',
      features: [
        'SOLID WHITE OAK: top and legs made from solid white oak in a natural matte finish',
        'SEATS 6: 72 in long x 38 in wide x 30 in high, with room for six diners',
        'SUBSTANTIAL TOP: 1.5 in thick tabletop with softly eased edges',
        'SIMPLE ASSEMBLY: legs bolt on, and the Allen key is included',
        'BUILT TO LAST: 110 lb table built for everyday family dining',
      ],
      images: ['merriam_front.jpg', 'merriam_lifestyle.jpg'],
      width: 72, depth: 38, height: 30, weight: 110, maxWeight: null, seatHeight: null, assembly: 'Yes',
      price: 1849, qty: 5, condition: 'New', fulfillment: 'Seller fulfilled', handling: 5,
      rating: 4.8, reviews: 12, createdAt: onDate(2026, 10, 2, 10, 0), updatedAt: onDate(2026, 10, 2, 10, 0),
    },
    {
      id: 'B0B9L2P7LN', status: 'Active', sku: 'AVH-LT-LIN-FL-BRS', category: 'Floor Lamps',
      title: 'Alder & Vale Home Linden Arc Floor Lamp, 76 Inch Brushed Brass Arc Lamp with Linen Shade and Marble Base',
      brand: 'Alder & Vale Home', idType: 'GTIN exempt', idValue: '', color: 'Brushed brass', material: 'Steel, marble',
      features: ['SWEEPING ARC: 76 in tall with a 40 in reach', 'BRUSHED BRASS: warm brass finish on steel', 'LINEN SHADE: soft, diffused light', 'MARBLE BASE: weighted for stability', 'QUICK SETUP: arm and shade attach without tools'],
      images: ['art:floorlamp'], width: 40, depth: 14, height: 76, weight: 22, maxWeight: null, seatHeight: null, assembly: 'Yes',
      price: 429, qty: 22, condition: 'New', fulfillment: 'Seller fulfilled', handling: 2,
      rating: 4.4, reviews: 61, createdAt: onDate(2026, 8, 14, 10, 0), updatedAt: onDate(2026, 8, 14, 10, 0),
    },
    {
      id: 'B0D5R1T3SB', status: 'Active', sku: 'AVH-WV-SAB-RG-810', category: 'Area Rugs',
      title: 'Alder & Vale Home Sable Wool Area Rug, 8 x 10 Feet, Charcoal and Cream Hand-Tufted Wool',
      brand: 'Alder & Vale Home', idType: 'GTIN exempt', idValue: '', color: 'Charcoal and cream', material: 'Wool',
      features: ['100% WOOL PILE: soft and dense underfoot', 'SIZE: 8 x 10 feet', 'HAND-TUFTED: charcoal and cream pattern', 'COTTON BACKING: lies flat', 'EASY CARE: vacuum regularly, spot clean spills'],
      images: ['art:rug'], width: 96, depth: 120, height: 0.5, weight: 48, maxWeight: null, seatHeight: null, assembly: 'No',
      price: 1199, qty: 7, condition: 'New', fulfillment: 'Seller fulfilled', handling: 3,
      rating: 4.7, reviews: 23, createdAt: onDate(2026, 7, 25, 10, 0), updatedAt: onDate(2026, 7, 25, 10, 0),
    },
  ];
}

const SHEET_HEADERS = ['Date/time', 'Requested by', 'Item code', 'Product', 'System', 'Action', 'Status', 'Link', 'Notes'];

// Noah Bennett's own mailbox (mock Gmail on port 4007): Dana's two supplier
// emails, plus the two requests to Seek: already sent (default reset), or not
// written yet so Noah can type and send them on camera (reset mode 'noah').
function noahInbox() {
  return [
    {
      id: 'n-dana', folder: 'inbox', read: true, starred: false, date: at(1, 16, 12),
      from: DANA, to: [NOAH], cc: [],
      subject: 'New items: Harlow Accent Chair and Ashby 3-Seat Sofa, spec sheets attached',
      body:
`Hi Noah,

Please find attached the spec sheets and product photos for two new items:

1. Harlow Accent Chair in Oatmeal boucle (item code NF-HAR-AC-OAT). The front and side photos are on a white background, so they are ready for marketplace use. The lifestyle shot is for your website.

2. Ashby 3-Seat Sofa in Slate (item code NF-ASH-3S-SLT). This is the Rev B spec sheet: page 1 has the specifications and dimension table, and page 2 has the front, side and top view drawings. Two product photos are attached as well.

Wholesale cost, MSRP and lead time are on page 1 of each spec sheet. Both ship from our Greensboro warehouse.

Best,
Dana Ruiz
Account Manager, Northfield Upholstery Co.`,
      attachments: ['Harlow_Accent_Chair_Spec.pdf', 'harlow_front.jpg', 'harlow_side.jpg', 'harlow_lifestyle.jpg', 'Ashby_3-Seat_Sofa_Spec_RevB.pdf', 'ashby_front.jpg', 'ashby_angle.jpg'],
    },
  ];
}

function auditSheet() {
  const spec = (code, file) => `https://merch.aldervalehome.com/items/${code}/attachments/${encodeURIComponent(file)}`;
  const check = 'Name, dimensions, materials, color, weight, photos';
  return {
    title: 'Catalog audit - week 45', tab: 'Audit list',
    rows: [
      ['Item code', 'Product', 'Supplier', 'Why it is on the list', 'Website page', 'Amazon page', 'Spec sheet', 'Approved photos', 'Check', 'Website result', 'Amazon result', 'Findings'],
      ['OH-MER-DT72-NAT', 'Merriam Dining Table', 'Oakhaven Woodworks', 'Post-launch check (live since Sep 30)',
        'https://aldervalehome.com/products/merriam-dining-table', 'https://www.amazon.com/dp/B0C3H8N5MR',
        spec('OH-MER-DT72-NAT', 'Merriam_specs_FINAL_v3 (2).xlsx'), 'https://merch.aldervalehome.com/items/OH-MER-DT72-NAT', check],
      ['BL-CAL-LS-SLT', 'Calder Loveseat', 'Brightline Living Co.', '2 returns: "color not as pictured"',
        'https://aldervalehome.com/products/calder-loveseat', 'https://www.amazon.com/dp/B0D7Q4K2CL',
        spec('BL-CAL-LS-SLT', 'Calder_Loveseat_Data_Sheet.pdf'), 'https://merch.aldervalehome.com/items/BL-CAL-LS-SLT', check],
    ],
  };
}

const REQUESTS = ['m-newitems', 'm-audit'];

function buildSeed(mode = 'default') {
  const live = mode === 'noah';
  const all = messages();
  const reqs = all.filter((m) => REQUESTS.includes(m.id));
  const noahMessages = [
    ...noahInbox(),
    // In 'noah' mode Noah writes both requests on camera, so neither exists yet.
    ...(live ? [] : reqs.map((m) => ({ ...m, id: m.id.replace(/^m-/, 's-'), folder: 'sent', read: true }))),
  ];
  const its = items();
  const setup = ['Worksheet', 'Submitted', 'On hold', 'Approved'];
  const weekAgo = Date.now() - 7 * 864e5;
  const ls = listings();
  return {
    version: 1,
    seededAt: new Date().toISOString(),
    me: ME,
    suppliers,
    hierarchy,
    mode,
    messages: live ? all.filter((m) => !REQUESTS.includes(m.id)) : all,
    mailboxes: { noah: { me: NOAH, messages: noahMessages } },
    items: its,
    products: products(),
    listings: ls,
    cartCount: 0,
    // Seek's audit log (Google Sheets app, port 4006). Row 1 is the header; Seek fills the rest.
    sheet: { title: 'Seek audit log', tab: 'Audit log', rows: [SHEET_HEADERS.slice()] },
    // Noah's audit list for Story 2 (same app, its own document). Seek fills columns J to L.
    auditSheet: auditSheet(),
    // Department-wide totals shown on dashboards; the lists show only the demo items.
    offsets: {
      inSetup: 37 - its.filter((i) => setup.includes(i.status)).length,
      onHold: 9 - its.filter((i) => i.status === 'On hold').length,
      awaiting: 5 - its.filter((i) => i.status === 'Submitted').length,
      released: 128 - its.filter((i) => i.status === 'Released' && Date.parse(i.updatedAt) > weekAgo).length,
      activeListings: 12 - ls.filter((l) => l.status === 'Active').length,
    },
  };
}

module.exports = { buildSeed, auditSheet, hierarchy, suppliers };
