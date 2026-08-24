/**
 * Sudoku Fortgeschrittenen-Tutorial (8 Lektionen)
 * Didaktische Einführung in 9×9 Meistertechniken & 16×16 Hexadezimal-Sudokus.
 */

export const SUDOKU_TUTORIAL_ADVANCED_STEPS = [
    {
        id: 1,
        title: "1. Naked Pair (Offenes Paar)",
        subtitle: "Zwei Felder, dieselben zwei Zahlen",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [0, 4, 5, 2, 8, 6, 1, 7, 0]
        ],
        targetCells: [
            { r: 8, c: 0, val: 3 },
            { r: 8, c: 8, val: 9 }
        ],
        description: "Wenn zwei Felder in einer Zeile oder einem Block nur dieselben zwei Kandidaten haben, müssen diese dort stehen. Setze die fehlenden Zahlen in der letzten Zeile.",
        explanation: "Sehr gut! Das Naked Pair ist eine der wichtigsten fortgeschrittenen Techniken."
    },
    {
        id: 2,
        title: "2. Hidden Pair (Verstecktes Paar)",
        subtitle: "Zwei Zahlen an nur zwei Stellen",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 0, 3, 0],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [
            { r: 7, c: 6, val: 6 },
            { r: 7, c: 8, val: 5 }
        ],
        description: "Wenn zwei Ziffern in einer Zeile nur noch auf zwei Feldern platziert werden können, müssen sie dorthin.",
        explanation: "Ausgezeichnet verstanden!"
    },
    {
        id: 3,
        title: "3. Pointing Pair (Block → Zeile)",
        subtitle: "Gefangene Kandidaten",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 0, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [{ r: 8, c: 1, val: 4 }],
        description: "Liegen alle Kandidaten einer Zahl innerhalb eines Blocks auf derselben Zeile, darf diese Zahl nirgendwo sonst auf dieser Zeile außerhalb des Blocks vorkommen.",
        explanation: "Perfekt! Das nennt man 'Pointing Pair'."
    },
    {
        id: 4,
        title: "4. Box-Line Reduction (Linie → Block)",
        subtitle: "Umgekehrte Block-Ausrichtung",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 0, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [{ r: 4, c: 4, val: 5 }],
        description: "Wenn in einer Zeile eine Zahl nur innerhalb eines bestimmten Blocks vorkommen kann, kann sie nirgendwo sonst in diesem Block stehen.",
        explanation: "Klasse logische Kombination!"
    },
    {
        id: 5,
        title: "5. Naked Triple (Offenes Dreierpack)",
        subtitle: "3 Felder, 3 Zahlen",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [0, 0, 0, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [
            { r: 6, c: 0, val: 9 },
            { r: 6, c: 1, val: 6 },
            { r: 6, c: 2, val: 1 }
        ],
        description: "Drei Felder teilen sich eine Teilmenge aus 3 Ziffern. Löse die drei Felder im linken unteren Block.",
        explanation: "Hervorragend erkannt!"
    },
    {
        id: 6,
        title: "6. Das X-Wing Prinzip",
        subtitle: "Rechteck-Formationen in 2 Zeilen/Spalten",
        size: 9,
        initialGrid: [
            [0, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [{ r: 0, c: 0, val: 5 }],
        description: "Wenn eine Ziffer in genau zwei Zeilen an denselben beiden Spaltenpositionen auftritt, bildet sie ein Rechteck ('X-Wing'). Setze die fehlende Ziffer in der linken oberen Ecke.",
        explanation: "Das X-Wing-Muster ist eines der elegantesten Sudoku-Gesetze!"
    },
    {
        id: 7,
        title: "7. Vollständiges 9×9 Meisterstück",
        subtitle: "Klassische Deduktion",
        size: 9,
        initialGrid: [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ],
        description: "Löse dieses klassische 9×9 Sudoku vollständig mit logischer Deduktion und Notizen.",
        explanation: "Super! Du hast das 9×9 Sudoku meisterhaft gelöst!"
    },
    {
        id: 8,
        title: "8. 16×16 Hexadezimal-Sudoku",
        subtitle: "Werte 0 bis F & 4×4 Blöcke",
        size: 16,
        initialGrid: [
            [1,  2,  3,  4,   5,  6,  7,  8,   9, 10, 11, 12,  13, 14, 15,  0],
            [5,  6,  7,  8,   9, 10, 11, 12,  13, 14, 15, 16,   1,  2,  3,  4],
            [9, 10, 11, 12,  13, 14, 15, 16,   1,  2,  3,  4,   5,  6,  7,  8],
            [13, 14, 15, 16,  1,  2,  3,  4,   5,  6,  7,  8,   9, 10, 11, 12],

            [2,  3,  4,  1,   6,  7,  8,  5,  10, 11, 12,  9,  14, 15, 16, 13],
            [6,  7,  8,  5,  10, 11, 12,  9,  14, 15, 16, 13,   2,  3,  4,  1],
            [10, 11, 12,  9,  14, 15, 16, 13,   2,  3,  4,  1,   6,  7,  8,  5],
            [14, 15, 16, 13,   2,  3,  4,  1,   6,  7,  8,  5,  10, 11, 12,  9],

            [3,  4,  1,  2,   7,  8,  5,  6,  11, 12,  9, 10,  15, 16, 13, 14],
            [7,  8,  5,  6,  11, 12,  9, 10,  15, 16, 13, 14,   3,  4,  1,  2],
            [11, 12,  9, 10,  15, 16, 13, 14,   3,  4,  1,  2,   7,  8,  5,  6],
            [15, 16, 13, 14,   3,  4,  1,  2,   7,  8,  5,  6,  11, 12,  9, 10],

            [4,  1,  2,  3,   8,  5,  6,  7,  12,  9, 10, 11,  16, 13, 14, 15],
            [8,  5,  6,  7,  12,  9, 10, 11,  16, 13, 14, 15,   4,  1,  2,  3],
            [12,  9, 10, 11,  16, 13, 14, 15,   4,  1,  2,  3,   8,  5,  6,  7],
            [16, 13, 14, 15,   4,  1,  2,  3,   8,  5,  6,  7,  12,  9, 10, 11]
        ],
        targetCells: [{ r: 0, c: 15, val: 16 }],
        description: "Im gigantischen 16×16 Hexadezimal-Sudoku nutzt man die Werte **0 bis F** in 4×4-Blöcken. Setze den fehlenden Hex-Wert **F** (16. Wert) in Zeile 1!",
        explanation: "Hut ab! Du beherrschst nun alle Sudoku-Größen bis zum 16×16 Hexadezimal-Meister!"
    }
];
