/**
 * Crowns Level & Tagesrätsel-Generierung
 */

import { CrownsGenerator } from '../generator.js';

export function getCrownsCampaignLevel(levelIndex) {
    // Bestimme Gittergröße und Schwierigkeitsgrad nach Level-Fortschritt (240 Level in 4 Kapiteln)
    let size, difficulty;
    if (levelIndex < 20) {
        // Kapitel 1: Level 1–20 (5×5 Einfach)
        size = 5;
        difficulty = 'easy';
    } else if (levelIndex < 40) {
        // Kapitel 1: Level 21–40 (5×5 Mittel)
        size = 5;
        difficulty = 'medium';
    } else if (levelIndex < 60) {
        // Kapitel 1: Level 41–60 (6×6 Einfach)
        size = 6;
        difficulty = 'easy';
    } else if (levelIndex < 90) {
        // Kapitel 2: Level 61–90 (6×6 Mittel)
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 120) {
        // Kapitel 2: Level 91–120 (6×6 Schwer)
        size = 6;
        difficulty = 'hard';
    } else if (levelIndex < 150) {
        // Kapitel 3: Level 121–150 (7×7 Mittel)
        size = 7;
        difficulty = 'medium';
    } else if (levelIndex < 180) {
        // Kapitel 3: Level 151–180 (7×7 Schwer)
        size = 7;
        difficulty = 'hard';
    } else if (levelIndex < 210) {
        // Kapitel 4: Level 181–210 (8×8 Schwer)
        size = 8;
        difficulty = 'hard';
    } else {
        // Kapitel 4: Level 211–240 (9×9 Meister)
        size = 9;
        difficulty = 'hard';
    }

    // Deterministischer Seed pro Level
    const seed = 70000 + (levelIndex + 1) * 137;
    const generated = CrownsGenerator.generatePuzzle({ size, difficulty, seed });
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
export function getCrownsDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
    const size = isWeekend ? 7 : 5;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = CrownsGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        name: `Tagesrätsel (${dateStr})`,
        ...generated
    };
}
