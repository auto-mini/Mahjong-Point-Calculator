from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"
TILES = ROOT / "work" / "riichi-mahjong-tiles" / "Export" / "Regular"


SAMPLES = [
    ("Man1.png", "1만"),
    ("Man5-Dora.png", "적5만"),
    ("Pin9.png", "9통"),
    ("Sou2.png", "2삭"),
    ("Ton.png", "동"),
    ("Haku.png", "백"),
    ("Hatsu.png", "발"),
    ("Chun.png", "중"),
]

HAND = [
    ("Man2.png", "2만"),
    ("Man3.png", "3만"),
    ("Man4.png", "4만"),
    ("Pin5-Dora.png", "적5통"),
    ("Pin6.png", "6통"),
    ("Pin7.png", "7통"),
    ("Ton.png", "동"),
    ("Ton.png", "동"),
    ("Ton.png", "동"),
]


def font(size: int, bold: bool = False):
    candidates = [
        r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\YuGothB.ttc" if bold else r"C:\Windows\Fonts\YuGothM.ttc",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def text(draw: ImageDraw.ImageDraw, xy, value: str, size=18, fill="#172026", bold=False):
    draw.text(xy, value, font=font(size, bold), fill=fill)


def centered(draw: ImageDraw.ImageDraw, box, value: str, size=16, fill="#172026", bold=False):
    f = font(size, bold)
    bbox = draw.textbbox((0, 0), value, font=f)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - w) // 2
    y = box[1] + (box[3] - box[1] - h) // 2
    draw.text((x, y), value, font=f, fill=fill)


def symbol_image(filename: str, max_w: int, max_h: int) -> Image.Image:
    if filename == "Haku.png":
        return Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
    src = Image.open(TILES / filename).convert("RGBA")
    bbox = src.getbbox()
    if bbox is None:
        return Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
    src = src.crop(bbox)
    src.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    return src


def rounded_rect_layer(size, box, radius, fill, outline=None, width=1):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    return layer


def render_tile(filename: str, variant: str, scale: float = 1.0) -> Image.Image:
    w = int(76 * scale)
    h = int(104 * scale)
    img = Image.new("RGBA", (w + int(16 * scale), h + int(18 * scale)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if variant == "ivory":
        shadow = (0, 0, 0, 52)
        side = "#d7d0c2"
        face = "#fffdf7"
        edge = "#c3c8c6"
        inner = "#edf0ed"
    elif variant == "jade":
        shadow = (12, 35, 32, 70)
        side = "#74a99a"
        face = "#fffdf5"
        edge = "#5f8d82"
        inner = "#e4eee9"
    else:
        shadow = (0, 0, 0, 90)
        side = "#c5c0ae"
        face = "#fffaf0"
        edge = "#b9b19f"
        inner = "#eadfcb"

    sx = int(8 * scale)
    sy = int(6 * scale)
    tile_box = (sx, sy, sx + w, sy + h)
    side_box = (sx + int(5 * scale), sy + int(7 * scale), sx + w + int(5 * scale), sy + h + int(7 * scale))
    shadow_box = (sx + int(6 * scale), sy + int(9 * scale), sx + w + int(6 * scale), sy + h + int(9 * scale))

    shadow_layer = rounded_rect_layer(img.size, shadow_box, int(10 * scale), shadow)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=max(1, int(2 * scale))))
    img.alpha_composite(shadow_layer)
    d.rounded_rectangle(side_box, radius=int(10 * scale), fill=side)
    d.rounded_rectangle(tile_box, radius=int(10 * scale), fill=face, outline=edge, width=max(1, int(2 * scale)))
    inset = int(8 * scale)
    d.rounded_rectangle(
        (tile_box[0] + inset, tile_box[1] + inset, tile_box[2] - inset, tile_box[3] - inset),
        radius=int(7 * scale),
        outline=inner,
        width=max(1, int(1 * scale)),
    )

    symbol = symbol_image(filename, int(44 * scale), int(62 * scale))
    px = tile_box[0] + (w - symbol.width) // 2
    py = tile_box[1] + (h - symbol.height) // 2
    img.alpha_composite(symbol, (px, py))
    return img


