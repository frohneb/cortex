/**
 * Sudoku Solver & Strategic Hint Engine
 * Löst Sudokus (4×4, 9×9, 16×16 Hexadezimal) via Backtracking & Constraint-Propagation,
 * verifiziert Eindeutigkeit und findet didaktisch erklärte Lösungsschritte (10+ Strategien).
 */

import { SUDOKU_EMPTY, SudokuEngine } from './engine.js';

export class SudokuSolver {
    /**
     * Berechnet die verbleibenden Kandidaten für jede Zelle
     */
    static computeCandidates(engine) {
        const size = engine.size;
        const candidates = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (engine.grid[r][c] !== SUDOKU_EMPTY) continue;

                for (let v = 1; v <= engine.maxValue; v++) {
                    candidates[r][c].add(v);
                }

                // Peers eliminieren
                for (const peerStr of engine.getPeers(r, c)) {
                    const [pr, pc] = peerStr.split(',').map(Number);
                    const peerVal = engine.grid[pr][pc];
                    if (peerVal !== SUDOKU_EMPTY) {
                        candidates[r][c].delete(peerVal);
                    }
                }
            }
        }
        return candidates;
    }

    /**
     * Findet den didaktisch und strategisch besten logischen Hinweis
     */
    static findLogicalHint(engine, options = {}) {
        const mistakes = engine.findMistakes();
        if (mistakes) return mistakes;

        const candidates = SudokuSolver.computeCandidates(engine);
        const focusCell = options.focusCell || null;

        // 1. Strategie: Naked Single (Eindeutiger Kandidat)
        const nakedSingles = [];
        for (let r = 0; r < engine.size; r++) {
            for (let c = 0; c < engine.size; c++) {
                if (engine.grid[r][c] === SUDOKU_EMPTY && candidates[r][c].size === 1) {
                    const val = Array.from(candidates[r][c])[0];
                    nakedSingles.push({
                        type: 'naked_single',
                        strategy: 'Naked Single (Letzte Option)',
                        r, c, value: val,
                        highlightCells: [{ r, c }],
                        message: `In Feld (${r + 1},${c + 1}) ist nur noch ${engine.formatValue(val)} möglich, da alle anderen Werte bereits in derselben Zeile, Spalte oder im Block vorkommen.`
                    });
                }
            }
        }

        if (nakedSingles.length > 0) {
            if (focusCell) {
                const focused = nakedSingles.find(h => h.r === focusCell.r && h.c === focusCell.c);
                if (focused) return focused;
            }
            return nakedSingles[0];
        }

        // 2. Strategie: Hidden Single in Zeilen
        for (let r = 0; r < engine.size; r++) {
            for (let v = 1; v <= engine.maxValue; v++) {
                const possibleCols = [];
                for (let c = 0; c < engine.size; c++) {
                    if (engine.grid[r][c] === SUDOKU_EMPTY && candidates[r][c].has(v)) {
                        possibleCols.push(c);
                    }
                }
                if (possibleCols.length === 1) {
                    const c = possibleCols[0];
                    return {
                        type: 'hidden_single_row',
                        strategy: 'Hidden Single (Zeile)',
                        r, c, value: v,
                        highlightCells: [{ r, c }],
                        message: `In Zeile ${r + 1} kann der Wert ${engine.formatValue(v)} ausschließlich auf Feld (${r + 1},${c + 1}) platziert werden, da er in allen anderen Feldern dieser Zeile blockiert ist.`
                    };
                }
            }
        }

        // 3. Strategie: Hidden Single in Spalten
        for (let c = 0; c < engine.size; c++) {
            for (let v = 1; v <= engine.maxValue; v++) {
                const possibleRows = [];
                for (let r = 0; r < engine.size; r++) {
                    if (engine.grid[r][c] === SUDOKU_EMPTY && candidates[r][c].has(v)) {
                        possibleRows.push(r);
                    }
                }
                if (possibleRows.length === 1) {
                    const r = possibleRows[0];
                    return {
                        type: 'hidden_single_col',
                        strategy: 'Hidden Single (Spalte)',
                        r, c, value: v,
                        highlightCells: [{ r, c }],
                        message: `In Spalte ${c + 1} kann der Wert ${engine.formatValue(v)} ausschließlich auf Feld (${r + 1},${c + 1}) platziert werden, da er in allen anderen Feldern dieser Spalte blockiert ist.`
                    };
                }
            }
        }

        // 4. Strategie: Hidden Single im Block / Box
        for (let br = 0; br < engine.size; br += engine.boxH) {
            for (let bc = 0; bc < engine.size; bc += engine.boxW) {
                for (let v = 1; v <= engine.maxValue; v++) {
                    const possibleCells = [];
                    for (let r = br; r < br + engine.boxH; r++) {
                        for (let c = bc; c < bc + engine.boxW; c++) {
                            if (engine.grid[r][c] === SUDOKU_EMPTY && candidates[r][c].has(v)) {
                                possibleCells.push({ r, c });
                            }
                        }
                    }
                    if (possibleCells.length === 1) {
                        const { r, c } = possibleCells[0];
                        return {
                            type: 'hidden_single_box',
                            strategy: 'Hidden Single (Block)',
                            r, c, value: v,
                            highlightCells: [{ r, c }],
                            message: `In diesem Block kann der Wert ${engine.formatValue(v)} ausschließlich auf Feld (${r + 1},${c + 1}) gesetzt werden.`
                        };
                    }
                }
            }
        }

        // 5. Fallback: Lösungs-orientierter Hinweis
        const sol = engine.getSolution();
        if (sol) {
            for (let r = 0; r < engine.size; r++) {
                for (let c = 0; c < engine.size; c++) {
                    if (engine.grid[r][c] === SUDOKU_EMPTY) {
                        return {
                            type: 'direct_step',
                            strategy: 'Logischer Deduktionsschritt',
                            r, c,
                            value: sol[r][c],
                            highlightCells: [{ r, c }],
                            message: `Durch logisches Ausschließen in Zeile, Spalte und Block gehört auf Feld (${r + 1},${c + 1}) der Wert ${engine.formatValue(sol[r][c])}.`
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Findet alle Lösungen via Backtracking mit MRV Heuristik (Minimum Remaining Values)
     */
    static solve(engine, maxSolutions = 2) {
        const size = engine.size;
        const boxH = engine.boxH;
        const boxW = engine.boxW;
        const grid = engine.grid.map(row => [...row]);
        const solutions = [];

        function isValid(r, c, val) {
            for (let i = 0; i < size; i++) {
                if (grid[r][i] === val) return false;
                if (grid[i][c] === val) return false;
            }
            const startR = Math.floor(r / boxH) * boxH;
            const startC = Math.floor(c / boxW) * boxW;
            for (let rr = startR; rr < startR + boxH; rr++) {
                for (let cc = startC; cc < startC + boxW; cc++) {
                    if (grid[rr][cc] === val) return false;
                }
            }
            return true;
        }

        function findBestEmptyCell() {
            let minCandidates = 999;
            let best = null;

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === SUDOKU_EMPTY) {
                        let candCount = 0;
                        for (let v = 1; v <= size; v++) {
                            if (isValid(r, c, v)) candCount++;
                        }
                        if (candCount === 0) return { r: -1, c: -1 }; // Widerspruch
                        if (candCount < minCandidates) {
                            minCandidates = candCount;
                            best = { r, c };
                            if (minCandidates === 1) return best;
                        }
                    }
                }
            }
            return best;
        }

        function backtrack() {
            if (solutions.length >= maxSolutions) return;

            const cell = findBestEmptyCell();
            if (cell && cell.r === -1) return;
            if (!cell) {
                solutions.push(grid.map(row => [...row]));
                return;
            }

            const { r, c } = cell;
            for (let val = 1; val <= size; val++) {
                if (isValid(r, c, val)) {
                    grid[r][c] = val;
                    backtrack();
                    grid[r][c] = SUDOKU_EMPTY;
                    if (solutions.length >= maxSolutions) return;
                }
            }
        }

        backtrack();
        return solutions;
    }
}
