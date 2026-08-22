/**
 * Tango Combined Monolithic Bundle
 * 100% kompatibel mit allen mobilen WebViews, iOS Safari und Android Chrome
 */
(function() {
  'use strict';

// === Source: js\core\engine.js ===
/**
 * Tango Game Engine
 * Repräsentiert das Spielfeld, Zellwerte, Kantenbedingungen und Validierungsregeln.
 */

const EMPTY = 0;
const SUN = 1;   // ☀️
const MOON = 2;  // 🌙

const EDGE_NONE = 0;
const EDGE_EQUAL = 1;     // = (Müssen identisch sein)
const EDGE_OPPOSITE = 2;  // × (Müssen gegenteilig sein)

class TangoEngine {
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
    loadPuzzle({ size, initialGrid, hEdges, vEdges, solution }) {
        this.size = size;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];
        this.solution = solution ? solution.map(row => [...row]) : null;

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
     * Gibt die Lösung des aktuellen Puzzles zurück oder berechnet sie
     */
    getSolution() {
        if (this.solution) return this.solution;
        if (typeof TangoSolver !== 'undefined' && TangoSolver.solve) {
            const sol = TangoSolver.solve(this, 1);
            if (sol && sol.length > 0) {
                this.solution = sol[0].map(row => [...row]);
                return this.solution;
            }
        }
        return null;
    }

    /**
     * Findet Fehler im bisherigen Lösungsweg des Spielers:
     * 1. Regelverletzungen (z. B. 3er-Reihe, Kantenkonflikt, Balance-Überschreitung)
     * 2. Abweichungen von der echten Lösung (grid[r][c] !== solution[r][c])
     */
    findMistakes() {
        const sol = this.getSolution();
        const ruleCheck = this.validateRules();

        // 1. Priorität: Direkte Regelverletzungen
        if (!ruleCheck.isValid && ruleCheck.errors.length > 0) {
            const firstErr = ruleCheck.errors[0];
            const conflictArr = Array.from(ruleCheck.conflictCells || []).map(str => {
                const [r, c] = str.split(',').map(Number);
                return { r, c };
            });

            let targetCell = conflictArr.find(pos => !this.locked[pos.r][pos.c]) || conflictArr[0];
            if (!targetCell && firstErr.cells && firstErr.cells.length > 0) {
                targetCell = firstErr.cells.find(pos => !this.locked[pos.r][pos.c]) || firstErr.cells[0];
            }
            if (!targetCell && firstErr.row !== undefined && firstErr.cols) {
                targetCell = { r: firstErr.row, c: firstErr.cols.find(c => !this.locked[firstErr.row][c]) ?? firstErr.cols[0] };
            }
            if (!targetCell && firstErr.col !== undefined && firstErr.rows) {
                targetCell = { r: firstErr.rows.find(r => !this.locked[r][firstErr.col]) ?? firstErr.rows[0], c: firstErr.col };
            }

            const r = targetCell ? targetCell.r : 0;
            const c = targetCell ? targetCell.c : 0;
            const expectedVal = sol ? sol[r][c] : (this.grid[r][c] === SUN ? MOON : SUN);

            return {
                type: 'rule_violation',
                r, c,
                currentVal: this.grid[r][c],
                expectedVal,
                highlightCells: conflictArr.length > 0 ? conflictArr : [{ r, c }],
                message: `Regelverstoß: ${firstErr.message}. Bitte korrigiere oder entferne das Symbol an Position (${r + 1},${c + 1}).`
            };
        }

        // 2. Priorität: Vom Spieler gesetzte Felder, die nicht zur Gesamtlösung passen
        if (sol) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const current = this.grid[r][c];
                    if (current !== EMPTY && !this.locked[r][c] && current !== sol[r][c]) {
                        const wrongName = current === SUN ? 'Sonne' : 'Mond';
                        const correctName = sol[r][c] === SUN ? 'Sonne' : 'Mond';
                        return {
                            type: 'solution_mismatch',
                            r, c,
                            currentVal: current,
                            expectedVal: sol[r][c],
                            highlightCells: [{ r, c }],
                            message: `Fehler im Lösungsweg: An Position (${r + 1},${c + 1}) wurde fälschlicherweise ein ${wrongName} gesetzt. Laut der Logik und Abhängigkeiten gehört dort ein ${correctName} hin.`
                        };
                    }
                }
            }
        }

        return null;
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
        const prevNotes = new Set(this.notes[r][c]);

        // Keine Änderung und keine Notizen zu löschen -> abbrechen
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
        // Im normalen Spielmodus Notizen der Zelle immer leeren
        this.notes[r][c].clear();
        return true;
    }

    /**
     * Schaltet Notizen einer Zelle durch:
     * Keine Notiz -> ☀️ (Sonne) -> 🌙 (Mond) -> ☀️🌙 (Beide) -> Leer (Löschen)
     */
    cycleNoteValue(r, c) {
        if (this.locked[r][c]) return null;

        // Falls ein fester Wert vorhanden war, diesen leeren
        if (this.grid[r][c] !== EMPTY) {
            this.setCellValue(r, c, EMPTY);
        }

        const cellNotes = this.notes[r][c];
        const prevNotes = new Set(cellNotes);
        const hasSun = cellNotes.has(SUN);
        const hasMoon = cellNotes.has(MOON);

        let nextNotes = new Set();
        if (!hasSun && !hasMoon) {
            nextNotes.add(SUN);
        } else if (hasSun && !hasMoon) {
            nextNotes.add(MOON);
        } else if (!hasSun && hasMoon) {
            nextNotes.add(SUN);
            nextNotes.add(MOON);
        } else {
            // Beide aktiv -> Löschen (leere Notizen)
            nextNotes = new Set();
        }

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

// === Source: js\core\solver.js ===
/**
 * Tango Solver & Hint Engine
 * Findet logische Züge mit verständlichen deutschen Erklärungen
 * und validiert die Eindeutigkeit von Rätseln via Backtracking.
 */


class TangoSolver {
    /**
     * Sucht den nächsten logisch zwingenden Schritt und formuliert einen Hinweistext
     */
    static findLogicalHint(engine) {
        const size = engine.size;
        const maxPerLine = size / 2;
        const grid = engine.grid;

        // 1. Logik-Schritt: Zwei gleiche Symbole nebeneinander -> Kanten müssen das Gegenteil sein
        // Horizontal: [S, S, _] -> [S, S, M] oder [_, S, S] -> [M, S, S]
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                const v = grid[r][c];
                if (v !== EMPTY && v === grid[r][c+1]) {
                    const opposite = v === SUN ? MOON : SUN;
                    const symName = v === SUN ? 'Sonnen' : 'Monde';
                    const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                    // Links daneben
                    if (c > 0 && grid[r][c-1] === EMPTY) {
                        return {
                            type: 'avoid_three',
                            r, c: c - 1,
                            value: opposite,
                            highlightCells: [{r, c: c-1}, {r, c}, {r, c: c+1}],
                            message: `In Zeile ${r+1} stehen zwei ${symName} nebeneinander. Um eine Dreierreihe zu verhindern, muss links davon ein ${oppName} stehen.`
                        };
                    }
                    // Rechts daneben
                    if (c + 2 < size && grid[r][c+2] === EMPTY) {
                        return {
                            type: 'avoid_three',
                            r, c: c + 2,
                            value: opposite,
                            highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                            message: `In Zeile ${r+1} stehen zwei ${symName} nebeneinander. Um eine Dreierreihe zu verhindern, muss rechts davon ein ${oppName} stehen.`
                        };
                    }
                }
            }
        }

        // Vertikal: [S, S, _]^T
        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 1; r++) {
                const v = grid[r][c];
                if (v !== EMPTY && v === grid[r+1][c]) {
                    const opposite = v === SUN ? MOON : SUN;
                    const symName = v === SUN ? 'Sonnen' : 'Monde';
                    const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                    // Oben drüber
                    if (r > 0 && grid[r-1][c] === EMPTY) {
                        return {
                            type: 'avoid_three',
                            r: r - 1, c,
                            value: opposite,
                            highlightCells: [{r: r-1, c}, {r, c}, {r: r+1, c}],
                            message: `In Spalte ${c+1} stehen zwei ${symName} untereinander. Um eine Dreierreihe zu verhindern, muss darüber ein ${oppName} stehen.`
                        };
                    }
                    // Unten drunter
                    if (r + 2 < size && grid[r+2][c] === EMPTY) {
                        return {
                            type: 'avoid_three',
                            r: r + 2, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                            message: `In Spalte ${c+1} stehen zwei ${symName} untereinander. Um eine Dreierreihe zu verhindern, muss darunter ein ${oppName} stehen.`
                        };
                    }
                }
            }
        }

        // 2. Logik-Schritt: Lücke zwischen zwei gleichen Symbolen (S, _, S) -> Mitte muss Gegenteil sein
        // Horizontal
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 2; c++) {
                const v1 = grid[r][c], v2 = grid[r][c+1], v3 = grid[r][c+2];
                if (v1 !== EMPTY && v1 === v3 && v2 === EMPTY) {
                    const opposite = v1 === SUN ? MOON : SUN;
                    const symName = v1 === SUN ? 'Sonnen' : 'Monde';
                    const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                    return {
                        type: 'sandwich',
                        r, c: c + 1,
                        value: opposite,
                        highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                        message: `In Zeile ${r+1} umschließen zwei ${symName} ein leeres Feld. Um drei gleiche Symbole zu vermeiden, muss in die Mitte ein ${oppName}.`
                    };
                }
            }
        }

        // Vertikal
        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 2; r++) {
                const v1 = grid[r][c], v2 = grid[r+1][c], v3 = grid[r+2][c];
                if (v1 !== EMPTY && v1 === v3 && v2 === EMPTY) {
                    const opposite = v1 === SUN ? MOON : SUN;
                    const symName = v1 === SUN ? 'Sonnen' : 'Monde';
                    const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                    return {
                        type: 'sandwich',
                        r: r + 1, c,
                        value: opposite,
                        highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                        message: `In Spalte ${c+1} umschließen zwei ${symName} ein leeres Feld. Um drei gleiche Symbole zu vermeiden, muss in die Mitte ein ${oppName}.`
                    };
                }
            }
        }

        // 3. Logik-Schritt: Kantenbedingungen (= und ×) mit direkt bekanntem Nachbarn
        // Horizontale Kanten
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                const edge = engine.hEdges[r][c];
                if (edge === EDGE_NONE) continue;
                const v1 = grid[r][c], v2 = grid[r][c+1];
                if (v1 !== EMPTY && v2 === EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v1 : (v1 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    return {
                        type: 'edge_direct',
                        r, c: c + 1,
                        value: targetVal,
                        highlightCells: [{r, c}, {r, c: c+1}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+1},${c+2}) bestimmt, dass rechts ein ${targetName} gesetzt werden muss.`
                    };
                } else if (v1 === EMPTY && v2 !== EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v2 : (v2 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    return {
                        type: 'edge_direct',
                        r, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r, c: c+1}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+1},${c+2}) bestimmt, dass links ein ${targetName} gesetzt werden muss.`
                    };
                }
            }
        }

        // Vertikale Kanten
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                const edge = engine.vEdges[r][c];
                if (edge === EDGE_NONE) continue;
                const v1 = grid[r][c], v2 = grid[r+1][c];
                if (v1 !== EMPTY && v2 === EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v1 : (v1 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    return {
                        type: 'edge_direct',
                        r: r + 1, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r: r+1, c}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+2},${c+1}) bestimmt, dass darunter ein ${targetName} gesetzt werden muss.`
                    };
                } else if (v1 === EMPTY && v2 !== EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v2 : (v2 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    return {
                        type: 'edge_direct',
                        r, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r: r+1, c}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+2},${c+1}) bestimmt, dass darüber ein ${targetName} gesetzt werden muss.`
                    };
                }
            }
        }

        // 4. Logik-Schritt: Zeilen- / Spalten-Vollständigkeit (Balance-Auffüllung)
        // Zeilen
        for (let r = 0; r < size; r++) {
            let suns = 0, moons = 0;
            const emptyCols = [];
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === SUN) suns++;
                else if (grid[r][c] === MOON) moons++;
                else emptyCols.push(c);
            }
            if (emptyCols.length > 0) {
                if (suns === maxPerLine) {
                    return {
                        type: 'balance_fill',
                        r, c: emptyCols[0],
                        value: MOON,
                        highlightCells: emptyCols.map(c => ({r, c})),
                        message: `In Zeile ${r+1} sind bereits alle ${maxPerLine} Sonnen gesetzt. Alle restlichen leeren Felder müssen daher Monde sein.`
                    };
                }
                if (moons === maxPerLine) {
                    return {
                        type: 'balance_fill',
                        r, c: emptyCols[0],
                        value: SUN,
                        highlightCells: emptyCols.map(c => ({r, c})),
                        message: `In Zeile ${r+1} sind bereits alle ${maxPerLine} Monde gesetzt. Alle restlichen leeren Felder müssen daher Sonnen sein.`
                    };
                }
            }
        }

        // Spalten
        for (let c = 0; c < size; c++) {
            let suns = 0, moons = 0;
            const emptyRows = [];
            for (let r = 0; r < size; r++) {
                if (grid[r][c] === SUN) suns++;
                else if (grid[r][c] === MOON) moons++;
                else emptyRows.push(r);
            }
            if (emptyRows.length > 0) {
                if (suns === maxPerLine) {
                    return {
                        type: 'balance_fill',
                        r: emptyRows[0], c,
                        value: MOON,
                        highlightCells: emptyRows.map(r => ({r, c})),
                        message: `In Spalte ${c+1} sind bereits alle ${maxPerLine} Sonnen gesetzt. Alle restlichen leeren Felder müssen daher Monde sein.`
                    };
                }
                if (moons === maxPerLine) {
                    return {
                        type: 'balance_fill',
                        r: emptyRows[0], c,
                        value: SUN,
                        highlightCells: emptyRows.map(r => ({r, c})),
                        message: `In Spalte ${c+1} sind bereits alle ${maxPerLine} Monde gesetzt. Alle restlichen leeren Felder müssen daher Sonnen sein.`
                    };
                }
            }
        }

        // 5. Fortgeschrittene Kanten-Logik (Horizontale & Vertikale Kaskaden)
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                if (engine.hEdges[r][c] === EDGE_EQUAL) {
                    if (c > 0 && grid[r][c-1] !== EMPTY && grid[r][c] === EMPTY && grid[r][c+1] === EMPTY) {
                        const vPrev = grid[r][c-1];
                        const opposite = vPrev === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const prevName = vPrev === SUN ? 'Sonne' : 'Mond';
                        return {
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r, c: c-1}, {r, c}, {r, c: c+1}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r+1},${c}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        };
                    }
                }
            }
        }

        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 1; r++) {
                if (engine.vEdges[r][c] === EDGE_EQUAL) {
                    if (r > 0 && grid[r-1][c] !== EMPTY && grid[r][c] === EMPTY && grid[r+1][c] === EMPTY) {
                        const vPrev = grid[r-1][c];
                        const opposite = vPrev === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const prevName = vPrev === SUN ? 'Sonne' : 'Mond';
                        return {
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r: r-1, c}, {r, c}, {r: r+1, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        };
                    }
                }
            }
        }

        // 6. Zeilen- & Spalten-Duplikat Ausschluss (Unizitäts-Beweis)
        for (let r1 = 0; r1 < size; r1++) {
            const isFull1 = grid[r1].every(v => v !== EMPTY);
            if (!isFull1) continue;
            const str1 = grid[r1].join('');

            for (let r2 = 0; r2 < size; r2++) {
                if (r1 === r2) continue;
                const emptyIndices = [];
                for (let c = 0; c < size; c++) {
                    if (grid[r2][c] === EMPTY) emptyIndices.push(c);
                }
                if (emptyIndices.length === 1 || emptyIndices.length === 2) {
                    // Prüfe ob eine Belegung ein Duplikat zu Zeile r1 erzeugen würde
                    for (const candVal of [SUN, MOON]) {
                        const testRow = [...grid[r2]];
                        testRow[emptyIndices[0]] = candVal;
                        if (emptyIndices.length === 2) {
                            // Wenn noch 2 leere da sind, versuche die Rest-Belegung
                            const remainingVal = candVal === SUN ? MOON : SUN;
                            testRow[emptyIndices[1]] = remainingVal;
                        }
                        if (testRow.join('') === str1) {
                            // candVal an emptyIndices[0] erzeugt ein verbotenes Zeilen-Duplikat!
                            const oppVal = candVal === SUN ? MOON : SUN;
                            const oppName = oppVal === SUN ? 'Sonne' : 'Mond';
                            const candName = candVal === SUN ? 'Sonne' : 'Mond';
                            return {
                                type: 'row_uniqueness',
                                r: r2, c: emptyIndices[0],
                                value: oppVal,
                                highlightCells: [{r: r1, c: 0}, {r: r2, c: emptyIndices[0]}],
                                message: `Unizitäts-Axiom: Würde an Position (${r2+1},${emptyIndices[0]+1}) ein ${candName} gesetzt, würde Zeile ${r2+1} exakt identisch zu Zeile ${r1+1} werden! Um ein Zeilen-Duplikat zu verhindern, muss dort ein ${oppName} stehen.`
                            };
                        }
                    }
                }
            }
        }

        // 7. Ausführlicher Widerspruchs-Beweis (Widerspruchs-Test auf jedem leeren Feld)
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === EMPTY) {
                    for (const testVal of [SUN, MOON]) {
                        // Teste was passiert wenn testVal gesetzt wird
                        grid[r][c] = testVal;
                        const check = engine.validateRules();
                        grid[r][c] = EMPTY; // Rückgängig machen

                        if (!check.isValid && check.errors && check.errors.length > 0) {
                            const err = check.errors[0];
                            const correctVal = testVal === SUN ? MOON : SUN;
                            const correctName = correctVal === SUN ? 'Sonne' : 'Mond';
                            const wrongName = testVal === SUN ? 'Sonne' : 'Mond';
                            return {
                                type: 'proof_by_contradiction',
                                r, c,
                                value: correctVal,
                                highlightCells: [{r, c}],
                                message: `Widerspruchs-Beweis: Würde an Position (${r+1},${c+1}) ein ${wrongName} gesetzt, führte dies sofort zu einem Regelverstoß (${err.message}). Daher MUSS an Position (${r+1},${c+1}) ein ${correctName} stehen!`
                            };
                        }
                    }
                }
            }
        }

        // 8. Letzte Absicherung via Solver-Ergebnis mit exakter Positionsangabe
        const sol = TangoSolver.solve(engine);
        if (sol && sol.length > 0) {
            const firstSol = sol[0];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === EMPTY) {
                        const val = firstSol[r][c];
                        const name = val === SUN ? 'Sonne' : 'Mond';
                        return {
                            type: 'advanced_deduction',
                            r, c,
                            value: val,
                            highlightCells: [{r, c}],
                            message: `Tiefe Auschluss-Logik: Aus der Gesamtschau der Zeilen-, Spalten- und Kanten-Abhängigkeiten folgt zwingend ein ${name} an Position (${r+1},${c+1}).`
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Backtracking Solver zur Ermittlung aller Lösungen
     */
    static solve(engine, maxSolutions = 2) {
        const size = engine.size;
        const solutions = [];
        const grid = engine.grid.map(row => [...row]);
        const hEdges = engine.hEdges;
        const vEdges = engine.vEdges;
        const maxPerLine = size / 2;

        function isValid(r, c) {
            // Horizontal 3 in a row
            for (let i = Math.max(0, c - 2); i <= Math.min(c, size - 3); i++) {
                const v1 = grid[r][i], v2 = grid[r][i+1], v3 = grid[r][i+2];
                if (v1 !== EMPTY && v1 === v2 && v2 === v3) return false;
            }
            // Vertical 3 in a row
            for (let i = Math.max(0, r - 2); i <= Math.min(r, size - 3); i++) {
                const v1 = grid[i][c], v2 = grid[i+1][c], v3 = grid[i+2][c];
                if (v1 !== EMPTY && v1 === v2 && v2 === v3) return false;
            }
            // Row balance
            let suns = 0, moons = 0;
            for (let j = 0; j < size; j++) {
                if (grid[r][j] === SUN) suns++;
                else if (grid[r][j] === MOON) moons++;
            }
            if (suns > maxPerLine || moons > maxPerLine) return false;

            // Col balance
            suns = 0; moons = 0;
            for (let i = 0; i < size; i++) {
                if (grid[i][c] === SUN) suns++;
                else if (grid[i][c] === MOON) moons++;
            }
            if (suns > maxPerLine || moons > maxPerLine) return false;

            // Horizontal edges for cell (r, c)
            if (c > 0 && hEdges[r][c-1] !== EDGE_NONE && grid[r][c-1] !== EMPTY) {
                const edge = hEdges[r][c-1];
                if (edge === EDGE_EQUAL && grid[r][c-1] !== grid[r][c]) return false;
                if (edge === EDGE_OPPOSITE && grid[r][c-1] === grid[r][c]) return false;
            }
            if (c < size - 1 && hEdges[r][c] !== EDGE_NONE && grid[r][c+1] !== EMPTY) {
                const edge = hEdges[r][c];
                if (edge === EDGE_EQUAL && grid[r][c] !== grid[r][c+1]) return false;
                if (edge === EDGE_OPPOSITE && grid[r][c] === grid[r][c+1]) return false;
            }

            // Vertical edges for cell (r, c)
            if (r > 0 && vEdges[r-1][c] !== EDGE_NONE && grid[r-1][c] !== EMPTY) {
                const edge = vEdges[r-1][c];
                if (edge === EDGE_EQUAL && grid[r-1][c] !== grid[r][c]) return false;
                if (edge === EDGE_OPPOSITE && grid[r-1][c] === grid[r][c]) return false;
            }
            if (r < size - 1 && vEdges[r][c] !== EDGE_NONE && grid[r+1][c] !== EMPTY) {
                const edge = vEdges[r][c];
                if (edge === EDGE_EQUAL && grid[r][c] !== grid[r+1][c]) return false;
                if (edge === EDGE_OPPOSITE && grid[r][c] === grid[r+1][c]) return false;
            }

            return true;
        }

        function backtrack(idx) {
            if (solutions.length >= maxSolutions) return;
            if (idx === size * size) {
                // Check duplicate rows/cols
                const rowStrs = new Set();
                for (let r = 0; r < size; r++) {
                    rowStrs.add(grid[r].join(''));
                }
                if (rowStrs.size !== size) return;

                const colStrs = new Set();
                for (let c = 0; c < size; c++) {
                    let colStr = '';
                    for (let r = 0; r < size; r++) colStr += grid[r][c];
                    colStrs.add(colStr);
                }
                if (colStrs.size !== size) return;

                solutions.push(grid.map(row => [...row]));
                return;
            }

            const r = Math.floor(idx / size);
            const c = idx % size;

            if (grid[r][c] !== EMPTY) {
                backtrack(idx + 1);
            } else {
                for (const val of [SUN, MOON]) {
                    grid[r][c] = val;
                    if (isValid(r, c)) {
                        backtrack(idx + 1);
                    }
                    grid[r][c] = EMPTY;
                }
            }
        }

        backtrack(0);
        return solutions;
    }
}

// === Source: js\core\generator.js ===
/**
 * Tango Puzzle Generator
 * Erzeugt prozedural eindeutig lösbare Tango-Rätsel verschiedener Größen und Schwierigkeitsgrade.
 */


class TangoGenerator {
    /**
     * Erzeugt einen deterministischen Pseudo-Zufallszahlengenerator aus einem Seed
     */
    static seededRandom(seed) {
        let s = seed;
        return function() {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    /**
     * Erzeugt ein volles, gültiges Lösungs-Board
     */
    static generateFullBoard(size, rng = Math.random) {
        const engine = new TangoEngine(size);
        const maxPerLine = size / 2;
        const grid = engine.grid;

        // Finde ein valides volles Board per randomisiertem Backtracking
        function fill(r, c) {
            if (r === size) {
                // Prüfe Zeilen-Duplikate
                const rowStrs = new Set();
                for (let i = 0; i < size; i++) rowStrs.add(grid[i].join(''));
                if (rowStrs.size !== size) return false;

                // Prüfe Spalten-Duplikate
                const colStrs = new Set();
                for (let j = 0; j < size; j++) {
                    let colStr = '';
                    for (let i = 0; i < size; i++) colStr += grid[i][j];
                    colStrs.add(colStr);
                }
                if (colStrs.size !== size) return false;

                return true;
            }

            const nextR = (c + 1 < size) ? r : r + 1;
            const nextC = (c + 1 < size) ? c + 1 : 0;

            const values = rng() > 0.5 ? [SUN, MOON] : [MOON, SUN];
            for (const val of values) {
                grid[r][c] = val;

                // Validierung
                let valid = true;
                // Horizontal 3 in a row
                if (c >= 2 && grid[r][c-1] === val && grid[r][c-2] === val) valid = false;
                // Vertical 3 in a row
                if (valid && r >= 2 && grid[r-1][c] === val && grid[r-2][c] === val) valid = false;

                // Row balance
                if (valid) {
                    let cnt = 0;
                    for (let j = 0; j <= c; j++) if (grid[r][j] === val) cnt++;
                    if (cnt > maxPerLine) valid = false;
                }
                // Col balance
                if (valid) {
                    let cnt = 0;
                    for (let i = 0; i <= r; i++) if (grid[i][c] === val) cnt++;
                    if (cnt > maxPerLine) valid = false;
                }

                if (valid && fill(nextR, nextC)) return true;
                grid[r][c] = EMPTY;
            }
            return false;
        }

        fill(0, 0);
        return grid.map(row => [...row]);
    }

    /**
     * Erstellt ein spielbares Puzzle mit eindeutiger Lösung
     */
    static generatePuzzle({ size = 6, difficulty = 'medium', seed = null }) {
        const rng = seed !== null ? TangoGenerator.seededRandom(seed) : Math.random;
        const fullSolution = TangoGenerator.generateFullBoard(size, rng);

        // Kanten-Kandidaten aus der Lösung extrahieren
        const hEdges = Array(size).fill(0).map(() => Array(size - 1).fill(EDGE_NONE));
        const vEdges = Array(size - 1).fill(0).map(() => Array(size).fill(EDGE_NONE));

        const hEdgePositions = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                hEdgePositions.push({ r, c, type: 'h' });
            }
        }
        const vEdgePositions = [];
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                vEdgePositions.push({ r, c, type: 'v' });
            }
        }

        // Shuffle Kantenpositionen
        hEdgePositions.sort(() => rng() - 0.5);
        vEdgePositions.sort(() => rng() - 0.5);

        // Bestimme Kantenanzahl je nach Schwierigkeit
        let maxEdges;
        let targetClues;
        if (size === 4) {
            maxEdges = difficulty === 'easy' ? 4 : 2;
            targetClues = difficulty === 'easy' ? 4 : 2;
        } else if (size === 6) {
            maxEdges = difficulty === 'easy' ? 8 : (difficulty === 'medium' ? 5 : 3);
            targetClues = difficulty === 'easy' ? 10 : (difficulty === 'medium' ? 6 : 4);
        } else if (size === 8) {
            maxEdges = difficulty === 'medium' ? 10 : 6;
            targetClues = difficulty === 'medium' ? 14 : 10;
        } else {
            maxEdges = 14;
            targetClues = 18;
        }

        let edgeCount = 0;
        for (const pos of [...hEdgePositions, ...vEdgePositions]) {
            if (edgeCount >= maxEdges) break;
            if (pos.type === 'h') {
                const v1 = fullSolution[pos.r][pos.c];
                const v2 = fullSolution[pos.r][pos.c + 1];
                const edgeType = (v1 === v2) ? EDGE_EQUAL : EDGE_OPPOSITE;
                // Leichte Tendenz zu '=' da es visuell intuitiv ist
                if (rng() > 0.4 || edgeType === EDGE_EQUAL) {
                    hEdges[pos.r][pos.c] = edgeType;
                    edgeCount++;
                }
            } else {
                const v1 = fullSolution[pos.r][pos.c];
                const v2 = fullSolution[pos.r + 1][pos.c];
                const edgeType = (v1 === v2) ? EDGE_EQUAL : EDGE_OPPOSITE;
                if (rng() > 0.4 || edgeType === EDGE_EQUAL) {
                    vEdges[pos.r][pos.c] = edgeType;
                    edgeCount++;
                }
            }
        }

        // Starte mit allen Zellen aus der Lösung und entferne schrittweise Felder
        const puzzleGrid = fullSolution.map(row => [...row]);
        const testEngine = new TangoEngine(size);
        testEngine.loadPuzzle({ size, initialGrid: puzzleGrid, hEdges, vEdges });

        // Erstelle eine Zufallsreihenfolge aller Zellen
        const cells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                cells.push({ r, c });
            }
        }
        cells.sort(() => rng() - 0.5);

        let currentClues = size * size;
        for (const cell of cells) {
            if (currentClues <= targetClues) break;
            const origVal = puzzleGrid[cell.r][cell.c];
            puzzleGrid[cell.r][cell.c] = EMPTY;

            testEngine.loadPuzzle({ size, initialGrid: puzzleGrid, hEdges, vEdges });
            const solutions = TangoSolver.solve(testEngine, 2);

            // Wenn das Rätsel mehrdeutig wird, stelle das Feld wieder her
            if (solutions.length !== 1) {
                puzzleGrid[cell.r][cell.c] = origVal;
            } else {
                currentClues--;
            }
        }

        return {
            size,
            initialGrid: puzzleGrid,
            solution: fullSolution,
            hEdges,
            vEdges,
            difficulty
        };
    }
}

