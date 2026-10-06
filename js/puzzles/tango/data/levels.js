/**
 * Tango Level & Tagesrätsel-Generierung
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE } from '../engine.js';
import { TangoGenerator } from '../generator.js';

export function getTangoCampaignLevel(levelIndex) {
    // Bestimme Gittergröße und Schwierigkeitsgrad nach Level-Fortschritt (240 Level in 4 Kapiteln)
    let size, difficulty;
    if (levelIndex < 15) {
        // Kapitel 1: Level 1–15 (4×4 Einfach)
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 30) {
        // Kapitel 1: Level 16–30 (6×6 Einfach)
        size = 6;
        difficulty = 'easy';
    } else if (levelIndex < 45) {
        // Kapitel 1: Level 31–45 (6×6 Mittel)
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 60) {
        // Kapitel 1: Level 46–60 (6×6 Schwer)
        size = 6;
        difficulty = 'hard';
    } else if (levelIndex < 80) {
        // Kapitel 2: Level 61–80 (6×6 Schwer)
        size = 6;
        difficulty = 'hard';
    } else if (levelIndex < 100) {
        // Kapitel 2: Level 81–100 (8×8 Einfach)
        size = 8;
        difficulty = 'easy';
    } else if (levelIndex < 120) {
        // Kapitel 2: Level 101–120 (8×8 Mittel)
        size = 8;
        difficulty = 'medium';
    } else if (levelIndex < 150) {
        // Kapitel 3: Level 121–150 (8×8 Mittel)
        size = 8;
        difficulty = 'medium';
    } else if (levelIndex < 180) {
        // Kapitel 3: Level 151–180 (8×8 Schwer)
        size = 8;
        difficulty = 'hard';
    } else if (levelIndex < 210) {
        // Kapitel 4: Level 181–210 (8×8 Meister)
        size = 8;
        difficulty = 'hard';
    } else {
        // Kapitel 4: Level 211–240 (10×10 Großmeister)
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
export function getTangoDailyPuzzle(dateStr) {
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
