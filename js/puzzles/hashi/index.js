/**
 * Hashiwokakero (Bridges / Brücken) Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Hashiwokakero (6×6 bis 12×12).
 */

import {
    HashiEngine,
    HASHI_BRIDGE_NONE,
    HASHI_BRIDGE_SINGLE,
    HASHI_BRIDGE_DOUBLE
} from './engine.js';
import { HashiSolver } from './solver.js';
import { HashiGenerator } from './generator.js';
import { HashiRenderer } from './renderer.js';
import { getHashiCampaignLevel, getHashiDailyPuzzle } from './data/levels.js';
import { HASHI_TUTORIAL_STEPS } from './data/tutorial.js';
import { HASHI_I18N } from './data/i18n.js';

export const HashiPlugin = {
    id: 'hashi',
    name: 'Hashi',
    icon: '🌉',
    description: 'Verbinde Inseln mit Brücken',
    cssPath: './css/puzzles/hashi.css',

    getSizes: () => [
        { id: 6, label: '6 × 6 (Kompakt)', gridSize: 6 },
        { id: 7, label: '7 × 7 (Standard)', gridSize: 7 },
        { id: 8, label: '8 × 8 (Mittel)', gridSize: 8 },
        { id: 9, label: '9 × 9 (Groß)', gridSize: 9 },
        { id: 10, label: '10 × 10 (Experte)', gridSize: 10 },
        { id: 12, label: '12 × 12 (Meister)', gridSize: 12 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [HASHI_BRIDGE_NONE, HASHI_BRIDGE_SINGLE, HASHI_BRIDGE_DOUBLE],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: false,
        keys: [HASHI_BRIDGE_NONE, HASHI_BRIDGE_SINGLE, HASHI_BRIDGE_DOUBLE]
    }),

    createEngine: (size = 7) => new HashiEngine(size, size),
    generatePuzzle: (opts) => HashiGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => HashiSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => HashiRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => HashiRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass) => HashiRenderer.getSymbolSvg(val, extraClass),

    getHint: (engine, options) => HashiSolver.findLogicalHint(engine, options),
    getRules: (lang) => HashiRenderer.getRules(lang),

    getCampaignConfig: () => ({
        totalLevels: 240,
        chapters: [
            { id: 0, name: 'Archipel', levelRange: [0, 59], desc: '6×6 & 7×7 Grundlagen' },
            { id: 1, name: 'Seefahrt', levelRange: [60, 119], desc: '7×7 & 8×8 Fortgeschritten' },
            { id: 2, name: 'Expedition', levelRange: [120, 179], desc: '8×8 & 9×9 Herausforderung' },
            { id: 3, name: 'Ozean-Meister', levelRange: [180, 239], desc: '10×10 & 12×12 Meister' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getHashiCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getHashiDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: HASHI_TUTORIAL_STEPS, badge: '8 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => HASHI_I18N[lang] || {}
};
