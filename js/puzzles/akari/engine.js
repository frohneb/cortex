/**
 * Akari (Light Up) Puzzle Engine
 * Verwaltet den Gitter-Zustand, Wände, Lichtstrahl-Ausbreitung,
 * Regelvalidierung, Undo/Redo und Notizen.
 */

export const AKARI_EMPTY = 0;
export const AKARI_BULB = 1;
export const AKARI_DOT = 2;

export class AkariEngine {
    constructor(size = 7) {
        this.size = size;
        this.rows = size;
        this.cols = size;

        // walls[r][c]: null = weißes Feld, -1 = unnummerierte Wand, 0..4 = nummerierte Wand
        this.walls = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        // grid[r][c]: 0 = Leer, 1 = Lampe 💡, 2 = Punkt •
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(AKARI_EMPTY));
        // locked[r][c]: true für schwarze Wände, false für weiße Felder
        this.locked = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        // notes[r][c]: Set von Notizen/Kandidaten
        this.notes = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => new Set()));

        this.initialGrid = null;
        this.initialWalls = null;
        this.solution = null;

        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Prüft, ob eine Koordinate eine Wand ist
     */
    isWall(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
        return this.walls[r][c] !== null;
    }

    /**
     * Gibt den Wand-Hinweis zurück (0..4, -1 für unnummeriert, oder null)
     */
    getWallClue(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
        return this.walls[r][c];
    }

    /**
     * Gibt alle 4 orthogonalen Nachbarn einer Zelle zurück
     */
    getOrthogonalNeighbors(r, c) {
        const neighbors = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    /**
     * Gibt alle weißen Zellen in der Sichtlinie (Sterne-Kreuz) einer Zelle zurück
     */
    getRayCells(r, c) {
        if (this.isWall(r, c)) return [];
        const cells = [{ r, c }];

        // Oben
        for (let rr = r - 1; rr >= 0; rr--) {
            if (this.isWall(rr, c)) break;
            cells.push({ r: rr, c });
        }
        // Unten
        for (let rr = r + 1; rr < this.rows; rr++) {
            if (this.isWall(rr, c)) break;
            cells.push({ r: rr, c });
        }
        // Links
        for (let cc = c - 1; cc >= 0; cc--) {
            if (this.isWall(r, cc)) break;
            cells.push({ r, c: cc });
        }
        // Rechts
        for (let cc = c + 1; cc < this.cols; cc++) {
            if (this.isWall(r, cc)) break;
            cells.push({ r, c: cc });
        }

        return cells;
    }

    /**
     * Berechnet die Ausleuchtungs-Matrix (wie viele Lampen jede Zelle beleuchten)
     * Gibt ein 2D-Array [r][c] zurück.
     */
    computeIllumination() {
        const illumination = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === AKARI_BULB && !this.isWall(r, c)) {
                    // Lampe beleuchtet sich selbst
                    illumination[r][c]++;

                    // Strahlen in 4 Richtungen aussenden
                    // Oben
                    for (let rr = r - 1; rr >= 0; rr--) {
                        if (this.isWall(rr, c)) break;
                        illumination[rr][c]++;
                    }
                    // Unten
                    for (let rr = r + 1; rr < this.rows; rr++) {
                        if (this.isWall(rr, c)) break;
                        illumination[rr][c]++;
                    }
                    // Links
                    for (let cc = c - 1; cc >= 0; cc--) {
                        if (this.isWall(r, cc)) break;
                        illumination[r][cc]++;
                    }
                    // Rechts
                    for (let cc = c + 1; cc < this.cols; cc++) {
                        if (this.isWall(r, cc)) break;
                        illumination[r][cc]++;
                    }
                }
            }
        }

        return illumination;
    }

    /**
     * Setzt den Wert einer Zelle (0 = Leer, 1 = Lampe, 2 = Punkt)
     */
    setCellValue(r, c, val, isNote = false) {
        if (this.isWall(r, c) || this.locked[r][c]) return false;

        const oldVal = this.grid[r][c];
        const oldNotes = new Set(this.notes[r][c]);

        if (isNote) {
            if (val === AKARI_DOT) {
                if (this.notes[r][c].has(AKARI_DOT)) {
                    this.notes[r][c].delete(AKARI_DOT);
                } else {
                    this.notes[r][c].add(AKARI_DOT);
                }
            } else if (val === AKARI_EMPTY) {
                this.notes[r][c].clear();
            }
            this.pushUndo({ r, c, oldVal, newVal: oldVal, oldNotes, newNotes: new Set(this.notes[r][c]) });
            return true;
        }

        if (oldVal === val) return true;

        this.pushUndo({ r, c, oldVal, newVal: val, oldNotes, newNotes: new Set() });
        this.grid[r][c] = val;
        this.notes[r][c].clear();
        return true;
    }

    /**
     * Schaltet den Wert einer Zelle zyklisch durch: Leer -> Lampe -> Punkt -> Leer
     */
    cycleCellValue(r, c) {
        if (this.isWall(r, c) || this.locked[r][c]) return this.grid[r][c];

        const current = this.grid[r][c];
        let nextVal = AKARI_EMPTY;
        if (current === AKARI_EMPTY) {
            nextVal = AKARI_BULB;
        } else if (current === AKARI_BULB) {
            nextVal = AKARI_DOT;
        } else {
            nextVal = AKARI_EMPTY;
        }

        this.setCellValue(r, c, nextVal);
        return nextVal;
    }

    /**
     * Schaltet den Notizen-Modus für eine Zelle um (Punkt setzen/entfernen)
     */
    cycleNoteValue(r, c) {
        if (this.isWall(r, c) || this.locked[r][c]) return;
        this.setCellValue(r, c, AKARI_DOT, true);
    }

    pushUndo(action) {
        this.undoStack.push(action);
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        const action = this.undoStack.pop();
        this.grid[action.r][action.c] = action.oldVal;
        this.notes[action.r][action.c] = new Set(action.oldNotes);
        this.redoStack.push(action);
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        const action = this.redoStack.pop();
        this.grid[action.r][action.c] = action.newVal;
        this.notes[action.r][action.c] = new Set(action.newNotes);
        this.undoStack.push(action);
        return true;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Lädt ein Puzzle
     * @param {Object} puzzleData - { size, walls: Array<Array<number|null>>, grid?: Array<Array<number>>, solution?: Array<Array<number>> }
     */
    loadPuzzle(puzzleData) {
        this.size = puzzleData.size || (puzzleData.walls ? puzzleData.walls.length : 7);
        this.rows = this.size;
        this.cols = this.size;

        this.walls = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(AKARI_EMPTY));
        this.locked = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.notes = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => new Set()));

        if (puzzleData.walls) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const w = puzzleData.walls[r][c];
                    if (w !== null && w !== undefined && w !== '') {
                        this.walls[r][c] = typeof w === 'number' ? w : parseInt(w, 10);
                        this.locked[r][c] = true;
                    } else {
                        this.walls[r][c] = null;
                        this.locked[r][c] = false;
                    }
                }
            }
        }

        if (puzzleData.initialGrid) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (!this.isWall(r, c) && puzzleData.initialGrid[r][c]) {
                        this.grid[r][c] = puzzleData.initialGrid[r][c];
                    }
                }
            }
        }

        this.initialWalls = JSON.parse(JSON.stringify(this.walls));
        this.initialGrid = JSON.parse(JSON.stringify(this.grid));
        this.solution = puzzleData.solution ? JSON.parse(JSON.stringify(puzzleData.solution)) : null;

        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Prüft auf Fehler (Kollisionen, überfüllte Wände oder Abweichungen von der Lösung)
     */
    findMistakes() {
        const val = this.validateRules();
        if (val.conflicts.size > 0) {
            const first = Array.from(val.conflicts)[0].split(',').map(Number);
            return {
                type: 'error_conflict',
                strategy: 'Fehler: Kollidierende Lampen',
                title: 'Fehler: Kollidierende Lampen',
                r: first[0],
                c: first[1],
                value: AKARI_EMPTY,
                expectedVal: AKARI_EMPTY,
                highlightCells: [{ r: first[0], c: first[1] }],
                message: `Zwei Lampen stehen in direkter Sichtlinie zueinander. Entferne die fehlerhafte Lampe bei Zeile ${first[0] + 1}, Spalte ${first[1] + 1}.`,
                description: `Zwei Lampen stehen in direkter Sichtlinie zueinander. Entferne die fehlerhafte Lampe bei Zeile ${first[0] + 1}, Spalte ${first[1] + 1}.`
            };
        }
        if (val.wallErrors.size > 0) {
            const first = Array.from(val.wallErrors)[0].split(',').map(Number);
            const r = first[0];
            const c = first[1];
            const clue = this.walls[r][c];
            return {
                type: 'error_wall_overflow',
                strategy: 'Fehler: Wand-Bedingung verletzt',
                title: 'Fehler: Wand-Bedingung verletzt',
                r,
                c,
                value: AKARI_EMPTY,
                expectedVal: AKARI_EMPTY,
                highlightCells: [{ r, c }],
                message: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} mit Zahl ${clue} hat zu viele oder unzulässige Lampen in ihrer Nachbarschaft.`,
                description: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} mit Zahl ${clue} hat zu viele oder unzulässige Lampen in ihrer Nachbarschaft.`
            };
        }
        if (this.solution) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (!this.isWall(r, c)) {
                        const playerVal = this.grid[r][c];
                        const solVal = this.solution[r][c] === 1 ? AKARI_BULB : AKARI_DOT;
                        if (playerVal === AKARI_BULB && solVal !== AKARI_BULB) {
                            return {
                                type: 'solution_mismatch',
                                strategy: 'Fehlerhafte Lampe',
                                title: 'Fehlerhafte Lampe',
                                r, c,
                                value: AKARI_EMPTY,
                                expectedVal: AKARI_EMPTY,
                                highlightCells: [{ r, c }],
                                message: `Auf Feld (${r + 1}, ${c + 1}) darf laut Spiellogik keine Lampe stehen. Entferne die Lampe.`,
                                description: `Auf Feld (${r + 1}, ${c + 1}) darf laut Spiellogik keine Lampe stehen. Entferne die Lampe.`
                            };
                        } else if (playerVal === AKARI_DOT && solVal === AKARI_BULB) {
                            return {
                                type: 'solution_mismatch',
                                strategy: 'Fehlerhafter Ausschluss',
                                title: 'Fehlerhafter Ausschluss',
                                r, c,
                                value: AKARI_BULB,
                                expectedVal: AKARI_BULB,
                                highlightCells: [{ r, c }],
                                message: `Auf Feld (${r + 1}, ${c + 1}) wurde fälschlicherweise ein Ausschluss (•) gesetzt, obwohl hier eine Lampe benötigt wird.`,
                                description: `Auf Feld (${r + 1}, ${c + 1}) wurde fälschlicherweise ein Ausschluss (•) gesetzt, obwohl hier eine Lampe benötigt wird.`
                            };
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Validiert alle Regeln und gibt Status-Informationen zurück
     */
    validateRules() {
        const errors = [];
        const conflicts = new Set(); // Koordinaten "r,c" von kollidierenden Lampen
        const wallErrors = new Set(); // Koordinaten "r,c" von verletzten Wänden
        const wallSatisfied = new Set(); // Koordinaten "r,c" von voll erfüllten Wänden

        const illumination = this.computeIllumination();

        // 1. Lampen-Kollisionen (zwei Lampen im selben Strahlengang)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === AKARI_BULB && !this.isWall(r, c)) {
                    if (illumination[r][c] > 1) {
                        conflicts.add(`${r},${c}`);
                        errors.push(`Lampe bei (${r + 1}, ${c + 1}) strahlt eine andere Lampe an.`);
                    }
                }
            }
        }

        // 2. Wand-Nachbarschaftszahlen überprüfen
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const clue = this.walls[r][c];
                if (clue !== null && clue >= 0) {
                    const neighbors = this.getOrthogonalNeighbors(r, c);
                    let bulbCount = 0;
                    let emptyCount = 0;

                    for (const n of neighbors) {
                        if (!this.isWall(n.r, n.c)) {
                            if (this.grid[n.r][n.c] === AKARI_BULB) {
                                bulbCount++;
                            } else if (this.grid[n.r][n.c] === AKARI_EMPTY) {
                                emptyCount++;
                            }
                        }
                    }

                    if (bulbCount > clue) {
                        wallErrors.add(`${r},${c}`);
                        errors.push(`Wand (${r + 1}, ${c + 1}) mit Zahl ${clue} hat zu viele Lampen (${bulbCount}).`);
                    } else if (bulbCount + emptyCount < clue) {
                        wallErrors.add(`${r},${c}`);
                        errors.push(`Wand (${r + 1}, ${c + 1}) mit Zahl ${clue} kann nicht mehr genug Lampen erhalten.`);
                    } else if (bulbCount === clue) {
                        wallSatisfied.add(`${r},${c}`);
                    }
                }
            }
        }

        // 3. Ausleuchtung aller weißen Zellen prüfen
        let allWhiteLit = true;
        let whiteCount = 0;
        let litCount = 0;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.isWall(r, c)) {
                    whiteCount++;
                    if (illumination[r][c] > 0) {
                        litCount++;
                    } else {
                        allWhiteLit = false;
                    }
                }
            }
        }

        // 4. Prüfen, ob alle nummerierten Wände exakt erfüllt sind
        let allWallsSatisfied = true;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const clue = this.walls[r][c];
                if (clue !== null && clue >= 0) {
                    if (!wallSatisfied.has(`${r},${c}`)) {
                        allWallsSatisfied = false;
                        break;
                    }
                }
            }
            if (!allWallsSatisfied) break;
        }

        const isComplete = allWhiteLit && conflicts.size === 0 && wallErrors.size === 0 && allWallsSatisfied;
        const isValid = conflicts.size === 0 && wallErrors.size === 0;

        return {
            isValid,
            isComplete,
            errors,
            conflicts,
            wallErrors,
            wallSatisfied,
            illumination,
            whiteCount,
            litCount
        };
    }

    /**
     * Prüft, ob das Akari-Rätsel vollständig und fehlerfrei gelöst ist
     */
    isCompleted() {
        return this.validateRules().isComplete;
    }

    /**
     * Gibt die Anzahl der gesetzten Lampen/Marker zurück
     */
    getFilledCount() {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.isWall(r, c) && this.grid[r][c] !== AKARI_EMPTY) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Gibt die Lösung des Akari-Rätsels zurück
     */
    getSolution() {
        if (this.solution) return this.solution;
        return null;
    }

    /**
     * Erstellt eine tiefe Kopie der Engine
     */
    clone() {
        const cloned = new AkariEngine(this.size);
        cloned.walls = JSON.parse(JSON.stringify(this.walls));
        cloned.grid = JSON.parse(JSON.stringify(this.grid));
        cloned.locked = JSON.parse(JSON.stringify(this.locked));
        cloned.notes = this.notes.map(row => row.map(cellSet => new Set(cellSet)));
        cloned.initialGrid = this.initialGrid ? JSON.parse(JSON.stringify(this.initialGrid)) : null;
        cloned.initialWalls = this.initialWalls ? JSON.parse(JSON.stringify(this.initialWalls)) : null;
        cloned.solution = this.solution ? JSON.parse(JSON.stringify(this.solution)) : null;
        return cloned;
    }
}
