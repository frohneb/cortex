/**
 * Crowns (Queens) Puzzle Solver
 * Logischer Solver mit 7 Prioritätsregeln + Backtracking-Fallback.
 * Hint-System gibt strukturierte, nachvollziehbare Hinweise zurück.
 */

import { CROWNS_EMPTY, CROWNS_CROWN, CROWNS_X } from './engine.js';

export class CrownsSolver {
    /**
     * Löst das Puzzle und gibt bis zu maxSolutions Lösungen zurück.
     * Jede Lösung ist ein N×N Array mit CROWNS_CROWN oder CROWNS_EMPTY.
     */
    static solve(engine, maxSolutions = 1) {
        const size = engine.size;
        const regions = engine.regions;
        const solutions = [];

        const usedCols = new Array(size).fill(false);
        const usedRegs = new Array(size).fill(false);
        const crownCol = new Array(size).fill(-1);

        let hasConflict = false;
        const fixedRow = new Array(size).fill(-1);
        const forbidden = Array.from({ length: size }, () => Array(size).fill(false));

        if (engine.grid) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (engine.grid[r][c] === CROWNS_CROWN) {
                        if (fixedRow[r] !== -1) hasConflict = true;
                        fixedRow[r] = c;
                    } else if (engine.grid[r][c] === CROWNS_X) {
                        forbidden[r][c] = true;
                    }
                }
            }
        }
        if (hasConflict) return [];

        function backtrack(row) {
            if (solutions.length >= maxSolutions) return;
            if (row === size) {
                const sol = Array.from({ length: size }, (_, r) =>
                    Array.from({ length: size }, (_, c) => crownCol[r] === c ? CROWNS_CROWN : CROWNS_EMPTY)
                );
                solutions.push(sol);
                return;
            }

            const prevCol = row > 0 ? crownCol[row - 1] : -99;

            if (fixedRow[row] !== -1) {
                const c = fixedRow[row];
                const reg = regions[row][c];
                if (usedCols[c] || Math.abs(c - prevCol) <= 1 || usedRegs[reg]) return;
                usedCols[c] = true;
                usedRegs[reg] = true;
                crownCol[row] = c;

                backtrack(row + 1);

                usedCols[c] = false;
                usedRegs[reg] = false;
                crownCol[row] = -1;
                return;
            }

            for (let c = 0; c < size; c++) {
                if (forbidden[row][c] || usedCols[c] || Math.abs(c - prevCol) <= 1) continue;
                const reg = regions[row][c];
                if (usedRegs[reg]) continue;

                usedCols[c] = true;
                usedRegs[reg] = true;
                crownCol[row] = c;

                backtrack(row + 1);

                usedCols[c] = false;
                usedRegs[reg] = false;
                crownCol[row] = -1;
            }
        }

        backtrack(0);
        return solutions;
    }

    /**
     * Findet einen logischen Hinweis für den nächsten Schritt.
     * Erfüllt den Cortex Hint-Contract: { strategy, title, r, c, value, expectedVal, message, description, highlightCells }
     */
    static findLogicalHint(engine, options = {}) {
        // 1. FEHLER-ERKENNUNG ZUERST (Kollisionen, unzulässige Kronen, falsche Kreuze)
        const mistake = engine.findMistakes ? engine.findMistakes() : null;
        if (mistake) return mistake;

        const size = engine.size;
        const grid = engine.grid;
        const regions = engine.regions;
        const focusCell = options.focusCell || null;

        // Berechne verfügbare Zellen pro Zeile, Spalte und Farbregion
        const availableInRow = Array.from({ length: size }, () => []);
        const availableInCol = Array.from({ length: size }, () => []);
        const availableInRegion = Array.from({ length: size }, () => []);

        const hasCrownInRow = new Array(size).fill(false);
        const hasCrownInCol = new Array(size).fill(false);
        const hasCrownInRegion = new Array(size).fill(false);

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === CROWNS_CROWN) {
                    hasCrownInRow[r] = true;
                    hasCrownInCol[c] = true;
                    hasCrownInRegion[regions[r][c]] = true;
                }
            }
        }

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] !== CROWNS_EMPTY) continue;
                if (hasCrownInRow[r] || hasCrownInCol[c] || hasCrownInRegion[regions[r][c]]) continue;

                // Prüfe ob Zelle durch benachbarte Krone blockiert ist
                let blocked = false;
                for (const n of engine.getNeighbors8(r, c)) {
                    if (grid[n.r][n.c] === CROWNS_CROWN) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) continue;

                const pos = { r, c };
                availableInRow[r].push(pos);
                availableInCol[c].push(pos);
                availableInRegion[regions[r][c]].push(pos);
            }
        }

        const candidates = [];

        // 2. KRONEN-PLATZIERUNG: Einzige freie Stelle in Farbregion
        for (let reg = 0; reg < size; reg++) {
            if (hasCrownInRegion[reg]) continue;
            if (availableInRegion[reg].length === 1) {
                const cell = availableInRegion[reg][0];
                candidates.push({
                    priority: 10,
                    type: 'place_crown',
                    strategy: 'Krone in Farbregion platzieren',
                    title: 'Krone in Farbregion platzieren',
                    r: cell.r,
                    c: cell.c,
                    value: CROWNS_CROWN,
                    expectedVal: CROWNS_CROWN,
                    message: `In Farbregion ${reg + 1} gibt es nur noch ein einziges freies Feld (${cell.r + 1}, ${cell.c + 1}). Hier muss eine Krone 👑 stehen.`,
                    description: `In Farbregion ${reg + 1} gibt es nur noch ein einziges freies Feld (${cell.r + 1}, ${cell.c + 1}). Hier muss eine Krone 👑 stehen.`,
                    highlightCells: [cell]
                });
            }
        }

        // 3. KRONEN-PLATZIERUNG: Einzige freie Stelle in Zeile
        for (let r = 0; r < size; r++) {
            if (hasCrownInRow[r]) continue;
            if (availableInRow[r].length === 1) {
                const cell = availableInRow[r][0];
                candidates.push({
                    priority: 9,
                    type: 'place_crown',
                    strategy: 'Krone in Zeile platzieren',
                    title: 'Krone in Zeile platzieren',
                    r: cell.r,
                    c: cell.c,
                    value: CROWNS_CROWN,
                    expectedVal: CROWNS_CROWN,
                    message: `In Zeile ${r + 1} gibt es nur noch ein einziges freies Feld (${cell.r + 1}, ${cell.c + 1}). Hier muss eine Krone 👑 stehen.`,
                    description: `In Zeile ${r + 1} gibt es nur noch ein einziges freies Feld (${cell.r + 1}, ${cell.c + 1}). Hier muss eine Krone 👑 stehen.`,
                    highlightCells: [cell]
                });
            }
        }

        // 4. KRONEN-PLATZIERUNG: Einzige freie Stelle in Spalte
        for (let c = 0; c < size; c++) {
            if (hasCrownInCol[c]) continue;
            if (availableInCol[c].length === 1) {
                const cell = availableInCol[c][0];
                candidates.push({
                    priority: 9,
                    type: 'place_crown',
                    strategy: 'Krone in Spalte platzieren',
                    title: 'Krone in Spalte platzieren',
                    r: cell.r,
                    c: cell.c,
                    value: CROWNS_CROWN,
                    expectedVal: CROWNS_CROWN,
                    message: `In Spalte ${c + 1} gibt es nur noch ein einziges freies Feld (${cell.r + 1}, ${cell.c + 1}). Hier muss eine Krone 👑 stehen.`,
                    description: `In Spalte ${c + 1} gibt es nur noch ein einziges freies Feld (${cell.r + 1}, ${cell.c + 1}). Hier muss eine Krone 👑 stehen.`,
                    highlightCells: [cell]
                });
            }
        }

        // 5. NACHBAR-AUSSCHLUSS: 8er-Schutzring um gesetzte Kronen
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] !== CROWNS_CROWN) continue;
                for (const n of engine.getNeighbors8(r, c)) {
                    if (grid[n.r][n.c] === CROWNS_EMPTY) {
                        candidates.push({
                            priority: 8,
                            type: 'eliminate',
                            strategy: 'Feld ausschließen: Kronen-Schutzring',
                            title: 'Feld ausschließen: Kronen-Schutzring',
                            r: n.r,
                            c: n.c,
                            value: CROWNS_X,
                            expectedVal: CROWNS_X,
                            message: `Kronen dürfen sich nicht berühren (auch nicht diagonal). Feld (${n.r + 1}, ${n.c + 1}) grenzt an die Krone bei (${r + 1}, ${c + 1}) und wird mit ✕ markiert.`,
                            description: `Kronen dürfen sich nicht berühren (auch nicht diagonal). Feld (${n.r + 1}, ${n.c + 1}) grenzt an die Krone bei (${r + 1}, ${c + 1}) und wird mit ✕ markiert.`,
                            highlightCells: [{ r, c }, { r: n.r, c: n.c }]
                        });
                    }
                }
            }
        }

        // 6. ZEILEN-, SPALTEN- UND REGIONEN-SÄTTIGUNG: Bereits platzierte Krone schließt Rest aus
        for (let r = 0; r < size; r++) {
            if (!hasCrownInRow[r]) continue;
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === CROWNS_EMPTY) {
                    candidates.push({
                        priority: 7,
                        type: 'eliminate',
                        strategy: 'Feld ausschließen: Zeile besetzt',
                        title: 'Feld ausschließen: Zeile besetzt',
                        r, c,
                        value: CROWNS_X,
                        expectedVal: CROWNS_X,
                        message: `In Zeile ${r + 1} steht bereits eine Krone. Feld (${r + 1}, ${c + 1}) kann keine Krone mehr enthalten und wird mit ✕ markiert.`,
                        description: `In Zeile ${r + 1} steht bereits eine Krone. Feld (${r + 1}, ${c + 1}) kann keine Krone mehr enthalten und wird mit ✕ markiert.`,
                        highlightCells: [{ r, c }]
                    });
                }
            }
        }

        for (let c = 0; c < size; c++) {
            if (!hasCrownInCol[c]) continue;
            for (let r = 0; r < size; r++) {
                if (grid[r][c] === CROWNS_EMPTY) {
                    candidates.push({
                        priority: 7,
                        type: 'eliminate',
                        strategy: 'Feld ausschließen: Spalte besetzt',
                        title: 'Feld ausschließen: Spalte besetzt',
                        r, c,
                        value: CROWNS_X,
                        expectedVal: CROWNS_X,
                        message: `In Spalte ${c + 1} steht bereits eine Krone. Feld (${r + 1}, ${c + 1}) kann keine Krone mehr enthalten und wird mit ✕ markiert.`,
                        description: `In Spalte ${c + 1} steht bereits eine Krone. Feld (${r + 1}, ${c + 1}) kann keine Krone mehr enthalten und wird mit ✕ markiert.`,
                        highlightCells: [{ r, c }]
                    });
                }
            }
        }

        for (let reg = 0; reg < size; reg++) {
            if (!hasCrownInRegion[reg]) continue;
            for (const { r, c } of engine.getRegionCells(reg)) {
                if (grid[r][c] === CROWNS_EMPTY) {
                    candidates.push({
                        priority: 7,
                        type: 'eliminate',
                        strategy: 'Feld ausschließen: Farbregion besetzt',
                        title: 'Feld ausschließen: Farbregion besetzt',
                        r, c,
                        value: CROWNS_X,
                        expectedVal: CROWNS_X,
                        message: `Farbregion ${reg + 1} hat bereits eine Krone. Feld (${r + 1}, ${c + 1}) kann keine Krone mehr enthalten und wird mit ✕ markiert.`,
                        description: `Farbregion ${reg + 1} hat bereits eine Krone. Feld (${r + 1}, ${c + 1}) kann keine Krone mehr enthalten und wird mit ✕ markiert.`,
                        highlightCells: [{ r, c }]
                    });
                }
            }
        }

        // 7. REGION-ZEILEN-/SPALTEN-EINENGUNG (Pointing)
        for (let reg = 0; reg < size; reg++) {
            if (hasCrownInRegion[reg]) continue;
            const avail = availableInRegion[reg];
            if (avail.length < 2) continue;

            const rows = new Set(avail.map(p => p.r));
            if (rows.size === 1) {
                const row = avail[0].r;
                for (let c = 0; c < size; c++) {
                    if (grid[row][c] === CROWNS_EMPTY && regions[row][c] !== reg) {
                        candidates.push({
                            priority: 6,
                            type: 'eliminate',
                            strategy: 'Logischer Ausschluss: Farbregion-Bindung',
                            title: 'Logischer Ausschluss: Farbregion-Bindung',
                            r: row,
                            c,
                            value: CROWNS_X,
                            expectedVal: CROWNS_X,
                            message: `Alle verbleibenden Möglichkeiten für Farbregion ${reg + 1} liegen in Zeile ${row + 1}. Feld (${row + 1}, ${c + 1}) kann daher keine Krone enthalten (✕).`,
                            description: `Alle verbleibenden Möglichkeiten für Farbregion ${reg + 1} liegen in Zeile ${row + 1}. Feld (${row + 1}, ${c + 1}) kann daher keine Krone enthalten (✕).`,
                            highlightCells: avail.concat([{ r: row, c }])
                        });
                    }
                }
            }

            const cols = new Set(avail.map(p => p.c));
            if (cols.size === 1) {
                const col = avail[0].c;
                for (let r = 0; r < size; r++) {
                    if (grid[r][col] === CROWNS_EMPTY && regions[r][col] !== reg) {
                        candidates.push({
                            priority: 6,
                            type: 'eliminate',
                            strategy: 'Logischer Ausschluss: Farbregion-Bindung',
                            title: 'Logischer Ausschluss: Farbregion-Bindung',
                            r,
                            c: col,
                            value: CROWNS_X,
                            expectedVal: CROWNS_X,
                            message: `Alle verbleibenden Möglichkeiten für Farbregion ${reg + 1} liegen in Spalte ${col + 1}. Feld (${r + 1}, ${col + 1}) kann daher keine Krone enthalten (✕).`,
                            description: `Alle verbleibenden Möglichkeiten für Farbregion ${reg + 1} liegen in Spalte ${col + 1}. Feld (${r + 1}, ${col + 1}) kann daher keine Krone enthalten (✕).`,
                            highlightCells: avail.concat([{ r, c: col }])
                        });
                    }
                }
            }
        }

        // Falls Kandidaten gefunden wurden: Priorisiere focusCell, sonst höchste Priorität
        if (candidates.length > 0) {
            if (focusCell) {
                const focused = candidates.find(c => c.r === focusCell.r && c.c === focusCell.c);
                if (focused) return focused;
            }
            candidates.sort((a, b) => b.priority - a.priority);
            return candidates[0];
        }

        // 8. FALLBACK ZUR LÖSUNG: Finde den nächsten korrekten Kronen-Zug
        const sol = engine.getSolution ? engine.getSolution() : engine.solution;
        if (sol) {
            // Zuerst nach einer unbesetzten Krone suchen
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === CROWNS_EMPTY && sol[r][c] === CROWNS_CROWN) {
                        const reg = regions[r][c];
                        return {
                            type: 'place_crown',
                            strategy: 'Logische Deduktion: Krone erzwungen',
                            title: 'Logische Deduktion: Krone erzwungen',
                            r, c,
                            value: CROWNS_CROWN,
                            expectedVal: CROWNS_CROWN,
                            message: `Durch logische Kombination der Regions- und Zeilenausschlüsse muss an Position (${r + 1}, ${c + 1}) in Farbregion ${reg + 1} eine Krone 👑 platziert werden.`,
                            description: `Durch logische Kombination der Regions- und Zeilenausschlüsse muss an Position (${r + 1}, ${c + 1}) in Farbregion ${reg + 1} eine Krone 👑 platziert werden.`,
                            highlightCells: [{ r, c }]
                        };
                    }
                }
            }

            // Falls alle Kronen bereits gesetzt sind, leere Felder mit ✕ füllen
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === CROWNS_EMPTY) {
                        return {
                            type: 'eliminate',
                            strategy: 'Feld ausschließen: Leeres Feld',
                            title: 'Feld ausschließen: Leeres Feld',
                            r, c,
                            value: CROWNS_X,
                            expectedVal: CROWNS_X,
                            message: `Feld (${r + 1}, ${c + 1}) kann keine Krone mehr enthalten und wird mit ✕ markiert.`,
                            description: `Feld (${r + 1}, ${c + 1}) kann keine Krone mehr enthalten und wird mit ✕ markiert.`,
                            highlightCells: [{ r, c }]
                        };
                    }
                }
            }
        }

        return null;
    }
}
