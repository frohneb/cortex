/**
 * Futoshiki Level & Tagesrätsel-Generierung
 * 240 deterministische Kampagnen-Level in 4 thematischen Kapiteln (4×4 bis 7×7)
 */

import { FutoshikiGenerator } from '../generator.js';

export function getFutoshikiCampaignLevel(levelIndex) {
    // 240 Level in 4 Kapiteln:
    // Kapitel 1 „Ordnung“ (Level 1–60): 4×4 & 5×5 Easy/Medium
    // Kapitel 2 „Vergleich“ (Level 61–120): 5×5 & 6×6 Medium
    // Kapitel 3 „Logik-Ketten“ (Level 121–180): 6×6 Medium/Hard
    // Kapitel 4 „Großmeister“ (Level 181–240): 6×6 & 7×7 Hard
    let size, difficulty;
    if (levelIndex < 30) {
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 60) {
        size = 5;
        difficulty = 'easy';
    } else if (levelIndex < 90) {
        size = 5;
        difficulty = 'medium';
    } else if (levelIndex < 120) {
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 150) {
        size = 6;
        difficulty = 'hard';
    } else if (levelIndex < 180) {
        size = 6;
        difficulty = 'hard';
    } else if (levelIndex < 210) {
        size = 7;
        difficulty = 'hard';
    } else {
        size = 7;
        difficulty = 'hard';
    }

    const seed = 90000 + (levelIndex + 1) * 137;
    const generated = FutoshikiGenerator.generatePuzzle({ size, difficulty, seed });

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
export function getFutoshikiDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
    const size = isWeekend ? 6 : 5;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = FutoshikiGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        name: `Tagesrätsel (${dateStr})`,
        ...generated
    };
}
