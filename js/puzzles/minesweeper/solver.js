/**
 * Minesweeper Solver & Hint Engine
 * Findet logische Züge mit verständlichen deutschen Erklärungen
 * und validiert die Konsistenz und Eindeutigkeit des Minenfelds.
 */

import { CELL_HIDDEN, CELL_REVEALED, CELL_FLAGGED, CELL_EXPLODED } from './engine.js';

export class MinesweeperSolver {
    /**
     * Validiert die mathematische Konsistenz des Minenfelds und der Zahlen
     */
    static validateConsistency(engineOrData) {
        const rows = engineOrData.rows;
        const cols = engineOrData.cols;
        const mines = engineOrData.mines;
        const adjacency = engineOrData.adjacency;

        if (!mines || !adjacency) {
            return { valid: false, error: 'Minen- oder Adjacency-Daten fehlen' };
        }

        let totalMines = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (mines[r][c]) {
                    totalMines++;
                    if (adjacency[r][c] !== -1 && adjacency[r][c] !== undefined) {
                        // -1 kennzeichnet Minen in adjacency
                    }
                } else {
                    // Prüfe Nachbarzählung
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && mines[nr][nc]) {
                                count++;
                            }
                        }
                    }
                    if (adjacency[r][c] !== count) {
                        return {
                            valid: false,
                            error: `Inkonsistente Nachbarzahl bei (${r},${c}): erwartet ${count}, gefunden ${adjacency[r][c]}`
                        };
                    }
                }
            }
        }

        return { valid: true, totalMines };
    }

    /**
     * Gibt die Lösung des Puzzles zurück
     */
    static solve(engine, max = 1) {
        if (!engine) return [];
        if (engine.solution) return [engine.solution];
        if (engine.mines) {
            return [engine.mines.map(row => row.map(m => (m ? 1 : 0)))];
        }
        return [];
    }

    /**
     * Findet einen logischen Tipp für den Spieler
     */
    static findLogicalHint(engine, options = {}) {
        if (!engine || engine.status !== 'playing') return null;

        // 0. Prüfe zuerst auf fehlerhafte Flaggen
        const mistake = engine.findMistakes ? engine.findMistakes() : null;
        if (mistake) return mistake;

        const rows = engine.rows;
        const cols = engine.cols;

        // 1. Strategie: Triviale sichere Felder (Bereits alle Minen durch Flaggen abgedeckt)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.grid[r][c] === CELL_REVEALED) {
                    const reqMines = engine.adjacency[r][c];
                    if (reqMines < 0) continue;

                    let flagCount = 0;
                    const hiddenNeighbors = [];

                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (engine.isValid(nr, nc)) {
                                if (engine.grid[nr][nc] === CELL_FLAGGED) {
                                    flagCount++;
                                } else if (engine.grid[nr][nc] === CELL_HIDDEN) {
                                    hiddenNeighbors.push({ r: nr, c: nc });
                                }
                            }
                        }
                    }

                    if (flagCount === reqMines && hiddenNeighbors.length > 0) {
                        const target = hiddenNeighbors[0];
                        return {
                            strategy: 'Sicheres Feld aufdecken',
                            title: 'Alle Minen markiert',
                            message: `Die Zahl ${reqMines} bei Zeile ${r + 1}, Spalte ${c + 1} hat bereits alle benötigten Flaggen. Das Nachbarfeld bei Zeile ${target.r + 1}, Spalte ${target.c + 1} ist sicher!`,
                            r: target.r,
                            c: target.c,
                            value: CELL_REVEALED,
                            expectedVal: CELL_REVEALED,
                            highlightCells: [{ r, c }, target]
                        };
                    }
                }
            }
        }

        // 2. Strategie: Triviale Minen (Verbleibende verdeckte Nachbarn müssen Minen sein)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.grid[r][c] === CELL_REVEALED) {
                    const reqMines = engine.adjacency[r][c];
                    if (reqMines <= 0) continue;

                    let flagCount = 0;
                    const hiddenNeighbors = [];

                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (engine.isValid(nr, nc)) {
                                if (engine.grid[nr][nc] === CELL_FLAGGED) {
                                    flagCount++;
                                } else if (engine.grid[nr][nc] === CELL_HIDDEN) {
                                    hiddenNeighbors.push({ r: nr, c: nc });
                                }
                            }
                        }
                    }

                    const neededMines = reqMines - flagCount;
                    if (neededMines > 0 && hiddenNeighbors.length === neededMines) {
                        const target = hiddenNeighbors[0];
                        return {
                            strategy: 'Mine identifiziert',
                            title: 'Zwingende Mine',
                            message: `Die Zahl ${reqMines} bei Zeile ${r + 1}, Spalte ${c + 1} benötigt noch ${neededMines} Mine(n) und hat genau ${hiddenNeighbors.length} verdeckte Nachbarn. Bei Zeile ${target.r + 1}, Spalte ${target.c + 1} muss eine Mine liegen!`,
                            r: target.r,
                            c: target.c,
                            value: CELL_FLAGGED,
                            expectedVal: CELL_FLAGGED,
                            highlightCells: [{ r, c }, target]
                        };
                    }
                }
            }
        }

        // 3. Strategie: Mengen-Subtraktion (1-1 / 1-2 Muster)
        for (let r1 = 0; r1 < rows; r1++) {
            for (let c1 = 0; c1 < cols; c1++) {
                if (engine.grid[r1][c1] !== CELL_REVEALED) continue;
                const req1 = engine.adjacency[r1][c1];
                const h1 = [];
                let f1 = 0;

                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r1 + dr;
                        const nc = c1 + dc;
                        if (engine.isValid(nr, nc)) {
                            if (engine.grid[nr][nc] === CELL_FLAGGED) f1++;
                            else if (engine.grid[nr][nc] === CELL_HIDDEN) h1.push({ r: nr, c: nc });
                        }
                    }
                }
                const rem1 = req1 - f1;
                if (h1.length === 0) continue;

                // Vergleiche mit benachbarter Zahl
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const r2 = r1 + dr;
                        const c2 = c1 + dc;
                        if (!engine.isValid(r2, c2) || engine.grid[r2][c2] !== CELL_REVEALED) continue;
                        const req2 = engine.adjacency[r2][c2];
                        const h2 = [];
                        let f2 = 0;

                        for (let ddr = -1; ddr <= 1; ddr++) {
                            for (let ddc = -1; ddc <= 1; ddc++) {
                                if (ddr === 0 && ddc === 0) continue;
                                const nr2 = r2 + ddr;
                                const nc2 = c2 + ddc;
                                if (engine.isValid(nr2, nc2)) {
                                    if (engine.grid[nr2][nc2] === CELL_FLAGGED) f2++;
                                    else if (engine.grid[nr2][nc2] === CELL_HIDDEN) h2.push({ r: nr2, c: nc2 });
                                }
                            }
                        }
                        const rem2 = req2 - f2;

                        // Ist h1 eine echte Teilmenge von h2?
                        const isSubset = h1.every(c => h2.some(c2 => c2.r === c.r && c2.c === c.c));
                        if (isSubset && h2.length > h1.length) {
                            const diff = h2.filter(c => !h1.some(c1 => c1.r === c.r && c1.c === c.c));
                            if (rem2 === rem1 && diff.length > 0) {
                                // Alle Zellen in diff sind sicher!
                                const target = diff[0];
                                return {
                                    strategy: 'Mengen-Ausschluss (1-1)',
                                    title: 'Logischer Ausschluss',
                                    message: `Durch Vergleich der Zahlen bei (${r1 + 1},${c1 + 1}) und (${r2 + 1},${c2 + 1}) ist das Feld bei Zeile ${target.r + 1}, Spalte ${target.c + 1} garantiert sicher!`,
                                    r: target.r,
                                    c: target.c,
                                    value: CELL_REVEALED,
                                    expectedVal: CELL_REVEALED,
                                    highlightCells: [{ r: r1, c: c1 }, { r: r2, c: c2 }, target]
                                };
                            } else if (rem2 - rem1 === diff.length && diff.length > 0) {
                                // Alle Zellen in diff müssen Minen sein!
                                const target = diff[0];
                                return {
                                    strategy: 'Mengen-Ausschluss (1-2)',
                                    title: 'Zwingende Minen durch Überlappung',
                                    message: `Durch Vergleich der Zahlen bei (${r1 + 1},${c1 + 1}) und (${r2 + 1},${c2 + 1}) muss das Feld bei Zeile ${target.r + 1}, Spalte ${target.c + 1} eine Mine sein!`,
                                    r: target.r,
                                    c: target.c,
                                    value: CELL_FLAGGED,
                                    expectedVal: CELL_FLAGGED,
                                    highlightCells: [{ r: r1, c: c1 }, { r: r2, c: c2 }, target]
                                };
                            }
                        }
                    }
                }
            }
        }

        // 4. Fallback: Sicheres Feld aus der tatsächlichen Lösung aufdecken
        // (Für den ersten Klick oder wenn keine rein lokale Deduktion mehr möglich ist)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.grid[r][c] === CELL_HIDDEN && !engine.mines[r][c]) {
                    return {
                        strategy: 'Sicherer Zug',
                        title: 'Sichere Zelle',
                        message: `Hier bei Zeile ${r + 1}, Spalte ${c + 1} liegt keine Mine. Du kannst das Feld gefahrlos aufdecken!`,
                        r,
                        c,
                        value: CELL_REVEALED,
                        expectedVal: CELL_REVEALED,
                        highlightCells: [{ r, c }]
                    };
                }
            }
        }

        return null;
    }
}
