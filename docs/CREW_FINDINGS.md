# Kiro Crew 조사 결과 — ASCII Invite production 적합성 & feature 제안

> 독립 product/engineering 리뷰. `docs/CREW_RESEARCH_BRIEF.md` 지시대로 코드를 바꾸지 않고
> 조사·제안만 수행. 모든 주장에 "어느 파일/어느 동작에서 확인했는지"를 달았다.
> **[확인]** = 파일을 읽거나 명령을 실행해 직접 검증. **[추정]** = 코드로 확인 못한 판단.
> 작성: Kiro Crew, 2026-11-05. 계정 ID·키·URL 외 내부정보는 적지 않았다.

---

## 1. 한 줄 총평 + 판정

결정론·순수 엔진·안전 처리가 테스트와 레드팀으로 탄탄하게 뒷받침된 잘 만든 클라이언트 전용 웹앱이고,
해커톤 출품 기준으로는 지금 그대로 내보낼 수 있다. 다만 UI가 노출하는 `hat`/`horns` 장식이 실제로는
아무 그림도 안 그리고 i18n(비라틴 닉)이 빈 값으로 사라지는 두 지점이 "실사용자 production"에는 걸린다.

**A8 판정: (가) 데모/해커톤용으로 충분.** 소규모 실사용(나)로 가려면 아래 P0 2건(hat/horns, i18n)을
먼저 풀어야 한다. 근거는 2절·4절 참조.

---

## 2. Production 적합성 표

| 항목 | 상태 | 근거 파일 / 동작 | 리스크 |
|---|---|---|---|
| Golden Path (설정→생성→저장→공유복원) | [확인] 동작 | `node --test` 30/30 통과; `test_open_shared_link_restores`(share.test.js)로 복원 동일 SVG 검증; 직접 encode→decode 왕복 `roundtrip equal: true`(실행) | 낮음 |
| 결정론 (같은 설정=같은 바이트) | [확인] 보장 | `test_deterministic_bytes`(svg.test.js), PBT 250런(pbt.test.js); `svg.js`는 `Math.random`/`Date.now` 없음, `deriveSeed` FNV-1a seed만 사용 | 낮음 |
| 입력 검증 / 안전 | [확인] 강함 | `normalizeConfig`(invite.js) 모든 enum fallback·year clamp·nick sanitize; `scan.js` script/PII/banned 차단; `docs/RED_TEAM.md` 22입력 PASS | 낮음 |
| SVG 태그 인젝션 방지 | [확인] 2중 방어 | `sanitizeNick` allow-list + `escapeXml`(invite.js); PBT "no unescaped < from nick"(pbt.test.js) 통과 | 낮음 |
| **hat / horns 장식** | [확인] **그림 없음(버그성 갭)** | `svg.js`의 `ghost()`에 hat/horns 렌더 코드 없음; `compose.js` `DECORATION_PARTS=["hat","horns","moon","bats"]`지만 그려지는 건 moon/bats뿐. 실행 결과 hat 선택 시 바뀌는 건 fog `seed="24"→"71"`뿐(그림 아님) | **중** — UI가 약속한 장식이 안 나와 사용자 혼란 |
| i18n (비라틴 닉) | [확인] 빈 값 처리 | `NICK_ALLOWED=/[^0-9A-Za-z \-_.!?]/g`(invite.js)로 한글·일본어·emoji 전부 제거; `docs/RED_TEAM.md` A14(emoji→"")·G1 | **중** — 한국어/일본어 핸들이 사라짐. production 치명적 |
| nick 길이 UI 불일치 | [확인] 무음 절단 | `app/index.html` `<input id="nick" maxlength="40">`인데 `NICK_MAX=24`(invite.js). 25~40자는 입력은 되지만 무음 clamp | 낮음~중 — 사용자가 24자 잘림 이유를 모름 |
| 접근성 | [확인] 기본 양호, 개선여지 | SVG `<title>`+`aria-label`(svg.js), preview `role="img"`, `aria-live` hint, noscript 있음. `#purpose`는 `role="radiogroup"`/`role="radio"`지만 키보드 화살표 이동·`tabindex` 처리는 코드에 없음(`main.js`는 click만 바인딩) | 중 — 키보드만 쓰는 사용자가 purpose 전환 어려움 [추정] |
| 색 대비 | [추정] 대체로 충분, 미측정 | 다크 배경+흰 고스트는 대비 큼. 단 footer `opacity="0.55"`·`--muted:#9a7fb8` 라벨은 WCAG AA 미측정 | 낮음 — 실측 필요 |
| 브라우저 호환 (SVG filter→canvas PNG) | [미확인] | `feTurbulence`/`feGaussianBlur`/`feColorMatrix` + `canvas.toDataURL`. Node 테스트로는 검증 불가. `PRE_SUBMIT.md`는 "headless render"만 언급, Safari/Firefox/모바일 교차 미기재 | 중 — Safari는 외부 리소스 없는 inline SVG라 `toDataURL` 오염 가능성은 낮으나 filter 렌더 차이 가능 [추정] |
| 성능 | [확인] 가벼움 | SVG 길이 ~6.7K~8.4K자(실행), preview 60ms debounce(`main.js` `onInput`), 의존성 0(런타임). 리렌더는 `innerHTML` 전체 교체지만 1개 노드라 저렴 [추정] | 낮음 |
| 공유 URL 정보 | [확인] 투명 | `share.js` base64url(JSON) — purpose/year/nick/parts/mood/palette/glow만. 서버 저장 없음. 샘플 param 길이 124자(실행) | 낮음 — nick이 URL에 평문(base64) 노출됨을 사용자가 인지해야 함 |
| 운영 (배포/비용/롤백) | [확인] 적정, 모니터링 부재 | `deploy/template.yaml` private S3+CloudFront OAC, `PriceClass_100`, `delete-after` 태그, teardown 스크립트 있음. 라이브 200 확인(curl). 비용 상한·알람·대시보드는 템플릿에 없음 | 낮음(해커톤) / 중(실서비스) |
| 라이브 사이트 | [확인] 가동 | `https://d3hl6g932302kb.cloudfront.net/` 200 text/html, `/main.js` 200, `/engine/index.js` 200 (curl 실행) | 낮음 |
| dist/app 동기화 | [확인] 일치 | `diff` 결과 import 경로(`../engine`→`./engine`)만 차이, `stage.mjs` 의도대로. `engine/svg.js`는 dist와 완전 동일 | 낮음 |
| SPA fallback 부작용 | [확인] 존재 | `template.yaml`이 403/404를 `/index.html` 200으로 리라이트 → `/favicon.ico`가 **200 + HTML** 반환(curl 실행). 존재하지 않는 경로가 전부 앱 HTML로 응답됨 | 낮음 — 다만 OG 크롤러·favicon 요청이 HTML 받음 |

