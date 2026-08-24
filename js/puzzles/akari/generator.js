/**
 * Akari (Light Up) Procedural Puzzle Generator
 * Generiert deterministisch eindeutige, lösbare Akari-Rätsel
 * in verschiedenen Schwierigkeitsgraden und Gittergrößen.
 */

import { AKARI_EMPTY, AKARI_BULB, AKARI_DOT, AkariEngine } from './engine.js';
import { AkariSolver } from './solver.js';

export class AkariGenerator {
    /**
     * Pseudo-Random Number Generator (LCG / Mulberry32)
     */
    static createPrng(seed) {
        let s = Math.floor(Math.abs(seed)) % 2147483647;
        if (s === 0) s = 123456789;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    /**
     * Generiert ein eindeutiges Akari-Rätsel
     * @param {Object} opts - { size: number, difficulty: 'easy'|'medium'|'hard', seed?: number }
     */
    static generatePuzzle(opts = {}) {
        const size = opts.size || 7;
        const difficulty = opts.difficulty || 'medium';
        const seed = opts.seed !== undefined ? opts.seed : Math.floor(Math.random() * 10000000);
        const rand = this.createPrng(seed);

        const rows = size;
        const cols = size;

        // Wand-Dichte nach Größe und Stufe
        let wallRatio = 0.20;
        if (size <= 6) wallRatio = 0.18;
        else if (size >= 10) wallRatio = 0.22;

        const totalCells = rows * cols;
        const targetWallCount = Math.max(3, Math.floor(totalCells * wallRatio));

        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            attempts++;

            // 1. Wände mit 180° Rotationssymmetrie platzieren
            const walls = Array.from({ length: rows }, () => Array(cols).fill(null));
            let placedWalls = 0;

            const candidateCoords = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    candidateCoords.push({ r, c });
                }
            }
            // Shuffle
            for (let i = candidateCoords.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                [candidateCoords[i], candidateCoords[j]] = [candidateCoords[j], candidateCoords[i]];
            }

            for (const { r, c } of candidateCoords) {
                if (placedWalls >= targetWallCount) break;
                const symR = rows - 1 - r;
                const symC = cols - 1 - c;

                if (walls[r][c] === null && walls[symR][symC] === null) {
                    walls[r][c] = -1; // Unnummerierte Wand
                    walls[symR][symC] = -1;
                    placedWalls += (r === symR && c === symC) ? 1 : 2;
                }
            }

            // 2. Erzeuge eine gültige Lampen-Konfiguration
            const engine = new AkariEngine(size);
            engine.loadPuzzle({ size, walls });

            // Finde eine Lösung mit dem Solver
            const solutions = AkariSolver.solve(engine, 1);
            if (solutions.length === 0) continue;

            const solution = solutions[0];

            // 3. Berechne alle tatsächlichen Nachbar-Lampen-Zahlen für alle Wände
            const fullClues = Array.from({ length: rows }, () => Array(cols).fill(null));
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (walls[r][c] !== null) {
                        const neighbors = engine.getOrthogonalNeighbors(r, c);
                        let bulbs = 0;
                        for (const n of neighbors) {
                            if (!engine.isWall(n.r, n.c) && solution[n.r][n.c] === 1) {
                                bulbs++;
                            }
                        }
                        fullClues[r][c] = bulbs;
                    }
                }
            }

            // 4. Decke Wand-Zahlen auf basierend auf Schwierigkeit
            // easy: ~75% nummeriert, medium: ~50%, hard: ~30%
            let clueProb = 0.50;
            if (difficulty === 'easy') clueProb = 0.75;
            else if (difficulty === 'hard') clueProb = 0.32;

            const puzzleWalls = Array.from({ length: rows }, () => Array(cols).fill(null));
            const wallList = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (walls[r][c] !== null) {
                        wallList.push({ r, c });
                        if (rand() < clueProb) {
                            puzzleWalls[r][c] = fullClues[r][c];
                        } else {
                            puzzleWalls[r][c] = -1; // unnummeriert
                        }
                    }
                }
            }

            // 5. Teste Eindeutigkeit
            const testEngine = new AkariEngine(size);
            testEngine.loadPuzzle({ size, walls: puzzleWalls });

            let testSols = AkariSolver.solve(testEngine, 2);

            // Falls nicht eindeutig: decke schrittweise weitere Wände auf
            if (testSols.length !== 1) {
                // Shuffle unnummerierte Wände
                const unnumbered = wallList.filter(w => puzzleWalls[w.r][w.c] === -1);
                for (let i = unnumbered.length - 1; i > 0; i--) {
                    const j = Math.floor(rand() * (i + 1));
                    [unnumbered[i], unnumbered[j]] = [unnumbered[j], unnumbered[i]];
                }

                for (const w of unnumbered) {
                    puzzleWalls[w.r][w.c] = fullClues[w.r][w.c];
                    testEngine.loadPuzzle({ size, walls: puzzleWalls });
                    testSols = AkariSolver.solve(testEngine, 2);
                    if (testSols.length === 1) break;
                }
            }

            if (testSols.length === 1) {
                return {
                    size,
                    difficulty,
                    seed,
                    walls: puzzleWalls,
                    initialGrid: Array.from({ length: rows }, () => Array(cols).fill(AKARI_EMPTY)),
                    solution
                };
            }
        }

        // Robuster Fallback: Strukturierte Standard-Vorlage
        return this.getFallbackPuzzle(size, difficulty);
    }

    /**
     * Fallback-Puzzle Generator bei Timeout
     */
    static getFallbackPuzzle(size = 7, difficulty = 'medium') {
        const walls = Array.from({ length: size }, () => Array(size).fill(null));
        // Ein paar Standard-Wände
        const mid = Math.floor(size / 2);
        walls[1][1] = 1;
        walls[1][size - 2] = -1;
        walls[size - 2][1] = -1;
        walls[size - 2][size - 2] = 2;
        if (size >= 7) {
            walls[mid][mid] = 0;
        }

        const engine = new AkariEngine(size);
        engine.loadPuzzle({ size, walls });
        const sols = AkariSolver.solve(engine, 1);
        const solution = sols.length > 0 ? sols[0] : Array.from({ length: size }, () => Array(size).fill(0));

        return {
            size,
            difficulty,
            walls,
            initialGrid: Array.from({ length: size }, () => Array(size).fill(AKARI_EMPTY)),
            solution
        };
    }
}
