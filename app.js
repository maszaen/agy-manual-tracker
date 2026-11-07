(function () {
  'use strict';

  /* ================= Konstanta & state ================= */
  var KEY = 'limit-tracker-v1',
      TKEY = 'limit-tracker-theme',
      IDB_NAME = 'limit-tracker-fs',
      IDB_STORE = 'handles',
      IDB_KEY = 'dbFile';

  var S = { accounts: [], sort: 'avg', sel: null, all: false };
  var ui = { q: '', paste: null, rename: null, edit: null, fresh: true, newIds: {}, undo: null };
  var fHandle = null, fReady = false;

  var $ = function (id) { return document.getElementById(id); };

  /* ================= Ikon ================= */
  var P = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sort: '<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',
    expand: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
    collapse: '<path d="m7 20 5-5 5 5M7 4l5 5 5-5"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    pencil: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    unlink: '<path d="m18.8 11.2 1.2-1.2a5 5 0 0 0-7-7l-1.2 1.2M5.2 12.8 4 14a5 5 0 0 0 7 7l1.2-1.2M8 2v3M2 8h3M16 22v-3M22 16h-3"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    drive: '<path d="M22 12H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1zM6 16h.01M10 16h.01"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'
  };
  function ic(n, c) { return '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + P[n] + '</svg>'; }
  function hydrate(root) {
    (root || document).querySelectorAll('[data-ic]').forEach(function (el) {
      if (!el.firstChild) el.innerHTML = ic(el.getAttribute('data-ic'));
    });
  }

  /* ================= Util ================= */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function eff(l) { return (l.resetAt && l.resetAt <= Date.now()) ? 100 : l.pct; }
  function lvl(p) { return p < 0 ? 'none' : p >= 50 ? 'ok' : p >= 10 ? 'warn' : 'bad'; }
  function avg(a) { if (!a.limits.length) return -1; var t = 0; a.limits.forEach(function (l) { t += eff(l); }); return t / a.limits.length; }
  function kk(l) { return l.section + ' | ' + l.label; }
  function gs(id) { return S.accounts.filter(function (x) { return x.id === id; })[0]; }
  function hue(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  function shortLabel(s) { return s.replace(/\s*(limit|remaining)\s*/gi, ' ').trim() || s; }

  function dur(ms) {
    var m = Math.max(0, Math.round(ms / 6e4)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), n = m % 60, o = [];
    if (d) o.push(d + ' hari');
    if (h) o.push(h + ' jam');
    if (!d && n) o.push(n + ' menit');
    return o.join(' ') || 'kurang dari 1 menit';
  }
  function durFull(ms) {
    var m = Math.max(0, Math.round(ms / 6e4)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), n = m % 60, o = [];
    if (d) o.push(d + ' hari');
    if (h) o.push(h + ' jam');
    if (n) o.push(n + ' menit');
    return o.join(' ');
  }
  function when(t) {
    var d = new Date(t);
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + pad(d.getHours()) + '.' + pad(d.getMinutes());
  }
  function ago(t) {
    if (!t) return 'belum ada data';
    var m = Math.round((Date.now() - t) / 6e4);
    return m < 1 ? 'baru saja' : m < 60 ? m + ' menit lalu' : m < 1440 ? Math.floor(m / 60) + ' jam lalu' : Math.floor(m / 1440) + ' hari lalu';
  }

  /* ================= Penyimpanan ================= */
  function normalize() {
    if (!S.sort) S.sort = 'avg';
    S.accounts.forEach(function (a) {
      if (!Array.isArray(a.limits)) a.limits = [];
      if (!a.id) a.id = uid();
    });
    if (!S.all) {
      var seen = false;
      S.accounts.forEach(function (a) { if (a.open) { if (seen) a.open = false; seen = true; } });
    }
    if (!S.sel || !gs(S.sel)) S.sel = S.accounts[0] ? S.accounts[0].id : null;
  }
  function load() {
    try {
      var r = localStorage.getItem(KEY);
      if (r) { var o = JSON.parse(r); if (o && Array.isArray(o.accounts)) S = o; }
    } catch (e) {}
    normalize();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    if (fHandle && fReady) writeDisk();
  }

  /* ================= Toast ================= */
  function toast(msg, act) {
    var box = $('toasts'), t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button type="button">' + esc(act.label) + '</button>' : '');
    if (act) t.querySelector('button').addEventListener('click', function () { act.fn(); kill(); });
    box.appendChild(t);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    var timer = setTimeout(kill, act ? 6000 : 3000);
    function kill() {
      clearTimeout(timer);
      t.classList.add('out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
    }
  }

  /* ================= Tema ================= */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    $('themeBtn').innerHTML = ic(t === 'dark' ? 'sun' : 'moon');
    $('themeBtn').title = t === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap';
    try { localStorage.setItem(TKEY, t); } catch (e) {}
  }

  /* ================= File System Access ================= */
  function idbOpen() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej();
      var q = indexedDB.open(IDB_NAME, 1);
      q.onupgradeneeded = function (e) { e.target.result.createObjectStore(IDB_STORE); };
      q.onsuccess = function (e) { res(e.target.result); };
      q.onerror = function () { rej(); };
    });
  }
  function idbSet(h) {
    return idbOpen().then(function (db) {
      return new Promise(function (res) {
        var tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(h, IDB_KEY);
        tx.oncomplete = res;
      });
    }).catch(function () {});
  }
  function idbGet() {
    return idbOpen().then(function (db) {
      return new Promise(function (res) {
        var q = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(IDB_KEY);
        q.onsuccess = function (e) { res(e.target.result || null); };
        q.onerror = function () { res(null); };
      });
    }).catch(function () { return null; });
  }
  function idbDel() {
    return idbOpen().then(function (db) { db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).delete(IDB_KEY); }).catch(function () {});
  }

  function updateFsUI() {
    var b = $('syncBtn'), l = $('syncLabel');
    if (fHandle && fReady) {
      b.className = 'sync'; l.textContent = fHandle.name;
      b.title = 'Auto-save aktif ke ' + fHandle.name + ' (klik untuk simpan sekarang)';
    } else if (fHandle) {
      b.className = 'sync'; l.textContent = 'Hubungkan ulang ' + fHandle.name;
      b.title = 'Klik untuk mengaktifkan kembali izin tulis ke ' + fHandle.name;
    } else {
      b.className = 'sync'; l.textContent = 'Tautkan file JSON';
      b.title = 'Tautkan file JSON agar tersimpan otomatis';
    }
    $('mUnlink').disabled = !fHandle;
  }
  async function writeDisk() {
    if (!fHandle || !fReady) return;
    try {
      var w = await fHandle.createWritable();
      await w.write(JSON.stringify(S, null, 2));
      await w.close();
    } catch (e) { fReady = false; updateFsUI(); }
  }
  async function readDisk(h) {
    try {
      var t = await (await h.getFile()).text();
      if (!t.trim()) { await writeDisk(); return; }
      var o = JSON.parse(t);
      if (o && Array.isArray(o.accounts)) {
        S = o; normalize();
        try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
        render();
        toast('Dimuat dari ' + h.name);
      }
    } catch (e) { toast('Gagal membaca file JSON'); }
  }
  async function initFs() {
    if (!('showSaveFilePicker' in window)) { updateFsUI(); return; }
    var h = await idbGet();
    if (h) {
      fHandle = h;
      try {
        if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') { fReady = true; await readDisk(h); }
      } catch (e) { fHandle = null; }
    }
    updateFsUI();
  }
  async function fsSync() {
    if (!('showSaveFilePicker' in window)) { toast('Browser tidak mendukung File API, gunakan Unduh .json'); return; }
    if (fHandle && !fReady) {
      try {
        if ((await fHandle.requestPermission({ mode: 'readwrite' })) === 'granted') {
          fReady = true; await readDisk(fHandle); await writeDisk(); updateFsUI();
          toast('Auto-save aktif: ' + fHandle.name);
        }
      } catch (e) {}
      return;
    }
    if (fHandle && fReady) { await writeDisk(); toast('Tersimpan ke ' + fHandle.name); return; }
    fsLink();
  }
  async function fsLink() {
    if (!('showSaveFilePicker' in window)) { toast('Browser tidak mendukung File API'); return; }
    try {
      var h = await window.showSaveFilePicker({ suggestedName: 'limit-tracker.json', types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
      fHandle = h; fReady = true;
      await idbSet(h); await writeDisk(); updateFsUI();
      toast('Tertaut ke ' + h.name);
    } catch (e) {}
  }
  async function fsOpen() {
    if (!('showOpenFilePicker' in window)) { toast('Browser tidak mendukung File API'); return; }
    try {
      var hs = await window.showOpenFilePicker({ multiple: false, types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
      if (!hs || !hs[0]) return;
      fHandle = hs[0];
      fReady = (await fHandle.requestPermission({ mode: 'readwrite' })) === 'granted';
      await idbSet(fHandle); await readDisk(fHandle); updateFsUI();
    } catch (e) {}
  }
  async function fsUnlink() {
    fHandle = null; fReady = false;
    await idbDel(); updateFsUI(); toast('Tautan file dilepas');
  }
  function downloadJson() {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    a.download = 'limit-tracker.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ================= Parser teks ================= */
  function parseDur(s) {
    var ms = 0, m;
    if ((m = s.match(/(\d+)\s*(?:days?|hari|d)\b/i))) ms += m[1] * 864e5;
    if ((m = s.match(/(\d+)\s*(?:hours?|hrs?|jam|h)\b/i))) ms += m[1] * 36e5;
    if ((m = s.match(/(\d+)\s*(?:minutes?|mins?|menit|m)\b/i))) ms += m[1] * 6e4;
    if (!ms && (m = s.trim().match(/^(\d+)$/))) ms = m[1] * 6e4;
    return ms;
  }
  function parse(text) {
    var L = text.split(/\r?\n/).map(function (s) { return s.replace(/[\u24d8\u2139\u2753\u00a0]/g, ' ').trim(); }).filter(Boolean);
    var st = -1;
    L.forEach(function (l, i) { if (st < 0 && /^developer$/i.test(l)) st = i; });
    if (st > -1) L = L.slice(0, st);
    var isPct = function (l) { return /^\d{1,3}(?:[.,]\d+)?\s*%$/.test(l); };
    var isDesc = function (l) { return /^you have|refresh|will reset|resets? in/i.test(l); };
    var isLab = function (l) { return /limit/i.test(l) && !isDesc(l) && !isPct(l) && l.length < 90; };
    var out = [], sec = 'Umum', cur = null, base = Date.now();
    function fin(p, lab) {
      p = Math.max(0, Math.min(100, parseFloat(String(p).replace(',', '.'))));
      if (isNaN(p)) return;
      var rs = null;
      if (cur && cur.ms && p < 100) rs = base + cur.ms;
      out.push({ section: sec, label: lab, pct: p, resetAt: rs });
      cur = null;
    }
    for (var i = 0; i < L.length; i++) {
      var l = L[i], m;
      if (isLab(l)) {
        if ((m = l.match(/^(.*?limit.*?)\s+(\d{1,3}(?:[.,]\d+)?)\s*%$/i))) { cur = { label: m[1], ms: 0 }; fin(m[2], m[1]); continue; }
        cur = { label: l, ms: 0 }; continue;
      }
      if (isDesc(l)) { if (cur) { var t = l.match(/(?:in|dalam)\s+(.*)$/i); cur.ms = parseDur(t ? t[1] : l); } continue; }
      if (isPct(l)) { if (cur) fin(l.replace('%', ''), cur.label); continue; }
      if (L[i + 1] && isLab(L[i + 1])) sec = l;
    }
    return out;
  }
  function upsert(a, n) {
    var f = -1;
    a.limits.forEach(function (o, i) { if (kk(o) === kk(n)) f = i; });
    if (f > -1) a.limits[f] = n; else a.limits.push(n);
  }
  function applyPaste(id, text) {
    var a = gs(id);
    if (!a) return;
    var res = parse(text);
    if (!res.length) { toast('Tidak ada limit yang terbaca dari teks'); return; }
    res.forEach(function (n) { upsert(a, n); });
    a.updatedAt = Date.now();
    ui.paste = null;
    save(); render();
    toast(a.email + ': ' + res.length + ' limit diperbarui');
  }

  /* ================= Urut & filter ================= */
  var SORTS = [['avg', 'Sisa terbanyak'], ['avgasc', 'Sisa tersedikit'], ['name', 'Nama A–Z'], ['upd', 'Terakhir diperbarui']];
  function limitKeys() {
    var keys = [], seen = {};
    S.accounts.forEach(function (a) { a.limits.forEach(function (l) { var k = kk(l); if (!seen[k]) { seen[k] = 1; keys.push(k); } }); });
    return keys;
  }
  function sortedAccounts() {
    var s = S.sort, A = S.accounts.slice();
    function kv(a) { var f = -1; a.limits.forEach(function (l) { if ('k:' + kk(l) === s) f = eff(l); }); return f; }
    A.sort(function (x, y) {
      if (s === 'avgasc') return avg(x) - avg(y);
      if (s === 'name') return x.email.localeCompare(y.email);
      if (s === 'upd') return (y.updatedAt || 0) - (x.updatedAt || 0);
      if (s.indexOf('k:') === 0) return kv(y) - kv(x) || avg(y) - avg(x);
      return avg(y) - avg(x);
    });
    return A;
  }
  function visibleAccounts() {
    var q = ui.q.trim().toLowerCase(), A = sortedAccounts();
    return q ? A.filter(function (a) { return a.email.toLowerCase().indexOf(q) > -1; }) : A;
  }

  /* ================= Render ================= */
  function renderStats() {
    var box = $('stats'), withData = S.accounts.filter(function (a) { return a.limits.length; });
    if (!S.accounts.length) { box.innerHTML = ''; return; }
    var tot = 0; withData.forEach(function (a) { tot += avg(a); });
    var av = withData.length ? tot / withData.length : -1;
    var low = withData.filter(function (a) { return avg(a) < 10; }).length;
    var nx = null;
    S.accounts.forEach(function (a) {
      a.limits.forEach(function (l) {
        if (l.resetAt && l.resetAt > Date.now() && (!nx || l.resetAt < nx.t)) nx = { t: l.resetAt, e: a.email, l: l.label };
      });
    });
    box.innerHTML =
      '<div class="stat lv-' + lvl(av) + '"><div class="stat-k">' + ic('percent') + 'Rata-rata sisa</div><div class="stat-v num">' + (av >= 0 ? Math.round(av) + '%' : '—') + '</div><div class="stat-s">dari ' + withData.length + ' akun berdata</div></div>' +
      '<div class="stat"><div class="stat-k">' + ic('clock') + 'Reset terdekat</div><div class="stat-v">' + (nx ? esc(dur(nx.t - Date.now())) : '—') + '</div><div class="stat-s">' + (nx ? esc(nx.e) + ' · ' + esc(shortLabel(nx.l)) : 'belum ada jadwal reset') + '</div></div>' +
      '<div class="stat ' + (low ? 'lv-bad' : 'lv-ok') + '"><div class="stat-k">' + ic('alert') + 'Hampir habis</div><div class="stat-v num">' + low + '</div><div class="stat-s">akun sisa &lt; 10%</div></div>';
  }

  function updateToolbar() {
    var vis = visibleAccounts(), total = S.accounts.length;
    $('count').textContent = ui.q.trim() ? vis.length + ' / ' + total : total;

    var def = S.sort === 'avg';
    $('sortBtn').classList.toggle('has-dot', !def);
    var opts = SORTS.slice();
    limitKeys().forEach(function (k) { opts.push(['k:' + k, 'Terbanyak: ' + k.replace(' | ', ' / ')]); });
    if (!opts.some(function (o) { return o[0] === S.sort; })) S.sort = 'avg';
    $('sortMenu').innerHTML = '<div class="pop-title">Urutkan akun</div>' + opts.map(function (o, i) {
      var sep = i === SORTS.length ? '<div class="pop-sep"></div><div class="pop-title">Berdasarkan limit</div>' : '';
      return sep + '<button type="button" role="menuitemradio" aria-checked="' + (o[0] === S.sort) + '" data-sort="' + esc(o[0]) + '"><span>' + esc(o[1]) + '</span>' + ic('check', 'chk') + '</button>';
    }).join('');

    var expanded = S.all && S.accounts.some(function (a) { return a.open; });
    var b = $('expBtn');
    b.innerHTML = ic(expanded ? 'collapse' : 'expand');
    b.setAttribute('aria-label', expanded ? 'Tutup semua' : 'Buka semua');
    b.title = expanded ? 'Tutup semua' : 'Buka semua';
    b.classList.toggle('on', expanded);
    b.disabled = !S.accounts.length;
  }

  /* Satu limit = satu baris gaya "kredit":
       <nama kategori> <periode>            <kapan reset>
       ▮▮▮▮▮▮▮▮▮▮░░░░░░░░░░░░░░░░░░░░░░░
       Sisa 34%                    1 hari 19 jam lagi
     Tidak ada kata status (Aman/Waspada/Kritis): panjang isi meter yang
     menyatakan kondisinya, jadi tidak perlu diterjemahkan ke kata. */
  function catLabel(l) {
    var t = shortLabel(l.label), sec = l.section || '';
    if (!sec) return t;
    var re = new RegExp('^' + sec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i');
    var period = t.replace(re, '').trim();
    if (!period) return t;
    return sec + ' ' + period;
  }

  function creditRow(a, l, i) {
    if (ui.edit && ui.edit.id === a.id && ui.edit.i === i) return limitForm(a, l, i);
    var p = eff(l), meta = '', right = '';
    if (l.resetAt && l.resetAt > Date.now()) { meta = 'Reset ' + when(l.resetAt); right = dur(l.resetAt - Date.now()) + ' lagi'; }
    else if (l.resetAt) { meta = 'Reset ' + when(l.resetAt); right = 'sudah lewat'; }
    else if (l.pct < 100) { meta = 'Reset belum diisi'; }
    return '<li class="cr" style="--p:' + (Math.round(p * 10) / 10) + '">' +
      '<div class="cr-top"><span class="cr-name">' + esc(catLabel(l)) + '</span>' +
      (meta ? '<span class="cr-meta">' + esc(meta) + '</span>' : '') +
      '<button class="icon-btn sm" type="button" data-act="menu-lim" data-i="' + i +
      '" aria-haspopup="menu" aria-label="Aksi limit" title="Aksi limit">' + ic('more') + '</button></div>' +
      '<div class="meter"><i></i></div>' +
      '<div class="cr-foot"><span>Sisa <b>' + Math.round(p) + '%</b></span>' +
      (right ? '<span>' + esc(right) + '</span>' : '') + '</div></li>';
  }

  function limitForm(a, l, i) {
    var isNew = i === 'new';
    l = l || { section: '', label: '', pct: 100, resetAt: null };
    var rem = l.resetAt && l.resetAt > Date.now() ? durFull(l.resetAt - Date.now()) : '';
    var secs = []; a.limits.forEach(function (x) { if (secs.indexOf(x.section) < 0) secs.push(x.section); });
    return '<li class="limit"><form class="form" data-form="limit" data-i="' + i + '" autocomplete="off">' +
      '<label>Nama limit<input type="text" name="label" required maxlength="90" value="' + esc(l.label) + '" placeholder="mis. Claude limit"></label>' +
      '<label>Grup<input type="text" name="section" list="secs" maxlength="60" value="' + esc(l.section) + '" placeholder="Umum"></label>' +
      '<datalist id="secs">' + secs.map(function (s) { return '<option value="' + esc(s) + '">'; }).join('') + '</datalist>' +
      '<label class="wide">Sisa (%)<div class="pct-row"><input type="range" name="range" min="0" max="100" step="1" value="' + Math.round(l.pct) + '"><input type="number" name="pct" min="0" max="100" step="any" required value="' + l.pct + '"></div></label>' +
      '<label class="wide">Reset dalam<input type="text" name="reset" value="' + esc(rem) + '" placeholder="mis. 2 jam 30 menit, 1 hari 4 jam, atau 90"><small>Kosongkan jika tidak ada jadwal reset. Angka saja dihitung menit.</small></label>' +
      '<div class="acts"><button class="btn sm" type="button" data-act="cancel-edit">Batal</button><button class="btn sm primary" type="submit">' + ic('check') + (isNew ? 'Tambah' : 'Simpan') + '</button></div>' +
      '</form></li>';
  }

  function bodyHTML(a) {
    var h = '<div class="tools">' +
      '<button class="btn sm" type="button" data-act="paste-toggle">' + ic('clipboard') + 'Tempel teks</button>' +
      '<button class="btn sm" type="button" data-act="add-limit">' + ic('plus') + 'Tambah limit</button>' +
      '<span class="sp"></span>' +
      '<button class="icon-btn sm" type="button" data-act="menu-acc" aria-haspopup="menu" aria-label="Aksi akun" title="Aksi akun">' + ic('more') + '</button>' +
      '</div>';

    if (ui.rename === a.id) {
      h += '<form class="panel inline-form" data-form="rename"><input type="text" name="email" required maxlength="120" value="' + esc(a.email) + '" aria-label="Nama akun">' +
        '<button class="btn sm primary" type="submit">' + ic('check') + 'Simpan</button><button class="btn sm" type="button" data-act="rename-cancel">Batal</button></form>';
    }
    if (ui.paste === a.id) {
      h += '<div class="panel"><textarea data-paste placeholder="Tempel teks limit di sini, akan terbaca otomatis"></textarea>' +
        '<div class="panel-foot"><span class="hint">Data limit yang sama akan ditimpa, yang lain dipertahankan.</span>' +
        '<button class="btn sm" type="button" data-act="paste-toggle">Tutup</button><button class="btn sm primary" type="button" data-act="paste-run">Proses</button></div></div>';
    }

    var newForm = ui.edit && ui.edit.id === a.id && ui.edit.i === 'new', rows = [];
    a.limits.forEach(function (l, i) { rows.push(creditRow(a, l, i)); });
    if (newForm) h += '<div class="sect">Limit baru</div><ul class="limits">' + limitForm(a, null, 'new') + '</ul>';
    if (!a.limits.length && !newForm) {
      h += '<div class="empty-acc">Belum ada limit. Tempel teks atau tambah manual.</div>';
    }
    if (rows.length) h += '<ul class="limits">' + rows.join('') + '</ul>';
    return h;
  }

  function cardHTML(a, idx) {
    var av = avg(a), lv = lvl(av), c = 2 * Math.PI * 17;
    var chips = a.limits.map(function (l) {
      return '<span class="chip" style="--p:' + (Math.round(eff(l) * 10) / 10) + '">' + esc(catLabel(l)) + '</span>';
    }).join('<span class="tok-sep" aria-hidden="true">|</span>');
    var enter = ui.fresh || ui.newIds[a.id];
    return '<li class="card' + (a.open ? ' open' : '') + (S.sel === a.id ? ' sel' : '') + (enter ? ' enter' : '') + '" data-id="' + a.id + '" style="--i:' + idx + ';--h:' + hue(a.email) + '">' +
      '<button class="head-btn" type="button" data-act="toggle" aria-expanded="' + !!a.open + '">' +
      '<span class="chev">' + ic('chev') + '</span>' +
      '<span class="avatar" aria-hidden="true">' + esc(a.email.charAt(0)) + '</span>' +
      '<span class="who"><span class="name"><span class="name-t">' + esc(a.email) + '</span><span class="target" title="Target tempel (Ctrl+V)" aria-label="Target tempel">' + ic('clipboard') + '</span></span>' +
      '<span class="meta">' + a.limits.length + ' limit · diperbarui ' + ago(a.updatedAt) + '</span></span>' +
      '<span class="score lv-' + lv + '"><svg viewBox="0 0 42 42"><circle class="trk" cx="21" cy="21" r="17" fill="none" stroke-width="4"/>' +
      (av > 0 ? '<circle class="val" cx="21" cy="21" r="17" fill="none" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + (c * av / 100) + ' ' + c + '"/>' : '') + '</svg>' +
      '<b class="num">' + (av >= 0 ? Math.round(av) : '—') + '</b></span>' +
      '</button>' +
      (a.limits.length ? '<div class="collapse chips-wrap"><div class="clip"><div class="chips">' + chips + '</div></div></div>' : '') +
      '<div class="collapse body-wrap"><div class="clip"><div class="body">' + bodyHTML(a) + '</div></div></div>' +
      '</li>';
  }

  function render() {
    closePops();
    renderStats();
    updateToolbar();
    var A = visibleAccounts(), list = $('list');
    if (!A.length) {
      list.innerHTML = S.accounts.length
        ? '<li class="empty">' + ic('search') + '<h3>Tidak ditemukan</h3><p>Tidak ada akun yang cocok dengan “' + esc(ui.q) + '”.</p></li>'
        : '<li class="empty">' + ic('users') + '<h3>Belum ada akun</h3><p>Tambahkan akun lewat kolom di atas, atau buka file JSON dari menu ⋮.</p></li>';
    } else {
      list.innerHTML = A.map(cardHTML).join('');
    }
    ui.fresh = false; ui.newIds = {};
  }

  /* Sinkron status buka/tutup tanpa render ulang agar animasi berjalan */
  function syncOpen() {
    document.querySelectorAll('#list .card').forEach(function (c) {
      var a = gs(c.getAttribute('data-id'));
      if (!a) return;
      c.classList.toggle('open', !!a.open);
      c.classList.toggle('sel', S.sel === a.id);
      c.querySelector('.head-btn').setAttribute('aria-expanded', !!a.open);
    });
  }

  /* ================= Aksi akun ================= */
  function toggle(id) {
    var a = gs(id);
    if (!a) return;
    var nv = !a.open;
    if (nv && !S.all) S.accounts.forEach(function (x) { x.open = false; });
    a.open = nv;
    S.sel = id;
    ui.edit = null; ui.paste = null; ui.rename = null;
    save(); syncOpen(); updateToolbar();
    if (nv) {
      setTimeout(function () {
        var c = document.querySelector('.card[data-id="' + id + '"]');
        if (c) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 120);
    }
  }
  function toggleAll() {
    var expanded = S.all && S.accounts.some(function (a) { return a.open; });
    if (expanded) { S.accounts.forEach(function (a) { a.open = false; }); S.all = false; }
    else { S.accounts.forEach(function (a) { a.open = true; }); S.all = true; }
    save(); syncOpen(); updateToolbar();
  }
  function addAccounts(raw) {
    var parts = raw.split(/[\s,;]+/).filter(Boolean), last = null, n = 0;
    parts.forEach(function (v) {
      var d = S.accounts.filter(function (x) { return x.email.toLowerCase() === v.toLowerCase(); })[0];
      if (!d) {
        d = { id: uid(), email: v, open: false, limits: [], updatedAt: null };
        S.accounts.push(d); ui.newIds[d.id] = 1; n++;
      }
      last = d;
    });
    if (!last) return;
    if (!S.all) S.accounts.forEach(function (x) { x.open = false; });
    last.open = true; S.sel = last.id;
    ui.q = ''; $('q').value = '';
    save(); render();
    toast(n > 1 ? n + ' akun ditambahkan' : n === 1 ? 'Akun ditambahkan: ' + last.email : 'Akun sudah ada: ' + last.email);
    setTimeout(function () {
      var c = document.querySelector('.card[data-id="' + last.id + '"]');
      if (c) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 120);
  }
  function deleteAccount(id) {
    var idx = S.accounts.findIndex(function (x) { return x.id === id; });
    if (idx < 0) return;
    var removed = S.accounts.splice(idx, 1)[0];
    if (S.sel === id) S.sel = S.accounts[0] ? S.accounts[0].id : null;
    ui.edit = ui.paste = ui.rename = null;
    save(); render();
    toast('Akun dihapus: ' + removed.email, {
      label: 'Urungkan',
      fn: function () { S.accounts.splice(Math.min(idx, S.accounts.length), 0, removed); S.sel = removed.id; save(); render(); }
    });
  }
  function deleteLimit(id, i) {
    var a = gs(id);
    if (!a || !a.limits[i]) return;
    var removed = a.limits.splice(i, 1)[0];
    ui.edit = null;
    save(); render();
    toast('Limit dihapus: ' + removed.label, {
      label: 'Urungkan',
      fn: function () { a.limits.splice(Math.min(i, a.limits.length), 0, removed); save(); render(); }
    });
  }

  /* ================= Menu konteks (akun & limit) ================= */
  var ctx = null;
  function openCtx(btn, kind, id, i) {
    var m = $('ctxMenu');
    if (!m.hidden && ctx && ctx.btn === btn) { closePops(); return; }
    closePops();
    ctx = { btn: btn, kind: kind, id: id, i: i };
    var item = function (c, icon, label, danger) {
      return '<button type="button" role="menuitem" data-c="' + c + '"' + (danger ? ' class="danger"' : '') + '>' + ic(icon) + label + '</button>';
    };
    m.innerHTML = kind === 'acc'
      ? item('rename', 'pencil', 'Ubah nama') + '<div class="pop-sep"></div>' + item('del', 'trash', 'Hapus akun', true)
      : item('edit', 'pencil', 'Edit limit') + '<div class="pop-sep"></div>' + item('del-limit', 'trash', 'Hapus limit', true);
    m.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    var r = btn.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w));
    var top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    m.style.left = left + 'px';
    m.style.top = top + 'px';
  }
  $('ctxMenu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-c]');
    if (!b || !ctx) return;
    var c = b.getAttribute('data-c'), id = ctx.id, i = ctx.i;
    closePops();
    if (c === 'rename') {
      ui.rename = id; render();
      var inp = document.querySelector('.card[data-id="' + id + '"] [data-form="rename"] input');
      if (inp) { inp.focus(); inp.select(); }
    } else if (c === 'del') deleteAccount(id);
    else if (c === 'edit') {
      ui.edit = { id: id, i: i }; render();
      var f = document.querySelector('.card[data-id="' + id + '"] [data-form="limit"] input[name="pct"]');
      if (f) { f.focus(); f.select(); }
    } else if (c === 'del-limit') deleteLimit(id, i);
  });
  window.addEventListener('scroll', function () { var m = $('ctxMenu'); if (!m.hidden) closePops(); }, true);
  window.addEventListener('resize', function () { closePops(); });

  /* ================= Event: daftar ================= */
  var list = $('list');
  list.addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (!card) return;
    var id = card.getAttribute('data-id'), t = e.target.closest('[data-act]'), act = t && t.getAttribute('data-act');
    if (!act) {
      if (S.sel !== id) { S.sel = id; save(); syncOpen(); }
      return;
    }
    var i = t.getAttribute('data-i');
    switch (act) {
      case 'menu-acc': e.stopPropagation(); openCtx(t, 'acc', id); return;
      case 'menu-lim': e.stopPropagation(); openCtx(t, 'lim', id, +i); return;
      case 'toggle': toggle(id); return;
      case 'del': deleteAccount(id); return;
      case 'paste-toggle': ui.paste = ui.paste === id ? null : id; S.sel = id; render(); if (ui.paste) { var ta = card.parentNode.querySelector('.card[data-id="' + id + '"] textarea'); ta && ta.focus(); } return;
      case 'paste-run': var tx = card.querySelector('textarea[data-paste]'); if (tx) applyPaste(id, tx.value); return;
      case 'rename-open': ui.rename = id; render(); var inp = document.querySelector('.card[data-id="' + id + '"] [data-form="rename"] input'); if (inp) { inp.focus(); inp.select(); } return;
      case 'rename-cancel': ui.rename = null; render(); return;
      case 'add-limit': ui.edit = { id: id, i: 'new' }; render(); var f1 = document.querySelector('.card[data-id="' + id + '"] [data-form="limit"] input'); if (f1) f1.focus(); return;
      case 'edit-limit': ui.edit = { id: id, i: +i }; render(); var f2 = document.querySelector('.card[data-id="' + id + '"] [data-form="limit"] input[name="pct"]'); if (f2) { f2.focus(); f2.select(); } return;
      case 'cancel-edit': ui.edit = null; render(); return;
      case 'del-limit': deleteLimit(id, +i); return;
    }
  });

  list.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, card = f.closest('.card'), a = gs(card.getAttribute('data-id')), kind = f.getAttribute('data-form');
    if (!a) return;
    var fd = new FormData(f);
    if (kind === 'rename') {
      var nm = String(fd.get('email')).trim();
      if (!nm) return;
      a.email = nm; ui.rename = null; save(); render(); toast('Nama akun diubah');
      return;
    }
    if (kind === 'limit') {
      var label = String(fd.get('label')).trim();
      if (!label) return;
      var pct = Math.max(0, Math.min(100, parseFloat(fd.get('pct'))));
      if (isNaN(pct)) return;
      var ms = parseDur(String(fd.get('reset')));
      var n = { section: String(fd.get('section')).trim() || 'Umum', label: label, pct: pct, resetAt: ms && pct < 100 ? Date.now() + ms : null };
      var i = f.getAttribute('data-i');
      if (i === 'new') upsert(a, n); else a.limits[+i] = n;
      a.updatedAt = Date.now(); ui.edit = null;
      save(); render(); toast('Limit disimpan');
    }
  });

  list.addEventListener('input', function (e) {
    var f = e.target.form;
    if (!f || f.getAttribute('data-form') !== 'limit') return;
    if (e.target.name === 'range') f.elements.pct.value = e.target.value;
    else if (e.target.name === 'pct') f.elements.range.value = e.target.value || 0;
  });

  list.addEventListener('paste', function (e) {
    var ta = e.target;
    if (!ta.matches || !ta.matches('textarea[data-paste]')) return;
    var id = ta.closest('.card').getAttribute('data-id');
    setTimeout(function () { applyPaste(id, ta.value); }, 0);
  });

  /* ================= Event: global ================= */
  document.addEventListener('paste', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    var txt = (e.clipboardData || window.clipboardData).getData('text');
    if (!txt) return;
    e.preventDefault();
    if (!S.sel || !gs(S.sel)) { toast('Pilih akun dulu sebagai target tempel'); return; }
    applyPaste(S.sel, txt);
  });

  document.addEventListener('keydown', function (e) {
    var tag = document.activeElement.tagName, inInput = /INPUT|TEXTAREA|SELECT/.test(tag);
    if (e.key === 'Escape') {
      closePops();
      if (document.activeElement === $('q')) { ui.q = ''; $('q').value = ''; $('search').classList.remove('open'); render(); $('q').blur(); }
      return;
    }
    if (inInput || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); $('email').focus(); return; }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !$('jsonDlg').open) {
      var A = visibleAccounts();
      if (!A.length) return;
      e.preventDefault();
      var idx = A.findIndex(function (x) { return x.id === S.sel; });
      idx = e.key === 'ArrowDown' ? (idx < A.length - 1 ? idx + 1 : 0) : (idx > 0 ? idx - 1 : A.length - 1);
      S.sel = A[idx].id; save(); syncOpen();
      var c = document.querySelector('.card[data-id="' + S.sel + '"]');
      if (c) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  /* Popover */
  function closePops(except) {
    if (ctx && ctx.btn) ctx.btn.setAttribute('aria-expanded', 'false');
    document.querySelectorAll('.pop').forEach(function (p) {
      if (p === except || p.hidden) return;
      p.hidden = true;
      var b = document.querySelector('[data-pop="' + p.id + '"]');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pop]');
    if (b) {
      var p = $(b.getAttribute('data-pop')), willOpen = p.hidden;
      closePops(willOpen ? p : null);
      p.hidden = !willOpen;
      b.setAttribute('aria-expanded', String(willOpen));
      return;
    }
    if (e.target.closest('.pop')) { if (e.target.closest('button')) setTimeout(function () { closePops(); }, 0); return; }
    closePops();
  });

  /* Menu data */
  $('dataMenu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-m]');
    if (!b) return;
    var m = b.getAttribute('data-m');
    if (m === 'link') fsLink();
    else if (m === 'open') fsOpen();
    else if (m === 'unlink') fsUnlink();
    else if (m === 'download') { downloadJson(); toast('limit-tracker.json diunduh'); }
    else if (m === 'json') { $('jsonTxt').value = JSON.stringify(S, null, 2); $('jsonMsg').textContent = ''; $('jsonDlg').showModal(); }
  });
  $('syncBtn').addEventListener('click', fsSync);

  /* Sort */
  $('sortMenu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sort]');
    if (!b) return;
    S.sort = b.getAttribute('data-sort');
    save(); render();
  });

  /* Tools list */
  $('expBtn').addEventListener('click', toggleAll);
  $('themeBtn').addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  $('searchBtn').addEventListener('click', function () {
    var s = $('search'), open = !s.classList.contains('open');
    s.classList.toggle('open', open);
    $('q').tabIndex = open ? 0 : -1;
    if (open) $('q').focus();
    else { ui.q = ''; $('q').value = ''; render(); }
  });
  $('q').addEventListener('input', function (e) { ui.q = e.target.value; render(); });

  /* Tambah akun */
  $('addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('email'), raw = inp.value.trim();
    if (!raw) { inp.focus(); return; }
    inp.value = '';
    $("addBtn").disabled = true;
    addAccounts(raw);
  });
  $('email').addEventListener('input', function (e) { $('addBtn').disabled = e.target.value.trim().length < 1; });

  /* Dialog JSON */
  $('jsonLoad').addEventListener('click', function () {
    var m = $('jsonMsg');
    try {
      var o = JSON.parse($('jsonTxt').value);
      if (!o || !Array.isArray(o.accounts)) throw 0;
      S = o; normalize(); save(); render();
      $('jsonDlg').close(); toast('Data JSON dimuat');
    } catch (err) { m.textContent = 'JSON tidak valid.'; }
  });
  $('jsonCopy').addEventListener('click', function () {
    var t = $('jsonTxt');
    t.select();
    (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).catch(function () { document.execCommand('copy'); });
    $('jsonMsg').textContent = 'Tersalin.';
  });
  $('jsonDlg').addEventListener('click', function (e) { if (e.target === this) this.close(); });

  /* Refresh waktu berkala (tidak mengganggu saat sedang mengedit) */
  setInterval(function () {
    var a = document.activeElement;
    if (ui.edit || ui.paste || ui.rename) return;
    if (document.querySelector('.pop:not([hidden])')) return;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
    render();
  }, 60000);

  /* ================= Init ================= */
  hydrate();
  applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  load();
  render();
  updateFsUI();
  initFs();
})();
