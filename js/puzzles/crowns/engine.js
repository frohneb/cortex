/**
 * Crowns (Queens) Puzzle Engine
 * Verwaltet das Spielfeld mit Farbregionen, Kronen-Platzierung,
 * X-Markierungen (Eliminierung), Validierung und Undo/Redo.
 */

export const CROWNS_EMPTY = 0;
export const CROWNS_CROWN = 1;  // 👑
export const CROWNS_X     = 2;  // ✕ (Eliminierung)

export class CrownsEngine {
    constructor(size = 5) {
        this.size = size;
        this.grid = Array.from({ length: size }, () => Array(size).fill(CROWNS_EMPTY));
        this.initialGrid = Array.from({ length: size }, () => Array(size).fill(CROWNS_EMPTY));
        this.locked = Array.from({ length: size }, () => Array(size).fill(false));
        this.regions = Array.from({ length: size }, () => Array(size).fill(0));
        this.regionColors = [];
        this.solution = null;
        this.notes = Array.from({ length: size }, () => Array.from({ length: size }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Lädt ein Puzzle mit Regionsdefinition
     */
    loadPuzzle({ size, regions, regionColors, solution, initialGrid, locked }) {
        this.size = size;
        this.grid = initialGrid ? initialGrid.map(row => [...row]) : Array.from({ length: size }, () => Array(size).fill(CROWNS_EMPTY));
        this.initialGrid = initialGrid ? initialGrid.map(row => [...row]) : Array.from({ length: size }, () => Array(size).fill(CROWNS_EMPTY));
        this.locked = locked ? locked.map(row => [...row]) : (initialGrid ? initialGrid.map(row => row.map(v => v !== CROWNS_EMPTY)) : Array.from({ length: size }, () => Array(size).fill(false)));
        this.notes = Array.from({ length: size }, () => Array.from({ length: size }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];

        this.regions = regions ? regions.map(row => [...row]) : Array.from({ length: size }, () => Array(size).fill(0));
        this.regionColors = regionColors ? [...regionColors] : [];
        this.solution = solution ? solution.map(row => [...row]) : null;
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

    /**
     * Gibt die Lösung des aktuellen Puzzles zurück
     */
    getSolution() {
        return this.solution;
    }

    /**
     * Gibt alle Zellen einer bestimmten Region zurück
     */
    getRegionCells(regionId) {
        const cells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.regions[r][c] === regionId) {
                    cells.push({ r, c });
                }
            }
        }
        return cells;
    }

    /**
     * Gibt alle 8 Nachbarn einer Zelle zurück (orthogonal + diagonal)
     */
    getNeighbors8(r, c) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                    neighbors.push({ r: nr, c: nc });
                }
            }
        }
        return neighbors;
    }

    /**
     * Zählt die Kronen in einer Zeile
     */
    getCrownsInRow(r) {
        const cols = [];
        for (let c = 0; c < this.size; c++) {
            if (this.grid[r][c] === CROWNS_CROWN) cols.push(c);
        }
        return cols;
    }

    /**
     * Zählt die Kronen in einer Spalte
     */
    getCrownsInCol(c) {
        const rows = [];
        for (let r = 0; r < this.size; r++) {
            if (this.grid[r][c] === CROWNS_CROWN) rows.push(r);
        }
        return rows;
    }

    /**
     * Zählt die Kronen in einer Region
     */
    getCrownsInRegion(regionId) {
        const cells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.regions[r][c] === regionId && this.grid[r][c] === CROWNS_CROWN) {
                    cells.push({ r, c });
                }
            }
        }
        return cells;
    }

    /**
     * Setzt den Wert einer Zelle mit Undo-Unterstützung
     */
    setCellValue(r, c, val, isNote = false) {
        if (this.locked[r][c]) return false;

        if (isNote) {
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
        return true;
    }

    /**
     * Schaltet den Wert einer Zelle durch: EMPTY → CROWN → X → EMPTY
     */
    cycleCellValue(r, c) {
        if (this.locked[r][c]) return null;
        const current = this.grid[r][c];
        let next;
        if (current === CROWNS_EMPTY) next = CROWNS_CROWN;
        else if (current === CROWNS_CROWN) next = CROWNS_X;
        else next = CROWNS_EMPTY;
        this.setCellValue(r, c, next);
        return next;
    }

    /**
     * Schaltet Notizen einer Zelle durch
     */
    cycleNoteValue(r, c) {
        if (this.locked[r][c]) return null;

        if (this.grid[r][c] !== CROWNS_EMPTY) {
            this.setCellValue(r, c, CROWNS_EMPTY);
        }

        const cellNotes = this.notes[r][c];
        const prevNotes = new Set(cellNotes);
        const hasCrown = cellNotes.has(CROWNS_CROWN);

        let nextNotes = new Set();
        if (!hasCrown) {
            nextNotes.add(CROWNS_CROWN);
        }
        // Toggle: hat Krone → leer, hat keine → Krone

        this.notes[r][c] = new Set(nextNotes);
        this.undoStack.push({
            type: 'note',
            r, c,
            prevNotes,
            nextNotes: new Set(nextNotes)
        });
        this.redoStack = [];
        return nextNotes;
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

    /**
     * Prüft alle Regeln und gibt Fehlerliste + Konfliktzellen zurück
     */
    validateRules() {
        const errors = [];
        const conflictCells = new Set();

        // 1. Zeilenregel: max. 1 Krone pro Zeile
        for (let r = 0; r < this.size; r++) {
            const crownCols = this.getCrownsInRow(r);
            if (crownCols.length > 1) {
                crownCols.forEach(c => conflictCells.add(`${r},${c}`));
                errors.push({
                    rule: 'row_duplicate',
                    row: r,
                    cols: crownCols,
                    message: `Mehr als eine Krone in Zeile ${r + 1}`
                });
            }
        }

        // 2. Spaltenregel: max. 1 Krone pro Spalte
        for (let c = 0; c < this.size; c++) {
            const crownRows = this.getCrownsInCol(c);
            if (crownRows.length > 1) {
                crownRows.forEach(r => conflictCells.add(`${r},${c}`));
                errors.push({
                    rule: 'col_duplicate',
                    col: c,
                    rows: crownRows,
                    message: `Mehr als eine Krone in Spalte ${c + 1}`
                });
            }
        }

        // 3. Regionregel: max. 1 Krone pro Region
        for (let regionId = 0; regionId < this.size; regionId++) {
            const crownCells = this.getCrownsInRegion(regionId);
            if (crownCells.length > 1) {
                crownCells.forEach(({ r, c }) => conflictCells.add(`${r},${c}`));
                errors.push({
                    rule: 'region_duplicate',
                    regionId,
                    cells: crownCells,
                    message: `Mehr als eine Krone in Farbregion ${regionId + 1}`
                });
            }
        }

        // 4. Berührungsregel: keine 8er-Nachbarn
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== CROWNS_CROWN) continue;
                for (const n of this.getNeighbors8(r, c)) {
                    if (this.grid[n.r][n.c] === CROWNS_CROWN) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${n.r},${n.c}`);
                        errors.push({
                            rule: 'adjacent',
                            cells: [{ r, c }, { r: n.r, c: n.c }],
                            message: `Kronen bei (${r + 1},${c + 1}) und (${n.r + 1},${n.c + 1}) berühren sich`
                        });
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

    /**
     * Findet Fehler im bisherigen Lösungsweg des Spielers
     */
    findMistakes() {
        const sol = this.getSolution();
        const ruleCheck = this.validateRules();

        // 1. Regelverletzungen
        if (!ruleCheck.isValid && ruleCheck.errors.length > 0) {
            const firstErr = ruleCheck.errors[0];
            const conflictArr = Array.from(ruleCheck.conflictCells || []).map(str => {
                const [r, c] = str.split(',').map(Number);
                return { r, c };
            });

            let targetCell = conflictArr.find(pos => !this.locked[pos.r][pos.c]) || conflictArr[0];
            const r = targetCell ? targetCell.r : 0;
            const c = targetCell ? targetCell.c : 0;
            const expectedVal = sol ? sol[r][c] : CROWNS_EMPTY;

            return {
                type: 'error',
                isMistake: true,
                errorType: 'rule_violation',
                strategy: 'Regelverstoß korrigieren',
                title: 'Regelverstoß korrigieren',
                r, c,
                currentVal: this.grid[r][c],
                value: expectedVal,
                expectedVal,
                highlightCells: conflictArr.length > 0 ? conflictArr : [{ r, c }],
                message: `Regelverstoß: ${firstErr.message}. Bitte korrigiere die Krone an Position (${r + 1},${c + 1}).`
            };
        }

        // 2. Vom Spieler gesetzte Kronen, die nicht zur Lösung passen
        if (sol) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const current = this.grid[r][c];
                    if (current === CROWNS_CROWN && sol[r][c] !== CROWNS_CROWN) {
                        return {
                            type: 'error',
                            isMistake: true,
                            errorType: 'solution_mismatch',
                            strategy: 'Falsch platzierte Krone',
                            title: 'Falsch platzierte Krone',
                            r, c,
                            currentVal: current,
                            value: CROWNS_EMPTY,
                            expectedVal: CROWNS_EMPTY,
                            highlightCells: [{ r, c }],
                            message: `Fehler: An Position (${r + 1},${c + 1}) ist fälschlicherweise eine Krone gesetzt. Laut der Logik gehört dort keine Krone hin.`
                        };
                    }
                    if (current === CROWNS_X && sol[r][c] === CROWNS_CROWN) {
                        return {
                            type: 'error',
                            isMistake: true,
                            errorType: 'false_elimination',
                            strategy: 'Falsch gesetztes Kreuz',
                            title: 'Falsch gesetztes Kreuz',
                            r, c,
                            currentVal: current,
                            value: CROWNS_CROWN,
                            expectedVal: CROWNS_CROWN,
                            highlightCells: [{ r, c }],
                            message: `Fehler: An Position (${r + 1},${c + 1}) wurde fälschlicherweise ein Kreuz gesetzt. Hier gehört eine Krone hin.`
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Prüft, ob das Board vollständig und fehlerfrei gelöst ist
     */
    isCompleted() {
        // Genau N Kronen müssen platziert sein
        let crownCount = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === CROWNS_CROWN) crownCount++;
            }
        }
        if (crownCount !== this.size) return false;

        const val = this.validateRules();
        return val.isValid;
    }

    getFilledCount() {
        let count = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === CROWNS_CROWN) count++;
            }
        }
        return count;
    }

    getTotalCells() {
        return this.size;
    }
}
