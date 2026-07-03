from __future__ import annotations

from PIL import Image, ImageDraw

from ui_mockup_helpers import (
    OUTPUTS,
    button,
    candidate_row,
    card,
    center,
    chip,
    dora_slots,
    fu,
    hand_row,
    phone_base,
    result_card,
    rr,
    text,
    tile,
    tile_keyboard,
    wind_grid,
    yaku_tags,
)


COMMON = {
    "surface": "#ffffff",
    "button": "#ffffff",
    "line": "#d4dde2",
    "text": "#141d22",
    "muted": "#66737a",
    "on_primary": "#ffffff",
    "on_result": "#ffffff",
}


PALETTES = {
    "fintech": {
        **COMMON,
        "bg": "#f2f6f7",
        "frame": "#172128",
        "primary": "#0f6b7a",
        "chip": "#e7f0f2",
        "chip_on": "#0f6b7a",
        "on_chip": "#ffffff",
        "result": "#0f6b7a",
        "title": "#141d22",
        "sub": "#66737a",
        "soft": "#e9f3f1",
        "accent": "#2f8b6f",
    },
    "calculator": {
        **COMMON,
        "bg": "#f7f7f3",
        "frame": "#20211f",
        "primary": "#295f57",
        "chip": "#edf1ed",
        "chip_on": "#295f57",
        "on_chip": "#ffffff",
        "result": "#1f403b",
        "title": "#1e2421",
        "sub": "#6b706c",
        "soft": "#f0eadc",
        "accent": "#b35b3f",
    },
    "wallet": {
        **COMMON,
        "bg": "#eef3ef",
        "frame": "#17211e",
        "primary": "#2b6d5f",
        "chip": "#e2eee8",
        "chip_on": "#2b6d5f",
        "on_chip": "#ffffff",
        "result": "#274f48",
        "title": "#17211e",
        "sub": "#667168",
        "soft": "#fff8ea",
        "accent": "#a86a37",
    },
    "metrics_dark": {
        **COMMON,
        "bg": "#101817",
        "surface": "#1a2423",
        "button": "#22302e",
        "line": "#344542",
        "text": "#f3f7f4",
        "muted": "#a8b7b0",
        "frame": "#050807",
        "primary": "#78c7aa",
        "on_primary": "#10201d",
        "chip": "#213630",
        "chip_on": "#78c7aa",
        "on_chip": "#10201d",
        "result": "#78c7aa",
        "on_result": "#10201d",
        "title": "#f3f7f4",
        "sub": "#a8b7b0",
        "soft": "#17211f",
        "accent": "#e4b860",
    },
    "clinical": {
        **COMMON,
        "bg": "#f4f7f5",
        "frame": "#17211f",
        "primary": "#287463",
        "chip": "#e5f0eb",
        "chip_on": "#287463",
        "on_chip": "#ffffff",
        "result": "#287463",
        "title": "#16221f",
        "sub": "#65716b",
        "soft": "#edf4f0",
        "accent": "#326f84",
    },
    "fitness": {
        **COMMON,
        "bg": "#edf2f4",
        "frame": "#172128",
        "primary": "#176b87",
        "chip": "#e3edf2",
        "chip_on": "#176b87",
        "on_chip": "#ffffff",
        "result": "#176b87",
        "title": "#162128",
        "sub": "#64737c",
        "soft": "#e8f0ec",
        "accent": "#2d8b70",
    },
    "native": {
        **COMMON,
        "bg": "#f2f5f7",
        "frame": "#1d252c",
        "primary": "#176d86",
        "chip": "#eef3f5",
        "chip_on": "#176d86",
        "on_chip": "#ffffff",
        "result": "#176d86",
        "title": "#111820",
        "sub": "#6d7780",
        "soft": "#f7fafb",
        "accent": "#317763",
    },
    "planner": {
        **COMMON,
        "bg": "#f4f1ea",
        "frame": "#20201e",
        "primary": "#345f58",
        "chip": "#edf0ea",
        "chip_on": "#345f58",
        "on_chip": "#ffffff",
        "result": "#345f58",
        "title": "#24231e",
        "sub": "#716b60",
        "soft": "#fffdf6",
        "accent": "#a76a3b",
    },
    "pro": {
        **COMMON,
        "bg": "#e9eef0",
        "frame": "#151d20",
        "primary": "#2a4a52",
        "chip": "#e0e9ec",
        "chip_on": "#2a4a52",
        "on_chip": "#ffffff",
        "result": "#2a4a52",
        "title": "#131d21",
        "sub": "#5b686e",
        "soft": "#f9fbfb",
        "accent": "#397d69",
    },
}


