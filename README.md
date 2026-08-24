# Cortex – Modulare Logikrätsel für Android & Web

[![Version](https://img.shields.io/badge/Version-2.0.0-brightgreen.svg)](https://github.com/frohneb/cortex)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline-100%25-orange.svg)](#)
[![Werbefrei](https://img.shields.io/badge/Ads-0%25%20Werbefrei-success.svg)](#)
[![Security](https://img.shields.io/badge/Security-9.9%2F10%20Exzellent-brightgreen.svg)](SECURITY.md)

Eine moderne, elegante und werbefreie Offline-Plattform für anspruchsvolle Logikrätsel (**Tango** und **Sudoku**) mit vollständiger deutscher und englischer Lokalisierung, interaktiven Tutorials, intelligentem Hinweis-System, Notizen-Modus, pünktlichen System-Erinnerungen und optimiertem Touch-Layout für Android-Smartphones und Web-Browser.

---

## ✨ Features

- 🚫 **100 % Werbefrei & Offline**: Keine Werbung, keine In-App-Käufe, kein Tracking, keine unnötigen Berechtigungen (kein Internet-Zugriff erforderlich).
- 🧩 **Modulare Puzzle-Architektur (Cortex Engine)**:
  - **Tango (Takuzu / Binairo / Binoxxo)**: Größen von 4×4 bis 10×10 mit Sonnen (☀️), Monden (🌙), Gleichheit (`=`) und Gegenteil (`×`).
  - **Sudoku**: Klassisches 9×9 sowie 4×4 (Mini), 6×6 (Midi) und 16×16 (Monster-Sudoku) mit flexiblen Blockkammern (2×2, 3×2, 3×3, 4×4).
- 🏆 **Umfangreiche Kampagnen**:
  - Jeweils 120 handgefertigte Kampagnen-Level pro Rätseltyp mit dynamischer Sterne- und Fortschrittsspeicherung.
- 📅 **Tägliches Rätsel (Daily Puzzle)**:
  - Jeden Tag ein neues, synchrones Tagesrätsel mit automatischer Puzzle-Rotation und Streak-Zähler.
- 🎲 **Freies Spiel (Endlos-Generator)**:
  - Beliebig viele, deterministisch überprüfte und eindeutig lösbare Rätsel in verschiedenen Größen und Schwierigkeitsgraden (*Einfach*, *Mittel*, *Schwer*).
- 🎓 **Interaktive Tutorials & Lösungsstrategien**:
  - **Tango**: Grundlagen (6 Schritte), Mathematik (8 Lektionen) und Meister-Muster (14 Lektionen).
  - **Sudoku**: Grundlagen (Reihen, Spalten, Blöcke) und Fortgeschrittene Lektionen (*Naked Pairs*, *Hidden Singles*, Block-Interferenzen).
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

---

## 📜 Changelog

### v2.0.0 – 2026-08-24
* **Cortex Multi-Puzzle Engine**: Einführung der modularen Rätselplattform mit nahtloser Unterstützung für **Tango** und **Sudoku**.
* **Sudoku Integration**: Vollständiges Sudoku-Erlebnis (4×4, 6×6, 9×9, 16×16), 120 Kampagnen-Level, Generatoren, Solver, Ziffern-Keypad und Tutorials.
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
python -m unittest test_sudoku.py test_cortex_plugins.py test_app_dom.py

# Native Cortex.apk erstellen und sicherheitsüberprüfen
python build_apk.py
python test_security_deep.py
```

---

## 📄 Lizenz

Dieses Projekt ist unter der **GPLv3** lizenziert – siehe [LICENSE](LICENSE) für Details.
