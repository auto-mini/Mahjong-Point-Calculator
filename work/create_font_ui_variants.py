from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from create_design_proposals import render_tile


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"

FONTS = [
    {
        "name": "SUIT",
        "regular": ROOT / "work" / "SUIT" / "fonts" / "static" / "otf" / "SUIT-Regular.otf",
        "medium": ROOT / "work" / "SUIT" / "fonts" / "static" / "otf" / "SUIT-Medium.otf",
        "bold": ROOT / "work" / "SUIT" / "fonts" / "static" / "otf" / "SUIT-Bold.otf",
        "note": "단정한 UI용. 버튼/라벨 균형 좋음.",
    },
    {
        "name": "Pretendard",
        "regular": ROOT / "work" / "pretendard" / "packages" / "pretendard" / "dist" / "public" / "static" / "Pretendard-Regular.otf",
        "medium": ROOT / "work" / "pretendard" / "packages" / "pretendard" / "dist" / "public" / "static" / "Pretendard-Medium.otf",
        "bold": ROOT / "work" / "pretendard" / "packages" / "pretendard" / "dist" / "public" / "static" / "Pretendard-Bold.otf",
        "note": "가장 무난한 현대 웹/앱 기본값.",
    },
    {
        "name": "Wanted Sans",
        "regular": ROOT / "work" / "wanted-sans" / "packages" / "wanted-sans" / "fonts" / "otf" / "WantedSans-Regular.otf",
        "medium": ROOT / "work" / "wanted-sans" / "packages" / "wanted-sans" / "fonts" / "otf" / "WantedSans-Medium.otf",
        "bold": ROOT / "work" / "wanted-sans" / "packages" / "wanted-sans" / "fonts" / "otf" / "WantedSans-Bold.otf",
        "note": "조금 더 기하학적이고 또렷함.",
    },
    {
        "name": "Spoqa Han Sans Neo",
        "regular": ROOT / "work" / "spoqa-han-sans" / "Original" / "SpoqaHanSansNeo" / "SpoqaHanSansNeo-Regular.otf",
        "medium": ROOT / "work" / "spoqa-han-sans" / "Original" / "SpoqaHanSansNeo" / "SpoqaHanSansNeo-Medium.otf",
        "bold": ROOT / "work" / "spoqa-han-sans" / "Original" / "SpoqaHanSansNeo" / "SpoqaHanSansNeo-Bold.otf",
        "note": "차분한 서비스 UI 느낌. 약간 얌전함.",
    },
    {
        "name": "Noto Sans CJK KR",
        "regular": ROOT / "work" / "noto-fonts" / "NotoSansCJKkr-Regular.otf",
        "medium": ROOT / "work" / "noto-fonts" / "NotoSansCJKkr-Regular.otf",
        "bold": ROOT / "work" / "noto-fonts" / "NotoSansCJKkr-Bold.otf",
        "note": "안정적이지만 기본 시스템 느낌이 강함.",
    },
    {
        "name": "Gmarket Sans",
        "regular": ROOT / "work" / "gmarket-sans" / "otf" / "GmarketSansOTF" / "GmarketSansMedium.otf",
        "medium": ROOT / "work" / "gmarket-sans" / "otf" / "GmarketSansOTF" / "GmarketSansMedium.otf",
        "bold": ROOT / "work" / "gmarket-sans" / "otf" / "GmarketSansOTF" / "GmarketSansBold.otf",
        "note": "개성은 있으나 장시간 UI 본문에는 강함.",
    },
]


