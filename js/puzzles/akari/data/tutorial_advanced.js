/**
 * Akari Fortgeschrittenes Tutorial (6 Lektionen)
 * Didaktische Meister-Strategien: Ecken, Wand-Interferenzen und Strahlenausschluss.
 */

export const AKARI_TUTORIAL_ADVANCED_STEPS = [
    {
        id: 1,
        title: "1. Die 3er-Wand am Rand",
        subtitle: "Erzwungene Belegung bei 3 Nachbarn",
        size: 5,
        walls: [
            [null, 3, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, null, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 0, val: 1 },
            { r: 0, c: 2, val: 1 },
            { r: 1, c: 1, val: 1 }
        ],
        solution: [
            [1, null, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Wenn eine **3er-Wand** direkt am Außenrand liegt, hat sie nur genau 3 weiße Nachbarfelder (links, rechts, unten). Alle 3 müssen daher **zwingend Lampen** sein!\n\nSetze alle 3 Lampen um die '3'.",
        explanation: "Exzellent! Rand-3er sind wie 4er im Zentrum: Alle verfügbaren Felder werden sofort Lampen."
    },
    {
        id: 2,
        title: "2. Geteilte Sichtlinien",
        subtitle: "Ausschluss durch Strahlengang",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, 1, null, 1, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, null, 0, null, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 1, c: 2, val: 2 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, null, 2, null, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Zwei '1'-Wände teilen sich die Zelle dazwischen (Zeile 2, Spalte 3). Wenn dort eine Lampe stünde, würde sie **beide** Wände gleichzeitig erfüllen – aber keine weiteren Nachbarn zulassen.\n\nMarkiere das Zwischenfeld als Punkt (•), falls andere Lampen notwendig sind.",
        explanation: "Sehr scharf deduziert! Geteilte Nachbarzellen sind oft der Schlüssel zu kniffligen Mustern."
    },
    {
        id: 3,
        title: "3. Die einsame Zelle",
        subtitle: "Einzige Rettung für unbeleuchtete Felder",
        size: 5,
        walls: [
            [-1, null, -1, null, null],
            [null, -1, null, null, null],
            [-1, null, -1, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [null, 0, null, 0, 0],
            [0, null, 0, 0, 0],
            [null, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 0, c: 1, val: 1 }],
        solution: [
            [null, 1, null, 0, 0],
            [0, null, 0, 0, 0],
            [null, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Das Feld bei (Zeile 1, Spalte 2) ist von 3 Seiten durch Wände und Ränder umschlossen. Es kann **nur** durch sich selbst beleuchtet werden, da unterhalb eine Wand liegt!\n\nSetze eine Lampe auf (1, 2).",
        explanation: "Genial! Unbeleuchtete 'Sackgassen' erzwingen oft direkte Lampen."
    },
    {
        id: 4,
        title: "4. Wand-Interferenz (1 neben 2)",
        subtitle: "Schrittweise Reduktion",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, 1, 2, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, null, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 2, val: 1 },
            { r: 1, c: 3, val: 1 }
        ],
        solution: [
            [0, 0, 1, 0, 0],
            [0, null, null, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Die '2' benötigt 2 Lampen. Da sie sich Nachbarn mit der '1' teilt, kann maximal 1 Lampe auf den geteilten Feldern liegen. Das bedeutet: Mindestens eine Lampe muss auf der rechten oder oberen Seite der '2' liegen!\n\nSetze Lampen oben (1, 3) und rechts (2, 4) von der '2'.",
        explanation: "Perfekt analysiert! Kombinierte Wandbetrachtung löst selbst schwierigste Level."
    },
    {
        id: 5,
        title: "5. Diagonale Wand-Einschlüsse",
        subtitle: "Schräg versetzte Wände",
        size: 5,
        walls: [
            [null, 1, null, null, null],
            [null, null, 1, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, null, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 0, c: 2, val: 2 }],
        solution: [
            [0, null, 2, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Zwei diagonal versetzte '1'-Wände: Die gemeinsame Ecke bei (Zeile 1, Spalte 3) würde beide Wände gleichzeitig erfüllen. Wenn ein anderer Nachbar besetzt wird, markiere die Ecke als Punkt (•).",
        explanation: "Großartig! Diagonale Beziehungen sind ein mächtiges Werkzeug für Meister."
    },
    {
        id: 6,
        title: "6. Meister-Deduktion",
        subtitle: "Vollständiges Experten-Szenario",
        size: 6,
        walls: [
            [null, 0, null, null, 2, null],
            [null, null, null, null, null, null],
            [null, -1, null, 1, null, null],
            [null, null, 2, null, -1, null],
            [null, null, null, null, null, null],
            [null, 1, null, null, 0, null]
        ],
        initialGrid: [
            [0, null, 0, 0, null, 0],
            [0, 0, 0, 0, 0, 0],
            [0, null, 0, null, 0, 0],
            [0, 0, null, 0, null, 0],
            [0, 0, 0, 0, 0, 0],
            [0, null, 0, 0, null, 0]
        ],
        solution: [
            [0, null, 1, 0, null, 1],
            [1, 0, 0, 0, 1, 0],
            [0, null, 0, null, 0, 0],
            [0, 0, null, 0, null, 0],
            [0, 1, 0, 0, 0, 1],
            [1, null, 0, 1, null, 0]
        ],
        description: "Wende alle gelernten Meister-Techniken an, um dieses anspruchsvolle 6×6 Akari-Meisterrätsel vollständig zu lösen!",
        explanation: "Hervorragend! Du bist nun ein wahrer Akari-Großmeister."
    }
];