def header(draw: ImageDraw.ImageDraw, x, y, p, title, ref):
    text(draw, (x + 26, y + 38), title, 18, p["title"], "bold")
    text(draw, (x + 26, y + 64), ref, 10, p["sub"])


def bottom_tabs(draw, x, y, p, active=1):
    rr(draw, (x, y, x + 300, y + 50), p["surface"], p["line"], 1, 14)
    for i, label in enumerate(["입력", "계산", "기록"]):
        chip(draw, (x + 16 + i * 94, y + 13, x + 88 + i * 94, y + 35), label, p, i == active)


def metric(draw, box, title, value, p, active=False):
    fill = p["primary"] if active else p["surface"]
    fg = p["on_primary"] if active else p["text"]
    sub = p["on_primary"] if active else p["muted"]
    rr(draw, box, fill, p["line"], 1, 10)
    text(draw, (box[0] + 12, box[1] + 10), title, 11, sub, "medium")
    text(draw, (box[0] + 12, box[1] + 31), value, 21, fg, "bold")


def mini_hand(base, draw, x, y, p):
    card(draw, (x, y, x + 300, y + 68), p)
    text(draw, (x + 12, y + 10), "손패", 12, p["text"], "bold")
    cx = x + 50
    for name in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"]:
        tile(base, cx, y + 28, name, 0.22)
        cx += 31


def a1_fintech(base, draw, x, y):
    p = PALETTES["fintech"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "A1 핀테크 정산형", "금융 앱: 큰 금액 + 명확한 상태")
    sx, sy = x + 30, y + 100
    result_card(draw, sx, sy, p); sy += 132
    metric(draw, (sx, sy, sx + 142, sy + 78), "판/부", "3판 40부", p)
    metric(draw, (sx + 158, sy, sx + 300, sy + 78), "추가", "1본장", p)
    sy += 94
    mini_hand(base, draw, sx, sy, p); sy += 84
    candidate_row(base, draw, sx, sy, p); sy += 108
    yaku_tags(draw, sx, sy, p); sy += 98
    dora_slots(draw, sx, sy, p); sy += 96
    bottom_tabs(draw, sx, sy, p)


def a2_calculator(base, draw, x, y):
    p = PALETTES["calculator"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "A2 계산기 폼형", "계산/견적 앱: 입력 폼 + 결과")
    sx, sy = x + 30, y + 100
    card(draw, (sx, sy, sx + 300, sy + 104), p)
    text(draw, (sx + 14, sy + 12), "조건", 13, p["text"], "bold")
    button(draw, (sx + 14, sy + 42, sx + 108, sy + 70), "론", p, True)
    button(draw, (sx + 118, sy + 42, sx + 212, sy + 70), "쯔모", p)
    chip(draw, (sx + 14, sy + 76, sx + 96, sy + 96), "장풍 동", p, True)
    chip(draw, (sx + 106, sy + 76, sx + 188, sy + 96), "자풍 서", p)
    sy += 120
    hand_row(base, draw, sx, sy, p); sy += 108
    candidate_row(base, draw, sx, sy, p); sy += 110
    dora_slots(draw, sx, sy, p); sy += 94
    result_card(draw, sx, sy, p); sy += 132
    fu(draw, sx, sy, p)


def a3_wallet(base, draw, x, y):
    p = PALETTES["wallet"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "A3 월렛 카드형", "지갑 앱: 카드 스택 + 짧은 액션")
    sx, sy = x + 30, y + 100
    rr(draw, (sx, sy, sx + 300, sy + 138), p["soft"], p["line"], 1, 14)
    text(draw, (sx + 18, sy + 16), "이번 계산", 14, p["text"], "bold")
    text(draw, (sx + 18, sy + 48), "7700점", 40, p["text"], "bold")
    text(draw, (sx + 18, sy + 102), "자 론 · 3판 40부", 14, p["muted"], "medium")
    sy += 156
    mini_hand(base, draw, sx, sy, p); sy += 84
    wind_grid(draw, sx, sy, p); sy += 98
    candidate_row(base, draw, sx, sy, p); sy += 110
    yaku_tags(draw, sx, sy, p); sy += 98
    bottom_tabs(draw, sx, sy, p)


