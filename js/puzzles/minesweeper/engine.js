/**
 * Minesweeper Engine
 * Repräsentiert das Minenfeld, Zellzustände (verdeckt, aufgedeckt, Flagge, Explosion),
 * Nachbarzahlen-Berechnung, Flood-Fill und Sieg-/Niederlagen-Validierung.
 */

export const CELL_HIDDEN = 0;
export const CELL_REVEALED = 1;
export const CELL_FLAGGED = 2;
export const CELL_EXPLODED = 3;

export class MinesweeperEngine {
    constructor(rows = 8, cols = 8, mineCount = 10) {
        if (typeof rows === 'object' && rows !== null) {
            // Falls Optionen-Objekt übergeben wurde
            const opts = rows;
            this.rows = opts.rows || opts.size || 8;
            this.cols = opts.cols || opts.size || this.rows;
            this.mineCount = opts.mineCount || 10;
        } else {
            this.rows = rows;
            this.cols = cols || rows;
            this.mineCount = mineCount;
        }
        this.size = Math.max(this.rows, this.cols);

        this.grid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(CELL_HIDDEN));
        this.initialGrid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(CELL_HIDDEN));
        this.locked = Array(this.rows).fill(0).map(() => Array(this.cols).fill(false));
        this.notes = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0).map(() => new Set()));

        this.mines = Array(this.rows).fill(0).map(() => Array(this.cols).fill(false));
        this.adjacency = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
        this.solution = null;

        this.status = 'playing'; // 'playing' | 'won' | 'lost'
        this.revealedCount = 0;
        this.flagCount = 0;

        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Initialisiert oder lädt ein Puzzle
     */
    loadPuzzle({ rows, cols, size, mineCount, mines, initialGrid, solution, revealedCells }) {
        this.rows = rows || size || (mines ? mines.length : 8);
        this.cols = cols || size || (mines && mines[0] ? mines[0].length : this.rows);
        this.size = Math.max(this.rows, this.cols);

        this.grid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(CELL_HIDDEN));
        this.initialGrid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(CELL_HIDDEN));
        this.locked = Array(this.rows).fill(0).map(() => Array(this.cols).fill(false));
        this.notes = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];
        this.status = 'playing';
        this.revealedCount = 0;
        this.flagCount = 0;

        // Minenfeld setzen
        if (mines && Array.isArray(mines)) {
            this.mines = mines.map(row => [...row]);
        } else if (solution && Array.isArray(solution)) {
            this.mines = solution.map(row => row.map(v => (v === 1 || v === true || v === 'M')));
        } else {
            this.mines = Array(this.rows).fill(0).map(() => Array(this.cols).fill(false));
        }

        // Zähle Minen
        this.mineCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.mines[r][c]) this.mineCount++;
            }
        }
        if (mineCount !== undefined) this.mineCount = mineCount;

        // Nachbar-Minen (Adjacency) vorberechnen
        this.calculateAdjacency();

        // Lösung bereitstellen
        this.solution = this.mines.map(row => row.map(isMine => (isMine ? 1 : 0)));

        // Vorgegebene initial aufgedeckte Zellen (z.B. im Tutorial)
        if (initialGrid) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const val = initialGrid[r][c];
                    if (val === CELL_REVEALED) {
                        this.grid[r][c] = CELL_REVEALED;
                        this.initialGrid[r][c] = CELL_REVEALED;
                        this.locked[r][c] = true;
                        this.revealedCount++;
                    } else if (val === CELL_FLAGGED) {
                        this.grid[r][c] = CELL_FLAGGED;
                        this.initialGrid[r][c] = CELL_FLAGGED;
                        this.flagCount++;
                    }
                }
            }
        }

        if (revealedCells && Array.isArray(revealedCells)) {
            for (const cell of revealedCells) {
                const { r, c } = cell;
                if (this.isValid(r, c) && this.grid[r][c] === CELL_HIDDEN) {
                    this.grid[r][c] = CELL_REVEALED;
                    this.initialGrid[r][c] = CELL_REVEALED;
                    this.locked[r][c] = true;
                    this.revealedCount++;
                }
            }
        }
    }

    /**
     * Berechnet für alle Zellen die Anzahl benachbarter Minen (0–8)
     */
    calculateAdjacency() {
        this.adjacency = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.mines[r][c]) {
                    this.adjacency[r][c] = -1; // Mine
                    continue;
                }
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr;
                        const nc = c + dc;
                        if (this.isValid(nr, nc) && this.mines[nr][nc]) {
                            count++;
                        }
                    }
                }
                this.adjacency[r][c] = count;
            }
        }
    }

    isValid(r, c) {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }

    /**
     * Deckt eine Zelle auf (Tap-Aktion)
     */
    reveal(r, c) {
        if (!this.isValid(r, c)) return null;
        if (this.status !== 'playing') return null;
        if (this.locked[r][c]) return null;
        if (this.grid[r][c] === CELL_FLAGGED) return null; // Flaggen schützen vor Aufdecken
        if (this.grid[r][c] === CELL_REVEALED) return null;

        // Treffer auf Mine! -> Niederlage
        if (this.mines[r][c]) {
            this.grid[r][c] = CELL_EXPLODED;
            this.status = 'lost';
            this.undoStack.push({
                type: 'defeat',
                r,
                c,
                previousGrid: this.grid.map(row => [...row])
            });
            this.redoStack = [];
            return {
                result: 'defeat',
                r,
                c,
                revealedCells: [{ r, c }]
            };
        }

        // Sichere Zelle -> Aufdecken mit Flood-Fill bei 0
        const revealed = [];
        const queue = [{ r, c }];
        const visited = new Set();
        visited.add(`${r},${c}`);

        const prevGrid = this.grid.map(row => [...row]);

        while (queue.length > 0) {
            const curr = queue.shift();
            const cr = curr.r;
            const cc = curr.c;

            if (this.grid[cr][cc] === CELL_HIDDEN) {
                this.grid[cr][cc] = CELL_REVEALED;
                this.revealedCount++;
                revealed.push({ r: cr, c: cc, count: this.adjacency[cr][cc] });
            }

            // Wenn 0 Nachbar-Minen: Automatisch alle Nachbarn kaskadierend aufdecken
            if (this.adjacency[cr][cc] === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = cr + dr;
                        const nc = cc + dc;
                        const key = `${nr},${nc}`;
                        if (this.isValid(nr, nc) && !visited.has(key)) {
                            visited.add(key);
                            if (this.grid[nr][nc] === CELL_HIDDEN && !this.mines[nr][nc]) {
                                queue.push({ r: nr, c: nc });
                            }
                        }
                    }
                }
            }
        }

        this.undoStack.push({
            type: 'reveal',
            r,
            c,
            revealedCells: revealed,
            prevGrid
        });
        this.redoStack = [];

        // Siegbedingung prüfen: Alle sicheren Zellen aufgedeckt
        const totalCells = this.rows * this.cols;
        const totalSafeCells = totalCells - this.mineCount;
        const isWon = this.revealedCount >= totalSafeCells;

        if (isWon) {
            this.status = 'won';
        }

        return {
            result: isWon ? 'victory' : 'safe',
            r,
            c,
            revealedCells: revealed
        };
    }

    /**
     * Schaltet Flagge auf verdeckter Zelle um (Long-Press Aktion)
     */
    toggleFlag(r, c) {
        if (!this.isValid(r, c)) return null;
        if (this.status !== 'playing') return null;
        if (this.locked[r][c]) return null;
        if (this.grid[r][c] === CELL_REVEALED) return null;

        const prevVal = this.grid[r][c];
        let newVal = CELL_HIDDEN;

        if (prevVal === CELL_HIDDEN) {
            newVal = CELL_FLAGGED;
            this.flagCount++;
        } else if (prevVal === CELL_FLAGGED) {
            newVal = CELL_HIDDEN;
            this.flagCount--;
        }

        this.grid[r][c] = newVal;

        this.undoStack.push({
            type: 'flag',
            r,
            c,
            prevVal,
            newVal
        });
        this.redoStack = [];

        return { r, c, isFlagged: newVal === CELL_FLAGGED };
    }

    /**
     * Kompatibilität mit Cycle-Aufruf der App-Shell
     */
    cycleCellValue(r, c) {
        if (!this.isValid(r, c) || this.locked[r][c]) return 0;
        if (this.grid[r][c] === CELL_REVEALED) return 1;

        // Wenn Zelle verdeckt ist: Aufdecken
        const res = this.reveal(r, c);
        if (res) {
            return this.grid[r][c];
        }
        return this.grid[r][c];
    }

    /**
     * Setzt einen Zellwert direkt (z.B. für Hints oder NoteMode)
     */
    setCellValue(r, c, val, isNote = false) {
        if (!this.isValid(r, c) || this.locked[r][c]) return;

        if (isNote) {
            // Note toggeln
            if (this.notes[r][c].has(val)) {
                this.notes[r][c].delete(val);
            } else {
                this.notes[r][c].add(val);
            }
            return;
        }

        if (val === CELL_FLAGGED) {
            if (this.grid[r][c] === CELL_HIDDEN) {
                this.toggleFlag(r, c);
            }
        } else if (val === CELL_REVEALED) {
            this.reveal(r, c);
        } else if (val === CELL_HIDDEN) {
            if (this.grid[r][c] === CELL_FLAGGED) {
                this.toggleFlag(r, c);
            }
        }
    }

    /**
     * Schaltet Notiz-Zustand um
     */
    cycleNoteValue(r, c) {
        if (!this.isValid(r, c) || this.locked[r][c]) return;
        this.toggleFlag(r, c);
    }

    /**
     * Prüft, ob das Puzzle erfolgreich gelöst ist
     */
    isCompleted() {
        if (this.status === 'lost') return false;
        const totalSafeCells = (this.rows * this.cols) - this.mineCount;
        return this.revealedCount >= totalSafeCells;
    }

    /**
     * Gibt Fortschritt zurück
     */
    getProgress() {
        const totalSafe = (this.rows * this.cols) - this.mineCount;
        return {
            totalMines: this.mineCount,
            flagCount: this.flagCount,
            revealedCount: this.revealedCount,
            totalSafe,
            remainingSafe: Math.max(0, totalSafe - this.revealedCount),
            status: this.status
        };
    }

    /**
     * Validierung für Auto-Check
     */
    validateRules() {
        const conflictCells = new Set();
        // Markiere offensichtlich falsche Flaggen, falls Zahl überschritten
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === CELL_REVEALED) {
                    const required = this.adjacency[r][c];
                    let flags = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (this.isValid(nr, nc) && this.grid[nr][nc] === CELL_FLAGGED) {
                                flags++;
                            }
                        }
                    }
                    if (flags > required) {
                        conflictCells.add(`${r},${c}`);
                    }
                }
            }
        }
        return { conflictCells };
    }

    /**
     * Findet fehlerhaft gesetzte Flaggen (für Auto-Check / Fehlererkennung)
     */
    findMistakes() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === CELL_FLAGGED && !this.mines[r][c]) {
                    return {
                        strategy: 'Fehlerhafte Markierung',
                        title: 'Falsche Flagge',
                        message: `Hier bei Zeile ${r + 1}, Spalte ${c + 1} befindet sich keine Mine. Die Flagge kann entfernt werden.`,
                        r,
                        c,
                        value: CELL_HIDDEN
                    };
                }
            }
        }
        return null;
    }

    /**
     * Macht den letzten Spielzug rückgängig
     */
    undo() {
        if (this.undoStack.length === 0) return false;
        const action = this.undoStack.pop();
        this.redoStack.push(action);

        if (action.type === 'reveal') {
            this.grid = action.prevGrid.map(row => [...row]);
            this.recalculateCounts();
            this.status = 'playing';
        } else if (action.type === 'flag') {
            this.grid[action.r][action.c] = action.prevVal;
            this.recalculateCounts();
        } else if (action.type === 'defeat') {
            this.grid = action.previousGrid.map(row => [...row]);
            this.recalculateCounts();
            this.status = 'playing';
        }

        return true;
    }

    /**
     * Wiederholt den letzten rückgängig gemachten Zug
     */
    redo() {
        if (this.redoStack.length === 0) return false;
        const action = this.redoStack.pop();
        this.undoStack.push(action);

        if (action.type === 'reveal') {
            this.reveal(action.r, action.c);
        } else if (action.type === 'flag') {
            this.grid[action.r][action.c] = action.newVal;
            this.recalculateCounts();
        } else if (action.type === 'defeat') {
            this.grid[action.r][action.c] = CELL_EXPLODED;
            this.status = 'lost';
        }

        return true;
    }

    recalculateCounts() {
        this.revealedCount = 0;
        this.flagCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === CELL_REVEALED) this.revealedCount++;
                if (this.grid[r][c] === CELL_FLAGGED) this.flagCount++;
            }
        }
    }

    restart() {
        this.grid = this.initialGrid.map(row => [...row]);
        this.notes = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];
        this.status = 'playing';
        this.recalculateCounts();
    }

    getSolution() {
        return this.solution;
    }
}
