/**
 * Slitherlink Engine - Cortex Puzzle Platform
 * Verwaltet den Kanten-Zustand, Punktegrad, Schleifen-Topologie und Validierung.
 */

import { SlitherlinkSolver } from './solver.js';

export class SlitherlinkEngine {
    constructor(size = 5) {
        this.size = size;
        this.rows = size;
        this.cols = size;
        this.clues = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.initialClues = null;

        // Kanten-Zustände: 0 = Leer, 1 = Linie (Teil der Schleife), 2 = Kreuz (✕ / Kein Pfad)
        this.hEdges = Array(this.rows + 1).fill(0).map(() => Array(this.cols).fill(0));
        this.vEdges = Array(this.rows).fill(0).map(() => Array(this.cols + 1).fill(0));

        this.initialHEdges = null;
        this.initialVEdges = null;

        // Notizen (Kandidaten)
        this.hNotes = Array(this.rows + 1).fill(null).map(() => Array(this.cols).fill(null).map(() => new Set()));
        this.vNotes = Array(this.rows).fill(null).map(() => Array(this.cols + 1).fill(null).map(() => new Set()));

        this.undoStack = [];
        this.redoStack = [];
        this.solution = null;
    }

    loadPuzzle(puzzleData) {
        this.size = puzzleData.size || (puzzleData.clues ? puzzleData.clues.length : 5);
        this.rows = puzzleData.rows || this.size;
        this.cols = puzzleData.cols || this.size;

        this.clues = puzzleData.clues ? puzzleData.clues.map(row => [...row]) : Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.initialClues = this.clues.map(row => [...row]);

        this.hEdges = Array(this.rows + 1).fill(0).map(() => Array(this.cols).fill(0));
        this.vEdges = Array(this.rows).fill(0).map(() => Array(this.cols + 1).fill(0));

        if (puzzleData.initialHEdges) {
            this.hEdges = puzzleData.initialHEdges.map(row => [...row]);
        }
        if (puzzleData.initialVEdges) {
            this.vEdges = puzzleData.initialVEdges.map(row => [...row]);
        }

        this.initialHEdges = this.hEdges.map(row => [...row]);
        this.initialVEdges = this.vEdges.map(row => [...row]);

        this.hNotes = Array(this.rows + 1).fill(null).map(() => Array(this.cols).fill(null).map(() => new Set()));
        this.vNotes = Array(this.rows).fill(null).map(() => Array(this.cols + 1).fill(null).map(() => new Set()));

        this.undoStack = [];
        this.redoStack = [];
        this.solution = puzzleData.solution || null;
    }

    restart() {
        if (this.initialClues) {
            this.clues = this.initialClues.map(row => [...row]);
        }
        if (this.initialHEdges) {
            this.hEdges = this.initialHEdges.map(row => [...row]);
        } else {
            this.hEdges = Array(this.rows + 1).fill(0).map(() => Array(this.cols).fill(0));
        }
        if (this.initialVEdges) {
            this.vEdges = this.initialVEdges.map(row => [...row]);
        } else {
            this.vEdges = Array(this.rows).fill(0).map(() => Array(this.cols + 1).fill(0));
        }

        this.hNotes = Array(this.rows + 1).fill(null).map(() => Array(this.cols).fill(null).map(() => new Set()));
        this.vNotes = Array(this.rows).fill(null).map(() => Array(this.cols + 1).fill(null).map(() => new Set()));

        this.undoStack = [];
        this.redoStack = [];
    }

    getEdge(type, r, c) {
        if (type === 'h') {
            if (r >= 0 && r <= this.rows && c >= 0 && c < this.cols) return this.hEdges[r][c];
        } else if (type === 'v') {
            if (r >= 0 && r < this.rows && c >= 0 && c <= this.cols) return this.vEdges[r][c];
        }
        return 0;
    }

