# Kiro Crew 2차 리뷰 결과 (R2)

> `docs/CREW_RESEARCH_BRIEF_R2.md` 수행 결과. 코드·문서는 수정하지 않았고 이 파일만 만들었다.
> **[확인]** = 파일을 읽거나 명령을 실행하거나 실제 Chrome에서 본 것. **[추정]** = 코드와 계산으로 추론. **[미확인]** = 못 봤다.
> 브라우저 확인은 로컬 서버(`http://127.0.0.1:8139/app/index.html`)에서 Chrome 한 개로만 했다. Safari, Firefox, 모바일은 못 봤다.
> 계정 ID, 키, 토큰은 적지 않았다.

---

## 1. 판정: GO with fixes (코드 동결 12/02 기준)

엔진은 여전히 단단하다. `node --test` 117개가 모두 통과했고 [확인] 공유 링크 위조 입력도 안전하게 기본값으로 돌아간다 [확인].
하지만 **Node에서만 돌려 본 테스트가 놓친 브라우저 버그가 2개** 있다 (S1, S2). 둘 다 실제 Chrome에서 재현했다.
라이브 사이트는 아직 1차 버전이라, 지금 심사자가 보는 것은 2차 기능이 없는 화면이다 (S3).
S1~S4를 고치고 다시 배포하면 GO다.

### 고칠 항목 (심각도 순)

| # | 심각도 | 항목 | 확인 |
|---|---|---|---|
| S1 | **차단** | 브라우저에서 `.ics` 기능이 아예 동작하지 않음 (`Buffer is not defined`) | [확인] 실제 Chrome 콘솔 |
| S2 | **높음** | 인라인 SVG 8개가 같은 `id`를 공유해서 팔레트가 미리보기에 제대로 안 먹고, 미리보기와 PNG 결과가 달라짐 | [확인] 실제 Chrome 스크린샷 |
| S3 | **높음** | 라이브 사이트와 `dist/`가 2차 이전 버전 | [확인] curl, diff |
| S4 | 중간 | README의 실행 명령이 404로 빈 화면을 만듦 | [확인] curl |
| S5 | 중간 | 닉네임·장소 PII 스캔이 전각 숫자 전화번호를 통과시킴 | [확인] 실행 |
| S6 | 중간 | `.ics` 입력이 한국어 날짜·시간에 약하고, 버튼이 왜 꺼져 있는지 안 보임 | [확인] 실행 |
| S7 | 중간 | 긴 한글 문구가 캔버스 밖으로 넘칠 수 있음 | [추정] 계산, 렌더 안 봄 |
| S8 | 낮음 | 문서의 숫자와 주장이 낡음 (`KIRO_WRITEUP.md` 등) | [확인] |

---

## 2. 1차 지적 반영 여부

| 1차 지적 | 상태 | 근거 |
|---|---|---|
| hat/horns가 안 그려짐 | **고쳐짐** [확인 코드, 렌더 화면은 안 봄] | `engine/svg.js`에 `hat()`, `horns()` 추가, `data-part` 속성, `tests/crew_findings.test.js` |
| 닉네임 길이 40 vs 24 | **고쳐짐** [확인] | `app/index.html` `maxlength="24"` + 안내 문구, 실제 Chrome에서 라벨 확인 |
| purpose 키보드 이동 | **고쳐짐** [확인 코드] | `app/main.js`의 roving tabindex + 화살표 keydown. 실제 키 입력은 안 눌러 봄 |
| tasks 체크박스 | **거의 고쳐짐** [확인] | 42개 체크, 미체크 2개(P16, Q7). Q7은 슬롯·Remix·장면·크기·.ics·의상·프리셋이 "later"로 남아 있는데 모두 구현돼 있어 낡음. P16은 대비 측정이 `contrast.test.js`로 일부 해결돼서 문구 갱신 필요 |
| 비라틴 닉네임이 사라짐(G1) | **고쳐짐** [확인] | `NICK_DISALLOWED = /[^\p{L}\p{N}\p{M} \-_.!?]/gu`. 단, 이 변경이 S5를 만듦 |
| 1차 미확인(Safari/Firefox/모바일, PNG 저장) | **여전히 미확인** | 이번에도 못 봄 |

