# Requirements — Kiroween Invitation (SVG renderer)

Format: EARS. Each requirement names the test that verifies it. Negative paths
are first-class. "THE SYSTEM" = the engine (pure code), unless it names the app.

> Changelog 2026-11-05 — PIVOT ASCII → SVG. ASCII glyph rendering could not
> express the grotesque, glowing purple look the project needs. The render
> target changed to deterministic SVG. R1-R9 and R13-R21 kept (wording: "ASCII
> invitation" → "SVG invitation"). The render-quality block R10-R12 (density /
> dark-invert / monospace) was replaced by SVG equivalents R10-R12 below. The
> combination-generator intent is unchanged and strengthened (mood/palette/glow
> are new combination axes). Determinism, validation, share and safety are
> unchanged.
>
> Changelog 2026-11-09 — CLEAN-UP after the round 3 review (A-07, A-08 in `docs/review_r3/A_spec_steering_hooks.md`). No behavior changed; only wording that no longer matched the code:
> R7 no longer lists a `face` key (it was an ASCII-era key and is not in the config). R8 now names the real render order from `engine/svg.js` and says what `LAYER_ORDER` covers. R11 says the 1080x1080 viewBox is the `square` format, so it no longer reads as a conflict with R34. The scene count is stated as "three drawn scenes plus the plain sky" everywhere (R31, design, steering). R52 and R53 were added, and the open cross-browser check (P16) is now listed in the map below.
>
> Changelog 2026-11-08 — RENAME. The project is now "Kiroween Invitation" (it was
> "ASCII Invite"), and this folder was renamed to match. The older wording of
> R1-R21 is kept where it still holds; where a requirement's text predates later
> features, the later requirement (R22 and up) extends it and does not contradict it.

## Map of the requirements

| Range | Topic |
|---|---|
| R1-R9 | generation, validation, composition rules |
| R10-R12 | SVG look: mood, palette, glow, well-formed, dark contract |
| R13-R21 | save, share, safety, accessibility |
| R22-R26 | assets, colors, event details, any-script names, stable seeds |
| R27-R29 | Remix |
| R30-R33 | costumes and scenes |
| R34-R35 | export sizes |
| R36-R38, R48 | calendar file |
| R39-R42 | contrast and preset looks |
| R43-R50 | fixes from the red team and the Kiro Crew reviews |
| R51 | link preview image |
| R52-R53 | deployment, restore order on load (added 2026-11-09) |
| open | cross-browser and mobile check (P16): NOT verified, see the end of this file |

## Generation

- **R1** WHEN a user supplies a config (purpose, year, nickname, event details, assets and their colors, costume, scene, mood, palette, glow), THE SYSTEM SHALL produce an SVG invitation determined solely by that config. — `test_same_config_same_output`
- **R2** WHEN the same config is passed twice, THE SYSTEM SHALL return a byte-identical SVG string (no randomness beyond a config-derived seed, no clock). — `test_deterministic_bytes`
- **R3** THE SYSTEM SHALL apply a distinct heading/body template for each purpose (join / notice / recruit). — `test_purpose_templates`
- **R4** WHEN the year changes, THE SYSTEM SHALL reflect it in the invitation's year text and meta banner (`KIROWEEN <year>`). — `test_year_is_variable`

## Input validation (negative paths)

- **R5** IF the year is not an integer in 2000..2100, THE SYSTEM SHALL reject it to a safe default with a reason and change no state. — `test_reject_invalid_year`
- **R6** IF the nickname exceeds length (24) or contains disallowed characters, THE SYSTEM SHALL sanitize it, and SHALL NOT place raw input into the SVG or a share link (no markup injection). — `test_sanitize_nick`, `test_svg_escapes_nick`
- **R7** IF an unknown purpose / mood / palette / glow key is given, THE SYSTEM SHALL fall back to a safe default and SHALL NOT branch on the unknown key. — `test_unknown_key_falls_back`

