# Regel: Versionierung vor jedem Upload / Push

1. **Jede Änderung erfordert eine neue Versionsnummer**:
   - Es wird niemals ein Stand auf GitHub hochgeladen (`git push`) oder als Release gebaut, ohne dass zuvor die Versionsnummer und der `versionCode` erhöht wurden.

2. **Synchronisierte Dateien bei jedem Versionssprung**:
   - `index.html`: `#appVersionBadge` Text
   - `sw.js`: `CACHE_NAME` (z.B. `tango-app-vX.Y.Z`)
   - `android/app/build.gradle.kts`: `versionCode` (+1) und `versionName` ("X.Y.Z")
   - `android/app/src/main/AndroidManifest.xml`: `android:versionCode` und `android:versionName`
   - `README.md`: Versions-Badge
   - `test_app_dom.py`: Konsistenzprüfung für die neue Version anpassen

3. **Verifikation vor jedem Push**:
   - `python build_bundle.py`
   - `python build_apk.py`
   - `python -m unittest test_app_dom.py test_rules.py test_streak_logic.py test_hint_and_defeat_logic.py`
   - `python test_security_deep.py`