---

## 3. 질문별 답변

### 3-1. 새 기능끼리 부딪히는 조합

| 조합 | 상태 | 근거 |
|---|---|---|
| 팔레트 선택 + 미리보기 | **깨짐 (S2)** | 아래 S2 참조 |
| 미리보기 vs PNG 저장 | **다르게 나옴 [확인 구조, 추정 결과]** | 미리보기는 중복 id의 영향을 받고, `savePng`는 `renderSvg(cfg)` 하나만 이미지로 읽어서 영향이 없음. 사용자가 본 것과 저장된 것이 다를 수 있음 |
| 해적 의상 + 모자 | **겹칠 가능성 [추정]** | 스크린샷에서 해적 두건이 머리 윗부분(y 약 275-310)에 있고, `hat()`의 챙은 `headTopY + 22` 근처. 렌더 조합은 안 봄 |
| 달(moon) + 유령의 집 장면 | **살짝 겹침 [확인 좌표, 화면은 안 봄]** | 달 중심 (850, 250) 반지름 96 → 아래쪽 346. 집 지붕 꼭대기 y=306 (`scenes.js`). `Classic Haunt` 프리셋이 정확히 이 조합 |
| 의상/장식 많음 | 문제 없음 [확인 좌표] | 소품 슬롯이 고정이라 서로 겹치지 않게 설계됨 (`svg.js` `propsSVG`) |
| story/wide 크기에서 글자 잘림 | **원본이 안 잘리면 안 잘림 [확인 코드]** | 정사각형 작품을 그대로 가운데에 넣고 배경만 채움 (`renderSvg` 두 번째 분기). 크기별 렌더 화면은 **[미확인]** |
| 긴 한글 문구 | **넘침 (S7)** | 아래 S7 참조 |

**S2 (높음) 같은 id 중복 — 실제 Chrome에서 재현**
- 원인 [확인]: `buildPresets()`가 프리셋 6개 썸네일을 `innerHTML`로 넣고, 메인 미리보기도 같은 문서에 인라인 SVG로 넣는다. 각 SVG가 `id="bg"`, `ghostFill`, `ghostGlow`, `fog` 등을 정의하는데, 문서에서 같은 id가 **7번씩** 존재했다 (`document.querySelectorAll('[id]')`로 13개 id가 중복).
- 결과 [확인]: 팔레트를 `indigo`로 바꿨는데 `document.getElementById('bg')`의 정지점이 첫 썸네일의 magenta(`#4a0b40`...)였고, 메인 SVG 자신의 `#bg`는 indigo(`#151563`...)였다. `url(#bg)`는 문서에서 **처음 나오는** id로 풀리므로, 미리보기의 배경·안개·고스트 글로우·호박 그라디언트가 모두 마젠타 쪽으로 보였다. 스크린샷에서 팔레트가 indigo인데 배경과 글로우가 마젠타 보라색이었고, 글자색(`fill="#6c7bff"` 직접 지정)만 indigo로 나왔다.
- 영향: 팔레트 3종이 미리보기에서는 거의 구분되지 않음. 프리셋 썸네일도 전부 첫 썸네일의 팔레트를 쓰니 서로 더 비슷해 보임. 첫 1분에 "팔레트를 바꿔도 안 바뀐다"고 느낄 수 있다.
- 결정론과의 관계: 엔진 출력 자체는 정상이다 (단독 SVG는 정확). 문제는 앱이 여러 SVG를 한 문서에 넣는 방식이다.
- 제안(코드 수정은 안 함): (가) `renderSvg(cfg, {idPrefix})`처럼 호출자가 넘기는 접두사로 id를 유일하게 만들기(난수·시계 불필요, 결정론 유지), 또는 (나) 썸네일을 `<img src="data:image/svg+xml,...">`로 넣어 문서와 분리. (나)가 엔진 변경 없이 가장 작다. 단, 메인 미리보기도 `<img>`로 바꾸면 접근성 텍스트 처리를 다시 봐야 한다.

