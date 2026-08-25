/**
 * Nonogramm Grundlagen-Tutorial (5 Lektionen)
 * Führt schrittweise in Zahlenhinweise, Vollzeilen, Überlappungen und Kreuze ein.
 */

export const NONOGRAM_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Vollständige Zeilen (Vollblock)",
        subtitle: "Maximale Blockgröße",
        size: 5,
        rowClues: [[5], [0], [0], [0], [0]],
        colClues: [[1], [1], [1], [1], [1]],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 0, val: 1 },
            { r: 0, c: 1, val: 1 },
            { r: 0, c: 2, val: 1 },
            { r: 0, c: 3, val: 1 },
            { r: 0, c: 4, val: 1 }
        ],
        solution: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Wenn ein Zahlenhinweis genau der Zeilenlänge entspricht (hier **5** in einem 5×5 Gitter), müssen **alle Felder dieser Zeile gefüllt werden**.\n\nFülle alle 5 Felder der obersten Zeile.",
        explanation: "Perfekt! Die oberste Zeile ist komplett gefüllt und erfüllt ihren Hinweis 5."
    },
    {
        id: 2,
        title: "2. Leere Zeilen (Die Null 0)",
        subtitle: "Ausschließen mit Kreuzen",
        size: 5,
        rowClues: [[5], [0], [0], [0], [0]],
        colClues: [[1], [1], [1], [1], [1]],
        initialGrid: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 1, c: 0, val: 2 },
            { r: 1, c: 1, val: 2 },
            { r: 1, c: 2, val: 2 },
            { r: 1, c: 3, val: 2 },
            { r: 1, c: 4, val: 2 }
        ],
        solution: [
            [1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Ein Hinweis von **0** bedeutet, dass in dieser Zeile kein einziges Feld gefüllt sein darf. Markiere alle Felder mit einem Kreuz (❌), um sie als sicher leer auszuschließen.\n\nSetze in Zeile 2 überall Kreuze.",
        explanation: "Ausgezeichnet! Kreuze helfen dir, unberührte Bereiche sicher abzugrenzen."
    },
    {
        id: 3,
        title: "3. Die Überlappungs-Regel (Overlap)",
        subtitle: "Schnittmengen finden",
        size: 5,
        rowClues: [[5], [2, 2], [4], [0], [0]],
        colClues: [[1], [1], [1], [1], [1]],
        initialGrid: [
            [1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 2, c: 1, val: 1 },
            { r: 2, c: 2, val: 1 },
            { r: 2, c: 3, val: 1 }
        ],
        solution: [
            [1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Ein 4er-Block in einer 5er-Zeile kann ganz links (Feld 1–4) oder ganz rechts (Feld 2–5) liegen. Die mittleren 3 Felder (Spalten 2, 3, 4) sind **in beiden Fällen sicher gefüllt**!\n\nFülle die 3 mittleren Felder in Zeile 3.",
        explanation: "Klasse! Die Schnittmenge ist eine der wichtigsten Techniken beim Lösen von Nonogrammen."
    },
    {
        id: 4,
        title: "4. Mehrere Blöcke & Lücken",
        subtitle: "Mindestabstand von 1 Feld",
        size: 5,
        rowClues: [[5], [2, 2], [4], [0], [0]],
        colClues: [[1], [1], [1], [1], [1]],
        initialGrid: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 1, c: 0, val: 1 },
            { r: 1, c: 1, val: 1 },
            { r: 1, c: 2, val: 2 },
            { r: 1, c: 3, val: 1 },
            { r: 1, c: 4, val: 1 }
        ],
        solution: [
            [1, 1, 1, 1, 1],
            [1, 1, 2, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Der Hinweis **2 2** benötigt 2 + 1 (Lücke) + 2 = 5 Felder. Die Platzierung ist exakt vorgegeben: 2 gefüllt, Mitte frei (❌), 2 gefüllt.\n\nFülle Zeile 2 entsprechend aus.",
        explanation: "Hervorragend! Zwischen zwei separaten Blöcken muss immer mindestens 1 leeres Feld liegen."
    },
    {
        id: 5,
        title: "5. Erstes komplettes Motiv: Das Herz",
        subtitle: "Zusammenspiel von Zeilen & Spalten",
        size: 5,
        rowClues: [
            [1, 1],
            [5],
            [5],
            [3],
            [1]
        ],
        colClues: [
            [3],
            [4],
            [4],
            [4],
            [3]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 1, val: 1 },
            { r: 0, c: 3, val: 1 },
            { r: 1, c: 0, val: 1 },
            { r: 1, c: 1, val: 1 },
            { r: 1, c: 2, val: 1 },
            { r: 1, c: 3, val: 1 },
            { r: 1, c: 4, val: 1 },
            { r: 2, c: 0, val: 1 },
            { r: 2, c: 1, val: 1 },
            { r: 2, c: 2, val: 1 },
            { r: 2, c: 3, val: 1 },
            { r: 2, c: 4, val: 1 },
            { r: 3, c: 1, val: 1 },
            { r: 3, c: 2, val: 1 },
            { r: 3, c: 3, val: 1 },
            { r: 4, c: 2, val: 1 }
        ],
        solution: [
            [0, 1, 0, 1, 0],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0]
        ],
        description: "Kombiniere Zeilen- und Spaltenhinweise, um das Pixel-Herz ❤️ zu vollenden.\n\nFülle die richtigen Felder aus!",
        explanation: "Fantastisch! Du hast dein erstes Nonogramm gelöst und das Herz enthüllt!"
    }
];
