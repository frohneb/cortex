/**
 * Sudoku Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Sudoku (4×4, 9×9, 16×16 Hexadezimal).
 */

import { SUDOKU_EMPTY, SudokuEngine } from './engine.js';
import { SudokuSolver } from './solver.js';
import { SudokuGenerator } from './generator.js';
import { SudokuRenderer } from './renderer.js';
import { getSudokuCampaignLevel, getSudokuDailyPuzzle } from './data/levels.js';
import { SUDOKU_TUTORIAL_STEPS } from './data/tutorial.js';
import { SUDOKU_TUTORIAL_ADVANCED_STEPS } from './data/tutorial_advanced.js';
import { SUDOKU_I18N } from './data/i18n.js';

export const SudokuPlugin = {
    id: 'sudoku',
    name: 'Sudoku',
    icon: '🔢',
    description: 'Zahlen- & Hex-Logik mit Zeilen, Spalten & Blöcken',
    cssPath: './css/puzzles/sudoku.css',

    getSizes: () => [
        { id: 4, label: '4 × 4 (Mini)', gridSize: 4 },
        { id: 9, label: '9 × 9 (Klassisch)', gridSize: 9 },
        { id: 16, label: '16 × 16 (Hexadezimal)', gridSize: 16 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],

    getInputConfig: () => ({
        type: 'keypad',
        allowKeypad: true,
        keys: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, SUDOKU_EMPTY]
    }),

    createEngine: (size = 9) => new SudokuEngine(size),
    generatePuzzle: (opts) => SudokuGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => SudokuSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => SudokuRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => SudokuRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass, size) => SudokuRenderer.getSymbolSvg(val, extraClass, size),

    getHint: (engine, options) => SudokuSolver.findLogicalHint(engine, options),
    getRules: (lang) => SudokuRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Einsteiger', levelRange: [0, 29], desc: '4×4 Mini Grundlagen' },
            { id: 1, name: 'Klassisch Leicht', levelRange: [30, 59], desc: '9×9 Einstieg & Entspannung' },
            { id: 2, name: 'Klassisch Meister', levelRange: [60, 89], desc: '9×9 Fortgeschrittene Deduktion' },
            { id: 3, name: 'Hexadezimal', levelRange: [90, 119], desc: '9×9 Meister & 16×16 Hex-Giganten' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getSudokuCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getSudokuDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: SUDOKU_TUTORIAL_STEPS, badge: '10 Lektionen' },
            { id: 'advanced', name: 'Fortgeschritten', steps: SUDOKU_TUTORIAL_ADVANCED_STEPS, badge: '8 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => SUDOKU_I18N[lang] || {}
};