**S1 (차단) `.ics`가 브라우저에서 동작하지 않음**
- 원인 [확인]: `engine/ics.js:93`이 `Buffer.byteLength(ch, "utf8")`를 쓴다. `Buffer`는 Node 전용이고 브라우저에는 없다. 테스트도 Node에서 돌려서 통과했다. 이 파일의 `tests/ics.test.js`도 `Buffer`를 쓴다.
- 재현 [확인]: 로컬 서버에서 실제 Chrome으로 열자 콘솔에 `Uncaught ReferenceError: Buffer is not defined`가 뜸 (공유 링크에 날짜 `Oct 31`, 시간 `7pm`이 들어 있을 때, 시작 시 1번 + 이후 4번 더). 또한 Node에서 `delete globalThis.Buffer` 후 `buildIcs`를 부르면 같은 오류로 던짐.
- 결과: `render()` 끝에서 `syncIcsButton()`이 `buildIcs()`를 부르다 예외 → 버튼의 `disabled` 갱신이 실행되지 않음 → **"Add to calendar" 버튼이 계속 비활성** (HTML에 `disabled`가 기본으로 박혀 있음). 공유 링크에 날짜가 있으면 시작할 때도 예외가 남. 날짜가 비어 있으면 `buildIcs`가 일찍 null을 돌려줘서 오류가 안 보임. 그래서 날짜를 쓰기 전까지는 안 드러난다.
- 제안: `TextEncoder`를 쓰는 `new TextEncoder().encode(ch).length`로 바꾸기. Node와 브라우저 둘 다 지원한다.
- 같은 종류 재발 방지: 엔진이 "DOM/네트워크/난수/시계 없음"을 지키는지 테스트가 있지만 **Node 전용 전역(`Buffer`, `process`)을 금지하는 테스트는 없다**. `Buffer`가 없는 환경에서 엔진을 import해 `buildIcs`를 한 번 부르는 테스트를 추가할 만하다 (1차에서 지적한 "테스트가 동작이 아니라 규칙만 본다"와 같은 패턴).

### 3-2. 레드팀 2차가 놓친 입력

레드팀 B1-B20은 폭이 넓고 꼼꼼하다 (프로토타입 오염, 헤더 주입, 거대 입력, 의상·장면 fallback). 그래도 놓친 것:

| 입력 | 결과 | 근거 |
|---|---|---|
| **전각 숫자 전화번호** `０１０-１２３４-５６７８` | **PII 스캔 통과**, 그대로 SVG에 들어감 | `engine/scan.js`의 `\d`는 ASCII 숫자만. R25에서 `\p{N}`을 허용하면서 생긴 틈. 실행으로 확인: ASCII는 차단, 전각·아랍인도 숫자(`٠١٠ ...`)는 통과 |
| 결합 문자 반복 (`Z` + `U+0300`×23) | 길이 24 코드포인트로 잘려서 통과 | 길이 제한은 있어서 큰 문제는 아님. 시각적 어지러움 정도 [추정] |
| 장소에 URL (`https://evil.example/a?b=c&d=e`) | `https://evil.example/a?bcde`로 남음 (`=`·`&` 제거) | `TEXT_DISALLOWED`가 `:`와 `/`를 허용. `.ics`의 `LOCATION`에 들어가면 캘린더 앱이 링크로 보여 줄 수 있음 [추정]. 공유 링크를 만든 사람이 받는 사람에게 링크를 심는 경로 |
| `.ics` 날짜의 연도와 `year` 불일치 | `2027-10-31` 입력 시 `DTSTART`는 2027, `SUMMARY`는 `KIROWEEN 2026` | 실행 확인. 사용자 혼란 가능 |
| 모호한 `11/10` | 11월 10일로 추측 | 월/일 순서만 지원한다고 코드에 적혀 있지만 `ics.js` 머리말의 "never guess"와는 어긋남 |

공유 링크 왕복과 새 필드 정규화는 이상 없었다 [확인 실행]:
- 최대치 조합(11개 자산, 모든 색, 의상, 장면, 이벤트 3칸)의 링크 파라미터는 716자였고, 왕복 후 완전히 같았다.
- 위조 입력(`t`가 배열·문자열·`__proto__`, `e`가 문자열·객체 배열, `k`가 `__proto__`, `s`가 객체, `pa`가 문자열)은 전부 `ok: true`로 안전한 기본값이 됨 (오염 없음). 다만 `ok: true`라서 앱이 "링크가 깨졌다"는 안내를 띄우지 않는다 (경미).

