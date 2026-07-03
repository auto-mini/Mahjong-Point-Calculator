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


def font(size: int, weight="regular"):
    path = {"regular": FONT_REG, "medium": FONT_MED, "bold": FONT_BOLD}.get(weight, FONT_REG)
    if not path.exists():
        path = Path(r"C:\Windows\Fonts\malgun.ttf")
    return ImageFont.truetype(str(path), size)


def text(draw, xy, value, size=14, fill="#1a1f1c", weight="regular"):
    draw.text(xy, value, font=font(size, weight), fill=fill)


def center(draw, box, value, size=14, fill="#1a1f1c", weight="regular"):
    fnt = font(size, weight)
    bbox = draw.textbbox((0, 0), value, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - tw) // 2
    y = box[1] + (box[3] - box[1] - th) // 2
    draw.text((x, y), value, font=fnt, fill=fill)


def rr(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shadow(base, box, radius, color=(0, 0, 0, 24), blur=16, offset=(0, 10)):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    moved = (box[0] + offset[0], box[1] + offset[1], box[2] + offset[0], box[3] + offset[1])
    d.rounded_rectangle(moved, radius=radius, fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def tile(base, x, y, name, scale=0.27):
    img = render_tile(name, "jade", scale)
    base.alpha_composite(img, (x, y))


def card(base, draw, box, s, fill=None, shadow_kind=None):
    fill = fill or s["surface"]
    if shadow_kind == "raised":
        shadow(base, box, s["radius"], (32, 24, 12, 30), 18, (0, 12))
    elif shadow_kind == "soft":
        shadow(base, box, s["radius"], (32, 24, 12, 16), 12, (0, 7))
    rr(draw, box, s["radius"], fill, s["line"], 1 if s["line"] else 0)


def button(draw, box, label, s, selected=False):
    if selected:
        fill = s["accent"]
        line = s["accent"]
        fg = s["on_accent"]
    else:
        fill = s["button"]
        line = s["button_line"]
        fg = s["text"]
    rr(draw, box, s["button_radius"], fill, line, 1)
    center(draw, box, label, 12, fg, "bold")


def slot(draw, x, y, s):
    rr(draw, (x, y, x + 38, y + 36), min(8, s["button_radius"]), s["slot"], s["button_line"], 1)
    center(draw, (x, y - 1, x + 38, y + 35), "+", 18, s["muted"], "bold")


STYLES = [
    {
        "name": "A Wallet Table",
        "ref": "Apple Wallet + warm tabletop",
        "caption": "결과 카드가 앱의 중심. 표면은 따뜻하지만 정돈됨.",
        "bg": "#EDE8DC",
        "panel": "#F8F3E8",
        "surface": "#FFFDF6",
        "surface2": "#F4EAD8",
        "line": "#D9CDB9",
        "text": "#211E18",
        "muted": "#746B5A",
        "accent": "#8F4D38",
        "on_accent": "#FFFFFF",
        "button": "#EFE5D2",
        "button_line": "#D8CAB3",
        "slot": "#FFFDF6",
        "result": "#8F4D38",
        "on_result": "#FFFFFF",
        "radius": 18,
        "button_radius": 11,
        "shadow": "raised",
    },
    {
        "name": "B Moleskine Ledger",
        "ref": "Moleskine cards + ledger",
        "caption": "아이보리/먹색/올리브. 카드가 종이처럼 보이는 방향.",
        "bg": "#1E2A25",
        "panel": "#F5EFE2",
        "surface": "#FFF9EA",
        "surface2": "#EDE2CD",
        "line": "#D3C4AA",
        "text": "#211F1A",
        "muted": "#706756",
        "accent": "#263F36",
        "on_accent": "#FFF9EA",
        "button": "#E8DCC6",
        "button_line": "#CDBB9E",
        "slot": "#FFF9EA",
        "result": "#263F36",
        "on_result": "#FFF9EA",
        "radius": 10,
        "button_radius": 6,
        "shadow": "soft",
    },
    {
        "name": "C Premium Ledger Pro",
        "ref": "Mercury/Ramp + Linear",
        "caption": "갈색을 줄이고 웜그레이와 올리브로 고급 도구감.",
        "bg": "#E8E4DA",
        "panel": "#F6F3EC",
        "surface": "#FFFCF6",
        "surface2": "#EEEAE0",
        "line": "#D5D0C4",
        "text": "#1D211E",
        "muted": "#6C6A62",
        "accent": "#3F5448",
        "on_accent": "#FFFFFF",
        "button": "#EFECE5",
        "button_line": "#D8D3C8",
        "slot": "#FFFCF6",
        "result": "#303A34",
        "on_result": "#FFFFFF",
        "radius": 8,
        "button_radius": 6,
        "shadow": "none",
    },
    {
        "name": "D Warm Native Utility",
        "ref": "Things/Bear/Craft",
        "caption": "따뜻하지만 네이티브 앱처럼 가볍고 절제된 면.",
        "bg": "#F0EEE7",
        "panel": "#F8F7F2",
        "surface": "#FFFFFF",
        "surface2": "#F2F0EA",
        "line": "#DAD7CE",
        "text": "#1C211E",
        "muted": "#6E716C",
        "accent": "#2F6F61",
        "on_accent": "#FFFFFF",
        "button": "#EEF1EC",
        "button_line": "#D8DDD7",
        "slot": "#FFFFFF",
        "result": "#2F6F61",
        "on_result": "#FFFFFF",
        "radius": 14,
        "button_radius": 14,
        "shadow": "soft",
    },
    {
        "name": "E Soft Journal Calculator",
        "ref": "Day One/Bear journal",
        "caption": "기록장 같은 차분함. 부수 breakdown과 기록 기능에 잘 맞음.",
        "bg": "#F4EFE6",
        "panel": "#FFFDF8",
        "surface": "#FFFDF8",
        "surface2": "#F4EDE1",
        "line": "#DED3C2",
        "text": "#2A241C",
        "muted": "#776D5E",
        "accent": "#6C5A35",
        "on_accent": "#FFFFFF",
        "button": "#EEE4D4",
        "button_line": "#D9CBB7",
        "slot": "#FFFDF8",
        "result": "#6C5A35",
        "on_result": "#FFFFFF",
        "radius": 12,
        "button_radius": 8,
        "shadow": "soft",
    },
]


def draw_mobile(base, x, y, s):
    draw = ImageDraw.Draw(base)
    frame = (x, y, x + 376, y + 800)
    rr(draw, frame, 34, "#18211E")
    screen = (x + 12, y + 18, x + 364, y + 782)
    rr(draw, screen, 28, s["panel"])

    text(draw, (x + 34, y + 48), s["name"], 21, s["text"], "bold")
    text(draw, (x + 34, y + 78), s["ref"], 11, s["muted"])

    # Result card
    result_box = (x + 34, y + 118, x + 342, y + 256)
    if s["shadow"] == "raised":
        shadow(base, result_box, s["radius"], (32, 20, 8, 38), 20, (0, 14))
    elif s["shadow"] == "soft":
        shadow(base, result_box, s["radius"], (32, 20, 8, 18), 13, (0, 8))
    rr(draw, result_box, s["radius"], s["result"])
    text(draw, (x + 56, y + 140), "자 론", 15, s["on_result"], "bold")
    text(draw, (x + 56, y + 172), "7700점", 42, s["on_result"], "bold")
    text(draw, (x + 56, y + 224), "3판 40부", 15, s["on_result"], "bold")

    # Condition card
    box = (x + 34, y + 276, x + 342, y + 358)
    card(base, draw, box, s, shadow_kind="soft" if s["shadow"] != "none" else None)
    text(draw, (x + 52, y + 292), "화료", 13, s["text"], "bold")
    button(draw, (x + 52, y + 322, x + 140, y + 346), "론", s, True)
    button(draw, (x + 154, y + 322, x + 246, y + 346), "쯔모", s, False)

    # Hand card
    box = (x + 34, y + 376, x + 342, y + 470)
    card(base, draw, box, s, shadow_kind="soft" if s["shadow"] == "raised" else None)
    text(draw, (x + 52, y + 392), "현재 손패", 13, s["text"], "bold")
    cx = x + 52
    for name in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"]:
        tile(base, cx, y + 424, name, 0.27)
        cx += 37

    # Candidate
    box = (x + 34, y + 488, x + 342, y + 578)
    card(base, draw, box, s)
    text(draw, (x + 52, y + 504), "3만 포함 후보", 13, s["text"], "bold")
    rr(draw, (x + 52, y + 534, x + 184, y + 566), min(s["button_radius"], 10), s["surface2"], s["accent"], 2)
    cx = x + 60
    for name in ["Man1.png", "Man2.png", "Man3.png"]:
        tile(base, cx, y + 535, name, 0.2)
        cx += 32
    rr(draw, (x + 250, y + 540, x + 270, y + 560), 5, s["surface"], s["accent"], 2)
    text(draw, (x + 280, y + 539), "후로", 12, s["text"])

    # Breakdown
    box = (x + 34, y + 596, x + 342, y + 696)
    card(base, draw, box, s)
    text(draw, (x + 52, y + 612), "부수", 13, s["text"], "bold")
    for i, row in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]):
        text(draw, (x + 54, y + 638 + i * 16), row, 11, s["text"] if i == 3 else s["muted"], "bold" if i == 3 else "regular")

    # Dora slots
    box = (x + 34, y + 714, x + 342, y + 762)
    card(base, draw, box, s)
    text(draw, (x + 52, y + 728), "도라", 12, s["text"], "bold")
    for i in range(5):
        slot(draw, x + 98 + i * 43, y + 724, s)


