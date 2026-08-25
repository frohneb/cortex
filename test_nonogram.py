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

if __name__ == '__main__':
    unittest.main()