## Composition rules (code decides)

- **R8** THE SYSTEM SHALL compose layers only in a fixed order. The render order in `engine/svg.js` is: background, scene, fog, moon, bats, props, ghost, costume, headwear, pumpkin, vignette and grain, frame, text. `LAYER_ORDER` in `engine/compose.js` lists the same layers in the same relative order but does not yet name scene, costume or headwear (the test checks that constant). — `test_layer_order_fixed`
- **R9** IF mutually exclusive parts are selected (e.g. hat and horns), THE SYSTEM SHALL apply exactly one per the rule and record that decision in the result meta. — `test_mutually_exclusive_parts`

## SVG render (replaces ASCII density/invert/monospace)

- **R10** THE SYSTEM SHALL support a selectable `mood` (uneasy / screaming / hollow) that changes the ghost face, and `palette` (deeppurple / magenta / indigo) and `glow` (soft / strong) that change color and glow strength — each producing a visibly different invitation. — `test_mood_variants_differ`, `test_palette_variants_differ`
- **R11** THE SYSTEM SHALL output a well-formed SVG document: a single root `<svg>` with a fixed `viewBox` (`0 0 1080 1080` for the default `square` format; the `story` and `wide` formats of R34 use their own fixed size), balanced tags, and no unresolved template placeholders. — `test_svg_wellformed`
- **R12** THE SYSTEM SHALL keep the dark-fantasy contract: a dark radial background with lighter foreground subjects (white ghost, glowing pumpkin), so the subject always reads against the field. — `test_dark_background_contract`

## Save

- **R13** WHEN the user saves, THE APP SHALL persist the current config to localStorage and restore it after reload. — `test_config_roundtrip` (engine serialize/deserialize); app-level restore verified in demo.
- **R14** WHEN the user exports an image, THE APP SHALL rasterize the SVG to a PNG via canvas. — verified in demo; engine provides the exact SVG.

## Share (no backend)

- **R15** WHEN the user copies a share link, THE SYSTEM SHALL encode the config into a URL parameter (no server storage). — `test_share_link_roundtrip`
- **R16** WHEN a share link is opened, THE SYSTEM SHALL decode the config and reconstruct the identical invitation (with R2). — `test_open_shared_link_restores`
- **R17** IF a share parameter is corrupt or forged, THE SYSTEM SHALL fall back safely to a default invitation and SHALL NOT crash or execute arbitrary input. — `test_corrupt_share_param_safe`; `test_forged_nested_event_array_reports_invalid`

## Safety

- **R18** BEFORE producing any share/export output, THE SYSTEM SHALL scan the nickname / free text for banned phrases, script-like content, and obvious PII patterns, and block output if found. — `test_share_content_scan`
- **R19** THE SYSTEM SHALL never include any secret, account id, key, or token in code, config, or output. — enforced by hook `pre-commit-secret-scan`.

## Accessibility / fallback

- **R20** IF JavaScript is disabled, THE APP SHALL show a `<noscript>` explanation and a static fallback (no blank page). — verified in demo.
- **R21** THE APP SHALL provide a text alternative (title / purpose / year) for the SVG invitation so a screen reader can read it (SVG `<title>` / `aria-label`). — `test_svg_has_title`, app verified in demo.

## Customization depth (added 2026-11-05 after market research)

> Changelog: market research (Canva, Evite, Paperless Post) showed our options
> were too thin and that an invitation without date/time/place is incomplete.
> R22-R26 add a Halloween asset library, per-asset color, event details and
> Unicode names. Determinism, validation, share and safety rules still apply.

