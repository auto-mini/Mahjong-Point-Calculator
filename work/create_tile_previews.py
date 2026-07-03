from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"
OPEN_TILE_ROOT = ROOT / "work" / "riichi-mahjong-tiles" / "Export" / "Regular"


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


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\YuGothB.ttc" if bold else r"C:\Windows\Fonts\YuGothM.ttc",
        r"C:\Windows\Fonts\meiryob.ttc" if bold else r"C:\Windows\Fonts\meiryo.ttc",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def center_text(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, fnt, fill):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - tw) // 2
    y = box[1] + (box[3] - box[1] - th) // 2
    draw.text((x, y), text, font=fnt, fill=fill)


def rounded_tile(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill="#fbfaf6", outline="#bfc4c9"):
    x1, y1, x2, y2 = box
    shadow = (x1 + 4, y1 + 5, x2 + 4, y2 + 5)
    draw.rounded_rectangle(shadow, radius=10, fill="#d8d4ca")
    draw.rounded_rectangle(box, radius=10, fill=fill, outline=outline, width=2)
    draw.rounded_rectangle((x1 + 5, y1 + 5, x2 - 5, y2 - 5), radius=8, outline="#eef0f2", width=1)


def make_open_license_preview():
    out = OUTPUTS / "tile-style-b-open-license-preview.png"
    w, h = 1200, 260
    canvas = Image.new("RGB", (w, h), "#f6f7f8")
    draw = ImageDraw.Draw(canvas)
    title_font = font(25, True)
    label_font = font(18)
    draw.text((32, 22), "후보 B - 오픈 라이선스 타일 (FluffyStuff, CC0)", font=title_font, fill="#172026")

    x = 44
    tile_w = 100
    tile_h = 132
    base = Image.open(OPEN_TILE_ROOT / "Front.png").convert("RGBA")
    for filename, label in SAMPLES:
        symbol = Image.open(OPEN_TILE_ROOT / filename).convert("RGBA")
        tile = base.copy()
        if symbol.getbbox() is not None:
            tile.alpha_composite(symbol)
        tile.thumbnail((tile_w, tile_h), Image.Resampling.LANCZOS)
        tx = x + (tile_w - tile.width) // 2
        canvas.paste(tile, (tx, 78), tile)
        center_text(draw, (x - 10, 216, x + tile_w + 10, 250), label, label_font, "#2b333a")
        x += 142

    canvas.save(out)
    return out


