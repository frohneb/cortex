/**
 * Hashiwokakero (Brücken) Level & Tagesrätsel-Generierung
 * 240 deterministische Kampagnen-Level in 4 thematischen Kapiteln
 */

import { HashiGenerator } from '../generator.js';

export function getHashiCampaignLevel(levelIndex) {
    // 240 Level in 4 Kapiteln:
    // Kapitel 1 „Archipel“ (Level 1–60): 6×6 & 7×7 Easy/Medium
    // Kapitel 2 „Seefahrt“ (Level 61–120): 7×7 & 8×8 Medium
    // Kapitel 3 „Expedition“ (Level 121–180): 8×8 & 9×9 Medium/Hard
    // Kapitel 4 „Ozean-Meister“ (Level 181–240): 10×10 & 12×12 Hard
    let size, difficulty;
    if (levelIndex < 30) {
        size = 6;
        difficulty = 'easy';
    } else if (levelIndex < 60) {
        size = 7;
        difficulty = 'easy';
    } else if (levelIndex < 90) {
        size = 7;
        difficulty = 'medium';
    } else if (levelIndex < 120) {
        size = 8;
        difficulty = 'medium';
    } else if (levelIndex < 150) {
        size = 8;
        difficulty = 'hard';
    } else if (levelIndex < 180) {
        size = 9;
        difficulty = 'hard';
    } else if (levelIndex < 210) {
        size = 10;
        difficulty = 'hard';
    } else {
        size = 12;
        difficulty = 'hard';
    }

    const seed = 80000 + (levelIndex + 1) * 137;
    const generated = HashiGenerator.generatePuzzle({ size, rows: size, cols: size, difficulty, seed });

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
export function getHashiDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
    const size = isWeekend ? 10 : 7;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = HashiGenerator.generatePuzzle({ size, rows: size, cols: size, difficulty, seed });
    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        name: `Tagesrätsel (${dateStr})`,
        ...generated
    };
}
