# 앱 전체 상세 리뷰 - 공개 터널/배포 준비 후속

검토 범위:

- 공개 URL: `https://buses-knowing-collapse-calibration.trycloudflare.com`
- 로컬 dist 서버: `127.0.0.1:4174`
- 모바일 폭 390px 대표 화면
- 계산/공유/최근기록/도라/결과 모달
- 정적 빌드/프리뷰 서버/배포 준비 스크립트

## 선조치한 명백한 오류

1. 프리뷰 서버의 malformed URL 처리
   - 기존 동작: 요청 경로를 `decodeURIComponent`로 바로 디코딩했다.
   - 문제: `%E0%A4%A`처럼 잘못된 URL 인코딩이 들어오면 서버 요청 처리 중 예외가 날 수 있었다. 공개 터널을 열어둔 상태에서는 외부 요청 하나로 서버 안정성이 흔들릴 수 있다.
   - 변경 동작: 잘못된 인코딩은 `400 Bad request`로 응답하고, 서버는 계속 살아 있게 했다. 루트 밖 경로 판정도 `relative/isAbsolute` 기준으로 정리했다.
   - 검증: `/`는 200, `/%E0%A4%A`는 400, 루트 밖 파일 시도는 노출 없이 실패, 서버 listen 유지.

2. 결과/모달 DOM 텍스트 간격
   - 기존 동작: `aria-label`은 있었지만 DOM 텍스트 추출 기준으로 `지불16000`, `배만리치`처럼 붙어 읽히는 부분이 남아 있었다.
   - 문제: 화면 사용에는 큰 문제 없지만, 앞서 접근성/텍스트 추출 문제를 고치겠다고 한 범위가 불완전했다.
   - 변경 동작: 결과 카드, 지불, 역/부수 줄, 동점 해석 후보에 실제 DOM 텍스트 공백을 추가했다. 화면 배치는 그대로 유지했다.
   - 검증: 공개 URL에서 `지불 16000`, `리치 1판`, `배만 리치...`로 추출됨.

## 검증 결과

- `powershell -ExecutionPolicy Bypass -File scripts/run.ps1 build`: 통과
- `powershell -ExecutionPolicy Bypass -File scripts/run.ps1 test`: 36개 통과
- `powershell -ExecutionPolicy Bypass -File scripts/run.ps1 verify`: 통과
- 공개 URL `/`: 200
- 공개 URL malformed path: 400
- 브라우저 콘솔 warning/error: 없음
- 390px 모바일 대표 화면:
  - 1페이지, 2페이지, 3페이지, 결과 페이지 가로 넘침 없음
  - B2 패 이미지 로딩 완료 후 누락 없음
  - 비리치 상태에서 우라도라 영역 숨김 유지
  - 결과 `9판 / 배만` 표시 유지
  - 공유 링크는 공개 URL origin으로 생성됨

## 의견 확인 필요

1. 현재 Quick Tunnel은 URL을 아는 사람은 누구나 접속할 수 있다.
   - 앱 자체는 정적 계산기라 민감 데이터 전송은 없지만, 링크가 공개되면 누구든 사용할 수 있다.
   - 계속 열어둘지, 테스트할 때만 켜고 평소엔 끌지 결정 필요.

2. 기존 4173 로컬 서버가 아직 켜져 있다.
   - `127.0.0.1` 전용이라 외부 노출은 아니지만, 현재 공개 검증은 4174/dist 서버로 충분하다.
   - 4173을 꺼서 혼선을 줄일지, 인앱 브라우저 기존 탭 때문에 유지할지 결정 필요.

3. 배포 준비 변경분은 아직 커밋되지 않았다.
   - 변경 파일: `.gitignore`, `package.json`, `scripts/*`, `docs/deployment-prep.md`, `src/app.js`.
   - 리뷰 후 확정이면 커밋하는 편이 좋다.

4. 지금 공개 URL은 임시 URL이다.
   - PC/프로세스가 꺼지면 죽고, 다시 켜면 주소가 바뀔 수 있다.
   - 완성 전에도 안정적인 주소가 필요해지면 Cloudflare Pages나 named tunnel 쪽으로 바꿔야 한다.
