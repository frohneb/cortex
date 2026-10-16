/**
 * Hashiwokakero (Brücken) Interaktives Tutorial
 * 8 didaktische Lektionen für Anfänger und Fortgeschrittene
 */

export const HASHI_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Inseln & Brücken 🌉",
        subtitle: "Die Grundregeln von Hashiwokakero",
        description: `Willkommen bei **Hashiwokakero (Brücken)**!\n\nJeder Kreis ist eine **Insel**. Die Zahl auf der Insel gibt an, wie viele **Brücken** genau an dieser Insel anliegen müssen.\n\n*Aufgabe: Verbinde die beiden Inseln mit einer einfachen Brücke.*`,
        rows: 4, cols: 4, size: 4,
        islands: [
            { r: 1, c: 0, value: 1 },
            { r: 1, c: 3, value: 1 }
        ],
        solution: [
            { r1: 1, c1: 0, r2: 1, c2: 3, count: 1 }
        ],
        targetEdge: { r1: 1, c1: 0, r2: 1, c2: 3, count: 1 },
        explanation: "Hervorragend! Beide Inseln haben nun ihren geforderten Wert 1 erreicht."
    },
    {
        id: 2,
        title: "2. Einfache & Doppelbrücken ═",
        subtitle: "Bis zu zwei Brücken pro Verbindung",
        description: `Zwischen zwei Inseln dürfen **maximal zwei parallele Brücken** verlaufen.\n\nTippe noch einmal auf die Brücke oder die beiden Inseln, um eine **Doppelbrücke** zu bauen!\n\n*Aufgabe: Erhöhe die Verbindung zu einer Doppelbrücke.*`,
        rows: 4, cols: 4, size: 4,
        islands: [
            { r: 1, c: 0, value: 2 },
            { r: 1, c: 3, value: 2 }
        ],
        solution: [
            { r1: 1, c1: 0, r2: 1, c2: 3, count: 2 }
        ],
        targetEdge: { r1: 1, c1: 0, r2: 1, c2: 3, count: 2 },
        explanation: "Perfekt! Eine Doppelbrücke verbindet beide 2er-Inseln optimal."
    },
    {
        id: 3,
        title: "3. Kreuzungsverbot ✕",
        subtitle: "Brücken dürfen sich niemals kreuzen",
        description: `Brücken verlaufen immer **nur waagerecht oder senkrecht**.\n\nSie dürfen sich **niemals kreuzen**! Eine bestehende Brücke schneidet den Weg für alle senkrechten Querverbindungen ab.\n\n*Aufgabe: Verbinde die horizontalen und vertikalen Inseln kreuzungsfrei.*`,
        rows: 5, cols: 5, size: 5,
        islands: [
            { r: 0, c: 0, value: 1 },
            { r: 0, c: 4, value: 2 },
            { r: 4, c: 0, value: 1 },
            { r: 4, c: 4, value: 2 }
        ],
        solution: [
            { r1: 0, c1: 0, r2: 0, c2: 4, count: 1 },
            { r1: 0, c1: 4, r2: 4, c2: 4, count: 1 },
            { r1: 4, c1: 0, r2: 4, c2: 4, count: 1 }
        ],
        explanation: "Sehr gut! Keine Brücke kreuzt eine andere."
    },
    {
        id: 4,
        title: "4. Zusammenhang 🔗",
        subtitle: "Alle Inseln müssen ein einziges Netz bilden",
        description: `Es dürfen keine getrennten Inselgruppen entstehen.\n\nAlle Inseln müssen über Brückenpfade **miteinander verbunden** sein.\n\n*Aufgabe: Schließe alle Inseln zu einem einzigen Netzwerk zusammen.*`,
        rows: 5, cols: 5, size: 5,
        islands: [
            { r: 0, c: 0, value: 2 },
            { r: 0, c: 4, value: 2 },
            { r: 4, c: 0, value: 2 },
            { r: 4, c: 4, value: 2 }
        ],
        solution: [
            { r1: 0, c1: 0, r2: 0, c2: 4, count: 1 },
            { r1: 0, c1: 4, r2: 4, c2: 4, count: 1 },
            { r1: 4, c1: 4, r2: 4, c2: 0, count: 1 },
            { r1: 4, c1: 0, r2: 0, c2: 0, count: 1 }
        ],
        explanation: "Klasse! Alle 4 Inseln bilden einen zusammenhängenden Kreis."
    },
    {
        id: 5,
        title: "5. Erfüllte Inseln 🟢",
        subtitle: "Glow-Effekt bei vollständiger Belegung",
        description: `Sobald eine Insel genau ihre geforderte Anzahl an Brücken hat, leuchtet sie grün auf.\n\nAn eine erfüllte Insel darf keine weitere Brücke angeschlossen werden.\n\n*Aufgabe: Vervollständige die Brücken für die 3er-Insel.*`,
        rows: 5, cols: 5, size: 5,
        islands: [
            { r: 0, c: 2, value: 3 },
            { r: 0, c: 0, value: 1 },
            { r: 0, c: 4, value: 2 },
            { r: 3, c: 2, value: 1 },
            { r: 3, c: 4, value: 1 }
        ],
        solution: [
            { r1: 0, c1: 0, r2: 0, c2: 2, count: 1 },
            { r1: 0, c1: 2, r2: 0, c2: 4, count: 1 },
            { r1: 0, c1: 2, r2: 3, c2: 2, count: 1 },
            { r1: 0, c1: 4, r2: 3, c2: 4, count: 1 }
        ],
        explanation: "Perfekt! Alle Inseln sind erfüllt und grün umrandet."
    },
    {
        id: 6,
        title: "6. Erzwungene Brücken 💡",
        subtitle: "Wenn Nachbarn nicht ausweichen können",
        description: `Wenn eine Insel mit Wert **3** nur zwei Nachbarn hat, muss sie zu **beiden** Nachbarn mindestens eine Brücke schicken!\n\nDenn selbst eine Doppelbrücke zu einem Nachbarn lässt noch eine Brücke für den anderen übrig.\n\n*Aufgabe: Nutze diese Deduktion bei der 3er-Eckinsel.*`,
        rows: 5, cols: 5, size: 5,
        islands: [
            { r: 0, c: 0, value: 3 },
            { r: 0, c: 4, value: 2 },
            { r: 4, c: 0, value: 2 },
            { r: 4, c: 4, value: 1 }
        ],
        solution: [
            { r1: 0, c1: 0, r2: 0, c2: 4, count: 2 },
            { r1: 0, c1: 0, r2: 4, c2: 0, count: 1 },
            { r1: 4, c1: 0, r2: 4, c2: 4, count: 1 }
        ],
        explanation: "Genau richtig deduziert! Die 3 in der Ecke zwingt Brücken in beide Richtungen."
    },
    {
        id: 7,
        title: "7. Ecken & Ränder 📐",
        subtitle: "4er in der Ecke, 6er am Rand",
        description: `Eine **4 in einer Ecke** hat nur 2 Nachbarn. Da jede Verbindung maximal 2 Brücken tragen kann ($2 + 2 = 4$), müssen **beide Doppelbrücken** sofort gesetzt werden!\n\n*Aufgabe: Löse das Eck-Puzzle sofort mit Doppelbrücken.*`,
        rows: 5, cols: 5, size: 5,
        islands: [
            { r: 0, c: 0, value: 4 },
            { r: 0, c: 4, value: 2 },
            { r: 4, c: 0, value: 3 },
            { r: 4, c: 4, value: 1 }
        ],
        solution: [
            { r1: 0, c1: 0, r2: 0, c2: 4, count: 2 },
            { r1: 0, c1: 0, r2: 4, c2: 0, count: 2 },
            { r1: 4, c1: 0, r2: 4, c2: 4, count: 1 }
        ],
        explanation: "Ausgezeichnet! 4 in der Ecke bedeutet immer zwei Doppelbrücken."
    },
    {
        id: 8,
        title: "8. Die 8er-Insel 👑",
        subtitle: "Das Maximum im Spiel",
        description: `Eine Insel mit dem Wert **8** ist der König von Hashi!\n\nDa es nur 4 Richtungen gibt und maximal 2 Brücken pro Richtung erlaubt sind ($4 \\times 2 = 8$), muss eine 8 **in alle 4 Richtungen sofort eine Doppelbrücke** erhalten!\n\n*Aufgabe: Setze alle 4 Doppelbrücken an der 8er-Insel.*`,
        rows: 5, cols: 5, size: 5,
        islands: [
            { r: 2, c: 2, value: 8 },
            { r: 0, c: 2, value: 2 },
            { r: 4, c: 2, value: 2 },
            { r: 2, c: 0, value: 2 },
            { r: 2, c: 4, value: 2 }
        ],
        solution: [
            { r1: 2, c1: 2, r2: 0, c2: 2, count: 2 },
            { r1: 2, c1: 2, r2: 4, c2: 2, count: 2 },
            { r1: 2, c1: 2, r2: 2, c2: 0, count: 2 },
            { r1: 2, c1: 2, r2: 2, c2: 4, count: 2 }
        ],
        explanation: "Gratulation! Du beherrschst alle grundlegenden und strategischen Regeln von Hashiwokakero!"
    }
];