- **R22** THE SYSTEM SHALL offer these selectable assets, each drawn only when selected: hat, horns, moon, bats, cobweb, crow, cat, tombstone, skull, candle, pumpkins. Unselected assets SHALL NOT appear in the SVG. — `test_every_asset_is_drawn`, `test_no_assets_by_default`
- **R23** WHEN a swatch (orange, purple, green, bone, blood, ice) is chosen for an asset, THE SYSTEM SHALL draw that asset in that color. IF the swatch or asset key is unknown, THE SYSTEM SHALL drop it. A tint for an unselected asset SHALL NOT change the output. — `test_tint_changes_asset`, `test_unknown_tint_dropped`, `test_tint_of_unselected_asset_is_inert`
- **R24** THE SYSTEM SHALL accept event details (date, time, place; max 16/12/32 characters), sanitize them, and print them on the invitation; WHEN all are empty, no details line SHALL be printed. Each field SHALL be scanned for PII/script content before share or export. — `test_event_details_rendered`, `test_event_details_sanitized`, `test_event_scan_blocks_pii`
- **R25** THE SYSTEM SHALL accept letters, numbers and combining marks from any script in the nickname and event text (so Korean and Japanese names work), SHALL still strip markup, symbols and emoji, SHALL normalize to NFC, and SHALL truncate by code point so no lone surrogate is ever produced. — `test_unicode_nick_allowed`, `test_truncation_never_splits_surrogate`
- **R26** WHEN an asset or tint is toggled, THE SYSTEM SHALL NOT change the ghost body shape or the fog (independent seeded streams). — `test_toggle_does_not_change_ghost_body`, `crew_parts_do_not_reshuffle_fog`

## Remix (added 2026-11-05)

> Changelog: Canva, Evite and Paperless Post are template pickers. A Remix button
> that invents a new look from a seed, and whose result is reproduced exactly by
> the share link, is our differentiator. The engine stays pure: it takes a seed
> as an input; only the app chooses a random seed.

- **R27** WHEN given a config and an integer seed, THE SYSTEM SHALL return a new valid config whose look (mood, palette, glow, assets, asset colors) is determined solely by the seed, SHALL keep the user's own content (purpose, year, nickname, event details) unchanged, and SHALL return the identical result for the same inputs. — `test_remix_deterministic`, `test_remix_keeps_user_content`
- **R28** THE SYSTEM SHALL ensure a remixed config is always valid (enums in range, hat and horns never both selected) and renders a well-formed SVG, for ANY integer seed including negative, huge or non-integer values (which fall back to a safe seed). — `test_remix_always_valid`, `pbt: remix`
- **R29** DIFFERENT seeds SHALL produce visibly different looks: across 60 seeds at least 40 distinct SVGs. — `test_remix_variety`

## Costumes and scenes (added 2026-11-05, WBS P1)

> Changelog: the ghost can now wear a popular Halloween costume and stand in one
> of four scenes. Both are plain enums on the config, so they ride the share
> link, are covered by Remix, and cannot change the ghost's shape or the fog.

- **R30** THE SYSTEM SHALL support a `costume` of none, dracula, mummy, pirate or skeleton. Exactly one costume SHALL be worn at a time; an unknown value SHALL fall back to none. A costume SHALL be clipped to the ghost's body so no part of it spills outside. — `test_costume_is_drawn`, `test_unknown_costume_falls_back`, `test_costume_is_clipped_to_body`
- **R31** THE SYSTEM SHALL support a `scene` of sky (the plain background, nothing extra drawn), graveyard, house or forest (three drawn scenes), drawn behind the fog. An unknown value SHALL fall back to sky. — `test_scene_is_drawn`, `test_unknown_scene_falls_back`
- **R32** Costumes SHALL accept a color from the same six swatches (`tints` keyed by the costume id). A tint for a costume that is not worn SHALL NOT change the output. — `test_costume_tint`, `test_costume_tint_inert_when_not_worn`
- **R33** Changing the costume or the scene SHALL NOT change the ghost body shape or the fog; both SHALL survive the share link and be chosen by Remix. — `test_costume_scene_do_not_reshape_ghost`, `test_share_roundtrip_costume_scene`, `test_remix_covers_costume_and_scene`

## Export sizes (added 2026-11-05, WBS P2)

