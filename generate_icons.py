"""
Skript zur Erstellung des hochaufloesenden Tango App-Icons und aller Android Mipmap-Aufloesungen.
Erstellt moderne, elegante App-Icons mit Sonne & Mond Motiv auf Premium Slate-Hintergrund.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RES_DIR = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")

def create_master_icon(size=1024, is_round=False):
    # Erstelle 1024x1024 RGBA Bild
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Hintergrund & Maske
    bg_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_img)
    
    # Radialer / linearer Farbverlauf fuer Hintergrund
    # Dunkles Obsidian-Blau / Deep Slate (#0b0f19 -> #1e293b -> #0f172a)
    for y in range(size):
        ratio = y / size
        # Farbverlauf von oben dunkelblau-schwarz zu tiefem Mitternachtsblau
        r = int(15 * (1 - ratio) + 12 * ratio)
        g = int(23 * (1 - ratio) + 24 * ratio)
        b = int(42 * (1 - ratio) + 50 * ratio)
        bg_draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
        
    # Erstelle Maske (Squircle oder Rund)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    margin = 32
    if is_round:
        mask_draw.ellipse([margin, margin, size - margin, size - margin], fill=255)
    else:
        corner_radius = int(size * 0.22) # Modern Squircle
        mask_draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=corner_radius, fill=255)
        
    # Anwenden der Maske
    card_bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    card_bg.paste(bg_img, (0, 0), mask)
    
    # Rand/Border mit Glow
    border_draw = ImageDraw.Draw(card_bg)
    border_color = (56, 189, 248, 60) # Subtle cyan border glow
    if is_round:
        border_draw.ellipse([margin, margin, size - margin, size - margin], outline=border_color, width=int(size*0.015))
    else:
        corner_radius = int(size * 0.22)
        border_draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=corner_radius, outline=border_color, width=int(size*0.015))

    # 2. Subtiler Raster / Puzzle-Hintergrund im Inneren
    grid_overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid_overlay)
    # Dezente Rasterlinien
    for x in range(int(size*0.2), int(size*0.81), int(size*0.2)):
        grid_draw.line([(x, int(size*0.15)), (x, int(size*0.85))], fill=(255, 255, 255, 8), width=3)
    for y in range(int(size*0.2), int(size*0.81), int(size*0.2)):
        grid_draw.line([(int(size*0.15), y), (int(size*0.85), y)], fill=(255, 255, 255, 8), width=3)
    
    card_bg = Image.alpha_composite(card_bg, grid_overlay)

    # 3. GLOW LAYER fuer Sonne und Mond
    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)

    # Sonnen-Glow (Gold / Amber)
    sun_cx, sun_cy = int(size * 0.36), int(size * 0.40)
    sun_r = int(size * 0.16)
    glow_draw.ellipse([sun_cx - sun_r*1.6, sun_cy - sun_r*1.6, sun_cx + sun_r*1.6, sun_cy + sun_r*1.6], fill=(245, 158, 11, 80))

    # Mond-Glow (Cyan / Sky)
    moon_cx, moon_cy = int(size * 0.65), int(size * 0.60)
    moon_r = int(size * 0.18)
    glow_draw.ellipse([moon_cx - moon_r*1.6, moon_cy - moon_r*1.6, moon_cx + moon_r*1.6, moon_cy + moon_r*1.6], fill=(56, 189, 248, 80))
    
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(int(size * 0.05)))
    card_bg = Image.alpha_composite(card_bg, glow_layer)

    # 4. ELEMENTE ZEICHNEN
    elem_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    elem_draw = ImageDraw.Draw(elem_layer)

    # --- A) DIE GOLDENE SONNE ---
    # Sonnenstrahlen (8 Strahlen)
    ray_len_inner = sun_r * 1.25
    ray_len_outer = sun_r * 1.55
    for i in range(8):
        angle = i * (math.pi / 4)
        x1 = sun_cx + math.cos(angle) * ray_len_inner
        y1 = sun_cy + math.sin(angle) * ray_len_inner
        x2 = sun_cx + math.cos(angle) * ray_len_outer
        y2 = sun_cy + math.sin(angle) * ray_len_outer
        elem_draw.line([(x1, y1), (x2, y2)], fill=(251, 191, 36, 255), width=int(size * 0.022))

    # Sonnen-Körper mit Farbverlauf / 3D-Look
    sun_body = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sun_body_draw = ImageDraw.Draw(sun_body)
    sun_body_draw.ellipse([sun_cx - sun_r, sun_cy - sun_r, sun_cx + sun_r, sun_cy + sun_r], fill=(245, 158, 11, 255))
    
    # Highlight auf der Sonne
    highlight_r = int(sun_r * 0.85)
    sun_body_draw.ellipse([sun_cx - highlight_r, sun_cy - highlight_r, sun_cx + highlight_r*0.7, sun_cy + highlight_r*0.7], fill=(253, 224, 71, 220))
    elem_layer = Image.alpha_composite(elem_layer, sun_body)

    # --- B) DER MYSTISCHE MOND ---
    # Mond-Körper: Grosser Kreis minus innerer Kreis (Halbmond)
    moon_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    moon_draw = ImageDraw.Draw(moon_img)
    
    # Hauptkreis des Mondes (Helles Cyan/Blau)
    outer_m_r = int(size * 0.20)
    moon_draw.ellipse([moon_cx - outer_m_r, moon_cy - outer_m_r, moon_cx + outer_m_r, moon_cy + outer_m_r], fill=(56, 189, 248, 255))
    
    # Cutout Maske fuer die Mondsichel
    cutout_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cutout_draw = ImageDraw.Draw(cutout_img)
    inner_m_r = int(size * 0.175)
    cutout_cx = moon_cx - int(size * 0.075)
    cutout_cy = moon_cy - int(size * 0.075)
    cutout_draw.ellipse([cutout_cx - inner_m_r, cutout_cy - inner_m_r, cutout_cx + inner_m_r, cutout_cy + inner_m_r], fill=(0, 0, 0, 255))
    
    # Mond maskieren
    moon_alpha = moon_img.split()[3]
    cutout_alpha = cutout_img.split()[3]
    final_moon_alpha = Image.new("L", (size, size), 0)
    # Bild-Pixel-Verknuepfung
    for y in range(size):
        for x in range(size):
            m_val = moon_alpha.getpixel((x, y))
            c_val = cutout_alpha.getpixel((x, y))
            if m_val > 0 and c_val == 0:
                final_moon_alpha.putpixel((x, y), 255)
                
    final_moon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Farbverlauf fuer Mond von Cyan nach Tiefblau
    moon_grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    moon_grad_draw = ImageDraw.Draw(moon_grad)
    for y in range(size):
        ratio = (y - (moon_cy - outer_m_r)) / (2 * outer_m_r + 1)
        ratio = max(0.0, min(1.0, ratio))
        r = int(56 * (1 - ratio) + 2 * ratio)
        g = int(189 * (1 - ratio) + 132 * ratio)
        b = int(248 * (1 - ratio) + 199 * ratio)
        moon_grad_draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
        
    final_moon.paste(moon_grad, (0, 0), final_moon_alpha)
    elem_layer = Image.alpha_composite(elem_layer, final_moon)

    # --- C) TANGO EQUALITY & OPPOSITE ICONS ( = und x ) ---
    # Kleines Gleichheitszeichen '=' oben rechts dezent
    eq_x, eq_y = int(size * 0.72), int(size * 0.28)
    elem_draw.rounded_rectangle([eq_x - int(size*0.04), eq_y - int(size*0.018), eq_x + int(size*0.04), eq_y - int(size*0.006)], radius=4, fill=(255, 255, 255, 160))
    elem_draw.rounded_rectangle([eq_x - int(size*0.04), eq_y + int(size*0.006), eq_x + int(size*0.04), eq_y + int(size*0.018)], radius=4, fill=(255, 255, 255, 160))

    # Kleines Kreuzzeichen 'x' unten links dezent
    cross_x, cross_y = int(size * 0.28), int(size * 0.72)
    cr_len = int(size * 0.035)
    elem_draw.line([(cross_x - cr_len, cross_y - cr_len), (cross_x + cr_len, cross_y + cr_len)], fill=(239, 68, 68, 180), width=int(size*0.014))
    elem_draw.line([(cross_x - cr_len, cross_y + cr_len), (cross_x + cr_len, cross_y - cr_len)], fill=(239, 68, 68, 180), width=int(size*0.014))

    # Maskieren mit aeusserer App-Form
    final_canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    merged = Image.alpha_composite(card_bg, elem_layer)
    final_canvas.paste(merged, (0, 0), mask)
    
    return final_canvas

def generate_all_icons():
    print("Generiere Master-Icons...")
    square_icon = create_master_icon(size=1024, is_round=False)
    round_icon = create_master_icon(size=1024, is_round=True)

    # Speichern des 512x512 Master-Icons in assets
    square_icon.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(BASE_DIR, "assets", "icons", "icon-512.png"))
    square_icon.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(BASE_DIR, "assets", "icons", "icon-192.png"))
    square_icon.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(BASE_DIR, "assets", "favicon.png"))
    print("[OK] Web-Assets aktualisiert.")

    # Android Mipmap Dichten
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }

    for folder, dim in densities.items():
        target_dir = os.path.join(RES_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)

        # Standard Icon
        sq_resized = square_icon.resize((dim, dim), Image.Resampling.LANCZOS)
        sq_resized.save(os.path.join(target_dir, "ic_launcher.png"))

        # Round Icon
        rd_resized = round_icon.resize((dim, dim), Image.Resampling.LANCZOS)
        rd_resized.save(os.path.join(target_dir, "ic_launcher_round.png"))

        print(f"[OK] {folder}: {dim}x{dim} ic_launcher.png & ic_launcher_round.png erstellt.")

if __name__ == '__main__':
    generate_all_icons()
