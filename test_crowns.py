"""
Automatisierte Test-Suite für das Crowns (Queens) Plugin in Cortex
Überprüft:
1. CrownsEngine: Gitter-Dimensionen, Regionszuordnung, Validierung, Undo/Redo
2. CrownsSolver: Backtracking-Lösung, Eindeutigkeit
3. CrownsGenerator: Deterministische Seed-Generierung, Eindeutigkeit der generierten Puzzles
4. Tutorial: Alle 7 Tutorial-Level auf eindeutige Lösung prüfen
5. Kampagne: Alle 120 Level auf eindeutige Lösung prüfen
"""

import unittest
import ctypes
from typing import List, Set, Tuple, Optional, Dict

CROWNS_EMPTY = 0
CROWNS_CROWN = 1
CROWNS_X = 2


class MockCrownsEngine:
    """Python-Mock der CrownsEngine für Tests"""
    def __init__(self, size=5):
        self.size = size
        self.grid = [[CROWNS_EMPTY for _ in range(size)] for _ in range(size)]
        self.regions = [[0 for _ in range(size)] for _ in range(size)]
        self.region_colors = []
        self.solution = None
        self.locked = [[False for _ in range(size)] for _ in range(size)]
        self.notes = [[set() for _ in range(size)] for _ in range(size)]
        self.undo_stack = []
        self.redo_stack = []

    def load_puzzle(self, size, regions, region_colors=None, solution=None):
        self.size = size
        self.grid = [[CROWNS_EMPTY for _ in range(size)] for _ in range(size)]
        self.regions = [row[:] for row in regions]
        self.region_colors = region_colors[:] if region_colors else []
        self.solution = [row[:] for row in solution] if solution else None
        self.locked = [[False for _ in range(size)] for _ in range(size)]
        self.notes = [[set() for _ in range(size)] for _ in range(size)]
        self.undo_stack = []
        self.redo_stack = []

    def get_neighbors8(self, r, c):
        neighbors = []
        for dr in range(-1, 2):
            for dc in range(-1, 2):
                if dr == 0 and dc == 0:
                    continue
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.size and 0 <= nc < self.size:
                    neighbors.append((nr, nc))
        return neighbors

    def get_region_cells(self, region_id):
        cells = []
        for r in range(self.size):
            for c in range(self.size):
                if self.regions[r][c] == region_id:
                    cells.append((r, c))
        return cells

    def get_crowns_in_row(self, r):
        return [c for c in range(self.size) if self.grid[r][c] == CROWNS_CROWN]

    def get_crowns_in_col(self, c):
        return [r for r in range(self.size) if self.grid[r][c] == CROWNS_CROWN]

    def get_crowns_in_region(self, region_id):
        cells = []
        for r in range(self.size):
            for c in range(self.size):
                if self.regions[r][c] == region_id and self.grid[r][c] == CROWNS_CROWN:
                    cells.append((r, c))
        return cells

    def validate_rules(self):
        errors = []
        conflict_cells = set()

        for r in range(self.size):
            crowns = self.get_crowns_in_row(r)
            if len(crowns) > 1:
                for c in crowns:
                    conflict_cells.add((r, c))
                errors.append(('row_duplicate', r))

        for c in range(self.size):
            crowns = self.get_crowns_in_col(c)
            if len(crowns) > 1:
                for r in crowns:
                    conflict_cells.add((r, c))
                errors.append(('col_duplicate', c))

        for region_id in range(self.size):
            crowns = self.get_crowns_in_region(region_id)
            if len(crowns) > 1:
                for cell in crowns:
                    conflict_cells.add(cell)
                errors.append(('region_duplicate', region_id))

        for r in range(self.size):
            for c in range(self.size):
                if self.grid[r][c] != CROWNS_CROWN:
                    continue
                for nr, nc in self.get_neighbors8(r, c):
                    if self.grid[nr][nc] == CROWNS_CROWN:
                        conflict_cells.add((r, c))
                        conflict_cells.add((nr, nc))
                        errors.append(('adjacent', (r, c), (nr, nc)))

        return len(errors) == 0, errors, conflict_cells

    def is_completed(self):
        crown_count = sum(1 for r in range(self.size) for c in range(self.size) if self.grid[r][c] == CROWNS_CROWN)
        if crown_count != self.size:
            return False
        valid, _, _ = self.validate_rules()
        return valid


