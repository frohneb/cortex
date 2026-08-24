/**
 * Tango Interaktives Tutorial
 * 6 aufeinander aufbauende Lektionen mit detaillierter deutscher Erklärung
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE } from '../engine.js';

export const TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Sonne ☀️ & Mond 🌙",
        subtitle: "Die Grundlagen und Steuerung",
        description: `Willkommen bei **Tango**!\n\nDein Ziel ist es, das Gitter mit **Sonnen (☀️)** und **Monden (🌙)** zu füllen.\n\n**Bedienung**:\n- **1× Tippen** = **Sonne ☀️**\n- **2× Tippen oder gedrückt halten** = **Mond 🌙**\n- **3× Tippen** = **Löschen**\n\n*Aufgabe: Setze auf das markierte Feld oben links eine Sonne und daneben einen Mond.*`,
        size: 4,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, SUN, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 0, val: SUN}, {r: 0, c: 1, val: MOON}],
        explanation: "Perfekt! Du hast die Steuerung verinnerlicht."
    },
    {
        id: 2,
        title: "2. Regel: Keine 3er-Reihen",
        subtitle: "Vermeide drei gleiche Symbole in einer Reihe",
        description: `Weder waagerecht noch senkrecht dürfen **mehr als zwei gleiche Symbole** aufeinanderfolgen (kein ☀️☀️☀️ und kein 🌙🌙🌙).\n\n1. Stehen **zwei Sonnen** nebeneinander (☀️☀️_), muss das nächste Feld ein **Mond 🌙** sein.\n2. Umschließen zwei Monde eine Lücke (🌙_🌙), muss dazwischen eine **Sonne ☀️** stehen.\n\n*Aufgabe: Verhindere die 3er-Reihen in Zeile 1 und Zeile 3.*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 2, val: MOON}, {r: 2, c: 1, val: SUN}],
        explanation: "Hervorragend! Du hast erfolgreich Dreierreihen verhindert."
    },
    {
        id: 3,
        title: "3. Regel: Balance (Gleiche Anzahl)",
        subtitle: "Jede Zeile und Spalte hat genau gleich viele Sonnen und Monde",
        description: `In einem 4×4 Gitter müssen in jeder Zeile und jeder Spalte **genau 2 Sonnen und 2 Monde** vorkommen (bei 6×6 sind es 3 und 3).\n\nWenn in einer Reihe bereits alle Sonnen gesetzt sind, müssen alle restlichen freien Felder Monde sein!\n\n*Aufgabe: Vervollständige die erste Zeile und die erste Spalte.*`,
        size: 4,
        initialGrid: [
            [SUN, MOON, SUN, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 3, val: MOON}, {r: 3, c: 0, val: MOON}],
        explanation: "Klasse! Zeilen- und Spalten-Balance ist das Herzstück des Spiels."
    },
    {
        id: 4,
        title: "4. Abhängigkeit: Das Gleichheitszeichen =",
        subtitle: "Verbundene Zellen haben dasselbe Symbol",
        description: `Ein **` + '=' + `** zwischen zwei Feldern bedeutet, dass beide Felder **exakt dasselbe Symbol** tragen müssen.\n\n- Ist ein Feld eine **Sonne ☀️**, muss das verbundene Feld ebenfalls eine **Sonne ☀️** sein.\n- Ist ein Feld ein **Mond 🌙**, muss das verbundene Feld ebenfalls ein **Mond 🌙** sein.\n\n*Aufgabe: Nutze das Gleichheitszeichen, um die rechten Felder auszufüllen.*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: SUN}, {r: 1, c: 1, val: MOON}],
        explanation: "Sehr gut! Das Gleichheitszeichen koppelt zwei Zellen direkt aneinander."
    },
    {
        id: 5,
        title: "5. Abhängigkeit: Das Gegenteilszeichen ×",
        subtitle: "Verbundene Zellen müssen unterschiedlich sein",
        description: `Ein **×** zwischen zwei Feldern bedeutet, dass die beiden Felder **unterschiedliche Symbole** tragen müssen.\n\n- Ist ein Feld eine **Sonne ☀️**, ist das Partnerfeld ein **Mond 🌙**.\n- Ist ein Feld ein **Mond 🌙**, ist das Partnerfeld eine **Sonne ☀️**.\n\n*Aufgabe: Nutze die ×-Markierung, um die Partnerfelder zu bestimmen.*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 2, c: 2, val: SUN}],
        explanation: "Exzellent! Mit dem Gegenteilszeichen lassen sich Paare sofort auflösen."
    },
    {
        id: 6,
        title: "6. Meisterprüfung: Erstes volles Rätsel",
        subtitle: "Kombiniere alle Regeln zum Lösen dieses 4×4 Gitters",
        description: `Jetzt kennst du alle Regeln:\n1. **Keine 3er-Reihen** (weder ☀️☀️☀️ noch 🌙🌙🌙)\n2. **Balance** (2 Sonnen & 2 Monde pro Zeile und Spalte)\n3. **= (Gleich)** & **× (Gegenteil)**\n\n*Aufgabe: Löse dieses komplette 4×4 Rätsel von Anfang bis Ende!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, SUN, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: null, // Muss komplett gelöst werden
        explanation: "Herzlichen Glückwunsch! Du hast das Tutorial gemeistert und bist bereit für die Kampagne und das tägliche Rätsel!"
    }
];
