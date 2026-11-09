# 평가 B: 커스텀 에이전트 설정과 Kiro Crew 활용 (R3)

평가일 2026-11-09, 읽기 전용. 코드·.kiro·문서는 수정하지 않았고 이 파일만 썼다.
읽은 것: `.kiro/agents/*.json` 5개, `.kiro/hooks/*`, `.kiro/steering/*` 첫머리, `docs/KIRO_EVIDENCE.md`, `KIRO_AND_CREW_STORY.md`, `KIRO_WRITEUP.md` 일부, `../RULES_CHECK.md`, `../reference_scan/REPORT.md`, `.kiro/specs/.../tasks.md` 일부.
못 읽은 것(미확인): `CREW_FINDINGS*.md` 본문, `requirements.md`/`design.md` 전문, 스킬 2개(brief가 지정한 SKILL.md는 열지 않음), kiro-cli가 `scope` 필드를 실제로 어떻게 처리하는지(실행 확인 안 함).
실행한 명령: `kiro-cli agent validate --path <5개 파일>` → 전부 exit 0(출력 없음). 이는 스키마 통과일 뿐 권한 강제 여부와는 별개다.

## 0. 한 줄 결론
에이전트 5개는 **프롬프트 문장 수준의 스코프 선언**이지 **도구 수준의 권한 경계가 아니다**. `tools`/`allowedTools`/`resources`/`toolsSettings`/`hooks`가 5개 모두 없고, 스코프는 비표준 `scope` 배열에만 있다. 서사("red-team은 engine을 수정할 수 없다")가 설정으로 강제되지 않는다. 또 Best Kiro Crew App은 RULES_CHECK 9절 기록대로 현재 구성으로는 충족되지 않는다(사용자가 2026-11-03에 포기 결정).

## 1. 에이전트 JSON 품질 (확인한 사실)

