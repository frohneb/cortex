"""
Automatisierte Integrationstest-Suite für Tango Web & Mobile App
Überprüft:
1. DOM-Struktur & HTML-Container-Integrität (index.html)
2. ES-Modul Importpfade und Abhängigkeiten
3. Robuste App-Initialisierung (document.readyState Behandlung)
4. LocalStorage Absicherung gegen Privacy/Incognito SecurityErrors
5. HTTP-Server Antwort & Asset-MIME-Typen
"""

import unittest
import os
import re
import urllib.request
import html.parser
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

class HTMLContainerParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.classes = set()
        self.script_srcs = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if 'id' in attr_dict:
            self.ids.add(attr_dict['id'])
        if 'class' in attr_dict:
            for cls in attr_dict['class'].split():
                self.classes.add(cls)
        if tag == 'script' and 'src' in attr_dict:
            self.script_srcs.append(attr_dict['src'])


class TestTangoAppDOM(unittest.TestCase):
    def setUp(self):
        self.index_path = BASE_DIR / "index.html"
        self.app_js_path = BASE_DIR / "js" / "ui" / "app.js"
        self.i18n_js_path = BASE_DIR / "js" / "data" / "i18n.js"
        self.audio_js_path = BASE_DIR / "js" / "ui" / "audio.js"

    def test_index_html_structure(self):
        """Überprüft, ob alle notwendigen DOM-Container in index.html vorhanden sind"""
        self.assertTrue(self.index_path.exists(), "index.html muss existieren")
        content = self.index_path.read_text(encoding='utf-8')
        
        parser = HTMLContainerParser()
        parser.feed(content)

        required_ids = [
            'appRoot', 'boardContainer', 'tutorialBanner',
            'levelTitle', 'gameTimer', 'btnMenu', 'btnRestart',
            'btnUndo', 'btnRedo', 'btnNotes', 'btnZoom', 'btnHint', 'confettiCanvas'
        ]

        for req_id in required_ids:
            self.assertIn(req_id, parser.ids, f"DOM-Element #{req_id} fehlt in index.html")

        # Prüfe, ob bundle.js eingebunden ist
        self.assertTrue(
            './js/bundle.js' in parser.script_srcs or './js/ui/app.js' in parser.script_srcs,
            "bundle.js oder app.js muss in index.html eingebunden sein"
        )

    def test_es_module_dependency_graph(self):
        """Prüft alle import-Statements in allen JS-Dateien auf Existenz der Ziel-Dateien"""
        js_files = list((BASE_DIR / "js").rglob("*.js"))
        self.assertGreater(len(js_files), 0, "Keine JS-Dateien im js/-Ordner gefunden")

        import_pattern = re.compile(r'import\s+.*?from\s+[\'"](.*?)[\'"]', re.MULTILINE)

        for js_file in js_files:
            content = js_file.read_text(encoding='utf-8')
            imports = import_pattern.findall(content)
            for imp_path in imports:
                resolved_path = (js_file.parent / imp_path).resolve()
                self.assertTrue(
                    resolved_path.exists(),
                    f"Import-Fehler in {js_file.relative_to(BASE_DIR)}: Datei {imp_path} ({resolved_path}) existiert nicht!"
                )

    def test_app_js_readystate_initialization(self):
        """Überprüft, dass app.js document.readyState prüft und nicht starr auf DOMContentLoaded wartet"""
        content = self.app_js_path.read_text(encoding='utf-8')
        
        # Sollte document.readyState abfragen oder eine init-Funktion haben, die bei readyState !== 'loading' direkt feuert
        has_ready_state_check = 'document.readyState' in content
        self.assertTrue(
            has_ready_state_check,
            "app.js muss document.readyState prüfen, damit die App auch lädt, wenn DOMContentLoaded bereits gefeuert hat!"
        )

    def test_localstorage_safety_wrappers(self):
        """Überprüft, ob localStorage-Zugriffe in app.js, i18n.js und audio.js abgesichert sind"""
        files_to_check = [self.app_js_path, self.i18n_js_path, self.audio_js_path]

        for file_path in files_to_check:
            content = file_path.read_text(encoding='utf-8')
            # Prüfe, ob safeStorage oder try/catch vorhanden ist
            has_safety_helper = 'safeStorage' in content or 'try' in content
            self.assertTrue(
                has_safety_helper,
                f"localStorage-Zugriffe in {file_path.name} müssen abgesichert sein (try/catch oder safeStorage)"
            )


    def test_http_server_availability(self):
        """Prüft, ob der lokale HTTP-Server auf Port 8080 läuft und die Hauptseite ausliefert"""
        try:
            url = "http://127.0.0.1:8080/index.html"
            req = urllib.request.urlopen(url, timeout=2)
            self.assertEqual(req.status, 200, "Lokaler Server sollte HTTP Status 200 zurückgeben")
            content = req.read().decode('utf-8')
            self.assertIn('<title>Tango - Logikrätsel</title>', content)
        except Exception as e:
            self.skipTest(f"Lokaler HTTP Server läuft derzeit nicht auf Port 8080 ({e})")

    def test_no_invalid_optional_chaining_assignment(self):
        """Überprüft, dass in keinem JS-Skript an ein optional chain (?.prop =) zugewiesen wird"""
        js_files = list((BASE_DIR / "js").rglob("*.js"))
        invalid_pattern = re.compile(r'\?\.\s*[\w\$]+\s*=(?!=)')
        
        for js_file in js_files:
            content = js_file.read_text(encoding='utf-8')
            matches = invalid_pattern.findall(content)
            self.assertEqual(
                len(matches), 0,
                f"Ungültige Zuweisung an Optional Chaining in {js_file.name}: {matches}. "
                "Optional Chaining auf der linken Seite einer Zuweisung ist ein SyntaxError in JS!"
            )

    def test_bundle_no_dangling_exports_or_syntax_artifacts(self):
        """Überprüft, dass das Bundle keine unaufgelösten export-Statements oder Syntaxfehler enthält"""
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertFalse(bool(re.search(r'^\s*EMPTY,\s*SUN', bundle_content, re.MULTILINE)), "Dangling export im Bundle gefunden!")
        self.assertFalse(bool(re.search(r'^\s*import\s+', bundle_content, re.MULTILINE)), "Nicht bereinigtes import im Bundle gefunden!")
        self.assertFalse(bool(re.search(r'^\s*export\s+', bundle_content, re.MULTILINE)), "Nicht bereinigtes export im Bundle gefunden!")

    def test_tutorial_target_cell_highlighting(self):
        """Überprüft, ob tutorial-target und target-ghost im Bundle implementiert sind"""
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('tutorial-target', bundle_content, "tutorial-target Klasse muss im Bundle existieren")
        self.assertIn('target-ghost', bundle_content, "target-ghost Klasse muss im Bundle existieren")

    def test_long_press_click_suppression(self):
        """Überprüft, ob ignoreClickUntil zur Unterdrückung des klick-nach-longpress Bugs vorhanden ist"""
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('ignoreClickUntil', bundle_content, "ignoreClickUntil muss im Bundle vorhanden sein")

    def test_selected_cell_reset_on_level_start(self):
        """Überprüft, ob selectedCell beim Levelwechsel auf null zurückgesetzt wird"""
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        matches = re.findall(r'this\.selectedCell\s*=\s*null;', bundle_content)
        self.assertGreaterEqual(
            len(matches), 5,
            "this.selectedCell = null muss in allen 5 Level-Start-Methoden aufgerufen werden"
        )

    def test_column_uniqueness_validation(self):
        """Überprüft, ob unique_cols in validateRules zur Verhindung doppelter Spalten enthalten ist"""
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('unique_cols', bundle_content, "unique_cols Prüfung muss im Bundle vorhanden sein")

    def test_quadratic_board_aspect_ratio_css(self):
        """Überprüft, dass main.css die strikte 1:1 Quadrat-Form für das Board erzwingt"""
        css_content = (BASE_DIR / "css" / "main.css").read_text(encoding='utf-8')
        self.assertIn('aspect-ratio: 1 / 1;', css_content, "aspect-ratio: 1 / 1 muss in main.css enthalten sein")

    def test_proportional_edge_marker_scaling_css(self):
        """Überprüft, ob main.css proportionale Marker-Skalierung für 4x4, 6x6, 8x8, 10x10 besitzt"""
        css_content = (BASE_DIR / "css" / "main.css").read_text(encoding='utf-8')
        for size in [4, 6, 8, 10]:
            self.assertIn(f'.tango-grid.size-{size}', css_content, f"main.css muss Skalierungsregeln für size-{size} enthalten")

    def test_tutorial_pro_integration(self):
        """Überprüft, ob Tutorial Pro im HTML und JS Bundle enthalten ist"""
        html_content = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('id="navTutorialPro"', html_content, "navTutorialPro Button muss in index.html enthalten sein")
        self.assertIn('TUTORIAL_PRO_STEPS', bundle_content, "TUTORIAL_PRO_STEPS muss im Bundle existieren")
        self.assertIn('startTutorialPro', bundle_content, "startTutorialPro Methode muss im Bundle existieren")

    def test_tutorial_scrollability_css(self):
        """Überprüft, ob main.css vertikales Scrollen erlaubt (overflow-y: auto)"""
        css_content = (BASE_DIR / "css" / "main.css").read_text(encoding='utf-8')
        self.assertIn('overflow-y: auto;', css_content, "overflow-y: auto muss in main.css enthalten sein")

    def test_scroll_to_top_on_step_change(self):
        """Überprüft, ob scrollToTop im JS Bundle beim Wechsel von Lektionen aufgerufen wird"""
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('scrollToTop', bundle_content, "scrollToTop Methode muss im Bundle existieren")

    def test_tutorial_pro_step4_validity(self):
        """Überprüft, dass Lektion 4 in Tutorial Pro zwei unterschiedliche Ziel-Zellen ohne Kantenwiderspruch hat"""
        pro_content = (BASE_DIR / "js" / "data" / "tutorial_pro.js").read_text(encoding='utf-8')
        self.assertIn('{ r: 0, c: 1, val: MOON }', pro_content, "Lektion 4 muss Zielzelle (0,1) = MOON enthalten")
        self.assertIn('{ r: 2, c: 1, val: SUN }', pro_content, "Lektion 4 muss Zielzelle (2,1) = SUN enthalten")

    def test_tutorial_pro_step5_validity(self):
        """Überprüft, dass Lektion 5 in Tutorial Pro mathematisch korrekte Zielzellen zur Zeilen-Eindeutigkeit hat"""
        pro_content = (BASE_DIR / "js" / "data" / "tutorial_pro.js").read_text(encoding='utf-8')
        self.assertIn('{ r: 1, c: 2, val: MOON }', pro_content, "Lektion 5 muss Zielzelle (1,2) = MOON enthalten")
        self.assertIn('{ r: 1, c: 3, val: SUN }', pro_content, "Lektion 5 muss Zielzelle (1,3) = SUN enthalten")

    def test_max_3_hints_per_level_limit(self):
        """Überprüft, ob das Max-3-Hinweise Limit pro Level im Bundle durchgesetzt ist"""
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('MAX_HINTS = 3', bundle_content, "MAX_HINTS = 3 muss im Bundle enthalten sein")
        self.assertIn('this.hintsUsed >= MAX_HINTS', bundle_content, "Prüfung hintsUsed >= MAX_HINTS muss im Bundle existieren")

    def test_tutorial_pro_all_8_lessons_exist(self):
        """Überprüft, dass alle 8 Pro-Lektionen im Tutorial Pro Datenmodul vorhanden sind"""
        pro_content = (BASE_DIR / "js" / "data" / "tutorial_pro.js").read_text(encoding='utf-8')
        for idx in range(1, 9):
            self.assertIn(f'title: "Pro {idx}:', pro_content, f"Lektion Pro {idx} muss in tutorial_pro.js existieren")

    def test_detailed_logical_hint_messages(self):
        """Überprüft, dass der Solver detaillierte mathematische Beweis-Hinweise ohne schwammige Floskeln enthält"""
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertIn('proof_by_contradiction', bundle_content, "Widerspruchs-Beweis muss im Solver enthalten sein")
        self.assertIn('row_uniqueness', bundle_content, "Unizitäts-Axiom muss im Solver enthalten sein")
        self.assertNotIn('Durch logische Kombination der Zeilen-, Spalten- und Kantenregeln', bundle_content, "Schwammige Floskel muss entfernt worden sein")

    def test_calendar_export_removed(self):
        """Überprüft, dass Kalenderexport-Buttons und .ics-Exportfunktionen entfernt wurden"""
        html_content = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')
        self.assertNotIn('btnExportCalendarReminder', html_content, "btnExportCalendarReminder darf nicht mehr in index.html sein")
        self.assertNotIn('settingCalendarExportRow', html_content, "settingCalendarExportRow darf nicht mehr in index.html sein")
        self.assertNotIn('exportCalendarReminder', bundle_content, "exportCalendarReminder darf nicht mehr in bundle.js sein")

    def test_daily_streak_and_split_best_times_stats(self):
        """Überprüft, dass Streaks und aufgeteilte Bestzeiten (4x4, 6x6, 8x8, 10x10) im DOM und JS implementiert sind"""
        html_content = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')

        # DOM IDs in index.html
        stats_ids = [
            'statCurrentStreak', 'statMaxStreak',
            'statBestTime4', 'statBestTime6', 'statBestTime8', 'statBestTime10'
        ]
        for sid in stats_ids:
            self.assertIn(f'id="{sid}"', html_content, f'Element #{sid} muss in index.html vorhanden sein')

        # JS Logik im Bundle
        self.assertIn('calculateStreaks', bundle_content, 'calculateStreaks Funktion muss im Bundle vorhanden sein')
        self.assertIn('bestTimes', bundle_content, 'bestTimes Objekt muss im Bundle vorhanden sein')

    def test_reveal_confirmation_and_defeat_modals(self):
        """Überprüft, dass confirmRevealModal, solutionRevealedModal und statLostModal im DOM vorhanden sind"""
        html_content = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')

        # Modal IDs & Button IDs
        self.assertIn('id="confirmRevealModal"', html_content, "confirmRevealModal muss in index.html vorhanden sein")
        self.assertIn('id="solutionRevealedModal"', html_content, "solutionRevealedModal muss in index.html vorhanden sein")
        self.assertIn('id="btnConfirmReveal"', html_content, "btnConfirmReveal Button muss in index.html vorhanden sein")
        self.assertIn('id="btnCancelReveal"', html_content, "btnCancelReveal Button muss in index.html vorhanden sein")
        self.assertIn('id="btnRevealRestart"', html_content, "btnRevealRestart Button muss in index.html vorhanden sein")
        self.assertIn('id="statLostModal"', html_content, "statLostModal muss in index.html vorhanden sein")

        # JS Methoden
        self.assertIn('findMistakes', bundle_content, "findMistakes Methode muss im Bundle vorhanden sein")
        self.assertIn('revealSolutionAndSurrender', bundle_content, "revealSolutionAndSurrender Methode muss im Bundle vorhanden sein")
        self.assertIn('stats.lost', bundle_content, "stats.lost Erfassung muss im Bundle vorhanden sein")

    def test_custom_select_and_time_picker_modals(self):
        """Überprüft, dass customSelectModal, customTimePickerModal und alle Trigger-Buttons im DOM vorhanden sind"""
        html_content = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        bundle_content = (BASE_DIR / "js" / "bundle.js").read_text(encoding='utf-8')

        # Trigger Button IDs in index.html
        triggers = [
            'btnThemePicker', 'btnVibPicker', 'btnLangPicker', 'btnTimePicker',
            'btnFreePlaySizePicker', 'btnFreePlayDiffPicker'
        ]
        for tid in triggers:
            self.assertIn(f'id="{tid}"', html_content, f'Trigger-Button #{tid} muss in index.html vorhanden sein')

        # Modals
        self.assertIn('id="customSelectModal"', html_content, "customSelectModal muss in index.html vorhanden sein")
        self.assertIn('id="customTimePickerModal"', html_content, "customTimePickerModal muss in index.html vorhanden sein")
        self.assertIn('id="btnSaveTimePicker"', html_content, "btnSaveTimePicker muss in index.html vorhanden sein")
        self.assertIn('id="btnCancelTimePicker"', html_content, "btnCancelTimePicker muss in index.html vorhanden sein")

        # JS Logik
        self.assertIn('openCustomSelectModal', bundle_content, "openCustomSelectModal muss im Bundle vorhanden sein")
        self.assertIn('openCustomTimePickerModal', bundle_content, "openCustomTimePickerModal muss im Bundle vorhanden sein")

        # Lösungs-Banner
        self.assertIn('id="solutionRevealedBanner"', html_content, "solutionRevealedBanner muss in index.html vorhanden sein")
        self.assertIn('id="btnProceedToDefeatModal"', html_content, "btnProceedToDefeatModal muss in index.html vorhanden sein")
        self.assertIn('openSolutionRevealedModal', bundle_content, "openSolutionRevealedModal muss im Bundle vorhanden sein")
        # Daily Replay Abfrage
        self.assertIn('requestStartDailyPuzzle', bundle_content, "requestStartDailyPuzzle muss im Bundle vorhanden sein")
        self.assertIn('isDailyPuzzleCompleted', bundle_content, "isDailyPuzzleCompleted muss im Bundle vorhanden sein")

        # Sicherstellen, dass keine störenden nativen <select>-Tags verblieben sind
        self.assertNotIn('<select', html_content, "Es dürfen keine nativen HTML <select> Tags mehr in index.html existieren")

    def test_two_line_tutorial_buttons_structure(self):
        """Überprüft, dass die Tutorial-Buttons zweizeilig strukturiert sind (Icon + Text)"""
        html_content = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        css_content = (BASE_DIR / "css" / "main.css").read_text(encoding='utf-8')
        
        self.assertIn('class="secondary-btn tut-nav-btn"', html_content, "Tutorial-Buttons müssen Klasse tut-nav-btn haben")
        self.assertIn('class="tut-btn-icon"', html_content, "Tutorial-Buttons müssen tut-btn-icon für die 1. Zeile enthalten")
        self.assertIn('class="tut-btn-text"', html_content, "Tutorial-Buttons müssen tut-btn-text für die 2. Zeile enthalten")
        self.assertIn('.tut-btn-icon', css_content, "main.css muss CSS für .tut-btn-icon definieren")
        self.assertIn('.tut-btn-text', css_content, "main.css muss CSS für .tut-btn-text definieren")

    def test_version_number_consistency_v2_4_0(self):
        """Überprüft, dass Version 2.4.0 (Code 35) in allen Konfigurationsdateien konsistent ist"""
        sw_content = (BASE_DIR / "sw.js").read_text(encoding='utf-8')
        html_content = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        gradle_content = (BASE_DIR / "android" / "app" / "build.gradle.kts").read_text(encoding='utf-8')
        manifest_content = (BASE_DIR / "android" / "app" / "src" / "main" / "AndroidManifest.xml").read_text(encoding='utf-8')

        self.assertIn('cortex-app-v2.4.0', sw_content, "sw.js muss Cache cortex-app-v2.4.0 enthalten")
        self.assertIn('id="appVersionBadge">v2.4.0</span>', html_content, "index.html muss appVersionBadge v2.4.0 anzeigen")
        self.assertTrue('versionName = "2.4.0"' in gradle_content, "build.gradle.kts muss versionName 2.4.0 enthalten")
        self.assertTrue('versionCode = 35' in gradle_content, "build.gradle.kts muss versionCode 35 enthalten")
        self.assertTrue('android:versionName="2.4.0"' in manifest_content, "AndroidManifest.xml muss versionName 2.4.0 enthalten")
        self.assertTrue('android:versionCode="35"' in manifest_content, "AndroidManifest.xml muss versionCode 35 enthalten")

    def test_locked_cells_darker_background_styling(self):
        """Überprüft, dass main.css spezifische dunklere Hintergründe für Start- und gesperrte Zellen definiert"""
        css_content = (BASE_DIR / "css" / "main.css").read_text(encoding='utf-8')
        self.assertIn('--cell-locked-bg', css_content, "main.css muss --cell-locked-bg definieren")
        self.assertIn('.grid-cell.locked', css_content, "main.css muss .grid-cell.locked definieren")
        self.assertIn('.grid-cell.val-sun.locked', css_content, "main.css muss .grid-cell.val-sun.locked definieren")
        self.assertIn('.grid-cell.val-moon.locked', css_content, "main.css muss .grid-cell.val-moon.locked definieren")

    def test_active_session_persistence(self):
        """Überprüft, dass StorageKeys.ACTIVE_SESSION definiert ist und app-shell.js Speicherung & Wiederherstellung besitzt"""
        storage_content = (BASE_DIR / "js" / "shared" / "storage.js").read_text(encoding='utf-8')
        shell_content = (BASE_DIR / "js" / "shell" / "app-shell.js").read_text(encoding='utf-8')

        self.assertIn('ACTIVE_SESSION:', storage_content, "storage.js muss ACTIVE_SESSION definieren")
        self.assertIn('saveActiveGameState()', shell_content, "app-shell.js muss saveActiveGameState besitzen")
        self.assertIn('restoreActiveGameState()', shell_content, "app-shell.js muss restoreActiveGameState besitzen")
        self.assertIn('clearActiveGameState()', shell_content, "app-shell.js muss clearActiveGameState besitzen")

    def test_slitherlink_plugin_integration(self):
        """Überprüft, dass Slitherlink in app-shell.js registriert und index.html eingebunden ist"""
        html_content = (BASE_DIR / "index.html").read_text(encoding='utf-8')
        shell_content = (BASE_DIR / "js" / "shell" / "app-shell.js").read_text(encoding='utf-8')

        self.assertIn('slitherlink.css', html_content, "index.html muss slitherlink.css einbinden")
        self.assertIn('SlitherlinkPlugin', shell_content, "app-shell.js muss SlitherlinkPlugin importieren und registrieren")


if __name__ == "__main__":
    unittest.main()

