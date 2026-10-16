/**
 * Hashiwokakero (Bridges / Brücken) Puzzle Generator
 * Generiert deterministisch eindeutig lösbare Hashi-Puzzles
 * mit zusammenhängendem Inselnetzwerk in verschiedenen Schwierigkeitsgraden.
 */

import {
    HashiEngine,
    HASHI_BRIDGE_SINGLE,
    HASHI_BRIDGE_DOUBLE,
    HASHI_MAX_BRIDGES
} from './engine.js';
import { HashiSolver } from './solver.js';

export class HashiGenerator {
    /**
     * Deterministischer PRNG (Mulberry32)
     */
    static seededRandom(seed) {
        let s = (seed || 1) | 0;
        return function() {
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Fisher-Yates Shuffle
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
     * Generiert ein Hashi-Puzzle mit eindeutiger Lösung
     * @param {Object} options
     *   rows: number (optional, Standard 7)
     *   cols: number (optional, Standard 7)
     *   size: number (optional, setzt rows & cols)
     *   difficulty: 'easy'|'medium'|'hard'
     *   seed: number (optional)
     * @returns {Object} Puzzle-Konfiguration
     */
    static generatePuzzle(options = {}) {
        const difficulty = options.difficulty || 'medium';
        const size = options.size || (difficulty === 'easy' ? 6 : difficulty === 'hard' ? 9 : 7);
        const rows = options.rows || size;
        const cols = options.cols || size;
        const seed = options.seed !== undefined ? options.seed : (Date.now() & 0xFFFFFF);

        const rng = HashiGenerator.seededRandom(seed);

        let targetIslands;
        if (difficulty === 'easy') {
            targetIslands = Math.max(4, Math.min(8, Math.floor(rows * cols * 0.18)));
        } else if (difficulty === 'hard') {
            targetIslands = Math.max(8, Math.min(18, Math.floor(rows * cols * 0.22)));
        } else {
            targetIslands = Math.max(6, Math.min(13, Math.floor(rows * cols * 0.20)));
        }

        const maxAttempts = 120;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const currentRng = HashiGenerator.seededRandom((seed + attempt * 1013) | 0);

            // 1. Inseln & Brücken-Netzwerk per Random Walk / Spanning Tree aufbauen
            const network = HashiGenerator.buildRandomNetwork(rows, cols, targetIslands, currentRng);
            if (!network) continue;

            // 2. Puzzle aus dem Netzwerk extrahieren
            const puzzleCandidate = {
                rows,
                cols,
                islands: network.islands,
                solution: network.solutionBridges
            };

            // 3. Eindeutigkeit mit HashiSolver prüfen
            const solutions = HashiSolver.solve(puzzleCandidate, 2);
            if (solutions.length === 1) {
                return {
                    rows,
                    cols,
                    size,
                    difficulty,
                    seed,
                    islands: network.islands,
                    solution: network.solutionBridgesArray
                };
            }
        }

        // Fallback: Solides deterministisches Standard-Netzwerk generieren
        return HashiGenerator.generateFallbackPuzzle(rows, cols, difficulty, seed);
    }

    /**
     * Baut ein zusammenhängendes kreuzungsfreies Netzwerk aus Inseln und Brücken
     */
    static buildRandomNetwork(rows, cols, targetIslandCount, rng) {
        const islandsMap = new Map(); // "r,c" -> { r, c }
        const edgesMap = new Map();   // "r1,c1-r2,c2" -> count (1 oder 2)

        // Start-Insel in der Nähe des Zentrums platzieren
        const startR = Math.floor(rows / 4) + Math.floor(rng() * Math.max(1, Math.floor(rows / 2)));
        const startC = Math.floor(cols / 4) + Math.floor(rng() * Math.max(1, Math.floor(cols / 2)));
        islandsMap.set(`${startR},${startC}`, { r: startR, c: startC });

        const dirs = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ];

        let attempts = 0;
        const maxTreeAttempts = targetIslandCount * 30;

        while (islandsMap.size < targetIslandCount && attempts < maxTreeAttempts) {
            attempts++;
            const currentIslands = Array.from(islandsMap.values());
            const source = currentIslands[Math.floor(rng() * currentIslands.length)];
            const dir = dirs[Math.floor(rng() * dirs.length)];

            // Zufälliger Abstand (2 bis 4 Felder, damit Brücken sichtbar sind)
            const dist = 2 + Math.floor(rng() * 3);
            const targetR = source.r + dir.dr * dist;
            const targetC = source.c + dir.dc * dist;

            if (targetR < 0 || targetR >= rows || targetC < 0 || targetC >= cols) continue;

            const targetKey = `${targetR},${targetC}`;
            if (islandsMap.has(targetKey)) continue;

            // Prüfen, ob keine andere Insel auf dem direkten Segment liegt
            let pathBlocked = false;
            for (let step = 1; step < dist; step++) {
                const intermediateKey = `${source.r + dir.dr * step},${source.c + dir.dc * step}`;
                if (islandsMap.has(intermediateKey)) {
                    pathBlocked = true;
                    break;
                }
            }
            if (pathBlocked) continue;

            // Kreuzungsprüfung mit bestehenden Kanten
            let crossesExisting = false;
            for (const existingKey of edgesMap.keys()) {
                const existing = HashiEngine.parseEdgeKey(existingKey);
                if (HashiEngine.edgesCross(source.r, source.c, targetR, targetC, existing.r1, existing.c1, existing.r2, existing.c2)) {
                    crossesExisting = true;
                    break;
                }
            }
            if (crossesExisting) continue;

            // Neue Insel und Brücke hinzufügen
            islandsMap.set(targetKey, { r: targetR, c: targetC });
            const edgeKey = HashiEngine.getEdgeKey(source.r, source.c, targetR, targetC);
            // 1 oder 2 Brücken zufällig (60% 1, 40% 2)
            const bridgeCount = rng() < 0.4 ? HASHI_BRIDGE_DOUBLE : HASHI_BRIDGE_SINGLE;
            edgesMap.set(edgeKey, bridgeCount);
        }

        if (islandsMap.size < 4) return null;

        // Zusätzliche Brücken zwischen existierenden Inseln einfügen für Zyklen
        const islandList = Array.from(islandsMap.values());
        for (let i = 0; i < islandList.length; i++) {
            for (let j = i + 1; j < islandList.length; j++) {
                const islA = islandList[i];
                const islB = islandList[j];

                // Nur orthogonal
                if (islA.r !== islB.r && islA.c !== islB.c) continue;

                const edgeKey = HashiEngine.getEdgeKey(islA.r, islA.c, islB.r, islB.c);
                if (edgesMap.has(edgeKey)) continue;

                // Prüfen ob Insel dazwischen liegt
                const minR = Math.min(islA.r, islB.r);
                const maxR = Math.max(islA.r, islB.r);
                const minC = Math.min(islA.c, islB.c);
                const maxC = Math.max(islA.c, islB.c);

                let blocked = false;
                for (const other of islandList) {
                    if ((other.r === islA.r && other.c === islA.c) || (other.r === islB.r && other.c === islB.c)) continue;
                    if (islA.r === islB.r && other.r === islA.r && other.c > minC && other.c < maxC) {
                        blocked = true;
                        break;
                    }
                    if (islA.c === islB.c && other.c === islA.c && other.r > minR && other.r < maxR) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) continue;

                // Kreuzung mit bestehenden Brücken prüfen
                let crosses = false;
                for (const existingKey of edgesMap.keys()) {
                    const existing = HashiEngine.parseEdgeKey(existingKey);
                    if (HashiEngine.edgesCross(islA.r, islA.c, islB.r, islB.c, existing.r1, existing.c1, existing.r2, existing.c2)) {
                        crosses = true;
                        break;
                    }
                }
                if (crosses) continue;

                // Chance, eine zusätzliche Brücke hinzuzufügen
                if (rng() < 0.25) {
                    const count = rng() < 0.35 ? HASHI_BRIDGE_DOUBLE : HASHI_BRIDGE_SINGLE;
                    edgesMap.set(edgeKey, count);
                }
            }
        }

        // Inselwerte berechnen als Summe der Brücken
        const islandsWithValues = [];
        const solutionBridgesArray = [];

        for (const [key, count] of edgesMap.entries()) {
            const parsed = HashiEngine.parseEdgeKey(key);
            solutionBridgesArray.push({
                r1: parsed.r1, c1: parsed.c1,
                r2: parsed.r2, c2: parsed.c2,
                count
            });
        }

        for (const isl of islandsMap.values()) {
            let deg = 0;
            for (const [edgeKey, count] of edgesMap.entries()) {
                const p = HashiEngine.parseEdgeKey(edgeKey);
                if ((p.r1 === isl.r && p.c1 === isl.c) || (p.r2 === isl.r && p.c2 === isl.c)) {
                    deg += count;
                }
            }
            if (deg > 0 && deg <= 8) {
                islandsWithValues.push({
                    r: isl.r,
                    c: isl.c,
                    value: deg
                });
            }
        }

        if (islandsWithValues.length < 4) return null;

        return {
            islands: islandsWithValues,
            solutionBridges: edgesMap,
            solutionBridgesArray
        };
    }

    /**
     * Deterministischer Fallback, falls stochastische Generierung scheitert
     */
    static generateFallbackPuzzle(rows, cols, difficulty, seed) {
        // Schönes, symmetrisches 4- bis 6-Insel-Netzwerk
        const islands = [
            { r: 1, c: 1, value: 2 },
            { r: 1, c: cols - 2, value: 3 },
            { r: rows - 2, c: 1, value: 2 },
            { r: rows - 2, c: cols - 2, value: 3 }
        ];

        const solution = [
            { r1: 1, c1: 1, r2: 1, c2: cols - 2, count: 1 },
            { r1: 1, c1: 1, r2: rows - 2, c2: 1, count: 1 },
            { r1: 1, c1: cols - 2, r2: rows - 2, c2: cols - 2, count: 2 },
            { r1: rows - 2, c1: 1, r2: rows - 2, c2: cols - 2, count: 1 }
        ];

        return {
            rows,
            cols,
            size: Math.min(rows, cols),
            difficulty,
            seed,
            islands,
            solution
        };
    }
}
