/* ========================================================================
   Sound Bites — app glue
   Screen routing, tab switching, theme switcher, all event wiring,
   error reporting, canvas background for subject theme.
   ======================================================================== */
window.SB = window.SB || {};
SB.app = {};

// ---------- Global error handler ----------
window.addEventListener('error', (e) => {
  console.error('Sound Bites error:', e.error || e.message, e);
  const eb = document.getElementById('error-banner');
  if (eb) {
    eb.textContent = 'Error: ' + (e.error?.message || e.message);
    eb.style.display = 'block';
    setTimeout(() => { eb.style.display = 'none'; }, 6000);
  }
});

function safe(fn, label) {
  return function(...args) {
    try { return fn.apply(this, args); }
    catch(e) { console.error('[' + label + ']', e); SB.app.toast('Error in ' + label + ': ' + e.message); }
  };
}

SB.app.toast = function(msg, ms=2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
};

// ---------- Screen routing ----------
const ALL_SCREENS = [
  'setup','countdown','present','recall','results',
  'game-matching','game-odd','game-pairs','game-bingo-words','game-yesno','game-stress',
  'test-env-bingo','test-temporal','test-span','test-localize','test-dichotic',
];
SB.app.show = function(name) {
  ALL_SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.classList.toggle('hidden', s !== name);
  });
  document.getElementById('present-controls').classList.toggle('hidden', name !== 'present');
  if (name === 'setup') SB.storage.refreshDashboard();
};

// ---------- Theme switcher ----------
const THEME_KEY = 'soundbites_theme';
function applyTheme(name) {
  document.body.classList.remove('theme-clinical', 'theme-subject');
  document.body.classList.add('theme-' + name);
  localStorage.setItem(THEME_KEY, name);
}
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'clinical';
  document.getElementById('theme-select').value = saved;
  applyTheme(saved);
  if (saved === 'subject') startCanvas();
  else stopCanvas();
}
document.getElementById('theme-select').addEventListener('change', (e) => {
  applyTheme(e.target.value);
  if (e.target.value === 'subject') startCanvas(); else stopCanvas();
});

// ---------- Background canvas (subject theme only) ----------
let canvasRunning = false; let canvasFrame = null; let particles = []; let timeOffset = 0;
function resizeCanvas() {
  const c = document.getElementById('scene-canvas');
  c.width = window.innerWidth * devicePixelRatio;
  c.height = window.innerHeight * devicePixelRatio;
  c.style.width = window.innerWidth + 'px';
  c.style.height = window.innerHeight + 'px';
  initParticles();
}
function initParticles() {
  particles = [];
  const w = window.innerWidth, h = window.innerHeight;
  for (let i=0;i<60;i++) {
    particles.push({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.3)*0.3+0.15,
      size: 1.5 + Math.random()*2.5, angle: Math.random()*Math.PI*2,
    });
  }
}
function drawCanvas() {
  if (!canvasRunning) return;
  const c = document.getElementById('scene-canvas');
  const ctx = c.getContext('2d');
  const dpr = devicePixelRatio;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const w = window.innerWidth, h = window.innerHeight;
  timeOffset += 0.003;
  const grad = ctx.createLinearGradient(0,0, w*Math.cos(timeOffset*0.3+1), h);
  grad.addColorStop(0, '#0a1f24'); grad.addColorStop(0.5, '#143540'); grad.addColorStop(1, '#1b4a55');
  ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
  for (let i=0;i<3;i++) {
    const cx = w*(0.2+0.3*i+Math.sin(timeOffset*0.5+i)*0.15);
    const cy = h*(0.3+0.2*Math.cos(timeOffset*0.4+i*1.3));
    const r = Math.min(w,h)*0.28;
    const blob = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    blob.addColorStop(0,'rgba(140,220,200,0.4)'); blob.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = blob; ctx.fillRect(0,0,w,h);
  }
  ctx.save();
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.angle += 0.01;
    if (p.x<-10) p.x=w+10; if (p.x>w+10) p.x=-10;
    if (p.y<-10) p.y=h+10; if (p.y>h+10) p.y=-10;
    ctx.fillStyle = `rgba(180,220,200,${0.18+0.2*Math.sin(p.angle)})`;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    p.x += Math.sin(p.angle)*0.4;
  });
  ctx.restore();
  canvasFrame = requestAnimationFrame(drawCanvas);
}
function startCanvas() {
  if (canvasRunning) return;
  canvasRunning = true; resizeCanvas(); drawCanvas();
}
function stopCanvas() {
  canvasRunning = false;
  if (canvasFrame) cancelAnimationFrame(canvasFrame);
}
window.addEventListener('resize', () => { if (canvasRunning) resizeCanvas(); });

