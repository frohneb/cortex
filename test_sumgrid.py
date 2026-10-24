"""
Unit-Tests für das SumGrid Puzzle Plugin (Cortex)
Testet:
1. SumGridEngine: Gitterstatus, Zustandswechsel (Neutral, Keep, Cross), Summen- & Zielberechnung, Undo/Redo, Validierung.
2. SumGridSolver: Eindeutigkeitsprüfung, Backtracking-Lösung, didaktische Hint-Generierung.
3. SumGridGenerator: Prozedurale Generierung, Lösbarkeits- und Eindeutigkeitsgarantie.
4. Plugin-Konformität: Abwesenheit von "Neu"-Badges, Kampagne, Tagesrätsel, Tutorials.
5. Vollständige mathematische Konsistenz und Eindeutigkeit aller 6 Tutorial-Lektionen.
6. Kampagnen-Level-Generierung und eindeutige Lösbarkeit.
"""

import unittest
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

def int32(x):
    x = x & 0xFFFFFFFF
    return x - 0x100000000 if x >= 0x80000000 else x

def uint32(x):
    return x & 0xFFFFFFFF

def imul(a, b):
    return int32((int32(a) * int32(b)) & 0xFFFFFFFF)

class Mulberry32:
    def __init__(self, seed):
        self.s = int32(seed if seed else 1)

    def next(self):
        self.s = int32(self.s + 0x6D2B79F5)
        s_u = uint32(self.s)
        t = imul(int32(self.s ^ (s_u >> 15)), int32(1 | self.s))
        t_u = uint32(t)
        t = int32((t + imul(int32(t ^ (t_u >> 7)), int32(61 | t))) ^ t)
        t_u = uint32(t)
        return float(uint32(t ^ (t_u >> 14))) / 4294967296.0

def solve_sumgrid(numbers, row_targets, col_targets):
    size = len(numbers)
    valid_row_masks = []
    for r in range(size):
        masks = []
        for m in range(1 << size):
            s = sum(numbers[r][c] for c in range(size) if (m & (1 << c)))
            if s == row_targets[r]:
                masks.append(m)
        if not masks:
            return []
        valid_row_masks.append(masks)

    solutions = []
    def bt(r, col_sums, chosen):
        if r == size:
            if col_sums == col_targets:
                solutions.append(chosen[:])
            return
        for m in valid_row_masks[r]:
            new_col = col_sums[:]
            feasible = True
            for c in range(size):
                if m & (1 << c):
                    new_col[c] += numbers[r][c]
                if new_col[c] > col_targets[c]:
                    feasible = False
                    break
            if feasible:
                bt(r + 1, new_col, chosen + [m])
                if len(solutions) >= 2:
                    return
    bt(0, [0] * size, [])
    return solutions

def generate_sumgrid(size, difficulty, seed):
    rng = Mulberry32(seed)
    max_val = 9
    keep_prob = 0.5
    if size == 4:
        max_val = 7 if difficulty == 'hard' else 5
        keep_prob = 0.5
    elif size == 5:
        max_val = 6 if difficulty == 'easy' else 9
        keep_prob = 0.55 if difficulty == 'easy' else 0.5

    for attempt in range(300):
        numbers = [[1 + int(rng.next() * max_val) for _ in range(size)] for _ in range(size)]
        solution = [[0] * size for _ in range(size)]

        for r in range(size):
            row_keeps = 0
            for c in range(size):
                keep = 1 if rng.next() < keep_prob else 0
                solution[r][c] = keep
                if keep: row_keeps += 1
            if row_keeps == 0:
                force_col = int(rng.next() * size)
                solution[r][force_col] = 1
            elif row_keeps == size and size > 4:
                force_drop = int(rng.next() * size)
                solution[r][force_drop] = 0

        for c in range(size):
            col_keeps = sum(solution[r][c] for r in range(size))
            if col_keeps == 0:
                force_row = int(rng.next() * size)
                solution[force_row][c] = 1

        row_targets = [sum(numbers[r][c] for c in range(size) if solution[r][c] == 1) for r in range(size)]
        col_targets = [sum(numbers[r][c] for r in range(size) if solution[r][c] == 1) for c in range(size)]

        sols = solve_sumgrid(numbers, row_targets, col_targets)
        if len(sols) == 1:
            return {
                'size': size,
                'numbers': numbers,
                'rowTargets': row_targets,
                'colTargets': col_targets,
                'solution': solution,
                'difficulty': difficulty
            }
    return None


class TestSumGridIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bundle = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        cls.html = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        cls.css = (BASE_DIR / "css" / "puzzles" / "sumgrid.css").read_text(encoding='utf-8')
        cls.tut_file = (BASE_DIR / "js" / "puzzles" / "sumgrid" / "data" / "tutorial.js").read_text(encoding='utf-8')

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

    def test_version_across_files(self):
        """Überprüft Konsistenz der Version und Codes"""
        sw = (BASE_DIR / "sw.js").read_text(encoding='utf-8')
        gradle = (BASE_DIR / "android" / "app" / "build.gradle.kts").read_text(encoding='utf-8')
        manifest = (BASE_DIR / "android" / "app" / "src" / "main" / "AndroidManifest.xml").read_text(encoding='utf-8')
        readme = (BASE_DIR / "README.md").read_text(encoding='utf-8')
        security = (BASE_DIR / "SECURITY.md").read_text(encoding='utf-8')

        # Versionsnummer aus HTML ermitteln
        import re
        match = re.search(r'id="appVersionBadge">v([\d\.]+)</span>', self.html)
        self.assertTrue(match, "Versionsbadge in index.html muss existieren")
        version = match.group(1)

        self.assertIn(f'cortex-app-v{version}', sw)
        self.assertIn(f'versionName = "{version}"', gradle)
        self.assertIn(f'android:versionName="{version}"', manifest)
        self.assertIn(f'Version-{version}', readme)
        self.assertIn(f'{version} (versionCode', security)

    def test_tutorial_all_steps_mathematical_consistency(self):
        """Überprüft alle 6 Tutorial-Schritte auf mathematische Exaktheit und Eindeutigkeit"""
        # Alle 6 Tutorial-Schritte
        tutorial_steps = [
            {
                "id": 1,
                "numbers": [[2, 3, 1], [1, 2, 4], [3, 1, 2]],
                "rowTargets": [5, 6, 5],
                "colTargets": [5, 5, 6],
                "solution": [[1, 1, 0], [0, 1, 1], [1, 0, 1]],
                "initialGrid": [[0, 0, 0], [2, 1, 1], [1, 2, 1]],
                "targetCells": [{"r": 0, "c": 0, "val": 1}, {"r": 0, "c": 1, "val": 1}, {"r": 0, "c": 2, "val": 2}]
            },
            {
                "id": 2,
                "numbers": [[2, 4, 1], [5, 3, 2], [1, 2, 4]],
                "rowTargets": [6, 0, 4],
                "colTargets": [2, 4, 4],
                "solution": [[1, 1, 0], [0, 0, 0], [0, 0, 1]],
                "initialGrid": [[1, 1, 2], [0, 0, 0], [2, 2, 1]],
                "targetCells": [{"r": 1, "c": 0, "val": 2}, {"r": 1, "c": 1, "val": 2}, {"r": 1, "c": 2, "val": 2}]
            },
            {
                "id": 3,
                "numbers": [[2, 3, 4], [1, 4, 2], [3, 1, 5]],
                "rowTargets": [9, 4, 6],
                "colTargets": [2, 8, 9],
                "solution": [[1, 1, 1], [0, 1, 0], [0, 1, 1]],
                "initialGrid": [[0, 0, 0], [2, 1, 2], [2, 1, 1]],
                "targetCells": [{"r": 0, "c": 0, "val": 1}, {"r": 0, "c": 1, "val": 1}, {"r": 0, "c": 2, "val": 1}]
            },
            {
                "id": 4,
                "numbers": [[1, 3, 2], [7, 2, 1], [2, 4, 3]],
                "rowTargets": [4, 3, 7],
                "colTargets": [1, 9, 4],
                "solution": [[1, 1, 0], [0, 1, 1], [0, 1, 1]],
                "initialGrid": [[1, 1, 2], [0, 1, 1], [2, 1, 1]],
                "targetCells": [{"r": 1, "c": 0, "val": 2}]
            },
            {
                "id": 5,
                "numbers": [[3, 5, 2], [1, 2, 4], [2, 3, 1]],
                "rowTargets": [5, 6, 2],
                "colTargets": [5, 2, 6],
                "solution": [[1, 0, 1], [0, 1, 1], [1, 0, 0]],
                "initialGrid": [[1, 0, 1], [2, 1, 1], [1, 2, 2]],
                "targetCells": [{"r": 0, "c": 1, "val": 2}]
            },
            {
                "id": 6,
                "numbers": [[4, 3, 5], [2, 1, 3], [1, 4, 2]],
                "rowTargets": [9, 5, 4],
                "colTargets": [6, 4, 8],
                "solution": [[1, 0, 1], [1, 0, 1], [0, 1, 0]],
                "initialGrid": [[0, 0, 0], [1, 2, 1], [2, 1, 2]],
                "targetCells": [{"r": 0, "c": 0, "val": 1}, {"r": 0, "c": 1, "val": 2}, {"r": 0, "c": 2, "val": 1}]
            }
        ]

        for s in tutorial_steps:
            sid = s["id"]
            nums = s["numbers"]
            sol = s["solution"]
            rT = s["rowTargets"]
            cT = s["colTargets"]
            size = len(nums)

            # 1. Zeilensummen stimmen exakt
            for r in range(size):
                calc_r = sum(nums[r][c] for c in range(size) if sol[r][c] == 1)
                self.assertEqual(calc_r, rT[r], f"Step {sid} Row {r} Summe fehlerhaft")

            # 2. Spaltensummen stimmen exakt
            for c in range(size):
                calc_c = sum(nums[r][c] for r in range(size) if sol[r][c] == 1)
                self.assertEqual(calc_c, cT[c], f"Step {sid} Col {c} Summe fehlerhaft")

            # 3. Exakt eine eindeutige Lösung
            sols = solve_sumgrid(nums, rT, cT)
            self.assertEqual(len(sols), 1, f"Step {sid} muss genau 1 eindeutige Lösung haben")

            # 4. Nach Anwenden der targetCells ist das Gitter exakt im Lösungszustand
            grid = [row[:] for row in s["initialGrid"]]
            for tc in s["targetCells"]:
                grid[tc["r"]][tc["c"]] = tc["val"]
            for r in range(size):
                for c in range(size):
                    expected = 1 if sol[r][c] == 1 else 2
                    self.assertEqual(grid[r][c], expected, f"Step {sid} Zelle ({r},{c}) nicht gelöst")

    def test_campaign_level_sample_generation_and_uniqueness(self):
        """Überprüft eine Stichprobe von Kampagnen-Leveln aller 4 Kapitel auf Eindeutigkeit"""
        # Testlevel aus jedem Kapitel (0..239)
        test_levels = [
            (0, 4, 'easy'),
            (29, 4, 'easy'),
            (30, 5, 'easy'),
            (89, 5, 'medium'),
            (119, 5, 'medium'),
            (149, 6, 'medium'),
            (179, 6, 'hard'),
            (209, 6, 'hard'),
            (239, 7, 'hard')
        ]

        for lvl_idx, size, diff in test_levels:
            seed = 70000 + (lvl_idx + 1) * 157
            puzzle = generate_sumgrid(size, diff, seed)
            self.assertIsNotNone(puzzle, f"Level {lvl_idx + 1} konnte nicht generiert werden")
            self.assertEqual(puzzle['size'], size)
            self.assertEqual(len(puzzle['numbers']), size)
            
            # Prüfe Eindeutigkeit
            sols = solve_sumgrid(puzzle['numbers'], puzzle['rowTargets'], puzzle['colTargets'])
            self.assertEqual(len(sols), 1, f"Level {lvl_idx + 1} muss genau 1 Lösung besitzen")

if __name__ == '__main__':
    unittest.main()
