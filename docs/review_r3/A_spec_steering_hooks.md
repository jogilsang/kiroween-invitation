# 평가 A: Kiro 스펙, 스티어링, 훅 (R3)

평가일 2026-11-09, 읽기 전용. 수정한 파일은 이 보고서뿐이다.

## 0. 확인한 것과 못 한 것

- 확인함: `.kiro/specs/kiroween-invitation/*`(requirements 157줄, design 110줄, tasks 72줄), `.kiro/steering/*.md` 3개, `.kiro/hooks/*` 7개, `.kiro/agents/*.json` 5개, `docs/KIRO_EVIDENCE.md`(212줄), `docs/KIRO_WRITEUP.md` 일부, `docs/audit_submission.sh`, `../reference_scan/REPORT.md`, `../RULES_CHECK.md`.
- 실행함: `node --test` → 131 tests, pass 131, fail 0. requirements에 백틱으로 적힌 테스트 이름 83개를 `tests/*.js` 전문과 글자 그대로 대조 → 82개 존재, 1개는 와일드카드(`test_svg_text_contrast_*`)라 대조 불가(실제로는 contrast.test.js가 있음).
- 못 함(미확인): Kiro가 이 훅·스티어링·에이전트 파일을 실제로 읽고 실행하는지. Kiro 쪽 스키마는 내 기억과 이 세션의 훅 도구 설명에 기대 판단했고 공식 문서는 열지 않았다. 공개 레포(kiroween-invitation)의 현재 상태와 git hook 설치 여부. app/ 코드 내용.

## 1. 한 줄 판단

스펙은 EARS와 테스트 이름 연결이 이미 상위권이다. 약점은 심사 기준 Technological Implementation에 쓸 "Kiro 기능이 실제로 작동했다는 증거"다.
- 훅이 스스로 발동한 기록이 없다. 작성자가 KIRO_WRITEUP에서 "CLI에서 스스로 발동하는 건 못 봤다"고 적었다.
- 스티어링 3개는 전부 항상 켜짐이다.
- 에이전트의 권한 경계(`scope`)는 강제되지 않는 문구다.
- 11/6 이후 기능(의상, 장면, 출력 3종, .ics, 프리셋, OG)의 개발 증거가 KIRO_EVIDENCE에 거의 없다.

## 2. 지적 표

우선순위: P0 = 심사 영향 큼, P1 = 해두면 좋음, P2 = 정리. 공수: S = 1시간 이내, M = 반나절, L = 하루 이상.

