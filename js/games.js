/* ========================================================================
   Sound Bites — training games
   matching, odd, pairs, yesno, stress, bingo-words.
   ======================================================================== */
window.SB = window.SB || {};
SB.games = {};

function shuffle(a) {
  const x = [...a];
  for (let i=x.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; }
  return x;
}
function langKey() { return (document.getElementById('game-lang').value || 'en-US').startsWith('de') ? 'de' : 'en'; }
function langCode() { return document.getElementById('game-lang').value || 'en-US'; }

// ============================================================
// Memory Matching
// ============================================================
const matchState = { cards: [], flipped: [], found: 0, flips: 0, locked: false, startTime: 0 };

SB.games.startMatching = function() {
  const k = langKey();
  const pool = shuffle(SB.data.PIC_VOCAB).slice(0, 6);
  const pairs = [];
  pool.forEach(p => {
    pairs.push({ word: p[k], emoji: p.emoji, id: p[k] });
    pairs.push({ word: p[k], emoji: p.emoji, id: p[k] });
  });
  matchState.cards = shuffle(pairs);
  matchState.flipped = []; matchState.found = 0; matchState.flips = 0;
  matchState.locked = false; matchState.startTime = Date.now();
  const grid = document.getElementById('match-grid');
  grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
  grid.innerHTML = '';
  matchState.cards.forEach((c, i) => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'match-card'; el.textContent = '?'; el.dataset.idx = i;
    el.addEventListener('click', () => onMatchClick(i, el));
    grid.appendChild(el);
  });
  document.getElementById('match-found').textContent = '0';
  document.getElementById('match-total').textContent = '6';
  document.getElementById('match-flips').textContent = '0';
  SB.app.show('game-matching');
};

async function onMatchClick(idx, el) {
  if (matchState.locked) return;
  if (el.classList.contains('flipped') || el.classList.contains('matched')) return;
  if (matchState.flipped.length >= 2) return;
  el.classList.add('flipped');
  el.textContent = matchState.cards[idx].emoji;
  matchState.flipped.push({ idx, el });
  matchState.flips++;
  document.getElementById('match-flips').textContent = matchState.flips;
  await SB.audio.speak(matchState.cards[idx].word);
  if (matchState.flipped.length === 2) {
    matchState.locked = true;
    const [a, b] = matchState.flipped;
    if (matchState.cards[a.idx].id === matchState.cards[b.idx].id) {
      setTimeout(() => {
        a.el.classList.add('matched'); b.el.classList.add('matched');
        a.el.textContent = matchState.cards[a.idx].emoji + ' ' + matchState.cards[a.idx].word;
        b.el.textContent = matchState.cards[b.idx].emoji + ' ' + matchState.cards[b.idx].word;
        matchState.found++;
        document.getElementById('match-found').textContent = matchState.found;
        matchState.flipped = []; matchState.locked = false;
        if (matchState.found === 6) {
          const dur = Math.round((Date.now() - matchState.startTime)/1000);
          SB.storage.saveSession({
            type: 'matching', language: langCode(),
            score: { correct: 6, total: matchState.flips, pct: Math.round(12/matchState.flips*100) },
            errors: [], duration: dur, extra: { flips: matchState.flips, pairs: 6 }
          });
          setTimeout(() => alert(`All pairs found in ${matchState.flips} flips.`), 400);
        }
      }, 600);
    } else {
      setTimeout(() => {
        a.el.classList.remove('flipped'); b.el.classList.remove('flipped');
        a.el.textContent = '?'; b.el.textContent = '?';
        matchState.flipped = []; matchState.locked = false;
      }, 1200);
    }
  }
}

// ============================================================
// Odd One Out
// ============================================================
const oddState = { round: 0, score: 0, current: null, answered: false, errors: [], startTime: 0 };

async function playOddSet() {
  if (!oddState.current) return;
  const all = shuffle([...oddState.current.group, oddState.current.odd]);
  for (const w of all) { await SB.audio.speak(w); await new Promise(r => setTimeout(r, 250)); }
}

SB.games.startOdd = function() {
  oddState.round = 0; oddState.score = 0; oddState.errors = []; oddState.startTime = Date.now();
  document.getElementById('odd-score').textContent = '0';
  SB.app.show('game-odd');
  nextOddRound();
};

