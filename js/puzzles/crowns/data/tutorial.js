/**
 * Crowns Interaktives Tutorial
 * 7 aufeinander aufbauende Lektionen (4×4 und 5×5 Puzzles)
 */

import { CROWNS_EMPTY, CROWNS_CROWN, CROWNS_X } from '../engine.js';

export const CROWNS_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Die Krone 👑",
        subtitle: "Grundlagen und Steuerung",
        description: `Willkommen bei **Crowns**!\n\nDein Ziel ist es, in jeder farbigen Region genau eine **Krone (👑)** zu platzieren.\n\n**Bedienung**:\n- **1× Tippen** = **Krone 👑**\n- **2× Tippen** = **X-Markierung ✕** (Eliminierung)\n- **3× Tippen** = **Löschen**\n\n*Aufgabe: Setze eine Krone auf das markierte Feld.*`,
        size: 4,
        regions: [
            [0, 0, 0, 1],
            [2, 0, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ],
        regionColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E'],
        initialGrid: [
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY]
        ],
        solution: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY]
        ],
        targetCells: [{r: 0, c: 1, val: CROWNS_CROWN}],
        explanation: "Perfekt! Du hast deine erste Krone platziert."
    },
    {
        id: 2,
        title: "2. Farbregionen",
        subtitle: "Jede Region braucht genau eine Krone",
        description: `Das Gitter ist in **farbige Regionen** unterteilt. In jeder Region muss **genau eine Krone** stehen.\n\nSchau dir die Farben an — jede Farbe ist eine eigene Region.\n\n*Aufgabe: Platziere die Krone in der türkisen (hellblauen) Region.*`,
        size: 4,
        regions: [
            [0, 0, 0, 1],
            [2, 0, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ],
        regionColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E'],
        initialGrid: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY]
        ],
        solution: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY]
        ],
        targetCells: [{r: 2, c: 0, val: CROWNS_CROWN}],
        explanation: "Genau! Jede Farbregion bekommt genau eine Krone."
    },
    {
        id: 3,
        title: "3. Eine pro Zeile",
        subtitle: "Jede Zeile enthält genau eine Krone",
        description: `Neben der Regionsregel gilt: **Jede Zeile** darf nur **eine einzige Krone** enthalten.\n\nDas bedeutet: Wenn du in einer Zeile eine Krone platziert hast, können alle anderen Felder dieser Zeile eliminiert werden.\n\n*Aufgabe: Platziere die Krone in Zeile 2 (die einzig mögliche Position).*`,
        size: 4,
        regions: [
            [0, 0, 0, 1],
            [2, 0, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ],
        regionColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E'],
        initialGrid: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY]
        ],
        solution: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY]
        ],
        targetCells: [{r: 1, c: 3, val: CROWNS_CROWN}],
        explanation: "Richtig! Nur eine Krone pro Zeile."
    },
    {
        id: 4,
        title: "4. Eine pro Spalte",
        subtitle: "Jede Spalte enthält genau eine Krone",
        description: `Die gleiche Regel gilt auch für **Spalten**: Jede Spalte darf nur **eine einzige Krone** enthalten.\n\nZusammen mit der Zeilenregel bedeutet das: N Kronen auf N×N Feldern.\n\n*Aufgabe: Platziere die fehlende Krone in der richtigen Spalte.*`,
        size: 4,
        regions: [
            [0, 0, 0, 1],
            [2, 0, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ],
        regionColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E'],
        initialGrid: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY]
        ],
        solution: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY]
        ],
        targetCells: [{r: 3, c: 2, val: CROWNS_CROWN}],
        explanation: "Super! Du hast die Spaltenregel verstanden."
    },
    {
        id: 5,
        title: "5. Keine Berührung",
        subtitle: "Kronen dürfen sich nicht berühren",
        description: `Kronen dürfen sich **niemals berühren** — weder waagerecht, senkrecht noch **diagonal**!\n\nDas heißt: Rund um jede Krone muss ein **Schutzring** aus leeren oder eliminierten Feldern sein.\n\n*Aufgabe: Platziere die Krone so, dass keine andere Krone berührt wird.*`,
        size: 5,
        regions: [
            [0, 0, 0, 2, 2],
            [1, 1, 0, 2, 2],
            [1, 1, 3, 3, 2],
            [1, 3, 3, 4, 4],
            [3, 3, 4, 4, 4]
        ],
        regionColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#A29BFE'],
        initialGrid: [
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY]
        ],
        solution: [
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN],
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY]
        ],
        targetCells: [{r: 2, c: 4, val: CROWNS_CROWN}],
        explanation: "Perfekt! Keine Krone berührt eine andere."
    },
    {
        id: 6,
        title: "6. Eliminieren mit ✕",
        subtitle: "Schließe unmögliche Felder aus",
        description: `Ein wichtiges Werkzeug ist die **X-Markierung (✕)**. Damit markierst du Felder, die **keine Krone** haben können.\n\nTipp: Wenn eine Krone gesetzt wird, können alle Nachbarfelder (auch diagonal) sowie alle anderen Felder in derselben Zeile, Spalte und Region eliminiert werden.\n\n*Aufgabe: Markiere die unmöglichen Felder neben der Krone mit X.*`,
        size: 4,
        regions: [
            [0, 0, 0, 1],
            [2, 0, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ],
        regionColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E'],
        initialGrid: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY]
        ],
        solution: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY]
        ],
        targetCells: [{r: 0, c: 0, val: CROWNS_X}, {r: 0, c: 2, val: CROWNS_X}],
        explanation: "Genau! Eliminierung ist der Schlüssel zur Lösung."
    },
    {
        id: 7,
        title: "7. Komplettes Puzzle",
        subtitle: "Löse ein ganzes Crowns-Rätsel",
        description: `Jetzt kombiniere alle Regeln und löse ein komplettes Puzzle!\n\n**Zusammenfassung**:\n1. 👑 Eine Krone pro Zeile\n2. 👑 Eine Krone pro Spalte\n3. 👑 Eine Krone pro Farbregion\n4. 🚫 Keine Berührung (auch nicht diagonal)\n\n*Aufgabe: Platziere alle 4 Kronen korrekt.*`,
        size: 4,
        regions: [
            [0, 0, 1, 1],
            [0, 2, 1, 1],
            [2, 2, 3, 3],
            [2, 3, 3, 3]
        ],
        regionColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E'],
        initialGrid: [
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY]
        ],
        solution: [
            [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN],
            [CROWNS_CROWN, CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_EMPTY],
            [CROWNS_EMPTY, CROWNS_EMPTY, CROWNS_CROWN, CROWNS_EMPTY]
        ],
        targetCells: [
            {r: 0, c: 1, val: CROWNS_CROWN},
            {r: 1, c: 3, val: CROWNS_CROWN},
            {r: 2, c: 0, val: CROWNS_CROWN},
            {r: 3, c: 2, val: CROWNS_CROWN}
        ],
        explanation: "Hervorragend! Du hast Crowns gemeistert! 🎉"
    }
];
