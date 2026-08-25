/**
 * Nonogram (Picross / Griddlers) Solver
 * Implementiert einen hochperformanten Line-Solver für logische Deduktionen,
 * Eindeutigkeitsprüfungen und interaktive Hinweise.
 */

import { NONO_EMPTY, NONO_FILLED, NONO_CROSS, NonogramEngine } from './engine.js';

export class NonogramSolver {
    /**
     * Generiert alle gültigen Belegungen einer Zeile/Spalte passend zu den Clues und dem aktuellen Zustand.
     */
    static getValidLinePossibilities(length, clues, currentLine = null) {
        if (clues.length === 0 || (clues.length === 1 && clues[0] === 0)) {
            // Komplett leere Zeile (nur Kreuze / Nullen)
            if (currentLine && currentLine.some(v => v === NONO_FILLED)) {
                return [];
            }
            return [Array(length).fill(0)];
        }

        const results = [];
        const numBlocks = clues.length;

        function placeBlock(blockIdx, startPos, currentAssignment) {
            if (blockIdx === numBlocks) {
                // Rest mit 0 auffüllen
                const fullLine = [...currentAssignment, ...Array(length - currentAssignment.length).fill(0)];
                
                // Prüfen ob kompatibel mit currentLine
                if (currentLine) {
                    for (let i = 0; i < length; i++) {
                        if (currentLine[i] === NONO_FILLED && fullLine[i] !== 1) return;
                        if (currentLine[i] === NONO_CROSS && fullLine[i] !== 0) return;
                    }
                }
                results.push(fullLine);
                return;
            }

            const blockSize = clues[blockIdx];
            // Verbleibender Platz für nachfolgende Blöcke berechnen
            let remainingSpace = 0;
            for (let i = blockIdx + 1; i < numBlocks; i++) {
                remainingSpace += clues[i] + 1; // Blockgröße + mind. 1 Lücke
            }

            const maxStart = length - remainingSpace - blockSize;

            for (let pos = startPos; pos <= maxStart; pos++) {
                // Prüfen ob die Lücken vor dem Block gültig sind
                let valid = true;
                const zeroesCount = pos - currentAssignment.length;
                if (currentLine) {
                    for (let i = 0; i < zeroesCount; i++) {
                        const idx = currentAssignment.length + i;
                        if (currentLine[idx] === NONO_FILLED) {
                            valid = false;
                            break;
                        }
                    }
                }
                if (!valid) continue;

                // Prüfen ob der Block selbst gültig ist
                if (currentLine) {
                    for (let i = 0; i < blockSize; i++) {
                        const idx = pos + i;
                        if (currentLine[idx] === NONO_CROSS) {
                            valid = false;
                            break;
                        }
                    }
                }
                if (!valid) continue;

                // Block platzieren
                const nextAssignment = [
                    ...currentAssignment,
                    ...Array(pos - currentAssignment.length).fill(0),
                    ...Array(blockSize).fill(1)
                ];

                // Wenn nicht der letzte Block, muss mind. 1 Lücke (0) folgen
                if (blockIdx < numBlocks - 1) {
                    const separatorIdx = nextAssignment.length;
                    if (currentLine && currentLine[separatorIdx] === NONO_FILLED) {
                        continue;
                    }
                    nextAssignment.push(0);
                }

                placeBlock(blockIdx + 1, nextAssignment.length, nextAssignment);
            }
        }

        placeBlock(0, 0, []);
        return results;
    }

    /**
     * Führt eine logische Schnittmengen-Reduktion auf einer einzelnen Zeile aus
     */
    static deduceLine(length, clues, currentLine) {
        const possibilities = NonogramSolver.getValidLinePossibilities(length, clues, currentLine);
        if (possibilities.length === 0) {
            return { error: true, deductions: [] };
        }

        const mustFill = [];
        const mustCross = [];

        for (let i = 0; i < length; i++) {
            if (currentLine[i] !== NONO_EMPTY) continue;

            const allOnes = possibilities.every(p => p[i] === 1);
            const allZeroes = possibilities.every(p => p[i] === 0);

            if (allOnes) {
                mustFill.push(i);
            } else if (allZeroes) {
                mustCross.push(i);
            }
        }

        return { error: false, mustFill, mustCross, count: possibilities.length };
    }

