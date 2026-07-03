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


PALETTES = [
    {
        "name": "01 클린 유틸",
        "desc": "가장 안전한 모바일 계산기",
        "bg": "#eef4f6",
        "surface": "#fbfdfd",
        "elevated": "#ffffff",
        "line": "#c9d8de",
        "text": "#16242b",
        "muted": "#64757d",
        "primary": "#246f7e",
        "primary_soft": "#dcecef",
        "accent": "#2f8b6f",
        "warn": "#c55a35",
        "frame": "#17252b",
        "result": "#246f7e",
        "result_text": "#ffffff",
    },
    {
        "name": "02 작탁 그린",
        "desc": "테이블 느낌, 복제감 없음",
        "bg": "#1f4a40",
        "surface": "#f8faf2",
        "elevated": "#ffffff",
        "line": "#d4ddcf",
        "text": "#1b2b28",
        "muted": "#66736d",
        "primary": "#ab5142",
        "primary_soft": "#f3e5df",
        "accent": "#2f7b62",
        "warn": "#b74834",
        "frame": "#101918",
        "result": "#f2e7c8",
        "result_text": "#17332d",
    },
    {
        "name": "03 기록지",
        "desc": "수기 점수표 같은 차분함",
        "bg": "#f3f0e8",
        "surface": "#fffdf7",
        "elevated": "#ffffff",
        "line": "#d7d0c2",
        "text": "#26231d",
        "muted": "#706a5f",
        "primary": "#365f59",
        "primary_soft": "#e5eee9",
        "accent": "#a84d34",
        "warn": "#b2492e",
        "frame": "#20201e",
        "result": "#365f59",
        "result_text": "#fffdf7",
    },
    {
        "name": "04 점수판 다크",
        "desc": "어두운 자리에서 보기 쉬움",
        "bg": "#111817",
        "surface": "#1a2423",
        "elevated": "#22302e",
        "line": "#344542",
        "text": "#f4f8f5",
        "muted": "#a9b7b1",
        "primary": "#78c6aa",
        "primary_soft": "#203b35",
        "accent": "#e2b65b",
        "warn": "#e27a55",
        "frame": "#050807",
        "result": "#78c6aa",
        "result_text": "#10201d",
    },
    {
        "name": "05 금융 계산기",
        "desc": "정산/계산 앱처럼 단단함",
        "bg": "#f0f3f5",
        "surface": "#ffffff",
        "elevated": "#f8fafb",
        "line": "#cfd7dc",
        "text": "#12181c",
        "muted": "#626d74",
        "primary": "#22577a",
        "primary_soft": "#e3edf3",
        "accent": "#23836d",
        "warn": "#c15c34",
        "frame": "#161c20",
        "result": "#17324a",
        "result_text": "#ffffff",
    },
    {
        "name": "06 노선도",
        "desc": "선명한 상태 구분",
        "bg": "#f5f7f8",
        "surface": "#ffffff",
        "elevated": "#ffffff",
        "line": "#d2d9dd",
        "text": "#161a1d",
        "muted": "#616b72",
        "primary": "#007a5a",
        "primary_soft": "#dff0eb",
        "accent": "#d2691e",
        "warn": "#bf3e30",
        "frame": "#1c1f22",
        "result": "#007a5a",
        "result_text": "#ffffff",
    },
    {
        "name": "07 네이티브 라이트",
        "desc": "운영체제 기본 앱에 가까움",
        "bg": "#f2f5f7",
        "surface": "#ffffff",
        "elevated": "#ffffff",
        "line": "#d7dee3",
        "text": "#111820",
        "muted": "#6b7680",
        "primary": "#176b87",
        "primary_soft": "#e4f0f4",
        "accent": "#3d8b72",
        "warn": "#c1573b",
        "frame": "#202830",
        "result": "#176b87",
        "result_text": "#ffffff",
    },
    {
        "name": "08 공구함",
        "desc": "현장 도구 같은 묵직함",
        "bg": "#26312f",
        "surface": "#f4f1e8",
        "elevated": "#fffaf0",
        "line": "#d8d0bd",
        "text": "#20231f",
        "muted": "#6b6b61",
        "primary": "#b84b32",
        "primary_soft": "#f1ded5",
        "accent": "#2f735e",
        "warn": "#b84b32",
        "frame": "#121715",
        "result": "#b84b32",
        "result_text": "#fffdf7",
    },
    {
        "name": "09 프로 툴",
        "desc": "밀도 높은 도구형",
        "bg": "#e9eef0",
        "surface": "#f9fbfb",
        "elevated": "#ffffff",
        "line": "#bfcbd0",
        "text": "#131d21",
        "muted": "#59676d",
        "primary": "#27474e",
        "primary_soft": "#e0e8ea",
        "accent": "#397d69",
        "warn": "#b65632",
        "frame": "#151d20",
        "result": "#27474e",
        "result_text": "#ffffff",
    },
    {
        "name": "10 동반 앱",
        "desc": "게임 보조앱 느낌, 과장 없음",
        "bg": "#edf1eb",
        "surface": "#ffffff",
        "elevated": "#fbf8ef",
        "line": "#d1d9cd",
        "text": "#17211d",
        "muted": "#667167",
        "primary": "#2d6d60",
        "primary_soft": "#dfece6",
        "accent": "#9b5b35",
        "warn": "#be4f39",
        "frame": "#18211f",
        "result": "#2d6d60",
        "result_text": "#ffffff",
    },
]


