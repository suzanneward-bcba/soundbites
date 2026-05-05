/* ========================================================================
   Sound Bites — storage & dashboard
   localStorage-backed session log with category aggregation + CSV export.
   ======================================================================== */
window.SB = window.SB || {};
SB.storage = {};

const STORAGE_KEY = 'soundbites_sessions_v2';

const TYPE_LABELS = {
  memory:        'Memory test',
  matching:      'Memory matching',
  odd:           'Odd one out',
  pairs:         'Minimal pairs',
  yesno:         'Picture match',
  stress:        'Syllable stress',
  'bingo-words': 'Word bingo',
  'env-bingo':   'Environmental sound ID',
  'temporal-pitch': 'Pitch pattern',
  'temporal-dur':   'Duration pattern',
  span:          'Digit span',
  localize:      'Sound localization',
  dichotic:      'Dichotic listening',
};
SB.storage.TYPE_LABELS = TYPE_LABELS;

const CATEGORY_GROUPS = {
  'Memory':       ['memory','matching','span'],
  'Discrimination': ['pairs','yesno','stress'],
  'Recognition':  ['odd','bingo-words','env-bingo'],
  'Temporal':     ['temporal-pitch','temporal-dur'],
  'Spatial':      ['localize','dichotic'],
};

SB.storage.loadSessions = function() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { console.error('loadSessions', e); return []; }
};

SB.storage.saveSession = function(record) {
  try {
    const all = SB.storage.loadSessions();
    const subject = (document.getElementById('subject-id')?.value || '').trim();
    all.push({
      id: Date.now(),
      date: new Date().toISOString(),
      subject,
      ...record,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    SB.app.toast('Session saved');
  } catch(e) {
    console.error('saveSession', e);
    SB.app.toast('Could not save: ' + e.message);
  }
};

SB.storage.refreshDashboard = function() {
  const all = SB.storage.loadSessions();
  const filterSubj = (document.getElementById('dash-filter')?.value || '').trim().toLowerCase();
  const filterType = document.getElementById('dash-type-filter')?.value || '';
  const sessions = all.filter(s => {
    if (filterSubj && !(s.subject || '').toLowerCase().includes(filterSubj)) return false;
    if (filterType && s.type !== filterType) return false;
    return true;
  });

  // ---- summary ----
  document.getElementById('dash-total').textContent = sessions.length;
  let totalWords = 0, sumPct = 0, pctCount = 0;
  sessions.forEach(s => {
    totalWords += s.score?.total || 0;
    if (s.score?.pct != null) { sumPct += s.score.pct; pctCount++; }
  });
  document.getElementById('dash-words').textContent = totalWords;
  document.getElementById('dash-acc').textContent = pctCount ? Math.round(sumPct/pctCount) + '%' : '—';

  // ---- per-category bars ----
  const catDiv = document.getElementById('dash-by-category');
  catDiv.innerHTML = '';
  let anyCat = false;
  Object.entries(CATEGORY_GROUPS).forEach(([groupName, types]) => {
    const items = sessions.filter(s => types.includes(s.type));
    if (items.length === 0) return;
    anyCat = true;
    let sumPct = 0, n = 0;
    items.forEach(s => { if (s.score?.pct != null) { sumPct += s.score.pct; n++; } });
    const avg = n ? Math.round(sumPct/n) : 0;
    const row = document.createElement('div');
    row.className = 'cat-bar';
    row.innerHTML = `
      <span>${groupName} <small style="color:var(--muted);">(${items.length} sessions)</small></span>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${avg}%;"></div></div>
      <strong>${avg}%</strong>`;
    catDiv.appendChild(row);
  });
  if (!anyCat) catDiv.textContent = 'No sessions yet.';

  // ---- per-item errors ----
  const wordCounts = new Map();
  const contrastCounts = new Map();
  sessions.forEach(s => {
    (s.errors || []).forEach(e => {
      const key = e.target || e.word || e.heard || e.picture || e.given;
      if (key) wordCounts.set(key, (wordCounts.get(key) || 0) + 1);
      if (e.contrast) contrastCounts.set(e.contrast, (contrastCounts.get(e.contrast) || 0) + 1);
    });
  });
  const errDiv = document.getElementById('dash-errors');
  errDiv.innerHTML = '';
  if (wordCounts.size === 0 && contrastCounts.size === 0) {
    errDiv.textContent = 'No errors logged yet.';
  } else {
    if (wordCounts.size) {
      const top = [...wordCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15);
      const head = document.createElement('div');
      head.className = 'small'; head.style.marginBottom = '6px';
      head.textContent = 'Most-missed items:';
      errDiv.appendChild(head);
      top.forEach(([w,n]) => {
        const sp = document.createElement('span'); sp.className = 'err-bar';
        sp.innerHTML = w + ' <small>×' + n + '</small>';
        errDiv.appendChild(sp);
      });
    }
    if (contrastCounts.size) {
      const head = document.createElement('div');
      head.className = 'small'; head.style.margin = '12px 0 6px';
      head.textContent = 'Phoneme-contrast errors:';
      errDiv.appendChild(head);
      [...contrastCounts.entries()].sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => {
        const sp = document.createElement('span'); sp.className = 'err-bar';
        const labels = SB.data.PAIR_LABELS[c] || { left: c, right: '' };
        sp.innerHTML = labels.left + '/' + labels.right + ' <small>×' + n + '</small>';
        errDiv.appendChild(sp);
      });
    }
  }

  // ---- session table ----
  const tbody = document.querySelector('#dash-table tbody');
  tbody.innerHTML = '';
  sessions.slice(-50).reverse().forEach(s => {
    const tr = document.createElement('tr');
    const d = new Date(s.date);
    tr.innerHTML = `
      <td>${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
      <td>${s.subject || '—'}</td>
      <td>${TYPE_LABELS[s.type] || s.type}</td>
      <td>${s.language || '—'}</td>
      <td>${s.score ? (s.score.correct + '/' + s.score.total + ' (' + s.score.pct + '%)') : '—'}</td>
      <td>${(s.errors || []).length}</td>`;
    tbody.appendChild(tr);
  });
};

SB.storage.exportCSV = function() {
  const all = SB.storage.loadSessions();
  if (!all.length) { SB.app.toast('No sessions to export'); return; }
  const rows = [['date','subject','activity','language','scene','correct','total','percent','duration_s','error_count','errors_detail']];
  all.forEach(s => {
    const errStr = (s.errors || []).map(e => Object.entries(e)
      .map(([k,v]) => k+'='+(Array.isArray(v) ? v.join('|') : v)).join(';')).join(' / ');
    rows.push([
      s.date, s.subject || '', s.type, s.language || '', s.scene || '',
      s.score?.correct ?? '', s.score?.total ?? '', s.score?.pct ?? '',
      s.duration ?? '', (s.errors || []).length, errStr,
    ]);
  });
  const csv = rows.map(r => r.map(c => {
    const v = String(c ?? '');
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g,'""') + '"' : v;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'soundbites-sessions-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
};

SB.storage.clear = function() {
  localStorage.removeItem(STORAGE_KEY);
  SB.storage.refreshDashboard();
};