- **R34** THE SYSTEM SHALL render the same invitation in three sizes: `square` (1080x1080), `story` (1080x1920) and `wide` (1920x1080). Square SHALL be the default and SHALL remain byte-identical to before. An unknown format SHALL fall back to square. — `test_format_dimensions`, `test_square_is_default_and_unchanged`, `test_unknown_format_falls_back`
- **R35** story and wide SHALL contain the complete square artwork unmodified (nothing cropped or rescaled below 100%), centered, with the remaining space filled by a palette-matched backdrop; ids SHALL NOT collide, so the SVG stays well-formed. — `test_wide_story_contain_whole_artwork`, `test_formats_wellformed_and_deterministic`

## Calendar file (added 2026-11-05, WBS P2)

> Changelog: competitors collect RSVPs on a server. We stay serverless, so the
> closest useful thing is a downloadable calendar entry made on the device.

- **R36** THE SYSTEM SHALL turn the event date and time into a calendar date ONLY when it can read them unambiguously: `Oct 31`, `October 31`, `31 Oct`, `10/31`, `10.31`, `2026-10-31`, `10월 31일`; times `7:00 PM`, `7 PM`, `19:00`, `7:30pm`. A missing time SHALL mean an all-day event. Anything it cannot read, or an impossible date (Feb 30, month 13), SHALL give no calendar entry rather than a guess. The year SHALL come from the config unless the date text carries its own. — `test_parse_event_date_formats`, `test_unreadable_dates_give_nothing`, `test_impossible_dates_rejected`
- **R37** THE SYSTEM SHALL build a valid iCalendar (RFC 5545) text for a readable event: CRLF line endings, lines folded at 75 octets, `,` `;` `\` and newlines escaped in text values, a UID that is a stable function of the config (no clock, no randomness), floating local time (no time zone is invented), and a 2-hour default length. — `test_ics_structure`, `test_ics_is_deterministic`, `test_ics_line_folding`
- **R38** THE SYSTEM SHALL NOT allow any user text to inject extra iCalendar lines (header injection). — `test_ics_cannot_be_injected`

## Looks and readability (added 2026-11-05, WBS block E)

> Changelog: customization looked thin next to Canva-class tools, and nobody had measured readability. Presets give a one-click start; contrast is now a tested number.

- **R39** THE SYSTEM SHALL keep every text in the artwork and every button label at WCAG contrast 4.5:1 or better, for all three palettes (banner, subtitle, footer at its opacity, event line) and for both button gradients. Disabled controls are exempt. — `test_svg_text_contrast_*`, `test_action_button_contrast`, `test_remix_button_contrast`
- **R40** THE SYSTEM SHALL offer at least six named presets, each a complete look (mood, palette, glow, costume, scene, assets, colors). — `test_presets_exist`, `test_presets_look_different`
- **R41** A preset SHALL change only the look. Purpose, year, nickname and event details SHALL survive unchanged. — `test_preset_keeps_user_content`
- **R42** An unknown, empty or non-string preset id SHALL change nothing; a preset result SHALL already be normalized. — `test_unknown_preset_is_noop`, `test_preset_is_already_normalized`

## Red team round 2 (added 2026-11-05, WBS block F)

- **R43** THE SYSTEM SHALL treat an export format that is not one of its own keys (including `__proto__`, `constructor`, `toString`) as the square format, and never throw. — `test_format_size_ignores_prototype_keys`
- **R44** THE SYSTEM SHALL read only text and finite numbers as user text. An object or array in a text field SHALL count as empty instead of becoming the words "object Object". — `test_event_fields_reject_non_text`, `test_nick_rejects_non_text`

## Crew review round 2 fixes (added 2026-11-05, WBS block F)

> Changelog: the Crew opened the app in a real Chrome and found two bugs that 117 passing Node tests could not see (S1 `Buffer`, S2 duplicate SVG ids). Details in `docs/CREW_FINDINGS_R2.md`.

- **R45** THE ENGINE SHALL NOT use Node-only globals (`Buffer`, `process`). `.ics` byte counting SHALL work with `TextEncoder`. — `test_ics_works_without_node_buffer`
- **R46** THE APP SHALL NOT put several inline SVGs with the same element ids in one page. Preset thumbnails SHALL be `<img>` elements. — checked in headless Chrome (0 duplicate ids); not unit-testable in Node
- **R47** THE SCAN SHALL treat decimal digits of any script as digits and SHALL block links (`scheme://`, `www.`) in free text. — `test_scan_blocks_fullwidth_and_other_script_phone_numbers`, `test_scan_blocks_links`
- **R48** THE CALENDAR READER SHALL also read `2026년 10월 31일`, `오전/오후 N시 [M분]` and `13시`-`23시`. A bare `7시` (am or pm) SHALL NOT be guessed. DTSTAMP SHALL be UTC (`Z`). — `test_ics_reads_korean_dates_and_times`, `test_ics_korean_time_without_am_pm_is_not_guessed`, `test_ics_dtstamp_is_utc`
- **R49** A line of text estimated wider than 940 px SHALL be squeezed with `textLength`; shorter lines SHALL be left alone. — `test_fit_length_only_when_text_is_too_wide`, `test_long_korean_event_line_is_squeezed_in_the_svg`, `test_short_text_is_not_squeezed`
- **R50** THE FIRST SCREEN SHALL show the save/share buttons and a one-line explanation before the long list of controls, and SHALL say in words (not only a tooltip) why the calendar button is off. — checked by eye in headless Chrome

