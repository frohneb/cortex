/**
 * Futoshiki Solver & Strategic Hint Engine
 * Löst Futoshiki-Puzzles (4×4 bis 7×7) via Arc-Consistency (AC-3) & Backtracking (MRV),
 * verifiziert Eindeutigkeit und liefert didaktische, logisch begründete Lösungsschritte.
 */

import {
    FutoshikiEngine,
    FUTOSHIKI_EMPTY,
    CONSTRAINT_LT,
    CONSTRAINT_GT
} from './engine.js';

export class FutoshikiSolver {
    /**
     * Führt eine Arc-Consistency (AC-3) Propagation durch
     * @param {number} size
     * @param {Array<Array<Set<number>>>} domains
     * @param {Array<Array<string>>} hConstraints
     * @param {Array<Array<string>>} vConstraints
     * @returns {boolean} true wenn konsistent, false wenn ein Widerspruch (leere Domäne) auftritt
     */
    static runAC3(size, domains, hConstraints, vConstraints) {
        // Queue von Arcs (Gerichtete Kanten [fromCell, toCell, type])
        const queue = [];

        // 1. Alle Ungleichungen in die Queue einspeisen (beide Richtungen)
        // Horizontale Constraints
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                const rel = hConstraints[r][c];
                if (rel === CONSTRAINT_LT || rel === CONSTRAINT_GT) {
                    queue.push({ r1: r, c1: c, r2: r, c2: c + 1, rel });
                    queue.push({ r1: r, c1: c + 1, r2: r, c2: c, rel: rel === CONSTRAINT_LT ? CONSTRAINT_GT : CONSTRAINT_LT });
                }
            }
        }

        // Vertikale Constraints
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                const rel = vConstraints[r][c];
                if (rel === CONSTRAINT_LT || rel === CONSTRAINT_GT) {
                    queue.push({ r1: r, c1: c, r2: r + 1, c2: c, rel });
                    queue.push({ r1: r + 1, c1: c, r2: r, c2: c, rel: rel === CONSTRAINT_LT ? CONSTRAINT_GT : CONSTRAINT_LT });
                }
            }
        }

        // AllDifferent Arcs für Zeilen und Spalten
        for (let r = 0; r < size; r++) {
            for (let c1 = 0; c1 < size; c1++) {
                for (let c2 = 0; c2 < size; c2++) {
                    if (c1 !== c2) {
                        queue.push({ r1: r, c1, r2: r, c2, rel: '!=' });
                    }
                }
            }
        }

        for (let c = 0; c < size; c++) {
            for (let r1 = 0; r1 < size; r1++) {
                for (let r2 = 0; r2 < size; r2++) {
                    if (r1 !== r2) {
                        queue.push({ r1, c1: c, r2, c2: c, rel: '!=' });
                    }
                }
            }
        }

        while (queue.length > 0) {
            const arc = queue.shift();
            const { r1, c1, r2, c2, rel } = arc;
            const d1 = domains[r1][c1];
            const d2 = domains[r2][c2];

            let revised = false;

            if (rel === '!=') {
                // Wenn d2 nur 1 festen Wert hat, darf d1 diesen Wert nicht enthalten
                if (d2.size === 1) {
                    const fixedVal = Array.from(d2)[0];
                    if (d1.has(fixedVal)) {
                        d1.delete(fixedVal);
                        revised = true;
                    }
                }
            } else if (rel === CONSTRAINT_LT) {
                // Für jedes x in d1 muss ein y in d2 existieren mit x < y
                // Also muss x < max(d2) sein
                if (d2.size === 0) return false;
                const maxD2 = Math.max(...d2);
                for (const x of Array.from(d1)) {
                    if (x >= maxD2) {
                        d1.delete(x);
                        revised = true;
                    }
                }
            } else if (rel === CONSTRAINT_GT) {
                // Für jedes x in d1 muss ein y in d2 existieren mit x > y
                // Also muss x > min(d2) sein
                if (d2.size === 0) return false;
                const minD2 = Math.min(...d2);
                for (const x of Array.from(d1)) {
                    if (x <= minD2) {
                        d1.delete(x);
                        revised = true;
                    }
                }
            }

            if (d1.size === 0) {
                return false; // Widerspruch
            }

            if (revised) {
                // Alle Nachbarn von (r1, c1) wieder in die Queue legen
                // Zeile
                for (let c = 0; c < size; c++) {
                    if (c !== c1) queue.push({ r1: r1, c1: c, r2: r1, c2: c1, rel: '!=' });
                }
                // Spalte
                for (let r = 0; r < size; r++) {
                    if (r !== r1) queue.push({ r1: r, c1: c1, r2: r1, c2: c1, rel: '!=' });
                }
                // Constraints
                if (c1 > 0 && hConstraints[r1][c1 - 1]) {
                    const rRel = hConstraints[r1][c1 - 1] === CONSTRAINT_LT ? CONSTRAINT_GT : CONSTRAINT_LT;
                    queue.push({ r1: r1, c1: c1 - 1, r2: r1, c2: c1, rel: hConstraints[r1][c1 - 1] });
                }
                if (c1 < size - 1 && hConstraints[r1][c1]) {
                    const rRel = hConstraints[r1][c1] === CONSTRAINT_LT ? CONSTRAINT_GT : CONSTRAINT_LT;
                    queue.push({ r1: r1, c1: c1 + 1, r2: r1, c2: c1, rel: rRel });
                }
                if (r1 > 0 && vConstraints[r1 - 1][c1]) {
                    queue.push({ r1: r1 - 1, c1: c1, r2: r1, c2: c1, rel: vConstraints[r1 - 1][c1] });
                }
                if (r1 < size - 1 && vConstraints[r1][c1]) {
                    const rRel = vConstraints[r1][c1] === CONSTRAINT_LT ? CONSTRAINT_GT : CONSTRAINT_LT;
                    queue.push({ r1: r1 + 1, c1: c1, r2: r1, c2: c1, rel: rRel });
                }
            }
        }

        return true;
    }

    /**
     * Berechnet die vollständigen Kandidatenmengen für jede Zelle
     * unter Berücksichtigung von Zeilen, Spalten und AC-3 Ungleichungen.
     */
    static computeCandidates(engine) {
        const size = engine.size;
        const domains = Array.from({ length: size }, () =>
            Array.from({ length: size }, () => new Set())
        );

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const val = engine.grid[r][c];
                if (val !== FUTOSHIKI_EMPTY) {
                    domains[r][c] = new Set([val]);
                } else {
                    for (let v = 1; v <= engine.maxValue; v++) {
                        domains[r][c].add(v);
                    }
                }
            }
        }

        FutoshikiSolver.runAC3(size, domains, engine.hConstraints, engine.vConstraints);
        return domains;
    }

    /**
     * Löst ein Futoshiki-Puzzle vollständig via AC-3 + MRV-Backtracking.
     * @param {FutoshikiEngine|Object} puzzleInput
     * @param {number} maxSolutions Standard: 2
     * @returns {Array<Array<Array<number>>>} Liste von Lösungen (jede Lösung ist ein N×N Array)
     */
    static solve(puzzleInput, maxSolutions = 2) {
        let engine;
        if (puzzleInput instanceof FutoshikiEngine) {
            engine = puzzleInput;
        } else {
            engine = new FutoshikiEngine(puzzleInput.size || 5);
            engine.loadPuzzle(puzzleInput);
        }

        const size = engine.size;
        const initialDomains = Array.from({ length: size }, () =>
            Array.from({ length: size }, () => new Set())
        );

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const val = engine.grid[r][c];
                if (val !== FUTOSHIKI_EMPTY) {
                    initialDomains[r][c] = new Set([val]);
                } else {
                    for (let v = 1; v <= size; v++) {
                        initialDomains[r][c].add(v);
                    }
                }
            }
        }

        const consistent = FutoshikiSolver.runAC3(size, initialDomains, engine.hConstraints, engine.vConstraints);
        if (!consistent) return [];

        const solutions = [];

        function cloneDomains(doms) {
            return doms.map(row => row.map(cellSet => new Set(cellSet)));
        }

        function backtrack(currentDomains) {
            if (solutions.length >= maxSolutions) return;

            // Zelle mit minimaler Domänengröße > 1 suchen (MRV Heuristik)
            let minSize = Infinity;
            let targetR = -1;
            let targetC = -1;

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const s = currentDomains[r][c].size;
                    if (s === 0) return; // Dead end
                    if (s > 1 && s < minSize) {
                        minSize = s;
                        targetR = r;
                        targetC = c;
                    }
                }
            }

            // Wenn alle Zellen Größe 1 haben, ist das Puzzle vollständig gelöst!
            if (minSize === Infinity) {
                const solGrid = Array.from({ length: size }, () => Array(size).fill(0));
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        solGrid[r][c] = Array.from(currentDomains[r][c])[0];
                    }
                }
                solutions.push(solGrid);
                return;
            }

            // Werte ausprobieren
            const values = Array.from(currentDomains[targetR][targetC]);
            for (const val of values) {
                const nextDomains = cloneDomains(currentDomains);
                nextDomains[targetR][targetC] = new Set([val]);

                const ok = FutoshikiSolver.runAC3(size, nextDomains, engine.hConstraints, engine.vConstraints);
                if (ok) {
                    backtrack(nextDomains);
                    if (solutions.length >= maxSolutions) return;
                }
            }
        }

        backtrack(initialDomains);
        return solutions;
    }

    /**
     * Findet den didaktisch und strategisch besten nächsten logischen Hinweis
     */
    static findLogicalHint(engine, options = {}) {
        // 1. FEHLER ZUERST PRÜFEN
        const mistake = engine.findMistakes();
        if (mistake) return mistake;

        const size = engine.size;
        const grid = engine.grid;
        const focusCell = options.focusCell || null;

        // Vollständige Kandidaten berechnen
        const candidates = FutoshikiSolver.computeCandidates(engine);

        // 2. STRATEGIE: NAKED SINGLE (Nur noch ein Kandidat in Zelle)
        const nakedSingles = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === FUTOSHIKI_EMPTY && candidates[r][c].size === 1) {
                    const val = Array.from(candidates[r][c])[0];
                    nakedSingles.push({
                        type: 'naked_single',
                        strategy: 'Naked Single (Eindeutige Ziffer)',
                        title: 'Eindeutige Ziffer',
                        r, c,
                        value: val,
                        expectedVal: val,
                        highlightCells: [{ r, c }],
                        message: `In Feld (${r + 1},${c + 1}) ist nur noch die Ziffer ${val} möglich.`,
                        description: `Alle anderen Ziffern sind durch die Zeile, Spalte oder benachbarte Ungleichungen ausgeschlossen.`
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

        // 3. STRATEGIE: HIDDEN SINGLE (Zeile)
        for (let r = 0; r < size; r++) {
            for (let v = 1; v <= size; v++) {
                // Bereits in Zeile gesetzt?
                let alreadyPlaced = false;
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === v) {
                        alreadyPlaced = true;
                        break;
                    }
                }
                if (alreadyPlaced) continue;

                const possibleCols = [];
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === FUTOSHIKI_EMPTY && candidates[r][c].has(v)) {
                        possibleCols.push(c);
                    }
                }

                if (possibleCols.length === 1) {
                    const c = possibleCols[0];
                    return {
                        type: 'hidden_single_row',
                        strategy: 'Hidden Single (Zeile)',
                        title: 'Eindeutige Zeilenposition',
                        r, c,
                        value: v,
                        expectedVal: v,
                        highlightCells: [{ r, c }],
                        message: `In Zeile ${r + 1} kann die Ziffer ${v} nur noch auf Feld (${r + 1},${c + 1}) stehen.`,
                        description: `In allen anderen freien Feldern der Zeile ist die ${v} durch Spaltenkonflikte oder Ungleichungen blockiert.`
                    };
                }
            }
        }

        // 4. STRATEGIE: HIDDEN SINGLE (Spalte)
        for (let c = 0; c < size; c++) {
            for (let v = 1; v <= size; v++) {
                let alreadyPlaced = false;
                for (let r = 0; r < size; r++) {
                    if (grid[r][c] === v) {
                        alreadyPlaced = true;
                        break;
                    }
                }
                if (alreadyPlaced) continue;

                const possibleRows = [];
                for (let r = 0; r < size; r++) {
                    if (grid[r][c] === FUTOSHIKI_EMPTY && candidates[r][c].has(v)) {
                        possibleRows.push(r);
                    }
                }

                if (possibleRows.length === 1) {
                    const r = possibleRows[0];
                    return {
                        type: 'hidden_single_col',
                        strategy: 'Hidden Single (Spalte)',
                        title: 'Eindeutige Spaltenposition',
                        r, c,
                        value: v,
                        expectedVal: v,
                        highlightCells: [{ r, c }],
                        message: `In Spalte ${c + 1} kann die Ziffer ${v} nur noch auf Feld (${r + 1},${c + 1}) stehen.`,
                        description: `In allen anderen freien Feldern der Spalte ist die ${v} blockiert.`
                    };
                }
            }
        }

        // 5. STRATEGIE: EXTREMWERTE / TRANSITIVE KETTEN
        // Wenn eine Kette A < B < C existiert, kann A maximal size-2 und C minimal 3 sein.
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] !== FUTOSHIKI_EMPTY) continue;
                // Hat diese Zelle eine Ungleichung, die Extremwerte verbietet?
                // Z.B. cell < neighbor -> cell cannot be maxValue
                const candSet = candidates[r][c];
                if (c < size - 1 && engine.hConstraints[r][c] === CONSTRAINT_LT && candSet.has(size)) {
                    // candSet has size, but it is strictly less than neighbor -> contradiction prevented by AC-3
                }
            }
        }

        // 6. STRATEGIE: NAKED PAIR (Zeile oder Spalte)
        // Zwei Zellen in einer Zeile/Spalte teilen exakt dieselben 2 Kandidaten
        for (let r = 0; r < size; r++) {
            for (let c1 = 0; c1 < size; c1++) {
                if (grid[r][c1] === FUTOSHIKI_EMPTY && candidates[r][c1].size === 2) {
                    for (let c2 = c1 + 1; c2 < size; c2++) {
                        if (grid[r][c2] === FUTOSHIKI_EMPTY && candidates[r][c2].size === 2) {
                            const arr1 = Array.from(candidates[r][c1]).sort().join(',');
                            const arr2 = Array.from(candidates[r][c2]).sort().join(',');
                            if (arr1 === arr2) {
                                // Gibt es andere Zellen in der Zeile, die diese Kandidaten noch haben?
                                const pairVals = Array.from(candidates[r][c1]);
                                for (let cOther = 0; cOther < size; cOther++) {
                                    if (cOther !== c1 && cOther !== c2 && grid[r][cOther] === FUTOSHIKI_EMPTY) {
                                        if (candidates[r][cOther].has(pairVals[0]) || candidates[r][cOther].has(pairVals[1])) {
                                            return {
                                                type: 'naked_pair_row',
                                                strategy: 'Naked Pair (Zeile)',
                                                title: 'Paar-Ausschluss',
                                                r, c: cOther,
                                                highlightCells: [{ r, c: c1 }, { r, c: c2 }, { r, c: cOther }],
                                                message: `Die Felder (${r + 1},${c1 + 1}) und (${r + 1},${c2 + 1}) teilen das Paar [${pairVals.join(', ')}].`,
                                                description: `Diese Ziffern können in keinem anderen Feld von Zeile ${r + 1} vorkommen.`
                                            };
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 7. FALLBACK: NÄCHSTER SCHRITT AUS DER REFERENZLÖSUNG
        let solution = engine.getSolution();
        if (!solution) {
            const found = FutoshikiSolver.solve(engine, 1);
            if (found.length > 0) solution = found[0];
        }

        if (solution) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === FUTOSHIKI_EMPTY) {
                        const val = solution[r][c];
                        return {
                            type: 'place_number',
                            strategy: 'Nächster logischer Schritt',
                            title: 'Zahl einsetzen',
                            r, c,
                            value: val,
                            expectedVal: val,
                            highlightCells: [{ r, c }],
                            message: `In Feld (${r + 1},${c + 1}) gehört die Ziffer ${val}.`,
                            description: `Platziere die ${val} in Feld (${r + 1},${c + 1}).`
                        };
                    }
                }
            }
        }

        return null;
    }
}
