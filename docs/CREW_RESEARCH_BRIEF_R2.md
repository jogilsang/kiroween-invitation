# Kiro Crew 2차 리뷰 지시서 (2026-11-05)

> 1차 리뷰(`CREW_FINDINGS.md`) 이후 바뀐 부분만 다시 본다. 코드는 고치지 말고 조사·제안만 한다.
> 산출물: 이 폴더의 `CREW_FINDINGS_R2.md` 한 파일. 각 주장에 "어느 파일/동작에서 확인했는지"를 단다. 확인 못 한 것은 "미확인"으로 쓴다.

## 1. 1차 이후 바뀐 것 (파일로 교차검증할 것)
- 의상 4종(dracula, mummy, pirate, skeleton)과 배경 3종: `engine/costumes.js`, `engine/scenes.js`
- 내보내기 크기 3종(square, story 9:16, wide 16:9): `engine/svg.js`의 `renderSvg(cfg, {format})`, `formatSize`
- 캘린더 파일(.ics): `engine/ics.js`, 앱 버튼 `saveIcs`
- 프리셋 6종: `engine/presets.js`, 앱 갤러리 `buildPresets`
- Remix: `engine/remix.js`
- 대비(WCAG 4.5:1) 수정: 버튼 그라디언트 2개를 고침. 테스트 `tests/contrast.test.js`
- 레드팀 2차(B1-B20): `docs/redteam_probe.mjs`, `docs/RED_TEAM.md` 하단. 버그 2건(R43, R44)을 테스트 먼저 쓰고 고침.
- 요구사항 R22-R44, `tasks.md`의 WBS 절
- 테스트 117개 통과(`node --test`).

## 2. 1차 지적의 반영 여부 다시 확인
hat/horns 미렌더, 닉네임 길이 40 vs 24, 키보드 이동, tasks 정리. 고쳐졌는지 직접 확인할 것.

## 3. 새로 보고 싶은 것 (이 순서로 답)
1. 새 기능이 서로 부딪히는 조합이 있는가? 예: 의상+모자, 의상+많은 에셋, story/wide 크기에서 글자 잘림, 긴 한글 이벤트 문구.
2. 레드팀 2차가 놓친 입력이 있는가? 특히 `.ics`(RFC 5545 줄바꿈·이스케이프), 공유 링크 왕복, 새 필드(costume, scene, tints, event)의 정규화.
3. 대비 테스트가 실제로 의미 있는가? 텍스트 배경을 `bg0`/`bg1`로 근사한 것이 안전한 근사인지(안개·비네팅 위의 글자). 약한 가정이 있으면 지적.
4. 프리셋 6종이 서로 충분히 달라 보이는가, 이름이 의미를 전달하는가(`engine/presets.js`).
5. "공개 심사자 첫 1분" 관점: 첫 화면에서 무엇을 해야 하는지 분명한가? 가장 먼저 고칠 3가지.
6. 주장 점검: `docs/KIRO_WRITEUP.md`, `docs/KIRO_AND_CREW_STORY.md`에 코드·테스트로 뒷받침되지 않는 문장이 있는가?
7. 판정: GO / GO with fixes / NO-GO (코드 동결 12/02 기준). 고칠 항목은 심각도 순으로.

## 4. 제약
- 서버·로그인·DB 추가 제안은 "서버리스 철학을 깨는 선택지"라고 명시.
- 렌더 경로에 AI/난수/시계를 넣는 제안 금지(결정론).
- 브라우저 호환(Safari/Firefox/모바일)은 직접 못 하면 "미확인"으로 둔다.
