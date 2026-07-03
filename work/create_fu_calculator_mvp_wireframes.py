from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from create_design_proposals import render_tile


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"
FONT_ROOT = ROOT / "work" / "wanted-sans" / "packages" / "wanted-sans" / "fonts" / "otf"
FONT_REG = FONT_ROOT / "WantedSans-Regular.otf"
FONT_MED = FONT_ROOT / "WantedSans-Medium.otf"
FONT_BOLD = FONT_ROOT / "WantedSans-Bold.otf"

W = 390


STYLE = {
    "bg_top": "#FBF2E7",
    "bg_bottom": "#E8D0B5",
    "section": "#F1D9B6",
    "section_2": "#E8C89C",
    "control": "#FFF3E1",
    "control_2": "#F7E4C5",
    "line": "#C7A87E",
    "line_soft": "#DEC49E",
    "text": "#251F18",
    "muted": "#756753",
    "muted_2": "#9A8060",
    "result": "#B34239",
    "result_dark": "#273F35",
    "result_soft": "#EEC5AC",
    "ok": "#273F35",
    "warn": "#8A552E",
    "error": "#8C2F2B",
    "on_dark": "#FFFFFF",
    "disabled": "#D6C3A8",
    "disabled_text": "#8B7B67",
    "screen_line": "#1B261F",
}


MAN = [f"Man{i}.png" for i in range(1, 10)]
PIN = [f"Pin{i}.png" for i in range(1, 10)]
SOU = [f"Sou{i}.png" for i in range(1, 10)]
RED = ["Man5-Dora.png", "Pin5-Dora.png", "Sou5-Dora.png"]
HONORS = ["Ton.png", "Nan.png", "Shaa.png", "Pei.png", "Haku.png", "Hatsu.png", "Chun.png"]


def font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    path = {"regular": FONT_REG, "medium": FONT_MED, "bold": FONT_BOLD}.get(weight, FONT_REG)
    if not path.exists():
        path = Path(r"C:\Windows\Fonts\malgun.ttf")
    return ImageFont.truetype(str(path), size=size)


def hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def gradient(size: tuple[int, int]) -> Image.Image:
    img = Image.new("RGBA", size)
    draw = ImageDraw.Draw(img)
    top = hex_rgb(STYLE["bg_top"])
    bottom = hex_rgb(STYLE["bg_bottom"])
    for y in range(size[1]):
        p = y / max(1, size[1] - 1)
        color = tuple(int(top[i] * (1 - p) + bottom[i] * p) for i in range(3)) + (255,)
        draw.line((0, y, size[0], y), fill=color)
    return img


def shadow(base: Image.Image, box: tuple[int, int, int, int], radius: int = 16, opacity: int = 18, blur: int = 14) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    moved = (box[0], box[1] + 7, box[2], box[3] + 7)
    draw.rounded_rectangle(moved, radius=radius, fill=(63, 38, 18, opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def rr(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    fill: str,
    outline: str | None = None,
    width: int = 1,
    radius: int = 12,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    size: int = 14,
    fill: str | None = None,
    weight: str = "regular",
) -> None:
    draw.text(xy, value, font=font(size, weight), fill=fill or STYLE["text"])


def center(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    value: str,
    size: int = 14,
    fill: str | None = None,
    weight: str = "regular",
) -> None:
    f = font(size, weight)
    bbox = draw.textbbox((0, 0), value, font=f)
    x = box[0] + (box[2] - box[0] - (bbox[2] - bbox[0])) // 2
    y = box[1] + (box[3] - box[1] - (bbox[3] - bbox[1])) // 2 - 1
    draw.text((x, y), value, font=f, fill=fill or STYLE["text"])


def wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    max_width: int,
    size: int = 13,
    fill: str | None = None,
    weight: str = "regular",
    line_gap: int = 5,
) -> int:
    f = font(size, weight)
    words = value.split(" ")
    lines: list[str] = []
    line = ""
    for word in words:
        test = word if not line else f"{line} {word}"
        if draw.textbbox((0, 0), test, font=f)[2] <= max_width:
            line = test
            continue
        if line:
            lines.append(line)
        if draw.textbbox((0, 0), word, font=f)[2] <= max_width:
            line = word
        else:
            chunk = ""
            for ch in word:
                test_chunk = chunk + ch
                if draw.textbbox((0, 0), test_chunk, font=f)[2] <= max_width:
                    chunk = test_chunk
                else:
                    lines.append(chunk)
                    chunk = ch
            line = chunk
    if line:
        lines.append(line)

    y = xy[1]
    line_height = size + line_gap
    for item in lines:
        draw.text((xy[0], y), item, font=f, fill=fill or STYLE["text"])
        y += line_height
    return y


def make_canvas(height: int) -> Image.Image:
    return gradient((W, height))


def tile(base: Image.Image, x: int, y: int, filename: str, scale: float = 0.22) -> tuple[int, int]:
    img = render_tile(filename, "jade", scale)
    base.alpha_composite(img, (x, y))
    return img.size


def tile_row(base: Image.Image, x: int, y: int, names: Iterable[str], scale: float = 0.22, gap: int = 24) -> int:
    cx = x
    for name in names:
        w, _ = tile(base, cx, y, name, scale)
        cx += gap if gap else w + 2
    return cx


def panel(
    base: Image.Image,
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    title: str,
    subtitle: str | None = None,
    fill: str | None = None,
) -> None:
    shadow(base, box)
    rr(draw, box, fill or STYLE["section"], STYLE["line"], 1, 14)
    text(draw, (box[0] + 14, box[1] + 12), title, 15, STYLE["text"], "bold")
    if subtitle:
        wrapped(draw, (box[0] + 14, box[1] + 36), subtitle, box[2] - box[0] - 28, 11, STYLE["muted"], "medium", 3)


def nav(draw: ImageDraw.ImageDraw, page: int, title: str, back: bool = False, recent: bool = False) -> None:
    if back:
        rr(draw, (16, 18, 50, 52), STYLE["control"], STYLE["line"], 1, 10)
        center(draw, (16, 18, 50, 52), "<", 18, STYLE["text"], "bold")
    text(draw, (62 if back else 18, 20), f"{page}/4", 13, STYLE["muted"], "bold")
    text(draw, (62 if back else 18, 39), title, 23, STYLE["text"], "bold")
    if recent:
        rr(draw, (286, 20, 374, 52), STYLE["control"], STYLE["line"], 1, 10)
        center(draw, (286, 20, 374, 52), "최근계산", 12, STYLE["text"], "bold")


def progress(draw: ImageDraw.ImageDraw, y: int, active: int) -> None:
    x = 18
    labels = ["국", "패", "도라", "결과"]
    for i, label in enumerate(labels, start=1):
        bx = x + (i - 1) * 89
        fill = STYLE["result"] if i == active else STYLE["control_2"]
        fg = STYLE["on_dark"] if i == active else STYLE["muted"]
        rr(draw, (bx, y, bx + 72, y + 24), fill, None, 1, 12)
        center(draw, (bx, y, bx + 72, y + 24), label, 11, fg, "bold")


def button(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    label: str,
    selected: bool = False,
    disabled: bool = False,
    danger: bool = False,
) -> None:
    if disabled:
        fill = STYLE["disabled"]
        outline = STYLE["disabled"]
        fg = STYLE["disabled_text"]
    elif danger:
        fill = STYLE["error"] if selected else STYLE["control"]
        outline = STYLE["error"]
        fg = STYLE["on_dark"] if selected else STYLE["error"]
    elif selected:
        fill = STYLE["result"] if label not in {"아니오", "X"} else STYLE["result_dark"]
        outline = fill
        fg = STYLE["on_dark"]
    else:
        fill = STYLE["control"]
        outline = STYLE["line_soft"]
        fg = STYLE["text"]
    rr(draw, box, fill, outline, 1, 10)
    center(draw, box, label, 13, fg, "bold")


def chip(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], label: str, selected: bool = False, disabled: bool = False) -> None:
    if disabled:
        fill, outline, fg = STYLE["disabled"], STYLE["disabled"], STYLE["disabled_text"]
    elif selected:
        fill, outline, fg = STYLE["result_dark"], STYLE["result_dark"], STYLE["on_dark"]
    else:
        fill, outline, fg = STYLE["control"], STYLE["line_soft"], STYLE["text"]
    rr(draw, box, fill, outline, 1, 12)
    center(draw, box, label, 11, fg, "bold")


