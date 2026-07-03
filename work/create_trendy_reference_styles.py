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


def font(size: int, weight: str = "regular"):
    path = {"regular": FONT_REG, "medium": FONT_MED, "bold": FONT_BOLD}.get(weight, FONT_REG)
    if not path.exists():
        path = Path(r"C:\Windows\Fonts\malgun.ttf")
    return ImageFont.truetype(str(path), size)


def text(draw, xy, value, size=14, fill="#151515", weight="regular"):
    draw.text(xy, value, font=font(size, weight), fill=fill)


def center(draw, box, value, size=14, fill="#151515", weight="regular"):
    f = font(size, weight)
    bb = draw.textbbox((0, 0), value, font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    draw.text((box[0] + (box[2] - box[0] - w) // 2, box[1] + (box[3] - box[1] - h) // 2), value, font=f, fill=fill)


def rr(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shadow(base, box, radius, opacity=34, blur=18, offset=(0, 9), color=(16, 20, 24)):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    moved = (box[0] + offset[0], box[1] + offset[1], box[2] + offset[0], box[3] + offset[1])
    d.rounded_rectangle(moved, radius=radius, fill=(*color, opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def tile(base, x, y, name, scale=0.27):
    img = render_tile(name, "jade", scale)
    base.alpha_composite(img, (x, y))
    return img.width


def gradient_bg(img, top, bottom):
    d = ImageDraw.Draw(img)
    h = img.height
    t = tuple(int(top[i:i + 2], 16) for i in (1, 3, 5))
    b = tuple(int(bottom[i:i + 2], 16) for i in (1, 3, 5))
    for y in range(h):
        p = y / max(1, h - 1)
        c = tuple(int(t[i] * (1 - p) + b[i] * p) for i in range(3))
        d.line((0, y, img.width, y), fill=c)


STYLES = [
    {
        "key": "F",
        "name": "Flight Board",
        "ref": "Flighty / live-status apps",
        "note": "상태판처럼 바로 읽히는 고대비. 실작 중 한 손 사용에 제일 강함.",
        "bg": "#0E1724",
        "screen": "#101B2B",
        "surface": "#F7FAFF",
        "surface2": "#E9EEF7",
        "line": "#D7E0EC",
        "text": "#172131",
        "muted": "#687486",
        "accent": "#266CFF",
        "accent2": "#0B1220",
        "on_accent": "#FFFFFF",
        "result": "#F7FAFF",
        "on_result": "#101827",
        "radius": 18,
        "button_radius": 10,
        "frame": "#030A13",
    },
    {
        "key": "G",
        "name": "Tide Glass",
        "ref": "Tide Guide / Apple Liquid Glass",
        "note": "맑은 배경 위에 반투명 데이터 카드. 예쁘지만 과하면 iOS 26 흉내처럼 보일 수 있음.",
        "bg": "#DCEEF7",
        "bg2": "#F4E9D4",
        "screen": "#DDEFF7",
        "surface": "#FFFFFFE8",
        "surface2": "#E9F7FBE0",
        "line": "#B9CED8",
        "text": "#16313F",
        "muted": "#60727A",
        "accent": "#1E7E96",
        "accent2": "#F3B35F",
        "on_accent": "#FFFFFF",
        "result": "#FFFFFFD8",
        "on_result": "#16313F",
        "radius": 22,
        "button_radius": 14,
        "frame": "#102733",
    },
    {
        "key": "H",
        "name": "Arc Command",
        "ref": "Arc Search / Raycast command UI",
        "note": "검은 표면과 한 가지 강한 포커스. 타일 후보 선택 화면이 가장 현대적으로 보임.",
        "bg": "#111111",
        "screen": "#141414",
        "surface": "#1E1E1E",
        "surface2": "#2A2A2A",
        "line": "#383838",
        "text": "#F4F2EE",
        "muted": "#A6A19A",
        "accent": "#F0B561",
        "accent2": "#E95F4F",
        "on_accent": "#18130D",
        "result": "#F0B561",
        "on_result": "#18130D",
        "radius": 16,
        "button_radius": 10,
        "frame": "#000000",
    },
    {
        "key": "I",
        "name": "Wallet Stack",
        "ref": "Apple Wallet / Revolut / Tabby",
        "note": "결과를 결제카드처럼 크게 보여줌. 점수 계산기라는 목적이 가장 선명함.",
        "bg": "#ECE7DC",
        "screen": "#F5F1E9",
        "surface": "#FFFCF3",
        "surface2": "#EFE4D1",
        "line": "#D8C7AC",
        "text": "#211F1B",
        "muted": "#776C5B",
        "accent": "#AF3E36",
        "accent2": "#273F35",
        "on_accent": "#FFFFFF",
        "result": "#AF3E36",
        "on_result": "#FFFFFF",
        "radius": 20,
        "button_radius": 12,
        "frame": "#1B251F",
    },
    {
        "key": "J",
        "name": "Linear Utility",
        "ref": "Linear / Attio / Mercury",
        "note": "가장 성숙한 도구형. 예쁜 맛은 덜하지만 구현 후 망가질 확률이 낮음.",
        "bg": "#ECEBE7",
        "screen": "#F9F8F5",
        "surface": "#FFFFFF",
        "surface2": "#F0EFEB",
        "line": "#D7D5CE",
        "text": "#1D211E",
        "muted": "#6F716C",
        "accent": "#364D42",
        "accent2": "#89724C",
        "on_accent": "#FFFFFF",
        "result": "#29352F",
        "on_result": "#FFFFFF",
        "radius": 9,
        "button_radius": 7,
        "frame": "#202A25",
    },
    {
        "key": "K",
        "name": "Tactile Calculator",
        "ref": "(Not Boring) Calculator / tactile utilities",
        "note": "제일 개성 있음. 뉴비용 계산기에는 기억에 남지만, 과하면 장난감처럼 보임.",
        "bg": "#201B17",
        "screen": "#302820",
        "surface": "#F3D9A5",
        "surface2": "#D29A56",
        "line": "#6F4B2B",
        "text": "#21150B",
        "muted": "#6D4E31",
        "accent": "#E85B42",
        "accent2": "#2B7D78",
        "on_accent": "#FFFFFF",
        "result": "#E85B42",
        "on_result": "#FFFFFF",
        "radius": 18,
        "button_radius": 12,
        "frame": "#100D0B",
    },
]


def panel(base, draw, box, s, fill=None, raised=False):
    if raised:
        shadow(base, box, s["radius"], opacity=30, blur=20, offset=(0, 12))
    rr(draw, box, s["radius"], fill or s["surface"], s["line"], 1)


def pill(draw, box, label, s, on=False):
    fill = s["accent"] if on else s["surface2"]
    line = s["accent"] if on else s["line"]
    fg = s["on_accent"] if on else s["text"]
    rr(draw, box, s["button_radius"], fill, line, 1)
    center(draw, box, label, 12, fg, "bold")


def tile_strip(base, x, y, names, scale=0.25, gap=33):
    cx = x
    for name in names:
        tile(base, cx, y, name, scale)
        cx += gap


def draw_phone(base, x, y, s):
    draw = ImageDraw.Draw(base)
    frame = (x, y, x + 370, y + 804)
    rr(draw, frame, 34, s["frame"])
    screen = (x + 12, y + 18, x + 358, y + 786)
    if s["key"] == "G":
        temp = Image.new("RGBA", (346, 768), (0, 0, 0, 0))
        gradient_bg(temp, s["bg"], s["bg2"])
        mask = Image.new("L", temp.size, 0)
        md = ImageDraw.Draw(mask)
        md.rounded_rectangle((0, 0, temp.width, temp.height), radius=28, fill=255)
        base.paste(temp, (x + 12, y + 18), mask)
    else:
        rr(draw, screen, 28, s["screen"])

    header_color = s["text"] if s["key"] not in ["F", "H", "K"] else "#F6F2EA"
    muted_color = s["muted"] if s["key"] not in ["F", "H", "K"] else "#B8B5AD"
    text(draw, (x + 34, y + 46), f"{s['key']} {s['name']}", 21, header_color, "bold")
    text(draw, (x + 34, y + 75), s["ref"], 11, muted_color)

    if s["key"] == "F":
        draw_flight(base, x, y, s)
    elif s["key"] == "G":
        draw_tide(base, x, y, s)
    elif s["key"] == "H":
        draw_arc(base, x, y, s)
    elif s["key"] == "I":
        draw_wallet(base, x, y, s)
    elif s["key"] == "J":
        draw_linear(base, x, y, s)
    else:
        draw_tactile(base, x, y, s)


def draw_flight(base, x, y, s):
    draw = ImageDraw.Draw(base)
    panel(base, draw, (x + 30, y + 112, x + 340, y + 250), s, "#F7FAFF", True)
    text(draw, (x + 52, y + 134), "자 론", 15, s["muted"], "bold")
    text(draw, (x + 52, y + 164), "7700점", 43, s["text"], "bold")
    rr(draw, (x + 244, y + 134, x + 316, y + 206), 18, s["accent"])
    center(draw, (x + 244, y + 132, x + 316, y + 194), "40", 30, "#FFFFFF", "bold")
    center(draw, (x + 244, y + 180, x + 316, y + 212), "부", 13, "#DDE8FF", "bold")
    text(draw, (x + 54, y + 220), "3판 · 멘젠 론 · 리치", 13, s["muted"], "medium")

    panel(base, draw, (x + 30, y + 274, x + 340, y + 360), s, "#F7FAFF")
    text(draw, (x + 48, y + 292), "조건", 13, s["text"], "bold")
    pill(draw, (x + 48, y + 322, x + 128, y + 348), "론", s, True)
    pill(draw, (x + 138, y + 322, x + 218, y + 348), "쯔모", s)
    pill(draw, (x + 246, y + 322, x + 316, y + 348), "자", s, True)

    panel(base, draw, (x + 30, y + 382, x + 340, y + 476), s, "#F7FAFF")
    text(draw, (x + 48, y + 400), "현재 손패", 13, s["text"], "bold")
    tile_strip(base, x + 48, y + 432, ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"], 0.265, 36)

    panel(base, draw, (x + 30, y + 498, x + 340, y + 586), s, "#F7FAFF")
    text(draw, (x + 48, y + 516), "후보", 13, s["text"], "bold")
    rr(draw, (x + 48, y + 546, x + 190, y + 574), 9, "#EEF3FA", s["accent"], 2)
    tile_strip(base, x + 56, y + 547, ["Man1.png", "Man2.png", "Man3.png"], 0.19, 31)
    rr(draw, (x + 255, y + 551, x + 275, y + 571), 4, "#FFFFFF", s["accent"], 2)
    text(draw, (x + 284, y + 550), "후로", 12, s["text"])

    panel(base, draw, (x + 30, y + 608, x + 340, y + 742), s, "#F7FAFF")
    text(draw, (x + 48, y + 626), "부수", 13, s["text"], "bold")
    for i, row in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]):
        text(draw, (x + 50, y + 652 + i * 18), row, 12, s["text"] if i == 3 else s["muted"], "bold" if i == 3 else "regular")
    rr(draw, (x + 224, y + 650, x + 318, y + 718), 14, "#EEF3FA", "#D7E0EC", 1)
    center(draw, (x + 224, y + 650, x + 318, y + 686), "도라", 12, s["muted"], "bold")
    center(draw, (x + 224, y + 678, x + 318, y + 720), "+1", 25, s["accent"], "bold")


def draw_tide(base, x, y, s):
    draw = ImageDraw.Draw(base, "RGBA")
    panel(base, draw, (x + 30, y + 112, x + 340, y + 262), s, s["result"], True)
    text(draw, (x + 52, y + 132), "자 론", 15, s["text"], "bold")
    text(draw, (x + 52, y + 164), "7700점", 43, s["text"], "bold")
    for i in range(0, 260, 26):
        yy = y + 236 - int(24 * __import__("math").sin(i / 32))
        draw.line((x + 54 + i, yy, x + 80 + i, yy - 4), fill=s["accent"], width=3)
    text(draw, (x + 52, y + 224), "3판 40부", 14, s["muted"], "bold")

    panel(base, draw, (x + 30, y + 282, x + 340, y + 356), s, s["surface"])
    text(draw, (x + 48, y + 300), "화료", 13, s["text"], "bold")
    pill(draw, (x + 100, y + 298, x + 178, y + 328), "론", s, True)
    pill(draw, (x + 188, y + 298, x + 270, y + 328), "쯔모", s)

    panel(base, draw, (x + 30, y + 378, x + 340, y + 506), s, s["surface"])
    text(draw, (x + 48, y + 396), "패 선택", 13, s["text"], "bold")
    rows = [
        ["Man1.png", "Man2.png", "Man3.png", "Man4.png", "Man5-Dora.png", "Man6.png", "Man7.png"],
        ["Pin1.png", "Pin2.png", "Pin3.png", "Pin4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png"],
        ["Ton.png", "Nan.png", "Shaa.png", "Pei.png", "Haku.png", "Hatsu.png", "Chun.png"],
    ]
    for r, row in enumerate(rows):
        tile_strip(base, x + 48, y + 428 + r * 30, row, 0.18, 36)

    panel(base, draw, (x + 30, y + 528, x + 340, y + 622), s, s["surface"])
    text(draw, (x + 48, y + 546), "3만 포함 후보", 13, s["text"], "bold")
    rr(draw, (x + 48, y + 576, x + 182, y + 608), 12, s["surface2"], s["accent"], 2)
    tile_strip(base, x + 56, y + 577, ["Man1.png", "Man2.png", "Man3.png"], 0.2, 32)
    rr(draw, (x + 254, y + 582, x + 274, y + 602), 5, "#FFFFFFCC", s["accent"], 2)
    text(draw, (x + 284, y + 581), "후로", 12, s["text"])

    panel(base, draw, (x + 30, y + 644, x + 340, y + 742), s, s["surface"])
    text(draw, (x + 48, y + 662), "도라 표시패", 13, s["text"], "bold")
    for i in range(5):
        rr(draw, (x + 50 + i * 54, y + 694, x + 90 + i * 54, y + 728), 10, "#FFFFFFB8", s["line"], 1)
        center(draw, (x + 50 + i * 54, y + 692, x + 90 + i * 54, y + 726), "+", 18, s["muted"], "bold")


def draw_arc(base, x, y, s):
    draw = ImageDraw.Draw(base)
    panel(base, draw, (x + 30, y + 112, x + 340, y + 186), s, "#1E1E1E")
    text(draw, (x + 52, y + 132), "화료패 3만", 18, s["text"], "bold")
    text(draw, (x + 52, y + 158), "후보를 선택하면 자동 분해", 12, s["muted"])

    rr(draw, (x + 30, y + 210, x + 340, y + 342), 18, s["result"])
    text(draw, (x + 54, y + 232), "자 론", 15, s["on_result"], "bold")
    text(draw, (x + 54, y + 264), "7700점", 43, s["on_result"], "bold")
    text(draw, (x + 54, y + 316), "3판 40부", 14, s["on_result"], "bold")

    panel(base, draw, (x + 30, y + 366, x + 340, y + 470), s, "#1E1E1E")
    text(draw, (x + 48, y + 386), "선택 후보", 13, s["text"], "bold")
    rr(draw, (x + 48, y + 418, x + 190, y + 454), 12, "#2B241A", s["accent"], 2)
    tile_strip(base, x + 56, y + 420, ["Man1.png", "Man2.png", "Man3.png"], 0.21, 32)
    rr(draw, (x + 255, y + 426, x + 275, y + 446), 4, "#141414", s["accent"], 2)
    text(draw, (x + 284, y + 425), "후로", 12, s["text"])

    panel(base, draw, (x + 30, y + 492, x + 340, y + 588), s, "#1E1E1E")
    text(draw, (x + 48, y + 512), "현재 손패", 13, s["text"], "bold")
    tile_strip(base, x + 48, y + 544, ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"], 0.255, 36)

    panel(base, draw, (x + 30, y + 610, x + 340, y + 742), s, "#1E1E1E")
    text(draw, (x + 48, y + 630), "부수", 13, s["text"], "bold")
    for i, row in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]):
        text(draw, (x + 50, y + 658 + i * 18), row, 12, s["text"] if i == 3 else s["muted"], "bold" if i == 3 else "regular")


def draw_wallet(base, x, y, s):
    draw = ImageDraw.Draw(base)
    shadow(base, (x + 48, y + 130, x + 318, y + 250), 22, opacity=38, blur=24, offset=(0, 18), color=(70, 42, 25))
    rr(draw, (x + 48, y + 130, x + 318, y + 250), 22, s["accent2"])
    rr(draw, (x + 36, y + 112, x + 330, y + 238), 22, s["result"])
    text(draw, (x + 58, y + 134), "자 론", 15, s["on_result"], "bold")
    text(draw, (x + 58, y + 166), "7700점", 43, s["on_result"], "bold")
    text(draw, (x + 58, y + 216), "3판 40부", 14, "#FFE7DA", "bold")

    panel(base, draw, (x + 30, y + 276, x + 340, y + 354), s)
    text(draw, (x + 48, y + 294), "조건", 13, s["text"], "bold")
    pill(draw, (x + 100, y + 294, x + 178, y + 324), "론", s, True)
    pill(draw, (x + 188, y + 294, x + 270, y + 324), "쯔모", s)

    panel(base, draw, (x + 30, y + 376, x + 340, y + 470), s)
    text(draw, (x + 48, y + 394), "현재 손패", 13, s["text"], "bold")
    tile_strip(base, x + 48, y + 426, ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"], 0.26, 36)

    panel(base, draw, (x + 30, y + 492, x + 340, y + 586), s)
    text(draw, (x + 48, y + 510), "3만 포함 후보", 13, s["text"], "bold")
    rr(draw, (x + 48, y + 540, x + 184, y + 574), 12, "#F6EADB", s["accent"], 2)
    tile_strip(base, x + 56, y + 542, ["Man1.png", "Man2.png", "Man3.png"], 0.205, 32)
    rr(draw, (x + 254, y + 548, x + 274, y + 568), 5, s["surface"], s["accent"], 2)
    text(draw, (x + 284, y + 547), "후로", 12, s["text"])

    panel(base, draw, (x + 30, y + 608, x + 340, y + 742), s)
    text(draw, (x + 48, y + 626), "부수", 13, s["text"], "bold")
    for i, row in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]):
        text(draw, (x + 50, y + 652 + i * 18), row, 12, s["text"] if i == 3 else s["muted"], "bold" if i == 3 else "regular")


def draw_linear(base, x, y, s):
    draw = ImageDraw.Draw(base)
    panel(base, draw, (x + 30, y + 112, x + 340, y + 234), s)
    text(draw, (x + 50, y + 132), "자 론", 14, s["muted"], "bold")
    text(draw, (x + 50, y + 160), "7700점", 42, s["text"], "bold")
    rr(draw, (x + 236, y + 132, x + 314, y + 204), 8, s["result"])
    center(draw, (x + 236, y + 134, x + 314, y + 184), "40", 30, s["on_result"], "bold")
    center(draw, (x + 236, y + 180, x + 314, y + 208), "부", 12, s["on_result"], "bold")

    panel(base, draw, (x + 30, y + 256, x + 340, y + 332), s)
    text(draw, (x + 48, y + 276), "화료", 13, s["text"], "bold")
    pill(draw, (x + 102, y + 274, x + 176, y + 304), "론", s, True)
    pill(draw, (x + 188, y + 274, x + 262, y + 304), "쯔모", s)

    panel(base, draw, (x + 30, y + 354, x + 340, y + 450), s)
    text(draw, (x + 48, y + 374), "현재 손패", 13, s["text"], "bold")
    tile_strip(base, x + 48, y + 406, ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"], 0.25, 36)

    panel(base, draw, (x + 30, y + 472, x + 340, y + 568), s)
    text(draw, (x + 48, y + 492), "3만 포함 후보", 13, s["text"], "bold")
    rr(draw, (x + 48, y + 522, x + 184, y + 556), 7, s["surface2"], s["accent"], 2)
    tile_strip(base, x + 56, y + 524, ["Man1.png", "Man2.png", "Man3.png"], 0.205, 32)
    rr(draw, (x + 254, y + 530, x + 274, y + 550), 4, s["surface"], s["accent"], 2)
    text(draw, (x + 284, y + 529), "후로", 12, s["text"])

    panel(base, draw, (x + 30, y + 590, x + 340, y + 742), s)
    text(draw, (x + 48, y + 610), "부수 breakdown", 13, s["text"], "bold")
    for i, row in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]):
        y0 = y + 640 + i * 23
        draw.line((x + 48, y0 - 8, x + 318, y0 - 8), fill=s["line"], width=1)
        text(draw, (x + 50, y0), row, 12, s["text"] if i == 3 else s["muted"], "bold" if i == 3 else "regular")


def draw_tactile(base, x, y, s):
    draw = ImageDraw.Draw(base)
    shadow(base, (x + 34, y + 112, x + 336, y + 252), 22, opacity=48, blur=18, offset=(0, 12), color=(0, 0, 0))
    rr(draw, (x + 34, y + 112, x + 336, y + 252), 22, s["result"])
    text(draw, (x + 58, y + 134), "자 론", 15, s["on_result"], "bold")
    text(draw, (x + 58, y + 166), "7700점", 44, s["on_result"], "bold")
    rr(draw, (x + 246, y + 132, x + 314, y + 214), 18, "#FFCF66")
    center(draw, (x + 246, y + 136, x + 314, y + 192), "40", 30, "#23150C", "bold")
    center(draw, (x + 246, y + 184, x + 314, y + 214), "부", 12, "#23150C", "bold")

    panel(base, draw, (x + 30, y + 278, x + 340, y + 354), s, "#F3D9A5")
    text(draw, (x + 48, y + 298), "화료", 13, s["text"], "bold")
    pill(draw, (x + 102, y + 294, x + 176, y + 326), "론", s, True)
    pill(draw, (x + 188, y + 294, x + 262, y + 326), "쯔모", s)

    panel(base, draw, (x + 30, y + 376, x + 340, y + 472), s, "#F3D9A5")
    text(draw, (x + 48, y + 396), "현재 손패", 13, s["text"], "bold")
    tile_strip(base, x + 48, y + 428, ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"], 0.26, 36)

    panel(base, draw, (x + 30, y + 494, x + 340, y + 594), s, "#F3D9A5")
    text(draw, (x + 48, y + 514), "3만 포함 후보", 13, s["text"], "bold")
    rr(draw, (x + 48, y + 544, x + 188, y + 580), 12, "#FFD887", s["line"], 2)
    tile_strip(base, x + 56, y + 546, ["Man1.png", "Man2.png", "Man3.png"], 0.21, 32)
    rr(draw, (x + 254, y + 552, x + 274, y + 572), 5, "#F8EBCB", s["line"], 2)
    text(draw, (x + 284, y + 551), "후로", 12, s["text"])

    panel(base, draw, (x + 30, y + 616, x + 340, y + 742), s, "#F3D9A5")
    text(draw, (x + 48, y + 636), "부수", 13, s["text"], "bold")
    for i, row in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]):
        text(draw, (x + 50, y + 664 + i * 18), row, 12, s["text"] if i == 3 else s["muted"], "bold" if i == 3 else "regular")


def make_mobile_board():
    img = Image.new("RGBA", (2480, 1010), "#E5E2DA")
    draw = ImageDraw.Draw(img)
    text(draw, (38, 30), "트렌디 레퍼런스 기반 후보 - 모바일 적용", 34, "#1D1D1B", "bold")
    text(draw, (38, 76), "인기 앱의 표면감/정보 밀도/상태판 감각을 마작 계산기에 맞춰 재해석. Wanted Sans + B2 타일 고정.", 17, "#6F6B62")
    for idx, s in enumerate(STYLES):
        draw_phone(img, 34 + idx * 405, 120, s)
    out = OUTPUTS / "trendy-reference-mobile-v1.png"
    img.convert("RGB").save(out, quality=95)
    return out


def make_notes():
    lines = [
        "# 트렌디 레퍼런스 기반 비주얼 후보 v1",
        "",
        "작성일: 2026-07-04",
        "",
        "이번 후보는 마작 앱 레퍼런스가 아니라 실제 인기 앱/디자인 어워드/스크린 라이브러리 쪽을 넓게 본 뒤 만든다.",
        "",
        "주요 참고:",
        "",
        "- Apple Design Awards 2026: Tide Guide, (Not Boring) Camera, Guitar Wiz 등",
        "- Mobbin: Apple Wallet, Revolut Business, Tabby, Arc Search, Brex, Attio 등 실서비스 스크린 패턴",
        "- Refero/Uiland/60fps: Flighty, Arc Search, Tide Guide 같은 실제 앱 스크린/인터랙션 사례",
        "- Muzli 2026 mobile inspiration: 최신 모바일 UI 컬렉션",
        "",
        "후보:",
        "",
    ]
    for s in STYLES:
        lines.append(f"- {s['key']} {s['name']}: {s['note']} ({s['ref']})")
    lines += [
        "",
        "현재 판단:",
        "",
        "- F Flight Board: 계산기 목적에는 가장 맞는다. 시각적으로도 전보다 훨씬 앱답다.",
        "- G Tide Glass: 예쁘게 만들 여지는 크지만, 유행을 따라간 느낌이 날 위험이 있다.",
        "- H Arc Command: 가장 트렌디하지만 어두운 테마가 실작 중 가독성에 맞는지 봐야 한다.",
        "- I Wallet Stack: 기존 10/12 취향과 목적성을 같이 만족할 가능성이 높다.",
        "- J Linear Utility: 가장 덜 망가지는 선택. 다만 인상은 약할 수 있다.",
        "- K Tactile Calculator: 개성은 강하지만 앱 목적보다 캐릭터가 앞설 수 있다.",
    ]
    out = OUTPUTS / "trendy-reference-notes-v1.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    return out


def main():
    OUTPUTS.mkdir(exist_ok=True)
    make_mobile_board()
    make_notes()
    print("created trendy reference styles")


if __name__ == "__main__":
    main()
