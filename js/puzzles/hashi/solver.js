/**
 * Hashiwokakero (Bridges / Brücken) Solver & Logical Hint Engine
 * Löst Hashiwokakero-Puzzles via Constraint Propagation & Backtracking,
 * verifiziert Eindeutigkeit und liefert didaktische, logisch begründete Hinweise.
 */

import {
    HashiEngine,
    HASHI_BRIDGE_NONE,
    HASHI_BRIDGE_SINGLE,
    HASHI_BRIDGE_DOUBLE,
    HASHI_MAX_BRIDGES
} from './engine.js';

export class HashiSolver {
    /**
     * Löst ein Hashi-Puzzle (vollständig oder ab aktuellem Zustand).
     * @param {HashiEngine|Object} puzzleInput - Engine oder { rows, cols, islands }
     * @param {number} maxSolutions - Maximale Anzahl zu findender Lösungen (Standard: 2 für Eindeutigkeitsprüfung)
     * @returns {Array<Map<string, number>>} Gefundene Lösungen
     */
    static solve(puzzleInput, maxSolutions = 2) {
        let engine;
        if (puzzleInput instanceof HashiEngine) {
            engine = puzzleInput;
        } else {
            engine = new HashiEngine(puzzleInput.rows || 7, puzzleInput.cols || 7);
            engine.loadPuzzle(puzzleInput);
        }

        const islands = engine.getIslandsList();
        if (islands.length === 0) return [];

        // Alle möglichen Kanten zwischen orthogonalen Nachbarn ermitteln
        const edges = [];
        const edgeIndexMap = new Map();

        const allEdgeKeys = engine.getAllPossibleEdges();
        for (let i = 0; i < allEdgeKeys.length; i++) {
            const key = allEdgeKeys[i];
            const parsed = HashiEngine.parseEdgeKey(key);
            edges.push({
                index: i,
                key,
                ...parsed
            });
            edgeIndexMap.set(key, i);
        }

        const numEdges = edges.length;

        // Kreuzungs-Konflikt-Matrix (welche Kanten kreuzen sich gegenseitig?)
        const crossingMask = Array.from({ length: numEdges }, () => []);
        for (let i = 0; i < numEdges; i++) {
            for (let j = i + 1; j < numEdges; j++) {
                const e1 = edges[i];
                const e2 = edges[j];
                if (HashiEngine.edgesCross(e1.r1, e1.c1, e1.r2, e1.c2, e2.r1, e2.c1, e2.r2, e2.c2)) {
                    crossingMask[i].push(j);
                    crossingMask[j].push(i);
                }
            }
        }

        // Insel-Kanten-Zuordnung
        const islandEdges = new Map();
        for (const isl of islands) {
            islandEdges.set(`${isl.r},${isl.c}`, []);
        }
        for (let i = 0; i < numEdges; i++) {
            const e = edges[i];
            islandEdges.get(`${e.r1},${e.c1}`).push(i);
            islandEdges.get(`${e.r2},${e.c2}`).push(i);
        }

        // Aktuelle Zuweisung (-1 = unentschieden, 0, 1, 2 = Brücken)
        const assignment = new Int8Array(numEdges).fill(0);
        // Vorbelegung aus der Engine übernehmen (falls schon Brücken gesetzt sind)
        for (let i = 0; i < numEdges; i++) {
            const current = engine.bridges.get(edges[i].key) || 0;
            assignment[i] = current;
        }

        const solutions = [];

        // Prüffunktion für Zusammenhang (BFS)
        function checkFullConnectivity(currAssignment) {
            if (islands.length <= 1) return true;
            const visited = new Set();
            const start = `${islands[0].r},${islands[0].c}`;
            visited.add(start);
            const queue = [start];

            while (queue.length > 0) {
                const currKey = queue.shift();
                const edgeIndices = islandEdges.get(currKey) || [];
                for (const eIdx of edgeIndices) {
                    if (currAssignment[eIdx] > 0) {
                        const e = edges[eIdx];
                        const neighborKey = (`${e.r1},${e.c1}` === currKey) ? `${e.r2},${e.c2}` : `${e.r1},${e.c1}`;
                        if (!visited.has(neighborKey)) {
                            visited.add(neighborKey);
                            queue.push(neighborKey);
                        }
                    }
                }
            }
            return visited.size === islands.length;
        }

        // Backtracking
        function search(edgeIdx) {
            if (solutions.length >= maxSolutions) return;

            // Wenn alle Kanten belegt sind: finale Validierung
            if (edgeIdx === numEdges) {
                // Alle Inseln müssen exakt ihren Wert haben
                for (const isl of islands) {
                    const eIndices = islandEdges.get(`${isl.r},${isl.c}`);
                    let deg = 0;
                    for (const ei of eIndices) deg += assignment[ei];
                    if (deg !== isl.value) return;
                }

                // Gesamter Graph muss zusammenhängend sein
                if (checkFullConnectivity(assignment)) {
                    const solMap = new Map();
                    for (let i = 0; i < numEdges; i++) {
                        if (assignment[i] > 0) {
                            solMap.set(edges[i].key, assignment[i]);
                        }
                    }
                    solutions.push(solMap);
                }
                return;
            }

            const e = edges[edgeIdx];
            const i1Key = `${e.r1},${e.c1}`;
            const i2Key = `${e.r2},${e.c2}`;
            const isl1 = engine.getIsland(e.r1, e.c1);
            const isl2 = engine.getIsland(e.r2, e.c2);

            // Aktuelle Grade ohne diese Kante berechnen
            let deg1 = 0;
            for (const ei of islandEdges.get(i1Key)) {
                if (ei !== edgeIdx) deg1 += assignment[ei];
            }
            let deg2 = 0;
            for (const ei of islandEdges.get(i2Key)) {
                if (ei !== edgeIdx) deg2 += assignment[ei];
            }

            // Mögliche Optionen für diese Kante (0, 1, 2)
            // Prüfen, ob eine kreuzende Kante bereits > 0 gesetzt ist
            let crossingActive = false;
            for (const cIdx of crossingMask[edgeIdx]) {
                if (assignment[cIdx] > 0) {
                    crossingActive = true;
                    break;
                }
            }

            const allowedCounts = [];
            // 0 ist immer erlaubt
            allowedCounts.push(0);

            if (!crossingActive) {
                for (let count = 1; count <= HASHI_MAX_BRIDGES; count++) {
                    if (deg1 + count <= isl1.value && deg2 + count <= isl2.value) {
                        allowedCounts.push(count);
                    }
                }
            }

            // Bevorzugt höhere Werte testen für schnellere Konvergenz bei Heuristik
            for (let i = allowedCounts.length - 1; i >= 0; i--) {
                const count = allowedCounts[i];
                assignment[edgeIdx] = count;

                // Pruning: Kann eine der beiden Inseln ihren Zielwert überhaupt noch erreichen?
                let canReach1 = true;
                let maxPossible1 = deg1 + count;
                for (const ei of islandEdges.get(i1Key)) {
                    if (ei > edgeIdx) maxPossible1 += 2;
                }
                if (maxPossible1 < isl1.value) canReach1 = false;

                let canReach2 = true;
                let maxPossible2 = deg2 + count;
                for (const ei of islandEdges.get(i2Key)) {
                    if (ei > edgeIdx) maxPossible2 += 2;
                }
                if (maxPossible2 < isl2.value) canReach2 = false;

                if (canReach1 && canReach2) {
                    search(edgeIdx + 1);
                }
            }

            assignment[edgeIdx] = 0;
        }

        // Falls wir ein leeres Puzzle lösen wollen, setzen wir alle auf 0 zurück
        assignment.fill(0);
        search(0);
        return solutions;
    }