    /**
     * Findet einen logischen Hinweis (Hint) für den Spieler
     */
    static findLogicalHint(engine) {
        // 0. Zuerst Fehler erkennen
        const mistakes = engine.findMistakes ? engine.findMistakes() : [];
        if (mistakes.length > 0) {
            const m = mistakes[0];
            return {
                type: 'solution_mismatch',
                strategy: 'Fehlerhafte Markierung',
                title: 'Fehler korrigieren',
                r: m.r,
                c: m.c,
                val: m.expectedVal,
                value: m.expectedVal,
                expectedVal: m.expectedVal,
                message: `Das Feld (${m.r + 1}, ${m.c + 1}) ist fälschlicherweise gefüllt. Es sollte geleert oder mit einem Kreuz markiert werden.`,
                description: `Das Feld (${m.r + 1}, ${m.c + 1}) ist fälschlicherweise gefüllt. Es sollte geleert oder mit einem Kreuz markiert werden.`,
                explanation: `Das Feld (${m.r + 1}, ${m.c + 1}) ist fälschlicherweise gefüllt.`
            };
        }

        // 1. Zeilen durchsuchen
        for (let r = 0; r < engine.height; r++) {
            const line = engine.grid[r];
            const clues = engine.rowClues[r];
            const res = NonogramSolver.deduceLine(engine.width, clues, line);

            if (!res.error && res.mustFill.length > 0) {
                const c = res.mustFill[0];
                return {
                    r,
                    c,
                    val: NONO_FILLED,
                    value: NONO_FILLED,
                    expectedVal: NONO_FILLED,
                    type: 'fill',
                    strategy: 'Logische Zeilen-Deduktion',
                    title: 'Zeilen-Deduktion',
                    message: `In Zeile ${r + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`,
                    description: `In Zeile ${r + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`,
                    explanation: `In Zeile ${r + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`
                };
            }
            if (!res.error && res.mustCross.length > 0) {
                const c = res.mustCross[0];
                return {
                    r,
                    c,
                    val: NONO_CROSS,
                    value: NONO_CROSS,
                    expectedVal: NONO_CROSS,
                    type: 'cross',
                    strategy: 'Logischer Zeilen-Ausschluss',
                    title: 'Zeilen-Ausschluss',
                    message: `In Zeile ${r + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`,
                    description: `In Zeile ${r + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`,
                    explanation: `In Zeile ${r + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`
                };
            }
        }

        // 2. Spalten durchsuchen
        for (let c = 0; c < engine.width; c++) {
            const col = [];
            for (let r = 0; r < engine.height; r++) {
                col.push(engine.grid[r][c]);
            }
            const clues = engine.colClues[c];
            const res = NonogramSolver.deduceLine(engine.height, clues, col);

            if (!res.error && res.mustFill.length > 0) {
                const r = res.mustFill[0];
                return {
                    r,
                    c,
                    val: NONO_FILLED,
                    value: NONO_FILLED,
                    expectedVal: NONO_FILLED,
                    type: 'fill',
                    strategy: 'Logische Spalten-Deduktion',
                    title: 'Spalten-Deduktion',
                    message: `In Spalte ${c + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`,
                    description: `In Spalte ${c + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`,
                    explanation: `In Spalte ${c + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`
                };
            }
            if (!res.error && res.mustCross.length > 0) {
                const r = res.mustCross[0];
                return {
                    r,
                    c,
                    val: NONO_CROSS,
                    value: NONO_CROSS,
                    expectedVal: NONO_CROSS,
                    type: 'cross',
                    strategy: 'Logischer Spalten-Ausschluss',
                    title: 'Spalten-Ausschluss',
                    message: `In Spalte ${c + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`,
                    description: `In Spalte ${c + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`,
                    explanation: `In Spalte ${c + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`
                };
            }
        }

        // 3. Fallback auf Target
        if (engine.target && engine.target.length > 0) {
            for (let r = 0; r < engine.height; r++) {
                for (let c = 0; c < engine.width; c++) {
                    if (engine.grid[r][c] === NONO_EMPTY) {
                        const targetVal = engine.target[r][c] === 1 ? NONO_FILLED : NONO_CROSS;
                        return {
                            r,
                            c,
                            val: targetVal,
                            value: targetVal,
                            expectedVal: targetVal,
                            type: targetVal === NONO_FILLED ? 'fill' : 'cross',
                            strategy: 'Nächster Schritt',
                            title: 'Nächster Schritt',
                            message: `Setze Feld (${r + 1}, ${c + 1}) auf ${targetVal === NONO_FILLED ? 'Gefüllt (⬛)' : 'Kreuz (✕)'}.`,
                            description: `Setze Feld (${r + 1}, ${c + 1}) auf ${targetVal === NONO_FILLED ? 'Gefüllt (⬛)' : 'Kreuz (✕)'}.`,
                            explanation: `Setze Feld (${r + 1}, ${c + 1}) auf ${targetVal === NONO_FILLED ? 'Gefüllt (⬛)' : 'Kreuz (✕)'}.`
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Löst das Nonogramm rein durch logische Deduktion (ohne Raten)
     * Gibt true zurück, wenn rein logisch vollständig lösbar.
     */
    static solveLogical(engine) {
        const testGrid = Array.from({ length: engine.height }, () => Array(engine.width).fill(NONO_EMPTY));
        let changed = true;

        while (changed) {
            changed = false;

            // Zeilen
            for (let r = 0; r < engine.height; r++) {
                const res = NonogramSolver.deduceLine(engine.width, engine.rowClues[r], testGrid[r]);
                if (res.error) return { solvable: false, grid: testGrid };

                for (const c of res.mustFill) {
                    testGrid[r][c] = NONO_FILLED;
                    changed = true;
                }
                for (const c of res.mustCross) {
                    testGrid[r][c] = NONO_CROSS;
                    changed = true;
                }
            }

            // Spalten
            for (let c = 0; c < engine.width; c++) {
                const col = [];
                for (let r = 0; r < engine.height; r++) {
                    col.push(testGrid[r][c]);
                }
                const res = NonogramSolver.deduceLine(engine.height, engine.colClues[c], col);
                if (res.error) return { solvable: false, grid: testGrid };

                for (const r of res.mustFill) {
                    testGrid[r][c] = NONO_FILLED;
                    changed = true;
                }
                for (const r of res.mustCross) {
                    testGrid[r][c] = NONO_CROSS;
                    changed = true;
                }
            }
        }

        // Prüfen ob alle Felder bestimmt sind
        const isComplete = testGrid.every(row => row.every(val => val !== NONO_EMPTY));
        return { solvable: isComplete, grid: testGrid };
    }

    /**
     * Findet alle Lösungen (zur Eindeutigkeitsprüfung)
     */
    static solve(engine, maxSolutions = 2) {
        const logicalRes = NonogramSolver.solveLogical(engine);
        if (logicalRes.solvable) {
            return [logicalRes.grid.map(row => row.map(v => (v === NONO_FILLED ? 1 : 0)))];
        }

        const solutions = [];

        function backtrack(r, c, currentGrid) {
            if (solutions.length >= maxSolutions) return;

            if (r === engine.height) {
                // Prüfen ob alle Spalten gültig sind
                for (let colIdx = 0; colIdx < engine.width; colIdx++) {
                    const col = currentGrid.map(row => row[colIdx]);
                    const clues = NonogramEngine.calculateLineClues(col);
                    const targetClues = engine.colClues[colIdx];
                    if (clues.length !== targetClues.length || clues.some((v, i) => v !== targetClues[i])) {
                        return;
                    }
                }
                solutions.push(currentGrid.map(row => [...row]));
                return;
            }

            const nextR = c + 1 === engine.width ? r + 1 : r;
            const nextC = c + 1 === engine.width ? 0 : c + 1;

            if (c === 0) {
                // Belegungen für die ganze Zeile ermitteln
                const possibilities = NonogramSolver.getValidLinePossibilities(engine.width, engine.rowClues[r]);
                for (const poss of possibilities) {
                    currentGrid[r] = poss;
                    backtrack(r + 1, 0, currentGrid);
                    if (solutions.length >= maxSolutions) return;
                }
            }
        }

        backtrack(0, 0, Array.from({ length: engine.height }, () => Array(engine.width).fill(0)));
        return solutions;
    }
}
