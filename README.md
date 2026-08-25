# Cortex – Modulare Logikrätsel für Android & Web

[![Version](https://img.shields.io/badge/Version-2.2.2-brightgreen.svg)](https://github.com/frohneb/cortex)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline-100%25-orange.svg)](#)
[![Werbefrei](https://img.shields.io/badge/Ads-0%25%20Werbefrei-success.svg)](#)
[![Security](https://img.shields.io/badge/Security-10.0%2F10%20Perfekt-brightgreen.svg)](SECURITY.md)

Eine moderne, elegante und werbefreie Offline-Plattform für anspruchsvolle Logikrätsel (**Tango**, **Sudoku**, **Akari / Light Up** und **Nonogramm / Picross**) mit vollständiger deutscher und englischer Lokalisierung, interaktiven Tutorials, intelligentem Hinweis-System, Notizen-Modus, pünktlichen System-Erinnerungen und optimiertem Touch-Layout für Android-Smartphones und Web-Browser.

---

## ✨ Features

- 🚫 **100 % Werbefrei & Offline**: Keine Werbung, keine In-App-Käufe, kein Tracking, keine unnötigen Berechtigungen (kein Internet-Zugriff erforderlich).
- 🧩 **Modulare Puzzle-Architektur (Cortex Engine)**:
  - **Tango (Takuzu / Binairo / Binoxxo)**: Größen von 4×4 bis 10×10 mit Sonnen (☀️), Monden (🌙), Gleichheit (`=`) und Gegenteil (`×`).
  - **Sudoku**: Klassisches 9×9 sowie 4×4 (Mini) und 16×16 (Monster-Sudoku) mit passgenauen Blockkammern (2×2, 3×3, 4×4).
  - **Akari (Light Up / Glühbirnen)**: Größen von 6×6 bis 14×14 mit Lichtstrahlen-Glow, Wand-Nachbarschaftszahlen ($0 \dots 4$) und SVG-Glühbirnen (💡).
  - **Nonogramm (Picross / Griddlers)**: Größen von 5×5 bis 15×15 mit Zeilen- & Spalten-Zahlenhinweisen, 5er-Block-Trennern und Pixel-Art-Illustrationen (🖼️).
- 🏆 **Umfangreiche Kampagnen**:
  - Jeweils 120 handgefertigte Kampagnen-Level pro Rätseltyp mit dynamischer Sterne- und Fortschrittsspeicherung (insgesamt 480 Level).
- 📅 **Tägliches Rätsel (Daily Puzzle)**:
  - Jeden Tag ein neues, synchrones Tagesrätsel mit automatischer Puzzle-Rotation und Streak-Zähler.
- 🎲 **Freies Spiel (Endlos-Generator)**:
  - Beliebig viele, deterministisch überprüfte und eindeutig lösbare Rätsel in verschiedenen Größen und Schwierigkeitsgraden (*Einfach*, *Mittel*, *Schwer*).
- 🎓 **Interaktive Tutorials & Lösungsstrategien**:
  - **Tango**: Grundlagen (6 Schritte), Mathematik (8 Lektionen) und Meister-Muster (14 Lektionen).
  - **Sudoku**: Grundlagen (Reihen, Spalten, Blöcke) und Fortgeschrittene Lektionen (*Naked Pairs*, *Hidden Singles*, Block-Interferenzen).
  - **Akari**: Grundlagen (8 Lektionen) und Fortgeschrittene Lektionen (6 Meister-Muster & Wand-Interferenzen).
  - **Nonogramm**: Grundlagen (5 Lektionen: Vollblöcke, Nullzeilen, Überlappungen, Mindestabstände).
- ✏️ **Notizen-Modus (Kandidaten & Entwürfe)**:
  - Ermöglicht das Festhalten von temporären Markierungen und Annahmen direkt auf dem Spielfeld.
- 💡 **Intelligenter Hinweis-Assistent & Lösungsaufdeckung**:
  - Priorisierte Fehlererkennung vorab und schrittweise logische Beweise mit Regel-Erklärungen.
- 🎨 **5 Theming-Designs**:
  - *Modern Dark*, *AMOLED Schwarz*, *Clean Light*, *Warmes Holz* und *Cyberpunk Neon* mit hohem Kontrast und maßgeschneiderten UI-Elementen.
- ⏰ **Präzise Systemerinnerungen**:
  - Nutzt unter Android `AlarmManager.setAlarmClock` zur sekundengenauen Erinnerung ohne Verzögerungen durch den Doze-Modus.

---

## 🎮 Spielregeln

### ☀️ Tango
1. **Keine 3er-Reihen**: Höchstens zwei gleiche Symbole (☀️☀️ oder 🌙🌙) dürfen waagerecht oder senkrecht aufeinanderfolgen.
2. **Balance**: Jede Zeile und jede Spalte enthält exakt gleich viele Sonnen wie Monde.
3. **Gleichheit `=` & Gegenteil `×`**: Verbundene Nachbarzellen müssen identisch (`=`) oder verschieden (`×`) sein.
4. **Eindeutigkeit**: Keine zwei Zeilen oder Spalten dürfen vollständig identisch sein.

### 🔢 Sudoku
1. Jede Ziffer darf in jeder **Zeile**, jeder **Spalte** und jedem **Teilblock** (Kammer) nur genau **einmal** vorkommen.
2. Vorgegebene Startzahlen sind fixiert und heben sich farblich von den Spielereingaben ab.

### 💡 Akari (Light Up)
1. **Vollständige Ausleuchtung**: Platziere Glühlampen (💡) auf weißen Feldern, um jede Zelle horizontal und vertikal bis zu einer schwarzen Wand zu erleuchten.
2. **Kein Blenden**: Zwei Lampen dürfen sich niemals in direkter Sichtlinie gegenseitig anstrahlen.
3. **Wand-Zahlen**: Zahlen auf schwarzen Wänden ($0 \dots 4$) geben die exakte Anzahl orthogonal angrenzender Lampen an.

### 🖼️ Nonogramm (Picross)
1. **Zahlenhinweise**: Zahlen am Rand geben die Längen der aufeinanderfolgenden gefüllten Pixel-Blöcke in jeder Zeile und Spalte an.
2. **Reihenfolge**: Blöcke müssen genau in der vorgegebenen Reihenfolge platziert werden.
3. **Lücken**: Zwischen zwei gefüllten Blöcken muss immer mindestens eine leere Zelle (✕) liegen.

---

## 📜 Changelog

### v2.2.2 – 2026-08-25
* **Kanten- & Rahmenartefakte in Nonogramm behoben**: Bereinigung der Zellkantenlinien, Trennlinien und Eckübergänge für eine gestochen scharfe Gitterdarstellung.
* **Einheitlich pinke Umrandung im Cyberpunk-Theme**: Spielfeldumrandung, Blocktrenner und Hinweisbegrenzungen in einheitlichem Neon-Pink (`#ff007f`) abgestimmt auf Tango, Sudoku und Akari.
* **Zuverlässiges Zurücksetzen im Tagesrätsel**: Trennung von Spielerinteraktion und Aufgabenstellung via `engine.restart()`, sodass beim Neustart alle Zahlenhinweise, Wände und Startsymbole unberührt bleiben.

### v2.2.1 – 2026-08-25
* **Vollbild- & Responsive-Skalierung für Nonogramm**: Spielfeld passt sich nun wie Tango, Sudoku und Akari optimal bildschirmfüllend an alle Displaygrößen an.
* **Schnell-Zoom-Button in Aktionsleiste**: Direkte Ein-/Ausschaltung des Lupen-Zooms über die Aktionsleiste ohne Menü-Umweg.
* **Long-Press-Optimierung für Tango**: Zuverlässige Platzierung von Monden (🌙) per Gedrückthalten ohne versehentliches Überschreiben durch nachfolgende Klicks.
* **Erweiterte Zoom-Stufen**: Auswahl aus 4 Vergrößerungsstufen ($1.25\times, 1.5\times, 1.75\times, 2.0\times$) im Einstellungsmenü.
* **Sicherheits- & Datenschutz-Audit**: Vollständiger Deep-Scan mit 74 bestandenen Sicherheitschecks und 100 % DSGVO-Konformität verifiziert.

### v2.2.0 – 2026-08-25
* **Nonogramm (Picross / Griddlers) Integration**: Vollwertiges 4. Puzzle-Plugin mit Gittergrößen von 5×5 bis 15×15, 120 Kampagnen-Leveln in 4 Stufen, täglichem Rätsel, Bitmask-Line-Solver, Bild-Generator und interaktivem Tutorial.
* **Alphabetische Rätsel- & Statistik-Anordnung**: Einheitliche alphabetische Sortierung aller Spiele in der Rätselauswahl und in den Statistik-Filter-Tabs (💡 *Akari*, 🖼️ *Nonogramm*, 🔢 *Sudoku*, ☀️🌙 *Tango*).
* **Entfernung von Promo-Badges**: Badges *„Neu“* und *„Klassiker“* bereinigt für ein harmonisches Design.
* **Sicherheits- & Datenschutz-Audit**: Vollständiger Deep-Scan mit 74 bestandenen Sicherheitschecks und 100 % DSGVO-Konformität verifiziert.

### v2.1.0 – 2026-08-24
* **Akari (Light Up) Integration**: Vollständiges Glühbirnen- & Lichtstrahl-Rätsel (6×6 bis 14×14), 120 Kampagnen-Level, deterministischer Generator, Backtracking-Solver, Smart-Hint-Engine und 14 Tutorials.
* **Dynamische Lichtstrahl-Effekte**: Schimmernde Lichtausbreitung über Zeilen und Spalten in allen 5 Farb-Themes (*Modern Dark*, *AMOLED*, *Light*, *Wood*, *Cyberpunk*).
* **Audio-Synthesizer**: Neuer warmer Glühbirnen-Soundeffekt `playBulb()`.
* **Erweiterte Statistik-Filter**: Separates Tracking für Tango, Sudoku und Akari inklusive Bestzeiten.

### v2.0.0 – 2026-08-24
* **Cortex Multi-Puzzle Engine**: Einführung der modularen Rätselplattform mit nahtloser Unterstützung für **Tango** und **Sudoku**.
* **Sudoku Integration**: Vollständiges Sudoku-Erlebnis (4×4, 9×9, 16×16), 120 Kampagnen-Level, Generatoren, Solver, Ziffern-Keypad und Tutorials.
* **Harmonisierte UI & Themes**: Maßgeschneiderte Rahmen, Kontraste für Startzahlen und proportionale Eckradien für alle Feldgrößen.
* **Automatischer Puzzle-Restore**: Zuverlässige Rückkehr zum aktiven Hauptpuzzle nach Tagesrätsel-Sitzungen.
* **100 % Offline-Sicherheit**: Erweiterter Deep-Scan mit 74 automatisierten Tests bestanden.

### v1.2.6 – 2026-08-24
* Optimierter Startsymbol-Kontrast und erweiterte Tastaturnavigation.
* Neues Theme-Farbmanagement für AMOLED- und Cyberpunk-Modi.

### v1.2.0 – 2026-08-22
* Hinzufügen von 14 fortgeschrittenen Muster-Tutorial-Lektionen für Tango.
* Einführung des Notizen-Modus für Entwürfe und Kandidaten.

### v1.0.0 – 2026-08-20
* Initiales Release mit 120 Tango-Kampagnenleveln, Tagesrätsel, Generator und Audio-Synthesizer.

---

## 🧪 Test-Suite & Build

```bash
# Web-Bundle und Tests ausführen
python build_bundle.py
python -m unittest test_akari.py test_sudoku.py test_cortex_plugins.py test_app_dom.py

# Native Cortex.apk erstellen und sicherheitsüberprüfen
python build_apk.py
python test_security_deep.py
```

---

## 📄 Lizenz

Dieses Projekt ist unter der **GPLv3** lizenziert – siehe [LICENSE](LICENSE) für Details.
