/* ========================================================================
   Sound Bites — new processing tests
   env-bingo (real environmental sounds), pitch pattern, duration pattern,
   digit span, sound localization, dichotic listening.
   ======================================================================== */
window.SB = window.SB || {};
SB.tests = {};

function shuffle(a) {
  const x = [...a];
  for (let i=x.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; }
  return x;
}
function langCode() { return document.getElementById('game-lang').value || 'en-US'; }
function langKey() { return langCode().startsWith('de') ? 'de' : 'en'; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// Environmental Sound ID
// ============================================================
const ebState = { board: [], queue: [], current: null, found: 0, misses: 0, total: 9, errors: [], startTime: 0 };

SB.tests.startEnvBingo = function() {
  const size = parseInt(document.getElementById('eb-size').value);
  const cols = size === 9 ? 3 : 4;
  const k = langKey();
  ebState.board = shuffle(SB.data.ENV_SOUNDS).slice(0, size).map(s => ({
    id: s.id, emoji: s.emoji, label: s[k], found: false,
  }));
  ebState.queue = shuffle(ebState.board.map((_, i) => i));
  ebState.found = 0; ebState.misses = 0; ebState.total = size;
  ebState.errors = []; ebState.startTime = Date.now();
  document.getElementById('eb-found').textContent = '0';
  document.getElementById('eb-total').textContent = size;
  document.getElementById('eb-misses').textContent = '0';
  const grid = document.getElementById('eb-grid');
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.maxWidth = (cols * 130) + 'px';
  grid.innerHTML = '';
  ebState.board.forEach((cell, i) => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'match-card flipped';
    el.style.fontSize = 'clamp(36px, 7vw, 64px)';
    el.innerHTML = cell.emoji + '<div style="font-size:11px; color: var(--muted); margin-top:6px;">' + cell.label + '</div>';
    el.dataset.idx = i;
    el.addEventListener('click', () => onEbTap(i, el));
    grid.appendChild(el);
  });
  document.getElementById('eb-feedback').textContent = '';
  SB.app.show('test-env-bingo');
  setTimeout(playNextEb, 600);
};

function playNextEb() {
  if (ebState.queue.length === 0) {
    document.getElementById('eb-feedback').textContent = `Board complete. ${ebState.misses} misses.`;
    document.getElementById('eb-feedback').className = 'feedback-flash good';
    finishTest('env-bingo', ebState, ebState.found, ebState.total, { misses: ebState.misses });
    return;
  }
  ebState.current = ebState.queue[0];
  SB.audio.playEnv(ebState.board[ebState.current].id);
}

function onEbTap(idx, el) {
  if (ebState.current === null) return;
  if (ebState.board[idx].found) return;
  const fb = document.getElementById('eb-feedback');
  if (idx === ebState.current) {
    ebState.board[idx].found = true;
    el.classList.add('matched');
    ebState.found++;
    document.getElementById('eb-found').textContent = ebState.found;
    ebState.queue.shift();
    fb.textContent = '✓ Correct'; fb.className = 'feedback-flash good';
    setTimeout(playNextEb, 1200);
  } else {
    ebState.misses++;
    document.getElementById('eb-misses').textContent = ebState.misses;
    fb.textContent = '✗ Try again'; fb.className = 'feedback-flash bad';
    ebState.errors.push({
      kind: 'env-wrong',
      target: ebState.board[ebState.current].label,
      given: ebState.board[idx].label,
    });
    el.style.transform = 'scale(0.95)';
    setTimeout(() => { el.style.transform = ''; }, 150);
  }
}
SB.tests._ebPlay = () => {
  if (ebState.current !== null && ebState.queue.length) SB.audio.playEnv(ebState.board[ebState.current].id);
};

// ============================================================
// Temporal Pattern (pitch or duration)
// ============================================================
const tpState = { mode: 'pitch', round: 0, score: 0, current: null, answered: false, errors: [], startTime: 0 };

const PITCH_HIGH = 1500, PITCH_LOW = 800;
const DUR_LONG = 500, DUR_SHORT = 200;

SB.tests.startTemporal = function(mode) {
  tpState.mode = mode === 'duration' ? 'duration' : 'pitch';
  tpState.round = 0; tpState.score = 0; tpState.errors = []; tpState.startTime = Date.now();
  document.getElementById('tp-score').textContent = '0';
  document.getElementById('temporal-title').textContent = tpState.mode === 'pitch' ? '🎚️ Pitch Pattern' : '⏱️ Duration Pattern';
  document.getElementById('temporal-subtitle').textContent =
    tpState.mode === 'pitch'
      ? 'Listen to three tones (high or low). Pick the pattern you heard.'
      : 'Listen to three tones (long or short). Pick the pattern you heard.';
  SB.app.show('test-temporal');
  nextTpRound();
};