`.ics` 형식 (RFC 5545) 점검:
- 줄 접기(75옥텟), 개행 제거, `\`·`;`·`,` 이스케이프, CRLF, 종일 이벤트의 `VALUE=DATE`, 자정을 넘기는 종료 시각은 모두 맞다 [확인 실행: `11:30 PM` → 다음 날 `013000`].
- **`DTSTAMP`가 UTC(`Z`)가 아닌 떠 있는 시각** [확인 코드]. RFC 5545는 UTC를 요구한다. 코드는 "시계를 안 쓰려고" 이벤트 시작 시각을 넣었다. Google·Apple·Outlook이 이걸 받아 주는지는 **[미확인]**.
- UID는 설정의 해시라서 같은 설정이면 같은 UID. 같은 모임을 수정해 다시 내려받으면 캘린더가 같은 일정으로 합칠 수 있다 (장점이자 주의점).

### 3-3. 대비 테스트가 의미 있는가

`tests/contrast.test.js`는 계산 도우미가 맞고(21:1, 1:1), UI 버튼 색을 CSS에서 직접 읽어서 의미 있다. 그러나 **SVG 글자의 배경 가정은 약하다**:

- 글자 배경을 `bg0`(배너는 `bg1`)로만 근사한다 [확인]. 하지만 제목·부제·푸터(y=930~1046)는 안개 층(`y=486`부터, 보라 `mist` 색, 알파는 `strong`에서 최대 0.5) 위에 있다. 그만큼 배경이 밝아져 대비가 낮아진다.
- 계산 [추정, 안개 알파 평균 0.25 가정]: 부제(glow 색)는 deeppurple 4.22, magenta 4.42, indigo 4.55. 알파 0.5까지 가면 2.89~3.15. 부제는 25px라서 WCAG의 큰 글자 기준(24px 이상 일반 글씨, 3:1)에 해당해서 대부분 통과한다. 하지만 그건 테스트에 적혀 있지 않은 가정이다.
- 푸터(16px, 불투명도 0.55)는 안개 0.25에서 4.68~4.96으로 4.5를 넘는다 [추정 계산].
- 비네팅(가장자리 어둡게)은 대비를 높여 주는 쪽이라 안전한 방향이다. 호박 글로우, 소품, 장면 뒤에 글자가 오는 경우는 슬롯 설계상 거의 없다 [확인 좌표].
- 결론: 근사가 "안전"하지는 않지만 실제 위험은 낮다. 안전하게 하려면 (가) 부제·푸터 뒤에 반투명 어두운 띠를 한 겹 깔거나, (나) 테스트에서 배경을 `bg0`에 안개를 섞은 값으로 바꾸고 25px 이상은 3:1을 따로 검사. 실제 픽셀 샘플링은 **[미확인]**.

### 3-4. 프리셋 6종

| 프리셋 | 팔레트/빛/분위기 | 의상/장면 | 자산 |
|---|---|---|---|
| Classic Haunt | magenta / strong / screaming | 없음 / house | moon, bats, cobweb, pumpkins, candle |
| Vampire Ball | deeppurple / soft / uneasy | dracula / sky | moon, bats, candle, cobweb |
| Pirate Crypt | indigo / strong / screaming | pirate / graveyard | skull, crow, tombstone, moon |
| Mummy's Tomb | deeppurple / soft / hollow | mummy / graveyard | tombstone, candle, cobweb, skull |
| Bone Orchard | indigo / strong / hollow | skeleton / forest | skull, crow, bats, moon, tombstone |
| Witching Hour | magenta / strong / uneasy | 없음 / forest | hat, cat, moon, bats, pumpkins |

- 이름은 의미가 잘 전달된다 (의상·장면과 맞음) [확인].
- **서로 다르게 보이는 정도**: 의상이 있는 4종은 썸네일에서도 확연히 다르다 [확인 스크린샷]. 반면 `Pirate Crypt`와 `Bone Orchard`는 팔레트·빛이 같고 자산 5개 중 4개(skull, crow, moon, tombstone)가 겹쳐서 의상·장면 말고는 비슷하다. `Vampire Ball`과 `Classic Haunt`도 자산 3개가 겹침. `Witching Hour`는 마녀 의상이 아니라 모자(hat)로 표현돼서 가장 "의상 없음"에 가깝다.
- 가장 큰 문제는 S2다. 썸네일 6개가 전부 첫 썸네일의 팔레트를 써서 **팔레트 차이가 화면에서 사라진다**. 이걸 고치면 indigo(파랑 계열) 프리셋 2개가 눈에 띄게 달라질 것이다.
- 제안: S2를 고친 뒤에 다시 보고, 그래도 비슷하면 `Bone Orchard`의 자산을 하나 바꾸기 (예: crow 대신 cat 또는 candle).

### 3-5. "공개 심사자 첫 1분"

- 첫 화면 [확인 스크린샷, 1512px 폭]: 왼쪽에 긴 컨트롤 패널, 오른쪽에 큰 초대장. 프리셋 6개가 맨 위에 있어서 "한 번 눌러 보기"는 분명하다. 이건 좋다.
- 하지만 **저장·공유 버튼이 패널 맨 아래**에 있다 (Purpose, Year, Nickname, Mood, ... Assets, Export size를 모두 지나야 나옴). 스크린샷의 첫 화면에는 Mood까지만 보인다. 심사자가 "결과를 어떻게 가져가나"를 찾으려면 스크롤을 많이 해야 한다 [확인].
- 앱 이름이 "ASCII Invite"인데 결과물은 벡터 SVG다. README에는 설명이 있지만 첫 화면에서는 설명이 없다. 심사자가 ASCII 아트를 기대했다가 놀랄 수 있다 [추정].
- 가장 먼저 고칠 3가지:
  1. **S2 팔레트·프리셋 id 충돌** (팔레트가 안 바뀌어 보임 = 가장 눈에 띄는 버그).
  2. **저장/공유 버튼을 첫 화면에서 보이게** (패널 위쪽으로 옮기거나 미리보기 아래에 고정). 순수 CSS/HTML 변경.
  3. **첫 화면에 한 줄 안내** ("Pick a look, add your name, save or share") + 이름에 대한 한 줄 설명.
- 모바일 첫 화면은 **[미확인]**. CSS는 760px 이하에서 한 칸 레이아웃(`@media (max-width: 760px)`)이라, 모바일에서는 미리보기가 컨트롤 아래로 밀려 더 불리할 수 있다 [추정].

### 3-6. 문서 주장 점검

`docs/KIRO_WRITEUP.md`:
| 문장 | 판정 | 근거 |
|---|---|---|
| "21 EARS requirements, 30 passing tests (24 unit + 6 PBT), ~550 lines of pure engine" | **낡음** | 요구사항은 R1~R44(44개), 테스트 117개, 엔진 1,330줄 [확인] |
| "The site was not yet deployed at write time" | **낡음/모순** | 라이브가 200으로 응답 [확인]. 단, 라이브는 2차 이전 버전(S3) |
| "`art-tuner` (owns the SVG→grid assets)", `ascii-engine` | **낡음** | 에이전트 파일 이름이 아직 `ascii-engine.json`, `art-tuner.json`. 격자 에셋은 피벗에서 삭제됨 (`KIRO_EVIDENCE.md`) |
| "verified in real Chrome ... only console error was a missing favicon" | **현재 버전엔 근거 없음** | 이번에 실제 Chrome에서 `Buffer` 예외 2종이 나옴 (S1). 그 문장은 `.ics` 추가 이전 시점의 것 |
| "the red-team agent ... same pattern that caught regressions in a prior hackathon" | **미확인** | 이 저장소로는 확인 불가 |
| "the hooks run" | **미확인** | `KIRO_EVIDENCE.md`에 기록은 있으나 이번에 실행해 보지 않음 |
| "1,950 generated cases" | **맞음** [확인] | `pbt.test.js`의 numRuns 합 250+250+500+400+250+300 = 1,950 |

`docs/KIRO_AND_CREW_STORY.md`:
| 문장 | 판정 | 근거 |
|---|---|---|
| "30 tests became 37 ... `tests/crew_findings.test.js`" | 맞음 [확인] | 그 파일의 테스트가 7개 (30 + 7). 현재 117개로 갱신하면 좋음 |
| "a real headless-Chrome run (join, notice, recruit, wrap-around, back)" | **미확인** | 이번에 키 입력을 눌러 보지 않음 (코드는 있음) |
| "Still open: ... WCAG contrast measurement" | **낡음** | `tests/contrast.test.js`가 추가됨 (다만 3-3의 한계) |
| "Crew asked permission on every read ... 0.11.2" | **미확인** | 이 환경에서는 읽기 도구를 일부 거절당했고 재시도로 읽었다. 버전 정보는 못 봄 |
| 영상 비트에 "The gap it found is now closed by a test" | 부분적으로 맞음 | hat/horns 등은 맞음. 2차에서 새로 나온 S1, S2는 아직 열려 있음 |

추가로 STORY의 "Kiro가 만든 것을 Crew가 독립 검토" 구조는, 이번에 S1·S2를 찾아낸 사실이 오히려 가장 좋은 증거가 된다 (1차와 같은 패턴: 테스트는 통과, 실제 브라우저에서는 깨짐). 고친 뒤 문서에 넣을 만하다.

---

## 4. 나머지 항목

**S3 (높음) 라이브·dist가 2차 이전 버전** [확인]
- `curl`로 라이브 `index.html`을 가져왔을 때 `saveIcs`가 0번 나옴 (2차 이후 파일에는 있음).
- `https://.../engine/ics.js`, `presets.js`, `costumes.js` 모두 `200 text/html`로 응답. 파일이 없어서 CloudFront의 404 → `index.html` 대체 응답(`template.yaml`의 CustomErrorResponses)이 나온 것이다. 즉 **누락된 모듈 요청이 오류 없이 HTML을 돌려주는데, `import`는 MIME 오류로 실패**한다.
- `diff -rq engine dist/engine`: `costumes.js`, `ics.js`, `presets.js`, `scenes.js`가 `dist`에 없고 `index.js`, `invite.js`, `remix.js`, `share.js`, `svg.js`가 다름.
- 제안(사람이 실행): `node deploy/stage.mjs` → 배포 → 라이브에서 `engine/ics.js`가 `application/javascript`로 오는지 확인. 배포는 제 권한 밖이라 하지 않았다. S1·S2를 고친 뒤에 배포해야 한다.

