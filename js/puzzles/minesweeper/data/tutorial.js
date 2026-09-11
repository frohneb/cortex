/**
 * Minesweeper Tutorial Lektionen (Didaktischer Aufbau)
 * Jedes Tutorial-Level besitzt ein fest definiertes Minenfeld mit eindeutiger Lösung.
 */

import { CELL_REVEALED, CELL_FLAGGED, CELL_HIDDEN } from '../engine.js';

export const MINESWEEPER_TUTORIAL_STEPS = [
    {
        id: 1,
        title: 'Das Minenfeld & Erste Schritte',
        subtitle: 'Was bedeuten die Zahlen?',
        description: 'Willkommen bei **Minesweeper**! Das Ziel ist es, alle sicheren Felder aufzudecken, ohne eine Mine zu treffen. Eine Zahl zeigt an, wie viele Minen sich in den **8 angrenzenden Nachbarfeldern** verbergen. Tippe auf ein verdecktes Feld, um es aufzudecken.',
        size: 4,
        rows: 4,
        cols: 4,
        mineCount: 1,
        mines: [
            [true, false, false, false],
            [false, false, false, false],
            [false, false, false, false],
            [false, false, false, false]
        ],
        adjacency: [
            [-1, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        initialGrid: [
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN],
            [CELL_HIDDEN, CELL_REVEALED, CELL_HIDDEN, CELL_HIDDEN],
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN],
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN]
        ],
        solution: [
            [1, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        explanation: 'Klasse! Du hast verstanden, wie Zahlen Auskunft über benachbarte Minen geben.'
    },
    {
        id: 2,
        title: 'Flaggen setzen (Long-Press)',
        subtitle: 'Markiere vermutete Minen',
        description: 'Wenn du sicher bist, dass unter einem Feld eine Mine liegt, halte das Feld **lange gedrückt** (Long-Press), um eine **rote Flagge 🚩** zu setzen. Flaggen schützen das Feld vor versehentlichem Antippen!',
        size: 3,
        rows: 3,
        cols: 3,
        mineCount: 1,
        mines: [
            [false, false, false],
            [false, false, false],
            [false, false, true]
        ],
        adjacency: [
            [0, 0, 0],
            [0, 1, 1],
            [0, 1, -1]
        ],
        initialGrid: [
            [CELL_REVEALED, CELL_REVEALED, CELL_REVEALED],
            [CELL_REVEALED, CELL_REVEALED, CELL_HIDDEN],
            [CELL_REVEALED, CELL_HIDDEN, CELL_HIDDEN]
        ],
        solution: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 1]
        ],
        explanation: 'Hervorragend! Mit der Flagge hast du die Mine sicher unschädlich markiert.'
    },
    {
        id: 3,
        title: 'Kettenreaktion (Die Null)',
        subtitle: 'Automatische Freilegung',
        description: 'Felder mit einer **0** haben keinerlei Minen in ihrer Nachbarschaft. Wenn du ein 0-Feld aufdeckst, werden automatisch alle angrenzenden sicheren Felder aufgedeckt (**Flood-Fill**). Tippe auf das Feld in der Mitte!',
        size: 4,
        rows: 4,
        cols: 4,
        mineCount: 2,
        mines: [
            [true, false, false, true],
            [false, false, false, false],
            [false, false, false, false],
            [false, false, false, false]
        ],
        adjacency: [
            [-1, 1, 1, -1],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        initialGrid: [
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN],
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN],
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN],
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN]
        ],
        solution: [
            [1, 0, 0, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        explanation: 'Fantastisch! Die Kettenreaktion hat dir auf einen Schlag viele sichere Felder geöffnet.'
    },
    {
        id: 4,
        title: 'Ecken & Randlogik',
        subtitle: 'Weniger Nachbarn am Rand',
        description: 'Ein Eckfeld hat nur **3 Nachbarn**, ein Randfeld nur **5**. Wenn eine Eckzelle eine "1" zeigt und nur noch ein verdecktes Feld angrenzt, muss dieses zwingend die Mine sein!',
        size: 3,
        rows: 3,
        cols: 3,
        mineCount: 1,
        mines: [
            [true, false, false],
            [false, false, false],
            [false, false, false]
        ],
        adjacency: [
            [-1, 1, 0],
            [1, 1, 0],
            [0, 0, 0]
        ],
        initialGrid: [
            [CELL_HIDDEN, CELL_REVEALED, CELL_REVEALED],
            [CELL_REVEALED, CELL_REVEALED, CELL_REVEALED],
            [CELL_REVEALED, CELL_REVEALED, CELL_REVEALED]
        ],
        solution: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        explanation: 'Sehr gut! An den Rändern lässt sich die Minenposition besonders schnell ableiten.'
    },
    {
        id: 5,
        title: 'Sicheres Aufdecken durch Flaggen',
        subtitle: 'Vollständige Nachbarschaft nutzen',
        description: 'Sobald du alle Minen um eine Zahl herum mit Flaggen 🚩 markiert hast, sind alle verbleibenden Nachbarfelder **garantiert sicher**. Decke sie gefahrlos auf!',
        size: 3,
        rows: 3,
        cols: 3,
        mineCount: 2,
        mines: [
            [true, false, true],
            [false, false, false],
            [false, false, false]
        ],
        adjacency: [
            [-1, 2, -1],
            [1, 2, 1],
            [0, 0, 0]
        ],
        initialGrid: [
            [CELL_FLAGGED, CELL_REVEALED, CELL_FLAGGED],
            [CELL_HIDDEN, CELL_REVEALED, CELL_HIDDEN],
            [CELL_REVEALED, CELL_REVEALED, CELL_REVEALED]
        ],
        solution: [
            [1, 0, 1],
            [0, 0, 0],
            [0, 0, 0]
        ],
        explanation: 'Perfekt! Du weißt jetzt, wie du bekannte Minen nutzt, um neue sichere Felder freizulegen.'
    },
    {
        id: 6,
        title: 'Deine erste Mission',
        subtitle: 'Meistere ein ganzes Mini-Minenfeld',
        description: 'Nutze alles Gelernte: Decke sichere Felder auf, markiere Minen mit Flaggen und löse das gesamte 4×4 Minenfeld!',
        size: 4,
        rows: 4,
        cols: 4,
        mineCount: 2,
        mines: [
            [false, false, false, false],
            [false, true, false, false],
            [false, false, true, false],
            [false, false, false, false]
        ],
        adjacency: [
            [1, 1, 1, 0],
            [1, -1, 2, 1],
            [1, 2, -1, 1],
            [0, 1, 1, 1]
        ],
        initialGrid: [
            [CELL_REVEALED, CELL_HIDDEN, CELL_HIDDEN, CELL_REVEALED],
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN],
            [CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN, CELL_HIDDEN],
            [CELL_REVEALED, CELL_HIDDEN, CELL_HIDDEN, CELL_REVEALED]
        ],
        solution: [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0]
        ],
        explanation: 'Bravo! Du hast die Grundlagen von Minesweeper vollständig gemeistert.'
    }
];
