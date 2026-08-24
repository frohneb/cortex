"""
Cortex Icon Generator
Rendert hochauflösende, gestochen scharfe App-Icons für Web (PWA) und Android (Mipmaps & Adaptive Icons v26+).
Das Cortex-Logo ist maximal hochskaliert auf die volle Symbolgröße ohne störenden hellblauen/fliederfarbenen
Hintergrund und ohne Randabstände.
"""
import os
from PIL import Image, ImageDraw

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

def draw_cortex_brain(draw, W, H, cx, cy, scale_factor=0.88):
    """
    Zeichnet das Cortex Gehirn-Synapsen-Netzwerk zentriert und maximal hochskaliert.
    """
    cyan_color = (56, 189, 248, 255)     # #38bdf8
    cyan_bright = (186, 230, 253, 255)   # #bae6fd
    gold_color = (251, 191, 36, 255)     # #fbbf24
    violet_color = (192, 132, 252, 255)  # #c084fc
    violet_bright = (233, 213, 255, 255) # #e9d5ff
    white_color = (255, 255, 255, 255)

    line_w_main = max(2, int(W * 0.052 * scale_factor))
    line_w_sub = max(2, int(W * 0.034 * scale_factor))

    # Linke Hemisphäre
    left_points_outer = [
        (cx - int(W * 0.09 * scale_factor), cy - int(H * 0.44 * scale_factor)),
        (cx - int(W * 0.28 * scale_factor), cy - int(H * 0.46 * scale_factor)),
        (cx - int(W * 0.45 * scale_factor), cy - int(H * 0.30 * scale_factor)),
        (cx - int(W * 0.48 * scale_factor), cy - int(H * 0.08 * scale_factor)),
        (cx - int(W * 0.45 * scale_factor), cy + int(H * 0.16 * scale_factor)),
        (cx - int(W * 0.29 * scale_factor), cy + int(H * 0.39 * scale_factor)),
        (cx - int(W * 0.09 * scale_factor), cy + int(H * 0.46 * scale_factor)),
    ]
    for i in range(len(left_points_outer) - 1):
        draw.line([left_points_outer[i], left_points_outer[i+1]], fill=cyan_color, width=line_w_main)

    left_points_inner = [
        (cx - int(W * 0.09 * scale_factor), cy - int(H * 0.21 * scale_factor)),
        (cx - int(W * 0.26 * scale_factor), cy - int(H * 0.21 * scale_factor)),
        (cx - int(W * 0.31 * scale_factor), cy),
        (cx - int(W * 0.26 * scale_factor), cy + int(H * 0.22 * scale_factor)),
        (cx - int(W * 0.09 * scale_factor), cy + int(H * 0.25 * scale_factor)),
    ]
    for i in range(len(left_points_inner) - 1):
        draw.line([left_points_inner[i], left_points_inner[i+1]], fill=cyan_color, width=line_w_sub)

    # Brücken Links
    draw.line([left_points_outer[2], left_points_inner[2]], fill=cyan_color, width=line_w_sub)
    draw.line([left_points_outer[4], left_points_inner[3]], fill=gold_color, width=line_w_sub)
    draw.line([left_points_outer[1], left_points_inner[1]], fill=gold_color, width=line_w_sub)

    # Rechte Hemisphäre
    right_points_outer = [
        (cx + int(W * 0.09 * scale_factor), cy - int(H * 0.44 * scale_factor)),
        (cx + int(W * 0.28 * scale_factor), cy - int(H * 0.46 * scale_factor)),
        (cx + int(W * 0.45 * scale_factor), cy - int(H * 0.30 * scale_factor)),
        (cx + int(W * 0.48 * scale_factor), cy - int(H * 0.08 * scale_factor)),
        (cx + int(W * 0.45 * scale_factor), cy + int(H * 0.16 * scale_factor)),
        (cx + int(W * 0.29 * scale_factor), cy + int(H * 0.39 * scale_factor)),
        (cx + int(W * 0.09 * scale_factor), cy + int(H * 0.46 * scale_factor)),
    ]
    for i in range(len(right_points_outer) - 1):
        draw.line([right_points_outer[i], right_points_outer[i+1]], fill=violet_color, width=line_w_main)

    right_points_inner = [
        (cx + int(W * 0.09 * scale_factor), cy - int(H * 0.21 * scale_factor)),
        (cx + int(W * 0.26 * scale_factor), cy - int(H * 0.21 * scale_factor)),
        (cx + int(W * 0.31 * scale_factor), cy),
        (cx + int(W * 0.26 * scale_factor), cy + int(H * 0.22 * scale_factor)),
        (cx + int(W * 0.09 * scale_factor), cy + int(H * 0.25 * scale_factor)),
    ]
    for i in range(len(right_points_inner) - 1):
        draw.line([right_points_inner[i], right_points_inner[i+1]], fill=violet_color, width=line_w_sub)

    # Brücken Rechts
    draw.line([right_points_outer[2], right_points_inner[2]], fill=violet_color, width=line_w_sub)
    draw.line([right_points_outer[4], right_points_inner[3]], fill=gold_color, width=line_w_sub)
    draw.line([right_points_outer[1], right_points_inner[1]], fill=gold_color, width=line_w_sub)

    # Zentraler Spalt / Synapsen
    for y_step in range(cy - int(H * 0.42 * scale_factor), cy + int(H * 0.46 * scale_factor), int(H * 0.10 * scale_factor)):
        draw.ellipse([(cx - int(W * 0.024 * scale_factor), y_step - int(H * 0.024 * scale_factor)),
                      (cx + int(W * 0.024 * scale_factor), y_step + int(H * 0.024 * scale_factor))], fill=(255, 255, 255, 170))

    # Synapsen-Knoten (Nodes / Kreise)
    def draw_node(pt, radius, color):
        r = max(2, int(W * radius * scale_factor))
        draw.ellipse([(pt[0] - r, pt[1] - r), (pt[0] + r, pt[1] + r)], fill=color)

    # Links
    draw_node(left_points_outer[0], 0.048, cyan_bright)
    draw_node(left_points_outer[1], 0.058, gold_color)
    draw_node(left_points_outer[2], 0.062, cyan_color)
    draw_node(left_points_outer[3], 0.052, white_color)
    draw_node(left_points_outer[4], 0.058, cyan_color)
    draw_node(left_points_outer[5], 0.060, cyan_bright)
    draw_node(left_points_outer[6], 0.048, cyan_color)
    draw_node(left_points_inner[1], 0.042, white_color)
    draw_node(left_points_inner[2], 0.048, gold_color)
    draw_node(left_points_inner[3], 0.042, cyan_bright)

    # Rechts
    draw_node(right_points_outer[0], 0.048, violet_bright)
    draw_node(right_points_outer[1], 0.058, gold_color)
    draw_node(right_points_outer[2], 0.062, violet_color)
    draw_node(right_points_outer[3], 0.052, white_color)
    draw_node(right_points_outer[4], 0.058, violet_color)
    draw_node(right_points_outer[5], 0.060, violet_bright)
    draw_node(right_points_outer[6], 0.048, violet_color)
    draw_node(right_points_inner[1], 0.042, white_color)
    draw_node(right_points_inner[2], 0.048, gold_color)
    draw_node(right_points_inner[3], 0.042, violet_bright)

    # Zentraler Kern
    draw_node((cx, cy), 0.055, gold_color)