## Static checks added 2026-11-09 (tests/static_checks.test.js)

> These read `app/index.html`, `app/main.js` and `deploy/template.yaml` as text. They prove the elements exist and are ordered; they do not prove how the page looks in a browser.

- **R20 (check added)** — `test_noscript_explains_the_page`, `test_noscript_comes_before_the_hidden_app`
- **R46 (check added)** — `test_preset_thumbnails_are_img_elements`, `test_index_html_has_no_inline_svg_in_the_preset_gallery`
- **R50 (check added)** — `test_save_and_share_come_before_the_long_controls`, `test_calendar_button_has_a_written_reason_slot`

## Link preview (added 2026-11-08, WBS 2.3)

- **R51** THE APP SHALL declare an absolute `og:image` URL to a real 1200x630 PNG (crawlers do not read SVG), with width, height, alt text and a large Twitter card. `deploy/make_og.mjs` builds the PNG from the engine; the stage script ships it. — `test_og_image_is_absolute_png_url`, `test_og_png_exists_and_is_1200x630`, `test_og_declares_size_alt_and_large_twitter_card`, `test_stage_script_copies_og_png`

## Deployment and restore (added 2026-11-09)

> Changelog: both were true and documented in `design.md` but had no requirement number.

- **R52** THE DEPLOYMENT SHALL serve the app as static files from a private S3 bucket (public access blocked) through CloudFront with origin access control, with no server-side component. A custom domain (ACM certificate, CloudFront alias, Route 53 record) SHALL be optional and SHALL change nothing when no domain is given. — `test_template_keeps_bucket_private_with_oac`; the live site and the repo are also checked by `docs/audit_submission.sh`. The live-site part is a check by hand or by script, not a Node unit test.
- **R53** ON LOAD THE APP SHALL choose the starting invitation in this order: the `?i=` share parameter, else the config saved in localStorage, else the defaults. IF the share parameter is present but corrupt, THE APP SHALL show the default invitation with a message and SHALL NOT fall back to localStorage. — `test_restore_order_share_param_before_local_storage` (order in the code); `test_corrupt_share_param_safe` (engine fallback R17). The visible behavior in a browser is a check by hand.

## Receiver experience (R60-R69)

> Added 2026-11-09 (review R3, finding C1/C3/C7/C8/C10). Someone who opens a share link should see an invitation they received, not a creation tool. The `?i=` link format and the engine's SVG output do not change.

