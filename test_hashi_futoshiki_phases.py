"""
Automatisierte Test-Suite für Phase 1 & 2 von Hashiwokakero und Futoshiki
Testet:
1. HashiEngine: Inseln, Orthogonalität, Sichtlinien, Kreuzungen, Brücken-Zyklus, BFS-Zusammenhang, Undo/Redo, Validierung, Fehlererkennung
2. HashiSolver: Backtracking-Lösung, Eindeutigkeit, Taubenschlag-/Kapazitäts-Deduktion (8er, Eck-4er, etc.), Fehler-Priorität, Hints
3. FutoshikiEngine: N×N Grid (4-7), Ungleichungen (h/v), Duplikaterkennung, Constraint-Prüfung, Kandidaten, Undo/Redo, Validierung, Fehlererkennung
4. FutoshikiSolver: AC-3 Constraint-Propagation, MRV-Backtracking, Naked/Hidden Singles, Eindeutigkeit, Hints
"""

import unittest
import http.server
import threading
import time
import subprocess
import json
import re
import html
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

class TestHashiFutoshikiPhases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 8978), http.server.SimpleHTTPRequestHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever)
        cls.thread.daemon = True
        cls.thread.start()
        time.sleep(0.5)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def run_browser_eval(self, js_code: str) -> dict:
        test_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div id="output">Running...</div>
<script type="module">
import {{ HashiEngine, HASHI_BRIDGE_NONE, HASHI_BRIDGE_SINGLE, HASHI_BRIDGE_DOUBLE }} from './js/puzzles/hashi/engine.js';
import {{ HashiSolver }} from './js/puzzles/hashi/solver.js';
import {{ HashiGenerator }} from './js/puzzles/hashi/generator.js';
import {{ HashiRenderer }} from './js/puzzles/hashi/renderer.js';
import {{ FutoshikiEngine, CONSTRAINT_LT, CONSTRAINT_GT }} from './js/puzzles/futoshiki/engine.js';
import {{ FutoshikiSolver }} from './js/puzzles/futoshiki/solver.js';
import {{ FutoshikiGenerator }} from './js/puzzles/futoshiki/generator.js';
import {{ FutoshikiRenderer }} from './js/puzzles/futoshiki/renderer.js';