def create_cortex_full_bleed(size, is_round=False):
    """
    Erzeugt ein Icon mit 100% vollflächig deckendem, tiefdunklem Hintergrund (kein Rand/fliederfarbene Ränder).
    """
    SCALE = 4
    W = size * SCALE
    H = size * SCALE

    img = Image.new("RGBA", (W, H), (11, 14, 20, 255))
    draw = ImageDraw.Draw(img)

    # Tiefdunkler Farbverlauf (Slate-950 zu Tiefschwarz)
    for y in range(H):
        ratio = y / H
        r = int(15 * (1 - ratio) + 4 * ratio)
        g = int(23 * (1 - ratio) + 8 * ratio)
        b = int(42 * (1 - ratio) + 20 * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    cx, cy = W // 2, H // 2
    draw_cortex_brain(draw, W, H, cx, cy, scale_factor=0.92)

    if is_round:
        mask = Image.new("L", (W, H), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([(0, 0), (W, H)], fill=255)
        out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        img = out

    return img.resize((size, size), Image.Resampling.LANCZOS)


def create_cortex_foreground(size):
    """
    Erzeugt das transparente Adaptive-Icon Foreground-Asset (108dp Standard).
    Der sichtbare Bereich (~72dp / 66%) wird voll ausgefüllt.
    """
    SCALE = 4
    W = size * SCALE
    H = size * SCALE

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = W // 2, H // 2

    # Skalierung für Adaptive Icon Safe Zone (72dp von 108dp = 0.67 -> auf 0.72 für maximal präsente Größe)
    draw_cortex_brain(draw, W, H, cx, cy, scale_factor=0.72)

    return img.resize((size, size), Image.Resampling.LANCZOS)


def generate_all_icons():
    print("=== Generiere Cortex Icons (Vollflächig & Ohne Flieder/Hellblau-Rand) ===")

    # 1. Web Assets (PWA)
    fav = create_cortex_full_bleed(64)
    fav.save(os.path.join(BASE_DIR, "assets", "favicon.png"), "PNG")
    print("[OK] assets/favicon.png (64x64)")

    icon192 = create_cortex_full_bleed(192)
    icon192.save(os.path.join(BASE_DIR, "assets", "icons", "icon-192.png"), "PNG")
    print("[OK] assets/icons/icon-192.png (192x192)")

    icon512 = create_cortex_full_bleed(512)
    icon512.save(os.path.join(BASE_DIR, "assets", "icons", "icon-512.png"), "PNG")
    print("[OK] assets/icons/icon-512.png (512x512)")

    # 2. Android Mipmap Icons & Adaptive Icons
    mipmaps = [
        ("mipmap-mdpi", 48, 108),
        ("mipmap-hdpi", 72, 162),
        ("mipmap-xhdpi", 96, 216),
        ("mipmap-xxhdpi", 144, 324),
        ("mipmap-xxxhdpi", 192, 432),
    ]

    res_dir = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")
    for folder, legacy_sz, fg_sz in mipmaps:
        target_dir = os.path.join(res_dir, folder)
        os.makedirs(target_dir, exist_ok=True)

        # Vollflächiges Quadratisches Legacy Icon
        sq = create_cortex_full_bleed(legacy_sz, is_round=False)
        sq.save(os.path.join(target_dir, "ic_launcher.png"), "PNG")

        # Rundes Legacy Icon
        rnd = create_cortex_full_bleed(legacy_sz, is_round=True)
        rnd.save(os.path.join(target_dir, "ic_launcher_round.png"), "PNG")

        # Adaptive Icon Foreground (Transparent, 108dp proportional)
        fg = create_cortex_foreground(fg_sz)
        fg.save(os.path.join(target_dir, "ic_launcher_foreground.png"), "PNG")

        print(f"[OK] {folder} (ic_launcher: {legacy_sz}x{legacy_sz}, fg: {fg_sz}x{fg_sz})")

    # 3. Android Adaptive Icon XML Definitionen (res/mipmap-anydpi-v26/)
    anydpi_dir = os.path.join(res_dir, "mipmap-anydpi-v26")
    os.makedirs(anydpi_dir, exist_ok=True)

    adaptive_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'''
    with open(os.path.join(anydpi_dir, "ic_launcher.xml"), "w", encoding="utf-8") as f:
        f.write(adaptive_xml)

    with open(os.path.join(anydpi_dir, "ic_launcher_round.xml"), "w", encoding="utf-8") as f:
        f.write(adaptive_xml)

    print("[OK] res/mipmap-anydpi-v26/ic_launcher.xml & ic_launcher_round.xml")

    # 4. Android Background Color Resource
    values_dir = os.path.join(res_dir, "values")
    os.makedirs(values_dir, exist_ok=True)
    colors_xml = '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0b0e14</color>
</resources>
'''
    with open(os.path.join(values_dir, "colors.xml"), "w", encoding="utf-8") as f:
        f.write(colors_xml)
    print("[OK] res/values/colors.xml")

    # 5. Strings XML app_name = Cortex
    strings_xml = '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Cortex</string>
</resources>
'''
    with open(os.path.join(values_dir, "strings.xml"), "w", encoding="utf-8") as f:
        f.write(strings_xml)
    print("[OK] res/values/strings.xml (app_name: Cortex)")

    print("[OK] Alle Icons für Cortex erfolgreich generiert und optimiert!")

if __name__ == "__main__":
    generate_all_icons()
