# 배포 준비 메모

이 앱은 백엔드 없이 동작하는 정적 웹앱이다.
현재 공개 배포 URL은 아래와 같다.

https://auto-mini.github.io/Mahjong-Point-Calculator/

## 산출물 생성

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 build
```

- `dist/`를 새로 만든다.
- 포함되는 것: `index.html`, `src/`, `assets/tiles/b2/`, `assets/fonts/`, 패/폰트 라이선스, 정적 호스팅용 보안 헤더.
- 제외되는 것: `.git`, `docs`, `outputs`, `tests`, `work`.

`npm`이 설치된 환경이나 배포 서비스에서는 `npm run build`를 써도 된다.

## PC에서만 확인

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 preview
```

브라우저에서 `http://127.0.0.1:4173/`로 연다.

## 같은 와이파이 모바일에서 확인

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 preview-lan
```

터미널에 `LAN: http://...:4173` 형식의 주소가 출력된다. 휴대폰이 같은 와이파이에 있으면 그 주소로 접속한다.

Windows 방화벽이 Node.js 접근을 물으면 개인 네트워크에서 허용해야 한다.

## 아무데서나 접속 가능하게 배포

현재는 GitHub Actions가 `main` push 때 `npm test`, `npm run build`를 실행하고,
생성된 `dist/`를 `gh-pages` 브랜치로 배포한다. GitHub Pages는 `dist/_headers`를
적용하지 않으므로 공개 사이트의 CSP/Referrer 정책은 `index.html`의 meta 태그가
담당한다.
빌드 결과가 기존 `gh-pages` 내용과 같으면 브랜치 푸시는 건너뛰어 불필요한 Pages
재배포를 만들지 않는다.

수동 배포가 필요하면 GitHub Actions의 `Deploy static site` 워크플로를 직접 실행한다.

다른 정적 호스팅 서비스로 옮기는 경우 권장 설정:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: 없음

## 고정 URL이 필요한 경우

`trycloudflare.com` Quick Tunnel은 계정 없이 바로 쓸 수 있지만, 새로 켤 때마다 랜덤 주소가 만들어지는 임시 터널이다.
현재는 GitHub Pages 고정 URL을 사용한다. 별도 도메인이 필요하면 아래 둘 중 하나로 바꾼다.

1. 정적 호스팅 배포
   - Cloudflare Pages, GitHub Pages, Netlify, Vercel 중 하나에 `dist`를 배포한다.
   - 권장: Cloudflare Pages.
   - 필요한 것: 배포 서비스 로그인 권한.
   - Build command: `npm run build`
   - Output directory: `dist`

2. Cloudflare named tunnel
   - 개인 도메인 또는 Cloudflare에 등록된 도메인의 서브도메인을 `localhost`로 연결한다.
   - 필요한 것: Cloudflare 로그인, 등록된 도메인, `cloudflared tunnel login`으로 생성되는 `cert.pem`.

GitHub Pages URL이 아닌 별도 도메인이 필요할 때만 외부 계정/도메인 설정을 추가로 진행한다.

## 보안 메모

- 공유 링크 상태는 URL의 `#s=` 뒤 fragment에 들어간다. fragment는 일반 HTTP 요청으로 서버에 전송되지 않는다.
- 정적 산출물에는 개발용 문서, 테스트, 작업 파일을 넣지 않는다.
- 로컬 프리뷰 서버도 `dist`만 서빙하고, 기본 보안 헤더를 붙인다.
- Cloudflare Pages나 Netlify처럼 `_headers` 파일을 지원하는 호스팅에서는 `dist/_headers`가 추가 보안 헤더를 제공한다.
- GitHub Pages는 커스텀 응답 헤더를 직접 지정할 수 없으므로, 응답 헤더까지 엄격히 통제해야 한다면 Cloudflare Pages 같은 호스팅으로 옮긴다.
