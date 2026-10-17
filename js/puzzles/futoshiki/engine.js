/**
 * Futoshiki Puzzle Engine
 * Repräsentiert das Lateinische Quadrat (N×N) mit Ungleichungs-Constraints (</>),
 * Zellwerten, Notizen, Konfliktprüfung, Validierung und Undo/Redo.
 */

export const FUTOSHIKI_EMPTY = 0;

export const CONSTRAINT_NONE = '';
export const CONSTRAINT_LT = '<'; // kleiner als
export const CONSTRAINT_GT = '>'; // größer als

export class FutoshikiEngine {
    constructor(size = 5) {
        this.size = size;
        this.maxValue = size;

        this.grid = Array.from({ length: size }, () => Array(size).fill(FUTOSHIKI_EMPTY));
        this.initialGrid = Array.from({ length: size }, () => Array(size).fill(FUTOSHIKI_EMPTY));
        this.locked = Array.from({ length: size }, () => Array(size).fill(false));

        // Horizontale Constraints: size × (size - 1)
        // hConstraints[r][c] gilt zwischen (r, c) und (r, c + 1)
        this.hConstraints = Array.from({ length: size }, () => Array(size - 1).fill(CONSTRAINT_NONE));

        // Vertikale Constraints: (size - 1) × size
        // vConstraints[r][c] gilt zwischen (r, c) und (r + 1, c)
        // '<' oder '^' = oben < unten; '>' oder 'v' = oben > unten
        this.vConstraints = Array.from({ length: size - 1 }, () => Array(size).fill(CONSTRAINT_NONE));

        // Kandidaten-Notizen pro Zelle
        this.notes = Array.from({ length: size }, () => Array.from({ length: size }, () => new Set()));

        this.solution = null;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Lädt ein Puzzle
     * @param {Object} config
     *   size: number (4..7)
     *   initialGrid: number[][]
     *   hConstraints: string[][]
     *   vConstraints: string[][]
     *   solution: number[][] (optional)
     *   locked: boolean[][] (optional)
     */
    loadPuzzle({ size = 5, initialGrid = null, hConstraints = null, vConstraints = null, solution = null, locked = null }) {
        this.size = size;
        this.maxValue = size;

        this.grid = Array.from({ length: size }, () => Array(size).fill(FUTOSHIKI_EMPTY));
        this.initialGrid = Array.from({ length: size }, () => Array(size).fill(FUTOSHIKI_EMPTY));
        this.locked = Array.from({ length: size }, () => Array(size).fill(false));

        if (initialGrid) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const val = initialGrid[r] ? (initialGrid[r][c] || FUTOSHIKI_EMPTY) : FUTOSHIKI_EMPTY;
                    this.grid[r][c] = val;
                    this.initialGrid[r][c] = val;
                    this.locked[r][c] = val !== FUTOSHIKI_EMPTY;
                }
            }
        }

        if (locked) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (locked[r] && locked[r][c] !== undefined) {
                        this.locked[r][c] = !!locked[r][c];
                    }
                }
            }
        }

        // Horizontale Constraints kopieren und normalisieren
        this.hConstraints = Array.from({ length: size }, () => Array(size - 1).fill(CONSTRAINT_NONE));
        if (hConstraints) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size - 1; c++) {
                    const raw = hConstraints[r] ? hConstraints[r][c] : '';
                    if (raw === '<' || raw === '>') {
                        this.hConstraints[r][c] = raw;
                    }
                }
            }
        }

        // Vertikale Constraints kopieren und normalisieren ('^' -> '<', 'v' -> '>')
        this.vConstraints = Array.from({ length: size - 1 }, () => Array(size).fill(CONSTRAINT_NONE));
        if (vConstraints) {
            for (let r = 0; r < size - 1; r++) {
                for (let c = 0; c < size; c++) {
                    const raw = vConstraints[r] ? vConstraints[r][c] : '';
                    if (raw === '<' || raw === '^') {
                        this.vConstraints[r][c] = CONSTRAINT_LT;
                    } else if (raw === '>' || raw === 'v') {
                        this.vConstraints[r][c] = CONSTRAINT_GT;
                    }
                }
            }
        }

        this.solution = solution ? solution.map(row => [...row]) : null;
        this.notes = Array.from({ length: size }, () => Array.from({ length: size }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Setzt das Spielfeld auf die Ausgangsbelegung zurück
     */
    restart() {
        this.grid = this.initialGrid.map(row => [...row]);
        this.notes = Array.from({ length: this.size }, () => Array.from({ length: this.size }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];
    }

    getCell(r, c) {
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) return FUTOSHIKI_EMPTY;
        return this.grid[r][c];
    }

    isLocked(r, c) {
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) return false;
        return this.locked[r][c];
    }

    getSolution() {
        return this.solution;
    }

    getConstraintH(r, c) {
        if (r < 0 || r >= this.size || c < 0 || c >= this.size - 1) return CONSTRAINT_NONE;
        return this.hConstraints[r][c];
    }

    getConstraintV(r, c) {
        if (r < 0 || r >= this.size - 1 || c < 0 || c >= this.size) return CONSTRAINT_NONE;
        return this.vConstraints[r][c];
    }

    /**
     * Setzt den Wert einer Zelle oder schaltet eine Notiz um (Cortex Plugin Interface)
     */
    setCellValue(r, c, val, isNote = false) {
        return this.setCell(r, c, val, isNote);
    }

    /**
     * Schaltet den Wert einer Zelle zyklisch weiter (0 -> 1 -> ... -> N -> 0)
     */
    cycleCellValue(r, c) {
        if (this.locked[r][c]) return null;
        const current = this.grid[r][c];
        const next = (current + 1) % (this.maxValue + 1);
        this.setCellValue(r, c, next, false);
        return next;
    }

    /**
     * Setzt den Wert einer Zelle oder schaltet eine Notiz um
     */
    setCell(r, c, val, isNote = false) {
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) return false;
        if (this.locked[r][c]) return false;

        const numVal = Number(val);
        if (isNaN(numVal) || numVal < 0 || numVal > this.maxValue) return false;

        if (isNote) {
            if (numVal === FUTOSHIKI_EMPTY) return false;
            const cellNotes = this.notes[r][c];
            const oldNotes = new Set(cellNotes);

            if (cellNotes.has(numVal)) {
                cellNotes.delete(numVal);
            } else {
                cellNotes.add(numVal);
            }

            this.undoStack.push({
                type: 'note',
                r, c,
                oldNotes,
                newNotes: new Set(cellNotes)
            });
            this.redoStack = [];
            return true;
        }

        const oldVal = this.grid[r][c];
        const oldNotes = new Set(this.notes[r][c]);

        if (oldVal === numVal) return true;

        this.undoStack.push({
            type: 'value',
            r, c,
            oldVal,
            newVal: numVal,
            oldNotes,
            newNotes: numVal !== FUTOSHIKI_EMPTY ? new Set() : new Set(oldNotes)
        });
        this.redoStack = [];

        this.grid[r][c] = numVal;
        if (numVal !== FUTOSHIKI_EMPTY) {
            this.notes[r][c].clear();
        }

        return true;
    }

    clearCell(r, c) {
        return this.setCell(r, c, FUTOSHIKI_EMPTY, false);
    }

    toggleNote(r, c, val) {
        return this.setCell(r, c, val, true);
    }

    getNotes(r, c) {
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) return new Set();
        return this.notes[r][c];
    }

    /**
     * Prüft auf Duplikate in einer Zeile
     * @returns {Array<number>} Spalten-Indizes mit Duplikaten
     */
    checkRowConflict(r) {
        const counts = new Map();
        for (let c = 0; c < this.size; c++) {
            const v = this.grid[r][c];
            if (v !== FUTOSHIKI_EMPTY) {
                counts.set(v, (counts.get(v) || 0) + 1);
            }
        }
        const duplicateCols = [];
        for (let c = 0; c < this.size; c++) {
            const v = this.grid[r][c];
            if (v !== FUTOSHIKI_EMPTY && counts.get(v) > 1) {
                duplicateCols.push(c);
            }
        }
        return duplicateCols;
    }

    /**
     * Prüft auf Duplikate in einer Spalte
     * @returns {Array<number>} Zeilen-Indizes mit Duplikaten
     */
    checkColConflict(c) {
        const counts = new Map();
        for (let r = 0; r < this.size; r++) {
            const v = this.grid[r][c];
            if (v !== FUTOSHIKI_EMPTY) {
                counts.set(v, (counts.get(v) || 0) + 1);
            }
        }
        const duplicateRows = [];
        for (let r = 0; r < this.size; r++) {
            const v = this.grid[r][c];
            if (v !== FUTOSHIKI_EMPTY && counts.get(v) > 1) {
                duplicateRows.push(r);
            }
        }
        return duplicateRows;
    }

    /**
     * Prüft alle Ungleichungs-Constraints auf Verstöße
     * @returns {Array<Object>} Liste aller verletzten Constraints
     */
    checkConstraints() {
        const violations = [];

        // 1. Horizontale Constraints prüfen
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size - 1; c++) {
                const rel = this.hConstraints[r][c];
                if (!rel) continue;

                const v1 = this.grid[r][c];
                const v2 = this.grid[r][c + 1];
                if (v1 === FUTOSHIKI_EMPTY || v2 === FUTOSHIKI_EMPTY) continue;

                if (rel === CONSTRAINT_LT && !(v1 < v2)) {
                    violations.push({
                        type: 'horizontal',
                        r1: r, c1: c,
                        r2: r, c2: c + 1,
                        relation: rel,
                        val1: v1, val2: v2,
                        message: `Ungleichung verletzt: Feld (${r + 1},${c + 1}) [${v1}] muss kleiner sein als Feld (${r + 1},${c + 2}) [${v2}].`
                    });
                } else if (rel === CONSTRAINT_GT && !(v1 > v2)) {
                    violations.push({
                        type: 'horizontal',
                        r1: r, c1: c,
                        r2: r, c2: c + 1,
                        relation: rel,
                        val1: v1, val2: v2,
                        message: `Ungleichung verletzt: Feld (${r + 1},${c + 1}) [${v1}] muss größer sein als Feld (${r + 1},${c + 2}) [${v2}].`
                    });
                }
            }
        }

        // 2. Vertikale Constraints prüfen
        for (let r = 0; r < this.size - 1; r++) {
            for (let c = 0; c < this.size; c++) {
                const rel = this.vConstraints[r][c];
                if (!rel) continue;

                const v1 = this.grid[r][c];
                const v2 = this.grid[r + 1][c];
                if (v1 === FUTOSHIKI_EMPTY || v2 === FUTOSHIKI_EMPTY) continue;

                if (rel === CONSTRAINT_LT && !(v1 < v2)) {
                    violations.push({
                        type: 'vertical',
                        r1: r, c1: c,
                        r2: r + 1, c2: c,
                        relation: rel,
                        val1: v1, val2: v2,
                        message: `Ungleichung verletzt: Feld (${r + 1},${c + 1}) [${v1}] muss kleiner sein als Feld (${r + 2},${c + 1}) [${v2}].`
                    });
                } else if (rel === CONSTRAINT_GT && !(v1 > v2)) {
                    violations.push({
                        type: 'vertical',
                        r1: r, c1: c,
                        r2: r + 1, c2: c,
                        relation: rel,
                        val1: v1, val2: v2,
                        message: `Ungleichung verletzt: Feld (${r + 1},${c + 1}) [${v1}] muss größer sein als Feld (${r + 2},${c + 1}) [${v2}].`
                    });
                }
            }
        }

        return violations;
    }

    /**
     * Ermittelt die direkten logischen Kandidaten für eine Zelle (unter Ausschluss
     * bereits belegter Zeilen/Spalten-Ziffern und direkter Ungleichungen mit belegten Nachbarn).
     */
    getCandidates(r, c) {
        if (this.grid[r][c] !== FUTOSHIKI_EMPTY) {
            return new Set([this.grid[r][c]]);
        }

        const candidates = new Set();
        for (let v = 1; v <= this.maxValue; v++) {
            candidates.add(v);
        }

        // Zeilen-Elimination
        for (let col = 0; col < this.size; col++) {
            if (col !== c && this.grid[r][col] !== FUTOSHIKI_EMPTY) {
                candidates.delete(this.grid[r][col]);
            }
        }

        // Spalten-Elimination
        for (let row = 0; row < this.size; row++) {
            if (row !== r && this.grid[row][c] !== FUTOSHIKI_EMPTY) {
                candidates.delete(this.grid[row][c]);
            }
        }

        // Horizontale Constraints (links)
        if (c > 0) {
            const relLeft = this.hConstraints[r][c - 1];
            const leftVal = this.grid[r][c - 1];
            if (relLeft && leftVal !== FUTOSHIKI_EMPTY) {
                for (const cand of Array.from(candidates)) {
                    if (relLeft === CONSTRAINT_LT && !(leftVal < cand)) candidates.delete(cand);
                    if (relLeft === CONSTRAINT_GT && !(leftVal > cand)) candidates.delete(cand);
                }
            }
        }

        // Horizontale Constraints (rechts)
        if (c < this.size - 1) {
            const relRight = this.hConstraints[r][c];
            const rightVal = this.grid[r][c + 1];
            if (relRight && rightVal !== FUTOSHIKI_EMPTY) {
                for (const cand of Array.from(candidates)) {
                    if (relRight === CONSTRAINT_LT && !(cand < rightVal)) candidates.delete(cand);
                    if (relRight === CONSTRAINT_GT && !(cand > rightVal)) candidates.delete(cand);
                }
            }
        }

        // Vertikale Constraints (oben)
        if (r > 0) {
            const relTop = this.vConstraints[r - 1][c];
            const topVal = this.grid[r - 1][c];
            if (relTop && topVal !== FUTOSHIKI_EMPTY) {
                for (const cand of Array.from(candidates)) {
                    if (relTop === CONSTRAINT_LT && !(topVal < cand)) candidates.delete(cand);
                    if (relTop === CONSTRAINT_GT && !(topVal > cand)) candidates.delete(cand);
                }
            }
        }

        // Vertikale Constraints (unten)
        if (r < this.size - 1) {
            const relBottom = this.vConstraints[r][c];
            const bottomVal = this.grid[r + 1][c];
            if (relBottom && bottomVal !== FUTOSHIKI_EMPTY) {
                for (const cand of Array.from(candidates)) {
                    if (relBottom === CONSTRAINT_LT && !(cand < bottomVal)) candidates.delete(cand);
                    if (relBottom === CONSTRAINT_GT && !(cand > bottomVal)) candidates.delete(cand);
                }
            }
        }

        return candidates;
    }

    /**
     * Umfassende Regelvalidierung
     */
    validateRules() {
        const rowErrors = [];
        const colErrors = [];

        for (let r = 0; r < this.size; r++) {
            const dupCols = this.checkRowConflict(r);
            if (dupCols.length > 0) {
                rowErrors.push({ r, dupCols });
            }
        }

        for (let c = 0; c < this.size; c++) {
            const dupRows = this.checkColConflict(c);
            if (dupRows.length > 0) {
                colErrors.push({ c, dupRows });
            }
        }

        const constraintErrors = this.checkConstraints();

        let allFilled = true;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === FUTOSHIKI_EMPTY) {
                    allFilled = false;
                    break;
                }
            }
            if (!allFilled) break;
        }

        const isValid = rowErrors.length === 0 && colErrors.length === 0 && constraintErrors.length === 0;
        const isComplete = isValid && allFilled;

        return {
            isValid,
            isComplete,
            allFilled,
            rowErrors,
            colErrors,
            constraintErrors
        };
    }

    validate() {
        return this.validateRules();
    }

    isCompleted() {
        return this.validateRules().isComplete;
    }

    isSolved() {
        return this.isCompleted();
    }

    /**
     * Findet Fehler für das Hinweis- und Feedback-System
     */
    findMistakes() {
        // 1. Ungleichungsverletzungen
        const violations = this.checkConstraints();
        if (violations.length > 0) {
            const v = violations[0];
            return {
                type: 'error',
                isMistake: true,
                errorType: 'constraint_violation',
                strategy: 'Ungleichung verletzt',
                title: 'Ungleichung verletzt',
                r: v.r1,
                c: v.c1,
                highlightCells: [{ r: v.r1, c: v.c1 }, { r: v.r2, c: v.c2 }],
                message: v.message
            };
        }

        // 2. Zeilen-Duplikate
        for (let r = 0; r < this.size; r++) {
            const dupCols = this.checkRowConflict(r);
            if (dupCols.length > 0) {
                const c = dupCols[0];
                return {
                    type: 'error',
                    isMistake: true,
                    errorType: 'row_duplicate',
                    strategy: 'Doppelte Ziffer in Zeile',
                    title: 'Duplikat in Zeile',
                    r, c,
                    highlightCells: dupCols.map(col => ({ r, c: col })),
                    message: `In Zeile ${r + 1} kommt die Ziffer ${this.grid[r][c]} mehrfach vor.`
                };
            }
        }

        // 3. Spalten-Duplikate
        for (let c = 0; c < this.size; c++) {
            const dupRows = this.checkColConflict(c);
            if (dupRows.length > 0) {
                const r = dupRows[0];
                return {
                    type: 'error',
                    isMistake: true,
                    errorType: 'col_duplicate',
                    strategy: 'Doppelte Ziffer in Spalte',
                    title: 'Duplikat in Spalte',
                    r, c,
                    highlightCells: dupRows.map(row => ({ r: row, c })),
                    message: `In Spalte ${c + 1} kommt die Ziffer ${this.grid[r][c]} mehrfach vor.`
                };
            }
        }

        // 4. Mismatch mit Referenzlösung
        if (this.solution) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const current = this.grid[r][c];
                    if (current !== FUTOSHIKI_EMPTY && current !== this.solution[r][c]) {
                        return {
                            type: 'error',
                            isMistake: true,
                            errorType: 'solution_mismatch',
                            strategy: 'Falsche Ziffer',
                            title: 'Falsche Ziffer',
                            r, c,
                            currentVal: current,
                            expectedVal: this.solution[r][c],
                            highlightCells: [{ r, c }],
                            message: `In Feld (${r + 1},${c + 1}) ist die Ziffer ${current} logisch nicht korrekt.`
                        };
                    }
                }
            }
        }

        return null;
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        const action = this.undoStack.pop();

        if (action.type === 'value') {
            this.grid[action.r][action.c] = action.oldVal;
            this.notes[action.r][action.c] = new Set(action.oldNotes);
            this.redoStack.push(action);
            return true;
        } else if (action.type === 'note') {
            this.notes[action.r][action.c] = new Set(action.oldNotes);
            this.redoStack.push(action);
            return true;
        }
        return false;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        const action = this.redoStack.pop();

        if (action.type === 'value') {
            this.grid[action.r][action.c] = action.newVal;
            this.notes[action.r][action.c] = new Set(action.newNotes);
            this.undoStack.push(action);
            return true;
        } else if (action.type === 'note') {
            this.notes[action.r][action.c] = new Set(action.newNotes);
            this.undoStack.push(action);
            return true;
        }
        return false;
    }

    getFilledCount() {
        let count = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== FUTOSHIKI_EMPTY) count++;
            }
        }
        return count;
    }

    getTotalCells() {
        return this.size * this.size;
    }
}
