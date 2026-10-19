# 📱 Anleitung: Cortex auf deinem Android-Handy installieren

Dieses Projekt ist **100 % werbefrei, offline-fähig und vollständig auf Deutsch übersetzt**. Du hast mehrere komfortable Möglichkeiten, das Spiel auf deinem Android-Handy zu nutzen:

---

## 🚀 Option 1: Sofortige Installation als App (PWA – Empfohlen!)

Du musst keine komplizierte APK kompilieren. Die App nutzt moderne **Progressive Web App (PWA)** Technologie inklusive Service Worker. Einmal auf dem Handy aufgerufen, funktioniert sie wie jede vollwertige native App ohne Browserleiste und komplett offline.

### Schritt-für-Schritt:
1. **Lokalen Server auf deinem PC starten:**
   Öffne ein Terminal im Projektordner `d:\Cortex` und tippe:
   ```bash
   python -m http.server 8080 --bind 0.0.0.0
   ```
2. **IP-Adresse deines PCs herausfinden:**
   Gib im Terminal `ipconfig` ein (z. B. `192.168.178.50`).
3. **Auf dem Android-Smartphone öffnen:**
   - Verbinde dein Smartphone mit demselben WLAN wie deinen PC.
   - Öffne **Google Chrome** oder **Samsung Internet** auf dem Handy.
   - Rufe die Adresse auf: `http://DEINE-PC-IP:8080` (z. B. `http://192.168.178.50:8080`).
4. **Als App installieren:**
   - Tippe in Chrome auf das **Drei-Punkte-Menü (⋮)** oben rechts.
   - Wähle **"App installieren"** oder **"Zum Startbildschirm hinzufügen"**.
   - Die Cortex-App erscheint nun mit eigenem Icon auf deinem Homescreen, öffnet sich im Vollbildmodus und läuft **vollständig offline**!

---

## 🛠️ Option 2: Echte APK erstellen & installieren

Falls du eine eigenständige `.apk`-Datei auf deinem Smartphone installieren möchtest:

### Variante A: Vollautomatischer Build per Python-Skript (Empfohlen)
Im Projekt ist ein vollständiges Build-System integriert, das die APK direkt ohne Android Studio baut:
1. **Web-Bundle erstellen:**
   ```bash
   python build_bundle.py
   ```
2. **APK kompilieren und signieren:**
   ```bash
   python build_apk.py
   ```
   Die fertige `Cortex.apk` liegt anschließend direkt im Projektordner.
3. **Auf dem Smartphone installieren:**
   - Entweder per USB via ADB:
     ```bash
     adb install Cortex.apk
     ```
   - Oder übertrage die `Cortex.apk` per USB-Kabel / Nachricht auf dein Smartphone und tippe die Datei im Dateimanager an.

### Variante B: Manuell über Android Studio
1. **Android Studio öffnen:**
   - Wähle *File -> Open* und öffne den Ordner `android/` (z. B. `d:\Cortex\android`).
2. **Web-Assets vorbereiten:**
   - Führe zuvor `python build_bundle.py` aus.
   - Die Web-Dateien (`index.html`, `css/`, `js/bundle.js`, `assets/`, `manifest.json`) liegen unter `android/app/src/main/assets/`.
3. **APK erstellen:**
   - Klicke im Menü auf **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
   - Die fertige `.apk` liegt anschließend unter `android/app/build/outputs/apk/debug/app-debug.apk`.
4. **Auf dem Handy installieren:**
   - Übertrage die `.apk` per USB-Kabel oder Nachricht auf dein Handy und tippe sie an, um sie zu installieren.

---

## 🚗 Option 3: Cortex in Android Auto nutzen („Play While Parked“)

Da Cortex als native APK manuell installiert wird (Sideloading) und nicht über den Google Play Store stammt, blendet Google die App in Android Auto standardmäßig aus Sicherheitsgründen aus.

### Schritt-für-Schritt Freischaltung auf dem Smartphone:
1. **Android Auto Einstellungen öffnen:**
   - Gehe auf deinem Smartphone in die **Einstellungen** und suche nach **Android Auto** (oder unter *Verbundene Geräte -> Android Auto*).
2. **Entwicklermodus freischalten:**
   - Scrolle ganz nach unten zum Eintrag **Version** (bzw. *Versions- und Berechtigungsinformationen*).
   - Tippe **10-mal schnell hintereinander** auf die Versionszeile, bis der Dialog *„Entwicklereinstellungen aktivieren?“* erscheint.
   - Bestätige mit **OK**.
3. **Unbekannte Quellen aktivieren:**
   - Tippe oben rechts auf das **Drei-Punkte-Menü (⋮)** und wähle **Entwicklereinstellungen**.
   - Setze den Haken bei **„Unbekannte Quellen“** (Unknown sources).
4. **App-Launcher überprüfen:**
   - Gehe in den Android Auto Einstellungen auf **„App-Launcher anpassen“**.
   - Stelle sicher, dass bei **Cortex** ein Haken gesetzt ist.
5. **Mit dem Auto verbinden:**
   - Verbinde dein Smartphone per USB oder kabellos mit deinem Auto.
   - **Wichtig**: Spiele sind als *Parked Apps* konzipiert und werden nur bei **stehendem / geparktem Fahrzeug** (Handbremse angezogen bzw. Getriebestufe P) im Fahrzeug-Display angezeigt (unterstützt ab Android 15).

---

## 🧪 Automatisierte Tests ausführen

Cortex verfügt über eine lückenlose Test-Suite für Regelkonformität, Plattformstabilität und Sicherheit:

1. **Kern- und Plattform-Tests:**
   ```bash
   python -m unittest test_app_dom.py test_rules.py test_streak_logic.py test_hint_and_defeat_logic.py test_cr_cs_guidelines.py
   ```
2. **Sicherheits- & Deep-Scan-Audit (74 automatische Prüfungen):**
   ```bash
   python test_security_deep.py
   ```
3. **Einzeltests für alle Rätseltypen (Tango, Sudoku, Akari, Nonogramm, Slitherlink, Minesweeper, Crowns, Hashi & Futoshiki):**
   ```bash
   python -m unittest test_rules.py test_sudoku.py test_akari.py test_nonogram.py test_slitherlink.py test_minesweeper.py test_crowns.py test_hashi_futoshiki_phases.py test_cortex_plugins.py
   ```
