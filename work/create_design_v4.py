from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

from create_design_v3 import (
    OUTPUTS,
    MAN,
    PIN,
    SOU,
    RED,
    HONORS,
    card,
    checkbox,
    button,
    draw_text,
    empty_slot,
    font,
    paste_tile,
    radio,
    center,
    tile_chip,
)


def phone(draw, x, y, w, h, palette):
    draw.rounded_rectangle((x, y, x + w, y + h), radius=36, fill=palette["frame"])
    draw.rounded_rectangle((x + 12, y + 18, x + w - 12, y + h - 18), radius=28, fill=palette["bg"])


def draw_compact_tile_grid(base, draw, x, y, palette):
    rows = [
        ("만수", MAN + [RED[0]]),
        ("통수", PIN + [RED[1]]),
        ("삭수", SOU + [RED[2]]),
        ("자패", HONORS),
    ]
    cy = y
    for label, tiles in rows:
        draw_text(draw, (x, cy + 6), label, 13, palette["muted"], True)
        gx = x + 46
        for i, (filename, _name) in enumerate(tiles):
            paste_tile(base, gx + i * 29, cy, filename, 0.2, "jade")
        cy += 43
    return cy


def phone_title(draw, x, y, title, palette):
    draw_text(draw, (x + 28, y + 40), title, 22, palette["text"], True)


