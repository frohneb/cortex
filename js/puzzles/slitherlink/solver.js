/**
 * Slitherlink Solver & Hint Engine - Cortex Puzzle Platform
 * Deduktive Logik, schrittweise Lösungsstrategien und Eindeutigkeitsprüfung.
 */

export class SlitherlinkSolver {
    /**
     * Ermittelt den nächsten logischen Tipp für den Spieler
     */
    static getHint(engine, options = {}) {
        // 1. FEHLER-PRÜFUNG (Priorität: Spieler-Fehler sofort aufdecken und korrigieren)
        const mistake = engine.findMistakes ? engine.findMistakes() : null;
        if (mistake) {
            return {
                ...mistake,
                isMistake: true,
                type: 'error'
            };
        }

        const rows = engine.rows;
        const cols = engine.cols;
        const candidates = [];

        // Hilfsfunktion: Berechnet Distanz zur Fokus-Zelle bzw. Fokus-Kante
        const getDistanceToFocus = (cand) => {
            if (options.focusEdge && options.focusEdge.type === cand.edgeType) {
                if (options.focusEdge.r === cand.r && options.focusEdge.c === cand.c) return 0;
            }
            if (options.focusCell) {
                const edgeCenterR = cand.edgeType === 'h' ? cand.r : cand.r + 0.5;
                const edgeCenterC = cand.edgeType === 'h' ? cand.c + 0.5 : cand.c;
                const cellCenterR = options.focusCell.r + 0.5;
                const cellCenterC = options.focusCell.c + 0.5;
                return Math.hypot(edgeCenterR - cellCenterR, edgeCenterC - cellCenterC);
            }
            return 999;
        };

        // 2. BASIS-STRATEGIEN
        // 2a. 0er-Zelle: Alle noch leeren Kanten müssen ✕ werden
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.clues[r][c] === 0) {
                    const edges = engine.getCellEdges(r, c);
                    for (const edge of edges) {
                        if (edge.val === 0) {
                            candidates.push({
                                type: 'clue_0',
                                edgeType: edge.type,
                                r: edge.r, c: edge.c,
                                cell: { r, c },
                                value: 2, // Kreuz
                                expectedVal: 2,
                                priority: 10,
                                title: '0er-Zelle sperren',
                                strategy: 'Basis: Null-Regel',
                                message: `Um eine 0 dürfen keine Linien verlaufen. Alle 4 Kanten müssen durchkreuzt werden.`
                            });
                        }
                    }
                }
            }
        }

        // 4. MUSTER-LOGIK (3er in Ecken & Paare)
        // 4a. 3 in der Ecke
        const corners = [
            { r: 0, c: 0, outerH: { r: 0, c: 0 }, outerV: { r: 0, c: 0 } },
            { r: 0, c: cols - 1, outerH: { r: 0, c: cols - 1 }, outerV: { r: 0, c: cols } },
            { r: rows - 1, c: 0, outerH: { r: rows, c: 0 }, outerV: { r: rows - 1, c: 0 } },
            { r: rows - 1, c: cols - 1, outerH: { r: rows, c: cols - 1 }, outerV: { r: rows - 1, c: cols } }
        ];

        for (const corner of corners) {
            if (engine.clues[corner.r][corner.c] === 3) {
                if (engine.hEdges[corner.outerH.r][corner.outerH.c] === 0) {
                    candidates.push({
                        type: 'corner_3',
                        edgeType: 'h',
                        r: corner.outerH.r, c: corner.outerH.c,
                        cell: { r: corner.r, c: corner.c },
                        value: 1,
                        expectedVal: 1,
                        priority: 9,
                        title: '3 in der Spielfeldecke',
                        strategy: 'Muster: Eck-Dreier',
                        message: `Eine 3 in einer Ecke erzwingt zwingend die beiden äußeren Kanten als Linien.`
                    });
                }
                if (engine.vEdges[corner.outerV.r][corner.outerV.c] === 0) {
                    candidates.push({
                        type: 'corner_3',
                        edgeType: 'v',
                        r: corner.outerV.r, c: corner.outerV.c,
                        cell: { r: corner.r, c: corner.c },
                        value: 1,
                        expectedVal: 1,
                        priority: 9,
                        title: '3 in der Spielfeldecke',
                        strategy: 'Muster: Eck-Dreier',
                        message: `Eine 3 in einer Ecke erzwingt zwingend die beiden äußeren Kanten als Linien.`
                    });
                }
            }
        }

        // 4b. Benachbarte 3er (Horizontal 3-3)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                if (engine.clues[r][c] === 3 && engine.clues[r][c + 1] === 3) {
                    // Gemeinsame Mittelkante (vEdge r, c+1) muss 1 sein
                    if (engine.vEdges[r][c + 1] === 0) {
                        candidates.push({
                            type: 'adjacent_3',
                            edgeType: 'v',
                            r, c: c + 1,
                            cell: { r, c },
                            value: 1,
                            expectedVal: 1,
                            priority: 8,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Zwei nebeneinanderliegende 3er teilen sich immer eine gemeinsame Linie in der Mitte.`
                        });
                    }
                    if (engine.vEdges[r][c] === 0) {
                        candidates.push({
                            type: 'adjacent_3',
                            edgeType: 'v',
                            r, c,
                            cell: { r, c },
                            value: 1,
                            expectedVal: 1,
                            priority: 8,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Bei zwei benachbarten 3ern müssen auch die parallelen Außenkanten Linien sein.`
                        });
                    }
                    if (engine.vEdges[r][c + 2] === 0) {
                        candidates.push({
                            type: 'adjacent_3',
                            edgeType: 'v',
                            r, c: c + 2,
                            cell: { r, c: c + 1 },
                            value: 1,
                            expectedVal: 1,
                            priority: 8,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Bei zwei benachbarten 3ern müssen auch die parallelen Außenkanten Linien sein.`
                        });
                    }
                }
            }
        }

        // 4c. Benachbarte 3er (Vertikal 3 / 3)
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.clues[r][c] === 3 && engine.clues[r + 1][c] === 3) {
                    if (engine.hEdges[r + 1][c] === 0) {
                        candidates.push({
                            type: 'adjacent_3',
                            edgeType: 'h',
                            r: r + 1, c,
                            cell: { r, c },
                            value: 1,
                            expectedVal: 1,
                            priority: 8,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Zwei übereinanderliegende 3er teilen sich immer eine gemeinsame horizontale Linie.`
                        });
                    }
                    if (engine.hEdges[r][c] === 0) {
                        candidates.push({
                            type: 'adjacent_3',
                            edgeType: 'h',
                            r, c,
                            cell: { r, c },
                            value: 1,
                            expectedVal: 1,
                            priority: 8,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Bei zwei übereinanderliegenden 3ern müssen auch die oberen und unteren Außenkanten Linien sein.`
                        });
                    }
                    if (engine.hEdges[r + 2][c] === 0) {
                        candidates.push({
                            type: 'adjacent_3',
                            edgeType: 'h',
                            r: r + 2, c,
                            cell: { r: r + 1, c },
                            value: 1,
                            expectedVal: 1,
                            priority: 8,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Bei zwei übereinanderliegenden 3ern müssen auch die oberen und unteren Außenkanten Linien sein.`
                        });
                    }
                }
            }
        }

        // 2c. Erzwungene Linien: Wenn verbleibende leere Kanten exakt der fehlenden Linienanzahl entsprechen
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.clues[r][c];
                if (clue !== null && clue !== undefined) {
                    const lines = engine.getCellEdgeCount(r, c);
                    const crosses = engine.getCellCrossCount(r, c);
                    const remainingEmpty = 4 - lines - crosses;
                    const needed = clue - lines;

                    if (needed > 0 && remainingEmpty === needed) {
                        const edges = engine.getCellEdges(r, c);
                        for (const edge of edges) {
                            if (edge.val === 0) {
                                candidates.push({
                                    type: 'clue_forced_lines',
                                    edgeType: edge.type,
                                    r: edge.r, c: edge.c,
                                    cell: { r, c },
                                    value: 1, // Linie
                                    expectedVal: 1,
                                    priority: 7,
                                    title: 'Zwingende Linien',
                                    strategy: 'Basis: Kantenmangel',
                                    message: `Die Zelle (${r + 1}, ${c + 1}) benötigt noch ${needed} Linie(n) und hat genau ${remainingEmpty} freie Kante(n). Diese müssen Linien sein.`
                                });
                            }
                        }
                    }
                }
            }
        }

        // 3b. Linienfortführung: Punkt hat 1 Linie und nur noch 1 offene Kante -> Linie MUSS dort weitergehen!
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const edges = engine.getVertexEdges(vr, vc);
                const lines = edges.filter(e => e.val === 1).length;
                const emptyEdges = edges.filter(e => e.val === 0);

                if (lines === 1 && emptyEdges.length === 1) {
                    const nextEdge = emptyEdges[0];
                    candidates.push({
                        type: 'vertex_continuation',
                        edgeType: nextEdge.type,
                        r: nextEdge.r, c: nextEdge.c,
                        vertex: { vr, vc },
                        value: 1,
                        expectedVal: 1,
                        priority: 6,
                        title: 'Linie fortführen',
                        strategy: 'Punktegrad: Pfadfortsetzung',
                        message: `Die Schleife am Punkt (${vr + 1}, ${vc + 1}) darf nicht abbrechen. Sie muss entlang der einzigen offenen Kante weitergehen.`
                    });
                }
            }
        }

        // 3a. Punkt hat 2 Linien -> alle anderen anstoßenden Kanten müssen ✕ sein
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const edges = engine.getVertexEdges(vr, vc);
                const lines = edges.filter(e => e.val === 1).length;
                if (lines === 2) {
                    for (const edge of edges) {
                        if (edge.val === 0) {
                            candidates.push({
                                type: 'vertex_full',
                                edgeType: edge.type,
                                r: edge.r, c: edge.c,
                                vertex: { vr, vc },
                                value: 2,
                                expectedVal: 2,
                                priority: 5,
                                title: 'Punkt ist voll',
                                strategy: 'Punktegrad: Exakt 2 Linien',
                                message: `Am Punkt (${vr + 1}, ${vc + 1}) treffen bereits 2 Linien zusammen. Alle weiteren Kanten müssen ✕ sein.`
                            });
                        }
                    }
                }
            }
        }

        // 2b. Erfüllte Zahlen: Übrige Kanten auf ✕ setzen
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.clues[r][c];
                if (clue !== null && clue !== undefined) {
                    const lines = engine.getCellEdgeCount(r, c);
                    if (lines === clue) {
                        const edges = engine.getCellEdges(r, c);
                        for (const edge of edges) {
                            if (edge.val === 0) {
                                candidates.push({
                                    type: 'clue_satisfied',
                                    edgeType: edge.type,
                                    r: edge.r, c: edge.c,
                                    cell: { r, c },
                                    value: 2,
                                    expectedVal: 2,
                                    priority: 4,
                                    title: 'Zahl bereits erfüllt',
                                    strategy: 'Basis: Vollständige Zahl',
                                    message: `Die Zahl ${clue} in Zelle (${r + 1}, ${c + 1}) hat bereits alle ${clue} Linien. Die restlichen Kanten müssen ✕ sein.`
                                });
                            }
                        }
                    }
                }
            }
        }

        // 3c. Sackgassen-Vermeidung: Punkt hat 3 Kreuze (✕) -> 4. Kante kann keine Linie halten -> MUSS ✕ sein
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const edges = engine.getVertexEdges(vr, vc);
                const lines = edges.filter(e => e.val === 1).length;
                const crosses = edges.filter(e => e.val === 2).length;
                const emptyEdges = edges.filter(e => e.val === 0);

                if (lines === 0 && crosses === edges.length - 1 && emptyEdges.length === 1) {
                    const lastEdge = emptyEdges[0];
                    candidates.push({
                        type: 'vertex_dead_end',
                        edgeType: lastEdge.type,
                        r: lastEdge.r, c: lastEdge.c,
                        vertex: { vr, vc },
                        value: 2,
                        expectedVal: 2,
                        priority: 3,
                        title: 'Sackgasse ausschließen',
                        strategy: 'Punktegrad: Keine Sackgasse',
                        message: `Am Punkt (${vr + 1}, ${vc + 1}) sind fast alle Kanten blockiert. Eine einzelne Linie hierhin würde eine Sackgasse bilden.`
                    });
                }
            }
        }

        // Wenn deduktive Kandidaten gefunden wurden, wähle den besten
        if (candidates.length > 0) {
            candidates.sort((a, b) => {
                if (options.focusCell || options.focusEdge) {
                    const distA = getDistanceToFocus(a);
                    const distB = getDistanceToFocus(b);
                    if (Math.abs(distA - distB) > 0.001) {
                        return distA - distB;
                    }
                }
                return b.priority - a.priority;
            });
            return candidates[0];
        }

        // 5. VORAUSSCHAUENDE LÖSUNG (FALLBACK VIA SOLVER-LÖSUNG)
        const sol = engine.getSolution ? engine.getSolution() : (engine.solution || (SlitherlinkSolver.solve(engine.clues, 1)?.[0]));
        if (sol) {
            // Priorisiere das Finden einer Schleifen-LINIE (solVal === 1)
            // Bevorzuge Linien, die an bestehende Linien oder Zahlenhinweise anschließen
            let bestLineCand = null;
            let bestLineScore = -1;

            const evaluateLineCand = (edgeType, r, c) => {
                let score = 1;
                // Anbindung an bestehende Linien prüfen
                const v1 = (edgeType === 'h') ? { vr: r, vc: c } : { vr: r, vc: c };
                const v2 = (edgeType === 'h') ? { vr: r, vc: c + 1 } : { vr: r + 1, vc: c };
                if (engine.getVertexDegree(v1.vr, v1.vc) > 0) score += 3;
                if (engine.getVertexDegree(v2.vr, v2.vc) > 0) score += 3;

                // Anbindung an Zahlenhinweise prüfen
                if (edgeType === 'h') {
                    if (r > 0 && engine.clues[r - 1][c] !== null) score += 2;
                    if (r < rows && engine.clues[r][c] !== null) score += 2;
                } else {
                    if (c > 0 && engine.clues[r][c - 1] !== null) score += 2;
                    if (c < cols && engine.clues[r][c] !== null) score += 2;
                }

                if (options.focusCell) {
                    const dist = getDistanceToFocus({ edgeType, r, c });
                    score -= dist * 0.5;
                }

                if (score > bestLineScore) {
                    bestLineScore = score;
                    bestLineCand = {
                        type: 'solution_step',
                        edgeType,
                        r, c,
                        value: 1,
                        expectedVal: 1,
                        title: 'Linien-Schritt',
                        strategy: 'Logische Schlussfolgerung',
                        message: `Die ${edgeType === 'h' ? 'horizontale' : 'vertikale'} Kante (${r + 1}, ${c + 1}) ist Teil der eindeutigen Gesamtschleife.`
                    };
                }
            };

            if (sol.hEdges) {
                for (let r = 0; r <= rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (engine.hEdges[r][c] === 0 && sol.hEdges[r][c] === 1) {
                            evaluateLineCand('h', r, c);
                        }
                    }
                }
            }

            if (sol.vEdges) {
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c <= cols; c++) {
                        if (engine.vEdges[r][c] === 0 && sol.vEdges[r][c] === 1) {
                            evaluateLineCand('v', r, c);
                        }
                    }
                }
            }

            if (bestLineCand) {
                return bestLineCand;
            }

            // Falls alle Linien bereits gefunden sind, verbleibende Kreuze (solVal !== 1) vorschlagen
            if (sol.hEdges) {
                for (let r = 0; r <= rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (engine.hEdges[r][c] === 0 && sol.hEdges[r][c] !== 1) {
                            return {
                                type: 'solution_step',
                                edgeType: 'h',
                                r, c,
                                value: 2,
                                expectedVal: 2,
                                title: 'Kante ausschließen',
                                strategy: 'Logische Schlussfolgerung',
                                message: `Die horizontale Kante (${r + 1}, ${c + 1}) kann nicht Teil der Schleife sein und erhält ein Kreuz.`
                            };
                        }
                    }
                }
            }

            if (sol.vEdges) {
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c <= cols; c++) {
                        if (engine.vEdges[r][c] === 0 && sol.vEdges[r][c] !== 1) {
                            return {
                                type: 'solution_step',
                                edgeType: 'v',
                                r, c,
                                value: 2,
                                expectedVal: 2,
                                title: 'Kante ausschließen',
                                strategy: 'Logische Schlussfolgerung',
                                message: `Die vertikale Kante (${r + 1}, ${c + 1}) kann nicht Teil der Schleife sein und erhält ein Kreuz.`
                            };
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Findet alle Lösungen für ein Slitherlink-Puzzle (zur Eindeutigkeitsprüfung).
     */
    static solve(clues, maxSolutions = 2) {
        const rows = clues.length;
        const cols = clues[0].length;

        const hEdges = Array(rows + 1).fill(0).map(() => Array(cols).fill(0));
        const vEdges = Array(rows).fill(0).map(() => Array(cols + 1).fill(0));

        const allEdges = [];
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                allEdges.push({ type: 'h', r, c });
            }
        }
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                allEdges.push({ type: 'v', r, c });
            }
        }

        const solutions = [];

        function checkVertex(vr, vc) {
            let lines = 0;
            let empty = 0;

            if (vc > 0) { if (hEdges[vr][vc - 1] === 1) lines++; else if (hEdges[vr][vc - 1] === 0) empty++; }
            if (vc < cols) { if (hEdges[vr][vc] === 1) lines++; else if (hEdges[vr][vc] === 0) empty++; }
            if (vr > 0) { if (vEdges[vr - 1][vc] === 1) lines++; else if (vEdges[vr - 1][vc] === 0) empty++; }
            if (vr < rows) { if (vEdges[vr][vc] === 1) lines++; else if (vEdges[vr][vc] === 0) empty++; }

            if (lines > 2) return false;
            if (lines === 1 && empty === 0) return false;
            return true;
        }

        function checkCell(r, c) {
            const clue = clues[r][c];
            if (clue === null || clue === undefined) return true;

            const edges = [hEdges[r][c], hEdges[r + 1][c], vEdges[r][c], vEdges[r][c + 1]];
            const lines = edges.filter(e => e === 1).length;
            const empty = edges.filter(e => e === 0).length;

            if (lines > clue) return false;
            if (lines + empty < clue) return false;
            return true;
        }

        function isValidFullLoop() {
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

            if (totalLines === 0 || activeVertices === 0) return false;
            if (totalLines !== activeVertices) return false;

            // DFS Schleifenzusammenhang
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

        function backtrack(idx) {
            if (solutions.length >= maxSolutions) return;

            if (idx === allEdges.length) {
                // Alle Kanten belegt -> prüfe Zahlen und Schleife
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const clue = clues[r][c];
                        if (clue !== null && clue !== undefined) {
                            const count = [hEdges[r][c], hEdges[r + 1][c], vEdges[r][c], vEdges[r][c + 1]].filter(e => e === 1).length;
                            if (count !== clue) return;
                        }
                    }
                }
                if (isValidFullLoop()) {
                    solutions.push({
                        hEdges: hEdges.map(row => [...row]),
                        vEdges: vEdges.map(row => [...row])
                    });
                }
                return;
            }

            const edge = allEdges[idx];
            const choices = [1, 2]; // Versuche erst Linie, dann Kreuz

            for (const val of choices) {
                if (edge.type === 'h') hEdges[edge.r][edge.c] = val;
                else vEdges[edge.r][edge.c] = val;

                // Schnelle Konsistenzprüfung betroffener Vertices und Zellen
                let ok = true;
                if (edge.type === 'h') {
                    if (!checkVertex(edge.r, edge.c) || !checkVertex(edge.r, edge.c + 1)) ok = false;
                    if (ok && edge.r > 0 && !checkCell(edge.r - 1, edge.c)) ok = false;
                    if (ok && edge.r < rows && !checkCell(edge.r, edge.c)) ok = false;
                } else {
                    if (!checkVertex(edge.r, edge.c) || !checkVertex(edge.r + 1, edge.c)) ok = false;
                    if (ok && edge.c > 0 && !checkCell(edge.r, edge.c - 1)) ok = false;
                    if (ok && edge.c < cols && !checkCell(edge.r, edge.c)) ok = false;
                }

                if (ok) {
                    backtrack(idx + 1);
                }

                if (edge.type === 'h') hEdges[edge.r][edge.c] = 0;
                else vEdges[edge.r][edge.c] = 0;

                if (solutions.length >= maxSolutions) return;
            }
        }

        backtrack(0);
        return solutions;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkSolver };
}
