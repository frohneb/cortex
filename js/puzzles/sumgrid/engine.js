/**
 * SumGrid Puzzle Engine
 * Repräsentiert das Zahlen-Raster (N×N) mit Zeilen- und Spalten-Zielsummen,
 * Zellzuständen (0 = Neutral, 1 = Behalten, 2 = Gestrichen),
 * Live-Berechnung von Summen, Validierung und Undo/Redo.
 */

export const SUMGRID_NEUTRAL = 0; // Unentschieden / Offen
export const SUMGRID_KEEP = 1;    // Zählt zur Summe
export const SUMGRID_CROSS = 2;   // Gestrichen (zählt nicht)

export class SumGridEngine {
    constructor(size = 5) {
        this.size = size;

        // Zahlen-Werte des Rätsels (1..9)
        this.numbers = Array.from({ length: size }, () => Array(size).fill(1));

        // Zielsummen
        this.rowTargets = Array(size).fill(0);
        this.colTargets = Array(size).fill(0);

        // Spielerstatus (0, 1 oder 2)
        this.grid = Array.from({ length: size }, () => Array(size).fill(SUMGRID_NEUTRAL));
        this.initialGrid = Array.from({ length: size }, () => Array(size).fill(SUMGRID_NEUTRAL));
        this.locked = Array.from({ length: size }, () => Array(size).fill(false));

        // Kandidaten-Notizen (für Notizmodus)
        this.notes = Array.from({ length: size }, () => Array.from({ length: size }, () => new Set()));

        this.solution = null;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Lädt ein Puzzle
     * @param {Object} config
     *   size: number
     *   numbers: number[][]
     *   rowTargets: number[]
     *   colTargets: number[]
     *   solution: number[][] (0 oder 1)
     *   initialGrid: number[][] (optional)
     *   locked: boolean[][] (optional)
     */
    loadPuzzle({ size = 5, numbers = null, rowTargets = null, colTargets = null, solution = null, initialGrid = null, locked = null }) {
        this.size = size;

        this.numbers = Array.from({ length: size }, (_, r) => 
            Array.from({ length: size }, (_, c) => (numbers && numbers[r] && numbers[r][c] !== undefined) ? numbers[r][c] : 1)
        );

        this.rowTargets = rowTargets ? [...rowTargets] : Array(size).fill(0);
        this.colTargets = colTargets ? [...colTargets] : Array(size).fill(0);

        this.grid = Array.from({ length: size }, () => Array(size).fill(SUMGRID_NEUTRAL));
        this.initialGrid = Array.from({ length: size }, () => Array(size).fill(SUMGRID_NEUTRAL));
        this.locked = Array.from({ length: size }, () => Array(size).fill(false));
        this.notes = Array.from({ length: size }, () => Array.from({ length: size }, () => new Set()));

        if (initialGrid) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const val = initialGrid[r] ? (initialGrid[r][c] || SUMGRID_NEUTRAL) : SUMGRID_NEUTRAL;
                    this.grid[r][c] = val;
                    this.initialGrid[r][c] = val;
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

        this.solution = solution ? solution.map(row => [...row]) : null;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Setzt das Board auf den Ursprungszustand zurück
     */
    restart() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.locked[r][c]) {
                    this.grid[r][c] = this.initialGrid[r][c];
                    this.notes[r][c].clear();
                }
            }
        }
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Setzt den Zellwert mit Undo/Redo-Tracking
     */
    setCellValue(r, c, val, isNote = false) {
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) return;
        if (this.locked[r][c]) return;

        if (isNote) {
            if (this.notes[r][c].has(val)) {
                this.notes[r][c].delete(val);
            } else {
                this.notes[r][c].add(val);
            }
            return;
        }

        const oldVal = this.grid[r][c];
        if (oldVal === val) return;

        this.undoStack.push({ r, c, oldVal, newVal: val });
        this.redoStack = [];
        this.grid[r][c] = val;
    }

    /**
     * Schaltet den Zellzustand zyklisch durch: Neutral (0) -> Keep (1) -> Cross (2) -> Neutral (0)
     */
    cycleCellValue(r, c) {
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) return 0;
        if (this.locked[r][c]) return this.grid[r][c];

        const oldVal = this.grid[r][c];
        let nextVal = SUMGRID_KEEP;
        if (oldVal === SUMGRID_KEEP) {
            nextVal = SUMGRID_CROSS;
        } else if (oldVal === SUMGRID_CROSS) {
            nextVal = SUMGRID_NEUTRAL;
        }

        this.undoStack.push({ r, c, oldVal, newVal: nextVal });
        this.redoStack = [];
        this.grid[r][c] = nextVal;
        return nextVal;
    }

    cycleNoteValue(r, c) {
        // Im Notizmodus: Umschalten zwischen Notiz-Markierung
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) return;
        if (this.locked[r][c]) return;
        if (this.notes[r][c].has(1)) {
            this.notes[r][c].delete(1);
        } else {
            this.notes[r][c].add(1);
        }
    }

    undo() {
        if (this.undoStack.length === 0) return null;
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        this.grid[action.r][action.c] = action.oldVal;
        return action;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        this.grid[action.r][action.c] = action.newVal;
        return action;
    }

    // --- Summen- und Status-Berechnungen ---

    /**
     * Aktuelle Summe aller als KEEP (1) markierten Zellen in Zeile r
     */
    getRowSum(r) {
        if (r < 0 || r >= this.size) return 0;
        let sum = 0;
        for (let c = 0; c < this.size; c++) {
            if (this.grid[r][c] === SUMGRID_KEEP) {
                sum += this.numbers[r][c];
            }
        }
        return sum;
    }

    /**
     * Aktuelle Summe aller als KEEP (1) markierten Zellen in Spalte c
     */
    getColSum(c) {
        if (c < 0 || c >= this.size) return 0;
        let sum = 0;
        for (let r = 0; r < this.size; r++) {
            if (this.grid[r][c] === SUMGRID_KEEP) {
                sum += this.numbers[r][c];
            }
        }
        return sum;
    }

    /**
     * Maximal noch erreichbare Summe in Zeile r (KEEP + NEUTRAL)
     */
    getRowPossibleSum(r) {
        if (r < 0 || r >= this.size) return 0;
        let sum = 0;
        for (let c = 0; c < this.size; c++) {
            if (this.grid[r][c] !== SUMGRID_CROSS) {
                sum += this.numbers[r][c];
            }
        }
        return sum;
    }

    /**
     * Maximal noch erreichbare Summe in Spalte c (KEEP + NEUTRAL)
     */
    getColPossibleSum(c) {
        if (c < 0 || c >= this.size) return 0;
        let sum = 0;
        for (let r = 0; r < this.size; r++) {
            if (this.grid[r][c] !== SUMGRID_CROSS) {
                sum += this.numbers[r][c];
            }
        }
        return sum;
    }

    getRowTarget(r) {
        return this.rowTargets[r] || 0;
    }

    getColTarget(c) {
        return this.colTargets[c] || 0;
    }

    isRowSatisfied(r) {
        return this.getRowSum(r) === this.getRowTarget(r);
    }

    isColSatisfied(c) {
        return this.getColSum(c) === this.getColTarget(c);
    }

    isRowExceeded(r) {
        return this.getRowSum(r) > this.getRowTarget(r);
    }

    isColExceeded(c) {
        return this.getColSum(c) > this.getColTarget(c);
    }

    isRowDeficient(r) {
        return this.getRowPossibleSum(r) < this.getRowTarget(r);
    }

    isColDeficient(c) {
        return this.getColPossibleSum(c) < this.getColTarget(c);
    }

    /**
     * Prüft, ob das gesamte Board fehlerfrei gelöst ist.
     * Alle Zeilen und Spalten müssen exakt die Zielsumme erreichen
     * und keine Zeile/Spalte darf überschritten oder defizitär sein.
     */
    isCompleted() {
        for (let r = 0; r < this.size; r++) {
            if (!this.isRowSatisfied(r)) return false;
            // Falls die Zeile zwar summenmäßig passt, aber noch neutrale Zellen übrig sind,
            // die zu Unklarheit führen könnten: Wenn eine neutrale Zahl existiert,
            // ist das Rätsel erst fertig, wenn alle aktiven ausgewählt sind.
            // Sobald die Summe exakt stimmt, ist die Zeile erfüllt.
        }
        for (let c = 0; c < this.size; c++) {
            if (!this.isColSatisfied(c)) return false;
        }

        // Falls eine Lösung hinterlegt ist, muss die Maske der gewählten Felder
        // mit der eindeutigen Lösung übereinstimmen:
        if (this.solution) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const shouldKeep = this.solution[r][c] === 1;
                    const isKept = this.grid[r][c] === SUMGRID_KEEP;
                    if (shouldKeep !== isKept) return false;
                }
            }
        }

        return true;
    }
}
