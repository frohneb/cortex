/**
 * Tango Puzzle Generator
 * Erzeugt prozedural eindeutig lösbare Tango-Rätsel verschiedener Größen und Schwierigkeitsgrade.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE, TangoEngine } from './engine.js';
import { TangoSolver } from './solver.js';

export class TangoGenerator {
    /**
     * Erzeugt einen deterministischen Pseudo-Zufallszahlengenerator aus einem Seed
     */
    static seededRandom(seed) {
        let s = seed;
        return function() {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    /**
     * Erzeugt ein volles, gültiges Lösungs-Board
     */
    static generateFullBoard(size, rng = Math.random) {
        const engine = new TangoEngine(size);
        const maxPerLine = size / 2;
        const grid = engine.grid;

        // Finde ein valides volles Board per randomisiertem Backtracking
        function fill(r, c) {
            if (r === size) {
                // Prüfe Zeilen-Duplikate
                const rowStrs = new Set();
                for (let i = 0; i < size; i++) rowStrs.add(grid[i].join(''));
                if (rowStrs.size !== size) return false;

                // Prüfe Spalten-Duplikate
                const colStrs = new Set();
                for (let j = 0; j < size; j++) {
                    let colStr = '';
                    for (let i = 0; i < size; i++) colStr += grid[i][j];
                    colStrs.add(colStr);
                }
                if (colStrs.size !== size) return false;

                return true;
            }

            const nextR = (c + 1 < size) ? r : r + 1;
            const nextC = (c + 1 < size) ? c + 1 : 0;

            const values = rng() > 0.5 ? [SUN, MOON] : [MOON, SUN];
            for (const val of values) {
                grid[r][c] = val;

                // Validierung
                let valid = true;
                // Horizontal 3 in a row
                if (c >= 2 && grid[r][c-1] === val && grid[r][c-2] === val) valid = false;
                // Vertical 3 in a row
                if (valid && r >= 2 && grid[r-1][c] === val && grid[r-2][c] === val) valid = false;

                // Row balance
                if (valid) {
                    let cnt = 0;
                    for (let j = 0; j <= c; j++) if (grid[r][j] === val) cnt++;
                    if (cnt > maxPerLine) valid = false;
                }
                // Col balance
                if (valid) {
                    let cnt = 0;
                    for (let i = 0; i <= r; i++) if (grid[i][c] === val) cnt++;
                    if (cnt > maxPerLine) valid = false;
                }

                if (valid && fill(nextR, nextC)) return true;
                grid[r][c] = EMPTY;
            }
            return false;
        }

        fill(0, 0);
        return grid.map(row => [...row]);
    }

    /**
     * Erstellt ein spielbares Puzzle mit eindeutiger Lösung
     */
    static generatePuzzle({ size = 6, difficulty = 'medium', seed = null }) {
        const rng = seed !== null ? TangoGenerator.seededRandom(seed) : Math.random;
        const fullSolution = TangoGenerator.generateFullBoard(size, rng);

        // Kanten-Kandidaten aus der Lösung extrahieren
        const hEdges = Array(size).fill(0).map(() => Array(size - 1).fill(EDGE_NONE));
        const vEdges = Array(size - 1).fill(0).map(() => Array(size).fill(EDGE_NONE));

        const hEdgePositions = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                hEdgePositions.push({ r, c, type: 'h' });
            }
        }
        const vEdgePositions = [];
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                vEdgePositions.push({ r, c, type: 'v' });
            }
        }

        // Shuffle Kantenpositionen
        hEdgePositions.sort(() => rng() - 0.5);
        vEdgePositions.sort(() => rng() - 0.5);

        // Bestimme Kantenanzahl je nach Schwierigkeit
        let maxEdges;
        let targetClues;
        if (size === 4) {
            maxEdges = difficulty === 'easy' ? 4 : 2;
            targetClues = difficulty === 'easy' ? 4 : 2;
        } else if (size === 6) {
            maxEdges = difficulty === 'easy' ? 8 : (difficulty === 'medium' ? 5 : 3);
            targetClues = difficulty === 'easy' ? 10 : (difficulty === 'medium' ? 6 : 4);
        } else if (size === 8) {
            maxEdges = difficulty === 'medium' ? 10 : 6;
            targetClues = difficulty === 'medium' ? 14 : 10;
        } else {
            maxEdges = 14;
            targetClues = 18;
        }

        let edgeCount = 0;
        for (const pos of [...hEdgePositions, ...vEdgePositions]) {
            if (edgeCount >= maxEdges) break;
            if (pos.type === 'h') {
                const v1 = fullSolution[pos.r][pos.c];
                const v2 = fullSolution[pos.r][pos.c + 1];
                const edgeType = (v1 === v2) ? EDGE_EQUAL : EDGE_OPPOSITE;
                // Leichte Tendenz zu '=' da es visuell intuitiv ist
                if (rng() > 0.4 || edgeType === EDGE_EQUAL) {
                    hEdges[pos.r][pos.c] = edgeType;
                    edgeCount++;
                }
            } else {
                const v1 = fullSolution[pos.r][pos.c];
                const v2 = fullSolution[pos.r + 1][pos.c];
                const edgeType = (v1 === v2) ? EDGE_EQUAL : EDGE_OPPOSITE;
                if (rng() > 0.4 || edgeType === EDGE_EQUAL) {
                    vEdges[pos.r][pos.c] = edgeType;
                    edgeCount++;
                }
            }
        }

        // Starte mit allen Zellen aus der Lösung und entferne schrittweise Felder
        const puzzleGrid = fullSolution.map(row => [...row]);
        const testEngine = new TangoEngine(size);
        testEngine.loadPuzzle({ size, initialGrid: puzzleGrid, hEdges, vEdges });

        // Erstelle eine Zufallsreihenfolge aller Zellen
        const cells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                cells.push({ r, c });
            }
        }
        cells.sort(() => rng() - 0.5);

        let currentClues = size * size;
        for (const cell of cells) {
            if (currentClues <= targetClues) break;
            const origVal = puzzleGrid[cell.r][cell.c];
            puzzleGrid[cell.r][cell.c] = EMPTY;

            testEngine.loadPuzzle({ size, initialGrid: puzzleGrid, hEdges, vEdges });
            const solutions = TangoSolver.solve(testEngine, 2);

            // Wenn das Rätsel mehrdeutig wird, stelle das Feld wieder her
            if (solutions.length !== 1) {
                puzzleGrid[cell.r][cell.c] = origVal;
            } else {
                currentClues--;
            }
        }

        return {
            size,
            initialGrid: puzzleGrid,
            solution: fullSolution,
            hEdges,
            vEdges,
            difficulty
        };
    }
}
