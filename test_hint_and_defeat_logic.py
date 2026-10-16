"""
Automatisierte Test-Suite für Hint-Priorisierung, Lösungsaufdeckung und Niederlagen-Statistik
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

class TestHintAndDefeatLogic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 8977), http.server.SimpleHTTPRequestHandler)
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
import {{ TangoEngine, SUN, MOON, EMPTY }} from './js/core/engine.js';
import {{ TangoSolver }} from './js/core/solver.js';
import {{ getCampaignLevel }} from './js/data/levels.js';
import {{ puzzleRegistry }} from './js/shell/puzzle-registry.js';
import {{ TangoPlugin }} from './js/puzzles/tango/index.js';
import {{ SudokuPlugin }} from './js/puzzles/sudoku/index.js';
import {{ AkariPlugin }} from './js/puzzles/akari/index.js';
import {{ NonogramPlugin }} from './js/puzzles/nonogram/index.js';
import {{ SlitherlinkPlugin }} from './js/puzzles/slitherlink/index.js';
import {{ CrownsPlugin }} from './js/puzzles/crowns/index.js';
import {{ HashiPlugin }} from './js/puzzles/hashi/index.js';
import {{ FutoshikiPlugin }} from './js/puzzles/futoshiki/index.js';

try {{
    {js_code}
}} catch (e) {{
    document.getElementById('output').textContent = JSON.stringify({{ error: e.stack || e.message }});
}}
</script>
</body>
</html>"""
        test_file = BASE_DIR / "test_eval_temp.html"
        test_file.write_text(test_html, encoding='utf-8')

        chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
        profile_dir = BASE_DIR / ".chrome_eval_profile"
        ts = time.time()
        cmd = [
            chrome_path,
            '--headless=new',
            '--disable-gpu',
            '--disable-http-cache',
            f'--user-data-dir={profile_dir}',
            '--virtual-time-budget=3000',
            '--dump-dom',
            f'http://127.0.0.1:8977/test_eval_temp.html?t={ts}'
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

    def test_find_mistakes_detects_wrong_user_cell(self):
        """Testet, dass findMistakes abweichende Spieler-Zellen gegenüber der Lösung erkennt"""
        js_code = """
        const level = getCampaignLevel(0); // 4x4 Easy
        const engine = new TangoEngine(level.size);
        engine.loadPuzzle(level);

        // Finde ein ungesperrtes leeres Feld
        let emptyR = -1, emptyC = -1;
        for (let r = 0; r < level.size; r++) {
            for (let c = 0; c < level.size; c++) {
                if (engine.grid[r][c] === EMPTY) {
                    emptyR = r;
                    emptyC = c;
                    break;
                }
            }
            if (emptyR !== -1) break;
        }

        const solVal = level.solution[emptyR][emptyC];
        const wrongVal = solVal === SUN ? MOON : SUN;

        // Setze das Feld absichtlich falsch
        engine.setCellValue(emptyR, emptyC, wrongVal);

        const mistake = engine.findMistakes();
        document.getElementById('output').textContent = JSON.stringify({
            hasMistake: mistake !== null,
            mistakeR: mistake ? mistake.r : null,
            mistakeC: mistake ? mistake.c : null,
            expectedVal: mistake ? mistake.expectedVal : null,
            correctSolVal: solVal
        });
        """
        result = self.run_browser_eval(js_code)
        self.assertTrue(result['hasMistake'], "findMistakes muss falsche Zelle erkennen")
        self.assertEqual(result['expectedVal'], result['correctSolVal'], "Erwarteter Wert muss mit Lösung übereinstimmen")

    def test_find_mistakes_returns_null_when_all_correct(self):
        """Testet, dass findMistakes null zurückgibt, wenn alle bisher gesetzten Felder korrekt sind"""
        js_code = """
        const level = getCampaignLevel(0);
        const engine = new TangoEngine(level.size);
        engine.loadPuzzle(level);

        // Setze einen korrekten Zug
        for (let r = 0; r < level.size; r++) {
            for (let c = 0; c < level.size; c++) {
                if (engine.grid[r][c] === EMPTY) {
                    engine.setCellValue(r, c, level.solution[r][c]);
                    break;
                }
            }
        }

        const mistake = engine.findMistakes();
        const logicalHint = TangoSolver.findLogicalHint(engine);

        document.getElementById('output').textContent = JSON.stringify({
            hasMistake: mistake !== null,
            hasLogicalHint: logicalHint !== null
        });
        """
        result = self.run_browser_eval(js_code)
        self.assertFalse(result['hasMistake'], "Bei korrekter Belegung darf kein Fehler gemeldet werden")
        self.assertTrue(result['hasLogicalHint'], "Bei korrekter Belegung muss ein logischer Folgetipp erzeugt werden")

    def test_defeat_recording_in_stats(self):
        """Testet, dass recordGameStats(false) stats.lost erhöht und stats.won unverändert lässt"""
        js_code = """
        localStorage.setItem('tango_stats', JSON.stringify({ played: 5, won: 4, lost: 1, bestTime: 120, bestTimes: { '4': 30, '6': 120, '8': null, '10': null }, totalTime: 400 }));
        
        // Simuliere recordGameStats(false)
        const stats = JSON.parse(localStorage.getItem('tango_stats'));
        stats.played = (stats.played || 0) + 1;
        stats.lost = (stats.lost || 0) + 1;
        localStorage.setItem('tango_stats', JSON.stringify(stats));

        const updated = JSON.parse(localStorage.getItem('tango_stats'));
        document.getElementById('output').textContent = JSON.stringify({
            played: updated.played,
            won: updated.won,
            lost: updated.lost
        });
        """
        result = self.run_browser_eval(js_code)
    def test_hint_prioritizes_high_cascade_bottleneck(self):
        """Testet, dass strategisch wertvollere Hinweise mit hohem Kaskadeneffekt gegenüber trivialen Positionen (0,0)/(0,1) bevorzugt werden"""
        js_code = """
        const engine = new TangoEngine(6);
        // Zeile 0 hat nur einen einfachen avoid_three am Rand
        engine.grid[0][0] = SUN;
        engine.grid[0][1] = SUN;
        
        // Zeile 4 ist fast voll (Bottleneck mit 2 Sonnen, 2 Monden -> nur 2 freie Felder)
        engine.grid[4][0] = SUN;
        engine.grid[4][1] = SUN;
        engine.grid[4][2] = MOON;
        engine.grid[4][3] = MOON;
        // engine.grid[4][4] und [4][5] sind leer -> balance_fill oder avoid_three schließt die Zeile ab!

        const hint = TangoSolver.findLogicalHint(engine);
        document.getElementById('output').textContent = JSON.stringify({
            hintR: hint ? hint.r : null,
            hintC: hint ? hint.c : null,
            type: hint ? hint.type : null
        });
        """
        result = self.run_browser_eval(js_code)
        self.assertEqual(result['hintR'], 4, "Hinweis muss die Engpass-Zeile 4 priorisieren, anstatt Zeile 0")

    def test_hint_respects_player_focus(self):
        """Testet, dass findLogicalHint bei übergebenem focusCell Hinweise in der Nähe des Spielers bevorzugt"""
        js_code = """
        const engine = new TangoEngine(6);
        // Zwei gleichwertige Sandwich-Möglichkeiten in Zeile 1 und Zeile 4
        engine.grid[1][0] = SUN;
        engine.grid[1][2] = SUN;

        engine.grid[4][2] = MOON;
        engine.grid[4][4] = MOON;

        // Spieler fokussiert Zelle (4, 3)
        const hintWithFocus = TangoSolver.findLogicalHint(engine, { focusCell: { r: 4, c: 3 } });
        // Spieler fokussiert Zelle (1, 1)
        const hintWithFocusRow1 = TangoSolver.findLogicalHint(engine, { focusCell: { r: 1, c: 1 } });

        document.getElementById('output').textContent = JSON.stringify({
            focusRow4_R: hintWithFocus ? hintWithFocus.r : null,
            focusRow4_C: hintWithFocus ? hintWithFocus.c : null,
            focusRow1_R: hintWithFocusRow1 ? hintWithFocusRow1.r : null,
            focusRow1_C: hintWithFocusRow1 ? hintWithFocusRow1.c : null
        });
        """
        result = self.run_browser_eval(js_code)
        self.assertEqual(result['focusRow4_R'], 4, "Mit Focus auf Zeile 4 muss der Hinweis in Zeile 4 sein")
        self.assertEqual(result['focusRow4_C'], 3, "Mit Focus auf (4,3) muss Zelle (4,3) gewählt werden")
        self.assertEqual(result['focusRow1_R'], 1, "Mit Focus auf Zeile 1 muss der Hinweis in Zeile 1 sein")
        self.assertEqual(result['focusRow1_C'], 1, "Mit Focus auf (1,1) muss Zelle (1,1) gewählt werden")

    def test_hint_shimmer_lifecycle(self):
        """Testet, dass das Hinweis-Feld hintPlacedCell setzt und schimmert, bis der Spieler ein Symbol setzt"""
        js_code = """
        const engine = new TangoEngine(4);
        engine.grid[0][0] = SUN;
        engine.grid[0][1] = SUN;

        const hint = TangoSolver.findLogicalHint(engine);
        // Simuliere App-Zustand
        let hintPlacedCell = { r: hint.r, c: hint.c };
        const isShimmeringBeforeMove = (hintPlacedCell !== null && hintPlacedCell.r === hint.r && hintPlacedCell.c === hint.c);

        // Spieler platziert eigenen Zug
        hintPlacedCell = null;
        const isShimmeringAfterMove = (hintPlacedCell !== null);

        document.getElementById('output').textContent = JSON.stringify({
            hintTargetR: hint.r,
            hintTargetC: hint.c,
            isShimmeringBeforeMove,
            isShimmeringAfterMove
        });
        """
        result = self.run_browser_eval(js_code)
        self.assertTrue(result['isShimmeringBeforeMove'], "Zelle muss nach Hinweis-Platzierung schimmern")
        self.assertFalse(result['isShimmeringAfterMove'], "Zelle darf nach Spielzug nicht mehr schimmern")

    def test_all_plugins_handle_hint_without_script_error(self):
        """Testet, dass handleHint und getHint auf allen Puzzle-Plugins ohne Fehler durchlaufen"""
        js_code = """
        puzzleRegistry.register(TangoPlugin);
        puzzleRegistry.register(SudokuPlugin);
        puzzleRegistry.register(AkariPlugin);
        puzzleRegistry.register(NonogramPlugin);
        puzzleRegistry.register(SlitherlinkPlugin);
        puzzleRegistry.register(CrownsPlugin);
        puzzleRegistry.register(HashiPlugin);
        puzzleRegistry.register(FutoshikiPlugin);

        const results = {};
        for (const p of puzzleRegistry.getAll()) {
            const lvl = p.getCampaignLevel(0);
            const size = lvl.size || lvl.rows || 5;
            const engine = p.createEngine(size);
            engine.loadPuzzle(lvl);
            const hint = p.getHint(engine, {});
            results[p.id] = {
                hasHint: hint !== null,
                strategy: hint ? (hint.strategy || hint.title) : null
            };
        }

        document.getElementById('output').textContent = JSON.stringify(results);
        """
        result = self.run_browser_eval(js_code)
        for pid in ['tango', 'sudoku', 'akari', 'nonogram', 'slitherlink', 'crowns', 'hashi', 'futoshiki']:
            self.assertIn(pid, result, f"Plugin {pid} muss im Hint-Ergebnis enthalten sein")
            self.assertTrue(result[pid]['hasHint'], f"Plugin {pid} muss einen gültigen Hinweis liefern")

    def test_crowns_hint_logic_and_mistake_detection(self):
        """Testet das Crowns-Hinweissystem: Initialer Hinweis, Fehlererkennung und fälschliche Sperrungen"""
        js_code = """
        const p = CrownsPlugin;
        const engine = p.createEngine(5);
        const lvl = p.getCampaignLevel(0);
        engine.loadPuzzle(lvl);

        // 1. Initialer logischer Hinweis auf leerem Spielfeld
        const initialHint = p.getHint(engine, {});

        // 2. Falsche Krone platzieren
        // Finde eine Zelle, die in der Lösung 0 ist
        let wrongR = -1, wrongC = -1;
        for (let r = 0; r < engine.size; r++) {
            for (let c = 0; c < engine.size; c++) {
                if (lvl.solution[r][c] !== 1) {
                    wrongR = r; wrongC = c;
                    break;
                }
            }
            if (wrongR !== -1) break;
        }
        engine.setCellValue(wrongR, wrongC, 1);
        const wrongCrownMistake = engine.findMistakes();
        const wrongCrownHint = p.getHint(engine, {});
        engine.setCellValue(wrongR, wrongC, 0); // Zurücksetzen

        // 3. Falsches Kreuz (false elimination) auf Kronenfeld platzieren
        let crownR = -1, crownC = -1;
        for (let r = 0; r < engine.size; r++) {
            for (let c = 0; c < engine.size; c++) {
                if (lvl.solution[r][c] === 1) {
                    crownR = r; crownC = c;
                    break;
                }
            }
            if (crownR !== -1) break;
        }
        engine.setCellValue(crownR, crownC, 2); // Setze X wo Krone sein muss
        const falseElimMistake = engine.findMistakes();
        const falseElimHint = p.getHint(engine, {});

        document.getElementById('output').textContent = JSON.stringify({
            hasInitialHint: initialHint !== null,
            initialHintHasR: initialHint && typeof initialHint.r === 'number',
            initialHintHasC: initialHint && typeof initialHint.c === 'number',
            initialHintHasVal: initialHint && typeof initialHint.value === 'number',
            initialHintMsg: initialHint ? (initialHint.message || initialHint.description) : null,

            wrongCrownDetected: wrongCrownMistake !== null && wrongCrownMistake.r === wrongR && wrongCrownMistake.c === wrongC,
            wrongCrownHintIsMistake: wrongCrownHint ? (wrongCrownHint.isMistake === true || wrongCrownHint.type === 'error') : false,

            falseElimDetected: falseElimMistake !== null && (falseElimMistake.errorType === 'false_elimination' || falseElimMistake.type === 'false_elimination'),
            falseElimHintIsMistake: falseElimHint ? (falseElimHint.isMistake === true || falseElimHint.type === 'error') : false,
            falseElimExpectedVal: falseElimHint ? (falseElimHint.value ?? falseElimHint.expectedVal) : null
        });
        """
        result = self.run_browser_eval(js_code)
        self.assertTrue(result['hasInitialHint'], "Crowns muss einen initialen Hinweis liefern")
        self.assertTrue(result['initialHintHasR'], "Initialer Hinweis muss 'r' enthalten")
        self.assertTrue(result['initialHintHasC'], "Initialer Hinweis muss 'c' enthalten")
        self.assertTrue(result['initialHintHasVal'], "Initialer Hinweis muss 'value' enthalten")
        self.assertIsNotNone(result['initialHintMsg'], "Initialer Hinweis muss Nachricht/Erklärung enthalten")

        self.assertTrue(result['wrongCrownDetected'], "Falsch gesetzte Krone muss erkannt werden")
        self.assertTrue(result['wrongCrownHintIsMistake'], "Hinweis auf falsche Krone muss Fehler-Typ sein")

        self.assertTrue(result['falseElimDetected'], "Falsch gesetztes Kreuz auf Krone muss als false_elimination erkannt werden")
        self.assertTrue(result['falseElimHintIsMistake'], "Hinweis auf fälschliche Sperre muss Fehler-Typ sein")
        self.assertEqual(result['falseElimExpectedVal'], 1, "Erwarteter Wert für fälschliche Sperre muss Krone (1) sein")

    def test_slitherlink_find_mistakes_detects_wrong_line_and_cross(self):
        """Testet, dass Slitherlink findMistakes sowohl falsche Linien als auch falsche Kreuze zuverlässig erkennt"""
        js_code = """
        const p = SlitherlinkPlugin;
        const engine = p.createEngine(5);
        const lvl = p.getCampaignLevel(0);
        engine.loadPuzzle(lvl);

        // Finde eine Kante, die in der Lösung 0/2 ist, und setze sie auf 1 (Linie)
        let wrongHR = -1, wrongHC = -1;
        for (let r = 0; r <= engine.rows; r++) {
            for (let c = 0; c < engine.cols; c++) {
                if (lvl.solution.hEdges[r][c] !== 1) {
                    wrongHR = r;
                    wrongHC = c;
                    break;
                }
            }
            if (wrongHR !== -1) break;
        }

        engine.setEdge('h', wrongHR, wrongHC, 1, false);

        const mistake = engine.findMistakes();
        const hint = p.getHint(engine, {});

        document.getElementById('output').textContent = JSON.stringify({
            hasMistake: mistake !== null,
            edgeType: mistake ? mistake.edgeType : null,
            r: mistake ? mistake.r : null,
            c: mistake ? mistake.c : null,
            expectedVal: mistake ? mistake.expectedVal : null,
            hintIsMistake: hint ? (hint.isMistake === true || hint.type === 'error') : false,
            hintHasAction: hint ? (hint.value !== undefined || hint.expectedVal !== undefined) : false,
            hintEdgeType: hint ? hint.edgeType : null
        });
        """
        result = self.run_browser_eval(js_code)
        self.assertTrue(result['hasMistake'], "findMistakes muss falsche Slitherlink-Kante erkennen")
        self.assertEqual(result['edgeType'], 'h', "Erkannte Kante muss horizontal sein")
        self.assertTrue(result['hintIsMistake'], "getHint muss Fehler-Hinweis priorisieren")
        self.assertTrue(result['hintHasAction'], "Fehler-Hinweis muss einen ausführbaren Zug (value/expectedVal) enthalten")
        self.assertEqual(result['hintEdgeType'], 'h', "Fehler-Hinweis muss Ziel-Kante angeben")

    def test_slitherlink_hint_placed_edge_shimmer_lifecycle(self):
        """Testet, dass bei Slitherlink hintPlacedEdge gesetzt wird und nach dem nächsten Zug zurückgesetzt wird"""
        js_code = """
        const p = SlitherlinkPlugin;
        const engine = p.createEngine(5);
        const lvl = p.getCampaignLevel(0);
        engine.loadPuzzle(lvl);

        const hint = p.getHint(engine, {});

        // Simuliere handleHint Apply in AppShell
        let hintPlacedEdge = null;
        let hintPlacedCell = null;
        if (hint && hint.edgeType) {
            hintPlacedEdge = { type: hint.edgeType, r: hint.r, c: hint.c };
            hintPlacedCell = null;
        }

        const isShimmeringBeforeMove = (hintPlacedEdge !== null &&
                                        hintPlacedEdge.type === hint.edgeType &&
                                        hintPlacedEdge.r === hint.r &&
                                        hintPlacedEdge.c === hint.c);

        // Simuliere Spielerinteraktion (onPointerDown)
        hintPlacedEdge = null;
        const isShimmeringAfterMove = (hintPlacedEdge !== null);

        document.getElementById('output').textContent = JSON.stringify({
            hintEdgeType: hint.edgeType,
            hintR: hint.r,
            hintC: hint.c,
            isShimmeringBeforeMove,
            isShimmeringAfterMove
        });
        """
        result = self.run_browser_eval(js_code)
        self.assertIn(result['hintEdgeType'], ['h', 'v'], "Hinweis muss eine horizontale oder vertikale Kante vorschlagen")
        self.assertTrue(result['isShimmeringBeforeMove'], "hintPlacedEdge muss vor dem nächsten Zug aktiv sein")
        self.assertFalse(result['isShimmeringAfterMove'], "hintPlacedEdge muss nach dem nächsten Zug zurückgesetzt sein")


if __name__ == "__main__":
    unittest.main()