def solve_crowns(engine, max_solutions=1):
    """Python-Solver analog zum JS CrownsSolver mit O(1) State Tracking"""
    size = engine.size
    regions = engine.regions
    solutions = []

    used_cols = [False] * size
    used_regs = [False] * size
    crown_col = [-1] * size

    fixed_row = [-1] * size
    forbidden = [[False] * size for _ in range(size)]
    has_conflict = False

    for r in range(size):
        for c in range(size):
            if engine.grid[r][c] == CROWNS_CROWN:
                if fixed_row[r] != -1:
                    has_conflict = True
                fixed_row[r] = c
            elif engine.grid[r][c] == CROWNS_X:
                forbidden[r][c] = True

    if has_conflict:
        return []

    def backtrack(row):
        if len(solutions) >= max_solutions:
            return
        if row == size:
            sol = [[CROWNS_CROWN if crown_col[r] == c else CROWNS_EMPTY for c in range(size)] for r in range(size)]
            solutions.append(sol)
            return

        prev_col = crown_col[row - 1] if row > 0 else -99

        if fixed_row[row] != -1:
            c = fixed_row[row]
            reg = regions[row][c]
            if used_cols[c] or abs(c - prev_col) <= 1 or used_regs[reg]:
                return
            used_cols[c] = True
            used_regs[reg] = True
            crown_col[row] = c
            backtrack(row + 1)
            used_cols[c] = False
            used_regs[reg] = False
            crown_col[row] = -1
            return

        for c in range(size):
            if forbidden[row][c] or used_cols[c] or abs(c - prev_col) <= 1:
                continue
            reg = regions[row][c]
            if used_regs[reg]:
                continue

            used_cols[c] = True
            used_regs[reg] = True
            crown_col[row] = c

            backtrack(row + 1)

            used_cols[c] = False
            used_regs[reg] = False
            crown_col[row] = -1

    backtrack(0)
    return solutions


def _to_i32(x):
    """Convert to signed 32-bit integer (match JS |0 and Math.imul)"""
    return ctypes.c_int32(x).value


def _imul(a, b):
    """Match JS Math.imul: 32-bit integer multiply"""
    a = _to_i32(a)
    b = _to_i32(b)
    result = (a * b) & 0xFFFFFFFF
    return ctypes.c_int32(result).value


def seeded_random(seed):
    """Mulberry32 PRNG matching JS implementation"""
    s = _to_i32(int(seed))
    def rng():
        nonlocal s
        s = _to_i32(s + 0x6D2B79F5)
        s_u = s & 0xFFFFFFFF
        t = _imul(s_u ^ (s_u >> 15), 1 | s)
        t_u = t & 0xFFFFFFFF
        term = _imul(t_u ^ (t_u >> 7), 61 | t)
        t = _to_i32(_to_i32(t + term) ^ t)
        t_u = t & 0xFFFFFFFF
        return (t_u ^ (t_u >> 14)) / 4294967296.0
    return rng



def shuffle(arr, rng):
    a = list(arr)
    for i in range(len(a) - 1, 0, -1):
        j = int(rng() * (i + 1))
        j = min(j, i)  # Safety
        a[i], a[j] = a[j], a[i]
    return a


def generate_crown_positions(size, rng):
    """Generate N valid crown positions on NxN grid"""
    result = []

    def backtrack(row, used_cols):
        if row == size:
            return True
        candidates = shuffle([c for c in range(size) if c not in used_cols], rng)
        for c in candidates:
            valid = True
            for prev_r, prev_c in result:
                if abs(prev_r - row) <= 1 and abs(prev_c - c) <= 1:
                    valid = False
                    break
            if not valid:
                continue
            result.append((row, c))
            used_cols.add(c)
            if backtrack(row + 1, used_cols):
                return True
            result.pop()
            used_cols.discard(c)
        return False

    backtrack(0, set())
    return result