def make_tile_variants():
    out = Image.new("RGB", (1320, 820), "#eef3f0")
    d = ImageDraw.Draw(out)
    text(d, (34, 30), "B 기반 개선 타일 후보", 34, "#172026", True)
    text(d, (34, 72), "CC0 심볼 유지, 타일 몸체/여백/배경 대비만 개선", 18, "#506066")
    variants = [
        ("ivory", "B1 - 아이보리 베젤", "#eef3f0"),
        ("jade", "B2 - 녹색 측면 강조", "#e4eee9"),
        ("table", "B3 - 작탁 배경 대비", "#24443c"),
    ]
    y = 124
    for variant, title, bg in variants:
        d.rounded_rectangle((30, y, 1290, y + 196), radius=16, fill=bg)
        label_fill = "#f7fbf8" if variant == "table" else "#172026"
        text(d, (56, y + 20), title, 24, label_fill, True)
        x = 56
        for filename, label in SAMPLES:
            tile = render_tile(filename, variant, 1.0)
            out.paste(tile, (x, y + 62), tile)
            centered(d, (x - 6, y + 164, x + 92, y + 192), label, 16, label_fill, False)
            x += 150
        y += 224
    out.save(OUTPUTS / "tile-b-improved-variants.png")


def pill(draw, box, label, selected=False, palette=None):
    palette = palette or {}
    fill = palette.get("selected", "#143d3b") if selected else palette.get("button", "#ffffff")
    outline = palette.get("selected", "#143d3b") if selected else palette.get("line", "#cdd5d1")
    txt = "#ffffff" if selected else palette.get("text", "#243034")
    draw.rounded_rectangle(box, radius=10, fill=fill, outline=outline, width=2)
    centered(draw, box, label, 15, txt, True)


def checkbox(draw, x, y, checked=False, palette=None):
    palette = palette or {}
    line = palette.get("selected", "#143d3b")
    draw.rounded_rectangle((x, y, x + 24, y + 24), radius=5, fill="#ffffff", outline=line, width=2)
    if checked:
        draw.line((x + 6, y + 13, x + 11, y + 18, x + 19, y + 7), fill=line, width=3)


def mini_tile_row(base: Image.Image, x: int, y: int, tiles, variant="ivory", scale=0.52, gap=2):
    cx = x
    for filename, _label in tiles:
        tile = render_tile(filename, variant, scale)
        base.paste(tile, (cx, y), tile)
        cx += tile.width + gap


def draw_phone(draw, x, y, title, palette):
    draw.rounded_rectangle((x, y, x + 390, y + 760), radius=34, fill=palette["frame"])
    draw.rounded_rectangle((x + 12, y + 18, x + 378, y + 742), radius=26, fill=palette["bg"])
    text(draw, (x + 32, y + 38), title, 22, palette.get("title_text", palette["text"]), True)


def card(draw, box, title, palette):
    draw.rounded_rectangle(box, radius=10, fill=palette["surface"], outline=palette["line"], width=1)
    text(draw, (box[0] + 14, box[1] + 12), title, 17, palette["text"], True)


