/**
 * Sudoku Game Engine
 * Unterstützt 4×4 (2×2 Boxen), 9×9 (3×3 Boxen) und 16×16 (4×4 Boxen, Hexadezimal 0–F).
 * Verwaltet Spielfeld, Notizen, Undo/Redo, Regelvalidierung und Peer-Ermittlung.
 */

export const SUDOKU_EMPTY = 0;

export const HEX_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

export function formatSudokuValue(val, size = 9) {
    if (!val || val <= 0) return '';
    if (size === 16) {
        return HEX_DIGITS[val - 1] || `${val}`;
    }
    return `${val}`;
}

export class SudokuEngine {
    constructor(size = 9) {
        this.size = size;
        this.maxValue = size;
        
        // Box-Dimensionen
        if (size === 4) {
            this.boxW = 2;
            this.boxH = 2;
        } else if (size === 16) {
            this.boxW = 4;
            this.boxH = 4;
        } else {
            this.boxW = 3;
            this.boxH = 3;
        }

        this.grid = Array(size).fill(0).map(() => Array(size).fill(SUDOKU_EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(SUDOKU_EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));

        this.undoStack = [];
        this.redoStack = [];
        this.solution = null;
    }

    loadPuzzle({ size = 9, initialGrid, solution = null }) {
        this.size = size;
        this.maxValue = size;

        if (size === 4) {
            this.boxW = 2;
            this.boxH = 2;
        } else if (size === 16) {
            this.boxW = 4;
            this.boxH = 4;
        } else {
            this.boxW = 3;
            this.boxH = 3;
        }

        this.grid = Array(size).fill(0).map(() => Array(size).fill(SUDOKU_EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(SUDOKU_EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];
        this.solution = solution ? solution.map(row => [...row]) : null;

        if (initialGrid) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const val = initialGrid[r][c];
                    if (val > 0) {
                        this.grid[r][c] = val;
                        this.initialGrid[r][c] = val;
                        this.locked[r][c] = true;
                    }
                }
            }
        }
    }

    formatValue(val) {
        return formatSudokuValue(val, this.size);
    }

    getSolution() {
        if (this.solution) return this.solution;
        if (typeof SudokuSolver !== 'undefined' && SudokuSolver.solve) {
            const sol = SudokuSolver.solve(this, 1);
            if (sol && sol.length > 0) {
                this.solution = sol[0].map(row => [...row]);
                return this.solution;
            }
        }
        return null;
    }

    getBox(r, c) {
        const startR = Math.floor(r / this.boxH) * this.boxH;
        const startC = Math.floor(c / this.boxW) * this.boxW;
        return {
            startR,
            startC,
            endR: startR + this.boxH,
            endC: startC + this.boxW
        };
    }

    getPeers(r, c) {
        const peers = new Set();
        // Zeile
        for (let cc = 0; cc < this.size; cc++) {
            if (cc !== c) peers.add(`${r},${cc}`);
        }
        // Spalte
        for (let rr = 0; rr < this.size; rr++) {
            if (rr !== r) peers.add(`${rr},${c}`);
        }
        // Box
        const box = this.getBox(r, c);
        for (let rr = box.startR; rr < box.endR; rr++) {
            for (let cc = box.startC; cc < box.endC; cc++) {
                if (rr !== r || cc !== c) peers.add(`${rr},${cc}`);
            }
        }
        return peers;
    }

    setCellValue(r, c, val, isNote = false) {
        if (this.locked[r][c]) return false;

        if (isNote) {
            if (val <= 0 || val > this.maxValue) return false;
            const cellNotes = this.notes[r][c];
            const prevNotes = new Set(cellNotes);
            if (cellNotes.has(val)) {
                cellNotes.delete(val);
            } else {
                cellNotes.add(val);
            }
            this.undoStack.push({
                type: 'note',
                r, c,
                prevNotes,
                nextNotes: new Set(cellNotes)
            });
            this.redoStack = [];
            return true;
        }

        const prevVal = this.grid[r][c];
        const prevNotes = new Set(this.notes[r][c]);

        if (prevVal === val && prevNotes.size === 0) return false;

        this.undoStack.push({
            type: 'cell',
            r, c,
            prevVal,
            nextVal: val,
            prevNotes
        });
        this.redoStack = [];

        this.grid[r][c] = val;
        this.notes[r][c].clear();

        // Automatisch Notizen in Peers bereinigen wenn Zahl gesetzt wird
        if (val > 0) {
            for (const peerStr of this.getPeers(r, c)) {
                const [pr, pc] = peerStr.split(',').map(Number);
                if (this.notes[pr][pc].has(val)) {
                    this.notes[pr][pc].delete(val);
                }
            }
        }

        return true;
    }

    cycleCellValue(r, c) {
        if (this.locked[r][c]) return null;
        const current = this.grid[r][c];
        let next = (current + 1) % (this.maxValue + 1);
        this.setCellValue(r, c, next);
        return next;
    }

