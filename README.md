# 리치마작 부수계산기

작혼 4인 일반 룰을 기준으로 한 모바일 우선 리치마작 부수/점수 계산 웹앱입니다.

## 범위

- 역만은 계산 대상에서 제외합니다.
- 화료 방식, 장풍/자풍, 본장, 특정 상황역, 손패, 화료패, 도라/우라도라 표시패를 입력합니다.
- 앱이 역/부수/점수와 지불 금액을 계산합니다.
- 공유 링크는 URL fragment(`#s=`)에 상태를 저장합니다.
- 최근 계산은 브라우저 `localStorage`에만 저장합니다.
- 백엔드는 없습니다.

## 실행

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 preview
```

로컬 주소:

```text
http://127.0.0.1:4173/
```

## 빌드와 검증

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 test
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 build
```

빌드 결과물은 `dist/`에 생성됩니다.

## 배포

`main` 브랜치에 push하면 GitHub Actions가 `npm run build`를 실행하고 `gh-pages` 브랜치에 정적 결과물을 배포합니다.

공개 주소:

```text
https://auto-mini.github.io/Mahjong-Point-Calculator/
```

## 보안 메모

- 사용자 입력을 HTML로 직접 삽입하지 않습니다.
- 공유 상태는 fragment에 저장되어 일반 HTTP 요청에는 포함되지 않습니다.
- 정적 배포물에는 `docs/`, `tests/`, `work/`, `.git` 같은 개발 파일을 포함하지 않습니다.
