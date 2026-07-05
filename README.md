# 리치마작 부수계산기

작혼 4인 일반 룰을 기준으로 한 모바일 우선 리치마작 부수/점수 계산 웹앱입니다.
실제 작탁에서 부수 계산이 헷갈릴 때, 손패와 도라 정보를 입력해 최종 판/부/점수와 지불액을 빠르게 확인하는 용도입니다.

공개 주소:

```text
https://auto-mini.github.io/Mahjong-Point-Calculator/
```

## 주요 기능

- 론/쯔모, 장풍/자풍, 본장, 특정 상황역 입력
- 패 이미지 기반 손패 입력
- 화료패 선택 후 대기/부수 자동 계산
- 역 자동 판정과 도라/우라도라 판수 합산
- 최종 판/부, 총점, 지불액 표시
- 부수 계산 내역 표시
- 최근 계산 저장
- 공유 링크 생성
- 모바일용 `버튼 확대` 모드

## 지원 범위

- 4인 리치마작 기준입니다.
- 작혼 4인 일반게임 룰을 기준으로 합니다.
- 쿠이탕을 허용합니다.
- 핑후 쯔모는 20부, 치또이는 25부 고정, 핑후 론은 30부로 계산합니다.
- 장풍/자풍/삼원패 머리는 각각 2부, 연풍패 머리는 4부로 계산합니다.
- 커쯔/깡쯔는 명/암, 중장패/요구패를 구분해 계산합니다.
- 만관 이상은 만관/하네만/배만/삼배만/카조에역만으로 표시합니다.
- 5판 이상은 부수와 무관하므로 결과에서 부수를 숨깁니다. 단, 3판 70부 이상이나 4판 40부 이상처럼 부수로 만관이 되는 경우는 판/부를 표시합니다.

## 제한사항

- 역만 손패는 계산 대상에서 제외합니다.
- 국사무쌍, 천화, 지화 등 역만 전용 입력 흐름은 지원하지 않습니다.
- 유국만관은 지원하지 않습니다.
- 공탁금 입력은 지원하지 않습니다.
- 도라 표시패를 실제보다 많이 입력했는지는 앱이 확정할 수 없으므로 초과 입력은 허용합니다. 다만 필요한 최소 개수보다 적거나 중간 칸이 비어 있으면 오류로 처리합니다.
- 과거 버전 공유 링크 호환성은 높은 우선순위가 아닙니다. 현재 버전에서 생성한 공유 링크가 복원되는 것을 우선합니다.

## 저장과 보안

- 백엔드가 없는 정적 웹앱입니다.
- 최근 계산은 현재 브라우저의 `localStorage`에만 저장됩니다.
- 공유 상태는 URL fragment(`#s=`)에 저장됩니다. fragment는 일반 HTTP 요청에 포함되지 않습니다.
- 사용자 입력을 HTML 문자열로 직접 삽입하지 않습니다.
- HTML과 배포 산출물에 Content Security Policy를 적용합니다.
- 정적 배포물에는 `docs/`, `tests/`, `work/`, `.git` 같은 개발 파일을 포함하지 않습니다.

## 로컬 실행

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 build
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 preview
```

기본 로컬 주소:

```text
http://127.0.0.1:4173/
```

다른 기기에서 같은 네트워크로 테스트하려면:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 preview-lan
```

## 검증

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 test
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 build
```

현재 테스트는 계산, 도라/우라, 깡 직후 판정, 공유 상태 복원, 최근 계산 정리, 정적 서버 보안을 확인합니다.
빌드 결과물은 `dist/`에 생성됩니다.

## 배포

`main` 브랜치에 push하면 GitHub Actions가 테스트와 빌드를 실행하고, GitHub Pages artifact로 정적 결과물을 배포합니다.
