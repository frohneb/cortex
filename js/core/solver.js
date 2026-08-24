/**
 * Tango Solver & Hint Engine
 * Findet logische Züge mit verständlichen deutschen Erklärungen
 * und validiert die Eindeutigkeit von Rätseln via Backtracking.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE, TangoEngine } from './engine.js';

export class TangoSolver {
    /**
     * Sucht den strategisch besten nächsten logisch zwingenden Schritt.
     * Sammelt alle verfügbaren logischen Züge, bewertet sie nach Kaskaden-Tiefe,
     * Engpass-Bedeutung und optionalem Spieler-Fokus, und gibt den besten Tipp zurück.
     * 
     * @param {TangoEngine} engine
     * @param {Object} [options={}]
     * @param {{r: number, c: number}|null} [options.focusCell=null]
     */
    static findLogicalHint(engine, options = {}) {
        const size = engine.size;
        const maxPerLine = size / 2;
        const grid = engine.grid;
        const candidates = [];

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
                        candidates.push({
                            type: 'avoid_three',
                            r, c: c - 1,
                            value: opposite,
                            highlightCells: [{r, c: c-1}, {r, c}, {r, c: c+1}],
                            message: `In Zeile ${r+1} stehen zwei ${symName} nebeneinander. Um eine Dreierreihe zu verhindern, muss links davon ein ${oppName} stehen.`
                        });
                    }
                    // Rechts daneben
                    if (c + 2 < size && grid[r][c+2] === EMPTY) {
                        candidates.push({
                            type: 'avoid_three',
                            r, c: c + 2,
                            value: opposite,
                            highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                            message: `In Zeile ${r+1} stehen zwei ${symName} nebeneinander. Um eine Dreierreihe zu verhindern, muss rechts davon ein ${oppName} stehen.`
                        });
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
                        candidates.push({
                            type: 'avoid_three',
                            r: r - 1, c,
                            value: opposite,
                            highlightCells: [{r: r-1, c}, {r, c}, {r: r+1, c}],
                            message: `In Spalte ${c+1} stehen zwei ${symName} untereinander. Um eine Dreierreihe zu verhindern, muss darüber ein ${oppName} stehen.`
                        });
                    }
                    // Unten drunter
                    if (r + 2 < size && grid[r+2][c] === EMPTY) {
                        candidates.push({
                            type: 'avoid_three',
                            r: r + 2, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                            message: `In Spalte ${c+1} stehen zwei ${symName} untereinander. Um eine Dreierreihe zu verhindern, muss darunter ein ${oppName} stehen.`
                        });
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
                    candidates.push({
                        type: 'sandwich',
                        r, c: c + 1,
                        value: opposite,
                        highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                        message: `In Zeile ${r+1} umschließen zwei ${symName} ein leeres Feld. Um drei gleiche Symbole zu vermeiden, muss in die Mitte ein ${oppName}.`
                    });
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
                    candidates.push({
                        type: 'sandwich',
                        r: r + 1, c,
                        value: opposite,
                        highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                        message: `In Spalte ${c+1} umschließen zwei ${symName} ein leeres Feld. Um drei gleiche Symbole zu vermeiden, muss in die Mitte ein ${oppName}.`
                    });
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
                    candidates.push({
                        type: 'edge_direct',
                        r, c: c + 1,
                        value: targetVal,
                        highlightCells: [{r, c}, {r, c: c+1}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+1},${c+2}) bestimmt, dass rechts ein ${targetName} gesetzt werden muss.`
                    });
                } else if (v1 === EMPTY && v2 !== EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v2 : (v2 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    candidates.push({
                        type: 'edge_direct',
                        r, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r, c: c+1}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+1},${c+2}) bestimmt, dass links ein ${targetName} gesetzt werden muss.`
                    });
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
                    candidates.push({
                        type: 'edge_direct',
                        r: r + 1, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r: r+1, c}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+2},${c+1}) bestimmt, dass darunter ein ${targetName} gesetzt werden muss.`
                    });
                } else if (v1 === EMPTY && v2 !== EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v2 : (v2 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    candidates.push({
                        type: 'edge_direct',
                        r, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r: r+1, c}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+2},${c+1}) bestimmt, dass darüber ein ${targetName} gesetzt werden muss.`
                    });
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
                    for (const c of emptyCols) {
                        candidates.push({
                            type: 'balance_fill',
                            r, c,
                            value: MOON,
                            highlightCells: emptyCols.map(col => ({r, c: col})),
                            message: `In Zeile ${r+1} sind bereits alle ${maxPerLine} Sonnen gesetzt. Alle restlichen leeren Felder müssen daher Monde sein.`
                        });
                    }
                }
                if (moons === maxPerLine) {
                    for (const c of emptyCols) {
                        candidates.push({
                            type: 'balance_fill',
                            r, c,
                            value: SUN,
                            highlightCells: emptyCols.map(col => ({r, c: col})),
                            message: `In Zeile ${r+1} sind bereits alle ${maxPerLine} Monde gesetzt. Alle restlichen leeren Felder müssen daher Sonnen sein.`
                        });
                    }
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
                    for (const r of emptyRows) {
                        candidates.push({
                            type: 'balance_fill',
                            r, c,
                            value: MOON,
                            highlightCells: emptyRows.map(row => ({r: row, c})),
                            message: `In Spalte ${c+1} sind bereits alle ${maxPerLine} Sonnen gesetzt. Alle restlichen leeren Felder müssen daher Monde sein.`
                        });
                    }
                }
                if (moons === maxPerLine) {
                    for (const r of emptyRows) {
                        candidates.push({
                            type: 'balance_fill',
                            r, c,
                            value: SUN,
                            highlightCells: emptyRows.map(row => ({r: row, c})),
                            message: `In Spalte ${c+1} sind bereits alle ${maxPerLine} Monde gesetzt. Alle restlichen leeren Felder müssen daher Sonnen sein.`
                        });
                    }
                }
            }
        }

        // 5. Fortgeschrittene Kanten-Logik (Horizontale & Vertikale Kaskaden)
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                if (engine.hEdges[r][c] === EDGE_EQUAL) {
                    // Links daneben ausgefüllt
                    if (c > 0 && grid[r][c-1] !== EMPTY && grid[r][c] === EMPTY && grid[r][c+1] === EMPTY) {
                        const vPrev = grid[r][c-1];
                        const opposite = vPrev === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const prevName = vPrev === SUN ? 'Sonne' : 'Mond';
                        candidates.push({
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r, c: c-1}, {r, c}, {r, c: c+1}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r+1},${c}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                        candidates.push({
                            type: 'edge_cascade',
                            r, c: c + 1,
                            value: opposite,
                            highlightCells: [{r, c: c-1}, {r, c}, {r, c: c+1}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r+1},${c}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                    }
                    // Rechts daneben ausgefüllt
                    if (c + 2 < size && grid[r][c+2] !== EMPTY && grid[r][c] === EMPTY && grid[r][c+1] === EMPTY) {
                        const vNext = grid[r][c+2];
                        const opposite = vNext === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const nextName = vNext === SUN ? 'Sonne' : 'Mond';
                        candidates.push({
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${nextName} wie an (${r+1},${c+3}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                        candidates.push({
                            type: 'edge_cascade',
                            r, c: c + 1,
                            value: opposite,
                            highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${nextName} wie an (${r+1},${c+3}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                    }
                }
            }
        }

        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 1; r++) {
                if (engine.vEdges[r][c] === EDGE_EQUAL) {
                    // Oben drüber ausgefüllt
                    if (r > 0 && grid[r-1][c] !== EMPTY && grid[r][c] === EMPTY && grid[r+1][c] === EMPTY) {
                        const vPrev = grid[r-1][c];
                        const opposite = vPrev === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const prevName = vPrev === SUN ? 'Sonne' : 'Mond';
                        candidates.push({
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r: r-1, c}, {r, c}, {r: r+1, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                        candidates.push({
                            type: 'edge_cascade',
                            r: r + 1, c,
                            value: opposite,
                            highlightCells: [{r: r-1, c}, {r, c}, {r: r+1, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                    }
                    // Unten drunter ausgefüllt
                    if (r + 2 < size && grid[r+2][c] !== EMPTY && grid[r][c] === EMPTY && grid[r+1][c] === EMPTY) {
                        const vNext = grid[r+2][c];
                        const opposite = vNext === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const nextName = vNext === SUN ? 'Sonne' : 'Mond';
                        candidates.push({
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${nextName} wie an (${r+3},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                        candidates.push({
                            type: 'edge_cascade',
                            r: r + 1, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${nextName} wie an (${r+3},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                    }
                }
            }
        }

        // 6. Zeilen- & Spalten-Duplikat Ausschluss (Unizitäts-Beweis)
        // Zeilen-Unizität
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
                    for (const candVal of [SUN, MOON]) {
                        const testRow = [...grid[r2]];
                        testRow[emptyIndices[0]] = candVal;
                        if (emptyIndices.length === 2) {
                            const remainingVal = candVal === SUN ? MOON : SUN;
                            testRow[emptyIndices[1]] = remainingVal;
                        }
                        if (testRow.join('') === str1) {
                            const oppVal = candVal === SUN ? MOON : SUN;
                            const oppName = oppVal === SUN ? 'Sonne' : 'Mond';
                            const candName = candVal === SUN ? 'Sonne' : 'Mond';
                            candidates.push({
                                type: 'row_uniqueness',
                                r: r2, c: emptyIndices[0],
                                value: oppVal,
                                highlightCells: [{r: r1, c: 0}, {r: r2, c: emptyIndices[0]}],
                                message: `Unizitäts-Axiom: Würde an Position (${r2+1},${emptyIndices[0]+1}) ein ${candName} gesetzt, würde Zeile ${r2+1} exakt identisch zu Zeile ${r1+1} werden! Um ein Zeilen-Duplikat zu verhindern, muss dort ein ${oppName} stehen.`
                            });
                        }
                    }
                }
            }
        }

        // Spalten-Unizität
        for (let c1 = 0; c1 < size; c1++) {
            let isFull1 = true;
            let str1 = '';
            for (let r = 0; r < size; r++) {
                if (grid[r][c1] === EMPTY) { isFull1 = false; break; }
                str1 += grid[r][c1];
            }
            if (!isFull1) continue;

            for (let c2 = 0; c2 < size; c2++) {
                if (c1 === c2) continue;
                const emptyIndices = [];
                for (let r = 0; r < size; r++) {
                    if (grid[r][c2] === EMPTY) emptyIndices.push(r);
                }
                if (emptyIndices.length === 1 || emptyIndices.length === 2) {
                    for (const candVal of [SUN, MOON]) {
                        const testCol = [];
                        for (let r = 0; r < size; r++) testCol.push(grid[r][c2]);
                        testCol[emptyIndices[0]] = candVal;
                        if (emptyIndices.length === 2) {
                            const remainingVal = candVal === SUN ? MOON : SUN;
                            testCol[emptyIndices[1]] = remainingVal;
                        }
                        if (testCol.join('') === str1) {
                            const oppVal = candVal === SUN ? MOON : SUN;
                            const oppName = oppVal === SUN ? 'Sonne' : 'Mond';
                            const candName = candVal === SUN ? 'Sonne' : 'Mond';
                            candidates.push({
                                type: 'col_uniqueness',
                                r: emptyIndices[0], c: c2,
                                value: oppVal,
                                highlightCells: [{r: 0, c: c1}, {r: emptyIndices[0], c: c2}],
                                message: `Unizitäts-Axiom: Würde an Position (${emptyIndices[0]+1},${c2+1}) ein ${candName} gesetzt, würde Spalte ${c2+1} exakt identisch zu Spalte ${c1+1} werden! Um ein Spalten-Duplikat zu verhindern, muss dort ein ${oppName} stehen.`
                            });
                        }
                    }
                }
            }
        }

        // --- Strategische Bewertung und Deduplizierung aller Kandidaten ---
        if (candidates.length > 0) {
            const cellMap = new Map();
            const priorityOrder = ['edge_cascade', 'row_uniqueness', 'col_uniqueness', 'sandwich', 'avoid_three', 'edge_direct', 'balance_fill'];

            for (const cand of candidates) {
                const key = `${cand.r},${cand.c}`;
                if (!cellMap.has(key)) {
                    cellMap.set(key, { ...cand, deductionCount: 1 });
                } else {
                    const existing = cellMap.get(key);
                    existing.deductionCount++;
                    if (priorityOrder.indexOf(cand.type) < priorityOrder.indexOf(existing.type)) {
                        existing.type = cand.type;
                        existing.highlightCells = cand.highlightCells;
                        existing.message = cand.message;
                    }
                }
            }

            const uniqueCandidates = Array.from(cellMap.values());
            uniqueCandidates.forEach(cand => {
                cand._score = TangoSolver.computeHintScore(cand, engine, options) + (cand.deductionCount - 1) * 8;
            });

            uniqueCandidates.sort((a, b) => b._score - a._score);
            const best = uniqueCandidates[0];
            delete best._score;
            delete best.deductionCount;
            return best;
        }

        // 7. Ausführlicher Widerspruchs-Beweis (Widerspruchs-Test auf jedem leeren Feld)
        const contradictionCandidates = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === EMPTY) {
                    for (const testVal of [SUN, MOON]) {
                        grid[r][c] = testVal;
                        const check = engine.validateRules();
                        grid[r][c] = EMPTY; // Rückgängig machen

                        if (!check.isValid && check.errors && check.errors.length > 0) {
                            const err = check.errors[0];
                            const correctVal = testVal === SUN ? MOON : SUN;
                            const correctName = correctVal === SUN ? 'Sonne' : 'Mond';
                            const wrongName = testVal === SUN ? 'Sonne' : 'Mond';
                            contradictionCandidates.push({
                                type: 'proof_by_contradiction',
                                r, c,
                                value: correctVal,
                                highlightCells: [{r, c}],
                                message: `Widerspruchs-Beweis: Würde an Position (${r+1},${c+1}) ein ${wrongName} gesetzt, führte dies sofort zu einem Regelverstoß (${err.message}). Daher MUSS an Position (${r+1},${c+1}) ein ${correctName} stehen!`
                            });
                        }
                    }
                }
            }
        }

        if (contradictionCandidates.length > 0) {
            contradictionCandidates.forEach(cand => {
                cand._score = TangoSolver.computeHintScore(cand, engine, options);
            });
            contradictionCandidates.sort((a, b) => b._score - a._score);
            const best = contradictionCandidates[0];
            delete best._score;
            return best;
        }

        // 8. Letzte Absicherung via Solver-Ergebnis mit strategischer Positionsauswahl
        const sol = TangoSolver.solve(engine);
        if (sol && sol.length > 0) {
            const firstSol = sol[0];
            const fallbackCandidates = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === EMPTY) {
                        const val = firstSol[r][c];
                        const name = val === SUN ? 'Sonne' : 'Mond';
                        fallbackCandidates.push({
                            type: 'advanced_deduction',
                            r, c,
                            value: val,
                            highlightCells: [{r, c}],
                            message: `Tiefe Ausschluss-Logik: Aus der Gesamtschau der Zeilen-, Spalten- und Kanten-Abhängigkeiten folgt zwingend ein ${name} an Position (${r+1},${c+1}).`
                        });
                    }
                }
            }

            if (fallbackCandidates.length > 0) {
                fallbackCandidates.forEach(cand => {
                    cand._score = TangoSolver.computeHintScore(cand, engine, options);
                });
                fallbackCandidates.sort((a, b) => b._score - a._score);
                const best = fallbackCandidates[0];
                delete best._score;
                return best;
            }
        }

        return null;
    }

    /**
     * Berechnet den strategischen Wert eines Hinweises.
     * Berücksichtigt Kaskaden-Effekt (Anzahl neuer Folgeschritte), Engpässe,
     * Kanten-Constraints und optionalen Spieler-Fokus.
     */
    static computeHintScore(candidate, engine, options = {}) {
        let score = 0;
        const size = engine.size;
        const grid = engine.grid;
        const { r, c, value, type } = candidate;
        const focusCell = options.focusCell;

        // 1. Kaskaden-Tiefe: Simuliere den Zug und zähle neue sofortige Folgeschritte
        grid[r][c] = value;
        const followUps = TangoSolver._countTrivialFollowUps(engine, r, c);
        grid[r][c] = EMPTY; // Rückgängig machen
        score += Math.min(followUps * 12, 60);

        // 2. Engpass-Bonus: Zeilen / Spalten, die fast voll sind
        let emptyInRow = 0, emptyInCol = 0;
        for (let i = 0; i < size; i++) {
            if (grid[r][i] === EMPTY) emptyInRow++;
            if (grid[i][c] === EMPTY) emptyInCol++;
        }
        if (emptyInRow === 1) score += 25;
        else if (emptyInRow === 2) score += 15;
        else if (emptyInRow === 3) score += 8;

        if (emptyInCol === 1) score += 25;
        else if (emptyInCol === 2) score += 15;
        else if (emptyInCol === 3) score += 8;

        // 3. Spieler-Fokus: Bonus für Nähe zur aktuell ausgewählten Zelle
        if (focusCell && typeof focusCell.r === 'number' && typeof focusCell.c === 'number') {
            const distR = Math.abs(r - focusCell.r);
            const distC = Math.abs(c - focusCell.c);
            const manhattanDist = distR + distC;

            if (r === focusCell.r && c === focusCell.c) {
                score += 35; // Exakte Zelle, die der Spieler anvisiert
            } else if (r === focusCell.r || c === focusCell.c) {
                score += 20; // Selbe Zeile oder Spalte des Spielers
            } else if (manhattanDist <= 2) {
                score += 12; // Unmittelbares Nachbarfeld
            }
        }

        // 4. Kanten-Bedeutung / Constraint-Hebel
        let adjacentEdges = 0;
        if (c > 0 && engine.hEdges[r][c - 1] !== EDGE_NONE) adjacentEdges++;
        if (c < size - 1 && engine.hEdges[r][c] !== EDGE_NONE) adjacentEdges++;
        if (r > 0 && engine.vEdges[r - 1][c] !== EDGE_NONE) adjacentEdges++;
        if (r < size - 1 && engine.vEdges[r][c] !== EDGE_NONE) adjacentEdges++;
        score += adjacentEdges * 8;

        // 5. Lehrreichere / stärkere Muster bevorzugen
        if (type === 'edge_cascade') score += 16;
        else if (type === 'row_uniqueness' || type === 'col_uniqueness') score += 20;
        else if (type === 'sandwich') score += 10;
        else if (type === 'avoid_three') score += 8;
        else if (type === 'edge_direct') score += 8;
        else if (type === 'balance_fill') {
            if (emptyInRow > 2 && emptyInCol > 2) {
                score -= 10;
            }
        }

        // 6. Zentralitäts-Bonus (innenliegende Felder verbinden mehr Achsen)
        if (r > 0 && r < size - 1 && c > 0 && c < size - 1) {
            score += 6;
        }

        return score;
    }

    /**
     * Zählt, wie viele leere Zellen durch das Setzen von (targetR, targetC)
     * unmittelbar durch Basisregeln lösbar werden.
     */
    static _countTrivialFollowUps(engine, targetR, targetC) {
        const size = engine.size;
        const maxPerLine = size / 2;
        const grid = engine.grid;
        const solvableCells = new Set();

        // 1. Dreierreihen-Vermeidung & Sandwich in betroffener Zeile targetR
        for (let c = 0; c < size; c++) {
            if (c < size - 1 && grid[targetR][c] !== EMPTY && grid[targetR][c] === grid[targetR][c+1]) {
                if (c > 0 && grid[targetR][c-1] === EMPTY) solvableCells.add(`${targetR},${c-1}`);
                if (c + 2 < size && grid[targetR][c+2] === EMPTY) solvableCells.add(`${targetR},${c+2}`);
            }
            if (c < size - 2 && grid[targetR][c] !== EMPTY && grid[targetR][c] === grid[targetR][c+2] && grid[targetR][c+1] === EMPTY) {
                solvableCells.add(`${targetR},${c+1}`);
            }
        }

        // 2. Dreierreihen-Vermeidung & Sandwich in betroffener Spalte targetC
        for (let r = 0; r < size; r++) {
            if (r < size - 1 && grid[r][targetC] !== EMPTY && grid[r][targetC] === grid[r+1][targetC]) {
                if (r > 0 && grid[r-1][targetC] === EMPTY) solvableCells.add(`${r-1},${targetC}`);
                if (r + 2 < size && grid[r+2][targetC] === EMPTY) solvableCells.add(`${r+2},${targetC}`);
            }
            if (r < size - 2 && grid[r][targetC] !== EMPTY && grid[r][targetC] === grid[r+2][targetC] && grid[r+1][targetC] === EMPTY) {
                solvableCells.add(`${r+1},${targetC}`);
            }
        }

        // 3. Direkte Kantenbedingungen in Zeile targetR
        for (let c = 0; c < size - 1; c++) {
            if (engine.hEdges[targetR][c] !== EDGE_NONE) {
                const v1 = grid[targetR][c], v2 = grid[targetR][c+1];
                if (v1 !== EMPTY && v2 === EMPTY) solvableCells.add(`${targetR},${c+1}`);
                else if (v1 === EMPTY && v2 !== EMPTY) solvableCells.add(`${targetR},${c}`);
            }
        }

        // 4. Direkte Kantenbedingungen in Spalte targetC
        for (let r = 0; r < size - 1; r++) {
            if (engine.vEdges[r][targetC] !== EDGE_NONE) {
                const v1 = grid[r][targetC], v2 = grid[r+1][targetC];
                if (v1 !== EMPTY && v2 === EMPTY) solvableCells.add(`${r+1},${targetC}`);
                else if (v1 === EMPTY && v2 !== EMPTY) solvableCells.add(`${r},${targetC}`);
            }
        }

        // 5. Balance in Zeile targetR
        let sunsR = 0, moonsR = 0;
        for (let c = 0; c < size; c++) {
            if (grid[targetR][c] === SUN) sunsR++;
            else if (grid[targetR][c] === MOON) moonsR++;
        }
        if (sunsR === maxPerLine || moonsR === maxPerLine) {
            for (let c = 0; c < size; c++) {
                if (grid[targetR][c] === EMPTY) solvableCells.add(`${targetR},${c}`);
            }
        }

        // 6. Balance in Spalte targetC
        let sunsC = 0, moonsC = 0;
        for (let r = 0; r < size; r++) {
            if (grid[r][targetC] === SUN) sunsC++;
            else if (grid[r][targetC] === MOON) moonsC++;
        }
        if (sunsC === maxPerLine || moonsC === maxPerLine) {
            for (let r = 0; r < size; r++) {
                if (grid[r][targetC] === EMPTY) solvableCells.add(`${r},${targetC}`);
            }
        }

        solvableCells.delete(`${targetR},${targetC}`);
        return solvableCells.size;
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
