"""
Tango JS Bundler Script
Kombiniert alle ES-Module in ein einzelnes, hochkompatibles Browser-Bundle (js/bundle.js)
für 100 % Kompatibilität mit allen mobilen WebViews und Handys.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

def build_bundle():
    files_in_order = [
        BASE_DIR / "js" / "core" / "engine.js",
        BASE_DIR / "js" / "core" / "solver.js",
        BASE_DIR / "js" / "core" / "generator.js",
        BASE_DIR / "js" / "data" / "i18n.js",
        BASE_DIR / "js" / "data" / "tutorial.js",
        BASE_DIR / "js" / "data" / "tutorial_pro.js",
        BASE_DIR / "js" / "data" / "levels.js",
        BASE_DIR / "js" / "ui" / "audio.js",
        BASE_DIR / "js" / "ui" / "animations.js",
        BASE_DIR / "js" / "ui" / "app.js",
    ]

    bundle_lines = [
        "/**",
        " * Tango Combined Monolithic Bundle",
        " * 100% kompatibel mit allen mobilen WebViews, iOS Safari und Android Chrome",
        " */",
        "(function() {",
        "  'use strict';",
        ""
    ]

    for file_path in files_in_order:
        content = file_path.read_text(encoding='utf-8')
        
        # Entferne import-Statements
        lines = []
        for line in content.splitlines():
            if line.strip().startswith("import "):
                continue
            # Wandle "export const/class/function" in globale/lokale Deklarationen um
            line = line.replace("export const ", "const ")
            line = line.replace("export class ", "class ")
            line = line.replace("export function ", "function ")
            line = line.replace("export let ", "let ")
            lines.append(line)
            
        bundle_lines.append(f"// === Source: {file_path.relative_to(BASE_DIR)} ===")
        bundle_lines.extend(lines)
        bundle_lines.append("")

    bundle_lines.append("})();")

    bundle_path = BASE_DIR / "js" / "bundle.js"
    bundle_path.write_text("\n".join(bundle_lines), encoding='utf-8')
    print(f"Bundle erfolgreich erstellt: {bundle_path} ({len(bundle_lines)} Zeilen)")

if __name__ == "__main__":
    build_bundle()
