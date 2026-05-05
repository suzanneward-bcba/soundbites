/* ========================================================================
   Sound Bites — audio engine
   - Tries to load real audio files (sounds/ambience/, sounds/env/)
   - Falls back to procedural generation if files missing
   - TTS with preferred-voice selection
   - Tone generation for temporal patterns
   - Stereo panning for localization
   ======================================================================== */
window.SB = window.SB || {};
SB.audio = {};

// ---------- AudioContext singleton ----------
let audioCtx = null;
let bgGain = null;
let speechGain = null;

function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      bgGain = audioCtx.createGain();   bgGain.gain.value = 0.6;
      speechGain = audioCtx.createGain(); speechGain.gain.value = 1.0;
      bgGain.connect(audioCtx.destination);
      speechGain.connect(audioCtx.destination);
    } catch(e) { console.error('AudioContext failed', e); return false; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return true;
}
SB.audio.ensure = ensureAudio;
SB.audio.ctx = () => audioCtx;
SB.audio.bgGain = () => bgGain;

// ---------- Ambient: real audio file with fallback to procedural ----------
let ambientEl = null;       // HTMLAudioElement when real file is loaded
let ambientUsingReal = false;
let proceduralNodes = [];
let proceduralCleanup = null;

function stopAmbient() {
  if (ambientEl) {
    try { ambientEl.pause(); } catch(e) {}
    ambientEl = null;
  }
  proceduralNodes.forEach(n => {
    try { if (n.stop) n.stop(); } catch(e){}
    try { if (n.disconnect) n.disconnect(); } catch(e){}
  });
  proceduralNodes.length = 0;
  if (proceduralCleanup) { try { proceduralCleanup(); } catch(e){} proceduralCleanup = null; }
  ambientUsingReal = false;
  setAudioStatus('Audio: ready');
}

function setAudioStatus(text, kind='') {
  const el = document.getElementById('audio-status');
  if (!el) return;
  el.textContent = text;
  el.className = 'audio-status' + (kind ? ' ' + kind : '');
}

async function tryLoadAmbient(scene) {
  const file = SB.data.AMBIENT_FILES[scene];
  if (!file) return false;
  return new Promise(resolve => {
    const audio = new Audio('sounds/ambience/' + file);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = (parseInt(document.getElementById('bg-vol')?.value || 60) / 100);
    let resolved = false;
    audio.oncanplaythrough = () => {
      if (resolved) return; resolved = true;
      ambientEl = audio;
      ambientUsingReal = true;
      audio.play().catch(err => console.warn('ambient play blocked', err));
      setAudioStatus('Audio: real recordings', 'real');
      resolve(true);
    };
    audio.onerror = () => {
      if (resolved) return; resolved = true;
      resolve(false);
    };
    setTimeout(() => { if (!resolved) { resolved = true; resolve(false); } }, 1500);
    audio.load();
  });
}

SB.audio.startAmbient = async function(scene) {
  if (!ensureAudio()) return;
  stopAmbient();
  const real = await tryLoadAmbient(scene);
  if (real) return;
  // Fallback procedural
  setAudioStatus('Audio: procedural (drop MP3s in sounds/ambience/ for real recordings)', 'synth');
  if (scene === 'park') proceduralCleanup = startPark();
  else if (scene === 'cafe') proceduralCleanup = startCafe();
  else if (scene === 'street') proceduralCleanup = startStreet();
};
SB.audio.stopAmbient = stopAmbient;

SB.audio.setBgVolume = function(vol) {
  if (ambientEl) ambientEl.volume = vol;
  if (bgGain && audioCtx) bgGain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.1);
};

// ---------- Procedural noise scene (fallback) ----------
function makeNoise(type, sec) {
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * sec, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  if (type === 'pink') {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i=0;i<d.length;i++) {
      const w = Math.random()*2-1;
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
      d[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11; b6 = w*0.115926;
    }
  } else if (type === 'brown') {
    let last=0; for (let i=0;i<d.length;i++) { const w=Math.random()*2-1; d[i]=(last+0.02*w)/1.02; last=d[i]; d[i]*=3.5; }
  } else { for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
  return buf;
}

function loopNoise(type, freq, fType='lowpass', g=0.3, q=1) {
  const src = audioCtx.createBufferSource(); src.buffer = makeNoise(type, 5); src.loop = true;
  const filt = audioCtx.createBiquadFilter(); filt.type=fType; filt.frequency.value=freq; filt.Q.value=q;
  const gain = audioCtx.createGain(); gain.gain.value=g;
  src.connect(filt).connect(gain).connect(bgGain);
  src.start();
  proceduralNodes.push(src, filt, gain);
}

function startPark() {
  loopNoise('pink', 1200, 'lowpass', 0.18, 0.7);
  loopNoise('pink', 400, 'lowpass', 0.12, 0.5);
  let stopped = false;
  function chirp() {
    if (stopped) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    const f = 1800 + Math.random()*2200;
    o.frequency.setValueAtTime(f, now);
    o.frequency.exponentialRampToValueAtTime(f*(0.7+Math.random()*0.6), now+0.15);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now+0.18);
    o.connect(g).connect(bgGain); o.start(now); o.stop(now+0.2);
    setTimeout(chirp, 1200+Math.random()*4500);
  }
  setTimeout(chirp, 1500+Math.random()*2000);
  return () => { stopped = true; };
}

