/**
 * Sudoku Puzzle Generator
 * Erzeugt prozedural eindeutig lösbare Sudokus (4×4, 9×9, 16×16 Hexadezimal)
 * und Schwierigkeitsgrade mit deterministischer Seed-Unterstützung und 180° Rotationssymmetrie.
 */

import { SUDOKU_EMPTY, SudokuEngine } from './engine.js';
import { SudokuSolver } from './solver.js';

export class SudokuGenerator {
    static seededRandom(seed) {
        let s = Math.abs(seed) % 2147483647;
        if (s <= 0) s += 2147483646;
        return function() {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    static shuffle(array, rng) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    /**
     * Erzeugt ein volles, 100% regelkonformes Lösungs-Board
     */
    static generateFullBoard(size, rng = Math.random) {
        const boxH = size === 4 ? 2 : (size === 16 ? 4 : 3);
        const boxW = size === 4 ? 2 : (size === 16 ? 4 : 3);

        // Basis-Shift Gitter
        const grid = Array(size).fill(0).map(() => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = ((r % boxH) * boxW + Math.floor(r / boxH) + c) % size + 1;
            }
        }

        // 1. Ziffern-Permutation (Zufällige Ziffern-Zuordnung via Fisher-Yates)
        const digits = [];
        for (let i = 1; i <= size; i++) digits.push(i);
        SudokuGenerator.shuffle(digits, rng);

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = digits[grid[r][c] - 1];
            }
        }

        // 2. Zeilen innerhalb von Blöcken tauschen
        for (let b = 0; b < size; b += boxH) {
            for (let i = 0; i < boxH; i++) {
                const swapWith = b + Math.floor(rng() * boxH);
                const curRow = b + i;
                const temp = grid[curRow];
                grid[curRow] = grid[swapWith];
                grid[swapWith] = temp;
            }
        }

        // 3. Spalten innerhalb von Blöcken tauschen
        for (let b = 0; b < size; b += boxW) {
            for (let i = 0; i < boxW; i++) {
                const swapWith = b + Math.floor(rng() * boxW);
                const curCol = b + i;
                for (let r = 0; r < size; r++) {
                    const temp = grid[r][curCol];
                    grid[r][curCol] = grid[r][swapWith];
                    grid[r][swapWith] = temp;
                }
            }
        }

        return grid;
    }

    /**
     * Erzeugt ein spielbares Sudoku mit garantiert eindeutiger Lösung
     */
    static generatePuzzle({ size = 9, difficulty = 'medium', seed = null }) {
        const rng = seed !== null ? SudokuGenerator.seededRandom(seed) : Math.random;
        
        let fullSolution = null;
        const testEngine = new SudokuEngine(size);

        // Volles, fehlerfreies Brett erzeugen
        for (let attempt = 0; attempt < 5; attempt++) {
            fullSolution = SudokuGenerator.generateFullBoard(size, rng);
            testEngine.loadPuzzle({ size, initialGrid: fullSolution });
            if (testEngine.validateRules().isValid) break;
        }

        // Ziel-Clues nach Größe & Schwierigkeit
        let targetClues;
        if (size === 4) {
            targetClues = difficulty === 'easy' ? 8 : (difficulty === 'medium' ? 6 : 4);
        } else if (size === 16) {
            targetClues = difficulty === 'easy' ? 140 : (difficulty === 'medium' ? 124 : 112);
        } else {
            // 9x9
            targetClues = difficulty === 'easy' ? 36 : (difficulty === 'medium' ? 30 : 25);
        }

        const puzzleGrid = fullSolution.map(row => [...row]);

        // Paarweise symmetrische Positionen (180° Rotationssymmetrie)
        const pairs = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const symR = size - 1 - r;
                const symC = size - 1 - c;
                if ((r < symR) || (r === symR && c <= symC)) {
                    pairs.push({ p1: { r, c }, p2: { r: symR, c: symC } });
                }
            }
        }
        SudokuGenerator.shuffle(pairs, rng);

        let currentClues = size * size;
        const maxCheckNodes = size === 16 ? 2500 : 5000;

        for (const pair of pairs) {
            if (currentClues <= targetClues) break;
            const { p1, p2 } = pair;
            if (puzzleGrid[p1.r][p1.c] === SUDOKU_EMPTY) continue;

            const val1 = puzzleGrid[p1.r][p1.c];
            const val2 = puzzleGrid[p2.r][p2.c];

            puzzleGrid[p1.r][p1.c] = SUDOKU_EMPTY;
            puzzleGrid[p2.r][p2.c] = SUDOKU_EMPTY;

            const solCount = SudokuSolver.countSolutions(puzzleGrid, size, 2, maxCheckNodes);

            if (solCount !== 1) {
                // Nicht mehr eindeutig oder Timeout -> wiederherstellen
                puzzleGrid[p1.r][p1.c] = val1;
                puzzleGrid[p2.r][p2.c] = val2;
            } else {
                currentClues -= (p1.r === p2.r && p1.c === p2.c) ? 1 : 2;
            }
        }

        return {
            size,
            initialGrid: puzzleGrid,
            solution: fullSolution,
            difficulty
        };
    }
}
