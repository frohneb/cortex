/**
 * Futoshiki Interaktives Tutorial
 * 7 aufeinander aufbauende Lektionen für Anfänger und Fortgeschrittene
 */

import { FUTOSHIKI_EMPTY } from '../engine.js';

export const FUTOSHIKI_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Das Lateinische Quadrat 🔣",
        subtitle: "Zeilen- und Spaltenregeln",
        description: `Willkommen bei **Futoshiki**!\n\nAuf einem 4×4 Spielfeld muss in jeder Zeile und jeder Spalte **jede Zahl von 1 bis 4 genau einmal** vorkommen.\n\n*Aufgabe: Setze die fehlende 4 in Zeile 1 ein.*`,
        size: 4,
        initialGrid: [
            [1, 2, 3, FUTOSHIKI_EMPTY],
            [2, 3, 4, 1],
            [3, 4, 1, 2],
            [4, 1, 2, 3]
        ],
        hConstraints: [
            ['', '', ''],
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ],
        vConstraints: [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', '']
        ],
        solution: [
            [1, 2, 3, 4],
            [2, 3, 4, 1],
            [3, 4, 1, 2],
            [4, 1, 2, 3]
        ],
        targetCells: [{ r: 0, c: 3, val: 4 }],
        explanation: "Perfekt! In Zeile 1 fehlte nur noch die 4."
    },
    {
        id: 2,
        title: "2. Ungleichungszeichen < und >",
        subtitle: "Größer- und Kleiner-Relationen",
        description: `Zwischen benachbarten Feldern siehst du Pfeilsymbole:\n\n- **<** bedeutet: Die linke Zahl muss **kleiner** sein als die rechte.\n- **>** bedeutet: Die linke Zahl muss **größer** sein als die rechte.\n\n*Aufgabe: Wenn links eine 1 steht und < rechts zeigt, setze eine gültige Zahl (z.B. 2) ein.*`,
        size: 4,
        initialGrid: [
            [1, FUTOSHIKI_EMPTY, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        hConstraints: [
            ['<', '', ''],
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ],
        vConstraints: [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', '']
        ],
        solution: [
            [1, 2, 3, 4],
            [2, 1, 4, 3],
            [3, 4, 1, 2],
            [4, 3, 2, 1]
        ],
        targetCells: [{ r: 0, c: 1, val: 2 }],
        explanation: "Sehr gut! 1 < 2 ist mathematisch wahr."
    },
    {
        id: 3,
        title: "3. Vertikale Pfeile ∧ und ∨",
        subtitle: "Relationen zwischen Zeilen",
        description: `Ungleichungen existieren auch senkrecht:\n\n- **∧** bedeutet: Das obere Feld ist **kleiner** als das untere.\n- **∨** bedeutet: Das obere Feld ist **größer** als das untere.\n\n*Aufgabe: Oben steht eine 4 mit ∨ nach unten. Setze die passende Zahl ein.*`,
        size: 4,
        initialGrid: [
            [4, 0, 0, 0],
            [FUTOSHIKI_EMPTY, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        hConstraints: [
            ['', '', ''],
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ],
        vConstraints: [
            ['>', '', '', ''],
            ['', '', '', ''],
            ['', '', '', '']
        ],
        solution: [
            [4, 1, 2, 3],
            [3, 2, 4, 1],
            [2, 4, 1, 3],
            [1, 3, 3, 2]
        ],
        targetCells: [{ r: 1, c: 0, val: 3 }],
        explanation: "Klasse! Da 4 > 3 ist, stimmt die Relation."
    },
    {
        id: 4,
        title: "4. Constraint-Ausschluss 🚫",
        subtitle: "Unmögliche Extremwerte ausschließen",
        description: `Wenn gilt: **A < B**, dann kann **A niemals 4** sein (bei 4×4), weil es keine Zahl gibt, die größer als 4 ist!\n\nEbenso kann **B niemals 1** sein.\n\n*Aufgabe: Nutze diese Deduktion zur Lösung.*`,
        size: 4,
        initialGrid: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        hConstraints: [
            ['<', '<', '<'],
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ],
        vConstraints: [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', '']
        ],
        solution: [
            [1, 2, 3, 4],
            [2, 3, 4, 1],
            [3, 4, 1, 2],
            [4, 1, 2, 3]
        ],
        targetCells: [{ r: 0, c: 0, val: 1 }, { r: 0, c: 3, val: 4 }],
        explanation: "Hervorragend! In einer Kette A < B < C < D sind alle Positionen 1, 2, 3, 4 eindeutig festgelegt."
    },
    {
        id: 5,
        title: "5. Zeilen- und Spalten-Interaktion 🎯",
        subtitle: "Kombination beider Achsen",
        description: `Kombiniere immer die Zeilen-, Spalten- und Pfeil-Bedingungen.\n\nWenn in einer Spalte bereits 1, 2 und 3 stehen, muss das letzte Feld zwingend die 4 sein.\n\n*Aufgabe: Fülle das letzte freie Feld in Spalte 1.*`,
        size: 4,
        initialGrid: [
            [1, 0, 0, 0],
            [2, 0, 0, 0],
            [3, 0, 0, 0],
            [FUTOSHIKI_EMPTY, 0, 0, 0]
        ],
        hConstraints: [
            ['', '', ''],
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ],
        vConstraints: [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', '']
        ],
        solution: [
            [1, 2, 3, 4],
            [2, 3, 4, 1],
            [3, 4, 1, 2],
            [4, 1, 2, 3]
        ],
        targetCells: [{ r: 3, c: 0, val: 4 }],
        explanation: "Perfekt gelöst!"
    },
    {
        id: 6,
        title: "6. Notizen-Modus ✏️",
        subtitle: "Mögliche Kandidaten festhalten",
        description: `Mit dem **Stift-Icon** kannst du kleine Bleistift-Notizen in Felder eintragen, wenn du dir noch nicht sicher bist.\n\nDas hilft dir, Ausschlussverfahren schrittweise durchzuführen.\n\n*Aufgabe: Setze die Lösung für das markierte Feld.*`,
        size: 4,
        initialGrid: [
            [1, 0, 0, 0],
            [0, 2, 0, 0],
            [0, 0, 3, 0],
            [0, 0, 0, FUTOSHIKI_EMPTY]
        ],
        hConstraints: [
            ['', '', ''],
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ],
        vConstraints: [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', '']
        ],
        solution: [
            [1, 3, 4, 2],
            [4, 2, 1, 3],
            [2, 4, 3, 1],
            [3, 1, 2, 4]
        ],
        targetCells: [{ r: 3, c: 3, val: 4 }],
        explanation: "Sehr gut! Notizen machen komplexe Puzzles übersichtlich."
    },
    {
        id: 7,
        title: "7. Vollständiges Puzzle 🏆",
        subtitle: "Kombiniere alle Techniken",
        description: `Du beherrschst nun alle Grundregeln von Futoshiki!\n\nLöse dieses vollständige 4×4 Rätsel, indem du logisch Ungleichungen und Zeilen-/Spaltenregeln verknüpfst.`,
        size: 4,
        initialGrid: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        hConstraints: [
            ['<', '', '>'],
            ['', '<', ''],
            ['>', '', ''],
            ['', '', '<']
        ],
        vConstraints: [
            ['<', '', '', ''],
            ['', '>', '', ''],
            ['', '', '<', '']
        ],
        solution: [
            [1, 4, 3, 2],
            [2, 1, 4, 3],
            [4, 3, 2, 1],
            [3, 2, 1, 4]
        ],
        explanation: "Herzlichen Glückwunsch! Du bist bereit für die Futoshiki-Kampagne und die Tagesrätsel!"
    }
];
