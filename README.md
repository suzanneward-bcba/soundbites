# Sound Bites

Bilingual auditory processing assessment tool for occupational therapists. Includes a free-recall memory test with adjustable speech-in-noise SNR, six SCAN-3-style processing tests, six training games, and a cross-session dashboard with per-category accuracy and per-item error tracking.

English and German throughout.

## What's in it

**Memory & Recall**
- Free-recall word list with administrator-controlled scene, language, voice, rate, and SNR (-10 to +20 dB).

**Processing Tests** (SCAN-3 style)
- Environmental Sound ID — tap the picture matching the recorded sound
- Pitch Pattern — identify high/low tone sequences
- Duration Pattern — identify long/short tone sequences
- Digit Span — adaptive forward/backward, auto-progresses by length
- Sound Localization — left/center/right, headphones required
- Dichotic Listening — different sound in each ear, headphones required

**Training Games**
- Memory Matching, Odd One Out, Minimal Pairs (P/B, K/G, T/D, F/V, S/Z), Picture Match, Syllable Stress, Word Bingo

**Dashboard**
- Per-category accuracy bars, most-missed items, phoneme-contrast errors, full session history, CSV export.

**Two themes**
- Clinical (light, professional) — default
- Subject (dark, animated) — for the person being tested

## File layout

```
soundbites/
├── index.html
├── netlify.toml
├── README.md
├── SOUNDS_NEEDED.md      ← curated download list for real audio
├── css/
│   ├── styles.css
│   └── themes.css
├── js/
│   ├── data.js           ← vocab, banks, sound manifest
│   ├── audio.js          ← TTS, ambient, env sounds, tones, panning, SNR
│   ├── storage.js        ← localStorage + dashboard + CSV export
│   ├── games.js          ← 6 training games
│   ├── newtests.js       ← 6 processing tests
│   ├── memory.js         ← memory test flow
│   └── app.js            ← screen routing, theme switcher, all event wiring
└── sounds/
    ├── ambience/         ← drop park.mp3, cafe.mp3, street.mp3 here
    └── env/              ← drop dog.mp3, phone.mp3, doorbell.mp3, etc.
```

## Audio files

The app works without audio files — it falls back to procedural synthesis. **For clinical use you'll want real recordings.** See [SOUNDS_NEEDED.md](./SOUNDS_NEEDED.md) for the curated download list (all CC0, free for clinical use).

## Hosting on Netlify

The repo is already set up. Push to the connected GitHub repo and Netlify rebuilds in ~30 seconds.

```bash
cd ~/Desktop/soundbites
git add .
git commit -m "describe the change"
git push
```

If you haven't connected GitHub yet, see the previous deployment instructions or use [Netlify Drop](https://app.netlify.com/drop) — drag the whole `soundbites` folder onto the page.

## Browser support

- **Chrome / Edge** — best for both Web Speech and Web Audio
- **Safari** — works; install Mac Premium voices for higher TTS quality (System Settings → Accessibility → Spoken Content)
- **Firefox** — works, but speech synthesis quality varies by OS

## Privacy

All session data lives in your browser's `localStorage`. Nothing is sent to any server. Use **Export CSV** in the dashboard to back up records.

## Updating the test banks

All vocab, categories, minimal-pair lists, stress patterns, and environmental sound labels live in `js/data.js`. Edit that one file to add German clinical word lists, more minimal pairs, etc.