function startCafe() {
  loopNoise('brown', 200, 'lowpass', 0.3, 0.8);
  loopNoise('pink', 800, 'bandpass', 0.18, 1.5);
  const src = audioCtx.createBufferSource(); src.buffer = makeNoise('pink',6); src.loop=true;
  const filt = audioCtx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=900; filt.Q.value=2;
  const g = audioCtx.createGain(); g.gain.value = 0.32;
  src.connect(filt).connect(g).connect(bgGain); src.start();
  proceduralNodes.push(src, filt, g);
  let stopped = false;
  (function mod(){
    if (stopped) return;
    const now = audioCtx.currentTime;
    filt.frequency.linearRampToValueAtTime(600+Math.random()*800, now+1.2);
    g.gain.linearRampToValueAtTime(0.18+Math.random()*0.18, now+1.2);
    setTimeout(mod, 800+Math.random()*900);
  })();
  return () => { stopped = true; };
}

function startStreet() {
  loopNoise('brown', 300, 'lowpass', 0.4, 0.8);
  loopNoise('pink', 1500, 'lowpass', 0.1, 0.6);
  let stopped = false;
  function whoosh() {
    if (stopped) return;
    const now = audioCtx.currentTime;
    const src = audioCtx.createBufferSource(); src.buffer = makeNoise('pink',2);
    const filt = audioCtx.createBiquadFilter(); filt.type='bandpass'; filt.Q.value=1.5;
    filt.frequency.setValueAtTime(2000, now);
    filt.frequency.linearRampToValueAtTime(400, now+1.4);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.28, now+0.6);
    g.gain.linearRampToValueAtTime(0.0001, now+1.5);
    src.connect(filt).connect(g).connect(bgGain);
    src.start(now); src.stop(now+1.6);
    setTimeout(whoosh, 2500+Math.random()*3500);
  }
  setTimeout(whoosh, 1000);
  return () => { stopped = true; };
}

// ---------- Voice / TTS ----------
let voices = [];
SB.audio.voices = () => voices;

function loadVoices() {
  voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  rebuildVoiceList();
}
SB.audio.loadVoices = loadVoices;

if (window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

// Prefer high-quality voices: those marked premium/enhanced/natural by name.
function rankVoice(v, lang) {
  let s = 0;
  if (!v.lang.startsWith(lang.split('-')[0])) return -10;
  if (v.lang === lang) s += 5;
  const n = v.name.toLowerCase();
  if (n.includes('premium') || n.includes('enhanced') || n.includes('natural')) s += 8;
  if (n.includes('siri')) s += 3;
  if (n.includes('google')) s += 4;
  if (n.includes('microsoft')) s += 3;
  if (v.default) s += 1;
  return s;
}

function rebuildVoiceList() {
  const select = document.getElementById('voice-select');
  const langSelect = document.getElementById('game-lang');
  if (!select || !langSelect) return;
  const lang = langSelect.value || 'en-US';
  const filtered = voices
    .filter(v => v.lang.startsWith(lang.split('-')[0]))
    .map(v => ({ v, score: rankVoice(v, lang) }))
    .sort((a,b) => b.score - a.score)
    .map(x => x.v);
  select.innerHTML = '';
  if (filtered.length === 0) {
    select.innerHTML = '<option value="">(default browser voice)</option>';
    return;
  }
  filtered.forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = v.name;
    const tag = (v.name.toLowerCase().match(/premium|enhanced|natural/) || [])[0];
    opt.textContent = `${v.name} — ${v.lang}${tag ? ' ★' : ''}${v.default ? ' (default)' : ''}`;
    if (i === 0) opt.selected = true;
    select.appendChild(opt);
  });
}
SB.audio.rebuildVoiceList = rebuildVoiceList;