---

## 3. Feature 제안 표

| 제안 | 사용자 가치 | 난이도 | 원칙 위반? | 심사 기여 | 우선순위 |
|---|---|---|---|---|---|
| **hat/horns 실제 그리기** | UI가 약속한 장식을 실제로 제공(현재는 아무것도 안 그림) | S~M | 없음 (결정론 유지, `ghost()`에 순수 path 추가) | Design·완성도 | (1) 마감 전 |
| **nick 입력 maxlength=24로 정정 + 잘림 안내** | 무음 절단 제거, 기대와 결과 일치 | S | 없음 (HTML 한 줄 + hint) | 완성도 | (1) 마감 전 |
| **비라틴 닉 렌더(폰트 임베드 or 유니코드 허용)** | 한국어/일본어 핸들 사용자 이탈 방지(G1) | M~L | 없음이나 안전/용량 트레이드오프 명시 필요 | Innovation·포용성 | (2) production |
| 텍스트 커스터마이즈(제목·본문 편집) | 초대 목적을 자유 문구로 | M | 없음 (sanitize/escape/scan 경로 재사용) | Design·Innovation | (2) production |
| purpose 라디오 키보드 내비게이션 | 키보드 사용자 접근성 | S | 없음 (`main.js`에 keydown만 추가) | Design(접근성) | (1) 마감 전 |
| 고대비 / 색맹 팔레트 추가 | 접근성·시각 다양성 | S~M | 없음 (`PALETTES`에 enum 추가) | Design·Innovation | (2) production |
| OG 이미지 자동 지정(정적 대표 PNG) | 공유 링크 미리보기 썸네일 | S | 없음 (정적 이미지 1장, 결정론 무관) | Presentation | (2) production |
| 더 많은 고스트/펌킨 변형·포즈 | 조합 다양성 = 핵심 차별점 강화 | M | 없음 (enum·순수 path) | Innovation·Design | (2) production |
| 캘린더 `.ics` 첨부 / QR 코드 | 실제 초대장 실용성 | M | 없음 (클라이언트 생성 가능) | Innovation | (3) 나중 |
| SVG 애니메이션(SMIL/CSS, PNG는 정지 유지) | 미리보기 몰입감 | M | 결정론 유지 가능하나 PNG 정지 경로 분리 명시 | Design | (3) 나중 |
| 프린트 CSS / 여러 장 배치 | 실물 출력 | M | 없음 | — | (3) 나중 |
| 템플릿 갤러리/프리셋 | 빈 화면 극복, 빠른 시작 | S~M | 없음 (프리셋 config 배열) | Design | (3) 나중 |
| 공유 링크 단축 | URL 124자 → 짧게 | M | **서버 필요 → 서버리스 철학 위반**. 선택지일 뿐 | — | (3) 나중 |
| 서버/로그인/DB(저장 갤러리 등) | 영속 저장·계정 | L | **철학 위반**(product.md "Out of scope"). 선택지일 뿐 | — | 비권장 |
| AI를 렌더 경로에 투입 | 자동 디자인 | — | **금지**(결정론·PBT 파괴, principles.md) | — | 금지 |

