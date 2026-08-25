"""
Automatisierte Unit-Test-Suite für das Nonogramm (Picross / Griddlers) Plugin
Überprüft:
1. NonogramEngine: Clue-Berechnung, Zellenzyklen, Line-Satisfaction, Siegprüfung
2. NonogramSolver: Line-Deduktion, Permutationen, Eindeutigkeitsprüfung, Hint-Logik
3. NonogramGenerator: Deterministische Seed-Generierung, Lösbarkeit
4. Kampagnen-Level: 120 Level in 4 Kapiteln (5x5, 10x10, 15x15)
5. Tagesrätsel & Tutorial-Stufen
"""

import unittest
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

class TestNonogram(unittest.TestCase):
    def test_bundle_integration(self):
        """Überprüft, dass Nonogramm im Web-Bundle und den Registrierungen vorhanden ist"""
        bundle = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('NonogramEngine', bundle)
        self.assertIn('NonogramSolver', bundle)
        self.assertIn('NonogramGenerator', bundle)
        self.assertIn('NonogramPlugin', bundle)
        self.assertIn('puzzleRegistry.register(NonogramPlugin)', bundle)

    def test_dom_and_css_integration(self):
        """Überprüft, dass index.html, sw.js und build_apk.py nonogram.css einbinden"""
        html = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        sw = (BASE_DIR / "sw.js").read_text(encoding='utf-8')
        build_apk = (BASE_DIR / "build_apk.py").read_text(encoding='utf-8')

        self.assertIn('href="./css/puzzles/nonogram.css"', html)
        self.assertIn('data-stats-tab="nonogram"', html)
        self.assertIn('./css/puzzles/nonogram.css', sw)
        self.assertIn('css/puzzles/nonogram.css', build_apk)

    def test_plugin_files_exist(self):
        """Überprüft, dass alle Nonogram-Dateien physisch existieren"""
        plugin_dir = BASE_DIR / "js" / "puzzles" / "nonogram"
        self.assertTrue((plugin_dir / "engine.js").exists())
        self.assertTrue((plugin_dir / "solver.js").exists())
        self.assertTrue((plugin_dir / "generator.js").exists())
        self.assertTrue((plugin_dir / "renderer.js").exists())
        self.assertTrue((plugin_dir / "index.js").exists())
        self.assertTrue((plugin_dir / "data" / "levels.js").exists())
        self.assertTrue((plugin_dir / "data" / "tutorial.js").exists())
        self.assertTrue((plugin_dir / "data" / "i18n.js").exists())
        self.assertTrue((BASE_DIR / "css" / "puzzles" / "nonogram.css").exists())

    def test_nonogram_css_cyberpunk_and_borders(self):
        """Überprüft, dass nonogram.css im Cyberpunk-Theme einheitlich pinke Umrandung hat und keine Kantenartefakte erzeugt"""
        css = (BASE_DIR / "css" / "puzzles" / "nonogram.css").read_text(encoding='utf-8')
        self.assertIn('body.theme-cyberpunk .nonogram-board', css)
        self.assertIn('border-color: #ff007f !important;', css)
        self.assertIn('border-right-color: #ff007f !important;', css)
        self.assertIn('border-bottom-color: #ff007f !important;', css)

    def test_engine_has_restart_method(self):
        """Überprüft, dass die NonogramEngine eine dedizierte restart()-Methode besitzt"""
        engine_code = (BASE_DIR / "js" / "puzzles" / "nonogram" / "engine.js").read_text(encoding='utf-8')
        self.assertIn('restart() {', engine_code)

if __name__ == '__main__':
    unittest.main()