**S4 (중간) README 실행 명령이 404** [확인]
- `README.md`와 `package.json`의 `serve`: `python3 -m http.server 8137 --directory app`. 그런데 `app/main.js`는 `../engine/index.js`를 import한다. `--directory app`으로 띄우면 `/engine/index.js`가 404 (실행 확인). 심사자가 README 대로 하면 컨트롤이 `hidden`인 빈 화면이 된다.
- 제안: 저장소 루트에서 서버를 띄우고 `/app/`을 열도록 안내하거나, 라이브 URL을 먼저 안내. (이번 확인도 루트 서버로 했다.)

**S6 (중간) `.ics` 입력 범위** [확인 실행]
- 지원: `Oct 31`, `10/31`, `2026-10-31`, `10월 31일`, 시간 `7pm`, `19:00`.
- 미지원(→ null, 버튼 비활성): `2026년 10월 31일`, `10월 31일` + `19시`, `오후 7시`, `31/10`.
- 한국어 사용자가 가장 쓸 법한 `오후 7시`가 안 되는데 UI의 예시 문구는 한국어 날짜(`10월 31일`)를 소개하고 시간은 영어(`7:00 PM`)만 예로 든다.
- 버튼이 꺼진 이유는 `title` 툴팁에만 있다. 모바일에는 호버가 없어서 보이지 않는다. 제안: 힌트를 `aria-live` 문구로 보여 주기.

