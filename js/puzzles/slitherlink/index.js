/**
 * Slitherlink Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Slitherlink (4×4 bis 10×10).
 */

import { SlitherlinkEngine } from './engine.js';
import { SlitherlinkSolver } from './solver.js';
import { SlitherlinkGenerator } from './generator.js';
import { SlitherlinkRenderer } from './renderer.js';
import { getSlitherlinkCampaignLevel, getSlitherlinkDailyPuzzle } from './data/levels.js';
import { SLITHERLINK_TUTORIAL_STEPS } from './data/tutorial.js';
import { SLITHERLINK_TUTORIAL_ADVANCED_STEPS } from './data/tutorial_adv.js';
import { SLITHERLINK_I18N } from './data/i18n.js';

export const SlitherlinkPlugin = {
    id: 'slitherlink',
    name: 'Slitherlink',
    icon: '➿',
    description: 'Schleifen-Rätsel mit Zahlenhinweisen',
    cssPath: './css/puzzles/slitherlink.css',

    getSizes: () => [
        { id: 4, label: '4 × 4 (Mini)', gridSize: 4 },
        { id: 6, label: '6 × 6 (Klassisch)', gridSize: 6 },
        { id: 8, label: '8 × 8 (Labyrinth)', gridSize: 8 },
        { id: 10, label: '10 × 10 (Meister)', gridSize: 10 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [0, 1, 2],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: false,
        keys: [0, 1, 2]
    }),

    createEngine: (size = 6) => new SlitherlinkEngine(size),
    generatePuzzle: (opts) => SlitherlinkGenerator.generate(opts),
    solvePuzzle: (engine, max = 1) => SlitherlinkSolver.solve(engine.clues, max),

    renderBoard: (container, engine, state, onCell) => SlitherlinkRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => SlitherlinkRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass, size) => SlitherlinkRenderer.getSymbolSvg(val, extraClass, size),

    getHint: (engine, options) => SlitherlinkSolver.getHint(engine, options),
    getRules: (lang) => SlitherlinkRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Einstieg (4×4 & 5×5)', levelRange: [0, 29], desc: 'Grundlagen, 0er & Eck-3er' },
            { id: 1, name: 'Pfadfinder (6×6 & 7×7)', levelRange: [30, 59], desc: 'Punktgrad & Linienfortführung' },
            { id: 2, name: 'Labyrinth (8×8)', levelRange: [60, 89], desc: 'Verzweigungen & Sub-Loop-Ausschluss' },
            { id: 3, name: 'Meister-Zirkel (10×10)', levelRange: [90, 119], desc: 'Große Schleifen & Paritätslogik' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getSlitherlinkCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getSlitherlinkDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: SLITHERLINK_TUTORIAL_STEPS, badge: '6 Lektionen' },
            { id: 'advanced', name: 'Meistermuster', steps: SLITHERLINK_TUTORIAL_ADVANCED_STEPS, badge: '3 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => SLITHERLINK_I18N[lang] || {}
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkPlugin };
}
