"""
Verifiziert die Lösbarkeit und Eindeutigkeit des heutigen Tagesrätsels (2026-08-21)
"""
import test_rules

EMPTY = 0
SUN = 1
MOON = 2
EDGE_NONE = 0
EDGE_EQUAL = 1
EDGE_OPPOSITE = 2

def seeded_random(seed):
    s = seed
    def rng():
        nonlocal s
        s = (s * 9301 + 49297) % 233280
        return s / 233280
    return rng

def generate_full_board(size, rng):
    max_per_line = size // 2
    grid = [[EMPTY] * size for _ in range(size)]

    def fill(r, c):
        if r == size:
            row_strs = set("".join(map(str, grid[i])) for i in range(size))
            if len(row_strs) != size: return False
            col_strs = set("".join(str(grid[i][j]) for i in range(size)) for j in range(size))
            if len(col_strs) != size: return False
            return True

        next_r = r if c + 1 < size else r + 1
        next_c = c + 1 if c + 1 < size else 0

        values = [SUN, MOON] if rng() > 0.5 else [MOON, SUN]
        for val in values:
            grid[r][c] = val
            valid = True
            if c >= 2 and grid[r][c-1] == val and grid[r][c-2] == val: valid = False
            if valid and r >= 2 and grid[r-1][c] == val and grid[r-2][c] == val: valid = False

            if valid:
                cnt = sum(1 for j in range(c + 1) if grid[r][j] == val)
                if cnt > max_per_line: valid = False
            if valid:
                cnt = sum(1 for i in range(r + 1) if grid[i][c] == val)
                if cnt > max_per_line: valid = False

            if valid and fill(next_r, next_c): return True
            grid[r][c] = EMPTY
        return False

    fill(0, 0)
    return grid

def generate_puzzle(size, difficulty, seed):
    rng = seeded_random(seed)
    full_solution = generate_full_board(size, rng)

    h_edges = [[EDGE_NONE] * (size - 1) for _ in range(size)]
    v_edges = [[EDGE_NONE] * size for _ in range(size - 1)]

    h_positions = [{'r': r, 'c': c, 'type': 'h'} for r in range(size) for c in range(size - 1)]
    v_positions = [{'r': r, 'c': c, 'type': 'v'} for r in range(size - 1) for c in range(size)]

    # JS Sort simulate
    # In JS: array.sort(() => rng() - 0.5)
    # We replicate simple shuffle with rng
    all_positions = h_positions + v_positions
    # Replicate JS behavior step-by-step
    h_positions_s = sorted(h_positions, key=lambda x: rng() - 0.5)
    v_positions_s = sorted(v_positions, key=lambda x: rng() - 0.5)

    max_edges = 5
    target_clues = 6

    edge_count = 0
    for pos in (h_positions_s + v_positions_s):
        if edge_count >= max_edges: break
        if pos['type'] == 'h':
            v1 = full_solution[pos['r']][pos['c']]
            v2 = full_solution[pos['r']][pos['c'] + 1]
            edge_type = EDGE_EQUAL if v1 == v2 else EDGE_OPPOSITE
            if rng() > 0.4 or edge_type == EDGE_EQUAL:
                h_edges[pos['r']][pos['c']] = edge_type
                edge_count += 1
        else:
            v1 = full_solution[pos['r']][pos['c']]
            v2 = full_solution[pos['r'] + 1][pos['c']]
            edge_type = EDGE_EQUAL if v1 == v2 else EDGE_OPPOSITE
            if rng() > 0.4 or edge_type == EDGE_EQUAL:
                v_edges[pos['r']][pos['c']] = edge_type
                edge_count += 1

    puzzle_grid = [r[:] for r in full_solution]
    cells = [{'r': r, 'c': c} for r in range(size) for c in range(size)]
    cells_s = sorted(cells, key=lambda x: rng() - 0.5)

    current_clues = size * size
    for cell in cells_s:
        if current_clues <= target_clues: break
        orig = puzzle_grid[cell['r']][cell['c']]
        puzzle_grid[cell['r']][cell['c']] = EMPTY

        # Solve check using Python TangoBoard
        board = test_rules.TangoBoard(size)
        board.grid = [r[:] for r in puzzle_grid]
        board.h_edges = [r[:] for r in h_edges]
        board.v_edges = [r[:] for r in v_edges]

        sols = test_rules.solve_tango(board)
        if len(sols) != 1:
            puzzle_grid[cell['r']][cell['c']] = orig
        else:
            current_clues -= 1

    return puzzle_grid, h_edges, v_edges, full_solution

if __name__ == '__main__':
    seed = 20260821
    print(f"Generating Daily Puzzle for seed {seed} (2026-08-21)...")
    grid, h, v, sol = generate_puzzle(6, 'medium', seed)

    board = test_rules.TangoBoard(6)
    board.grid = [r[:] for r in grid]
    board.h_edges = [r[:] for r in h]
    board.v_edges = [r[:] for r in v]

    sols = test_rules.solve_tango(board)
    print("Initial Clues count:", sum(1 for r in range(6) for c in range(6) if grid[r][c] != 0))
    print("Number of valid solutions:", len(sols))
    if len(sols) == 1:
        print("SUCCESS! Today's Daily Puzzle is 100% SOLVABLE with EXACTLY 1 UNIQUE SOLUTION!")
        print("Solution matches full board:", sols[0] == sol)
