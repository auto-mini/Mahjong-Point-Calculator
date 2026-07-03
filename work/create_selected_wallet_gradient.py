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


STYLE = {
    "name": "I Wallet Gradient",
    "bg_top": "#FBF2E7",
    "bg_bottom": "#E8D0B5",
    "frame": "#1B261F",
    "card": "#F1D9B6",
    "card2": "#E8C89C",
    "control": "#FFF3E1",
    "line": "#C7A87E",
    "line_soft": "#DEC49E",
    "text": "#251F18",
    "muted": "#756753",
    "result": "#B34239",
    "result_deep": "#273F35",
    "on_result": "#FFFFFF",
    "cream_on_result": "#FFE9D7",
}


def font(size: int, weight: str = "regular"):
    path = {"regular": FONT_REG, "medium": FONT_MED, "bold": FONT_BOLD}.get(weight, FONT_REG)
    if not path.exists():
        path = Path(r"C:\Windows\Fonts\malgun.ttf")
    return ImageFont.truetype(str(path), size)


def text(draw, xy, value, size=14, fill=None, weight="regular"):
    draw.text(xy, value, font=font(size, weight), fill=fill or STYLE["text"])


def center(draw, box, value, size=14, fill=None, weight="regular"):
    f = font(size, weight)
    bbox = draw.textbbox((0, 0), value, font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - w) // 2
    y = box[1] + (box[3] - box[1] - h) // 2
    draw.text((x, y), value, font=f, fill=fill or STYLE["text"])


def rr(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def hex_rgb(value: str):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def gradient(size, top, bottom):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    tr, tg, tb = hex_rgb(top)
    br, bg, bb = hex_rgb(bottom)
    for y in range(size[1]):
        p = y / max(1, size[1] - 1)
        color = (
            int(tr * (1 - p) + br * p),
            int(tg * (1 - p) + bg * p),
            int(tb * (1 - p) + bb * p),
            255,
        )
        draw.line((0, y, size[0], y), fill=color)
    return img


def rounded_paste(base, img, box, radius):
    mask = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, img.width, img.height), radius=radius, fill=255)
    base.paste(img, box[:2], mask)