// ============================================================
// SETUP wiring
// ============================================================

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('tab-' + tab.dataset.tab);
    if (panel) panel.classList.add('active');
    if (tab.dataset.tab === 'dash') SB.storage.refreshDashboard();
  });
});

// Scene picker
document.querySelectorAll('.scene-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Volume / SNR / rate / interval
const bgVol = document.getElementById('bg-vol');
const bgVolVal = document.getElementById('bg-vol-val');
bgVol.addEventListener('input', () => {
  bgVolVal.textContent = bgVol.value + '%';
  SB.audio.setBgVolume(bgVol.value / 100);
});
const snr = document.getElementById('snr');
const snrVal = document.getElementById('snr-val');
snr.addEventListener('input', () => {
  const v = parseInt(snr.value);
  snrVal.textContent = (v >= 0 ? '+' : '') + v + ' dB';
  SB.audio.setSNR(v);
});
const rate = document.getElementById('rate');
const rateVal = document.getElementById('rate-val');
rate.addEventListener('input', () => { rateVal.textContent = parseFloat(rate.value).toFixed(2) + '×'; });
const intv = document.getElementById('interval');
const intvVal = document.getElementById('interval-val');
intv.addEventListener('input', () => { intvVal.textContent = parseFloat(intv.value).toFixed(1) + 's'; });

// Voice test
document.getElementById('btn-voice-test').addEventListener('click', () => {
  SB.audio.ensure();
  const lang = document.getElementById('game-lang').value;
  const sample = lang.startsWith('de') ? 'Das ist die ausgewählte Stimme.' : 'This is the selected voice.';
  SB.audio.speak(sample, { rate: 1.0 });
});

// Language change rebuilds voice list
document.getElementById('game-lang').addEventListener('change', () => {
  SB.audio.rebuildVoiceList();
});

// Preview ambient
document.getElementById('preview-bg').addEventListener('click', safe(() => {
  SB.audio.ensure();
  const scene = document.querySelector('.scene-btn.active')?.dataset.scene || 'park';
  SB.audio.startAmbient(scene);
  setTimeout(() => SB.audio.stopAmbient(), 6000);
}, 'preview-bg'));

// Word list
const wordsArea = document.getElementById('words');
const wordCount = document.getElementById('word-count');
wordsArea.addEventListener('input', () => {
  wordCount.textContent = SB.memory.parseWords(wordsArea.value).length;
});
document.getElementById('btn-randomize').addEventListener('click', () => {
  const w = SB.memory.parseWords(wordsArea.value);
  for (let i=w.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [w[i],w[j]]=[w[j],w[i]]; }
  wordsArea.value = w.join('\n');
});
document.getElementById('btn-start-memory').addEventListener('click', safe(SB.memory.start, 'start-memory'));

// Memory test flow buttons
document.getElementById('btn-pause').addEventListener('click', (e) => SB.memory.pause(e.target));
document.getElementById('btn-stop').addEventListener('click', SB.memory.stop);
document.getElementById('btn-back-setup').addEventListener('click', () => {
  if (!confirm('Cancel this test? Recall will not be scored.')) return;
  SB.audio.stopAmbient(); SB.app.show('setup');
});
document.getElementById('btn-score').addEventListener('click', safe(SB.memory.score, 'score-recall'));
document.getElementById('btn-export').addEventListener('click', SB.memory.exportTxt);
document.getElementById('btn-new-test').addEventListener('click', () => {
  document.getElementById('recall-input').value = '';
  SB.app.show('setup');
});

// ---------- Game launchers ----------
document.querySelectorAll('[data-game]').forEach(card => {
  card.addEventListener('click', safe(() => {
    SB.audio.ensure();
    const g = card.dataset.game;
    if (g === 'matching') SB.games.startMatching();
    else if (g === 'odd') SB.games.startOdd();
    else if (g === 'pairs') SB.games.startPairs();
    else if (g === 'yesno') SB.games.startYesNo();
    else if (g === 'stress') SB.games.startStress();
    else if (g === 'bingo-words') SB.games.startWordBingo();
    else SB.app.toast('Unknown game: ' + g);
  }, 'game-launch'));
});

// ---------- Test launchers ----------
document.querySelectorAll('[data-test]').forEach(card => {
  card.addEventListener('click', safe(() => {
    SB.audio.ensure();
    const t = card.dataset.test;
    if (t === 'env-bingo') SB.tests.startEnvBingo();
    else if (t === 'temporal-pitch') SB.tests.startTemporal('pitch');
    else if (t === 'temporal-dur') SB.tests.startTemporal('duration');
    else if (t === 'span') SB.tests.startSpan();
    else if (t === 'localize') SB.tests.startLocalize();
    else if (t === 'dichotic') SB.tests.startDichotic();
    else SB.app.toast('Unknown test: ' + t);
  }, 'test-launch'));
});

// ---------- Per-game in-screen buttons ----------
document.getElementById('btn-match-restart').addEventListener('click', safe(SB.games.startMatching, 'match-restart'));
document.getElementById('btn-odd-play').addEventListener('click', safe(() => SB.games._oddPlay(), 'odd-play'));
document.getElementById('btn-odd-next').addEventListener('click', safe(() => SB.games._oddNext(), 'odd-next'));
document.getElementById('btn-pairs-play').addEventListener('click', safe(() => SB.games._pairsPlay(), 'pairs-play'));
document.getElementById('btn-pairs-apply').addEventListener('click', safe(SB.games.startPairs, 'pairs-apply'));
document.getElementById('btn-bw-play').addEventListener('click', safe(() => SB.games._bwPlay(), 'bw-play'));
document.getElementById('btn-bw-restart').addEventListener('click', safe(SB.games.startWordBingo, 'bw-restart'));
document.getElementById('btn-yesno-play').addEventListener('click', safe(() => SB.games._yesNoPlay(), 'yesno-play'));
document.getElementById('btn-stress-play').addEventListener('click', safe(() => SB.games._stressPlay(), 'stress-play'));
document.querySelectorAll('#yesno-buttons .yesno-btn').forEach(b => {
  b.addEventListener('click', () => SB.games._yesNoChoice(b));
});

// New tests buttons
document.getElementById('btn-eb-play').addEventListener('click', safe(() => SB.tests._ebPlay(), 'eb-play'));
document.getElementById('btn-eb-restart').addEventListener('click', safe(SB.tests.startEnvBingo, 'eb-restart'));
document.getElementById('btn-tp-play').addEventListener('click', safe(() => SB.tests._tpPlay(), 'tp-play'));
document.getElementById('btn-span-play').addEventListener('click', safe(() => SB.tests._spanPlay(), 'span-play'));
document.getElementById('btn-span-submit').addEventListener('click', safe(() => SB.tests._spanSubmit(), 'span-submit'));
document.getElementById('span-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') SB.tests._spanSubmit();
});
document.getElementById('btn-loc-play').addEventListener('click', safe(() => SB.tests._locPlay(), 'loc-play'));
document.querySelectorAll('.loc-btn').forEach(b => {
  b.addEventListener('click', () => SB.tests._locChoice(b.dataset.side, b));
});
document.getElementById('btn-dl-play').addEventListener('click', safe(() => SB.tests._dlPlay(), 'dl-play'));
document.getElementById('btn-dl-submit').addEventListener('click', safe(() => SB.tests._dlSubmit(), 'dl-submit'));

// "Back" buttons (uniform class on every game/test screen)
document.querySelectorAll('.back-to-setup').forEach(b => {
  b.addEventListener('click', () => {
    SB.audio.stopAmbient();
    SB.audio.cancelSpeech();
    SB.app.show('setup');
  });
});

// Dashboard controls
document.getElementById('dash-filter').addEventListener('input', () => SB.storage.refreshDashboard());
document.getElementById('dash-type-filter').addEventListener('change', () => SB.storage.refreshDashboard());
document.getElementById('btn-clear-dash').addEventListener('click', () => {
  if (!confirm('Permanently delete all session data?')) return;
  SB.storage.clear();
  SB.app.toast('All sessions deleted');
});
document.getElementById('btn-export-csv').addEventListener('click', () => SB.storage.exportCSV());

// ---------- Init ----------
loadTheme();
SB.audio.loadVoices();
SB.storage.refreshDashboard();
console.log('[Sound Bites] ready.');