| ID | 우선 | 근거 | 수정안 | 공수 |
|---|---|---|---|---|
| A-01 | P0 | 훅이 실제로 잡거나 발동한 기록이 없다. `docs/KIRO_WRITEUP.md:19`에 "스스로 발동하는 걸 아직 못 봤고 같은 스크립트를 손으로 돌렸다"고 쓰여 있다. `KIRO_EVIDENCE.md`의 훅 항목은 secret_scan.sh를 손으로 시험한 것(11/5)뿐이다. 즉 훅 5종이 "존재"할 뿐 "작동"의 증거는 아니다. | 새 Kiro CLI 세션에서 `engine/` 파일을 저장해 test-on-save가 발동하는 장면과, requirements를 고쳐 spec-change-reminder가 발동하는 장면을 캡처한다. 발동 사실을 날짜와 함께 KIRO_EVIDENCE에 적는다. 안 되면 안 된다고 쓴다(정직성 규칙). | S |
| A-02 | P0 | `pre-commit-secret-scan`은 `.kiro.hook`(IDE 형식)만 있고 CLI용 `.json` 쌍이 없다. 트리거 `when.type: "preCommit"`이 Kiro IDE의 유효한 타입인지 미확인이다(내가 아는 IDE 타입은 fileEdited, fileCreated, fileDeleted, userTriggered, agentStop, preToolUse 등이고 preCommit은 기억에 없다. 단정 아님). 작성자도 Kiro IDE를 안 썼다고 적었다(KIRO_WRITEUP.md:9). 실제 차단은 모노레포 루트 `.git/hooks/pre-commit`이 한다(ls로 pre-commit 존재 확인). 이 파일은 공개 레포에 안 올라간다. | (a) CLI JSON 쌍을 추가한다. 트리거는 PreToolUse, matcher는 shell 도구, `git commit`/`git push` 감지 시 `secret_scan.sh`가 exit 2를 내게 한다. 이 세션의 훅 도구 설명상 exit 2는 차단 의미다. (b) `preCommit`의 유효성을 Kiro 문서에서 확인하고, 아니면 `userTriggered`나 `agentStop`으로 바꾼다. (c) 공개 레포에 `.githooks/pre-commit` 설치 안내를 README에 넣는다. | M |
| A-03 | P0 | 에이전트 JSON의 `scope` 키는 Kiro 에이전트 스키마 필드가 아닐 가능성이 높다(내 기억상 name, description, prompt, tools, allowedTools, toolsSettings, resources, hooks, model 등. 단정 아님, 문서 미확인). `tools`/`allowedTools`가 없어서 `red-team`("engine/app을 절대 못 건드린다", `agents/red-team.json`)은 프롬프트 한 줄일 뿐 강제가 아니다. `model: "auto"`라 "다른 모델 리뷰어" 서사도 못 쓴다. REPORT.md 3.2가 상위권의 차별점으로 꼽은 부분이 정확히 이것이다. | red-team과 리뷰어는 `tools: ["read", "shell"]`로 제한하고 write는 `docs/RED_TEAM.md`만 허용한다(`toolsSettings`의 경로 허용). 나머지 에이전트는 `scope`와 같은 범위를 `toolsSettings.fs_write.allowedPaths` 같은 필드로 옮긴다(필드명은 공식 문서로 확인). 에이전트별 `resources`로 steering·spec을 연결한다. red-team에는 다른 모델을 지정해 "독립 검증"을 문자 그대로 만든다. | M |
| A-04 | P0 | KIRO_EVIDENCE에 11/6~11/8 개발 증거가 없다. grep 결과 "2026-11-0[6-9]"는 3행의 명명 안내뿐, R51/OG/도메인/의상·장면/프리셋/CloudFront 도메인 항목 없음(마지막 본문 항목은 "2026-11-05 (evening) blocks E, F, G"). 반면 requirements/tasks는 11/8까지 갱신됐다. 심사자가 스펙 변경 이력과 증거 문서를 대조하면 빈 구간이 보인다. | spec-change-reminder 훅이 하는 일(날짜 있는 한 줄)을 수동으로 보충한다. R30-R38, R40-R42, R51 및 도메인·개명에 각각 "무엇을 스펙에 넣고 어떤 테스트를 먼저 썼는지" 한 줄씩. 날짜는 실제 커밋 로그에서 가져온다(`git log --follow`). | S |
| A-05 | P1 | 스티어링 3개 전부 front matter가 없다(head 확인). 즉 항상 켜짐 기본값이고 fileMatch/manual이 0이다. REPORT.md 5절 1순위·2순위가 미반영이다. | `tech.md`의 "Hard rules"를 `engine/**`에 걸리는 `engine-purity.md`(fileMatch)로 분리한다. 앱 쪽 규칙(접근성, noscript, 큰 클릭 영역, 대비)은 `app/**` 대상 `app-a11y.md`로 둔다. `release-check.md`는 `inclusion: manual`로 둔다(감사 스크립트 절차 + 비밀 스캔 + 공개 전환 전 사용자 확인). 규칙 문구는 기존 문서를 쪼개는 것이므로 새 주장은 없다. | S |
| A-06 | P1 | 빠진 스티어링: (1) 테스트 규칙이 principles.md 한 줄에만 있다. (2) 접근성 규칙이 스티어링에 없고 R21/R50/contrast.test.js에만 있다. (3) 문서 규칙(증거 문서에 날짜, "확인한 것/못 한 것" 구분, 영어 본문 등)이 없다. (4) 정직성 규칙: KIRO_WRITEUP에 "쓰지 않은 것은 쓰지 않았다고 적는다"는 원칙이 있는데 steering에는 없다. | `testing.md`(fileMatch `tests/**`: 정상2·부정2·오류1, 테스트 제목에 `test_` 접두와 R번호, 순서 독립), `docs-honesty.md`(fileMatch `docs/**`: 확인/미확인 구분, 날짜, 수치는 명령 결과로 확인). doppelganger의 `ml-honesty.md`는 아이디어만 참고하고 문구는 새로 쓴다. | S |
| A-07 | P1 | 스티어링과 스펙의 수치 불일치. `design.md`와 `tech.md`는 scenes를 "3 backdrops"로 쓰는데 R31과 `art-tuner.json`은 4개(sky 포함)로 쓴다. `package.json`의 name은 `ascii-invite`, description은 "ASCII ... generator"이고 version 0.1.0이다. | 한쪽으로 통일한다(sky가 그림 없는 기본이면 "3 drawn + sky"로 명시). package.json 설명을 현재 제품에 맞춘다. | S |
| A-08 | P1 | 죽은/낡은 요구 문구. R7 "unknown purpose / **face** / mood ..." — face는 ASCII 시절 키이고 design의 InviteConfig에는 없다. R8 레이어 순서 문장이 design(scene, costume 포함)과 다르다. R11 "고정 viewBox 0 0 1080 1080"은 R34(story 1080x1920, wide 1920x1080)와 모순된다(R34가 "square 기본"이라 하여 읽으면 풀리지만 R11 문장만 보면 충돌). `tasks.md` Phase 1(T6-T11)은 "removed in pivot"이라고만 남은 죽은 항목이다. | R7에서 face 삭제, R8을 design의 순서로 갱신, R11에 "square 기준" 한정어 추가. Phase 1은 한 줄 요약으로 접어 "피벗 이력"으로 옮긴다. 변경은 changelog에 날짜와 함께 적는다. | S |
| A-09 | P1 | 테스트 이름 없는 요구가 6개다. R14(PNG 저장), R19(훅으로 검증), R20(noscript), R46(중복 id), R50(첫 화면 배치), R13의 앱 부분. 대부분 "브라우저에서 확인"인데 자동화된 검사가 없다. design.md "Every requirement names its test"(Testing strategy)와 엄밀히는 어긋난다. | 두 가지 중 하나: (a) 문구를 "every requirement names its check (test or browser check)"로 고친다. (b) R46, R50, R20은 파일 정적 검사 테스트로 자동화한다: `app/index.html`에 `<noscript>` 존재, 프리셋 썸네일이 `<img>`, 저장/공유 버튼이 컨트롤 목록보다 앞에 있음. 이 세 개는 DOM 없이 문자열 검사로 가능하다(`crew_nick_maxlength_matches_engine`과 같은 방식). | S~M |
| A-10 | P1 | 추적성이 사람 손으로만 유지된다. tasks.md에는 `_Requirements_` 같은 ID 표기가 없다. 요구→작업 대응은 W/Q/P 블록에 R번호가 흩어져 있고(예: "R30, R32, R33") Phase 1(T1-T14)은 R번호가 아예 없다. 설계에도 "Correctness Properties / Validates: Requirements"가 없다(REPORT.md 통계: 175개 스펙이 사용). `tests/pbt.test.js`가 R번호 주석 없는 유일한 테스트 파일이다. | (a) design.md에 Correctness Properties 절을 추가한다. PBT가 이미 지키는 5~6개 성질(결정성, 정상화 후 항상 유효, 공유 링크 항등, SVG 항상 well-formed, remix 유효, ics 안전)에 `Validates: R2, R7, R16, R28, R38` 같은 줄을 단다. 새 주장이 아니라 이미 있는 테스트의 이름 붙이기다. (b) pbt.test.js 각 property 위에 같은 R번호를 주석으로 단다. (c) 스펙 린트 훅(A-12)으로 자동 검사한다. | S |
| A-11 | P1 | 스펙이 아직 다루지 않는 영역. 맞는 R번호가 없는 것: 커스텀 도메인(ACM + Route 53, tasks W5.2와 design Deployment에만 있음), 배포 보안 헤더/OAC(스택에는 있으나 요구 없음), Remix 버튼과 프리셋 UI의 앱 동작, localStorage 복원(R13은 엔진 직렬화만 테스트), 모바일/교차 브라우저(P16 미해결로만 존재). 11/5 이후 기능 중 의상·장면·출력·.ics·프리셋·OG는 R30-R51로 반영됐다(확인함). | 새 R번호를 만들되 이미 사실인 것만 적는다. 예: R52 (배포) 정적 호스팅 + OAC + 선택적 도메인, 검증은 `deploy/template.yaml`의 cfn-lint나 `audit_submission.sh`. R53 (앱 복원) URL `?i=` → localStorage → 기본값 순서(design "On load"에 이미 있음)를 EARS로 옮긴다. P16은 "미검증"으로 요구 쪽에도 노출한다. | M |
| A-12 | P1 | 추가하면 좋은 훅이 하나도 없다. 현재 훅은 저장 시 테스트, 비밀 스캔, 스펙 변경 알림뿐이고 전부 PostFileSave/fileEdited류다. REPORT.md가 보인 차별점(PreToolUse 게이트, Stop, PostTaskExec, 스펙 린트)이 0개다. | 아래 3절의 훅 후보를 추가한다. 우선 (1) 스펙-테스트 추적성 검사 command 훅(결정적이라 에이전트형보다 믿을 만함), (2) PreToolUse 공개 전환 게이트. | M |
| A-13 | P1 | `spec-change-reminder`는 `agent`/`askAgent` 액션이라 호출마다 결과가 달라지고, 실행되면 `tasks.md`와 KIRO_EVIDENCE를 고치라고 시킨다. 하지만 사람이 검증할 수 있는 결과물(로그)이 안 남는다. 훅 설명 "spec drift silently breaks the chain"은 맞는 설계 의도지만, 현재 구조로는 드리프트를 못 막는다(이번 평가에서 R7 face, R8, R11, "3 backdrops"가 실제로 드리프트 상태임). | 에이전트 훅은 알림용으로 유지하고, 결정적 검사는 스크립트로 분리한다: `.kiro/hooks/spec_trace_check.sh`가 requirements의 백틱 테스트 이름이 `tests/`에 있는지, tasks.md가 참조하는 R번호가 requirements에 있는지 검사하고 불일치면 exit 2. (이번에 내가 쓴 대조는 grep 20줄이었다.) | S |
| A-14 | P2 | `test-on-save.json`의 `tail -12`는 실패 시 상세 원인이 잘릴 수 있다. `.kiro.hook`용 run_tests.sh는 전체 출력이다. 두 형식이 서로 다른 동작이다. | CLI 쪽도 `tail -30` 또는 실패 줄만 `grep -E "not ok|fail"`로 맞춘다. | S |
| A-15 | P2 | 두 형식(.json과 .kiro.hook)이 공존하는 이유가 코드 쪽에는 안 적혀 있다. KIRO_WRITEUP.md:19에만 한 문장 있다. | `.kiro/hooks/README.md` 한 장: 형식 2개(IDE `.kiro.hook`, CLI `.json`), 각 훅의 트리거, 어느 쪽이 실제로 발동을 확인했는지(A-01 결과)를 표로. | S |
| A-16 | P2 | `secret_scan.sh`가 `docs/KIRO_EVIDENCE.md`, `docs/RED_TEAM.md`, 자기 자신을 검사에서 제외한다(스크립트 case문 + KIRO_EVIDENCE에 이유 기록). 정직하게 적혀 있어 좋지만, 이 세 파일에 실제 비밀이 들어가면 놓친다. | 제외 대신 허용 패턴 방식으로 바꾼다: 예시 문자열에 마커 주석(`# scan-allow`)을 붙이거나 예시를 분해해(`AK` + `IA...`) 쓴다. 또는 제외 파일에는 별도로 더 좁은 패턴(실제 형식의 키 길이)만 적용. | S |
| A-17 | P2 | MCP 설정, 스킬이 0개(REPORT.md 4절 약점 4). 단, REPORT.md도 "쓰지 않는 기능을 점수용으로 넣지 말라"고 했다. 이 프로젝트에서 실제로 쓴 도구는 chrome-devtools(브라우저 확인, KIRO_EVIDENCE에 기록)다. | 실제로 쓴 것만 넣는다. `.kiro/settings/mcp.json`에 chrome-devtools 설정을 두고 사용 기록(어떤 버그를 잡았는지, 이미 R45/R46 기록이 있음)에 링크한다. 스킬은 `release-check`를 manual steering으로 대신하고 SKILL.md는 보류한다. | S |

