from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"


def font(size: int, bold: bool = False):
    candidates = [
        r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def text(draw, xy, value, size=18, fill="#172026", bold=False):
    draw.text(xy, value, font=font(size, bold), fill=fill)


def pill(draw, box, label, selected=False):
    fill = "#143d3b" if selected else "#ffffff"
    outline = "#143d3b" if selected else "#cdd5d1"
    txt = "#ffffff" if selected else "#243034"
    draw.rounded_rectangle(box, radius=10, fill=fill, outline=outline, width=2)
    bbox = draw.textbbox((0, 0), label, font=font(16, True))
    x = box[0] + (box[2] - box[0] - (bbox[2] - bbox[0])) // 2
    y = box[1] + (box[3] - box[1] - (bbox[3] - bbox[1])) // 2
    draw.text((x, y), label, font=font(16, True), fill=txt)


def card(draw, box, title=None):
    draw.rounded_rectangle(box, radius=8, fill="#ffffff", outline="#dbe2df", width=1)
    if title:
        text(draw, (box[0] + 14, box[1] + 12), title, 17, "#172026", True)


def tile(draw, x, y, label):
    draw.rounded_rectangle((x, y, x + 34, y + 46), radius=6, fill="#fbfaf6", outline="#c4ccc8", width=1)
    text(draw, (x + 7, y + 13), label, 14, "#263238", True)


def phone(draw, x, y, title):
    draw.rounded_rectangle((x, y, x + 390, y + 760), radius=34, fill="#111719")
    draw.rounded_rectangle((x + 12, y + 18, x + 378, y + 742), radius=26, fill="#f4f7f5")
    text(draw, (x + 32, y + 38), title, 22, "#172026", True)


def draw_input_screen(draw, x, y):
    phone(draw, x, y, "입력")
    sx, sy = x + 28, y + 84
    card(draw, (sx, sy, sx + 334, sy + 92), "조건")
    pill(draw, (sx + 14, sy + 45, sx + 110, sy + 78), "론", True)
    pill(draw, (sx + 118, sy + 45, sx + 214, sy + 78), "쯔모")
    pill(draw, (sx + 222, sy + 45, sx + 320, sy + 78), "깡직후?")

    sy += 108
    card(draw, (sx, sy, sx + 334, sy + 102), "현재 손패")
    for i, lab in enumerate(["1", "2", "3", "동", "동", "동", "5", "5"]):
        tile(draw, sx + 16 + i * 38, sy + 44, lab)

    sy += 118
    card(draw, (sx, sy, sx + 334, sy + 246), "패 선택")
    labels = ["1만", "2만", "3만", "4만", "5만", "적5", "6만", "7만", "8만", "9만", "동", "남", "서", "북", "백", "발", "중"]
    cx, cy = sx + 14, sy + 46
    for i, lab in enumerate(labels):
        bx = cx + (i % 5) * 62
        by = cy + (i // 5) * 46
        draw.rounded_rectangle((bx, by, bx + 54, by + 36), radius=8, fill="#ffffff", outline="#d0d8d4")
        text(draw, (bx + 10, by + 8), lab, 13, "#263238", True)

    sy += 262
    card(draw, (sx, sy, sx + 334, sy + 122), "후보")
    pill(draw, (sx + 14, sy + 46, sx + 100, sy + 82), "123만")
    pill(draw, (sx + 108, sy + 46, sx + 194, sy + 82), "111만")
    pill(draw, (sx + 202, sy + 46, sx + 320, sy + 82), "후로")


def draw_result_screen(draw, x, y):
    phone(draw, x, y, "결과")
    sx, sy = x + 28, y + 84
    draw.rounded_rectangle((sx, sy, sx + 334, sy + 126), radius=10, fill="#143d3b")
    text(draw, (sx + 18, sy + 18), "자 론", 17, "#dff4ed", True)
    text(draw, (sx + 18, sy + 48), "7700점", 42, "#ffffff", True)
    text(draw, (sx + 18, sy + 98), "3판 40부", 17, "#dff4ed", True)

    sy += 144
    card(draw, (sx, sy, sx + 334, sy + 134), "역 / 도라")
    tags = ["리치", "탕야오", "핑후", "도라 1"]
    for i, tag in enumerate(tags):
        pill(draw, (sx + 14 + (i % 2) * 154, sy + 46 + (i // 2) * 42, sx + 152 + (i % 2) * 154, sy + 78 + (i // 2) * 42), tag, i == 0)

    sy += 150
    card(draw, (sx, sy, sx + 334, sy + 180), "부수 breakdown")
    rows = ["기본부 20", "멘젠 론 +10", "간짱 대기 +2", "합계 32 → 40부"]
    for i, row in enumerate(rows):
        text(draw, (sx + 18, sy + 48 + i * 30), row, 16, "#263238", i == len(rows) - 1)

    sy += 196
    card(draw, (sx, sy, sx + 334, sy + 112), "공유 / 기록")
    pill(draw, (sx + 14, sy + 50, sx + 154, sy + 86), "공유 링크")
    pill(draw, (sx + 168, sy + 50, sx + 320, sy + 86), "기록 저장", True)


def main():
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (940, 840), "#e9efec")
    draw = ImageDraw.Draw(img)
    text(draw, (38, 28), "모바일 와이어프레임 초안", 30, "#172026", True)
    text(draw, (38, 68), "레이아웃 검토용. 최종 색상/간격은 승인 후 조정.", 16, "#4e5b60")
    draw_input_screen(draw, 50, 84)
    draw_result_screen(draw, 500, 84)
    img.save(OUTPUTS / "mobile-wireframes.png")


if __name__ == "__main__":
    main()

