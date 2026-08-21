/**
 * Tango Solver & Hint Engine
 * Findet logische Züge mit verständlichen deutschen Erklärungen
 * und validiert die Eindeutigkeit von Rätseln via Backtracking.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE, TangoEngine } from './engine.js';

export class TangoSolver {
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
