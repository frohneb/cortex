/**
 * Tango Tutorial Pro - Mathematische & Logische Profi-Techniken
 * Erklärt fortgeschrittene Lösungsstrategien mit mathematischen Beweisen und interaktiven Übungen.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE } from '../core/engine.js';

export const TUTORIAL_PRO_STEPS = [
    {
        id: 1,
        title: "Pro 1: Das Sandwich-Prinzip (Parität)",
        subtitle: "Mathematische Dreier-Sperre in Lücken",
        mathPrinciple: "Ausschluss durch Dreier-Verbot: Niemals 3 gleiche Symbole in Reihe",
        description: `**Das Prinzip**:\nWenn zwei identische Symbole ein leeres Feld umschließen (\`☀️ _ ☀️\` oder \`🌙 _ 🌙\`), MUSS dazwischen das gegenteilige Symbol stehen.\n\n**Mathematischer Beweis**:\nWürde man in die Lücke dasselbe Symbol setzen, entstünde eine Kette aus drei gleichen Symbolen (\`☀️☀️☀️\`). Da die maximale Kettenlänge laut Tango-Regeln maximal 2 beträgt, existiert nur genau eine Belegung für die Lücke.\n\n*Übung: Vervollständige die Sandwich-Lücken in Zeile 1 und Spalte 4!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, SUN, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, EMPTY, EMPTY, SUN]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 1, c: 3, val: SUN}],
        explanation: "Mathematisch korrekt! Das Sandwich-Prinzip sichert die Belegung ohne Raten."
    },
    {
        id: 2,
        title: "Pro 2: Die Kanten-Kaskade (Kopplungs-Logik)",
        subtitle: "Vorzeichen-Vererbung über Gleichheitsketten",
        mathPrinciple: "Kanten-Kopplung: [=] nach Symbol A erzwingt Gegenteil",
        description: `**Das Prinzip**:\nZwei durch ein Gleichheitszeichen verbundene Felder (\`[=]\`) bilden ein gekoppeltes Paar mit identischem Wert. Steht direkt davor ein bekanntes Symbol (z. B. eine Sonne ☀️), MÜSSEN beide verbundenen Felder das Gegenteil (🌙 🌙) annehmen.\n\n**Mathematischer Beweis**:\nWürden beide Felder denselben Wert wie das Nachbarfeld annehmen, entstünde eine unzulässige 3er-Reihe (☀️ ☀️ ☀️). Folglich müssen beide Felder zwingend das entgegengesetzte Symbol tragen.\n\n*Übung: Nutze das Gleichheitszeichen [=] in Zeile 1, um die beiden leeren Felder rechts von der Sonne auszufüllen!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 0, c: 2, val: MOON}],
        explanation: "Perfekt bewiesen! Die Kanten-Kaskade hebelt zwei leere Felder gleichzeitig aus."
    },
    {
        id: 3,
        title: "Pro 3: Taubenschlag-Prinzip (Zeilen-Balance)",
        subtitle: "Abzählende Zeilen- und Spaltenvollständigkeit",
        mathPrinciple: "Zeilen-Balance: Summe Sonnen = N/2 ⟹ Rest = Monde",
        description: `**Das Prinzip**:\nIn jedem Gitter enthält jede Zeile und Spalte exakt gleich viele Sonnen wie Monde (z. B. je 2 bei 4×4, je 3 bei 6×6). Sobald alle Sonnen einer Reihe platziert sind, MÜSSEN alle restlichen leeren Felder Monde sein.\n\n**Mathematischer Beweis**:\nIst das Kontingent an Sonnen für eine Zeile vollständig erschöpft, verbleiben 0 freie Kapazitäten für weitere Sonnen. Nach dem Abzähl- und Balance-Prinzip müssen alle verbleibenden leeren Felder mit Monden aufgefüllt werden.\n\n*Übung: Fülle die verbleibenden Felder in Zeile 1 und Spalte 1 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 2, val: MOON}, {r: 0, c: 3, val: MOON}, {r: 2, c: 0, val: MOON}, {r: 3, c: 0, val: MOON}],
        explanation: "Exzellent! Das Taubenschlag-Prinzip liefert die verbleibenden Felder sofort."
    },
    {
        id: 4,
        title: "Pro 4: Indirekte Gegenteils-Kopplung (× Inversion)",
        subtitle: "Vorzeichenumkehr über Gegenteilskanten",
        mathPrinciple: "Inversions-Logik: [×] schaltet Symbol um (☀️ ↔ 🌙)",
        description: `**Das Prinzip**:\nEin Gegenteilszeichen (\`[×]\`) schaltet den logischen Zustand direkt um: Ist eine Seite bekannt, ist die andere Seite zwingend das Gegenteil.\n\n**Mathematischer Beweis**:\nIn einem binären System mit nur zwei Symbolen (☀️ und 🌙) erzwingt die Kante [×] stets unterschiedliche Werte. Ist ein Nachbar eine Sonne ☀️, folgt unausweichlich, dass der verbundene Partner ein Mond 🌙 sein muss.\n\n*Übung: Löse die Gegenteilskanten [×] in Zeile 1 und Spalte 2 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: MOON },
            { r: 2, c: 1, val: SUN }
        ],
        explanation: "Klasse! Inversion über Gegenteilskanten ist die schnellste Umkehr-Logik."
    },
    {
        id: 5,
        title: "Pro 5: Ausschluss identischer Zeilen",
        subtitle: "Verhinderung von Zeilen-Duplikaten",
        mathPrinciple: "Eindeutigkeit: Keine zwei Zeilen dürfen identisch sein",
        description: `**Das Prinzip**:\nKeine zwei Zeilen dürfen vollständig identisch belegt sein. Wenn eine Belegung eine identische Zeile erzeugen würde, MUSS die alternative Belegung gewählt werden.\n\n**Mathematischer Beweis**:\nZeile 1 ist \`☀️ 🌙 ☀️ 🌙\`. Zeile 2 beginnt mit \`☀️ 🌙 _ _\`. Die Belegung \`☀️ 🌙\` für die Lücken würde Zeile 2 identisch zu Zeile 1 machen (Zeile 1 = Zeile 2). Daher MUSS nach der Eindeutigkeits-Regel die Belegung \`🌙 ☀️\` gewählt werden.\n\n*Übung: Vervollständige Zeile 2 so, dass sie NICHT identisch zu Zeile 1 wird!*`,
        size: 4,
        initialGrid: [
            [SUN, MOON, SUN, MOON],
            [SUN, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 1, c: 2, val: MOON },
            { r: 1, c: 3, val: SUN }
        ],
        explanation: "Brillant! Der Ausschluss identischer Zeilen löst knifflige Endspiele ohne Raten."
    },
    {
        id: 6,
        title: "Pro 6: Das Rand-Doppel-Prinzip",
        subtitle: "Doppelseitige Klammerung von Pärchen",
        mathPrinciple: "Rand-Einschluss: Pärchen [☀️☀️] wird von [🌙] eingeklammert",
        description: `**Das Prinzip**:\nWenn zwei gleiche Symbole nebeneinander stehen (\`_ ☀️ ☀️ _\`), MÜSSEN BEIDE Außenfelder das Gegenteil sein (\`🌙 ☀️ ☀️ 🌙\`).\n\n**Mathematischer Beweis**:\nWürde eines der Außenfelder auch eine Sonne \`☀️\` sein, entstünde sofort die verbotene 3er-Kette \`☀️ ☀️ ☀️\`. Folglich müssen BEIDE Außenpositionen zwingend Monde \`🌙\` sein.\n\n*Übung: Klammere das Sonnen-Paar in Zeile 1 mit Monden ein!*`,
        size: 4,
        initialGrid: [
            [EMPTY, SUN, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 0, val: MOON },
            { r: 0, c: 3, val: MOON }
        ],
        explanation: "Perfekt! Zwei gleiche Symbole schließen stets beide Außenfelder mit dem Gegenteil ein."
    },
    {
        id: 7,
        title: "Pro 7: Das Paritäts-Trippel (2-aus-3 Logik)",
        subtitle: "Gegenteils-Kanten als Zähleinheit",
        mathPrinciple: "Parität: [×] bindet 1☀️ + 1🌙 ⟹ 4. Feld ist bestimmt",
        description: `**Das Prinzip**:\nZwei durch \`[×]\` verbundene Felder enthalten garantiert genau 1 Sonne und 1 Mond. Steht vor dem Paar eine Sonne \`☀️\`, ist für die Zeile bereits die 2. Sonne vergeben — das 4. Feld MUSS ein Mond \`🌙\` sein!\n\n**Mathematischer Beweis**:\nDie \`[×]\`-Kante bindet exakt 1 Sonne + 1 Mond. Da Position 1 bereits eine \`☀️\` ist, enthält die 3er-Gruppe (Pos 1–3) zusammen bereits 2 Sonnen (das Maximum bei 4×4). Daher kann das 4. Feld an Position 4 keine Sonne mehr sein und MUSS ein Mond \`🌙\` werden.\n\n*Übung: Bestimme das 4. Feld in Zeile 1 durch die 2-aus-3 Logik!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 3, val: MOON }
        ],
        explanation: "Genial! Die 2-aus-3 Logik lässt dich das 4. Feld bestimmen, ohne das Paar selbst zu lösen."
    },
    {
        id: 8,
        title: "Pro 8: Die 2×2 Quadrat-Kanten-Schleife",
        subtitle: "Kanten-Algebra in Blöcken",
        mathPrinciple: "Eck-Kopplung: Zwei [×] an einer Zelle erzwingen Gleichheit",
        description: `**Das Prinzip**:\nWenn eine Zelle (z. B. oben links) mit zwei Nachbarn über \`[×]\` verbunden ist, müssen beide Nachbarn untereinander exakt GLEICH sein.\n\n**Mathematischer Beweis**:\nBeide Nachbarfelder sind das Gegenteil derselben Ausgangszelle. Da es nur 2 Symbole gibt, haben beide Nachbarn denselben Wert. Ist die Eckzelle eine \`☀️\`, MÜSSEN beide Nachbarfelder Monde \`🌙\` sein!\n\n*Übung: Löse die beiden Nachbarfelder in Zeile 1 und Spalte 1 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: MOON },
            { r: 1, c: 0, val: MOON }
        ],
        explanation: "Meisterklasse! Kanten-Algebra in 2x2 Blöcken durchschaut komplexe Abhängigkeiten blitzschnell."
    }
];