def b1_metrics_dark(base, draw, x, y):
    p = PALETTES["metrics_dark"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "B1 메트릭 다크", "건강/측정 앱: 핵심 수치 카드")
    sx, sy = x + 30, y + 100
    metric(draw, (sx, sy, sx + 300, sy + 110), "최종 점수", "7700점", p, True); sy += 128
    metric(draw, (sx, sy, sx + 142, sy + 78), "판수", "3판", p)
    metric(draw, (sx + 158, sy, sx + 300, sy + 78), "부수", "40부", p)
    sy += 94
    mini_hand(base, draw, sx, sy, p); sy += 84
    candidate_row(base, draw, sx, sy, p); sy += 110
    yaku_tags(draw, sx, sy, p); sy += 98
    fu(draw, sx, sy, p)


def b2_clinical(base, draw, x, y):
    p = PALETTES["clinical"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "B2 클리니컬 폼", "헬스케어 앱: 신뢰감 있는 단계 입력")
    sx, sy = x + 30, y + 100
    card(draw, (sx, sy, sx + 300, sy + 78), p, p["soft"])
    text(draw, (sx + 14, sy + 13), "계산 준비", 13, p["text"], "bold")
    text(draw, (sx + 14, sy + 40), "손패와 조건을 확인한 뒤 결과를 계산합니다.", 12, p["muted"])
    sy += 96
    hand_row(base, draw, sx, sy, p); sy += 108
    wind_grid(draw, sx, sy, p); sy += 98
    candidate_row(base, draw, sx, sy, p); sy += 110
    dora_slots(draw, sx, sy, p); sy += 94
    result_card(draw, sx, sy, p)


def b3_fitness(base, draw, x, y):
    p = PALETTES["fitness"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "B3 피트니스 요약형", "운동 앱: 요약 + 세부 기록")
    sx, sy = x + 30, y + 100
    card(draw, (sx, sy, sx + 300, sy + 116), p)
    text(draw, (sx + 16, sy + 14), "오늘의 화료", 14, p["text"], "bold")
    metric(draw, (sx + 16, sy + 44, sx + 140, sy + 96), "점수", "7700", p, True)
    metric(draw, (sx + 154, sy + 44, sx + 284, sy + 96), "기준", "3판40부", p)
    sy += 134
    mini_hand(base, draw, sx, sy, p); sy += 84
    tile_keyboard(base, draw, sx, sy, p); sy += 162
    candidate_row(base, draw, sx, sy, p); sy += 110
    yaku_tags(draw, sx, sy, p); sy += 98
    fu(draw, sx, sy, p)


def c1_native(base, draw, x, y):
    p = PALETTES["native"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "C1 네이티브 유틸", "iOS/Android 기본 앱: 그룹 리스트")
    sx, sy = x + 30, y + 100
    result_card(draw, sx, sy, p, True); sy += 112
    for title, labels in [("화료", ["론", "쯔모"]), ("바람", ["동장", "서가"]), ("상황", ["리치", "일발"])]:
        card(draw, (sx, sy, sx + 300, sy + 78), p)
        text(draw, (sx + 14, sy + 12), title, 13, p["text"], "bold")
        for i, label in enumerate(labels):
            chip(draw, (sx + 18 + i * 132, sy + 42, sx + 126 + i * 132, sy + 64), label, p, i == 0)
        sy += 90
    hand_row(base, draw, sx, sy, p, compact=True); sy += 92
    candidate_row(base, draw, sx, sy, p); sy += 108
    dora_slots(draw, sx, sy, p)


def c2_planner(base, draw, x, y):
    p = PALETTES["planner"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "C2 플래너 단계형", "생산성 앱: 작업 흐름과 체크")
    sx, sy = x + 30, y + 100
    card(draw, (sx, sy, sx + 300, sy + 126), p)
    text(draw, (sx + 14, sy + 12), "입력 단계", 13, p["text"], "bold")
    steps = [("1", "조건"), ("2", "손패"), ("3", "도라")]
    for i, (num, label) in enumerate(steps):
        cx = sx + 26 + i * 92
        rr(draw, (cx, sy + 42, cx + 42, sy + 84), p["primary"] if i < 2 else p["button"], p["line"], 1, 21)
        center(draw, (cx, sy + 42, cx + 42, sy + 84), num, 16, p["on_primary"] if i < 2 else p["muted"], "bold")
        center(draw, (cx - 20, sy + 92, cx + 62, sy + 112), label, 11, p["text"], "medium")
    sy += 144
    hand_row(base, draw, sx, sy, p, compact=True); sy += 92
    candidate_row(base, draw, sx, sy, p); sy += 110
    dora_slots(draw, sx, sy, p); sy += 94
    result_card(draw, sx, sy, p); sy += 132
    yaku_tags(draw, sx, sy, p)