function nextOddRound() {
  if (oddState.round >= 10) {
    finishGame('odd', oddState, oddState.score, 10);
    return;
  }
  const cats = SB.data.ODD_CATEGORIES[langCode().startsWith('de') ? 'de-DE' : 'en-US'];
  const cat = cats[oddState.round % cats.length];
  oddState.current = cat; oddState.round++; oddState.answered = false;
  document.getElementById('odd-round').textContent = oddState.round;
  document.getElementById('odd-feedback').textContent = '';
  document.getElementById('odd-feedback').className = 'feedback-flash';
  document.getElementById('btn-odd-next').disabled = true;
  const cont = document.getElementById('odd-choices'); cont.innerHTML = '';
  shuffle([...cat.group, cat.odd]).forEach(w => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'choice-btn'; b.textContent = w;
    b.addEventListener('click', () => onOddChoice(w, b, cont, cat));
    cont.appendChild(b);
  });
  setTimeout(playOddSet, 400);
}

function onOddChoice(w, btn, cont, cat) {
  if (oddState.answered) return;
  oddState.answered = true;
  const right = (w === cat.odd);
  btn.classList.add(right ? 'correct' : 'wrong');
  const fb = document.getElementById('odd-feedback');
  if (right) {
    oddState.score++;
    document.getElementById('odd-score').textContent = oddState.score;
    fb.textContent = '✓ Correct'; fb.className = 'feedback-flash good';
  } else {
    fb.textContent = `✗ The odd word was "${cat.odd}"`; fb.className = 'feedback-flash bad';
    cont.querySelectorAll('.choice-btn').forEach(b => { if (b.textContent === cat.odd) b.classList.add('correct'); });
    oddState.errors.push({ kind: 'odd-wrong', target: cat.odd, given: w });
  }
  document.getElementById('btn-odd-next').disabled = false;
}
SB.games._oddPlay = playOddSet;
SB.games._oddNext = nextOddRound;

// ============================================================
// Minimal Pairs
// ============================================================
const pairsState = { round: 0, score: 0, contrast: 'pb', currentWord: null, currentSide: null, answered: false, errors: [], startTime: 0 };

SB.games.startPairs = function() {
  pairsState.contrast = document.getElementById('pairs-contrast').value;
  pairsState.round = 0; pairsState.score = 0; pairsState.errors = []; pairsState.startTime = Date.now();
  document.getElementById('pairs-score').textContent = '0';
  SB.app.show('game-pairs');
  nextPairRound();
};

function nextPairRound() {
  if (pairsState.round >= 10) {
    finishGame('pairs', pairsState, pairsState.score, 10, { contrast: pairsState.contrast });
    return;
  }
  const lang = langCode().startsWith('de') ? 'de-DE' : 'en-US';
  const bank = SB.data.MIN_PAIRS[lang][pairsState.contrast] || SB.data.MIN_PAIRS['en-US'][pairsState.contrast];
  const pair = bank[Math.floor(Math.random()*bank.length)];
  const sideIdx = Math.random() < 0.5 ? 0 : 1;
  pairsState.currentWord = pair[sideIdx]; pairsState.currentSide = sideIdx;
  pairsState.round++; pairsState.answered = false;
  document.getElementById('pairs-round').textContent = pairsState.round;
  document.getElementById('pairs-word-display').textContent = '🔊';
  document.getElementById('pairs-feedback').textContent = '';
  document.getElementById('pairs-feedback').className = 'feedback-flash';
  const labels = SB.data.PAIR_LABELS[pairsState.contrast];
  const cont = document.getElementById('pairs-choices'); cont.innerHTML = '';
  [labels.left, labels.right].forEach((label, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'choice-btn'; b.textContent = label; b.dataset.side = i;
    b.addEventListener('click', () => onPairChoice(i, b, cont));
    cont.appendChild(b);
  });
  setTimeout(() => SB.audio.speak(pairsState.currentWord), 400);
}

function onPairChoice(sideIdx, btn, cont) {
  if (pairsState.answered) return;
  pairsState.answered = true;
  const right = (sideIdx === pairsState.currentSide);
  btn.classList.add(right ? 'correct' : 'wrong');
  const fb = document.getElementById('pairs-feedback');
  document.getElementById('pairs-word-display').textContent = pairsState.currentWord;
  if (right) {
    pairsState.score++;
    document.getElementById('pairs-score').textContent = pairsState.score;
    fb.textContent = '✓ Correct'; fb.className = 'feedback-flash good';
  } else {
    fb.textContent = `✗ The word was "${pairsState.currentWord}"`; fb.className = 'feedback-flash bad';
    cont.querySelectorAll('.choice-btn').forEach(b => { if (parseInt(b.dataset.side) === pairsState.currentSide) b.classList.add('correct'); });
    pairsState.errors.push({
      kind: 'pair-wrong', target: pairsState.currentWord, contrast: pairsState.contrast,
      heard: pairsState.currentSide === 0 ? SB.data.PAIR_LABELS[pairsState.contrast].left : SB.data.PAIR_LABELS[pairsState.contrast].right,
      given: sideIdx === 0 ? SB.data.PAIR_LABELS[pairsState.contrast].left : SB.data.PAIR_LABELS[pairsState.contrast].right,
    });
  }
  setTimeout(nextPairRound, 1500);
}
SB.games._pairsPlay = () => { if (pairsState.currentWord) SB.audio.speak(pairsState.currentWord); };