def draw_corrected_wireframe():
    palette = {
        "frame": "#111719",
        "bg": "#f4f7f5",
        "surface": "#ffffff",
        "line": "#d7dfdb",
        "text": "#172026",
        "selected": "#143d3b",
        "button": "#ffffff",
    }
    img = Image.new("RGB", (940, 840), "#e9efec")
    d = ImageDraw.Draw(img)
    text(d, (38, 28), "수정 와이어프레임", 30, "#172026", True)
    text(d, (38, 68), "깡 직후 질문은 도라 단계로 이동, 모든 패는 이미지, 후로는 체크박스.", 16, "#4e5b60")

    draw_phone(d, 50, 84, "입력", palette)
    sx, sy = 78, 168
    card(d, (sx, sy, sx + 334, sy + 100), "화료/장풍", palette)
    pill(d, (sx + 14, sy + 46, sx + 106, sy + 80), "론", True, palette)
    pill(d, (sx + 114, sy + 46, sx + 206, sy + 80), "쯔모", False, palette)
    pill(d, (sx + 214, sy + 46, sx + 318, sy + 80), "동장", False, palette)

    sy += 116
    card(d, (sx, sy, sx + 334, sy + 110), "현재 손패", palette)
    mini_tile_row(img, sx + 12, sy + 44, HAND[:7], "ivory", 0.42)
    mini_tile_row(img, sx + 246, sy + 44, HAND[6:9], "jade", 0.42)

    sy += 126
    card(d, (sx, sy, sx + 334, sy + 168), "패 선택", palette)
    sample_grid = [("Man1.png", "1"), ("Man2.png", "2"), ("Man3.png", "3"), ("Man4.png", "4"), ("Man5-Dora.png", "r5"), ("Pin9.png", "9"), ("Sou2.png", "2"), ("Ton.png", "동"), ("Haku.png", "백"), ("Chun.png", "중")]
    gx, gy = sx + 16, sy + 44
    for i, item in enumerate(sample_grid):
        tx = gx + (i % 5) * 62
        ty = gy + (i // 5) * 58
        tile = render_tile(item[0], "ivory", 0.35)
        img.paste(tile, (tx, ty), tile)

    sy += 184
    card(d, (sx, sy, sx + 334, sy + 126), "몸통/머리 후보", palette)
    cand1 = [("Man2.png", ""), ("Man3.png", ""), ("Man4.png", "")]
    cand2 = [("Ton.png", ""), ("Ton.png", ""), ("Ton.png", "")]
    mini_tile_row(img, sx + 16, sy + 46, cand1, "ivory", 0.36)
    checkbox(d, sx + 142, sy + 61, False, palette)
    text(d, (sx + 172, sy + 61), "후로", 15, palette["text"], False)
    mini_tile_row(img, sx + 16, sy + 86, cand2, "ivory", 0.36)
    checkbox(d, sx + 142, sy + 101, True, palette)
    text(d, (sx + 172, sy + 101), "후로", 15, palette["text"], False)

    draw_phone(d, 500, 84, "도라/결과", palette)
    sx, sy = 528, 168
    card(d, (sx, sy, sx + 334, sy + 104), "깡 직후 확인", palette)
    centered(d, (sx + 14, sy + 44, sx + 320, sy + 70), "마지막 깡 직후에 화료했나요?", 15, palette["text"], True)
    pill(d, (sx + 48, sy + 76, sx + 154, sy + 98), "아니오", True, palette)
    pill(d, (sx + 180, sy + 76, sx + 286, sy + 98), "예", False, palette)

    sy += 120
    card(d, (sx, sy, sx + 334, sy + 124), "도라 표시패", palette)
    text(d, (sx + 16, sy + 46), "도라 표시패를 순서대로 모두 입력하세요.", 14, "#455358", False)
    mini_tile_row(img, sx + 18, sy + 72, [("Pin3.png", ""), ("Sou6.png", "")], "ivory", 0.42)

    sy += 140
    d.rounded_rectangle((sx, sy, sx + 334, sy + 122), radius=10, fill="#143d3b")
    text(d, (sx + 18, sy + 16), "자 론", 17, "#dff4ed", True)
    text(d, (sx + 18, sy + 46), "7700점", 40, "#ffffff", True)
    text(d, (sx + 18, sy + 96), "3판 40부", 17, "#dff4ed", True)

    sy += 138
    card(d, (sx, sy, sx + 334, sy + 142), "역 / 부수", palette)
    for i, label in enumerate(["리치", "탕야오", "핑후", "도라 1"]):
        pill(d, (sx + 14 + (i % 2) * 154, sy + 44 + (i // 2) * 38, sx + 152 + (i % 2) * 154, sy + 76 + (i // 2) * 38), label, i == 0, palette)
    text(d, (sx + 18, sy + 118), "기본 20 + 멘젠론 10 + 간짱 2 → 40부", 13, palette["text"], False)

    img.save(OUTPUTS / "mobile-wireframes-v2.png")


def draw_ui_style_proposals():
    palettes = [
        {
            "name": "시안 1 - 차분한 계산기",
            "frame": "#111719",
            "bg": "#f4f7f5",
            "surface": "#ffffff",
            "line": "#d7dfdb",
            "text": "#172026",
            "selected": "#143d3b",
            "button": "#ffffff",
            "accent": "#143d3b",
            "tile": "ivory",
        },
        {
            "name": "시안 2 - 작탁 대비",
            "frame": "#0d1514",
            "bg": "#183d35",
            "surface": "#f7f5ec",
            "line": "#d7cfbc",
            "text": "#182320",
            "selected": "#b84135",
            "button": "#fffaf0",
            "accent": "#f7f5ec",
            "tile": "table",
            "title_text": "#f7f5ec",
        },
        {
            "name": "시안 3 - 밝은 앱형",
            "frame": "#20272b",
            "bg": "#edf3f6",
            "surface": "#ffffff",
            "line": "#cfd9df",
            "text": "#1d2a32",
            "selected": "#236c8a",
            "button": "#ffffff",
            "accent": "#236c8a",
            "tile": "jade",
        },
    ]
    img = Image.new("RGB", (1460, 880), "#e6ece9")
    d = ImageDraw.Draw(img)
    text(d, (38, 28), "UI 스타일 시안 3종", 32, "#172026", True)
    text(d, (38, 68), "레이아웃은 동일하게 두고 색/밀도/타일 대비만 비교", 16, "#4e5b60")

    for idx, p in enumerate(palettes):
        x = 40 + idx * 470
        y = 112
        draw_phone(d, x, y, p["name"], p)
        sx, sy = x + 28, y + 86
        card(d, (sx, sy, sx + 334, sy + 92), "현재 손패", p)
        mini_tile_row(img, sx + 14, sy + 42, HAND[:7], p["tile"], 0.38)

        sy += 108
        card(d, (sx, sy, sx + 334, sy + 96), "화료", p)
        pill(d, (sx + 14, sy + 46, sx + 108, sy + 80), "론", True, p)
        pill(d, (sx + 118, sy + 46, sx + 212, sy + 80), "쯔모", False, p)
        pill(d, (sx + 222, sy + 46, sx + 320, sy + 80), "동장", False, p)

        sy += 112
        card(d, (sx, sy, sx + 334, sy + 118), "몸통 후보", p)
        mini_tile_row(img, sx + 16, sy + 48, [("Man2.png", ""), ("Man3.png", ""), ("Man4.png", "")], p["tile"], 0.36)
        checkbox(d, sx + 150, sy + 62, False, p)
        text(d, (sx + 180, sy + 61), "후로", 15, p["text"])
        pill(d, (sx + 238, sy + 58, sx + 318, sy + 90), "선택", True, p)

        sy += 134
        d.rounded_rectangle((sx, sy, sx + 334, sy + 124), radius=10, fill=p["accent"])
        light = "#ffffff" if idx != 1 else "#183d35"
        text(d, (sx + 18, sy + 18), "자 론", 17, light, True)
        text(d, (sx + 18, sy + 48), "7700점", 40, light, True)
        text(d, (sx + 18, sy + 98), "3판 40부", 17, light, True)

        sy += 140
        card(d, (sx, sy, sx + 334, sy + 112), "역", p)
        for i, label in enumerate(["리치", "탕야오", "핑후", "도라 1"]):
            pill(d, (sx + 14 + (i % 2) * 154, sy + 44 + (i // 2) * 34, sx + 152 + (i % 2) * 154, sy + 72 + (i // 2) * 34), label, i == 0, p)

    img.save(OUTPUTS / "ui-style-proposals.png")


if __name__ == "__main__":
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    make_tile_variants()
    draw_corrected_wireframe()
    draw_ui_style_proposals()
    print("created design proposals")