**S7 (중간) 긴 문구 넘침** [추정, 렌더 안 봄]
- 가정: 한글 1자 ≈ 글자 크기, 영문 ≈ 0.5배. 이벤트 줄(24px)이 최대 길이(날짜 16 + 시간 12 + 장소 32, 전부 한글)일 때 약 1,578px로, 프레임 안쪽 폭 1,008px을 넘는다. 현실적인 예(`10월 31일 · 오후 7시 · 서울 강남구 역삼동 카페`)는 약 583px로 괜찮다.
- 24자 한글 닉네임 + recruit 부제도 약 1,000px로 프레임에 닿는다. 글자를 줄이거나 줄바꿈하는 로직은 없다 (`textLength`/`tspan` 없음) [확인 코드].
- B20은 "긴 한글 문구에서 SVG가 well-formed"만 검사했고 "화면 안에 들어오는가"는 검사하지 않았다.
- 제안: 이벤트 줄에 `textLength` + `lengthAdjust="spacingAndGlyphs"`로 최대 폭을 고정하거나, 길이에 따라 글자 크기를 단계적으로 줄이는 순수 함수 추가 (난수·시계 없이 결정론 유지).

**브라우저 호환 [미확인]**
- Safari, Firefox, 모바일 렌더와 PNG 저장 모두 못 봤다 (Chrome만).
- 코드에서 보이는 최신 기능: `structuredClone`(presets), `Object.hasOwn`(svg), 유니코드 속성 정규식 `\p{L}` + `u` 플래그, `crypto.getRandomValues`(Remix). 모두 현대 브라우저에서 되지만 Safari 15.4 미만은 막힐 수 있음 [추정].
- `savePng`는 SVG를 `Image`로 읽어 `canvas`에 그리는데, Safari에서 SVG 필터가 들어간 이미지를 `drawImage`할 때의 차이는 **[미확인]**.

