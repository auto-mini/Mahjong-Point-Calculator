from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

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


def rr(draw: ImageDraw.ImageDraw, box, fill, outline=None, width=1, radius=8):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def tile(base: Image.Image, x: int, y: int, name: str, scale=0.3):
    img = render_tile(name, "jade", scale)
    base.paste(img, (x, y), img)
    return img.width, img.height


def button(draw, box, label, p, selected=False, small=False):
    if selected:
        fill = p["primary"]
        line = p["primary"]
        fg = p["on_primary"]
    else:
        fill = p["button"]
        line = p["line"]
        fg = p["text"]
    rr(draw, box, fill, line, 1 if small else 2, 7)
    center(draw, box, label, 11 if small else 13, fg, "bold")


def chip(draw, box, label, p, selected=False):
    fill = p["chip_on"] if selected else p["chip"]
    fg = p["on_chip"] if selected else p["text"]
    line = p["primary"] if selected else p["line"]
    rr(draw, box, fill, line, 1, 12)
    center(draw, box, label, 11, fg, "medium")


def card(draw, box, p, fill=None):
    rr(draw, box, fill or p["surface"], p["line"], 1, 8)


def phone_base(draw, x, y, p):
    rr(draw, (x, y, x + 360, y + 780), p["frame"], None, 1, 28)
    rr(draw, (x + 10, y + 16, x + 350, y + 764), p["bg"], None, 1, 22)


def hand_row(base, draw, x, y, p, title="현재 손패", compact=False):
    h = 76 if compact else 92
    card(draw, (x, y, x + 300, y + h), p)
    text(draw, (x + 12, y + 10), title, 13, p["text"], "bold")
    cx = x + 12
    scale = 0.25 if compact else 0.29
    gap = 31 if compact else 37
    for name in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"]:
        tile(base, cx, y + (34 if compact else 42), name, scale)
        cx += gap


def result_card(draw, x, y, p, compact=False):
    h = 98 if compact else 116
    rr(draw, (x, y, x + 300, y + h), p["result"], None, 1, 8)
    text(draw, (x + 16, y + 14), "자 론", 14, p["on_result"], "bold")
    text(draw, (x + 16, y + 38), "7700점", 34 if compact else 40, p["on_result"], "bold")
    text(draw, (x + 16, y + h - 26), "3판 40부", 14, p["on_result"], "bold")


def dora_slots(draw, x, y, p):
    card(draw, (x, y, x + 300, y + 78), p)
    text(draw, (x + 12, y + 10), "도라 표시패", 13, p["text"], "bold")
    for i in range(5):
        sx = x + 16 + i * 54
        rr(draw, (sx, y + 38, sx + 42, y + 66), p["button"], p["line"], 2, 6)
        center(draw, (sx, y + 35, sx + 42, y + 64), "+", 18, p["muted"], "bold")


def candidate_row(base, draw, x, y, p):
    card(draw, (x, y, x + 300, y + 92), p)
    text(draw, (x + 12, y + 10), "3만 포함 후보", 13, p["text"], "bold")
    rr(draw, (x + 12, y + 42, x + 142, y + 78), p["button"], p["primary"], 2, 7)
    cx = x + 19
    for name in ["Man1.png", "Man2.png", "Man3.png"]:
        tile(base, cx, y + 43, name, 0.21)
        cx += 32
    rr(draw, (x + 206, y + 50, x + 224, y + 68), p["button"], p["primary"], 2, 4)
    text(draw, (x + 232, y + 48), "후로", 12, p["text"])


def tile_keyboard(base, draw, x, y, p):
    card(draw, (x, y, x + 300, y + 146), p)
    text(draw, (x + 12, y + 10), "패 선택", 13, p["text"], "bold")
    rows = [
        ["Man1.png", "Man2.png", "Man3.png", "Man4.png", "Man5-Dora.png", "Man6.png", "Man7.png", "Man8.png"],
        ["Pin1.png", "Pin2.png", "Pin3.png", "Pin4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Pin8.png"],
        ["Sou1.png", "Sou2.png", "Sou3.png", "Sou4.png", "Sou5-Dora.png", "Ton.png", "Haku.png", "Chun.png"],
    ]
    for r, row in enumerate(rows):
        cx = x + 13
        for name in row:
            tile(base, cx, y + 38 + r * 34, name, 0.2)
            cx += 35


def wind_grid(draw, x, y, p):
    card(draw, (x, y, x + 300, y + 82), p)
    text(draw, (x + 12, y + 10), "장풍 / 자풍", 13, p["text"], "bold")
    for i, label in enumerate(["동", "남", "서", "북"]):
        chip(draw, (x + 14 + i * 68, y + 42, x + 70 + i * 68, y + 66), label, p, selected=i in [0, 2])


def yaku_tags(draw, x, y, p):
    card(draw, (x, y, x + 300, y + 82), p)
    text(draw, (x + 12, y + 10), "역 / 도라", 13, p["text"], "bold")
    for i, label in enumerate(["리치", "탕야오", "핑후", "도라 1"]):
        chip(draw, (x + 14 + (i % 2) * 142, y + 40 + (i // 2) * 26, x + 132 + (i % 2) * 142, y + 61 + (i // 2) * 26), label, p)


def fu(draw, x, y, p):
    card(draw, (x, y, x + 300, y + 94), p)
    text(draw, (x + 12, y + 10), "부수", 13, p["text"], "bold")
    for i, row in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]):
        text(draw, (x + 14, y + 34 + i * 16), row, 11, p["text"] if i == 3 else p["muted"], "bold" if i == 3 else "regular")
