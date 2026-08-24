/**
 * Sudoku Level & Tagesrätsel-Generierung
 * 120 prozedural generierte Kampagnen-Level in 4 Kapiteln (4×4, 9×9, 16×16 Hexadezimal)
 * und synchrones Tagesrätsel (Werktags 9×9, Wochenende 16×16 Hexadezimal).
 */

import { SudokuGenerator } from '../generator.js';

export function getSudokuCampaignLevel(levelIndex) {
    // 120 Level in 4 Kapiteln:
    // Kapitel 1 (0–29): Einsteiger 4×4 (Level 1–15: Easy, Level 16–25: Medium, Level 26–30: Hard)
    // Kapitel 2 (30–59): Klassisch Leicht 9×9 (Level 31–60: Easy)
    // Kapitel 3 (60–89): Klassisch Anspruchsvoll 9×9 (Level 61–75: Medium, Level 76–90: Hard)
    // Kapitel 4 (90–119): Meister & Hexadezimal (Level 91–105: 9×9 Meister, Level 106–120: 16×16 Hexadezimal)

    let size, difficulty;
    if (levelIndex < 15) {
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 25) {
        size = 4;
        difficulty = 'medium';
    } else if (levelIndex < 30) {
        size = 4;
        difficulty = 'hard';
    } else if (levelIndex < 60) {
        size = 9;
        difficulty = 'easy';
    } else if (levelIndex < 75) {
        size = 9;
        difficulty = 'medium';
    } else if (levelIndex < 105) {
        size = 9;
        difficulty = 'hard';
    } else {
        // Level 106–120: 16×16 Hexadezimal Meister
        size = 16;
        difficulty = levelIndex < 112 ? 'easy' : (levelIndex < 117 ? 'medium' : 'hard');
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