// ============================================================
// Word Bingo (TTS-based)
// ============================================================
const bwState = { board: [], queue: [], current: null, found: 0, misses: 0, total: 9, errors: [], startTime: 0 };

SB.games.startWordBingo = function() {
  const size = parseInt(document.getElementById('bw-size').value);
  const cols = size === 9 ? 3 : 4;
  const k = langKey();
  bwState.board = shuffle(SB.data.PIC_VOCAB).slice(0, size).map(p => ({ emoji: p.emoji, word: p[k], found: false }));
  bwState.queue = shuffle(bwState.board.map((_, i) => i));
  bwState.found = 0; bwState.misses = 0; bwState.total = size;
  bwState.errors = []; bwState.startTime = Date.now();
  document.getElementById('bw-found').textContent = '0';
  document.getElementById('bw-total').textContent = size;
  document.getElementById('bw-misses').textContent = '0';
  const grid = document.getElementById('bw-grid');
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.maxWidth = (cols * 130) + 'px';
  grid.innerHTML = '';
  bwState.board.forEach((cell, i) => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'match-card flipped';
    el.style.fontSize = 'clamp(28px, 6vw, 56px)';
    el.textContent = cell.emoji; el.dataset.idx = i;
    el.addEventListener('click', () => onBwTap(i, el));
    grid.appendChild(el);
  });
  document.getElementById('bw-feedback').textContent = '';
  SB.app.show('game-bingo-words');
  setTimeout(playNextBw, 600);
};

function playNextBw() {
  if (bwState.queue.length === 0) {
    document.getElementById('bw-feedback').textContent = `Board complete. ${bwState.misses} misses.`;
    document.getElementById('bw-feedback').className = 'feedback-flash good';
    finishGame('bingo-words', bwState, bwState.found, bwState.total, { misses: bwState.misses });
    return;
  }
  bwState.current = bwState.queue[0];
  SB.audio.speak(bwState.board[bwState.current].word);
}

function onBwTap(idx, el) {
  if (bwState.current === null) return;
  if (bwState.board[idx].found) return;
  const fb = document.getElementById('bw-feedback');
  if (idx === bwState.current) {
    bwState.board[idx].found = true;
    el.classList.add('matched');
    el.textContent = bwState.board[idx].emoji + ' ' + bwState.board[idx].word;
    bwState.found++;
    document.getElementById('bw-found').textContent = bwState.found;
    bwState.queue.shift();
    fb.textContent = '✓ Correct'; fb.className = 'feedback-flash good';
    setTimeout(playNextBw, 1200);
  } else {
    bwState.misses++;
    document.getElementById('bw-misses').textContent = bwState.misses;
    fb.textContent = '✗ Try again'; fb.className = 'feedback-flash bad';
    bwState.errors.push({ kind: 'bw-wrong', target: bwState.board[bwState.current].word, given: bwState.board[idx].word });
    el.style.transform = 'scale(0.95)';
    setTimeout(() => { el.style.transform = ''; }, 150);
  }
}
SB.games._bwPlay = () => {
  if (bwState.current !== null && bwState.queue.length) SB.audio.speak(bwState.board[bwState.current].word);
};

// ============================================================
// Yes/No Picture Match
// ============================================================
const yesNoState = { round: 0, score: 0, current: null, isMatch: false, answered: false, errors: [], startTime: 0 };

SB.games.startYesNo = function() {
  yesNoState.round = 0; yesNoState.score = 0; yesNoState.errors = []; yesNoState.startTime = Date.now();
  document.getElementById('yesno-score').textContent = '0';
  SB.app.show('game-yesno');
  nextYesNoRound();
};

function nextYesNoRound() {
  if (yesNoState.round >= 10) {
    finishGame('yesno', yesNoState, yesNoState.score, 10);
    return;
  }
  const k = langKey();
  const pool = shuffle(SB.data.PIC_VOCAB);
  const target = pool[0]; const isMatch = Math.random() < 0.5;
  const heard = isMatch ? target : pool[1];
  yesNoState.current = { picture: target, heard, isMatch };
  yesNoState.isMatch = isMatch; yesNoState.answered = false;
  yesNoState.round++;
  document.getElementById('yesno-round').textContent = yesNoState.round;
  document.getElementById('yesno-pic').textContent = target.emoji;
  document.getElementById('yesno-feedback').textContent = '';
  document.getElementById('yesno-feedback').className = 'feedback-flash';
  document.querySelectorAll('#yesno-buttons .yesno-btn').forEach(b => { b.classList.remove('correct'); b.disabled = false; });
  setTimeout(() => SB.audio.speak(heard[k]), 400);
}

