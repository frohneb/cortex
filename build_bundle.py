"""
Cortex JS Bundler Script
Kombiniert Shared-Module, alle registrierten Puzzle-Plugins (Auto-Discovery)
und die App-Shell in ein einzelnes, hochkompatibles Browser-Bundle (js/bundle.js).
100 % sicher, strikt CSP-konform und offline-fähig.
"""

import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

def build_bundle():
    files_in_order = []

    # 1. Shared Module (Basis)
    shared_dir = BASE_DIR / "js" / "shared"
    shared_files = [
        shared_dir / "puzzle-interface.js",
        shared_dir / "storage.js",
        shared_dir / "timer.js",
        shared_dir / "stats.js",
        shared_dir / "themes.js",
        shared_dir / "audio.js",
        shared_dir / "animations.js",
        shared_dir / "i18n.js",
    ]
    for sf in shared_files:
        if sf.exists():
            files_in_order.append(sf)

    # 2. Puzzle-Plugins (Auto-Discovery)
    puzzles_dir = BASE_DIR / "js" / "puzzles"
    if puzzles_dir.exists():
        for plugin_dir in sorted(puzzles_dir.iterdir()):
            if not plugin_dir.is_dir():
                continue
            
            # Module in logischer Dependency-Reihenfolge einbinden
            for subname in ['engine.js', 'solver.js', 'generator.js', 'renderer.js']:
                f = plugin_dir / subname
                if f.exists():
                    files_in_order.append(f)
            
            # Data-Verzeichnis des Plugins
            data_dir = plugin_dir / 'data'
            if data_dir.exists():
                for f in sorted(data_dir.glob('*.js')):
                    files_in_order.append(f)
            
            # Plugin-Definition (Index)
            index_file = plugin_dir / 'index.js'
            if index_file.exists():
                files_in_order.append(index_file)

    # 3. Shell Module
    shell_dir = BASE_DIR / "js" / "shell"
    shell_files = [
        shell_dir / "puzzle-registry.js",
        shell_dir / "app-shell.js",
    ]
    for sf in shell_files:
        if sf.exists():
            files_in_order.append(sf)

    # 4. Legacy/Main App Entry Point
    app_js = BASE_DIR / "js" / "ui" / "app.js"
    if app_js.exists():
        files_in_order.append(app_js)

    bundle_lines = [
        "/**",
        " * Cortex Combined Monolithic Bundle",
        " * 100% kompatibel mit allen mobilen WebViews, iOS Safari und Android Chrome",
        " */",
        "(function() {",
        "  'use strict';",
        ""
    ]

    for file_path in files_in_order:
        content = file_path.read_text(encoding='utf-8')
        
        # Mehrzeilige Import- und Re-Export-Statements mit Regex entfernen
        # 1. Entferne "import ... from '...';"
        content = re.sub(r'import\s+[\s\S]*?from\s+[\'"].*?[\'"];?', '', content)
        # 2. Entferne "export\s*\{[\s\S]*?\};?", d.h. reine Re-Export-Blöcke
        content = re.sub(r'export\s*\{[\s\S]*?\};?', '', content)
        # 3. Wandle export default um
        content = re.sub(r'export\s+default\s+', 'const defaultExport = ', content)
        # 4. Wandle "export const/class/function/let/var" in lokale Deklarationen um
        content = re.sub(r'export\s+(const|class|function|let|var)\s+', r'\1 ', content)

        lines = content.splitlines()
            
        bundle_lines.append(f"// === Source: {file_path.relative_to(BASE_DIR)} ===")
        bundle_lines.extend(lines)
        bundle_lines.append("")

    # Globale Window-Exposures für DOM-Tests & Konsole
    bundle_lines.append("// === Global Exports for Window & Tests ===")
    bundle_lines.append("if (typeof window !== 'undefined') {")
    bundle_lines.append("  window.CortexApp = CortexApp;")
    bundle_lines.append("  window.TangoApp = TangoApp;")
    bundle_lines.append("  if (typeof TangoEngine !== 'undefined') window.TangoEngine = TangoEngine;")
    bundle_lines.append("  if (typeof TangoSolver !== 'undefined') window.TangoSolver = TangoSolver;")
    bundle_lines.append("  if (typeof TangoGenerator !== 'undefined') window.TangoGenerator = TangoGenerator;")
    bundle_lines.append("  if (typeof TangoPlugin !== 'undefined') window.TangoPlugin = TangoPlugin;")
    bundle_lines.append("  if (typeof SudokuEngine !== 'undefined') window.SudokuEngine = SudokuEngine;")
    bundle_lines.append("  if (typeof SudokuSolver !== 'undefined') window.SudokuSolver = SudokuSolver;")
    bundle_lines.append("  if (typeof SudokuGenerator !== 'undefined') window.SudokuGenerator = SudokuGenerator;")
    bundle_lines.append("  if (typeof SudokuPlugin !== 'undefined') window.SudokuPlugin = SudokuPlugin;")
    bundle_lines.append("  if (typeof AkariEngine !== 'undefined') window.AkariEngine = AkariEngine;")
    bundle_lines.append("  if (typeof AkariSolver !== 'undefined') window.AkariSolver = AkariSolver;")
    bundle_lines.append("  if (typeof AkariGenerator !== 'undefined') window.AkariGenerator = AkariGenerator;")
    bundle_lines.append("  if (typeof AkariPlugin !== 'undefined') window.AkariPlugin = AkariPlugin;")
    bundle_lines.append("  if (typeof NonogramEngine !== 'undefined') window.NonogramEngine = NonogramEngine;")
    bundle_lines.append("  if (typeof NonogramSolver !== 'undefined') window.NonogramSolver = NonogramSolver;")
    bundle_lines.append("  if (typeof NonogramGenerator !== 'undefined') window.NonogramGenerator = NonogramGenerator;")
    bundle_lines.append("  if (typeof NonogramPlugin !== 'undefined') window.NonogramPlugin = NonogramPlugin;")
    bundle_lines.append("  if (typeof SlitherlinkEngine !== 'undefined') window.SlitherlinkEngine = SlitherlinkEngine;")
    bundle_lines.append("  if (typeof SlitherlinkSolver !== 'undefined') window.SlitherlinkSolver = SlitherlinkSolver;")
    bundle_lines.append("  if (typeof SlitherlinkGenerator !== 'undefined') window.SlitherlinkGenerator = SlitherlinkGenerator;")
    bundle_lines.append("  if (typeof SlitherlinkPlugin !== 'undefined') window.SlitherlinkPlugin = SlitherlinkPlugin;")
    bundle_lines.append("  if (typeof MinesweeperEngine !== 'undefined') window.MinesweeperEngine = MinesweeperEngine;")
    bundle_lines.append("  if (typeof MinesweeperSolver !== 'undefined') window.MinesweeperSolver = MinesweeperSolver;")
    bundle_lines.append("  if (typeof MinesweeperGenerator !== 'undefined') window.MinesweeperGenerator = MinesweeperGenerator;")
    bundle_lines.append("  if (typeof MinesweeperPlugin !== 'undefined') window.MinesweeperPlugin = MinesweeperPlugin;")
    bundle_lines.append("  if (typeof CrownsEngine !== 'undefined') window.CrownsEngine = CrownsEngine;")
    bundle_lines.append("  if (typeof CrownsSolver !== 'undefined') window.CrownsSolver = CrownsSolver;")
    bundle_lines.append("  if (typeof CrownsGenerator !== 'undefined') window.CrownsGenerator = CrownsGenerator;")
    bundle_lines.append("  if (typeof CrownsPlugin !== 'undefined') window.CrownsPlugin = CrownsPlugin;")
    bundle_lines.append("  if (typeof HashiEngine !== 'undefined') window.HashiEngine = HashiEngine;")
    bundle_lines.append("  if (typeof HashiSolver !== 'undefined') window.HashiSolver = HashiSolver;")
    bundle_lines.append("  if (typeof HashiGenerator !== 'undefined') window.HashiGenerator = HashiGenerator;")
    bundle_lines.append("  if (typeof HashiRenderer !== 'undefined') window.HashiRenderer = HashiRenderer;")
    bundle_lines.append("  if (typeof HashiPlugin !== 'undefined') window.HashiPlugin = HashiPlugin;")
    bundle_lines.append("  if (typeof FutoshikiEngine !== 'undefined') window.FutoshikiEngine = FutoshikiEngine;")
    bundle_lines.append("  if (typeof FutoshikiSolver !== 'undefined') window.FutoshikiSolver = FutoshikiSolver;")
    bundle_lines.append("  if (typeof FutoshikiGenerator !== 'undefined') window.FutoshikiGenerator = FutoshikiGenerator;")
    bundle_lines.append("  if (typeof FutoshikiRenderer !== 'undefined') window.FutoshikiRenderer = FutoshikiRenderer;")
    bundle_lines.append("  if (typeof FutoshikiPlugin !== 'undefined') window.FutoshikiPlugin = FutoshikiPlugin;")
    bundle_lines.append("  if (typeof puzzleRegistry !== 'undefined') window.puzzleRegistry = puzzleRegistry;")
    bundle_lines.append("}")
    bundle_lines.append("")

    bundle_lines.append("})();")

    bundle_text = "\n".join(bundle_lines)

    # Sanity-Checks für typische Syntax-Fehler im Bundle
    if re.search(r'^\s*EMPTY,\s*SUN', bundle_text, re.MULTILINE):
        raise ValueError("Dangling export statement found in bundle!")
    if re.search(r'^\s*import\s+', bundle_text, re.MULTILINE):
        raise ValueError("Unprocessed import statement found in bundle!")
    if re.search(r'^\s*export\s+', bundle_text, re.MULTILINE):
        raise ValueError("Unprocessed export statement found in bundle!")

    bundle_path = BASE_DIR / "js" / "bundle.js"
    bundle_path.write_text(bundle_text, encoding='utf-8')
    print(f"Bundle erfolgreich erstellt: {bundle_path} ({len(bundle_lines)} Zeilen aus {len(files_in_order)} Modulen)")

if __name__ == "__main__":
    build_bundle()
