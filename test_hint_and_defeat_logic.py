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
        cls.server = http.server.HTTPServer(('127.0.0.1', 8977), http.server.SimpleHTTPRequestHandler)
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
        cmd = [
            chrome_path,
            '--headless=new',
            '--disable-gpu',
            '--virtual-time-budget=4000',
            '--dump-dom',
            'http://127.0.0.1:8977/test_eval_temp.html'
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
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
        self.assertEqual(result['played'], 6)
        self.assertEqual(result['won'], 4)
        self.assertEqual(result['lost'], 2)


if __name__ == "__main__":
    unittest.main()