// === Source: js\data\i18n.js ===
/**
 * Tango Internationalisierung (i18n)
 * Vollständige deutsche Übersetzung und Sprachdefinitionen
 */

const translations = {
    de: {
        app_title: "Tango Logikrätsel",
        subtitle: "Minimalistisches Binärrätsel mit Sonne & Mond",
        
        // Navigation & Modi
        nav_campaign: "Kampagne",
        nav_daily: "Tagesrätsel",
        nav_free: "Freies Spiel",
        nav_tutorial: "Grundlagen",
        nav_tutorial_pro: "Mathematik",
        nav_tutorial_patterns: "Muster",
        nav_stats: "Statistiken",
        nav_settings: "Einstellungen",
        
        // Schwierigkeitsgrade
        diff_beginner: "Anfänger (4×4)",
        diff_easy: "Einfach (6×6)",
        diff_medium: "Mittel (6×6)",
        diff_hard: "Schwer (8×8)",
        diff_expert: "Experte (10×10)",

        // Spielaktionen
        btn_undo: "Rückgängig",
        btn_redo: "Wiederholen",
        btn_hint: "Hinweis",
        btn_restart: "Neustart",
        btn_notes: "Notizen",
        btn_check: "Prüfen",
        btn_next_level: "Nächstes Level",
        btn_back_menu: "Hauptmenü",
        btn_play_again: "Nochmal spielen",
        btn_continue: "Weiter",
        btn_start: "Starten",

        // Status & Timer
        status_time: "Zeit",
        status_moves: "Züge",
        status_hints_used: "Hinweise",
        status_level: "Level",
        status_daily_date: "Tagesrätsel vom",
        status_streak: "Serie",
        status_completed: "Gelöst!",

        // Hinweise & Feedback
        hint_title: "Logischer Hinweis",
        hint_error_title: "Fehler gefunden",
        hint_button_apply: "Zug ausführen",
        hint_button_fix: "Feld korrigieren",
        hint_limit_reached: "Maximale Anzahl an Hinweisen für dieses Level erreicht (3/3).",
        reveal_confirm_title: "Lösung aufdecken?",
        reveal_confirm_desc: "Du hast alle 3 Hinweise verbraucht. Möchtest du das Rätsel aufgeben und die vollständige Lösung aufdecken?\n\n⚠️ Das nächste Level wird dabei nicht freigeschaltet und in der Statistik wird eine Niederlage vermerkt.",
        btn_reveal_solution: "Lösung aufdecken",
        reveal_defeat_title: "Rätsel aufgegeben",
        reveal_defeat_msg: "Die Lösung wurde hinterlegt und Fehler wurden rot markiert. Das nächste Level bleibt gesperrt und in deiner Statistik wurde eine Niederlage verbucht.",
        reveal_banner_hint: "Lösung wird angezeigt. Tippe auf Weiter zum Fortfahren.",
        btn_retry_level: "Level wiederholen",
        error_title: "Regelverstoß",
        victory_title: "Glückwunsch!",
        victory_msg: "Du hast dieses Rätsel erfolgreich und fehlerfrei gelöst!",
        victory_time_msg: "Benötigte Zeit:",
        victory_perfect: "Perfekt gelöst ohne Hinweise!",

        // Regeln (Kurzform)
        rules_header: "Spielregeln & Abhängigkeiten",
        rule_1_title: "1. Keine 3er-Reihen",
        rule_1_desc: "Höchstens zwei gleiche Symbole (☀️☀️ oder 🌙🌙) dürfen waagerecht oder senkrecht aufeinanderfolgen.",
        rule_2_title: "2. Gleiche Anzahl",
        rule_2_desc: "Jede Zeile und Spalte enthält exakt gleich viele Sonnen wie Monde.",
        rule_3_title: "3. Gleichheitszeichen =",
        rule_3_desc: "Verbundene Nachbarfelder müssen dasselbe Symbol besitzen (beide ☀️ oder beide 🌙).",
        rule_4_title: "4. Gegenteilszeichen ×",
        rule_4_desc: "Verbundene Nachbarfelder müssen unterschiedliche Symbole besitzen (eine ☀️, ein 🌙).",
        rule_5_title: "5. Eindeutigkeit",
        rule_5_desc: "Keine zwei Zeilen und keine zwei Spalten dürfen vollständig identisch sein.",

        // Einstellungen
        settings_title: "Einstellungen",
        setting_theme: "Farbdesign",
        setting_theme_dark: "Modern Dark",
        setting_theme_amoled: "AMOLED Schwarz",
        setting_theme_light: "Hell / Clean",
        setting_theme_wood: "Warmes Holz",
        setting_theme_cyberpunk: "Cyberpunk Neon",
        setting_sound: "Soundeffekte",
        setting_vibration: "Haptisches Feedback (Vibration)",
        setting_vibration_strength: "Vibrationsstärke",
        setting_vib_ultra: "Ultra kräftig (Maximal)",
        setting_vib_strong: "Kräftig (Empfohlen)",
        setting_vib_medium: "Standard",
        setting_vib_soft: "Sanft",
        setting_auto_check: "Fehler sofort hervorheben",
        setting_input_mode: "Eingabemodus",
        setting_input_cycle: "Direkt (1× ☀️ / 2× & Halten 🌙 / 3× Löschen)",
        setting_input_keypad: "Ziffern- / Symbolleiste unten",
        setting_language: "Sprache",
        setting_reset_data: "Fortschritt zurücksetzen",
        setting_reset_confirm: "Möchtest du deinen Spielfortschritt wirklich zurücksetzen?",
        stats_reset_confirm: "Möchtest du deine Spielstatistik wirklich zurücksetzen?",

        // Statistiken
        stats_title: "Deine Statistiken",
        stats_total_played: "Gespielte Rätsel",
        stats_total_won: "Gelöste Rätsel",
        stats_total_lost: "Niederlagen / Aufgegeben",
        stats_win_rate: "Erfolgsquote",
        stats_best_time: "Bestzeit",
        stats_avg_time: "Durchschnittszeit",
        stats_current_streak: "Aktuelle Tages-Serie",
        stats_max_streak: "Längste Tages-Serie",
        stats_best_times_title: "⚡ Bestzeiten",
        stats_best_time_4: "Bestzeit 4×4",
        stats_best_time_6: "Bestzeit 6×6",
        stats_best_time_8: "Bestzeit 8×8",
        stats_best_time_10: "Bestzeit 10×10",
        stats_no_data: "Noch keine Spieldaten vorhanden.",

        // PWA Install Prompt
        pwa_install_title: "App installieren",
        pwa_install_desc: "Installiere Tango auf deinem Smartphone, um komplett offline und werbefrei zu spielen.",
        pwa_install_btn: "Jetzt installieren",
        pwa_dismiss: "Später",

        // Synchronisation & QR-Code
        nav_sync: "🔄 Spielstand übertragen & QR-Code",
        sync_title: "Spielstand synchronisieren",
        sync_tab_export: "📱 QR-Code / Senden",
        sync_tab_import: "📥 Empfangen / Laden",
        sync_export_desc: "Scanne diesen QR-Code mit einem anderen Gerät oder kopiere den Sync-Code, um deinen gesamten Fortschritt verlustfrei zu übertragen.",
        sync_import_desc: "Füge den Sync-Code oder den Inhalt einer Backup-Datei ein. Dein Fortschritt wird intelligent und verlustfrei mit bestehenden Daten zusammengeführt.",
        sync_btn_copy: "📋 Kopieren",
        sync_btn_copied: "✅ Kopiert!",
        sync_btn_download: "💾 Backup-Datei (.tango) speichern",
        sync_btn_paste: "📋 Aus Zwischenablage",
        sync_btn_merge: "🔄 Spielstand zusammenführen",
        sync_file_load: "📁 Datei laden",
        sync_success_title: "Erfolgreich synchronisiert!",
        sync_no_new_data: "Dein Spielstand ist bereits auf dem neuesten Stand.",

        // Tägliche Erinnerung & Benachrichtigungen
        setting_daily_reminder: "System-Benachrichtigung",
        setting_reminder_time: "Erinnerungszeit",
        setting_test_notif: "🔔 Test",
        reminder_banner_title: "Tagesrätsel wartet!",
        reminder_banner_desc: "Löse dein heutiges Rätsel für deine Serie.",
        reminder_btn_play: "Spielen",
        reminder_badge_new: "Neu",
        notif_title: "Tango Tagesrätsel",
        notif_body: "Dein heutiges Tagesrätsel wartet auf dich! ☀️🌙",
        notif_test_sent: "Systembenachrichtigung gesendet!",
        notif_permission_denied: "Benachrichtigungen sind im Browser blockiert. Bitte erlaube sie in den Berechtigungen.",
        daily_replay_title: "Tagesrätsel bereits gelöst",
        daily_replay_confirm: "Du hast das heutige Tagesrätsel bereits erfolgreich gelöst. Möchtest du es noch einmal zur Übung spielen?",
        daily_btn_replay: "Erneut spielen",

        // Menü Hub Tabs
        menu_tab_play: "Spielen",
        menu_tab_rules: "Regeln",
        menu_tab_stats: "Statistik",
        menu_tab_settings: "Optionen",
        stats_reset_btn: "Statistik zurücksetzen",
        confirm_title: "Sicherheitsabfrage",
        btn_cancel: "Abbrechen",
        btn_save: "Speichern",
        btn_confirm_reset: "Zurücksetzen",
        campaign_desc: "120 handgefertigte Logikrätsel",
        chapter_1: "Teil 1",
        chapter_2: "Teil 2",
        chapter_3: "Teil 3",
        chapter_4: "Teil 4",
        daily_desc: "Jeden Tag eine neue Herausforderung",
        free_desc: "4×4 bis 10×10, beliebige Stufe",
        free_size: "Gittergröße",
        free_diff: "Schwierigkeitsgrad",
        free_size_4: "4 × 4 (Schnell)",
        free_size_6: "6 × 6 (Klassisch)",
        free_size_8: "8 × 8 (Groß)",
        free_size_10: "10 × 10 (Gigant)",
        free_diff_easy: "Einfach",
        free_diff_medium: "Mittel",
        free_diff_hard: "Schwer"
    },
    en: {
        app_title: "Tango Logic Puzzle",
        subtitle: "Minimalist binary puzzle with Sun & Moon",
        nav_campaign: "Campaign",
        nav_daily: "Daily Puzzle",
        nav_free: "Free Play",
        nav_tutorial: "Basics",
        nav_tutorial_pro: "Mathematics",
        nav_tutorial_patterns: "Patterns",
        nav_stats: "Statistics",
        nav_settings: "Settings",
        diff_beginner: "Beginner (4×4)",
        diff_easy: "Easy (6×6)",
        diff_medium: "Medium (6×6)",
        diff_hard: "Hard (8×8)",
        diff_expert: "Expert (10×10)",
        btn_undo: "Undo",
        btn_redo: "Redo",
        btn_hint: "Hint",
        btn_restart: "Restart",
        btn_notes: "Notes",
        btn_check: "Check",
        btn_next_level: "Next Level",
        btn_back_menu: "Main Menu",
        btn_play_again: "Play Again",
        btn_continue: "Continue",
        btn_start: "Start",
        status_time: "Time",
        status_moves: "Moves",
        status_hints_used: "Hints",
        status_level: "Level",
        status_daily_date: "Daily Puzzle for",
        status_streak: "Streak",
        status_completed: "Solved!",
        hint_title: "Logical Hint",
        hint_error_title: "Mistake Found",
        hint_button_apply: "Apply Move",
        hint_button_fix: "Fix Cell",
        hint_limit_reached: "Maximum number of hints reached (3/3).",
        reveal_confirm_title: "Reveal Solution?",
        reveal_confirm_desc: "You have used all 3 hints. Do you want to surrender this puzzle and reveal the complete solution?\n\n⚠️ The next level will not be unlocked and a defeat will be recorded in your statistics.",
        btn_reveal_solution: "Reveal Solution",
        reveal_defeat_title: "Puzzle Surrendered",
        reveal_defeat_msg: "The solution has been revealed and mistakes highlighted in red. The next level remains locked and a defeat has been recorded in your statistics.",
        reveal_banner_hint: "Solution displayed. Tap Continue to proceed.",
        btn_retry_level: "Retry Level",
        error_title: "Rule Violation",
        victory_title: "Congratulations!",
        victory_msg: "You solved this puzzle perfectly!",
        victory_time_msg: "Time taken:",
        victory_perfect: "Solved without hints!",
        rules_header: "Game Rules & Dependencies",
        rule_1_title: "1. No 3 in a Row",
        rule_1_desc: "No more than two identical symbols (☀️☀️ or 🌙🌙) may appear consecutively in any row or column.",
        rule_2_title: "2. Equal Balance",
        rule_2_desc: "Each row and column must contain an equal number of suns and moons.",
        rule_3_title: "3. Equal Sign =",
        rule_3_desc: "Connected cells must have the exact same symbol (both ☀️ or both 🌙).",
        rule_4_title: "4. Opposite Sign ×",
        rule_4_desc: "Connected cells must have opposite symbols (one ☀️, one 🌙).",
        rule_5_title: "5. Uniqueness",
        rule_5_desc: "No two rows or columns can be completely identical.",
        settings_title: "Settings",
        setting_theme: "Theme",
        setting_theme_dark: "Modern Dark",
        setting_theme_amoled: "AMOLED Black",
        setting_theme_light: "Clean Light",
        setting_theme_wood: "Warm Wood",
        setting_theme_cyberpunk: "Cyberpunk Neon",
        setting_sound: "Sound Effects",
        setting_vibration: "Haptic Feedback",
        setting_vibration_strength: "Vibration Intensity",
        setting_vib_ultra: "Ultra Strong (Max)",
        setting_vib_strong: "Strong (Recommended)",
        setting_vib_medium: "Standard",
        setting_vib_soft: "Soft",
        setting_auto_check: "Highlight Mistakes Immediately",
        setting_input_mode: "Input Mode",
        setting_input_cycle: "Cycle Tap (Sun → Moon → Empty)",
        setting_input_keypad: "Bottom Selector Bar",
        setting_language: "Language",
        setting_reset_data: "Reset Progress",
        setting_reset_confirm: "Are you sure you want to reset all your campaign and streak progress?",
        stats_reset_confirm: "Are you sure you want to reset all your statistics?",
        stats_title: "Your Statistics",
        stats_total_played: "Puzzles Played",
        stats_total_won: "Puzzles Solved",
        stats_total_lost: "Puzzles Lost / Surrendered",
        stats_win_rate: "Win Rate",
        stats_best_time: "Best Time",
        stats_avg_time: "Average Time",
        stats_current_streak: "Current Daily Streak",
        stats_max_streak: "Max Daily Streak",
        stats_best_times_title: "⚡ Best Times",
        stats_best_time_4: "Best Time 4×4",
        stats_best_time_6: "Best Time 6×6",
        stats_best_time_8: "Best Time 8×8",
        stats_best_time_10: "Best Time 10×10",
        stats_no_data: "No game data recorded yet.",
        pwa_install_title: "Install App",
        pwa_install_desc: "Install Tango on your home screen for instant offline play.",
        pwa_install_btn: "Install Now",
        pwa_dismiss: "Later",

        // Sync & QR Code
        nav_sync: "🔄 Transfer & Sync Saves",
        sync_title: "Sync Game Save States",
        sync_tab_export: "📱 QR Code / Export",
        sync_tab_import: "📥 Receive / Import",
        sync_export_desc: "Scan this QR code with another device or copy the sync code to transfer your full progress losslessly.",
        sync_import_desc: "Paste the sync code or load a backup file. Your progress will be merged losslessly with existing local progress.",
        sync_btn_copy: "📋 Copy Code",
        sync_btn_copied: "✅ Copied!",
        sync_btn_download: "💾 Download Backup (.tango)",
        sync_btn_paste: "📋 Paste from Clipboard",
        sync_btn_merge: "🔄 Merge & Update Saves",
        sync_file_load: "📁 Load File",
        sync_success_title: "Successfully Synced!",
        sync_no_new_data: "Your save state is already fully up to date.",

        // Daily Reminder & Notifications
        setting_daily_reminder: "System Notification",
        setting_reminder_time: "Reminder Time",
        setting_test_notif: "🔔 Test",
        reminder_banner_title: "Daily Puzzle Ready!",
        reminder_banner_desc: "Solve today's puzzle to keep your streak.",
        reminder_btn_play: "Play",
        reminder_badge_new: "New",
        notif_title: "Tango Daily Puzzle",
        notif_body: "Today's daily puzzle is ready for you! ☀️🌙",
        notif_test_sent: "System notification sent!",
        notif_permission_denied: "Notifications blocked by browser. Please enable permissions.",
        daily_replay_title: "Daily Puzzle Already Solved",
        daily_replay_confirm: "You have already solved today's daily puzzle. Would you like to play it again for practice?",
        daily_btn_replay: "Play Again",

        // Menu Hub Tabs
        menu_tab_play: "Play",
        menu_tab_rules: "Rules",
        menu_tab_stats: "Stats",
        menu_tab_settings: "Options",
        stats_reset_btn: "Reset Statistics",
        confirm_title: "Confirmation",
        btn_cancel: "Cancel",
        btn_save: "Save",
        btn_confirm_reset: "Reset",
        campaign_desc: "120 handcrafted logic puzzles",
        chapter_1: "Part 1",
        chapter_2: "Part 2",
        chapter_3: "Part 3",
        chapter_4: "Part 4",
        daily_desc: "A fresh challenge every single day",
        free_desc: "4×4 to 10×10, custom difficulty",
        free_size: "Grid Size",
        free_diff: "Difficulty",
        free_size_4: "4 × 4 (Fast)",
        free_size_6: "6 × 6 (Classic)",
        free_size_8: "8 × 8 (Large)",
        free_size_10: "10 × 10 (Giant)",
        free_diff_easy: "Easy",
        free_diff_medium: "Medium",
        free_diff_hard: "Hard"
    }
};