def load_font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    path = {"regular": FONT_REG, "medium": FONT_MED, "bold": FONT_BOLD}.get(weight, FONT_REG)
    if not path.exists():
        path = Path(r"C:\Windows\Fonts\malgun.ttf")
    return ImageFont.truetype(str(path), size)


def text(draw: ImageDraw.ImageDraw, xy, value: str, size=16, fill="#172026", weight="regular"):
    draw.text(xy, value, font=load_font(size, weight), fill=fill)


def center(draw: ImageDraw.ImageDraw, box, value: str, size=16, fill="#172026", weight="regular"):
    fnt = load_font(size, weight)
    bbox = draw.textbbox((0, 0), value, font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - tw) // 2
    y = box[1] + (box[3] - box[1] - th) // 2
    draw.text((x, y), value, font=fnt, fill=fill)


def rr(draw: ImageDraw.ImageDraw, box, fill, outline=None, width=1, radius=8):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def paste_tile(base: Image.Image, x: int, y: int, filename: str, scale=0.31):
    tile = render_tile(filename, "jade", scale)
    base.paste(tile, (x, y), tile)
    return tile.width, tile.height


def button(draw: ImageDraw.ImageDraw, box, label, p, selected=False):
    if selected:
        fill = p["primary"]
        line = p["primary"]
        fg = "#ffffff" if p["primary"] != "#78c6aa" else "#10201d"
    else:
        fill = p["surface"]
        line = p["line"]
        fg = p["text"]
    rr(draw, box, fill, line, 2, 8)
    center(draw, box, label, 13, fg, "bold")


def pill(draw: ImageDraw.ImageDraw, box, label, p):
    rr(draw, box, p["primary_soft"], p["line"], 1, 8)
    center(draw, box, label, 12, p["text"], "medium")


def card(draw: ImageDraw.ImageDraw, box, p, fill_key="surface"):
    rr(draw, box, p[fill_key], p["line"], 1, 8)


def tile_strip(base, draw, x, y, p):
    card(draw, (x, y, x + 252, y + 76), p)
    text(draw, (x + 12, y + 10), "현재 손패", 13, p["text"], "bold")
    cx = x + 12
    for filename in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Ton.png"]:
        paste_tile(base, cx, y + 34, filename, 0.24)
        cx += 34


def candidate(base, draw, x, y, p):
    card(draw, (x, y, x + 252, y + 94), p)
    text(draw, (x + 12, y + 10), "선택한 패 후보", 13, p["text"], "bold")
    rr(draw, (x + 12, y + 38, x + 126, y + 78), p["elevated"], p["primary"], 2, 8)
    cx = x + 18
    for filename in ["Man1.png", "Man2.png", "Man3.png"]:
        paste_tile(base, cx, y + 41, filename, 0.22)
        cx += 29
    rr(draw, (x + 172, y + 49, x + 190, y + 67), p["surface"], p["primary"], 2, 5)
    text(draw, (x + 198, y + 48), "후로", 12, p["text"], "regular")


def result(draw, x, y, p):
    rr(draw, (x, y, x + 252, y + 104), p["result"], None, 1, 8)
    text(draw, (x + 16, y + 14), "자 론", 14, p["result_text"], "bold")
    text(draw, (x + 16, y + 40), "7700점", 34, p["result_text"], "bold")
    text(draw, (x + 16, y + 82), "3판 40부", 14, p["result_text"], "bold")