---

## 4. 마감(KST 2026-12-05) 전 추천 상위 3개

1. **hat/horns 실제 그리기 (또는 UI에서 제거)**
   지금은 체크박스를 눌러도 fog seed만 바뀌고 모자·뿔이 안 나온다([확인] `svg.js`에 렌더 코드 없음,
   실행상 seed 24→71 변화뿐). 심사위원이 직접 눌러보면 바로 드러나는 "약속 불이행"이라 Design 점수에
   가장 큰 리스크. 그려 넣으면 조합 다양성(핵심 차별점)도 커진다. 둘 다 어려우면 최소한 UI 체크박스를
   빼서 기대-결과를 맞추는 게 안전. 난이도 S~M.

2. **nick `maxlength`를 24로 정정 + "최대 24자" 안내**
   `app/index.html`은 40자까지 받지만 엔진은 24자로 무음 절단([확인] maxlength=40 vs NICK_MAX=24).
   HTML 한 줄 + hint 한 줄로 끝나는 S 난이도인데 사용자 혼란을 바로 없앤다.

3. **purpose 라디오 키보드 내비게이션**
   `role="radiogroup"`을 선언해 놓고 `main.js`는 click만 바인딩([확인])—키보드 사용자가 화살표로
   purpose를 못 바꾼다. keydown 핸들러 + `tabindex` roving 몇 줄이면 접근성 Design 점수에 바로 기여.
   난이도 S.

세 개 모두 결정론·순수 엔진·서버리스 철학을 깨지 않고, "model says, code decides" 원칙 안에서 끝난다.

---

## 5. 미확인 · 추가 조사 필요 항목

- **브라우저 교차 호환 [미확인]**: Safari/Firefox/iOS·Android 실기기에서 `feTurbulence`+`feGaussianBlur`
  렌더와 `SVG→canvas→toDataURL` PNG가 Chrome과 동일한지 미검증. Node 테스트로는 확인 불가. 실기기/
  BrowserStack 캡처 필요. (`PRE_SUBMIT.md`는 headless render만 언급)
- **색 대비 WCAG AA [미측정]**: footer `opacity=0.55`, `--muted` 라벨 등 저대비 후보의 실측 미수행.
- **PNG 내보내기 실제 동작 [미확인]**: `savePng`(main.js)의 canvas 경로는 브라우저 API라 코드로만은
  확정 불가. `RED_TEAM.md`도 "브라우저에서 수동 검증" 명시. 특히 Safari의 tainted-canvas 여부 확인 권장.
- **공유 링크 길이와 플랫폼 제한 [추정]**: 샘플 124자(실행)는 대부분 메신저에서 문제없지만, 매우 긴 닉+
  옵션 조합의 상한은 미측정.
- **라이브 사이트의 런타임 콘솔 에러 [미확인]**: curl로 200·자산 로드는 확인했으나, 실제 브라우저 콘솔
  에러(이전 기록상 favicon 404)는 이번 조사에서 브라우저로 직접 재확인하지 않음.
- **tasks.md의 P1~P11이 모두 `[ ]` 미체크 [확인]**: 본문·evidence상 수행 완료로 보이나 체크박스는
  안 채워져 있음. 문서 정합성만의 문제(기능 영향 없음)로 판단되나 제출 전 사람 확인 권장.

---

### 확인된 사실 vs 추정 요약
- **[확인]**: 30 테스트 통과, 결정론·검증·안전·레드팀, hat/horns 미렌더, nick maxlength 불일치,
  라이브 200, dist/app 동기화, 공유 왕복, SPA 404→index 리라이트, og:image 없음.
- **[추정]**: 성능 체감, 색 대비 적정성, Safari filter 렌더 차이, 키보드 접근성 영향 범위.
- **[미확인]**: 실기기/타 브라우저 렌더, PNG 실제 저장, WCAG 실측, 라이브 콘솔 에러.