| 항목 | kiroween | svg-engine | invite-logic | art-tuner | red-team |
|---|---|---|---|---|---|
| 파일 | kiroween.json:1-12 | svg-engine.json | invite-logic.json | art-tuner.json | red-team.json |
| name/description/model/prompt | 있음 (model=auto) | 있음 | 있음 | 있음 | 있음 |
| `scope` 배열 | app/**, docs/**, integration | svg.js, compose.js, fit.js | invite/share/scan/remix/presets/ics | assets/costumes/scenes | docs/RED_TEAM.md |
| tools / allowedTools | 없음 | 없음 | 없음 | 없음 | 없음 |
| toolsSettings(경로 제한) | 없음 | 없음 | 없음 | 없음 | 없음 |
| resources(steering·spec 연결) | 없음 | 없음 | 없음 | 없음 | 없음 |
| agent hooks | 없음 | 없음 | 없음 | 없음 | 없음 |
| MCP | 없음 | 없음 | 없음 | 없음 | 없음 |

- `scope`는 Kiro 에이전트 설정의 표준 필드가 아니다(내 지식 기준, 공식 스키마 재확인은 안 함 = 추정). validate는 통과했으므로 무시되거나 허용되는 것으로 보이며, 런타임에서 쓰기를 막는다는 증거는 없다. **즉 "never edits engine/ or app/"(red-team.json description)는 강제가 아니라 부탁이다.**
- tools를 생략하면 기본 도구 세트 전체(셸·쓰기 포함)가 열리는 것이 일반적인 동작이다(추정). red-team은 "쓰기는 docs/RED_TEAM.md뿐"이라면서 셸·임의 파일 쓰기가 가능한 상태일 가능성이 높다.
- resources가 없어 steering 3종과 스펙이 에이전트 컨텍스트에 명시 연결되지 않는다. (워크스페이스 steering은 자동 적용될 수 있으나 에이전트별 `file://` 연결은 없음 → 스펙 연결 주장은 약하다.)
- 이름 불일치: tasks.md:33 P7 "svg-engine (was ascii-engine)"으로 정리됨. 레포 안 `ascii-engine` 문자열 검색은 이번 grep에서 결과 없음(명령 일부 실패로 완전 검증은 못 함, tasks.md만 확인). svg-engine.json description에 개명 이력이 적혀 있어 불일치는 해소된 것으로 보인다. 다만 폴더명이 아직 `ascii-invite`다(레포명 kiroween-invitation과 불일치, 제출 시 혼선 소지).
- 프롬프트 품질은 좋은 편: 결정론·테스트 선행·"실제 렌더를 보기" 같은 구체 규칙 포함(art-tuner, svg-engine, invite-logic). 금지사항은 "Do not edit files outside your scope" 한 줄이 대부분.
- 프롬프트가 모델/도구 독립성 기준을 못 박지 않았다. 5개 모두 model=auto. night-audit 사례(REPORT 3.2)처럼 리뷰어를 다른 모델로 고정한 구성은 없다.

## 2. 스코프 소유 표

| 영역 | 소유 에이전트 | 겹침/구멍 |
|---|---|---|
| engine/svg.js, compose.js, fit.js | svg-engine | 없음 |
| engine/invite.js, share.js, scan.js, remix.js, presets.js, ics.js | invite-logic | 없음 |
| engine/assets.js, costumes.js, scenes.js | art-tuner | 없음 |
| **engine/index.js** | **주인 없음** | 구멍(P2). 공개 export 목록이라 새 모듈 추가 시 누가 고치는지 불명 |
| app/** | kiroween | 정상 |
| docs/** | kiroween | **겹침**: red-team의 docs/RED_TEAM.md가 kiroween의 docs/**에 포함. 또 docs/redteam_probe.mjs(실행 스크립트)는 어느 scope에도 명시 안 됨 |
| tests/** | **주인 없음** | 구멍(P1). invite-logic·svg-engine 프롬프트가 "테스트 먼저"를 요구하지만 scope에 tests/가 없어 서로 모순: 테스트를 쓰려면 scope 밖 수정이 필요 |
| .kiro/**(steering·specs·hooks) | **주인 없음** | 구멍(P1). 스펙 변경이 hook만으로 환기됨. spec 소유자 에이전트 없음 |
| deploy/(stage.mjs, deploy.sh 등) | kiroween의 "deploy" 문구 | scope 배열엔 없음(프롬프트에만). 배포 스크립트 경로를 확인하지 못함(미확인) |
| LICENSE, package.json, README | 주인 없음 | 경미(P2) |

핵심: 스코프 배열의 파일 단위 정의가 tests/를 빼먹어 "write the failing test first"와 충돌한다. 실제로는 conductor 단일 세션이 다 했다고 KIRO_WRITEUP.md:15가 스스로 밝히므로 실무상 문제는 없었지만, 설정 자체는 자가모순이다.

## 3. 사용 증거 (KIRO_EVIDENCE 대조)

- `KIRO_EVIDENCE.md:64-67` "Custom agents (step 6)" 절은 **두 줄**: "Five custom agents ... scope boundaries and what each produced are recorded as work proceeds." 이후 에이전트별 작업 기록 없음. grep 결과 `svg-engine`, `art-tuner`, `invite-logic`이 증거 문서에 이름으로 등장하지 않는다(red-team은 RED_TEAM 문서 인용으로만 등장). **"what each produced are recorded"라고 약속했지만 기록이 없다.**
- `KIRO_WRITEUP.md:15`가 정직하게 인정: "conductor did the building in one CLI session. We used the four scoped roles as boundaries and review lenses, not as four parallel sessions." 즉 4개 역할 에이전트는 별도 호출된 흔적이 없고, 사실상 선언+프롬프트 모양의 체크리스트다.
- git: `.kiro/agents` 변경 커밋은 `481ec4d`(개명·정렬) 1건만 확인(`git log -- .kiro/agents`). 에이전트가 실제로 호출된 로그(세션 기록 등)는 레포에 없다.
- red-team은 가장 증거가 있음: `docs/RED_TEAM.md`, `redteam_probe.mjs`, EVIDENCE의 "red team round 2 (B1-B20)" 항목. 단, 그 라운드를 `red-team` 에이전트로 돌렸는지 conductor가 돌렸는지는 문서상 불명(미확인).
- 가장 강한 증거는 에이전트가 아니라 **외부 Kiro Crew의 독립 리뷰**(CREW_FINDINGS, R2)와 그 후속 수정 테스트(crew_findings.test.js, crew_r2.test.js). 이건 사실이고 서사도 정직하다.

## 4. Best Kiro Crew App 요건과의 거리

RULES_CHECK 기록(§5, §9-2, §7)을 다시 읽은 결과:
- 확인됨: 상은 "별도의 Kiro Crew app 레포 제출(GitHub 계정이 전체 제출과 일치) + 기능 writeup"을 요구(RULES_CHECK §9-2, 2026-11-03에 kiro.dev 문서와 KiroCrew GitHub로 확인했다고 기록).
- 확인됨: Crew app = App Kit 패키지(`app.json` + agents/skills/MCP/cron/React UI), `kirocrew app init <name> --ui`, Node 22.12+, 별도 레포.
- 확인됨: `.kiro/agents` ≠ Crew app. 현재 구성은 요건 미충족.
- 확인됨: 사용자가 2026-11-03 "Crew 앱은 만들지 않음, 이 상은 노리지 않는다"로 결정.
- 미확인: Crew 앱 최소 기능 수준, 제작 공수(RULES_CHECK 스스로 미확인이라 적음). 필요 공수는 추정이다.

문제는 서사와 제출물의 간극이다. `KIRO_AND_CREW_STORY.md` 제목이 "Built with Kiro, reviewed by Kiro Crew"이고 상 이름과 비슷하다. 심사자가 "Crew를 썼다"고 읽고 Crew App 상 대상이라고 오해할 수도 있고, 반대로 오해를 일으킨다는 지적(제출 폼 Kiro Crew 칸을 체크했는지)이 생길 수 있다. DEVPOST_SUBMISSION.md에서 Crew 상 칸을 어떻게 처리했는지는 이번에 읽지 않았다(미확인).

충족하려면(추정):
1. 별도 공개 레포에 `kirocrew app init`으로 만든 앱(app.json, agents, 선택 UI) 하나. 예: 초대장 리뷰 전용 Crew 앱(리뷰어 에이전트 + red-team 프로브 cron + 결과 페이지). 공수 L(반나절~1일, 추정).
2. 제출 폼에 레포 URL + 기능 writeup. 계정 일치.
3. 이미 쓴 독립 리뷰 서사를 재활용 가능: Crew brief(`CREW_RESEARCH_BRIEF*.md`)를 Crew 앱의 에이전트 프롬프트로 옮기면 "실제로 쓴 것"이라는 정직함을 유지한 채 요건을 맞출 수 있다.
상금 $1,000, 상위 50개 안에서 Kiro팀 평가라 ROI는 낮다. 결정(포기)은 합리적이다. 단 남은 일정(12/5 07:00 KST)과 이미 쓴 Crew 서사를 생각하면 최소 앱 하나로 요건을 맞추는 선택지도 남아 있다는 점만 사용자에게 알린다.

## 5. 추가/불필요 에이전트, 5개 고정 방침

의견: **5개 고정은 맞다**(개수 자체로 점수를 못 얻고, 심사 기준은 "다양한 도구를 깊게"이므로 증거 없는 에이전트를 더 늘리면 손해). 더 만들기보다 기존 5개를 **실제로 강제되는 설정으로** 바꾸는 게 우선이다.
- 새로 만들 가치가 있는 것: 없음(하나를 꼽자면 접근성 점검용 읽기 전용 리뷰어지만 red-team 프롬프트에 접근성 항목을 덧붙이는 편이 낫다).
- 불필요에 가까운 것: invite-logic/svg-engine/art-tuner는 한 사람이 한 세션에서 전부 소유했으므로 실제 호출 증거가 생기기 전에는 "역할 렌즈"로만 설명해야 한다(이미 WRITEUP이 그렇게 정직하게 적음).
- a11y/문서 점검/배포 에이전트는 신규로 선언만 하면 증거가 없다. 이미 있는 `docs/audit_submission.sh`(17/17)를 스킬 또는 manual steering으로 만드는 쪽이 더 값싸다.

## 6. reference_scan에서 차용할 만한 것 (REPORT.md 5절 기준)

| 아이디어 | 우리에게 | 공수 |
|---|---|---|
| 에이전트 `tools` 제한 명시 (REPORT 순위 6, night-audit·doppelganger) | red-team을 read+shell만, 쓰기는 `toolsSettings.fsWrite.allowedPaths: ["docs/RED_TEAM.md"]` | S |
| 리뷰어 에이전트를 다른 모델로 지정·파일 변경 불가 (night-audit) | red-team의 model을 builder와 다르게 | S |
| fileMatch steering (REPORT 순위 1) | `engine/**`용 결정론, `app/**`용 접근성 규칙 분리 | S |
| manual steering 슬래시형 `/release-check` (순위 2) | audit_submission.sh 절차를 문서화 | S |
| PreToolUse 승인 게이트 (순위 4) | push/배포/공개 전환 전 확인(우리 정책을 코드로 강제) | M |
| 스펙 린트 agent 훅 (순위 3) | tasks의 요구 ID 존재, 속성 Validates 줄 확인 | S~M |
| UserPromptSubmit/Stop 증거 로그 (순위 8) | 비밀 필터 필수, 로그는 공개 레포 제외 | M |

REPORT의 자기평가(우리 약 45~50점, 상위 10위 85점+와 격차)에서 격차 요인 중 에이전트 관련은 "tools 제한과 독립 리뷰어가 명시되지 않음"으로 이 평가와 일치한다.

## 7. 점수표 (각 1~5, 근거는 위 절)

| 에이전트 | 스코프 명확성 | 권한 최소화 | 증거 | 재현성 | 비고 |
|---|---|---|---|---|---|
| kiroween (router) | 3 | 1 | 3 | 3 | scope에 deploy 경로 없음, tools 무제한 추정 |
| svg-engine | 4 | 1 | 2 | 3 | 프롬프트 규칙 좋음, 호출 증거 없음, tests/ 모순 |
| invite-logic | 4 | 1 | 2 | 3 | 동일, 규칙(never throw, no Node globals) 구체적 |
| art-tuner | 4 | 1 | 2 | 3 | "렌더를 직접 보기" 규칙은 좋음, 호출 기록 없음 |
| red-team | 4 | 1 | 4 | 3 | 산출물(RED_TEAM.md, probe.mjs)은 있음, 쓰기 금지는 미강제 |

재현성 3의 이유: 다른 사람이 레포를 받아 에이전트를 돌릴 때 필요한 steering/spec 연결(resources)이 없고 model=auto라 결과가 달라진다. 5개를 `kiro-cli agent validate`로 통과시켰다는 점은 좋다.

## 8. 지적 표

| ID | 우선순위 | 근거 | 수정안 | 공수 |
|---|---|---|---|---|
| B-01 | P0 | 5개 에이전트 모두 tools/allowedTools/toolsSettings 없음(agents/*.json 전체). "red-team never edits engine/app"가 서사의 핵심인데 설정으로 강제되지 않음 | red-team에 `tools:["read","shell"]`(또는 쓰기 허용 시 `toolsSettings.fsWrite.allowedPaths`로 `docs/RED_TEAM.md`만), svg-engine/invite-logic/art-tuner는 각자 engine 파일 경로만 쓰기 허용. `kiro-cli agent validate` 재실행 | S |
| B-02 | P0 | `scope`는 비표준 필드로 보이며 강제 증거 없음(validate 통과만 확인). 서사의 "scope boundary"가 문서상 선언 | 위 B-01과 동시에 scope를 toolsSettings 경로로 이전하고, `scope`는 설명용으로만 남기거나 삭제. 최종 문구를 "enforced by toolsSettings" 또는 정직하게 "advisory"로 | S |
| B-03 | P0 | KIRO_EVIDENCE.md:64-67이 "what each produced are recorded"라고 약속했으나 에이전트별 기록 없음. WRITEUP:15는 정직하나 EVIDENCE와 모순 | EVIDENCE 해당 절을 현실대로 수정: "conductor 단일 세션이 수행, 4개는 역할 렌즈, 실제 호출 증거는 red-team(RED_TEAM.md)뿐" 또는 실제로 각 에이전트를 1회씩 호출해 산출물 경로와 날짜를 기록 | S |
| B-04 | P1 | tests/ 소유자 없음, 그러나 svg-engine·invite-logic 프롬프트는 "Write the failing test first" 요구 → scope와 모순 | scope/허용 경로에 해당 `tests/*.test.js` 추가 또는 tests 전담 규칙을 kiroween에 부여 | S |
| B-05 | P1 | `.kiro/**`(steering/specs/hooks) 소유자 없음. 스펙 변경은 hook이 환기만 함 | kiroween 소유로 명시하거나 `spec-keeper` 대신 hook+manual steering으로 처리 | S |
| B-06 | P1 | resources 전무: steering 3종·spec이 에이전트 컨텍스트에 연결 안 됨 (재현성 약함) | 각 에이전트에 `resources: ["file://.kiro/steering/**/*.md","file://.kiro/specs/kiroween-invitation/requirements.md"]` | S |
| B-07 | P1 | 모든 에이전트 model=auto. 독립 리뷰어(red-team)가 builder와 같은 모델이면 독립성 약함(REPORT 3.2) | red-team만 다른 모델로 고정하고 문서에 이유 한 줄. 모델 가용성이 한국에서 미확인이면 실행 확인 후 기록 | S |
| B-08 | P1 | 서사 간극: 스토리 제목이 "reviewed by Kiro Crew"인데 Crew App 상은 별도 레포 요건 미충족(RULES_CHECK §9-2) | 제출 폼에서 Crew App 상을 선택하지 않았음을 확인하고, 스토리/WRITEUP에 "Crew는 외부 독립 리뷰어로 사용, Crew App Kit 앱은 제출하지 않음" 한 줄 명시 | S |
| B-09 | P2 | 에이전트별 hook 없음; 프로젝트 hook 3종은 모두 저장/커밋 시점. 제어형 훅(PreToolUse, Stop) 없음 (REPORT 약점 3) | PreToolUse 승인 게이트 1개(push/배포/공개 전환) 추가 후 실제 차단을 한 번 시연해 EVIDENCE에 기록 | M |
| B-10 | P2 | hook이 `.json`(CLI)과 `.kiro.hook`(IDE) 이중이라 문구가 중복 관리됨(spec-change-reminder 두 파일 동일 prompt) | 한 곳을 기준으로 하고 다른 쪽 동기화 확인 스크립트 또는 주석 | S |
| B-11 | P2 | engine/index.js, package.json, LICENSE 소유자 없음 | kiroween scope에 "root files, engine/index.js" 추가 | S |
| B-12 | P2 | 폴더명 `ascii-invite`가 제품명(Kiroween Invitation)과 불일치, 에이전트 문서도 ASCII 이력 언급 | 제출 레포(kiroween-invitation)와 이름 정리 또는 README에 이력 설명(이미 있다면 확인) | S |
| B-13 | P2 | 재현성: 에이전트 호출 방법이 문서화 안 됨(`kiro-cli chat --agent kiroween` 같은 예시 없음, 미확인) | KIRO_WRITEUP 또는 README에 호출 예와 각 에이전트 1회 산출물 링크 | S |