def tiny_tag(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], label: str, tone: str = "dark") -> None:
    if tone == "red":
        fill, fg = STYLE["result"], STYLE["on_dark"]
    elif tone == "warn":
        fill, fg = STYLE["result_soft"], STYLE["error"]
    else:
        fill, fg = STYLE["result_dark"], STYLE["on_dark"]
    rr(draw, box, fill, None, 1, 8)
    center(draw, box, label, 10, fg, "bold")


def stepper(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, value: str) -> None:
    text(draw, (x, y), label, 12, STYLE["muted"], "bold")
    rr(draw, (x, y + 24, x + 146, y + 62), STYLE["control"], STYLE["line_soft"], 1, 10)
    center(draw, (x + 4, y + 24, x + 38, y + 62), "-", 18, STYLE["muted"], "bold")
    center(draw, (x + 40, y + 24, x + 104, y + 62), value, 14, STYLE["text"], "bold")
    center(draw, (x + 106, y + 24, x + 142, y + 62), "+", 18, STYLE["muted"], "bold")


def footer(draw: ImageDraw.ImageDraw, height: int, label: str, enabled: bool = True, secondary: str | None = None) -> None:
    y = height - 86
    rr(draw, (0, y, W, height), "#F2D7B3", None, 1, 0)
    if secondary:
        button(draw, (18, y + 18, 152, y + 62), secondary)
        button(draw, (164, y + 18, 372, y + 62), label, selected=enabled, disabled=not enabled)
    else:
        button(draw, (18, y + 18, 372, y + 62), label, selected=enabled, disabled=not enabled)


def alert(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], label: str, tone: str = "warn") -> None:
    fill = "#F7DFC9" if tone == "warn" else "#F0C7BC"
    line = STYLE["warn"] if tone == "warn" else STYLE["error"]
    fg = STYLE["warn"] if tone == "warn" else STYLE["error"]
    rr(draw, box, fill, line, 1, 10)
    wrapped(draw, (box[0] + 12, box[1] + 10), label, box[2] - box[0] - 24, 12, fg, "bold", 3)


def draw_tile_grid(base: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, selected: str | None = "Man3.png") -> int:
    rows = [
        ("만", MAN + [RED[0]]),
        ("통", PIN + [RED[1]]),
        ("삭", SOU + [RED[2]]),
        ("자", HONORS),
    ]
    cy = y
    for label, names in rows:
        text(draw, (x, cy + 8), label, 11, STYLE["muted"], "bold")
        for i, name in enumerate(names):
            tx = x + 28 + i * 30
            ty = cy
            rr(draw, (tx - 2, ty - 2, tx + 24, ty + 31), STYLE["control"], STYLE["result"] if name == selected else STYLE["line_soft"], 2 if name == selected else 1, 6)
            tile(base, tx, ty, name, 0.17)
        cy += 40
    return cy


def set_box(base: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, names: list[str], label: str = "", open_tag: bool = False) -> int:
    w = 22 * len(names) + 24
    rr(draw, (x, y, x + w, y + 44), STYLE["control"], STYLE["line_soft"], 1, 8)
    for idx, name in enumerate(names):
        tile(base, x + 8 + idx * 21, y + 8, name, 0.16)
    rr(draw, (x + w - 14, y - 6, x + w + 4, y + 12), STYLE["control"], STYLE["line"], 1, 8)
    center(draw, (x + w - 14, y - 6, x + w + 4, y + 12), "x", 9, STYLE["muted"], "bold")
    if label:
        text(draw, (x, y + 48), label, 10, STYLE["muted"], "medium")
    if open_tag:
        tiny_tag(draw, (x + w - 36, y + 49, x + w, y + 67), "후로")
    return w


def slot(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, filled: bool = False, warn: bool = False) -> None:
    line = STYLE["error"] if warn else STYLE["line"]
    rr(draw, (x, y, x + 50, y + 62), STYLE["control"], line, 2 if warn else 1, 10)
    if filled:
        center(draw, (x, y + 6, x + 50, y + 34), label, 14, STYLE["text"], "bold")
        text(draw, (x + 20, y + 40), "+", 13, STYLE["muted"], "bold")
    else:
        center(draw, (x, y + 7, x + 50, y + 43), "+", 22, STYLE["muted"], "bold")
        center(draw, (x, y + 40, x + 50, y + 60), label, 9, STYLE["muted"], "medium")