## 3. 훅 후보 (이 프로젝트에 맞춘 것만)

| 후보 | 트리거 | 동작 | 이유 |
|---|---|---|---|
| spec-trace-check | PostFileSave, matcher `\.kiro/specs/.*/(requirements|tasks)\.md$` | command: requirements의 `test_*` 이름이 tests/에 있는지, tasks의 R번호가 requirements에 있는지 검사. 불일치 시 exit 2 | A-13. 결정적이고 이번 평가의 불일치(R7/R8/R11)를 일부 잡는다 |
| public-action-guard | PreToolUse, matcher shell 도구 | command: 입력 JSON에서 `git push`, `gh repo edit --visibility public`, `aws s3 sync --delete`, `deploy.sh`를 감지하면 `permissionDecision: ask`를 출력 | "공개 전환·배포는 사용자 확인" 정책을 코드로 강제(REPORT 4번) |
| contrast-on-style-save | PostFileSave, matcher `app/style\.css$` 또는 `engine/svg\.js$` | command: `node --test tests/contrast.test.js` | R39가 이미 CSS를 읽는 테스트라 값싸다. test-on-save가 app/*.css를 안 보는 빈틈을 메운다(test-on-save는 `engine|tests`의 `.js`만) |
| bundle-size-stop | Stop | command: `dist/`가 있으면 총 바이트 출력 | 정적 앱의 "가볍다" 주장을 숫자로. 기준값이 없으면 알림만 |
| audit-on-stop | Stop | command: `bash docs/audit_submission.sh` 요약 출력 | 이미 17/17 PASS 스크립트가 있으므로 재사용. 새 주장 없음 |

- 하지 말 것: UserPromptSubmit 로거(REPORT 8번)는 프롬프트에 비밀이 섞일 위험과 공개 레포 노출 문제로 지금은 비추천.
- 접근성 검사 훅은 DOM이 필요해서 Node 단독으로 어렵다. 위 A-09의 문자열 검사 테스트로 대체한다.

## 4. reference_scan/REPORT.md 아이디어 10개 중 미반영 항목과 우선순위

현재 `.kiro`를 직접 확인한 결과:

| REPORT 순위 | 아이디어 | 현재 | 권고 순서 |
|---|---|---|---|
| 1 | steering fileMatch | 없음 | 2번째 (A-05, S) |
| 2 | manual steering 슬래시형 | 없음 | 3번째 (A-05, S) |
| 3 | 스펙 린트 훅 | 없음 | 4번째 (A-13의 결정적 스크립트 버전 우선, S) |
| 4 | PreToolUse 승인 게이트 | 없음 | 5번째 (A-02의 일부와 함께, M) |
| 5 | PostTaskExec 테스트 | 없음 | 보류. 저장 시 테스트와 중복 |
| 6 | 에이전트 tools 제한 | 없음 | 1번째 (A-03, 서사와 직결, M) |
| 7 | 훅이 잡은 사례 문서 | 부분: 비밀 스캔 사례만 있음 | 1번째 (A-01/A-04, S) |
| 8 | UserPromptSubmit/Stop 로그 | 없음 | 보류(위험) |
| 9 | 스킬 1개 | 없음 | 보류 |
| 10 | MCP 설정 | 없음 | A-17(실사용분만, S) |

## 5. 심사 기준에서 약한 곳 (RULES_CHECK.md 4절의 Technological Implementation)

심사 질문은 "다양한 Kiro 도구를 임팩트 있게 썼나, 기능의 깊은 이해와 실험이 보이나"다.

1. 작동 증거가 약하다(A-01, A-04). 파일이 있다는 것과 쓰였다는 것은 다르다.
2. "코드가 판정한다" 서사에 비해 에이전트 권한이 강제되지 않는다(A-03). 서사를 읽은 심사자가 `.kiro/agents/red-team.json`을 열었을 때 `tools` 제한이 없으면 주장이 약해진다.
3. 스티어링이 전부 항상 켜짐이라 "깊은 이해"로 보이기 어렵다(A-05).
4. 훅이 한 종류(저장 시)에 몰려 있다(A-12). REPORT.md 통계로 346개 중 64%가 훅이 있고 대부분이 같은 종류다.
5. 강점은 유지: 독립 검토(Crew) 서사, 정직한 한계 기록(KIRO_EVIDENCE 곳곳), 테스트 131개, 비밀 스캔을 심은 입력으로 시험한 기록, EARS와 테스트 이름 연결(82/83 글자 일치 확인).

## 6. 고도화 작업 목록 (순서)

제출 마감(KST 12/5 07:00)까지 시간은 있지만 코드 동결 후엔 스펙·증거 문서가 안전한 작업이다. 모두 엔진·앱 코드를 건드리지 않는다. 변경 후 `node --test`(131)와 `docs/audit_submission.sh`(17/17)를 다시 돌린다.

1. [S] A-01: 새 CLI 세션에서 훅 발동을 직접 확인하고 결과(성공이든 실패든)를 KIRO_EVIDENCE에 날짜와 함께 기록한다. 이 결과가 뒤 작업 중 훅 항목의 문구를 결정한다.
2. [S] A-04: KIRO_EVIDENCE의 11/6~11/8 빈 구간을 커밋 로그 기준으로 채운다.
3. [S] A-07, A-08: 스펙/스티어링 수치와 죽은 문구를 정리하고 changelog에 적는다(spec-change-reminder 훅이 이 편집으로 발동하면 A-01의 증거도 된다).
4. [S] A-10: design.md에 Correctness Properties 절을 추가하고 pbt.test.js에 R번호 주석을 단다.
5. [S] A-05, A-06: 스티어링을 fileMatch(engine, app, tests, docs)와 manual(`release-check`)로 분리한다. `#[[file:...]]` 참조로 spec이나 감사 스크립트를 끌어온다.
6. [M] A-03: 에이전트 JSON에 `tools`/경로 제한과 `resources`를 넣고, red-team에 다른 모델을 지정한다. `kiro-cli agent validate`로 검증하고, 검증 통과와 실제 강제를 구분해 쓴다.
7. [S] A-13: `spec_trace_check.sh`를 작성하고 PostFileSave command 훅(CLI 형식, IDE 쌍 포함)으로 연결한다. 기존 spec-change-reminder는 유지.
8. [M] A-02: 비밀 스캔의 CLI 쌍과 PreToolUse 공개 게이트를 추가한다. 훅 오작동으로 작업이 막히지 않게 "ask"만 쓰고 차단(exit 2)은 비밀 스캔에만 쓴다.
9. [S~M] A-09, A-11: 정적 검사 테스트 3개와 R52/R53(배포, 앱 복원)을 추가한다. 새 R에는 이미 사실인 것만 적고, P16 미검증은 그대로 노출한다.
10. [S] A-14~A-17: 잔여 정리(tail 길이, 훅 README, 스캔 제외 방식, MCP 설정).

예상 합계: 약 1.5~2일. 1~5번만 하면 반나절이고 심사 영향의 대부분(P0 중 A-01, A-04)을 덮는다.

## 7. 주의

- A-02의 `preCommit` 유효성, A-03의 Kiro 에이전트 스키마 필드명과 경로 제한 방식은 내 기억 기반이라 구현 전에 Kiro 공식 문서로 확인해야 한다.
- 이 보고서의 수치(131 tests, 82/83 테스트 이름 일치)는 이번 세션에서 직접 실행/대조했다. 훅 발동 여부, 공개 레포 상태, app/ 동작은 확인하지 않았다.
