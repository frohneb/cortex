"""
Automatisierte Test-Suite für das Tango Logikrätsel
Überprüft:
1. Regel 1: Keine drei gleichen Symbole hintereinander (weder horizontal noch vertikal)
2. Regel 2: Gleiche Anzahl an Sonnen (1) und Monden (2) pro Zeile und Spalte
3. Regel 3: Gleichheits- (=) und Gegenteils-Kanten (x)
4. Solver-Konsistenz: Logische Lösbarkeit und Eindeutigkeit
"""

import unittest
from typing import List, Tuple, Optional, Dict

EMPTY = 0
SUN = 1    # ☀️
MOON = 2   # 🌙

EDGE_NONE = 0
EDGE_EQUAL = 1     # =
EDGE_OPPOSITE = 2  # x

class TangoBoard:
    def __init__(self, size: int):
        self.size = size
        self.grid = [[EMPTY for _ in range(size)] for _ in range(size)]
        # Horizontale Kanten: zwischen (r, c) und (r, c+1) -> size x (size - 1)
        self.h_edges = [[EDGE_NONE for _ in range(size - 1)] for _ in range(size)]
        # Vertikale Kanten: zwischen (r, c) und (r+1, c) -> (size - 1) x size
        self.v_edges = [[EDGE_NONE for _ in range(size)] for _ in range(size - 1)]

    def set_cell(self, r: int, c: int, val: int):
        self.grid[r][c] = val

    def set_h_edge(self, r: int, c: int, edge_type: int):
        self.h_edges[r][c] = edge_type

    def set_v_edge(self, r: int, c: int, edge_type: int):
        self.v_edges[r][c] = edge_type

    def check_three_in_a_row(self) -> List[str]:
        errors = []
        # Horizontal
        for r in range(self.size):
            for c in range(self.size - 2):
                v1, v2, v3 = self.grid[r][c], self.grid[r][c+1], self.grid[r][c+2]
                if v1 != EMPTY and v1 == v2 and v2 == v3:
                    sym = "Sonnen" if v1 == SUN else "Monde"
                    errors.append(f"Regel 1 verletzt: 3 {sym} nebeneinander in Zeile {r+1}, Spalten {c+1}-{c+3}")
        # Vertikal
        for c in range(self.size):
            for r in range(self.size - 2):
                v1, v2, v3 = self.grid[r][c], self.grid[r+1][c], self.grid[r+2][c]
                if v1 != EMPTY and v1 == v2 and v2 == v3:
                    sym = "Sonnen" if v1 == SUN else "Monde"
                    errors.append(f"Regel 1 verletzt: 3 {sym} untereinander in Spalte {c+1}, Zeilen {r+1}-{r+3}")
        return errors

    def check_balance(self) -> List[str]:
        errors = []
        max_allowed = self.size // 2
        # Zeilen
        for r in range(self.size):
            suns = sum(1 for c in range(self.size) if self.grid[r][c] == SUN)
            moons = sum(1 for c in range(self.size) if self.grid[r][c] == MOON)
            if suns > max_allowed:
                errors.append(f"Regel 2 verletzt: Zu viele Sonnen in Zeile {r+1} ({suns}/{max_allowed})")
            if moons > max_allowed:
                errors.append(f"Regel 2 verletzt: Zu viele Monde in Zeile {r+1} ({moons}/{max_allowed})")
        # Spalten
        for c in range(self.size):
            suns = sum(1 for r in range(self.size) if self.grid[r][c] == SUN)
            moons = sum(1 for r in range(self.size) if self.grid[r][c] == MOON)
            if suns > max_allowed:
                errors.append(f"Regel 2 verletzt: Zu viele Sonnen in Spalte {c+1} ({suns}/{max_allowed})")
            if moons > max_allowed:
                errors.append(f"Regel 2 verletzt: Zu viele Monde in Spalte {c+1} ({moons}/{max_allowed})")
        return errors

    def check_edge_constraints(self) -> List[str]:
        errors = []
        # Horizontale Kanten
        for r in range(self.size):
            for c in range(self.size - 1):
                edge = self.h_edges[r][c]
                if edge == EDGE_NONE:
                    continue
                v1, v2 = self.grid[r][c], self.grid[r][c+1]
                if v1 != EMPTY and v2 != EMPTY:
                    if edge == EDGE_EQUAL and v1 != v2:
                        errors.append(f"Regel 3 verletzt: Gleichheitszeichen (=) zwischen ({r+1},{c+1}) und ({r+1},{c+2}) nicht erfüllt")
                    elif edge == EDGE_OPPOSITE and v1 == v2:
                        errors.append(f"Regel 3 verletzt: Gegenteilszeichen (x) zwischen ({r+1},{c+1}) und ({r+1},{c+2}) nicht erfüllt")
        # Vertikale Kanten
        for r in range(self.size - 1):
            for c in range(self.size):
                edge = self.v_edges[r][c]
                if edge == EDGE_NONE:
                    continue
                v1, v2 = self.grid[r][c], self.grid[r+1][c]
                if v1 != EMPTY and v2 != EMPTY:
                    if edge == EDGE_EQUAL and v1 != v2:
                        errors.append(f"Regel 3 verletzt: Gleichheitszeichen (=) zwischen ({r+1},{c+1}) und ({r+2},{c+1}) nicht erfüllt")
                    elif edge == EDGE_OPPOSITE and v1 == v2:
                        errors.append(f"Regel 3 verletzt: Gegenteilszeichen (x) zwischen ({r+1},{c+1}) und ({r+2},{c+1}) nicht erfüllt")
        return errors

    def is_valid_partial(self) -> bool:
        return (len(self.check_three_in_a_row()) == 0 and
                len(self.check_balance()) == 0 and
                len(self.check_edge_constraints()) == 0)

    def is_fully_solved(self) -> bool:
        for r in range(self.size):
            for c in range(self.size):
                if self.grid[r][c] == EMPTY:
                    return False
        return self.is_valid_partial()


