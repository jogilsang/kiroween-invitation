---
inclusion: fileMatch
fileMatchPattern: "{assets/audio/**,app/audio.js,engine/sfx.js,tests/audio*.test.js}"
---
# Steering: Audio and licenses

> Why: the Kiroween rules forbid third-party copyrighted music without permission, and the project is MIT. One careless download can disqualify the entry.
> Effect: when audio files or audio code are in context, the agent only adds sound that has a recorded license, and never makes sound without a user gesture.

## Hard rules
- Allowed sources: CC0 tracks whose page says CC0, and sound synthesized in our own code. Nothing else. No "free to use" sites with custom licenses, no CC-BY (attribution needs UI), no AI-generated music with unclear terms.
- Every file under `assets/audio/` has a row in `assets/audio/LICENSES.md`: source page, license text as shown, retrieval date, SHA-256 of the original. A file without a row is a bug; the `audio-license-guard` hook blocks it.
- Never fetch audio in an agent session. The conductor downloads, checks the license page and records it.
- No sound before a user gesture. Music is off by default and remembers the choice. Files load only when the user turns sound on.
- Sound effects are generated from parameters in `engine/sfx.js` (pure data); `app/audio.js` only plays them.
- Keep loudness quiet: about -21 LUFS for music, true peak at or below -2 dBFS.

## Honest limits
CC0 is the uploader's claim. State that in the write-up. If a video gets a Content ID claim, swap to synthesized audio.