    undo() {
        if (this.undoStack.length === 0) return null;
        const action = this.undoStack.pop();
        this.redoStack.push(action);

        if (action.type === 'cell') {
            this.grid[action.r][action.c] = action.prevVal;
            this.notes[action.r][action.c] = new Set(action.prevNotes);
        } else if (action.type === 'note') {
            this.notes[action.r][action.c] = new Set(action.prevNotes);
        }
        return action;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();
        this.undoStack.push(action);

        if (action.type === 'cell') {
            this.grid[action.r][action.c] = action.nextVal;
        } else if (action.type === 'note') {
            this.notes[action.r][action.c] = new Set(action.nextNotes);
        }
        return action;
    }

    validateRules() {
        const errors = [];
        const conflictCells = new Set();

        // 1. Zeilen-Duplikate
        for (let r = 0; r < this.size; r++) {
            const seen = new Map();
            for (let c = 0; c < this.size; c++) {
                const v = this.grid[r][c];
                if (v === SUDOKU_EMPTY) continue;
                if (seen.has(v)) {
                    conflictCells.add(`${r},${c}`);
                    conflictCells.add(`${r},${seen.get(v)}`);
                    errors.push({
                        rule: 'row_duplicate',
                        row: r,
                        value: v,
                        message: `Ziffer ${this.formatValue(v)} kommt mehrfach in Zeile ${r + 1} vor`
                    });
                } else {
                    seen.set(v, c);
                }
            }
        }

        // 2. Spalten-Duplikate
        for (let c = 0; c < this.size; c++) {
            const seen = new Map();
            for (let r = 0; r < this.size; r++) {
                const v = this.grid[r][c];
                if (v === SUDOKU_EMPTY) continue;
                if (seen.has(v)) {
                    conflictCells.add(`${r},${c}`);
                    conflictCells.add(`${seen.get(v)},${c}`);
                    errors.push({
                        rule: 'col_duplicate',
                        col: c,
                        value: v,
                        message: `Ziffer ${this.formatValue(v)} kommt mehrfach in Spalte ${c + 1} vor`
                    });
                } else {
                    seen.set(v, r);
                }
            }
        }

        // 3. Block-/Box-Duplikate
        for (let br = 0; br < this.size; br += this.boxH) {
            for (let bc = 0; bc < this.size; bc += this.boxW) {
                const seen = new Map();
                for (let r = br; r < br + this.boxH; r++) {
                    for (let c = bc; c < bc + this.boxW; c++) {
                        const v = this.grid[r][c];
                        if (v === SUDOKU_EMPTY) continue;
                        if (seen.has(v)) {
                            const [pr, pc] = seen.get(v);
                            conflictCells.add(`${r},${c}`);
                            conflictCells.add(`${pr},${pc}`);
                            errors.push({
                                rule: 'box_duplicate',
                                value: v,
                                message: `Ziffer ${this.formatValue(v)} kommt mehrfach im Block vor`
                            });
                        } else {
                            seen.set(v, [r, c]);
                        }
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            conflictCells
        };
    }

    findMistakes() {
        const sol = this.getSolution();
        const ruleCheck = this.validateRules();

        if (!ruleCheck.isValid && ruleCheck.errors.length > 0) {
            const firstErr = ruleCheck.errors[0];
            const conflictArr = Array.from(ruleCheck.conflictCells || []).map(str => {
                const [r, c] = str.split(',').map(Number);
                return { r, c };
            });

            const targetCell = conflictArr.find(pos => !this.locked[pos.r][pos.c]) || conflictArr[0];
            const r = targetCell ? targetCell.r : 0;
            const c = targetCell ? targetCell.c : 0;
            const expectedVal = sol ? sol[r][c] : 0;

            return {
                type: 'rule_violation',
                r, c,
                currentVal: this.grid[r][c],
                expectedVal,
                highlightCells: conflictArr.length > 0 ? conflictArr : [{ r, c }],
                message: `Regelverstoß: ${firstErr.message}. Bitte korrigiere oder entferne das Symbol an Position (${r + 1},${c + 1}).`
            };
        }

        if (sol) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const current = this.grid[r][c];
                    if (current !== SUDOKU_EMPTY && !this.locked[r][c] && current !== sol[r][c]) {
                        return {
                            type: 'solution_mismatch',
                            r, c,
                            currentVal: current,
                            expectedVal: sol[r][c],
                            highlightCells: [{ r, c }],
                            message: `Fehler im Lösungsweg: An Position (${r + 1},${c + 1}) wurde ${this.formatValue(current)} gesetzt. Laut der Logik und Abhängigkeiten gehört dort ${this.formatValue(sol[r][c])} hin.`
                        };
                    }
                }
            }
        }

        return null;
    }

    isCompleted() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === SUDOKU_EMPTY) return false;
            }
        }
        return this.validateRules().isValid;
    }

    getFilledCount() {
        let count = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== SUDOKU_EMPTY) count++;
            }
        }
        return count;
    }

    getTotalCells() {
        return this.size * this.size;
    }
}
