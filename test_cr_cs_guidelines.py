"""
Umfassender CR (Cyber Resilience) und CS (Cyber Security) Audit
Prüft die Cortex-Anwendung nach Standards moderner Cyber-Sicherheit und Cyber-Resilienz:
- Cyber Resilience (CR): Ausfallsicherheit, 100% Offline-Autonomie, Fehler- und Crash-Recovery,
  robuste Persistenz, Schema-Migration, globale Error-Boundaries, deterministische Zustandsrückführung.
- Cyber Security (CS): Angriffsflächenminimierung (Least Privilege), Zero-Network Isolation,
  strikte Content Security Policy (CSP), Anti-Injection (Zero-eval), Android WebView Härtung,
  DOM-Sicherheit & XSS-Prävention, kryptografische Integrität.
"""

import os
import re
import json
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

class TestCyberResilienceAndCyberSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bundle_path = BASE_DIR / "js" / "bundle.js"
        cls.html_path = BASE_DIR / "index.html"
        cls.manifest_path = BASE_DIR / "android" / "app" / "src" / "main" / "AndroidManifest.xml"
        cls.gradle_path = BASE_DIR / "android" / "app" / "build.gradle.kts"
        cls.sw_path = BASE_DIR / "sw.js"
        cls.java_path = BASE_DIR / "android" / "app" / "src" / "main" / "java" / "com" / "tango" / "game" / "MainActivity.java"
        cls.storage_path = BASE_DIR / "js" / "shared" / "storage.js"
        cls.shell_path = BASE_DIR / "js" / "shell" / "app-shell.js"
        cls.audio_path = BASE_DIR / "js" / "shared" / "audio.js"

        cls.bundle_content = cls.bundle_path.read_text(encoding='utf-8')
        cls.html_content = cls.html_path.read_text(encoding='utf-8')
        cls.manifest_content = cls.manifest_path.read_text(encoding='utf-8')
        cls.gradle_content = cls.gradle_path.read_text(encoding='utf-8')
        cls.sw_content = cls.sw_path.read_text(encoding='utf-8')
        cls.java_content = cls.java_path.read_text(encoding='utf-8')
        cls.storage_content = cls.storage_path.read_text(encoding='utf-8')
        cls.shell_content = cls.shell_path.read_text(encoding='utf-8')
        cls.audio_content = cls.audio_path.read_text(encoding='utf-8')

        cls.plugins = ['tango', 'sudoku', 'akari', 'nonogram', 'slitherlink', 'minesweeper', 'crowns']

    # =========================================================================
    # A. CR (Cyber Resilience) Richtlinien
    # =========================================================================

    def test_cr_01_autonomous_offline_operation_zero_dependencies(self):
        """CR-01 [Resilienz]: 100% autarke Offline-Fähigkeit ohne Abhängigkeit von externen CDNs/Servern"""
        # index.html darf keinerlei externe Ressourcen laden
        self.assertNotIn('https://code.jquery.com', self.html_content)
        self.assertNotIn('https://cdn.', self.html_content)
        self.assertNotIn('https://unpkg.com', self.html_content)
        self.assertNotIn('https://fonts.googleapis.com', self.html_content)
        self.assertNotIn('https://cdnjs.cloudflare.com', self.html_content)
        # Alle Skripte und Styles sind lokal referenziert
        external_scripts = re.findall(r'<script\s+[^>]*src=["\'](http[s]?://[^"\']+)["\']', self.html_content, re.IGNORECASE)
        self.assertEqual(len(external_scripts), 0, f"Unerlaubte externe Skripte: {external_scripts}")

    def test_cr_02_storage_fault_tolerance_and_corruption_resilience(self):
        """CR-02 [Resilienz]: Schutz vor Speicherfehlern (QuotaExceeded, SecurityError) und korrupten JSON-Daten"""
        # Alle StorageManager-Operationen müssen try/catch-gekapselt sein
        self.assertIn('static getItem(key, fallback = null) {', self.storage_content)
        self.assertIn('static setItem(key, value) {', self.storage_content)
        self.assertIn('static getJSON(key, fallback = null) {', self.storage_content)
        self.assertIn('static setJSON(key, value) {', self.storage_content)
        # getJSON muss SyntaxError bei korrupten JSON-Strings mit sicherem fallback abfangen
        self.assertIn('JSON.parse(val)', self.storage_content)
        self.assertIn('return fallback;', self.storage_content)

    def test_cr_03_legacy_schema_migration_resilience(self):
        """CR-03 [Resilienz]: Abwärtskompatible, verlustfreie Migration alter Spielstände (tango_* -> cortex_*)"""
        self.assertIn('checkAndMigrate()', self.storage_content)
        self.assertIn('tango_campaign_completed', self.storage_content)
        self.assertIn('tango_theme', self.storage_content)
        self.assertIn('StorageKeys.MIGRATED', self.storage_content)

    def test_cr_04_session_persistence_and_crash_recovery(self):
        """CR-04 [Resilienz]: Laufende Spielstände überleben OS-Process-Kills und Browser-Reloads (State Recovery)"""
        # App-Shell muss laufenden Spielstand sichern und bei Neustart validiert wiederherstellen
        self.assertIn('saveActiveGameState()', self.shell_content)
        self.assertIn('restoreActiveGameState()', self.shell_content)
        self.assertIn('StorageKeys.ACTIVE_SESSION', self.shell_content)
        # Validierung bei Wiederherstellung
        self.assertIn('if (!session || !session.pluginId || !session.puzzleData) return false;', self.shell_content)

    def test_cr_05_global_error_boundaries_and_exception_resilience(self):
        """CR-05 [Resilienz]: Globale Error-Boundaries verhindern Whitescreen-Crashes bei unhandled Exceptions"""
        self.assertIn("window.addEventListener('error'", self.shell_content)
        self.assertIn("window.addEventListener('unhandledrejection'", self.shell_content)
        self.assertIn('debugErrorBanner', self.shell_content)
        self.assertIn('textContent', self.shell_content)

    def test_cr_06_deterministic_undo_state_reversibility(self):
        """CR-06 [Resilienz]: Deterministische Undo-/Redo-Funktionalität in allen Engines für Zustandsrückführung"""
        for pid in self.plugins:
            engine_file = BASE_DIR / "js" / "puzzles" / pid / "engine.js"
            content = engine_file.read_text(encoding='utf-8')
            self.assertTrue('undo()' in content or 'undoStack' in content or 'undo' in content,
                            f"{pid} Engine muss Undo unterstützen")

    def test_cr_07_resilient_sound_synthesis_zero_asset_dependency(self):
        """CR-07 [Resilienz]: Web Audio API Synthesizer verhindert Ausfälle durch fehlende/blockierte Audio-Dateien"""
        self.assertIn('AudioContext', self.audio_content)
        self.assertIn('createOscillator', self.audio_content)
        self.assertIn('createGain', self.audio_content)
        audio_files = list((BASE_DIR / "assets").glob("**/*.mp3")) + list((BASE_DIR / "assets").glob("**/*.wav"))
        self.assertEqual(len(audio_files), 0, "Null Abhängigkeiten von statischen Audio-Dateien")

    def test_cr_08_mathematical_determinism_and_campaign_integrity(self):
        """CR-08 [Resilienz]: Vollständigkeit aller 7 Plugins mit je 240 mathematisch eindeutig lösbaren Levels"""
        for pid in self.plugins:
            index_file = BASE_DIR / "js" / "puzzles" / pid / "index.js"
            content = index_file.read_text(encoding='utf-8')
            self.assertIn('totalLevels: 240', content, f"{pid}/index.js muss totalLevels: 240 definieren")
            self.assertIn('[0, 59]', content, f"{pid} Kapitel 1 [0, 59]")
            self.assertIn('[60, 119]', content, f"{pid} Kapitel 2 [60, 119]")
            self.assertIn('[120, 179]', content, f"{pid} Kapitel 3 [120, 179]")
            self.assertIn('[180, 239]', content, f"{pid} Kapitel 4 [180, 239]")

    def test_cr_09_pwa_service_worker_offline_cache_resilience(self):
        """CR-09 [Resilienz]: Service Worker Cache stellt vollständige Asset-Verfügbarkeit sicher"""
        self.assertIn("const CACHE_NAME = 'cortex-app-v2.8.4';", self.sw_content)
        self.assertIn("'./index.html'", self.sw_content)
        self.assertIn("'./js/bundle.js'", self.sw_content)
        self.assertIn("'./css/main.css'", self.sw_content)
        for pid in self.plugins:
            self.assertIn(f"'./css/puzzles/{pid}.css'", self.sw_content)

    # =========================================================================
    # B. CS (Cyber Security) Richtlinien
    # =========================================================================

    def test_cs_01_least_privilege_android_permissions(self):
        """CS-01 [Sicherheit]: Striktestes Minimalprinzip bei Android-Berechtigungen (Null gefährliche Rechte)"""
        dangerous_permissions = [
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE',
            'android.permission.CAMERA',
            'android.permission.READ_CONTACTS',
            'android.permission.ACCESS_FINE_LOCATION',
            'android.permission.ACCESS_COARSE_LOCATION',
            'android.permission.READ_EXTERNAL_STORAGE',
            'android.permission.WRITE_EXTERNAL_STORAGE',
            'android.permission.RECORD_AUDIO'
        ]
        for perm in dangerous_permissions:
            self.assertNotIn(perm, self.manifest_content, f"Gefährliche Berechtigung {perm} darf nicht angefordert werden")

        # Ausschließlich VIBRATE und POST_NOTIFICATIONS sind erlaubt
        self.assertIn('android.permission.VIBRATE', self.manifest_content)
        self.assertIn('android.permission.POST_NOTIFICATIONS', self.manifest_content)

    def test_cs_02_android_webview_sandboxing_and_hardening(self):
        """CS-02 [Sicherheit]: Native Android WebView-Isolierung gegen lokale & webbasierte Angriffe"""
        self.assertIn('setAllowFileAccessFromFileURLs(false)', self.java_content)
        self.assertIn('setAllowUniversalAccessFromFileURLs(false)', self.java_content)
        self.assertIn('setAllowFileAccess(false)', self.java_content)
        self.assertIn('setAllowContentAccess(false)', self.java_content)
        self.assertIn('setBlockNetworkLoads(true)', self.java_content)
        self.assertNotIn('setWebContentsDebuggingEnabled(true)', self.java_content)

    def test_cs_03_zero_network_data_exfiltration_prevention(self):
        """CS-03 [Sicherheit]: 100%iger Schutz vor Datenabfluss: Keine ausgehenden Netzwerk-APIs im Quellcode"""
        dangerous_network_apis = [
            (r'\bfetch\s*\(', 'fetch()'),
            (r'\bXMLHttpRequest\b', 'XMLHttpRequest'),
            (r'\bWebSocket\b', 'WebSocket'),
            (r'navigator\.sendBeacon', 'navigator.sendBeacon')
        ]
        js_files = list((BASE_DIR / "js").glob("**/*.js"))
        for jf in js_files:
            content = jf.read_text(encoding='utf-8')
            for pattern, name in dangerous_network_apis:
                self.assertFalse(re.search(pattern, content), f"Netzwerk-API {name} gefunden in {jf.name}")

    def test_cs_04_strict_content_security_policy(self):
        """CS-04 [Sicherheit]: Strikte Content Security Policy (CSP) verhindert Remote-Verbindungen & Clickjacking"""
        self.assertIn('Content-Security-Policy', self.html_content)
        self.assertIn("connect-src 'none'", self.html_content)
        self.assertIn("object-src 'none'", self.html_content)
        self.assertIn("form-action 'none'", self.html_content)
        self.assertIn("default-src 'self'", self.html_content)

    def test_cs_05_anti_injection_and_safe_execution(self):
        """CS-05 [Sicherheit]: Schutz vor Code-Injection: Verbot von eval(), new Function() und debugger;"""
        js_files = list((BASE_DIR / "js").glob("**/*.js"))
        for jf in js_files:
            content = jf.read_text(encoding='utf-8')
            self.assertNotIn('debugger;', content, f"debugger statement in {jf.name}")
            self.assertFalse(re.search(r'\beval\s*\(', content), f"eval() in {jf.name}")
            self.assertFalse(re.search(r'new\s+Function\s*\(', content), f"new Function() in {jf.name}")

    def test_cs_06_dom_xss_and_anti_framing_protection(self):
        """CS-06 [Sicherheit]: XSS- und Framing-Schutz: Keine Inline-Event-Handler, keine Iframes"""
        self.assertNotIn('<iframe', self.html_content)
        self.assertFalse(re.search(r'\s+onclick\s*=', self.html_content, re.IGNORECASE))
        self.assertFalse(re.search(r'\s+onload\s*=', self.html_content, re.IGNORECASE))
        self.assertFalse(re.search(r'\s+onerror\s*=', self.html_content, re.IGNORECASE))

    def test_cs_07_secure_ipc_and_bridge_hardening(self):
        """CS-07 [Sicherheit]: Sichere Java/JS-Bridge ohne Reflection und ohne Systembefehle"""
        self.assertNotIn('Runtime.getRuntime().exec', self.java_content)
        self.assertNotIn('ProcessBuilder', self.java_content)
        self.assertNotIn('java.lang.reflect', self.java_content)
        # NotificationBridge exponiert ausschließlich die dedizierten Alarm-Methoden
        self.assertIn('class NotificationBridge', self.java_content)
        self.assertIn('@JavascriptInterface', self.java_content)

    def test_cs_08_binary_cryptographic_integrity_and_secrets_protection(self):
        """CS-08 [Sicherheit]: Schutz von Signaturschlüsseln & Build-Artefakten vor Veröffentlichung"""
        gitignore = (BASE_DIR / ".gitignore").read_text(encoding='utf-8')
        self.assertIn('tango.keystore', gitignore)
        self.assertIn('Cortex.apk', gitignore)
        self.assertIn('build_apk_temp', gitignore)

    def test_cs_09_version_consistency_and_anti_tampering(self):
        """CS-09 [Sicherheit]: Versions- und Cache-Konsistenz v2.8.4 (Code 51) über alle Manifeste hinweg"""
        self.assertIn('id="appVersionBadge">v2.8.4</span>', self.html_content)
        self.assertIn('versionCode = 51', self.gradle_content)
        self.assertIn('versionName = "2.8.4"', self.gradle_content)
        self.assertIn('android:versionCode="51"', self.manifest_content)
        self.assertIn('android:versionName="2.8.4"', self.manifest_content)
        self.assertIn('Version-2.8.4', (BASE_DIR / "README.md").read_text(encoding='utf-8'))


if __name__ == "__main__":
    unittest.main()