try {{
    {js_code}
}} catch (e) {{
    document.getElementById('output').textContent = JSON.stringify({{ error: e.stack || e.message }});
}}
</script>
</body>
</html>"""
        test_file = BASE_DIR / "test_eval_phases_temp.html"
        test_file.write_text(test_html, encoding='utf-8')

        chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
        cmd = [
            chrome_path,
            '--headless=new',
            '--disable-gpu',
            '--virtual-time-budget=12000',
            '--dump-dom',
            'http://127.0.0.1:8978/test_eval_phases_temp.html'
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if test_file.exists():
            test_file.unlink()

        match = re.search(r'<div id="output">([\s\S]*?)</div>', res.stdout)
        self.assertIsNotNone(match, "Browser DOM output must contain #output div")
        raw_text = html.unescape(match.group(1))
        data = json.loads(raw_text)
        if 'error' in data:
            self.fail(f"JS Evaluation Error: {data['error']}")
        return data

    # =========================================================================
    # HASHIWOKAKERO: Phase 1 (Engine) Tests
    # =========================================================================

    def test_hashi_engine_initialization_and_neighbors(self):
        """Testet Insel-Initialisierung, orthogonale Nachbarn und Sichtlinien-Blockierung"""
        js_code = """
        const engine = new HashiEngine(7, 7);
        // Drei Inseln in einer Zeile: (1, 1), (1, 3), (1, 5)
        // (1, 1) darf nur (1, 3) sehen, NICHT (1, 5), weil (1, 3) die Sicht versperrt!
        engine.loadPuzzle({
            rows: 7, cols: 7,
            islands: [
                { r: 1, c: 1, value: 3 },
                { r: 1, c: 3, value: 4 },
                { r: 1, c: 5, value: 2 },
                { r: 3, c: 1, value: 1 }
            ]
        });

        const n11 = engine.getOrthogonalNeighbors(1, 1);
        const has13 = n11.some(n => n.r === 1 && n.c === 3);
        const has15 = n11.some(n => n.r === 1 && n.c === 5); // Darf NICHT vorhanden sein
        const has31 = n11.some(n => n.r === 3 && n.c === 1);

        document.getElementById('output').textContent = JSON.stringify({
            has13,
            has15,
            has31,
            islandCount: engine.getIslandsList().length
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertTrue(data['has13'])
        self.assertFalse(data['has15'], "Insel (1,3) muss Sichtlinie zu (1,5) blockieren")
        self.assertTrue(data['has31'])
        self.assertEqual(data['islandCount'], 4)

    def test_hashi_engine_bridge_cycling_and_crossings(self):
        """Testet Brücken-Zyklen (0->1->2->0) und Kreuzungsverbot"""
        js_code = """
        const engine = new HashiEngine(5, 5);
        // Kreuz-Anordnung:
        //      (0, 2)
        // (2, 0)     (2, 4)
        //      (4, 2)
        engine.loadPuzzle({
            rows: 5, cols: 5,
            islands: [
                { r: 0, c: 2, value: 2 },
                { r: 4, c: 2, value: 2 },
                { r: 2, c: 0, value: 2 },
                { r: 2, c: 4, value: 2 }
            ]
        });

        // 1. Horizontale Brücke zwischen (2, 0) und (2, 4) setzen
        const b1 = engine.cycleBridge(2, 0, 2, 4); // count 1
        const count1 = engine.getBridgeCount(2, 0, 2, 4);

        const b2 = engine.cycleBridge(2, 0, 2, 4); // count 2
        const count2 = engine.getBridgeCount(2, 0, 2, 4);

        // 2. Vertikale Brücke zwischen (0, 2) und (4, 2) würde die horizontale kreuzen!
        const hasCross = engine.hasCrossing(0, 2, 4, 2);
        const verticalSet = engine.setBridge(0, 2, 4, 2, 1); // Muss fehlschlagen!
        const countVert = engine.getBridgeCount(0, 2, 4, 2);

        // 3. Horizontale entfernen (wieder auf 0)
        engine.cycleBridge(2, 0, 2, 4); // count 0
        const countZero = engine.getBridgeCount(2, 0, 2, 4);

        // Jetzt muss vertikale Brücke erlaubt sein
        const verticalSetNow = engine.setBridge(0, 2, 4, 2, 2);
        const countVertNow = engine.getBridgeCount(0, 2, 4, 2);

        document.getElementById('output').textContent = JSON.stringify({
            count1,
            count2,
            hasCross,
            verticalSet,
            countVert,
            countZero,
            verticalSetNow,
            countVertNow
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['count1'], 1)
        self.assertEqual(data['count2'], 2)
        self.assertTrue(data['hasCross'])
        self.assertFalse(data['verticalSet'], "Kreuzende Brücke darf nicht gesetzt werden können")
        self.assertEqual(data['countVert'], 0)
        self.assertEqual(data['countZero'], 0)
        self.assertTrue(data['verticalSetNow'])
        self.assertEqual(data['countVertNow'], 2)

    def test_hashi_engine_connectivity_and_validation(self):
        """Testet BFS-Konnektivitätsprüfung, Undo/Redo und Validierung"""
        js_code = """
        const engine = new HashiEngine(4, 4);
        // 4 Inseln im Viereck:
        // (0,0)[2] - (0,3)[2]
        //    |          |
        // (3,0)[2] - (3,3)[2]
        engine.loadPuzzle({
            rows: 4, cols: 4,
            islands: [
                { r: 0, c: 0, value: 2 },
                { r: 0, c: 3, value: 2 },
                { r: 3, c: 0, value: 2 },
                { r: 3, c: 3, value: 2 }
            ]
        });

        // Anfangs nicht zusammenhängend
        const initConnected = engine.isConnected();

        // 1. Nur obere Kante setzen
        engine.setBridge(0, 0, 0, 3, 1);
        const afterOneEdgeConnected = engine.isConnected();

        // 2. Alle 4 Kanten zu einem Ring verbinden
        engine.setBridge(0, 3, 3, 3, 1);
        engine.setBridge(3, 3, 3, 0, 1);
        engine.setBridge(3, 0, 0, 0, 1);

        const fullyConnected = engine.isConnected();
        const solved = engine.isSolved();

        // 3. Undo testen
        engine.undo(); // nimmt Kante (3,0)-(0,0) zurück
        const afterUndoSolved = engine.isSolved();
        const afterUndoDegree = engine.getIslandDegree(0, 0);

        // 4. Redo testen
        engine.redo();
        const afterRedoSolved = engine.isSolved();

        document.getElementById('output').textContent = JSON.stringify({
            initConnected,
            afterOneEdgeConnected,
            fullyConnected,
            solved,
            afterUndoSolved,
            afterUndoDegree,
            afterRedoSolved
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertFalse(data['initConnected'])
        self.assertFalse(data['afterOneEdgeConnected'])
        self.assertTrue(data['fullyConnected'])
        self.assertTrue(data['solved'])
        self.assertFalse(data['afterUndoSolved'])
        self.assertEqual(data['afterUndoDegree'], 1)
        self.assertTrue(data['afterRedoSolved'])

    def test_hashi_engine_find_mistakes(self):
        """Testet Fehlererkennung bei überbelegten Inseln und isolierten Komponenten"""
        js_code = """
        const engine = new HashiEngine(6, 6);
        // Drei Inseln: (0,0)[1], (0,2)[1], (5,5)[2]
        // Wenn (0,0) und (0,2) mit 1 Brücke verbunden werden, sind beide erfüllt,
        // aber (5,5) ist komplett isoliert!
        engine.loadPuzzle({
            rows: 6, cols: 6,
            islands: [
                { r: 0, c: 0, value: 1 },
                { r: 0, c: 2, value: 1 },
                { r: 5, c: 5, value: 2 }
            ]
        });

        // Brücke zwischen (0,0) und (0,2) erzeugt isolierten Teilgraphen
        engine.setBridge(0, 0, 0, 2, 1);
        const isolatedMistake = engine.findMistakes();

        // Brücke überbelegen (2 statt 1)
        engine.setBridge(0, 0, 0, 2, 2);
        const overfilledMistake = engine.findMistakes();

        document.getElementById('output').textContent = JSON.stringify({
            isolatedErrorType: isolatedMistake ? isolatedMistake.errorType : null,
            overfilledErrorType: overfilledMistake ? overfilledMistake.errorType : null
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['isolatedErrorType'], 'isolated_subgraph')
        self.assertEqual(data['overfilledErrorType'], 'overfilled_island')

    # =========================================================================
    # HASHIWOKAKERO: Phase 2 (Solver) Tests
    # =========================================================================

    def test_hashi_solver_solves_puzzle_uniquely(self):
        """Testet Backtracking-Lösung und Eindeutigkeitsprüfung für Hashi"""
        js_code = """
        const puzzle = {
            rows: 5, cols: 5,
            islands: [
                { r: 0, c: 0, value: 2 },
                { r: 0, c: 2, value: 4 },
                { r: 0, c: 4, value: 1 },
                { r: 3, c: 2, value: 1 }
            ]
        };
        // Eindeutige Lösung:
        // (0,0)-(0,2): 2, (0,2)-(0,4): 1, (0,2)-(3,2): 1
        const solutions = HashiSolver.solve(puzzle, 2);

        document.getElementById('output').textContent = JSON.stringify({
            solutionCount: solutions.length,
            bridge00_02: solutions[0].get('0,0-0,2'),
            bridge02_04: solutions[0].get('0,2-0,4'),
            bridge02_32: solutions[0].get('0,2-3,2')
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['solutionCount'], 1)
        self.assertEqual(data['bridge00_02'], 2)
        self.assertEqual(data['bridge02_04'], 1)
        self.assertEqual(data['bridge02_32'], 1)

    def test_hashi_solver_logical_hints_pigeonhole(self):
        """Testet Taubenschlag-/Kapazitäts-Deduktion für Eck-4er und 8er Inseln"""
        js_code = """
        const engine = new HashiEngine(5, 5);
        // Eck-Insel (0,0) mit Wert 4 und genau 2 Nachbarn (0,4) und (4,0)
        // Beide Kanten MÜSSEN Doppelbrücken (2) sein!
        engine.loadPuzzle({
            rows: 5, cols: 5,
            islands: [
                { r: 0, c: 0, value: 4 },
                { r: 0, c: 4, value: 2 },
                { r: 4, c: 0, value: 2 }
            ]
        });

        const hint = HashiSolver.findLogicalHint(engine);

        document.getElementById('output').textContent = JSON.stringify({
            hintType: hint ? hint.type : null,
            count: hint ? hint.count : null,
            r: hint ? hint.r : null,
            c: hint ? hint.c : null
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['hintType'], 'bridge_add')
        self.assertEqual(data['count'], 2)
        self.assertEqual(data['r'], 0)
        self.assertEqual(data['c'], 0)

    # =========================================================================
    # FUTOSHIKI: Phase 1 (Engine) Tests
    # =========================================================================

    def test_futoshiki_engine_initialization_and_constraints(self):
        """Testet Futoshiki Gitter-Initialisierung, Constraints (<, >) und Sperrung"""
        js_code = """
        const engine = new FutoshikiEngine(4);
        engine.loadPuzzle({
            size: 4,
            initialGrid: [
                [1, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 4]
            ],
            hConstraints: [
                ['<', '', '>'],
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ],
            vConstraints: [
                ['<', '', '', ''],
                ['', '', '', ''],
                ['', '', '', '>']
            ]
        });

        const isLocked00 = engine.isLocked(0, 0);
        const isLocked01 = engine.isLocked(0, 1);
        const h00 = engine.getConstraintH(0, 0); // '<'
        const h02 = engine.getConstraintH(0, 2); // '>'
        const v00 = engine.getConstraintV(0, 0); // '<'
        const v23 = engine.getConstraintV(2, 3); // '>'

        document.getElementById('output').textContent = JSON.stringify({
            isLocked00,
            isLocked01,
            h00,
            h02,
            v00,
            v23
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertTrue(data['isLocked00'])
        self.assertFalse(data['isLocked01'])
        self.assertEqual(data['h00'], '<')
        self.assertEqual(data['h02'], '>')
        self.assertEqual(data['v00'], '<')
        self.assertEqual(data['v23'], '>')

    def test_futoshiki_engine_violations_and_undo(self):
        """Testet Duplikaterkennung, Ungleichungsverletzungen und Undo/Redo"""
        js_code = """
        const engine = new FutoshikiEngine(4);
        engine.loadPuzzle({
            size: 4,
            initialGrid: [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            hConstraints: [
                ['<', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ]
        });

        // 1. Verletzung setzen: (0,0)=3 und (0,1)=2 bei Constraint (0,0) < (0,1)
        engine.setCell(0, 0, 3);
        engine.setCell(0, 1, 2);
        const violations = engine.checkConstraints();

        // 2. Duplikat in Zeile erzeugen: (0,2)=3 (schon bei (0,0))
        engine.setCell(0, 2, 3);
        const rowDups = engine.checkRowConflict(0);

        // 3. Undo
        engine.undo(); // nimmt (0,2) zurück
        const rowDupsAfterUndo = engine.checkRowConflict(0);

        // 4. Gültige Ziffer setzen: (0,0)=1 und (0,1)=4
        engine.setCell(0, 0, 1);
        engine.setCell(0, 1, 4);
        const violationsAfterFix = engine.checkConstraints();

        document.getElementById('output').textContent = JSON.stringify({
            violationCount: violations.length,
            rowDupsLength: rowDups.length,
            rowDupsAfterUndoLength: rowDupsAfterUndo.length,
            violationsAfterFixLength: violationsAfterFix.length
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['violationCount'], 1)
        self.assertEqual(data['rowDupsLength'], 2)
        self.assertEqual(data['rowDupsAfterUndoLength'], 0)
        self.assertEqual(data['violationsAfterFixLength'], 0)

    # =========================================================================
    # FUTOSHIKI: Phase 2 (Solver) Tests
    # =========================================================================

    def test_futoshiki_solver_ac3_and_solve(self):
        """Testet AC-3 Propagation und vollständige Lösung eines 4x4 Puzzles"""
        js_code = """
        const puzzle = {
            size: 4,
            initialGrid: [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            hConstraints: [
                ['<', '<', '<'], // Zeile 0: C0 < C1 < C2 < C3 -> muss 1, 2, 3, 4 sein!
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ]
        };

        const engine = new FutoshikiEngine(4);
        engine.loadPuzzle(puzzle);

        // AC-3 Kandidaten prüfen
        const candidates = FutoshikiSolver.computeCandidates(engine);
        const row0C0 = Array.from(candidates[0][0]);
        const row0C3 = Array.from(candidates[0][3]);

        // Vollständig lösen
        const solutions = FutoshikiSolver.solve(puzzle, 2);

        document.getElementById('output').textContent = JSON.stringify({
            row0C0, // Muss exakt [1] sein
            row0C3, // Muss exakt [4] sein
            solutionCount: solutions.length,
            solRow0: solutions[0][0]
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['row0C0'], [1])
        self.assertEqual(data['row0C3'], [4])
        self.assertGreaterEqual(data['solutionCount'], 1)
        self.assertEqual(data['solRow0'], [1, 2, 3, 4])

    def test_futoshiki_solver_logical_hints(self):
        """Testet Naked Single Hint in Futoshiki"""
        js_code = """
        const engine = new FutoshikiEngine(4);
        // Durch Kette 1 < A < B < 4 ist A in {2}, B in {3} wenn 1 und 4 vorgegeben sind
        engine.loadPuzzle({
            size: 4,
            initialGrid: [
                [1, 0, 0, 4],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            hConstraints: [
                ['<', '<', '<'],
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ]
        });

        const hint = FutoshikiSolver.findLogicalHint(engine);

        document.getElementById('output').textContent = JSON.stringify({
            hintType: hint ? hint.type : null,
            r: hint ? hint.r : null,
            c: hint ? hint.c : null,
            value: hint ? hint.value : null
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['hintType'], 'naked_single')
        self.assertEqual(data['r'], 0)
        self.assertIn(data['c'], [1, 2])
        self.assertIn(data['value'], [2, 3])

    def test_hashi_engine_solution_mismatch_and_notes(self):
        """Testet Solution-Mismatch und Notizen in HashiEngine"""
        js_code = """
        const engine = new HashiEngine(5, 5);
        engine.loadPuzzle({
            rows: 5, cols: 5,
            islands: [
                { r: 0, c: 0, value: 2 },
                { r: 0, c: 4, value: 2 },
                { r: 4, c: 0, value: 2 },
                { r: 4, c: 4, value: 2 }
            ],
            solution: [
                { r1: 0, c1: 0, r2: 0, c2: 4, count: 2 },
                { r1: 4, c1: 0, r2: 4, c2: 4, count: 2 }
            ]
        });

        // 1. Notizen testen
        engine.toggleNote(0, 0, 4, 0, 'x');
        const notesBefore = Array.from(engine.getNotes(0, 0, 4, 0));
        engine.undo();
        const notesAfterUndo = Array.from(engine.getNotes(0, 0, 4, 0));

        // 2. Falsche Brücke setzen: (0,0)-(4,0) hat in der Lösung count 0
        // Da Wert von (0,0) = 2 ist, ist Insel nicht erfüllt -> kein isolierter Teilgraph
        engine.setBridge(0, 0, 4, 0, 1);
        const mistake = engine.findMistakes();

        document.getElementById('output').textContent = JSON.stringify({
            notesBefore,
            notesAfterUndo,
            mistakeType: mistake ? mistake.errorType : null,
            mistakeKey: mistake ? mistake.edgeKey : null
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['notesBefore'], ['x'])
        self.assertEqual(data['notesAfterUndo'], [])
        self.assertEqual(data['mistakeType'], 'solution_mismatch')
        self.assertEqual(data['mistakeKey'], '0,0-4,0')

    def test_hashi_solver_8_island_and_single_neighbor(self):
        """Testet 8er-Insel Deduktion und Einzel-Nachbar-Zwang"""
        js_code = """
        const engine = new HashiEngine(5, 5);
        // (2,2) ist eine 8 mit 4 Nachbarn
        engine.loadPuzzle({
            rows: 5, cols: 5,
            islands: [
                { r: 2, c: 2, value: 8 },
                { r: 0, c: 2, value: 2 },
                { r: 4, c: 2, value: 2 },
                { r: 2, c: 0, value: 2 },
                { r: 2, c: 4, value: 2 }
            ]
        });

        const hint8 = HashiSolver.findLogicalHint(engine);

        // Einzelner Nachbar: Insel bei (0,0) hat nur (0,4)
        const engineSingle = new HashiEngine(5, 5);
        engineSingle.loadPuzzle({
            rows: 5, cols: 5,
            islands: [
                { r: 0, c: 0, value: 1 },
                { r: 0, c: 4, value: 2 },
                { r: 4, c: 4, value: 1 }
            ]
        });
        const hintSingle = HashiSolver.findLogicalHint(engineSingle);

        document.getElementById('output').textContent = JSON.stringify({
            hint8Strategy: hint8 ? hint8.strategy : null,
            hint8Count: hint8 ? hint8.count : null,
            hintSingleStrategy: hintSingle ? hintSingle.strategy : null
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['hint8Strategy'], 'Die 8er-Insel')
        self.assertEqual(data['hint8Count'], 2)
        self.assertEqual(data['hintSingleStrategy'], 'Einziger verbleibender Nachbar')

    def test_futoshiki_engine_solution_mismatch_and_vertical_arrows(self):
        """Testet Solution-Mismatch und alternative Pfeilsymbole (^, v) in FutoshikiEngine"""
        js_code = """
        const engine = new FutoshikiEngine(4);
        engine.loadPuzzle({
            size: 4,
            initialGrid: [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            vConstraints: [
                ['^', '', '', 'v'], // '^' normalisiert auf '<', 'v' auf '>'
                ['', '', '', ''],
                ['', '', '', '']
            ],
            solution: [
                [1, 2, 3, 4],
                [2, 3, 4, 1],
                [3, 4, 1, 2],
                [4, 1, 2, 3]
            ]
        });

        const v00 = engine.getConstraintV(0, 0); // '<'
        const v03 = engine.getConstraintV(0, 3); // '>'

        // Falsche Ziffer setzen (4 statt 1 an (0,0))
        engine.setCell(0, 0, 4);
        const mistake = engine.findMistakes();

        document.getElementById('output').textContent = JSON.stringify({
            v00,
            v03,
            mistakeType: mistake ? mistake.errorType : null,
            expectedVal: mistake ? mistake.expectedVal : null
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['v00'], '<')
        self.assertEqual(data['v03'], '>')
        self.assertEqual(data['mistakeType'], 'solution_mismatch')
        self.assertEqual(data['expectedVal'], 1)

    def test_futoshiki_solver_5x5_puzzle(self):
        """Testet Lösen eines 5x5 Futoshiki Puzzles mit AC-3 & MRV Backtracking"""
        js_code = """
        const puzzle = {
            size: 5,
            initialGrid: [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0]
            ],
            hConstraints: [
                ['<', '<', '<', '<'], // 1 < 2 < 3 < 4 < 5 in Zeile 0 erzwungen!
                ['', '', '', ''],
                ['', '', '', ''],
                ['', '', '', ''],
                ['', '', '', '']
            ],
            vConstraints: [
                ['', '', '', '', ''],
                ['', '', '', '', ''],
                ['', '', '', '', ''],
                ['', '', '', '', '']
            ]
        };

        const solutions = FutoshikiSolver.solve(puzzle, 2);
        const sol0 = solutions.length > 0 ? solutions[0] : null;

        document.getElementById('output').textContent = JSON.stringify({
            solutionCount: solutions.length,
            row0: sol0 ? sol0[0] : null
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertGreaterEqual(data['solutionCount'], 1)
        self.assertEqual(data['row0'], [1, 2, 3, 4, 5])

    # =========================================================================
    # HASHIWOKAKERO: Phase 3 (Generator) & Phase 4 (Renderer) Tests
    # =========================================================================

    def test_hashi_generator_unique_puzzle(self):
        """Testet deterministische Generierung eines eindeutig lösbaren Hashi-Puzzles"""
        js_code = """
        const puzzle = HashiGenerator.generatePuzzle({ size: 6, difficulty: 'easy', seed: 4242 });
        const engine = new HashiEngine(puzzle.rows, puzzle.cols);
        engine.loadPuzzle(puzzle);

        const solutions = HashiSolver.solve(puzzle, 2);

        document.getElementById('output').textContent = JSON.stringify({
            islandCount: puzzle.islands.length,
            solutionCount: solutions.length,
            isComplete: puzzle.solution && puzzle.solution.length > 0
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertGreaterEqual(data['islandCount'], 4)
        self.assertEqual(data['solutionCount'], 1, "Generiertes Hashi-Puzzle muss exakt 1 Lösung haben")
        self.assertTrue(data['isComplete'])

    def test_hashi_renderer_board_and_keypad(self):
        """Testet SVG-Rendering, Insel-Gruppen, Leuchtringe und Keypad für Hashi"""
        js_code = """
        const engine = new HashiEngine(5, 5);
        engine.loadPuzzle({
            rows: 5, cols: 5,
            islands: [
                { r: 0, c: 0, value: 2 },
                { r: 0, c: 4, value: 2 }
            ]
        });

        const container = document.createElement('div');
        const keypadContainer = document.createElement('div');
        document.body.appendChild(container);
        document.body.appendChild(keypadContainer);

        // 1. Board rendern
        const state = { autoCheck: true, selectedIsland: null };
        HashiRenderer.renderBoard(container, engine, state);

        const svgEl = container.querySelector('.hashi-svg');
        const islandGroups = container.querySelectorAll('.hashi-island-group');
        const hitboxes = container.querySelectorAll('.hashi-edge-hitbox');

        // 2. Brücke setzen -> Insel erfüllt
        engine.setBridge(0, 0, 0, 4, 2);
        HashiRenderer.renderBoard(container, engine, state);
        const satisfiedIslands = container.querySelectorAll('.hashi-island-group.satisfied');

        // 3. Keypad & Regeln
        HashiRenderer.renderKeypad(keypadContainer, engine, state);
        const actionBar = keypadContainer.querySelector('.hashi-action-bar');
        const rulesDe = HashiRenderer.getRules('de');
        const rulesEn = HashiRenderer.getRules('en');

        document.getElementById('output').textContent = JSON.stringify({
            hasSvg: !!svgEl,
            islandGroupCount: islandGroups.length,
            hitboxCount: hitboxes.length,
            satisfiedCount: satisfiedIslands.length,
            hasActionBar: !!actionBar,
            hasRulesDe: rulesDe.length > 20,
            hasRulesEn: rulesEn.length > 20
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertTrue(data['hasSvg'])
        self.assertEqual(data['islandGroupCount'], 2)
        self.assertGreaterEqual(data['hitboxCount'], 1)
        self.assertEqual(data['satisfiedCount'], 2)
        self.assertTrue(data['hasActionBar'])
        self.assertTrue(data['hasRulesDe'])
        self.assertTrue(data['hasRulesEn'])

    # =========================================================================
    # FUTOSHIKI: Phase 3 (Generator) & Phase 4 (Renderer) Tests
    # =========================================================================

    def test_futoshiki_generator_unique_puzzle(self):
        """Testet deterministische Generierung eines eindeutig lösbaren Futoshiki-Puzzles"""
        js_code = """
        const puzzle = FutoshikiGenerator.generatePuzzle({ size: 4, difficulty: 'easy', seed: 1337 });
        const engine = new FutoshikiEngine(puzzle.size);
        engine.loadPuzzle(puzzle);

        const solutions = FutoshikiSolver.solve(puzzle, 2);

        document.getElementById('output').textContent = JSON.stringify({
            size: puzzle.size,
            solutionCount: solutions.length,
            hasH: puzzle.hConstraints.length === 4,
            hasV: puzzle.vConstraints.length === 3
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertEqual(data['size'], 4)
        self.assertEqual(data['solutionCount'], 1, "Generiertes Futoshiki-Puzzle muss exakt 1 Lösung haben")
        self.assertTrue(data['hasH'])
        self.assertTrue(data['hasV'])

    def test_futoshiki_renderer_board_and_keypad(self):
        """Testet (2N-1)×(2N-1) Grid-Rendering, Pfeile und Keypad für Futoshiki"""
        js_code = """
        const engine = new FutoshikiEngine(4);
        engine.loadPuzzle({
            size: 4,
            initialGrid: [
                [1, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 4]
            ],
            hConstraints: [
                ['<', '', '>'],
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ],
            vConstraints: [
                ['<', '', '', ''],
                ['', '', '', ''],
                ['', '', '', '>']
            ]
        });

        const container = document.createElement('div');
        const keypadContainer = document.createElement('div');
        document.body.appendChild(container);
        document.body.appendChild(keypadContainer);

        const state = { autoCheck: true, selectedCell: { r: 0, c: 1 } };
        FutoshikiRenderer.renderBoard(container, engine, state);

        const gridEl = container.querySelector('.futoshiki-grid');
        const cells = container.querySelectorAll('.futoshiki-cell');
        const hArrows = container.querySelectorAll('.futoshiki-constraint-h svg');
        const vArrows = container.querySelectorAll('.futoshiki-constraint-v svg');

        // Keypad
        FutoshikiRenderer.renderKeypad(keypadContainer, engine, state);
        const keypadButtons = keypadContainer.querySelectorAll('.futoshiki-key');
        const clearBtn = keypadContainer.querySelector('#futoshikiKeypadClear');

        const rulesDe = FutoshikiRenderer.getRules('de');

        document.getElementById('output').textContent = JSON.stringify({
            hasGrid: !!gridEl,
            cellCount: cells.length, // 4x4 = 16
            hArrowCount: hArrows.length, // 2 gesetzte Pfeile
            vArrowCount: vArrows.length, // 2 gesetzte Pfeile
            keypadButtonCount: keypadButtons.length, // 4 Ziffern + 1 Clear = 5
            hasClearBtn: !!clearBtn,
            hasRulesDe: rulesDe.length > 20
        });
        """
        data = self.run_browser_eval(js_code)
        self.assertTrue(data['hasGrid'])
        self.assertEqual(data['cellCount'], 16)
        self.assertEqual(data['hArrowCount'], 2)
        self.assertEqual(data['vArrowCount'], 2)
        self.assertEqual(data['keypadButtonCount'], 5)
        self.assertTrue(data['hasClearBtn'])
        self.assertTrue(data['hasRulesDe'])


if __name__ == '__main__':
    unittest.main()
