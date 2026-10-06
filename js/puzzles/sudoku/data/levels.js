/**
 * Sudoku Level & Tagesrätsel-Generierung
 * 240 prozedural generierte Kampagnen-Level in 4 Kapiteln (4×4, 9×9, 16×16 Hexadezimal)
 * und synchrones Tagesrätsel (Werktags 9×9, Wochenende 16×16 Hexadezimal).
 */

import { SudokuGenerator } from '../generator.js';

export function getSudokuCampaignLevel(levelIndex) {
    // 240 Level in 4 Kapiteln:
    // Kapitel 1 (0–59): Einsteiger 4×4 (Level 1–25: Easy, Level 26–45: Medium, Level 46–60: Hard)
    // Kapitel 2 (60–119): Klassisch Leicht 9×9 (Level 61–90: Easy, Level 91–120: Medium)
    // Kapitel 3 (120–179): Klassisch Meister 9×9 (Level 121–150: Medium, Level 151–180: Hard)
    // Kapitel 4 (180–239): Meister & Hexadezimal (Level 181–210: 9×9 Meister, Level 211–240: 16×16 Hexadezimal)

    let size, difficulty;
    if (levelIndex < 25) {
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 45) {
        size = 4;
        difficulty = 'medium';
    } else if (levelIndex < 60) {
        size = 4;
        difficulty = 'hard';
    } else if (levelIndex < 90) {
        size = 9;
        difficulty = 'easy';
    } else if (levelIndex < 120) {
        size = 9;
        difficulty = 'medium';
    } else if (levelIndex < 150) {
        size = 9;
        difficulty = 'medium';
    } else if (levelIndex < 180) {
        size = 9;
        difficulty = 'hard';
    } else if (levelIndex < 210) {
        size = 9;
        difficulty = 'hard';
    } else {
        // Level 211–240: 16×16 Hexadezimal Meister
        size = 16;
        difficulty = levelIndex < 222 ? 'easy' : (levelIndex < 232 ? 'medium' : 'hard');
    }

    const seed = 9000 + (levelIndex + 1) * 137;
    const generated = SudokuGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1} (${size === 16 ? '16×16 Hex' : `${size}×${size}`})`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Sudoku-Tagesrätsel basierend auf dem Datum
 */
export function getSudokuDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10) + 777;
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
    
    // Werktags 9x9, Wochenende 16x16 Hexadezimal Meister
    const size = isWeekend ? 16 : 9;
    const difficulty = isWeekend ? 'medium' : 'hard';

    const generated = SudokuGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: `daily_sudoku_${dateStr}`,
        date: dateStr,
        name: `Sudoku Tagesrätsel (${size === 16 ? '16×16 Hex' : '9×9'}, ${dateStr})`,
        ...generated
    };
}