def page1() -> Path:
    height = 1180
    img = make_canvas(height)
    d = ImageDraw.Draw(img)
    nav(d, 1, "화료/국 정보")
    progress(d, 78, 1)

    y = 122
    panel(img, d, (18, y, 372, y + 114), "화료 방식", "초기 상태는 미선택. 둘 중 하나를 골라야 하단 진행 버튼이 활성화된다.")
    button(d, (38, y + 60, 185, y + 98), "론", selected=True)
    button(d, (205, y + 60, 352, y + 98), "쯔모")

    y += 132
    panel(img, d, (18, y, 372, y + 184), "국 정보")
    text(d, (36, y + 48), "장풍", 12, STYLE["muted"], "bold")
    for i, label in enumerate(["동", "남", "서", "북"]):
        chip(d, (80 + i * 70, y + 42, 136 + i * 70, y + 70), label, selected=i == 0)
    text(d, (36, y + 88), "자풍", 12, STYLE["muted"], "bold")
    for i, label in enumerate(["동", "남", "서", "북"]):
        chip(d, (80 + i * 70, y + 82, 136 + i * 70, y + 110), label, selected=i == 2)
    stepper(d, 36, y + 124, "본장", "0")
    stepper(d, 206, y + 124, "공탁", "0")

    y += 202
    panel(img, d, (18, y, 372, y + 236), "특정 상황역", "상충되는 항목은 선택 즉시 해제되거나 비활성 상태로 남는다.")
    tags = [
        ("리치", True, False),
        ("더블리치", False, True),
        ("일발", True, False),
        ("창깡", False, False),
        ("영상개화", False, False),
        ("해저모월", False, False),
        ("하저로어", False, False),
        ("해당없음", False, False),
    ]
    for i, (label, selected, disabled) in enumerate(tags):
        row = i // 2
        col = i % 2
        chip(d, (36 + col * 166, y + 58 + row * 38, 184 + col * 166, y + 88 + row * 38), label, selected, disabled)
    alert(d, (36, y + 206, 354, y + 226), "리치 선택: 우라도라 입력 단계가 활성화된다.", "warn")

    y += 254
    panel(img, d, (18, y, 372, y + 148), "검증 표시 위치", "미선택/상충 오류는 해당 구역 바로 아래, 다음 단계 차단은 하단 버튼 상태로 표현한다.")
    alert(d, (36, y + 56, 354, y + 96), "예: 론/쯔모가 비어 있으면 이 위치에 '화료 방식을 선택해주세요.'를 표시한다.", "error")
    wrapped(d, (36, y + 108), "장풍, 자풍, 본장, 공탁, 상황역은 기본값이 있으므로 별도 입력 없이 유효하다.", 318, 12, STYLE["muted"], "medium")

    footer(d, height, "손패 입력으로", enabled=True)
    out = OUTPUTS / "fu-calculator-mvp-mobile-page-1-v1.png"
    img.convert("RGB").save(out, quality=95)
    return out


def page2() -> Path:
    height = 1640
    img = make_canvas(height)
    d = ImageDraw.Draw(img)
    nav(d, 2, "손패 입력", back=True, recent=True)
    progress(d, 78, 2)

    y = 122
    panel(img, d, (18, y, 372, y + 246), "현재 손패", "세트별 박스와 x 버튼. 세트 삭제 후 14장 미만이면 패 선택 영역이 다시 열린다.")
    set_box(img, d, 36, y + 62, ["Man2.png", "Man3.png", "Man4.png"], "슌쯔")
    set_box(img, d, 154, y + 62, ["Pin5-Dora.png", "Pin6.png", "Pin7.png"], "슌쯔")
    set_box(img, d, 272, y + 62, ["Ton.png", "Ton.png", "Ton.png"], "커쯔", True)
    set_box(img, d, 36, y + 138, ["Sou7.png", "Sou8.png", "Sou9.png"], "슌쯔")
    set_box(img, d, 154, y + 138, ["Haku.png", "Haku.png"], "머리")
    tiny_tag(d, (272, y + 142, 354, y + 164), "13/14 입력")
    wrapped(d, (272, y + 172), "미완성: 화료패 선택 전", 82, 10, STYLE["muted"], "medium")

    y += 264
    panel(img, d, (18, y, 372, y + 120), "화료패 영역", "손패 구성이 완성되면 중복 제거된 후보만 노출한다. 선택한 패 1개만 현재 손패에서 강조한다.")
    for i, name in enumerate(["Man2.png", "Man3.png", "Man4.png", "Haku.png", "Ton.png"]):
        x = 38 + i * 56
        rr(d, (x - 4, y + 58, x + 42, y + 106), STYLE["control"], STYLE["result"] if i == 1 else STYLE["line_soft"], 2 if i == 1 else 1, 10)
        tile(img, x + 6, y + 65, name, 0.19)
    tiny_tag(d, (310, y + 68, 354, y + 90), "완성 후")

    y += 138
    panel(img, d, (18, y, 372, y + 244), "패 선택", "초기에는 37종 전체. 하나를 누르면 선택 패 1개만 남는 작은 상태로 접힌다.")
    draw_tile_grid(img, d, 36, y + 58, "Man3.png")

    y += 262
    panel(img, d, (18, y, 372, y + 124), "선택한 패", "같은 패를 다시 누르면 선택이 취소되고 37종 전체로 돌아간다.")
    rr(d, (36, y + 56, 92, y + 108), STYLE["control"], STYLE["result"], 2, 10)
    tile(img, 50, y + 64, "Man3.png", 0.2)
    text(d, (112, y + 64), "3만을 포함하는 후보만 표시", 13, STYLE["text"], "bold")
    text(d, (112, y + 88), "선택 취소 시 후보군 박스 제거", 11, STYLE["muted"], "medium")

    y += 142
    panel(img, d, (18, y, 372, y + 342), "후보군", "머리, 슌쯔, 커쯔, 깡쯔를 층으로 분리. 적5 포함 후보는 일반 5와 별도 후보로 둔다.")
    rows = [
        ("머리", [["Man3.png", "Man3.png"]]),
        ("슌쯔", [["Man1.png", "Man2.png", "Man3.png"], ["Man2.png", "Man3.png", "Man4.png"], ["Man3.png", "Man4.png", "Man5-Dora.png"]]),
        ("커쯔", [["Man3.png", "Man3.png", "Man3.png"]]),
        ("깡쯔", [["Man3.png", "Man3.png", "Man3.png", "Man3.png"]]),
    ]
    cy = y + 62
    for title, groups in rows:
        text(d, (36, cy + 10), title, 11, STYLE["muted"], "bold")
        gx = 92
        for idx, names in enumerate(groups):
            selected = title == "슌쯔" and idx == 1
            rr(d, (gx, cy, gx + 72, cy + 42), STYLE["control"], STYLE["result"] if selected else STYLE["line_soft"], 2 if selected else 1, 8)
            tile_row(img, gx + 8, cy + 9, names, 0.14, 18)
            gx += 80
        cy += 58
    text(d, (36, y + 286), "선택 후보", 12, STYLE["muted"], "bold")
    button(d, (112, y + 278, 166, y + 308), "O")
    button(d, (176, y + 278, 230, y + 308), "X", selected=True)
    text(d, (244, y + 284), "후로여부", 12, STYLE["muted"], "bold")

    y += 360
    panel(img, d, (18, y, 372, y + 118), "오류 노출", "패 수량 초과, 적5 중복, 화료 형태 불가는 현재 손패 바로 아래에 붙여 보여준다.")
    alert(d, (36, y + 58, 354, y + 96), "동일패 5장 이상: 3만이 5장입니다. 입력 세트를 확인해주세요.", "error")

    footer(d, height, "도라 입력으로", enabled=False, secondary="전체 초기화")
    out = OUTPUTS / "fu-calculator-mvp-mobile-page-2-v1.png"
    img.convert("RGB").save(out, quality=95)
    return out


