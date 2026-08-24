/**
 * Akari Level & Tagesrätsel-Generierung
 * 120 deterministisch generierte Kampagnen-Level in 4 Kapiteln (6×6, 8×8, 10×10, 12×12/14×14)
 * und synchrones Tagesrätsel.
 */

import { AkariGenerator } from '../generator.js';

export function getAkariCampaignLevel(levelIndex) {
    // 120 Level in 4 Kapiteln:
    // Kapitel 1 (0–29): Glühwürmchen (Level 1–15: 6×6 Easy, Level 16–25: 6×6 Medium, Level 26–30: 7×7 Easy)
    // Kapitel 2 (30–59): Laternenstadt (Level 31–45: 8×8 Easy, Level 46–60: 8×8 Medium)
    // Kapitel 3 (60–89): Lichtkuppel (Level 61–75: 10×10 Medium, Level 76–90: 10×10 Hard)
    // Kapitel 4 (90–119): Photonen-Palast (Level 91–105: 12×12 Medium, Level 106–120: 14×14 Hard)

    let size, difficulty;
    if (levelIndex < 15) {
        size = 6;
        difficulty = 'easy';
    } else if (levelIndex < 25) {
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 30) {
        size = 7;
        difficulty = 'easy';
    } else if (levelIndex < 45) {
        size = 8;
        difficulty = 'easy';
    } else if (levelIndex < 60) {
        size = 8;
        difficulty = 'medium';
    } else if (levelIndex < 75) {
        size = 10;
        difficulty = 'medium';
    } else if (levelIndex < 90) {
        size = 10;
        difficulty = 'hard';
    } else if (levelIndex < 105) {
        size = 12;
        difficulty = 'medium';
    } else {
        size = 14;
        difficulty = 'hard';
    }

    const seed = 50000 + (levelIndex + 1) * 313;
    const generated = AkariGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1} (${size}×${size})`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Akari-Tagesrätsel basierend auf dem Datum
 */
export function getAkariDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10) + 333;
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);

    // Werktags 8x8 Medium, Wochenende 10x10 Hard
    const size = isWeekend ? 10 : 8;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = AkariGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        date: dateStr,
        name: `Tagesrätsel: Akari (${dateStr})`,
        tier: isWeekend ? 'Wochenende (Meister)' : 'Werktag',
        ...generated
    };
}
