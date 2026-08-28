/**
 * Slitherlink Fortgeschrittene Lektionen & Meister-Muster (6 Lektionen)
 * Diagonale 3er, 1er an Ecken, Dead-End-Ausschluss und Schleifen-Vermeidung.
 */

export const SLITHERLINK_TUTORIAL_ADVANCED_STEPS = [
    {
        id: 1,
        title: "1. Diagonale Dreier",
        subtitle: "Gegenüberliegende Ecken",
        size: 3,
        clues: [
            [3, null, null],
            [null, 3, null],
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
                [0, 1, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [1, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Berühren sich zwei **3er diagonal an einer Ecke**, müssen die beiden jeweils **äußeren Kanten** Linien sein.",
        explanation: "Hervorragend! Die Diagonale erzwingt den Fluss der Schleife um die Berührungsecke herum."
    },
    {
        id: 2,
        title: "2. 1er an der Ecke",
        subtitle: "Keine äußere Spitze",
        size: 3,
        clues: [
            [1, null, null],
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
                [2, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [2, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Steht eine **1 in der Spielfeldecke**, können die beiden äußeren Kanten der Ecke niemals gleichzeitig Linien sein. Setzt man eine Außenlinie, müsste auch die zweite da sein (Sackgasse am Eckpunkt) $\rightarrow$ Die beiden äußeren Eckenkanten können markiert werden.",
        explanation: "Exzellent kombiniert!"
    },
    {
        id: 3,
        title: "3. Teilschleifen-Vermeidung (Sub-Loops)",
        subtitle: "Kein verfrühter Kreis",
        size: 4,
        clues: [
            [2, 2, null, null],
            [2, 2, null, null],
            [null, null, 2, 2],
            [null, null, 2, 2]
        ],
        initialHEdges: [
            [1, 1, 0, 0],
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 1, 1],
            [0, 0, 1, 1]
        ],
        initialVEdges: [
            [1, 0, 1, 0, 0],
            [1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1],
            [0, 0, 1, 0, 1]
        ],
        solution: {
            hEdges: [
                [1, 1, 0, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 1]
            ],
            vEdges: [
                [1, 0, 1, 0, 0],
                [1, 0, 1, 0, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1]
            ]
        },
        description: "Zwei offene Linienenden dürfen sich **niemals vorzeitig schließen**, wenn noch weitere Zahlen im Gitter unverbunden bleiben.",
        explanation: "Sehr gut! Es darf nur genau eine einzige Gesamtschleife geben."
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SLITHERLINK_TUTORIAL_ADVANCED_STEPS };
}
