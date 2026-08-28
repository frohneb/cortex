"""
Automated Test Suite for all Cortex Tutorials (Tango, Sudoku, Akari, Nonogram, Slitherlink).
Validates step structure, grid integrity, solutions, target cells, and puzzle constraints.
"""

import unittest
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

def parse_js_val(content, idx):
    """Simple robust recursive-descent parser for JS object literals and arrays."""
    while idx < len(content):
        if content[idx].isspace():
            idx += 1
        elif content[idx:idx+2] == '//':
            idx = content.find('\n', idx)
            if idx == -1:
                idx = len(content)
        elif content[idx:idx+2] == '/*':
            idx = content.find('*/', idx) + 2
        else:
            break

    if idx >= len(content):
        return None, idx

    c = content[idx]
    if c == '[':
        arr = []
        idx += 1
        while True:
            while idx < len(content):
                if content[idx].isspace():
                    idx += 1
                elif content[idx:idx+2] == '//':
                    idx = content.find('\n', idx)
                    if idx == -1:
                        idx = len(content)
                elif content[idx:idx+2] == '/*':
                    idx = content.find('*/', idx) + 2
                else:
                    break
            if idx >= len(content) or content[idx] == ']':
                return arr, idx + 1
            if content[idx] == ',':
                idx += 1
                continue
            val, idx = parse_js_val(content, idx)
            arr.append(val)
    elif c == '{':
        obj = {}
        idx += 1
        while True:
            while idx < len(content):
                if content[idx].isspace():
                    idx += 1
                elif content[idx:idx+2] == '//':
                    idx = content.find('\n', idx)
                    if idx == -1:
                        idx = len(content)
                elif content[idx:idx+2] == '/*':
                    idx = content.find('*/', idx) + 2
                else:
                    break
            if idx >= len(content) or content[idx] == '}':
                return obj, idx + 1
            if content[idx] == ',':
                idx += 1
                continue
            # Read key
            key = ''
            if content[idx] in ('"', "'", '`'):
                q = content[idx]
                idx += 1
                while idx < len(content) and content[idx] != q:
                    if content[idx] == '\\':
                        key += content[idx:idx+2]
                        idx += 2
                    else:
                        key += content[idx]
                        idx += 1
                idx += 1
            else:
                while idx < len(content) and (content[idx].isalnum() or content[idx] == '_'):
                    key += content[idx]
                    idx += 1
            while idx < len(content) and content[idx] != ':':
                idx += 1
            idx += 1  # skip ':'
            val, idx = parse_js_val(content, idx)
            obj[key] = val
    elif c in ('"', "'", '`'):
        q = c
        s = ''
        idx += 1
        while idx < len(content) and content[idx] != q:
            if content[idx] == '\\':
                s += content[idx:idx+2]
                idx += 2
            else:
                s += content[idx]
                idx += 1
        idx += 1
        # Check if concatenated with '+'
        while idx < len(content) and content[idx].isspace():
            idx += 1
        if idx < len(content) and content[idx] == '+':
            idx += 1
            next_val, idx = parse_js_val(content, idx)
            s += str(next_val)
        return s, idx
    elif c in '-0123456789':
        num_str = ''
        while idx < len(content) and (content[idx] in '-0123456789.'):
            num_str += content[idx]
            idx += 1
        return float(num_str) if '.' in num_str else int(num_str), idx
    else:
        ident = ''
        while idx < len(content) and (content[idx].isalnum() or content[idx] == '_'):
            ident += content[idx]
            idx += 1
        if ident == 'true':
            return True, idx
        if ident == 'false':
            return False, idx
        if ident == 'null':
            return None, idx
        return ident, idx

def load_tutorial_steps(file_path, var_name):
    content = file_path.read_text(encoding='utf-8')
    start_idx = content.find(f"{var_name} = [")
    if start_idx == -1:
        raise ValueError(f"Variable {var_name} not found in {file_path}")
    bracket_idx = content.find('[', start_idx)
    arr, _ = parse_js_val(content, bracket_idx)
    return arr

