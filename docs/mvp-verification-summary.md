# MVP 구현/검증 요약

작성일: 2026-07-04

## 구현 요약

- 정적 웹앱 MVP를 추가했다.
- 계산 도메인 로직과 UI를 분리했다.
- 1~4단계 흐름을 구현했다.
  - 화료/국 정보
  - 손패 입력
  - 도라/우라/깡 직후 판정
  - 결과
- 최근계산은 localStorage 기반으로 최대 20개 저장/복원한다.
- 공유는 URL fragment 기반이며 최근계산 데이터는 포함하지 않는다.
- 공유 payload와 최근계산 복원 데이터는 allowlist/재검증을 거친다.
- 사용자 입력은 DOM `textContent`/속성 기반으로 렌더링하고 `innerHTML`/`eval`을 사용하지 않는다.

## 기술 스택

- 외부 의존성 없는 정적 HTML/CSS/ES module.
- 실행: `scripts/run.ps1 preview`
- 테스트: `scripts/run.ps1 test`
- 빌드 검증: `scripts/run.ps1 build`

## 검증 결과

통과한 명령:

- `scripts/run.ps1 test`
  - 58개 테스트 통과
- `scripts/run.ps1 verify`
  - 정적 앱 파일과 module script 확인 통과
- `scripts/run.ps1 build`
  - `dist/` 생성과 정적 산출물 검증 통과

## 대표 테스트 범위

- 도라 순환
- 적5 정규화와 적도라 합산
- 동일패 5장 이상
- 적5 중복
- 화료패 부재
- 일발 단독 선택
- 손패 + 도라/우라 표시패 visible tile 수량 초과
- 창깡 순자 대기 제한
- 핑후 쯔모 20부
- 멘젠 핑후 론 30부
- 론 샤보 삼암각 제외
- 쯔모 샤보 삼암각 포함
- 치또이 25부
- 치또이형 혼노두
- 후로 혼일색 감산
- 쿠이탕
- 리치/우라도라
- 도라만 있고 일반역 없음
- 30부 4판 절상만관 없음
- 5판 부수 무관
- 13판 카조에역만
- 역만 감지 중단
- 구련보등 감지 중단
- URL fragment 생성/파싱
- localStorage 최근계산 복원 데이터 검증

## 모바일 QA

기준:

- viewport: 390 x 844
- URL: `http://127.0.0.1:4173` 및 `https://auto-mini.github.io/Mahjong-Point-Calculator/`

확인:

- 첫 화면: 가로 오버플로 없음, 주요 UI 겹침 없음, 콘솔 오류 없음.
- 1 -> 2 흐름: `론` 선택 후 `손패 입력으로` 버튼이 활성화되고 손패 입력 단계로 이동.
- 2 -> 3 흐름: 완성 손패 복원 상태에서 `도라 입력으로` 버튼이 활성화되고 도라/우라 단계로 이동.
- 3 -> 4 흐름: 도라/깡 직후 조건이 유효할 때 `결과 보기` 버튼이 활성화되고 결과 단계로 이동.
- 결과 화면: `1000점 / 1판 30부` 결과 표시, 가로 오버플로 없음, 주요 UI 겹침 없음, 콘솔 오류 없음.
- 최근계산: 결과 저장, 모달 열기, 항목 복원 성공.
- 공유: URL fragment 생성, 공유 모달 표시 성공.
- 공유 오류: 잘못된 fragment에서 `공유 링크를 읽을 수 없음` 표시.

스크린샷:

- `outputs/mvp-mobile-qa-page-1-current.png`
- `outputs/mvp-mobile-qa-result-current.png`
- `outputs/mvp-mobile-qa-invalid-share-current.png`

## 실행 중 서버

검증 중 로컬 서버를 실행했다.

- `http://127.0.0.1:4173`
