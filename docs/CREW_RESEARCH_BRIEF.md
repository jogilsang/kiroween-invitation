# Kiro Crew 조사 지시서 — ASCII Invite의 production 적합성 & feature 발굴

> 이 문서는 **Kiro Crew pane에 넘기는 브리핑**이다. Crew는 아래 "현재 상태"를
> 사실로 받아들이되, 반드시 "읽을 파일"을 직접 열어 교차검증한 뒤 결론을 낸다.
> 추측과 확인된 사실을 구분해 적는다. 코드를 바꾸지 말고 **조사·제안만** 한다.
> 산출물은 이 폴더에 `CREW_FINDINGS.md`로 저장한다.

## 0. 역할 / 산출물
- 역할: 독립 product/engineering 리뷰어. "이 서비스가 실제 사용자에게 production으로 나갈 수 있는가"를 평가하고, 신규로 개발하거나 개선하면 좋을 feature를 우선순위와 함께 제안한다.
- 코드 수정 금지(독립 리뷰). 결론은 `CREW_FINDINGS.md` 한 파일에.
- 근거 없는 칭찬/비난 금지. 각 주장에 "어느 파일/어느 동작에서 확인했는지"를 단다.

## 1. 제품 한 줄
보라색 다크 테마 위에 하얀 Kiro 고스트와 핼러윈 펌킨이 어우러진 **그로테스크하게 멋있는 핼러윈 초대장**을, 설정 조합으로 매번 다르게 생성·저장(PNG)·공유(URL)하는 **서버 없는 클라이언트 전용 웹앱**. 용도 join/notice/recruit, 연도 가변, mood/palette/glow/parts 조합. 결정론: 같은 설정 = 같은 결과.

## 2. 현재 상태 (사실, 2026-11-05 기준 — Crew는 파일로 교차검증할 것)
- 코드 위치: `project_my/hackathon/kiroween_2026/ascii-invite/` (private repo `my-hackathon`).
- 스택: JS 단일(ES modules), 빌드 없음. 순수 엔진 + 정적 앱. Node 내장 test runner + fast-check(PBT).
- 엔진(순수, DOM/네트워크/난수/시계 없음): `engine/svg.js`(결정론 SVG 문자열), `invite.js`(검증·문구·escapeXml), `compose.js`(레이어·배타 규칙), `share.js`(URL base64url 인코딩), `scan.js`(안전 스캔).
- 앱: `app/`(인라인 SVG 미리보기, SVG→canvas PNG, 공유 링크, localStorage, noscript, aria).
- 테스트: 30개(단위 24 + PBT 6) 통과. 레드팀 22입력 안전(`docs/RED_TEAM.md`).
- 배포: S3(private)+CloudFront OAC, captain/us-east-1. 라이브 https://d3hl6g932302kb.cloudfront.net (심사자 로그인 없이 체험).
- 맥락: Kiroween 2026 해커톤(Costume Contest) 출품작. 심사 4기준 각 20%. 마감 KST 2026-12-05.
- 알려진 한계: 비(非)라틴 닉네임은 sanitize로 빈 값이 됨(`docs/RED_TEAM.md` G1). `a\nb`→`ab` 무음 처리(G2).

## 3. 반드시 읽을 파일 (교차검증)
- `.kiro/specs/ascii-invite/{requirements,design,tasks}.md` (요구·설계·작업, 피벗 changelog 포함)
- `.kiro/steering/{product,tech,principles}.md`
- `engine/svg.js`, `engine/invite.js`, `engine/compose.js`, `engine/share.js`, `engine/scan.js`
- `app/index.html`, `app/main.js`, `app/style.css`
- `tests/*.test.js` (무엇을 보장하는지)
- `docs/RED_TEAM.md`, `docs/KIRO_EVIDENCE.md`, `docs/PRE_SUBMIT.md`
- 라이브 URL을 실제로 열어 동작 확인(가능하면). PNG 저장·공유 링크 왕복을 직접 시도.

## 4. 조사 질문 (이 순서로 답할 것)
### A. Production 적합성 (현재 "실사용자 대상"으로 나갈 수 있나?)
1. 기능 완성도: Golden Path(설정→생성→저장/공유→링크로 복원)가 끊김 없이 되나? 깨지는 경로는?
2. 안전/프라이버시: 클라이언트 전용이라 서버 리스크는 낮음. 그래도 공유 URL에 담기는 정보, nick 처리, PNG 내보내기에서 사용자가 당황할 지점은?
3. 접근성: 스크린리더/키보드/대비. aria-label·noscript 외에 실제 사용 시 부족한 점.
4. 브라우저 호환: SVG filter(feTurbulence, feGaussianBlur, feColorMatrix) + SVG→canvas PNG가 Safari/Firefox/모바일에서 동일하게 되나? (실제로 확인 가능하면 확인, 아니면 "미확인"으로)
5. 성능: 미리보기 debounce, 리렌더 비용, 모바일에서의 체감.
6. i18n: 비라틴 닉 공백화(G1)는 실사용자에겐 치명적일 수 있음 — production이라면 어떻게 풀지.
7. 운영: 배포/롤백/비용 상한/모니터링이 "실서비스" 기준으로 충분한지.
8. 결론: 현재 상태를 **(가) 데모/해커톤용으로 충분 / (나) 소규모 실사용 가능 / (다) 본격 production은 추가 작업 필요** 중 하나로 판정하고 근거.

### B. 신규/개선 Feature 제안 (실사용자 가치 기준)
- 각 제안에 대해: 무엇을 / 왜(사용자 가치) / 난이도(S·M·L) / 결정론·순수엔진 원칙 위반 여부 / 해커톤 심사(Design·Innovation)와의 관계.
- 아이디어 씨앗(Crew가 더 발굴할 것): 더 많은 고스트/펌킨 변형·포즈, 텍스트 커스터마이즈(제목·본문 편집), 배경 테마 추가, 애니메이션(SVG SMIL/CSS, 단 PNG는 정지), 다국어 닉(폰트 임베드), 공유 OG 이미지 자동 생성, 캘린더(.ics) 첨부, QR 코드, 여러 장 배치(연락처 카드), 프린트 CSS, 공유 링크 단축, 접근성 고대비 모드, 색맹 팔레트, 템플릿 갤러리/프리셋.
- **원칙 가드**: 서버·로그인·DB 추가 제안은 "현재 서버리스 철학을 깨므로 선택지일 뿐"이라고 명시. AI를 렌더 경로에 넣는 제안은 결정론을 깨므로 금지 또는 "제안 시 트레이드오프 명시".

### C. 우선순위
- 위 제안을 **(1) 해커톤 마감 전 가치 큰 것 / (2) production으로 갈 때 필요한 것 / (3) 나중에**로 3분류.
- 마감(KST 12/5) 전에 할 만한 "작지만 임팩트 큰" 상위 3개를 콕 집어라.

## 5. 출력 형식 (`CREW_FINDINGS.md`)
1. 한 줄 총평 + A8 판정(가/나/다).
2. Production 적합성 표(항목 | 상태 | 근거 파일/동작 | 리스크).
3. Feature 제안 표(제안 | 사용자가치 | 난이도 | 원칙위반? | 심사기여 | 우선순위).
4. 마감 전 추천 상위 3개(이유).
5. 미확인·추가 조사 필요 항목.
- 확인된 사실과 추정을 분리. 계정 ID·키·내부정보는 적지 말 것.