    setEdge(type, r, c, val, isNote = false) {
        if (type === 'h') {
            if (r < 0 || r > this.rows || c < 0 || c >= this.cols) return false;
            const oldVal = this.hEdges[r][c];
            const oldNotes = new Set(this.hNotes[r][c]);

            if (isNote) {
                if (this.hNotes[r][c].has(val)) this.hNotes[r][c].delete(val);
                else this.hNotes[r][c].add(val);
            } else {
                if (oldVal === val) return false;
                this.hEdges[r][c] = val;
                if (val !== 0) this.hNotes[r][c].clear();
            }

            this.undoStack.push({
                type, r, c, isNote,
                oldVal, newVal: this.hEdges[r][c],
                oldNotes, newNotes: new Set(this.hNotes[r][c])
            });
            this.redoStack = [];
            return true;
        } else if (type === 'v') {
            if (r < 0 || r >= this.rows || c < 0 || c > this.cols) return false;
            const oldVal = this.vEdges[r][c];
            const oldNotes = new Set(this.vNotes[r][c]);

            if (isNote) {
                if (this.vNotes[r][c].has(val)) this.vNotes[r][c].delete(val);
                else this.vNotes[r][c].add(val);
            } else {
                if (oldVal === val) return false;
                this.vEdges[r][c] = val;
                if (val !== 0) this.vNotes[r][c].clear();
            }

            this.undoStack.push({
                type, r, c, isNote,
                oldVal, newVal: this.vEdges[r][c],
                oldNotes, newNotes: new Set(this.vNotes[r][c])
            });
            this.redoStack = [];
            return true;
        }
        return false;
    }

    cycleEdge(type, r, c, isNote = false) {
        const cur = this.getEdge(type, r, c);
        if (isNote) {
            // Im Notizenmodus schalten wir zwischen Kreuz-Notiz hin und her
            return this.setEdge(type, r, c, 2, true);
        }
        // Zyklus: 0 (Leer) -> 1 (Linie) -> 2 (Kreuz) -> 0 (Leer)
        const next = (cur + 1) % 3;
        this.setEdge(type, r, c, next, false);
        return next;
    }

    undo() {
        if (this.undoStack.length === 0) return null;
        const action = this.undoStack.pop();

        if (action.type === 'h') {
            this.hEdges[action.r][action.c] = action.oldVal;
            this.hNotes[action.r][action.c] = new Set(action.oldNotes);
        } else if (action.type === 'v') {
            this.vEdges[action.r][action.c] = action.oldVal;
            this.vNotes[action.r][action.c] = new Set(action.oldNotes);
        }

        this.redoStack.push(action);
        return action;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();

        if (action.type === 'h') {
            this.hEdges[action.r][action.c] = action.newVal;
            this.hNotes[action.r][action.c] = new Set(action.newNotes);
        } else if (action.type === 'v') {
            this.vEdges[action.r][action.c] = action.newVal;
            this.vNotes[action.r][action.c] = new Set(action.newNotes);
        }

        this.undoStack.push(action);
        return action;
    }

    /**
     * Ermittelt alle anliegenden Kanten eines Punkts (Vertex vr, vc)
     * vr in [0, rows], vc in [0, cols]
     */
    getVertexEdges(vr, vc) {
        const edges = [];
        // Links (Horizontal)
        if (vc > 0) edges.push({ type: 'h', r: vr, c: vc - 1, val: this.hEdges[vr][vc - 1], otherVertex: { vr, vc: vc - 1 } });
        // Rechts (Horizontal)
        if (vc < this.cols) edges.push({ type: 'h', r: vr, c: vc, val: this.hEdges[vr][vc], otherVertex: { vr, vc: vc + 1 } });
        // Oben (Vertikal)
        if (vr > 0) edges.push({ type: 'v', r: vr - 1, c: vc, val: this.vEdges[vr - 1][vc], otherVertex: { vr: vr - 1, vc } });
        // Unten (Vertikal)
        if (vr < this.rows) edges.push({ type: 'v', r: vr, c: vc, val: this.vEdges[vr][vc], otherVertex: { vr: vr + 1, vc } });
        return edges;
    }

    /**
     * Gibt den Linien-Grad eines Punkts zurück (Anzahl der Kanten mit val === 1)
     */
    getVertexDegree(vr, vc) {
        const edges = this.getVertexEdges(vr, vc);
        return edges.filter(e => e.val === 1).length;
    }

    /**
     * Gibt die 4 Kanten einer Zelle (r, c) zurück
     */
    getCellEdges(r, c) {
        return [
            { type: 'h', r: r, c: c, val: this.hEdges[r][c] },         // Top
            { type: 'h', r: r + 1, c: c, val: this.hEdges[r + 1][c] }, // Bottom
            { type: 'v', r: r, c: c, val: this.vEdges[r][c] },         // Left
            { type: 'v', r: r, c: c + 1, val: this.vEdges[r][c + 1] }  // Right
        ];
    }

    getCellEdgeCount(r, c) {
        return this.getCellEdges(r, c).filter(e => e.val === 1).length;
    }

    getCellCrossCount(r, c) {
        return this.getCellEdges(r, c).filter(e => e.val === 2).length;
    }

