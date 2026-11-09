# 평가 C: 심사위원, 사용자 관점 제품 및 제출물 평가 (R3)

평가일 2026-11-09. 읽기 전용. 코드·문서 수정 없음.
확인한 것: `node --test` 직접 실행(131 pass / 0 fail), 라이브 curl, app/main.js·index.html·style.css, README, DEVPOST_SUBMISSION, PRE_SUBMIT, BLOG_DRAFT, KIRO_WRITEUP, SHOTLIST, RULES_CHECK, WBS, REPORT.md.
미확인(브라우저 조작 안 함): 실제 화면 렌더, 모바일/Safari/Firefox 동작, 영상 길이와 내용, Devpost 업로드 후 실제 표시, 갤러리 상태, GitHub 공개 레포 내용 동기화 여부(레포 URL은 HTTP 200만 확인).

## 0. 라이브 응답 확인 (curl)

| 대상 | 결과 |
|---|---|
| `/` | 200 text/html, title `Kiroween Invitation: haunted Halloween invitations` |
| og:title / description / image(1200x630, alt) / twitter:card=summary_large_image | 모두 있음. `/og.png` 200 image/png |
| `/main.js`, `/engine/index.js` | 200 text/javascript (루트가 app/ 내용을 서빙하는 구조, 정상) |
| `/robots.txt` | 200 text/html (없는 경로도 index로 폴백. 해롭진 않지만 404가 아님) |
| GitHub 레포 | 200 |
| YouTube youtu.be 링크 | oEmbed 응답 있음. 제목 "Kiroween Invitation - Kiroween 2026 demo (Costume Contest)" (공개 상태로 보임) |

## 1. EVIDENCE_MAP (심사 4기준 x 20%)

| 기준 | 제출 페이지에서 보이는 증거 | 강도 | 구멍 |
|---|---|---|---|
| Technological Implementation | 51개 요구사항 스펙, steering 3, 훅 3종(저장 시 테스트, 스펙 변경 알림, 커밋 전 비밀 스캔), 에이전트 5, PBT, Crew 독립 리뷰가 브라우저 전용 버그 2건 발견, 피벗을 스펙이 흡수 (KIRO_WRITEUP, EVIDENCE) | 강 (서사 좋음) | REPORT.md 자체 평가로 스펙 1개, steering 항상 켜짐 3종뿐, 훅이 전부 PostFileSave류, MCP 0, 스킬 0. "다양한 Kiro 도구" 항목에서 상위권과 격차. Devpost 본문의 "Built with" 태그에 `kiro-crew`가 있으나 Crew App Kit은 안 씀(리뷰어로만) |
| Design | 어두운 네온 SVG, 프리셋 6개 썸네일 갤러리, 코스튬 4, 장면 4, 3 export 크기, noscript, aria, 키보드 radiogroup | 중~강 | 컨트롤 패널이 길고 평범(select 다수, 영문 소문자 옵션값 "screaming/uneasy/hollow", 에셋 11행 체크박스+select). 컨트롤 UI 자체는 "무서운 UI"가 아니라 일반 폼. 스푸키함이 미리보기에만 있고 크롬(UI)에는 약할 가능성(미확인, style.css는 모노스페이스 다크 정도) |
| Innovation/Idea | "model says, code decides", 결정론 SVG, URL에 전체 상태 | 중~약 | 아이디어(핼러윈 초대장 생성기)는 흔한 편. 차별점이 "결정론/무서버"인데 사용자에게는 가치로 안 보임. 심사자에게 가장 약한 기준 |
| Presentation | 영상(공개 유튜브), 스토리 서사(Mina, 새벽 1시), 정직한 한계 목록, 이미지 7장 캡션 | 중 | 영상 길이/품질 미확인. 영상 대본은 2:55이고 블로그는 "2-minute demo"라 부르며, 대본 자체는 `127 tests`로 되어 있음(실제 131). 영상이 대본대로 찍혔다면 화면의 숫자가 틀림 |

약한 기준 2개: Innovation(아이디어 자체가 흔함), Technological Implementation의 "도구 다양성"(스펙 1개·MCP·스킬·PreToolUse 훅 없음).

## 2. 제출 문서 대 실제 대조

