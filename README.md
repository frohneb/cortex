# Cortex – Modulare Logikrätsel für Android & Web

[![Version](https://img.shields.io/badge/Version-2.8.2-brightgreen.svg)](https://github.com/frohneb/cortex)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline-100%25-orange.svg)](#)
[![Werbefrei](https://img.shields.io/badge/Ads-0%25%20Werbefrei-success.svg)](#)
[![Security](https://img.shields.io/badge/Security-10.0%2F10%20Perfekt-brightgreen.svg)](SECURITY.md)

Eine moderne, elegante und werbefreie Offline-Plattform für anspruchsvolle Logikrätsel (**Tango**, **Sudoku**, **Akari / Light Up**, **Nonogramm / Picross**, **Slitherlink**, **Minesweeper**, **Crowns**, **Hashiwokakero / Brücken**, **Futoshiki / Ungleich** und **SumGrid / Kreuzsummen**) mit vollständiger deutscher und englischer Lokalisierung, interaktiven Tutorials, intelligentem Hinweis-System, Notizen-Modus, Wischgesten-Steuerung (Drag-to-Draw), pünktlichen System-Erinnerungen und optimiertem Touch-Layout für Android-Smartphones, Android Auto (Cockpit-Modus) und Web-Browser.

---

## ✨ Features

- 🚫 **100 % Werbefrei & Offline**: Keine Werbung, keine In-App-Käufe, kein Tracking, keine unnötigen Berechtigungen (kein Internet-Zugriff erforderlich).
- 🚗 **Android Auto & Automotive OS („Play While Parked“)**: Vollwertige Unterstützung für Auto-Infotainmentsysteme im geparkten Zustand (z. B. während Ladepausen) mit zweispaltigem Cockpit-Layout und Rotary-Controller-Unterstützung.
- 🧩 **Modulare Puzzle-Architektur (Cortex Engine)**:
  - **Tango (Takuzu / Binairo / Binoxxo)**: Größen von 4×4 bis 10×10 mit Sonnen (☀️), Monden (🌙), Gleichheit (`=`) und Gegenteil (`×`).
  - **Sudoku**: Klassisches 9×9 sowie 4×4 (Mini) und 16×16 (Monster-Sudoku) mit passgenauen Blockkammern (2×2, 3×3, 4×4).
  - **Akari (Light Up / Glühbirnen)**: Größen von 6×6 bis 14×14 mit Lichtstrahlen-Glow, Wand-Nachbarschaftszahlen ($0 \dots 4$) und SVG-Glühbirnen (💡).
  - **Nonogramm (Picross / Griddlers)**: Größen von 5×5 bis 15×15 mit Zeilen- & Spalten-Zahlenhinweisen, 5er-Block-Trennern und Pixel-Art-Illustrationen (🖼️).
  - **Slitherlink (Loop / Fences)**: Größen von 4×4 bis 10×10 mit Kanten-Hinweiszahlen ($0 \dots 3$), intelligenter Wischgesten-Steuerung (Drag-to-Draw) und Kreuz-Markierungen.
  - **Minesweeper (Minenfeld)**: Größen von 8×8 bis 16×30 mit Zahlen ($0 \dots 8$), kaskadierendem Flood-Fill bei 0-Feldern und Flaggen-Markierung (🚩).
  - **Crowns (Queens / Kronen)**: Größen von 5×5 bis 9×9 mit bunten Farbregionen, nahtlosem Vektor-Grid, Kronen (👑) und Sperr-Kreuzen (✕).
  - **Hashiwokakero (Hashi / Brücken)**: Größen von 7×7 bis 11×11 mit Inseln ($1 \dots 8$), orthogonalen Einfach- & Doppelbrücken, Kreuzungsfreiheit und vollständigem Graph-Zusammenhang (🌉).
  - **Futoshiki (Ungleich / More or Less)**: Lateinische Quadrate von 4×4 bis 7×7 mit Ziffern ($1 \dots N$), horizontalen und vertikalen Ungleichheits-Operatoren (`<`, `>`) und Keypad-Restwertanzeige (⚖️).
  - **SumGrid (Kreuzsummen / Sum Cross)**: Gitter von 4×4 bis 7×7 mit Zeilen- und Spaltenzielsummen, Eliminierungslogik (Behalten/Streichen) und dynamischen Live-Statusbadgets (🧮).
- 🎓 **Interaktive Tutorials & Lösungsstrategien**:
  - **Tango**: Grundlagen (6 Schritte), Mathematik (8 Lektionen) und Meister-Muster (14 Lektionen).
  - **Sudoku**: Grundlagen (Reihen, Spalten, Blöcke) und Fortgeschrittene Lektionen (*Naked Pairs*, *Hidden Singles*, Block-Interferenzen).
  - **Akari**: Grundlagen (8 Lektionen) und Fortgeschrittene Lektionen (6 Meister-Muster & Wand-Interferenzen).
  - **Nonogramm**: Grundlagen (5 Lektionen: Vollblöcke, Nullzeilen, Überlappungen, Mindestabstände).
  - **Slitherlink**: Grundlagen (6 Lektionen: 0er-Zellen, 3er-Ecken, Grad-2-Regel) und Fortgeschrittene Lektionen (3 Meistermuster & Sub-Loop-Ausschluss).
  - **Minesweeper**: Grundlagen (6 Lektionen: Zahlenhinweise, Long-Press-Flaggen, 0er-Kettenreaktion, Randlogik).
  - **Crowns**: Grundlagen (7 Lektionen: Zeilen-/Spaltenregeln, Regionen-Monopol, 8er-Nachbarschaftsschutz, Ausschluss-Kreuze).
  - **Hashiwokakero**: Grundlagen (8 Lektionen: Einfach- & Doppelbrücken, Taubenschlag-Prinzip an Ecken/Rändern, Isolations-Vermeidung, Netzwerk-Zusammenhang).
  - **Futoshiki**: Grundlagen (7 Lektionen: Lateinisches Quadrat, Ungleichheits-Ketten, Extremwerte 1 & N, Naked & Hidden Singles).
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

### ➿ Slitherlink (Rundweg)
1. **Eine geschlossene Schleife**: Verbinde Gitterpunkte zu einem einzigen, zusammenhängenden und nicht-selbstschneidenden Rundweg.
2. **Zahlenhinweise ($0 \dots 3$)**: Eine Zahl gibt an, wie viele Kanten dieser Zelle zur Schleife gehören. Um eine 0 darf keine Linie verlaufen.
3. **Punktgrad 2 oder 0**: An jedem Gitterpunkt treffen entweder genau 2 Linien zusammen oder 0. Keine Verzweigungen oder Sackgassen.

### 🚩 Minesweeper (Minenfeld)
1. **Sichere Aufdeckung**: Ziel ist es, alle Felder ohne Minen aufzudecken. Ein Treffer auf eine Mine beendet das Spiel.
2. **Zahlenhinweise ($0 \dots 8$)**: Zahlen auf aufgedeckten Feldern zeigen die exakte Anzahl der Minen in allen 8 Nachbarfeldern an.
3. **0er-Kettenreaktion (Flood-Fill)**: Felder ohne Nachbar-Minen (0) decken automatisch die gesamte angrenzende freie Zone auf.
4. **Flaggen (🚩)**: Verdächtige Minenfelder können per Long-Press mit einer roten Flagge geschützt werden.

### 👑 Crowns (Queens / Kronen)
1. **Genau eine Krone**: Jede Zeile, jede Spalte und jede Farbregion muss genau eine Krone enthalten.
2. **Keine Berührung**: Kronen dürfen sich weder horizontal, vertikal noch diagonal berühren (8er-Nachbarschaftsschutz).
3. **Flächen-Ausschluss (✕)**: Felder, die keine Krone enthalten können, werden mit einem Kreuz gesperrt.

### 🌉 Hashiwokakero (Hashi / Brücken)
1. **Inselwerte**: Jede Insel enthält eine Zahl ($1 \dots 8$), die der genauen Anzahl der an ihr andockenden Brücken entspricht.
2. **Orthogonale Brücken**: Brücken verlaufen ausschließlich waagerecht oder senkrecht zwischen zwei Inseln; maximal zwei Brücken dürfen zwei Inseln verbinden.
3. **Kreuzungsfreiheit**: Brücken dürfen sich niemals kreuzen und keine anderen Inseln überqueren.
4. **Ein einziges Netzwerk**: Alle Inseln müssen am Ende zu einem einzigen, zusammenhängenden Netzwerk verbunden sein.

### ⚖️ Futoshiki (Ungleich)
1. **Lateinisches Quadrat**: In jeder Zeile und Spalte des $N \times N$-Gitters darf jede Zahl von $1$ bis $N$ genau einmal vorkommen.
2. **Ungleichungen**: Alle Relationszeichen (`<`, `>`) zwischen benachbarten Zellen müssen strikt erfüllt sein.
3. **Eindeutigkeit**: Jedes Rätsel besitzt genau eine logisch deduzierbare Lösung ohne Raterei.

### 🧮 SumGrid (Kreuzsummen / Sum Cross)
1. **Zielsummen**: Die Summe aller aktiven (behaltenen) Zahlen in jeder Zeile und Spalte muss exakt die vorgegebene Zielsumme am Rand ergeben.
2. **Zustände**: Zahlen können behalten (aktiv / grün), gestrichen (ausgeschlossen / ✕) oder neutral (offen) sein.
3. **Kein Überhang**: Eine Zeile oder Spalte darf das Ziel zu keinem Zeitpunkt überschreiten; exakte Treffer leuchten grün mit Häkchen auf.
4. **Eindeutigkeit**: Jedes Rätsel besitzt genau eine mathematisch verifizierte, eindeutige Lösung.

---

## 📜 Changelog

### v2.8.2 – 2026-10-24
* 🎨 **Theme-Stabilität & Farbhärtung (AMOLED & Warmes Holz)**:
  * **Vollständige CSS-Farbvariablen**: Ergänzung fehlender CSS-Custom-Properties (`--border-color`, `--text-primary`, `--text-secondary`, `--accent-sun-bg`, `--accent-moon-bg`, `--accent-equal`, `--accent-opposite`, `--cell-hover`, `--shadow-color`) für *AMOLED Schwarz* und *Warmes Holz*.
  * **Resiliente Theme-Umschaltung**: Kapselung der Theme-Aktivierung in `try/catch` mit unmittelbarem Re-Rendering des Spielfelds (`renderGrid()`) sowie Absicherung der benutzerdefinierten Auswahldialoge.
  * **Beseitigung von Alt-Themes in Puzzledateien**: Aktualisierung veralteter `body.theme-minimal`-Klassen in Nonogramm, Sudoku, Tango, Slitherlink, Minesweeper, Crowns und Akari auf die aktiven Themes `theme-amoled` und `theme-wood`.
* 🖼️ **Nonogramm Fehler-Visualisierung (Conflict-Styling)**:
  * **Eindeutige Signalfarbe bei Fehleingaben**: Überarbeitung der Spezifität für fehlerhafte Kacheln (`.nonogram-cell.conflict`, `.nonogram-cell.cell-filled.conflict`, `.nonogram-cell.cell-cross.conflict`) mit kräftigem Signalrot (`#ef4444`, Text `#ffffff`, Rand `#b91c1c`, Rüttelanimation). Beseitigt die bisherige unschöne bräunliche Farbverfälschung in Modern Dark sowie überdeckte Fehlerzustände in Light und Cyberpunk.
* 📊 **Statistik-Anzeige für alle Spiele optimiert (Mehrzeilige Umbrüche)**:
  * **Sofortige Sichtbarkeit aller 11 Spiele**: Umstellung der horizontal scrollbaren Leiste auf ein responsives, mehrzeilig umbrechendes Kapsel-Design (`flex-wrap: wrap`). Alle 11 Rätsel-Tabs (*Gesamt*, *Akari*, *Nonogramm*, *Sudoku*, *Tango*, *Slitherlink*, *Minesweeper*, *Crowns*, *Hashi*, *Futoshiki*, *SumGrid*) sind nun ohne horizontales Wischen auf einen Blick erreichbar.
  * **Vollständige Bestzeiten-Konfiguration**: Aufnahme dedizierter Bestzeiten-Gitter für Nonogramm (5×5, 10×10, 15×15 mit Lokalisierung `stats_best_time_15`) und Slitherlink (5×5, 7×7, 10×10).
* 🛡️ **Error-Boundary-Filterung**:
  * Unbedenkliche Browser-Ereignisse ohne Fehlerobjekt sowie `ResizeObserver`-Meldungen werden ignoriert, um Fehlalarme des Diagnose-Banners zuverlässig zu unterbinden.

### v2.8.1 – 2026-10-24
* 🧮 **SumGrid Tutorial- & Level-Audit**:
  * **Tutorial-Mathematik korrigiert**: Vollständige mathematische Harmonisierung aller 6 interaktiven Tutorial-Schritte. Behebung von Summenabweichungen in Schritt 1, 2, 3, 4 und 6, sodass alle Rand-Zielsummen exakt mit den Lösungen übereinstimmen und vom Solver als eindeutig lösbar (genau 1 Lösung) verifiziert werden.
  * **Gitterinitialisierung & Abschlussprüfung**: Nach Ausführung der Lektionsaufgaben schließt das Spielfeld nun fehlerfrei und nahtlos über `engine.isCompleted()` ab.
  * **Kampagnen-Level-Verifikation**: Alle 240 Kampagnen-Level (4×4 bis 7×7) und Tagesrätsel wurden automatisiert auf deterministische Generierung ohne Fallback, Randziel-Konsistenz und strikte Eindeutigkeit validiert.
  * **Automatisierte Regressionstests**: Erweiterung von `test_sumgrid.py` um mathematische Integritäts- und Eindeutigkeitsprüfungen für Tutorials und Kampagnen-Stichproben.

### v2.8.0 – 2026-10-24
* 🧮 **Neues Puzzle-Plugin: SumGrid (Zahlen-Kreuzsummen / Sum Cross)**:
  * **Vollständige Plugin-Integration**: Einbindung des 10. vollwertigen Logikrätsels mit 240 handgefertigten Kampagnen-Leveln in 4 Kapiteln (4×4 bis 7×7), täglichem synchronen Rätsel und freiem Spiel.
  * **Prozeduraler Generator & Solver**: Eindeutige Lösbarkeit durch mathematischen Constraint- und Branch-and-Bound-Solver garantiert.
  * **Dynamische Randindikatoren**: Live-Feedback an den Rändern für Zeilen- und Spaltensummen (Zufriedenheit mit Häkchen, optische Warnung bei Überschreitung).
  * **Didaktisches Tutorial**: 6 interaktive Lerneinheiten für Nullsummen, Vollsummen, Überhang-Ausschluss, Zeile-Spalte-Wechselwirkung und Differenz-Methode.
  * **Harmonisches Design**: Ohne Werbe- oder „Neu“-Banner für eine ruhige, aufgeräumte Spieloberfläche.
* 📊 **Fehlerbehebung für Statistik-Spielauswahl (Horizontales Scrollen)**:
  * **Horizontales Scrollen aktiviert**: Beseitigung der Scroll-Blockade der Statistik-Sub-Tabs durch Aktivierung von `overflow-x: auto`, Touch-Wischgesten (`touch-action: pan-x`), Mausrad-Horizontallauf und Drag-to-Scroll für Desktop-Mausnutzer.
  * **Auto-Scroll für aktive Tabs**: Automatisches, zentriertes Hineinscrollen des ausgewählten Spiel-Tabs (`scrollIntoView`).
  * **SumGrid-Statistiken**: Vollständige Erfassung und Anzeige in den Gesamt- und Einzelstatistiken inklusive Bestzeiten (4×4 bis 7×7).
* 🧹 **Projekt-Bereinigung & Codebase-Entschlackung**:
  * **Entfernung verwaister Legacy-Module**: Vollständiges Löschen alter Verzeichnisse und Dateien aus dem ursprünglichen Tango-Monolithen (`js/core/`, `js/data/`, `js/ui/audio.js`, `js/ui/animations.js`), die durch die modulare Cortex-Puzzle-Architektur (`js/puzzles/tango/` und `js/shared/`) längst abgelöst wurden.
  * **Bereinigung redundanter Build- & Script-Artefakte**: Entfernen des alten Tango-Icon-Generators (`generate_icons.py`), des ungenutzten Kotlin-Stubs (`MainActivity.kt`) und temporärer Testskripte (`verify_campaign.py`).
  * **Härtung der Build- & Git-Konfiguration**: Aufnahme von `android/build/` und `android/app/build/` in `.gitignore` sowie Entfernung versehentlich getrackter Build-Reports.
  * **Synchronisation der Test-Suiten**: Umstellung aller Testpfade in `test_hint_and_defeat_logic.py`, `test_app_dom.py`, `test_sudoku.py` und `test_cr_cs_guidelines.py` auf die aktiven Module und Verifikation der Versionskonsistenz v2.7.3 (Code 46).

### v2.7.2 – 2026-10-18
* 💡 **Optimierung des Hinweissystems für Futoshiki & Hashiwokakero**:
  * **Futoshiki-Hinweiskonsistenz**: Priorisierte und deterministische Lösungsfindung bei ausgewählter Zelle (`focusCell`), Vermeidung von abwechselnden oder widersprüchlichen Hinweisen für dieselbe Position durch feste Hierarchie (Naked Single > Hidden Single Zeile > Hidden Single Spalte > Fallback) sowie strikte Konsistenzprüfung gegen die Referenzlösung.
  * **Tutorial-Korrekturen (Futoshiki)**: Behebung inkonsistenter Vorgaben und Lösungsbelegungen in Schritt 3 (Duplikatkorrektur) und Schritt 7 (widerspruchsfreie Ungleichungen und eindeutige Lösbarkeit).
  * **Hashi-Hinweislogik**: Priorisierung von Hinweisen auf die aktuell fokussierte Insel (`focusCell`) und Deckelung empfohlener Brücken (`hint.count`) auf den maximalen Referenzlösungswert.
  * **Hashi-Generator**: Beseitigung kollinearer Überlappungen und Verhinderung von Brücken über Zwischeninseln bei der prozeduralen Level-Erzeugung.
* 🏷️ **Bereinigung der Aktions-Badges**:
  * Entfernung der *„Neu“*-Labels aus den Plugin-Definitionen von Hashiwokakero, Futoshiki und Crowns für eine ruhige, aufgeräumte Spielauswahl.

### v2.7.1 – 2026-10-17
* 🐛 **Fehlerbehebung für Hashiwokakero & Futoshiki**:
  * **Interaktions-Fehler behoben**: Beseitigung des „Script error.“ beim Auswählen und Spielen von Hashiwokakero und Futoshiki.
  * **FutoshikiRenderer & Engine**: Anbindung an das Cortex Cell-Event-System (`onCellInteraction(cellEl, r, c)`), Implementierung von `setCellValue()` und `cycleCellValue()` für flüssige Zifferneingabe über Keypad und Zelltaps.
  * **HashiRenderer**: Vollständige Event-Entkopplung bei Brücken- und Inselklicks mit synchroner Spielstand-Aktualisierung (`movesCount`, `checkCompletion`, `saveActiveGameState`) und nativer Island-Auswahl (`selectedCell`).
  * **Robuste Initialisierung**: Absicherung von `prepareCampaignLevel` bei frischem App-Start gegen `ReferenceError` und erweiterte Stack-Trace-Diagnose im Fehler-Banner.

### v2.7.0 – 2026-10-16
* 🌉 **Neues Puzzle-Plugin: Hashiwokakero (Hashi / Brücken)**:
  * Vollständige Integration des 8. Logikrätsels mit 240 Kampagnen-Leveln in 4 Kapiteln, täglichem synchronen Rätsel und freiem Spiel (7×7, 9×9, 11×11).
  * **Graph-Engine & Vektor-Brücken**: Orthogonale Sichtlinienberechnung, 0/1/2-Brücken-Zustände mit Undo/Redo, Vermeidung von Linienkreuzungen und vollständige BFS-Zusammenhangsprüfung.
  * **Intelligente Solver- & Hint-Engine**: Backtracking-Löser mit Eindeutigkeitsprüfung, Taubenschlag-Logik (8er-Inseln, 4er-Ecken, 6er-Ränder, 3er-Ecken), Einzige-Nachbar-Ableitungen und Isolations-Vermeidung.
  * **Responsive SVG-Visualisierung**: Interaktive Insel-Knoten mit dynamischen Glow-Ringen, Live-Fortschrittsanzeige (aktuelle Brücken vs. Zielwert) und nahtloser Touch-/Klick-Steuerung.
  * **8 interaktive Tutorial-Lektionen**: Vom Setzen von Brücken über Rand- und Ecklogik bis zur Erkennung isolierter Teilgraphen.
* ⚖️ **Neues Puzzle-Plugin: Futoshiki (Ungleich / More or Less)**:
  * Vollständige Integration des 9. Logikrätsels mit 240 Kampagnen-Leveln in 4 Kapiteln, täglichem synchronen Rätsel und freiem Spiel (4×4 bis 7×7).
  * **Constraint-Engine & AC-3 Solver**: Lateinisches Quadrat mit Zeilen-/Spalten-Eindeutigkeit, horizontalen und vertikalen Ungleichheits-Operatoren (`<`, `>`) und Arc-Consistency (AC-3) Constraint Propagation.
  * **Logische Hint-Engine**: Schrittweise Ableitungen mit Naked Singles, Hidden Singles in Zeilen/Spalten und Naked Pairs.
  * **Responsive CSS-Grid-Darstellung**: $(2N-1) \times (2N-1)$-Gitter mit markanten Vergleichspfeilen, Fehlerhervorhebung bei Regelkonflikten und ergonomischem Ziffern-Keypad mit Restwert-Badges.
  * **7 interaktive Tutorial-Lektionen**: Grundlagen der Zifferneindeutigkeit, Auswertung von Relationsketten und Extremwert-Deduktionen.
* 🏆 **Vollständige Plattform-Integration**:
  * 240 Kampagnen-Level pro neuem Plugin mit 100 % garantierter eindeutiger Lösbarkeit.
  * Erweiterte Statistik-Tabs mit separater Erfassung für Hashi und Futoshiki inklusive Bestzeiten.
  * Vollständige deutsch/englische Lokalisierung (i18n).
  * Persistente Speicherung des aktiven Spielstands für unterbrechungsfreies Weiterspielen.
  * 100 % offline, werbefrei und DSGVO-konform.

### v2.6.1 – 2026-10-06
* 🏆 **Kampagnen-Erweiterung auf 240 Level pro Puzzle-Plugin**:
  * Verdopplung des Kampagnen-Umfangs über alle 7 Logikrätsel (**Tango**, **Sudoku**, **Akari**, **Nonogramm**, **Slitherlink**, **Minesweeper** und **Crowns**) von 120 auf **240 handgefertigte & prozedurale Level**.
  * **Kapitel-Strukturierung (4 Kapitel à 60 Level)**:
    * **Kapitel 1 (Level 1–60)**: Einstieg & Grundlagen
    * **Kapitel 2 (Level 61–120)**: Pfadfinder & Fortgeschritten
    * **Kapitel 3 (Level 121–180)**: Labyrinth & Experten
    * **Kapitel 4 (Level 181–240)**: Meister-Zirkel & Großmeister (inkl. Hexadezimal-Sudoku 16×16, 14×14 Akari, 10×10 Slitherlink, 16×30 Minesweeper, 9×9 Crowns, 10×10 Tango und 15×15 Nonogramm)
* 🧠 **100 % garantierte eindeutige Lösbarkeit**:
  * Alle neuen Kampagnen-Level (Level 121–240) aller 7 Puzzle-Plugins wurden durch mathematische Constraint-Solver automatisiert auf strikte Eindeutigkeit (genau 1 Lösung) und logische Konsistenz validiert.
* 📱 **UI & App-Shell Optimierung für 240 Level**:
  * Dynamische Level-Navigation und Fortschrittsanzeige in `AppShell` für variable `totalLevels` (Standard 240).
  * Optimierte Kapitel-Reiter (1–60, 61–120, 121–180, 181–240) mit responsivem Grid-Layout auf allen Bildschirmgrößen.
  * Lokalisierte Beschreibungstexte (DE/EN) auf 240 Level aktualisiert.

### v2.6.0 – 2026-09-30
* 👑 **Neues Puzzle-Plugin: Crowns (Queens)**: Vollständige Integration des 7. Logikrätsels mit 120 Kampagnen-Leveln in 4 Kapiteln, täglichem synchronen Rätsel und freiem Spiel (5×5 bis 9×9).
* 📐 **Mathematisch perfektes Vektor-Grid & Nahtlose Kanten**: Umstellung des Spielfelds auf reines CSS-Grid (`display: grid`) mit hochpräzisem SVG-Vektor-Overlay (`vector-effect: non-scaling-stroke`). 100 % gleichmäßige 1 px Innenlinien und stufenfreie 3 px Regionen-Grenzen in allen Themes ohne Subpixel-Overlap-Artefakte.
* ✨ **Radiant-Gold Glanzeffekt für Kronen**: Atmende Glow-Animation für platzierte Kronen mit radialem Farbverlauf, innerer Gold-Aura und dynamischem Mehrschicht-Schatten analog zu den Himmelskörpern in Tango.
* ❌ **Kräftige Sperr-Kreuze**: Markant verstärkte Vektorgeometrie und optimierter Kontrast für gesperrte Felder (`✕`).
* 💡 **Intelligentes Hinweissystem & Fehlererkennung**: Vollwertige `findMistakes()`-Prüfung zur sofortigen Korrektur von Regelverstößen, falschen Kronen und versehentlichen Sperrungen (*False Elimination*) sowie logische Einzelpositions-Ableitungen.
* 🔒 **Sicherheits- & Datenschutz-Audit**: 85 Unit-Tests und alle 74 automatisierten Deep-Scan-Sicherheitsprüfungen bestanden (100 % werbefrei, offline und DSGVO-konform).

### v2.5.1 – 2026-09-27
* 🚗 **Android Auto Kompatibilitäts-Fix & Manifest-Bereinigung**:
  * **Template-Konflikt behoben**: Entfernen der irreführenden Metadaten-Deklaration (`<uses name="template" />`) aus dem Android-Manifest, da Cortex ein direktes Spiel (Activity) ist und keinen `CarAppService` benötigt.
  * **Saubere Launcher-Trennung**: Getrennte `intent-filter` für Smartphone-Launcher (`LAUNCHER`) und Fahrzeug-Infotainment (`CAR_LAUNCHER`).
  * **Sideload-Anleitung ergänzt**: Detaillierte Schritt-für-Schritt-Anleitung zur Aktivierung von „Unbekannte Quellen“ in den Android-Auto-Entwicklereinstellungen für manuell installierte APKs.

### v2.5.0 – 2026-09-21
* 🚗 **Android Auto & Automotive OS Integration („Play While Parked“)**:
  * Offizielle Google Car App Kompatibilität für das Spielen bei stehendem Fahrzeug (z. B. während des Ladens von E-Autos oder bei Wartezeiten).
  * `CAR_LAUNCHER`-Kategorie und Automotive-Deskriptor (`automotive_app_desc.xml`) im Android-Manifest eingebunden.
* 🖥️ **Responsives Cockpit- & Landscape-Design**:
  * Zweispaltiges Layout für **16:9-**, **21:9-** und Breitbild-Fahrzeugdisplays.
  * **Linke Seite**: Maximal dimensioniertes, vertikal vollformatiges Spielfeld mit automatischer Skalierung bis zu `calc(100vh - 28px)`.
  * **Rechte Seite**: Ergonomische Cockpit-Sidebar für Header (Level, Timer, Neustart, Menü), Keypad (Zahlen/Symbole) und Aktionsleiste (Undo, Redo, Notizen, Zoom, Hinweis).
  * Optimierte flache Modals mit bis zu `92vh` Höhe gegen abgeschnittene Inhalte.
* 🕹️ **D-Pad, Rotary Controller & Tastatur-Navigation**:
  * Nativ spielbar mit Dreh-Drück-Stellern im Auto (z. B. BMW iDrive, Mazda Commander) sowie externen Controllern und Tastaturen.
  * `Pfeiltasten`: Nahtlose Zell-Navigation über das gesamte Gitter.
  * `Enter` / `Leertaste`: Feld aktivieren bzw. Wert durchschalten.
  * `0`–`9` & `Backspace`: Schnelleingabe und Löschen.
  * Globale Shortcuts (`u` / `Strg+Z`: Undo, `r` / `Strg+Y`: Redo, `h`: Hinweis, `n`: Notizen, `Escape`: Dialoge/Menü).
* ➿ **Slitherlink Hinweissystem vollständig repariert**:
  * Implementierung von `findMistakes()` in `SlitherlinkEngine` zur präzisen Identifikation fehlerhafter Linien und Kreuze sowie zur Erkennung unerlaubter Verzweigungen.
  * Vollständige Anreicherung der Deducing-Kandidaten mit Zielkante und Aktionswerten, wodurch der Button „Zug ausführen“ stets aktiv ist.
  * Visuelle Hinweisrückmeldung direkt auf dem SVG-Board: Geisterlinien (`slitherlink-edge-ghost-line`), Geisterkreuze, Kanten-Shimmer (`hint-shimmer`), Zellmarkierungen und Fehler-Schütteln (`error-highlight`).

### v2.4.3 – 2026-09-17
* **Sudoku 16×16 Generator Performance- & Stabilitäts-Fix ([Issue #1](https://github.com/frohneb/cortex/issues/1))**: Behebung des Browser- und WebView-Absturzes beim Erzeugen von 16×16-Sudokus auf Stufe „Schwer“ im freien Spiel und Wochenend-Tagesrätsel. Implementierung eines ultra-schnellen Bitmask-Solvers mit 32-Bit Bitmasken, MRV-Heuristik (Minimum Remaining Values) und striktem Node-Budget (`maxNodes = 5000`), wodurch 16×16-Gitter in unter 300 ms stabil und garantiert eindeutig generiert werden.
* **Tägliche Terminerinnerung repariert (Android & Web/PWA)**:
  * Umstellung der nativen AlarmManager-Aktivierung auf `setAndAllowWhileIdle()`, wodurch der lautlose `SecurityException`-Fehler auf modernen Android-Versionen (Android 12–14, targetSdk 34) ohne invasive Sonderberechtigungen behoben wurde.
  * Automatisches Re-Arming des Alarms beim App-Start in `MainActivity.onCreate` und in der App-Shell.
  * Dynamische periodische Aktualisierung des In-App-Banners und Fallback auf die Web Notification API im Browser/PWA-Betrieb.
  * Aktualisierung der Benachrichtigungstexte auf Cortex.

### v2.4.2 – 2026-09-13
* **Minesweeper Spielfeld-Skalierung optimiert**: Behebung des Layout-Überhangs im Minenfeld-Gitter (insbesondere bei 16×16-Tagesrätseln auf Smartphones). Dynamische Gitterabstände (`gap: 2px` bei 16×16), proportionale Zifferngrößen (`clamp(0.6rem, 2.2vw, 0.95rem)`), `min-width: 0 !important` und `overflow: hidden` garantieren ein perfektes, bündiges Einpassen in die Spielfeldumrandung ohne horizontales Ausbrechen.

### v2.4.1 – 2026-09-11
* **Puzzleauswahl-Menü bereinigt**: Das Auswahl-Modal wurde auf die 6 vollständig implementierten und spielbaren Logikrätsel (**Tango**, **Sudoku**, **Akari**, **Nonogramm**, **Slitherlink** und **Minesweeper**) fokussiert; nicht-implementierte Platzhalterkarten ("Demnächst") wurden entfernt.

### v2.4.0 – 2026-09-11
* **Neues Puzzle-Plugin: Minesweeper (🚩)**: Vollständige Integration von klassischem Minesweeper mit 120 Kampagnen-Leveln in 4 Kapiteln, täglichem synchronen Rätsel und freiem Spiel (8×8 bis 16×30 Meister-Format).
* **Touch-Interaktion für Mobilgeräte**: Sofortiges Aufdecken per Tap, Setzen/Entfernen von Flaggen per Long-Press.
* **Kaskadierendes Flood-Fill**: Automatische Freilegung ganzer sicherer Bereiche bei 0-Nachbar-Zellen mit flüssigen Übergängen.
* **Intelligente Solver- & Hint-Engine**: Logische Ableitung sicherer Felder und zwingender Minen über Nachbarschaftsregeln und Mengen-Subtraktion (1-1 / 1-2 Muster) mit verständlichen Erklärungen.
* **Automatisierte Eindeutigkeits- & Konsistenz-Prüfung**: Alle 120 Kampagnen-Level und 6 Tutorial-Lektionen automatisiert auf fehlerfreie Lösbarkeit und exakte Nachbarschaftskonsistenz verifiziert.

### v2.3.1 – 2026-08-28
* **Umfassender Hint-Engine Audit & Fehlerkorrektur**: Tiefgehende Überprüfung und Harmonisierung des Hinweissystems über alle 5 Puzzle-Plugins (**Tango**, **Sudoku**, **Akari**, **Nonogramm**, **Slitherlink**).
* **Slitherlink Solver- & Generator-Stabilität**: Behebung von Script-Fehlern bei prozeduraler Rätselerstellung sowie Integration von dynamischem Lösungs-Fallback und Erkennung falsch gezogener Linien/Kreuze.
* **Erweiterte Fehlererkennung & direkte Korrektur**: `findMistakes()` in allen Plugins synchronisiert; falsche Symbole, Ziffern, Lampen, Pixel und Kanten werden präzise identifiziert und können mit einem Klick auf den Hinweis-Button direkt korrigiert werden.
* **Verbesserte Spielfeld-Visualisierung**: Aktive Hinweisfelder und Kanten werden nun sofort in allen Themes hervorgehoben.

### v2.3.0 – 2026-08-25
* **Neues Puzzle-Plugin: Slitherlink**: Vollständige Integration von Slitherlink (4×4 bis 10×10) mit 120 Kampagnen-Leveln, prozeduralem Generator, Tutorials und Eindeutigkeits-Solver.
* **Intelligente Wischsteuerung (Drag-to-Draw)**: Flüssiges Zeichnen von Schleifenlinien durch kontinuierliches Wischen über Kanten, kombiniert mit Antippen und Long-Press für Kreuzmarkierungen (`✕`).
* **Zwischenstandsspeicherung für Slitherlink**: Vollständige Persistierung aller horizontalen/vertikalen Kanten, Notizen und Timer.

### v2.2.3 – 2026-08-25
* **Persistente Zwischenstände & Wiederherstellung**: Automatisches Speichern des laufenden Spielstands (Zellen, Notizen, Timer, Modus und Einstellungen) bei jedem Zug, beim Minimieren oder Schließen der App für ein nahtloses Weiterspielen beim Neustart.

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

## 📱 Installation & Nutzung

Detaillierte Schritt-für-Schritt-Anleitungen zur sofortigen Nutzung im Browser als **PWA (Progressive Web App)**, zur Erstellung und Installation der **nativen Android APK** sowie zur Freischaltung in **Android Auto („Play While Parked“)** findest du in der [Android-Anleitung](ANLEITUNG_ANDROID.md).

---

## 🧪 Test-Suite & Build

```bash
# 1. Web-Bundle erstellen
python build_bundle.py

# 2. Kern- und Plattform-Tests ausführen
python -m unittest test_app_dom.py test_rules.py test_streak_logic.py test_hint_and_defeat_logic.py test_cr_cs_guidelines.py

# 3. Alle Puzzle-Suiten testen (Tango, Sudoku, Akari, Nonogramm, Slitherlink, Minesweeper, Crowns, Hashi & Futoshiki)
python -m unittest test_rules.py test_sudoku.py test_akari.py test_nonogram.py test_slitherlink.py test_minesweeper.py test_crowns.py test_hashi_futoshiki_phases.py test_cortex_plugins.py

# 4. Native Cortex.apk erstellen und Deep-Scan Sicherheitsüberprüfung ausführen
python build_apk.py
python test_security_deep.py
```

---

## 📄 Lizenz

Dieses Projekt ist unter der **GPLv3** lizenziert – siehe [LICENSE](LICENSE) für Details.