    /**
     * Überprüft, ob das Rätsel vollständig und fehlerfrei gelöst ist.
     */
    isCompleted() {
        // 1. Alle Zahlenhinweise müssen exakt erfüllt sein
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const clue = this.clues[r][c];
                if (clue !== null && clue !== undefined) {
                    if (this.getCellEdgeCount(r, c) !== clue) {
                        return false;
                    }
                }
            }
        }

        // 2. Jeder Punkt muss Grad 0 oder Grad 2 haben (keine Sackgassen / keine Verzweigungen)
        let activeVertices = 0;
        let totalLineEdges = 0;

        for (let r = 0; r <= this.rows; r++) {
            for (let c = 0; c <= this.cols; c++) {
                const deg = this.getVertexDegree(r, c);
                if (deg !== 0 && deg !== 2) {
                    return false;
                }
                if (deg === 2) activeVertices++;
            }
        }

        // Zähle Linienkanten
        for (let r = 0; r <= this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.hEdges[r][c] === 1) totalLineEdges++;
            }
        }
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c <= this.cols; c++) {
                if (this.vEdges[r][c] === 1) totalLineEdges++;
            }
        }

        if (totalLineEdges === 0 || activeVertices === 0) return false;
        if (totalLineEdges !== activeVertices) return false;

        // 3. Zusammenhängende Einzelschleife prüfen (Single Connected Loop via DFS)
        let startVertex = null;
        for (let r = 0; r <= this.rows; r++) {
            for (let c = 0; c <= this.cols; c++) {
                if (this.getVertexDegree(r, c) === 2) {
                    startVertex = { r, c };
                    break;
                }
            }
            if (startVertex) break;
        }

        if (!startVertex) return false;

        const visitedVertices = new Set();
        let current = startVertex;
        let prev = null;
        let loopEdgeCount = 0;

        while (current) {
            const key = `${current.r},${current.c}`;
            visitedVertices.add(key);

            const connected = this.getVertexEdges(current.r, current.c).filter(e => e.val === 1);
            let next = null;

            for (const edge of connected) {
                const neighbor = { r: edge.otherVertex.vr, c: edge.otherVertex.vc };
                if (!prev || (neighbor.r !== prev.r || neighbor.c !== prev.c)) {
                    next = neighbor;
                    break;
                }
            }

            loopEdgeCount++;

            if (!next) return false;
            if (next.r === startVertex.r && next.c === startVertex.c) {
                // Schleife hat sich geschlossen!
                break;
            }

            if (visitedVertices.has(`${next.r},${next.c}`)) {
                // Unerwartete Kreuzung / Zweig
                return false;
            }

            prev = current;
            current = next;
        }

        // Es müssen alle Linienkanten in dieser einen Schleife enthalten sein
        return loopEdgeCount === totalLineEdges && visitedVertices.size === activeVertices;
    }

    /**
     * Gibt die Lösung des Rätsels zurück oder berechnet sie bei Bedarf dynamisch.
     */
    getSolution() {
        if (this.solution) return this.solution;
        if (typeof SlitherlinkSolver !== 'undefined' && typeof SlitherlinkSolver.solve === 'function') {
            const sols = SlitherlinkSolver.solve(this.clues, 1);
            if (sols && sols.length > 0) {
                this.solution = sols[0];
                return this.solution;
            }
        }
        return null;
    }

    /**
     * Prüft auf Fehler (abweichende Kanten gegenüber der Gesamtlösung oder Regelverletzungen).
     * Liefert ein direkt über den Hinweisbutton behebbares Fehler-Objekt zurück oder null, falls fehlerfrei.
     */
    findMistakes() {
        const sol = this.getSolution();

        // 1. Abweichungen gegenüber der Lösung priorisieren (präzise Kanten-Korrektur)
        if (sol) {
            if (sol.hEdges) {
                for (let r = 0; r <= this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        const curVal = this.hEdges[r][c];
                        const solVal = sol.hEdges[r][c];
                        if (curVal === 1 && solVal !== 1) {
                            return {
                                type: 'error',
                                isMistake: true,
                                errorSubtype: 'error_wrong_edge',
                                edgeType: 'h',
                                r, c,
                                value: 2, // Falsche Linie durch Kreuz ersetzen bzw. entfernen
                                expectedVal: 2,
                                title: 'Fehlerhafte Linie korrigieren',
                                strategy: 'Fehler korrigieren',
                                message: `Die horizontale Kante bei (${r + 1}, ${c + 1}) ist kein Teil der Lösungsschleife. Entferne sie oder setze ein Kreuz (✕).`
                            };
                        } else if (curVal === 2 && solVal === 1) {
                            return {
                                type: 'error',
                                isMistake: true,
                                errorSubtype: 'error_wrong_cross',
                                edgeType: 'h',
                                r, c,
                                value: 1, // Kante muss Teil der Schleife sein
                                expectedVal: 1,
                                title: 'Fehlerhaftes Kreuz korrigieren',
                                strategy: 'Fehler korrigieren',
                                message: `Die horizontale Kante bei (${r + 1}, ${c + 1}) wurde fälschlicherweise durchkreuzt, ist aber Teil der Lösungsschleife.`
                            };
                        }
                    }
                }
            }

            if (sol.vEdges) {
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c <= this.cols; c++) {
                        const curVal = this.vEdges[r][c];
                        const solVal = sol.vEdges[r][c];
                        if (curVal === 1 && solVal !== 1) {
                            return {
                                type: 'error',
                                isMistake: true,
                                errorSubtype: 'error_wrong_edge',
                                edgeType: 'v',
                                r, c,
                                value: 2,
                                expectedVal: 2,
                                title: 'Fehlerhafte Linie korrigieren',
                                strategy: 'Fehler korrigieren',
                                message: `Die vertikale Kante bei (${r + 1}, ${c + 1}) ist kein Teil der Lösungsschleife. Entferne sie oder setze ein Kreuz (✕).`
                            };
                        } else if (curVal === 2 && solVal === 1) {
                            return {
                                type: 'error',
                                isMistake: true,
                                errorSubtype: 'error_wrong_cross',
                                edgeType: 'v',
                                r, c,
                                value: 1,
                                expectedVal: 1,
                                title: 'Fehlerhaftes Kreuz korrigieren',
                                strategy: 'Fehler korrigieren',
                                message: `Die vertikale Kante bei (${r + 1}, ${c + 1}) wurde fälschlicherweise durchkreuzt, ist aber Teil der Lösungsschleife.`
                            };
                        }
                    }
                }
            }
        }

        // 2. Regelverletzungen prüfen, falls keine Lösung vorliegt oder keine Kanten abweichen
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const clue = this.clues[r][c];
                if (clue !== null && clue !== undefined) {
                    const lines = this.getCellEdgeCount(r, c);
                    if (lines > clue) {
                        const cellEdges = this.getCellEdges(r, c);
                        const firstLine = cellEdges.find(e => e.val === 1);
                        return {
                            type: 'error',
                            isMistake: true,
                            errorSubtype: 'error_too_many_lines',
                            edgeType: firstLine ? firstLine.type : undefined,
                            r: firstLine ? firstLine.r : r,
                            c: firstLine ? firstLine.c : c,
                            cell: { r, c },
                            value: 2,
                            expectedVal: 2,
                            title: 'Zu viele Linien',
                            strategy: 'Regelverletzung',
                            message: `Die Zelle (${r + 1}, ${c + 1}) hat bereits ${lines} Linien, darf aber nur ${clue} haben.`
                        };
                    }
                    const crosses = this.getCellCrossCount(r, c);
                    if (4 - crosses < clue) {
                        const cellEdges = this.getCellEdges(r, c);
                        const firstCross = cellEdges.find(e => e.val === 2);
                        return {
                            type: 'error',
                            isMistake: true,
                            errorSubtype: 'error_not_enough_edges',
                            edgeType: firstCross ? firstCross.type : undefined,
                            r: firstCross ? firstCross.r : r,
                            c: firstCross ? firstCross.c : c,
                            cell: { r, c },
                            value: 0,
                            expectedVal: 0,
                            title: 'Zahl unerreichbar',
                            strategy: 'Regelverletzung',
                            message: `Die Zelle (${r + 1}, ${c + 1}) kann die geforderte Zahl ${clue} durch zu viele Kreuze nicht mehr erreichen.`
                        };
                    }
                }
            }
        }

        for (let vr = 0; vr <= this.rows; vr++) {
            for (let vc = 0; vc <= this.cols; vc++) {
                const deg = this.getVertexDegree(vr, vc);
                if (deg > 2) {
                    const vEdges = this.getVertexEdges(vr, vc);
                    const firstLine = vEdges.find(e => e.val === 1);
                    return {
                        type: 'error',
                        isMistake: true,
                        errorSubtype: 'error_vertex_branch',
                        edgeType: firstLine ? firstLine.type : undefined,
                        r: firstLine ? firstLine.r : vr,
                        c: firstLine ? firstLine.c : vc,
                        vertex: { vr, vc },
                        value: 2,
                        expectedVal: 2,
                        title: 'Unerlaubte Verzweigung',
                        strategy: 'Regelverletzung',
                        message: `Am Punkt (${vr + 1}, ${vc + 1}) treffen ${deg} Linien zusammen. Es sind maximal genau 2 Linien erlaubt.`
                    };
                }
            }
        }

        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkEngine };
}
