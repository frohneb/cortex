/**
 * Nonogram (Picross / Griddlers) Engine
 * Verwaltet Gitterzustände (0=Leer, 1=Gefüllt, 2=Kreuz), Zeilen- & Spaltenhinweise,
 * Undo/Redo, Live-Validierung und Fortschrittsüberprüfung.
 */

export const NONO_EMPTY = 0;
export const NONO_FILLED = 1;
export const NONO_CROSS = 2;

export class NonogramEngine {
    constructor(size = 10, height = null) {
        this.width = size;
        this.height = height || size;
        this.size = size;

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.target = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.locked = Array.from({ length: this.height }, () => Array(this.width).fill(false));
        this.notes = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => new Set()));

        this.rowClues = Array.from({ length: this.height }, () => [0]);
        this.colClues = Array.from({ length: this.width }, () => [0]);

        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Berechnet die Clues für eine gegebene 1D-Reihe von Werten (0 oder 1)
     */
    static calculateLineClues(line) {
        const clues = [];
        let currentCount = 0;
        for (const val of line) {
            if (val === NONO_FILLED) {
                currentCount++;
            } else if (currentCount > 0) {
                clues.push(currentCount);
                currentCount = 0;
            }
        }
        if (currentCount > 0) {
            clues.push(currentCount);
        }
        return clues.length > 0 ? clues : [0];
    }

    /**
     * Setzt den Spielzustand auf den Anfangszustand zurück (leert das Spielfeld, behält Vorgaben)
     */
    restart() {
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.notes = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Lädt ein Puzzle (aus Kampagne, Tagesrätsel, Generator oder Tutorial)
     */
    loadPuzzle(puzzleData) {
        if (!puzzleData) return;
        const size = puzzleData.size || (puzzleData.rowClues ? puzzleData.rowClues.length : (puzzleData.target ? puzzleData.target.length : (puzzleData.initialGrid ? puzzleData.initialGrid.length : 10)));
        this.width = size;
        this.height = size;
        this.size = size;

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.target = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.locked = Array.from({ length: this.height }, () => Array(this.width).fill(false));
        this.notes = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];

        if (puzzleData.target) {
            this.initFromTarget(puzzleData.target, puzzleData.locked || null);
        } else if (puzzleData.rowClues && puzzleData.colClues) {
            this.initFromClues(puzzleData.rowClues, puzzleData.colClues, puzzleData.solution || null);
        } else if (puzzleData.solution) {
            this.initFromTarget(puzzleData.solution, puzzleData.locked || null);
        } else if (puzzleData.initialGrid && puzzleData.initialGrid.some(r => r.some(v => v > 0))) {
            this.initFromTarget(puzzleData.initialGrid, puzzleData.locked || null);
        }

        if (puzzleData.grid) {
            this.grid = puzzleData.grid.map(row => [...row]);
        }

        this.initialGrid = JSON.parse(JSON.stringify(this.grid));
        this.initialTarget = this.target ? JSON.parse(JSON.stringify(this.target)) : null;
        this.initialRowClues = this.rowClues ? JSON.parse(JSON.stringify(this.rowClues)) : null;
        this.initialColClues = this.colClues ? JSON.parse(JSON.stringify(this.colClues)) : null;
        this.solution = this.target ? JSON.parse(JSON.stringify(this.target)) : null;
    }

    /**
     * Initialisiert das Rätsel anhand eines Lösungs-Bitmaps
     */
    initFromTarget(targetGrid, lockedGrid = null) {
        this.height = targetGrid.length;
        this.width = targetGrid[0].length;
        this.size = Math.max(this.width, this.height);

        this.target = targetGrid.map(row => [...row]);
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.locked = lockedGrid ? lockedGrid.map(row => [...row]) : Array.from({ length: this.height }, () => Array(this.width).fill(false));

        // Clues aus dem Target-Grid berechnen
        this.rowClues = [];
        for (let r = 0; r < this.height; r++) {
            this.rowClues.push(NonogramEngine.calculateLineClues(this.target[r]));
        }

        this.colClues = [];
        for (let c = 0; c < this.width; c++) {
            const col = [];
            for (let r = 0; r < this.height; r++) {
                col.push(this.target[r][c]);
            }
            this.colClues.push(NonogramEngine.calculateLineClues(col));
        }

        // Falls Zellen gesperrt sind, übernehmen
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (this.locked[r][c]) {
                    this.grid[r][c] = this.target[r][c];
                }
            }
        }
    }

    /**
     * Initialisiert das Rätsel direkt aus Clues
     */
    initFromClues(rowClues, colClues, targetGrid = null) {
        this.height = rowClues.length;
        this.width = colClues.length;
        this.size = Math.max(this.width, this.height);

        this.rowClues = rowClues.map(c => (c.length === 0 ? [0] : [...c]));
        this.colClues = colClues.map(c => (c.length === 0 ? [0] : [...c]));

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.locked = Array.from({ length: this.height }, () => Array(this.width).fill(false));
        this.target = targetGrid ? targetGrid.map(row => [...row]) : Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
    }

    setCellValue(r, c, val, isNote = false) {
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) return false;
        if (this.locked[r][c]) return false;

        const oldVal = this.grid[r][c];
        if (oldVal === val) return false;

        this.undoStack.push({ r, c, oldVal, newVal: val });
        this.redoStack = [];
        this.grid[r][c] = val;
        return true;
    }

    cycleCellValue(r, c, reverse = false) {
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) return 0;
        if (this.locked[r][c]) return this.grid[r][c];

        const current = this.grid[r][c];
        let next;
        if (!reverse) {
            // 0 -> 1 -> 2 -> 0
            next = current === NONO_EMPTY ? NONO_FILLED : (current === NONO_FILLED ? NONO_CROSS : NONO_EMPTY);
        } else {
            // 0 -> 2 -> 1 -> 0
            next = current === NONO_EMPTY ? NONO_CROSS : (current === NONO_CROSS ? NONO_FILLED : NONO_EMPTY);
        }

        this.undoStack.push({ r, c, oldVal: current, newVal: next });
        this.redoStack = [];
        this.grid[r][c] = next;
        return next;
    }

    cycleNoteValue(r, c) {
        return this.cycleCellValue(r, c, true);
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        const action = this.undoStack.pop();
        this.grid[action.r][action.c] = action.oldVal;
        this.redoStack.push(action);
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        const action = this.redoStack.pop();
        this.grid[action.r][action.c] = action.newVal;
        this.undoStack.push(action);
        return true;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    clear() {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (!this.locked[r][c]) {
                    this.grid[r][c] = NONO_EMPTY;
                }
            }
        }
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Prüft, ob eine Zeile exakt die geforderten Hinweise erfüllt
     */
    isRowSatisfied(r) {
        if (r < 0 || r >= this.height) return false;
        const currentClues = NonogramEngine.calculateLineClues(this.grid[r]);
        const targetClues = this.rowClues[r];
        if (currentClues.length !== targetClues.length) return false;
        for (let i = 0; i < currentClues.length; i++) {
            if (currentClues[i] !== targetClues[i]) return false;
        }
        return true;
    }

    /**
     * Prüft, ob eine Spalte exakt die geforderten Hinweise erfüllt
     */
    isColSatisfied(c) {
        if (c < 0 || c >= this.width) return false;
        const col = [];
        for (let r = 0; r < this.height; r++) {
            col.push(this.grid[r][c]);
        }
        const currentClues = NonogramEngine.calculateLineClues(col);
        const targetClues = this.colClues[c];
        if (currentClues.length !== targetClues.length) return false;
        for (let i = 0; i < currentClues.length; i++) {
            if (currentClues[i] !== targetClues[i]) return false;
        }
        return true;
    }

    /**
     * Prüft, ob das gesamte Nonogramm vollständig und fehlerfrei gelöst ist
     */
    isSolved() {
        // Alle Zeilen und Spalten müssen exakt übereinstimmen
        for (let r = 0; r < this.height; r++) {
            if (!this.isRowSatisfied(r)) return false;
        }
        for (let c = 0; c < this.width; c++) {
            if (!this.isColSatisfied(c)) return false;
        }
        return true;
    }

    isCompleted() {
        return this.isSolved();
    }

    findMistakes() {
        const mistakes = [];
        if (this.target && this.target.length > 0) {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === NONO_FILLED && this.target[r][c] !== NONO_FILLED) {
                        mistakes.push({ r, c, currentVal: NONO_FILLED, expectedVal: NONO_CROSS });
                    }
                }
            }
        }
        return mistakes;
    }

    /**
     * Prüft Fehler und Konflikte für AutoCheck
     */
    validateRules() {
        const conflictCells = new Set();
        const satisfiedRows = new Set();
        const satisfiedCols = new Set();

        for (let r = 0; r < this.height; r++) {
            if (this.isRowSatisfied(r)) {
                satisfiedRows.add(r);
            }
        }

        for (let c = 0; c < this.width; c++) {
            if (this.isColSatisfied(c)) {
                satisfiedCols.add(c);
            }
        }

        // Falls Target-Grid vorhanden, falsche gefüllte Kacheln markieren
        if (this.target && this.target.length > 0) {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === NONO_FILLED && this.target[r][c] !== NONO_FILLED) {
                        conflictCells.add(`${r},${c}`);
                    }
                }
            }
        }

        return { conflictCells, satisfiedRows, satisfiedCols, isValid: conflictCells.size === 0 };
    }

    getSolution() {
        return this.target.map(row => [...row]);
    }

    clone() {
        const cloned = new NonogramEngine(this.width, this.height);
        cloned.grid = this.grid.map(row => [...row]);
        cloned.target = this.target.map(row => [...row]);
        cloned.locked = this.locked.map(row => [...row]);
        cloned.rowClues = this.rowClues.map(c => [...c]);
        cloned.colClues = this.colClues.map(c => [...c]);
        cloned.undoStack = [...this.undoStack];
        cloned.redoStack = [...this.redoStack];
        return cloned;
    }
}
