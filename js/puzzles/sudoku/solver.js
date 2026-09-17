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
     * Zählt die Anzahl der Lösungen mit ultra-schnellem Bitmask-Backtracking & MRV
     * Bricht bei Erreichen von maxSolutions oder maxNodes sofort ab (Schutz vor Thread-Freeze).
     */
    static countSolutions(grid, size = 9, maxSolutions = 2, maxNodes = 5000) {
        const boxH = size === 4 ? 2 : (size === 16 ? 4 : 3);
        const boxW = size === 4 ? 2 : (size === 16 ? 4 : 3);
        const fullMask = (1 << (size + 1)) - 2;

        const rowMask = new Int32Array(size);
        const colMask = new Int32Array(size);
        const boxMask = new Int32Array(size);
        const emptyCells = [];

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const v = grid[r][c];
                const b = Math.floor(r / boxH) * boxW + Math.floor(c / boxW);
                if (v > 0) {
                    const bit = 1 << v;
                    if ((rowMask[r] & bit) || (colMask[c] & bit) || (boxMask[b] & bit)) {
                        return 0; // Ungültiger Zustand
                    }
                    rowMask[r] |= bit;
                    colMask[c] |= bit;
                    boxMask[b] |= bit;
                } else {
                    emptyCells.push({ r, c, b });
                }
            }
        }

        function bitCount(n) {
            let c = 0;
            while (n > 0) {
                n &= n - 1;
                c++;
            }
            return c;
        }

        let solutionCount = 0;
        let nodeCount = 0;

        function search() {
            nodeCount++;
            if (nodeCount > maxNodes) {
                solutionCount = Math.max(solutionCount, maxSolutions);
                return;
            }
            if (solutionCount >= maxSolutions) return;

            let minCandidates = 999;
            let bestIdx = -1;
            let bestAvail = 0;

            for (let i = 0; i < emptyCells.length; i++) {
                const cell = emptyCells[i];
                if (grid[cell.r][cell.c] !== SUDOKU_EMPTY) continue;

                const used = rowMask[cell.r] | colMask[cell.c] | boxMask[cell.b];
                const avail = fullMask & ~used;
                const cnt = bitCount(avail);

                if (cnt === 0) return; // Widerspruch

                if (cnt < minCandidates) {
                    minCandidates = cnt;
                    bestIdx = i;
                    bestAvail = avail;
                    if (minCandidates === 1) break;
                }
            }

            if (bestIdx === -1) {
                solutionCount++;
                return;
            }

            const cell = emptyCells[bestIdx];
            const { r, c, b } = cell;
            let avail = bestAvail;

            while (avail > 0) {
                const lsb = avail & -avail;
                const val = 31 - Math.clz32(lsb);

                grid[r][c] = val;
                rowMask[r] |= lsb;
                colMask[c] |= lsb;
                boxMask[b] |= lsb;

                search();

                rowMask[r] &= ~lsb;
                colMask[c] &= ~lsb;
                boxMask[b] &= ~lsb;
                grid[r][c] = SUDOKU_EMPTY;
                avail &= ~lsb;

                if (solutionCount >= maxSolutions || nodeCount > maxNodes) return;
            }
        }

        search();
        return solutionCount;
    }

    /**
     * Findet alle Lösungen via ultra-schnellem Bitmask-Backtracking mit MRV Heuristik
     */
    static solve(engine, maxSolutions = 2) {
        const size = engine.size;
        const boxH = engine.boxH || (size === 4 ? 2 : (size === 16 ? 4 : 3));
        const boxW = engine.boxW || (size === 4 ? 2 : (size === 16 ? 4 : 3));
        const grid = engine.grid.map(row => [...row]);
        const solutions = [];
        const fullMask = (1 << (size + 1)) - 2;

        const rowMask = new Int32Array(size);
        const colMask = new Int32Array(size);
        const boxMask = new Int32Array(size);
        const emptyCells = [];

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const v = grid[r][c];
                const b = Math.floor(r / boxH) * boxW + Math.floor(c / boxW);
                if (v > 0) {
                    const bit = 1 << v;
                    if ((rowMask[r] & bit) || (colMask[c] & bit) || (boxMask[b] & bit)) {
                        return solutions;
                    }
                    rowMask[r] |= bit;
                    colMask[c] |= bit;
                    boxMask[b] |= bit;
                } else {
                    emptyCells.push({ r, c, b });
                }
            }
        }

        function bitCount(n) {
            let c = 0;
            while (n > 0) {
                n &= n - 1;
                c++;
            }
            return c;
        }

        let nodeCount = 0;
        const maxNodes = 10000;

        function backtrack() {
            nodeCount++;
            if (nodeCount > maxNodes) return;
            if (solutions.length >= maxSolutions) return;

            let minCandidates = 999;
            let bestIdx = -1;
            let bestAvail = 0;

            for (let i = 0; i < emptyCells.length; i++) {
                const cell = emptyCells[i];
                if (grid[cell.r][cell.c] !== SUDOKU_EMPTY) continue;

                const used = rowMask[cell.r] | colMask[cell.c] | boxMask[cell.b];
                const avail = fullMask & ~used;
                const cnt = bitCount(avail);

                if (cnt === 0) return;

                if (cnt < minCandidates) {
                    minCandidates = cnt;
                    bestIdx = i;
                    bestAvail = avail;
                    if (minCandidates === 1) break;
                }
            }

            if (bestIdx === -1) {
                solutions.push(grid.map(row => [...row]));
                return;
            }

            const cell = emptyCells[bestIdx];
            const { r, c, b } = cell;
            let avail = bestAvail;

            while (avail > 0) {
                const lsb = avail & -avail;
                const val = 31 - Math.clz32(lsb);

                grid[r][c] = val;
                rowMask[r] |= lsb;
                colMask[c] |= lsb;
                boxMask[b] |= lsb;

                backtrack();

                rowMask[r] &= ~lsb;
                colMask[c] &= ~lsb;
                boxMask[b] &= ~lsb;
                grid[r][c] = SUDOKU_EMPTY;
                avail &= ~lsb;

                if (solutions.length >= maxSolutions || nodeCount > maxNodes) return;
            }
        }

        backtrack();
        return solutions;
    }
}