let currentLang = 'de';

function getLang() {
    return currentLang;
}

function setLang(lang) {
    if (translations[lang]) {
        currentLang = lang;
        try {
            localStorage.setItem('tango_lang', lang);
        } catch (e) {
            console.warn('localStorage nicht verfügbar:', e);
        }
    }
}

function t(key) {
    const dict = translations[currentLang] || translations.de;
    return dict[key] || key;
}

// Lade gespeicherte Sprache
try {
    const savedLang = localStorage.getItem('tango_lang');
    if (savedLang && translations[savedLang]) {
        currentLang = savedLang;
    }
} catch (e) {
    console.warn('localStorage konnte nicht gelesen werden:', e);
}


// === Source: js\data\tutorial.js ===
/**
 * Tango Interaktives Tutorial
 * 6 aufeinander aufbauende Lektionen mit detaillierter deutscher Erklärung
 */


const TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Sonne ☀️ & Mond 🌙",
        subtitle: "Die Grundlagen und Steuerung",
        description: `Willkommen bei **Tango**!\n\nDein Ziel ist es, das Gitter mit **Sonnen (☀️)** und **Monden (🌙)** zu füllen.\n\n**Bedienung**:\n- **1× Tippen** = **Sonne ☀️**\n- **2× Tippen oder gedrückt halten** = **Mond 🌙**\n- **3× Tippen** = **Löschen**\n\n*Aufgabe: Setze auf das markierte Feld oben links eine Sonne und daneben einen Mond.*`,
        size: 4,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, SUN, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 0, val: SUN}, {r: 0, c: 1, val: MOON}],
        explanation: "Perfekt! Du hast die Steuerung verinnerlicht."
    },
    {
        id: 2,
        title: "2. Regel: Keine 3er-Reihen",
        subtitle: "Vermeide drei gleiche Symbole in einer Reihe",
        description: `Weder waagerecht noch senkrecht dürfen **mehr als zwei gleiche Symbole** aufeinanderfolgen (kein ☀️☀️☀️ und kein 🌙🌙🌙).\n\n1. Stehen **zwei Sonnen** nebeneinander (☀️☀️_), muss das nächste Feld ein **Mond 🌙** sein.\n2. Umschließen zwei Monde eine Lücke (🌙_🌙), muss dazwischen eine **Sonne ☀️** stehen.\n\n*Aufgabe: Verhindere die 3er-Reihen in Zeile 1 und Zeile 3.*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 2, val: MOON}, {r: 2, c: 1, val: SUN}],
        explanation: "Hervorragend! Du hast erfolgreich Dreierreihen verhindert."
    },
    {
        id: 3,
        title: "3. Regel: Balance (Gleiche Anzahl)",
        subtitle: "Jede Zeile und Spalte hat genau gleich viele Sonnen und Monde",
        description: `In einem 4×4 Gitter müssen in jeder Zeile und jeder Spalte **genau 2 Sonnen und 2 Monde** vorkommen (bei 6×6 sind es 3 und 3).\n\nWenn in einer Reihe bereits alle Sonnen gesetzt sind, müssen alle restlichen freien Felder Monde sein!\n\n*Aufgabe: Vervollständige die erste Zeile und die erste Spalte.*`,
        size: 4,
        initialGrid: [
            [SUN, MOON, SUN, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 3, val: MOON}, {r: 3, c: 0, val: MOON}],
        explanation: "Klasse! Zeilen- und Spalten-Balance ist das Herzstück des Spiels."
    },
    {
        id: 4,
        title: "4. Abhängigkeit: Das Gleichheitszeichen =",
        subtitle: "Verbundene Zellen haben dasselbe Symbol",
        description: `Ein **` + '=' + `** zwischen zwei Feldern bedeutet, dass beide Felder **exakt dasselbe Symbol** tragen müssen.\n\n- Ist ein Feld eine **Sonne ☀️**, muss das verbundene Feld ebenfalls eine **Sonne ☀️** sein.\n- Ist ein Feld ein **Mond 🌙**, muss das verbundene Feld ebenfalls ein **Mond 🌙** sein.\n\n*Aufgabe: Nutze das Gleichheitszeichen, um die rechten Felder auszufüllen.*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: SUN}, {r: 1, c: 1, val: MOON}],
        explanation: "Sehr gut! Das Gleichheitszeichen koppelt zwei Zellen direkt aneinander."
    },
    {
        id: 5,
        title: "5. Abhängigkeit: Das Gegenteilszeichen ×",
        subtitle: "Verbundene Zellen müssen unterschiedlich sein",
        description: `Ein **×** zwischen zwei Feldern bedeutet, dass die beiden Felder **unterschiedliche Symbole** tragen müssen.\n\n- Ist ein Feld eine **Sonne ☀️**, ist das Partnerfeld ein **Mond 🌙**.\n- Ist ein Feld ein **Mond 🌙**, ist das Partnerfeld eine **Sonne ☀️**.\n\n*Aufgabe: Nutze die ×-Markierung, um die Partnerfelder zu bestimmen.*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 2, c: 2, val: SUN}],
        explanation: "Exzellent! Mit dem Gegenteilszeichen lassen sich Paare sofort auflösen."
    },
    {
        id: 6,
        title: "6. Meisterprüfung: Erstes volles Rätsel",
        subtitle: "Kombiniere alle Regeln zum Lösen dieses 4×4 Gitters",
        description: `Jetzt kennst du alle Regeln:\n1. **Keine 3er-Reihen** (weder ☀️☀️☀️ noch 🌙🌙🌙)\n2. **Balance** (2 Sonnen & 2 Monde pro Zeile und Spalte)\n3. **= (Gleich)** & **× (Gegenteil)**\n\n*Aufgabe: Löse dieses komplette 4×4 Rätsel von Anfang bis Ende!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, SUN, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: null, // Muss komplett gelöst werden
        explanation: "Herzlichen Glückwunsch! Du hast das Tutorial gemeistert und bist bereit für die Kampagne und das tägliche Rätsel!"
    }
];

// === Source: js\data\tutorial_pro.js ===
/**
 * Tango Tutorial Pro - Mathematische & Logische Profi-Techniken
 * Erklärt fortgeschrittene Lösungsstrategien mit mathematischen Beweisen und interaktiven Übungen.
 */


