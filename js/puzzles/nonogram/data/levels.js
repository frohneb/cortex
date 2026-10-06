/**
 * Nonogram Level & Tagesrätsel-Generierung
 * 240 handgefertigte & prozedurale Kampagnen-Level in 4 Kapiteln (5×5, 10×10, 15×15)
 * und synchrones tägliches Rätsel (Werktags 10×10, Wochenende 15×15 Meister).
 */

import { NonogramGenerator } from '../generator.js';

// Vordefinierte ikonische 5x5 Pixel-Motive für Kapitel 1
const PREDEFINED_5X5 = [
    // 1: Herz ❤️
    [
        [0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0]
    ],
    // 2: Haus 🏠
    [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1]
    ],
    // 3: Pfeil ➔
    [
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0]
    ],
    // 4: Smiley 🙂
    [
        [0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ],
    // 5: Stern ⭐
    [
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [0, 1, 0, 1, 0]
    ],
    // 6: Tasse ☕
    [
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0]
    ],
    // 7: Pilz 🍄
    [
        [0, 1, 1, 1, 0],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0]
    ],
    // 8: Diamant 💎
    [
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0]
    ]
];

export function getNonogramCampaignLevel(levelIndex) {
    // 240 Level in 4 Kapiteln:
    // Kapitel 1 (0–59): Einsteiger 5×5 (Level 1–30: Grundlagen & Pixel-Art, Level 31–60: Knifflig)
    // Kapitel 2 (60–119): Galerie I 10×10 (Level 61–90: Easy, Level 91–120: Medium)
    // Kapitel 3 (120–179): Komplexe Kunst (Level 121–150: 10×10 Hard, Level 151–180: 15×15 Medium)
    // Kapitel 4 (180–239): Meister-Galerie 15×15 (Level 181–240: Großformate & Meisterwerke)

    let size, difficulty;

    if (levelIndex < 30) {
        size = 5;
        difficulty = levelIndex < 15 ? 'easy' : (levelIndex < 25 ? 'medium' : 'hard');
        
        // Vordefinierte Handcraft-Level für die ersten Level
        if (levelIndex < PREDEFINED_5X5.length) {
            const target = PREDEFINED_5X5[levelIndex];
            const generated = NonogramGenerator.generatePuzzle({ size: 5, difficulty: 'easy', seed: 1000 + levelIndex });
            generated.target = target;
            generated.rowClues = [];
            for (let r = 0; r < 5; r++) {
                const clues = [];
                let cnt = 0;
                for (let c = 0; c < 5; c++) {
                    if (target[r][c] === 1) cnt++;
                    else if (cnt > 0) { clues.push(cnt); cnt = 0; }
                }
                if (cnt > 0) clues.push(cnt);
                generated.rowClues.push(clues.length > 0 ? clues : [0]);
            }
            generated.colClues = [];
            for (let c = 0; c < 5; c++) {
                const clues = [];
                let cnt = 0;
                for (let r = 0; r < 5; r++) {
                    if (target[r][c] === 1) cnt++;
                    else if (cnt > 0) { clues.push(cnt); cnt = 0; }
                }
                if (cnt > 0) clues.push(cnt);
                generated.colClues.push(clues.length > 0 ? clues : [0]);
            }
            return {
                id: levelIndex + 1,
                tier: difficulty,
                name: `Level ${levelIndex + 1} (5×5)`,
                ...generated
            };
        }
    } else if (levelIndex < 60) {
        size = 5;
        difficulty = 'hard';
    } else if (levelIndex < 90) {
        size = 10;
        difficulty = 'easy';
    } else if (levelIndex < 120) {
        size = 10;
        difficulty = 'medium';
    } else if (levelIndex < 150) {
        size = 10;
        difficulty = 'hard';
    } else if (levelIndex < 180) {
        size = 15;
        difficulty = 'medium';
    } else {
        size = 15;
        difficulty = 'hard';
    }

    const seed = 50000 + (levelIndex + 1) * 739;
    const generated = NonogramGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1} (${size}×${size})`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Nonogramm-Tagesrätsel basierend auf dem Datum
 */
export function getNonogramDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10) + 888;
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);

    // Werktags 10x10, Wochenende 15x15 Meister
    const size = isWeekend ? 15 : 10;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = NonogramGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        size,
        tier: difficulty,
        name: `Tagesrätsel (${size}×${size})`,
        ...generated
    };
}
