// Shared JSON store. Every app reads and writes the same file, so changes made
// in one app are visible to the others (where the demo's integrations allow).
const fs = require('fs');
const path = require('path');
const { buildSeed } = require('./seed');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  // A fresh server (for example after a Render deploy) starts in SEED_MODE: 'default' or 'noah'.
  if (!fs.existsSync(STORE_FILE)) reset(process.env.SEED_MODE === 'noah' ? 'noah' : undefined);
}

function read() {
  ensure();
  const db = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  // Data saved before Noah's mailbox existed: add it, keeping everything else.
  if (!db.mailboxes) { db.mailboxes = buildSeed().mailboxes; write(db); }
  if (!db.auditSheet) { db.auditSheet = buildSeed().auditSheet; write(db); }
  return db;
}

function write(db) {
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, STORE_FILE);
}

// Read, mutate and save in one step.
function update(fn) {
  const db = read();
  const result = fn(db);
  write(db);
  return result;
}

// mode 'noah': Noah's two requests are not written yet; he sends them on camera.
function reset(mode) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(UPLOAD_DIR)) {
    for (const f of fs.readdirSync(UPLOAD_DIR)) fs.unlinkSync(path.join(UPLOAD_DIR, f));
  } else {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  write(buildSeed(mode));
}

module.exports = { read, write, update, reset, UPLOAD_DIR };
