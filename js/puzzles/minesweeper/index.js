/**
 * Minesweeper Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für klassisches Minesweeper.
 */

import { CELL_HIDDEN, CELL_REVEALED, CELL_FLAGGED, MinesweeperEngine } from './engine.js';
import { MinesweeperSolver } from './solver.js';
import { MinesweeperGenerator } from './generator.js';
import { MinesweeperRenderer } from './renderer.js';
import { getMinesweeperCampaignLevel, getMinesweeperDailyPuzzle } from './data/levels.js';
import { MINESWEEPER_TUTORIAL_STEPS } from './data/tutorial.js';
import { MINESWEEPER_I18N } from './data/i18n.js';

export const MinesweeperPlugin = {
    id: 'minesweeper',
    name: 'Minesweeper',
    icon: '🚩',
    description: 'Minenfeld mit Zahlenhinweisen & Flaggen',
    cssPath: './css/puzzles/minesweeper.css',

    getSizes: () => [
        { id: 8, label: '8 × 8 (Kompakt)', gridSize: 8, rows: 8, cols: 8 },
        { id: 12, label: '12 × 12 (Standard)', gridSize: 12, rows: 12, cols: 12 },
        { id: 16, label: '16 × 16 (Groß)', gridSize: 16, rows: 16, cols: 16 },
        { id: 30, label: '16 × 30 (Meister)', gridSize: 30, rows: 16, cols: 30 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [CELL_HIDDEN, CELL_REVEALED, CELL_FLAGGED],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: false,
        keys: [CELL_REVEALED, CELL_FLAGGED]
    }),

    createEngine: (size = 8) => {
        if (size === 30) {
            return new MinesweeperEngine(16, 30);
        }
        return new MinesweeperEngine(size, size);
    },

    generatePuzzle: (opts) => {
        let rows = opts.rows || opts.size || 8;
        let cols = opts.cols || opts.size || rows;
        if (opts.size === 30) {
            rows = 16;
            cols = 30;
        }
        return MinesweeperGenerator.generatePuzzle({
            rows,
            cols,
            difficulty: opts.difficulty || 'medium',
            mineCount: opts.mineCount,
            seed: opts.seed || Math.floor(Math.random() * 1000000)
        });
    },

    solvePuzzle: (engine, max = 1) => MinesweeperSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => MinesweeperRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => MinesweeperRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass) => MinesweeperRenderer.getSymbolSvg(val, extraClass),

    getHint: (engine, options) => MinesweeperSolver.findLogicalHint(engine, options),
    getRules: (lang) => MinesweeperRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 240,
        chapters: [
            { id: 0, name: 'Rekrut (8×8)', levelRange: [0, 59], desc: '8×8 Grundlagen & Einstieg' },
            { id: 1, name: 'Pionier (12×12)', levelRange: [60, 119], desc: '12×12 Mittlere Minenfelder' },
            { id: 2, name: 'Experte (16×16)', levelRange: [120, 179], desc: '16×16 Große Herausforderungen' },
            { id: 3, name: 'Meister (16×30)', levelRange: [180, 239], desc: '16×30 Das ultimative Minenfeld' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getMinesweeperCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getMinesweeperDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: MINESWEEPER_TUTORIAL_STEPS, badge: '6 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => MINESWEEPER_I18N[lang] || {}
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MinesweeperPlugin };
}
