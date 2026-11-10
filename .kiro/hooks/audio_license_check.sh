#!/usr/bin/env bash
# Audio license check: every audio file under assets/audio/ must have a row in assets/audio/LICENSES.md.
# Why: the Kiroween rules forbid third-party copyrighted music; an unlisted file is the one way to break that by accident.
# Effect: lists unlisted audio files and exits 2; also flags a listed file whose row has no https:// source or CC0 mark.
# Override the folder with AUDIO_DIR for tests. Exit 0 = every file has a license row.
set -u
root="$(cd "$(dirname "$0")/../.." && pwd)"
dir="${AUDIO_DIR:-$root/assets/audio}"
[ -d "$dir" ] || { echo "audio license check: no audio folder, nothing to check"; exit 0; }
lic="$dir/LICENSES.md"
fail=0
for f in "$dir"/*; do
  [ -f "$f" ] || continue
  name="$(basename "$f")"
  case "$name" in *.m4a|*.mp3|*.ogg|*.wav|*.opus|*.aac|*.flac|*.webm) ;; *) continue ;; esac
  row="$( [ -f "$lic" ] && grep -F "\`$name\`" "$lic" | head -1 )"
  if [ -z "$row" ]; then echo "AUDIO: $name has no row in LICENSES.md" >&2; fail=1; continue; fi
  printf '%s' "$row" | grep -q 'https://' || { echo "AUDIO: $name row has no https:// source page" >&2; fail=1; }
  printf '%s' "$row" | grep -q 'CC0' || { echo "AUDIO: $name row does not say CC0" >&2; fail=1; }
done
[ "$fail" -ne 0 ] && { echo "audio license check FAILED (exit 2)" >&2; exit 2; }
echo "audio license check: clean"
exit 0
