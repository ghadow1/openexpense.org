#!/usr/bin/env python3
"""Paint Open Graph and home-screen thumbs in the live navy / white tokens."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
NAVY = (0, 34, 68)
ACCENT = (17, 112, 207)
ACCENT_DEEP = (10, 77, 154)
WHITE = (255, 255, 255)
INK = (26, 32, 44)
MUTED = (100, 116, 139)
SURFACE2 = (240, 244, 248)
BORDER = (197, 208, 220)
INCOME = (5, 150, 105)
FONT_BOLD = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"
FONT_SEMI = "/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf"
FONT_MED = "/usr/share/fonts/truetype/macos/Inter-Medium.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def paint_mark(draw, x, y, size, plate=None):
    """Flat mark: navy square, white ledger card, navy stripe, accent chip."""
    if plate:
        rounded(draw, (x - 2, y - 2, x + size + 2, y + size + 2), max(2, size // 24), plate)
    rounded(draw, (x, y, x + size, y + size), max(2, size // 24), NAVY)
    inset = size * 0.16
    card = (
        x + inset,
        y + inset * 1.15,
        x + size - inset * 0.55,
        y + size - inset * 0.85,
    )
    rounded(draw, card, max(2, size // 16), WHITE)
    stripe_y = card[1] + (card[3] - card[1]) * 0.28
    draw.rectangle((card[0], stripe_y, card[2], stripe_y + size * 0.08), fill=NAVY)
    chip = size * 0.13
    cx = card[0] + size * 0.12
    cy = stripe_y + size * 0.16
    rounded(draw, (cx, cy, cx + chip, cy + chip * 0.7), 2, ACCENT)


def write_og():
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)

    draw.rectangle((0, 0, w, 112), fill=NAVY)
    draw.rectangle((0, 110, w, 114), fill=ACCENT)

    paint_mark(draw, 56, 28, 56, plate=WHITE)
    draw.text((128, 34), "OpenExpense", font=font(FONT_BOLD, 36), fill=WHITE)
    draw.text((128, 76), "openexpense.org", font=font(FONT_MED, 16), fill=(147, 197, 253))

    draw.text((56, 156), "Encrypted local expense wallet", font=font(FONT_BOLD, 46), fill=INK)
    draw.text(
        (56, 220),
        "Current funds, projected income, and a calendar ledger\nthat never leaves this browser.",
        font=font(FONT_MED, 24),
        fill=MUTED,
        spacing=8,
    )

    chips = (
        ("Current funds", "+$1,240", INCOME),
        ("Projected income", "+$3,200", ACCENT),
        ("Cashflow", "+$410", INCOME),
    )
    card_y = 330
    gap = 20
    card_w = 352
    for i, (label, value, color) in enumerate(chips):
        x = 56 + i * (card_w + gap)
        rounded(draw, (x, card_y, x + card_w, card_y + 132), 2, WHITE, BORDER, 2)
        draw.text((x + 22, card_y + 22), label.upper(), font=font(FONT_SEMI, 14), fill=MUTED)
        draw.text((x + 22, card_y + 56), value, font=font(FONT_BOLD, 40), fill=color)

    badges = ("No accounts", "AES-256 locally", "MIT · Offline")
    bx = 56
    by = 500
    for label in badges:
        f = font(FONT_SEMI, 16)
        tw = draw.textlength(label, font=f)
        pad = 16
        rounded(draw, (bx, by, bx + tw + pad * 2, by + 40), 2, SURFACE2, BORDER, 1)
        draw.text((bx + pad, by + 10), label, font=f, fill=ACCENT_DEEP)
        bx += tw + pad * 2 + 12

    draw.rectangle((0, h - 8, w, h), fill=NAVY)
    out = ROOT / "og-image.jpg"
    img.save(out, "JPEG", quality=90, optimize=True, progressive=True)
    print(f"wrote {out} ({out.stat().st_size} bytes)")


def write_touch():
    size = 512
    img = Image.new("RGB", (size, size), NAVY)
    draw = ImageDraw.Draw(img)
    # Live mark is a 2px square. At 512 keep a hard corner (Apple masks the icon).
    paint_mark(draw, 64, 64, 384)
    out = ROOT / "apple-touch-icon.png"
    img.save(out, "PNG", optimize=True)
    print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    write_og()
    write_touch()
