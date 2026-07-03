from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from create_design_proposals import render_tile


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"
FONT_ROOT = ROOT / "work" / "wanted-sans" / "packages" / "wanted-sans" / "fonts" / "otf"
FONT_REG = FONT_ROOT / "WantedSans-Regular.otf"
FONT_MED = FONT_ROOT / "WantedSans-Medium.otf"
FONT_BOLD = FONT_ROOT / "WantedSans-Bold.otf"


def font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    path = {"regular": FONT_REG, "medium": FONT_MED, "bold": FONT_BOLD}.get(weight, FONT_REG)
    if not path.exists():
        path = Path(r"C:\Windows\Fonts\malgun.ttf")
    return ImageFont.truetype(str(path), size)


def text(draw: ImageDraw.ImageDraw, xy, value, size=14, fill="#172026", weight="regular"):
    draw.text(xy, value, font=font(size, weight), fill=fill)


def center(draw: ImageDraw.ImageDraw, box, value, size=14, fill="#172026", weight="regular"):
    f = font(size, weight)
    bbox = draw.textbbox((0, 0), value, font=f)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - w) // 2
    y = box[1] + (box[3] - box[1] - h) // 2
    draw.text((x, y), value, font=f, fill=fill)


def rr(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shadow(base: Image.Image, box, radius: int, color=(0, 0, 0, 28), blur=12, offset=(0, 8)):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    shifted = (box[0] + offset[0], box[1] + offset[1], box[2] + offset[0], box[3] + offset[1])
    d.rounded_rectangle(shifted, radius=radius, fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def paste_tile(base: Image.Image, x: int, y: int, name: str, scale=0.32):
    tile = render_tile(name, "jade", scale)
    base.alpha_composite(tile, (x, y))
    return tile.width, tile.height


def mix(hex_color: str, alpha_hex: str = "14"):
    return hex_color + alpha_hex


STYLES = [
    {
        "name": "01 Soft Finance",
        "ref": "Toss/Korean fintech",
        "note": "넓은 흰 면, 약한 그림자, 선명한 한 가지 액센트",
        "bg": "#F2F4F6",
        "panel": "#FFFFFF",
        "surface": "#FFFFFF",
        "surface2": "#F7F9FA",
        "line": None,
        "text": "#191F28",
        "muted": "#6B7684",
        "accent": "#3182F6",
        "accent2": "#E8F3FF",
        "result": "#3182F6",
        "on_result": "#FFFFFF",
        "radius": 18,
        "button_radius": 14,
        "shadow": "soft",
    },
    {
        "name": "02 Kakao Utility",
        "ref": "KakaoBank-like clarity",
        "note": "노랑은 결과 카드에만 쓰고 나머지는 흰색 중심",
        "bg": "#F4F5F2",
        "panel": "#FFFFFF",
        "surface": "#FFFFFF",
        "surface2": "#F8F9F6",
        "line": "#E0E2DC",
        "text": "#1E1F1C",
        "muted": "#70736B",
        "accent": "#222222",
        "accent2": "#FFF4B8",
        "result": "#FFE45C",
        "on_result": "#1E1F1C",
        "radius": 16,
        "button_radius": 13,
        "shadow": "subtle",
    },
    {
        "name": "03 Wallet Pass",
        "ref": "Apple Wallet pass stack",
        "note": "카드 한 장이 화면의 주인공처럼 보이는 방향",
        "bg": "#ECEFF3",
        "panel": "#F7F8FA",
        "surface": "#FFFFFF",
        "surface2": "#F1F3F5",
        "line": "#D8DDE4",
        "text": "#15191F",
        "muted": "#6C7480",
        "accent": "#227C68",
        "accent2": "#E6F1ED",
        "result": "#1F6E5D",
        "on_result": "#FFFFFF",
        "radius": 22,
        "button_radius": 18,
        "shadow": "card",
    },
    {
        "name": "04 Linear Light",
        "ref": "Linear precision UI",
        "note": "낮은 반경, 얇은 선, 정밀한 도구형 표면",
        "bg": "#F7F8FA",
        "panel": "#FFFFFF",
        "surface": "#FBFBFC",
        "surface2": "#F2F3F5",
        "line": "#DADDE3",
        "text": "#15171A",
        "muted": "#6E737A",
        "accent": "#2F6F64",
        "accent2": "#E7F0ED",
        "result": "#23292F",
        "on_result": "#FFFFFF",
        "radius": 8,
        "button_radius": 7,
        "shadow": "none",
    },
    {
        "name": "05 Native Sheet",
        "ref": "iOS grouped utility",
        "note": "기본 앱처럼 차분한 그룹 표면과 분리선",
        "bg": "#F2F4F7",
        "panel": "#F7F8FA",
        "surface": "#FFFFFF",
        "surface2": "#F7F8FA",
        "line": "#D9DEE5",
        "text": "#111820",
        "muted": "#6C7680",
        "accent": "#147A92",
        "accent2": "#E7F2F5",
        "result": "#147A92",
        "on_result": "#FFFFFF",
        "radius": 12,
        "button_radius": 999,
        "shadow": "none",
    },
    {
        "name": "06 Paper Tool",
        "ref": "Notion/reader utility",
        "note": "종이 같은 배경, 그림자 없음, 명확한 얇은 경계",
        "bg": "#F5F1E8",
        "panel": "#FFFCF4",
        "surface": "#FFFCF4",
        "surface2": "#F0EADD",
        "line": "#D7CEC0",
        "text": "#25231F",
        "muted": "#746E63",
        "accent": "#345F58",
        "accent2": "#E7EEE9",
        "result": "#345F58",
        "on_result": "#FFFFFF",
        "radius": 6,
        "button_radius": 6,
        "shadow": "none",
    },
    {
        "name": "07 Pro Graphite",
        "ref": "Pro tool dark UI",
        "note": "어두운 배경, 카드 경계는 선으로만 조용히 처리",
        "bg": "#101416",
        "panel": "#151B1E",
        "surface": "#1B2326",
        "surface2": "#202A2E",
        "line": "#334044",
        "text": "#F2F6F4",
        "muted": "#A2ADB0",
        "accent": "#7BD0B0",
        "accent2": "#233A35",
        "result": "#7BD0B0",
        "on_result": "#10201D",
        "radius": 9,
        "button_radius": 7,
        "shadow": "none",
    },
    {
        "name": "08 Calm Health",
        "ref": "health metrics apps",
        "note": "깨끗하고 신뢰감 있는 옅은 민트 표면",
        "bg": "#EEF5F2",
        "panel": "#FFFFFF",
        "surface": "#FFFFFF",
        "surface2": "#F3F9F6",
        "line": "#D4E1DB",
        "text": "#17231F",
        "muted": "#63736C",
        "accent": "#2D7E68",
        "accent2": "#E3F1EB",
        "result": "#2D7E68",
        "on_result": "#FFFFFF",
        "radius": 20,
        "button_radius": 16,
        "shadow": "soft",
    },
    {
        "name": "09 Utility Bluegray",
        "ref": "productivity dashboards",
        "note": "파란 회색 계열의 차분한 생산성 도구",
        "bg": "#E9EFF2",
        "panel": "#F9FBFC",
        "surface": "#FFFFFF",
        "surface2": "#EDF3F5",
        "line": "#C9D4DA",
        "text": "#152229",
        "muted": "#60717A",
        "accent": "#285766",
        "accent2": "#E1EBEF",
        "result": "#285766",
        "on_result": "#FFFFFF",
        "radius": 10,
        "button_radius": 8,
        "shadow": "subtle",
    },
    {
        "name": "10 Matte Table",
        "ref": "premium tabletop utility",
        "note": "마작 테마를 직접 쓰지 않고 재질감만 낮게 반영",
        "bg": "#1D332E",
        "panel": "#F8F5EB",
        "surface": "#FFFDF6",
        "surface2": "#EFE7D4",
        "line": "#D8D0BE",
        "text": "#20251F",
        "muted": "#6B6B60",
        "accent": "#9B4F3C",
        "accent2": "#F1DDD6",
        "result": "#9B4F3C",
        "on_result": "#FFFFFF",
        "radius": 12,
        "button_radius": 9,
        "shadow": "card",
    },
    {
        "name": "11 Monochrome Mint",
        "ref": "minimal utility apps",
        "note": "거의 흑백에 민트 선택색만 남긴 방향",
        "bg": "#F4F6F5",
        "panel": "#FFFFFF",
        "surface": "#FFFFFF",
        "surface2": "#F2F4F3",
        "line": "#D9DEDC",
        "text": "#121716",
        "muted": "#6B7370",
        "accent": "#168A6B",
        "accent2": "#E4F2ED",
        "result": "#121716",
        "on_result": "#FFFFFF",
        "radius": 4,
        "button_radius": 4,
        "shadow": "none",
    },
    {
        "name": "12 Warm Ledger",
        "ref": "finance ledger apps",
        "note": "회계/기록장 느낌의 따뜻한 금속색",
        "bg": "#F3EFE5",
        "panel": "#FFFDF8",
        "surface": "#FFFDF8",
        "surface2": "#F4EDDF",
        "line": "#D7CBB8",
        "text": "#25211A",
        "muted": "#736A5A",
        "accent": "#6B5A35",
        "accent2": "#EEE5D2",
        "result": "#6B5A35",
        "on_result": "#FFFFFF",
        "radius": 10,
        "button_radius": 8,
        "shadow": "subtle",
    },
]


def draw_component_card(base: Image.Image, draw: ImageDraw.ImageDraw, box, style):
    if style["shadow"] == "soft":
        shadow(base, box, style["radius"], (20, 32, 38, 18), 16, (0, 8))
    elif style["shadow"] == "subtle":
        shadow(base, box, style["radius"], (20, 28, 34, 14), 8, (0, 4))
    elif style["shadow"] == "card":
        shadow(base, box, style["radius"], (10, 18, 24, 32), 18, (0, 12))
    rr(draw, box, style["radius"], style["surface"], style["line"], 1 if style["line"] else 0)


def draw_button(draw, box, label, style, selected=False):
    if selected:
        fill = style["accent"]
        fg = "#FFFFFF" if style["accent"] not in ["#7BD0B0", "#FFE45C"] else "#10201D"
        line = style["accent"]
    else:
        fill = style["surface2"]
        fg = style["text"]
        line = style["line"]
    radius = min(style["button_radius"], max(1, (box[3] - box[1]) // 2))
    rr(draw, box, radius, fill, line, 1)
    center(draw, box, label, 12, fg, "bold")


def draw_slot(draw, x, y, style):
    rr(draw, (x, y, x + 36, y + 34), min(8, style["button_radius"]), style["surface"], style["line"], 1)
    center(draw, (x, y - 1, x + 36, y + 32), "+", 18, style["muted"], "bold")


def draw_style_tile(base: Image.Image, x: int, y: int, style: dict):
    draw = ImageDraw.Draw(base)
    panel = (x, y, x + 500, y + 430)
    if style["shadow"] in ["soft", "card"]:
        shadow(base, panel, 24, (20, 28, 34, 20), 18, (0, 10))
    rr(draw, panel, 24, style["panel"], style["line"], 1 if style["line"] else 0)

    text(draw, (x + 24, y + 22), style["name"], 22, style["text"], "bold")
    text(draw, (x + 24, y + 50), style["ref"], 12, style["muted"], "regular")
    text(draw, (x + 24, y + 72), style["note"], 12, style["muted"], "regular")

    # Swatches
    swatches = [style["bg"], style["panel"], style["surface"], style["surface2"], style["accent"], style["result"]]
    sx = x + 342
    for i, color in enumerate(swatches):
        rr(draw, (sx + i * 22, y + 28, sx + 18 + i * 22, y + 46), 5, color, style["line"] or "#000000", 1)

    # Result card
    result_box = (x + 24, y + 110, x + 232, y + 218)
    if style["shadow"] in ["soft", "card", "subtle"]:
        shadow(base, result_box, style["radius"], (20, 28, 34, 24), 10, (0, 6))
    rr(draw, result_box, style["radius"], style["result"], None, 0)
    text(draw, (x + 42, y + 128), "자 론", 13, style["on_result"], "bold")
    text(draw, (x + 42, y + 155), "7700점", 35, style["on_result"], "bold")
    text(draw, (x + 42, y + 196), "3판 40부", 13, style["on_result"], "bold")

    # Surface card with hand
    card_box = (x + 252, y + 110, x + 476, y + 218)
    draw_component_card(base, draw, card_box, style)
    text(draw, (x + 270, y + 126), "현재 손패", 13, style["text"], "bold")
    cx = x + 270
    for name in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png"]:
        paste_tile(base, cx, y + 154, name, 0.24)
        cx += 35

    # Buttons
    group_box = (x + 24, y + 238, x + 232, y + 326)
    draw_component_card(base, draw, group_box, style)
    text(draw, (x + 42, y + 253), "화료", 13, style["text"], "bold")
    draw_button(draw, (x + 42, y + 282, x + 122, y + 310), "론", style, True)
    draw_button(draw, (x + 132, y + 282, x + 214, y + 310), "쯔모", style, False)

    # Chips and slots
    state_box = (x + 252, y + 238, x + 476, y + 340)
    draw_component_card(base, draw, state_box, style)
    text(draw, (x + 270, y + 253), "역 / 도라", 13, style["text"], "bold")
    draw_button(draw, (x + 270, y + 280, x + 342, y + 304), "리치", style, False)
    draw_button(draw, (x + 352, y + 280, x + 434, y + 304), "도라 1", style, False)
    for i in range(4):
        draw_slot(draw, x + 270 + i * 44, y + 306, style)

    # Candidate row
    cand_box = (x + 24, y + 360, x + 476, y + 406)
    draw_component_card(base, draw, cand_box, style)
    text(draw, (x + 42, y + 374), "3만 포함 후보", 12, style["text"], "bold")
    cx = x + 145
    for name in ["Man1.png", "Man2.png", "Man3.png"]:
        paste_tile(base, cx, y + 369, name, 0.21)
        cx += 31
    rr(draw, (x + 374, y + 374, x + 392, y + 392), 4, style["surface"], style["accent"], 2)
    text(draw, (x + 400, y + 372), "후로", 12, style["text"])


def make_board(styles, filename: str, title: str):
    img = Image.new("RGBA", (1620, 1080), "#E9EEF1")
    draw = ImageDraw.Draw(img)
    text(draw, (34, 28), title, 34, "#16242B", "bold")
    text(draw, (34, 74), "Wanted Sans + B2 타일 고정. 레이아웃이 아니라 색, 면, 모서리, 선, 그림자, 버튼 질감만 비교.", 16, "#64737A")
    for i, style in enumerate(styles):
        x = 34 + (i % 3) * 528
        y = 120 + (i // 3) * 456
        # Fill local background patch so each style's canvas is visible behind cards.
        draw.rounded_rectangle((x - 8, y - 8, x + 508, y + 438), radius=28, fill=style["bg"])
        draw_style_tile(img, x, y, style)
    img.convert("RGB").save(OUTPUTS / filename)


def write_notes():
    lines = [
        "# 비주얼 스타일 타일 v1",
        "",
        "작성일: 2026-07-04",
        "",
        "목적:",
        "",
        "- 레이아웃이 아니라 시각 언어만 비교한다.",
        "- Wanted Sans와 B2 타일은 고정한다.",
        "- 카드, 버튼, 결과 카드, 패 표시, 도라 슬롯의 색/면/선/그림자를 비교한다.",
        "",
        "후보:",
        "",
    ]
    for style in STYLES:
        lines.append(f"- {style['name']}: {style['note']} ({style['ref']})")
    lines.extend(
        [
            "",
            "1차 추천:",
            "",
            "- 01 Soft Finance: 한국 모바일 앱다운 안정감이 가장 좋다.",
            "- 03 Wallet Pass: 결과 점수 카드가 앱의 중심으로 잘 보인다.",
            "- 04 Linear Light: 도구형 앱으로 가장 정밀해 보인다.",
            "- 05 Native Sheet: 출시 앱처럼 보일 가능성이 높고 과장이 적다.",
            "- 11 Monochrome Mint: 가장 덜 장식적이고 가벼운 방향.",
            "",
            "보류:",
            "",
            "- 07 Pro Graphite: 멋은 있지만 모바일 실작 중에는 어두울 수 있다.",
            "- 10 Matte Table: 분위기는 있지만 마작 테마로 과하게 읽힐 수 있다.",
            "- 12 Warm Ledger: 따뜻하지만 구식 계산기처럼 보일 위험이 있다.",
        ]
    )
    (OUTPUTS / "visual-style-tiles-v1.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    make_board(STYLES[:6], "visual-style-tiles-v1-a.png", "비주얼 스타일 타일 01-06")
    make_board(STYLES[6:], "visual-style-tiles-v1-b.png", "비주얼 스타일 타일 07-12")
    write_notes()
    print("created visual style tiles")


if __name__ == "__main__":
    main()