def draw_detail_tile(base, x, y, s):
    draw = ImageDraw.Draw(base)
    # Background slab
    rr(draw, (x, y, x + 520, y + 336), 22, s["bg"])
    card(base, draw, (x + 18, y + 18, x + 502, y + 318), s, s["panel"], "soft" if s["shadow"] != "none" else None)
    text(draw, (x + 42, y + 44), s["name"], 22, s["text"], "bold")
    text(draw, (x + 42, y + 74), s["caption"], 12, s["muted"])

    # Component row
    res = (x + 42, y + 112, x + 238, y + 214)
    rr(draw, res, s["radius"], s["result"])
    text(draw, (x + 58, y + 128), "자 론", 13, s["on_result"], "bold")
    text(draw, (x + 58, y + 154), "7700점", 32, s["on_result"], "bold")
    text(draw, (x + 58, y + 192), "3판 40부", 13, s["on_result"], "bold")

    comp = (x + 260, y + 112, x + 478, y + 214)
    card(base, draw, comp, s)
    text(draw, (x + 278, y + 128), "표면 / 버튼", 13, s["text"], "bold")
    button(draw, (x + 278, y + 160, x + 356, y + 186), "론", s, True)
    button(draw, (x + 368, y + 160, x + 454, y + 186), "쯔모", s, False)

    cand = (x + 42, y + 236, x + 478, y + 292)
    card(base, draw, cand, s)
    text(draw, (x + 58, y + 254), "패 후보", 12, s["text"], "bold")
    cx = x + 136
    for name in ["Man1.png", "Man2.png", "Man3.png", "Pin5-Dora.png"]:
        tile(base, cx, y + 248, name, 0.22)
        cx += 32
    for i, color in enumerate([s["bg"], s["panel"], s["surface"], s["surface2"], s["accent"], s["result"]]):
        rr(draw, (x + 344 + i * 22, y + 255, x + 362 + i * 22, y + 273), 5, color, s["line"], 1)


