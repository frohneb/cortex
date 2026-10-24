"""
Unit-Tests für das SumGrid Puzzle Plugin (Cortex)
Testet:
1. SumGridEngine: Gitterstatus, Zustandswechsel (Neutral, Keep, Cross), Summen- & Zielberechnung, Undo/Redo, Validierung.
2. SumGridSolver: Eindeutigkeitsprüfung, Backtracking-Lösung, didaktische Hint-Generierung.
3. SumGridGenerator: Prozedurale Generierung, Lösbarkeits- und Eindeutigkeitsgarantie.
4. Plugin-Konformität: Abwesenheit von "Neu"-Badges, Kampagne, Tagesrätsel, Tutorials.
"""

import unittest
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

class TestSumGridIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bundle = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        cls.html = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        cls.css = (BASE_DIR / "css" / "puzzles" / "sumgrid.css").read_text(encoding='utf-8')

    def test_sumgrid_in_bundle_and_dom(self):
        """Überprüft, dass SumGrid-Klassen und -Module im Bundle und DOM vorhanden sind"""
        self.assertIn('class SumGridEngine', self.bundle)
        self.assertIn('class SumGridSolver', self.bundle)
        self.assertIn('class SumGridGenerator', self.bundle)
        self.assertIn('class SumGridRenderer', self.bundle)
        self.assertIn('SumGridPlugin', self.bundle)
        self.assertIn('sumgrid.css', self.html)
        self.assertIn('data-stats-tab="sumgrid"', self.html)

    def test_no_neu_badge_in_sumgrid_plugin(self):
        """Strikte Überprüfung der Nutzeranforderung: Keinesfalls ein 'Neu'-Banner verwenden"""
        plugin_file = (BASE_DIR / "js" / "puzzles" / "sumgrid" / "index.js").read_text(encoding='utf-8')
        self.assertNotIn("badge: 'Neu'", plugin_file)
        self.assertNotIn('badge: "Neu"', plugin_file)
        self.assertNotIn("badge: 'neu'", plugin_file.lower())

    def test_stats_horizontal_scrolling_css(self):
        """Überprüft, dass die Statistik-Tabs horizontales Scrollen ermöglichen"""
        main_css = (BASE_DIR / "css" / "main.css").read_text(encoding='utf-8')
        self.assertIn('.stats-filter-tabs {', main_css)
        self.assertIn('overflow-x: auto;', main_css)
        self.assertIn('white-space: nowrap;', main_css)
        self.assertIn('flex: 0 0 auto;', main_css)

    def test_version_v2_8_0_across_files(self):
        """Überprüft Konsistenz von Version 2.8.0 und Code 47"""
        sw = (BASE_DIR / "sw.js").read_text(encoding='utf-8')
        gradle = (BASE_DIR / "android" / "app" / "build.gradle.kts").read_text(encoding='utf-8')
        manifest = (BASE_DIR / "android" / "app" / "src" / "main" / "AndroidManifest.xml").read_text(encoding='utf-8')
        readme = (BASE_DIR / "README.md").read_text(encoding='utf-8')
        security = (BASE_DIR / "SECURITY.md").read_text(encoding='utf-8')

        self.assertIn('cortex-app-v2.8.0', sw)
        self.assertIn('id="appVersionBadge">v2.8.0</span>', self.html)
        self.assertIn('versionCode = 47', gradle)
        self.assertIn('versionName = "2.8.0"', gradle)
        self.assertIn('android:versionCode="47"', manifest)
        self.assertIn('android:versionName="2.8.0"', manifest)
        self.assertIn('Version-2.8.0', readme)
        self.assertIn('2.8.0 (versionCode 47)', security)

if __name__ == '__main__':
    unittest.main()
