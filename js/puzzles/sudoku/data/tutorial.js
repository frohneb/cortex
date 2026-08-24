/**
 * Sudoku Grundlagen-Tutorial (10 Lektionen)
 * Führt schrittweise in Zeilen, Spalten, Blöcke, Notizen und 9×9 Klassik ein.
 */

export const SUDOKU_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Das Sudoku-Gitter",
        subtitle: "Zeilen & Zahlen",
        size: 4,
        initialGrid: [
            [1, 2, 3, 0],
            [3, 4, 1, 2],
            [2, 1, 4, 3],
            [4, 3, 2, 1]
        ],
        targetCells: [{ r: 0, c: 3, val: 4 }],
        description: "In jeder Zeile muss jede Zahl von 1 bis 4 genau einmal vorkommen. In der ersten Zeile fehlen noch: **4**.\n\nTippe auf das markierte Feld und wähle die **4**.",
        explanation: "Sehr gut! Jede Zeile darf keine doppelten Zahlen enthalten."
    },
    {
        id: 2,
        title: "2. Spalten-Regel",
        subtitle: "Senkrechte Vollständigkeit",
        size: 4,
        initialGrid: [
            [1, 2, 3, 4],
            [3, 0, 1, 2],
            [2, 1, 4, 3],
            [4, 3, 2, 1]
        ],
        targetCells: [{ r: 1, c: 1, val: 4 }],
        description: "Auch in jeder **Spalte** darf jede Ziffer nur einmal stehen. In Spalte 2 fehlt noch die **4**.",
        explanation: "Klasse! Zeilen und Spalten folgen demselben Ausschlussprinzip."
    },
    {
        id: 3,
        title: "3. 2×2 Block-Regel",
        subtitle: "Räumliche Einheiten",
        size: 4,
        initialGrid: [
            [1, 2, 3, 4],
            [3, 4, 1, 2],
            [2, 1, 4, 0],
            [4, 3, 2, 1]
        ],
        targetCells: [{ r: 2, c: 3, val: 3 }],
        description: "Jeder fett umrandete **2×2-Block** enthält ebenfalls alle Zahlen von 1 bis 4 genau einmal. Im unteren rechten Block fehlt noch die **3**.",
        explanation: "Perfekt! Die 3 Hauptregeln sind: Zeile, Spalte und Block."
    },
    {
        id: 4,
        title: "4. Naked Single (Eindeutiger Rest)",
        subtitle: "Kombiniertes Ausschließen",
        size: 4,
        initialGrid: [
            [1, 2, 3, 4],
            [0, 4, 1, 2],
            [2, 0, 4, 3],
            [4, 3, 2, 1]
        ],
        targetCells: [
            { r: 1, c: 0, val: 3 },
            { r: 2, c: 1, val: 1 }
        ],
        description: "Prüfe für jedes leere Feld die Peers (Zeile, Spalte und Block). Es bleibt jeweils nur eine einzige gültige Zahl übrig.",
        explanation: "Ausgezeichnet! Wenn nur noch eine Zahl erlaubt ist, spricht man vom 'Naked Single'."
    },
    {
        id: 5,
        title: "5. Hidden Single in Zeile",
        subtitle: "Wo kann die Zahl hin?",
        size: 4,
        initialGrid: [
            [0, 0, 1, 2],
            [1, 2, 3, 4],
            [2, 1, 4, 3],
            [4, 3, 2, 1]
        ],
        targetCells: [
            { r: 0, c: 0, val: 3 },
            { r: 0, c: 1, val: 4 }
        ],
        description: "In Zeile 1 fehlen 3 und 4. Da in Spalte 1 bereits eine 4 steht, kann die 4 nur in Feld (1,2) platziert werden.",
        explanation: "Genau! Manchmal schaut man nicht darauf, was in eine Zelle passt, sondern wo eine Zahl zwingend hin muss ('Hidden Single')."
    },
    {
        id: 6,
        title: "6. Das klassische 9×9 Gitter",
        subtitle: "Zahlen 1 bis 9 & 3×3 Blöcke",
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
            [3, 4, 5, 2, 8, 6, 1, 7, 0]
        ],
        targetCells: [{ r: 8, c: 8, val: 9 }],
        description: "Im klassischen 9×9 Sudoku nutzt man die Ziffern 1 bis 9 und 3×3-Blöcke. Setze die letzte fehlende Ziffer in der letzten Zeile: die **9**.",
        explanation: "Hervorragend! Das klassische 9×9 Sudoku funktioniert nach genau denselben Prinzipien."
    },
    {
        id: 7,
        title: "7. Hidden Single im 3×3 Block",
        subtitle: "Kreuzweises Scannen",
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
            [3, 4, 5, 2, 8, 6, 1, 0, 9]
        ],
        targetCells: [{ r: 8, c: 7, val: 7 }],
        description: "Finde die verbleibende Position für die **7** im unteren rechten Block.",
        explanation: "Perfekt! Cross-Hatching ermöglicht schnelles Finden von Hidden Singles."
    },
    {
        id: 8,
        title: "8. Notizen-System (Kandidaten)",
        subtitle: "Möglichkeiten festhalten",
        size: 4,
        initialGrid: [
            [1, 2, 3, 4],
            [3, 4, 1, 2],
            [2, 1, 0, 0],
            [4, 3, 2, 1]
        ],
        targetCells: [
            { r: 2, c: 2, val: 4 },
            { r: 2, c: 3, val: 3 }
        ],
        description: "Nutze den Notizen-Modus (Stift-Symbol), um mögliche Zahlen einzutragen und schrittweise zu eliminieren.",
        explanation: "Klasse! Notizen sind das wichtigste Werkzeug für anspruchsvolle Sudokus."
    },
    {
        id: 9,
        title: "9. Peer-Ausschluss im 9×9",
        subtitle: "Zeile, Spalte & Block gleichzeitig",
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
        targetCells: [{ r: 0, c: 2, val: 4 }],
        description: "Betrachte Feld (1,3): In Zeile 1 stehen 5, 3, 7. In Spalte 3 stehen 8. Im Block stehen 5, 3, 6, 9, 8. Setze die logisch zwingende Ziffer.",
        explanation: "Stark gelöst!"
    },
    {
        id: 10,
        title: "10. Erstes komplettes 4×4 Rätsel",
        subtitle: "Alles zusammen anwenden",
        size: 4,
        initialGrid: [
            [0, 2, 0, 4],
            [3, 0, 1, 0],
            [0, 1, 0, 3],
            [4, 0, 2, 0]
        ],
        description: "Löse dieses 4×4 Rätsel vollständig mit allen erlernten Regeln.",
        explanation: "Fantastisch! Du hast die Sudoku-Grundlagen meisterhaft abgeschlossen!"
    }
];
