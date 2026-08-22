/**
 * Tango Tutorial Regelmäßigkeiten
 * Tiefgehende Lektionen zu feldgrößenspezifischen Gesetzen,
 * Domino-Zerlegungen, Paar-Budgets und Unizitäts-Axiomen.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE } from '../core/engine.js';

export const TUTORIAL_PATTERNS_STEPS = [
    {
        id: 1,
        title: "Regelmäßigkeit 1: 4×4 Paar-Inversion",
        subtitle: "Budget-Erschöpfung im Mini-Gitter",
        mathPrinciple: "4×4 Paar-Inversion: 2 Sonnen verbrauchen Zeilen-Budget ⟹ Rest = Monde",
        description: `**Das Prinzip (4×4)**:\nIn einem 4×4 Gitter dürfen in jeder Zeile und Spalte genau **2 Sonnen** und **2 Monde** stehen. Sobald ein Paar aus zwei gleichen Symbolen existiert (\`☀️ ☀️ _ _\`), MÜSSEN die verbleibenden beiden Felder zwingend das **gegenteilige Paar** (\`🌙 🌙\`) sein!\n\n**Mathematischer Beweis**:\nDas Zeilen-Budget beträgt maximal 2 Sonnen. Zwei Sonnen verbrauchen das gesamte Kontingent (2 - 2 = 0). Für die restlichen 2 Felder verbleiben ausschließlich Monde.\n\n*Übung: Fülle die verbleibenden Felder in Zeile 1 und Zeile 3 durch Paar-Inversion aus!*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, MOON],
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
        targetCells: [
            { r: 0, c: 2, val: MOON },
            { r: 0, c: 3, val: MOON },
            { r: 2, c: 0, val: SUN },
            { r: 2, c: 1, val: SUN }
        ],
        explanation: "Exzellent! Im 4x4 Gitter kippt ein Paar sofort alle restlichen Felder ins Gegenteil."
    },
    {
        id: 2,
        title: "Regelmäßigkeit 2: 6×6 Paar-Limit",
        subtitle: "Maximal ein Paar desselben Symbols pro Zeile",
        mathPrinciple: "6×6 Paar-Limit: Max. 1 Sonnen-Paar pro 6er-Reihe erlaubt",
        description: `**Das Prinzip (6×6)**:\nIn einer 6er-Reihe (3 Sonnen, 3 Monde) kann es **höchstens EIN Sonnen-Paar** (\`☀️ ☀️\`) und **höchstens EIN Mond-Paar** (\`🌙 🌙\`) geben, da zwei Paare bereits 2 + 2 = 4 Symbole erfordern würden.\n\n**Mathematischer Beweis**:\nIn Zeile 1 stehen bereits das Sonnen-Paar an Pos 1–2 und eine 3. Sonne an Pos 4 (\`☀️ ☀️ 🌙 ☀️ _ _\`). Das Sonnen-Budget von 3 ist komplett aufgebraucht! Das durch \`[=]\` verbundene Paar an Pos 5–6 MUSS zwingend ein Mond-Paar (\`🌙 🌙\`) sein.\n\n*Übung: Bestimme den Wert des [=] Paares an Position 5 und 6!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 4, val: MOON },
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Brillant kombiniert! Da 6x6 maximal 1 Sonnen-Paar erlaubt und alle 3 Sonnen platziert sind, muss das [=] Paar aus Monden bestehen."
    },
    {
        id: 3,
        title: "Regelmäßigkeit 3: 6×6 Domino-Zerlegung (3-Blöcke-×)",
        subtitle: "Globales Zähl-Axiom disjunkter Gegenteilspaare",
        mathPrinciple: "6×6 Domino-Parität: Zwei [×]-Blöcke binden 2☀️ + 2🌙 ⟹ Block 3 = 1☀️ + 1🌙",
        description: `**Das Prinzip (6×6)**:\nJede 6er-Reihe lässt sich in drei 2er-Blöcke unterteilen: (Pos 1–2), (Pos 3–4), (Pos 5–6). Jedes \`[×]\` auf einem Block bindet exakt 1 Sonne und 1 Mond.\n\n**Mathematischer Beweis**:\nLiegen auf zwei Blöcken \`[×]\`-Kanten, sind bereits 2 Sonnen und 2 Monde vergeben. Für den 3. Block verbleibt genau **1 Sonne und 1 Mond**. Ist ein Feld des 3. Blocks bekannt, folgt das Nachbarfeld sofort als Inversion!\n\n*Übung: Bestimme Feld 6 in Zeile 1 mit Hilfe der Domino-Zerlegung!*`,
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Perfekt! Die beiden [×]-Dominos verbrauchen 2 Sonnen & 2 Monde – Feld 6 muss der Gegenpart zu Feld 5 sein."
    },
    {
        id: 4,
        title: "Regelmäßigkeit 4: Rand-Dopplung & 3er-Restfeld",
        subtitle: "Verhinderung verdeckter 3er-Ketten",
        mathPrinciple: "Restfeld-Ausschluss: [☀️☀️ 🌙🌙 _ _] ⟹ Pos 5 = ☀️, Pos 6 = 🌙 (3er-Schutz)",
        description: `**Das Prinzip (6×6)**:\nSteht am Zeilenanfang ein Paar \`[☀️ ☀️ 🌙 🌙 _ _]\`, fehlen in der Zeile noch genau **1 Sonne und 1 Mond**.\n\n**Mathematischer Beweis**:\nWürde an Position 5 ein Mond gesetzt, stünden dort drei Monde (\`🌙 🌙 🌙\`). Um die verbotene 3er-Kette zu verhindern, MUSS Position 5 die verbleibende Sonne (\`☀️\`) und Position 6 der Mond (\`🌙\`) sein!\n\n*Übung: Verhindere die 3er-Kette im Restfeld von Zeile 1!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 4, val: SUN },
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Hervorragend! Durch das 3er-Verbot muss die verbleibende Sonne an Position 5 stehen."
    },
    {
        id: 5,
        title: "Regelmäßigkeit 5: Das 14-Muster-Gesetz",
        subtitle: "Strikte Zeilen-Unizität in 6×6",
        mathPrinciple: "6×6 Eindeutigkeit: 14 Zeilenmuster ⟹ Duplikate strikt verboten",
        description: `**Das Prinzip (6×6)**:\nEs gibt mathematisch überhaupt nur **14 gültige Zeilenmuster** für ein 6er-Gitter. Da 6 Zeilen im Gitter vorkommen, ist die Wahrscheinlichkeit für Duplikate extrem hoch.\n\n**Mathematischer Beweis**:\nZeile 1 ist \`☀️ 🌙 ☀️ 🌙 🌙 ☀️\`. Zeile 2 beginnt mit \`☀️ 🌙 ☀️ 🌙 _ _\`. Würde man für die Lücken \`🌙 ☀️\` wählen, wäre Zeile 2 identisch zu Zeile 1. Nach dem Unizitäts-Axiom MUSS daher zwingend \`☀️ 🌙\` gesetzt werden!\n\n*Übung: Fülle Zeile 2 so aus, dass kein Duplikat zu Zeile 1 entsteht!*`,
        size: 6,
        initialGrid: [
            [SUN, MOON, SUN, MOON, MOON, SUN],
            [SUN, MOON, SUN, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 1, c: 4, val: SUN },
            { r: 1, c: 5, val: MOON }
        ],
        explanation: "Perfekt! Das Unizitäts-Gesetz schließt das Zeilenduplikat zwingend aus."
    },
    {
        id: 6,
        title: "Regelmäßigkeit 6: Skalierendes Paar-Budget (8×8)",
        subtitle: "Budget von 2 Paaren pro Zeile",
        mathPrinciple: "8×8 Paar-Budget: Max. 2 Sonnen-Paare (2×2=4) ⟹ Rest = Monde",
        description: `**Das Prinzip (8×8)**:\nIn einem 8×8 Gitter (4 Sonnen, 4 Monde) darf es maximal **zwei Sonnen-Paare** geben (2 × 2 = 4).\n\n**Mathematischer Beweis**:\nSind in einer Zeile bereits zwei Sonnen-Paare gesetzt (\`☀️ ☀️\` an Pos 1-2 und Pos 5-6), ist das Sonnen-Budget von 4 vollständig erschöpft. Die verbleibenden leeren Felder an Pos 7 und 8 MÜSSEN Monde sein!\n\n*Übung: Fülle die verbleibenden Felder am Ende der 8er-Zeile auf!*`,
        size: 8,
        initialGrid: [
            [SUN, SUN, MOON, MOON, SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 6, val: MOON },
            { r: 0, c: 7, val: MOON }
        ],
        explanation: "Klasse! Bei 8x8 verbrauchen 2 Sonnen-Paare das gesamte Budget von 4 Sonnen."
    },
    {
        id: 7,
        title: "Regelmäßigkeit 7: Die universell verbotene =-Kette",
        subtitle: "Transitives Verbot von Doppel-Gleichheitskanten",
        mathPrinciple: "Axiom: Verbot von Doppel-Gleichheitsketten (= = Verstoß gegen 3er-Regel)",
        description: `**Das Prinzip (Alle Feldgrößen)**:\nZwei aufeinanderfolgende Gleichheitszeichen (\`_ = _ = _\`) sind auf JEDER Feldgröße strikt unzulässig!\n\n**Mathematischer Beweis**:\nSind Feld 1 und Feld 2 gleich und Feld 2 und Feld 3 ebenfalls gleich, müssten alle 3 Felder dasselbe Symbol tragen. Dies erzwingt eine verbotene 3er-Kette. Folglich kann nach einem \`[=]\` niemals sofort ein zweites \`[=]\` folgen – dort MUSS immer ein \`[×]\` oder keine Kante liegen.\n\n*Übung: Da Feld 1 und 2 durch [=] gleich sind, MUSS Feld 3 das Gegenteil sein!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: SUN },
            { r: 0, c: 2, val: MOON }
        ],
        explanation: "Exzellent! Nach jedem [=] muss das nächste Feld das Gegenteil sein, um 3er-Ketten zu meiden."
    },
    {
        id: 8,
        title: "Regelmäßigkeit 8: Meisterprüfung der Regelmäßigkeiten",
        subtitle: "Wende alle Feldgrößen-Gesetze auf ein 6×6 Gitter an",
        mathPrinciple: "Synthese aller Axiome: Domino-Zerlegung + Paar-Limits + Zeilen-Eindeutigkeit",
        description: `**Die Meisterprüfung**:\nNutze alle gelernten Regelmäßigkeiten:\n1. **Paar-Budget** (max. 1 Paar pro Symbol bei 6×6)\n2. **Domino-Parität** (\`[×]\`-Blöcke binden je 1S + 1M)\n3. **3er-Sperre & Zeilen-Eindeutigkeit**\n\n*Aufgabe: Löse dieses anspruchsvolle 6×6 Gitter fehlerfrei!*`,
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, SUN, EMPTY, MOON, EMPTY],
            [EMPTY, MOON, EMPTY, MOON, EMPTY, MOON],
            [MOON, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, MOON, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_EQUAL, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_OPPOSITE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: null, // Komplett lösen
        explanation: "Grandios! Du hast alle Feldgrößen-Gesetze gemeistert und bist nun ein wahrer Tango-Großmeister!"
    }
];