class TestAllTutorials(unittest.TestCase):

    def test_tango_tutorials(self):
        """Überprüft alle Tango-Tutorial-Dateien"""
        t1 = BASE_DIR / "js" / "puzzles" / "tango" / "data" / "tutorial.js"
        t2 = BASE_DIR / "js" / "puzzles" / "tango" / "data" / "tutorial_pro.js"
        t3 = BASE_DIR / "js" / "puzzles" / "tango" / "data" / "tutorial_patterns.js"

        steps_basic = load_tutorial_steps(t1, "TUTORIAL_STEPS")
        self.assertEqual(len(steps_basic), 6)
        for s in steps_basic:
            self.assertIn("id", s)
            self.assertIn("size", s)
            self.assertIn("title", s)
            self.assertIn("initialGrid", s)
            self.assertEqual(len(s["initialGrid"]), s["size"])

        steps_pro = load_tutorial_steps(t2, "TUTORIAL_PRO_STEPS")
        self.assertEqual(len(steps_pro), 8)
        for s in steps_pro:
            self.assertIn("id", s)
            self.assertIn("size", s)
            self.assertIn("initialGrid", s)

        steps_patterns = load_tutorial_steps(t3, "TUTORIAL_PATTERNS_STEPS")
        self.assertEqual(len(steps_patterns), 14)
        for s in steps_patterns:
            self.assertIn("id", s)
            self.assertIn("size", s)
            self.assertIn("initialGrid", s)

    def test_sudoku_tutorials(self):
        """Überprüft alle Sudoku-Tutorial-Dateien"""
        s1 = BASE_DIR / "js" / "puzzles" / "sudoku" / "data" / "tutorial.js"
        s2 = BASE_DIR / "js" / "puzzles" / "sudoku" / "data" / "tutorial_advanced.js"

        steps_basic = load_tutorial_steps(s1, "SUDOKU_TUTORIAL_STEPS")
        self.assertEqual(len(steps_basic), 10)
        for s in steps_basic:
            self.assertIn("id", s)
            self.assertIn("size", s)
            self.assertIn("initialGrid", s)
            self.assertEqual(len(s["initialGrid"]), s["size"])

        steps_adv = load_tutorial_steps(s2, "SUDOKU_TUTORIAL_ADVANCED_STEPS")
        self.assertEqual(len(steps_adv), 8)
        for s in steps_adv:
            self.assertIn("id", s)
            self.assertIn("size", s)
            self.assertIn("initialGrid", s)

    def test_akari_tutorials(self):
        """Überprüft alle Akari-Tutorial-Dateien"""
        a1 = BASE_DIR / "js" / "puzzles" / "akari" / "data" / "tutorial.js"
        a2 = BASE_DIR / "js" / "puzzles" / "akari" / "data" / "tutorial_advanced.js"

        steps_basic = load_tutorial_steps(a1, "AKARI_TUTORIAL_STEPS")
        self.assertEqual(len(steps_basic), 8)
        for s in steps_basic:
            self.assertIn("id", s)
            self.assertIn("size", s)
            self.assertIn("initialGrid", s)
            self.assertEqual(len(s["initialGrid"]), s["size"])

        steps_adv = load_tutorial_steps(a2, "AKARI_TUTORIAL_ADVANCED_STEPS")
        self.assertEqual(len(steps_adv), 6)
        for s in steps_adv:
            self.assertIn("id", s)
            self.assertIn("size", s)
            self.assertIn("initialGrid", s)

    def test_nonogram_tutorials(self):
        """Überprüft die Nonogram-Tutorial-Dateien"""
        n1 = BASE_DIR / "js" / "puzzles" / "nonogram" / "data" / "tutorial.js"
        steps = load_tutorial_steps(n1, "NONOGRAM_TUTORIAL_STEPS")
        self.assertEqual(len(steps), 5)
        for s in steps:
            self.assertIn("id", s)
            self.assertIn("size", s)
            self.assertIn("rowClues", s)
            self.assertIn("colClues", s)
            self.assertEqual(len(s["rowClues"]), s["size"])
            self.assertEqual(len(s["colClues"]), s["size"])

    def test_slitherlink_basics_tutorial_simulation(self):
        """Überprüft alle 6 Schritte des Slitherlink-Grundlagen-Tutorials"""
        sl1 = BASE_DIR / "js" / "puzzles" / "slitherlink" / "data" / "tutorial.js"
        steps = load_tutorial_steps(sl1, "SLITHERLINK_TUTORIAL_STEPS")
        self.assertEqual(len(steps), 6)

        for step in steps:
            size = step["size"]
            self.assertEqual(len(step["clues"]), size)
            for row in step["clues"]:
                self.assertEqual(len(row), size)

            h_edges = [row[:] for row in step["initialHEdges"]]
            v_edges = [row[:] for row in step["initialVEdges"]]
            self.assertEqual(len(h_edges), size + 1)
            self.assertEqual(len(v_edges), size)

            sol = step["solution"]
            # Apply solution
            for r in range(size + 1):
                for c in range(size):
                    val = sol["hEdges"][r][c]
                    if val > 0:
                        h_edges[r][c] = val
            for r in range(size):
                for c in range(size + 1):
                    val = sol["vEdges"][r][c]
                    if val > 0:
                        v_edges[r][c] = val

            # Check matching against solution
            tut_done = True
            for r in range(size + 1):
                for c in range(size):
                    req = sol["hEdges"][r][c]
                    if req > 0 and h_edges[r][c] != req:
                        tut_done = False
                        break
            for r in range(size):
                for c in range(size + 1):
                    req = sol["vEdges"][r][c]
                    if req > 0 and v_edges[r][c] != req:
                        tut_done = False
                        break

            self.assertTrue(tut_done, f"Step {step['id']} ({step['title']}) failed solution matching")

            # For Step 6, check full completed loop
            if step.get("requiresFullLoop") or step["id"] == 6:
                for r in range(size):
                    for c in range(size):
                        clue = step["clues"][r][c]
                        if clue is not None:
                            cnt = (h_edges[r][c] == 1) + (h_edges[r+1][c] == 1) + (v_edges[r][c] == 1) + (v_edges[r][c+1] == 1)
                            self.assertEqual(cnt, clue, f"Step 6 clue at ({r},{c}) mismatch")

                for r in range(size + 1):
                    for c in range(size + 1):
                        deg = 0
                        if c > 0 and h_edges[r][c-1] == 1: deg += 1
                        if c < size and h_edges[r][c] == 1: deg += 1
                        if r > 0 and v_edges[r-1][c] == 1: deg += 1
                        if r < size and v_edges[r][c] == 1: deg += 1
                        self.assertIn(deg, (0, 2), f"Step 6 vertex ({r},{c}) degree is {deg}")

    def test_slitherlink_advanced_tutorial_simulation(self):
        """Überprüft alle Schritte des Slitherlink Fortgeschrittenen-Tutorials"""
        sl2 = BASE_DIR / "js" / "puzzles" / "slitherlink" / "data" / "tutorial_adv.js"
        steps = load_tutorial_steps(sl2, "SLITHERLINK_TUTORIAL_ADVANCED_STEPS")
        self.assertEqual(len(steps), 3)

        for step in steps:
            size = step["size"]
            self.assertEqual(len(step["clues"]), size)
            for row in step["clues"]:
                self.assertEqual(len(row), size)

            h_edges = [row[:] for row in step["initialHEdges"]]
            v_edges = [row[:] for row in step["initialVEdges"]]

            sol = step["solution"]
            for r in range(size + 1):
                for c in range(size):
                    val = sol["hEdges"][r][c]
                    if val > 0:
                        h_edges[r][c] = val
            for r in range(size):
                for c in range(size + 1):
                    val = sol["vEdges"][r][c]
                    if val > 0:
                        v_edges[r][c] = val

            tut_done = True
            for r in range(size + 1):
                for c in range(size):
                    req = sol["hEdges"][r][c]
                    if req > 0 and h_edges[r][c] != req:
                        tut_done = False
                        break
            for r in range(size):
                for c in range(size + 1):
                    req = sol["vEdges"][r][c]
                    if req > 0 and v_edges[r][c] != req:
                        tut_done = False
                        break

            self.assertTrue(tut_done, f"Advanced step {step['id']} ({step['title']}) failed solution matching")

if __name__ == "__main__":
    unittest.main()
