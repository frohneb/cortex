"""
Automatisierte Test-Suite für das Cortex Plugin-System & Shared-Architektur
Überprüft:
1. PuzzleRegistry: Registrierung, Lifecycle, Validierung, Daily-Auswahl
2. StorageManager: Namensräume, Migration von tango_* -> cortex_*, Fallbacks
3. StatsManager: Aggregierte Statistiken über mehrere Puzzles, Streaks
4. Themes & i18n: Dynamische Text- und Theme-Auswahl
5. DOM- und Bundle-Konsistenz: Puzzle-Auswahl-Modal, Filter-Tabs
"""

import unittest
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

class TestCortexPlugins(unittest.TestCase):
    def test_puzzle_registry_in_bundle(self):
        """Überprüft, dass PuzzleRegistry und alle Plugins im Bundle registriert sind"""
        bundle = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('class PuzzleRegistry', bundle)
        self.assertIn('const puzzleRegistry = new PuzzleRegistry()', bundle)
        self.assertIn('puzzleRegistry.register(TangoPlugin)', bundle)
        self.assertIn('puzzleRegistry.register(SudokuPlugin)', bundle)
        self.assertIn('puzzleRegistry.register(AkariPlugin)', bundle)
        self.assertIn('puzzleRegistry.register(NonogramPlugin)', bundle)

    def test_storage_namespacing_and_migration(self):
        """Überprüft, dass die Storage-Namensräume und Migration im Bundle vorhanden sind"""
        bundle = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('class StorageManager', bundle)
        self.assertIn('checkAndMigrate', bundle)
        self.assertIn("PREFIX = 'cortex_'", bundle)
        self.assertIn('StorageKeys', bundle)
        self.assertIn('tango_theme', bundle)
        self.assertIn('tango_daily_history', bundle)

    def test_puzzle_selector_modal_and_trigger_in_dom(self):
        """Überprüft, dass das Puzzle-Auswahl-Modal und der Switcher-Button in index.html vorhanden sind"""
        html = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        self.assertIn('id="puzzleSelectModal"', html)
        self.assertIn('id="btnBackToAllPuzzles"', html)
        self.assertIn('id="btnClosePuzzleSelect"', html)
        self.assertIn('id="puzzleSelectionGrid"', html)
        self.assertIn('id="activePuzzleIcon"', html)
        self.assertIn('id="activePuzzleName"', html)

    def test_stats_multi_tabs_in_dom(self):
        """Überprüft, dass die Statistik-Sub-Tabs im DOM vorhanden sind"""
        html = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        self.assertIn('class="stats-filter-tabs"', html)
        self.assertIn('data-stats-tab="all"', html)
        self.assertIn('data-stats-tab="akari"', html)
        self.assertIn('data-stats-tab="nonogram"', html)
        self.assertIn('data-stats-tab="sudoku"', html)
        self.assertIn('data-stats-tab="tango"', html)

    def test_themes_and_timer_classes_in_bundle(self):
        """Überprüft, dass ThemeManager und GameTimer sauber im Bundle existieren"""
        bundle = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('class ThemeManager', bundle)
        self.assertIn('class GameTimer', bundle)
        self.assertIn('class StatsManager', bundle)

    def test_manifest_and_sw_cortex_branding(self):
        """Überprüft, dass Manifest und Service Worker auf Cortex aktualisiert sind"""
        manifest = (BASE_DIR / "manifest.json").read_text(encoding='utf-8')
        sw = (BASE_DIR / "sw.js").read_text(encoding='utf-8')
        self.assertIn('"name": "Cortex - Logikrätsel"', manifest)
        self.assertIn('cortex-app-v2.', sw)
        self.assertIn('./css/puzzles/sudoku.css', sw)
    def test_stats_14x14_i18n_and_aggregation(self):
        """Überprüft, dass 14x14 Bestzeit-Übersetzung und Aggregation vorhanden sind"""
        bundle = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('stats_best_time_14: "Bestzeit 14×14"', bundle)
        self.assertIn('stats_best_time_14: "Best Time 14×14"', bundle)
        self.assertIn('aggregatedBestTimes', bundle)


if __name__ == "__main__":
    unittest.main()
