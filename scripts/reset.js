// Restore the starting state for both demo stories.
//   npm run reset        Noah's requests are already in Seek's inbox.
//   npm run reset:noah   Noah's requests are not written yet: type and send them from http://localhost:4007 on camera.
const mode = process.argv.includes('--noah') ? 'noah' : 'default';
require('../lib/store').reset(mode);
console.log(mode === 'noah'
  ? "Demo data reset. Seek's inbox has no requests yet: compose them as Noah at http://localhost:4007 (see docs/noah-emails-to-paste.md)."
  : 'Demo data reset. Running apps pick up the change on the next page load.');
