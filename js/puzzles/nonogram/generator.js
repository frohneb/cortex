/**
 * Nonogram Generator
 * Erzeugt eindeutig lösbare Pixel- und Logik-Rätsel deterministisch über Seeds
 * oder aus vordefinierten Pixel-Art Vorlagen.
 */

import { NONO_FILLED, NonogramEngine } from './engine.js';
import { NonogramSolver } from './solver.js';

export class NonogramGenerator {
    /**
     * Einfacher deterministischer Pseudo-Zufallsgenerator (Mulberry32)
     */
    static createRng(seed) {
        let s = seed >>> 0;
        return function() {
            s |= 0;
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Erzeugt ein Nonogramm-Rätsel
     */
    static generatePuzzle(options = {}) {
        const size = options.size || 10;
        const difficulty = options.difficulty || 'medium';
        const seed = options.seed !== undefined ? options.seed : Math.floor(Math.random() * 1000000);
        const rng = NonogramGenerator.createRng(seed);

        const targetDensity = difficulty === 'easy' ? 0.60 : (difficulty === 'medium' ? 0.50 : 0.42);

        for (let attempt = 0; attempt < 50; attempt++) {
            const target = Array.from({ length: size }, () => Array(size).fill(0));
            const isSymmetric = rng() > 0.4;

            for (let r = 0; r < size; r++) {
                const maxC = isSymmetric ? Math.ceil(size / 2) : size;
                for (let c = 0; c < maxC; c++) {
                    const prob = targetDensity + (rng() - 0.5) * 0.2;
                    const val = rng() < prob ? 1 : 0;
                    target[r][c] = val;
                    if (isSymmetric) {
                        target[r][size - 1 - c] = val;
                    }
                }
            }

            // Sicherstellen dass keine Zeile/Spalte komplett leer ist
            for (let r = 0; r < size; r++) {
                if (target[r].every(v => v === 0)) {
                    target[r][Math.floor(rng() * size)] = 1;
                }
            }
            for (let c = 0; c < size; c++) {
                if (target.every(row => row[c] === 0)) {
                    target[Math.floor(rng() * size)][c] = 1;
                }
            }

            const engine = new NonogramEngine(size);
            engine.initFromTarget(target);

            // Logische Lösbarkeit prüfen
            const solveRes = NonogramSolver.solveLogical(engine);
            if (solveRes.solvable) {
                return {
                    size,
                    difficulty,
                    seed,
                    target,
                    rowClues: engine.rowClues,
                    colClues: engine.colClues,
                    grid: Array.from({ length: size }, () => Array(size).fill(0)),
                    locked: Array.from({ length: size }, () => Array(size).fill(false))
                };
            }
        }

        // Robuster Fallback: Strukturierte geometrische Vorlage
        const fallbackTarget = Array.from({ length: size }, (_, r) =>
            Array.from({ length: size }, (_, c) => ((r + c) % 2 === 0 || r === c || r === size - 1 - c ? 1 : 0))
        );
        const engine = new NonogramEngine(size);
        engine.initFromTarget(fallbackTarget);

        return {
            size,
            difficulty,
            seed,
            target: fallbackTarget,
            rowClues: engine.rowClues,
            colClues: engine.colClues,
            grid: Array.from({ length: size }, () => Array(size).fill(0)),
            locked: Array.from({ length: size }, () => Array(size).fill(false))
        };
    }
}