function generatePattern() {
  // Make a 3-element pattern with high/low or long/short, ensure not all-same
  const opts = ['1','0'];
  let p;
  do {
    p = Array.from({length: 3}, () => opts[Math.floor(Math.random()*2)]).join('');
  } while (p === '000' || p === '111');
  return p;
}

async function playTpSequence(pattern) {
  for (const ch of pattern) {
    if (tpState.mode === 'pitch') {
      await SB.audio.playTone(ch === '1' ? PITCH_HIGH : PITCH_LOW, 350);
    } else {
      await SB.audio.playTone(1000, ch === '1' ? DUR_LONG : DUR_SHORT);
    }
    await sleep(150);
  }
}

function patternToSymbols(p) {
  if (tpState.mode === 'pitch') return p.split('').map(c => c === '1' ? 'H' : 'L').join('-');
  return p.split('').map(c => c === '1' ? '━━' : '━').join(' ');
}

function nextTpRound() {
  if (tpState.round >= 10) {
    finishTest(tpState.mode === 'pitch' ? 'temporal-pitch' : 'temporal-dur', tpState, tpState.score, 10);
    return;
  }
  const correct = generatePattern();
  tpState.current = correct; tpState.answered = false; tpState.round++;
  document.getElementById('tp-round').textContent = tpState.round;
  document.getElementById('tp-feedback').textContent = '';
  document.getElementById('tp-feedback').className = 'feedback-flash';
  // Generate 3 distinct options including correct
  const options = new Set([correct]);
  while (options.size < 3) {
    const p = generatePattern();
    options.add(p);
  }
  const cont = document.getElementById('tp-choices'); cont.innerHTML = '';
  shuffle([...options]).forEach(p => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'choice-btn'; b.dataset.pattern = p;
    b.style.fontFamily = 'monospace';
    b.style.fontSize = '20px';
    b.textContent = patternToSymbols(p);
    b.addEventListener('click', () => onTpChoice(p, b, cont));
    cont.appendChild(b);
  });
  setTimeout(() => playTpSequence(correct), 500);
}

function onTpChoice(p, btn, cont) {
  if (tpState.answered) return;
  tpState.answered = true;
  const right = (p === tpState.current);
  btn.classList.add(right ? 'correct' : 'wrong');
  cont.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  const fb = document.getElementById('tp-feedback');
  if (right) {
    tpState.score++;
    document.getElementById('tp-score').textContent = tpState.score;
    fb.textContent = '✓ Correct'; fb.className = 'feedback-flash good';
  } else {
    fb.textContent = `✗ Pattern was ${patternToSymbols(tpState.current)}`;
    fb.className = 'feedback-flash bad';
    cont.querySelectorAll('.choice-btn').forEach(b => { if (b.dataset.pattern === tpState.current) b.classList.add('correct'); });
    tpState.errors.push({ kind: 'tp-wrong', target: tpState.current, given: p, mode: tpState.mode });
  }
  setTimeout(nextTpRound, 1500);
}
SB.tests._tpPlay = () => { if (tpState.current) playTpSequence(tpState.current); };

// ============================================================
// Digit Span (forward then backward, increasing length until 2 fails)
// ============================================================
const spanState = {
  direction: 'forward',  // 'forward' or 'backward'
  length: 3,
  consecutiveFails: 0,
  bestForward: 0,
  bestBackward: 0,
  current: null,
  errors: [],
  startTime: 0,
};

SB.tests.startSpan = function() {
  spanState.direction = 'forward';
  spanState.length = 3;
  spanState.consecutiveFails = 0;
  spanState.bestForward = 0; spanState.bestBackward = 0;
  spanState.errors = [];
  spanState.startTime = Date.now();
  document.getElementById('span-score').textContent = '0';
  document.getElementById('span-direction').textContent = 'Forward';
  document.getElementById('span-len').textContent = '3';
  document.getElementById('span-input').value = '';
  document.getElementById('span-feedback').textContent = '';
  SB.app.show('test-span');
  setTimeout(playSpan, 400);
};

function genDigits(n) {
  const arr = [];
  let last = -1;
  for (let i=0; i<n; i++) {
    let d;
    do { d = Math.floor(Math.random() * 10); } while (d === last);
    arr.push(d); last = d;
  }
  return arr;
}

