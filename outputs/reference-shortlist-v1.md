# 레퍼런스 후보 v1

작성일: 2026-07-04

## 문제 인식

이전 UI 톤 시안은 실제 제품 레퍼런스보다 팔레트 실험에 가까웠다. 그래서 화면이 기능적으로는 맞아도 실제 서비스의 디테일이 부족했고, AI가 만든 일반적인 목업처럼 보였다.

이후 시안은 아래 레퍼런스 중 2~3개를 기준으로 잡고, 화면을 복제하지 않고 원칙만 가져와 재구성한다.

## A. 직접 도메인 레퍼런스

### 1. Riichi Calc

- 링크: https://play.google.com/store/apps/details?id=ric.ov.RiichiCalc
- 참고할 점: 실제 리치마작 계산 앱의 정보 구조, 손패 입력 중심 흐름.
- 주의할 점: 시각적 완성도보다는 기능 중심이라 그대로 따라가면 앱이 낡아 보일 수 있다.

### 2. Riichi Mahjong Calculator

- 링크: https://f-droid.org/packages/io.ssttkkl.mahjongutils.app/
- GitHub: https://github.com/ssttkkl/mahjong-utils-app
- 참고할 점: 오픈소스 계산 앱의 기능 밀도, 고급 기능을 다루는 방식.
- 주의할 점: MVP는 학습/분석 앱이 아니라 빠른 부수 계산 앱이므로 기능 밀도를 낮춰야 한다.

### 3. Riichi Calculator

- 링크: https://apps.apple.com/us/app/riichi-calculator/id6464372531
- 참고할 점: App Store용 유틸 앱처럼 보이는 단순한 계산기 방향.
- 주의할 점: 일반 계산기 앱처럼 너무 밋밋해질 수 있다.

### 4. Riichi Mahjong Hand Calculator

- 링크: https://apps.apple.com/us/app/riichi-mahjong-hand-calculator/id1160349726
- 참고할 점: 빠른 손패 입력, 조건 선택, 결과 즉시 표시.
- 주의할 점: UI 자체를 베끼면 안 되고, 입력 단계 구조만 참고한다.

### 5. Riichi Tracker

- 링크: https://riichi.onecomp.one/
- 참고할 점: 실물 작탁 옆에서 쓰는 보조앱이라는 맥락, 라운드/점수/상태 표시.
- 주의할 점: 이 앱은 트래커 중심이고 우리는 부수 계산 중심이다.

### 6. Mahjong Camera

- 링크: https://www.mahjongcamera.app/
- 참고할 점: 현대적인 마작 계산 앱의 톤, 스캔/결과 중심 흐름.
- 주의할 점: 카메라/AI 인식 앱의 마케팅 느낌은 MVP에 맞지 않는다.

## B. 범용 앱 레퍼런스

### 7. Mobbin Utilities

- 링크: https://mobbin.com/explore/mobile/app-categories/utilities
- 참고할 점: 실제 출시 앱의 유틸리티 화면 패턴, 카드 밀도, 버튼 상태, 입력 플로우.
- 주의할 점: 유료/제한된 자료가 많고 화면 자체를 복제하면 안 된다.

### 8. Apple Human Interface Guidelines

- 링크: https://developer.apple.com/design/human-interface-guidelines
- 참고할 점: 모바일 가독성, 터치 영역, 정보 위계, 기본 앱처럼 보이는 디테일.
- 주의할 점: iOS 기본 앱 느낌만 따라가면 개성이 약해질 수 있다.

### 9. Material 3 Color Roles

- 링크: https://m3.material.io/styles/color/roles
- 참고할 점: 색을 의미 있게 쓰는 방식, primary/surface/error 역할 구분.
- 주의할 점: Material 냄새가 강하면 흔한 안드로이드 폼처럼 보일 수 있다.

## 1차 추천 조합

### 방향 1. 실제 마작 계산 앱 기반

- 참고: Riichi Calc + Riichi Mahjong Hand Calculator
- 결과: 가장 도메인에 맞다.
- 위험: 예쁘지는 않을 수 있다.

### 방향 2. 실작 보조앱 기반

- 참고: Riichi Tracker + Mobbin Utilities
- 결과: 실제 작탁 옆에서 쓰는 앱이라는 목적에 맞다.
- 위험: 점수/상태 추적 앱처럼 보일 수 있다.

### 방향 3. 네이티브 유틸 앱 기반

- 참고: Apple HIG + Material color roles + Mobbin Utilities
- 결과: 가장 덜 AI스럽고 실제 앱처럼 보일 가능성이 높다.
- 위험: 마작 앱 개성이 약할 수 있다.

## 다음 시안 방식

다음 UI 시안은 10개 팔레트가 아니라 3개 레퍼런스 기반으로만 만든다.

- A: Riichi Calc 계열 기능 중심
- B: Riichi Tracker 계열 실작 보조앱
- C: 네이티브 유틸 앱 계열

각 시안에는 “어떤 레퍼런스의 어떤 부분을 참고했는지”를 함께 표기한다.
