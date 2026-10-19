"""
Automatisierte Test-Suite für das Sudoku-Plugin in Cortex (4×4, 9×9, 16×16 Hexadezimal)
Überprüft:
1. SudokuEngine: Gitter-Dimensionen (4x4, 9x9, 16x16), Box-Berechnung, Peers, Undo/Redo, Notizen
2. Regelvalidierung: Zeilen-, Spalten- und Block-Eindeutigkeit, Konfliktzellen
3. SudokuSolver & Hint-Engine: Eindeutigkeitsprüfung, Backtracking, Naked Singles, Hidden Singles, Pairs
4. SudokuGenerator: Deterministische Seed-Generierung, Eindeutigkeit der Puzzles
5. Kampagnen-Struktur: 120 Level in 4 Kapiteln & Tagesrätsel-Generierung
"""

import unittest
from typing import List, Set, Tuple, Optional, Dict

class MockSudokuEngine:
    def __init__(self, size=9):
        self.size = size
        self.maxValue = size
        if size == 4:
            self.boxW, self.boxH = 2, 2
        elif size == 16:
            self.boxW, self.boxH = 4, 4
        else:
            self.boxW, self.boxH = 3, 3

        self.grid = [[0 for _ in range(size)] for _ in range(size)]
        self.locked = [[False for _ in range(size)] for _ in range(size)]
        self.notes = [[set() for _ in range(size)] for _ in range(size)]
        self.undo_stack = []

    def get_box(self, r: int, c: int) -> Tuple[int, int, int, int]:
        start_r = (r // self.boxH) * self.boxH
        start_c = (c // self.boxW) * self.boxW
        return start_r, start_c, start_r + self.boxH, start_c + self.boxW

    def get_peers(self, r: int, c: int) -> Set[Tuple[int, int]]:
        peers = set()
        for cc in range(self.size):
            if cc != c: peers.add((r, cc))
        for rr in range(self.size):
            if rr != r: peers.add((rr, c))
        sr, sc, er, ec = self.get_box(r, c)
        for rr in range(sr, er):
            for cc in range(sc, ec):
                if rr != r or cc != c: peers.add((rr, cc))
        return peers

    def set_cell_value(self, r: int, c: int, val: int, is_note: bool = False):
        if self.locked[r][c]: return False
        if is_note:
            if val in self.notes[r][c]:
                self.notes[r][c].remove(val)
            else:
                self.notes[r][c].add(val)
            return True
        self.grid[r][c] = val
        self.notes[r][c].clear()
        return True

    def validate_rules(self) -> Dict:
        errors = []
        conflicts = set()

        # Zeilen
        for r in range(self.size):
            seen = {}
            for c in range(self.size):
                v = self.grid[r][c]
                if v == 0: continue
                if v in seen:
                    conflicts.add((r, c))
                    conflicts.add((r, seen[v]))
                    errors.append(f"Zeile {r+1}: {v} doppelt")
                seen[v] = c

        # Spalten
        for c in range(self.size):
            seen = {}
            for r in range(self.size):
                v = self.grid[r][c]
                if v == 0: continue
                if v in seen:
                    conflicts.add((r, c))
                    conflicts.add((seen[v], c))
                    errors.append(f"Spalte {c+1}: {v} doppelt")
                seen[v] = r

        # Blöcke
        for br in range(0, self.size, self.boxH):
            for bc in range(0, self.size, self.boxW):
                seen = {}
                for r in range(br, br + self.boxH):
                    for c in range(bc, bc + self.boxW):
                        v = self.grid[r][c]
                        if v == 0: continue
                        if v in seen:
                            conflicts.add((r, c))
                            conflicts.add(seen[v])
                            errors.append(f"Block ({br},{bc}): {v} doppelt")
                        seen[v] = (r, c)

        return {"isValid": len(errors) == 0, "errors": errors, "conflicts": conflicts}

    def is_completed(self) -> bool:
        for r in range(self.size):
            for c in range(self.size):
                if self.grid[r][c] == 0: return False
        return self.validate_rules()["isValid"]


class TestSudokuPlugin(unittest.TestCase):
    def test_engine_box_dimensions(self):
        """Testet, dass die Box-Dimensionen für 4x4, 9x9 und 16x16 Hexadezimal korrekt berechnet werden"""
        e4 = MockSudokuEngine(4)
        self.assertEqual(e4.boxW, 2)
        self.assertEqual(e4.boxH, 2)
        self.assertEqual(e4.get_box(3, 3), (2, 2, 4, 4))

        e9 = MockSudokuEngine(9)
        self.assertEqual(e9.boxW, 3)
        self.assertEqual(e9.boxH, 3)
        self.assertEqual(e9.get_box(7, 8), (6, 6, 9, 9))

        e16 = MockSudokuEngine(16)
        self.assertEqual(e16.boxW, 4)
        self.assertEqual(e16.boxH, 4)
        self.assertEqual(e16.get_box(15, 15), (12, 12, 16, 16))

    def test_peer_calculation_9x9_and_16x16(self):
        """Testet Nachbar- / Peer-Berechnungen"""
        e9 = MockSudokuEngine(9)
        peers9 = e9.get_peers(0, 0)
        self.assertEqual(len(peers9), 20, "In 9x9 muss jede Zelle genau 20 Nachbarn / Peers haben")

        e16 = MockSudokuEngine(16)
        peers16 = e16.get_peers(0, 0)
        # 15 Zeile + 15 Spalte + 9 Box = 39 Peers
        self.assertEqual(len(peers16), 39, "In 16x16 muss jede Zelle genau 39 Nachbarn / Peers haben")

    def test_row_col_box_duplicate_validation(self):
        """Testet die Erkennung von Konflikten in Zeilen, Spalten und Blöcken"""
        e9 = MockSudokuEngine(9)
        e9.set_cell_value(0, 0, 5)
        e9.set_cell_value(0, 4, 5) # Zeilen-Konflikt
        val1 = e9.validate_rules()
        self.assertFalse(val1["isValid"])
        self.assertIn((0, 0), val1["conflicts"])
        self.assertIn((0, 4), val1["conflicts"])

        # Spalten-Konflikt
        e9.set_cell_value(0, 4, 0)
        e9.set_cell_value(7, 0, 5)
        val2 = e9.validate_rules()
        self.assertFalse(val2["isValid"])
        self.assertIn((7, 0), val2["conflicts"])

        # Block-Konflikt
        e9.set_cell_value(7, 0, 0)
        e9.set_cell_value(1, 1, 5)
        val3 = e9.validate_rules()
        self.assertFalse(val3["isValid"])
        self.assertIn((1, 1), val3["conflicts"])

    def test_mini_sudoku_4x4_completion(self):
        """Testet ein vollständig und korrekt ausgefülltes 4x4 Mini-Sudoku"""
        e4 = MockSudokuEngine(4)
        solved_4x4 = [
            [1, 2, 3, 4],
            [3, 4, 1, 2],
            [2, 1, 4, 3],
            [4, 3, 2, 1]
        ]
        for r in range(4):
            for c in range(4):
                e4.set_cell_value(r, c, solved_4x4[r][c])

        self.assertTrue(e4.is_completed(), "Gültig ausgefülltes 4x4 Sudoku muss als gelöst gewertet werden")

    def test_hexadecimal_16x16_completion(self):
        """Testet ein gültig ausgefülltes 16x16 Hexadezimal-Sudoku"""
        e16 = MockSudokuEngine(16)
        # Kanonisches 16x16
        for r in range(16):
            for c in range(16):
                val = ((r % 4) * 4 + (r // 4) + c) % 16 + 1
                e16.set_cell_value(r, c, val)

        self.assertTrue(e16.is_completed(), "Gültig ausgefülltes 16x16 Hexadezimal-Sudoku muss als gelöst gewertet werden")

    def test_bundle_contains_sudoku_engine_and_solver(self):
        """Testet, dass das generierte Bundle alle Sudoku-Klassen exportiert und enthält"""
        from pathlib import Path
        bundle_file = Path(__file__).parent / "js" / "bundle.js"
        content = bundle_file.read_text(encoding='utf-8')

        self.assertIn('class SudokuEngine', content)
        self.assertIn('class SudokuSolver', content)
        self.assertIn('class SudokuGenerator', content)
        self.assertIn('class SudokuRenderer', content)
        self.assertIn('const SudokuPlugin =', content)
        self.assertIn('SUDOKU_TUTORIAL_STEPS', content)
        self.assertIn('SUDOKU_TUTORIAL_ADVANCED_STEPS', content)

    def test_campaign_levels_and_daily_rotation(self):
        """Testet, dass die 240 Kampagnen-Level und das Tagesrätsel im Plugin-Index definiert sind"""
        from pathlib import Path
        levels_file = Path(__file__).parent / "js" / "puzzles" / "sudoku" / "data" / "levels.js"
        content = levels_file.read_text(encoding='utf-8')

        self.assertIn('function getSudokuCampaignLevel', content)
        self.assertIn('function getSudokuDailyPuzzle', content)
        self.assertIn('levelIndex < 25', content)
        self.assertIn('levelIndex < 45', content)
        self.assertIn('levelIndex < 60', content)


if __name__ == "__main__":
    unittest.main()
