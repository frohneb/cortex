# Tango – Logikrätsel für Android & Web (Werbefrei & 100% Offline)

[![Version](https://img.shields.io/badge/Version-1.1.4-brightgreen.svg)](https://github.com/frohneb/tango)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline-100%25-orange.svg)](#)
[![Werbefrei](https://img.shields.io/badge/Ads-0%25%20Werbefrei-success.svg)](#)

Eine moderne, elegante und werbefreie Offline-Implementierung des beliebten Logik-Puzzles **Tango** (Takuzu / Binairo / Binoxxo) mit vollständiger deutscher und englischer Lokalisierung, interaktiven Tutorials, intelligentem Hinweis-System, pünktlichen System-Erinnerungen und optimiertem Touch-Layout für Android-Smartphones.

---

## ✨ Features

- 🚫 **100 % Werbefrei & Offline**: Keine Werbung, keine In-App-Käufe, kein Tracking, keine unnötigen Berechtigungen (kein Internet-Zugriff erforderlich).
- 🌐 **Zweisprachig (DE / EN)**: Vollständige Lokalisierung aller Texte, Regeln und Dialoge auf Deutsch und Englisch.
- 🎓 **Interaktive Tutorials**:
  - **Grundlagen-Tutorial (6 Schritte)**: Schritt-für-Schritt-Einführung in Sonnen (☀️), Monde (🌙), die 3er-Regel, Balance sowie Gleichheit (`=`) und Gegenteil (`×`).
  - **Tutorial Pro**: Vertiefende Profi-Techniken (Zeilen-/Spalten-Deduktion, Eindeutigkeitsregel).
- 🏆 **Umfangreiche Kampagne**: 120 handgefertigte Logikrätsel, gegliedert in 4 Kapitel (von 4×4 über 6×6 und 8×8 bis 10×10) mit Fortschritts- und Sterne-Speicherung.
- 📅 **Tägliches Rätsel (Daily Tango)**:
  - Jeden Tag ein neues, synchron generiertes Tagesrätsel.
  - Tägliche Serie (Streak-Zähler) und separate Bestzeiten je Gittergröße (4×4, 6×6, 8×8, 10×10).
  - Sicherheitsabfrage bei erneutem Starten eines bereits gelösten Tagesrätsels.
- 🎲 **Freies Spiel (Endlos-Generator)**:
  - Generiert beliebig viele eindeutig lösbare Rätsel für Gittergrößen von 4×4 bis 10×10 in den Schwierigkeitsstufen *Einfach*, *Mittel* und *Schwer*.
  - Nach Abschluss gelangt man per „Weiter“-Klick direkt zurück zur Auswahl des nächsten freien Spiels.
- 💡 **Intelligenter Hinweis-Assistent & Lösungsaufdeckung**:
  - **Priorisierte Fehlerprüfung**: Erkennt fehlerhaft gesetzte Symbole vorab und markiert den genauen Regelverstoß.
  - **Logische Hinweise**: Erklärt Schritt für Schritt, *warum* ein Symbol zwingend gesetzt werden muss.
  - **Lösungsaufdeckung**: Nach 3 verbrauchten Hinweisen kann die vollständige Lösung freigeschaltet werden (mit Sicherheitsabfrage). Fehler werden rot markiert, die Lösung als Geistersymbole hinterlegt und der Spieler kann das gelöste Spielfeld unbegrenzt in Ruhe analysieren, bevor er auf „Weiter“ tippt.
- 🎨 **5 Theming-Designs & maßgeschneiderte In-Game Dialoge**:
  - *Modern Dark*, *AMOLED Schwarz*, *Clean Light*, *Warmes Holz* und *Cyberpunk Neon*.
  - Eigene Menü-Dropdowns und digitaler 24h-Zeitwähler im Spieldesign (keine störenden nativen Systemdialoge).
- ⏰ **Pünktliche Systemerinnerungen**:
  - Nutzt unter Android `AlarmManager.setAlarmClock`, um tägliche Erinnerungen zur eingestellten Wunschuhrzeit sekundengenau auszulösen (ohne Verzögerungen durch den Android Doze-Modus).
- 🔊 **Sound & Haptik**:
  - Angenehmes Synthesizer-Audio und 3 einstellbare Vibrationsstufen (Sanft, Mittel, Stark).

---

## 🎮 Spielregeln

1. **Keine 3er-Reihen**: Höchstens zwei gleiche Symbole (☀️☀️ oder 🌙🌙) dürfen waagerecht oder senkrecht aufeinanderfolgen.
2. **Balance**: Jede Zeile und jede Spalte enthält exakt gleich viele Sonnen wie Monde (z. B. 3 Sonnen und 3 Monde bei 6×6).
3. **Gleichheitszeichen `=`**: Verbundene Nachbarzellen müssen dasselbe Symbol tragen (☀️ = ☀️ bzw. 🌙 = 🌙).
4. **Gegenteilszeichen `×`**: Verbundene Nachbarzellen müssen unterschiedliche Symbole tragen (☀️ × 🌙).
5. **Eindeutigkeit**: Keine zwei Zeilen und keine zwei Spalten dürfen vollständig identisch sein.

---

## 🧪 Automatisierte Test-Suite

Das Projekt verfügt über ein umfassendes Test- und Sicherheitsframework:

```bash
# 1. Alle Unit- und DOM-Tests ausführen
python -m unittest test_app_dom.py test_rules.py test_streak_logic.py test_hint_and_defeat_logic.py

# 2. Tiefen-Sicherheitsaudit (73 Prüfungen: Permissions, CSP, XSS, APK-Integrität)
python test_security_deep.py
```

---

## 📱 Build & APK-Erstellung

Die native Offline-APK wird über das integrierte Build-Skript kompiliert und signiert:

```bash
# Web-Bundle erzeugen
python build_bundle.py

# Native Android-APK kompilieren und signieren
python build_apk.py
```

Die fertige Datei liegt anschließend als **`Tango.apk`** im Hauptverzeichnis vor.

---

## 📄 Lizenz
 
Dieses Projekt ist unter der [GNU General Public License v3.0 (GPLv3)](LICENSE) lizenziert.