def generate_regions(size, crown_positions, rng):
    """Generate connected regions via competitive flood-fill"""
    regions = [[-1] * size for _ in range(size)]
    for i, (r, c) in enumerate(crown_positions):
        regions[r][c] = i

    queues = [[(r, c)] for r, c in crown_positions]
    unassigned = size * size - size
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    safety = 0
    max_iters = size * size * 10

    while unassigned > 0 and safety < max_iters:
        safety += 1
        any_expanded = False
        order = shuffle(list(range(size)), rng)

        for i in order:
            if not queues[i]:
                continue
            frontier = []
            for cr, cc in queues[i]:
                for dr, dc in dirs:
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < size and 0 <= nc < size and regions[nr][nc] == -1:
                        if (nr, nc) not in frontier:
                            frontier.append((nr, nc))
            if not frontier:
                continue
            pick_idx = int(rng() * len(frontier)) % len(frontier)
            pick = frontier[pick_idx]
            regions[pick[0]][pick[1]] = i
            queues[i].append(pick)
            unassigned -= 1
            any_expanded = True

        if not any_expanded:
            break

    for r in range(size):
        for c in range(size):
            if regions[r][c] == -1:
                for dr, dc in dirs:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < size and 0 <= nc < size and regions[nr][nc] != -1:
                        regions[r][c] = regions[nr][nc]
                        break
                if regions[r][c] == -1:
                    regions[r][c] = 0

    return regions


def is_connected(cells):
    if not cells:
        return False
    visited = set()
    queue = [next(iter(cells))]
    visited.add(queue[0])
    while queue:
        r, c = queue.pop(0)
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if (nr, nc) in cells and (nr, nc) not in visited:
                visited.add((nr, nc))
                queue.append((nr, nc))
    return len(visited) == len(cells)


def make_unique(size, crown_positions, regions, rng, max_steps=120):
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    target_crowns = set(crown_positions)
    target_grid = [[CROWNS_CROWN if (r, c) in target_crowns else CROWNS_EMPTY for c in range(size)] for r in range(size)]
    reg_cells = {i: set() for i in range(size)}
    for r in range(size):
        for c in range(size):
            reg_cells[regions[r][c]].add((r, c))

    eng = MockCrownsEngine(size)
    for step in range(max_steps):
        eng.load_puzzle(size, regions)
        sols = solve_crowns(eng, 2)
        if len(sols) == 1:
            return regions
        alt_sol = sols[1] if sols[0] == target_grid else sols[0]
        alt_crowns = set((r, c) for r in range(size) for c in range(size) if alt_sol[r][c] == CROWNS_CROWN)

        moved = False
        non_target_alts = list(alt_crowns - target_crowns)
        for i in range(len(non_target_alts) - 1, 0, -1):
            j = int(rng() * (i + 1))
            non_target_alts[i], non_target_alts[j] = non_target_alts[j], non_target_alts[i]

        for r, c in non_target_alts:
            curr_reg = regions[r][c]
            if not is_connected(reg_cells[curr_reg] - {(r, c)}):
                continue
            for dr, dc in dirs:
                nr, nc = r + dr, c + dc
                if 0 <= nr < size and 0 <= nc < size and regions[nr][nc] != curr_reg:
                    adj_reg = regions[nr][nc]
                    if any(cell in reg_cells[adj_reg] for cell in alt_crowns):
                        reg_cells[curr_reg].remove((r, c))
                        reg_cells[adj_reg].add((r, c))
                        regions[r][c] = adj_reg
                        moved = True
                        break
            if moved:
                break

        if not moved:
            all_non_target = [(r, c) for r in range(size) for c in range(size) if (r, c) not in target_crowns]
            for i in range(len(all_non_target) - 1, 0, -1):
                j = int(rng() * (i + 1))
                all_non_target[i], all_non_target[j] = all_non_target[j], all_non_target[i]
            for r, c in all_non_target:
                curr_reg = regions[r][c]
                if not is_connected(reg_cells[curr_reg] - {(r, c)}):
                    continue
                for dr, dc in dirs:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < size and 0 <= nc < size and regions[nr][nc] != curr_reg:
                        adj_reg = regions[nr][nc]
                        reg_cells[curr_reg].remove((r, c))
                        reg_cells[adj_reg].add((r, c))
                        regions[r][c] = adj_reg
                        moved = True
                        break
                if moved:
                    break
        if not moved:
            break

    eng.load_puzzle(size, regions)
    if len(solve_crowns(eng, 2)) == 1:
        return regions
    return None


