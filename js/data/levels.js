/**
 * Tango Vorgefertigte Level & Tagesrätsel-Generierung
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE } from '../core/engine.js';
import { TangoGenerator } from '../core/generator.js';

export const CAMPAIGN_LEVELS = [
    // --- KAPITEL 1: ANFÄNGER (4x4) ---
    {
        id: 1,
        tier: 'beginner',
        name: "Level 1",
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, SUN]
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
        ]
    },
    {
        id: 2,
        tier: 'beginner',
        name: "Level 2",
        size: 4,
        initialGrid: [
            [EMPTY, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, SUN],
            [MOON, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },
    {
        id: 3,
        tier: 'beginner',
        name: "Level 3",
        size: 4,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, SUN, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },

    // --- KAPITEL 2: EINFACH (6x6) ---
    {
        id: 4,
        tier: 'easy',
        name: "Level 4",
        size: 6,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, SUN, EMPTY, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, SUN, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY, EMPTY, SUN]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },
    {
        id: 5,
        tier: 'easy',
        name: "Level 5",
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, SUN, EMPTY, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, MOON, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },

    // --- KAPITEL 3: MITTEL (6x6) ---
    {
        id: 6,
        tier: 'medium',
        name: "Level 6",
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, SUN, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },

    // --- KAPITEL 4: SCHWER (8x8) ---
    {
        id: 7,
        tier: 'hard',
        name: "Level 7",
        size: 8,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, SUN, EMPTY, EMPTY, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, EMPTY, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, SUN]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    }
];

export function getCampaignLevel(levelIndex) {
    // Bestimme Gittergröße und Schwierigkeitsgrad nach Level-Fortschritt (120 Level in 4 Kapiteln)
    let size, difficulty;
    if (levelIndex < 10) {
        // Kapitel 1: Level 1–10 (4×4 Einfach)
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 20) {
        // Kapitel 1: Level 11–20 (6×6 Einfach)
        size = 6;
        difficulty = 'easy';
    } else if (levelIndex < 30) {
        // Kapitel 1: Level 21–30 (6×6 Mittel)
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 45) {
        // Kapitel 2: Level 31–45 (6×6 Mittel)
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 60) {
        // Kapitel 2: Level 46–60 (6×6 Schwer)
        size = 6;
        difficulty = 'hard';
    } else if (levelIndex < 75) {
        // Kapitel 3: Level 61–75 (8×8 Mittel)
        size = 8;
        difficulty = 'medium';
    } else if (levelIndex < 90) {
        // Kapitel 3: Level 76–90 (8×8 Schwer)
        size = 8;
        difficulty = 'hard';
    } else if (levelIndex < 105) {
        // Kapitel 4: Level 91–105 (8×8 Meister)
        size = 8;
        difficulty = 'hard';
    } else {
        // Kapitel 4: Level 106–120 (10×10 Meister)
        size = 10;
        difficulty = 'hard';
    }

    // Deterministischer Seed pro Level
    const seed = 5000 + (levelIndex + 1) * 113;
    const generated = TangoGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1}`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Tagesrätsel basierend auf dem Datum (JJJJ-MM-TT)
 */
export function getDailyPuzzle(dateStr) {
    // Wandle Datum in Integer-Seed um (z.B. "2026-08-21" -> 20260821)
    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    // Wähle Größe je nach Wochentag (Wochenende = 8x8, Werktags = 6x6)
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
    const size = isWeekend ? 8 : 6;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = TangoGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        name: `Tagesrätsel (${dateStr})`,
        ...generated
    };
}
