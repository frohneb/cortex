# Tango – Logikrätsel für Android & Web (Werbefrei & 100% Deutsch)

Eine werbefreie, elegante und moderne Neuimplementierung des beliebten Logik-Puzzles **Tango** (Takuzu / Binairo / Binoxxo) mit vollständiger deutscher Lokalisierung, interaktivem Tutorial, automatisierter Regelüberprüfung und optimiertem Touch-Layout für Android-Smartphones.

---

## ✨ Features

- 🚫 **100 % Werbefrei & Offline**: Keine Werbebanner, keine Unterbrechungen, kein Tracking.
- 🇩🇪 **Vollständige deutsche Übersetzung**: Alle Menüs, Regeln und Erklärungen fehlerfrei auf Deutsch.
- 🎓 **Interaktives 6-Schritte-Tutorial**: Erklärt Schritt für Schritt die Grundlagen (Sonne ☀️ / Mond 🌙), die 3er-Regel, die Balance-Regel sowie die Abhängigkeiten (`=` Gleich, `×` Gegenteil) an geführten Mini-Rätseln.
- 🏆 **Kampagne mit über 100 Leveln**: Von 4×4 über 6×6 bis 10×10 mit Sterne-Bewertung.
- 📅 **Tägliches Rätsel (Daily Tango)**: Jeden Tag ein neues, synchrones Rätsel mit Streak-Zähler.
- 🎲 **Endlos-Generator (Freies Spiel)**: Generiert beliebig viele eindeutig lösbare Rätsel mit einstellbarer Gittergröße und Schwierigkeit.
- 💡 **Intelligenter Hinweis-Assistent**: Erklärt *warum* ein bestimmter Zug logisch zwingend ist.
- 🎨 **5 Farb-Themes**: Modern Dark, AMOLED Schwarz, Clean Light, Warmes Holz und Cyberpunk Neon.
- 🔊 **Web Audio Synthesizer**: Angenehme, latenzfreie Soundeffekte und haptisches Vibrations-Feedback.

---

## 🎮 Spielregeln & Abhängigkeiten

1. **Keine 3er-Reihen**: Höchstens zwei gleiche Symbole (☀️☀️ oder 🌙🌙) dürfen waagerecht oder senkrecht aufeinanderfolgen.
2. **Balance**: Jede Zeile und jede Spalte enthält exakt gleich viele Sonnen wie Monde (z. B. 3 und 3 bei einem 6×6 Gitter).
3. **Gleichheitszeichen `=`**: Verbundene Nachbarzellen müssen dasselbe Symbol tragen (beide ☀️ oder beide 🌙).
4. **Gegenteilszeichen `×`**: Verbundene Nachbarzellen müssen unterschiedliche Symbole tragen (eine ☀️, ein 🌙).
5. **Eindeutigkeit**: Keine zwei Zeilen und keine zwei Spalten dürfen vollständig identisch sein.

---

## 🧪 Automatisierte Tests

Führe die Test-Suite mit Python aus:

```bash
python test_rules.py
```

---

## 📱 Auf dem Smartphone starten

Siehe [ANLEITUNG_ANDROID.md](ANLEITUNG_ANDROID.md) für die einfache Installation als Standalone-App (PWA) oder das Kompilieren als APK in Android Studio.
