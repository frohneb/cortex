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

class TestNewFeaturesV284(unittest.TestCase):
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
<div id="dailyReminderBanner" style="display: none;"></div>
<div id="dailyBadge" style="display: none;"></div>
<div id="output">Running...</div>
<script type="module">
import {{ StorageManager, StorageKeys }} from './js/shared/storage.js';
import {{ StatsManager }} from './js/shared/stats.js';
import {{ puzzleRegistry }} from './js/shell/puzzle-registry.js';
import {{ CortexApp }} from './js/shell/app-shell.js';

try {{
    {js_code}
}} catch (e) {{
    document.getElementById('output').textContent = JSON.stringify({{ error: e.stack || e.message }});
}}
</script>
</body>
</html>"""
        test_file = BASE_DIR / "test_eval_temp_features.html"
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
            f'http://127.0.0.1:8978/test_eval_temp_features.html?t={ts}'
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

    def test_campaign_trophy_and_1_hint_on_restart(self):
        """Testet, dass nach 240 gelösten Leveln eine Trophäe existiert, und nach Neustart nur 1 Hinweis erlaubt ist"""
        js_code = """
        localStorage.clear();
        const app = new CortexApp();
        app.switchPlugin('tango');

        // Vorher: keine Trophäe, 3 Hinweise
        const beforeTrophy = app.hasCampaignTrophy('tango');
        const beforeHints = app.getMaxHints();

        // Simuliere 240 gelöste Level
        const fullCampaign = Array.from({ length: 240 }, (_, i) => i);
        StorageManager.setJSON(StorageKeys.puzzleKey('tango', 'campaign_completed'), fullCampaign);
        StorageManager.setJSON('tango_campaign_completed', fullCampaign);

        // Nach Abschluss aller 240 Level: Trophäe vorhanden
        const after240Trophy = app.hasCampaignTrophy('tango');

        // Starte Kampagne neu
        app.restartCampaign();

        // Nach Neustart: Level 1 (Index 0), Kampagne geleert, aber Trophäe bleibt erhalten!
        const restartedLvl = app.campaignLevelIndex;
        const restartedCompleted = app.getCompletedLevels('tango');
        const stillHasTrophy = app.hasCampaignTrophy('tango');

        // Im Replay-Modus nur 1 Hinweis erlaubt!
        const hintsInRestart = app.getMaxHints();

        // In Free Play trotz Trophäe weiterhin 3 Hinweise
        app.currentMode = 'free';
        const hintsInFree = app.getMaxHints();

        document.getElementById('output').textContent = JSON.stringify({
            beforeTrophy,
            beforeHints,
            after240Trophy,
            restartedLvl,
            restartedCompletedCount: restartedCompleted.length,
            stillHasTrophy,
            hintsInRestart,
            hintsInFree
        });
        """
        res = self.run_browser_eval(js_code)
        self.assertFalse(res['beforeTrophy'])
        self.assertEqual(res['beforeHints'], 3)
        self.assertTrue(res['after240Trophy'])
        self.assertEqual(res['restartedLvl'], 0)
        self.assertEqual(res['restartedCompletedCount'], 0)
        self.assertTrue(res['stillHasTrophy'])
        self.assertEqual(res['hintsInRestart'], 1, "In wiederholter Kampagne darf nur 1 Hinweis zur Verfügung stehen")
        self.assertEqual(res['hintsInFree'], 3, "Im freien Spiel bleiben 3 Hinweise erhalten")

    def test_minesweeper_explosion_does_not_count_as_loss(self):
        """Testet, dass eine Minen-Explosion nicht als ungelöst/Niederlage in die Statistik einfließt"""
        js_code = """
        localStorage.clear();
        const app = new CortexApp();
        app.switchPlugin('minesweeper');
        app.startCampaignLevel(0);

        // Suche eine Mine auf dem Spielfeld
        let mineR = -1, mineC = -1;
        for (let r = 0; r < app.engine.size; r++) {
            for (let c = 0; c < app.engine.size; c++) {
                if (app.engine.mines[r][c]) {
                    mineR = r;
                    mineC = c;
                    break;
                }
            }
            if (mineR !== -1) break;
        }

        // Klicke auf die Mine -> Explosion / Defeat
        app.handleCellClick(mineR, mineC);

        const statsAfterExplosion = StatsManager.getPuzzleStats('minesweeper');
        const totalStatsAfter = StatsManager.getAggregatedStats(['minesweeper']);

        // Nun simuliere ein anderes Spiel und surrender mit Lösung aufdecken
        app.startCampaignLevel(1);
        app.revealSolutionAndSurrender();

        const statsAfterSurrender = StatsManager.getPuzzleStats('minesweeper');

        document.getElementById('output').textContent = JSON.stringify({
            lostAfterExplosion: statsAfterExplosion.lost || 0,
            playedAfterExplosion: statsAfterExplosion.played || 0,
            allTimeLostAfterExplosion: totalStatsAfter.lost || 0,
            lostAfterSurrender: statsAfterSurrender.lost || 0,
            playedAfterSurrender: statsAfterSurrender.played || 0
        });
        """
        res = self.run_browser_eval(js_code)
        self.assertEqual(res['lostAfterExplosion'], 0, "Explosionen dürfen in Minesweeper nicht als verloren/ungelöst zählen")
        self.assertEqual(res['playedAfterExplosion'], 0, "Explosionen dürfen die Spielstatistik nicht verfälschen")
        self.assertEqual(res['allTimeLostAfterExplosion'], 0)
        self.assertEqual(res['lostAfterSurrender'], 1, "Aufgeben / Lösung aufdecken nach Hinweisen muss als ungelöst zählen")
        self.assertEqual(res['playedAfterSurrender'], 1)

    def test_daily_reminder_only_if_not_solved(self):
        """Testet, dass das Tagesrätsel-Reminder Banner nur aktiv ist wenn noch nicht gelöst"""
        js_code = """
        localStorage.clear();
        const app = new CortexApp();
        const today = new Date().toISOString().slice(0, 10);

        // Reminder aktivieren für aktuelle Zeit
        app.reminderEnabled = true;
        app.reminderTime = "00:00"; // Liegt garantiert in Vergangenheit heute
        app.checkDailyReminder();

        const notSolvedBannerDisplay = document.getElementById('dailyReminderBanner')?.style.display;

        // Jetzt Tagesrätsel als gelöst markieren
        app.saveDailyProgress();
        app.checkDailyReminder();

        const solvedBannerDisplay = document.getElementById('dailyReminderBanner')?.style.display;

        document.getElementById('output').textContent = JSON.stringify({
            isCompleted: app.isDailyPuzzleCompleted(today),
            notSolvedBannerDisplay,
            solvedBannerDisplay
        });
        """
        res = self.run_browser_eval(js_code)
        self.assertTrue(res['isCompleted'])
        self.assertEqual(res['notSolvedBannerDisplay'], 'flex')
        self.assertEqual(res['solvedBannerDisplay'], 'none', "Nach dem Lösen darf der Reminder nicht mehr angezeigt werden")

if __name__ == '__main__':
    unittest.main()
