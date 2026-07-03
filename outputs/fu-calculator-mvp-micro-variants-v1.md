# 미세 조정 변형 20종 비교

생성 조건: 100회 연속 무개선 자체 리뷰 후 `docs/wireframe-goal.md` 지시에 따라 생성.

공통 고정:

- 기능 변경 없음.
- 플로우 변경 없음.
- 정보 구조 변경 없음.
- 색상 큰 변경 없음.
- 폰트 변경 없음.
- 타일 스타일 변경 없음.

비교 대상:

- 박스 간격.
- 카드 높이.
- 섹션 내부 여백.
- 버튼 높이.
- 하단 확인 버튼 위치.
- 현재 손패 영역 밀도.
- 후보군 영역 밀도.
- 도라/우라 슬롯에 준하는 타일 간격.

파일:

- `fu-calculator-mvp-micro-variant-01.png`: 간격/높이/버튼/밀도 조합 01.
- `fu-calculator-mvp-micro-variant-02.png`: 간격/높이/버튼/밀도 조합 02.
- `fu-calculator-mvp-micro-variant-03.png`: 간격/높이/버튼/밀도 조합 03.
- `fu-calculator-mvp-micro-variant-04.png`: 간격/높이/버튼/밀도 조합 04.
- `fu-calculator-mvp-micro-variant-05.png`: 간격/높이/버튼/밀도 조합 05.
- `fu-calculator-mvp-micro-variant-06.png`: 간격/높이/버튼/밀도 조합 06.
- `fu-calculator-mvp-micro-variant-07.png`: 간격/높이/버튼/밀도 조합 07.
- `fu-calculator-mvp-micro-variant-08.png`: 간격/높이/버튼/밀도 조합 08.
- `fu-calculator-mvp-micro-variant-09.png`: 간격/높이/버튼/밀도 조합 09.
- `fu-calculator-mvp-micro-variant-10.png`: 간격/높이/버튼/밀도 조합 10.
- `fu-calculator-mvp-micro-variant-11.png`: 간격/높이/버튼/밀도 조합 11.
- `fu-calculator-mvp-micro-variant-12.png`: 간격/높이/버튼/밀도 조합 12.
- `fu-calculator-mvp-micro-variant-13.png`: 간격/높이/버튼/밀도 조합 13.
- `fu-calculator-mvp-micro-variant-14.png`: 간격/높이/버튼/밀도 조합 14.
- `fu-calculator-mvp-micro-variant-15.png`: 간격/높이/버튼/밀도 조합 15.
- `fu-calculator-mvp-micro-variant-16.png`: 간격/높이/버튼/밀도 조합 16.
- `fu-calculator-mvp-micro-variant-17.png`: 간격/높이/버튼/밀도 조합 17.
- `fu-calculator-mvp-micro-variant-18.png`: 간격/높이/버튼/밀도 조합 18.
- `fu-calculator-mvp-micro-variant-19.png`: 간격/높이/버튼/밀도 조합 19.
- `fu-calculator-mvp-micro-variant-20.png`: 간격/높이/버튼/밀도 조합 20.

판단:

- 01-04: 가장 보수적인 밀도. 손패와 후보군이 단정하지만 스크롤 여유는 적다.
- 05-10: 버튼과 카드 높이를 키운 중간 밀도. 한 손 터치 안정성이 가장 균형적이다.
- 11-16: 섹션 간 여백을 키운 버전. 읽기는 편하지만 입력 반복 속도는 조금 느려진다.
- 17-20: 하단 버튼과 카드 높이를 가장 넉넉하게 둔 버전. 오류 상태가 많을 때 안전하지만 정보 밀도는 낮다.
- 확정 후보는 05-10 범위가 가장 현실적이다.