---

## 5. 하지 않은 것 / 한계
- PNG를 실제로 저장해 보지 않음, `.ics`를 Google·Apple 캘린더로 가져와 보지 않음.
- story/wide 크기의 화면은 보지 않음.
- 키보드 이동은 코드만 읽고 실제 키를 누르지 않음.
- 확인에 쓴 Chrome 창에는 사용자의 다른 탭이 열려 있었다. 그 탭들은 건드리지 않았고 내용도 기록하지 않았다. 우리 앱 탭(로컬 서버 주소)은 열어 둔 상태다.
- 제안한 수정은 모두 사람이 적용해야 한다. 이 리뷰에서 코드는 한 줄도 바꾸지 않았다.

## 6. 서버리스·결정론 점검
- 이번 제안은 서버·로그인·DB가 필요 없다.
- S2의 `idPrefix`는 호출자가 문자열을 넘기는 방식이라 엔진에 난수·시계가 들어가지 않는다. 같은 입력이면 같은 출력이다.
- Remix의 시드는 앱에서만 `crypto.getRandomValues`로 만들고 엔진은 순수하게 유지한다 (`main.js`, `remix.js`) [확인].


---

## 7. Resolution (added by the builder, 2026-11-05)

| # | Finding | Status |
|---|---|---|
| S1 | `Buffer` in `ics.js` | **Fixed** (R45), test deletes `globalThis.Buffer` |
| S2 | duplicate SVG ids | **Fixed** (R46): thumbnails are `<img>`; 0 duplicate ids in headless Chrome; palettes now differ per thumbnail |
| S3 | live site is the old build | **Open until redeploy** (block G) |
| S4 | README serve command 404 | **Fixed**: serve the repo root, open `/app/` |
| S5 | full-width digits pass PII scan; links in place | **Fixed** (R47) |
| S6 | Korean date/time, why the button is off | **Fixed** (R48, R50) |
| S7 | long Korean text leaves the frame | **Fixed** (R49), estimated width, not measured with a real font |
| S8 | stale numbers in docs | **Open** (block G) |
| DTSTAMP not UTC | **Fixed** (R48) |
| `.ics` year differs from `year` field | Open, documented (the date text wins) |
| `11/10` read as month first | Documented: month-first is the only numeric order; stated in the UI hint |
| Safari/Firefox/mobile, PNG save, calendar import | **Still unverified** |
