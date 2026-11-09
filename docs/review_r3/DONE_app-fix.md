# DONE: app-fix (2026-11-09)

## 1. 한 일
| ID | 커밋 | 검증 |
|---|---|---|
| C3 forged nested `e` array → ok:false (R17 부정 경로) | 7491110, 67b988f(스펙 R17 줄에 테스트 이름 추가) | 실패 확인(stash로 수정 제거 시 fail 1) 후 수정, node --test 통과 |
| C1, C2, C4 | 코드 변경 없음 | RED_TEAM 기록상 이미 PASS(C1 scan 차단, C2 year 거부, C4 no-op). 막을 추가 가치 없음 |
| 접근성: 수신자 뷰 버튼 대비·포커스 링 테스트 추가 | (test(a11y) 커밋) | 실제 색은 이미 4.5 이상. 기존 contrast 테스트가 .recv 버튼을 덮지 않던 구멍을 메움 |
| **버그 발견·수정**: `.layout{display:grid}`가 `hidden`을 덮어 수신자 뷰 아래에 편집기가 그대로 보임 | 32250e3 | 화면에서 재현(편집기 display:grid) → 테스트 추가 → 수정 후 display:none 확인. 이전 라운드(app-recv)의 "편집기 숨김" 확인은 hidden 속성만 봤고 실제 표시는 못 잡았음 |

최종: node --test 163 pass / 0 fail, spec_trace_check clean.

## 화면 확인 (내 Chrome 탭, localhost:8138, 끝나고 서버 종료)
| 누른 것 | 기대 | 실제 |
|---|---|---|
| `?i=` 링크 열기(수정 전) | 수신자 뷰만 | 편집기가 아래에 같이 보임(버그) |
| 같은 링크, 수정 후 reload | 수신자 뷰만, 포커스 recvTitle | app display:none, recv flex, 포커스 recvTitle, 제목 "Mina's invitation…" |
| 390x800 모바일 에뮬레이션 | 가로 스크롤 없음, 버튼 줄바꿈 | scrollWidth 390=clientWidth, 버튼 정상 배치 |
| Edit this invitation | 편집기 표시, 닉네임 유지, 포커스 #nick | app grid, recv none, 포커스 nick, 값 Mina, 제목 복원 |
스크린샷: docs/review_r3/screens/recv_desktop.png (수정 전 상태 아님, 수정 후 reload 직후), recv_mobile.png, recv_to_edit_mobile.png. (도구의 임시 폴더 파일을 복사. /tmp 직접 저장은 경로 제한으로 거부됨.)

## 2. 못 한 것
- 카운트다운: 예시 날짜(Oct 31 2026)가 오늘(11/09) 기준 과거라 비어 있음. 미래 날짜 화면 확인은 안 함(recv_view 단위 테스트만).
- recv_desktop.png는 전체 뷰포트이며 수정 전 첫 스크린샷(편집기 노출)은 파일로 저장하지 않음.
- 편집 모드 모바일 미리보기에서 유령이 외곽선처럼 흐리게 보임(애니메이션 중간 프레임으로 추정, 확인 안 함).
- 실제 공유 시트, .ics 가져오기, Safari/Firefox 미확인.

## 3. 지휘자에게
- wt/app-fix 머지 후 node --test, node deploy/stage.mjs. 이전 wt/app-recv 와 app/style.css 충돌 가능(같은 줄 근처).
- 테스트 수 문서(README/KIRO_EVIDENCE/Devpost)는 163으로 갱신 요청(kiro-docs).
