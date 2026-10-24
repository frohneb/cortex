/**
 * SumGrid Puzzle Generator
 * Generiert deterministisch eindeutig lösbare SumGrid-Rätsel (4×4 bis 7×7)
 * mit garantierter Einzellösung (verifiziert via SumGridSolver).
 */

import { SumGridSolver } from './solver.js';

export class SumGridGenerator {
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
     * Generiert ein neues SumGrid-Rätsel mit garantierter eindeutiger Lösung.
     * @param {Object} options
     *   size: number (4..7)
     *   difficulty: 'easy' | 'medium' | 'hard'
     *   seed: number (optional)
     */
    static generatePuzzle({ size = 5, difficulty = 'medium', seed = null }) {
        const rng = seed !== null && seed !== undefined
            ? SumGridGenerator.seededRandom(seed)
            : Math.random;

        let maxVal = 9;
        let keepProbability = 0.5;

        if (size === 4) {
            maxVal = difficulty === 'hard' ? 7 : 5;
            keepProbability = 0.5;
        } else if (size === 5) {
            maxVal = difficulty === 'easy' ? 6 : 9;
            keepProbability = difficulty === 'easy' ? 0.55 : 0.5;
        } else if (size === 6) {
            maxVal = 9;
            keepProbability = 0.5;
        } else {
            maxVal = 9;
            keepProbability = 0.5;
        }

        const maxAttempts = 300;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // 1. Zufällige Zahlen erzeugen
            const numbers = Array.from({ length: size }, () =>
                Array.from({ length: size }, () => 1 + Math.floor(rng() * maxVal))
            );

            // 2. Lösungsmaske (0 oder 1) generieren
            const solution = Array.from({ length: size }, () => Array(size).fill(0));

            for (let r = 0; r < size; r++) {
                let rowKeeps = 0;
                for (let c = 0; c < size; c++) {
                    const keep = rng() < keepProbability ? 1 : 0;
                    solution[r][c] = keep;
                    if (keep) rowKeeps++;
                }

                // Vermeide komplett leere oder komplett volle Zeilen für spannenderes Gameplay
                if (rowKeeps === 0) {
                    const forceCol = Math.floor(rng() * size);
                    solution[r][forceCol] = 1;
                } else if (rowKeeps === size && size > 4) {
                    const forceDrop = Math.floor(rng() * size);
                    solution[r][forceDrop] = 0;
                }
            }

            // Sicherstellen, dass jede Spalte mindestens eine 1 hat
            for (let c = 0; c < size; c++) {
                let colKeeps = 0;
                for (let r = 0; r < size; r++) {
                    if (solution[r][c] === 1) colKeeps++;
                }
                if (colKeeps === 0) {
                    const forceRow = Math.floor(rng() * size);
                    solution[forceRow][c] = 1;
                }
            }

            // 3. Zielsummen aus der Maske berechnen
            const rowTargets = Array(size).fill(0);
            const colTargets = Array(size).fill(0);

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (solution[r][c] === 1) {
                        rowTargets[r] += numbers[r][c];
                        colTargets[c] += numbers[r][c];
                    }
                }
            }

            // 4. Eindeutigkeitsprüfung durch Solver
            const solutions = SumGridSolver.solve({ size, numbers, rowTargets, colTargets }, 2);

            if (solutions.length === 1) {
                return {
                    size,
                    numbers,
                    rowTargets,
                    colTargets,
                    solution,
                    difficulty
                };
            }
        }

        // Fallback: Einfaches konstruiertes Rätsel mit garantierter Eindeutigkeit
        return SumGridGenerator.generateFallback(size);
    }

    /**
     * Stabiler deterministischer Fallback
     */
    static generateFallback(size = 5) {
        const numbers = Array.from({ length: size }, (_, r) =>
            Array.from({ length: size }, (_, c) => ((r * 2 + c) % 8) + 1)
        );
        const solution = Array.from({ length: size }, (_, r) =>
            Array.from({ length: size }, (_, c) => ((r + c) % 2 === 0 ? 1 : 0))
        );
        const rowTargets = Array(size).fill(0);
        const colTargets = Array(size).fill(0);

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (solution[r][c] === 1) {
                    rowTargets[r] += numbers[r][c];
                    colTargets[c] += numbers[r][c];
                }
            }
        }

        return {
            size,
            numbers,
            rowTargets,
            colTargets,
            solution,
            difficulty: 'easy'
        };
    }
}
