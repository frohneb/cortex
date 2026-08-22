/**
 * Tango Tutorial Regelmäßigkeiten & Meister-Muster
 * Tiefgehende Lektionen zu feldgrößenspezifischen Gesetzen,
 * 1-5-Regel, Doppel-Inversion, Lookahead-Sperre, 2D-Interferenz,
 * Domino-Zerlegungen, Paar-Budgets und Unizitäts-Axiomen.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE } from '../core/engine.js';

export const TUTORIAL_PATTERNS_STEPS = [
    {
        id: 1,
        title: "Muster 1: 4×4 Paar-Inversion",
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
        title: "Muster 2: 6×6 Paar-Limit",
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
        title: "Muster 3: Die 1-5-Regel (Rand-Abstand)",
        subtitle: "Verhinderung von Dreierketten in der Zeilenmitte",
        mathPrinciple: "1-5-Regel: Pos 1 = Pos 5 = ☀️ ⟹ Pos 6 = 🌙 (Mitte 2-3-4 vor 🌙🌙🌙 geschützt)",
        description: `**Das Prinzip (6×6)**:\nTragen in einer 6er-Reihe **Position 1 und Position 5 dasselbe Symbol** (z. B. \`☀️ _ _ _ ☀️ _\`), MUSS **Position 6 zwingend das Gegenteil** (\`🌙\`) sein!\n\n**Mathematischer Beweis**:\nWürde man an Position 6 ebenfalls eine Sonne setzen, stünden an Pos 5 und 6 zwei Sonnen (\`☀️ ☀️\`). Zusammen mit Position 1 wären alle 3 Sonnen der Zeile verbraucht. Die verbleibenden 3 Felder in der Mitte (Pos 2, 3, 4) müssten alle Monde sein (\`🌙 🌙 🌙\`) – eine verbotene 3er-Kette! Folglich MUSS Position 6 ein Mond (\`🌙\`) sein.\n\n*Übung: Bestimme Feld 6 in Zeile 1 und Feld 1 in Zeile 3 mit der 1-5-Regel!*`,
        size: 6,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, EMPTY, MOON],
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
            { r: 0, c: 5, val: MOON },
            { r: 2, c: 0, val: SUN }
        ],
        explanation: "Hervorragend! Die 1-5-Regel sichert das Außenfeld, ohne dass die 3 mittleren Felder bekannt sein müssen."
    },
    {
        id: 4,
        title: "Muster 4: Die doppelte [×]-Kaskade",
        subtitle: "Zwei Negationen heben sich auf: ¬(¬A) = A",
        mathPrinciple: "Doppel-Inversion: (A [×] B [×] C) ⟹ A = C (Außenfelder identisch)",
        description: `**Das Prinzip**:\nSind drei Felder hintereinander durch zwei Gegenteils-Kanten verbunden (\`A [×] B [×] C\`), sind die beiden **Außenfelder A und C immer exakt GLEICH**!\n\n**Mathematischer Beweis**:\nFeld B ist das Gegenteil von A. Feld C ist wiederum das Gegenteil von B. Die doppelte Negation hebt sich auf: Ist Feld A eine Sonne \`☀️\`, ist Feld B ein Mond \`🌙\` und Feld C zwingend wieder eine Sonne \`☀️\`.\n\n*Übung: Löse die Kette in Zeile 1 über die Doppel-Inversion auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_NONE],
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
            { r: 0, c: 1, val: MOON },
            { r: 0, c: 2, val: SUN }
        ],
        explanation: "Perfekt! Bei [×][×] haben die Außenfelder stets denselben Wert."
    },
    {
        id: 5,
        title: "Muster 5: Der Kanten-Vorausschau-Ausschluss",
        subtitle: "Verhinderung von 3er-Reihen über Gleichheits-Kopplung",
        mathPrinciple: "Lookahead-Sperre: (_ = _) ☀️ ⟹ Paar MUSS 🌙🌙 sein (Schutz vor ☀️☀️☀️)",
        description: `**Das Prinzip**:\nLiegen zwei durch \`[=]\` verbundene leere Felder direkt neben einem bekannten Symbol (\`_ = _ ☀️\`), MÜSSEN beide leeren Felder sofort das **Gegenteil** (\`🌙 🌙\`) annehmen!\n\n**Mathematischer Beweis**:\nWürden die beiden verbundenen Felder Sonnen annehmen, entstünde mit der Nachbarsonne sofort die unzulässige 3er-Reihe \`☀️ ☀️ ☀️\`. Folglich muss das gekoppelte Paar zwingend aus zwei Monden (\`🌙 🌙\`) bestehen.\n\n*Übung: Bestimme die beiden verbundenen Felder in Zeile 1!*`,
        size: 4,
        initialGrid: [
            [EMPTY, EMPTY, SUN, EMPTY],
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
            { r: 0, c: 0, val: MOON },
            { r: 0, c: 1, val: MOON }
        ],
        explanation: "Brillant! Durch die Kanten-Vorausschau löst du das Paar sofort ohne Raten auf."
    },
    {
        id: 6,
        title: "Muster 6: 6×6 Domino-Zerlegung (3-Blöcke-×)",
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
        id: 7,
        title: "Muster 7: Budget-Kanten-Inkompatibilität",
        subtitle: "Abgleich zwischen Rest-Budget und Kanten-Typ",
        mathPrinciple: "Paritäts-Filter: Rest-Budget 1☀️ + 1🌙 schließt [=] aus ⟹ Erzwingt [×]",
        description: `**Das Prinzip**:\nSind in einer 6er-Reihe bereits 2 Sonnen und 2 Monde gesetzt (\`☀️ ☀️ 🌙 🌙 _ _\`), verbleiben genau **1 Sonne und 1 Mond**.\n\n**Mathematischer Beweis**:\nAuf den letzten beiden Feldern kann niemals ein \`[=]\` liegen, da \`[=]\` zwei identische Symbole verlangt. Eine \`[×]\`-Kante hingegen passt exakt zum Rest-Budget. Ist Feld 6 durch die schneidende Spalte als Mond (\`🌙\`) festgelegt, folgt Feld 5 sofort als Sonne (\`☀️\`)!\n\n*Übung: Nutze die Gegenteilskante, um Zeile 1 zu vollenden!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, SUN],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, SUN],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE],
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
        explanation: "Perfekt kombiniert! Der Paritäts-Filter verbindet Zeilen-Budget und Kantenlogik nahtlos."
    },
    {
        id: 8,
        title: "Muster 8: 2D-Kanten-Kreuzung (Eck-Interferenz)",
        subtitle: "Gleichzeitige Kanten horizontal und vertikal",
        mathPrinciple: "2D-Interferenz: (x = y) horizontal ∧ (x × z) vertikal ⟹ y und z sind Gegenteile",
        description: `**Das Prinzip**:\nGeht von einem Feld $X$ eine horizontale \`[=]\`-Kante nach rechts und eine vertikale \`[×]\`-Kante nach unten, **müssen der rechte und der untere Nachbar untereinander immer GEGENTEILE sein**!\n\n**Mathematischer Beweis**:\nDer rechte Nachbar $Y$ hat denselben Wert wie $X$ ($Y = X$). Der untere Nachbar $Z$ hat den gegenteiligen Wert ($Z = \\text{Gegenteil von } X$). Folglich ist $Z$ immer das Gegenteil von $Y$.\n\n*Übung: Löse die Nachbarfelder der Ecke (0,0) auf!*`,
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
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: SUN },
            { r: 1, c: 0, val: MOON }
        ],
        explanation: "Exzellent! 2D-Kanten-Interferenz koppelt Zeilen und Spalten über Ecken."
    },
    {
        id: 9,
        title: "Muster 9: Rand-Dopplung & 3er-Restfeld",
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
        id: 10,
        title: "Muster 10: Das 14-Muster-Gesetz",
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
        id: 11,
        title: "Muster 11: Skalierendes Paar-Budget (8×8)",
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
        id: 12,
        title: "Muster 12: 10×10 Paar-Limit",
        subtitle: "Maximal 2 Paare desselben Symbols bei 5er-Budget",
        mathPrinciple: "10×10 Paar-Budget: Max. 2 Sonnen-Paare (2×2=4 < 5) ⟹ 5. Sonne ist Einzelsymbol",
        description: `**Das Prinzip (10×10)**:\nIn einem 10×10 Gitter (5 Sonnen, 5 Monde) darf es **maximal ZWEI Sonnen-Paare** und **maximal ZWEI Mond-Paare** pro Zeile geben!\n\n**Mathematischer Beweis**:\nDrei Paare würden $3 \\times 2 = 6$ Symbole verbrauchen. Da das Zeilenkontingent genau 5 Sonnen beträgt, können höchstens 2 Paare ($2 \\times 2 = 4$) existieren. Die 5. Sonne MUSS als einzelnes isoliertes Symbol stehen.\n\n*Übung: Fülle die verbleibenden beiden Felder am Ende der 10er-Zeile auf!*`,
        size: 10,
        initialGrid: [
            [SUN, SUN, MOON, MOON, SUN, SUN, MOON, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 8, val: MOON },
            { r: 0, c: 9, val: MOON }
        ],
        explanation: "Grandios! Bei 10x10 verbrauchen 2 Paare + 1 Einzelsonne das gesamte Budget von 5 Sonnen."
    },
    {
        id: 13,
        title: "Muster 13: Die universell verbotene =-Kette",
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
        id: 14,
        title: "Muster 14: Meisterprüfung der Regelmäßigkeiten",
        subtitle: "Wende alle Feldgrößen-Gesetze auf ein 6×6 Gitter an",
        mathPrinciple: "Synthese aller Axiome: 1-5-Regel + Doppel-Inversion + Domino-Zerlegung + Paar-Limits",
        description: `**Die Meisterprüfung**:\nNutze alle gelernten Regelmäßigkeiten:\n1. **1-5-Regel & Paar-Budget**\n2. **Doppel-Inversion & Domino-Parität**\n3. **3er-Sperre & Zeilen-Unizität**\n\n*Aufgabe: Löse dieses anspruchsvolle 6×6 Gitter fehlerfrei!*`,
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
        explanation: "Grandios! Du hast alle Feldgrößen-Gesetze und Meister-Muster gemeistert und bist nun ein wahrer Tango-Großmeister!"
    }
];
