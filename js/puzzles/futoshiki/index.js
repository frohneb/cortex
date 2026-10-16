/**
 * Futoshiki Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Futoshiki (4×4 bis 7×7).
 */

import {
    FutoshikiEngine,
    FUTOSHIKI_EMPTY
} from './engine.js';
import { FutoshikiSolver } from './solver.js';
import { FutoshikiGenerator } from './generator.js';
import { FutoshikiRenderer } from './renderer.js';
import { getFutoshikiCampaignLevel, getFutoshikiDailyPuzzle } from './data/levels.js';
import { FUTOSHIKI_TUTORIAL_STEPS } from './data/tutorial.js';
import { FUTOSHIKI_I18N } from './data/i18n.js';

export const FutoshikiPlugin = {
    id: 'futoshiki',
    name: 'Futoshiki',
    icon: '🔣',
    description: 'Zahlen & Ungleichungen (4×4 bis 7×7)',
    badge: 'Neu',
    cssPath: './css/puzzles/futoshiki.css',

    getSizes: () => [
        { id: 4, label: '4 × 4 (Mini)', gridSize: 4 },
        { id: 5, label: '5 × 5 (Standard)', gridSize: 5 },
        { id: 6, label: '6 × 6 (Groß)', gridSize: 6 },
        { id: 7, label: '7 × 7 (Experte)', gridSize: 7 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [1, 2, 3, 4, 5, 6, 7, FUTOSHIKI_EMPTY],

    getInputConfig: () => ({
        type: 'keypad',
        allowKeypad: true,
        keys: [1, 2, 3, 4, 5, 6, 7, FUTOSHIKI_EMPTY]
    }),

    createEngine: (size = 5) => new FutoshikiEngine(size),
    generatePuzzle: (opts) => FutoshikiGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => FutoshikiSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => FutoshikiRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => FutoshikiRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass) => FutoshikiRenderer.getSymbolSvg(val, extraClass),

    getHint: (engine, options) => FutoshikiSolver.findLogicalHint(engine, options),
    getRules: (lang) => FutoshikiRenderer.getRules(lang),

    getCampaignConfig: () => ({
        totalLevels: 240,
        chapters: [
            { id: 0, name: 'Ordnung', levelRange: [0, 59], desc: '4×4 & 5×5 Grundlagen' },
            { id: 1, name: 'Vergleich', levelRange: [60, 119], desc: '5×5 & 6×6 Fortgeschritten' },
            { id: 2, name: 'Logik-Ketten', levelRange: [120, 179], desc: '6×6 Herausforderung' },
            { id: 3, name: 'Großmeister', levelRange: [180, 239], desc: '6×6 & 7×7 Meister' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getFutoshikiCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getFutoshikiDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: FUTOSHIKI_TUTORIAL_STEPS, badge: '7 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => FUTOSHIKI_I18N[lang] || {}
};
