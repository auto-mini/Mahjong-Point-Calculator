# 배포 준비 메모

이 앱은 백엔드 없이 동작하는 정적 웹앱이다. 완성 전에는 실제 배포하지 않고, 아래 명령으로 로컬/모바일 확인만 진행한다.

## 산출물 생성

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1 build
```

- `dist/`를 새로 만든다.
- 포함되는 것: `index.html`, `src/`, `assets/tiles/b2/`, 패 라이선스, 정적 호스팅용 보안 헤더.
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

## 나중에 아무데서나 접속 가능하게 배포

Cloudflare Pages 기준 권장 설정:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: 없음

GitHub Pages, Netlify, Vercel도 같은 방식으로 `dist`를 정적 산출물로 배포하면 된다.

## 고정 URL이 필요한 경우

현재 사용하는 `trycloudflare.com` Quick Tunnel은 계정 없이 바로 쓸 수 있지만, 새로 켤 때마다 랜덤 주소가 만들어지는 임시 터널이다. 고정 URL로 바꾸려면 아래 둘 중 하나가 필요하다.

1. 정적 호스팅 배포
   - Cloudflare Pages, GitHub Pages, Netlify, Vercel 중 하나에 `dist`를 배포한다.
   - 권장: Cloudflare Pages.
   - 필요한 것: 배포 서비스 로그인 권한.
   - Build command: `npm run build`
   - Output directory: `dist`

2. Cloudflare named tunnel
   - 개인 도메인 또는 Cloudflare에 등록된 도메인의 서브도메인을 `localhost`로 연결한다.
   - 필요한 것: Cloudflare 로그인, 등록된 도메인, `cloudflared tunnel login`으로 생성되는 `cert.pem`.

이 저장소 안의 준비 작업만으로는 고정 공개 URL을 완성할 수 없다. 외부 계정/도메인 권한이 생기면 위 설정으로 진행한다.

## 보안 메모

- 공유 링크 상태는 URL의 `#s=` 뒤 fragment에 들어간다. fragment는 일반 HTTP 요청으로 서버에 전송되지 않는다.
- 정적 산출물에는 개발용 문서, 테스트, 작업 파일을 넣지 않는다.
- 로컬 프리뷰 서버도 `dist`만 서빙하고, 기본 보안 헤더를 붙인다.
