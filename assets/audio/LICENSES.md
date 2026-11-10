# Audio licenses

Every audio file under `assets/audio/` must have a row here. The `audio-license-guard` hook refuses new audio files that are not listed.

Rule source: the Kiroween rules forbid third-party copyrighted music without permission. We use only tracks that their uploader published under **CC0 (public domain dedication)**, plus sound effects synthesized in code (`engine/sfx.js`, no files).

| File | Mood | Source page (license as shown there) | Retrieved | Original file SHA-256 |
|---|---|---|---|---|
| `spooky-waltz.m4a` | eerie, music box waltz | https://opengameart.org/content/4-music-box-tracks (track `musicbox1_spooky_waltz`, "CC0. No credit required.") | 2026-11-10 | `942fa53fd72dc52cd4d9beae79854d1f111fba6e3d8891b0c95ad70a000e7070` |
| `cute-tune.m4a` | cute, music box | https://opengameart.org/content/4-music-box-tracks (track `musicbox2_cute_tune`, "CC0. No credit required.") | 2026-11-10 | `97d15ea36eec88637a991766ea41c7abe5748fc2750525de9e834a70158e1eaa` |
| `creepy-ambient.m4a` | ghostly ambience, vibraphone and music box | https://opengameart.org/content/creepy-ambient-loop (License(s): CC0) | 2026-11-10 | `609bd62e824d77df3d35af26064bfd824cb6fce95cb9637c467fb80b717d6050` |

## What we changed
Converted to mono AAC 64 kbps (`.m4a`, plays on every browser including iOS Safari), loudness-normalized to about -21 LUFS with true peak at or below -2 dBFS (`ffmpeg loudnorm`). No other edit.

## Limits we state honestly
- The license is the uploader's statement on OpenGameArt. We did not verify that the uploader owns the work.
- CC0 does not stop a third party from filing a Content ID claim on a video that uses the track. If the demo video gets a claim, replace the audio with the code-synthesized fallback (`engine/music.js`, planned) or remove it.
- Music is **off by default** and starts only after the user taps; the files load on demand, not on page load.
