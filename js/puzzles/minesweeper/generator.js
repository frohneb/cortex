/**
 * Minesweeper Puzzle Generator
 * Erzeugt deterministische Minenfelder basierend auf Seed, Größe und Schwierigkeitsgrad.
 */

import { MinesweeperEngine } from './engine.js';

export class MinesweeperGenerator {
    /**
     * Deterministischer PRNG aus Seed
     */
    static seededRandom(seed) {
        let s = Math.abs(seed) || 1;
        return function () {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    /**
     * Ermittelt die Standard-Minenanzahl für ein gegebenes Gitter und Schwierigkeit
     */
    static getStandardMineCount(rows, cols, difficulty = 'medium') {
        const totalCells = rows * cols;
        let density = 0.15; // medium default ~15%

        if (difficulty === 'easy') {
            density = 0.12;
        } else if (difficulty === 'hard') {
            density = 0.20;
        }

        const count = Math.round(totalCells * density);
        return Math.max(1, Math.min(count, totalCells - 1));
    }

    /**
     * Erzeugt ein deterministisches Minenfeld
     */
    static generatePuzzle({ rows = 8, cols = 8, size, difficulty = 'medium', mineCount, seed = 12345 }) {
        const actualRows = rows || size || 8;
        const actualCols = cols || size || actualRows;
        const totalCells = actualRows * actualCols;

        const count = mineCount !== undefined ? mineCount : this.getStandardMineCount(actualRows, actualCols, difficulty);
        const actualMineCount = Math.max(1, Math.min(count, totalCells - 1));

        const rng = this.seededRandom(seed);

        // Erstelle Liste aller Zellen-Indizes und mische sie deterministisch (Fisher-Yates)
        const indices = Array.from({ length: totalCells }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const tmp = indices[i];
            indices[i] = indices[j];
            indices[j] = tmp;
        }

        // Minen an den ersten `actualMineCount` Positionen platzieren
        const mines = Array(actualRows).fill(0).map(() => Array(actualCols).fill(false));
        for (let i = 0; i < actualMineCount; i++) {
            const idx = indices[i];
            const r = Math.floor(idx / actualCols);
            const c = idx % actualCols;
            mines[r][c] = true;
        }

        // Engine zur Berechnung von Adjacency und Solution nutzen
        const engine = new MinesweeperEngine(actualRows, actualCols, actualMineCount);
        engine.loadPuzzle({ rows: actualRows, cols: actualCols, mines, mineCount: actualMineCount });

        return {
            rows: actualRows,
            cols: actualCols,
            size: Math.max(actualRows, actualCols),
            mineCount: actualMineCount,
            mines: engine.mines.map(r => [...r]),
            adjacency: engine.adjacency.map(r => [...r]),
            solution: engine.mines.map(row => row.map(isMine => (isMine ? 1 : 0)))
        };
    }
}
