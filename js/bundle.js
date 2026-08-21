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
        nav_tutorial: "Tutorial (Grundlagen)",
        nav_tutorial_pro: "Tutorial Pro (Mathe-Tricks)",
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
        hint_button_apply: "Zug ausführen",
        hint_limit_reached: "Maximale Anzahl an Hinweisen für dieses Level erreicht (3/3).",
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
        setting_auto_check: "Fehler sofort hervorheben",
        setting_input_mode: "Eingabemodus",
        setting_input_cycle: "Direkt (1× ☀️ / 2× & Halten 🌙 / 3× Löschen)",
        setting_input_keypad: "Ziffern- / Symbolleiste unten",
        setting_language: "Sprache",
        setting_reset_data: "Fortschritt zurücksetzen",
        setting_reset_confirm: "Möchtest du wirklich alle Zeiten, gelösten Level und Statistiken zurücksetzen?",

        // Statistiken
        stats_title: "Deine Statistiken",
        stats_total_played: "Gespielte Rätsel",
        stats_total_won: "Gelöste Rätsel",
        stats_win_rate: "Erfolgsquote",
        stats_best_time: "Bestzeit",
        stats_avg_time: "Durchschnittszeit",
        stats_current_streak: "Aktuelle Tages-Serie",
        stats_max_streak: "Längste Tages-Serie",
        stats_no_data: "Noch keine Spieldaten vorhanden.",

        // PWA Install Prompt
        pwa_install_title: "App installieren",
        pwa_install_desc: "Installiere Tango auf deinem Smartphone, um komplett offline und werbefrei zu spielen.",
        pwa_install_btn: "Jetzt installieren",
        pwa_dismiss: "Später"
    },
    en: {
        app_title: "Tango Logic Puzzle",
        subtitle: "Minimalist binary puzzle with Sun & Moon",
        nav_campaign: "Campaign",
        nav_daily: "Daily Puzzle",
        nav_free: "Free Play",
        nav_tutorial: "Tutorial",
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
        hint_button_apply: "Apply Move",
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
        setting_auto_check: "Highlight Mistakes Immediately",
        setting_input_mode: "Input Mode",
        setting_input_cycle: "Cycle Tap (Sun → Moon → Empty)",
        setting_input_keypad: "Bottom Selector Bar",
        setting_language: "Language",
        setting_reset_data: "Reset Progress",
        setting_reset_confirm: "Are you sure you want to reset all your progress?",
        stats_title: "Your Statistics",
        stats_total_played: "Puzzles Played",
        stats_total_won: "Puzzles Solved",
        stats_win_rate: "Win Rate",
        stats_best_time: "Best Time",
        stats_avg_time: "Average Time",
        stats_current_streak: "Current Daily Streak",
        stats_max_streak: "Max Daily Streak",
        stats_no_data: "No game data recorded yet.",
        pwa_install_title: "Install App",
        pwa_install_desc: "Install Tango on your home screen for instant offline play.",
        pwa_install_btn: "Install Now",
        pwa_dismiss: "Later"
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
        mathPrinciple: "Ausschluss durch Dreier-Verbot: ∀ x ∈ G: ¬(val(x) = val(x+1) = val(x+2))",
        description: `**Das Prinzip**:\nWenn zwei identische Symbole ein leeres Feld umschließen (\`☀️ _ ☀️\` oder \`🌙 _ 🌙\`), MUSS dazwischen das gegenteilige Symbol stehen.\n\n**Mathematischer Beweis**:\nWürde man in die Lücke dasselbe Symbol setzen, entstünde eine Kette aus drei gleichen Symbolen (\`☀️☀️☀️\`). Da die maximale Kettenlänge laut Tango-Axiom $k_{max} = 2$ beträgt, existiert nur genau eine Belegung für die Lücke.\n\n*Übung: Vervollständige die Sandwich-Lücken in Zeile 1 und Spalte 4!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, MOON]
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
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 2, c: 3, val: SUN}],
        explanation: "Mathematisch korrekt! Das Sandwich-Prinzip sichert die Belegung ohne Raten."
    },
    {
        id: 2,
        title: "Pro 2: Die Kanten-Kaskade (Kopplungs-Logik)",
        subtitle: "Vorzeichen-Vererbung über Gleichheitsketten",
        mathPrinciple: "Transitiver Gleichheits-Beweis: (x = y) ∧ (val(w) = A) ⇒ (val(x) = val(y) = ¬A)",
        description: `**Das Prinzip**:\nZwei durch ein Gleichheitszeichen verbundene Felder (\`[=]\`) bilden ein gekoppeltes Paar $(x, y)$ mit $val(x) = val(y)$. Steht davor ein bekanntes Symbol $A$, MÜSSEN beide Felder das Gegenteil $\\neg A$ annehmen.\n\n**Mathematischer Beweis**:\nNähmen $x$ und $y$ den Wert $A$ an, entstünde die unzulässige 3er-Reihe $A - A - A$. Folglich gilt zwingend $val(x) = val(y) = \\neg A$.\n\n*Übung: Nutze das Gleichheitszeichen [=] in Zeile 1, um die beiden leeren Felder rechts von der Sonne auszufüllen!*`,
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
        mathPrinciple: "Summen-Schranke: ∑ ☀️ = N/2 ⟹ ∀ (r,c) ∈ EMPTY: val(r,c) = 🌙",
        description: `**Das Prinzip**:\nIn einem $N \\times N$ Gitter enthält jede Zeile und Spalte exakt $N/2$ Sonnen und $N/2$ Monde. Sobald alle $N/2$ Sonnen platziert sind, MÜSSEN alle restlichen leeren Felder Monde sein.\n\n**Mathematischer Beweis**:\nSei $S$ die Anzahl der Sonnen in Zeile $r$. Ist $S = N/2$, verbleiben $N/2 - S = 0$ freie Kapazitäten für Sonnen. Nach dem Schubfachprinzip müssen die verbleibenden $|E|$ leeren Felder mit Monden aufgefüllt werden.\n\n*Übung: Fülle die verbleibenden Felder in Zeile 1 und Spalte 1 auf!*`,
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
        mathPrinciple: "Inversions-Logik: val(x) = A ∧ (x × y) ⟹ val(y) = ¬A",
        description: `**Das Prinzip**:\nEin Gegenteilszeichen (\`[×]\`) schaltet den logischen Zustand um: $val(y) = \\neg val(x)$.\n\n**Mathematischer Beweis**:\nIn einem binären System $\\Sigma = \\{\\text{☀️}, \\text{🌙}\\}$ existieren nur zwei Zustände. Das Operator-Signal $x \\times y$ erzwingt $val(x) \\neq val(y)$. Ist $val(x) = \\text{☀️}$, folgt unausweichlich $val(y) = \\text{🌙}$.\n\n*Übung: Löse die Gegenteilskanten [×] in Zeile 1 und Spalte 2 auf!*`,
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
        mathPrinciple: "Unizitäts-Axiom: ∀ r_1 ≠ r_2: row(r_1) ≠ row(r_2)",
        description: `**Das Prinzip**:\nKeine zwei Zeilen dürfen vollständig identisch belegt sein. Wenn eine Belegung eine identische Zeile erzeugen würde, MUSS die alternative Belegung gewählt werden.\n\n**Mathematischer Beweis**:\nZeile 1 ist \`☀️ 🌙 ☀️ 🌙\`. Zeile 2 beginnt mit \`☀️ 🌙 _ _\`. Die Belegung \`☀️ 🌙\` für die Lücken würde Zeile 2 identisch zu Zeile 1 machen ($row(1) = row(2)$). Daher MUSS nach dem Unizitäts-Axiom die Belegung \`🌙 ☀️\` gewählt werden.\n\n*Übung: Vervollständige Zeile 2 so, dass sie NICHT identisch zu Zeile 1 wird!*`,
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
        mathPrinciple: "Rand-Einschluss: val(x) = val(x+1) ⟹ val(x-1) = val(x+2) = ¬val(x)",
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
        mathPrinciple: "(x × y) ⟹ val(x) + val(y) = 1 ⟹ Restliches Feld z = ¬A",
        description: `**Das Prinzip**:\nZwei durch \`[×]\` verbundene Felder enthalten garantiert genau 1 Sonne und 1 Mond. Steht vor dem Paar eine Sonne \`☀️\`, ist für die Zeile bereits die 2. Sonne verbraucht — das 4. Feld MUSS ein Mond \`🌙\` sein!\n\n**Mathematischer Beweis**:\nDie \`[×]\`-Kante erzwingt $val(1,2) + val(1,3) = 1 \\text{ Sonne} + 1 \\text{ Mond}$. Da Pos (1,1) bereits eine \`☀️\` ist, enthält das Trio (Pos 1,2,3) zusammen exakt 2 Sonnen (das Maximum für 4x4). Daher kann das 4. Feld Pos (1,4) keine Sonne mehr sein und MUSS ein Mond \`🌙\` werden.\n\n*Übung: Bestimme das 4. Feld in Zeile 1 durch die 2-aus-3 Logik!*`,
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
        mathPrinciple: "2×2 Schleifen-Inversion: (x × y) ∧ (x × z) ⟹ val(y) = val(z)",
        description: `**Das Prinzip**:\nWenn eine Ecke $(0,0)$ mit zwei gegensätzlichen Nachbarn über \`[×]\` verbunden ist, müssen die beiden Nachbarn untereinander GLEICH sein ($val(x) = val(y)$).\n\n**Mathematischer Beweis**:\nEs gilt $val(0,1) = \\neg val(0,0)$ und $val(1,0) = \\neg val(0,0)$. Nach der Transitivität der Negation folgt $val(0,1) = val(1,0)$. Ist Pos (0,0) eine \`☀️\`, MÜSSEN Pos (0,1) und Pos (1,0) beide Monde \`🌙\` sein!\n\n*Übung: Löse die beiden Nachbarfelder in Zeile 1 und Spalte 1 auf!*`,
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

// === Source: js\data\levels.js ===
/**
 * Tango Vorgefertigte Level & Tagesrätsel-Generierung
 */


const CAMPAIGN_LEVELS = [
    // --- KAPITEL 1: ANFÄNGER (4x4) ---
    {
        id: 1,
        tier: 'beginner',
        name: "Level 1",
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, SUN]
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
        ]
    },
    {
        id: 2,
        tier: 'beginner',
        name: "Level 2",
        size: 4,
        initialGrid: [
            [EMPTY, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, SUN],
            [MOON, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },
    {
        id: 3,
        tier: 'beginner',
        name: "Level 3",
        size: 4,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, SUN, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },

    // --- KAPITEL 2: EINFACH (6x6) ---
    {
        id: 4,
        tier: 'easy',
        name: "Level 4",
        size: 6,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, SUN, EMPTY, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, SUN, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY, EMPTY, SUN]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },
    {
        id: 5,
        tier: 'easy',
        name: "Level 5",
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, SUN, EMPTY, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, MOON, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },

    // --- KAPITEL 3: MITTEL (6x6) ---
    {
        id: 6,
        tier: 'medium',
        name: "Level 6",
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, SUN, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    },

    // --- KAPITEL 4: SCHWER (8x8) ---
    {
        id: 7,
        tier: 'hard',
        name: "Level 7",
        size: 8,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, SUN, EMPTY, EMPTY, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, EMPTY, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, SUN]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ]
    }
];