| ID | 문서 주장 | 실제 | 판정 | 고칠 쪽 |
|---|---|---|---|---|
| X1 | DEVPOST: 131 tests, ~1,950 PBT cases | 131 확인. PBT numRuns 합 1,950은 grep에서 6개 속성만 잡힘. 파일에 fc.assert류가 12개 있어 나머지는 기본 100회일 수 있음 → 실제 총합 불명 | 모호 | 숫자 근거 확인 후 문서 |
| X2 | KIRO_WRITEUP:36, BLOG_DRAFT:46: "10 properties, about 3,050 cases" | DEVPOST/SOCIAL은 1,950, WRITEUP/BLOG는 3,050. 같은 사실에 숫자 2개 | **불일치** | 실제 합을 한 번 세어 전 문서 통일 (둘 중 하나는 틀림) |
| X3 | SHOTLIST: "`node --test` (127 tests)", "117 green tests" | 실제 131. 117은 당시 맥락(Crew 발견 시점)이라 맞음 | 영상이 127을 말했다면 틀림 | 영상 교체까지는 불필요, 설명란/고정 댓글에 "131 at final" 한 줄 |
| X4 | PRE_SUBMIT: 127 tests, 17/17 | 날짜(11-05) 기준 과거 기록 | 과거 문서 | 그대로 두어도 됨 (당시 상태 기록) |
| X5 | BLOG_DRAFT: "2-minute demo" | 대본은 ≤3:00(~2:55). 실제 영상 길이 미확인 | 미확인 | 길이 확인 후 한 단어 수정 |
| X6 | README: "11 Halloween assets, 6 colors, 4 costumes, 4 scenes, 3 sizes" | index.html에 costume 4+none, scene 4, format 3. 에셋 목록은 JS 생성이라 개수 미확인(테스트 assets.test.js 존재) | 대체로 일치 | - |
| X7 | DEVPOST "Keyboard-navigable, with text alternatives" | 코드상 radiogroup 화살표, aria-label 확인. 전체 키보드 흐름 미확인 | 부분 | - |
| X8 | 앱 내 localStorage 키 `ascii-invite:config` | 이름이 옛 프로젝트명. 기능에는 무해, 사용자에게 안 보임 | 사소 | 바꾸면 기존 저장 설정 유실, 그대로 둠 |
| X9 | DEVPOST 체크리스트: `Video is under 3 minutes` | 영상 길이 미확인 | 미확인 | 영상 길이 직접 확인 |

판단: 문서 숫자 불일치(X2)는 문서 쪽을 고친다. 코드 쪽에 맞추려고 PBT를 추가하지 않는다.

## 3. 사용자 관점

확인한 것(코드):
- 첫 화면: 기본 config(join, 2026, 닉네임 빈 값)로 이미 완성된 초대장이 그려짐. 빈 화면 문제 없음. 상단에 한 줄 설명 + Remix/Save/Copy 버튼이 첫 스크롤 안에 있음. 좋음.
- 한국어: 닉네임·날짜 `10월 31일`, `오후 7시` 파싱 지원. 그러나 **UI 문구는 전부 영어**(옵션값 영어 소문자). 한국어 사용자가 자기 이름은 쓰지만 UI는 영어. 영어 제출 규칙상 문제는 아님.
- 모바일: `@media (max-width: 760px)`로 1열 전환만 있음. 모바일에서는 컨트롤이 위, 미리보기가 아래 → **모바일에서 수정해도 결과가 화면 밖**(미확인, 레이아웃 추정). 스크롤 없이 변화를 못 볼 가능성이 큼.
- 접근성: aria-live 힌트, noscript, role=radio. `prefers-reduced-motion` 규칙 없음(애니메이션이 거의 없어 영향 작음, 미확인).
- **공유 후 받는 사람 경험(핵심 구멍)**: 링크를 열면 받는 사람은 같은 편집기 전체(11 에셋 체크박스, 글로우 등 컨트롤)를 보게 됨. "초대장을 받았다" 장면이 아니라 "제작 도구를 열었다" 장면. 수신자 전용 뷰와 "나도 만들기" CTA가 없다. Social Blitz/공유 루프 측면에서 최대 손실.
- 링크 미리보기: 모든 공유 링크가 같은 og.png (정적 호스팅의 한계). 받는 사람 채팅창에 개인화된 카드가 안 뜸. `document.title`도 고정.
- 저장 후 안내: PNG 저장 성공은 `Saved PNG.` 한 줄뿐. Safari PNG 저장은 미검증으로 문서에 이미 공개됨(정직함은 +).
- `Save config` 버튼은 사용자에게 의미가 불분명(localStorage에 저장). 첫 10초 혼란 요소. 자동 저장이 아니라 수동이라 새로고침하면 사라진다는 걸 알기 어려움.