const TUTORIAL_PRO_STEPS = [
    {
        id: 1,
        title: "Pro 1: Das Sandwich-Prinzip (Parität)",
        subtitle: "Mathematische Dreier-Sperre in Lücken",
        mathPrinciple: "Ausschluss durch Dreier-Verbot: Niemals 3 gleiche Symbole in Reihe",
        description: `**Das Prinzip**:\nWenn zwei identische Symbole ein leeres Feld umschließen (\`☀️ _ ☀️\` oder \`🌙 _ 🌙\`), MUSS dazwischen das gegenteilige Symbol stehen.\n\n**Mathematischer Beweis**:\nWürde man in die Lücke dasselbe Symbol setzen, entstünde eine Kette aus drei gleichen Symbolen (\`☀️☀️☀️\`). Da die maximale Kettenlänge laut Tango-Regeln maximal 2 beträgt, existiert nur genau eine Belegung für die Lücke.\n\n*Übung: Vervollständige die Sandwich-Lücken in Zeile 1 und Spalte 4!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, SUN, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, EMPTY, EMPTY, SUN]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 1, c: 3, val: SUN}],
        explanation: "Mathematisch korrekt! Das Sandwich-Prinzip sichert die Belegung ohne Raten."
    },
    {
        id: 2,
        title: "Pro 2: Die Kanten-Kaskade (Kopplungs-Logik)",
        subtitle: "Vorzeichen-Vererbung über Gleichheitsketten",
        mathPrinciple: "Kanten-Kopplung: [=] nach Symbol A erzwingt Gegenteil",
        description: `**Das Prinzip**:\nZwei durch ein Gleichheitszeichen verbundene Felder (\`[=]\`) bilden ein gekoppeltes Paar mit identischem Wert. Steht direkt davor ein bekanntes Symbol (z. B. eine Sonne ☀️), MÜSSEN beide verbundenen Felder das Gegenteil (🌙 🌙) annehmen.\n\n**Mathematischer Beweis**:\nWürden beide Felder denselben Wert wie das Nachbarfeld annehmen, entstünde eine unzulässige 3er-Reihe (☀️ ☀️ ☀️). Folglich müssen beide Felder zwingend das entgegengesetzte Symbol tragen.\n\n*Übung: Nutze das Gleichheitszeichen [=] in Zeile 1, um die beiden leeren Felder rechts von der Sonne auszufüllen!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 0, c: 2, val: MOON}],
        explanation: "Perfekt bewiesen! Die Kanten-Kaskade hebelt zwei leere Felder gleichzeitig aus."
    },
    {
        id: 3,
        title: "Pro 3: Taubenschlag-Prinzip (Zeilen-Balance)",
        subtitle: "Abzählende Zeilen- und Spaltenvollständigkeit",
        mathPrinciple: "Zeilen-Balance: Summe Sonnen = N/2 ⟹ Rest = Monde",
        description: `**Das Prinzip**:\nIn jedem Gitter enthält jede Zeile und Spalte exakt gleich viele Sonnen wie Monde (z. B. je 2 bei 4×4, je 3 bei 6×6). Sobald alle Sonnen einer Reihe platziert sind, MÜSSEN alle restlichen leeren Felder Monde sein.\n\n**Mathematischer Beweis**:\nIst das Kontingent an Sonnen für eine Zeile vollständig erschöpft, verbleiben 0 freie Kapazitäten für weitere Sonnen. Nach dem Abzähl- und Balance-Prinzip müssen alle verbleibenden leeren Felder mit Monden aufgefüllt werden.\n\n*Übung: Fülle die verbleibenden Felder in Zeile 1 und Spalte 1 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 2, val: MOON}, {r: 0, c: 3, val: MOON}, {r: 2, c: 0, val: MOON}, {r: 3, c: 0, val: MOON}],
        explanation: "Exzellent! Das Taubenschlag-Prinzip liefert die verbleibenden Felder sofort."
    },
    {
        id: 4,
        title: "Pro 4: Indirekte Gegenteils-Kopplung (× Inversion)",
        subtitle: "Vorzeichenumkehr über Gegenteilskanten",
        mathPrinciple: "Inversions-Logik: [×] schaltet Symbol um (☀️ ↔ 🌙)",
        description: `**Das Prinzip**:\nEin Gegenteilszeichen (\`[×]\`) schaltet den logischen Zustand direkt um: Ist eine Seite bekannt, ist die andere Seite zwingend das Gegenteil.\n\n**Mathematischer Beweis**:\nIn einem binären System mit nur zwei Symbolen (☀️ und 🌙) erzwingt die Kante [×] stets unterschiedliche Werte. Ist ein Nachbar eine Sonne ☀️, folgt unausweichlich, dass der verbundene Partner ein Mond 🌙 sein muss.\n\n*Übung: Löse die Gegenteilskanten [×] in Zeile 1 und Spalte 2 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: MOON },
            { r: 2, c: 1, val: SUN }
        ],
        explanation: "Klasse! Inversion über Gegenteilskanten ist die schnellste Umkehr-Logik."
    },
    {
        id: 5,
        title: "Pro 5: Ausschluss identischer Zeilen",
        subtitle: "Verhinderung von Zeilen-Duplikaten",
        mathPrinciple: "Eindeutigkeit: Keine zwei Zeilen dürfen identisch sein",
        description: `**Das Prinzip**:\nKeine zwei Zeilen dürfen vollständig identisch belegt sein. Wenn eine Belegung eine identische Zeile erzeugen würde, MUSS die alternative Belegung gewählt werden.\n\n**Mathematischer Beweis**:\nZeile 1 ist \`☀️ 🌙 ☀️ 🌙\`. Zeile 2 beginnt mit \`☀️ 🌙 _ _\`. Die Belegung \`☀️ 🌙\` für die Lücken würde Zeile 2 identisch zu Zeile 1 machen (Zeile 1 = Zeile 2). Daher MUSS nach der Eindeutigkeits-Regel die Belegung \`🌙 ☀️\` gewählt werden.\n\n*Übung: Vervollständige Zeile 2 so, dass sie NICHT identisch zu Zeile 1 wird!*`,
        size: 4,
        initialGrid: [
            [SUN, MOON, SUN, MOON],
            [SUN, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 1, c: 2, val: MOON },
            { r: 1, c: 3, val: SUN }
        ],
        explanation: "Brillant! Der Ausschluss identischer Zeilen löst knifflige Endspiele ohne Raten."
    },
    {
        id: 6,
        title: "Pro 6: Das Rand-Doppel-Prinzip",
        subtitle: "Doppelseitige Klammerung von Pärchen",
        mathPrinciple: "Rand-Einschluss: Pärchen [☀️☀️] wird von [🌙] eingeklammert",
        description: `**Das Prinzip**:\nWenn zwei gleiche Symbole nebeneinander stehen (\`_ ☀️ ☀️ _\`), MÜSSEN BEIDE Außenfelder das Gegenteil sein (\`🌙 ☀️ ☀️ 🌙\`).\n\n**Mathematischer Beweis**:\nWürde eines der Außenfelder auch eine Sonne \`☀️\` sein, entstünde sofort die verbotene 3er-Kette \`☀️ ☀️ ☀️\`. Folglich müssen BEIDE Außenpositionen zwingend Monde \`🌙\` sein.\n\n*Übung: Klammere das Sonnen-Paar in Zeile 1 mit Monden ein!*`,
        size: 4,
        initialGrid: [
            [EMPTY, SUN, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 0, val: MOON },
            { r: 0, c: 3, val: MOON }
        ],
        explanation: "Perfekt! Zwei gleiche Symbole schließen stets beide Außenfelder mit dem Gegenteil ein."
    },
    {
        id: 7,
        title: "Pro 7: Das Paritäts-Trippel (2-aus-3 Logik)",
        subtitle: "Gegenteils-Kanten als Zähleinheit",
        mathPrinciple: "Parität: [×] bindet 1☀️ + 1🌙 ⟹ 4. Feld ist bestimmt",
        description: `**Das Prinzip**:\nZwei durch \`[×]\` verbundene Felder enthalten garantiert genau 1 Sonne und 1 Mond. Steht vor dem Paar eine Sonne \`☀️\`, ist für die Zeile bereits die 2. Sonne vergeben — das 4. Feld MUSS ein Mond \`🌙\` sein!\n\n**Mathematischer Beweis**:\nDie \`[×]\`-Kante bindet exakt 1 Sonne + 1 Mond. Da Position 1 bereits eine \`☀️\` ist, enthält die 3er-Gruppe (Pos 1–3) zusammen bereits 2 Sonnen (das Maximum bei 4×4). Daher kann das 4. Feld an Position 4 keine Sonne mehr sein und MUSS ein Mond \`🌙\` werden.\n\n*Übung: Bestimme das 4. Feld in Zeile 1 durch die 2-aus-3 Logik!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 3, val: MOON }
        ],
        explanation: "Genial! Die 2-aus-3 Logik lässt dich das 4. Feld bestimmen, ohne das Paar selbst zu lösen."
    },
    {
        id: 8,
        title: "Pro 8: Die 2×2 Quadrat-Kanten-Schleife",
        subtitle: "Kanten-Algebra in Blöcken",
        mathPrinciple: "Eck-Kopplung: Zwei [×] an einer Zelle erzwingen Gleichheit",
        description: `**Das Prinzip**:\nWenn eine Zelle (z. B. oben links) mit zwei Nachbarn über \`[×]\` verbunden ist, müssen beide Nachbarn untereinander exakt GLEICH sein.\n\n**Mathematischer Beweis**:\nBeide Nachbarfelder sind das Gegenteil derselben Ausgangszelle. Da es nur 2 Symbole gibt, haben beide Nachbarn denselben Wert. Ist die Eckzelle eine \`☀️\`, MÜSSEN beide Nachbarfelder Monde \`🌙\` sein!\n\n*Übung: Löse die beiden Nachbarfelder in Zeile 1 und Spalte 1 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: MOON },
            { r: 1, c: 0, val: MOON }
        ],
        explanation: "Meisterklasse! Kanten-Algebra in 2x2 Blöcken durchschaut komplexe Abhängigkeiten blitzschnell."
    }
];

// === Source: js\data\tutorial_patterns.js ===
/**
 * Tango Tutorial Regelmäßigkeiten & Meister-Muster
 * Tiefgehende Lektionen zu feldgrößenspezifischen Gesetzen,
 * 1-5-Regel, Doppel-Inversion, Lookahead-Sperre, 2D-Interferenz,
 * Domino-Zerlegungen, Paar-Budgets und Unizitäts-Axiomen.
 */


const TUTORIAL_PATTERNS_STEPS = [
    {
        id: 1,
        title: "Muster 1: 4×4 Paar-Inversion",
        subtitle: "Budget-Erschöpfung im Mini-Gitter",
        mathPrinciple: "4×4 Paar-Inversion: 2 Sonnen verbrauchen Zeilen-Budget ⟹ Rest = Monde",
        description: `**Das Prinzip (4×4)**:\nIn einem 4×4 Gitter dürfen in jeder Zeile und Spalte genau **2 Sonnen** und **2 Monde** stehen. Sobald ein Paar aus zwei gleichen Symbolen existiert (\`☀️ ☀️ _ _\`), MÜSSEN die verbleibenden beiden Felder zwingend das **gegenteilige Paar** (\`🌙 🌙\`) sein!\n\n**Mathematischer Beweis**:\nDas Zeilen-Budget beträgt maximal 2 Sonnen. Zwei Sonnen verbrauchen das gesamte Kontingent (2 - 2 = 0). Für die restlichen 2 Felder verbleiben ausschließlich Monde.\n\n*Übung: Fülle die verbleibenden Felder in Zeile 1 und Zeile 3 durch Paar-Inversion aus!*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 2, val: MOON },
            { r: 0, c: 3, val: MOON },
            { r: 2, c: 0, val: SUN },
            { r: 2, c: 1, val: SUN }
        ],
        explanation: "Exzellent! Im 4x4 Gitter kippt ein Paar sofort alle restlichen Felder ins Gegenteil."
    },
    {
        id: 2,
        title: "Muster 2: 6×6 Paar-Limit",
        subtitle: "Maximal ein Paar desselben Symbols pro Zeile",
        mathPrinciple: "6×6 Paar-Limit: Max. 1 Sonnen-Paar pro 6er-Reihe erlaubt",
        description: `**Das Prinzip (6×6)**:\nIn einer 6er-Reihe (3 Sonnen, 3 Monde) kann es **höchstens EIN Sonnen-Paar** (\`☀️ ☀️\`) und **höchstens EIN Mond-Paar** (\`🌙 🌙\`) geben, da zwei Paare bereits 2 + 2 = 4 Symbole erfordern würden.\n\n**Mathematischer Beweis**:\nIn Zeile 1 stehen bereits das Sonnen-Paar an Pos 1–2 und eine 3. Sonne an Pos 4 (\`☀️ ☀️ 🌙 ☀️ _ _\`). Das Sonnen-Budget von 3 ist komplett aufgebraucht! Das durch \`[=]\` verbundene Paar an Pos 5–6 MUSS zwingend ein Mond-Paar (\`🌙 🌙\`) sein.\n\n*Übung: Bestimme den Wert des [=] Paares an Position 5 und 6!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 4, val: MOON },
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Brillant kombiniert! Da 6x6 maximal 1 Sonnen-Paar erlaubt und alle 3 Sonnen platziert sind, muss das [=] Paar aus Monden bestehen."
    },
    {
        id: 3,
        title: "Muster 3: Die 1-5-Regel (Rand-Abstand)",
        subtitle: "Verhinderung von Dreierketten in der Zeilenmitte",
        mathPrinciple: "1-5-Regel: Pos 1 = Pos 5 = ☀️ ⟹ Pos 6 = 🌙 (Mitte 2-3-4 vor 🌙🌙🌙 geschützt)",
        description: `**Das Prinzip (6×6)**:\nTragen in einer 6er-Reihe **Position 1 und Position 5 dasselbe Symbol** (z. B. \`☀️ _ _ _ ☀️ _\`), MUSS **Position 6 zwingend das Gegenteil** (\`🌙\`) sein!\n\n**Mathematischer Beweis**:\nWürde man an Position 6 ebenfalls eine Sonne setzen, stünden an Pos 5 und 6 zwei Sonnen (\`☀️ ☀️\`). Zusammen mit Position 1 wären alle 3 Sonnen der Zeile verbraucht. Die verbleibenden 3 Felder in der Mitte (Pos 2, 3, 4) müssten alle Monde sein (\`🌙 🌙 🌙\`) – eine verbotene 3er-Kette! Folglich MUSS Position 6 ein Mond (\`🌙\`) sein.\n\n*Übung: Bestimme Feld 6 in Zeile 1 und Feld 1 in Zeile 3 mit der 1-5-Regel!*`,
        size: 6,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 5, val: MOON },
            { r: 2, c: 0, val: SUN }
        ],
        explanation: "Hervorragend! Die 1-5-Regel sichert das Außenfeld, ohne dass die 3 mittleren Felder bekannt sein müssen."
    },
    {
        id: 4,
        title: "Muster 4: Die doppelte [×]-Kaskade",
        subtitle: "Zwei Negationen heben sich auf: ¬(¬A) = A",
        mathPrinciple: "Doppel-Inversion: (A [×] B [×] C) ⟹ A = C (Außenfelder identisch)",
        description: `**Das Prinzip**:\nSind drei Felder hintereinander durch zwei Gegenteils-Kanten verbunden (\`A [×] B [×] C\`), sind die beiden **Außenfelder A und C immer exakt GLEICH**!\n\n**Mathematischer Beweis**:\nFeld B ist das Gegenteil von A. Feld C ist wiederum das Gegenteil von B. Die doppelte Negation hebt sich auf: Ist Feld A eine Sonne \`☀️\`, ist Feld B ein Mond \`🌙\` und Feld C zwingend wieder eine Sonne \`☀️\`.\n\n*Übung: Löse die Kette in Zeile 1 über die Doppel-Inversion auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: MOON },
            { r: 0, c: 2, val: SUN }
        ],
        explanation: "Perfekt! Bei [×][×] haben die Außenfelder stets denselben Wert."
    },
    {
        id: 5,
        title: "Muster 5: Der Kanten-Vorausschau-Ausschluss",
        subtitle: "Verhinderung von 3er-Reihen über Gleichheits-Kopplung",
        mathPrinciple: "Lookahead-Sperre: (_ = _) ☀️ ⟹ Paar MUSS 🌙🌙 sein (Schutz vor ☀️☀️☀️)",
        description: `**Das Prinzip**:\nLiegen zwei durch \`[=]\` verbundene leere Felder direkt neben einem bekannten Symbol (\`_ = _ ☀️\`), MÜSSEN beide leeren Felder sofort das **Gegenteil** (\`🌙 🌙\`) annehmen!\n\n**Mathematischer Beweis**:\nWürden die beiden verbundenen Felder Sonnen annehmen, entstünde mit der Nachbarsonne sofort die unzulässige 3er-Reihe \`☀️ ☀️ ☀️\`. Folglich muss das gekoppelte Paar zwingend aus zwei Monden (\`🌙 🌙\`) bestehen.\n\n*Übung: Bestimme die beiden verbundenen Felder in Zeile 1!*`,
        size: 4,
        initialGrid: [
            [EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 0, val: MOON },
            { r: 0, c: 1, val: MOON }
        ],
        explanation: "Brillant! Durch die Kanten-Vorausschau löst du das Paar sofort ohne Raten auf."
    },
    {
        id: 6,
        title: "Muster 6: 6×6 Domino-Zerlegung (3-Blöcke-×)",
        subtitle: "Globales Zähl-Axiom disjunkter Gegenteilspaare",
        mathPrinciple: "6×6 Domino-Parität: Zwei [×]-Blöcke binden 2☀️ + 2🌙 ⟹ Block 3 = 1☀️ + 1🌙",
        description: `**Das Prinzip (6×6)**:\nJede 6er-Reihe lässt sich in drei 2er-Blöcke unterteilen: (Pos 1–2), (Pos 3–4), (Pos 5–6). Jedes \`[×]\` auf einem Block bindet exakt 1 Sonne und 1 Mond.\n\n**Mathematischer Beweis**:\nLiegen auf zwei Blöcken \`[×]\`-Kanten, sind bereits 2 Sonnen und 2 Monde vergeben. Für den 3. Block verbleibt genau **1 Sonne und 1 Mond**. Ist ein Feld des 3. Blocks bekannt, folgt das Nachbarfeld sofort als Inversion!\n\n*Übung: Bestimme Feld 6 in Zeile 1 mit Hilfe der Domino-Zerlegung!*`,
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Perfekt! Die beiden [×]-Dominos verbrauchen 2 Sonnen & 2 Monde – Feld 6 muss der Gegenpart zu Feld 5 sein."
    },
    {
        id: 7,
        title: "Muster 7: Budget-Kanten-Inkompatibilität",
        subtitle: "Abgleich zwischen Rest-Budget und Kanten-Typ",
        mathPrinciple: "Paritäts-Filter: Rest-Budget 1☀️ + 1🌙 schließt [=] aus ⟹ Erzwingt [×]",
        description: `**Das Prinzip**:\nSind in einer 6er-Reihe bereits 2 Sonnen und 2 Monde gesetzt (\`☀️ ☀️ 🌙 🌙 _ _\`), verbleiben genau **1 Sonne und 1 Mond**.\n\n**Mathematischer Beweis**:\nAuf den letzten beiden Feldern kann niemals ein \`[=]\` liegen, da \`[=]\` zwei identische Symbole verlangt. Eine \`[×]\`-Kante hingegen passt exakt zum Rest-Budget. Ist Feld 6 durch die schneidende Spalte als Mond (\`🌙\`) festgelegt, folgt Feld 5 sofort als Sonne (\`☀️\`)!\n\n*Übung: Nutze die Gegenteilskante, um Zeile 1 zu vollenden!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, SUN],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, SUN],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 4, val: SUN },
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Perfekt kombiniert! Der Paritäts-Filter verbindet Zeilen-Budget und Kantenlogik nahtlos."
    },
    {
        id: 8,
        title: "Muster 8: 2D-Kanten-Kreuzung (Eck-Interferenz)",
        subtitle: "Gleichzeitige Kanten horizontal und vertikal",
        mathPrinciple: "2D-Interferenz: (x = y) horizontal ∧ (x × z) vertikal ⟹ y und z sind Gegenteile",
        description: `**Das Prinzip**:\nGeht von einem Feld $X$ eine horizontale \`[=]\`-Kante nach rechts und eine vertikale \`[×]\`-Kante nach unten, **müssen der rechte und der untere Nachbar untereinander immer GEGENTEILE sein**!\n\n**Mathematischer Beweis**:\nDer rechte Nachbar $Y$ hat denselben Wert wie $X$ ($Y = X$). Der untere Nachbar $Z$ hat den gegenteiligen Wert ($Z = \\text{Gegenteil von } X$). Folglich ist $Z$ immer das Gegenteil von $Y$.\n\n*Übung: Löse die Nachbarfelder der Ecke (0,0) auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: SUN },
            { r: 1, c: 0, val: MOON }
        ],
        explanation: "Exzellent! 2D-Kanten-Interferenz koppelt Zeilen und Spalten über Ecken."
    },
    {
        id: 9,
        title: "Muster 9: Rand-Dopplung & 3er-Restfeld",
        subtitle: "Verhinderung verdeckter 3er-Ketten",
        mathPrinciple: "Restfeld-Ausschluss: [☀️☀️ 🌙🌙 _ _] ⟹ Pos 5 = ☀️, Pos 6 = 🌙 (3er-Schutz)",
        description: `**Das Prinzip (6×6)**:\nSteht am Zeilenanfang ein Paar \`[☀️ ☀️ 🌙 🌙 _ _]\`, fehlen in der Zeile noch genau **1 Sonne und 1 Mond**.\n\n**Mathematischer Beweis**:\nWürde an Position 5 ein Mond gesetzt, stünden dort drei Monde (\`🌙 🌙 🌙\`). Um die verbotene 3er-Kette zu verhindern, MUSS Position 5 die verbleibende Sonne (\`☀️\`) und Position 6 der Mond (\`🌙\`) sein!\n\n*Übung: Verhindere die 3er-Kette im Restfeld von Zeile 1!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 4, val: SUN },
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Hervorragend! Durch das 3er-Verbot muss die verbleibende Sonne an Position 5 stehen."
    },
    {
        id: 10,
        title: "Muster 10: Das 14-Muster-Gesetz",
        subtitle: "Strikte Zeilen-Unizität in 6×6",
        mathPrinciple: "6×6 Eindeutigkeit: 14 Zeilenmuster ⟹ Duplikate strikt verboten",
        description: `**Das Prinzip (6×6)**:\nEs gibt mathematisch überhaupt nur **14 gültige Zeilenmuster** für ein 6er-Gitter. Da 6 Zeilen im Gitter vorkommen, ist die Wahrscheinlichkeit für Duplikate extrem hoch.\n\n**Mathematischer Beweis**:\nZeile 1 ist \`☀️ 🌙 ☀️ 🌙 🌙 ☀️\`. Zeile 2 beginnt mit \`☀️ 🌙 ☀️ 🌙 _ _\`. Würde man für die Lücken \`🌙 ☀️\` wählen, wäre Zeile 2 identisch zu Zeile 1. Nach dem Unizitäts-Axiom MUSS daher zwingend \`☀️ 🌙\` gesetzt werden!\n\n*Übung: Fülle Zeile 2 so aus, dass kein Duplikat zu Zeile 1 entsteht!*`,
        size: 6,
        initialGrid: [
            [SUN, MOON, SUN, MOON, MOON, SUN],
            [SUN, MOON, SUN, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 1, c: 4, val: SUN },
            { r: 1, c: 5, val: MOON }
        ],
        explanation: "Perfekt! Das Unizitäts-Gesetz schließt das Zeilenduplikat zwingend aus."
    },
    {
        id: 11,
        title: "Muster 11: Skalierendes Paar-Budget (8×8)",
        subtitle: "Budget von 2 Paaren pro Zeile",
        mathPrinciple: "8×8 Paar-Budget: Max. 2 Sonnen-Paare (2×2=4) ⟹ Rest = Monde",
        description: `**Das Prinzip (8×8)**:\nIn einem 8×8 Gitter (4 Sonnen, 4 Monde) darf es maximal **zwei Sonnen-Paare** geben (2 × 2 = 4).\n\n**Mathematischer Beweis**:\nSind in einer Zeile bereits zwei Sonnen-Paare gesetzt (\`☀️ ☀️\` an Pos 1-2 und Pos 5-6), ist das Sonnen-Budget von 4 vollständig erschöpft. Die verbleibenden leeren Felder an Pos 7 und 8 MÜSSEN Monde sein!\n\n*Übung: Fülle die verbleibenden Felder am Ende der 8er-Zeile auf!*`,
        size: 8,
        initialGrid: [
            [SUN, SUN, MOON, MOON, SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 6, val: MOON },
            { r: 0, c: 7, val: MOON }
        ],
        explanation: "Klasse! Bei 8x8 verbrauchen 2 Sonnen-Paare das gesamte Budget von 4 Sonnen."
    },
    {
        id: 12,
        title: "Muster 12: 10×10 Paar-Limit",
        subtitle: "Maximal 2 Paare desselben Symbols bei 5er-Budget",
        mathPrinciple: "10×10 Paar-Budget: Max. 2 Sonnen-Paare (2×2=4 < 5) ⟹ 5. Sonne ist Einzelsymbol",
        description: `**Das Prinzip (10×10)**:\nIn einem 10×10 Gitter (5 Sonnen, 5 Monde) darf es **maximal ZWEI Sonnen-Paare** und **maximal ZWEI Mond-Paare** pro Zeile geben!\n\n**Mathematischer Beweis**:\nDrei Paare würden $3 \\times 2 = 6$ Symbole verbrauchen. Da das Zeilenkontingent genau 5 Sonnen beträgt, können höchstens 2 Paare ($2 \\times 2 = 4$) existieren. Die 5. Sonne MUSS als einzelnes isoliertes Symbol stehen.\n\n*Übung: Fülle die verbleibenden beiden Felder am Ende der 10er-Zeile auf!*`,
        size: 10,
        initialGrid: [
            [SUN, SUN, MOON, MOON, SUN, SUN, MOON, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 8, val: MOON },
            { r: 0, c: 9, val: MOON }
        ],
        explanation: "Grandios! Bei 10x10 verbrauchen 2 Paare + 1 Einzelsonne das gesamte Budget von 5 Sonnen."
    },
    {
        id: 13,
        title: "Muster 13: Die universell verbotene =-Kette",
        subtitle: "Transitives Verbot von Doppel-Gleichheitskanten",
        mathPrinciple: "Axiom: Verbot von Doppel-Gleichheitsketten (= = Verstoß gegen 3er-Regel)",
        description: `**Das Prinzip (Alle Feldgrößen)**:\nZwei aufeinanderfolgende Gleichheitszeichen (\`_ = _ = _\`) sind auf JEDER Feldgröße strikt unzulässig!\n\n**Mathematischer Beweis**:\nSind Feld 1 und Feld 2 gleich und Feld 2 und Feld 3 ebenfalls gleich, müssten alle 3 Felder dasselbe Symbol tragen. Dies erzwingt eine verbotene 3er-Kette. Folglich kann nach einem \`[=]\` niemals sofort ein zweites \`[=]\` folgen – dort MUSS immer ein \`[×]\` oder keine Kante liegen.\n\n*Übung: Da Feld 1 und 2 durch [=] gleich sind, MUSS Feld 3 das Gegenteil sein!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: SUN },
            { r: 0, c: 2, val: MOON }
        ],
        explanation: "Exzellent! Nach jedem [=] muss das nächste Feld das Gegenteil sein, um 3er-Ketten zu meiden."
    },
    {
        id: 14,
        title: "Muster 14: Meisterprüfung der Regelmäßigkeiten",
        subtitle: "Wende alle Feldgrößen-Gesetze auf ein 6×6 Gitter an",
        mathPrinciple: "Synthese aller Axiome: 1-5-Regel + Doppel-Inversion + Domino-Zerlegung + Paar-Limits",
        description: `**Die Meisterprüfung**:\nNutze alle gelernten Regelmäßigkeiten:\n1. **1-5-Regel & Paar-Budget**\n2. **Doppel-Inversion & Domino-Parität**\n3. **3er-Sperre & Zeilen-Unizität**\n\n*Aufgabe: Löse dieses anspruchsvolle 6×6 Gitter fehlerfrei!*`,
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, SUN, EMPTY, MOON, EMPTY],
            [EMPTY, MOON, EMPTY, MOON, EMPTY, MOON],
            [MOON, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, MOON, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_EQUAL, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_OPPOSITE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: null, // Komplett lösen
        explanation: "Grandios! Du hast alle Feldgrößen-Gesetze und Meister-Muster gemeistert und bist nun ein wahrer Tango-Großmeister!"
    }
];

// === Source: js\data\levels.js ===
/**
 * Tango Level & Tagesrätsel-Generierung
 */


function getCampaignLevel(levelIndex) {
    // Bestimme Gittergröße und Schwierigkeitsgrad nach Level-Fortschritt (120 Level in 4 Kapiteln)
    let size, difficulty;
    if (levelIndex < 10) {
        // Kapitel 1: Level 1–10 (4×4 Einfach)
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 20) {
        // Kapitel 1: Level 11–20 (6×6 Einfach)
        size = 6;
        difficulty = 'easy';
    } else if (levelIndex < 30) {
        // Kapitel 1: Level 21–30 (6×6 Mittel)
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 45) {
        // Kapitel 2: Level 31–45 (6×6 Mittel)
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 60) {
        // Kapitel 2: Level 46–60 (6×6 Schwer)
        size = 6;
        difficulty = 'hard';
    } else if (levelIndex < 75) {
        // Kapitel 3: Level 61–75 (8×8 Mittel)
        size = 8;
        difficulty = 'medium';
    } else if (levelIndex < 90) {
        // Kapitel 3: Level 76–90 (8×8 Schwer)
        size = 8;
        difficulty = 'hard';
    } else if (levelIndex < 105) {
        // Kapitel 4: Level 91–105 (8×8 Meister)
        size = 8;
        difficulty = 'hard';
    } else {
        // Kapitel 4: Level 106–120 (10×10 Meister)
        size = 10;
        difficulty = 'hard';
    }

    // Deterministischer Seed pro Level
    const seed = 5000 + (levelIndex + 1) * 113;
    const generated = TangoGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1}`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Tagesrätsel basierend auf dem Datum (JJJJ-MM-TT)
 */
function getDailyPuzzle(dateStr) {
    // Wandle Datum in Integer-Seed um (z.B. "2026-08-21" -> 20260821)
    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    // Wähle Größe je nach Wochentag (Wochenende = 8x8, Werktags = 6x6)
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
    const size = isWeekend ? 8 : 6;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = TangoGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        name: `Tagesrätsel (${dateStr})`,
        ...generated
    };
}

// === Source: js\ui\audio.js ===
/**
 * Tango Web Audio Synthesizer
 * Erzeugt hochwertige, latenzfreie Soundeffekte ohne externe MP3/WAV-Dateien.
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.vibrationEnabled = true;
        this.vibrationStrength = 'medium'; // Standardmäßig auf Standard gesetzt

        // Lade Einstellungen
        try {
            const savedSound = localStorage.getItem('tango_sound');
            if (savedSound !== null) this.enabled = savedSound === 'true';

            const savedVib = localStorage.getItem('tango_vibration');
            if (savedVib !== null) this.vibrationEnabled = savedVib === 'true';

            const savedVibStr = localStorage.getItem('tango_vibration_strength');
            if (savedVibStr !== null) this.vibrationStrength = savedVibStr;
        } catch (e) {
            console.warn('localStorage in audio.js nicht zugreifbar:', e);
        }
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSound(enabled) {
        this.enabled = enabled;
        try {
            localStorage.setItem('tango_sound', enabled);
        } catch (e) {}
    }

    setVibration(enabled) {
        this.vibrationEnabled = enabled;
        try {
            localStorage.setItem('tango_vibration', enabled);
        } catch (e) {}
    }

    setVibrationStrength(strength) {
        this.vibrationStrength = strength;
        try {
            localStorage.setItem('tango_vibration_strength', strength);
        } catch (e) {}
        this.vibrate(40);
    }

    getVibrationMultiplier() {
        switch (this.vibrationStrength) {
            case 'ultra': return 2.2;
            case 'strong': return 1.5;
            case 'soft': return 0.5;
            case 'medium':
            default: return 1.0;
        }
    }

    vibrate(pattern = 70) {
        if (this.vibrationEnabled && 'vibrate' in navigator) {
            try {
                const mult = this.getVibrationMultiplier();
                let scaledPattern;
                if (typeof pattern === 'number') {
                    scaledPattern = Math.max(30, Math.round(pattern * mult));
                } else if (Array.isArray(pattern)) {
                    scaledPattern = pattern.map((val, idx) => {
                        return (idx % 2 === 0) ? Math.max(30, Math.round(val * mult)) : val;
                    });
                } else {
                    scaledPattern = pattern;
                }
                navigator.vibrate(scaledPattern);
            } catch (e) {
                // Ignore if not permitted
            }
        }
    }

    playSun() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
        this.vibrate(70);
    }

    playMoon() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
        this.vibrate(95);
    }

    playClear() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
        this.vibrate(50);
    }

    playHint() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [587.33, 880, 1174.66]; // D5, A5, D6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.18, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.25);
        });
        this.vibrate([70, 50, 90]);
    }

    playError() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(110, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
        this.vibrate([100, 50, 100, 50, 100]);
    }

    playVictory() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Siegesfanfare: C4, E4, G4, C5 mit kurzem Sustain
        const chords = [
            { freq: 261.63, time: 0.0, dur: 0.15 },
            { freq: 329.63, time: 0.12, dur: 0.15 },
            { freq: 392.00, time: 0.24, dur: 0.18 },
            { freq: 523.25, time: 0.40, dur: 0.60 }
        ];

        chords.forEach(c => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(c.freq, now + c.time);

            gain.gain.setValueAtTime(0.25, now + c.time);
            gain.gain.exponentialRampToValueAtTime(0.001, now + c.time + c.dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + c.time);
            osc.stop(now + c.time + c.dur);
        });

        this.vibrate([80, 50, 90, 50, 120, 60, 200]);
    }
}

const audio = new AudioManager();

// === Source: js\ui\animations.js ===
/**
 * Tango Visual FX & Animations
 * Konfetti-Partikel und Siegesanimationen auf einem HTML5-Canvas
 */

class AnimationManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animId = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    launchConfetti() {
        if (!this.canvas || !this.ctx) return;
        this.resize();
        this.particles = [];

        const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#ffd700'];
        const count = 120;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.canvas.width * 0.5 + (Math.random() - 0.5) * 50,
                y: this.canvas.height * 0.4 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.9) * 18 - 4,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.35,
                opacity: 1,
                shape: Math.random() > 0.4 ? 'rect' : 'circle'
            });
        }

        if (this.animId) cancelAnimationFrame(this.animId);
        this.render();
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let activeParticles = 0;
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.98;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.008;

            if (p.opacity > 0 && p.y < this.canvas.height + 50) {
                activeParticles++;
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, p.opacity);
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.fillStyle = p.color;

                if (p.shape === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                }

                this.ctx.restore();
            }
        }

        if (activeParticles > 0) {
            this.animId = requestAnimationFrame(() => this.render());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

const animations = new AnimationManager();

// === Source: js\ui\app.js ===
/**
 * Tango Main UI Controller
 * Verbindet Spiellogik, Rendering, Touch-Interaktion, Audio und Lokalisierung.
 */


function getSunSvg(extraClass = '') {
    return `<svg class="tango-symbol tango-sun ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="1.6" x2="12" y2="3.8"/><line x1="12" y1="20.2" x2="12" y2="22.4"/><line x1="1.6" y1="12" x2="3.8" y2="12"/><line x1="20.2" y1="12" x2="22.4" y2="12"/><line x1="4.6" y1="4.6" x2="6.2" y2="6.2"/><line x1="17.8" y1="17.8" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.2" y2="17.8"/><line x1="17.8" y1="6.2" x2="19.4" y2="4.6"/></g></svg>`;
}

function getMoonSvg(extraClass = '') {
    return `<svg class="tango-symbol tango-moon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 12.5A9.5 9.5 0 1 1 11.5 2.5a7.5 7.5 0 0 0 10 10z" fill="currentColor"/></svg>`;
}

function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds === null || isNaN(seconds) || seconds < 0) {
        return '-';
    }
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function calculateStreaks(history = [], todayStr = null) {
    if (!Array.isArray(history) || history.length === 0) {
        return { currentStreak: 0, maxStreak: 0 };
    }

    const validDates = history.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (validDates.length === 0) {
        return { currentStreak: 0, maxStreak: 0 };
    }

    const parseToUtcDays = (dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
    };

    const uniqueDays = Array.from(new Set(validDates.map(parseToUtcDays))).sort((a, b) => a - b);
    if (uniqueDays.length === 0) {
        return { currentStreak: 0, maxStreak: 0 };
    }

    let maxStreak = 0;
    let currentRun = 0;
    let prevDay = null;

    for (const day of uniqueDays) {
        if (prevDay !== null && day === prevDay + 1) {
            currentRun++;
        } else {
            currentRun = 1;
        }
        if (currentRun > maxStreak) {
            maxStreak = currentRun;
        }
        prevDay = day;
    }

    const now = new Date();
    const todayFormatted = todayStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDay = parseToUtcDays(todayFormatted);

    const daySet = new Set(uniqueDays);
    let currentStreak = 0;

    if (daySet.has(todayDay)) {
        let check = todayDay;
        while (daySet.has(check)) {
            currentStreak++;
            check--;
        }
    } else if (daySet.has(todayDay - 1)) {
        let check = todayDay - 1;
        while (daySet.has(check)) {
            currentStreak++;
            check--;
        }
    } else {
        currentStreak = 0;
    }

    return { currentStreak, maxStreak };
}

