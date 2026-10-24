/**
 * SumGrid Interaktives Tutorial
 * 6 aufeinander aufbauende Lektionen für Anfänger und Fortgeschrittene
 */

import { SUMGRID_NEUTRAL, SUMGRID_KEEP, SUMGRID_CROSS } from '../engine.js';

export const SUMGRID_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Zielsummen & Aktivieren 🎯",
        subtitle: "Die Grundmechanik von SumGrid",
        description: `Willkommen bei **SumGrid**!\n\nAm rechten Rand jeder Zeile und am unteren Rand jeder Spalte steht eine **Zielsumme**.\n\nTippe auf eine Zahl, um sie zu **behalten (grün)** oder erneut, um sie zu **streichen (✕)**.\n\n*Aufgabe: In Zeile 1 ist das Ziel 5. Behalte die 2 und die 3, streiche die 1.*`,
        size: 3,
        numbers: [
            [2, 3, 1],
            [1, 2, 4],
            [3, 1, 2]
        ],
        rowTargets: [5, 6, 5],
        colTargets: [5, 5, 6],
        initialGrid: [
            [SUMGRID_NEUTRAL, SUMGRID_NEUTRAL, SUMGRID_NEUTRAL],
            [SUMGRID_CROSS, SUMGRID_KEEP, SUMGRID_KEEP],
            [SUMGRID_KEEP, SUMGRID_CROSS, SUMGRID_KEEP]
        ],
        solution: [
            [1, 1, 0],
            [0, 1, 1],
            [1, 0, 1]
        ],
        targetCells: [
            { r: 0, c: 0, val: SUMGRID_KEEP },
            { r: 0, c: 1, val: SUMGRID_KEEP },
            { r: 0, c: 2, val: SUMGRID_CROSS }
        ],
        explanation: "Perfekt! 2 + 3 ergibt genau 5. Zeile 1 ist vollständig erfüllt!"
    },
    {
        id: 2,
        title: "2. Die Nullsumme 🚫",
        subtitle: "Sofortiger Ausschluss einer ganzen Reihe",
        description: `Wenn eine Zielsumme am Rand **0** beträgt, darf keine einzige Zahl in dieser Reihe zur Summe beitragen.\n\n*Aufgabe: In Zeile 2 ist das Ziel 0. Streiche alle Zahlen dieser Zeile durch.*`,
        size: 3,
        numbers: [
            [2, 4, 1],
            [5, 3, 2],
            [1, 2, 4]
        ],
        rowTargets: [6, 0, 4],
        colTargets: [2, 4, 4],
        initialGrid: [
            [SUMGRID_KEEP, SUMGRID_KEEP, SUMGRID_CROSS],
            [SUMGRID_NEUTRAL, SUMGRID_NEUTRAL, SUMGRID_NEUTRAL],
            [SUMGRID_CROSS, SUMGRID_CROSS, SUMGRID_KEEP]
        ],
        solution: [
            [1, 1, 0],
            [0, 0, 0],
            [0, 0, 1]
        ],
        targetCells: [
            { r: 1, c: 0, val: SUMGRID_CROSS },
            { r: 1, c: 1, val: SUMGRID_CROSS },
            { r: 1, c: 2, val: SUMGRID_CROSS }
        ],
        explanation: "Hervorragend! Ist das Ziel 0, können alle Zahlen der Zeile oder Spalte sofort eliminiert werden."
    },
    {
        id: 3,
        title: "3. Die Vollsumme ✨",
        subtitle: "Wenn alle Zahlen gebraucht werden",
        description: `Entspricht das Ziel genau der Summe aller Zahlen einer Zeile, muss **jede einzelne Zahl** behalten werden.\n\n*Aufgabe: In Zeile 1 stehen 2, 3 und 4 (Summe = 9). Das Ziel ist 9. Aktiviere alle drei Zahlen.*`,
        size: 3,
        numbers: [
            [2, 3, 4],
            [1, 4, 2],
            [3, 1, 5]
        ],
        rowTargets: [9, 4, 6],
        colTargets: [2, 8, 9],
        initialGrid: [
            [SUMGRID_NEUTRAL, SUMGRID_NEUTRAL, SUMGRID_NEUTRAL],
            [SUMGRID_CROSS, SUMGRID_KEEP, SUMGRID_CROSS],
            [SUMGRID_CROSS, SUMGRID_KEEP, SUMGRID_KEEP]
        ],
        solution: [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 1]
        ],
        targetCells: [
            { r: 0, c: 0, val: SUMGRID_KEEP },
            { r: 0, c: 1, val: SUMGRID_KEEP },
            { r: 0, c: 2, val: SUMGRID_KEEP }
        ],
        explanation: "Exakt! 2 + 3 + 4 = 9. Wenn nichts weggelassen werden kann, bleiben alle aktiv."
    },
    {
        id: 4,
        title: "4. Zu große Zahlen ausschließen ⚠️",
        subtitle: "Überhang-Deduktion",
        description: `Ist eine Zahl **größer als das verbleibende Ziel**, kann sie niemals Teil der Lösung sein und muss gestrichen werden.\n\n*Aufgabe: In Zeile 2 ist das Ziel nur 3. Die 7 ist viel zu groß. Streiche die 7 durch.*`,
        size: 3,
        numbers: [
            [1, 3, 2],
            [7, 2, 1],
            [2, 4, 3]
        ],
        rowTargets: [4, 3, 7],
        colTargets: [1, 9, 4],
        initialGrid: [
            [SUMGRID_KEEP, SUMGRID_KEEP, SUMGRID_CROSS],
            [SUMGRID_NEUTRAL, SUMGRID_KEEP, SUMGRID_KEEP],
            [SUMGRID_CROSS, SUMGRID_KEEP, SUMGRID_KEEP]
        ],
        solution: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 1, 1]
        ],
        targetCells: [
            { r: 1, c: 0, val: SUMGRID_CROSS }
        ],
        explanation: "Genau richtig! Da 7 > 3 ist, kann sie niemals zur Zeilensumme 3 gehören."
    },
    {
        id: 5,
        title: "5. Wechselwirkung Zeile × Spalte 🔄",
        subtitle: "Entscheidungen über Kreuz nutzen",
        description: `Jedes Feld gehört gleichzeitig zu einer Zeile und einer Spalte.\n\n*Aufgabe: Spalte 2 hat das Ziel 2 und bereits eine aktive 2 in Zeile 2. Daher muss die 5 in Zeile 1, Spalte 2 gestrichen werden.*`,
        size: 3,
        numbers: [
            [3, 5, 2],
            [1, 2, 4],
            [2, 3, 1]
        ],
        rowTargets: [5, 6, 2],
        colTargets: [5, 2, 6],
        initialGrid: [
            [SUMGRID_KEEP, SUMGRID_NEUTRAL, SUMGRID_KEEP],
            [SUMGRID_CROSS, SUMGRID_KEEP, SUMGRID_KEEP],
            [SUMGRID_KEEP, SUMGRID_CROSS, SUMGRID_CROSS]
        ],
        solution: [
            [1, 0, 1],
            [0, 1, 1],
            [1, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 1, val: SUMGRID_CROSS }
        ],
        explanation: "Sehr gut! Die Spalte hat das Schicksal der Zelle entschieden, wodurch nun auch die Zeile perfekt aufgeht."
    },
    {
        id: 6,
        title: "6. Die Differenz-Methode ➖",
        subtitle: "Rückwärts denken",
        description: `Summiere alle Zahlen einer Zeile: Wenn die Gesamtsumme z. B. 12 ist und das Ziel 9, musst du Zahlen finden, die zusammen **genau 3 ergeben**, und diese streichen!\n\n*Aufgabe: In Zeile 1 (4, 3, 5 = 12) ist das Ziel 9. Die Differenz ist 3. Streiche die 3 und behalte die 4 und 5.*`,
        size: 3,
        numbers: [
            [4, 3, 5],
            [2, 1, 3],
            [1, 4, 2]
        ],
        rowTargets: [9, 5, 4],
        colTargets: [6, 4, 8],
        initialGrid: [
            [SUMGRID_NEUTRAL, SUMGRID_NEUTRAL, SUMGRID_NEUTRAL],
            [SUMGRID_KEEP, SUMGRID_CROSS, SUMGRID_KEEP],
            [SUMGRID_CROSS, SUMGRID_KEEP, SUMGRID_CROSS]
        ],
        solution: [
            [1, 0, 1],
            [1, 0, 1],
            [0, 1, 0]
        ],
        targetCells: [
            { r: 0, c: 0, val: SUMGRID_KEEP },
            { r: 0, c: 1, val: SUMGRID_CROSS },
            { r: 0, c: 2, val: SUMGRID_KEEP }
        ],
        explanation: "Glückwunsch! Du beherrschst jetzt alle Meistertechniken von SumGrid!"
    }
];