def make_mobile_board():
    img = Image.new("RGBA", (2040, 980), "#E6E2D8")
    draw = ImageDraw.Draw(img)
    text(draw, (34, 28), "따뜻한 비주얼 후보 - 모바일 적용", 34, "#211E18", "bold")
    text(draw, (34, 74), "10/12번 취향을 기반으로 재작업. Wanted Sans + B2 타일 고정.", 16, "#746B5A")
    for i, s in enumerate(STYLES):
        draw_mobile(img, 34 + i * 398, 120, s)
    img.convert("RGB").save(OUTPUTS / "warm-refined-mobile-v1.png")


def make_detail_board():
    img = Image.new("RGBA", (1640, 860), "#E6E2D8")
    draw = ImageDraw.Draw(img)
    text(draw, (34, 28), "따뜻한 비주얼 후보 - 스타일 디테일", 34, "#211E18", "bold")
    text(draw, (34, 74), "카드 물성, 버튼 질감, 표면색, 결과 카드만 비교.", 16, "#746B5A")
    for i, s in enumerate(STYLES):
        x = 34 + (i % 3) * 532
        y = 120 + (i // 3) * 360
        draw_detail_tile(img, x, y, s)
    img.convert("RGB").save(OUTPUTS / "warm-refined-style-details-v1.png")


def write_notes():
    lines = [
        "# 따뜻한 비주얼 후보 v1",
        "",
        "작성일: 2026-07-04",
        "",
        "사용자 선호: 기존 10 Matte Table, 12 Warm Ledger 계열.",
        "",
        "공통:",
        "",
        "- Wanted Sans 고정",
        "- B2 타일 고정",
        "- 마작 앱 테마가 아니라 따뜻한 유틸/원장/지갑 앱 방향",
        "",
        "후보:",
        "",
    ]
    for s in STYLES:
        lines.append(f"- {s['name']}: {s['caption']} ({s['ref']})")
    lines.extend(
        [
            "",
            "현재 판단:",
            "",
            "- A Wallet Table: 가장 예쁘게 갈 가능성이 높다. 결과 카드 중심 앱과 잘 맞는다.",
            "- B Moleskine Ledger: 10/12 취향을 가장 직접 반영하지만, 조심하지 않으면 문구점/노트 앱처럼 보일 수 있다.",
            "- C Premium Ledger Pro: 가장 고급 도구형. 덜 귀엽고 덜 테마적이다.",
            "- D Warm Native Utility: 가장 안전하다. 단, 개성은 약할 수 있다.",
            "- E Soft Journal Calculator: 부수 breakdown/최근 기록에는 잘 맞지만 계산기 첫인상은 약할 수 있다.",
        ]
    )
    (OUTPUTS / "warm-refined-styles-v1.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    make_mobile_board()
    make_detail_board()
    write_notes()
    print("created warm refined styles")


if __name__ == "__main__":
    main()
