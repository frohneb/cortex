/**
 * Akari (Light Up) Solver & Smart Hint Engine
 * Findet Lösungen via Backtracking & Constraint-Propagation
 * und liefert didaktisch verständliche, schrittweise logische Hinweise.
 */

import { AKARI_EMPTY, AKARI_BULB, AKARI_DOT, AkariEngine } from './engine.js';

export class AkariSolver {
    /**
     * Löst ein Akari-Rätsel und gibt bis zu maxSolutions Lösungen zurück.
     * Jede Lösung ist eine 2D-Matrix [r][c] mit 1 (Lampe) oder 0 (keine Lampe).
     */
    static solve(engine, maxSolutions = 2) {
        const rows = engine.rows;
        const cols = engine.cols;

        // White cells list
        const whiteCells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!engine.isWall(r, c)) {
                    whiteCells.push({ r, c });
                }
            }
        }

        // boardState[r][c]: 0 = unentschieden, 1 = Lampe, 2 = keine Lampe (Punkt/Wand)
        const boardState = Array.from({ length: rows }, () => Array(cols).fill(0));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.isWall(r, c)) {
                    boardState[r][c] = -1; // Wand
                }
            }
        }

        const solutions = [];

        function getRayIndices(r, c) {
            const indices = [{ r, c }];
            for (let rr = r - 1; rr >= 0 && !engine.isWall(rr, c); rr--) indices.push({ r: rr, c });
            for (let rr = r + 1; rr < rows && !engine.isWall(rr, c); rr++) indices.push({ r: rr, c });
            for (let cc = c - 1; cc >= 0 && !engine.isWall(r, cc); cc--) indices.push({ r, c: cc });
            for (let cc = c + 1; cc < cols && !engine.isWall(r, cc); cc++) indices.push({ r, c: cc });
            return indices;
        }

        function propagate(state) {
            let changed = true;
            while (changed) {
                changed = false;

                // 1. Wand-Bedingungen
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const clue = engine.walls[r][c];
                        if (clue !== null && clue >= 0) {
                            const neighbors = engine.getOrthogonalNeighbors(r, c);
                            let bulbs = 0;
                            let emptyNeighbors = [];

                            for (const n of neighbors) {
                                if (state[n.r][n.c] === 1) bulbs++;
                                else if (state[n.r][n.c] === 0) emptyNeighbors.push(n);
                            }

                            if (bulbs > clue) return false; // Widerspruch
                            if (bulbs + emptyNeighbors.length < clue) return false; // Widerspruch

                            if (bulbs === clue && emptyNeighbors.length > 0) {
                                for (const n of emptyNeighbors) {
                                    state[n.r][n.c] = 2; // keine Lampe
                                    changed = true;
                                }
                            } else if (bulbs + emptyNeighbors.length === clue && emptyNeighbors.length > 0) {
                                for (const n of emptyNeighbors) {
                                    state[n.r][n.c] = 1; // Lampe erzwingen
                                    // Alle Zellen im Strahlengang der neuen Lampe dürfen keine Lampe mehr sein
                                    const rays = getRayIndices(n.r, n.c);
                                    for (const rc of rays) {
                                        if (rc.r === n.r && rc.c === n.c) continue;
                                        if (state[rc.r][rc.c] === 1) return false; // Kollision
                                        if (state[rc.r][rc.c] === 0) {
                                            state[rc.r][rc.c] = 2;
                                            changed = true;
                                        }
                                    }
                                    changed = true;
                                }
                            }
                        }
                    }
                }

                // 2. Lampen-Kollisionen prüfen & Strahlen ausschließen
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (state[r][c] === 1) {
                            const rays = getRayIndices(r, c);
                            for (const rc of rays) {
                                if (rc.r === r && rc.c === c) continue;
                                if (state[rc.r][rc.c] === 1) return false; // Kollision
                                if (state[rc.r][rc.c] === 0) {
                                    state[rc.r][rc.c] = 2;
                                    changed = true;
                                }
                            }
                        }
                    }
                }

                // 3. Unbeleuchtete Zellen prüfen
                for (const cell of whiteCells) {
                    const rays = getRayIndices(cell.r, cell.c);
                    let isLit = false;
                    let candidateSpots = [];

                    for (const rc of rays) {
                        if (state[rc.r][rc.c] === 1) {
                            isLit = true;
                            break;
                        }
                        if (state[rc.r][rc.c] === 0) {
                            candidateSpots.push(rc);
                        }
                    }

                    if (!isLit) {
                        if (candidateSpots.length === 0) return false; // Kann nie beleuchtet werden!
                        if (candidateSpots.length === 1) {
                            const target = candidateSpots[0];
                            state[target.r][target.c] = 1;
                            changed = true;
                        }
                    }
                }
            }
            return true;
        }

        function isFullValid(state) {
            // Alle Wände erfüllt?
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const clue = engine.walls[r][c];
                    if (clue !== null && clue >= 0) {
                        const neighbors = engine.getOrthogonalNeighbors(r, c);
                        let bulbs = 0;
                        for (const n of neighbors) {
                            if (state[n.r][n.c] === 1) bulbs++;
                        }
                        if (bulbs !== clue) return false;
                    }
                }
            }

            // Alle weißen Zellen beleuchtet?
            for (const cell of whiteCells) {
                const rays = getRayIndices(cell.r, cell.c);
                let lit = false;
                for (const rc of rays) {
                    if (state[rc.r][rc.c] === 1) {
                        lit = true;
                        break;
                    }
                }
                if (!lit) return false;
            }

            return true;
        }

        function backtrack(state) {
            if (solutions.length >= maxSolutions) return;

            const copy = state.map(row => [...row]);
            if (!propagate(copy)) return;

            // Finde nächste freie Zelle
            let bestCell = null;
            let minBranching = Infinity;

            for (const cell of whiteCells) {
                if (copy[cell.r][cell.c] === 0) {
                    // Heuristik: Zelle neben nummerierter Wand bevorzugen
                    const neighbors = engine.getOrthogonalNeighbors(cell.r, cell.c);
                    let wallAdjScore = 0;
                    for (const n of neighbors) {
                        if (engine.walls[n.r][n.c] !== null && engine.walls[n.r][n.c] >= 0) {
                            wallAdjScore += 5;
                        }
                    }

                    const score = 10 - wallAdjScore;
                    if (score < minBranching) {
                        minBranching = score;
                        bestCell = cell;
                    }
                }
            }

            if (!bestCell) {
                if (isFullValid(copy)) {
                    const sol = Array.from({ length: rows }, () => Array(cols).fill(0));
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (copy[r][c] === 1) sol[r][c] = 1;
                        }
                    }
                    solutions.push(sol);
                }
                return;
            }

            // Zweig 1: Lampe setzen
            const branch1 = copy.map(row => [...row]);
            branch1[bestCell.r][bestCell.c] = 1;
            backtrack(branch1);

            if (solutions.length >= maxSolutions) return;

            // Zweig 2: Keine Lampe (Punkt)
            const branch2 = copy.map(row => [...row]);
            branch2[bestCell.r][bestCell.c] = 2;
            backtrack(branch2);
        }

        backtrack(boardState);
        return solutions;
    }

    /**
     * Findet einen logischen Hinweis für den aktuellen Spielstand
     */
    static findLogicalHint(engine, options = {}) {
        const rows = engine.rows;
        const cols = engine.cols;
        const focusCell = options.focusCell || null;

        // 1. FEHLER-ERKENNUNG ZUERST (Kollisionen, Überfüllungen, Widersprüche zur Lösung)
        const mistake = engine.findMistakes();
        if (mistake) return mistake;

        const illumination = engine.computeIllumination();
        const candidates = [];

        // 2. REGEL 1: 0er-Wände (alle noch leeren Nachbarn müssen Punkte sein)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.walls[r][c] === 0) {
                    const neighbors = engine.getOrthogonalNeighbors(r, c);
                    for (const n of neighbors) {
                        if (!engine.isWall(n.r, n.c) && engine.grid[n.r][n.c] === AKARI_EMPTY) {
                            candidates.push({
                                type: 'wall_zero',
                                strategy: '0er-Wand: Ausschluss',
                                title: '0er-Wand: Ausschluss',
                                r: n.r,
                                c: n.c,
                                value: AKARI_DOT,
                                expectedVal: AKARI_DOT,
                                highlightCells: [{ r: n.r, c: n.c }, { r, c }],
                                message: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} hat die Zahl 0. Keines ihrer Nachbarfelder darf eine Lampe enthalten. Setze einen Punkt (•).`,
                                description: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} hat die Zahl 0. Keines ihrer Nachbarfelder darf eine Lampe enthalten. Setze einen Punkt (•).`
                            });
                        }
                    }
                }
            }
        }

        // 3. REGEL 2: Erfüllte Wände (restliche leere Nachbarn müssen Punkte sein)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.walls[r][c];
                if (clue !== null && clue > 0) {
                    const neighbors = engine.getOrthogonalNeighbors(r, c);
                    let bulbs = 0;
                    const emptyNeighbors = [];

                    for (const n of neighbors) {
                        if (!engine.isWall(n.r, n.c)) {
                            if (engine.grid[n.r][n.c] === AKARI_BULB) bulbs++;
                            else if (engine.grid[n.r][n.c] === AKARI_EMPTY) emptyNeighbors.push(n);
                        }
                    }

                    if (bulbs === clue && emptyNeighbors.length > 0) {
                        for (const target of emptyNeighbors) {
                            candidates.push({
                                type: 'wall_satisfied',
                                strategy: 'Wand erfüllt',
                                title: 'Wand erfüllt',
                                r: target.r,
                                c: target.c,
                                value: AKARI_DOT,
                                expectedVal: AKARI_DOT,
                                highlightCells: [{ r: target.r, c: target.c }, { r, c }],
                                message: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} hat bereits alle ${clue} erforderlichen Lampen. Das Feld (${target.r + 1}, ${target.c + 1}) kann keine Lampe sein. Setze einen Punkt (•).`,
                                description: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} hat bereits alle ${clue} erforderlichen Lampen. Das Feld (${target.r + 1}, ${target.c + 1}) kann keine Lampe sein. Setze einen Punkt (•).`
                            });
                        }
                    }
                }
            }
        }

        // 4. REGEL 3: Erzwungene Lampen (Restbedarf = freie Nachbarn)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.walls[r][c];
                if (clue !== null && clue > 0) {
                    const neighbors = engine.getOrthogonalNeighbors(r, c);
                    let bulbs = 0;
                    const emptyNeighbors = [];

                    for (const n of neighbors) {
                        if (!engine.isWall(n.r, n.c)) {
                            if (engine.grid[n.r][n.c] === AKARI_BULB) bulbs++;
                            else if (engine.grid[n.r][n.c] === AKARI_EMPTY) emptyNeighbors.push(n);
                        }
                    }

                    const needed = clue - bulbs;
                    if (needed > 0 && emptyNeighbors.length === needed) {
                        for (const target of emptyNeighbors) {
                            candidates.push({
                                type: 'wall_forced_bulb',
                                strategy: 'Erzwungene Lampe',
                                title: 'Erzwungene Lampe',
                                r: target.r,
                                c: target.c,
                                value: AKARI_BULB,
                                expectedVal: AKARI_BULB,
                                highlightCells: [{ r: target.r, c: target.c }, { r, c }],
                                message: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} benötigt noch ${needed} Lampe(n) und hat genau ${emptyNeighbors.length} freie Nachbarfelder. Setze hier eine Lampe (💡).`,
                                description: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} benötigt noch ${needed} Lampe(n) und hat genau ${emptyNeighbors.length} freie Nachbarfelder. Setze hier eine Lampe (💡).`
                            });
                        }
                    }
                }
            }
        }

        // 5. REGEL 4: Einsame unbeleuchtete Zelle (kann nur von genau 1 Zelle beleuchtet werden)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!engine.isWall(r, c) && illumination[r][c] === 0) {
                    const rays = engine.getRayCells(r, c);
                    const spots = [];

                    for (const rc of rays) {
                        if (engine.grid[rc.r][rc.c] === AKARI_EMPTY) {
                            spots.push(rc);
                        }
                    }

                    if (spots.length === 1) {
                        const target = spots[0];
                        candidates.push({
                            type: 'lonely_unlit',
                            strategy: 'Einzige Beleuchtung',
                            title: 'Einzige Beleuchtung',
                            r: target.r,
                            c: target.c,
                            value: AKARI_BULB,
                            expectedVal: AKARI_BULB,
                            highlightCells: [{ r: target.r, c: target.c }, { r, c }],
                            message: `Das unbeleuchtete Feld bei (${r + 1}, ${c + 1}) kann nur noch durch eine Lampe auf Position (${target.r + 1}, ${target.c + 1}) erleuchtet werden!`,
                            description: `Das unbeleuchtete Feld bei (${r + 1}, ${c + 1}) kann nur noch durch eine Lampe auf Position (${target.r + 1}, ${target.c + 1}) erleuchtet werden!`
                        });
                    }
                }
            }
        }

        // Wenn deduktive Kandidaten vorliegen:
        if (candidates.length > 0) {
            if (focusCell) {
                const focused = candidates.find(h => h.r === focusCell.r && h.c === focusCell.c);
                if (focused) return focused;
            }
            return candidates[0];
        }

        // 6. FALLBACK: Solver-Lösung konsultieren
        let sol = engine.solution;
        if (!sol) {
            const cleanEngine = new AkariEngine(engine.size);
            cleanEngine.loadPuzzle({
                size: engine.size,
                walls: engine.initialWalls || engine.walls
            });
            const solutions = AkariSolver.solve(cleanEngine, 1);
            if (solutions.length > 0) {
                sol = solutions[0];
            }
        }

        if (sol) {
            // Falls focusCell gewählt und leer ist
            if (focusCell && !engine.isWall(focusCell.r, focusCell.c) && engine.grid[focusCell.r][focusCell.c] === AKARI_EMPTY) {
                const targetVal = sol[focusCell.r][focusCell.c] === 1 ? AKARI_BULB : AKARI_DOT;
                const isBulb = targetVal === AKARI_BULB;
                return {
                    type: isBulb ? 'solution_bulb' : 'solution_dot',
                    strategy: isBulb ? 'Logische Lampe' : 'Logischer Ausschluss',
                    title: isBulb ? 'Logische Lampe' : 'Logischer Ausschluss',
                    r: focusCell.r,
                    c: focusCell.c,
                    value: targetVal,
                    expectedVal: targetVal,
                    highlightCells: [{ r: focusCell.r, c: focusCell.c }],
                    message: isBulb
                        ? `Auf dem ausgewählten Feld (${focusCell.r + 1}, ${focusCell.c + 1}) muss eine Lampe (💡) platziert werden.`
                        : `Auf dem ausgewählten Feld (${focusCell.r + 1}, ${focusCell.c + 1}) darf keine Lampe stehen. Setze einen Punkt (•).`,
                    description: isBulb
                        ? `Auf dem ausgewählten Feld (${focusCell.r + 1}, ${focusCell.c + 1}) muss eine Lampe (💡) platziert werden.`
                        : `Auf dem ausgewählten Feld (${focusCell.r + 1}, ${focusCell.c + 1}) darf keine Lampe stehen. Setze einen Punkt (•).`
                };
            }

            // Ansonsten erstes leeres Feld
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (!engine.isWall(r, c) && engine.grid[r][c] === AKARI_EMPTY) {
                        const targetVal = sol[r][c] === 1 ? AKARI_BULB : AKARI_DOT;
                        const isBulb = targetVal === AKARI_BULB;
                        return {
                            type: isBulb ? 'solution_bulb' : 'solution_dot',
                            strategy: isBulb ? 'Logische Lampe' : 'Logischer Ausschluss',
                            title: isBulb ? 'Logische Lampe' : 'Logischer Ausschluss',
                            r,
                            c,
                            value: targetVal,
                            expectedVal: targetVal,
                            highlightCells: [{ r, c }],
                            message: isBulb
                                ? `Auf Feld (${r + 1}, ${c + 1}) muss eine Lampe (💡) platziert werden, um die Ausleuchtung zu sichern.`
                                : `Feld (${r + 1}, ${c + 1}) darf keine Lampe enthalten. Setze einen Punkt (•).`,
                            description: isBulb
                                ? `Auf Feld (${r + 1}, ${c + 1}) muss eine Lampe (💡) platziert werden, um die Ausleuchtung zu sichern.`
                                : `Feld (${r + 1}, ${c + 1}) darf keine Lampe enthalten. Setze einen Punkt (•).`
                        };
                    }
                }
            }
        }

        return null;
    }
}
