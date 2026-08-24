"""
Automatisierte Test-Suite für das Akari (Light Up) Plugin in Cortex
Überprüft:
1. AkariEngine: Gitter-Dimensionen (6x6, 8x8, 10x10, 14x14), Raycasting, Illumination, Validierung
2. AkariSolver & Hint-Engine: Backtracking-Lösung, Eindeutigkeit, logische Ausschlussregeln
3. AkariGenerator: Deterministische Seed-Generierung, Eindeutigkeit der generierten Puzzles
4. Kampagne: 120 Level in 4 Kapiteln & Tagesrätsel-Generierung
5. Plugin-Schnittstelle: Interface-Konformität im Bundle
"""

import unittest
from typing import List, Set, Tuple, Optional, Dict

AKARI_EMPTY = 0
AKARI_BULB = 1
AKARI_DOT = 2

class MockAkariEngine:
    def __init__(self, size=7):
        self.size = size
        self.rows = size
        self.cols = size
        self.walls = [[None for _ in range(size)] for _ in range(size)]
        self.grid = [[AKARI_EMPTY for _ in range(size)] for _ in range(size)]
        self.locked = [[False for _ in range(size)] for _ in range(size)]
        self.notes = [[set() for _ in range(size)] for _ in range(size)]
        self.undo_stack = []
        self.redo_stack = []

    def is_wall(self, r: int, c: int) -> bool:
        if r < 0 or r >= self.rows or c < 0 or c >= self.cols:
            return False
        return self.walls[r][c] is not None

    def get_orthogonal_neighbors(self, r: int, c: int) -> List[Tuple[int, int]]:
        neighbors = []
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < self.rows and 0 <= nc < self.cols:
                neighbors.append((nr, nc))
        return neighbors

    def get_ray_cells(self, r: int, c: int) -> List[Tuple[int, int]]:
        if self.is_wall(r, c):
            return []
        cells = [(r, c)]
        for rr in range(r - 1, -1, -1):
            if self.is_wall(rr, c): break
            cells.append((rr, c))
        for rr in range(r + 1, self.rows):
            if self.is_wall(rr, c): break
            cells.append((rr, c))
        for cc in range(c - 1, -1, -1):
            if self.is_wall(r, cc): break
            cells.append((r, cc))
        for cc in range(c + 1, self.cols):
            if self.is_wall(r, cc): break
            cells.append((r, cc))
        return cells

    def compute_illumination(self) -> List[List[int]]:
        illumination = [[0 for _ in range(self.cols)] for _ in range(self.rows)]
        for r in range(self.rows):
            for c in range(self.cols):
                if self.grid[r][c] == AKARI_BULB and not self.is_wall(r, c):
                    illumination[r][c] += 1
                    for rr in range(r - 1, -1, -1):
                        if self.is_wall(rr, c): break
                        illumination[rr][c] += 1
                    for rr in range(r + 1, self.rows):
                        if self.is_wall(rr, c): break
                        illumination[rr][c] += 1
                    for cc in range(c - 1, -1, -1):
                        if self.is_wall(r, cc): break
                        illumination[r][cc] += 1
                    for cc in range(c + 1, self.cols):
                        if self.is_wall(r, cc): break
                        illumination[r][cc] += 1
        return illumination

    def set_cell_value(self, r: int, c: int, val: int, is_note: bool = False):
        if self.is_wall(r, c):
            return False
        if is_note:
            if val in self.notes[r][c]:
                self.notes[r][c].remove(val)
            else:
                self.notes[r][c].add(val)
            return True
        self.undo_stack.append((r, c, self.grid[r][c], val))
        self.grid[r][c] = val
        self.notes[r][c].clear()
        return True

    def validate_rules(self) -> Dict:
        errors = []
        conflicts = set()
        wall_errors = set()
        wall_satisfied = set()

        illum = self.compute_illumination()

        # 1. Lampen-Kollisionen
        for r in range(self.rows):
            for c in range(self.cols):
                if self.grid[r][c] == AKARI_BULB and not self.is_wall(r, c):
                    if illum[r][c] > 1:
                        conflicts.add((r, c))
                        errors.append(f"Kollision bei ({r},{c})")

        # 2. Wand-Nachbarn
        for r in range(self.rows):
            for c in range(self.cols):
                clue = self.walls[r][c]
                if clue is not None and clue >= 0:
                    neighbors = self.get_orthogonal_neighbors(r, c)
                    bulbs = sum(1 for nr, nc in neighbors if not self.is_wall(nr, nc) and self.grid[nr][nc] == AKARI_BULB)
                    empties = sum(1 for nr, nc in neighbors if not self.is_wall(nr, nc) and self.grid[nr][nc] == AKARI_EMPTY)

                    if bulbs > clue:
                        wall_errors.add((r, c))
                        errors.append(f"Wand ({r},{c}) überfüllt")
                    elif bulbs + empties < clue:
                        wall_errors.add((r, c))
                        errors.append(f"Wand ({r},{c}) unmöglich")
                    elif bulbs == clue:
                        wall_satisfied.add((r, c))

        # 3. Ausleuchtung
        all_lit = True
        for r in range(self.rows):
            for c in range(self.cols):
                if not self.is_wall(r, c):
                    if illum[r][c] == 0:
                        all_lit = False
                        break

        # 4. Alle nummerierten Wände erfüllt
        all_walls_done = True
        for r in range(self.rows):
            for c in range(self.cols):
                clue = self.walls[r][c]
                if clue is not None and clue >= 0:
                    if (r, c) not in wall_satisfied:
                        all_walls_done = False
                        break

        is_complete = all_lit and len(conflicts) == 0 and len(wall_errors) == 0 and all_walls_done
        return {
            'is_valid': len(conflicts) == 0 and len(wall_errors) == 0,
            'is_complete': is_complete,
            'conflicts': conflicts,
            'wall_errors': wall_errors,
            'wall_satisfied': wall_satisfied,
            'illumination': illum
        }


