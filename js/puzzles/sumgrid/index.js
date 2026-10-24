/**
 * SumGrid Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für SumGrid (4×4 bis 7×7).
 */

import { SUMGRID_NEUTRAL, SUMGRID_KEEP, SUMGRID_CROSS, SumGridEngine } from './engine.js';
import { SumGridSolver } from './solver.js';
import { SumGridGenerator } from './generator.js';
import { SumGridRenderer } from './renderer.js';
import { getSumGridCampaignLevel, getSumGridDailyPuzzle } from './data/levels.js';
import { SUMGRID_TUTORIAL_STEPS } from './data/tutorial.js';
import { SUMGRID_I18N } from './data/i18n.js';

export const SumGridPlugin = {
    id: 'sumgrid',
    name: 'SumGrid',
    icon: '🧮',
    description: 'Zahlen eliminieren für Zeilen- & Spaltensummen',
    cssPath: './css/puzzles/sumgrid.css',

    getSizes: () => [
        { id: 4, label: '4 × 4 (Mini)', gridSize: 4 },
        { id: 5, label: '5 × 5 (Standard)', gridSize: 5 },
        { id: 6, label: '6 × 6 (Groß)', gridSize: 6 },
        { id: 7, label: '7 × 7 (Meister)', gridSize: 7 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [SUMGRID_KEEP, SUMGRID_CROSS],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: true,
        keys: [SUMGRID_KEEP, SUMGRID_CROSS, SUMGRID_NEUTRAL]
    }),

    createEngine: (size = 5) => new SumGridEngine(size),
    generatePuzzle: (opts) => SumGridGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => SumGridSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => SumGridRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => SumGridRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass) => SumGridRenderer.getSymbolSvg(val, extraClass),

    getHint: (engine, options) => SumGridSolver.findLogicalHint(engine, options),
    getRules: (lang) => SumGridRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 240,
        chapters: [
            { id: 0, name: 'Kapitel 1', levelRange: [0, 59], desc: '4×4 & 5×5 Einstieg' },
            { id: 1, name: 'Kapitel 2', levelRange: [60, 119], desc: '5×5 Zahlenmeister' },
            { id: 2, name: 'Kapitel 3', levelRange: [120, 179], desc: '6×6 Kombinatorik' },
            { id: 3, name: 'Kapitel 4', levelRange: [180, 239], desc: '6×6 & 7×7 Großmeister' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getSumGridCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getSumGridDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: SUMGRID_TUTORIAL_STEPS, badge: '6 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => SUMGRID_I18N[lang] || SUMGRID_I18N.de
};
