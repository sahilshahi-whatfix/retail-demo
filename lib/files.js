// Product photos, spec sheets and uploads, served the same way by every app.
// The "shared drive" listing stands in for the retailer's network folder of
// supplier content, so file pickers in each app can choose a file without the
// operating system's file dialog. Real uploads work too.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { UPLOAD_DIR } = require('./store');

const ROOT = path.join(__dirname, '..');
const PHOTO_DIR = path.join(ROOT, 'photos');
const SPEC_DIR = path.join(ROOT, 'specs');

// Which photos show the product alone on a pure white background.
const WHITE_BG = {
  'harlow_front.jpg': true, 'harlow_side.jpg': true, 'harlow_lifestyle.jpg': false,
  'ashby_front.jpg': true, 'ashby_angle.jpg': true,
  'calder_slate_front.jpg': true, 'calder_slate_side.jpg': true, 'calder_lifestyle.jpg': false,
  'calder_navy_front.jpg': true,
  'merriam_front.jpg': true, 'merriam_lifestyle.jpg': false,
};

function imageSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        const len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
        }
        i += 2 + len;
      }
    }
  } catch (e) { /* unreadable */ }
  return null;
}

const hashOf = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
let photoHashes = null;
function knownPhotoFor(file) {
  if (!photoHashes) {
    photoHashes = {};
    for (const f of Object.keys(WHITE_BG)) {
      const p = path.join(PHOTO_DIR, f);
      if (fs.existsSync(p)) photoHashes[hashOf(p)] = f;
    }
  }
  return photoHashes[hashOf(file)] || null;
}

// Where a file lives on disk, by name (photos, then specs, then uploads).
function locate(name) {
  const base = path.basename(name);
  for (const dir of [PHOTO_DIR, SPEC_DIR, UPLOAD_DIR]) {
    const p = path.join(dir, base);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function kindOf(name) {
  const ext = path.extname(name).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  if (['.xlsx', '.xls', '.csv'].includes(ext)) return 'sheet';
  return 'file';
}

// Facts about an image used by the marketplace's image rules.
function imageInfo(name) {
  const p = locate(name);
  if (!p) return null;
  const size = imageSize(p);
  let white = WHITE_BG[path.basename(name)];
  if (white === undefined) {
    const known = knownPhotoFor(p);
    white = known ? WHITE_BG[known] : null;
  }
  return { name, w: size?.w || 0, h: size?.h || 0, whiteBg: white };
}

function library() {
  const out = [];
  const add = (dir, folder) => {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir).sort()) {
      if (f.startsWith('.') || fs.statSync(path.join(dir, f)).isDirectory()) continue;
      out.push({ name: f, folder, kind: kindOf(f), size: fs.statSync(path.join(dir, f)).size });
    }
  };
  add(PHOTO_DIR, 'Supplier photos');
  add(SPEC_DIR, 'Spec sheets');
  add(UPLOAD_DIR, 'Uploads');
  return out;
}

// Simple drawn thumbnails for background catalog items that have no photo.
const BG_ART = {
  bookcase: '<rect x="70" y="40" width="100" height="160" fill="none" stroke="#6b4a32" stroke-width="8"/><path d="M74 80h92M74 120h92M74 160h92" stroke="#6b4a32" stroke-width="6"/><rect x="84" y="56" width="10" height="22" fill="#b98d5f"/><rect x="98" y="60" width="8" height="18" fill="#8a9a7b"/><rect x="128" y="136" width="26" height="22" fill="#c9b79c"/>',
  tables: '<rect x="50" y="90" width="90" height="10" fill="#b98d5f"/><path d="M58 100v80M132 100v80" stroke="#8a6440" stroke-width="7"/><rect x="110" y="120" width="80" height="9" fill="#c9a274"/><path d="M118 129v51M182 129v51" stroke="#8a6440" stroke-width="6"/>',
  ottoman: '<rect x="55" y="95" width="130" height="70" rx="14" fill="#d8cbb4"/><rect x="55" y="88" width="130" height="22" rx="10" fill="#e6dcc8"/><path d="M70 165v18M170 165v18" stroke="#6b4a32" stroke-width="7"/>',
  tablelamp: '<path d="M85 60h70l20 55H65z" fill="#efe6d6" stroke="#cbbfa9" stroke-width="2"/><ellipse cx="120" cy="160" rx="34" ry="36" fill="#d6c9b2"/><rect x="104" y="192" width="32" height="8" fill="#b6a88f"/>',
  floorlamp: '<path d="M100 200h50" stroke="#8a7350" stroke-width="8"/><path d="M125 200V70q0-30 40-30" fill="none" stroke="#b08d57" stroke-width="5"/><path d="M150 40h40l10 30h-60z" fill="#f2ead8" stroke="#cbbfa9" stroke-width="2"/>',
  rug: '<rect x="40" y="60" width="160" height="120" fill="#c9b9a0"/><rect x="52" y="72" width="136" height="96" fill="none" stroke="#8c7a60" stroke-width="4"/><path d="M70 120h100M120 90v60" stroke="#a8977c" stroke-width="3"/>',
};
function bgSvg(kind) {
  const art = BG_ART[kind] || BG_ART.tables;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 240 240"><rect width="240" height="240" fill="#ffffff"/>${art}</svg>`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      let name = path.basename(file.originalname).replace(/[^\w.\-() ]+/g, '_');
      if (fs.existsSync(path.join(UPLOAD_DIR, name))) name = Date.now() + '_' + name;
      cb(null, name);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function mount(app) {
  app.get('/files/:name', (req, res) => {
    const p = locate(req.params.name);
    if (!p) return res.status(404).send('File not found');
    if (req.query.download) res.attachment(path.basename(p));
    res.set('Cache-Control', 'no-cache');
    res.sendFile(p);
  });
  app.get('/thumbs/:name', (req, res) => {
    const t = path.join(PHOTO_DIR, 'thumbs', path.basename(req.params.name));
    const p = fs.existsSync(t) ? t : locate(req.params.name);
    if (!p) return res.status(404).send('File not found');
    res.set('Cache-Control', 'no-cache');
    res.sendFile(p);
  });
  app.get('/spec-pages/:name', (req, res) => {
    const p = path.join(SPEC_DIR, 'pages', path.basename(req.params.name));
    if (!fs.existsSync(p)) return res.status(404).send('Not found');
    res.sendFile(p);
  });
  app.get('/art/:kind.svg', (req, res) => res.type('image/svg+xml').send(bgSvg(req.params.kind)));
  app.get('/__library', (req, res) => res.json(library()));
  app.post('/__upload', upload.array('files', 12), (req, res) => {
    res.json((req.files || []).map((f) => ({ name: f.filename, kind: kindOf(f.filename) })));
  });
}

// Image URL for a stored image reference: a photo/upload file name or "art:<kind>".
function imgSrc(ref) {
  if (!ref) return '/art/tables.svg';
  if (ref.startsWith('art:')) return `/art/${ref.slice(4)}.svg`;
  return `/files/${encodeURIComponent(ref)}`;
}

// Small version of an image, for lists and pickers.
function thumbSrc(ref) {
  if (!ref || ref.startsWith('art:')) return imgSrc(ref);
  return `/thumbs/${encodeURIComponent(ref)}`;
}

module.exports = { mount, library, locate, kindOf, imageInfo, imgSrc, thumbSrc, SPEC_DIR, PHOTO_DIR };