function getSelectedVoice() {
  const sel = document.getElementById('voice-select');
  if (!sel) return null;
  return voices.find(v => v.name === sel.value) || null;
}

SB.audio.speak = function(word, opts = {}) {
  if (!window.speechSynthesis) return Promise.resolve();
  try { speechSynthesis.cancel(); } catch(e) {}
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(word);
    const lang = opts.lang || (document.getElementById('game-lang')?.value || 'en-US');
    u.lang = lang;
    u.rate = opts.rate != null ? opts.rate : (parseFloat(document.getElementById('rate')?.value) || 1.0);
    u.volume = opts.volume != null ? opts.volume : 1.0;
    let v = opts.voice || getSelectedVoice();
    if (!v) v = voices.find(x => x.lang === lang) || voices.find(x => x.lang.startsWith(lang.split('-')[0]));
    if (v) u.voice = v;
    u.onend = resolve; u.onerror = resolve;
    setTimeout(resolve, 6000);
    speechSynthesis.speak(u);
  });
};

SB.audio.cancelSpeech = function() { try { speechSynthesis.cancel(); } catch(e){} };

// ---------- Environmental sound playback ----------
const envCache = new Map();   // id → HTMLAudioElement (loaded successfully)
const envFailed = new Set();  // ids that failed to load (skip retry)

SB.audio.playEnv = async function(id, opts={}) {
  ensureAudio();
  const meta = SB.data.ENV_SOUNDS.find(e => e.id === id);
  if (!meta) return false;
  if (envFailed.has(id)) {
    return synthEnv(id, opts);
  }
  let el = envCache.get(id);
  if (!el) {
    el = new Audio('sounds/env/' + meta.file);
    el.preload = 'auto';
    const ok = await new Promise(res => {
      let done = false;
      el.oncanplaythrough = () => { if(!done){done=true; res(true);} };
      el.onerror = () => { if(!done){done=true; res(false);} };
      setTimeout(() => { if(!done){done=true; res(false);} }, 1500);
      el.load();
    });
    if (!ok) {
      envFailed.add(id);
      return synthEnv(id, opts);
    }
    envCache.set(id, el);
  }
  // Pan via WebAudio if requested
  if (opts.pan != null) {
    return playWithPan(el, opts.pan);
  }
  el.currentTime = 0;
  el.volume = opts.volume != null ? opts.volume : 1.0;
  try { await el.play(); } catch(e){}
  return true;
};

function playWithPan(audioEl, pan) {
  // Connect HTMLAudioElement to a panner
  if (!audioCtx) return;
  try {
    const src = audioCtx.createMediaElementSource(audioEl);
    const panner = audioCtx.createStereoPanner();
    panner.pan.value = pan; // -1 left, 0 center, 1 right
    src.connect(panner).connect(audioCtx.destination);
    audioEl.currentTime = 0;
    audioEl.play();
    return true;
  } catch(e) {
    // Source already connected — just play with element panning if possible
    audioEl.currentTime = 0;
    audioEl.play();
    return true;
  }
}

