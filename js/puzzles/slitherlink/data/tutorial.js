/**
 * Slitherlink Grundlagen-Tutorial (6 Schritte)
 * Führt schrittweise in 0er-Zellen, 3er-Ecken, Punktgrad-2 und geschlossene Rundwege ein.
 */

export const SLITHERLINK_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Das Ziel: Eine geschlossene Schleife",
        subtitle: "Verbinde die Punkte",
        size: 3,
        clues: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [1, 1, 1],
            [0, 0, 0],
            [0, 0, 0],
            [1, 1, 1]
        ],
        initialVEdges: [
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 1, 1],
                [0, 0, 0],
                [0, 0, 0],
                [1, 1, 1]
            ],
            vEdges: [
                [1, 0, 0, 1],
                [1, 0, 0, 1],
                [1, 0, 0, 1]
            ]
        },
        description: "Das Ziel von Slitherlink ist es, **einen einzigen geschlossenen Rundweg (Schleife)** entlang der Gitterpunkte zu zeichnen.\n\nSchließe die Schleife, indem du die beiden fehlenden vertikalen Kanten in der untersten Reihe einzeichnest (durch Antippen oder Wischen).",
        explanation: "Perfekt! Die Schleife ist geschlossen und verbindet die Punkte ohne Abzweigungen."
    },
    {
        id: 2,
        title: "2. Die Null-Regel (0)",
        subtitle: "Keine Kanten erlaubt",
        size: 3,
        clues: [
            [null, 0, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [0, 2, 0],
                [0, 2, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [0, 2, 2, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Eine Zahl in einer Zelle gibt an, **wie viele der 4 Kanten** Teil der Schleife sein müssen.\n\nUm eine **0** darf **keine einzige Kante** verlaufen! Markiere alle 4 Kanten der 0 mit einem Kreuz (✕), z. B. durch langes Drücken oder zweimaliges Antippen.",
        explanation: "Sehr gut! Um eine 0 herum sind alle Kanten sofort gesperrt."
    },
    {
        id: 3,
        title: "3. Dreier in der Ecke (3)",
        subtitle: "Erzwungene Außenkanten",
        size: 3,
        clues: [
            [3, null, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [1, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Befindet sich eine **3** in einer Spielfeldecke, müssen die **beiden äußeren Kanten der Ecke zwingend Linien** sein.\n\n*Hinweis:* Welche der beiden Innenkanten die 3. Linie der Zelle wird, entscheidet sich erst später im Spielverlauf – die 2 Außenkanten sind jedoch sofort zu 100 % sicher!\n\nZeichne die beiden äußeren Kanten oben links ein.",
        explanation: "Exzellent! Der Eckpunkt muss genau 2 Linien haben – daher sind die beiden Außenkanten sofort zwingend gesetzt, noch bevor die dritte Kante feststeht."
    },
    {
        id: 4,
        title: "4. Exakt 2 Linien pro Punkt",
        subtitle: "Keine Sackgassen, keine Kreuzungen",
        size: 3,
        clues: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [1, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 1, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [1, 0, 0, 0],
                [1, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "An jedem Punkt der Schleife treffen **immer genau 2 Linien** zusammen.\n\nDie Linie darf an den Enden nicht einfach aufhören. Verlängere die beiden offenen Enden nach rechts und nach unten.",
        explanation: "Klasse! Ein Linienende muss immer weitergeführt werden, bis sich die Schleife schließt."
    },
    {
        id: 5,
        title: "5. Benachbarte Dreier (3-3)",
        subtitle: "Mittel- und Außenlinien",
        size: 3,
        clues: [
            [3, 3, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 1, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Liegen zwei **3er direkt nebeneinander**, muss die **gemeinsame Kante in der Mitte** sowie die beiden **äußeren Kanten** gezeichnet werden.\n\nZeichne die 3 vertikalen Kanten und die oberen Kanten ein.",
        explanation: "Großartig! Dies ist eines der wichtigsten Standardmuster in Slitherlink."
    },
    {
        id: 6,
        title: "6. Deine erste vollständige Schleife",
        subtitle: "Kombiniere alle Regeln",
        size: 3,
        clues: [
            [2, 1, 2],
            [1, 0, 1],
            [2, 1, 2]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 1, 1],
                [0, 0, 0],
                [0, 0, 0],
                [1, 1, 1]
            ],
            vEdges: [
                [1, 0, 0, 1],
                [1, 0, 0, 1],
                [1, 0, 0, 1]
            ]
        },
        requiresFullLoop: true,
        description: "Nutze die 0 in der Mitte und die Hinweise am Rand, um die vollständige 3×3-Schleife zu zeichnen.",
        explanation: "Herzlichen Glückwunsch! Du beherrschst die Grundlagen von Slitherlink."
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SLITHERLINK_TUTORIAL_STEPS };
}