def fu_breakdown(draw, x, y, p):
    card(draw, (x, y, x + 252, y + 104), p)
    text(draw, (x + 12, y + 10), "부수", 13, p["text"], "bold")
    rows = ["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]
    for i, row in enumerate(rows):
        text(draw, (x + 14, y + 35 + i * 17), row, 11, p["text"] if i == 3 else p["muted"], "bold" if i == 3 else "regular")


def dora_slots(draw, x, y, p):
    card(draw, (x, y, x + 252, y + 72), p)
    text(draw, (x + 12, y + 10), "도라 표시패", 13, p["text"], "bold")
    for i in range(5):
        sx = x + 13 + i * 46
        rr(draw, (sx, y + 36, sx + 34, y + 62), p["elevated"], p["line"], 2, 6)
        center(draw, (sx, y + 33, sx + 34, y + 61), "+", 17, p["muted"], "bold")


def draw_phone(base: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, p: dict):
    rr(draw, (x, y, x + 304, y + 910), p["frame"], None, 1, 26)
    rr(draw, (x + 10, y + 16, x + 294, y + 894), p["bg"], None, 1, 22)
    text(draw, (x + 26, y + 42), p["name"], 19, p["text"] if p["bg"] != "#1f4a40" and p["bg"] != "#111817" and p["bg"] != "#26312f" else "#f7fbf7", "bold")
    text(draw, (x + 26, y + 70), p["desc"], 11, p["muted"] if p["bg"] not in ["#1f4a40", "#111817", "#26312f"] else "#cbd8d0")

    sy = y + 108
    card(draw, (x + 26, sy, x + 278, sy + 76), p)
    text(draw, (x + 38, sy + 10), "화료", 13, p["text"], "bold")
    button(draw, (x + 38, sy + 38, x + 118, sy + 66), "론", p, True)
    button(draw, (x + 128, sy + 38, x + 210, sy + 66), "쯔모", p, False)

    sy += 92
    tile_strip(base, draw, x + 26, sy, p)

    sy += 92
    card(draw, (x + 26, sy, x + 278, sy + 100), p)
    text(draw, (x + 38, sy + 10), "장풍 / 자풍", 13, p["text"], "bold")
    labels = ["동", "남", "서", "북"]
    for i, label in enumerate(labels):
        sx = x + 40 + i * 54
        draw.ellipse((sx, sy + 42, sx + 16, sy + 58), fill=p["surface"], outline=p["primary"], width=2)
        if i in [0, 2]:
            draw.ellipse((sx + 4, sy + 46, sx + 12, sy + 54), fill=p["primary"])
        text(draw, (sx + 21, sy + 39), label, 12, p["text"], "regular")

    sy += 116
    candidate(base, draw, x + 26, sy, p)

    sy += 112
    result(draw, x + 26, sy, p)

    sy += 122
    card(draw, (x + 26, sy, x + 278, sy + 86), p)
    text(draw, (x + 38, sy + 10), "역 / 도라", 13, p["text"], "bold")
    for i, label in enumerate(["리치", "탕야오", "핑후", "도라 1"]):
        px = x + 38 + (i % 2) * 114
        py = sy + 38 + (i // 2) * 24
        pill(draw, (px, py, px + 96, py + 20), label, p)

    sy += 104
    fu_breakdown(draw, x + 26, sy, p)

    sy += 122
    dora_slots(draw, x + 26, sy, p)


def make_board(palettes, out_name: str, title: str):
    img = Image.new("RGB", (1640, 1080), "#e9eef1")
    draw = ImageDraw.Draw(img)
    text(draw, (34, 28), title, 32, "#16242b", "bold")
    text(draw, (34, 70), "Wanted Sans + B2 타일 고정. 색/밀도/표면감만 비교.", 15, "#64737a")
    for i, p in enumerate(palettes):
        draw_phone(img, draw, 34 + i * 318, 112, p)
    img.save(OUTPUTS / out_name)


def write_notes():
    lines = [
        "# UI 톤 시안 v1",
        "",
        "작성일: 2026-07-04",
        "",
        "확정 조건:",
        "",
        "- 폰트: Wanted Sans",
        "- 패 스타일: B2",
        "- 작혼 공식 UI/에셋 복제 없음",
        "- 그라데이션/유리효과/장식 배경 없음",
        "",
        "톤 후보:",
        "",
    ]
    for p in PALETTES:
        lines.append(f"- {p['name']}: {p['desc']}")
    lines.extend(
        [
            "",
            "현재 1차 추천:",
            "",
            "- 01 클린 유틸: 가장 안정적이고 구현 리스크가 낮다.",
            "- 05 금융 계산기: 계산 도구 느낌이 가장 선명하다.",
            "- 09 프로 툴: 정보 밀도가 높은 앱으로 확장하기 좋다.",
            "- 10 동반 앱: 마작 보조앱 느낌을 유지하면서 과장되지 않는다.",
            "",
            "보류 가능성이 큰 후보:",
            "",
            "- 04 점수판 다크: 실사용성은 좋지만 장시간 입력 화면에는 무거울 수 있다.",
            "- 08 공구함: 개성은 있지만 B2 타일과 색 충돌이 생길 수 있다.",
            "- 03 기록지: 따뜻하지만 너무 점수표/종이 느낌으로 갈 수 있다.",
        ]
    )
    (OUTPUTS / "ui-tone-concepts-v1.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    make_board(PALETTES[:5], "ui-tone-concepts-v1-a.png", "UI 톤 시안 01-05")
    make_board(PALETTES[5:], "ui-tone-concepts-v1-b.png", "UI 톤 시안 06-10")
    write_notes()
    print("created tone concepts")


if __name__ == "__main__":
    main()
