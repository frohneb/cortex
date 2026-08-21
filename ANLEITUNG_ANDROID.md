# 📱 Anleitung: Tango auf deinem Android-Handy installieren

Dieses Projekt ist **100 % werbefrei, offline-fähig und vollständig auf Deutsch übersetzt**. Du hast zwei komfortable Möglichkeiten, das Spiel auf deinem Android-Handy zu nutzen:

---

## 🚀 Option 1: Sofortige Installation als App (PWA – Empfohlen!)

Du musst keine komplizierte APK kompilieren. Die App nutzt moderne **Progressive Web App (PWA)** Technologie inklusive Service Worker. Einmal auf dem Handy aufgerufen, funktioniert sie wie jede vollwertige native App ohne Browserleiste und komplett offline.

### Schritt-für-Schritt:
1. **Lokalen Server auf deinem PC starten:**
   Öffne ein Terminal im Projektordner `d:\Tango apk` und tippe:
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
   - Die Tango-App erscheint nun mit eigenem Icon auf deinem Homescreen, öffnet sich im Vollbildmodus und läuft **vollständig offline**!

---

## 🛠️ Option 2: Echte APK kompilieren mit Android Studio

Falls du eine `.apk`-Datei erstellen möchtest:

1. **Android Studio öffnen:**
   - Wähle *File -> Open* und öffne den Ordner `d:\Tango apk\android`.
2. **Web-Assets kopieren:**
   - Kopiere die Dateien (`index.html`, `css/`, `js/`, `assets/`, `manifest.json`) in den Ordner:
     `d:\Tango apk\android\app\src\main\assets\`
3. **APK erstellen:**
   - Klicke im Menü auf **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
   - Die fertige `.apk` liegt anschließend unter `android/app/build/outputs/apk/debug/app-debug.apk`.
4. **Auf dem Handy installieren:**
   - Übertrage die `.apk` per USB-Kabel oder Nachricht auf dein Handy und tippe sie an, um sie zu installieren.

---

## 🧪 Automatisierte Regelüberprüfung ausführen

Um die lückenlose Einhaltung aller Tango-Regeln (Keine 3er-Reihen, Balance, Gleichheits- `=` und Gegenteilszeichen `×`, Solver-Eindeutigkeit) zu testen, führe einfach aus:

```bash
python test_rules.py
```
Alle 8 automatisierten Testfälle laufen in wenigen Millisekunden durch und bestätigen die Regelkonsistenz!