SB.games._yesNoChoice = function(btn) {
  if (yesNoState.answered) return;
  yesNoState.answered = true;
  const ans = btn.dataset.ans === 'yes';
  const correct = (ans === yesNoState.isMatch);
  document.querySelectorAll('#yesno-buttons .yesno-btn').forEach(b => b.disabled = true);
  const fb = document.getElementById('yesno-feedback');
  if (correct) {
    yesNoState.score++;
    document.getElementById('yesno-score').textContent = yesNoState.score;
    btn.classList.add('correct');
    fb.textContent = '✓ Correct'; fb.className = 'feedback-flash good';
  } else {
    const k = langKey();
    fb.textContent = `✗ Heard "${yesNoState.current.heard[k]}", picture "${yesNoState.current.picture[k]}"`;
    fb.className = 'feedback-flash bad';
    yesNoState.errors.push({
      kind: 'yesno-wrong', heard: yesNoState.current.heard[k], picture: yesNoState.current.picture[k],
      actualMatch: yesNoState.isMatch, given: ans,
    });
  }
  setTimeout(nextYesNoRound, 1500);
};
SB.games._yesNoPlay = () => {
  if (yesNoState.current) SB.audio.speak(yesNoState.current.heard[langKey()]);
};

// ============================================================
// Syllable Stress
// ============================================================
const stressState = { round: 0, score: 0, current: null, answered: false, errors: [], startTime: 0 };

function genStressOptions(correct) {
  const len = correct.length;
  const opts = new Set([correct]);
  while (opts.size < Math.min(len, 3)) {
    const idx = Math.floor(Math.random()*len);
    let p = '0'.repeat(len);
    p = p.substring(0,idx) + '1' + p.substring(idx+1);
    opts.add(p);
  }
  return shuffle([...opts]);
}

SB.games.startStress = function() {
  stressState.round = 0; stressState.score = 0; stressState.errors = []; stressState.startTime = Date.now();
  document.getElementById('stress-score').textContent = '0';
  SB.app.show('game-stress');
  nextStressRound();
};

function nextStressRound() {
  if (stressState.round >= 10) {
    finishGame('stress', stressState, stressState.score, 10);
    return;
  }
  const lang = langCode().startsWith('de') ? 'de-DE' : 'en-US';
  const bank = SB.data.STRESS_WORDS[lang];
  const item = bank[Math.floor(Math.random()*bank.length)];
  stressState.current = item; stressState.answered = false;
  stressState.round++;
  document.getElementById('stress-round').textContent = stressState.round;
  document.getElementById('stress-pic').textContent = item.emoji;
  document.getElementById('stress-word').textContent = item.syllables.join(' · ');
  document.getElementById('stress-feedback').textContent = '';
  document.getElementById('stress-feedback').className = 'feedback-flash';
  const cont = document.getElementById('stress-choices'); cont.innerHTML = '';
  genStressOptions(item.pattern).forEach(p => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'stress-pattern'; b.dataset.pattern = p;
    p.split('').forEach(ch => {
      const d = document.createElement('span');
      d.className = 'stress-dot' + (ch === '1' ? ' on' : '');
      b.appendChild(d);
    });
    b.addEventListener('click', () => onStressChoice(p, b, cont));
    cont.appendChild(b);
  });
  setTimeout(() => SB.audio.speak(item.word, { rate: 0.85 }), 400);
}

function onStressChoice(p, btn, cont) {
  if (stressState.answered) return;
  stressState.answered = true;
  const right = (p === stressState.current.pattern);
  btn.classList.add(right ? 'correct' : 'wrong');
  cont.querySelectorAll('.stress-pattern').forEach(b => b.disabled = true);
  const fb = document.getElementById('stress-feedback');
  if (right) {
    stressState.score++;
    document.getElementById('stress-score').textContent = stressState.score;
    fb.textContent = '✓ Correct'; fb.className = 'feedback-flash good';
  } else {
    fb.textContent = `✗ Stress is on "${stressState.current.syllables[stressState.current.pattern.indexOf('1')]}"`;
    fb.className = 'feedback-flash bad';
    cont.querySelectorAll('.stress-pattern').forEach(b => { if (b.dataset.pattern === stressState.current.pattern) b.classList.add('correct'); });
    stressState.errors.push({ kind: 'stress-wrong', target: stressState.current.word, pattern: stressState.current.pattern, given: p });
  }
  setTimeout(nextStressRound, 1700);
}
SB.games._stressPlay = () => { if (stressState.current) SB.audio.speak(stressState.current.word, { rate: 0.85 }); };

// ============================================================
// Shared finish helper
// ============================================================
function finishGame(type, gs, score, total, extra={}) {
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
SB.games._finishGame = finishGame;
