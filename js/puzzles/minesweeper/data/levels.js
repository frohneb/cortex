/**
 * Minesweeper Level & Tagesrätsel-Generierung
 * 240 Kampagnen-Level in 4 Kapiteln + tägliche Puzzles
 */

import { MinesweeperGenerator } from '../generator.js';

export function getMinesweeperCampaignLevel(levelIndex) {
    let rows, cols, difficulty;

    if (levelIndex < 20) {
        // Kapitel 1: Level 1–20 (8×8 Einfach, ca. 7 Minen)
        rows = 8;
        cols = 8;
        difficulty = 'easy';
    } else if (levelIndex < 40) {
        // Kapitel 1: Level 21–40 (8×8 Mittel, ca. 10 Minen)
        rows = 8;
        cols = 8;
        difficulty = 'medium';
    } else if (levelIndex < 60) {
        // Kapitel 1: Level 41–60 (8×8 Schwer, ca. 13 Minen)
        rows = 8;
        cols = 8;
        difficulty = 'hard';
    } else if (levelIndex < 90) {
        // Kapitel 2: Level 61–90 (12×12 Mittel, ca. 22 Minen)
        rows = 12;
        cols = 12;
        difficulty = 'medium';
    } else if (levelIndex < 120) {
        // Kapitel 2: Level 91–120 (12×12 Schwer, ca. 29 Minen)
        rows = 12;
        cols = 12;
        difficulty = 'hard';
    } else if (levelIndex < 150) {
        // Kapitel 3: Level 121–150 (16×16 Mittel, ca. 38 Minen)
        rows = 16;
        cols = 16;
        difficulty = 'medium';
    } else if (levelIndex < 180) {
        // Kapitel 3: Level 151–180 (16×16 Schwer, ca. 51 Minen)
        rows = 16;
        cols = 16;
        difficulty = 'hard';
    } else if (levelIndex < 210) {
        // Kapitel 4: Level 181–210 (16×30 Mittel, ca. 72 Minen)
        rows = 16;
        cols = 30;
        difficulty = 'medium';
    } else {
        // Kapitel 4: Level 211–240 (16×30 Meister, ca. 96 Minen)
        rows = 16;
        cols = 30;
        difficulty = 'hard';
    }

    // Deterministischer Seed pro Level
    const seed = 7000 + (levelIndex + 1) * 137;
    const generated = MinesweeperGenerator.generatePuzzle({ rows, cols, difficulty, seed });

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
export function getMinesweeperDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);

    const rows = isWeekend ? 16 : 12;
    const cols = isWeekend ? 16 : 12;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = MinesweeperGenerator.generatePuzzle({ rows, cols, difficulty, seed });
    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        name: `Tagesrätsel (${dateStr})`,
        ...generated
    };
}