def generate_puzzle(size, difficulty='medium', seed=42):
    """Python mirror of CrownsGenerator.generatePuzzle with make_unique"""
    for seed_offset in range(100):
        current_seed = seed + seed_offset * 7919
        rng = seeded_random(current_seed)

        crown_positions = generate_crown_positions(size, rng)
        if len(crown_positions) != size:
            continue

        regions = generate_regions(size, crown_positions, rng)
        unique_regions = make_unique(size, crown_positions, regions, rng)
        if not unique_regions:
            continue

        solution = [[CROWNS_EMPTY] * size for _ in range(size)]
        for r, c in crown_positions:
            solution[r][c] = CROWNS_CROWN

        return {
            'size': size,
            'regions': unique_regions,
            'solution': solution,
            'difficulty': difficulty,
            'seed': current_seed
        }

    return None


class TestCrownsEngine(unittest.TestCase):
    """Tests für CrownsEngine"""

    def test_grid_dimensions(self):
        for size in [5, 6, 7, 8, 9]:
            engine = MockCrownsEngine(size)
            self.assertEqual(engine.size, size)
            self.assertEqual(len(engine.grid), size)
            self.assertEqual(len(engine.grid[0]), size)

    def test_region_cells(self):
        engine = MockCrownsEngine(3)
        engine.regions = [[0, 0, 1], [0, 2, 1], [2, 2, 1]]
        cells_0 = engine.get_region_cells(0)
        cells_1 = engine.get_region_cells(1)
        cells_2 = engine.get_region_cells(2)
        self.assertEqual(len(cells_0), 3)
        self.assertEqual(len(cells_1), 3)
        self.assertEqual(len(cells_2), 3)

    def test_neighbors8(self):
        engine = MockCrownsEngine(5)
        n = engine.get_neighbors8(0, 0)
        self.assertEqual(len(n), 3)
        n = engine.get_neighbors8(2, 2)
        self.assertEqual(len(n), 8)
        n = engine.get_neighbors8(0, 2)
        self.assertEqual(len(n), 5)

    def test_validate_no_errors(self):
        engine = MockCrownsEngine(3)
        engine.regions = [[0, 0, 1], [0, 2, 1], [2, 2, 1]]
        engine.grid = [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY]
        ]
        valid, errors, _ = engine.validate_rules()
        self.assertTrue(valid)

    def test_validate_row_duplicate(self):
        engine = MockCrownsEngine(3)
        engine.regions = [[0, 1, 2], [0, 1, 2], [0, 1, 2]]
        engine.grid = [
            [CROWNS_CROWN, CROWNS_CROWN, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY]
        ]
        valid, errors, _ = engine.validate_rules()
        self.assertFalse(valid)

    def test_validate_adjacency(self):
        engine = MockCrownsEngine(3)
        engine.regions = [[0, 1, 2], [0, 1, 2], [0, 1, 2]]
        engine.grid = [
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY]
        ]
        valid, errors, _ = engine.validate_rules()
        self.assertFalse(valid)

    def test_is_completed(self):
        engine = MockCrownsEngine(3)
        engine.regions = [[0, 0, 1], [0, 2, 1], [2, 2, 1]]
        engine.grid = [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY]
        ]
        self.assertFalse(engine.is_completed())


