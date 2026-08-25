/**
 * Akari (Light Up) Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Akari (6×6, 8×8, 10×10, 12×12, 14×14).
 */

import { AKARI_EMPTY, AKARI_BULB, AKARI_DOT, AkariEngine } from './engine.js';
import { AkariSolver } from './solver.js';
import { AkariGenerator } from './generator.js';
import { AkariRenderer } from './renderer.js';
import { getAkariCampaignLevel, getAkariDailyPuzzle } from './data/levels.js';
import { AKARI_TUTORIAL_STEPS } from './data/tutorial.js';
import { AKARI_TUTORIAL_ADVANCED_STEPS } from './data/tutorial_advanced.js';
import { AKARI_I18N } from './data/i18n.js';

export const AkariPlugin = {
    id: 'akari',
    name: 'Akari',
    icon: '💡',
    description: 'Lichtstrahlen & Glühbirnen auf Wänden',
    cssPath: './css/puzzles/akari.css',

    getSizes: () => [
        { id: 6, label: '6 × 6 (Kompakt)', gridSize: 6 },
        { id: 8, label: '8 × 8 (Klassisch)', gridSize: 8 },
        { id: 10, label: '10 × 10 (Meister)', gridSize: 10 },
        { id: 14, label: '14 × 14 (Gigant)', gridSize: 14 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [AKARI_EMPTY, AKARI_BULB, AKARI_DOT],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: false,
        keys: [AKARI_EMPTY, AKARI_BULB, AKARI_DOT]
    }),

    createEngine: (size = 8) => new AkariEngine(size),
    generatePuzzle: (opts) => AkariGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => AkariSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => AkariRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => AkariRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass, size) => AkariRenderer.getSymbolSvg(val, extraClass, size),

    getHint: (engine, options) => AkariSolver.findLogicalHint(engine, options),
    getRules: (lang) => AkariRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Glühwürmchen', levelRange: [0, 29], desc: '6×6 & 7×7 Grundlagen' },
            { id: 1, name: 'Laternenstadt', levelRange: [30, 59], desc: '8×8 Klassische Straßen' },
            { id: 2, name: 'Lichtkuppel', levelRange: [60, 89], desc: '10×10 Meister-Architektur' },
            { id: 3, name: 'Photonen-Palast', levelRange: [90, 119], desc: '12×12 & 14×14 Giganten' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getAkariCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getAkariDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: AKARI_TUTORIAL_STEPS, badge: '8 Lektionen' },
            { id: 'advanced', name: 'Fortgeschritten', steps: AKARI_TUTORIAL_ADVANCED_STEPS, badge: '6 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => AKARI_I18N[lang] || {}
};