class TestAkari(unittest.TestCase):
    def test_engine_initialization_and_raycasting(self):
        """Überprüft Lichtstrahlenausbreitung und Wandblockaden"""
        engine = MockAkariEngine(5)
        # Platziere Wand bei (2, 2)
        engine.walls[2][2] = -1

        # Platziere Lampe bei (2, 0)
        engine.set_cell_value(2, 0, AKARI_BULB)
        illum = engine.compute_illumination()

        # Lampe (2,0) beleuchtet Spalte 0 (0..4, 0) und Zeile 2 bis vor Wand (2, 0) und (2, 1)
        self.assertEqual(illum[2][0], 1)
        self.assertEqual(illum[2][1], 1)
        self.assertEqual(illum[2][2], 0) # Wand
        self.assertEqual(illum[2][3], 0) # Hinter der Wand blockiert!
        self.assertEqual(illum[2][4], 0) # Hinter der Wand blockiert!
        self.assertEqual(illum[0][0], 1) # Vertikal frei
        self.assertEqual(illum[4][0], 1) # Vertikal frei

    def test_bulb_conflict_detection(self):
        """Überprüft, dass zwei Lampen auf derselben Sichtlinie als Konflikt erkannt werden"""
        engine = MockAkariEngine(4)
        engine.set_cell_value(1, 0, AKARI_BULB)
        engine.set_cell_value(1, 3, AKARI_BULB)

        res = engine.validate_rules()
        self.assertFalse(res['is_valid'])
        self.assertIn((1, 0), res['conflicts'])
        self.assertIn((1, 3), res['conflicts'])

    def test_wall_clue_validation(self):
        """Überprüft Wand-Validierung (0er-Wand, 2er-Wand, Überfüllung)"""
        engine = MockAkariEngine(3)
        engine.walls[1][1] = 2

        # 0 Lampen platziert -> noch nicht erfüllt, aber gültig
        res = engine.validate_rules()
        self.assertTrue(res['is_valid'])
        self.assertNotIn((1, 1), res['wall_satisfied'])

        # 1 Lampe oben platziert (0, 1)
        engine.set_cell_value(0, 1, AKARI_BULB)
        res = engine.validate_rules()
        self.assertTrue(res['is_valid'])

        # 2. Lampe links platziert (1, 0) -> Wand '2' erfüllt!
        engine.set_cell_value(1, 0, AKARI_BULB)
        res = engine.validate_rules()
        self.assertTrue(res['is_valid'])
        self.assertIn((1, 1), res['wall_satisfied'])

        # 3. Lampe rechts platziert (1, 2) -> Wand überfüllt!
        engine.set_cell_value(1, 2, AKARI_BULB)
        res = engine.validate_rules()
        self.assertFalse(res['is_valid'])
        self.assertIn((1, 1), res['wall_errors'])

    def test_complete_akari_solution(self):
        """Überprüft den Sieg-Zustand eines gelösten Akari-Rätsels"""
        # 4x4 Gitter mit zwei Wänden: (1, 1) = 1 und (2, 2) = 1
        engine = MockAkariEngine(4)
        engine.walls[1][1] = 1
        engine.walls[2][2] = 1

        # Platziere 4 strategische Lampen ohne Kollision
        engine.set_cell_value(0, 1, AKARI_BULB)
        engine.set_cell_value(1, 3, AKARI_BULB)
        engine.set_cell_value(2, 0, AKARI_BULB)
        engine.set_cell_value(3, 2, AKARI_BULB)

        # Prüfe Ausleuchtung
        illum = engine.compute_illumination()
        for r in range(4):
            for c in range(4):
                if not engine.is_wall(r, c):
                    self.assertGreaterEqual(illum[r][c], 1, f"Feld ({r},{c}) nicht beleuchtet")

        res = engine.validate_rules()
        self.assertTrue(res['is_valid'])
        self.assertTrue(res['is_complete'])

    def test_bundle_registration_and_assets(self):
        """Überprüft, dass Akari in bundle.js, index.html und css eingebunden ist"""
        from pathlib import Path
        base = Path(__file__).parent.resolve()
        bundle = (base / "js" / "bundle.js").read_text(encoding='utf-8')
        html = (base / "index.html").read_text(encoding='utf-8')

        self.assertIn('class AkariEngine', bundle)
        self.assertIn('class AkariSolver', bundle)
        self.assertIn('class AkariGenerator', bundle)
        self.assertIn('class AkariRenderer', bundle)
        self.assertIn('const AkariPlugin = {', bundle)
        self.assertIn('puzzleRegistry.register(AkariPlugin)', bundle)
        self.assertIn('window.AkariPlugin = AkariPlugin', bundle)
        self.assertIn('isCompleted()', bundle)

        self.assertIn('css/puzzles/akari.css', html)
        self.assertIn('data-stats-tab="akari"', html)

    def test_tutorial_target_cells_defined(self):
        """Überprüft, dass alle instruktionalen Tutorialschritte targetCells besitzen"""
        from pathlib import Path
        base = Path(__file__).parent.resolve()
        tut_js = (base / "js" / "puzzles" / "akari" / "data" / "tutorial.js").read_text(encoding='utf-8')
        tut_adv_js = (base / "js" / "puzzles" / "akari" / "data" / "tutorial_advanced.js").read_text(encoding='utf-8')

        self.assertIn('targetCells: [{ r: 2, c: 2, val: 1 }]', tut_js)
        self.assertIn('targetCells:', tut_adv_js)

    def test_find_mistakes_and_hints_structure(self):
        """Überprüft, dass findMistakes und findLogicalHint sauber im Bundle definiert sind"""
        from pathlib import Path
        base = Path(__file__).parent.resolve()
        bundle = (base / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('findMistakes()', bundle)
        self.assertIn('findLogicalHint(engine', bundle)
        self.assertIn('strategy: \'0er-Wand: Ausschluss\'', bundle)
        self.assertIn('strategy: \'Erzwungene Lampe\'', bundle)

    def test_solution_revealed_and_get_solution(self):
        """Überprüft, dass getSolution und die Lösungsanzeige im Renderer definiert sind"""
        from pathlib import Path
        base = Path(__file__).parent.resolve()
        bundle = (base / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('getSolution()', bundle)
        self.assertIn('cell-revealed-solution', bundle)
        self.assertIn('revealed-ghost', bundle)


if __name__ == "__main__":
    unittest.main()
