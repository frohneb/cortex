---
trigger: always_on
---

# Regel: Versionierung vor jedem Upload / Push

1. **Jede Änderung erfordert eine neue Versionsnummer**:
   - Erhöhe bei jedem Build die letzte Stelle der Versionsnummer an allen Positionen.
   - `index.html`: `#appVersionBadge` Text
   - `sw.js`: `CACHE_NAME` (z.B. `tango-app-vX.Y.Z`)
   - `android/app/build.gradle.kts`: `versionCode` (+1) und `versionName` ("X.Y.Z")
   - `android/app/src/main/AndroidManifest.xml`: `android:versionCode` und `android:versionName`
   - `README.md`: Versions-Badge
   - `test_app_dom.py`: Konsistenzprüfung für die neue Version anpassen

2. **Anpassen der Readme**:
   - Frage mich ob du das Readme aktualisieren sollst
   - Ergänze das Changelog im Readme

3. **Sicherheits- und Datenschutzprüfung**:
   - Führe eine intensive und tiefe Sicherheits- und Datenschutzprüfung durch
   - `python build_bundle.py`
   - `python build_apk.py`
   - `python -m unittest test_app_dom.py test_rules.py test_streak_logic.py test_hint_and_defeat_logic.py`
   - `python test_security_deep.py`
   - Speichere das Ergebnis in Security.md

4. **Verifikation vor jedem Push**:
   - Lade das Projekt auf GitHub hoch
