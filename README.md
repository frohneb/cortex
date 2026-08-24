# Tango – Logikrätsel für Android & Web (Werbefrei & 100% Offline)

[![Version](https://img.shields.io/badge/Version-1.2.5-brightgreen.svg)](https://github.com/frohneb/tango)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline-100%25-orange.svg)](#)
[![Werbefrei](https://img.shields.io/badge/Ads-0%25%20Werbefrei-success.svg)](#)
[![Security](https://img.shields.io/badge/Security-9.8%2F10%20Exzellent-brightgreen.svg)](SECURITY.md)

Eine moderne, elegante und werbefreie Offline-Implementierung des beliebten Logik-Puzzles **Tango** (Takuzu / Binairo / Binoxxo) mit vollständiger deutscher und englischer Lokalisierung, 28 interaktiven Tutorial-Lektionen, intelligentem Hinweis-System, Notizen-Modus, pünktlichen System-Erinnerungen und optimiertem Touch-Layout für Android-Smartphones.

---

## ✨ Features

- 🚫 **100 % Werbefrei & Offline**: Keine Werbung, keine In-App-Käufe, kein Tracking, keine unnötigen Berechtigungen (kein Internet-Zugriff erforderlich).
- 🌐 **Zweisprachig (DE / EN)**: Vollständige Lokalisierung aller Texte, Regeln und Dialoge auf Deutsch und Englisch.
- 🎓 **Drei Interaktive Tutorial-Bereiche (28 Lektionen)**:
  - 📖 **Grundlagen (6 Schritte)**: Schritt-für-Schritt-Einführung in Sonnen (☀️), Monde (🌙), die 3er-Regel, Zeilenbalance sowie Gleichheit (`=`) und Gegenteil (`×`).
  - 🎓 **Mathematik (8 Lektionen)**: Fortgeschrittene mathematische Lösungsstrategien (Sandwich-Prinzip, Kanten-Kaskade, Taubenschlag-Prinzip, Zeilen-Duplikat-Ausschluss, Paritäts-Trippel, 2×2-Kanten-Algebra).
  - 📐 **Muster (14 Lektionen)**: Tiefgehende Analyse von Meister-Mustern und feldgrößenspezifischen Gesetzen (4×4 Paar-Inversion, 6×6 Paar-Limits, **die 1-5-Regel**, **doppelte `[×]`-Kaskade**, **Kanten-Lookahead-Sperre**, 3-Blöcke-Dominozerlegung, **Budget-Kanten-Inkompatibilität**, **2D-Eck-Interferenz**, 8×8 & **10×10 Paar-Budgets**, Zeilen-Unizität und universell verbotene Doppel-`=`-Ketten).
- ✏️ **Notizen-Modus (Kandidaten & Entwürfe)**:
  - Ermöglicht das Festhalten von temporären Markierungen und Annahmen direkt auf dem Spielfeld.
  - Nahtloses Umschalten zwischen Notizen und fest gesetzten Symbolen.
- 🏆 **Umfangreiche Kampagne**: 120 handgefertigte Logikrätsel, gegliedert in 4 Kapitel (von 4×4 über 6×6 und 8×8 bis 10×10) mit Fortschritts- und Sterne-Speicherung.
- 📅 **Tägliches Rätsel (Daily Tango)**:
  - Jeden Tag ein neues, deterministisch generiertes Tagesrätsel für alle Spieler synchron.
  - Tägliche Serie (Streak-Zähler) und separate Bestzeiten je Gittergröße (4×4, 6×6, 8×8, 10×10).
  - Sicherheitsabfrage bei erneutem Starten eines bereits gelösten Tagesrätsels.
- 🎲 **Freies Spiel (Endlos-Generator)**:
  - Generiert beliebig viele eindeutig lösbare Rätsel für Gittergrößen von 4×4 bis 10×10 in den Schwierigkeitsstufen *Einfach*, *Mittel* und *Schwer*.
  - Nach Abschluss gelangt man per „Weiter“-Klick direkt zurück zur Auswahl des nächsten freien Spiels.
- 💡 **Intelligenter Hinweis-Assistent & Lösungsaufdeckung**:
  - **Priorisierte Fehlerprüfung**: Erkennt fehlerhaft gesetzte Symbole vorab und markiert den genauen Regelverstoß.
  - **Logische Beweis-Hinweise**: Erklärt Schritt für Schritt, *warum* ein Symbol zwingend gesetzt werden muss.
  - **Lösungsaufdeckung**: Nach 3 verbrauchten Hinweisen kann die vollständige Lösung freigeschaltet werden (mit Sicherheitsabfrage). Fehler werden rot markiert, die Lösung als Geistersymbole hinterlegt und das Spielfeld kann unbegrenzt in Ruhe analysiert werden.
- 🎨 **5 Theming-Designs & maßgeschneiderte In-Game Dialoge**:
  - *Modern Dark*, *AMOLED Schwarz*, *Clean Light*, *Warmes Holz* und *Cyberpunk Neon*.
  - Eigene Menü-Dropdowns und digitaler 24h-Zeitwähler im Spieldesign (keine störenden nativen Systemdialoge).
- ⏰ **Pünktliche Systemerinnerungen**:
  - Nutzt unter Android `AlarmManager.setAlarmClock`, um tägliche Erinnerungen zur eingestellten Wunschuhrzeit sekundengenau auszulösen (ohne Verzögerungen durch den Android Doze-Modus).
- 🔊 **Sound & Haptik**:
  - Angenehmes Synthesizer-Audio über die Web Audio API und 4 einstellbare Vibrationsstufen (Sanft, Standard, Stark, Ultra).

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
# 1. Alle Unit-, DOM- und Logik-Tests ausführen (63 Tests)
python -m unittest test_app_dom.py test_rules.py test_streak_logic.py test_hint_and_defeat_logic.py test_tutorial_patterns.py

# 2. Tiefen-Sicherheitsaudit (74 Prüfungen: Permissions, CSP, XSS, APK-Integrität)
python test_security_deep.py

# 3. Standard-Sicherheitscheck (22 Prüfungen)
python test_security.py
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

## 🔒 Sicherheit

Tango wird nach den Prinzipien **„Privacy by Design"** und **„Defense in Depth"** entwickelt und kontinuierlich auditiert.

- **Gesamtbewertung:** 9.8 / 10 – EXZELLENT ⭐⭐⭐⭐⭐
- **74 automatisierte Security-Checks** mit 100% Pass Rate (0 Fehler, 0 Warnungen)
- **Keine Internet-Permission**, kein Tracking, keine Werbung
- Vollständiger Audit-Report: **[SECURITY.md](SECURITY.md)**

---

## 📄 Lizenz
 
Dieses Projekt ist unter der [GNU General Public License v3.0 (GPLv3)](LICENSE) lizenziert.

---

## 📝 Changelog

### v1.2.5 – 2026-08-24
- 💡 **Strategischer Hinweis-Engine-Umbau**: Der Hinweis-Assistent priorisiert jetzt Engpass-Zellen (Zeilen/Spalten mit wenig leeren Zellen), Kaskaden-Tiefe und den Spieler-Fokus statt immer triviale Anfangszellen zu wählen.
- ✨ **Schimmer-Effekt auf Hinweis-Feld**: Die Zielzelle eines Hinweises leuchtet golden auf und schimmert, bis der Spieler seinen nächsten Zug macht.
- 🧪 Alle 63 automatisierten Tests bestanden, 74/74 Sicherheitschecks OK.

### v1.2.4 – 2026-08-22
- 📐 14 Meister-Muster-Lektionen im Tutorial-Bereich (Muster).
- 🐛 Bugfixes und UI-Verbesserungen.