def c3_pro(base, draw, x, y):
    p = PALETTES["pro"]
    phone_base(draw, x, y, p); header(draw, x, y, p, "C3 프로 도구형", "생산성/데이터 앱: 밀도 높은 패널")
    sx, sy = x + 30, y + 100
    card(draw, (sx, sy, sx + 300, sy + 72), p)
    text(draw, (sx + 12, sy + 10), "요약", 13, p["text"], "bold")
    for i, label in enumerate(["론", "동장", "자 서"]):
        chip(draw, (sx + 14 + i * 88, sy + 38, sx + 84 + i * 88, sy + 60), label, p, i == 0)
    sy += 88
    result_card(draw, sx, sy, p, True); sy += 112
    hand_row(base, draw, sx, sy, p, compact=True); sy += 92
    candidate_row(base, draw, sx, sy, p); sy += 108
    fu(draw, sx, sy, p); sy += 110
    yaku_tags(draw, sx, sy, p)


def board(filename, title, subtitle, drawers):
    img = Image.new("RGB", (1240, 940), "#e9eef1")
    draw = ImageDraw.Draw(img)
    text(draw, (34, 28), title, 32, "#16242b", "bold")
    text(draw, (34, 70), subtitle, 15, "#64737a")
    for i, fn in enumerate(drawers):
        fn(img, draw, 48 + i * 396, 112)
    img.save(OUTPUTS / filename)


def write_notes():
    content = """# 범용 레퍼런스 기반 ABC 시안 v1

작성일: 2026-07-04

공통 조건:

- 폰트: Wanted Sans
- 패 스타일: B2
- 마작 앱에만 묶지 않음
- 화면/브랜드/스크린샷 복제 없음

## A. 금융/계산 유틸 기반

- A1 핀테크 정산형: 금융 앱처럼 큰 금액 카드와 명확한 상태를 우선한다.
- A2 계산기 폼형: 계산/견적 앱처럼 입력 폼과 결과를 분리한다.
- A3 월렛 카드형: 지갑 앱처럼 카드 스택과 짧은 액션을 쓴다.

## B. 건강/측정 도구 기반

- B1 메트릭 다크: 건강 앱처럼 핵심 수치를 메트릭 카드로 보여준다.
- B2 클리니컬 폼: 신뢰감 있는 단계 입력과 차분한 색을 쓴다.
- B3 피트니스 요약형: 요약 카드와 세부 기록 카드 구조를 쓴다.

## C. 생산성/네이티브 유틸 기반

- C1 네이티브 유틸: 그룹 리스트와 기본 앱 같은 구조.
- C2 플래너 단계형: 작업 단계와 체크 흐름을 강조.
- C3 프로 도구형: 밀도 높은 패널과 조용한 색.

## 추천 후보

- 가장 덜 AI스럽고 실제 앱 같은 방향: C1, C3
- 계산기 목적이 가장 분명한 방향: A1, A2
- 예쁘고 선명하지만 과하지 않은 방향: A3, B2
"""
    (OUTPUTS / "broad-reference-abc-v1.md").write_text(content, encoding="utf-8")


def main():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    board("broad-reference-abc-a.png", "A. 금융/계산 유틸 기반", "금융, 정산, 계산/견적 앱의 수치 중심 패턴을 재해석.", [a1_fintech, a2_calculator, a3_wallet])
    board("broad-reference-abc-b.png", "B. 건강/측정 도구 기반", "건강, 측정, 피트니스 앱의 메트릭/신뢰감 패턴을 재해석.", [b1_metrics_dark, b2_clinical, b3_fitness])
    board("broad-reference-abc-c.png", "C. 생산성/네이티브 유틸 기반", "네이티브 유틸, 플래너, 프로 도구의 실제 앱 패턴을 재해석.", [c1_native, c2_planner, c3_pro])
    write_notes()
    print("created broad abc concepts")


if __name__ == "__main__":
    main()
