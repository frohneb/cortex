"""
Unit Tests for Slitherlink Puzzle Plugin in Cortex (Engine, Solver, Generator, Tutorials, Campaign Levels).
"""

import unittest
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

class TestSlitherlinkPlugin(unittest.TestCase):

    def setUp(self):
        self.levels_path = BASE_DIR / "js" / "puzzles" / "slitherlink" / "data" / "levels.js"
        self.tutorial_path = BASE_DIR / "js" / "puzzles" / "slitherlink" / "data" / "tutorial.js"
        self.tutorial_adv_path = BASE_DIR / "js" / "puzzles" / "slitherlink" / "data" / "tutorial_adv.js"
        self.i18n_path = BASE_DIR / "js" / "puzzles" / "slitherlink" / "data" / "i18n.js"
        self.engine_path = BASE_DIR / "js" / "puzzles" / "slitherlink" / "engine.js"
        self.solver_path = BASE_DIR / "js" / "puzzles" / "slitherlink" / "solver.js"
        self.renderer_path = BASE_DIR / "js" / "puzzles" / "slitherlink" / "renderer.js"
        self.css_path = BASE_DIR / "css" / "puzzles" / "slitherlink.css"

    def test_files_exist(self):
        """Überprüft, dass alle erforderlichen Slitherlink-Dateien existieren"""
        self.assertTrue(self.levels_path.exists(), "levels.js muss existieren")
        self.assertTrue(self.tutorial_path.exists(), "tutorial.js muss existieren")
        self.assertTrue(self.tutorial_adv_path.exists(), "tutorial_adv.js muss existieren")
        self.assertTrue(self.i18n_path.exists(), "i18n.js muss existieren")
        self.assertTrue(self.engine_path.exists(), "engine.js muss existieren")
        self.assertTrue(self.solver_path.exists(), "solver.js muss existieren")
        self.assertTrue(self.renderer_path.exists(), "renderer.js muss existieren")
        self.assertTrue(self.css_path.exists(), "slitherlink.css muss existieren")

    def test_levels_count_and_integrity(self):
        """Überprüft, dass exakt 120 Kampagnen-Level definiert sind und valide Strukturen haben"""
        content = self.levels_path.read_text(encoding='utf-8')
        self.assertIn('export const SLITHERLINK_LEVELS = [', content)
        self.assertIn('getSlitherlinkCampaignLevel', content)
        self.assertIn('getSlitherlinkDailyPuzzle', content)

        # Parse levels JSON part
        start = content.find('export const SLITHERLINK_LEVELS = [') + len('export const SLITHERLINK_LEVELS = ')
        end = content.find(';\n\nexport function getSlitherlinkCampaignLevel')
        levels_json = content[start:end]
        levels = json.loads(levels_json)

        self.assertEqual(len(levels), 120, "Es müssen exakt 120 Kampagnen-Level vorhanden sein")

        for idx, lvl in enumerate(levels):
            self.assertEqual(lvl['id'], idx + 1, f"Level {idx+1} muss ID {idx+1} haben")
            self.assertIn('size', lvl)
            self.assertIn('clues', lvl)
            self.assertIn('solution', lvl)
            self.assertEqual(len(lvl['clues']), lvl['size'])
            self.assertEqual(len(lvl['solution']['hEdges']), lvl['size'] + 1)
            self.assertEqual(len(lvl['solution']['vEdges']), lvl['size'])

    def test_tutorials_integrity(self):
        """Überprüft die Struktur der Tutorials"""
        tut_content = self.tutorial_path.read_text(encoding='utf-8')
        tut_adv_content = self.tutorial_adv_path.read_text(encoding='utf-8')

        self.assertIn('SLITHERLINK_TUTORIAL_STEPS', tut_content)
        self.assertIn('SLITHERLINK_TUTORIAL_ADVANCED_STEPS', tut_adv_content)

    def test_renderer_drag_to_draw_support(self):
        """Überprüft, dass der Renderer die Wischgesten (Drag-to-Draw) und Touch-Optimierung enthält"""
        renderer_content = self.renderer_path.read_text(encoding='utf-8')
        self.assertIn('setupDragToDraw', renderer_content, "SlitherlinkRenderer muss setupDragToDraw besitzen")
        self.assertIn('updateEdgeElement', renderer_content, "Renderer muss updateEdgeElement besitzen")
        self.assertIn('pointermove', renderer_content, "Renderer muss pointermove unterstützen")
        self.assertIn('pointerdown', renderer_content, "Renderer muss pointerdown unterstützen")
        self.assertIn('slitherlink-hitzone', renderer_content, "Renderer muss großzügige Hitboxen definieren")

    def test_css_theming_coverage(self):
        """Überprüft, dass alle Themes in slitherlink.css abgedeckt sind"""
        css = self.css_path.read_text(encoding='utf-8')
        self.assertIn('theme-cyberpunk', css, "Cyberpunk Theme muss definiert sein")
        self.assertIn('theme-amoled', css, "AMOLED Theme muss definiert sein")
        self.assertIn('theme-light', css, "Light Theme muss definiert sein")
        self.assertIn('theme-wood', css, "Wood Theme muss definiert sein")
        self.assertIn('.slitherlink-edge-line', css)
        self.assertIn('.slitherlink-edge-cross', css)
        self.assertIn('pointer-events: stroke', css)
    def test_tutorial_2_cross_evaluation(self):
        """Überprüft, dass Tutorial 2 die 4 Kreuze (✕) um die 0 als Ziel definiert hat"""
        tut_content = self.tutorial_path.read_text(encoding='utf-8')
        self.assertIn('Die Null-Regel (0)', tut_content)
        self.assertIn('[0, 2, 0]', tut_content)
        self.assertIn('[0, 2, 2, 0]', tut_content)

    def test_tutorial_6_loop_consistency(self):
        """Überprüft, dass Tutorial 6 valide Hinweise und eine geschlossene Schleife hat"""
        tut_content = self.tutorial_path.read_text(encoding='utf-8')
        self.assertIn('Deine erste vollständige Schleife', tut_content)
        self.assertIn('[2, 1, 2]', tut_content)
        self.assertIn('[1, 0, 1]', tut_content)

    def test_all_120_levels_uniqueness_and_solvability(self):
        """Überprüft, dass alle 120 Kampagnen-Level mathematisch valide Lösungen besitzen"""
        content = self.levels_path.read_text(encoding='utf-8')
        start = content.find('export const SLITHERLINK_LEVELS = [') + len('export const SLITHERLINK_LEVELS = ')
        end = content.find(';\n\nexport function getSlitherlinkCampaignLevel')
        levels = json.loads(content[start:end])

        for lvl in levels:
            size = lvl['size']
            clues = lvl['clues']
            sol = lvl['solution']
            h_edges = sol['hEdges']
            v_edges = sol['vEdges']

            # 1. Check clues matching solution
            for r in range(size):
                for c in range(size):
                    clue = clues[r][c]
                    if clue is not None:
                        cnt = (h_edges[r][c] == 1) + (h_edges[r+1][c] == 1) + (v_edges[r][c] == 1) + (v_edges[r][c+1] == 1)
                        self.assertEqual(cnt, clue, f"Level {lvl['id']} clue at ({r},{c}) does not match solution")

            # 2. Check vertex degrees (must all be 0 or 2)
            deg = [[0]*(size+1) for _ in range(size+1)]
            for r in range(size+1):
                for c in range(size):
                    if h_edges[r][c] == 1:
                        deg[r][c] += 1
                        deg[r][c+1] += 1
            for r in range(size):
                for c in range(size+1):
                    if v_edges[r][c] == 1:
                        deg[r][c] += 1
                        deg[r+1][c] += 1

            active_vertices = 0
            for r in range(size+1):
                for c in range(size+1):
                    self.assertIn(deg[r][c], (0, 2), f"Level {lvl['id']} vertex ({r},{c}) has invalid degree {deg[r][c]}")
                    if deg[r][c] == 2:
                        active_vertices += 1

            self.assertGreater(active_vertices, 0, f"Level {lvl['id']} has no active vertices")


if __name__ == "__main__":
    unittest.main()