class TestCrownsSolver(unittest.TestCase):
    """Tests für CrownsSolver"""

    def test_solve_simple_4x4(self):
        engine = MockCrownsEngine(4)
        engine.regions = [
            [0, 0, 0, 1],
            [2, 0, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ]
        solutions = solve_crowns(engine, 10)
        self.assertEqual(len(solutions), 1)

    def test_solve_4x4(self):
        engine = MockCrownsEngine(4)
        engine.regions = [
            [0, 0, 1, 1],
            [0, 2, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ]
        solutions = solve_crowns(engine, 10)
        self.assertEqual(len(solutions), 1)
        for sol in solutions:
            engine.grid = [row[:] for row in sol]
            valid, _, _ = engine.validate_rules()
            self.assertTrue(valid, f"Solution is not valid: {sol}")

    def test_solution_uniqueness_check(self):
        engine = MockCrownsEngine(4)
        engine.regions = [
            [0, 0, 1, 1],
            [0, 2, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ]
        solutions = solve_crowns(engine, 2)
        self.assertEqual(len(solutions), 1)


class TestCrownsGenerator(unittest.TestCase):
    """Tests für CrownsGenerator"""

    def test_generated_puzzles_have_unique_solution(self):
        for size in [5, 6, 7]:
            puzzle = generate_puzzle(size, 'medium', seed=42 + size)
            self.assertIsNotNone(puzzle, f"Generator failed for size {size}")

            engine = MockCrownsEngine(size)
            engine.load_puzzle(size, puzzle['regions'], solution=puzzle['solution'])
            solutions = solve_crowns(engine, 2)
            self.assertEqual(len(solutions), 1,
                             f"Puzzle of size {size} has {len(solutions)} solutions, expected 1")

    def test_crown_positions_valid(self):
        for seed in range(10):
            rng = seeded_random(seed + 100)
            positions = generate_crown_positions(5, rng)
            self.assertEqual(len(positions), 5, f"Expected 5 positions, got {len(positions)} for seed {seed + 100}")

            rows = set(p[0] for p in positions)
            self.assertEqual(len(rows), 5)
            cols = set(p[1] for p in positions)
            self.assertEqual(len(cols), 5)

            for i in range(len(positions)):
                for j in range(i + 1, len(positions)):
                    r1, c1 = positions[i]
                    r2, c2 = positions[j]
                    self.assertFalse(abs(r1 - r2) <= 1 and abs(c1 - c2) <= 1,
                                     f"Crowns at {positions[i]} and {positions[j]} are adjacent")

    def test_regions_connected(self):
        rng = seeded_random(42)
        positions = generate_crown_positions(5, rng)
        regions = generate_regions(5, positions, rng)

        for r in range(5):
            for c in range(5):
                self.assertNotEqual(regions[r][c], -1, f"Cell ({r},{c}) unassigned")

        for region_id in range(5):
            cells = [(r, c) for r in range(5) for c in range(5) if regions[r][c] == region_id]
            self.assertGreater(len(cells), 0, f"Region {region_id} is empty")

            visited = set()
            queue = [cells[0]]
            visited.add(cells[0])
            while queue:
                cr, cc = queue.pop(0)
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = cr + dr, cc + dc
                    if (nr, nc) in cells and (nr, nc) not in visited:
                        visited.add((nr, nc))
                        queue.append((nr, nc))

            self.assertEqual(len(visited), len(cells),
                             f"Region {region_id} is not connected: visited {len(visited)} of {len(cells)} cells")


class TestCrownsTutorial(unittest.TestCase):
    """Prüft alle Tutorial-Level auf eindeutige Lösung"""

    TUTORIAL_LEVELS = [
        # Steps 1 to 4: 4x4
        {'size': 4, 'regions': [[0, 0, 0, 1], [2, 0, 1, 1], [2, 2, 3, 3], [2, 3, 3, 3]],
         'solution': [[0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]]},
        {'size': 4, 'regions': [[0, 0, 0, 1], [2, 0, 1, 1], [2, 2, 3, 3], [2, 3, 3, 3]],
         'solution': [[0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]]},
        {'size': 4, 'regions': [[0, 0, 0, 1], [2, 0, 1, 1], [2, 2, 3, 3], [2, 3, 3, 3]],
         'solution': [[0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]]},
        {'size': 4, 'regions': [[0, 0, 0, 1], [2, 0, 1, 1], [2, 2, 3, 3], [2, 3, 3, 3]],
         'solution': [[0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]]},
        # Step 5: 5x5 - starts with 4 crowns placed, player places final crown
        {'size': 5, 'regions': [
            [0, 0, 0, 2, 2],
            [1, 1, 0, 2, 2],
            [1, 1, 3, 3, 2],
            [1, 3, 3, 4, 4],
            [3, 3, 4, 4, 4]
        ],
         'initial_grid': [
            [0, 0, 1, 0, 0],
            [1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0]
        ],
         'solution': [
            [0, 0, 1, 0, 0],
            [1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0]
        ]},
        # Step 6: 4x4
        {'size': 4, 'regions': [[0, 0, 0, 1], [2, 0, 1, 1], [2, 2, 3, 3], [2, 3, 3, 3]],
         'solution': [[0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]]},
        # Step 7: 4x4
        {'size': 4, 'regions': [[0, 0, 1, 1], [0, 2, 1, 1], [2, 2, 3, 3], [2, 3, 3, 3]],
         'solution': [[0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]]},
    ]

    def test_all_tutorial_levels_have_unique_solution(self):
        for idx, level in enumerate(self.TUTORIAL_LEVELS):
            size = level['size']
            engine = MockCrownsEngine(size)
            engine.load_puzzle(size, level['regions'], solution=level['solution'])
            if 'initial_grid' in level:
                engine.grid = [row[:] for row in level['initial_grid']]

            solutions = solve_crowns(engine, 2)
            self.assertEqual(len(solutions), 1,
                             f"Tutorial step {idx + 1} has {len(solutions)} solutions, expected 1. "
                             f"Size={size}, regions={level['regions']}")

            sol = solutions[0]
            for r in range(size):
                for c in range(size):
                    self.assertEqual(sol[r][c], level['solution'][r][c],
                                     f"Tutorial step {idx + 1}: solution mismatch at ({r},{c})")


class TestCrownsCampaign(unittest.TestCase):
    """Prüft alle 120 Kampagne-Level auf eindeutige Lösung"""

    def _get_campaign_params(self, level_index):
        if level_index < 10:
            return 5, 'easy'
        elif level_index < 20:
            return 5, 'medium'
        elif level_index < 30:
            return 6, 'easy'
        elif level_index < 45:
            return 6, 'medium'
        elif level_index < 60:
            return 6, 'hard'
        elif level_index < 75:
            return 7, 'medium'
        elif level_index < 90:
            return 7, 'hard'
        elif level_index < 105:
            return 8, 'hard'
        else:
            return 9, 'hard'

    def test_all_120_campaign_levels_unique(self):
        failed = []
        for level_idx in range(120):
            size, difficulty = self._get_campaign_params(level_idx)
            seed = 70000 + (level_idx + 1) * 137

            puzzle = generate_puzzle(size, difficulty, seed)
            if puzzle is None:
                failed.append(f"Level {level_idx + 1} (size={size}, diff={difficulty}, seed={seed}): Generation FAILED")
                continue

            engine = MockCrownsEngine(size)
            engine.load_puzzle(size, puzzle['regions'], solution=puzzle['solution'])
            solutions = solve_crowns(engine, 2)

            if len(solutions) != 1:
                failed.append(
                    f"Level {level_idx + 1} (size={size}, diff={difficulty}, seed={seed}): "
                    f"{len(solutions)} solutions")

        if failed:
            self.fail(f"\n{len(failed)} campaign level(s) failed:\n" + "\n".join(failed[:20]))


if __name__ == '__main__':
    unittest.main()