def make_photoreal_framed_preview():
    out = OUTPUTS / "tile-style-a-photoreal-preview.png"
    raw = ROOT / "work" / "tile-style-a-photoreal-raw.png"
    src = Image.open(raw if raw.exists() else out).convert("RGB")
    src.thumbnail((1120, 180), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (1200, 260), "#f7f7f5")
    draw = ImageDraw.Draw(canvas)
    draw.text((32, 22), "후보 A - 사진풍 자체 생성 타일", font=font(25, True), fill="#172026")
    canvas.paste(src, ((1200 - src.width) // 2, 70))
    canvas.save(out)
    return out


def draw_man(draw, box, number: int, red=False):
    x1, y1, x2, y2 = box
    num_font = font(34, True)
    kanji_font = font(40, True)
    color = "#d12d2d" if red else "#30363d"
    center_text(draw, (x1, y1 + 18, x2, y1 + 62), str(number), num_font, color)
    center_text(draw, (x1, y1 + 61, x2, y1 + 112), "萬", kanji_font, color)


def draw_pin(draw, box, number: int, red=False):
    x1, y1, x2, y2 = box
    color = "#d12d2d" if red else "#2f72b8"
    outline = "#274b7a"
    positions = {
        1: [(0.5, 0.5)],
        2: [(0.35, 0.35), (0.65, 0.65)],
        9: [(0.3, 0.25), (0.5, 0.25), (0.7, 0.25), (0.3, 0.5), (0.5, 0.5), (0.7, 0.5), (0.3, 0.75), (0.5, 0.75), (0.7, 0.75)],
    }.get(number, [(0.5, 0.5)])
    for px, py in positions:
        cx = x1 + int((x2 - x1) * px)
        cy = y1 + int((y2 - y1) * py)
        r = 9 if number == 9 else 15
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill="#fffdf7", outline=outline, width=3)
        draw.ellipse((cx - r + 5, cy - r + 5, cx + r - 5, cy + r - 5), fill=color)


def draw_sou(draw, box, number: int, red=False):
    x1, y1, x2, y2 = box
    color = "#21945d" if not red else "#d12d2d"
    if number == 2:
        xs = [x1 + 34, x1 + 66]
        for cx in xs:
            draw.rounded_rectangle((cx - 7, y1 + 22, cx + 7, y2 - 22), radius=6, fill=color)
            draw.line((cx - 12, y1 + 38, cx + 12, y1 + 38), fill="#165f40", width=3)
            draw.line((cx - 12, y1 + 72, cx + 12, y1 + 72), fill="#165f40", width=3)
    else:
        center_text(draw, (x1, y1, x2, y2), str(number), font(42, True), color)


def draw_honor(draw, box, label: str):
    colors = {
        "東": "#30363d",
        "白": "#30363d",
        "發": "#21845a",
        "中": "#c92a2a",
    }
    center_text(draw, box, label, font(52, True), colors.get(label, "#30363d"))


def make_custom_preview():
    out = OUTPUTS / "tile-style-c-custom-clean-preview.png"
    w, h = 1200, 260
    canvas = Image.new("RGB", (w, h), "#f3f6f4")
    draw = ImageDraw.Draw(canvas)
    title_font = font(25, True)
    label_font = font(18)
    draw.text((32, 22), "후보 C - 직접 제작 클린 타일", font=title_font, fill="#172026")

    custom = [
        ("1만", lambda d, b: draw_man(d, b, 1)),
        ("적5만", lambda d, b: draw_man(d, b, 5, True)),
        ("9통", lambda d, b: draw_pin(d, b, 9)),
        ("2삭", lambda d, b: draw_sou(d, b, 2)),
        ("동", lambda d, b: draw_honor(d, b, "東")),
        ("백", lambda d, b: draw_honor(d, b, "白")),
        ("발", lambda d, b: draw_honor(d, b, "發")),
        ("중", lambda d, b: draw_honor(d, b, "中")),
    ]
    x = 44
    tile_w = 100
    tile_h = 132
    for label, painter in custom:
        tile_box = (x, 78, x + tile_w, 78 + tile_h)
        rounded_tile(draw, tile_box)
        inner = (tile_box[0] + 13, tile_box[1] + 14, tile_box[2] - 13, tile_box[3] - 14)
        painter(draw, inner)
        center_text(draw, (x - 10, 216, x + tile_w + 10, 250), label, label_font, "#2b333a")
        x += 142

    canvas.save(out)
    return out


def make_comparison():
    paths = [
        OUTPUTS / "tile-style-a-photoreal-preview.png",
        OUTPUTS / "tile-style-b-open-license-preview.png",
        OUTPUTS / "tile-style-c-custom-clean-preview.png",
    ]
    rows = []
    for path in paths:
        img = Image.open(path).convert("RGB")
        img.thumbnail((1200, 360), Image.Resampling.LANCZOS)
        row = Image.new("RGB", (1200, 360), "#ffffff")
        row.paste(img, ((1200 - img.width) // 2, (360 - img.height) // 2))
        rows.append(row)
    out = Image.new("RGB", (1200, 1080), "#ffffff")
    y = 0
    for row in rows:
        out.paste(row, (0, y))
        y += 360
    out.save(OUTPUTS / "tile-style-comparison.png")


if __name__ == "__main__":
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    make_photoreal_framed_preview()
    make_open_license_preview()
    make_custom_preview()
    make_comparison()
    print("created tile previews")
