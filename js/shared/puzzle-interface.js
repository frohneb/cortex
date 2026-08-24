/**
 * Cortex Puzzle Plugin Interface Definition & Types
 * Jedes Puzzle-Plugin implementiert diesen Vertrag.
 */

/**
 * @typedef {Object} PuzzleSizeOption
 * @property {string|number} id
 * @property {string} label
 * @property {number} gridSize
 */

/**
 * @typedef {Object} PuzzleDifficultyOption
 * @property {string} id
 * @property {string} label
 */

/**
 * @typedef {Object} PuzzlePlugin
 * @property {string} id - Eindeutige ID (z.B. 'tango', 'sudoku')
 * @property {string} name - Anzeigename (z.B. 'Tango', 'Sudoku')
 * @property {string} icon - Emoji / Kurzicon (z.B. '☀️🌙', '🔢')
 * @property {string} description - Kurzbeschreibung für Selektor
 * @property {string} [badge] - Optionales Badge (z.B. 'Neu', 'Beliebt')
 * @property {Function} getSizes - () => PuzzleSizeOption[]
 * @property {Function} getDifficulties - () => PuzzleDifficultyOption[]
 * @property {Function} getValues - () => number[]
 * @property {Function} getInputConfig - () => { type: 'cycle'|'keypad', keys?: number[] }
 * @property {Function} createEngine - (size: number) => Object
 * @property {Function} generatePuzzle - (opts: {size: number, difficulty: string, seed?: number}) => Object
 * @property {Function} solvePuzzle - (engine: Object, maxSolutions?: number) => any[]
 * @property {Function} renderBoard - (container: HTMLElement, engine: Object, state: Object, onCellInteraction?: Function) => void
 * @property {Function} renderKeypad - (container: HTMLElement, engine: Object, state: Object, onKeyInput?: Function) => void
 * @property {Function} getSymbolSvg - (value: number, extraClass?: string) => string
 * @property {Function} getHint - (engine: Object, options?: Object) => Object|null
 * @property {Function} getRules - (lang: string) => string
 * @property {Function} getCampaignConfig - () => { totalLevels: number, chapters: Array }
 * @property {Function} getCampaignLevel - (levelIndex: number) => Object
 * @property {Function} getDailyConfig - (dateStr: string) => Object
 * @property {Function} getTutorialSteps - () => { sections: Array<{ id: string, name: string, steps: Array }> }
 * @property {Function} getI18nStrings - (lang: string) => Object
 */

export const PuzzleInterfaceVersion = '1.0.0';
