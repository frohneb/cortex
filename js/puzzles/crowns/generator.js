/**
 * Crowns (Queens) Puzzle Generator
 * Erzeugt deterministisch eindeutig lösbare Crowns-Rätsel
 * mit zusammenhängenden Farbregionen in verschiedenen Schwierigkeitsgraden.
 */

import { CROWNS_EMPTY, CROWNS_CROWN, CROWNS_X, CrownsEngine } from './engine.js';
import { CrownsSolver } from './solver.js';

export class CrownsGenerator {
    /**
     * Deterministischer PRNG (Mulberry32 — bessere Verteilung als LCG)
     */
    static seededRandom(seed) {
        let s = seed | 0;
        return function() {
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Fisher-Yates-Shuffle mit externem RNG
     */
    static shuffle(arr, rng) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * Generiert N gültige Kronenpositionen auf einem N×N Grid.
     * Jede Zeile und Spalte hat genau 1 Krone, keine 8er-Nachbarschaft.
     */
    static generateCrownPositions(size, rng) {
        const result = [];

        function backtrack(row, usedCols) {
            if (row === size) return true;

            const candidates = CrownsGenerator.shuffle(
                Array.from({ length: size }, (_, i) => i).filter(c => !usedCols.has(c)),
                rng
            );

            for (const c of candidates) {
                // 8er-Nachbarschafts-Check mit vorherigen Kronen
                let valid = true;
                for (const prev of result) {
                    if (Math.abs(prev.r - row) <= 1 && Math.abs(prev.c - c) <= 1) {
                        valid = false;
                        break;
                    }
                }
                if (!valid) continue;

                result.push({ r: row, c });
                usedCols.add(c);

                if (backtrack(row + 1, usedCols)) return true;

                result.pop();
                usedCols.delete(c);
            }
            return false;
        }

        backtrack(0, new Set());
        return result;
    }

    /**
     * Generiert zusammenhängende Regionen per Competitive Flood-Fill
     */
    static generateRegions(size, crownPositions, rng) {
        const regions = Array.from({ length: size }, () => Array(size).fill(-1));

        // Seeds setzen
        crownPositions.forEach(({ r, c }, i) => {
            regions[r][c] = i;
        });

        // Frontier-Queues pro Region
        const queues = crownPositions.map(({ r, c }) => [{ r, c }]);
        let unassigned = size * size - size;

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        // Competitive Flood-Fill: Regionen expandieren abwechselnd
        let safetyCounter = 0;
        const maxIterations = size * size * 10;

        while (unassigned > 0 && safetyCounter < maxIterations) {
            safetyCounter++;
            let anyExpanded = false;

            // Reihenfolge der Regionen shufflen für Fairness
            const order = CrownsGenerator.shuffle(Array.from({ length: size }, (_, i) => i), rng);

            for (const i of order) {
                if (queues[i].length === 0) continue;

                // Sammle alle unbesetzten Nachbarn der Frontier
                const frontierNeighbors = [];
                for (const cell of queues[i]) {
                    for (const [dr, dc] of dirs) {
                        const nr = cell.r + dr;
                        const nc = cell.c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1) {
                            if (!frontierNeighbors.some(f => f.r === nr && f.c === nc)) {
                                frontierNeighbors.push({ r: nr, c: nc });
                            }
                        }
                    }
                }

                if (frontierNeighbors.length === 0) continue;

                // Zufällige Nachbarzelle expandieren
                const pick = frontierNeighbors[Math.floor(rng() * frontierNeighbors.length)];
                regions[pick.r][pick.c] = i;
                queues[i].push(pick);
                unassigned--;
                anyExpanded = true;
            }

            if (!anyExpanded) break;
        }

        // Sicherheit: Falls noch unbesetzte Zellen, ordne sie der nächsten Region zu
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (regions[r][c] === -1) {
                    for (const [dr, dc] of dirs) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] !== -1) {
                            regions[r][c] = regions[nr][nc];
                            break;
                        }
                    }
                    if (regions[r][c] === -1) regions[r][c] = 0;
                }
            }
        }

        return regions;
    }

    /**
     * Prüft, ob eine Menge von Zellen 4-fach zusammenhängend ist
     */
    static isRegionConnected(cells) {
        if (!cells || cells.length === 0) return false;
        const set = new Set(cells.map(c => `${c.r},${c.c}`));
        const visited = new Set();
        const queue = [cells[0]];
        visited.add(`${cells[0].r},${cells[0].c}`);

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        while (queue.length > 0) {
            const curr = queue.shift();
            for (const [dr, dc] of dirs) {
                const nr = curr.r + dr;
                const nc = curr.c + dc;
                const key = `${nr},${nc}`;
                if (set.has(key) && !visited.has(key)) {
                    visited.add(key);
                    queue.push({ r: nr, c: nc });
                }
            }
        }
        return visited.size === cells.length;
    }

    /**
     * Eliminiert alternative Lösungen durch gezielte Randzellen-Verschiebungen
     */
    static makeUnique(size, crownPositions, regions, rng, maxSteps = 120) {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const targetCrownsSet = new Set(crownPositions.map(p => `${p.r},${p.c}`));
        const regCells = Array.from({ length: size }, () => []);

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                regCells[regions[r][c]].push({ r, c });
            }
        }

        const testEngine = new CrownsEngine(size);

        for (let step = 0; step < maxSteps; step++) {
            testEngine.loadPuzzle({ size, regions });
            const sols = CrownsSolver.solve(testEngine, 2);
            if (sols.length === 1) return regions;

            const targetGrid = Array.from({ length: size }, (_, r) =>
                Array.from({ length: size }, (_, c) => targetCrownsSet.has(`${r},${c}`) ? CROWNS_CROWN : CROWNS_EMPTY)
            );
            const isFirstTarget = sols[0].every((row, r) => row.every((val, c) => val === targetGrid[r][c]));
            const altSol = isFirstTarget ? sols[1] : sols[0];

            const altCrowns = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (altSol[r][c] === CROWNS_CROWN) {
                        altCrowns.push({ r, c });
                    }
                }
            }
            const altCrownsSet = new Set(altCrowns.map(p => `${p.r},${p.c}`));

            let moved = false;
            const nonTargetAlts = CrownsGenerator.shuffle(
                altCrowns.filter(p => !targetCrownsSet.has(`${p.r},${p.c}`)),
                rng
            );

            for (const { r, c } of nonTargetAlts) {
                const currReg = regions[r][c];
                const remaining = regCells[currReg].filter(p => !(p.r === r && p.c === c));
                if (!CrownsGenerator.isRegionConnected(remaining)) continue;

                for (const [dr, dc] of dirs) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] !== currReg) {
                        const adjReg = regions[nr][nc];
                        if (regCells[adjReg].some(p => altCrownsSet.has(`${p.r},${p.c}`))) {
                            regCells[currReg] = remaining;
                            regCells[adjReg].push({ r, c });
                            regions[r][c] = adjReg;
                            moved = true;
                            break;
                        }
                    }
                }
                if (moved) break;
            }

            if (!moved) {
                const allNonTarget = [];
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        if (!targetCrownsSet.has(`${r},${c}`)) allNonTarget.push({ r, c });
                    }
                }
                const shuffled = CrownsGenerator.shuffle(allNonTarget, rng);
                for (const { r, c } of shuffled) {
                    const currReg = regions[r][c];
                    const remaining = regCells[currReg].filter(p => !(p.r === r && p.c === c));
                    if (!CrownsGenerator.isRegionConnected(remaining)) continue;

                    for (const [dr, dc] of dirs) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] !== currReg) {
                            const adjReg = regions[nr][nc];
                            regCells[currReg] = remaining;
                            regCells[adjReg].push({ r, c });
                            regions[r][c] = adjReg;
                            moved = true;
                            break;
                        }
                    }
                    if (moved) break;
                }
            }

            if (!moved) break;
        }

        testEngine.loadPuzzle({ size, regions });
        if (CrownsSolver.solve(testEngine, 2).length === 1) return regions;
        return null;
    }

    /**
     * Farbpaletten für Regionen (visuell distinkt, angenehm)
     */
    static getRegionPalette(size) {
        const palettes = {
            3: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
            4: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E'],
            5: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#A29BFE'],
            6: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#A29BFE', '#FF85A1'],
            7: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#A29BFE', '#FF85A1', '#6BCB77'],
            8: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#A29BFE', '#FF85A1', '#6BCB77', '#FFB347'],
            9: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#A29BFE', '#FF85A1', '#6BCB77', '#FFB347', '#D4A5A5']
        };
        return palettes[size] || palettes[5];
    }

    /**
     * Erzeugt ein Crowns-Puzzle mit eindeutiger Lösung
     * @param {Object} opts - { size: number, difficulty: 'easy'|'medium'|'hard', seed?: number }
     */
    static generatePuzzle(opts = {}) {
        const size = opts.size || 5;
        const difficulty = opts.difficulty || 'medium';
        const seed = opts.seed !== undefined ? opts.seed : Math.floor(Math.random() * 10000000);

        for (let seedOffset = 0; seedOffset < 100; seedOffset++) {
            const currentSeed = seed + seedOffset * 7919;
            const rng = CrownsGenerator.seededRandom(currentSeed);

            const crownPositions = CrownsGenerator.generateCrownPositions(size, rng);
            if (crownPositions.length !== size) continue;

            const regions = CrownsGenerator.generateRegions(size, crownPositions, rng);
            const uniqueRegions = CrownsGenerator.makeUnique(size, crownPositions, regions, rng);
            if (!uniqueRegions) continue;

            const solution = Array.from({ length: size }, () => Array(size).fill(CROWNS_EMPTY));
            for (const { r, c } of crownPositions) {
                solution[r][c] = CROWNS_CROWN;
            }

            return {
                size,
                regions: uniqueRegions,
                regionColors: CrownsGenerator.getRegionPalette(size),
                solution,
                difficulty,
                seed: currentSeed
            };
        }

        throw new Error(`CrownsGenerator: Konnte kein eindeutiges Puzzle für size=${size} mit seed=${seed} erzeugen`);
    }
}
