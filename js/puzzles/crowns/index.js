/**
 * Crowns (Queens) Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Crowns (5×5 bis 9×9).
 */

import { CROWNS_EMPTY, CROWNS_CROWN, CROWNS_X, CrownsEngine } from './engine.js';
import { CrownsSolver } from './solver.js';
import { CrownsGenerator } from './generator.js';
import { CrownsRenderer } from './renderer.js';
import { getCrownsCampaignLevel, getCrownsDailyPuzzle } from './data/levels.js';
import { CROWNS_TUTORIAL_STEPS } from './data/tutorial.js';
import { CROWNS_I18N } from './data/i18n.js';

export const CrownsPlugin = {
    id: 'crowns',
    name: 'Crowns',
    icon: '👑',
    description: 'Platziere Kronen in farbigen Regionen',
    badge: 'Neu',
    cssPath: './css/puzzles/crowns.css',

    getSizes: () => [
        { id: 5, label: '5 × 5 (Mini)', gridSize: 5 },
        { id: 6, label: '6 × 6 (Standard)', gridSize: 6 },
        { id: 7, label: '7 × 7 (Groß)', gridSize: 7 },
        { id: 8, label: '8 × 8 (Experte)', gridSize: 8 },
        { id: 9, label: '9 × 9 (Meister)', gridSize: 9 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_X],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: true,
        keys: [CROWNS_EMPTY, CROWNS_CROWN, CROWNS_X]
    }),

    createEngine: (size = 5) => new CrownsEngine(size),
    generatePuzzle: (opts) => CrownsGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => CrownsSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => CrownsRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => CrownsRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass) => CrownsRenderer.getSymbolSvg(val, extraClass),

    getHint: (engine, options) => CrownsSolver.findLogicalHint(engine, options),
    getRules: (lang) => CrownsRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Krönung', levelRange: [0, 29], desc: '5×5 & 6×6 Grundlagen' },
            { id: 1, name: 'Königreich', levelRange: [30, 59], desc: '6×6 Fortgeschritten' },
            { id: 2, name: 'Imperium', levelRange: [60, 89], desc: '7×7 Herausforderung' },
            { id: 3, name: 'Kronjuwelen', levelRange: [90, 119], desc: '8×8 & 9×9 Meister' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getCrownsCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getCrownsDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: CROWNS_TUTORIAL_STEPS, badge: '7 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => CROWNS_I18N[lang] || {}
};
