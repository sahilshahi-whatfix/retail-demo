// Runs an app under a path prefix (single-server mode, e.g. on Render).
// The apps are written with root-relative paths ("/items/X", fetch('/api/cells')),
// so this rewrites them on the way out: redirects, and every quoted string in HTML
// that starts with "/" (attributes and the pages' own scripts alike).
// "//" (protocol-relative) and "/>" (self-closing tags) are left alone.

// Code between NO_PREFIX markers (the link-mapping functions, which hold path
// fragments rather than links) is left as it is.
const NO_PREFIX = ['/*no-prefix*/', '/*end-no-prefix*/'];

function addPrefix(prefix, html) {
  return html.split(NO_PREFIX[0]).map((part, i) => {
    let keep = '';
    if (i > 0) {
      const end = part.indexOf(NO_PREFIX[1]);
      keep = end < 0 ? part : part.slice(0, end);
      part = end < 0 ? '' : part.slice(end);
    }
    return keep + part.replace(/(['"`])\/(?![/*>])/g, `$1${prefix}/`);
  }).join(NO_PREFIX[0]);
}

function prefixer(prefix) {
  return (req, res, next) => {
    const location = res.location;
    res.location = function (url) {
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) url = prefix + url;
      return location.call(this, url);
    };
    const send = res.send;
    res.send = function (body) {
      const type = String(this.get('Content-Type') || '');
      if (typeof body === 'string' && (/html/i.test(type) || (!type && /^\s*</.test(body)))) body = addPrefix(prefix, body);
      return send.call(this, body);
    };
    next();
  };
}

module.exports = { prefixer, addPrefix, NO_PREFIX };