- **R60** WHEN the page is opened with an `i` parameter that decodes successfully, THE APP SHALL start in receiver view (card and receiver actions only). A missing `i` parameter, or one that fails to decode, SHALL start the editor; a corrupt link SHALL still show the default invitation and the "corrupt" hint. — `test_receiver_view_only_for_valid_link`, `test_corrupt_link_falls_back_to_editor`
- **R61** THE APP SHALL let the receiver switch to the editor with the same configuration, and SHALL offer a "make your own" link that is the app URL without the `i` parameter. — `test_make_your_own_url_drops_the_param`, `test_receiver_view_has_edit_and_make_your_own`
- **R62** WHEN in receiver view, THE APP SHALL set the page title from the normalized nickname only; with an empty nickname it SHALL use a fixed title. Raw URL text SHALL never reach the title. — `test_receiver_title_uses_normalized_nick`, `test_receiver_title_empty_nick`
- **R63** THE RECEIVER VIEW SHALL offer the calendar download only when `buildIcs` can read the date; otherwise the button SHALL NOT be shown. — `test_receiver_calendar_only_when_date_reads`
- **R64** WHEN the event date can be read and is today or later, THE RECEIVER VIEW SHALL show a countdown computed from an injected "today" (the engine never reads the clock). A past or unreadable date SHALL show nothing. — `test_countdown_days`, `test_countdown_today_tomorrow`, `test_countdown_hidden_for_past_or_unreadable`
- **R65** THE APP SHALL show a native Share button only when `navigator.share` is a function; otherwise it SHALL keep the copy-link button. — `test_native_share_only_when_supported`
- **R66** THE ENTRANCE ANIMATION SHALL be CSS only, SHALL be disabled under `prefers-reduced-motion`, and SHALL NOT change the SVG string. — `test_entrance_animation_respects_reduced_motion`, `test_render_svg_unchanged_by_receiver_work`
- **R67** WHEN the viewport is 760 px wide or narrower, THE APP SHALL show the preview above the controls. — `test_mobile_preview_comes_first`
- **R68** THE "Save config" button SHALL say what it does (remembers the setup on this device). — `test_save_config_label_is_explained`
- **R69** The share-link format and existing links SHALL keep working: a config encoded before this change SHALL decode to the same config. — `test_existing_link_roundtrip_still_works`

## Living ghost, music and GIF (R70-R89)

> Added 2026-11-10 (production week plan, `PLAN_PRODUCTION_WEEK.md`). Goal: the Kiro-style ghost moves like a soft jelly, can be styled by touch, plays optional music, and can be saved as an animated GIF. Rule of the whole block: **motion, GIF bytes and sound scheduling are decided by pure functions of (config, time); the browser only draws and plays.** Named tests are written first; a name appears in backticks only after the test exists, so the trace hook stays honest.

### Motion
- **R70** THE ENGINE SHALL expose a pure `pose(t, cfg)` that returns the ghost's transform parameters (bob, squash and stretch, tail wave, blink, glow pulse) for a time `t` in seconds. The same `t` and config SHALL give the same numbers. — `test_pose_is_deterministic`, `test_pose_is_always_finite`, `test_pose_preserves_volume`
- **R71** `pose` SHALL be periodic: for the loop length `LOOP_SECONDS`, `pose(0)` and `pose(LOOP_SECONDS)` SHALL be equal in every field, so a GIF loops without a jump. — `test_pose_loops_seamlessly` (property-based)
- **R72** THE SVG renderer SHALL accept an optional pose and apply it to named groups with stable unique ids (`ghostRig`, `ghostEyes`, `ghostTail`, `ghostGlowLayer`, `ghostBody`), and WITHOUT a pose it SHALL stay deterministic and carry no `data-pose` attribute. — `test_render_without_pose_is_unchanged`, `test_pose_groups_have_stable_unique_ids`, `test_pose_changes_render_and_is_deterministic`, `test_ghost_path_d_matches_render_and_waves_with_pose`
  > Changelog 2026-11-10: the first draft said "same bytes as before when no pose is passed". That cannot hold together with the ghost redraw requested in the same week (found by the motion tab). Decision: byte-identity with the OLD ghost is dropped; determinism and the absence of pose data are kept. Tests that pinned old ghost bytes were updated by the motion tab.
