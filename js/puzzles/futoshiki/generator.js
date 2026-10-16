/**
 * Futoshiki Puzzle Generator
 * Generiert deterministisch eindeutig lösbare Futoshiki-Puzzles (4×4 bis 7×7)
 * mittels Lateinischem Quadrat, abgeleiteten Ungleichungen und Dig-Hole-Strategie.
 */

import {
    FutoshikiEngine,
    FUTOSHIKI_EMPTY,
    CONSTRAINT_NONE,
    CONSTRAINT_LT,
    CONSTRAINT_GT
} from './engine.js';
import { FutoshikiSolver } from './solver.js';

export class FutoshikiGenerator {
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
     * Generiert ein vollständiges Lateinisches Quadrat der Größe N×N
     */
    static generateLatinSquare(size, rng) {
        const grid = Array.from({ length: size }, () => Array(size).fill(0));
        const digits = Array.from({ length: size }, (_, i) => i + 1);

        // Zeile 0 zufällig permutieren
        grid[0] = FutoshikiGenerator.shuffle(digits, rng);

        function solveRow(r, c) {
            if (r === size) return true;
            if (c === size) return solveRow(r + 1, 0);

            // Welche Ziffern sind in Spalte c bereits vergeben?
            const usedInCol = new Set();
            for (let row = 0; row < r; row++) {
                usedInCol.add(grid[row][c]);
            }

            // Welche Ziffern sind in Zeile r bereits vergeben?
            const usedInRow = new Set();
            for (let col = 0; col < c; col++) {
                usedInRow.add(grid[r][col]);
            }

            const candidates = FutoshikiGenerator.shuffle(
                digits.filter(d => !usedInCol.has(d) && !usedInRow.has(d)),
                rng
            );

            for (const d of candidates) {
                grid[r][c] = d;
                if (solveRow(r, c + 1)) return true;
                grid[r][c] = 0;
            }

            return false;
        }

        solveRow(1, 0);
        return grid;
    }

    /**
     * Generiert ein eindeutig lösbares Futoshiki-Puzzle
     * @param {Object} options
     *   size: number (4..7)
     *   difficulty: 'easy'|'medium'|'hard'
     *   seed: number (optional)
     */
    static generatePuzzle(options = {}) {
        const size = Math.max(4, Math.min(7, options.size || 5));
        const difficulty = options.difficulty || 'medium';
        const seed = options.seed !== undefined ? options.seed : (Date.now() & 0xFFFFFF);

        const maxAttempts = 60;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const currentRng = FutoshikiGenerator.seededRandom((seed + attempt * 1013) | 0);

            // 1. Vollständige Referenzlösung als Lateinisches Quadrat erzeugen
            const solution = FutoshikiGenerator.generateLatinSquare(size, currentRng);
            if (!solution || solution[0][0] === 0) continue;

            // 2. Alle möglichen Constraints aus der Lösung ableiten
            const allH = Array.from({ length: size }, () => Array(size - 1).fill(''));
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size - 1; c++) {
                    allH[r][c] = solution[r][c] < solution[r][c + 1] ? CONSTRAINT_LT : CONSTRAINT_GT;
                }
            }

            const allV = Array.from({ length: size - 1 }, () => Array(size).fill(''));
            for (let r = 0; r < size - 1; r++) {
                for (let c = 0; c < size; c++) {
                    allV[r][c] = solution[r][c] < solution[r + 1][c] ? CONSTRAINT_LT : CONSTRAINT_GT;
                }
            }

            // 3. Constraints zufällig ausdünnen (je nach Schwierigkeit)
            // Easy: behalte ~65%, Medium: ~45%, Hard: ~30%
            const keepConstraintProb = difficulty === 'easy' ? 0.65 : difficulty === 'hard' ? 0.30 : 0.45;

            const hConstraints = Array.from({ length: size }, () => Array(size - 1).fill(''));
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size - 1; c++) {
                    if (currentRng() < keepConstraintProb) {
                        hConstraints[r][c] = allH[r][c];
                    }
                }
            }

            const vConstraints = Array.from({ length: size - 1 }, () => Array(size).fill(''));
            for (let r = 0; r < size - 1; r++) {
                for (let c = 0; c < size; c++) {
                    if (currentRng() < keepConstraintProb) {
                        vConstraints[r][c] = allV[r][c];
                    }
                }
            }

            // 4. Dig-Hole: Ziffern schrittweise entfernen unter Beibehaltung der Eindeutigkeit
            const grid = solution.map(row => [...row]);
            const allCells = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    allCells.push({ r, c });
                }
            }
            const shuffledCells = FutoshikiGenerator.shuffle(allCells, currentRng);

            for (const { r, c } of shuffledCells) {
                const backup = grid[r][c];
                grid[r][c] = FUTOSHIKI_EMPTY;

                // Eindeutigkeit prüfen
                const testPuzzle = {
                    size,
                    initialGrid: grid,
                    hConstraints,
                    vConstraints
                };

                const solutions = FutoshikiSolver.solve(testPuzzle, 2);
                if (solutions.length !== 1) {
                    // Nicht mehr eindeutig -> Ziffer muss erhalten bleiben
                    grid[r][c] = backup;
                }
            }

            // Prüfen ob die generierte Aufgabe gültig und eindeutig ist
            const finalCheck = FutoshikiSolver.solve({
                size,
                initialGrid: grid,
                hConstraints,
                vConstraints
            }, 2);

            if (finalCheck.length === 1) {
                return {
                    size,
                    difficulty,
                    seed,
                    initialGrid: grid,
                    hConstraints,
                    vConstraints,
                    solution
                };
            }
        }

        // Fallback: Solides 4x4 oder 5x5 Basis-Puzzle
        return FutoshikiGenerator.generateFallbackPuzzle(size, difficulty, seed);
    }

    /**
     * Deterministischer Fallback
     */
    static generateFallbackPuzzle(size, difficulty, seed) {
        const sol = FutoshikiGenerator.generateLatinSquare(size, FutoshikiGenerator.seededRandom(seed));
        const initialGrid = Array.from({ length: size }, () => Array(size).fill(0));
        // Ein paar Givens aus der Lösung übernehmen
        for (let i = 0; i < size; i++) {
            initialGrid[i][i] = sol[i][i];
        }

        const hConstraints = Array.from({ length: size }, () => Array(size - 1).fill(''));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                if ((r + c) % 2 === 0) {
                    hConstraints[r][c] = sol[r][c] < sol[r][c + 1] ? CONSTRAINT_LT : CONSTRAINT_GT;
                }
            }
        }

        const vConstraints = Array.from({ length: size - 1 }, () => Array(size).fill(''));
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                if ((r + c) % 2 === 1) {
                    vConstraints[r][c] = sol[r][c] < sol[r + 1][c] ? CONSTRAINT_LT : CONSTRAINT_GT;
                }
            }
        }

        return {
            size,
            difficulty,
            seed,
            initialGrid,
            hConstraints,
            vConstraints,
            solution: sol
        };
    }
}