    /**
     * Findet den didaktisch und strategisch besten logischen Hinweis
     * Liefert standardisiertes Hint-Objekt:
     * {
     *   type: 'bridge_add'|'bridge_remove'|'mistake',
     *   strategy: string,
     *   title: string,
     *   r: number, c: number,
     *   edgeKey: string,
     *   count: number,
     *   highlightCells: [{r, c}],
     *   message: string,
     *   description: string
     * }
     */
    static findLogicalHint(engine, options = {}) {
        // 1. FEHLER ZUERST PRÜFEN
        const mistake = engine.findMistakes();
        if (mistake) return mistake;

        const islands = engine.getIslandsList();
        if (islands.length === 0) return null;

        // Hilfsdaten aufbauen
        const focusCell = options.focusCell || null;

        // Referenzlösung für Konsistenzsicherung abrufen
        let solution = engine.getSolution();
        if (!solution) {
            const found = HashiSolver.solve(engine, 1);
            if (found.length > 0) solution = found[0];
        }

        // Inseln nach focusCell priorisieren
        let sortedIslands = [...islands];
        if (focusCell && typeof focusCell.r === 'number' && typeof focusCell.c === 'number') {
            sortedIslands.sort((a, b) => {
                const aFocus = (a.r === focusCell.r && a.c === focusCell.c) ? 1 : 0;
                const bFocus = (b.r === focusCell.r && b.c === focusCell.c) ? 1 : 0;
                return bFocus - aFocus;
            });
        }

        // 2. STRATEGIE: MAXIMUM-FILL / TAUBENSCHLAG-PRINZIP (Pigeonhole)
        // Deckt automatisch 8er-Mitte, 7er-Mitte, 4er-Ecke, 3er-Ecke, 6er-Rand, 5er-Rand ab!
        for (const isl of sortedIslands) {
            const needed = engine.getIslandRemaining(isl.r, isl.c);
            if (needed <= 0) continue;

            const neighbors = engine.getReachableIslands(isl.r, isl.c);
            if (neighbors.length === 0) continue;

            // Berechne maximale Kapazität jedes Nachbarn
            const neighborCaps = neighbors.map(n => {
                const currentCount = engine.getBridgeCount(isl.r, isl.c, n.r, n.c);
                const neighborRemaining = engine.getIslandRemaining(n.r, n.c);
                // Kann höchstens bis 2 Brücken erweitert werden und nicht mehr als Nachbar noch braucht
                const addable = Math.max(0, Math.min(HASHI_MAX_BRIDGES - currentCount, neighborRemaining));
                return {
                    neighbor: n,
                    currentCount,
                    addable,
                    key: HashiEngine.getEdgeKey(isl.r, isl.c, n.r, n.c)
                };
            });

            // Wenn es nur 1 Nachbarn gibt: alle benötigten Brücken müssen dorthin
            if (neighborCaps.length === 1) {
                const nc = neighborCaps[0];
                if (nc.addable > 0) {
                    const toAdd = Math.min(needed, nc.addable);
                    let targetCount = nc.currentCount + toAdd;
                    if (solution && solution.has(nc.key)) {
                        const solCount = solution.get(nc.key);
                        if (targetCount > solCount) targetCount = solCount;
                    }
                    if (targetCount > nc.currentCount) {
                        return {
                            type: 'bridge_add',
                            strategy: 'Einziger verbleibender Nachbar',
                            title: 'Erzwungene Brücke',
                            r: isl.r,
                            c: isl.c,
                            edgeKey: nc.key,
                            count: targetCount,
                            highlightCells: [{ r: isl.r, c: isl.c }, { r: nc.neighbor.r, c: nc.neighbor.c }],
                            message: `Insel (${isl.r + 1},${isl.c + 1}) benötigt noch ${needed} Brücke(n) und hat nur einen einzigen erreichbaren Nachbarn.`,
                            description: `Insel (${isl.r + 1},${isl.c + 1}) hat keine andere Ausweichmöglichkeit. Setze eine Brücke zu Insel (${nc.neighbor.r + 1},${nc.neighbor.c + 1}).`
                        };
                    }
                }
            }

            // Für jeden Nachbarn prüfen, ob die anderen zusammen nicht ausreichen
            const totalAddableOthers = neighborCaps.reduce((sum, nc) => sum + nc.addable, 0);

            for (const nc of neighborCaps) {
                if (nc.addable <= 0) continue;
                const othersCap = totalAddableOthers - nc.addable;
                if (needed > othersCap) {
                    const forcedAdd = needed - othersCap;
                    let targetCount = nc.currentCount + forcedAdd;
                    if (solution && solution.has(nc.key)) {
                        const solCount = solution.get(nc.key);
                        if (targetCount > solCount) targetCount = solCount;
                    }
                    if (targetCount > nc.currentCount) {
                        let stratName = 'Taubenschlag-Prinzip (Kapazität)';
                        let detailText = `Selbst wenn alle anderen Nachbarn maximal belegt werden, fehlen noch ${forcedAdd} Brücke(n).`;
                        if (isl.value === 8) {
                            stratName = 'Die 8er-Insel';
                            detailText = 'Eine 8 benötigt zu allen 4 Nachbarn jeweils eine Doppelbrücke.';
                        } else if (isl.value === 7) {
                            stratName = 'Die 7er-Insel';
                            detailText = 'Eine 7 benötigt zu jedem ihrer 4 Nachbarn mindestens eine Brücke.';
                        } else if (isl.value === 4 && neighbors.length === 2) {
                            stratName = '4er-Eckinsel';
                            detailText = 'Eine 4 mit nur 2 Nachbarn benötigt zu beiden eine Doppelbrücke.';
                        } else if (isl.value === 3 && neighbors.length === 2) {
                            stratName = '3er-Eckinsel';
                            detailText = 'Eine 3 mit 2 Nachbarn benötigt zu beiden mindestens eine einfache Brücke.';
                        } else if (isl.value === 6 && neighbors.length === 3) {
                            stratName = '6er-Randinsel';
                            detailText = 'Eine 6 mit 3 Nachbarn benötigt zu allen 3 Nachbarn jeweils eine Doppelbrücke.';
                        } else if (isl.value === 5 && neighbors.length === 3) {
                            stratName = '5er-Randinsel';
                            detailText = 'Eine 5 mit 3 Nachbarn benötigt zu jedem Nachbarn mindestens eine einfache Brücke.';
                        }

                        return {
                            type: 'bridge_add',
                            strategy: stratName,
                            title: stratName,
                            r: isl.r,
                            c: isl.c,
                            edgeKey: nc.key,
                            count: targetCount,
                            highlightCells: [{ r: isl.r, c: isl.c }, { r: nc.neighbor.r, c: nc.neighbor.c }],
                            message: `Insel (${isl.r + 1},${isl.c + 1}) erfordert mindestens ${targetCount} Brücke(n) zu (${nc.neighbor.r + 1},${nc.neighbor.c + 1}).`,
                            description: detailText
                        };
                    }
                }
            }
        }

        // 3. STRATEGIE: ISOLATIONS-VERHINDERUNG (Zusammenhang sichern)
        // Wenn zwei Inseln mit Restwert 1 miteinander verbunden werden, obwohl es noch andere unverbundene Inseln gibt,
        // würde ein isoliertes 2er-Paar entstehen!
        const totalIslands = islands.length;
        if (totalIslands > 2) {
            for (const isl of sortedIslands) {
                const rem = engine.getIslandRemaining(isl.r, isl.c);
                if (rem !== 1) continue;

                const neighbors = engine.getReachableIslands(isl.r, isl.c);
                for (const n of neighbors) {
                    const nRem = engine.getIslandRemaining(n.r, n.c);
                    if (nRem === 1) {
                        // Prüfen ob die beiden bereits die einzigen noch unvollständigen Inseln sind
                        let otherIncomplete = 0;
                        for (const other of islands) {
                            if (`${other.r},${other.c}` !== `${isl.r},${isl.c}` &&
                                `${other.r},${other.c}` !== `${n.r},${n.c}`) {
                                if (engine.getIslandRemaining(other.r, other.c) > 0) {
                                    otherIncomplete++;
                                }
                            }
                        }

                        // Wenn es noch andere unvollständige Inseln gibt, dürfen isl und n
                        // sich NICHT gegenseitig abschließen, falls sie sonst keinen Anschluss haben!
                        if (otherIncomplete > 0 && engine.getIslandDegree(isl.r, isl.c) === 0 && engine.getIslandDegree(n.r, n.c) === 0) {
                            // Eine direkte Verbindung würde ein isoliertes Paar erzeugen
                            const otherNeighborsIsl = neighbors.filter(nb => `${nb.r},${nb.c}` !== `${n.r},${n.c}`);
                            if (otherNeighborsIsl.length === 1) {
                                const forcedNeighbor = otherNeighborsIsl[0];
                                const key = HashiEngine.getEdgeKey(isl.r, isl.c, forcedNeighbor.r, forcedNeighbor.c);
                                return {
                                    type: 'bridge_add',
                                    strategy: 'Isolations-Vermeidung',
                                    title: 'Netzwerk-Zusammenhang',
                                    r: isl.r,
                                    c: isl.c,
                                    edgeKey: key,
                                    count: 1,
                                    highlightCells: [{ r: isl.r, c: isl.c }, { r: forcedNeighbor.r, c: forcedNeighbor.c }],
                                    message: `Insel (${isl.r + 1},${isl.c + 1}) darf nicht mit (${n.r + 1},${n.c + 1}) verbunden werden, da sie sich sonst isolieren würden.`,
                                    description: `Verbinde Insel (${isl.r + 1},${isl.c + 1}) stattdessen mit Insel (${forcedNeighbor.r + 1},${forcedNeighbor.c + 1}).`
                                };
                            }
                        }
                    }
                }
            }
        }

        // 4. FALLBACK: NÄCHSTER SCHRITT AUS DER REFERENZLÖSUNG
        if (solution) {
            // Falls focusCell gewählt: fehlende Brücke zu focusCell bevorzugen
            if (focusCell && typeof focusCell.r === 'number' && typeof focusCell.c === 'number') {
                for (const [key, solCount] of solution.entries()) {
                    const currentCount = engine.bridges.get(key) || 0;
                    if (solCount > currentCount) {
                        const { r1, c1, r2, c2 } = HashiEngine.parseEdgeKey(key);
                        if ((r1 === focusCell.r && c1 === focusCell.c) || (r2 === focusCell.r && c2 === focusCell.c)) {
                            return {
                                type: 'bridge_add',
                                strategy: 'Nächster logischer Schritt',
                                title: 'Brücke setzen',
                                r: r1,
                                c: c1,
                                edgeKey: key,
                                count: currentCount + 1,
                                highlightCells: [{ r: r1, c: c1 }, { r: r2, c: c2 }],
                                message: `Hier kann eine Brücke zwischen (${r1 + 1},${c1 + 1}) und (${r2 + 1},${c2 + 1}) platziert werden.`,
                                description: `Setze eine Brücke zwischen den Inseln (${r1 + 1},${c1 + 1}) und (${r2 + 1},${c2 + 1}).`
                            };
                        }
                    }
                }
            }

            for (const [key, solCount] of solution.entries()) {
                const currentCount = engine.bridges.get(key) || 0;
                if (solCount > currentCount) {
                    const { r1, c1, r2, c2 } = HashiEngine.parseEdgeKey(key);
                    return {
                        type: 'bridge_add',
                        strategy: 'Nächster logischer Schritt',
                        title: 'Brücke setzen',
                        r: r1,
                        c: c1,
                        edgeKey: key,
                        count: currentCount + 1,
                        highlightCells: [{ r: r1, c: c1 }, { r: r2, c: c2 }],
                        message: `Hier kann eine Brücke zwischen (${r1 + 1},${c1 + 1}) und (${r2 + 1},${c2 + 1}) platziert werden.`,
                        description: `Setze eine Brücke zwischen den Inseln (${r1 + 1},${c1 + 1}) und (${r2 + 1},${c2 + 1}).`
                    };
                }
            }
        }

        return null;
    }
}