function getCampaignLevel(levelIndex) {
    // Bestimme Gittergröße und Schwierigkeitsgrad nach Level-Fortschritt
    let size, difficulty;
    if (levelIndex < 5) {
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 15) {
        size = 6;
        difficulty = levelIndex < 10 ? 'easy' : 'medium';
    } else if (levelIndex < 30) {
        size = 8;
        difficulty = 'hard';
    } else {
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

        // Lade Einstellungen
        try {
            const savedSound = localStorage.getItem('tango_sound');
            if (savedSound !== null) this.enabled = savedSound === 'true';

            const savedVib = localStorage.getItem('tango_vibration');
            if (savedVib !== null) this.vibrationEnabled = savedVib === 'true';
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

    vibrate(pattern = 15) {
        if (this.vibrationEnabled && 'vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
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
        this.vibrate(10);
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
        this.vibrate(15);
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
        this.vibrate(5);
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
        this.vibrate([15, 30, 15]);
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
        this.vibrate([40, 20, 40]);
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

        this.vibrate([30, 50, 30, 50, 80]);
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


class TangoApp {
    constructor() {
        this.engine = new TangoEngine(6);
        this.currentMode = 'campaign'; // 'campaign' | 'daily' | 'free' | 'tutorial'
        this.campaignLevelIndex = 0;
        this.tutorialStepIndex = 0;
        this.selectedCell = null;
        this.isNoteMode = false;
        
        // Timer & Statistiken
        this.timerInterval = null;
        this.secondsElapsed = 0;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.isGameActive = false;
        this.ignoreClickUntil = 0;

        // Einstellungen
        this.autoCheck = true;
        this.inputMode = 'cycle'; // 'cycle' | 'keypad'
        this.currentTheme = 'dark';

        this.init();
    }

    init() {
        this.loadSettings();
        this.applyTheme(this.currentTheme);
        animations.init(document.getElementById('confettiCanvas'));
        this.bindEvents();
        this.updateI18n();

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

            const savedAutoCheck = localStorage.getItem('tango_auto_check');
            if (savedAutoCheck !== null) this.autoCheck = savedAutoCheck === 'true';

            const savedInput = localStorage.getItem('tango_input_mode');
            if (savedInput) this.inputMode = savedInput;
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
    }

    updateI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
    }

    bindEvents() {
        // Navigation / Menüs
        document.getElementById('btnMenu').addEventListener('click', () => this.toggleModal('menuModal', true));
        document.getElementById('btnCloseMenu').addEventListener('click', () => this.toggleModal('menuModal', false));
        document.getElementById('btnSettings').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.openSettingsModal();
        });
        document.getElementById('btnCloseSettings').addEventListener('click', () => this.toggleModal('settingsModal', false));
        document.getElementById('btnStats').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.openStatsModal();
        });
        document.getElementById('btnCloseStats').addEventListener('click', () => this.toggleModal('statsModal', false));
        document.getElementById('btnRules').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.toggleModal('rulesModal', true);
        });
        document.getElementById('btnCloseRules').addEventListener('click', () => this.toggleModal('rulesModal', false));

        // Spielmodi-Auswahl im Menü
        document.getElementById('navTutorial')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startTutorial(0);
        });
        document.getElementById('navTutorialPro')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startTutorialPro(0);
        });
        document.getElementById('navCampaign').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.openLevelSelectModal();
        });
        document.getElementById('navDaily').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startDailyPuzzle();
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
                    this.startCampaignLevel(0);
                }
            } else if (this.currentMode === 'campaign') {
                this.startCampaignLevel(this.campaignLevelIndex + 1);
            } else {
                this.openLevelSelectModal();
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

        // Settings Dialog Listener
        document.getElementById('settingThemeSelect')?.addEventListener('change', (e) => this.applyTheme(e.target.value));
        document.getElementById('settingSoundToggle')?.addEventListener('change', (e) => audio.setSound(e.target.checked));
        document.getElementById('settingVibrationToggle')?.addEventListener('change', (e) => audio.setVibration(e.target.checked));
        document.getElementById('settingAutoCheckToggle')?.addEventListener('change', (e) => {
            this.autoCheck = e.target.checked;
            localStorage.setItem('tango_auto_check', this.autoCheck);
            this.renderGrid();
        });
        document.getElementById('settingInputSelect')?.addEventListener('change', (e) => {
            this.inputMode = e.target.value;
            localStorage.setItem('tango_input_mode', this.inputMode);
            this.updateKeypadVisibility();
        });
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
        document.getElementById('levelTitle').textContent = `Tutorial ${stepIndex + 1}/${TUTORIAL_STEPS.length}`;

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
        document.getElementById('levelTitle').textContent = `Tutorial Pro ${stepIndex + 1}/${TUTORIAL_PRO_STEPS.length}`;

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
        this.isGameActive = true;
        this.startTimer();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        document.getElementById('levelTitle').textContent = `${t('status_level')} ${levelIndex + 1}`;
        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startDailyPuzzle() {
        this.currentMode = 'daily';
        const today = new Date().toISOString().slice(0, 10);
        const puzzle = getDailyPuzzle(today);

        this.engine.loadPuzzle(puzzle);
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
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
            vEdges: this.engine.vEdges
        });
        this.selectedCell = null;
        this.movesCount = 0;
        this.startTimer();
        this.renderGrid();
        audio.playClear();
    }

    toggleNoteMode() {
        this.isNoteMode = !this.isNoteMode;
        const btn = document.getElementById('btnNotes');
        if (btn) btn.classList.toggle('active', this.isNoteMode);
        audio.vibrate(10);
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
                const isConflict = validation.conflictCells.has(`${r},${c}`);
                const isSelected = this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c;

                if (isLocked) cellEl.classList.add('locked');
                if (isConflict) cellEl.classList.add('conflict');
                if (isSelected) cellEl.classList.add('selected');

                if (val === SUN) {
                    cellEl.classList.add('val-sun');
                    cellEl.innerHTML = `<span class="icon-sun">☀️</span>`;
                } else if (val === MOON) {
                    cellEl.classList.add('val-moon');
                    cellEl.innerHTML = `<span class="icon-moon">🌙</span>`;
                } else {
                    // Marker für Tutorial-Zielzellen
                    const tutStep = (this.currentMode === 'tutorial') ? TUTORIAL_STEPS[this.tutorialStepIndex] : (this.currentMode === 'tutorial_pro' ? TUTORIAL_PRO_STEPS[this.tutorialStepIndex] : null);
                    const targetCellInfo = (tutStep && tutStep.targetCells) ? tutStep.targetCells.find(t => t.r === r && t.c === c) : null;
                    if (targetCellInfo) {
                        cellEl.classList.add('tutorial-target');
                        const ghostEl = document.createElement('span');
                        ghostEl.className = 'target-ghost';
                        ghostEl.textContent = targetCellInfo.val === SUN ? '☀️' : '🌙';
                        cellEl.appendChild(ghostEl);
                    } else {
                        // Zeige eventuelle Notizen
                        const notes = this.engine.notes[r][c];
                        if (notes && notes.size > 0) {
                            const noteEl = document.createElement('div');
                            noteEl.className = 'cell-notes';
                            if (notes.has(SUN)) noteEl.innerHTML += '<span class="mini-sun">☀️</span>';
                            if (notes.has(MOON)) noteEl.innerHTML += '<span class="mini-moon">🌙</span>';
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
            audio.vibrate([25, 40]);
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

        if (!this.isGameActive || this.engine.locked[r][c]) return;

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
            // Notiz-Zyklus
            const currentVal = this.engine.grid[r][c];
            if (currentVal === EMPTY) {
                const notes = this.engine.notes[r][c];
                const nextNote = notes.has(SUN) ? MOON : SUN;
                this.engine.setCellValue(r, c, nextNote, true);
                audio.playClear();
            }
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
        if (!this.isGameActive) return;

        const MAX_HINTS = 3;
        const applyBtn = document.getElementById('btnHintApply');
        const hintTitleEl = document.querySelector('#hintModal .modal-title');

        if (this.hintsUsed >= MAX_HINTS) {
            if (applyBtn) applyBtn.style.display = 'none';
            if (hintTitleEl) hintTitleEl.textContent = `${t('hint_title')} (3/3)`;
            document.getElementById('hintText').textContent = t('hint_limit_reached');
            this.currentHint = null;
            this.toggleModal('hintModal', true);
            audio.playError();
            return;
        }

        const hint = TangoSolver.findLogicalHint(this.engine);
        if (hint) {
            this.currentHint = hint;
            this.hintsUsed++;
            audio.playHint();

            if (applyBtn) applyBtn.style.display = 'inline-block';
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

    checkCompletion() {
        if (this.currentMode === 'tutorial' || this.currentMode === 'tutorial_pro') {
            const steps = this.currentMode === 'tutorial' ? TUTORIAL_STEPS : TUTORIAL_PRO_STEPS;
            const step = steps[this.tutorialStepIndex];
            let stepSuccess = true;
            if (step && step.targetCells) {
                for (const target of step.targetCells) {
                    if (this.engine.grid[target.r][target.c] !== target.val) {
                        stepSuccess = false;
                        break;
                    }
                }
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

    onLevelVictory() {
        this.isGameActive = false;
        this.stopTimer();
        audio.playVictory();
        animations.launchConfetti();

        // Statistiken & Fortschritt speichern
        if (this.currentMode === 'campaign') {
            this.saveCampaignProgress(this.campaignLevelIndex);
        } else if (this.currentMode === 'daily') {
            this.saveDailyProgress();
        }
        this.recordGameStats(true);

        const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
        document.getElementById('victoryTime').textContent = `${mins}:${secs}`;
        document.getElementById('victoryMoves').textContent = this.movesCount;

        const expEl = document.getElementById('victoryExplanation');
        if (expEl) {
            if (this.currentMode === 'tutorial' || this.currentMode === 'tutorial_pro') {
                const steps = this.currentMode === 'tutorial' ? TUTORIAL_STEPS : TUTORIAL_PRO_STEPS;
                const step = steps[this.tutorialStepIndex];
                expEl.textContent = step.explanation || '';
                expEl.style.display = step.explanation ? 'block' : 'none';
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
        } catch (e) {}
    }

    recordGameStats(won) {
        try {
            const stats = JSON.parse(localStorage.getItem('tango_stats') || '{"played":0,"won":0,"bestTime":null,"totalTime":0}');
            stats.played++;
            if (won) {
                stats.won++;
                stats.totalTime += this.secondsElapsed;
                if (stats.bestTime === null || this.secondsElapsed < stats.bestTime) {
                    stats.bestTime = this.secondsElapsed;
                }
            }
            localStorage.setItem('tango_stats', JSON.stringify(stats));
        } catch (e) {}
    }

    openLevelSelectModal() {
        const modal = document.getElementById('levelSelectModal');
        const list = document.getElementById('levelGridList');
        if (!list) return;

        list.innerHTML = '';
        const completed = this.getCompletedLevels();
        const totalLevels = 30; // Zeige die ersten 30 Level

        for (let i = 0; i < totalLevels; i++) {
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

        this.toggleModal('levelSelectModal', true);
    }

    openFreePlayModal() {
        this.toggleModal('freePlayModal', true);
        const btnStart = document.getElementById('btnStartFreePlay');
        if (btnStart) {
            btnStart.onclick = () => {
                const size = parseInt(document.getElementById('freePlaySizeSelect').value, 10);
                const diff = document.getElementById('freePlayDiffSelect').value;
                this.toggleModal('freePlayModal', false);
                this.startFreePlay(size, diff);
            };
        }
        const btnClose = document.getElementById('btnCloseFreePlay');
        if (btnClose) {
            btnClose.onclick = () => this.toggleModal('freePlayModal', false);
        }
    }

    openSettingsModal() {
        const themeSel = document.getElementById('settingThemeSelect');
        if (themeSel) themeSel.value = this.currentTheme;

        const sndToggle = document.getElementById('settingSoundToggle');
        if (sndToggle) sndToggle.checked = audio.enabled;

        const vibToggle = document.getElementById('settingVibrationToggle');
        if (vibToggle) vibToggle.checked = audio.vibrationEnabled;

        const chkToggle = document.getElementById('settingAutoCheckToggle');
        if (chkToggle) chkToggle.checked = this.autoCheck;

        const inpSel = document.getElementById('settingInputSelect');
        if (inpSel) inpSel.value = this.inputMode;

        this.toggleModal('settingsModal', true);
    }

    openStatsModal() {
        const stats = JSON.parse(localStorage.getItem('tango_stats') || '{"played":0,"won":0,"bestTime":null,"totalTime":0}');
        document.getElementById('statPlayed').textContent = stats.played;
        document.getElementById('statWon').textContent = stats.won;
        document.getElementById('statWinRate').textContent = stats.played > 0 ? `${Math.round((stats.won / stats.played) * 100)}%` : '0%';
        
        if (stats.bestTime !== null) {
            const mins = Math.floor(stats.bestTime / 60).toString().padStart(2, '0');
            const secs = (stats.bestTime % 60).toString().padStart(2, '0');
            document.getElementById('statBestTime').textContent = `${mins}:${secs}`;
        } else {
            document.getElementById('statBestTime').textContent = '-';
        }

        this.toggleModal('statsModal', true);
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
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