class TangoApp {
    constructor() {
        this.engine = new TangoEngine(6);
        this.currentMode = 'campaign'; // 'campaign' | 'daily' | 'free' | 'tutorial'
        this.campaignLevelIndex = 0;
        this.selectedCampaignChapter = 0;
        this.tutorialStepIndex = 0;
        this.selectedCell = null;
        this.isNoteMode = false;
        
        // Timer & Statistiken
        this.timerInterval = null;
        this.secondsElapsed = 0;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.isGameActive = false;
        this.ignoreClickUntil = 0;

        // Einstellungen
        this.autoCheck = true;
        this.inputMode = 'cycle'; // 'cycle' | 'keypad'
        this.currentTheme = 'dark';
        this.reminderEnabled = false;
        this.reminderTime = '09:00';
        this.reminderDismissed = false;
        this.freePlaySize = 6;
        this.freePlayDiff = 'medium';

        this.init();
    }

    init() {
        // Globaler Fehler-Handler
        window.addEventListener('error', (e) => {
            const container = document.getElementById('debugErrorBanner');
            const msgEl = document.getElementById('debugErrorText');
            if (container && msgEl) {
                container.style.display = 'block';
                msgEl.textContent = `Fehler: ${e.message || e}`;
            }
        });
        window.addEventListener('unhandledrejection', (e) => {
            const container = document.getElementById('debugErrorBanner');
            const msgEl = document.getElementById('debugErrorText');
            if (container && msgEl) {
                container.style.display = 'block';
                msgEl.textContent = `Promise Fehler: ${e.reason?.message || e.reason}`;
            }
        });

        this.loadSettings();
        this.applyTheme(this.currentTheme);
        animations.init(document.getElementById('confettiCanvas'));
        this.bindEvents();
        this.updateI18n();
        this.checkDailyReminder();
        this.checkDailySystemNotification();
        this.notifCheckInterval = setInterval(() => this.checkDailySystemNotification(), 30000);

        // Starte mit der Kampagne oder dem Tutorial falls neu
        const completedLevels = this.getCompletedLevels();
        if (completedLevels.length === 0) {
            this.startTutorial(0);
        } else {
            this.startCampaignLevel(completedLevels.length);
        }
    }

