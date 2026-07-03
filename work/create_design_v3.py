from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from create_design_proposals import render_tile


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"

SUIT_REG = ROOT / "work" / "SUIT" / "fonts" / "static" / "otf" / "SUIT-Regular.otf"
SUIT_MED = ROOT / "work" / "SUIT" / "fonts" / "static" / "otf" / "SUIT-Medium.otf"
SUIT_BOLD = ROOT / "work" / "SUIT" / "fonts" / "static" / "otf" / "SUIT-Bold.otf"
PRET_REG = ROOT / "work" / "pretendard" / "packages" / "pretendard" / "dist" / "public" / "static" / "Pretendard-Regular.otf"
PRET_BOLD = ROOT / "work" / "pretendard" / "packages" / "pretendard" / "dist" / "public" / "static" / "Pretendard-Bold.otf"


MAN = [(f"Man{i}.png", f"{i}만") for i in range(1, 10)]
PIN = [(f"Pin{i}.png", f"{i}통") for i in range(1, 10)]
SOU = [(f"Sou{i}.png", f"{i}삭") for i in range(1, 10)]
RED = [("Man5-Dora.png", "적5만"), ("Pin5-Dora.png", "적5통"), ("Sou5-Dora.png", "적5삭")]
HONORS = [
    ("Ton.png", "동"),
    ("Nan.png", "남"),
    ("Shaa.png", "서"),
    ("Pei.png", "북"),
    ("Haku.png", "백"),
    ("Hatsu.png", "발"),
    ("Chun.png", "중"),
]
ALL_37 = MAN + PIN + SOU + RED + HONORS


def font(size: int, bold: bool = False, family: str = "SUIT"):
    if family == "Pretendard":
        path = PRET_BOLD if bold else PRET_REG
    else:
        path = SUIT_BOLD if bold else SUIT_REG
        if not bold and SUIT_MED.exists():
            path = SUIT_MED
    if path.exists():
        return ImageFont.truetype(str(path), size)
    fallback = r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf"
    return ImageFont.truetype(fallback, size)


def draw_text(draw, xy, value, size=18, fill="#172026", bold=False, family="SUIT"):
    draw.text(xy, value, font=font(size, bold, family), fill=fill)


def center(draw, box, value, size=16, fill="#172026", bold=False, family="SUIT"):
    f = font(size, bold, family)
    bbox = draw.textbbox((0, 0), value, font=f)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - w) // 2
    y = box[1] + (box[3] - box[1] - h) // 2
    draw.text((x, y), value, font=f, fill=fill)


def card(draw, box, fill, outline, radius=12):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=1)


def button(draw, box, label, selected=False, palette=None, family="SUIT"):
    palette = palette or {}
    fill = palette.get("selected", "#256b7f") if selected else palette.get("button", "#ffffff")
    line = palette.get("selected", "#256b7f") if selected else palette.get("line", "#cbd7dd")
    txt = "#ffffff" if selected else palette.get("text", "#172026")
    draw.rounded_rectangle(box, radius=10, fill=fill, outline=line, width=2)
    center(draw, box, label, 15, txt, True, family)


def radio(draw, x, y, label, selected=False, palette=None, family="SUIT"):
    palette = palette or {}
    line = palette.get("selected", "#256b7f")
    draw.ellipse((x, y, x + 20, y + 20), fill="#ffffff", outline=line, width=2)
    if selected:
        draw.ellipse((x + 5, y + 5, x + 15, y + 15), fill=line)
    draw_text(draw, (x + 28, y - 1), label, 15, palette.get("text", "#172026"), False, family)


def checkbox(draw, x, y, label, checked=False, palette=None, family="SUIT"):
    palette = palette or {}
    line = palette.get("selected", "#256b7f")
    draw.rounded_rectangle((x, y, x + 22, y + 22), radius=5, fill="#ffffff", outline=line, width=2)
    if checked:
        draw.line((x + 5, y + 12, x + 10, y + 17, x + 18, y + 6), fill=line, width=3)
    draw_text(draw, (x + 30, y - 1), label, 15, palette.get("text", "#172026"), False, family)


def paste_tile(base, x, y, filename, scale=0.31, variant="jade"):
    tile = render_tile(filename, variant, scale)
    base.paste(tile, (x, y), tile)
    return tile.width, tile.height


def tile_chip(base, draw, x, y, tiles, palette, family="SUIT", selected=False):
    w = 38 * len(tiles) + 16
    card(draw, (x, y, x + w, y + 48), "#ffffff", palette["line"], 9)
    cx = x + 8
    for filename in tiles:
        paste_tile(base, cx, y + 4, filename, 0.28, "jade")
        cx += 38
    if selected:
        draw.rounded_rectangle((x, y, x + w, y + 48), radius=9, outline=palette["selected"], width=3)
    return w


