/**
 * SumGrid Solver & Hint Engine
 * Findet Lösungen für SumGrid-Rätsel mittels Constraint-Propagation
 * und optimiertem Branch-and-Bound-Backtracking.
 * Generiert schrittweise didaktische Lösungshinweise für Spieler.
 */

import { SUMGRID_NEUTRAL, SUMGRID_KEEP, SUMGRID_CROSS } from './engine.js';

export class SumGridSolver {
    /**
     * Löst ein SumGrid-Rätsel und gibt bis zu `maxSolutions` Lösungen zurück.
     * @param {Object|SumGridEngine} puzzle - Engine oder { size, numbers, rowTargets, colTargets }
     * @param {number} maxSolutions - Maximale Anzahl zu findender Lösungen (Standard: 2 für Eindeutigkeitsprüfung)
     * @returns {Array<number[][]>} Array gefundener Lösungen (jeweils Matrix aus 0 und 1)
     */
    static solve(puzzle, maxSolutions = 2) {
        const size = puzzle.size;
        const numbers = puzzle.numbers;
        const rowTargets = puzzle.rowTargets;
        const colTargets = puzzle.colTargets;

        if (!numbers || !rowTargets || !colTargets) return [];

        // 1. Für jede Zeile alle gültigen Bitmasken vorberechnen, deren Zahlen die rowTarget ergeben
        const validRowMasks = [];
        const numCombinations = 1 << size;

        for (let r = 0; r < size; r++) {
            const target = rowTargets[r];
            const masks = [];

            for (let mask = 0; mask < numCombinations; mask++) {
                let sum = 0;
                for (let c = 0; c < size; c++) {
                    if ((mask & (1 << c)) !== 0) {
                        sum += numbers[r][c];
                    }
                }
                if (sum === target) {
                    masks.push(mask);
                }
            }

            if (masks.length === 0) {
                // Eine Zeile hat keinerlei Teilmenge, die das Ziel ergibt -> unlösbar
                return [];
            }
            validRowMasks.push(masks);
        }

        // 2. Maximal mögliche verbleibende Spaltensummen vorberechnen für aggressive Pruning
        // remMaxColSums[r][c] = Summe der Zahlen von row r bis size-1 in Spalte c
        const remMaxColSums = Array.from({ length: size + 1 }, () => Array(size).fill(0));
        for (let c = 0; c < size; c++) {
            for (let r = size - 1; r >= 0; r--) {
                remMaxColSums[r][c] = remMaxColSums[r + 1][c] + numbers[r][c];
            }
        }

        const solutions = [];
        const chosenMasks = Array(size).fill(0);
        const colSums = Array(size).fill(0);

        function backtrack(r) {
            if (r === size) {
                // Alle Zeilen belegt. Prüfe, ob alle Spaltensummen exakt stimmen
                let allMatch = true;
                for (let c = 0; c < size; c++) {
                    if (colSums[c] !== colTargets[c]) {
                        allMatch = false;
                        break;
                    }
                }
                if (allMatch) {
                    const solMatrix = Array.from({ length: size }, (_, row) =>
                        Array.from({ length: size }, (_, col) => ((chosenMasks[row] & (1 << col)) !== 0 ? 1 : 0))
                    );
                    solutions.push(solMatrix);
                }
                return;
            }

            const masks = validRowMasks[r];
            for (let i = 0; i < masks.length; i++) {
                const mask = masks[i];
                let feasible = true;

                // Teste Spalten-Pruning
                for (let c = 0; c < size; c++) {
                    const add = (mask & (1 << c)) !== 0 ? numbers[r][c] : 0;
                    const newColSum = colSums[c] + add;
                    const target = colTargets[c];

                    // 1. Spaltensumme darf Ziel nicht überschreiten
                    if (newColSum > target) {
                        feasible = false;
                        break;
                    }
                    // 2. Spaltensumme + verbleibendes Maximum muss mindestens Ziel erreichen
                    if (newColSum + remMaxColSums[r + 1][c] < target) {
                        feasible = false;
                        break;
                    }
                }

                if (feasible) {
                    // Wende Zug an
                    for (let c = 0; c < size; c++) {
                        if ((mask & (1 << c)) !== 0) {
                            colSums[c] += numbers[r][c];
                        }
                    }
                    chosenMasks[r] = mask;

                    backtrack(r + 1);

                    // Revertiere Zug
                    for (let c = 0; c < size; c++) {
                        if ((mask & (1 << c)) !== 0) {
                            colSums[c] -= numbers[r][c];
                        }
                    }

                    if (solutions.length >= maxSolutions) {
                        return;
                    }
                }
            }
        }

        backtrack(0);
        return solutions;
    }

