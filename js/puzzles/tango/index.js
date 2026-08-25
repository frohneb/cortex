/**
 * Tango Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Tango (Takuzu / Binairo).
 */

import { EMPTY, SUN, MOON, TangoEngine } from './engine.js';
import { TangoSolver } from './solver.js';
import { TangoGenerator } from './generator.js';
import { TangoRenderer } from './renderer.js';
import { getTangoCampaignLevel, getTangoDailyPuzzle } from './data/levels.js';
import { TUTORIAL_STEPS } from './data/tutorial.js';
import { TUTORIAL_PRO_STEPS } from './data/tutorial_pro.js';
import { TUTORIAL_PATTERNS_STEPS } from './data/tutorial_patterns.js';

export const TangoPlugin = {
    id: 'tango',
    name: 'Tango',
    icon: '☀️🌙',
    description: 'Binärrätsel mit Sonne & Mond',
    cssPath: './css/puzzles/tango.css',

    getSizes: () => [
        { id: 4, label: '4 × 4 (Mini)', gridSize: 4 },
        { id: 6, label: '6 × 6 (Standard)', gridSize: 6 },
        { id: 8, label: '8 × 8 (Groß)', gridSize: 8 },
        { id: 10, label: '10 × 10 (Meister)', gridSize: 10 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [SUN, MOON],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: true,
        keys: [SUN, MOON, EMPTY]
    }),

    createEngine: (size = 6) => new TangoEngine(size),
    generatePuzzle: (opts) => TangoGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => TangoSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => TangoRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => TangoRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass) => TangoRenderer.getSymbolSvg(val, extraClass),

    getHint: (engine, options) => TangoSolver.findLogicalHint(engine, options),
    getRules: (lang) => TangoRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Kapitel 1', levelRange: [0, 29], desc: '4×4 & 6×6 Grundlagen' },
            { id: 1, name: 'Kapitel 2', levelRange: [30, 59], desc: '6×6 Fortgeschritten' },
            { id: 2, name: 'Kapitel 3', levelRange: [60, 89], desc: '8×8 Herausforderung' },
            { id: 3, name: 'Kapitel 4', levelRange: [90, 119], desc: '8×8 & 10×10 Meister' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getTangoCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getTangoDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: TUTORIAL_STEPS, badge: '6 Lektionen' },
            { id: 'math', name: 'Mathematik', steps: TUTORIAL_PRO_STEPS, badge: '8 Lektionen' },
            { id: 'patterns', name: 'Muster', steps: TUTORIAL_PATTERNS_STEPS, badge: '14 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => ({})
};