def load_font(info: dict, size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    path = info.get(weight) or info["regular"]
    if not path.exists():
        fallback = Path(r"C:\Windows\Fonts\malgun.ttf")
        return ImageFont.truetype(str(fallback), size)
    return ImageFont.truetype(str(path), size)


def text(draw: ImageDraw.ImageDraw, xy, value: str, info: dict, size=16, fill="#172026", weight="regular"):
    draw.text(xy, value, font=load_font(info, size, weight), fill=fill)


def center(draw: ImageDraw.ImageDraw, box, value: str, info: dict, size=16, fill="#172026", weight="regular"):
    fnt = load_font(info, size, weight)
    bbox = draw.textbbox((0, 0), value, font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = box[0] + (box[2] - box[0] - tw) // 2
    y = box[1] + (box[3] - box[1] - th) // 2
    draw.text((x, y), value, font=fnt, fill=fill)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def paste_tile(base: Image.Image, x: int, y: int, filename: str, scale=0.35):
    tile = render_tile(filename, "jade", scale)
    base.paste(tile, (x, y), tile)
    return tile.size


def button(draw: ImageDraw.ImageDraw, box, label, info, selected=False):
    if selected:
        fill = "#256b7f"
        line = "#256b7f"
        fg = "#ffffff"
    else:
        fill = "#ffffff"
        line = "#cbd7dd"
        fg = "#172026"
    rounded(draw, box, 9, fill, line, 2)
    center(draw, box, label, info, 14, fg, "bold")


def tag(draw: ImageDraw.ImageDraw, box, label, info):
    rounded(draw, box, 15, "#eef4f6", "#d6e0e5", 1)
    center(draw, box, label, info, 13, "#172026", "medium")


def slot(draw: ImageDraw.ImageDraw, box, label, info):
    rounded(draw, box, 8, "#ffffff", "#cbd7dd", 2)
    center(draw, (box[0], box[1] + 12, box[2], box[3] - 10), "+", info, 20, "#64737a", "bold")
    center(draw, (box[0], box[3] + 1, box[2], box[3] + 22), label, info, 9, "#64737a", "regular")


def draw_panel(img: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, info: dict):
    w, h = 560, 390
    rounded(draw, (x, y, x + w, y + h), 18, "#ffffff", "#d1dde3", 1)
    text(draw, (x + 24, y + 20), info["name"], info, 25, "#16242b", "bold")
    text(draw, (x + 24, y + 53), info["note"], info, 13, "#64737a", "regular")

    rounded(draw, (x + 24, y + 86, x + 246, y + 175), 12, "#f7fafb", "#dbe5ea", 1)
    text(draw, (x + 40, y + 100), "화료", info, 15, "#172026", "bold")
    button(draw, (x + 40, y + 132, x + 126, y + 164), "론", info, True)
    button(draw, (x + 136, y + 132, x + 226, y + 164), "쯔모", info, False)

    rounded(draw, (x + 266, y + 86, x + 536, y + 175), 12, "#f7fafb", "#dbe5ea", 1)
    text(draw, (x + 282, y + 100), "현재 손패", info, 15, "#172026", "bold")
    cx = x + 282
    for filename in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png"]:
        paste_tile(img, cx, y + 128, filename, 0.29)
        cx += 37

    rounded(draw, (x + 24, y + 195, x + 246, y + 350), 12, "#f7fafb", "#dbe5ea", 1)
    text(draw, (x + 40, y + 209), "결과", info, 15, "#172026", "bold")
    rounded(draw, (x + 40, y + 238, x + 226, y + 326), 13, "#256b7f")
    text(draw, (x + 54, y + 248), "자 론", info, 13, "#dff4ed", "bold")
    text(draw, (x + 54, y + 269), "7700점", info, 31, "#ffffff", "bold")
    text(draw, (x + 54, y + 307), "3판 40부", info, 13, "#dff4ed", "bold")

    rounded(draw, (x + 266, y + 195, x + 536, y + 350), 12, "#f7fafb", "#dbe5ea", 1)
    text(draw, (x + 282, y + 209), "역 / 도라", info, 15, "#172026", "bold")
    tags = ["리치", "탕야오", "핑후", "도라 1"]
    for idx, label in enumerate(tags):
        tx = x + 282 + (idx % 2) * 122
        ty = y + 242 + (idx // 2) * 38
        tag(draw, (tx, ty, tx + 108, ty + 29), label, info)

    for i in range(5):
        slot(draw, (x + 282 + i * 47, y + 317, x + 320 + i * 47, y + 349), str(i + 1), info)


def draw_mobile_stack(img: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, info: dict):
    rounded(draw, (x, y, x + 360, y + 820), 34, "#1b252b")
    rounded(draw, (x + 12, y + 18, x + 348, y + 802), 26, "#edf4f7")
    text(draw, (x + 32, y + 46), info["name"], info, 23, "#16242b", "bold")
    text(draw, (x + 32, y + 80), "B2 타일 고정 / 모바일 실제 크기", info, 13, "#64737a")

    sy = y + 120
    rounded(draw, (x + 28, sy, x + 332, sy + 92), 12, "#ffffff", "#cbd7dd", 1)
    text(draw, (x + 44, sy + 14), "화료", info, 15, "#172026", "bold")
    button(draw, (x + 44, sy + 46, x + 142, sy + 78), "론", info, True)
    button(draw, (x + 154, sy + 46, x + 252, sy + 78), "쯔모", info, False)

    sy += 110
    rounded(draw, (x + 28, sy, x + 332, sy + 96), 12, "#ffffff", "#cbd7dd", 1)
    text(draw, (x + 44, sy + 14), "현재 손패", info, 15, "#172026", "bold")
    cx = x + 44
    for filename in ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png", "Ton.png"]:
        paste_tile(img, cx, sy + 45, filename, 0.28)
        cx += 37

    sy += 114
    rounded(draw, (x + 28, sy, x + 332, sy + 118), 12, "#ffffff", "#cbd7dd", 1)
    text(draw, (x + 44, sy + 14), "선택한 패 후보", info, 15, "#172026", "bold")
    rounded(draw, (x + 44, sy + 48, x + 186, sy + 94), 10, "#ffffff", "#256b7f", 2)
    cx = x + 54
    for filename in ["Man1.png", "Man2.png", "Man3.png"]:
        paste_tile(img, cx, sy + 53, filename, 0.26)
        cx += 36
    rounded(draw, (x + 232, sy + 60, x + 252, sy + 80), 5, "#ffffff", "#256b7f", 2)
    text(draw, (x + 262, sy + 58), "후로", info, 14, "#172026")

    sy += 136
    rounded(draw, (x + 28, sy, x + 332, sy + 124), 14, "#256b7f")
    text(draw, (x + 48, sy + 18), "자 론", info, 16, "#dff4ed", "bold")
    text(draw, (x + 48, sy + 47), "7700점", info, 39, "#ffffff", "bold")
    text(draw, (x + 48, sy + 96), "3판 40부", info, 16, "#dff4ed", "bold")

    sy += 142
    rounded(draw, (x + 28, sy, x + 332, sy + 138), 12, "#ffffff", "#cbd7dd", 1)
    text(draw, (x + 44, sy + 14), "부수", info, 15, "#172026", "bold")
    for i, line in enumerate(["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 -> 40부"]):
        text(draw, (x + 48, sy + 44 + i * 23), line, info, 13, "#172026" if i == 3 else "#64737a", "bold" if i == 3 else "regular")


def make_comparison():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (1220, 1340), "#e8f0f3")
    draw = ImageDraw.Draw(img)
    header = FONTS[0]
    text(draw, (34, 28), "폰트 UI 시안 v2 - B2 타일 고정", header, 34, "#16242b", "bold")
    text(draw, (34, 74), "동일한 UI 조각에 오픈 라이선스 한글 폰트를 적용한 비교. 앱 구현 시 외부 CDN 없이 번들링.", header, 16, "#64737a")

    for idx, info in enumerate(FONTS):
        x = 34 + (idx % 2) * 592
        y = 122 + (idx // 2) * 404
        draw_panel(img, draw, x, y, info)

    img.save(OUTPUTS / "font-ui-comparison-v2.png")


def make_mobile_favorites():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    picks = [FONTS[0], FONTS[2], FONTS[1]]
    img = Image.new("RGB", (1240, 940), "#e8f0f3")
    draw = ImageDraw.Draw(img)
    text(draw, (34, 28), "폰트 모바일 적용 후보", FONTS[0], 34, "#16242b", "bold")
    text(draw, (34, 74), "실제 모바일 화면 높이에서 가장 볼만한 세 가지 후보만 확대 비교.", FONTS[0], 16, "#64737a")
    for idx, info in enumerate(picks):
        draw_mobile_stack(img, draw, 48 + idx * 400, 112, info)
    img.save(OUTPUTS / "font-mobile-shortlist-v2.png")


if __name__ == "__main__":
    make_comparison()
    make_mobile_favorites()
    print("created font UI variants")