def draw_wireframe_v4():
    p = {
        "frame": "#1b252b",
        "bg": "#edf4f7",
        "surface": "#ffffff",
        "line": "#cbd7dd",
        "text": "#16242b",
        "muted": "#64737a",
        "selected": "#256b7f",
        "button": "#ffffff",
    }
    img = Image.new("RGB", (1420, 1160), "#e6eef1")
    d = ImageDraw.Draw(img)
    draw_text(d, (38, 28), "수정 와이어프레임 v4", 34, p["text"], True)
    draw_text(d, (38, 72), "37종 전체 노출, 장풍/자풍 분리, 후보는 선택 패 기반, 후로 체크박스 1개, 도라/우라 5칸.", 17, p["muted"])

    phone(d, 48, 104, 410, 1012, p)
    phone_title(d, 48, 104, "입력", p)
    sx, sy = 78, 188

    card(d, (sx, sy, sx + 350, sy + 96), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "화료", 16, p["text"], True)
    button(d, (sx + 14, sy + 44, sx + 116, sy + 80), "론", True, p)
    button(d, (sx + 128, sy + 44, sx + 230, sy + 80), "쯔모", False, p)

    sy += 112
    card(d, (sx, sy, sx + 350, sy + 132), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "장풍", 16, p["text"], True)
    for i, label in enumerate(["동", "남", "서", "북"]):
        radio(d, sx + 18 + i * 78, sy + 48, label, i == 0, p)
    draw_text(d, (sx + 14, sy + 82), "자풍", 16, p["text"], True)
    for i, label in enumerate(["동", "남", "서", "북"]):
        radio(d, sx + 18 + i * 78, sy + 108, label, i == 2, p)

    sy += 148
    card(d, (sx, sy, sx + 350, sy + 92), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "현재 손패", 16, p["text"], True)
    cx = sx + 14
    for filename in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png", "Ton.png"]:
        paste_tile(img, cx, sy + 42, filename, 0.25, "jade")
        cx += 38

    sy += 108
    card(d, (sx, sy, sx + 350, sy + 242), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "패 선택", 16, p["text"], True)
    draw_compact_tile_grid(img, d, sx + 14, sy + 44, p)

    sy += 258
    card(d, (sx, sy, sx + 350, sy + 94), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "선택한 패", 16, p["text"], True)
    paste_tile(img, sx + 18, sy + 42, "Man3.png", 0.3, "jade")
    draw_text(d, (sx + 76, sy + 52), "3만을 포함하는 후보 보기", 15, p["muted"])

    phone(d, 504, 104, 410, 1012, p)
    phone_title(d, 504, 104, "후보/도라", p)
    sx2, sy2 = 534, 188

    card(d, (sx2, sy2, sx2 + 350, sy2 + 244), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "몸통/머리 후보", 16, p["text"], True)
    rows = [
        (["Man1.png", "Man2.png", "Man3.png"], "123만", True),
        (["Man2.png", "Man3.png", "Man4.png"], "234만", False),
        (["Man3.png", "Man4.png", "Man5.png"], "345만", False),
        (["Man3.png", "Man3.png"], "33만 머리", False),
        (["Man3.png", "Man3.png", "Man3.png"], "333만", False),
    ]
    yrow = sy2 + 46
    for tiles, label, selected in rows:
        w = tile_chip(img, d, sx2 + 14, yrow, tiles, p, selected=selected)
        center(d, (sx2 + 14 + w + 12, yrow, sx2 + 334, yrow + 48), label, 14, p["text"], selected)
        yrow += 38

    sy2 += 260
    card(d, (sx2, sy2, sx2 + 350, sy2 + 98), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "선택 후보 옵션", 16, p["text"], True)
    checkbox(d, sx2 + 18, sy2 + 54, "후로", False, p)
    button(d, (sx2 + 238, sy2 + 44, sx2 + 332, sy2 + 82), "추가", True, p)

    sy2 += 114
    card(d, (sx2, sy2, sx2 + 350, sy2 + 158), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "도라/우라 입력 전 확인", 16, p["text"], True)
    draw_text(d, (sx2 + 14, sy2 + 46), "마지막 깡 직후에 화료했나요?", 15, p["text"], True)
    button(d, (sx2 + 14, sy2 + 82, sx2 + 118, sy2 + 118), "예", False, p)
    button(d, (sx2 + 130, sy2 + 82, sx2 + 234, sy2 + 118), "아니오", True, p)
    draw_text(d, (sx2 + 14, sy2 + 132), "도라 표시패를 순서대로 모두 입력하세요.", 13, p["muted"])

    sy2 += 174
    card(d, (sx2, sy2, sx2 + 350, sy2 + 142), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "도라 표시패", 16, p["text"], True)
    for i in range(5):
        empty_slot(d, sx2 + 18 + i * 64, sy2 + 50, str(i + 1), p)

    sy2 += 158
    card(d, (sx2, sy2, sx2 + 350, sy2 + 142), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "우라 표시패", 16, p["text"], True)
    for i in range(5):
        empty_slot(d, sx2 + 18 + i * 64, sy2 + 50, str(i + 1), p)

    phone(d, 960, 104, 410, 1012, p)
    phone_title(d, 960, 104, "결과", p)
    sx3, sy3 = 990, 188
    d.rounded_rectangle((sx3, sy3, sx3 + 350, sy3 + 136), radius=16, fill=p["selected"])
    draw_text(d, (sx3 + 20, sy3 + 18), "자 론", 18, "#dff4ed", True)
    draw_text(d, (sx3 + 20, sy3 + 52), "7700점", 46, "#ffffff", True)
    draw_text(d, (sx3 + 20, sy3 + 108), "3판 40부", 18, "#dff4ed", True)

    sy3 += 156
    card(d, (sx3, sy3, sx3 + 350, sy3 + 158), p["surface"], p["line"])
    draw_text(d, (sx3 + 14, sy3 + 12), "역 / 도라", 16, p["text"], True)
    for i, tag in enumerate(["리치", "탕야오", "핑후", "도라 1"]):
        x = sx3 + 16 + (i % 2) * 158
        y = sy3 + 50 + (i // 2) * 42
        d.rounded_rectangle((x, y, x + 142, y + 32), radius=16, fill="#eef4f6", outline="#d6e0e5")
        center(d, (x, y, x + 142, y + 32), tag, 14, p["text"], True)

    sy3 += 174
    card(d, (sx3, sy3, sx3 + 350, sy3 + 168), p["surface"], p["line"])
    draw_text(d, (sx3 + 14, sy3 + 12), "부수", 16, p["text"], True)
    for idx, line in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 → 40부"]):
        draw_text(d, (sx3 + 20, sy3 + 48 + idx * 28), line, 15, p["text"] if idx == 3 else p["muted"], idx == 3)

    sy3 += 184
    card(d, (sx3, sy3, sx3 + 350, sy3 + 126), p["surface"], p["line"])
    draw_text(d, (sx3 + 14, sy3 + 12), "공유 / 기록", 16, p["text"], True)
    button(d, (sx3 + 18, sy3 + 54, sx3 + 164, sy3 + 94), "공유 링크", False, p)
    button(d, (sx3 + 182, sy3 + 54, sx3 + 332, sy3 + 94), "기록 저장", True, p)

    img.save(OUTPUTS / "mobile-wireframes-v4.png")


def draw_reference_styles_v2():
    refs = [
        {
            "title": "A. Material 3",
            "desc": "모바일 터치/명확한 상태",
            "bg": "#edf4f7",
            "surface": "#ffffff",
            "line": "#cbd7dd",
            "selected": "#256b7f",
            "frame": "#1b252b",
            "text": "#16242b",
            "muted": "#64737a",
        },
        {
            "title": "B. Radix Themes",
            "desc": "담백한 폼/낮은 장식",
            "bg": "#f7f7f5",
            "surface": "#ffffff",
            "line": "#d8d6cf",
            "selected": "#355c52",
            "frame": "#20211f",
            "text": "#202522",
            "muted": "#6c716d",
        },
        {
            "title": "C. Carbon",
            "desc": "계산기/데이터 도구감",
            "bg": "#f4f4f4",
            "surface": "#ffffff",
            "line": "#c6c6c6",
            "selected": "#0f62fe",
            "frame": "#161616",
            "text": "#161616",
            "muted": "#6f6f6f",
        },
    ]
    img = Image.new("RGB", (1460, 1080), "#e7ecef")
    d = ImageDraw.Draw(img)
    draw_text(d, (38, 28), "레퍼런스 기반 UI 시안 v2", 34, "#172026", True)
    draw_text(d, (38, 72), "공개 디자인 시스템의 원칙만 참고. 브랜드 에셋/스크린샷 복제 없음.", 17, "#5a6970")
    for idx, p in enumerate(refs):
        x = 40 + idx * 470
        y = 116
        phone(d, x, y, 390, 920, p)
        draw_text(d, (x + 28, y + 44), p["title"], 22, p["text"], True)
        draw_text(d, (x + 28, y + 76), p["desc"], 13, p["muted"])
        sx, sy = x + 28, y + 116
        card(d, (sx, sy, sx + 334, sy + 88), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "화료", 16, p["text"], True)
        button(d, (sx + 14, sy + 44, sx + 112, sy + 78), "론", True, p)
        button(d, (sx + 124, sy + 44, sx + 222, sy + 78), "쯔모", False, p)

        sy += 104
        card(d, (sx, sy, sx + 334, sy + 104), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "장풍 / 자풍", 16, p["text"], True)
        for i, label in enumerate(["동", "남", "서", "북"]):
            radio(d, sx + 18 + i * 76, sy + 54, label, i == 0, p)

        sy += 120
        card(d, (sx, sy, sx + 334, sy + 92), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "현재 손패", 16, p["text"], True)
        cx = sx + 14
        for filename in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"]:
            paste_tile(img, cx, sy + 42, filename, 0.27, "jade")
            cx += 39

        sy += 108
        card(d, (sx, sy, sx + 334, sy + 126), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "선택한 패 후보", 16, p["text"], True)
        tile_chip(img, d, sx + 14, sy + 50, ["Man1.png", "Man2.png", "Man3.png"], p, selected=True)
        checkbox(d, sx + 218, sy + 62, "후로", False, p)

        sy += 144
        d.rounded_rectangle((sx, sy, sx + 334, sy + 126), radius=14, fill=p["selected"])
        draw_text(d, (sx + 18, sy + 16), "자 론", 17, "#ffffff", True)
        draw_text(d, (sx + 18, sy + 46), "7700점", 42, "#ffffff", True)
        draw_text(d, (sx + 18, sy + 98), "3판 40부", 17, "#ffffff", True)

        sy += 144
        card(d, (sx, sy, sx + 334, sy + 132), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "도라 표시패", 16, p["text"], True)
        for i in range(5):
            empty_slot(d, sx + 14 + i * 62, sy + 48, str(i + 1), p)

    img.save(OUTPUTS / "reference-ui-proposals-v2.png")


def main():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    draw_wireframe_v4()
    draw_reference_styles_v2()
    print("created v4 design assets")


if __name__ == "__main__":
    main()

