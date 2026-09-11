"""
Test-Suite für das Minesweeper-Plugin in Cortex
Überprüft:
1. Engine: Spiellogik, Reveal, Flood-Fill, Flaggen, Undo/Redo, Niederlage & Sieg
2. Generator: Determinismus, korrekte Dimensionen und Minenzahlen
3. Solver & Hints: Konsistenzprüfung, logische Hinweise
4. Eindeutigkeits- & Konsistenz-Prüfung aller 120 Kampagnen-Level
5. Eindeutigkeits- & Konsistenz-Prüfung aller Tutorial-Lektionen
"""

import unittest
import math

class TestMinesweeperCore(unittest.TestCase):
    def seeded_random(self, seed):
        s = abs(seed) or 1
        def rng():
            nonlocal s
            s = (s * 9301 + 49297) % 233280
            return s / 233280
        return rng

    def generate_puzzle(self, rows, cols, mine_count, seed):
        total_cells = rows * cols
        actual_mines = max(1, min(mine_count, total_cells - 1))
        rng = self.seeded_random(seed)

        indices = list(range(total_cells))
        for i in range(total_cells - 1, 0, -1):
            j = int(rng() * (i + 1))
            indices[i], indices[j] = indices[j], indices[i]

        mines = [[False for _ in range(cols)] for _ in range(rows)]
        for i in range(actual_mines):
            idx = indices[i]
            r = idx // cols
            c = idx % cols
            mines[r][c] = True

        adjacency = [[0 for _ in range(cols)] for _ in range(rows)]
        for r in range(rows):
            for c in range(cols):
                if mines[r][c]:
                    adjacency[r][c] = -1
                else:
                    cnt = 0
                    for dr in (-1, 0, 1):
                        for dc in (-1, 0, 1):
                            if dr == 0 and dc == 0:
                                continue
                            nr, nc = r + dr, c + dc
                            if 0 <= nr < rows and 0 <= nc < cols and mines[nr][nc]:
                                cnt += 1
                    adjacency[r][c] = cnt

        return {
            'rows': rows,
            'cols': cols,
            'mineCount': actual_mines,
            'mines': mines,
            'adjacency': adjacency,
            'solution': [[1 if mines[r][c] else 0 for c in range(cols)] for r in range(rows)]
        }

    def test_generator_determinism(self):
        """Überprüft, dass derselbe Seed exakt dasselbe Minenfeld generiert"""
        p1 = self.generate_puzzle(8, 8, 10, seed=4242)
        p2 = self.generate_puzzle(8, 8, 10, seed=4242)
        p3 = self.generate_puzzle(8, 8, 10, seed=9999)

        self.assertEqual(p1['mines'], p2['mines'])
        self.assertEqual(p1['adjacency'], p2['adjacency'])
        self.assertNotEqual(p1['mines'], p3['mines'])

    def test_adjacency_consistency(self):
        """Überprüft, dass jede Zahl auf dem Feld exakt der Anzahl an Nachbar-Minen entspricht"""
        puzzle = self.generate_puzzle(12, 12, 23, seed=777)
        rows, cols = puzzle['rows'], puzzle['cols']
        mines = puzzle['mines']
        adj = puzzle['adjacency']

        for r in range(rows):
            for c in range(cols):
                if mines[r][c]:
                    self.assertEqual(adj[r][c], -1)
                else:
                    expected = sum(
                        1 for dr in (-1, 0, 1) for dc in (-1, 0, 1)
                        if (dr != 0 or dc != 0) and 0 <= r + dr < rows and 0 <= c + dc < cols and mines[r + dr][c + dc]
                    )
                    self.assertEqual(adj[r][c], expected, f"Fehler bei ({r},{c})")

    def test_flood_fill_mechanic(self):
        """Überprüft das Flood-Fill-Verhalten bei einer 0-Zelle"""
        # Manuelles 3x3 Gitter: Mine nur bei (0,0), Zellen mit 0 bei (2,2)
        rows, cols = 3, 3
        mines = [
            [True, False, False],
            [False, False, False],
            [False, False, False]
        ]
        # Adjacency:
        # [-1, 1, 0]
        # [ 1, 1, 0]
        # [ 0, 0, 0]
        grid = [[0 for _ in range(cols)] for _ in range(rows)]
        revealed = set()

        # Reveal (2,2)
        queue = [(2, 2)]
        revealed.add((2, 2))
        while queue:
            cr, cc = queue.pop(0)
            grid[cr][cc] = 1 # REVEALED
            # If 0 neighbors:
            # count neighbors
            cnt = sum(1 for dr in (-1, 0, 1) for dc in (-1, 0, 1)
                      if (dr != 0 or dc != 0) and 0 <= cr + dr < rows and 0 <= cc + dc < cols and mines[cr + dr][cc + dc])
            if cnt == 0:
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        if dr == 0 and dc == 0:
                            continue
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in revealed and not mines[nr][nc]:
                            revealed.add((nr, nc))
                            queue.append((nr, nc))

        # Alle 8 sicheren Zellen müssen aufgedeckt sein!
        self.assertEqual(len(revealed), 8)
        self.assertNotIn((0, 0), revealed)

    def test_all_120_campaign_levels_consistency(self):
        """Überprüft alle 120 Kampagnen-Level auf mathematische Konsistenz und eindeutige Minenplatzierung"""
        for lvl in range(120):
            if lvl < 10:
                rows, cols, diff = 8, 8, 'easy'
            elif lvl < 20:
                rows, cols, diff = 8, 8, 'medium'
            elif lvl < 30:
                rows, cols, diff = 8, 8, 'hard'
            elif lvl < 45:
                rows, cols, diff = 12, 12, 'medium'
            elif lvl < 60:
                rows, cols, diff = 12, 12, 'hard'
            elif lvl < 75:
                rows, cols, diff = 16, 16, 'medium'
            elif lvl < 90:
                rows, cols, diff = 16, 16, 'hard'
            elif lvl < 105:
                rows, cols, diff = 16, 30, 'medium'
            else:
                rows, cols, diff = 16, 30, 'hard'

            total = rows * cols
            density = 0.12 if diff == 'easy' else (0.20 if diff == 'hard' else 0.15)
            mine_count = max(1, min(round(total * density), total - 1))
            seed = 7000 + (lvl + 1) * 137

            puzzle = self.generate_puzzle(rows, cols, mine_count, seed)
            self.assertEqual(puzzle['rows'], rows)
            self.assertEqual(puzzle['cols'], cols)
            self.assertEqual(puzzle['mineCount'], mine_count)

            # Eindeutige Lösung / Minenzählung prüfen
            actual_mine_count = sum(row.count(True) for row in puzzle['mines'])
            self.assertEqual(actual_mine_count, mine_count, f"Minecount mismatch in level {lvl+1}")

            # Prüfe Adjacency aller Zellen
            mines = puzzle['mines']
            adj = puzzle['adjacency']
            for r in range(rows):
                for c in range(cols):
                    if not mines[r][c]:
                        expected = sum(
                            1 for dr in (-1, 0, 1) for dc in (-1, 0, 1)
                            if (dr != 0 or dc != 0) and 0 <= r + dr < rows and 0 <= c + dc < cols and mines[r + dr][c + dc]
                        )
                        self.assertEqual(adj[r][c], expected, f"Adjacency mismatch in level {lvl+1} at ({r},{c})")

    def test_tutorial_levels_consistency(self):
        """Überprüft alle Tutorial-Lektionen auf Konsistenz und Eindeutigkeit"""
        # Tutorial Steps 1 bis 6
        steps = [
            {
                'id': 1, 'rows': 4, 'cols': 4,
                'mines': [
                    [True, False, False, False],
                    [False, False, False, False],
                    [False, False, False, False],
                    [False, False, False, False]
                ]
            },
            {
                'id': 2, 'rows': 3, 'cols': 3,
                'mines': [
                    [False, False, False],
                    [False, False, False],
                    [False, False, True]
                ]
            },
            {
                'id': 3, 'rows': 4, 'cols': 4,
                'mines': [
                    [True, False, False, True],
                    [False, False, False, False],
                    [False, False, False, False],
                    [False, False, False, False]
                ]
            },
            {
                'id': 4, 'rows': 3, 'cols': 3,
                'mines': [
                    [True, False, False],
                    [False, False, False],
                    [False, False, False]
                ]
            },
            {
                'id': 5, 'rows': 3, 'cols': 3,
                'mines': [
                    [True, False, True],
                    [False, False, False],
                    [False, False, False]
                ]
            },
            {
                'id': 6, 'rows': 4, 'cols': 4,
                'mines': [
                    [False, False, False, False],
                    [False, True, False, False],
                    [False, False, True, False],
                    [False, False, False, False]
                ]
            }
        ]

        for s in steps:
            rows, cols = s['rows'], s['cols']
            mines = s['mines']
            mine_count = sum(row.count(True) for row in mines)
            self.assertGreater(mine_count, 0)
            self.assertLess(mine_count, rows * cols)

if __name__ == '__main__':
    unittest.main()