## 9. 우선 실행 순서(제안)
1. B-01+B-02(red-team부터 tools/경로 제한, 나머지 3개도 동일) → `kiro-cli agent validate` → red-team을 1회 실제 호출해 RED_TEAM.md 갱신(이 호출과 날짜를 EVIDENCE에 기록 = B-03의 증거도 확보).
2. B-03/B-08은 문서 수정만이라 즉시.
3. B-06/B-07/B-04는 같은 편집 세션에 묶기.
수정 후 반드시: `node --test`, `docs/audit_submission.sh`, 공개 레포 동기화 전 비밀 스캔(REPORT 5절 원칙).

## 10. 요약 (추정과 확인 구분)
- 확인: 5개 JSON에 tools/resources/toolsSettings/hooks/MCP 없음, scope는 비표준, validate exit 0, EVIDENCE에 에이전트별 기록 없음, WRITEUP이 conductor 단일 세션이었다고 인정, Crew App 상은 별도 레포 필요하며 사용자가 포기 결정.
- 추정: scope 필드가 런타임 강제력이 없다는 점, tools 생략 시 기본 도구 전체가 열린다는 점, Crew App 제작 공수.
- 미확인: CREW_FINDINGS 본문, DEVPOST 폼의 Crew 항목 처리, 에이전트 실제 호출 로그, 모델 가용성.