// ---------- Synth fallback for environmental sounds ----------
// Recognizable but obviously synthetic; used only when MP3 missing.
function synthEnv(id, opts={}) {
  ensureAudio();
  const now = audioCtx.currentTime;
  const out = audioCtx.createGain();
  out.gain.value = opts.volume != null ? opts.volume : 0.6;
  // Apply panning if requested
  let dest = audioCtx.destination;
  if (opts.pan != null) {
    const p = audioCtx.createStereoPanner(); p.pan.value = opts.pan;
    out.connect(p); p.connect(audioCtx.destination);
  } else {
    out.connect(audioCtx.destination);
  }

  function tone(freq, dur, type='sine', vol=0.3, t=0) {
    const o = audioCtx.createOscillator(); o.type = type;
    o.frequency.value = freq;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, now+t);
    g.gain.linearRampToValueAtTime(vol, now+t+0.01);
    g.gain.linearRampToValueAtTime(0, now+t+dur);
    o.connect(g).connect(out);
    o.start(now+t); o.stop(now+t+dur+0.05);
  }
  function noiseBurst(freq, dur, vol=0.3, t=0) {
    const src = audioCtx.createBufferSource(); src.buffer = makeNoise('pink',1);
    const filt = audioCtx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=freq; filt.Q.value=2;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, now+t);
    g.gain.linearRampToValueAtTime(vol, now+t+0.02);
    g.gain.linearRampToValueAtTime(0, now+t+dur);
    src.connect(filt).connect(g).connect(out);
    src.start(now+t); src.stop(now+t+dur+0.1);
  }

  switch(id) {
    case 'dog':       tone(380,0.2,'sawtooth',0.4); tone(340,0.18,'sawtooth',0.35,0.3); break;
    case 'cat':       tone(700,0.4,'sine',0.3); tone(900,0.3,'sine',0.2,0.2); break;
    case 'phone':     for(let i=0;i<3;i++){tone(900,0.3,'sine',0.3,i*0.5); tone(1100,0.3,'sine',0.3,i*0.5);} break;
    case 'doorbell':  tone(700,0.5,'sine',0.4); tone(550,0.6,'sine',0.4,0.35); break;
    case 'water':     for(let i=0;i<6;i++) noiseBurst(800+Math.random()*1200, 0.15, 0.2, i*0.18); break;
    case 'thunder':   noiseBurst(80, 1.5, 0.6); break;
    case 'footsteps': for(let i=0;i<5;i++) noiseBurst(150, 0.08, 0.4, i*0.32); break;
    case 'glass':     tone(2400,0.4,'triangle',0.3); tone(1800,0.5,'triangle',0.2,0.05); break;
    case 'carhorn':   tone(380,0.6,'square',0.3); tone(460,0.6,'square',0.3); break;
    case 'applause':  for(let i=0;i<20;i++) noiseBurst(2000, 0.04, 0.15, i*0.06+Math.random()*0.05); break;
    case 'baby':      tone(600,0.4,'sawtooth',0.3); tone(700,0.5,'sawtooth',0.3,0.4); tone(550,0.6,'sawtooth',0.3,0.9); break;
    case 'bell':      tone(1200,0.8,'sine',0.4); tone(2400,0.8,'sine',0.2); break;
    case 'whistle':   tone(1500,1.0,'sine',0.4); break;
    case 'sneeze':    noiseBurst(1500, 0.3, 0.5); break;
    case 'cough':     noiseBurst(400, 0.2, 0.4); noiseBurst(600, 0.2, 0.3, 0.3); break;
    case 'rooster':   tone(700,0.3,'sawtooth',0.3); tone(900,0.4,'sawtooth',0.3,0.25); tone(600,0.5,'sawtooth',0.3,0.55); break;
    default:          tone(500,0.3,'sine',0.3);
  }
  return true;
}

// ---------- Tone generation for temporal patterns ----------
SB.audio.playTone = function(freq, durMs, opts={}) {
  ensureAudio();
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.type = opts.type || 'sine';
  o.frequency.value = freq;
  const g = audioCtx.createGain();
  const vol = opts.volume != null ? opts.volume : 0.4;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + 0.02);
  g.gain.setValueAtTime(vol, now + durMs/1000 - 0.04);
  g.gain.linearRampToValueAtTime(0, now + durMs/1000);

  let last = g;
  if (opts.pan != null) {
    const p = audioCtx.createStereoPanner(); p.pan.value = opts.pan;
    g.connect(p); last = p;
  }
  o.connect(g);
  last.connect(audioCtx.destination);
  o.start(now);
  o.stop(now + durMs/1000 + 0.05);
  return new Promise(res => setTimeout(res, durMs + 50));
};

// Noise burst with optional pan (for sound localization)
SB.audio.playNoiseBurst = function(durMs=400, opts={}) {
  ensureAudio();
  const now = audioCtx.currentTime;
  const src = audioCtx.createBufferSource(); src.buffer = makeNoise('pink', 1);
  const filt = audioCtx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=1500; filt.Q.value=1;
  const g = audioCtx.createGain();
  const vol = opts.volume != null ? opts.volume : 0.4;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now+0.02);
  g.gain.linearRampToValueAtTime(0, now+durMs/1000);

  let last = g;
  if (opts.pan != null) {
    const p = audioCtx.createStereoPanner(); p.pan.value = opts.pan;
    g.connect(p); last = p;
  }
  src.connect(filt).connect(g);
  last.connect(audioCtx.destination);
  src.start(now); src.stop(now+durMs/1000+0.1);
  return new Promise(res => setTimeout(res, durMs + 50));
};

// ---------- SNR control (memory test) ----------
SB.audio.setSNR = function(snr_dB) {
  // Adjust bgGain relative to fixed speech volume of 1.0.
  // bgGain = 10^(-SNR/20)
  const bgLinear = Math.pow(10, -snr_dB/20) * (parseInt(document.getElementById('bg-vol')?.value || 60)/100);
  if (ambientEl) ambientEl.volume = Math.min(1, bgLinear);
  if (bgGain && audioCtx) bgGain.gain.linearRampToValueAtTime(Math.min(1, bgLinear), audioCtx.currentTime + 0.1);
};