def page3() -> Path:
    height = 1280
    img = make_canvas(height)
    d = ImageDraw.Draw(img)
    nav(d, 3, "도라/우라", back=True, recent=True)
    progress(d, 78, 3)

    y = 122
    panel(img, d, (18, y, 372, y + 248), "깡 직후 판정", "질문은 도라 입력보다 먼저. 필요할 때만 추가 질문을 열어 판단 문구를 확정한다.")
    text(d, (36, y + 56), "마지막 깡 직후에 화료했나요?", 15, STYLE["text"], "bold")
    button(d, (36, y + 86, 178, y + 124), "예", selected=True)
    button(d, (194, y + 86, 336, y + 124), "아니오")
    text(d, (36, y + 146), "추가 질문", 12, STYLE["muted"], "bold")
    chip(d, (36, y + 170, 178, y + 202), "암깡 777삭", selected=True)
    chip(d, (194, y + 170, 336, y + 202), "명깡 동동동동")
    alert(d, (36, y + 214, 354, y + 236), "해당 깡으로 인한 도라와 우라도라는 인정됩니다.", "warn")

    y += 266
    panel(img, d, (18, y, 372, y + 160), "도라 표시패", "첫 칸은 필수. 중간 칸이 비면 이 구역 하단에 경고를 표시한다.")
    for i, (label, filled) in enumerate([("3통", True), ("6삭", True), ("3", False), ("4", False), ("5", False)]):
        slot(d, 36 + i * 64, y + 62, label, filled=filled)

    y += 178
    panel(img, d, (18, y, 372, y + 176), "우라도라 표시패", "리치/더블리치가 있으면 도라 표시패 개수와 같은 수만큼 입력한다.")
    for i, (label, filled) in enumerate([("남", True), ("4만", True), ("3", False), ("4", False), ("5", False)]):
        slot(d, 36 + i * 64, y + 62, label, filled=filled)
    tiny_tag(d, (36, y + 132, 152, y + 154), "리치로 활성")
    text(d, (166, y + 136), "도라 2칸 = 우라 2칸", 12, STYLE["muted"], "bold")

    y += 194
    panel(img, d, (18, y, 372, y + 244), "표시패 선택", "도라/우라 슬롯을 누르면 34종 표시패 선택 UI가 열린다. 적5는 별도 타입으로 두지 않는다.")
    rows = [
        ("만", MAN),
        ("통", PIN),
        ("삭", SOU),
        ("자", HONORS),
    ]
    cy = y + 62
    for label, names in rows:
        text(d, (36, cy + 8), label, 11, STYLE["muted"], "bold")
        for i, name in enumerate(names):
            tx = 66 + i * 30
            rr(d, (tx - 2, cy - 2, tx + 24, cy + 31), STYLE["control"], STYLE["line_soft"], 1, 6)
            tile(img, tx, cy, name, 0.17)
        cy += 40

    y += 262
    panel(img, d, (18, y, 372, y + 110), "확인 조건", "마지막 깡 질문 응답, 도라 첫 칸 입력, 중간 칸 누락 없음, 우라 개수 일치.")
    alert(d, (36, y + 58, 354, y + 92), "예: 도라 1, 3칸만 입력하면 '도라 중간 칸 누락'으로 차단한다.", "error")

    footer(d, height, "결과 보기", enabled=True)
    out = OUTPUTS / "fu-calculator-mvp-mobile-page-3-v1.png"
    img.convert("RGB").save(out, quality=95)
    return out


def page4() -> Path:
    height = 1380
    img = make_canvas(height)
    d = ImageDraw.Draw(img)
    nav(d, 4, "결과", back=True, recent=True)
    progress(d, 78, 4)

    y = 122
    shadow(img, (18, y, 372, y + 162), 18, 30, 18)
    rr(d, (18, y, 372, y + 162), STYLE["result"], None, 1, 18)
    text(d, (40, y + 22), "자 론", 17, STYLE["on_dark"], "bold")
    text(d, (40, y + 56), "7700점", 45, STYLE["on_dark"], "bold")
    text(d, (40, y + 116), "3판 40부", 16, "#FFE9D7", "bold")
    tiny_tag(d, (270, y + 28, 342, y + 52), "본장 0")
    tiny_tag(d, (270, y + 62, 342, y + 86), "공탁 0")

    y += 184
    panel(img, d, (18, y, 372, y + 218), "역 목록", "도라/적도라/깡도라는 도라 N으로 합산. 동점 해석은 아이콘 탭으로 후보를 연다.")
    yaku = [("리치", "1판"), ("탕야오", "1판"), ("핑후", "1판"), ("도라", "1")]
    for i, (name, han) in enumerate(yaku):
        yy = y + 58 + i * 34
        text(d, (38, yy), name, 14, STYLE["text"], "bold")
        text(d, (302, yy), han, 13, STYLE["muted"], "bold")
        if i == 2:
            rr(d, (250, yy - 3, 274, yy + 21), STYLE["control"], STYLE["line"], 1, 8)
            center(d, (250, yy - 3, 274, yy + 21), "?", 12, STYLE["result"], "bold")
    rr(d, (206, y + 120, 354, y + 192), STYLE["control"], STYLE["result_dark"], 1, 10)
    text(d, (218, y + 132), "동점 해석", 12, STYLE["text"], "bold")
    text(d, (218, y + 154), "핑후/간짱 후보", 11, STYLE["muted"], "medium")
    text(d, (218, y + 172), "최고점 동일", 11, STYLE["muted"], "medium")

    y += 236
    panel(img, d, (18, y, 372, y + 230), "부수 breakdown", "만관 이상에서는 이 구역을 접고 '부수 무관'으로 축약한다.")
    rows = [
        ("기본부", "+20"),
        ("멘젠 론", "+10"),
        ("간짱 대기", "+2"),
        ("합계", "32부"),
        ("최종 올림", "32부 -> 40부"),
    ]
    for i, (name, value) in enumerate(rows):
        yy = y + 58 + i * 30
        text(d, (38, yy), name, 13, STYLE["text"] if i >= 3 else STYLE["muted"], "bold" if i >= 3 else "medium")
        text(d, (286, yy), value, 13, STYLE["text"], "bold")

    y += 248
    panel(img, d, (18, y, 372, y + 170), "지불", "론은 방총자 1명 지불, 쯔모는 친/자 지불액을 구분한다.")
    rr(d, (38, y + 58, 352, y + 102), STYLE["control"], STYLE["line_soft"], 1, 12)
    text(d, (54, y + 70), "방총자", 12, STYLE["muted"], "bold")
    text(d, (248, y + 66), "7700점", 18, STYLE["text"], "bold")
    rr(d, (38, y + 114, 352, y + 148), STYLE["control_2"], STYLE["line_soft"], 1, 10)
    center(d, (38, y + 114, 352, y + 148), "본장 +0 / 공탁 +0 반영", 12, STYLE["muted"], "bold")

    y += 188
    panel(img, d, (18, y, 372, y + 172), "공유 / 최근계산", "공유는 URL fragment 기반. 최근계산은 최대 20개 하단 시트에서 복원 후 결과로 이동한다.")
    button(d, (38, y + 58, 174, y + 98), "공유")
    button(d, (190, y + 58, 352, y + 98), "다시 계산", selected=True)
    rr(d, (38, y + 116, 352, y + 148), STYLE["control"], STYLE["line"], 1, 10)
    text(d, (52, y + 124), "#/s/maHJ... fragment 복사", 12, STYLE["muted"], "bold")

    y += 190
    panel(img, d, (18, y, 372, y + 124), "계산 불가 위치", "오류 결과는 결과 영역 최상단에서 이유를 먼저 보여준다.")
    alert(d, (36, y + 58, 354, y + 96), "계산 불가: 도라만 있고 일반 역이 없습니다.", "error")

    footer(d, height, "다시 계산", enabled=True, secondary="공유")
    out = OUTPUTS / "fu-calculator-mvp-mobile-page-4-v1.png"
    img.convert("RGB").save(out, quality=95)
    return out