## 4. 지적 표

| ID | 우선순위 | 근거 | 수정안 | 공수 | 제출 후 가능? |
|---|---|---|---|---|---|
| C1 | P0 | 공유 링크 수신자가 전체 편집기를 봄 (app/main.js initialConfig는 `?i=`를 읽어 같은 UI에 채움, 수신자 모드 없음) | `?i=`가 있고 편집 전이면 "초대장 카드 + [나도 만들기] + [캘린더에 추가]"만 보이는 뷰, 편집은 버튼으로 진입. 엔진 변경 없음 | M | 예 (앱 배포는 마감 후에도 갱신 가능하나 심사 기간 변경 규칙은 Rules로 확인 필요, 아래 4.1) |
| C2 | P0 | 문서 숫자 불일치 X2(1,950 vs 3,050) | PBT 실제 케이스 합 계산 → DEVPOST/WRITEUP/BLOG/SOCIAL 한 값으로 통일 | S | 예 (Devpost 텍스트 편집 가능) |
| C3 | P1 | 모바일에서 미리보기가 컨트롤 아래 (style.css:29, 93) | 760px 이하에서 preview를 상단 고정(sticky) 또는 상단에 배치, 컨트롤을 아래로. 최소: 변화 시 미리보기로 스크롤하는 "미리보기" 앵커 버튼 | S~M | 예 |
| C4 | P1 | Innovation 약함. 제출 페이지에서 "왜 이게 다른가"가 기술(결정론)로만 설명됨 | Devpost 첫 문단에 사용자 가치 한 문장(예: "같은 링크는 누구에게나 똑같이 보이고, 서버/계정/AI 없이 영구히 열린다") + 5초 GIF. 코드 변경 없음 | S | 예 |
| C5 | P1 | 영상 대본의 `127 tests`, 블로그 "2-minute" | 영상 설명란에 최종 수치 한 줄, 블로그 문구 정정 | S | 예 |
| C6 | P1 | Tech 항목 "도구 다양성" 격차(REPORT.md 4절) | REPORT 권고 중 값이 싼 것만: fileMatch steering 1개(engine/** 결정론, app/** 접근성), manual steering `/release-check` 1개, 스펙 린트 에이전트 훅. **실제로 실행하고 KIRO_EVIDENCE에 날짜 기록**한 것만 주장 | S~M | 예 (레포 push 시 .kiro 갱신. 단 12/2 동결 전에) |
| C7 | P2 | `Save config` 의미 불명 | 라벨을 "Remember on this device"로, 또는 자동 저장으로 바꾸고 버튼 제거 | S | 예 |
| C8 | P2 | 모든 공유 링크의 og 동일, document.title 고정 | 수신자 뷰에서 `document.title = "<닉네임>의 초대장"` 만이라도 (탭 제목 개인화). 개인화 OG는 CloudFront Function/Lambda@Edge 필요 → 비용·위험 대비 비추천 | S | 예 |
| C9 | P2 | 옵션값 영문 소문자 | 라벨만 한글 병기 토글(전체 i18n은 비추천) | M | 예 |
| C10 | P2 | `prefers-reduced-motion` 규칙 없음 | 도입하는 연출(아래 후보)에 처음부터 넣고, 기존엔 해당 없음을 문서화 | S | 예 |
| C11 | P2 | Safari/Firefox/모바일 미검증이 문서에 이미 있음 | 사용자가 폰·Safari로 3동작(Remix, PNG 저장, 링크 복원) 확인. 실패 시 즉시 수정 우선순위 P0로 승격 | S | 예 |

### 4.1 제출 후 바꿀 수 있는 것 / 없는 것 (Rules 원문 근거는 RULES_CHECK.md 7절에 변경 조건 없음, 확인 필요)
- 쉽게 가능(추정): Devpost 텍스트·링크·이미지, YouTube 설명란, README/블로그, 라이브 앱 배포.
- 주의: 심사 기간(12/16~1/29) 중 앱이 바뀌면 "제출 시점 버전"과 달라질 수 있음. Rules의 수정 허용 여부 문구는 이 평가에서 미확인 → 마감 전(12/3 목표)에 끝내고 이후는 버그 수정만 권장.
- 영상 교체는 비용 대비 효과가 낮음. 숫자 오류는 설명란/고정 댓글로 해결. 단, 영상이 3분 초과이거나 라이브 화면이 현 UI와 크게 다르면 교체 후보(영상 확인 필요).

## 5. 기능 추가 Top 5 (효과 / 공수 / 동결 현실성)

12/2 동결까지 약 23일. 가용 시간은 WBS 가정(총 25~30시간) 중 남은 분량이 불명이므로 아래는 상대 비교.

| 순위 | 기능 | 효과 근거 | 공수 | 현실성 |
|---|---|---|---|---|
| 1 | **수신자 뷰 + "나도 만들기" CTA** (C1) | 공유 루프의 유일한 구멍. Social Blitz 스크린샷·영상에서 "받는 사람 장면"이 생김(Presentation, Design 동시 개선). 엔진은 그대로, app 쪽 분기만 | M | 높음 |
| 2 | **Web Share API + QR 코드** (모바일 공유 시트 호출, 오프라인 모임에서 QR) | 초대장의 실제 사용 장면(오프라인 파티)과 일치. QR은 엔진에 의존성 없이 소형 구현 가능하나 직접 구현하면 L, 라이브러리면 의존성 증가 → **Web Share API만 S** | S (Share) / M~L (QR) | Share 높음, QR은 선택 |
| 3 | **등장 연출** (수신자 뷰에서 유령이 페이드인+글로우 펄스, `prefers-reduced-motion` 준수) | Costume Contest "haunting UI" 심사 직접 가점. 결정론 렌더 경로 밖(CSS 애니메이션)에 두면 "same settings, same SVG" 보장 유지 | S~M | 높음 |
| 4 | **커스텀 링크 접속 시 카운트다운/상태 문구** ("D-6", "오늘 밤") | 재방문 요인. 날짜 파싱(ics.js)이 이미 있어 재사용 가능. 수신자 뷰 안에서만 표시 | S~M | 중 |
| 5 | **초대장 방명록 없는 "RSVP 링크"(mailto/공유 시트로 응답 템플릿 생성)** | 서버 없이 재방문 유도. 효과는 불확실하고 개인정보(스캔 규칙과 충돌 가능) | M | 낮음~중 (비추천에 가까움) |

### 새로 만들지 말 것
- 사용자 계정/서버 저장/갤러리 공유 게시판: "no server, no account" 정체성 훼손, 보안·비용 리스크, 동결 내 불가.
- AI 생성 문구/이미지: "model says, code decides" 주장과 모순.
- 에셋·코스튬 추가: 이미 11종·4종, 한계효용 낮음. 대신 연출·공유 경험이 점수에 더 직접적.
- 점수 노리기용 Kiro 기능 억지 추가(MCP·스킬을 쓰지도 않고 설정만): REPORT.md의 "하지 말 것"과 동일.
- 개인화 OG 이미지(Lambda@Edge 등): 인프라 비용·복잡도 대비 효과 작음.

## 6. 11/20 이후 갤러리 재확인 계획

11/20 (또는 12/1 포함 2회) `kiroween.devpost.com/project-gallery` 확인(사용자 Chrome 필요, curl은 Cloudflare 403).
1. Costume Contest 항목 수, 비슷한 "초대장/카드 생성기" 개수, 상위 반응작의 공통점을 메모(10분).
2. 겹침이 크면: 카테고리 변경은 이미 CEO 결정으로 잠겨 있으므로 변경 가능 여부부터 Devpost 폼에서 확인 → 변경이 어려우면 **카테고리를 바꾸지 말고** 서사로 대응(Resurrection 겸용 프레이밍은 본문 한 문단 정도).
3. 12/1에 마지막 점검: 모든 링크(Live/Code/Video/Blog/Social) 시크릿 창과 폰에서 열림, 본문 숫자 일치, `[BLOG_URL]`·`[SOCIAL_URL]` 같은 플레이스홀더 잔존 여부(DEVPOST 문서에는 아직 플레이스홀더가 남아 있는 줄이 있음. 업로드 후 실제 폼에서 채워졌는지 미확인).
4. Social Blitz 게시물 URL이 폼에 들어갔는지 확인. SOCIAL_BLITZ_NOTES상 아직 "직접 써야 함" 상태로 보이며 게시 여부는 미확인.

## 7. 총평

기술·증거는 강하고 정직함(한계 공개)이 큰 자산. 가장 큰 제품 구멍은 "받는 사람 경험"이고, 이는 이 앱의 존재 이유(초대장)와 직결되며 공수 M으로 해결 가능. 두 번째는 숫자 불일치 같은 사소한 신뢰 손상(S). Innovation 약점은 코드보다 서술 프레이밍(C4)으로 먼저 대응.