- **R73** WHILE `prefers-reduced-motion` is set, THE APP SHALL NOT animate the ghost and SHALL show the rest pose. (tests planned: test_reduced_motion_shows_rest_pose)
- **R74** WHEN the user presses or drags the ghost, THE APP SHALL feed a damped spring (pure function, fixed constants) so the ghost squashes and wobbles back. The spring SHALL be deterministic for the same input sequence and SHALL settle within a fixed time. — `test_spring_is_deterministic`, `test_spring_settles`, `test_spring_clamps_dt_and_input`, `test_spring_squashes_the_ghost`

### Styling by touch
- **R75** WHEN the user taps the ghost's head, face or hand area, THE APP SHALL cycle the matching option (costume, expression, prop) to the next valid value, through the same normalizer as the form controls. (tests planned)
- **R76** THE ENGINE SHALL offer at least eight expressions. An unknown expression key SHALL fall back to the default (as R7 does). (tests planned)

### GIF
- **R77** THE ENGINE SHALL contain a pure GIF encoder: RGBA frames in, bytes out, with a global palette built from all frames, a loop-forever header and a fixed frame delay. No DOM, no clock, no randomness. — `test_gif_has_valid_structure`, `test_gif_roundtrip_pixels`
- **R78** THE SAME frames SHALL produce the same GIF bytes. — `test_gif_is_deterministic`
- **R79** THE ENCODER SHALL reject input that is empty, has mismatched frame sizes, or exceeds a fixed pixel budget, and SHALL NOT allocate before checking. — `test_gif_rejects_bad_input`
- **R80** THE APP SHALL build the frames from `pose(t)` at evenly spaced times over one loop, encode in a Web Worker, show progress, and stay under a fixed size budget; IF the result is over the budget THE APP SHALL lower the frame size and try once more, then say so. — `test_plan_gif_size_shrinks_when_over_budget`, `test_gif_worker_message_validation`

### Sound
- **R81** THE APP SHALL NOT make any sound until the user taps something that turns music or the opening reveal on. Music SHALL be off by default and SHALL remember the choice. — `test_music_off_by_default`, `test_saved_on_does_not_autoplay`, `test_corrupt_saved_state_falls_back`
- **R82** EVERY audio file under `assets/audio/` SHALL have a row in `assets/audio/LICENSES.md` naming its source page, license and original hash. THE `audio-license-guard` hook and a test SHALL fail when a file has no row. — `test_audio_files_have_license_rows`, `test_audio_guard_flags_unlisted_file`
- **R83** AUDIO FILES SHALL load only when the user turns sound on, never on page load. — `test_no_fetch_before_enable`, `test_enable_fetches_once_and_plays_loop`, `test_audio_is_not_loaded_on_page_load`
- **R84** SOUND EFFECTS (squish, pop, creak) SHALL be synthesized in code from fixed parameters in a pure module, with no sample files. — `test_sfx_plan_is_deterministic`, `test_sfx_unknown_name_is_empty`, `test_sfx_gain_is_capped`

### Share link v2
- **R85** THE SHARE LINK SHALL carry a version, keep every v1 link working (R69), cap the number of stickers and the link length in code constants, and reject anything over the cap instead of truncating. (tests planned)

## Not verified (carried over, shown here on purpose)

- **P16** Cross-browser and mobile: the SVG filters, the PNG save, and importing the `.ics` into real calendar apps were checked in Chrome only. Safari, Firefox and mobile are NOT verified. See `tasks.md` P16.
