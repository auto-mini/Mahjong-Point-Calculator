# 비주얼 레퍼런스 리서치 v1

작성일: 2026-07-04

## 사용자가 선호한 방향

이전 시안 중 10, 12번 선호:

- 따뜻한 배경
- 차갑지 않은 도구감
- 갈색/녹색/아이보리 계열
- 카드가 조금 물성 있게 보이는 방향
- 단순 흰색 카드 + 청록 버튼보다 덜 일반적인 인상

따라서 다음 시안은 마작 앱보다 아래 계열에서 가져오는 것이 맞다.

## 참고할 만한 레퍼런스

### 1. Moleskine Timepage / Actions

링크:

- https://apps.apple.com/us/app/timepage-calendar-planner/id989178902
- https://apps.apple.com/us/app/actions-to-do-list-organizer/id1227402276

가져올 점:

- 종이/카드/캘린더 감각을 디지털 UI로 옮기는 방식
- 강한 색을 전체가 아니라 상태 카드와 액션에 제한적으로 쓰는 방식
- 검정/아이보리/강한 포인트 컬러 조합
- 플랫하지만 싸 보이지 않는 면 처리

우리 앱 적용:

- 결과 카드는 강한 색 또는 따뜻한 카드로 처리
- 입력 카드들은 아이보리/먹색 계열로 낮은 대비
- 도라/패 후보 영역은 카드 더미처럼 보이게 처리 가능

### 2. Apple Wallet / Google Wallet

링크:

- https://developer.apple.com/design/human-interface-guidelines/wallet
- https://mobbin.com/explore/mobile/screens/wallet-balance

가져올 점:

- 카드 자체가 핵심 오브젝트처럼 보이는 구조
- 큰 결과 카드에 물성을 주는 방식
- 카드 가장자리, 그림자, 표면색을 세밀하게 다루는 방식

우리 앱 적용:

- `7700점` 결과 카드를 앱의 대표 오브젝트로 만든다.
- 손패/도라 입력은 보조 카드로 낮춘다.
- 10번의 “테이블 느낌”을 더 고급스럽게 정리할 수 있다.

### 3. Day One / Bear / Craft

링크:

- https://dayoneapp.com/
- https://bear.app/
- https://www.craft.do/

가져올 점:

- 따뜻한 기록장 느낌
- 노트/문서 앱 특유의 깨끗한 여백
- 얇은 구분선, 낮은 그림자, 차분한 타이포그래피

우리 앱 적용:

- 12번 Warm Ledger를 덜 구식으로 만들 수 있다.
- 카드 반경을 낮추고, 진한 갈색 대신 잉크색/웜그레이를 쓰는 방향.
- 부수 breakdown이 “원장”처럼 읽히게 만들기 좋다.

### 4. Things 3 / Fantastical

링크:

- https://www.culturedcode.com/
- https://flexibits.com/fantastical

가져올 점:

- 기능이 많아도 가벼워 보이는 네이티브 앱 질감
- 강한 테마보다 정밀한 간격/상태/분리선으로 완성도를 만드는 방식
- 모바일에서 예쁜데 과하지 않은 버튼/리스트 처리

우리 앱 적용:

- 따뜻한 색을 쓰되 “테마 앱”처럼 보이지 않게 조절한다.
- 버튼과 칩을 일반 목업 컴포넌트처럼 보이지 않게 다듬는다.

### 5. Mercury / Ramp / Wise / Monzo

링크:

- https://nicelydone.club/apps/mercury
- https://ramp.com/mobile-app
- https://wise.design/
- https://apps.apple.com/us/app/monzo-bank-mobile-banking/id1052238659

가져올 점:

- 숫자/금액/상태를 다루는 금융 앱의 신뢰감
- 정보를 많이 보여줘도 조잡하지 않게 정리하는 방식
- 카드, 필터, 승인/상태 UI의 정돈된 질감

우리 앱 적용:

- 점수 계산 앱이라 금융 앱 패턴과 궁합이 좋다.
- 10/12의 따뜻함에 금융 앱의 정돈감을 섞는 것이 안전하다.

### 6. Linear / Raycast 계열 프로 도구

링크:

- https://linear.app/now/how-we-redesigned-the-linear-ui
- https://www.raycast.com/

가져올 점:

- 모서리를 과하게 둥글리지 않는 방식
- 얇은 선, 세밀한 표면 대비, 조용한 버튼
- 도구형 앱의 고급스러운 밀도

우리 앱 적용:

- 12번이 구식으로 빠지는 걸 막는 데 좋다.
- 카드 반경은 6~10px, 그림자는 거의 없고 경계선 중심으로 간다.

## 다음 시안 후보

### A. Moleskine Ledger

- 10/12 선호를 가장 직접적으로 반영.
- 아이보리 배경 + 먹색 텍스트 + 녹색/벽돌색 포인트.
- 카드가 종이/패스처럼 보이되 과한 텍스처는 쓰지 않는다.

### B. Wallet Table

- Apple Wallet의 카드 물성과 10번의 테이블 느낌을 결합.
- 결과 카드를 가장 두껍게, 나머지 입력 카드는 얇게.
- 앱 첫인상이 가장 예쁠 가능성이 있다.

### C. Warm Native Utility

- Things 3 / Bear / Craft 쪽.
- 따뜻하지만 네이티브 앱처럼 절제.
- 오래 써도 질리지 않을 가능성이 높다.

### D. Premium Ledger Pro

- Mercury/Ramp/Linear 쪽.
- 갈색/녹색 대신 차분한 먹색, 웜그레이, 짙은 올리브.
- 가장 덜 장난감 같고 도구답다.

### E. Soft Journal Calculator

- Day One/Bear 쪽.
- 부수 breakdown과 기록 기능을 예쁘게 보여주기 좋다.
- 단점은 계산기보다 기록장처럼 보일 수 있다.

## 현재 판단

다음 시안은 10~12개가 아니라 위 5개만 만드는 것이 낫다.

특히 우선순위는:

1. Wallet Table
2. Moleskine Ledger
3. Premium Ledger Pro
4. Warm Native Utility
5. Soft Journal Calculator

이전 10/12번의 장점은 유지하되, 단순 갈색/아이보리 팔레트로 끝나지 않게 카드 물성, 선 두께, 반경, 그림자, 결과 카드의 위계를 더 정교하게 잡아야 한다.