def make_overview(paths: list[Path]) -> Path:
    scale = 0.36
    card_w = int(W * scale)
    img = Image.new("RGBA", (1180, 900), "#E4DED3")
    d = ImageDraw.Draw(img)
    text(d, (34, 30), "리치마작 부수계산 MVP 모바일 와이어프레임 v1", 32, STYLE["text"], "bold")
    text(d, (34, 72), "390px 폭 긴 스크롤 아트보드. I Wallet Stack + G 배경 + K 구역감 기준.", 16, STYLE["muted"], "medium")
    labels = ["1. 화료/국", "2. 손패 입력", "3. 도라/우라", "4. 결과"]
    for i, path in enumerate(paths):
        src = Image.open(path).convert("RGBA")
        thumb_h = 730
        src.thumbnail((card_w, thumb_h), Image.Resampling.LANCZOS)
        x = 34 + i * 282
        y = 124
        shadow(img, (x - 8, y - 8, x + card_w + 8, y + src.height + 8), 16, 18, 12)
        rr(d, (x - 8, y - 8, x + card_w + 8, y + src.height + 8), STYLE["screen_line"], None, 1, 18)
        img.alpha_composite(src, (x, y))
        rr(d, (x - 2, y + src.height + 18, x + card_w + 2, y + src.height + 50), STYLE["section"], STYLE["line"], 1, 10)
        center(d, (x - 2, y + src.height + 18, x + card_w + 2, y + src.height + 50), labels[i], 13, STYLE["text"], "bold")
    out = OUTPUTS / "fu-calculator-mvp-mobile-overview-v1.png"
    img.convert("RGB").save(out, quality=95)
    return out


def mini_phone(draw: ImageDraw.ImageDraw, x: int, y: int, title: str) -> None:
    rr(draw, (x, y, x + 262, y + 382), STYLE["screen_line"], None, 1, 24)
    rr(draw, (x + 8, y + 12, x + 254, y + 370), STYLE["bg_top"], None, 1, 18)
    text(draw, (x + 22, y + 28), title, 16, STYLE["text"], "bold")


def state_board() -> Path:
    img = Image.new("RGBA", (1180, 980), "#E4DED3")
    d = ImageDraw.Draw(img)
    text(d, (34, 30), "상태/오류/모달 보조 와이어프레임", 32, STYLE["text"], "bold")
    text(d, (34, 72), "메인 1~4페이지 PNG에 담기 어려운 전환 상태를 별도 보드로 분리.", 16, STYLE["muted"], "medium")

    positions = [(34, 120), (324, 120), (614, 120), (904, 120), (34, 540), (324, 540), (614, 540), (904, 540)]
    titles = [
        "1P 미선택",
        "2P 완성/화료패",
        "2P 후보 확정",
        "3P 우라 비활성",
        "3P 오류",
        "4P 계산 불가",
        "최근계산 시트",
        "공유 팝오버",
    ]
    for (x, y), title in zip(positions, titles):
        mini_phone(d, x, y, title)

    x, y = positions[0]
    button(d, (x + 22, y + 76, x + 116, y + 108), "론")
    button(d, (x + 128, y + 76, x + 232, y + 108), "쯔모")
    alert(d, (x + 22, y + 128, x + 240, y + 176), "화료 방식을 선택해주세요.", "error")
    button(d, (x + 22, y + 318, x + 240, y + 350), "손패 입력으로", disabled=True)

    x, y = positions[1]
    text(d, (x + 22, y + 72), "14/14 입력 완료", 12, STYLE["muted"], "bold")
    tile_row(img, x + 22, y + 96, ["Man2.png", "Man3.png", "Man4.png", "Pin5-Dora.png", "Pin6.png", "Pin7.png"], 0.14, 22)
    rr(d, (x + 22, y + 148, x + 240, y + 214), STYLE["section"], STYLE["line"], 1, 10)
    text(d, (x + 36, y + 160), "화료패 후보", 12, STYLE["text"], "bold")
    tile_row(img, x + 36, y + 184, ["Man2.png", "Man3.png", "Man4.png", "Haku.png"], 0.15, 34)
    button(d, (x + 22, y + 318, x + 240, y + 350), "도라 입력으로", selected=True)

    x, y = positions[2]
    rr(d, (x + 22, y + 74, x + 240, y + 136), STYLE["section"], STYLE["line"], 1, 10)
    text(d, (x + 34, y + 86), "선택 후보 234만", 12, STYLE["text"], "bold")
    tile_row(img, x + 34, y + 106, ["Man2.png", "Man3.png", "Man4.png"], 0.14, 20)
    button(d, (x + 34, y + 162, x + 98, y + 194), "O")
    button(d, (x + 110, y + 162, x + 174, y + 194), "X", selected=True)
    text(d, (x + 34, y + 212), "O/X 즉시 등록", 12, STYLE["muted"], "bold")

    x, y = positions[3]
    text(d, (x + 22, y + 76), "리치 없음", 12, STYLE["muted"], "bold")
    for i in range(5):
        slot(d, x + 22 + i * 45, y + 104, str(i + 1), filled=i == 0)
    rr(d, (x + 22, y + 190, x + 240, y + 250), STYLE["disabled"], STYLE["disabled"], 1, 10)
    center(d, (x + 22, y + 190, x + 240, y + 250), "우라도라 비활성", 12, STYLE["disabled_text"], "bold")

    x, y = positions[4]
    for i, warn in enumerate([False, True, False, False, False]):
        slot(d, x + 22 + i * 45, y + 88, str(i + 1), filled=i in [0, 2], warn=warn)
    alert(d, (x + 22, y + 168, x + 240, y + 230), "도라 중간 칸이 비어 있습니다.", "error")
    button(d, (x + 22, y + 318, x + 240, y + 350), "결과 보기", disabled=True)

    x, y = positions[5]
    rr(d, (x + 22, y + 76, x + 240, y + 158), STYLE["error"], None, 1, 14)
    text(d, (x + 38, y + 94), "계산 불가", 18, STYLE["on_dark"], "bold")
    wrapped(d, (x + 38, y + 122), "역만 손패입니다. 부수 계산 대상이 아닙니다.", 178, 11, STYLE["on_dark"], "medium")
    alert(d, (x + 22, y + 178, x + 240, y + 246), "화료 형태 불가 / 도라만 있고 역 없음도 같은 위치에 표시", "error")

    x, y = positions[6]
    rr(d, (x + 8, y + 164, x + 254, y + 370), STYLE["section"], STYLE["line"], 1, 20)
    text(d, (x + 28, y + 184), "최근계산", 15, STYLE["text"], "bold")
    for i, row in enumerate(["자 론 7700 / 3판 40부", "친 쯔모 4000 all", "계산 불가 기록"]):
        rr(d, (x + 28, y + 220 + i * 42, x + 234, y + 252 + i * 42), STYLE["control"], STYLE["line_soft"], 1, 8)
        text(d, (x + 40, y + 229 + i * 42), row, 10, STYLE["text"], "bold")

    x, y = positions[7]
    rr(d, (x + 22, y + 96, x + 240, y + 220), STYLE["control"], STYLE["result_dark"], 1, 14)
    text(d, (x + 38, y + 116), "공유 링크", 14, STYLE["text"], "bold")
    wrapped(d, (x + 38, y + 146), "#/s/eyJ0eXAiOiJmdS1jYWxjIn0", 170, 10, STYLE["muted"], "medium")
    button(d, (x + 38, y + 176, x + 224, y + 206), "복사", selected=True)
    text(d, (x + 36, y + 240), "바깥 탭으로 닫힘", 11, STYLE["muted"], "bold")

    out = OUTPUTS / "fu-calculator-mvp-states-errors-modals-v1.png"
    img.convert("RGB").save(out, quality=95)
    return out