async function playSpan() {
  const digits = genDigits(spanState.length);
  spanState.current = digits;
  document.getElementById('span-input').value = '';
  document.getElementById('span-feedback').textContent = '';
  document.getElementById('span-feedback').className = 'feedback-flash';
  // Speak digits one at a time at ~1s interval
  for (const d of digits) {
    await SB.audio.speak(String(d), { rate: 0.95 });
    await sleep(700);
  }
  document.getElementById('span-input').focus();
}

SB.tests._spanPlay = playSpan;

SB.tests._spanSubmit = function() {
  if (!spanState.current) return;
  const raw = document.getElementById('span-input').value;
  const given = raw.replace(/[^0-9]/g, '').split('').map(Number);
  const target = spanState.direction === 'forward'
    ? spanState.current.slice()
    : spanState.current.slice().reverse();
  const right = given.length === target.length && given.every((d, i) => d === target[i]);
  const fb = document.getElementById('span-feedback');
  if (right) {
    fb.textContent = `✓ Correct (length ${spanState.length})`;
    fb.className = 'feedback-flash good';
    spanState.consecutiveFails = 0;
    if (spanState.direction === 'forward') spanState.bestForward = Math.max(spanState.bestForward, spanState.length);
    else spanState.bestBackward = Math.max(spanState.bestBackward, spanState.length);
    spanState.length++;
    document.getElementById('span-len').textContent = spanState.length;
    document.getElementById('span-score').textContent = spanState.bestForward + spanState.bestBackward;
    setTimeout(playSpan, 900);
  } else {
    fb.textContent = `✗ Was ${target.join(' ')}`;
    fb.className = 'feedback-flash bad';
    spanState.errors.push({
      kind: 'span-wrong', direction: spanState.direction, length: spanState.length,
      target: target.join(''), given: given.join(''),
    });
    spanState.consecutiveFails++;
    if (spanState.consecutiveFails >= 2) {
      // Switch to backward, or finish
      if (spanState.direction === 'forward') {
        spanState.direction = 'backward';
        spanState.length = 3;
        spanState.consecutiveFails = 0;
        document.getElementById('span-direction').textContent = 'Backward';
        document.getElementById('span-len').textContent = '3';
        setTimeout(() => {
          alert('Forward span complete. Now: backward — repeat the digits in REVERSE order.');
          playSpan();
        }, 800);
      } else {
        // Both done
        const totalScore = spanState.bestForward + spanState.bestBackward;
        finishTest('span', spanState, totalScore, 18, {
          forward: spanState.bestForward, backward: spanState.bestBackward,
        });
      }
    } else {
      // Try again at same length
      setTimeout(playSpan, 1500);
    }
  }
};

// ============================================================
// Sound Localization
// ============================================================
const locState = { round: 0, score: 0, current: null, answered: false, errors: [], startTime: 0 };

const LOC_SIDES = ['left','center','right'];
const LOC_PAN = { left: -0.95, center: 0, right: 0.95 };

SB.tests.startLocalize = function() {
  locState.round = 0; locState.score = 0; locState.errors = []; locState.startTime = Date.now();
  document.getElementById('loc-score').textContent = '0';
  SB.app.show('test-localize');
  nextLocRound();
};

function nextLocRound() {
  if (locState.round >= 12) {
    finishTest('localize', locState, locState.score, 12);
    return;
  }
  locState.current = LOC_SIDES[Math.floor(Math.random() * 3)];
  locState.answered = false; locState.round++;
  document.getElementById('loc-round').textContent = locState.round;
  document.getElementById('loc-feedback').textContent = '';
  document.getElementById('loc-feedback').className = 'feedback-flash';
  document.querySelectorAll('.loc-btn').forEach(b => { b.classList.remove('correct','wrong'); b.disabled = false; });
  setTimeout(() => SB.audio.playNoiseBurst(500, { pan: LOC_PAN[locState.current], volume: 0.4 }), 400);
}
SB.tests._locPlay = () => {
  if (locState.current) SB.audio.playNoiseBurst(500, { pan: LOC_PAN[locState.current], volume: 0.4 });
};

SB.tests._locChoice = function(side, btn) {
  if (locState.answered) return;
  locState.answered = true;
  document.querySelectorAll('.loc-btn').forEach(b => b.disabled = true);
  const right = (side === locState.current);
  btn.classList.add(right ? 'correct' : 'wrong');
  const fb = document.getElementById('loc-feedback');
  if (right) {
    locState.score++;
    document.getElementById('loc-score').textContent = locState.score;
    fb.textContent = '✓ Correct'; fb.className = 'feedback-flash good';
  } else {
    fb.textContent = `✗ Sound was on the ${locState.current}`;
    fb.className = 'feedback-flash bad';
    document.querySelectorAll('.loc-btn').forEach(b => { if (b.dataset.side === locState.current) b.classList.add('correct'); });
    locState.errors.push({ kind: 'loc-wrong', target: locState.current, given: side });
  }
  setTimeout(nextLocRound, 1500);
};