def shadow(base, box, radius, opacity=34, blur=18, offset=(0, 10), color=(55, 35, 19)):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    moved = (box[0] + offset[0], box[1] + offset[1], box[2] + offset[0], box[3] + offset[1])
    d.rounded_rectangle(moved, radius=radius, fill=(*color, opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def tile(base, x, y, name, scale=0.27):
    img = render_tile(name, "jade", scale)
    base.alpha_composite(img, (x, y))


def tile_strip(base, x, y, names, scale=0.255, gap=36):
    cx = x
    for name in names:
        tile(base, cx, y, name, scale)
        cx += gap


def section(base, draw, box, title):
    shadow(base, box, 16, opacity=14, blur=12, offset=(0, 6), color=(72, 44, 19))
    rr(draw, box, 16, STYLE["card"], STYLE["line"], 1)
    text(draw, (box[0] + 18, box[1] + 16), title, 13, STYLE["text"], "bold")


def pill(draw, box, label, selected=False, green=False):
    if selected:
        fill = STYLE["result_deep"] if green else STYLE["result"]
        line = fill
        fg = "#FFFFFF"
    else:
        fill = STYLE["control"]
        line = STYLE["line_soft"]
        fg = STYLE["text"]
    rr(draw, box, 10, fill, line, 1)
    center(draw, box, label, 12, fg, "bold")


def slot(draw, x, y):
    rr(draw, (x, y, x + 40, y + 34), 9, STYLE["control"], STYLE["line_soft"], 1)
    center(draw, (x, y - 2, x + 40, y + 32), "+", 18, STYLE["muted"], "bold")


def draw_phone(base, x, y):
    draw = ImageDraw.Draw(base)
    rr(draw, (x, y, x + 390, y + 844), 36, STYLE["frame"])
    screen_box = (x + 13, y + 18, x + 377, y + 826)
    screen = gradient((screen_box[2] - screen_box[0], screen_box[3] - screen_box[1]), STYLE["bg_top"], STYLE["bg_bottom"])
    rounded_paste(base, screen, screen_box, 28)

    text(draw, (x + 38, y + 50), "Wallet Gradient", 22, STYLE["text"], "bold")
    text(draw, (x + 38, y + 82), "I + soft gradient + stronger sections", 11, STYLE["muted"], "medium")

    shadow(base, (x + 60, y + 142, x + 330, y + 260), 20, opacity=34, blur=22, offset=(0, 18), color=(65, 40, 20))
    rr(draw, (x + 58, y + 132, x + 332, y + 252), 20, STYLE["result_deep"])
    rr(draw, (x + 40, y + 112, x + 350, y + 238), 20, STYLE["result"])
    text(draw, (x + 64, y + 134), "자 론", 15, STYLE["on_result"], "bold")
    text(draw, (x + 64, y + 166), "7700점", 43, STYLE["on_result"], "bold")
    text(draw, (x + 64, y + 216), "3판 40부", 14, STYLE["cream_on_result"], "bold")

    section(base, draw, (x + 40, y + 276, x + 350, y + 358), "화료")
    pill(draw, (x + 102, y + 314, x + 180, y + 344), "론", True)
    pill(draw, (x + 192, y + 314, x + 270, y + 344), "쯔모")

    section(base, draw, (x + 40, y + 378, x + 350, y + 476), "현재 손패")
    tile_strip(base, x + 60, y + 428, ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"], 0.255, 36)

    section(base, draw, (x + 40, y + 498, x + 350, y + 598), "3만 포함 후보")
    rr(draw, (x + 60, y + 540, x + 200, y + 576), 10, STYLE["control"], STYLE["result"], 2)
    tile_strip(base, x + 68, y + 542, ["Man1.png", "Man2.png", "Man3.png"], 0.21, 32)
    rr(draw, (x + 264, y + 548, x + 284, y + 568), 5, STYLE["control"], STYLE["result_deep"], 2)
    text(draw, (x + 294, y + 547), "후로", 12, STYLE["text"])

    section(base, draw, (x + 40, y + 620, x + 350, y + 746), "부수")
    rows = ["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]
    for i, row in enumerate(rows):
        text(draw, (x + 62, y + 662 + i * 18), row, 12, STYLE["text"] if i == 3 else STYLE["muted"], "bold" if i == 3 else "regular")

    rr(draw, (x + 40, y + 764, x + 350, y + 810), 16, STYLE["card"], STYLE["line"], 1)
    text(draw, (x + 58, y + 778), "도라", 12, STYLE["text"], "bold")
    for i in range(5):
        slot(draw, x + 104 + i * 45, y + 770)


def draw_detail(base, x, y):
    draw = ImageDraw.Draw(base)
    text(draw, (x, y), "적용 규칙", 24, STYLE["text"], "bold")
    text(draw, (x, y + 36), "Wallet Stack의 카드 구조를 유지하고, G의 연한 화면 그라데이션과 K의 진한 구역 면을 섞음.", 15, STYLE["muted"])

    swatches = [
        ("배경 상단", STYLE["bg_top"]),
        ("배경 하단", STYLE["bg_bottom"]),
        ("구역 면", STYLE["card"]),
        ("보조 면", STYLE["card2"]),
        ("결과 카드", STYLE["result"]),
        ("그림자 카드", STYLE["result_deep"]),
    ]
    for i, (label, color) in enumerate(swatches):
        sx = x + (i % 3) * 180
        sy = y + 88 + (i // 3) * 88
        rr(draw, (sx, sy, sx + 132, sy + 48), 12, color, STYLE["line"], 1)
        text(draw, (sx, sy + 58), label, 12, STYLE["text"], "bold")
        text(draw, (sx, sy + 76), color, 11, STYLE["muted"])

    card_box = (x, y + 292, x + 540, y + 456)
    shadow(base, card_box, 18, opacity=18, blur=14, offset=(0, 8))
    rr(draw, card_box, 18, STYLE["card"], STYLE["line"], 1)
    text(draw, (x + 22, y + 314), "구역 배경 테스트", 15, STYLE["text"], "bold")
    text(draw, (x + 22, y + 340), "바깥보다 진하지만 K처럼 과하게 노랗지는 않게 낮춘 버전.", 13, STYLE["muted"])
    pill(draw, (x + 22, y + 382, x + 112, y + 416), "론", True)
    pill(draw, (x + 124, y + 382, x + 214, y + 416), "쯔모")
    rr(draw, (x + 258, y + 376, x + 408, y + 424), 12, STYLE["control"], STYLE["result_deep"], 2)
    tile_strip(base, x + 270, y + 380, ["Man1.png", "Man2.png", "Man3.png"], 0.24, 36)

    text(draw, (x, y + 520), "현재 판단", 22, STYLE["text"], "bold")
    bullets = [
        "이전 I보다 배경이 덜 평평해짐.",
        "K처럼 구역이 분리되지만 장난감 느낌은 줄임.",
        "결과 카드가 여전히 가장 먼저 보이므로 계산기 목적은 유지됨.",
    ]
    for i, row in enumerate(bullets):
        text(draw, (x, y + 560 + i * 32), f"- {row}", 15, STYLE["text"], "medium")


def make_board():
    img = Image.new("RGBA", (1260, 990), "#E4DED3")
    draw = ImageDraw.Draw(img)
    text(draw, (34, 30), "선택안: I Wallet Stack + G 배경 + K 구역감", 34, STYLE["text"], "bold")
    text(draw, (34, 76), "Wanted Sans + B2 타일 고정. 바깥은 연한 그라데이션, 각 입력 구역은 한 단계 진한 면으로 분리.", 17, STYLE["muted"])
    draw_phone(img, 54, 112)
    draw_detail(img, 510, 138)
    out = OUTPUTS / "selected-wallet-gradient-v1.png"
    img.convert("RGB").save(out, quality=95)
    return out


def make_notes():
    out = OUTPUTS / "selected-wallet-gradient-v1.md"
    out.write_text(
        "\n".join(
            [
                "# 선택안: I Wallet Stack + G 배경 + K 구역감",
                "",
                "작성일: 2026-07-04",
                "",
                "방향:",
                "",
                "- 베이스는 I Wallet Stack.",
                "- 화면 바깥/배경은 G처럼 연한 웜 그라데이션.",
                "- 입력/후보/부수/도라 구역은 K처럼 바깥보다 진한 면으로 분리.",
                "- K의 장난감 같은 강한 노랑은 낮추고, I의 따뜻한 지갑/원장 느낌은 유지.",
                "",
                "주요 색:",
                "",
                f"- bg_top: {STYLE['bg_top']}",
                f"- bg_bottom: {STYLE['bg_bottom']}",
                f"- section: {STYLE['card']}",
                f"- result: {STYLE['result']}",
                f"- deep: {STYLE['result_deep']}",
            ]
        ),
        encoding="utf-8",
    )
    return out


def main():
    OUTPUTS.mkdir(exist_ok=True)
    make_board()
    make_notes()
    print("created selected wallet gradient")


if __name__ == "__main__":
    main()
