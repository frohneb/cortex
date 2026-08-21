/**
 * Tango Game Engine
 * Repräsentiert das Spielfeld, Zellwerte, Kantenbedingungen und Validierungsregeln.
 */

export const EMPTY = 0;
export const SUN = 1;   // ☀️
export const MOON = 2;  // 🌙

export const EDGE_NONE = 0;
export const EDGE_EQUAL = 1;     // = (Müssen identisch sein)
export const EDGE_OPPOSITE = 2;  // × (Müssen gegenteilig sein)

export class TangoEngine {
    constructor(size = 6) {
        this.size = size;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        
        // Horizontale Kanten: size x (size - 1)
        this.hEdges = Array(size).fill(0).map(() => Array(size - 1).fill(EDGE_NONE));
        // Vertikale Kanten: (size - 1) x size
        this.vEdges = Array(size - 1).fill(0).map(() => Array(size).fill(EDGE_NONE));
        
        // Notizen (Bleistiftmodus): Set pro Zelle
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));

        // History für Undo / Redo
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Lädt ein Level mit vorgegebenen Zellen und Kanten
     */
    loadPuzzle({ size, initialGrid, hEdges, vEdges }) {
        this.size = size;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];

        this.hEdges = hEdges ? hEdges.map(row => [...row]) : Array(size).fill(0).map(() => Array(size - 1).fill(EDGE_NONE));
        this.vEdges = vEdges ? vEdges.map(row => [...row]) : Array(size - 1).fill(0).map(() => Array(size).fill(EDGE_NONE));

        if (initialGrid) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (initialGrid[r][c] !== EMPTY) {
                        this.grid[r][c] = initialGrid[r][c];
                        this.initialGrid[r][c] = initialGrid[r][c];
                        this.locked[r][c] = true;
                    }
                }
            }
        }
    }

    /**
     * Setzt den Wert einer Zelle mit Undo-Unterstützung
     */
    setCellValue(r, c, val, isNote = false) {
        if (this.locked[r][c]) return false;

        if (isNote) {
            // Notiz umschalten
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
        if (prevVal === val) return false;

        this.undoStack.push({
            type: 'cell',
            r, c,
            prevVal,
            nextVal: val,
            prevNotes: new Set(this.notes[r][c])
        });
        this.redoStack = [];

        this.grid[r][c] = val;
        // Beim Setzen einer festen Zelle Notizen leeren
        if (val !== EMPTY) {
            this.notes[r][c].clear();
        }
        return true;
    }

    /**
     * Schaltet den Wert einer Zelle durch: EMPTY -> SUN -> MOON -> EMPTY
     */
    cycleCellValue(r, c) {
        if (this.locked[r][c]) return null;
        const current = this.grid[r][c];
        let next;
        if (current === EMPTY) next = SUN;
        else if (current === SUN) next = MOON;
        else next = EMPTY;
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

    /**
     * Prüft alle Regeln und gibt eine strukturierte Liste an Fehlern zurück
     */
    validateRules() {
        const errors = [];
        const maxPerLine = this.size / 2;
        const conflictCells = new Set();

        // 1. Regel: Keine drei gleichen Symbole hintereinander
        // Horizontal
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size - 2; c++) {
                const v1 = this.grid[r][c], v2 = this.grid[r][c+1], v3 = this.grid[r][c+2];
                if (v1 !== EMPTY && v1 === v2 && v2 === v3) {
                    conflictCells.add(`${r},${c}`);
                    conflictCells.add(`${r},${c+1}`);
                    conflictCells.add(`${r},${c+2}`);
                    errors.push({
                        rule: 'three_in_a_row',
                        orientation: 'horizontal',
                        row: r,
                        cols: [c, c+1, c+2],
                        symbol: v1,
                        message: `Drei gleiche Symbole hintereinander in Zeile ${r+1}`
                    });
                }
            }
        }

        // Vertikal
        for (let c = 0; c < this.size; c++) {
            for (let r = 0; r < this.size - 2; r++) {
                const v1 = this.grid[r][c], v2 = this.grid[r+1][c], v3 = this.grid[r+2][c];
                if (v1 !== EMPTY && v1 === v2 && v2 === v3) {
                    conflictCells.add(`${r},${c}`);
                    conflictCells.add(`${r+1},${c}`);
                    conflictCells.add(`${r+2},${c}`);
                    errors.push({
                        rule: 'three_in_a_row',
                        orientation: 'vertical',
                        col: c,
                        rows: [r, r+1, r+2],
                        symbol: v1,
                        message: `Drei gleiche Symbole untereinander in Spalte ${c+1}`
                    });
                }
            }
        }

        // 2. Regel: Balance (Maximal N/2 Sonnen und Monde)
        // Zeilen
        for (let r = 0; r < this.size; r++) {
            let suns = 0, moons = 0;
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === SUN) suns++;
                else if (this.grid[r][c] === MOON) moons++;
            }
            if (suns > maxPerLine) {
                for (let c = 0; c < this.size; c++) if (this.grid[r][c] === SUN) conflictCells.add(`${r},${c}`);
                errors.push({
                    rule: 'balance',
                    type: 'row',
                    index: r,
                    symbol: SUN,
                    count: suns,
                    max: maxPerLine,
                    message: `Zu viele Sonnen in Zeile ${r+1} (${suns}/${maxPerLine})`
                });
            }
            if (moons > maxPerLine) {
                for (let c = 0; c < this.size; c++) if (this.grid[r][c] === MOON) conflictCells.add(`${r},${c}`);
                errors.push({
                    rule: 'balance',
                    type: 'row',
                    index: r,
                    symbol: MOON,
                    count: moons,
                    max: maxPerLine,
                    message: `Zu viele Monde in Zeile ${r+1} (${moons}/${maxPerLine})`
                });
            }
        }

        // Spalten
        for (let c = 0; c < this.size; c++) {
            let suns = 0, moons = 0;
            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] === SUN) suns++;
                else if (this.grid[r][c] === MOON) moons++;
            }
            if (suns > maxPerLine) {
                for (let r = 0; r < this.size; r++) if (this.grid[r][c] === SUN) conflictCells.add(`${r},${c}`);
                errors.push({
                    rule: 'balance',
                    type: 'col',
                    index: c,
                    symbol: SUN,
                    count: suns,
                    max: maxPerLine,
                    message: `Zu viele Sonnen in Spalte ${c+1} (${suns}/${maxPerLine})`
                });
            }
            if (moons > maxPerLine) {
                for (let r = 0; r < this.size; r++) if (this.grid[r][c] === MOON) conflictCells.add(`${r},${c}`);
                errors.push({
                    rule: 'balance',
                    type: 'col',
                    index: c,
                    symbol: MOON,
                    count: moons,
                    max: maxPerLine,
                    message: `Zu viele Monde in Spalte ${c+1} (${moons}/${maxPerLine})`
                });
            }
        }

        // 3. Regel: Kantenbedingungen (= und ×)
        // Horizontale Kanten
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size - 1; c++) {
                const edge = this.hEdges[r][c];
                if (edge === EDGE_NONE) continue;
                const v1 = this.grid[r][c], v2 = this.grid[r][c+1];
                if (v1 !== EMPTY && v2 !== EMPTY) {
                    if (edge === EDGE_EQUAL && v1 !== v2) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${r},${c+1}`);
                        errors.push({
                            rule: 'edge_constraint',
                            edgeType: '=',
                            cells: [{r, c}, {r, c: c+1}],
                            message: `Gleichheitszeichen (=) zwischen (${r+1},${c+1}) und (${r+1},${c+2}) verletzt`
                        });
                    } else if (edge === EDGE_OPPOSITE && v1 === v2) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${r},${c+1}`);
                        errors.push({
                            rule: 'edge_constraint',
                            edgeType: '×',
                            cells: [{r, c}, {r, c: c+1}],
                            message: `Gegenteilszeichen (×) zwischen (${r+1},${c+1}) und (${r+1},${c+2}) verletzt`
                        });
                    }
                }
            }
        }

        // Vertikale Kanten
        for (let r = 0; r < this.size - 1; r++) {
            for (let c = 0; c < this.size; c++) {
                const edge = this.vEdges[r][c];
                if (edge === EDGE_NONE) continue;
                const v1 = this.grid[r][c], v2 = this.grid[r+1][c];
                if (v1 !== EMPTY && v2 !== EMPTY) {
                    if (edge === EDGE_EQUAL && v1 !== v2) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${r+1},${c}`);
                        errors.push({
                            rule: 'edge_constraint',
                            edgeType: '=',
                            cells: [{r, c}, {r: r+1, c}],
                            message: `Gleichheitszeichen (=) zwischen (${r+1},${c+1}) und (${r+2},${c+1}) verletzt`
                        });
                    } else if (edge === EDGE_OPPOSITE && v1 === v2) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${r+1},${c}`);
                        errors.push({
                            rule: 'edge_constraint',
                            edgeType: '×',
                            cells: [{r, c}, {r: r+1, c}],
                            message: `Gegenteilszeichen (×) zwischen (${r+1},${c+1}) und (${r+2},${c+1}) verletzt`
                        });
                    }
                }
            }
        }

        // 4. Regel: Keine identischen Zeilen / Spalten (nur wenn voll)
        const rowStrings = [];
        for (let r = 0; r < this.size; r++) {
            const isFull = this.grid[r].every(v => v !== EMPTY);
            if (isFull) {
                const str = this.grid[r].join('');
                rowStrings.push({ r, str });
            }
        }
        for (let i = 0; i < rowStrings.length; i++) {
            for (let j = i + 1; j < rowStrings.length; j++) {
                if (rowStrings[i].str === rowStrings[j].str) {
                    for (let c = 0; c < this.size; c++) {
                        conflictCells.add(`${rowStrings[i].r},${c}`);
                        conflictCells.add(`${rowStrings[j].r},${c}`);
                    }
                    errors.push({
                        rule: 'unique_rows',
                        rows: [rowStrings[i].r, rowStrings[j].r],
                        message: `Zeilen ${rowStrings[i].r + 1} und ${rowStrings[j].r + 1} sind identisch`
                    });
                }
            }
        }

        const colStrings = [];
        for (let c = 0; c < this.size; c++) {
            let isFull = true;
            let str = '';
            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] === EMPTY) {
                    isFull = false;
                    break;
                }
                str += this.grid[r][c];
            }
            if (isFull) {
                colStrings.push({ c, str });
            }
        }
        for (let i = 0; i < colStrings.length; i++) {
            for (let j = i + 1; j < colStrings.length; j++) {
                if (colStrings[i].str === colStrings[j].str) {
                    for (let r = 0; r < this.size; r++) {
                        conflictCells.add(`${r},${colStrings[i].c}`);
                        conflictCells.add(`${r},${colStrings[j].c}`);
                    }
                    errors.push({
                        rule: 'unique_cols',
                        cols: [colStrings[i].c, colStrings[j].c],
                        message: `Spalten ${colStrings[i].c + 1} und ${colStrings[j].c + 1} sind identisch`
                    });
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
     * Prüft, ob das Board vollständig und fehlerfrei gelöst ist
     */
    isCompleted() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === EMPTY) return false;
            }
        }
        const val = this.validateRules();
        return val.isValid;
    }

    getFilledCount() {
        let count = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== EMPTY) count++;
            }
        }
        return count;
    }

    getTotalCells() {
        return this.size * this.size;
    }
}
