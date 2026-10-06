"""
Ultra-Fast Bitmask Sudoku Level Verifier (4x4, 9x9, 16x16 Hexadezimal)
Überprüft ALLE 240 Kampagnen-Level, alle Tutorial-Lektionen und Tagesrätsel
auf Regelkonformität, Lösbarkeit und strikte EINDEUTIGKEIT (genau 1 Lösung).
"""

import sys
from typing import List, Tuple

class BitmaskSudokuSolver:
    def __init__(self, size=9):
        self.size = size
        if size == 4:
            self.box_w, self.box_h = 2, 2
        elif size == 16:
            self.box_w, self.box_h = 4, 4
        else:
            self.box_w, self.box_h = 3, 3
        self.full_mask = (1 << (size + 1)) - 2

    def validate_initial_grid(self, grid: List[List[int]]) -> bool:
        s = self.size
        row_m = [0] * s
        col_m = [0] * s
        box_m = [0] * s
        for r in range(s):
            for c in range(s):
                v = grid[r][c]
                if v != 0:
                    bit = 1 << v
                    b = (r // self.box_h) * self.box_w + (c // self.box_w)
                    if (row_m[r] & bit) or (col_m[c] & bit) or (box_m[b] & bit):
                        return False
                    row_m[r] |= bit
                    col_m[c] |= bit
                    box_m[b] |= bit
        return True

    def count_solutions(self, grid: List[List[int]], max_solutions: int = 2) -> int:
        s = self.size
        row_m = [0] * s
        col_m = [0] * s
        box_m = [0] * s
        empty = []
        for r in range(s):
            for c in range(s):
                v = grid[r][c]
                if v > 0:
                    bit = 1 << v
                    b = (r // self.box_h) * self.box_w + (c // self.box_w)
                    row_m[r] |= bit
                    col_m[c] |= bit
                    box_m[b] |= bit
                else:
                    empty.append((r, c))

        sols = 0

        def backtrack():
            nonlocal sols
            if sols >= max_solutions:
                return

            min_c = 999
            best_idx = -1
            best_avail = 0

            for i, (r, c) in enumerate(empty):
                if grid[r][c] == 0:
                    b = (r // self.box_h) * self.box_w + (c // self.box_w)
                    used = row_m[r] | col_m[c] | box_m[b]
                    avail = self.full_mask & (~used)
                    cnt = avail.bit_count()
                    if cnt == 0:
                        return
                    if cnt < min_c:
                        min_c = cnt
                        best_idx = i
                        best_avail = avail
                        if min_c == 1:
                            break

            if best_idx == -1:
                sols += 1
                return

            r, c = empty[best_idx]
            b = (r // self.box_h) * self.box_w + (c // self.box_w)
            avail = best_avail

            while avail > 0:
                lsb = avail & -avail
                val = lsb.bit_length() - 1
                grid[r][c] = val
                row_m[r] |= lsb
                col_m[c] |= lsb
                box_m[b] |= lsb

                backtrack()

                row_m[r] &= ~lsb
                col_m[c] &= ~lsb
                box_m[b] &= ~lsb
                grid[r][c] = 0
                avail &= ~lsb

                if sols >= max_solutions:
                    return

        backtrack()
        return sols


class SeededRNG:
    def __init__(self, seed):
        self.seed = seed % 2147483647
        if self.seed <= 0:
            self.seed += 2147483646

    def next(self):
        self.seed = (self.seed * 16807) % 2147483647
        return (self.seed - 1) / 2147483646

    def shuffle(self, lst):
        for i in range(len(lst) - 1, 0, -1):
            j = int(self.next() * (i + 1))
            lst[i], lst[j] = lst[j], lst[i]
        return lst


class SudokuGenerator:
    @staticmethod
    def generate(size, difficulty, seed=12345):
        rng = SeededRNG(seed)
        solver = BitmaskSudokuSolver(size)
        box_h = 2 if size == 4 else (4 if size == 16 else 3)
        box_w = 2 if size == 4 else (4 if size == 16 else 3)

        # 1. Erzeuge kanonisches Shift-Gitter
        grid = [[0 for _ in range(size)] for _ in range(size)]
        for r in range(size):
            for c in range(size):
                grid[r][c] = ((r % box_h) * box_w + (r // box_h) + c) % size + 1

        # Ziffern permutieren
        digits = list(range(1, size + 1))
        rng.shuffle(digits)
        for r in range(size):
            for c in range(size):
                grid[r][c] = digits[grid[r][c] - 1]

        # Zeilen innerhalb von Blöcken tauschen
        for b in range(0, size, box_h):
            for i in range(box_h):
                swap_with = b + int(rng.next() * box_h)
                cur_row = b + i
                grid[cur_row], grid[swap_with] = grid[swap_with], grid[cur_row]

        # Spalten innerhalb von Blöcken tauschen
        for b in range(0, size, box_w):
            for i in range(box_w):
                swap_with = b + int(rng.next() * box_w)
                cur_col = b + i
                for r in range(size):
                    grid[r][cur_col], grid[r][swap_with] = grid[r][swap_with], grid[r][cur_col]

        solution = [row[:] for row in grid]

        # 2. Clue targets nach Größe & Schwierigkeit
        clue_targets = {
            4: {'easy': 8, 'medium': 6, 'hard': 5},
            9: {'easy': 36, 'medium': 30, 'hard': 25},
            16: {'easy': 140, 'medium': 120, 'hard': 110}
        }
        target_clues = clue_targets[size][difficulty]

        # 3. Paarweise symmetrische Positionen (180° Rotationssymmetrie)
        pairs = []
        for r in range(size):
            for c in range(size):
                sym_r = size - 1 - r
                sym_c = size - 1 - c
                if (r < sym_r) or (r == sym_r and c <= sym_c):
                    pairs.append(((r, c), (sym_r, sym_c)))
        rng.shuffle(pairs)

        clues_left = size * size
        for p1, p2 in pairs:
            if clues_left <= target_clues:
                break
            v1, v2 = grid[p1[0]][p1[1]], grid[p2[0]][p2[1]]
            if v1 == 0:
                continue

            grid[p1[0]][p1[1]] = 0
            grid[p2[0]][p2[1]] = 0
            
            # Prüfe Eindeutigkeit
            if solver.count_solutions(grid, max_solutions=2) == 1:
                clues_left -= (1 if p1 == p2 else 2)
            else:
                grid[p1[0]][p1[1]] = v1
                grid[p2[0]][p2[1]] = v2

        return grid, solution


def verify_all():
    print("=" * 70, flush=True)
    print("VOLLSTÄNDIGE PRÜFUNG ALLER SUDOKU-LEVEL (4x4, 9x9, 16x16 Hexadezimal)", flush=True)
    print("=" * 70, flush=True)

    from js_tutorial_steps import TUTORIAL_STEPS, TUTORIAL_ADVANCED_STEPS

    # 1. Tutorial Grundlagen (10 Lektionen)
    print("\n--- 1. Grundlagen-Tutorial (10 Lektionen) ---", flush=True)
    tut_errors = []
    for step in TUTORIAL_STEPS:
        size = step["size"]
        solver = BitmaskSudokuSolver(size)
        grid = step["initialGrid"]
        
        if not solver.validate_initial_grid(grid):
            tut_errors.append(f"Tutorial {step['id']} ({step['title']}): Initiale Regeln verletzt!")
            continue

        sol_count = solver.count_solutions(grid, max_solutions=2)
        if sol_count == 1:
            print(f"  [PASS] Lektion {step['id']}: {step['title']} -> Eindeutig lösbar (1 Lösung)", flush=True)
        elif sol_count == 0:
            tut_errors.append(f"Tutorial {step['id']} ({step['title']}): KEINE Lösung gefunden!")
        else:
            tut_errors.append(f"Tutorial {step['id']} ({step['title']}): Mehrdeutige Lösung ({sol_count} Lösungen)!")

    # 2. Fortgeschrittenen-Tutorial (8 Lektionen)
    print("\n--- 2. Fortgeschrittenen-Tutorial (8 Lektionen) ---", flush=True)
    for step in TUTORIAL_ADVANCED_STEPS:
        size = step["size"]
        solver = BitmaskSudokuSolver(size)
        grid = step["initialGrid"]

        if not solver.validate_initial_grid(grid):
            tut_errors.append(f"Tutorial Pro {step['id']} ({step['title']}): Initiale Regeln verletzt!")
            continue

        sol_count = solver.count_solutions(grid, max_solutions=2)
        if sol_count == 1:
            print(f"  [PASS] Lektion {step['id']}: {step['title']} -> Eindeutig lösbar (1 Lösung)", flush=True)
        elif sol_count == 0:
            tut_errors.append(f"Tutorial Pro {step['id']} ({step['title']}): KEINE Lösung gefunden!")
        else:
            tut_errors.append(f"Tutorial Pro {step['id']} ({step['title']}): Mehrdeutige Lösung ({sol_count} Lösungen)!")

    # 3. Kampagne: Alle 240 Level
    print("\n--- 3. Kampagne: Alle 240 Level ---", flush=True)
    campaign_errors = []
    
    for level_idx in range(240):
        if level_idx < 25:
            size, difficulty = 4, 'easy'
        elif level_idx < 45:
            size, difficulty = 4, 'medium'
        elif level_idx < 60:
            size, difficulty = 4, 'hard'
        elif level_idx < 90:
            size, difficulty = 9, 'easy'
        elif level_idx < 120:
            size, difficulty = 9, 'medium'
        elif level_idx < 150:
            size, difficulty = 9, 'medium'
        elif level_idx < 180:
            size, difficulty = 9, 'hard'
        elif level_idx < 210:
            size, difficulty = 9, 'hard'
        else:
            size = 16
            difficulty = 'easy' if level_idx < 222 else ('medium' if level_idx < 232 else 'hard')

        seed = 9000 + (level_idx + 1) * 137
        grid, solution = SudokuGenerator.generate(size, difficulty, seed)
        solver = BitmaskSudokuSolver(size)

        if not solver.validate_initial_grid(grid):
            campaign_errors.append(f"Level {level_idx + 1}: Initiale Regeln verletzt!")
            continue

        sol_count = solver.count_solutions(grid, max_solutions=2)
        if sol_count != 1:
            campaign_errors.append(f"Level {level_idx + 1} ({size}x{size} {difficulty}): {sol_count} Lösungen!")
        else:
            clues = sum(1 for r in range(size) for c in range(size) if grid[r][c] != 0)
            if (level_idx + 1) % 30 == 0 or level_idx == 0 or level_idx >= 210:
                print(f"  [PASS] Level {level_idx + 1:3d} ({size:2d}×{size:2d} {difficulty:6s}, {clues:3d} Vorgaben) -> Eindeutig lösbar", flush=True)

    # 4. Tagesrätsel für 30 Tage
    print("\n--- 4. Tagesrätsel-Generierung (30 Tage Testreihe) ---", flush=True)
    daily_errors = []
    import datetime
    start_date = datetime.date(2026, 8, 1)
    for day in range(30):
        cur_date = start_date + datetime.timedelta(days=day)
        date_str = cur_date.strftime("%Y-%m-%d")
        seed = int(date_str.replace("-", "")) + 777
        is_weekend = (cur_date.weekday() in (5, 6))
        size = 16 if is_weekend else 9
        difficulty = 'medium' if is_weekend else 'hard'

        grid, solution = SudokuGenerator.generate(size, difficulty, seed)
        solver = BitmaskSudokuSolver(size)

        sol_count = solver.count_solutions(grid, max_solutions=2)
        if sol_count != 1:
            daily_errors.append(f"Tagesrätsel {date_str} ({size}x{size} {difficulty}): {sol_count} Lösungen!")

    if not daily_errors:
        print("  [PASS] Alle 30 Tagesrätsel sind 100% eindeutig lösbar!", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("ZUSAMMENFASSUNG", flush=True)
    print("=" * 70, flush=True)
    all_errors = tut_errors + campaign_errors + daily_errors
    if all_errors:
        print(f"FEHLER GEFUNDEN ({len(all_errors)}):", flush=True)
        for err in all_errors:
            print("  [ERROR]", err, flush=True)
        sys.exit(1)
    else:
        print("[ERFOLG] ALLE 240 Kampagnen-Level, ALLE 18 Tutorial-Lektionen", flush=True)
        print("und alle Tagesrätsel sind fehlerfrei und strikt EINDEUTIG lösbar!", flush=True)
        sys.exit(0)

if __name__ == "__main__":
    verify_all()
