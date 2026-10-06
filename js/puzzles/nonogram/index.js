/**
 * Nonogram (Picross / Griddlers) Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Nonogramm (5×5, 10×10, 15×15).
 */

import { NONO_EMPTY, NONO_FILLED, NONO_CROSS, NonogramEngine } from './engine.js';
import { NonogramSolver } from './solver.js';
import { NonogramGenerator } from './generator.js';
import { NonogramRenderer } from './renderer.js';
import { getNonogramCampaignLevel, getNonogramDailyPuzzle } from './data/levels.js';
import { NONOGRAM_TUTORIAL_STEPS } from './data/tutorial.js';
import { NONOGRAM_I18N } from './data/i18n.js';

export const NonogramPlugin = {
    id: 'nonogram',
    name: 'Nonogramm',
    icon: '🖼️',
    description: 'Pixel-Rätsel mit Zahlenhinweisen',
    cssPath: './css/puzzles/nonogram.css',

    getSizes: () => [
        { id: 5, label: '5 × 5 (Mini)', gridSize: 5 },
        { id: 10, label: '10 × 10 (Klassisch)', gridSize: 10 },
        { id: 15, label: '15 × 15 (Meister)', gridSize: 15 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [NONO_EMPTY, NONO_FILLED, NONO_CROSS],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: true,
        keys: [NONO_FILLED, NONO_CROSS, NONO_EMPTY]
    }),

    createEngine: (size = 10) => new NonogramEngine(size),
    generatePuzzle: (opts) => NonogramGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => NonogramSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => NonogramRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => NonogramRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass, size) => NonogramRenderer.getSymbolSvg(val, extraClass, size),

    getHint: (engine, options) => NonogramSolver.findLogicalHint(engine, options),
    getRules: (lang) => NonogramRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 240,
        chapters: [
            { id: 0, name: 'Einsteiger (5×5)', levelRange: [0, 59], desc: '5×5 Mini-Formate & Grundlagen' },
            { id: 1, name: 'Galerie I (10×10)', levelRange: [60, 119], desc: '10×10 Klassische Pixel-Art' },
            { id: 2, name: 'Komplexe Kunst', levelRange: [120, 179], desc: '10×10 & 15×15 Meistermotive' },
            { id: 3, name: 'Meister-Galerie', levelRange: [180, 239], desc: '15×15 Großformate & Meisterwerke' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getNonogramCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getNonogramDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: NONOGRAM_TUTORIAL_STEPS, badge: '5 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => NONOGRAM_I18N[lang] || {}
};