def draw_37_grid(base, draw, x, y, palette, family="SUIT"):
    groups = [MAN, PIN, SOU, RED, HONORS]
    labels = ["만수", "통수", "삭수", "적도라", "자패"]
    cy = y
    for label, group in zip(labels, groups):
        draw_text(draw, (x, cy + 4), label, 13, palette["muted"], True, family)
        gx = x + 58
        for i, (filename, _name) in enumerate(group):
            tx = gx + i * 36
            if tx > x + 310:
                tx = gx + (i - 8) * 36
                ty = cy + 44
            else:
                ty = cy
            paste_tile(base, tx, ty, filename, 0.25, "jade")
        cy += 46 if len(group) <= 8 else 86


def empty_slot(draw, x, y, label, palette, family="SUIT"):
    draw.rounded_rectangle((x, y, x + 46, y + 60), radius=8, fill="#ffffff", outline=palette["line"], width=2)
    center(draw, (x, y + 18, x + 46, y + 42), "+", 24, palette["muted"], True, family)
    center(draw, (x - 8, y + 62, x + 54, y + 84), label, 11, palette["muted"], False, family)


def phone(draw, x, y, palette):
    draw.rounded_rectangle((x, y, x + 390, y + 804), radius=36, fill=palette["frame"])
    draw.rounded_rectangle((x + 12, y + 18, x + 378, y + 786), radius=28, fill=palette["bg"])