    /**
     * Findet den nächsten logischen Tipp für den Spieler
     */
    static findLogicalHint(engine, options = {}) {
        const size = engine.size;
        const grid = engine.grid;
        const numbers = engine.numbers;
        const rowTargets = engine.rowTargets;
        const colTargets = engine.colTargets;

        // 1. Null-Ziel-Prüfung: Falls Ziel 0 ist, müssen alle neutralen Zellen gestrichen werden
        for (let r = 0; r < size; r++) {
            if (rowTargets[r] === 0) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === SUMGRID_NEUTRAL) {
                        return {
                            strategy: 'Null-Ziel',
                            r, c,
                            value: SUMGRID_CROSS,
                            expectedVal: SUMGRID_CROSS,
                            title: 'Nullsumme in Zeile',
                            description: `In Zeile ${r + 1} ist das Ziel 0. Daher muss die ${numbers[r][c]} gestrichen werden.`
                        };
                    }
                }
            }
        }

        for (let c = 0; c < size; c++) {
            if (colTargets[c] === 0) {
                for (let r = 0; r < size; r++) {
                    if (grid[r][c] === SUMGRID_NEUTRAL) {
                        return {
                            strategy: 'Null-Ziel',
                            r, c,
                            value: SUMGRID_CROSS,
                            expectedVal: SUMGRID_CROSS,
                            title: 'Nullsumme in Spalte',
                            description: `In Spalte ${c + 1} ist das Ziel 0. Daher muss die ${numbers[r][c]} gestrichen werden.`
                        };
                    }
                }
            }
        }

        // 2. Ziel bereits erreicht: Verbleibende neutrale Zellen streichen
        for (let r = 0; r < size; r++) {
            const currentSum = engine.getRowSum(r);
            if (currentSum === rowTargets[r]) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === SUMGRID_NEUTRAL) {
                        return {
                            strategy: 'Zielsumme erreicht',
                            r, c,
                            value: SUMGRID_CROSS,
                            expectedVal: SUMGRID_CROSS,
                            title: 'Zeilenziel erfüllt',
                            description: `Zeile ${r + 1} hat das Ziel ${rowTargets[r]} bereits erreicht. Die ${numbers[r][c]} kann gestrichen werden.`
                        };
                    }
                }
            }
        }

        for (let c = 0; c < size; c++) {
            const currentSum = engine.getColSum(c);
            if (currentSum === colTargets[c]) {
                for (let r = 0; r < size; r++) {
                    if (grid[r][c] === SUMGRID_NEUTRAL) {
                        return {
                            strategy: 'Zielsumme erreicht',
                            r, c,
                            value: SUMGRID_CROSS,
                            expectedVal: SUMGRID_CROSS,
                            title: 'Spaltenziel erfüllt',
                            description: `Spalte ${c + 1} hat das Ziel ${colTargets[c]} bereits erreicht. Die ${numbers[r][c]} kann gestrichen werden.`
                        };
                    }
                }
            }
        }

        // 3. Ausschluss zu großer Zahlen: Wenn eine Zahl > verbleibendes Ziel
        for (let r = 0; r < size; r++) {
            const rem = rowTargets[r] - engine.getRowSum(r);
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === SUMGRID_NEUTRAL && numbers[r][c] > rem) {
                    return {
                        strategy: 'Überhang-Ausschluss',
                        r, c,
                        value: SUMGRID_CROSS,
                        expectedVal: SUMGRID_CROSS,
                        title: 'Zahl zu groß',
                        description: `In Zeile ${r + 1} fehlen noch ${rem}, aber ${numbers[r][c]} ist größer. Sie muss gestrichen werden.`
                    };
                }
            }
        }

        for (let c = 0; c < size; c++) {
            const rem = colTargets[c] - engine.getColSum(c);
            for (let r = 0; r < size; r++) {
                if (grid[r][c] === SUMGRID_NEUTRAL && numbers[r][c] > rem) {
                    return {
                        strategy: 'Überhang-Ausschluss',
                        r, c,
                        value: SUMGRID_CROSS,
                        expectedVal: SUMGRID_CROSS,
                        title: 'Zahl zu groß',
                        description: `In Spalte ${c + 1} fehlen noch ${rem}, aber ${numbers[r][c]} ist größer. Sie muss gestrichen werden.`
                    };
                }
            }
        }

        // 4. Vollsumme: Wenn verbleibende mögliche Summe exakt dem verbleibenden Ziel entspricht
        for (let r = 0; r < size; r++) {
            const poss = engine.getRowPossibleSum(r);
            if (poss === rowTargets[r]) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === SUMGRID_NEUTRAL) {
                        return {
                            strategy: 'Vollsumme',
                            r, c,
                            value: SUMGRID_KEEP,
                            expectedVal: SUMGRID_KEEP,
                            title: 'Alle werden benötigt',
                            description: `In Zeile ${r + 1} müssen alle verbleibenden Zahlen behalten werden, um ${rowTargets[r]} zu erreichen.`
                        };
                    }
                }
            }
        }

        for (let c = 0; c < size; c++) {
            const poss = engine.getColPossibleSum(c);
            if (poss === colTargets[c]) {
                for (let r = 0; r < size; r++) {
                    if (grid[r][c] === SUMGRID_NEUTRAL) {
                        return {
                            strategy: 'Vollsumme',
                            r, c,
                            value: SUMGRID_KEEP,
                            expectedVal: SUMGRID_KEEP,
                            title: 'Alle werden benötigt',
                            description: `In Spalte ${c + 1} müssen alle verbleibenden Zahlen behalten werden, um ${colTargets[c]} zu erreichen.`
                        };
                    }
                }
            }
        }

        // 5. Exakter Lückenschluss: Genau eine Zahl fehlt noch zum Zeilen- oder Spaltenziel
        for (let r = 0; r < size; r++) {
            const rem = rowTargets[r] - engine.getRowSum(r);
            const neutrals = [];
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === SUMGRID_NEUTRAL) neutrals.push({ c, val: numbers[r][c] });
            }
            if (neutrals.length === 1 && neutrals[0].val === rem) {
                return {
                    strategy: 'Lückenschluss',
                    r, c: neutrals[0].c,
                    value: SUMGRID_KEEP,
                    expectedVal: SUMGRID_KEEP,
                    title: 'Exakter Lückenschluss',
                    description: `Die ${neutrals[0].val} in Zeile ${r + 1} schließt exakt die verbleibende Lücke von ${rem}.`
                };
            }
        }

        for (let c = 0; c < size; c++) {
            const rem = colTargets[c] - engine.getColSum(c);
            const neutrals = [];
            for (let r = 0; r < size; r++) {
                if (grid[r][c] === SUMGRID_NEUTRAL) neutrals.push({ r, val: numbers[r][c] });
            }
            if (neutrals.length === 1 && neutrals[0].val === rem) {
                return {
                    strategy: 'Lückenschluss',
                    r: neutrals[0].r, c,
                    value: SUMGRID_KEEP,
                    expectedVal: SUMGRID_KEEP,
                    title: 'Exakter Lückenschluss',
                    description: `Die ${neutrals[0].val} in Spalte ${c + 1} schließt exakt die verbleibende Lücke von ${rem}.`
                };
            }
        }

        // 6. Fallback basierend auf der eindeutigen Lösung
        let sol = engine.solution;
        if (!sol) {
            const solved = SumGridSolver.solve(engine, 1);
            if (solved.length > 0) sol = solved[0];
        }

        if (sol) {
            // Bevorzuge fokussierte Zelle falls neutral
            if (options.focusCell) {
                const { r, c } = options.focusCell;
                if (grid[r] && grid[r][c] === SUMGRID_NEUTRAL) {
                    const shouldKeep = sol[r][c] === 1;
                    return {
                        strategy: 'Deduktion',
                        r, c,
                        value: shouldKeep ? SUMGRID_KEEP : SUMGRID_CROSS,
                        expectedVal: shouldKeep ? SUMGRID_KEEP : SUMGRID_CROSS,
                        title: shouldKeep ? 'Zahl behalten' : 'Zahl streichen',
                        description: shouldKeep
                            ? `Die ${numbers[r][c]} in Zeile ${r + 1}, Spalte ${c + 1} gehört zur Lösung.`
                            : `Die ${numbers[r][c]} in Zeile ${r + 1}, Spalte ${c + 1} gehört nicht zur Lösung.`
                    };
                }
            }

            // Ansonsten erste ungelöste neutrale Zelle
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === SUMGRID_NEUTRAL) {
                        const shouldKeep = sol[r][c] === 1;
                        return {
                            strategy: 'Deduktion',
                            r, c,
                            value: shouldKeep ? SUMGRID_KEEP : SUMGRID_CROSS,
                            expectedVal: shouldKeep ? SUMGRID_KEEP : SUMGRID_CROSS,
                            title: shouldKeep ? 'Zahl behalten' : 'Zahl streichen',
                            description: shouldKeep
                                ? `Die ${numbers[r][c]} in Zeile ${r + 1}, Spalte ${c + 1} gehört zur Zielsumme.`
                                : `Die ${numbers[r][c]} in Zeile ${r + 1}, Spalte ${c + 1} gehört nicht zur Summe.`
                        };
                    }
                }
            }
        }

        return null;
    }
}
