/**
 * Slitherlink Generator - Cortex Puzzle Platform
 * Prozedurale Erstellung eindeutig lösbarer Slitherlink-Rätsel verschiedener Schwierigkeitsgrade.
 */

import { SlitherlinkSolver } from './solver.js';

export class SlitherlinkGenerator {
    /**
     * Generiert ein neues Slitherlink-Rätsel mit garantierter eindeutiger Lösung.
     */
    static generate({ size = 5, difficulty = 'medium' }) {
        const rows = size;
        const cols = size;

        // Erstelle eine zufällige, nicht-selbstschneidende geschlossene Schleife
        let loop = this.generateRandomLoop(rows, cols);
        if (!loop) {
            // Fallback auf Standard-Polygon
            loop = this.createDefaultLoop(rows, cols);
        }

        // Berechne alle Zellzahlen aus der Schleife
        const fullClues = Array(rows).fill(null).map((_, r) => 
            Array(cols).fill(null).map((_, c) => {
                const count = [
                    loop.hEdges[r][c],
                    loop.hEdges[r + 1][c],
                    loop.vEdges[r][c],
                    loop.vEdges[r][c + 1]
                ].filter(val => val === 1).length;
                return count;
            })
        );

        // Entferne Hinweise entsprechend dem Schwierigkeitsgrad
        const targetClueRatio = difficulty === 'easy' ? 0.60 : (difficulty === 'hard' ? 0.35 : 0.48);
        const clues = fullClues.map(row => [...row]);

        // Mische die Zellen-Koordinaten
        const cellCoords = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                cellCoords.push({ r, c });
            }
        }
        for (let i = cellCoords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cellCoords[i], cellCoords[j]] = [cellCoords[j], cellCoords[i]];
        }

        const totalCells = rows * cols;
        const targetCluesCount = Math.max(Math.floor(totalCells * targetClueRatio), size + 2);

        let currentCluesCount = totalCells;
        for (const coord of cellCoords) {
            if (currentCluesCount <= targetCluesCount) break;

            const saved = clues[coord.r][coord.c];
            clues[coord.r][coord.c] = null;

            // Überprüfe Eindeutigkeit
            const solutions = SlitherlinkSolver.solve(clues, 2);
            if (solutions.length !== 1) {
                // Nicht eindeutig lösbar -> Hinweis wieder einsetzen
                clues[coord.r][coord.c] = saved;
            } else {
                currentCluesCount--;
            }
        }

        return {
            size,
            rows,
            cols,
            difficulty,
            clues,
            solution: {
                hEdges: loop.hEdges,
                vEdges: loop.vEdges
            }
        };
    }

    /**
     * Erzeugt eine zufällige geschlossene Schleife durch schrittweises Erweitern
     */
    static generateRandomLoop(rows, cols) {
        // Starte mit einem kleinen 2x2 Rechteck in der Mitte
        const hEdges = Array(rows + 1).fill(0).map(() => Array(cols).fill(0));
        const vEdges = Array(rows).fill(0).map(() => Array(cols + 1).fill(0));

        const minR = Math.floor(rows / 4);
        const minC = Math.floor(cols / 4);
        const w = Math.max(2, Math.floor(cols / 2));
        const h = Math.max(2, Math.floor(rows / 2));

        for (let c = minC; c < minC + w; c++) {
            hEdges[minR][c] = 1;
            hEdges[minR + h][c] = 1;
        }
        for (let r = minR; r < minR + h; r++) {
            vEdges[r][minC] = 1;
            vEdges[r][minC + w] = 1;
        }

        // Führe zufällige Verformungen durch (Kanten-Ausbeulungen / Dehnungen)
        const iterations = rows * cols * 2;
        for (let it = 0; it < iterations; it++) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);

            // Zähle Kanten der Zelle
            const count = [
                hEdges[r][c],
                hEdges[r + 1][c],
                vEdges[r][c],
                vEdges[r][c + 1]
            ].filter(v => v === 1).length;

            // Wenn Zelle 1 Kante hat: wir können sie umklappen (1 -> 3), wenn dadurch eine gültige Schleife bleibt
            if (count === 1) {
                // Probiere Invertierung
                hEdges[r][c] = 1 - hEdges[r][c];
                hEdges[r + 1][c] = 1 - hEdges[r + 1][c];
                vEdges[r][c] = 1 - vEdges[r][c];
                vEdges[r][c + 1] = 1 - vEdges[r][c + 1];

                if (!this.isValidLoopGraph(hEdges, vEdges, rows, cols)) {
                    // Zurückrollen
                    hEdges[r][c] = 1 - hEdges[r][c];
                    hEdges[r + 1][c] = 1 - hEdges[r + 1][c];
                    vEdges[r][c] = 1 - vEdges[r][c];
                    vEdges[r][c + 1] = 1 - vEdges[r][c + 1];
                }
            }
        }

        return { hEdges, vEdges };
    }

    static isValidLoopGraph(hEdges, vEdges, rows, cols) {
        let activeVertices = 0;
        let totalLines = 0;
        let startV = null;

        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                let deg = 0;
                if (vc > 0 && hEdges[vr][vc - 1] === 1) deg++;
                if (vc < cols && hEdges[vr][vc] === 1) deg++;
                if (vr > 0 && vEdges[vr - 1][vc] === 1) deg++;
                if (vr < rows && vEdges[vr][vc] === 1) deg++;

                if (deg !== 0 && deg !== 2) return false;
                if (deg === 2) {
                    activeVertices++;
                    if (!startV) startV = { r: vr, c: vc };
                }
            }
        }

        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (hEdges[r][c] === 1) totalLines++;
            }
        }
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                if (vEdges[r][c] === 1) totalLines++;
            }
        }

        if (totalLines === 0 || activeVertices === 0 || totalLines !== activeVertices) return false;

        const visited = new Set();
        let cur = startV;
        let prev = null;
        let count = 0;

        while (cur) {
            visited.add(`${cur.r},${cur.c}`);
            count++;

            const neighbors = [];
            if (cur.c > 0 && hEdges[cur.r][cur.c - 1] === 1) neighbors.push({ r: cur.r, c: cur.c - 1 });
            if (cur.c < cols && hEdges[cur.r][cur.c] === 1) neighbors.push({ r: cur.r, c: cur.c + 1 });
            if (cur.r > 0 && vEdges[cur.r - 1][cur.c] === 1) neighbors.push({ r: cur.r - 1, c: cur.c });
            if (cur.r < rows && vEdges[cur.r][cur.c] === 1) neighbors.push({ r: cur.r + 1, c: cur.c });

            let next = null;
            for (const n of neighbors) {
                if (!prev || (n.r !== prev.r || n.c !== prev.c)) {
                    next = n;
                    break;
                }
            }

            if (!next) return false;
            if (next.r === startV.r && next.c === startV.c) break;
            if (visited.has(`${next.r},${next.c}`)) return false;

            prev = cur;
            cur = next;
        }

        return count === totalLines && visited.size === activeVertices;
    }

    static createDefaultLoop(rows, cols) {
        const hEdges = Array(rows + 1).fill(0).map(() => Array(cols).fill(0));
        const vEdges = Array(rows).fill(0).map(() => Array(cols + 1).fill(0));

        // Rechteck um die äußeren Kanten
        for (let c = 0; c < cols; c++) {
            hEdges[0][c] = 1;
            hEdges[rows][c] = 1;
        }
        for (let r = 0; r < rows; r++) {
            vEdges[r][0] = 1;
            vEdges[r][cols] = 1;
        }

        return { hEdges, vEdges };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkGenerator };
}
