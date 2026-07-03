# 폰트 시안 메모 v2

작성일: 2026-07-04

## 확정

- 패 스타일은 B2로 고정한다.
- 폰트는 Wanted Sans로 고정한다.
- 앱 구현 시 외부 CDN을 쓰지 않고 폰트 파일을 앱에 번들링한다.

## 비교한 폰트

### SUIT

- 라이선스: SIL Open Font License.
- 장점: 버튼, 라벨, 결과 숫자의 균형이 좋다.
- 단점: 개성은 약하다.
- 판단: 기본 추천 후보.
- 출처: https://github.com/sun-typeface/SUIT

### Pretendard

- 라이선스: SIL Open Font License.
- 장점: 국내 웹/앱에서 익숙하고 가장 무난하다.
- 단점: 흔해서 앱의 인상이 평범해질 수 있다.
- 판단: 무난함이 우선이면 좋은 후보.
- 출처: https://github.com/orioncactus/pretendard

### Wanted Sans

- 라이선스: SIL Open Font License.
- 장점: 제목과 점수 표시가 또렷하고 약간 더 세련돼 보인다.
- 단점: 작은 설명문에서는 SUIT보다 조금 강하게 보일 수 있다.
- 판단: 현재 가장 눈에 띄는 대안 후보.
- 출처: https://github.com/wanteddev/wanted-sans

### Spoqa Han Sans Neo

- 라이선스: SIL Open Font License.
- 장점: 서비스 UI 느낌이 안정적이다.
- 단점: 결과 점수와 버튼 라벨에서 힘이 약하다.
- 판단: 나쁘지 않지만 상위 후보는 아니다.
- 출처: https://spoqa.github.io/spoqa-han-sans/en-US/

### Noto Sans CJK KR

- 라이선스: SIL Open Font License.
- 장점: 안정성과 범용성이 좋다.
- 단점: 기본 시스템 UI처럼 보여 앱 인상이 약하다.
- 판단: 폴백 폰트로는 좋지만 메인 폰트로는 보류.
- 출처: https://github.com/notofonts/noto-cjk

### Gmarket Sans

- 라이선스: SIL Open Font License.
- 장점: 개성이 강하고 큰 제목은 잘 보인다.
- 단점: 계산기 UI 본문과 작은 라벨에는 과하게 튄다.
- 판단: 메인 UI 폰트로는 보류.
- 출처: https://corp.gmarket.com/fonts/

## 최종 결정

Wanted Sans를 사용한다.

결정 이유:

- 결과 점수와 제목이 또렷하다.
- B2 타일의 녹색 측면과 함께 봤을 때 앱 인상이 가장 선명하다.
- Pretendard보다 덜 평범하고, Gmarket Sans보다 덜 튄다.

## 최신 시안

- 전체 비교: `font-ui-comparison-v2.png`
- 모바일 확대 후보: `font-mobile-shortlist-v2.png`
