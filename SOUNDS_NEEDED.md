# Audio Files Needed

Sound Bites works without audio files (it falls back to procedural synthesis), but for clinical use you'll want real recordings. All sounds listed below are **CC0 / royalty-free** and free for commercial and clinical use, no attribution required.

## How to add files

1. Download each file from the link below.
2. Rename it to the **target filename** shown.
3. Drop it into the matching folder:
   - Ambient backgrounds → `sounds/ambience/`
   - Environmental sounds → `sounds/env/`
4. Commit and push. Netlify rebuilds automatically.

The app detects the files at runtime. If a file is missing, it transparently falls back to procedural synthesis and shows a small "synth" indicator on the setup screen.

---

## Ambient backgrounds (loops, ~60-90s each)

Drop into `sounds/ambience/`. MP3 format, ~1-3 MB each.

| Target filename | Suggested source |
|---|---|
| `park.mp3` | [Pixabay – park ambience](https://pixabay.com/sound-effects/search/park-ambience/) — pick any 60-90s loop |
| `cafe.mp3` | [Pixabay – cafe ambience](https://pixabay.com/sound-effects/search/cafe/) — restaurant chatter loop |
| `street.mp3` | [Pixabay – street traffic](https://pixabay.com/sound-effects/search/street-ambient/) — city traffic loop |

Look for files marked "ambient" or "loop" with at least 60 seconds of duration. Browse [Pixabay's CC0 ambient collection](https://pixabay.com/sound-effects/search/ambient/) if the specific links above don't have what you want.

---

## Environmental sounds (short, 1-3 seconds each)

Drop into `sounds/env/`. MP3 format, ~50-300 KB each.

| Target filename | Description | Source |
|---|---|---|
| `dog.mp3` | Dog barking | [Pixabay – dog bark](https://pixabay.com/sound-effects/search/dog-bark/) |
| `cat.mp3` | Cat meowing | [Pixabay – cat meow](https://pixabay.com/sound-effects/search/cat-meow/) |
| `phone.mp3` | Phone ringing (1-2 rings) | [Pixabay – phone ringing](https://pixabay.com/sound-effects/search/phone-ringing/) |
| `doorbell.mp3` | Doorbell chime | [Pixabay – doorbell](https://pixabay.com/sound-effects/search/doorbell/) |
| `water.mp3` | Running tap water | [Pixabay – running water](https://pixabay.com/sound-effects/search/running-water/) |
| `thunder.mp3` | Thunder rumble | [Pixabay – thunder](https://pixabay.com/sound-effects/search/thunder/) |
| `footsteps.mp3` | Walking on hard floor | [Pixabay – footsteps](https://pixabay.com/sound-effects/search/footsteps/) |
| `glass.mp3` | Glass clink (toast) | [Pixabay – glass clink](https://pixabay.com/sound-effects/search/glass-clink/) |
| `carhorn.mp3` | Car horn | [Pixabay – car horn](https://pixabay.com/sound-effects/search/car-horn/) |
| `applause.mp3` | Applause / clapping | [Pixabay – applause](https://pixabay.com/sound-effects/search/applause/) |
| `baby.mp3` | Baby crying | [Pixabay – baby cry](https://pixabay.com/sound-effects/search/baby-cry/) |
| `bell.mp3` | Bell ringing | [Pixabay – bell](https://pixabay.com/sound-effects/search/bell/) |
| `whistle.mp3` | Train whistle | [Pixabay – train whistle](https://pixabay.com/sound-effects/search/train-whistle/) |
| `sneeze.mp3` | Sneeze | [Pixabay – sneeze](https://pixabay.com/sound-effects/search/sneeze/) |
| `cough.mp3` | Cough | [Pixabay – cough](https://pixabay.com/sound-effects/search/cough/) |
| `rooster.mp3` | Rooster crowing | [Pixabay – rooster](https://pixabay.com/sound-effects/search/rooster/) |

You only need a subset for the app to be useful — start with 9-12 (the bingo board defaults to 3×3). The first eight in the list cover the most distinctive auditory categories.

---

## Verifying the files loaded

After you push and Netlify rebuilds:

1. Open the app, go to **Memory & Recall**.
2. Click **Preview scene**. The audio status should change to "Audio: real recordings" (green) instead of "Audio: procedural" (orange).
3. Open **Processing Tests → Environmental Sound ID**. Tap **Play sound**. You should hear the actual recording.

If still falling back to procedural, check the browser console (Cmd+Opt+J in Chrome) for 404 errors — usually a filename mismatch or wrong subfolder.

---

## Alternative sources

Both **Freesound.org** (filter to CC0) and **ZapSplat** (CC0 1.0 section) have similar sound libraries. Anything you find under CC0 is free for clinical use. Avoid CC-BY sounds unless you're prepared to credit the author.

For German voice fidelity (used in TTS for memory test and minimal pairs), install Mac Premium voices: **System Settings → Accessibility → Spoken Content → Voices → System Voice → Manage Voices →** scroll to German, install "Anna (Premium)" or "Markus (Enhanced)".