    loadSettings() {
        try {
            const savedTheme = localStorage.getItem('tango_theme');
            if (savedTheme) this.currentTheme = savedTheme;

            const savedSound = localStorage.getItem('tango_sound');
            if (savedSound !== null) audio.enabled = savedSound === 'true';

            const savedVib = localStorage.getItem('tango_vibration');
            if (savedVib !== null) audio.vibrationEnabled = savedVib === 'true';

            const savedVibStrength = localStorage.getItem('tango_vibration_strength');
            if (savedVibStrength) audio.vibrationStrength = savedVibStrength;

            const savedAutoCheck = localStorage.getItem('tango_auto_check');
            if (savedAutoCheck !== null) this.autoCheck = savedAutoCheck === 'true';

            const savedInput = localStorage.getItem('tango_input_mode');
            if (savedInput) this.inputMode = savedInput;

            const savedRem = localStorage.getItem('tango_reminder_enabled');
            if (savedRem !== null) this.reminderEnabled = savedRem === 'true';

            const savedRemTime = localStorage.getItem('tango_reminder_time');
            if (savedRemTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(savedRemTime)) {
                this.reminderTime = savedRemTime;
            }
        } catch (e) {
            console.warn('localStorage konnte nicht gelesen werden:', e);
        }
    }

    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        this.currentTheme = theme;
        try {
            localStorage.setItem('tango_theme', theme);
        } catch (e) {}
        this.updateMenuSettings();
    }

    updateI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
        this.updateMenuSettings();
        this.updateFreePlayLabels();
    }

    bindEvents() {
        // Navigation / Menüs
        document.getElementById('btnMenu').addEventListener('click', () => this.openMenuTab('play'));
        document.getElementById('btnCloseMenu').addEventListener('click', () => this.toggleModal('menuModal', false));

        // Menü-Hub Tabs
        document.getElementById('tabMenuPlay')?.addEventListener('click', () => this.switchMenuTab('play'));
        document.getElementById('tabMenuRules')?.addEventListener('click', () => this.switchMenuTab('rules'));
        document.getElementById('tabMenuStats')?.addEventListener('click', () => this.switchMenuTab('stats'));
        document.getElementById('tabMenuSettings')?.addEventListener('click', () => this.switchMenuTab('settings'));

        document.getElementById('btnSettings')?.addEventListener('click', () => this.openMenuTab('settings'));
        document.getElementById('btnCloseSettings')?.addEventListener('click', () => this.toggleModal('settingsModal', false));
        document.getElementById('btnStats')?.addEventListener('click', () => this.openMenuTab('stats'));
        document.getElementById('btnCloseStats')?.addEventListener('click', () => this.toggleModal('statsModal', false));
        document.getElementById('btnRules')?.addEventListener('click', () => this.openMenuTab('rules'));
        document.getElementById('btnCloseRules')?.addEventListener('click', () => this.toggleModal('rulesModal', false));

        // Spielmodi-Auswahl im Menü
        document.getElementById('navTutorial')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startTutorial(0);
        });
        document.getElementById('navTutorialPro')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startTutorialPro(0);
        });
        document.getElementById('navTutorialPatterns')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startTutorialPatterns(0);
        });
        document.getElementById('navCampaign').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.openLevelSelectModal();
        });
        document.getElementById('navDaily').addEventListener('click', () => {
            this.requestStartDailyPuzzle();
        });
        document.getElementById('navFree').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.openFreePlayModal();
        });

        // Spiel-Aktionen
        document.getElementById('btnUndo').addEventListener('click', () => this.handleUndo());
        document.getElementById('btnRedo').addEventListener('click', () => this.handleRedo());
        document.getElementById('btnHint').addEventListener('click', () => this.handleHint());
        document.getElementById('btnRestart').addEventListener('click', () => this.restartCurrentPuzzle());
        document.getElementById('btnNotes').addEventListener('click', () => this.toggleNoteMode());

        // Keypad-Eingaben
        document.getElementById('keypadSun')?.addEventListener('click', () => this.applyKeypadInput(SUN));
        document.getElementById('keypadMoon')?.addEventListener('click', () => this.applyKeypadInput(MOON));
        document.getElementById('keypadClear')?.addEventListener('click', () => this.applyKeypadInput(EMPTY));

        // Dialog-Aktionen
        document.getElementById('btnVictoryNext').addEventListener('click', () => {
            this.toggleModal('victoryModal', false);
            if (this.currentMode === 'tutorial') {
                if (this.tutorialStepIndex + 1 < TUTORIAL_STEPS.length) {
                    this.startTutorial(this.tutorialStepIndex + 1);
                } else {
                    this.startTutorialPro(0);
                }
            } else if (this.currentMode === 'tutorial_pro') {
                if (this.tutorialStepIndex + 1 < TUTORIAL_PRO_STEPS.length) {
                    this.startTutorialPro(this.tutorialStepIndex + 1);
                } else {
                    this.startTutorialPatterns(0);
                }
            } else if (this.currentMode === 'tutorial_patterns') {
                if (this.tutorialStepIndex + 1 < TUTORIAL_PATTERNS_STEPS.length) {
                    this.startTutorialPatterns(this.tutorialStepIndex + 1);
                } else {
                    this.startCampaignLevel(0);
                }
            } else if (this.currentMode === 'campaign') {
                this.startCampaignLevel(this.campaignLevelIndex + 1);
            } else if (this.currentMode === 'free') {
                this.openFreePlayModal();
            } else {
                this.openMenuTab('play');
            }
        });

        document.getElementById('btnHintApply').addEventListener('click', () => {
            if (this.currentHint) {
                this.engine.setCellValue(this.currentHint.r, this.currentHint.c, this.currentHint.value);
                audio.playSun();
                this.renderGrid();
                this.toggleModal('hintModal', false);
                this.checkCompletion();
            }
        });
        document.getElementById('btnCloseHint').addEventListener('click', () => this.toggleModal('hintModal', false));
        document.getElementById('btnCloseLevelSelect')?.addEventListener('click', () => this.toggleModal('levelSelectModal', false));

        // Sicherheitsabfrage & Lösungsaufdeckung Listener
        document.getElementById('btnCancelReveal')?.addEventListener('click', () => this.toggleModal('confirmRevealModal', false));
        document.getElementById('btnConfirmReveal')?.addEventListener('click', () => this.revealSolutionAndSurrender());
        document.getElementById('btnProceedToDefeatModal')?.addEventListener('click', () => {
            if (Date.now() < this.ignoreClickUntil) return;
            this.openSolutionRevealedModal();
        });
        document.getElementById('btnRevealRestart')?.addEventListener('click', () => {
            this.toggleModal('solutionRevealedModal', false);
            this.restartCurrentPuzzle();
        });
        document.getElementById('btnRevealMenu')?.addEventListener('click', () => {
            this.toggleModal('solutionRevealedModal', false);
            if (this.currentMode === 'campaign') {
                this.openLevelSelectModal();
            } else if (this.currentMode === 'free') {
                this.openFreePlayModal();
            } else {
                this.openMenuTab('play');
            }
        });

        // Kampagnen-Kapitel Tabs
        const chapterTabs = document.getElementById('campaignChapterTabs');
        if (chapterTabs) {
            chapterTabs.addEventListener('click', (e) => {
                const btn = e.target.closest('.chapter-tab-btn');
                if (!btn) return;
                const chapter = parseInt(btn.dataset.chapter, 10);
                if (!isNaN(chapter)) {
                    this.switchCampaignChapter(chapter);
                }
            });
        }

        // Settings Trigger Buttons (Maßgeschneiderte In-Game Auswahldialoge)
        document.getElementById('btnThemePicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('setting_theme'),
                options: [
                    { value: 'dark', label: t('setting_theme_dark'), subtitle: 'Ausgewogen & modern' },
                    { value: 'amoled', label: t('setting_theme_amoled'), subtitle: 'Tiefschwarz & stromsparend' },
                    { value: 'light', label: t('setting_theme_light'), subtitle: 'Hell & minimalistisch' },
                    { value: 'wood', label: t('setting_theme_wood'), subtitle: 'Natürliche Holztöne' },
                    { value: 'cyberpunk', label: t('setting_theme_cyberpunk'), subtitle: 'Futuristisch & leuchtend' }
                ],
                currentValue: this.currentTheme,
                onSelect: (val) => this.applyTheme(val)
            });
        });

        document.getElementById('btnVibPicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('setting_vibration_strength'),
                options: [
                    { value: 'medium', label: t('setting_vib_medium'), subtitle: 'Standard-Haptik' },
                    { value: 'strong', label: t('setting_vib_strong'), subtitle: 'Kräftiges Feedback (Empfohlen)' },
                    { value: 'ultra', label: t('setting_vib_ultra'), subtitle: 'Maximaler Impuls' },
                    { value: 'soft', label: t('setting_vib_soft'), subtitle: 'Dezenter Klick' }
                ],
                currentValue: audio.vibrationStrength,
                onSelect: (val) => {
                    audio.setVibrationStrength(val);
                    this.updateMenuSettings();
                }
            });
        });

        document.getElementById('btnLangPicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('setting_language'),
                options: [
                    { value: 'de', label: 'Deutsch', subtitle: 'German' },
                    { value: 'en', label: 'English', subtitle: 'Englisch' }
                ],
                currentValue: getLang(),
                onSelect: (val) => {
                    setLang(val);
                    this.updateI18n();
                }
            });
        });

        document.getElementById('btnTimePicker')?.addEventListener('click', () => {
            this.openCustomTimePickerModal(this.reminderTime, (newTime) => {
                this.setReminderTime(newTime);
                this.updateMenuSettings();
            });
        });

        document.getElementById('btnCloseCustomSelect')?.addEventListener('click', () => {
            this.toggleModal('customSelectModal', false);
        });

        // Freies Spiel Trigger Buttons
        document.getElementById('btnFreePlaySizePicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('free_size'),
                options: [
                    { value: 4, label: t('free_size_4'), subtitle: '4 × 4 Gitter' },
                    { value: 6, label: t('free_size_6'), subtitle: '6 × 6 Gitter' },
                    { value: 8, label: t('free_size_8'), subtitle: '8 × 8 Gitter' },
                    { value: 10, label: t('free_size_10'), subtitle: '10 × 10 Gitter' }
                ],
                currentValue: this.freePlaySize,
                onSelect: (val) => {
                    this.freePlaySize = val;
                    this.updateFreePlayLabels();
                }
            });
        });

        document.getElementById('btnFreePlayDiffPicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('free_diff'),
                options: [
                    { value: 'easy', label: t('free_diff_easy'), subtitle: 'Für Einsteiger' },
                    { value: 'medium', label: t('free_diff_medium'), subtitle: 'Standard-Herausforderung' },
                    { value: 'hard', label: t('free_diff_hard'), subtitle: 'Für Fortgeschrittene' }
                ],
                currentValue: this.freePlayDiff,
                onSelect: (val) => {
                    this.freePlayDiff = val;
                    this.updateFreePlayLabels();
                }
            });
        });

        document.getElementById('settingSoundToggle')?.addEventListener('change', (e) => audio.setSound(e.target.checked));
        document.getElementById('settingVibrationToggle')?.addEventListener('change', (e) => audio.setVibration(e.target.checked));
        document.getElementById('settingAutoCheckToggle')?.addEventListener('change', (e) => {
            this.autoCheck = e.target.checked;
            localStorage.setItem('tango_auto_check', this.autoCheck);
            this.renderGrid();
        });
        document.getElementById('settingReminderToggle')?.addEventListener('change', (e) => {
            this.setReminderEnabled(e.target.checked);
        });
        document.getElementById('btnPlayDailyFromReminder')?.addEventListener('click', () => {
            this.dismissReminderBanner();
            this.requestStartDailyPuzzle();
        });
        document.getElementById('btnCloseDailyReminder')?.addEventListener('click', () => {
            this.dismissReminderBanner();
        });

        // Spielstand zurücksetzen (mit schicker In-Game Sicherheitsabfrage)
        document.getElementById('btnResetProgress')?.addEventListener('click', async () => {
            const confirmed = await this.showConfirmDialog({
                title: t('setting_reset_data'),
                message: t('setting_reset_confirm'),
                confirmText: t('btn_confirm_reset'),
                cancelText: t('btn_cancel'),
                isDanger: true
            });
            if (confirmed) {
                try {
                    localStorage.removeItem('tango_campaign_completed');
                    localStorage.removeItem('tango_campaign_stars');
                    localStorage.removeItem('tango_daily_completed');
                    localStorage.removeItem('tango_daily_streak');
                    localStorage.removeItem('tango_daily_history');
                } catch (e) {}
                this.toggleModal('settingsModal', false);
                this.toggleModal('menuModal', false);
                audio.playClear();
                this.checkDailyReminder();
            }
        });

        // Statistik zurücksetzen (mit schicker In-Game Sicherheitsabfrage)
        const handleResetStats = async () => {
            const confirmed = await this.showConfirmDialog({
                title: t('stats_reset_btn'),
                message: t('stats_reset_confirm'),
                confirmText: t('btn_confirm_reset'),
                cancelText: t('btn_cancel'),
                isDanger: true
            });
            if (confirmed) {
                try {
                    localStorage.removeItem('tango_stats');
                } catch (e) {}
                this.updateMenuStats();
                audio.playClear();
            }
        };
        document.getElementById('btnResetStats')?.addEventListener('click', handleResetStats);
        document.getElementById('btnResetStatsModal')?.addEventListener('click', handleResetStats);
    }

    startTimer() {
        this.stopTimer();
        this.secondsElapsed = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            if (this.isGameActive) {
                this.secondsElapsed++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
        const el = document.getElementById('gameTimer');
        if (el) el.textContent = `${mins}:${secs}`;
    }

    startTutorial(stepIndex = 0) {
        this.currentMode = 'tutorial';
        this.tutorialStepIndex = stepIndex;
        const step = TUTORIAL_STEPS[stepIndex];
        
        this.engine.loadPuzzle({
            size: step.size,
            initialGrid: step.initialGrid,
            hEdges: step.hEdges,
            vEdges: step.vEdges
        });

        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.startTimer();

        // Tutorial-Header einblenden & nach oben scrollen
        this.scrollToTop();
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) {
            tutHeader.scrollTop = 0;
            tutHeader.style.display = 'block';
            document.getElementById('tutTitle').textContent = step.title;
            document.getElementById('tutSubtitle').textContent = step.subtitle;
            const mathBadge = document.getElementById('tutMathPrinciple');
            if (mathBadge) mathBadge.style.display = 'none';
            document.getElementById('tutDesc').innerHTML = step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        document.getElementById('levelTitle').textContent = `Grundlagen ${stepIndex + 1}/${TUTORIAL_STEPS.length}`;

        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startTutorialPro(stepIndex = 0) {
        this.currentMode = 'tutorial_pro';
        this.tutorialStepIndex = stepIndex;
        const step = TUTORIAL_PRO_STEPS[stepIndex];
        
        this.engine.loadPuzzle({
            size: step.size,
            initialGrid: step.initialGrid,
            hEdges: step.hEdges,
            vEdges: step.vEdges
        });

        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.startTimer();

        this.scrollToTop();
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) {
            tutHeader.scrollTop = 0;
            tutHeader.style.display = 'block';
            document.getElementById('tutTitle').textContent = step.title;
            document.getElementById('tutSubtitle').textContent = step.subtitle;
            const mathBadge = document.getElementById('tutMathPrinciple');
            if (mathBadge) {
                mathBadge.style.display = 'block';
                mathBadge.textContent = step.mathPrinciple;
            }
            document.getElementById('tutDesc').innerHTML = step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        document.getElementById('levelTitle').textContent = `Mathematik ${stepIndex + 1}/${TUTORIAL_PRO_STEPS.length}`;

        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startTutorialPatterns(stepIndex = 0) {
        this.currentMode = 'tutorial_patterns';
        this.tutorialStepIndex = stepIndex;
        const step = TUTORIAL_PATTERNS_STEPS[stepIndex];
        
        this.engine.loadPuzzle({
            size: step.size,
            initialGrid: step.initialGrid,
            hEdges: step.hEdges,
            vEdges: step.vEdges
        });

        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.startTimer();

        this.scrollToTop();
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) {
            tutHeader.scrollTop = 0;
            tutHeader.style.display = 'block';
            document.getElementById('tutTitle').textContent = step.title;
            document.getElementById('tutSubtitle').textContent = step.subtitle;
            const mathBadge = document.getElementById('tutMathPrinciple');
            if (mathBadge) {
                mathBadge.style.display = 'block';
                mathBadge.textContent = step.mathPrinciple;
            }
            document.getElementById('tutDesc').innerHTML = step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        document.getElementById('levelTitle').textContent = `Muster ${stepIndex + 1}/${TUTORIAL_PATTERNS_STEPS.length}`;

        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startCampaignLevel(levelIndex) {
        this.currentMode = 'campaign';
        this.campaignLevelIndex = levelIndex;
        const level = getCampaignLevel(levelIndex);

        this.engine.loadPuzzle(level);
        this.scrollToTop();
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.startTimer();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        document.getElementById('levelTitle').textContent = `${t('status_level')} ${levelIndex + 1}`;
        this.renderGrid();
        this.updateKeypadVisibility();
    }

    isDailyPuzzleCompleted(dateStr = new Date().toISOString().slice(0, 10)) {
        try {
            const history = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
            return Array.isArray(history) && history.includes(dateStr);
        } catch (e) {
            return false;
        }
    }

    async requestStartDailyPuzzle() {
        const today = new Date().toISOString().slice(0, 10);
        if (this.isDailyPuzzleCompleted(today)) {
            const confirmed = await this.showConfirmDialog({
                title: t('daily_replay_title'),
                message: t('daily_replay_confirm'),
                confirmText: t('daily_btn_replay'),
                cancelText: t('btn_cancel'),
                isDanger: false
            });
            if (!confirmed) {
                return;
            }
        }
        this.toggleModal('menuModal', false);
        this.startDailyPuzzle();
    }

    startDailyPuzzle() {
        this.currentMode = 'daily';
        const today = new Date().toISOString().slice(0, 10);
        const puzzle = getDailyPuzzle(today);

        this.engine.loadPuzzle(puzzle);
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.startTimer();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        document.getElementById('levelTitle').textContent = `${t('nav_daily')} (${today})`;
        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startFreePlay(size, difficulty) {
        this.currentMode = 'free';
        const generated = TangoGenerator.generatePuzzle({ size, difficulty });

        this.engine.loadPuzzle(generated);
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.startTimer();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        document.getElementById('levelTitle').textContent = `${t('nav_free')} ${size}×${size}`;
        this.renderGrid();
        this.updateKeypadVisibility();
    }

    restartCurrentPuzzle() {
        this.engine.loadPuzzle({
            size: this.engine.size,
            initialGrid: this.engine.initialGrid,
            hEdges: this.engine.hEdges,
            vEdges: this.engine.vEdges,
            solution: this.engine.solution
        });
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.startTimer();
        this.renderGrid();
        audio.playClear();
    }

    toggleNoteMode() {
        this.isNoteMode = !this.isNoteMode;
        const btn = document.getElementById('btnNotes');
        if (btn) btn.classList.toggle('active', this.isNoteMode);
        audio.vibrate(30);
    }

    updateKeypadVisibility() {
        const keypadEl = document.getElementById('gameKeypad');
        if (keypadEl) {
            keypadEl.style.display = (this.inputMode === 'keypad') ? 'flex' : 'none';
        }
    }

    scrollToTop() {
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.scrollTop = 0;
        const appRoot = document.getElementById('appRoot');
        if (appRoot) appRoot.scrollTop = 0;
        window.scrollTo(0, 0);
    }

    renderGrid() {
        const container = document.getElementById('boardContainer');
        if (!container) return;

        container.innerHTML = '';
        const size = this.engine.size;
        container.style.setProperty('--grid-size', size);

        // Erstelle Gitter-Element
        const gridEl = document.createElement('div');
        gridEl.className = `tango-grid size-${size}`;

        const validation = this.autoCheck ? this.engine.validateRules() : { conflictCells: new Set() };
        const solution = this.solutionRevealed ? this.engine.getSolution() : null;

        for (let r = 0; r < size; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'grid-row';

            for (let c = 0; c < size; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'grid-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                const val = this.engine.grid[r][c];
                const isLocked = this.engine.locked[r][c];
                const isConflict = !this.solutionRevealed && validation.conflictCells.has(`${r},${c}`);
                const isSelected = !this.solutionRevealed && this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c;

                if (isLocked) cellEl.classList.add('locked');
                if (isConflict) cellEl.classList.add('conflict');
                if (isSelected) cellEl.classList.add('selected');

                if (this.solutionRevealed && solution) {
                    const solVal = solution[r][c];
                    if (val === EMPTY) {
                        cellEl.classList.add('cell-revealed-solution');
                        cellEl.innerHTML = `<span class="revealed-ghost ${solVal === SUN ? 'ghost-sun' : 'ghost-moon'}">${solVal === SUN ? getSunSvg('tango-sun') : getMoonSvg('tango-moon')}</span>`;
                    } else if (val === solVal) {
                        cellEl.classList.add(val === SUN ? 'val-sun' : 'val-moon', 'cell-revealed-correct');
                        cellEl.innerHTML = `<span class="${val === SUN ? 'icon-sun' : 'icon-moon'}">${val === SUN ? getSunSvg('cell-sun') : getMoonSvg('cell-moon')}</span>`;
                    } else {
                        // Fehlerhafter Zug des Spielers (wird rot hervorgehoben mit Lösungssymbol)
                        cellEl.classList.add(val === SUN ? 'val-sun' : 'val-moon', 'cell-revealed-error');
                        const wrongIcon = val === SUN ? getSunSvg('cell-sun') : getMoonSvg('cell-moon');
                        const correctIcon = solVal === SUN ? getSunSvg('mini-icon') : getMoonSvg('mini-icon');
                        cellEl.innerHTML = `
                            <span class="wrong-marker-cross">✕</span>
                            <span class="${val === SUN ? 'icon-sun' : 'icon-moon'}">${wrongIcon}</span>
                            <div class="revealed-correct-sub">
                                <span class="mini-badge ${solVal === SUN ? 'badge-sun' : 'badge-moon'}">${correctIcon}</span>
                            </div>
                        `;
                    }
                } else if (val === SUN) {
                    cellEl.classList.add('val-sun');
                    cellEl.innerHTML = `<span class="icon-sun">${getSunSvg('cell-sun')}</span>`;
                } else if (val === MOON) {
                    cellEl.classList.add('val-moon');
                    cellEl.innerHTML = `<span class="icon-moon">${getMoonSvg('cell-moon')}</span>`;
                } else {
                    // Marker für Tutorial-Zielzellen
                    const tutStep = (this.currentMode === 'tutorial') ? TUTORIAL_STEPS[this.tutorialStepIndex] : ((this.currentMode === 'tutorial_pro') ? TUTORIAL_PRO_STEPS[this.tutorialStepIndex] : ((this.currentMode === 'tutorial_patterns') ? TUTORIAL_PATTERNS_STEPS[this.tutorialStepIndex] : null));
                    const targetCellInfo = (tutStep && tutStep.targetCells) ? tutStep.targetCells.find(t => t.r === r && t.c === c) : null;
                    if (targetCellInfo) {
                        cellEl.classList.add('tutorial-target');
                        const ghostEl = document.createElement('span');
                        ghostEl.className = `target-ghost ${targetCellInfo.val === SUN ? 'ghost-sun' : 'ghost-moon'}`;
                        ghostEl.innerHTML = targetCellInfo.val === SUN ? getSunSvg('ghost-icon') : getMoonSvg('ghost-icon');
                        cellEl.appendChild(ghostEl);
                    } else {
                        // Zeige eventuelle Notizen
                        const notes = this.engine.notes[r][c];
                        if (notes && notes.size > 0) {
                            const noteEl = document.createElement('div');
                            noteEl.className = 'cell-notes';
                            if (notes.has(SUN)) noteEl.innerHTML += `<span class="mini-sun">${getSunSvg('mini-icon')}</span>`;
                            if (notes.has(MOON)) noteEl.innerHTML += `<span class="mini-moon">${getMoonSvg('mini-icon')}</span>`;
                            cellEl.appendChild(noteEl);
                        }
                    }
                }

                // Event Listener für Zelle (Klick & Gedrückt halten)
                this.attachCellEvents(cellEl, r, c);

                // Horizontale Kante rechts neben der Zelle (falls vorhanden)
                if (c < size - 1) {
                    const hEdge = this.engine.hEdges[r][c];
                    if (hEdge !== EDGE_NONE) {
                        const edgeEl = document.createElement('div');
                        edgeEl.className = `edge-marker edge-h ${hEdge === EDGE_EQUAL ? 'edge-equal' : 'edge-opposite'}`;
                        edgeEl.textContent = hEdge === EDGE_EQUAL ? '=' : '×';
                        cellEl.appendChild(edgeEl);
                    }
                }

                // Vertikale Kante unterhalb der Zelle (falls vorhanden)
                if (r < size - 1) {
                    const vEdge = this.engine.vEdges[r][c];
                    if (vEdge !== EDGE_NONE) {
                        const edgeEl = document.createElement('div');
                        edgeEl.className = `edge-marker edge-v ${vEdge === EDGE_EQUAL ? 'edge-equal' : 'edge-opposite'}`;
                        edgeEl.textContent = vEdge === EDGE_EQUAL ? '=' : '×';
                        cellEl.appendChild(edgeEl);
                    }
                }

                rowEl.appendChild(cellEl);
            }
            gridEl.appendChild(rowEl);
        }

        container.appendChild(gridEl);
    }

    attachCellEvents(cellEl, r, c) {
        let holdTimer = null;
        let didLongPress = false;
        let startX = 0;
        let startY = 0;

        const startHold = (clientX, clientY) => {
            if (!this.isGameActive || this.engine.locked[r][c]) return;
            didLongPress = false;
            startX = clientX;
            startY = clientY;

            holdTimer = setTimeout(() => {
                didLongPress = true;
                this.handleCellLongPress(r, c);
            }, 350); // 350ms für gedrückt halten = Mond
        };

        const cancelHold = () => {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
        };

        // Pointer Events (Mobile & Desktop)
        cellEl.addEventListener('pointerdown', (e) => {
            startHold(e.clientX, e.clientY);
        });

        cellEl.addEventListener('pointermove', (e) => {
            if (holdTimer) {
                const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
                if (dist > 10) cancelHold();
            }
        });

        cellEl.addEventListener('pointerup', () => cancelHold());
        cellEl.addEventListener('pointercancel', () => cancelHold());
        cellEl.addEventListener('pointerleave', () => cancelHold());

        // Normaler Klick / Tipp
        cellEl.addEventListener('click', (e) => {
            if (didLongPress) {
                didLongPress = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            this.handleCellClick(r, c, e);
        });
    }

    /**
     * Gedrückt halten = Direkt Mond (🌙) setzen
     */
    handleCellLongPress(r, c) {
        if (!this.isGameActive || this.engine.locked[r][c]) return;

        this.ignoreClickUntil = Date.now() + 500; // Block fake click after long press release
        this.selectedCell = { r, c };

        if (this.isNoteMode) {
            this.engine.setCellValue(r, c, MOON, true);
        } else {
            this.engine.setCellValue(r, c, MOON);
            this.movesCount++;
            audio.playMoon();
        }

        this.renderGrid();
        this.checkCompletion();
    }

    handleCellClick(r, c, e) {
        if (Date.now() < this.ignoreClickUntil) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            return;
        }

        if (this.solutionRevealed || !this.isGameActive || this.engine.locked[r][c]) return;

        this.selectedCell = { r, c };

        if (this.inputMode === 'keypad') {
            this.renderGrid();
            return;
        }

        // Bedienkonzept:
        // 1x Tippen = ☀️ (Sonne)
        // 2x Tippen = 🌙 (Mond)
        // 3x Tippen = Löschen (Empty)
        if (this.isNoteMode) {
            // Notiz-Zyklus: Leer -> ☀️ (Sonne) -> 🌙 (Mond) -> ☀️🌙 (Beide) -> Leer (Löschen)
            this.engine.cycleNoteValue(r, c);
            audio.playClear();
        } else {
            const nextVal = this.engine.cycleCellValue(r, c);
            this.movesCount++;
            if (nextVal === SUN) audio.playSun();
            else if (nextVal === MOON) audio.playMoon();
            else audio.playClear();
        }

        this.renderGrid();
        this.checkCompletion();
    }

    applyKeypadInput(val) {
        if (!this.selectedCell || !this.isGameActive) return;
        const { r, c } = this.selectedCell;
        if (this.engine.locked[r][c]) return;

        this.engine.setCellValue(r, c, val, this.isNoteMode);
        this.movesCount++;

        if (val === SUN) audio.playSun();
        else if (val === MOON) audio.playMoon();
        else audio.playClear();

        this.renderGrid();
        this.checkCompletion();
    }

    handleUndo() {
        const action = this.engine.undo();
        if (action) {
            audio.playClear();
            this.renderGrid();
        }
    }

    handleRedo() {
        const action = this.engine.redo();
        if (action) {
            audio.playClear();
            this.renderGrid();
        }
    }

    handleHint() {
        if (!this.isGameActive || this.solutionRevealed) return;

        const MAX_HINTS = 3;
        const applyBtn = document.getElementById('btnHintApply');
        const hintTitleEl = document.querySelector('#hintModal .modal-title');

        if (this.hintsUsed >= MAX_HINTS) {
            // Öffne Sicherheitsabfrage zur Lösungsaufdeckung
            this.toggleModal('confirmRevealModal', true);
            audio.playError();
            return;
        }

        // 1. Priorität: Fehlerprüfung im bisherigen Lösungsweg
        const mistake = this.engine.findMistakes();
        if (mistake) {
            this.currentHint = {
                r: mistake.r,
                c: mistake.c,
                value: mistake.expectedVal,
                highlightCells: mistake.highlightCells
            };
            this.hintsUsed++;
            audio.playError();

            if (applyBtn) {
                applyBtn.style.display = 'inline-block';
                applyBtn.textContent = t('hint_button_fix');
            }
            if (hintTitleEl) hintTitleEl.textContent = `${t('hint_error_title')} (${this.hintsUsed}/${MAX_HINTS})`;
            document.getElementById('hintText').textContent = mistake.message;
            this.toggleModal('hintModal', true);

            this.renderGrid();
            if (mistake.highlightCells) {
                mistake.highlightCells.forEach(cell => {
                    const el = document.querySelector(`.grid-cell[data-r="${cell.r}"][data-c="${cell.c}"]`);
                    if (el) el.classList.add('hint-highlight', 'error-highlight');
                });
            }
            return;
        }

        // 2. Priorität: Regulärer logischer Tipp für den nächsten Zug
        const hint = TangoSolver.findLogicalHint(this.engine);
        if (hint) {
            this.currentHint = hint;
            this.hintsUsed++;
            audio.playHint();

            if (applyBtn) {
                applyBtn.style.display = 'inline-block';
                applyBtn.textContent = t('hint_button_apply');
            }
            if (hintTitleEl) hintTitleEl.textContent = `${t('hint_title')} (${this.hintsUsed}/${MAX_HINTS})`;
            document.getElementById('hintText').textContent = hint.message;
            this.toggleModal('hintModal', true);

            // Markiere die betroffenen Zellen temporär
            this.renderGrid();
            if (hint.highlightCells) {
                hint.highlightCells.forEach(cell => {
                    const el = document.querySelector(`.grid-cell[data-r="${cell.r}"][data-c="${cell.c}"]`);
                    if (el) el.classList.add('hint-highlight');
                });
            }
        }
    }

    hideSolutionBanner() {
        const banner = document.getElementById('solutionRevealedBanner');
        if (banner) banner.style.display = 'none';
    }

    revealSolutionAndSurrender() {
        this.ignoreClickUntil = Date.now() + 600;
        this.toggleModal('confirmRevealModal', false);
        this.isGameActive = false;
        this.solutionRevealed = true;
        this.stopTimer();
        audio.playClear();

        // Statistiken erfassen: Niederlage verbuchen (won = false)
        if (this.currentMode === 'campaign' || this.currentMode === 'daily' || this.currentMode === 'free') {
            this.recordGameStats(false);
        }

        // Rendere das Spielfeld mit visualisierten Fehlern und hinterlegter Lösung
        this.renderGrid();

        // Zeige den Lösungs-Banner im Spielfeld an (Spieler kann die Lösung in Ruhe ansehen)
        const banner = document.getElementById('solutionRevealedBanner');
        if (banner) banner.style.display = 'flex';
    }

    openSolutionRevealedModal() {
        this.hideSolutionBanner();

        const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
        const revealTimeEl = document.getElementById('revealTime');
        const revealMovesEl = document.getElementById('revealMoves');
        if (revealTimeEl) revealTimeEl.textContent = `${mins}:${secs}`;
        if (revealMovesEl) revealMovesEl.textContent = this.movesCount;

        this.toggleModal('solutionRevealedModal', true);
    }

    checkCompletion() {
        if (this.currentMode === 'tutorial' || this.currentMode === 'tutorial_pro' || this.currentMode === 'tutorial_patterns') {
            const steps = (this.currentMode === 'tutorial') ? TUTORIAL_STEPS : ((this.currentMode === 'tutorial_pro') ? TUTORIAL_PRO_STEPS : TUTORIAL_PATTERNS_STEPS);
            const step = steps[this.tutorialStepIndex];
            let stepSuccess = true;
            if (step && step.targetCells) {
                for (const target of step.targetCells) {
                    if (this.engine.grid[target.r][target.c] !== target.val) {
                        stepSuccess = false;
                        break;
                    }
                }
            } else if (step && !step.targetCells) {
                stepSuccess = this.engine.isCompleted();
            }
            if (stepSuccess) {
                this.onLevelVictory(step.explanation || '');
            }
            return;
        }

        if (this.engine.isCompleted()) {
            this.onLevelVictory();
        }
    }

    onLevelVictory(customExplanation = null) {
        this.isGameActive = false;
        this.stopTimer();
        audio.playVictory();
        animations.launchConfetti();

        // Statistiken & Fortschritt speichern (Tutorials nicht in Statistik aufnehmen)
        if (this.currentMode === 'campaign') {
            this.saveCampaignProgress(this.campaignLevelIndex);
            this.recordGameStats(true);
        } else if (this.currentMode === 'daily') {
            this.saveDailyProgress();
            this.recordGameStats(true);
        } else if (this.currentMode === 'free') {
            this.recordGameStats(true);
        }

        const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
        document.getElementById('victoryTime').textContent = `${mins}:${secs}`;
        document.getElementById('victoryMoves').textContent = this.movesCount;

        const expEl = document.getElementById('victoryExplanation');
        if (expEl) {
            if (this.currentMode === 'tutorial' || this.currentMode === 'tutorial_pro' || this.currentMode === 'tutorial_patterns') {
                const steps = (this.currentMode === 'tutorial') ? TUTORIAL_STEPS : ((this.currentMode === 'tutorial_pro') ? TUTORIAL_PRO_STEPS : TUTORIAL_PATTERNS_STEPS);
                const step = steps[this.tutorialStepIndex];
                expEl.textContent = customExplanation || step?.explanation || '';
                expEl.style.display = expEl.textContent ? 'block' : 'none';
            } else {
                expEl.style.display = 'none';
            }
        }

        setTimeout(() => {
            this.toggleModal('victoryModal', true);
        }, 400);
    }

    getCompletedLevels() {
        try {
            return JSON.parse(localStorage.getItem('tango_campaign_completed') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveCampaignProgress(lvlIndex) {
        try {
            const completed = this.getCompletedLevels();
            if (!completed.includes(lvlIndex)) {
                completed.push(lvlIndex);
                localStorage.setItem('tango_campaign_completed', JSON.stringify(completed));
            }
        } catch (e) {}
    }

    saveDailyProgress() {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const history = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
            if (!history.includes(today)) {
                history.push(today);
                localStorage.setItem('tango_daily_history', JSON.stringify(history));
            }
            this.checkDailyReminder();
        } catch (e) {}
    }

    recordGameStats(won) {
        // Tutorials fließen nicht in die Statistik oder Bestzeiten ein
        if (this.currentMode === 'tutorial' || this.currentMode === 'tutorial_pro' || this.currentMode === 'tutorial_patterns') {
            return;
        }
        try {
            const stats = JSON.parse(localStorage.getItem('tango_stats') || '{"played":0,"won":0,"lost":0,"bestTime":null,"bestTimes":{"4":null,"6":null,"8":null,"10":null},"totalTime":0}');
            if (!stats.bestTimes || typeof stats.bestTimes !== 'object') {
                stats.bestTimes = { '4': null, '6': null, '8': null, '10': null };
            }
            stats.played = (stats.played || 0) + 1;
            if (won) {
                stats.won = (stats.won || 0) + 1;
                stats.totalTime = (stats.totalTime || 0) + this.secondsElapsed;
                if (stats.bestTime === null || stats.bestTime === undefined || this.secondsElapsed < stats.bestTime) {
                    stats.bestTime = this.secondsElapsed;
                }
                const sizeKey = String(this.engine.size);
                if (stats.bestTimes[sizeKey] === null || stats.bestTimes[sizeKey] === undefined || this.secondsElapsed < stats.bestTimes[sizeKey]) {
                    stats.bestTimes[sizeKey] = this.secondsElapsed;
                }
            } else {
                stats.lost = (stats.lost || 0) + 1;
            }
            localStorage.setItem('tango_stats', JSON.stringify(stats));
        } catch (e) {}
    }

    openLevelSelectModal() {
        if (typeof this.campaignLevelIndex === 'number' && this.campaignLevelIndex >= 0) {
            this.selectedCampaignChapter = Math.min(3, Math.max(0, Math.floor(this.campaignLevelIndex / 30)));
        }
        this.renderCampaignLevelGrid();
        this.toggleModal('levelSelectModal', true);
    }

    switchCampaignChapter(chapter) {
        this.selectedCampaignChapter = Math.min(3, Math.max(0, chapter));
        audio.playClear();
        this.renderCampaignLevelGrid();
    }

    renderCampaignLevelGrid() {
        const tabs = document.querySelectorAll('#campaignChapterTabs .chapter-tab-btn');
        tabs.forEach((tab) => {
            const chap = parseInt(tab.dataset.chapter, 10);
            if (chap === this.selectedCampaignChapter) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        const list = document.getElementById('levelGridList');
        if (!list) return;
        list.innerHTML = '';

        const completed = this.getCompletedLevels();
        const startLvl = this.selectedCampaignChapter * 30;
        const endLvl = startLvl + 30;

        for (let i = startLvl; i < endLvl; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-item-btn';
            const isDone = completed.includes(i);
            const isUnlocked = i === 0 || completed.includes(i - 1) || isDone;

            btn.disabled = !isUnlocked;
            if (isDone) btn.classList.add('completed');
            if (isUnlocked) btn.classList.add('unlocked');

            btn.innerHTML = `<span class="lvl-num">${i + 1}</span>${isDone ? '<span class="lvl-star">⭐</span>' : ''}`;
            btn.addEventListener('click', () => {
                this.toggleModal('levelSelectModal', false);
                this.startCampaignLevel(i);
            });
            list.appendChild(btn);
        }
    }

    updateFreePlayLabels() {
        const sizeLabels = {
            4: t('free_size_4'),
            6: t('free_size_6'),
            8: t('free_size_8'),
            10: t('free_size_10')
        };
        const diffLabels = {
            'easy': t('free_diff_easy'),
            'medium': t('free_diff_medium'),
            'hard': t('free_diff_hard')
        };
        const lblSize = document.getElementById('lblFreePlaySizeValue');
        if (lblSize) lblSize.textContent = sizeLabels[this.freePlaySize] || `${this.freePlaySize} × ${this.freePlaySize}`;

        const lblDiff = document.getElementById('lblFreePlayDiffValue');
        if (lblDiff) lblDiff.textContent = diffLabels[this.freePlayDiff] || this.freePlayDiff;
    }

    openFreePlayModal() {
        this.updateFreePlayLabels();
        this.toggleModal('freePlayModal', true);
        const btnStart = document.getElementById('btnStartFreePlay');
        if (btnStart) {
            btnStart.onclick = () => {
                this.toggleModal('freePlayModal', false);
                this.startFreePlay(this.freePlaySize, this.freePlayDiff);
            };
        }
        const btnClose = document.getElementById('btnCloseFreePlay');
        if (btnClose) {
            btnClose.onclick = () => this.toggleModal('freePlayModal', false);
        }
    }

    openCustomSelectModal({ title, options, currentValue, onSelect }) {
        const titleEl = document.getElementById('customSelectTitle');
        const listEl = document.getElementById('customSelectOptionsList');
        if (titleEl) titleEl.textContent = title;
        if (!listEl) return;

        listEl.innerHTML = '';
        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'custom-select-item';
            if (opt.value === currentValue) item.classList.add('selected');

            const contentDiv = document.createElement('div');
            contentDiv.className = 'select-item-content';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'select-item-title';
            titleDiv.textContent = opt.label;
            contentDiv.appendChild(titleDiv);

            if (opt.subtitle) {
                const subDiv = document.createElement('div');
                subDiv.className = 'select-item-subtitle';
                subDiv.textContent = opt.subtitle;
                contentDiv.appendChild(subDiv);
            }

            const radioDiv = document.createElement('div');
            radioDiv.className = 'select-item-radio';
            const dotDiv = document.createElement('div');
            dotDiv.className = 'radio-dot';
            radioDiv.appendChild(dotDiv);

            item.appendChild(contentDiv);
            item.appendChild(radioDiv);

            item.addEventListener('click', () => {
                audio.vibrate(25);
                audio.playClear();
                this.toggleModal('customSelectModal', false);
                if (typeof onSelect === 'function') {
                    onSelect(opt.value);
                }
            });
            listEl.appendChild(item);
        });

        this.toggleModal('customSelectModal', true);
    }

    openCustomTimePickerModal(currentTimeStr, onSave) {
        let [h, m] = (currentTimeStr || '09:30').split(':').map(Number);
        if (isNaN(h)) h = 9;
        if (isNaN(m)) m = 30;

        const updateDisplay = () => {
            const hStr = h.toString().padStart(2, '0');
            const mStr = m.toString().padStart(2, '0');
            const hDisplay = document.getElementById('timeHourDisplay');
            const mDisplay = document.getElementById('timeMinuteDisplay');
            if (hDisplay) hDisplay.textContent = hStr;
            if (mDisplay) mDisplay.textContent = mStr;

            const fullTime = `${hStr}:${mStr}`;
            document.querySelectorAll('.time-preset-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.time === fullTime);
            });
        };

        const hourUp = document.getElementById('btnHourUp');
        const hourDown = document.getElementById('btnHourDown');
        const minUp = document.getElementById('btnMinuteUp');
        const minDown = document.getElementById('btnMinuteDown');

        if (hourUp) hourUp.onclick = () => { h = (h + 1) % 24; audio.vibrate(20); updateDisplay(); };
        if (hourDown) hourDown.onclick = () => { h = (h - 1 + 24) % 24; audio.vibrate(20); updateDisplay(); };
        if (minUp) minUp.onclick = () => { m = (m + 5) % 60; audio.vibrate(20); updateDisplay(); };
        if (minDown) minDown.onclick = () => { m = (m - 5 + 60) % 60; audio.vibrate(20); updateDisplay(); };

        document.querySelectorAll('.time-preset-btn').forEach(btn => {
            btn.onclick = () => {
                const parts = btn.dataset.time.split(':').map(Number);
                h = parts[0];
                m = parts[1];
                audio.vibrate(25);
                updateDisplay();
            };
        });

        const btnSave = document.getElementById('btnSaveTimePicker');
        if (btnSave) {
            btnSave.onclick = () => {
                audio.vibrate(30);
                const hStr = h.toString().padStart(2, '0');
                const mStr = m.toString().padStart(2, '0');
                const finalTime = `${hStr}:${mStr}`;
                this.toggleModal('customTimePickerModal', false);
                if (typeof onSave === 'function') {
                    onSave(finalTime);
                }
            };
        }

        const btnCancel = document.getElementById('btnCancelTimePicker');
        if (btnCancel) {
            btnCancel.onclick = () => this.toggleModal('customTimePickerModal', false);
        }
        const btnClose = document.getElementById('btnCloseTimePicker');
        if (btnClose) {
            btnClose.onclick = () => this.toggleModal('customTimePickerModal', false);
        }

        updateDisplay();
        this.toggleModal('customTimePickerModal', true);
    }

    openSettingsModal() {
        this.openMenuTab('settings');
    }

    openStatsModal() {
        let stats = { played: 0, won: 0, lost: 0, bestTime: null, bestTimes: { '4': null, '6': null, '8': null, '10': null }, totalTime: 0 };
        try {
            stats = JSON.parse(localStorage.getItem('tango_stats') || '{"played":0,"won":0,"lost":0,"bestTime":null,"bestTimes":{"4":null,"6":null,"8":null,"10":null},"totalTime":0}');
            if (!stats.bestTimes || typeof stats.bestTimes !== 'object') {
                stats.bestTimes = { '4': null, '6': null, '8': null, '10': null };
            }
        } catch (e) {}

        let dailyHistory = [];
        try {
            dailyHistory = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
        } catch (e) {}

        const streaks = calculateStreaks(dailyHistory);

        const el = (id) => document.getElementById(id);
        if (el('statPlayedModal')) el('statPlayedModal').textContent = stats.played || 0;
        if (el('statWonModal')) el('statWonModal').textContent = stats.won || 0;
        if (el('statLostModal')) el('statLostModal').textContent = stats.lost || 0;
        if (el('statWinRateModal')) el('statWinRateModal').textContent = stats.played > 0 ? `${Math.round(((stats.won || 0) / stats.played) * 100)}%` : '0%';
        if (el('statCurrentStreakModal')) el('statCurrentStreakModal').textContent = `${streaks.currentStreak} 🔥`;
        if (el('statMaxStreakModal')) el('statMaxStreakModal').textContent = `${streaks.maxStreak} 🏆`;
        if (el('statBestTime4Modal')) el('statBestTime4Modal').textContent = formatTime(stats.bestTimes['4']);
        if (el('statBestTime6Modal')) el('statBestTime6Modal').textContent = formatTime(stats.bestTimes['6']);
        if (el('statBestTime8Modal')) el('statBestTime8Modal').textContent = formatTime(stats.bestTimes['8']);
        if (el('statBestTime10Modal')) el('statBestTime10Modal').textContent = formatTime(stats.bestTimes['10']);

        this.toggleModal('statsModal', true);
    }

    setReminderEnabled(enabled) {
        this.reminderEnabled = enabled;
        try {
            localStorage.setItem('tango_reminder_enabled', enabled);
        } catch (e) {}
        const remTimeRow = document.getElementById('settingReminderTimeRow');
        if (remTimeRow) remTimeRow.style.display = enabled ? 'flex' : 'none';
        
        if (enabled) {
            this.requestNotificationPermission();
            if (window.AndroidNotification && typeof window.AndroidNotification.scheduleDailyReminder === 'function') {
                const [remH, remM] = this.reminderTime.split(':').map(Number);
                try {
                    window.AndroidNotification.scheduleDailyReminder(remH, remM);
                } catch (e) {}
            }
        } else {
            if (window.AndroidNotification && typeof window.AndroidNotification.cancelDailyReminder === 'function') {
                try {
                    window.AndroidNotification.cancelDailyReminder();
                } catch (e) {}
            }
        }
        this.checkDailyReminder();
    }

    setReminderTime(timeStr) {
        if (/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
            this.reminderTime = timeStr;
            try {
                localStorage.setItem('tango_reminder_time', timeStr);
            } catch (e) {}
            if (this.reminderEnabled && window.AndroidNotification && typeof window.AndroidNotification.scheduleDailyReminder === 'function') {
                const [remH, remM] = timeStr.split(':').map(Number);
                try {
                    window.AndroidNotification.scheduleDailyReminder(remH, remM);
                } catch (e) {}
            }
            this.checkDailyReminder();
        }
    }

    openMenuTab(tabName = 'play') {
        this.toggleModal('menuModal', true);
        this.switchMenuTab(tabName);
    }

    switchMenuTab(tabName) {
        const tabs = ['play', 'rules', 'stats', 'settings'];
        tabs.forEach(t => {
            const btn = document.getElementById(`tabMenu${t.charAt(0).toUpperCase() + t.slice(1)}`);
            const sec = document.getElementById(`menuSec${t.charAt(0).toUpperCase() + t.slice(1)}`);
            if (btn) btn.classList.toggle('active', t === tabName);
            if (sec) sec.style.display = t === tabName ? 'flex' : 'none';
        });

        if (tabName === 'stats') {
            this.updateMenuStats();
        } else if (tabName === 'settings') {
            this.updateMenuSettings();
        }
    }

    updateMenuStats() {
        let stats = { played: 0, won: 0, bestTime: null, bestTimes: { '4': null, '6': null, '8': null, '10': null }, totalTime: 0 };
        try {
            stats = JSON.parse(localStorage.getItem('tango_stats') || '{"played":0,"won":0,"bestTime":null,"bestTimes":{"4":null,"6":null,"8":null,"10":null},"totalTime":0}');
            if (!stats.bestTimes || typeof stats.bestTimes !== 'object') {
                stats.bestTimes = { '4': null, '6': null, '8': null, '10': null };
            }
        } catch (e) {}

        let dailyHistory = [];
        try {
            dailyHistory = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
        } catch (e) {}

        const streaks = calculateStreaks(dailyHistory);
        
        const statP = document.getElementById('statPlayed');
        const statW = document.getElementById('statWon');
        const statR = document.getElementById('statWinRate');
        const statCurrStreak = document.getElementById('statCurrentStreak');
        const statMaxStreak = document.getElementById('statMaxStreak');

        const statT4 = document.getElementById('statBestTime4');
        const statT6 = document.getElementById('statBestTime6');
        const statT8 = document.getElementById('statBestTime8');
        const statT10 = document.getElementById('statBestTime10');

        if (statP) statP.textContent = stats.played || 0;
        if (statW) statW.textContent = stats.won || 0;
        if (statR) statR.textContent = stats.played > 0 ? `${Math.round(((stats.won || 0) / stats.played) * 100)}%` : '0%';
        if (statCurrStreak) statCurrStreak.textContent = `${streaks.currentStreak} 🔥`;
        if (statMaxStreak) statMaxStreak.textContent = `${streaks.maxStreak} 🏆`;

        if (statT4) statT4.textContent = formatTime(stats.bestTimes['4']);
        if (statT6) statT6.textContent = formatTime(stats.bestTimes['6']);
        if (statT8) statT8.textContent = formatTime(stats.bestTimes['8']);
        if (statT10) statT10.textContent = formatTime(stats.bestTimes['10']);
    }

    updateMenuSettings() {
        const themeLabels = {
            'dark': t('setting_theme_dark'),
            'amoled': t('setting_theme_amoled'),
            'light': t('setting_theme_light'),
            'wood': t('setting_theme_wood'),
            'cyberpunk': t('setting_theme_cyberpunk')
        };
        const lblTheme = document.getElementById('lblThemeValue');
        if (lblTheme) lblTheme.textContent = themeLabels[this.currentTheme] || this.currentTheme;

        const vibLabels = {
            'medium': t('setting_vib_medium'),
            'strong': t('setting_vib_strong'),
            'ultra': t('setting_vib_ultra'),
            'soft': t('setting_vib_soft')
        };
        const lblVib = document.getElementById('lblVibValue');
        if (lblVib) lblVib.textContent = vibLabels[audio.vibrationStrength] || audio.vibrationStrength;

        const lblLang = document.getElementById('lblLangValue');
        if (lblLang) lblLang.textContent = getLang() === 'de' ? 'Deutsch' : 'English';

        const lblTime = document.getElementById('lblTimeValue');
        if (lblTime) lblTime.textContent = this.reminderTime;

        const sndToggle = document.getElementById('settingSoundToggle');
        if (sndToggle) sndToggle.checked = audio.enabled;

        const vibToggle = document.getElementById('settingVibrationToggle');
        if (vibToggle) vibToggle.checked = audio.vibrationEnabled;

        const chkToggle = document.getElementById('settingAutoCheckToggle');
        if (chkToggle) chkToggle.checked = this.autoCheck;

        const remToggle = document.getElementById('settingReminderToggle');
        if (remToggle) remToggle.checked = this.reminderEnabled;

        const remTimeRow = document.getElementById('settingReminderTimeRow');
        if (remTimeRow) remTimeRow.style.display = this.reminderEnabled ? 'flex' : 'none';
    }

    requestNotificationPermission() {
        if (window.AndroidNotification) return; // Android NotificationBridge regelt Permissions nativ
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                Notification.requestPermission().catch(() => {});
            } catch (e) {}
        }
    }

    sendSystemNotification(title, body) {
        if (window.AndroidNotification && typeof window.AndroidNotification.showNotification === 'function') {
            try {
                window.AndroidNotification.showNotification(title, body);
                return true;
            } catch (e) {
                console.warn('AndroidNotification Fehler:', e);
            }
        }

        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.showNotification(title, {
                            body: body,
                            icon: './assets/icons/icon-192.png',
                            badge: './assets/icons/icon-192.png',
                            vibrate: [100, 50, 100],
                            tag: 'tango-daily-alarm',
                            renotify: true
                        });
                    }).catch(() => {
                        new Notification(title, { body: body, icon: './assets/icons/icon-192.png' });
                    });
                } else {
                    new Notification(title, { body: body, icon: './assets/icons/icon-192.png' });
                }
                return true;
            } catch (e) {
                console.warn('System-Benachrichtigung konnte nicht erstellt werden:', e);
            }
        }
        return false;
    }

    testSystemNotification() {
        if (window.AndroidNotification && typeof window.AndroidNotification.showNotification === 'function') {
            try {
                window.AndroidNotification.showNotification(t('notif_title'), t('notif_body'));
                alert(t('notif_test_sent'));
                return;
            } catch (e) {
                console.warn('Android Test-Notification Fehler:', e);
            }
        }

        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                        this.sendSystemNotification(t('notif_title'), t('notif_body'));
                        alert(t('notif_test_sent'));
                    } else {
                        alert(t('notif_permission_denied'));
                    }
                }).catch(() => {
                    alert(t('notif_permission_denied'));
                });
            } else if (Notification.permission === 'granted') {
                this.sendSystemNotification(t('notif_title'), t('notif_body'));
                alert(t('notif_test_sent'));
            } else {
                alert(t('notif_permission_denied'));
            }
            return;
        }

        alert(t('notif_test_sent'));
    }

    checkDailySystemNotification() {
        if (!this.reminderEnabled) return;
        const today = new Date().toISOString().slice(0, 10);
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
        } catch (e) {}
        if (history.includes(today)) return; // Heute bereits abgeschlossen

        let lastNotif = '';
        try {
            lastNotif = localStorage.getItem('tango_last_notif_date') || '';
        } catch (e) {}
        if (lastNotif === today) return; // Heute bereits alarmiert

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [remHour, remMinute] = this.reminderTime.split(':').map(Number);

        if (currentHour > remHour || (currentHour === remHour && currentMinute >= remMinute)) {
            const sent = this.sendSystemNotification(t('notif_title'), t('notif_body'));
            if (sent) {
                try {
                    localStorage.setItem('tango_last_notif_date', today);
                } catch (e) {}
            }
        }
    }

    checkDailyReminder() {
        const today = new Date().toISOString().slice(0, 10);
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
        } catch (e) {}

        const isTodaySolved = history.includes(today);
        const badge = document.getElementById('dailyBadge');
        if (badge) badge.style.display = isTodaySolved ? 'none' : 'inline-block';

        const banner = document.getElementById('dailyReminderBanner');
        if (isTodaySolved || !this.reminderEnabled || this.reminderDismissed) {
            if (banner) banner.style.display = 'none';
            return;
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [remHour, remMinute] = this.reminderTime.split(':').map(Number);

        if (currentHour > remHour || (currentHour === remHour && currentMinute >= remMinute)) {
            if (banner) banner.style.display = 'flex';
        } else {
            if (banner) banner.style.display = 'none';
        }
    }

    dismissReminderBanner() {
        this.reminderDismissed = true;
        const banner = document.getElementById('dailyReminderBanner');
        if (banner) banner.style.display = 'none';
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
    }

    showConfirmDialog({ title, message, confirmText, cancelText, isDanger = true }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const msgEl = document.getElementById('confirmMessage');
            const okBtn = document.getElementById('btnConfirmOk');
            const cancelBtn = document.getElementById('btnConfirmCancel');

            if (!modal) {
                resolve(false);
                return;
            }

            if (titleEl) titleEl.textContent = title || t('confirm_title');
            if (msgEl) msgEl.textContent = message || '';
            if (okBtn) {
                okBtn.textContent = confirmText || t('btn_confirm_reset');
                okBtn.className = isDanger ? 'danger-btn' : 'primary-btn';
            }
            if (cancelBtn) cancelBtn.textContent = cancelText || t('btn_cancel');

            const cleanup = (result) => {
                modal.style.display = 'none';
                if (okBtn) okBtn.onclick = null;
                if (cancelBtn) cancelBtn.onclick = null;
                resolve(result);
            };

            if (okBtn) okBtn.onclick = () => cleanup(true);
            if (cancelBtn) cancelBtn.onclick = () => cleanup(false);

            modal.style.display = 'flex';
        });
    }
}

// Sichere Initialisierung der App
function initApp() {
    if (window.tangoApp) return; // Bereits initialisiert
    try {
        window.tangoApp = new TangoApp();

        // Service Worker registrieren für Offline-Betrieb & PWA
        if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('./sw.js').catch(err => {
                console.warn('Service Worker Registrierungsfehler:', err);
            });
        }
    } catch (err) {
        console.error('Fehler beim Starten der TangoApp:', err);
    }
}

// Falls das DOM bereits geladen ist (bei ES-Modulen häufig), direkt starten
if (document.readyState !== 'loading') {
    initApp();
} else {
    window.addEventListener('DOMContentLoaded', initApp);
}

})();