// ============================================================
// Dichotic Listening (different env sound in each ear)
// ============================================================
const dlState = { round: 0, score: 0, current: null, answered: false, errors: [], startTime: 0 };

SB.tests.startDichotic = function() {
  dlState.round = 0; dlState.score = 0; dlState.errors = []; dlState.startTime = Date.now();
  document.getElementById('dl-score').textContent = '0';
  // Populate selects with all env sounds + an "I don't know" option
  const k = langKey();
  const opts = SB.data.ENV_SOUNDS.map(s => ({ value: s.id, label: s[k] + ' ' + s.emoji }));
  ['dl-left','dl-right'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">— pick —</option>';
    opts.forEach(o => { const op = document.createElement('option'); op.value=o.value; op.textContent=o.label; sel.appendChild(op); });
  });
  SB.app.show('test-dichotic');
  nextDlRound();
};

function nextDlRound() {
  if (dlState.round >= 10) {
    finishTest('dichotic', dlState, dlState.score, 20);  // 2 points per round (left+right)
    return;
  }
  const pool = shuffle(SB.data.ENV_SOUNDS).slice(0, 2);
  dlState.current = { left: pool[0].id, right: pool[1].id };
  dlState.answered = false; dlState.round++;
  document.getElementById('dl-round').textContent = dlState.round;
  document.getElementById('dl-feedback').textContent = '';
  document.getElementById('dl-feedback').className = 'feedback-flash';
  document.getElementById('dl-left').value = '';
  document.getElementById('dl-right').value = '';
  setTimeout(() => playDichotic(), 400);
}

function playDichotic() {
  if (!dlState.current) return;
  SB.audio.playEnv(dlState.current.left, { pan: -0.95, volume: 0.7 });
  setTimeout(() => SB.audio.playEnv(dlState.current.right, { pan: 0.95, volume: 0.7 }), 50);
}
SB.tests._dlPlay = playDichotic;

SB.tests._dlSubmit = function() {
  if (dlState.answered || !dlState.current) return;
  dlState.answered = true;
  const givenL = document.getElementById('dl-left').value;
  const givenR = document.getElementById('dl-right').value;
  const k = langKey();
  let pts = 0;
  const errs = [];
  if (givenL === dlState.current.left) pts++;
  else errs.push({ kind: 'dl-wrong', side: 'left', target: SB.data.ENV_SOUNDS.find(s => s.id===dlState.current.left)[k], given: givenL ? SB.data.ENV_SOUNDS.find(s => s.id===givenL)[k] : '(blank)' });
  if (givenR === dlState.current.right) pts++;
  else errs.push({ kind: 'dl-wrong', side: 'right', target: SB.data.ENV_SOUNDS.find(s => s.id===dlState.current.right)[k], given: givenR ? SB.data.ENV_SOUNDS.find(s => s.id===givenR)[k] : '(blank)' });
  dlState.score += pts;
  dlState.errors.push(...errs);
  document.getElementById('dl-score').textContent = dlState.score;
  const fb = document.getElementById('dl-feedback');
  if (pts === 2) { fb.textContent = '✓ Both correct'; fb.className = 'feedback-flash good'; }
  else if (pts === 1) { fb.textContent = '◐ One correct'; fb.className = 'feedback-flash good'; }
  else {
    const lLabel = SB.data.ENV_SOUNDS.find(s => s.id===dlState.current.left)[k];
    const rLabel = SB.data.ENV_SOUNDS.find(s => s.id===dlState.current.right)[k];
    fb.textContent = `✗ Left: ${lLabel}, Right: ${rLabel}`;
    fb.className = 'feedback-flash bad';
  }
  setTimeout(nextDlRound, 1800);
};

// ============================================================
// Shared
// ============================================================
function finishTest(type, gs, score, total, extra={}) {
  const dur = Math.round((Date.now() - gs.startTime)/1000);
  const pct = total ? Math.round(score/total*100) : 0;
  SB.storage.saveSession({
    type, language: langCode(),
    score: { correct: score, total, pct },
    errors: gs.errors || [], duration: dur, extra,
  });
  setTimeout(() => alert(`Session complete. Score: ${score}/${total}.`), 200);
  setTimeout(() => SB.app.show('setup'), 400);
}
SB.tests._finishTest = finishTest;
