// File picker dialog shared by the apps: browse the shared drive of supplier
// files or upload from the computer. Each app styles it through --pk-* CSS
// variables. Usage in the page: openPicker({ kind: 'image', multiple: true, title }, files => ...)
function pickerAssets() {
  return `
<style>
.pk-backdrop{position:fixed;inset:0;background:rgba(15,23,30,.45);display:none;align-items:center;justify-content:center;z-index:1000}
.pk-backdrop.open{display:flex}
.pk{background:#fff;width:880px;max-width:calc(100vw - 48px);max-height:calc(100vh - 80px);display:flex;flex-direction:column;border-radius:var(--pk-radius,8px);box-shadow:0 20px 60px rgba(0,0,0,.25);font:inherit;color:inherit}
.pk-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e3e6ea}
.pk-head h3{margin:0;font-size:1.1em}
.pk-path{font-size:.85em;color:#6b7280;margin-top:2px}
.pk-x{border:0;background:none;font-size:22px;cursor:pointer;color:#555;line-height:1}
.pk-body{overflow:auto;padding:12px 18px;flex:1}
.pk-folder{font-weight:600;font-size:.85em;color:#4b5563;margin:12px 0 8px;text-transform:uppercase;letter-spacing:.04em}
.pk-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.pk-file{border:1px solid #e3e6ea;border-radius:var(--pk-radius,8px);padding:6px;cursor:pointer;background:#fff;text-align:left;font:inherit;color:inherit}
.pk-file:hover{border-color:var(--pk-accent,#2563eb)}
.pk-file.sel{border-color:var(--pk-accent,#2563eb);box-shadow:0 0 0 2px var(--pk-accent,#2563eb)}
.pk-thumb{height:92px;display:flex;align-items:center;justify-content:center;background:#f6f7f9;border-radius:calc(var(--pk-radius,8px) - 3px);overflow:hidden}
.pk-thumb img{max-width:100%;max-height:100%}
.pk-doc{font-weight:700;font-size:13px;color:#fff;background:#b91c1c;padding:6px 8px;border-radius:4px}
.pk-doc.sheet{background:#15803d}
.pk-name{font-size:12px;margin-top:6px;word-break:break-all;line-height:1.3}
.pk-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1px solid #e3e6ea;gap:12px}
.pk-foot .pk-count{color:#6b7280;font-size:.9em}
.pk-btn{font:inherit;padding:8px 16px;border-radius:var(--pk-radius,8px);border:1px solid #cfd4da;background:#fff;cursor:pointer;color:inherit}
.pk-btn.primary{background:var(--pk-accent,#2563eb);border-color:var(--pk-accent,#2563eb);color:var(--pk-accent-text,#fff)}
.pk-btn:disabled{opacity:.5;cursor:default}
.pk-upload{display:inline-flex;align-items:center;gap:8px}
</style>
<div class="pk-backdrop" id="pk"><div class="pk" role="dialog" aria-modal="true" aria-labelledby="pk-title">
  <div class="pk-head"><div><h3 id="pk-title">Select files</h3><div class="pk-path">Shared drive \\\\avh-files\\supplier-content</div></div><button type="button" class="pk-x" aria-label="Close" onclick="closePicker()">&times;</button></div>
  <div class="pk-body" id="pk-body">Loading…</div>
  <div class="pk-foot">
    <label class="pk-upload pk-btn">Upload from computer<input type="file" id="pk-input" multiple hidden></label>
    <span class="pk-count" id="pk-count">No files selected</span>
    <span><button type="button" class="pk-btn" onclick="closePicker()">Cancel</button>
    <button type="button" class="pk-btn primary" id="pk-ok" disabled>Select</button></span>
  </div>
</div></div>
<script>
(function(){
  let opts = {}, cb = null, sel = [];
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function render(files){
    const groups = {};
    files.filter((f) => !opts.kind || f.kind === opts.kind || (opts.kind === 'doc' && f.kind !== 'image'))
      .forEach((f) => (groups[f.folder] = groups[f.folder] || []).push(f));
    const html = Object.keys(groups).map((g) => '<div class="pk-folder">' + esc(g) + '</div><div class="pk-grid">' +
      groups[g].map((f) => '<button type="button" class="pk-file' + (sel.includes(f.name) ? ' sel' : '') + '" data-name="' + esc(f.name) + '" title="' + esc(f.name) + '">' +
        '<div class="pk-thumb">' + (f.kind === 'image' ? '<img src="/thumbs/' + encodeURIComponent(f.name) + '" alt="">' : '<span class="pk-doc ' + f.kind + '">' + (f.kind === 'pdf' ? 'PDF' : f.kind === 'sheet' ? 'XLSX' : 'FILE') + '</span>') + '</div>' +
        '<div class="pk-name">' + esc(f.name) + '</div></button>').join('') + '</div>').join('');
    $('pk-body').innerHTML = html || '<p>No files.</p>';
    $('pk-body').querySelectorAll('.pk-file').forEach((b) => b.onclick = () => toggle(b.dataset.name));
    $('pk-count').textContent = sel.length ? sel.length + ' selected: ' + sel.join(', ') : 'No files selected';
    $('pk-ok').disabled = !sel.length;
  }
  let cache = [];
  function load(){ return fetch('/__library').then((r) => r.json()).then((f) => { cache = f; render(f); }); }
  function toggle(name){
    if (opts.multiple) sel = sel.includes(name) ? sel.filter((n) => n !== name) : sel.concat(name);
    else sel = [name];
    render(cache);
  }
  window.openPicker = function(o, done){
    opts = o || {}; cb = done; sel = [];
    $('pk-title').textContent = opts.title || 'Select files';
    $('pk').classList.add('open');
    load();
  };
  window.closePicker = function(){ $('pk').classList.remove('open'); };
  $('pk-ok').onclick = function(){ const s = sel.slice(); closePicker(); cb && cb(s); };
  $('pk-input').onchange = function(e){
    const fd = new FormData();
    [...e.target.files].forEach((f) => fd.append('files', f));
    fetch('/__upload', { method: 'POST', body: fd }).then((r) => r.json()).then((up) => {
      e.target.value = '';
      up.forEach((u) => { if (opts.multiple) sel.push(u.name); else sel = [u.name]; });
      load();
    });
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePicker(); });
})();
</script>`;
}

module.exports = { pickerAssets };