def solve_tango(board: TangoBoard) -> List[List[List[int]]]:
    """Backtracking Solver zur Prüfung von Eindeutigkeit und Lösbarkeit"""
    solutions = []

    def backtrack(r: int, c: int):
        if len(solutions) > 1:
            return  # Stop if not unique
        if r == board.size:
            # Check duplicate rows/cols
            row_tuples = [tuple(board.grid[i]) for i in range(board.size)]
            if len(set(row_tuples)) != board.size:
                return
            col_tuples = [tuple(board.grid[i][j] for i in range(board.size)) for j in range(board.size)]
            if len(set(col_tuples)) != board.size:
                return
            solutions.append([row[:] for row in board.grid])
            return

        next_r = r if c + 1 < board.size else r + 1
        next_c = (c + 1) if c + 1 < board.size else 0

        if board.grid[r][c] != EMPTY:
            backtrack(next_r, next_c)
        else:
            for val in (SUN, MOON):
                board.grid[r][c] = val
                if board.is_valid_partial():
                    backtrack(next_r, next_c)
                board.grid[r][c] = EMPTY

    backtrack(0, 0)
    return solutions


class TestTangoRules(unittest.TestCase):
    def test_rule_1_three_in_a_row_horizontal(self):
        """Testet die Erkennung von 3 gleichen Symbolen horizontal"""
        board = TangoBoard(4)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, SUN)
        errors = board.check_three_in_a_row()
        self.assertEqual(len(errors), 1)
        self.assertIn("3 Sonnen nebeneinander in Zeile 1", errors[0])

    def test_rule_1_three_in_a_row_vertical(self):
        """Testet die Erkennung von 3 gleichen Symbolen vertikal"""
        board = TangoBoard(4)
        board.set_cell(0, 1, MOON)
        board.set_cell(1, 1, MOON)
        board.set_cell(2, 1, MOON)
        errors = board.check_three_in_a_row()
        self.assertEqual(len(errors), 1)
        self.assertIn("3 Monde untereinander in Spalte 2", errors[0])

    def test_rule_2_balance(self):
        """Testet die Begrenzung auf maximal N/2 Sonnen und Monde"""
        board = TangoBoard(4)
        # 4x4 erlaubt maximal 2 Sonnen pro Zeile
        board.set_cell(1, 0, SUN)
        board.set_cell(1, 1, MOON)
        board.set_cell(1, 2, SUN)
        board.set_cell(1, 3, SUN)
        errors = board.check_balance()
        self.assertTrue(any("Zu viele Sonnen in Zeile 2" in e for e in errors))

    def test_rule_3_edge_equal_constraint(self):
        """Testet die = Kante (müssen gleich sein)"""
        board = TangoBoard(4)
        board.set_h_edge(0, 0, EDGE_EQUAL)  # (0,0) = (0,1)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, MOON)  # Falsch!
        errors = board.check_edge_constraints()
        self.assertEqual(len(errors), 1)
        self.assertIn("Gleichheitszeichen (=)", errors[0])

        # Korrektur
        board.set_cell(0, 1, SUN)
        self.assertEqual(len(board.check_edge_constraints()), 0)

    def test_rule_3_edge_opposite_constraint(self):
        """Testet die x Kante (müssen ungleich sein)"""
        board = TangoBoard(4)
        board.set_v_edge(0, 0, EDGE_OPPOSITE)  # (0,0) x (1,0)
        board.set_cell(0, 0, MOON)
        board.set_cell(1, 0, MOON)  # Falsch!
        errors = board.check_edge_constraints()
        self.assertEqual(len(errors), 1)
        self.assertIn("Gegenteilszeichen (x)", errors[0])

        # Korrektur
        board.set_cell(1, 0, SUN)
        self.assertEqual(len(board.check_edge_constraints()), 0)

    def test_complete_4x4_puzzle_solve(self):
        """Testet das Lösen eines 4x4 Tango Puzzles mit eindeutiger Lösung"""
        board = TangoBoard(4)
        # Ziel:
        # [1, 1, 2, 2]
        # [2, 1, 1, 2]
        # [1, 2, 2, 1]
        # [2, 2, 1, 1]
        board.set_h_edge(0, 0, EDGE_EQUAL)     # (0,0) = (0,1)
        board.set_h_edge(1, 2, EDGE_OPPOSITE)  # (1,2) x (1,3)
        board.set_h_edge(3, 0, EDGE_EQUAL)     # (3,0) = (3,1)
        board.set_cell(0, 0, SUN)
        board.set_cell(1, 2, SUN)
        board.set_cell(2, 0, SUN)
        board.set_cell(3, 0, MOON)

        solutions = solve_tango(board)
        self.assertEqual(len(solutions), 1, "Das Rätsel sollte genau eine eindeutige Lösung haben")

        # Setze die gefundene Lösung ins Board ein und prüfe Validität
        for r in range(4):
            for c in range(4):
                board.set_cell(r, c, solutions[0][r][c])
        self.assertTrue(board.is_fully_solved())
    def test_duplicate_rows_and_cols(self):
        """Testet, dass keine zwei Zeilen oder Spalten identisch sein dürfen"""
        board = TangoBoard(4)
        # Zwei identische Zeilen
        row = [SUN, SUN, MOON, MOON]
        board.grid[0] = row[:]
        board.grid[1] = row[:]
        board.grid[2] = [MOON, MOON, SUN, SUN]
        board.grid[3] = [MOON, SUN, MOON, SUN]

        row_tuples = [tuple(board.grid[i]) for i in range(board.size)]
        has_duplicate_rows = len(set(row_tuples)) != board.size
        self.assertTrue(has_duplicate_rows, "Identische Zeilen müssen erkannt werden")

    def test_solve_6x6_puzzle(self):
        """Testet das Lösen eines komplexeren 6x6 Puzzles mit eindeutiger Lösung"""
        board = TangoBoard(6)
        board.set_h_edge(0, 0, EDGE_EQUAL)  # (0,0)=(0,1) [1,1]
        board.set_h_edge(0, 4, EDGE_EQUAL)  # (0,4)=(0,5) [2,2]
        board.set_h_edge(1, 0, EDGE_EQUAL)  # (1,0)=(1,1) [1,1]
        board.set_h_edge(2, 0, EDGE_EQUAL)  # (2,0)=(2,1) [2,2]
        board.set_h_edge(2, 2, EDGE_EQUAL)  # (2,2)=(2,3) [1,1]
        board.set_h_edge(3, 2, EDGE_EQUAL)  # (3,2)=(3,3) [1,1]
        board.set_h_edge(3, 4, EDGE_EQUAL)  # (3,4)=(3,5) [2,2]
        board.set_h_edge(4, 4, EDGE_EQUAL)  # (4,4)=(4,5) [1,1]
        board.set_h_edge(5, 4, EDGE_EQUAL)  # (5,4)=(5,5) [1,1]

        board.set_cell(0, 0, SUN)
        board.set_cell(2, 0, MOON)
        board.set_cell(3, 1, MOON)
        board.set_cell(4, 0, MOON)
        board.set_cell(5, 2, SUN)

        solutions = solve_tango(board)
        self.assertEqual(len(solutions), 1, "6x6 Rätsel muss genau 1 eindeutige Lösung besitzen")


if __name__ == "__main__":
    unittest.main()
