/**
 * Akari Grundlagen-Tutorial (8 Lektionen)
 * Führt schrittweise in Lichtstrahlen, Wände, Wandzahlen und Ausleuchtung ein.
 */

export const AKARI_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Das Licht der Glühbirne",
        subtitle: "Horizontale & vertikale Strahlen",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 2, c: 2, val: 1 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Glühlampen (💡) senden helle Lichtstrahlen **horizontal und vertikal** über das gesamte Spielfeld aus.\n\nTippe auf die Mitte (Zeile 3, Spalte 3), um eine Lampe zu setzen.",
        explanation: "Hervorragend! Die Lampe beleuchtet sofort ihre gesamte Zeile und Spalte."
    },
    {
        id: 2,
        title: "2. Schwarze Wände",
        subtitle: "Hindernisse für Licht",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, -1, null, null],
            [null, -1, null, -1, null],
            [null, null, -1, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, null, 0, null, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 2, c: 2, val: 1 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, null, 1, null, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Schwarze Wände **blockieren** das Licht. Strahlen stoppen an der Wand.\n\nPlatziere die Lampe im Zentrum. Siehe wie die 4 Wände den Lichtstrahl eingrenzen.",
        explanation: "Genau! Wände teilen das Gitter in separate Sichtbereiche auf."
    },
    {
        id: 3,
        title: "3. Kein Blenden",
        subtitle: "Keine zwei Lampen in einer Sichtlinie",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, -1, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [1, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 2, c: 4, val: 1 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [1, 0, null, 0, 1],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Zwei Lampen dürfen sich **niemals** gegenseitig anstrahlen.\n\nRechts von der Wand darf eine zweite Lampe stehen, da die schwarze Wand in der Mitte das Blenden verhindert. Setze eine Lampe auf (Zeile 3, Spalte 5).",
        explanation: "Sehr gut! Durch die Wand dazwischen ist diese Platzierung absolut regelkonform."
    },
    {
        id: 4,
        title: "4. Wandzahlen (0 bis 4)",
        subtitle: "Orthogonale Lampenzählung",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, 2, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 2, c: 3, val: 1 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, null, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Eine Zahl auf einer Wand gibt an, wie viele Lampen **orthogonal direkt angrenzen** (oben, unten, links, rechts).\n\nDie Wand '2' hat oben bereits 1 Lampe. Setze die zweite Lampe rechts daneben (Zeile 3, Spalte 4).",
        explanation: "Perfekt! Die Wand '2' ist damit vollständig erfüllt und leuchtet dezent auf."
    },
    {
        id: 5,
        title: "5. Die 0-Wand & Ausschluss",
        subtitle: "Punkte setzen zur Markierung",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, 0, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 2, val: 2 },
            { r: 1, c: 1, val: 2 },
            { r: 1, c: 3, val: 2 },
            { r: 2, c: 2, val: 2 }
        ],
        solution: [
            [0, 0, 2, 0, 0],
            [0, 2, null, 2, 0],
            [0, 0, 2, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "An einer Wand mit der Zahl **0** darf **keine einzige Lampe** angrenzen!\n\nMarkiere alle 4 angrenzenden Nachbarfelder mit Punkten (•) durch 2-maliges Antippen.",
        explanation: "Klasse! Punkte helfen dir, sichere Felder für spätere Züge zu reservieren."
    },
    {
        id: 6,
        title: "6. Die 4-Wand & Volle Belegung",
        subtitle: "Erzwungene Platzierung",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, 4, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 1, c: 2, val: 1 },
            { r: 2, c: 1, val: 1 },
            { r: 2, c: 3, val: 1 },
            { r: 3, c: 2, val: 1 }
        ],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, null, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Eine Wand mit **4** hat nur 4 orthogonale Nachbarn. Daher muss **jedes einzelne** Nachbarfeld eine Lampe (💡) sein!\n\nSetze alle 4 Lampen um die '4'.",
        explanation: "Wunderbar! 4er-Wände sind immer ein sofortiger, sicherer Startpunkt."
    },
    {
        id: 7,
        title: "7. Vollständige Ausleuchtung",
        subtitle: "Jedes weiße Feld muss Licht erhalten",
        size: 5,
        walls: [
            [-1, null, null, null, -1],
            [null, null, null, null, null],
            [null, null, 0, null, null],
            [null, null, null, null, null],
            [-1, null, null, null, -1]
        ],
        initialGrid: [
            [null, 0, 0, 0, null],
            [0, 0, 2, 0, 0],
            [0, 2, null, 2, 0],
            [0, 0, 2, 0, 0],
            [null, 0, 0, 0, null]
        ],
        solution: [
            [null, 1, 0, 1, null],
            [1, 0, 2, 0, 1],
            [0, 2, null, 2, 0],
            [1, 0, 2, 0, 1],
            [null, 1, 0, 1, null]
        ],
        description: "Alle weißen Felder müssen am Ende beleuchtet sein. Platziere Lampen strategisch an den Rändern, um das gesamte Gitter strahlen zu lassen.",
        explanation: "Toll gemacht! Das gesamte 5×5 Gitter ist nun lückenlos ausgeleuchtet."
    },
    {
        id: 8,
        title: "8. Erstes vollständiges Rätsel",
        subtitle: "Kombiniere alle Regeln",
        size: 5,
        walls: [
            [null, 1, null, null, null],
            [null, null, null, null, -1],
            [null, -1, 1, null, null],
            [-1, null, null, null, null],
            [null, null, null, 2, null]
        ],
        initialGrid: [
            [0, null, 0, 0, 0],
            [0, 0, 0, 0, null],
            [0, null, null, 0, 0],
            [null, 0, 0, 0, 0],
            [0, 0, 0, null, 0]
        ],
        solution: [
            [0, null, 0, 1, 0],
            [1, 0, 0, 0, null],
            [0, null, null, 0, 1],
            [null, 0, 1, 0, 0],
            [0, 0, 0, null, 1]
        ],
        description: "Löse dein erstes vollständiges 5×5 Akari-Rätsel! Nutze die Wandzahlen und die Ausleuchtungs-Prüfung.",
        explanation: "Herzlichen Glückwunsch! Du beherrschst die Grundlagen von Akari perfekt."
    }
];