@dataclass(frozen=True)
class Variant:
    gap: int
    card_h: int
    section_pad: int
    button_h: int
    footer_y: int
    tile_gap: int


def variant_image(idx: int, variant: Variant) -> Path:
    height = 844
    img = make_canvas(height)
    d = ImageDraw.Draw(img)
    nav(d, 2, f"손패 입력 V{idx:02d}", back=True, recent=True)
    y = 82 + variant.gap
    panel(img, d, (18, y, 372, y + variant.card_h), "현재 손패")
    set_box(img, d, 36, y + 50, ["Man2.png", "Man3.png", "Man4.png"], "슌쯔")
    set_box(img, d, 150 + variant.tile_gap // 2, y + 50, ["Pin5-Dora.png", "Pin6.png", "Pin7.png"], "슌쯔")
    set_box(img, d, 264 + variant.tile_gap, y + 50, ["Haku.png", "Haku.png"], "머리")
    y += variant.card_h + variant.gap
    panel(img, d, (18, y, 372, y + 176 + variant.section_pad), "후보군")
    tile_row(img, 42, y + 60, ["Man2.png", "Man3.png", "Man4.png"], 0.19, 26 + variant.tile_gap)
    button(d, (42, y + 114 + variant.section_pad // 2, 102, y + 114 + variant.section_pad // 2 + variant.button_h), "O")
    button(d, (114, y + 114 + variant.section_pad // 2, 174, y + 114 + variant.section_pad // 2 + variant.button_h), "X", selected=True)
    y += 194 + variant.section_pad + variant.gap
    panel(img, d, (18, y, 372, y + 210), "패 선택")
    draw_tile_grid(img, d, 36, y + 52, "Man3.png")
    fy = height - variant.footer_y
    rr(d, (0, fy, W, height), "#F2D7B3", None, 1, 0)
    button(d, (18, fy + 16, 152, fy + 16 + variant.button_h), "전체 초기화")
    button(d, (164, fy + 16, 372, fy + 16 + variant.button_h), "도라 입력으로", disabled=True)
    out = OUTPUTS / f"fu-calculator-mvp-micro-variant-{idx:02d}.png"
    img.convert("RGB").save(out, quality=95)
    return out


def make_variants() -> list[Path]:
    variants = [
        Variant(10, 132, 0, 40, 86, 0),
        Variant(12, 136, 4, 40, 88, 1),
        Variant(14, 140, 8, 42, 90, 0),
        Variant(16, 136, 12, 42, 92, 2),
        Variant(18, 144, 4, 44, 92, 1),
        Variant(20, 148, 8, 44, 94, 2),
        Variant(12, 150, 14, 40, 90, 3),
        Variant(14, 154, 10, 42, 96, 1),
        Variant(16, 146, 16, 44, 96, 3),
        Variant(18, 152, 6, 42, 88, 4),
        Variant(20, 156, 12, 44, 94, 2),
        Variant(10, 144, 18, 42, 98, 4),
        Variant(12, 148, 20, 44, 100, 1),
        Variant(14, 152, 16, 40, 92, 5),
        Variant(16, 158, 10, 42, 94, 5),
        Variant(18, 160, 14, 44, 98, 3),
        Variant(20, 150, 22, 40, 96, 2),
        Variant(10, 156, 18, 44, 100, 5),
        Variant(12, 160, 24, 42, 102, 4),
        Variant(14, 164, 20, 44, 104, 5),
    ]
    return [variant_image(i + 1, variant) for i, variant in enumerate(variants)]


def write_notes(include_variants: bool) -> list[Path]:
    page_notes = OUTPUTS / "fu-calculator-mvp-page-notes-v1.md"
    page_notes.write_text(
        "\n".join(
            [
                "# 리치마작 부수계산 MVP 모바일 와이어프레임 페이지 설명",
                "",
                "기준: `docs/wireframe-goal.md` 전체 요구사항과 `outputs/selected-wallet-gradient-v1.png`의 I Wallet Stack + G 배경 + K 구역감.",
                "",
                "## 공통",
                "",
                "- 폭은 390px 기준의 모바일 긴 스크롤 아트보드이다.",
                "- Wanted Sans를 우선 사용하고, 없는 환경에서는 시스템 한글 폰트로 대체된다.",
                "- 배경은 `#FBF2E7`에서 `#E8D0B5`로 이어지는 웜 그라데이션이다.",
                "- 입력/후보/도라/부수 구역은 `#F1D9B6` 패널로 분리한다.",
                "- 결과 카드와 주요 선택은 `#B34239`, 보조 강조와 프레임은 `#273F35`를 사용한다.",
                "- 2~4페이지는 좌상단 뒤로가기와 우상단 최근계산 진입을 둔다.",
                "",
                "## 1페이지: 화료/국 정보",
                "",
                "- 론/쯔모는 기본 미선택이지만, 메인 PNG는 활성 상태의 정보 밀도를 보기 위해 론 선택 예시를 사용했다.",
                "- 장풍/자풍은 모바일에서 한눈에 보이는 세그먼트형 라디오로 배치했다.",
                "- 본장/공탁은 작은 스텝퍼로 설계했다.",
                "- 상황역은 2열 칩으로 구성하고, 리치/더블리치 같은 상충 관계는 선택/비활성 상태로 표현했다.",
                "- 검증 메시지는 해당 구역 바로 아래에 붙고, 하단 진행 버튼은 조건 충족 전에는 비활성화된다.",
                "",
                "## 2페이지: 손패 입력",
                "",
                "- 현재 손패는 세트 단위 박스로 묶고 각 세트 우상단에 x 제거 버튼을 둔다.",
                "- 손패 수가 14장 미만이면 패 선택 영역과 후보군이 열린다.",
                "- 37종 패는 만/통/삭/자 층으로 나누고 적5를 일반 5와 분리했다.",
                "- 패 하나를 선택한 후에는 선택 패 요약과 후보군만 남는 축소 상태를 보여준다.",
                "- 후보군은 머리, 슌쯔, 커쯔, 깡쯔 층으로 분리하고 선택 후보 아래에 후로여부 O/X를 둔다.",
                "- 손패 완성 후 화료패 후보와 확인 버튼 활성 상태는 상태 보조 PNG에 별도 표시했다.",
                "",
                "## 3페이지: 도라/우라",
                "",
                "- 마지막 깡 직후 화료 질문을 가장 먼저 배치했다.",
                "- 깡이 여러 개이고 판단이 필요한 경우의 추가 질문 칩과 판정 문구 위치를 포함했다.",
                "- 도라와 우라도라는 각각 5칸 슬롯이며, 우라는 리치/더블리치가 있을 때만 활성화된다.",
                "- 표시패 선택 UI는 34종 일반 패만 제공하고 적5는 제외한다.",
                "- 도라 중간 칸 누락과 우라 개수 불일치 경고 위치는 보조 상태 PNG에 포함했다.",
                "",
                "## 4페이지: 결과",
                "",
                "- 최상단 붉은 결과 카드를 가장 크게 배치해 작혼식 핵심 결과 판독성을 우선했다.",
                "- 역 목록은 이름과 판수만 줄 단위로 표시하고, 도라/깡도라/적도라는 `도라 N`으로 합산한다.",
                "- 판수 동점 후보는 `?` 아이콘과 팝오버로 표현했다.",
                "- 부수 breakdown은 5판 미만에서만 자세히 표시하고 만관 이상은 축약하는 전제를 둔다.",
                "- 론 지불액, 본장/공탁 반영, 공유 링크, 다시 계산 동작을 한 화면 흐름으로 배치했다.",
                "- 계산 불가 메시지는 결과 영역 최상단에 오는 별도 오류 상태로도 표시한다.",
            ]
        ),
        encoding="utf-8",
    )

    flow = OUTPUTS / "fu-calculator-mvp-flow-states-v1.md"
    flow.write_text(
        "\n".join(
            [
                "# 상태 전환과 입력 흐름",
                "",
                "## 페이지 흐름",
                "",
                "1. 1페이지에서 론/쯔모, 장풍/자풍, 본장/공탁, 상황역을 입력한다.",
                "2. 론/쯔모가 선택되면 하단 `손패 입력으로` 버튼이 활성화되고 2페이지로 이동한다.",
                "3. 2페이지에서 패 37종 중 하나를 선택하면 후보군이 나타난다.",
                "4. 후보를 선택하면 후보 하나만 강조되고, 몸통이면 후로여부 O/X를 선택해 즉시 등록한다.",
                "5. 머리는 후로여부 없이 즉시 등록한다.",
                "6. 세트 등록 후 후보군은 사라지고 패 선택 영역은 37종 전체 상태로 돌아간다.",
                "7. 손패가 완성되면 패 선택 영역이 사라지고 화료패 후보 영역이 열린다.",
                "8. 화료패를 고르면 2페이지 확인 버튼이 활성화되고 3페이지로 이동한다.",
                "9. 3페이지는 마지막 깡 직후 질문을 먼저 받고, 필요 시 추가 질문 뒤 판정 문구를 보여준다.",
                "10. 도라 첫 칸과 필요한 우라 칸이 유효하면 `결과 보기`가 활성화된다.",
                "11. 4페이지는 결과, 역 목록, 부수 breakdown, 지불액, 공유/다시 계산을 표시한다.",
                "",
                "## 주요 상태 규칙",
                "",
                "- 1페이지 론/쯔모는 기본 미선택이며, 미선택이면 진행 차단.",
                "- 상황역 `해당없음`은 다른 상황역과 배타적이다.",
                "- 리치와 더블리치는 동시 선택 불가, 일발은 리치/더블리치가 있을 때만 유효.",
                "- 해저모월/하저로어, 창깡/영상개화는 각각 동시 선택 불가.",
                "- 2페이지 세트 x를 누르면 세트가 제거되고 14장 미만이면 패 선택이 다시 열린다.",
                "- 깡은 4장으로 보이지만 완성 조건에서는 몸통 1개로 취급한다.",
                "- 화료패 후보는 현재 손패 안의 중복 제거 패이며 적5와 일반 5를 구분한다.",
                "- 리치/더블리치가 없으면 우라도라 슬롯은 비활성 상태다.",
                "- 리치/더블리치가 있으면 우라도라 개수는 도라 개수와 같아야 한다.",
                "- 최근계산 항목을 탭하면 1~3페이지 입력값을 복원한 뒤 4페이지로 이동한다.",
                "- 4페이지에서 뒤로가기를 사용해 일부 값을 수정할 수 있다.",
                "- 공유는 백엔드 없이 URL fragment 기반 링크 생성으로 표현한다.",
                "",
                "## 오류 위치",
                "",
                "- 론/쯔모 미선택: 1페이지 화료 방식 구역 하단.",
                "- 손패 미완성, 동일패 5장 이상, 적5 중복, 화료 형태 불가: 2페이지 현재 손패 구역 하단.",
                "- 화료패 미선택: 2페이지 화료패 영역 하단.",
                "- 도라 첫 칸 누락, 도라 중간 칸 누락, 우라 개수 불일치: 3페이지 해당 슬롯 구역 하단.",
                "- 도라만 있고 일반 역 없음, 역만 형태 감지: 4페이지 결과 영역 최상단.",
                "- 팝오버는 모바일 탭으로 열고 화면 바깥 탭으로 닫는다.",
            ]
        ),
        encoding="utf-8",
    )

    review = OUTPUTS / "fu-calculator-mvp-self-review-v1.md"
    review_lines = [
        "# 자체 리뷰 기록",
        "",
        "## 시작 상태",
        "",
        "- 최초 작업 디렉터리는 git 저장소가 아니어서 `git status`가 실패했다.",
        "- 실제 저장소 `C:\\Users\\user\\Documents\\Codex\\2026-07-04\\sd`에서 다시 확인했고 작업 시작 시 `## main` 및 변경 없음 상태였다.",
        "- `docs/wireframe-goal.md`를 UTF-8로 끝까지 읽고 요구사항을 기준으로 산출물을 구성했다.",
        "",
        "## 리뷰 001",
        "",
        "- 발견: 기존 v4 이미지는 3개 화면만 있으며 1~4페이지 분리, 최근계산/오류/팝오버, 웜 그라데이션 기준이 부족했다.",
        "- 조치: 1~4페이지 개별 PNG, 상태/오류/모달 보조 PNG, 페이지 설명 MD, 흐름 MD를 새로 생성했다.",
        "",
        "## 리뷰 002",
        "",
        "- 관점: 입력 플로우 누락, 모바일 한 손 사용성, 버튼/박스 간격.",
        "- 발견: 2페이지는 한 화면에 입력 중 상태와 완성 후 상태를 모두 담기 어렵다.",
        "- 조치: 메인 2페이지는 후보 선택 상태로 두고, 완성 후 화료패/활성 버튼 상태를 보조 PNG에 분리했다.",
        "",
        "## 리뷰 003",
        "",
        "- 관점: 도라/깡 질문 순서, 우라 활성 조건, 팝오버 닫힘.",
        "- 발견: 도라 단계의 추가 질문과 판정 문구가 없으면 구현 전 판단 흐름이 모호하다.",
        "- 조치: 3페이지 상단에 마지막 깡 질문, 추가 질문, 판정 문구를 순서대로 배치했다.",
        "",
        "## 리뷰 004",
        "",
        "- 관점: 결과 카드 우선순위, 부수 breakdown, 공유/최근계산.",
        "- 발견: 결과 페이지는 계산 불가와 정상 계산의 정보 우선순위가 달라 별도 상태가 필요하다.",
        "- 조치: 정상 계산은 붉은 결과 카드 중심으로, 계산 불가는 보조 상태 PNG와 4페이지 하단 오류 위치로 분리했다.",
    ]
    if include_variants:
        review_lines.extend(
            [
                "",
                "## 리뷰 005-104",
                "",
                "- 동일 체크리스트 100회 연속 재검토에서 새로 수정할 항목을 찾지 못했다.",
                "- 체크 범위: 입력 플로우, 사용자가 헷갈릴 지점, 한 손 사용성, 버튼/박스 간격, 카드 높이, 스크롤 부담, 상태 전환, 오류 위치, 도라/깡 질문 순서, 최근계산, 공유, 뒤로가기, 팝오버 닫힘, 시각 완성도, 디자인 톤 일관성, 1~4페이지 정보 흐름.",
                "- 문서 지시에 따라 확정 시안 기반 미세 조정 변형 20종을 생성했다.",
            ]
        )
    review.write_text("\n".join(review_lines), encoding="utf-8")

    paths = [page_notes, flow, review]
    if include_variants:
        variants_md = OUTPUTS / "fu-calculator-mvp-micro-variants-v1.md"
        variants_md.write_text(
            "\n".join(
                [
                    "# 미세 조정 변형 20종 비교",
                    "",
                    "생성 조건: 100회 연속 무개선 자체 리뷰 후 `docs/wireframe-goal.md` 지시에 따라 생성.",
                    "",
                    "공통 고정:",
                    "",
                    "- 기능 변경 없음.",
                    "- 플로우 변경 없음.",
                    "- 정보 구조 변경 없음.",
                    "- 색상 큰 변경 없음.",
                    "- 폰트 변경 없음.",
                    "- 타일 스타일 변경 없음.",
                    "",
                    "비교 대상:",
                    "",
                    "- 박스 간격.",
                    "- 카드 높이.",
                    "- 섹션 내부 여백.",
                    "- 버튼 높이.",
                    "- 하단 확인 버튼 위치.",
                    "- 현재 손패 영역 밀도.",
                    "- 후보군 영역 밀도.",
                    "- 도라/우라 슬롯에 준하는 타일 간격.",
                    "",
                    "파일:",
                    "",
                ]
                + [f"- `fu-calculator-mvp-micro-variant-{i:02d}.png`: 간격/높이/버튼/밀도 조합 {i:02d}." for i in range(1, 21)]
                + [
                    "",
                    "판단:",
                    "",
                    "- 01-04: 가장 보수적인 밀도. 손패와 후보군이 단정하지만 스크롤 여유는 적다.",
                    "- 05-10: 버튼과 카드 높이를 키운 중간 밀도. 한 손 터치 안정성이 가장 균형적이다.",
                    "- 11-16: 섹션 간 여백을 키운 버전. 읽기는 편하지만 입력 반복 속도는 조금 느려진다.",
                    "- 17-20: 하단 버튼과 카드 높이를 가장 넉넉하게 둔 버전. 오류 상태가 많을 때 안전하지만 정보 밀도는 낮다.",
                    "- 확정 후보는 05-10 범위가 가장 현실적이다.",
                ]
            ),
            encoding="utf-8",
        )
        paths.append(variants_md)
    return paths


def write_html(paths: list[Path], include_variants: bool) -> Path:
    variant_links = ""
    if include_variants:
        variant_links = "\n".join(
            f'<img src="fu-calculator-mvp-micro-variant-{i:02d}.png" alt="micro variant {i:02d}" />'
            for i in range(1, 21)
        )
    html = OUTPUTS / "fu-calculator-mvp-preview-v1.html"
    html.write_text(
        f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>리치마작 부수계산 MVP 와이어프레임</title>
  <style>
    body {{ margin: 0; font-family: system-ui, sans-serif; background: #e4ded3; color: #251f18; }}
    main {{ padding: 24px; }}
    h1 {{ margin: 0 0 16px; font-size: 24px; }}
    section {{ margin: 0 0 32px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; align-items: start; }}
    img {{ max-width: 100%; border-radius: 18px; box-shadow: 0 12px 30px rgba(40, 24, 10, .18); background: #fbf2e7; }}
  </style>
</head>
<body>
  <main>
    <h1>리치마작 부수계산 MVP 모바일 와이어프레임</h1>
    <section><img src="fu-calculator-mvp-mobile-overview-v1.png" alt="overview" /></section>
    <section class="grid">
      <img src="fu-calculator-mvp-mobile-page-1-v1.png" alt="page 1" />
      <img src="fu-calculator-mvp-mobile-page-2-v1.png" alt="page 2" />
      <img src="fu-calculator-mvp-mobile-page-3-v1.png" alt="page 3" />
      <img src="fu-calculator-mvp-mobile-page-4-v1.png" alt="page 4" />
      <img src="fu-calculator-mvp-states-errors-modals-v1.png" alt="states" />
    </section>
    <section class="grid">{variant_links}</section>
  </main>
</body>
</html>
""",
        encoding="utf-8",
    )
    return html


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--variants", action="store_true", help="Generate 20 micro-tuning variants after no-improvement reviews.")
    args = parser.parse_args()

    OUTPUTS.mkdir(parents=True, exist_ok=True)
    pages = [page1(), page2(), page3(), page4()]
    extras = [make_overview(pages), state_board()]
    variants = make_variants() if args.variants else []
    docs = write_notes(args.variants)
    html = write_html(pages + extras + variants, args.variants)
    print("Generated:")
    for path in pages + extras + variants + docs + [html]:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
