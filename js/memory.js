/* ========================================================================
   Sound Bites — memory test (free recall with background ambience)
   ======================================================================== */
window.SB = window.SB || {};
SB.memory = {};

const memState = {
  scene: 'park',
  presented: [],
  currentIdx: 0,
  paused: false,
  startTime: 0,
  showWord: false,
  interval: 3.0,
  snr: 5,
  lastResult: null,
};

function parseWords(raw) {
  return (raw || '').split(/[\n,;]+/).map(w => w.trim()).filter(Boolean);
}
function normalize(s) { return (s || '').toLowerCase().trim().replace(/[.,!?;:]/g,''); }

SB.memory.parseWords = parseWords;

SB.memory.start = async function() {
  const list = parseWords(document.getElementById('words').value);
  if (list.length === 0) { SB.app.toast('Please enter at least one word'); return; }
  memState.presented = list.slice();
  memState.currentIdx = 0;
  memState.scene = document.querySelector('.scene-btn.active')?.dataset.scene || 'park';
  memState.interval = parseFloat(document.getElementById('interval').value);
  memState.showWord = document.getElementById('show-word').value === 'yes';
  memState.snr = parseFloat(document.getElementById('snr').value);
  memState.startTime = Date.now();
  await SB.audio.startAmbient(memState.scene);
  SB.audio.setSNR(memState.snr);
  SB.app.show('countdown');
  const cn = document.getElementById('countdown-num');
  for (let n=3; n>=1; n--) { cn.textContent = n; await new Promise(r => setTimeout(r,1000)); }
  cn.textContent = '…'; await new Promise(r => setTimeout(r,400));
  SB.app.show('present');
  presentNext();
};

let presentTimer = null;
async function presentNext() {
  if (memState.currentIdx >= memState.presented.length) { finishPresentation(); return; }
  if (memState.paused) return;
  const word = memState.presented[memState.currentIdx];
  document.getElementById('present-status').textContent =
    `Word ${memState.currentIdx+1} of ${memState.presented.length}`;
  document.getElementById('progress').style.width =
    `${(memState.currentIdx / memState.presented.length) * 100}%`;
  const wd = document.getElementById('word-display');
  if (memState.showWord) {
    wd.classList.add('fade'); await new Promise(r => setTimeout(r,150));
    wd.textContent = word; wd.classList.remove('fade');
  } else {
    wd.textContent = '•';
  }
  SB.audio.speak(word);
  memState.currentIdx++;
  presentTimer = setTimeout(presentNext, memState.interval * 1000);
}

function finishPresentation() {
  document.getElementById('progress').style.width = '100%';
  setTimeout(() => { document.getElementById('progress').style.width = '0%'; }, 600);
  SB.audio.stopAmbient();
  SB.app.show('recall');
  document.getElementById('recall-input').focus();
  const isGerman = (document.getElementById('game-lang').value || 'en-US').startsWith('de');
  document.getElementById('recall-instructions').textContent = isGerman
    ? 'Bitte schreiben Sie alle Wörter auf, an die Sie sich erinnern, in beliebiger Reihenfolge.'
    : 'Type as many words as you remember, in any order.';
}

SB.memory.pause = function(btn) {
  memState.paused = !memState.paused;
  if (memState.paused) {
    clearTimeout(presentTimer);
    btn.textContent = '▶ Resume';
    SB.audio.cancelSpeech();
  } else {
    btn.textContent = '⏸ Pause';
    presentNext();
  }
};

SB.memory.stop = function() {
  if (!confirm('Stop presentation and go to recall?')) return;
  clearTimeout(presentTimer);
  SB.audio.cancelSpeech();
  memState.presented = memState.presented.slice(0, memState.currentIdx);
  finishPresentation();
};

SB.memory.score = function() {
  const recalled = parseWords(document.getElementById('recall-input').value).map(normalize);
  const target = memState.presented.map(normalize);
  const matches = []; const intrusions = []; const seen = new Set();
  recalled.forEach(r => {
    if (target.includes(r) && !seen.has(r)) { matches.push(r); seen.add(r); }
    else if (!target.includes(r)) intrusions.push(r);
  });
  const missed = target.filter(t => !seen.has(t));
  const pct = target.length ? Math.round(matches.length / target.length * 100) : 0;
  const dur = Math.round((Date.now() - memState.startTime) / 1000);

  document.getElementById('stat-correct').textContent = matches.length;
  document.getElementById('stat-missed').textContent = missed.length;
  document.getElementById('stat-intrusions').textContent = intrusions.length;
  document.getElementById('result-scene').textContent = memState.scene;
  document.getElementById('result-meta').textContent =
    `${matches.length}/${target.length} recalled (${pct}%) · ${memState.presented.length} words at ${memState.interval}s · SNR ${memState.snr>=0?'+':''}${memState.snr} dB · session ${dur}s`;

  const wd = document.getElementById('result-words'); wd.innerHTML = '';
  const head = document.createElement('div'); head.className = 'small'; head.style.marginBottom = '8px';
  head.textContent = 'Original list:';
  wd.appendChild(head);
  memState.presented.forEach(w => {
    const sp = document.createElement('span');
    sp.className = 'word-pill ' + (matches.includes(normalize(w)) ? 'match' : 'miss');
    sp.textContent = w;
    wd.appendChild(sp);
  });
  if (intrusions.length) {
    const h2 = document.createElement('div'); h2.className = 'small'; h2.style.margin = '14px 0 8px';
    h2.textContent = 'Intrusions:'; wd.appendChild(h2);
    intrusions.forEach(w => {
      const sp = document.createElement('span'); sp.className = 'word-pill intrusion'; sp.textContent = w;
      wd.appendChild(sp);
    });
  }
  SB.app.show('results');
  memState.lastResult = { matches, missed, intrusions, target, recalled, pct, dur };

  // Persist
  const errors = [];
  missed.forEach(w => errors.push({ kind: 'missed', word: w }));
  intrusions.forEach(w => errors.push({ kind: 'intrusion', word: w }));
  SB.storage.saveSession({
    type: 'memory',
    language: document.getElementById('game-lang').value,
    scene: memState.scene,
    score: { correct: matches.length, total: target.length, pct },
    errors, duration: dur,
    extra: { interval: memState.interval, snr: memState.snr },
  });
};

SB.memory.exportTxt = function() {
  const r = memState.lastResult; if (!r) return;
  const lines = [
    'SOUND BITES — Memory Test Results',
    '==================================',
    'Date:        ' + new Date().toLocaleString(),
    'Subject:     ' + (document.getElementById('subject-id').value || '(none)'),
    'Language:    ' + document.getElementById('game-lang').value,
    'Scene:       ' + memState.scene,
    'SNR:         ' + memState.snr + ' dB',
    'Interval:    ' + memState.interval + 's',
    'Words:       ' + r.target.length,
    '',
    'SCORE',
    '-----',
    'Correct:     ' + r.matches.length + '/' + r.target.length + ' (' + r.pct + '%)',
    'Missed:      ' + r.missed.length,
    'Intrusions:  ' + r.intrusions.length,
    '',
    'ORIGINAL LIST',
    '-------------',
    memState.presented.map(w => (r.matches.includes(normalize(w)) ? '[✓] ' : '[ ] ') + w).join('\n'),
    '',
    'RECALLED', '--------', r.recalled.join(', '),
    '',
    'INTRUSIONS', '----------',
    r.intrusions.length ? r.intrusions.join(', ') : '(none)',
  ].join('\n');
  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'soundbites-memory-' + Date.now() + '.txt'; a.click();
  URL.revokeObjectURL(url);
};