def draw_wireframe_v3():
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
    img = Image.new("RGB", (1240, 910), "#e6eef1")
    d = ImageDraw.Draw(img)
    draw_text(d, (36, 28), "수정 와이어프레임 v3", 32, p["text"], True)
    draw_text(d, (36, 70), "37종 전체 패 그리드, 장풍/자풍 분리, 후보는 선택 패 기반, 도라/우라 5칸 입력.", 17, p["muted"])

    phone(d, 48, 92, p)
    sx, sy = 76, 146
    draw_text(d, (sx, sy), "입력", 22, p["text"], True)

    sy += 42
    card(d, (sx, sy, sx + 334, sy + 104), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "화료", 16, p["text"], True)
    button(d, (sx + 14, sy + 46, sx + 112, sy + 82), "론", True, p)
    button(d, (sx + 124, sy + 46, sx + 222, sy + 82), "쯔모", False, p)

    sy += 118
    card(d, (sx, sy, sx + 334, sy + 128), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "장풍", 16, p["text"], True)
    for i, label in enumerate(["동", "남", "서", "북"]):
        radio(d, sx + 18 + i * 76, sy + 48, label, i == 0, p)
    draw_text(d, (sx + 14, sy + 78), "자풍", 16, p["text"], True)
    for i, label in enumerate(["동", "남", "서", "북"]):
        radio(d, sx + 18 + i * 76, sy + 104, label, i == 2, p)

    sy += 142
    card(d, (sx, sy, sx + 334, sy + 84), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "현재 손패", 16, p["text"], True)
    current = ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png", "Ton.png"]
    cx = sx + 12
    for filename in current:
        paste_tile(img, cx, sy + 36, filename, 0.25, "jade")
        cx += 36

    sy += 100
    card(d, (sx, sy, sx + 334, sy + 276), p["surface"], p["line"])
    draw_text(d, (sx + 14, sy + 12), "패 선택", 16, p["text"], True)
    draw_37_grid(img, d, sx + 14, sy + 42, p)

    phone(d, 454, 92, p)
    sx2, sy2 = 482, 146
    draw_text(d, (sx2, sy2), "후보", 22, p["text"], True)
    sy2 += 42
    card(d, (sx2, sy2, sx2 + 334, sy2 + 86), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "선택한 패", 16, p["text"], True)
    paste_tile(img, sx2 + 18, sy2 + 38, "Man3.png", 0.31, "jade")
    draw_text(d, (sx2 + 78, sy2 + 46), "3만을 포함하는 후보", 15, p["muted"])

    sy2 += 102
    card(d, (sx2, sy2, sx2 + 334, sy2 + 190), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "몸통/머리 후보", 16, p["text"], True)
    yrow = sy2 + 46
    w1 = tile_chip(img, d, sx2 + 14, yrow, ["Man1.png", "Man2.png", "Man3.png"], p, selected=True)
    center(d, (sx2 + 14 + w1 + 12, yrow, sx2 + 318, yrow + 48), "123만", 14, p["text"], True)
    yrow += 58
    w2 = tile_chip(img, d, sx2 + 14, yrow, ["Man2.png", "Man3.png", "Man4.png"], p)
    center(d, (sx2 + 14 + w2 + 12, yrow, sx2 + 318, yrow + 48), "234만", 14, p["text"], False)
    yrow += 58
    tile_chip(img, d, sx2 + 14, yrow, ["Man3.png", "Man3.png"], p)
    center(d, (sx2 + 14 + 92, yrow, sx2 + 318, yrow + 48), "33만 머리", 14, p["text"], False)

    sy2 += 206
    card(d, (sx2, sy2, sx2 + 334, sy2 + 92), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "선택 후보 옵션", 16, p["text"], True)
    checkbox(d, sx2 + 18, sy2 + 50, "후로", False, p)
    button(d, (sx2 + 222, sy2 + 42, sx2 + 318, sy2 + 78), "추가", True, p)

    sy2 += 108
    card(d, (sx2, sy2, sx2 + 334, sy2 + 172), p["surface"], p["line"])
    draw_text(d, (sx2 + 14, sy2 + 12), "도라/우라 입력 전 확인", 16, p["text"], True)
    draw_text(d, (sx2 + 14, sy2 + 42), "마지막 깡 직후에 화료했나요?", 15, p["text"], True)
    button(d, (sx2 + 14, sy2 + 76, sx2 + 112, sy2 + 112), "예", False, p)
    button(d, (sx2 + 124, sy2 + 76, sx2 + 222, sy2 + 112), "아니오", True, p)
    draw_text(d, (sx2 + 14, sy2 + 126), "도라 표시패를 순서대로 모두 입력하세요.", 13, p["muted"])

    phone(d, 860, 92, p)
    sx3, sy3 = 888, 146
    draw_text(d, (sx3, sy3), "도라/결과", 22, p["text"], True)

    sy3 += 42
    card(d, (sx3, sy3, sx3 + 334, sy3 + 142), p["surface"], p["line"])
    draw_text(d, (sx3 + 14, sy3 + 12), "도라 표시패", 16, p["text"], True)
    for i in range(5):
        empty_slot(d, sx3 + 14 + i * 62, sy3 + 48, str(i + 1), p)

    sy3 += 158
    card(d, (sx3, sy3, sx3 + 334, sy3 + 142), p["surface"], p["line"])
    draw_text(d, (sx3 + 14, sy3 + 12), "우라 표시패", 16, p["text"], True)
    for i in range(5):
        empty_slot(d, sx3 + 14 + i * 62, sy3 + 48, str(i + 1), p)

    sy3 += 162
    d.rounded_rectangle((sx3, sy3, sx3 + 334, sy3 + 126), radius=14, fill=p["selected"])
    draw_text(d, (sx3 + 18, sy3 + 16), "자 론", 17, "#dff4ed", True)
    draw_text(d, (sx3 + 18, sy3 + 46), "7700점", 42, "#ffffff", True)
    draw_text(d, (sx3 + 18, sy3 + 98), "3판 40부", 17, "#dff4ed", True)

    sy3 += 142
    card(d, (sx3, sy3, sx3 + 334, sy3 + 146), p["surface"], p["line"])
    draw_text(d, (sx3 + 14, sy3 + 12), "역 / 도라", 16, p["text"], True)
    tags = ["리치", "탕야오", "핑후", "도라 1"]
    for i, tag in enumerate(tags):
        x = sx3 + 14 + (i % 2) * 154
        y = sy3 + 44 + (i // 2) * 38
        d.rounded_rectangle((x, y, x + 136, y + 30), radius=15, fill="#eef4f6", outline="#d6e0e5")
        center(d, (x, y, x + 136, y + 30), tag, 14, p["text"], True)
    draw_text(d, (sx3 + 14, sy3 + 122), "기본 20 + 멘젠론 10 + 간짱 2 → 40부", 13, p["muted"])

    img.save(OUTPUTS / "mobile-wireframes-v3.png")


def draw_font_comparison():
    img = Image.new("RGB", (1180, 560), "#f1f5f7")
    d = ImageDraw.Draw(img)
    draw_text(d, (34, 28), "한글 UI 폰트 후보", 34, "#172026", True)
    draw_text(d, (34, 72), "모두 상업 사용 및 앱 번들링 가능한 OFL 계열 후보. 최종 앱은 외부 CDN 없이 번들링.", 17, "#5e6d74")
    rows = [
        ("SUIT", "SUIT", "UI 본문용으로 만들어진 단정한 인상. 숫자와 한글 균형이 좋음."),
        ("Pretendard", "Pretendard", "국내 웹/앱에서 많이 쓰이는 현대적 기본값. 가장 무난함."),
    ]
    y = 126
    for label, fam, note in rows:
        card(d, (34, y, 1146, y + 168), "#ffffff", "#d5e0e5")
        draw_text(d, (58, y + 26), label, 28, "#172026", True, fam)
        draw_text(d, (58, y + 70), "자 론 7700점 · 3판 40부 · 리치 탕야오 핑후 도라 1", 28, "#256b7f", True, fam)
        draw_text(d, (58, y + 116), note, 17, "#607078", False, fam)
        y += 190
    img.save(OUTPUTS / "font-comparison.png")


def draw_reference_based_styles():
    refs = [
        {
            "title": "A. Material 3 기반",
            "desc": "큰 터치 영역, 분명한 버튼 상태, 밝은 앱형",
            "bg": "#edf4f7",
            "surface": "#ffffff",
            "line": "#cbd7dd",
            "selected": "#256b7f",
            "frame": "#1b252b",
            "text": "#16242b",
            "muted": "#64737a",
        },
        {
            "title": "B. Radix Themes 기반",
            "desc": "낮은 장식, 정돈된 폼, 밀도 높은 도구형",
            "bg": "#f7f7f5",
            "surface": "#ffffff",
            "line": "#d8d6cf",
            "selected": "#355c52",
            "frame": "#20211f",
            "text": "#202522",
            "muted": "#6c716d",
        },
        {
            "title": "C. Carbon 기반",
            "desc": "데이터/계산기 느낌, 강한 위계, 높은 대비",
            "bg": "#f4f4f4",
            "surface": "#ffffff",
            "line": "#c6c6c6",
            "selected": "#0f62fe",
            "frame": "#161616",
            "text": "#161616",
            "muted": "#6f6f6f",
        },
    ]
    img = Image.new("RGB", (1460, 910), "#e7ecef")
    d = ImageDraw.Draw(img)
    draw_text(d, (38, 28), "레퍼런스 기반 UI 시안", 34, "#172026", True)
    draw_text(d, (38, 72), "Material 3 / Radix Themes / Carbon의 공개 디자인 원칙을 참고. 브랜드 에셋은 사용하지 않음.", 16, "#5a6970")
    for idx, p in enumerate(refs):
        x = 40 + idx * 470
        y = 116
        phone(d, x, y, p)
        sx, sy = x + 28, y + 52
        draw_text(d, (sx, sy), p["title"], 22, p["text"], True)
        draw_text(d, (sx, sy + 32), p["desc"], 13, p["muted"])

        sy += 70
        card(d, (sx, sy, sx + 334, sy + 92), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "화료", 16, p["text"], True)
        button(d, (sx + 14, sy + 46, sx + 112, sy + 80), "론", True, p)
        button(d, (sx + 124, sy + 46, sx + 222, sy + 80), "쯔모", False, p)

        sy += 108
        card(d, (sx, sy, sx + 334, sy + 104), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "장풍 / 자풍", 16, p["text"], True)
        for i, label in enumerate(["동", "남", "서", "북"]):
            radio(d, sx + 18 + i * 76, sy + 50, label, i == 0, p)

        sy += 120
        card(d, (sx, sy, sx + 334, sy + 102), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "현재 손패", 16, p["text"], True)
        cx = sx + 14
        for filename in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"]:
            paste_tile(img, cx, sy + 42, filename, 0.27, "jade")
            cx += 39

        sy += 118
        card(d, (sx, sy, sx + 334, sy + 128), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "선택한 패 후보", 16, p["text"], True)
        tile_chip(img, d, sx + 14, sy + 48, ["Man1.png", "Man2.png", "Man3.png"], p, selected=True)
        checkbox(d, sx + 216, sy + 60, "후로", False, p)

        sy += 144
        d.rounded_rectangle((sx, sy, sx + 334, sy + 126), radius=14, fill=p["selected"])
        draw_text(d, (sx + 18, sy + 16), "자 론", 17, "#ffffff", True)
        draw_text(d, (sx + 18, sy + 46), "7700점", 42, "#ffffff", True)
        draw_text(d, (sx + 18, sy + 98), "3판 40부", 17, "#ffffff", True)

        sy += 142
        card(d, (sx, sy, sx + 334, sy + 94), p["surface"], p["line"])
        draw_text(d, (sx + 14, sy + 12), "도라 표시패", 16, p["text"], True)
        for i in range(5):
            empty_slot(d, sx + 14 + i * 62, sy + 42, str(i + 1), p)

    img.save(OUTPUTS / "reference-ui-proposals.png")


def main():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    draw_font_comparison()
    draw_wireframe_v3()
    draw_reference_based_styles()
    print("created v3 design assets")


if __name__ == "__main__":
    main()

