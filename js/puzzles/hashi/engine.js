/**
 * Hashiwokakero (Bridges / Brücken) Puzzle Engine
 * Repräsentiert das Spielfeld mit Inseln, Brücken, Orthogonalitäts- und
 * Kreuzungsprüfungen, Konnektivitäts-Validierung (BFS) und Undo/Redo.
 */

export const HASHI_BRIDGE_NONE = 0;
export const HASHI_BRIDGE_SINGLE = 1;
export const HASHI_BRIDGE_DOUBLE = 2;
export const HASHI_MAX_BRIDGES = 2;

export class HashiEngine {
    constructor(rows = 7, cols = 7) {
        this.rows = rows;
        this.cols = cols;
        this.size = Math.min(rows, cols);
        // Map<"r,c", { r, c, value }>
        this.islands = new Map();
        // Map<"r1,c1-r2,c2", count: 0|1|2>
        this.bridges = new Map();
        // Set<"r1,c1-r2,c2">
        this.locked = new Set();
        // Map<"r1,c1-r2,c2", Set<any>>
        this.notes = new Map();
        // Map<"r1,c1-r2,c2", number>
        this.solution = null;
        // History
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Erzeugt einen kanonischen Kanten-Key für zwei Inselkoordinaten.
     * Stellt sicher, dass die Koordinaten sortiert sind.
     */
    static getEdgeKey(r1, c1, r2, c2) {
        if (r1 > r2 || (r1 === r2 && c1 > c2)) {
            return `${r2},${c2}-${r1},${c1}`;
        }
        return `${r1},${c1}-${r2},${c2}`;
    }

    /**
     * Parst einen Kanten-Key zurück in Koordinaten.
     */
    static parseEdgeKey(key) {
        const [p1, p2] = key.split('-');
        const [r1, c1] = p1.split(',').map(Number);
        const [r2, c2] = p2.split(',').map(Number);
        return { r1, c1, r2, c2 };
    }

    /**
     * Lädt ein Puzzle
     * @param {Object} config
     *   rows: number
     *   cols: number
     *   islands: Array<{r, c, value}> oder Map oder Object
     *   bridges: (optional) Startbelegung
     *   locked: (optional) Array oder Set von fixierten Kanten
     *   solution: (optional) Referenzlösung Map oder Object
     */
    loadPuzzle({ rows = 7, cols = 7, islands = [], bridges = null, locked = null, solution = null }) {
        this.rows = rows;
        this.cols = cols;
        this.size = Math.min(rows, cols);
        this.islands = new Map();
        this.bridges = new Map();
        this.locked = new Set();
        this.notes = new Map();
        this.undoStack = [];
        this.redoStack = [];

        // Inseln initialisieren
        if (Array.isArray(islands)) {
            for (const isl of islands) {
                if (isl && typeof isl.r === 'number' && typeof isl.c === 'number') {
                    this.islands.set(`${isl.r},${isl.c}`, { r: isl.r, c: isl.c, value: isl.value });
                }
            }
        } else if (islands instanceof Map) {
            for (const [k, v] of islands.entries()) {
                const [r, c] = k.split(',').map(Number);
                const val = typeof v === 'object' ? v.value : v;
                this.islands.set(`${r},${c}`, { r, c, value: val });
            }
        } else if (typeof islands === 'object' && islands !== null) {
            for (const [k, v] of Object.entries(islands)) {
                const [r, c] = k.split(',').map(Number);
                const val = typeof v === 'object' ? v.value : v;
                this.islands.set(`${r},${c}`, { r, c, value: val });
            }
        }

        // Alle möglichen gültigen Brückenpfade initialisieren
        const allPossible = this.getAllPossibleEdges();
        for (const edgeKey of allPossible) {
            this.bridges.set(edgeKey, HASHI_BRIDGE_NONE);
            this.notes.set(edgeKey, new Set());
        }

        // Locked-Kanten
        if (locked) {
            const lockedList = Array.isArray(locked) ? locked : Array.from(locked);
            for (const lk of lockedList) {
                this.locked.add(lk);
            }
        }

        // Startbrücken setzen
        if (bridges) {
            if (bridges instanceof Map) {
                for (const [k, v] of bridges.entries()) {
                    if (this.bridges.has(k)) this.bridges.set(k, v);
                }
            } else if (typeof bridges === 'object') {
                for (const [k, v] of Object.entries(bridges)) {
                    if (this.bridges.has(k)) this.bridges.set(k, v);
                }
            }
        }

        // Lösung speichern
        if (solution) {
            this.solution = new Map();
            if (solution instanceof Map) {
                for (const [k, v] of solution.entries()) {
                    if (v > 0) this.solution.set(k, v);
                }
            } else if (Array.isArray(solution)) {
                for (const item of solution) {
                    if (item && item.r1 !== undefined) {
                        const key = HashiEngine.getEdgeKey(item.r1, item.c1, item.r2, item.c2);
                        this.solution.set(key, item.count || 1);
                    }
                }
            } else if (typeof solution === 'object') {
                for (const [k, v] of Object.entries(solution)) {
                    if (v > 0) this.solution.set(k, v);
                }
            }
        } else {
            this.solution = null;
        }

        // Initialzustand für Restart merken
        this.initialBridges = new Map(this.bridges);
    }

    /**
     * Setzt das Spielfeld auf den Startzustand zurück
     */
    restart() {
        if (this.initialBridges) {
            this.bridges = new Map(this.initialBridges);
        } else {
            for (const k of this.bridges.keys()) {
                this.bridges.set(k, HASHI_BRIDGE_NONE);
            }
        }
        for (const k of this.notes.keys()) {
            this.notes.set(k, new Set());
        }
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Gibt die Referenzlösung zurück
     */
    getSolution() {
        return this.solution;
    }

    /**
     * Prüft, ob an der Position (r, c) eine Insel existiert
     */
    hasIsland(r, c) {
        return this.islands.has(`${r},${c}`);
    }

    /**
     * Gibt die Insel an (r, c) zurück oder null
     */
    getIsland(r, c) {
        return this.islands.get(`${r},${c}`) || null;
    }

    /**
     * Alias für getIsland
     */
    getCell(r, c) {
        const isl = this.getIsland(r, c);
        return isl ? isl.value : null;
    }

    /**
     * Gibt alle Inseln als Array zurück
     */
    getIslandsList() {
        return Array.from(this.islands.values());
    }

    /**
     * Ermittelt alle orthogonalen Nachbar-Inseln in 4 Richtungen,
     * zwischen denen keine andere Insel im Weg steht.
     */
    getOrthogonalNeighbors(r, c) {
        if (!this.hasIsland(r, c)) return [];
        const neighbors = [];

        // Oben (dr = -1)
        for (let row = r - 1; row >= 0; row--) {
            if (this.hasIsland(row, c)) {
                neighbors.push(this.getIsland(row, c));
                break;
            }
        }
        // Unten (dr = +1)
        for (let row = r + 1; row < this.rows; row++) {
            if (this.hasIsland(row, c)) {
                neighbors.push(this.getIsland(row, c));
                break;
            }
        }
        // Links (dc = -1)
        for (let col = c - 1; col >= 0; col--) {
            if (this.hasIsland(r, col)) {
                neighbors.push(this.getIsland(r, col));
                break;
            }
        }
        // Rechts (dc = +1)
        for (let col = c + 1; col < this.cols; col++) {
            if (this.hasIsland(r, col)) {
                neighbors.push(this.getIsland(r, col));
                break;
            }
        }

        return neighbors;
    }

    /**
     * Findet alle topologisch möglichen Kanten zwischen orthogonalen Inselpaaren
     */
    getAllPossibleEdges() {
        const edgeSet = new Set();
        const islands = this.getIslandsList();
        for (const isl of islands) {
            const neighbors = this.getOrthogonalNeighbors(isl.r, isl.c);
            for (const n of neighbors) {
                const key = HashiEngine.getEdgeKey(isl.r, isl.c, n.r, n.c);
                edgeSet.add(key);
            }
        }
        return Array.from(edgeSet);
    }

    /**
     * Prüft, ob zwei Kanten einander kreuzen
     */
    static edgesCross(r1A, c1A, r2A, c2A, r1B, c1B, r2B, c2B) {
        const isHorizA = r1A === r2A;
        const isHorizB = r1B === r2B;

        // Wenn beide horizontal oder beide vertikal sind, können sie sich nicht kreuzen (höchstens überlappen)
        if (isHorizA === isHorizB) return false;

        let hRow, hMinC, hMaxC, vCol, vMinR, vMaxR;
        if (isHorizA) {
            hRow = r1A;
            hMinC = Math.min(c1A, c2A);
            hMaxC = Math.max(c1A, c2A);
            vCol = c1B;
            vMinR = Math.min(r1B, r2B);
            vMaxR = Math.max(r1B, r2B);
        } else {
            hRow = r1B;
            hMinC = Math.min(c1B, c2B);
            hMaxC = Math.max(c1B, c2B);
            vCol = c1A;
            vMinR = Math.min(r1A, r2A);
            vMaxR = Math.max(r1A, r2A);
        }

        // Kreuzung liegt strictly im Inneren beider Segmente
        return (hMinC < vCol && vCol < hMaxC && vMinR < hRow && hRow < vMaxR);
    }

    /**
     * Prüft, ob eine Brücke zwischen (r1,c1) und (r2,c2) eine bereits existierende Brücke kreuzen würde
     */
    hasCrossing(r1, c1, r2, c2) {
        const key = HashiEngine.getEdgeKey(r1, c1, r2, c2);
        for (const [otherKey, count] of this.bridges.entries()) {
            if (count <= 0 || otherKey === key) continue;
            const other = HashiEngine.parseEdgeKey(otherKey);
            if (HashiEngine.edgesCross(r1, c1, r2, c2, other.r1, other.c1, other.r2, other.c2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gibt alle erreichbaren Nachbarn zurück, zu denen eine Brücke gebaut werden kann
     * (nicht durch bestehende Brücken kreuzend blockiert).
     */
    getReachableIslands(r, c) {
        const neighbors = this.getOrthogonalNeighbors(r, c);
        return neighbors.filter(n => {
            const key = HashiEngine.getEdgeKey(r, c, n.r, n.c);
            // Wenn schon eine Brücke existiert, ist sie erreichbar
            if ((this.bridges.get(key) || 0) > 0) return true;
            // Wenn keine existiert, darf sie keine andere kreuzen
            return !this.hasCrossing(r, c, n.r, n.c);
        });
    }

    /**
     * Liefert die aktuelle Brückenanzahl zwischen zwei Koordinaten
     */
    getBridgeCount(r1, c1, r2, c2) {
        const key = HashiEngine.getEdgeKey(r1, c1, r2, c2);
        return this.bridges.get(key) || 0;
    }

    /**
     * Setzt die Brückenanzahl gezielt (mit Undo/Redo)
     */
    setBridge(r1, c1, r2, c2, count) {
        const key = HashiEngine.getEdgeKey(r1, c1, r2, c2);
        if (this.locked.has(key)) return false;

        const newCount = Math.max(0, Math.min(HASHI_MAX_BRIDGES, count));
        const oldCount = this.bridges.get(key) || 0;
        if (newCount === oldCount) return true;

        // Wenn Brücken hinzugefügt werden, darf es keine Kreuzung geben
        if (newCount > 0 && this.hasCrossing(r1, c1, r2, c2)) {
            return false;
        }

        this.undoStack.push({
            type: 'bridge',
            key,
            oldCount,
            newCount
        });
        this.redoStack = [];

        this.bridges.set(key, newCount);
        return true;
    }

    /**
     * Zyklischer Klick / Wisch: 0 -> 1 -> 2 -> 0
     */
    cycleBridge(r1, c1, r2, c2) {
        const key = HashiEngine.getEdgeKey(r1, c1, r2, c2);
        if (this.locked.has(key)) return false;

        const current = this.bridges.get(key) || 0;
        let target = (current + 1) % (HASHI_MAX_BRIDGES + 1);

        // Falls target > 0 eine Kreuzung erzeugt, überspringen wir direkt auf 0
        if (target > 0 && this.hasCrossing(r1, c1, r2, c2)) {
            target = 0;
        }

        return this.setBridge(r1, c1, r2, c2, target);
    }

    /**
     * Alias für cycleBridge oder Erhöhung
     */
    addBridge(r1, c1, r2, c2) {
        return this.cycleBridge(r1, c1, r2, c2);
    }

    /**
     * Entfernt alle Brücken zwischen den beiden Inseln
     */
    removeBridge(r1, c1, r2, c2) {
        return this.setBridge(r1, c1, r2, c2, 0);
    }

    /**
     * Notiz (X-Markierung etc.) für eine Kante toggeln
     */
    toggleNote(r1, c1, r2, c2, noteVal = 'x') {
        const key = HashiEngine.getEdgeKey(r1, c1, r2, c2);
        if (!this.notes.has(key)) {
            this.notes.set(key, new Set());
        }
        const noteSet = this.notes.get(key);
        const oldSet = new Set(noteSet);

        if (noteSet.has(noteVal)) {
            noteSet.delete(noteVal);
        } else {
            noteSet.add(noteVal);
        }

        this.undoStack.push({
            type: 'note',
            key,
            oldSet,
            newSet: new Set(noteSet)
        });
        this.redoStack = [];
        return true;
    }

    getNotes(r1, c1, r2, c2) {
        const key = HashiEngine.getEdgeKey(r1, c1, r2, c2);
        return this.notes.get(key) || new Set();
    }

    /**
     * Berechnet den aktuellen Grad (Anzahl aller Brücken) einer Insel
     */
    getIslandDegree(r, c) {
        if (!this.hasIsland(r, c)) return 0;
        let degree = 0;
        const neighbors = this.getOrthogonalNeighbors(r, c);
        for (const n of neighbors) {
            const count = this.getBridgeCount(r, c, n.r, n.c);
            degree += count;
        }
        return degree;
    }

    /**
     * Prüft, ob eine Insel exakt ihre geforderte Anzahl an Brücken hat
     */
    isIslandSatisfied(r, c) {
        const isl = this.getIsland(r, c);
        if (!isl) return false;
        return this.getIslandDegree(r, c) === isl.value;
    }

    /**
     * Prüft, ob eine Insel überbelegt ist
     */
    isIslandOverfilled(r, c) {
        const isl = this.getIsland(r, c);
        if (!isl) return false;
        return this.getIslandDegree(r, c) > isl.value;
    }

    /**
     * Gibt die noch benötigten Brücken für eine Insel zurück
     */
    getIslandRemaining(r, c) {
        const isl = this.getIsland(r, c);
        if (!isl) return 0;
        return isl.value - this.getIslandDegree(r, c);
    }

    /**
     * BFS-Prüfung: Sind alle Inseln über aktive Brücken zu einem
     * einzigen zusammenhängenden Graphen verbunden?
     */
    isConnected() {
        const islands = this.getIslandsList();
        if (islands.length <= 1) return true;

        const visited = new Set();
        const start = islands[0];
        const queue = [`${start.r},${start.c}`];
        visited.add(`${start.r},${start.c}`);

        while (queue.length > 0) {
            const currKey = queue.shift();
            const [cr, cc] = currKey.split(',').map(Number);
            const neighbors = this.getOrthogonalNeighbors(cr, cc);

            for (const n of neighbors) {
                const count = this.getBridgeCount(cr, cc, n.r, n.c);
                if (count > 0) {
                    const nKey = `${n.r},${n.c}`;
                    if (!visited.has(nKey)) {
                        visited.add(nKey);
                        queue.push(nKey);
                    }
                }
            }
        }

        return visited.size === islands.length;
    }

    /**
     * Gibt alle Zusammenhangskomponenten zurück
     * Jede Komponente ist ein Array von Insel-Keys "r,c"
     */
    getConnectedComponents() {
        const islands = this.getIslandsList();
        const visited = new Set();
        const components = [];

        for (const isl of islands) {
            const key = `${isl.r},${isl.c}`;
            if (visited.has(key)) continue;

            const comp = [];
            const queue = [key];
            visited.add(key);

            while (queue.length > 0) {
                const currKey = queue.shift();
                comp.push(currKey);
                const [cr, cc] = currKey.split(',').map(Number);
                const neighbors = this.getOrthogonalNeighbors(cr, cc);

                for (const n of neighbors) {
                    const count = this.getBridgeCount(cr, cc, n.r, n.c);
                    if (count > 0) {
                        const nKey = `${n.r},${n.c}`;
                        if (!visited.has(nKey)) {
                            visited.add(nKey);
                            queue.push(nKey);
                        }
                    }
                }
            }
            components.push(comp);
        }

        return components;
    }

    /**
     * Umfassende Regelvalidierung
     */
    validateRules() {
        const errors = [];
        let allSatisfied = true;
        const islands = this.getIslandsList();

        // 1. Inselgrade prüfen
        for (const isl of islands) {
            const degree = this.getIslandDegree(isl.r, isl.c);
            if (degree > isl.value) {
                errors.push({
                    type: 'overfilled_island',
                    r: isl.r,
                    c: isl.c,
                    degree,
                    value: isl.value,
                    message: `Insel bei (${isl.r + 1},${isl.c + 1}) hat ${degree} von maximal ${isl.value} Brücken.`
                });
                allSatisfied = false;
            } else if (degree < isl.value) {
                allSatisfied = false;
            }
        }

        // 2. Kreuzungen prüfen
        const activeEdges = [];
        for (const [key, count] of this.bridges.entries()) {
            if (count > 0) {
                activeEdges.push({ key, ...HashiEngine.parseEdgeKey(key) });
            }
        }

        for (let i = 0; i < activeEdges.length; i++) {
            for (let j = i + 1; j < activeEdges.length; j++) {
                const e1 = activeEdges[i];
                const e2 = activeEdges[j];
                if (HashiEngine.edgesCross(e1.r1, e1.c1, e1.r2, e1.c2, e2.r1, e2.c1, e2.r2, e2.c2)) {
                    errors.push({
                        type: 'crossing_bridges',
                        edge1: e1.key,
                        edge2: e2.key,
                        message: `Brücken kreuzen sich zwischen (${e1.key}) und (${e2.key}).`
                    });
                }
            }
        }

        // 3. Konnektivität prüfen (nur wenn alle Inseln erfüllt sind)
        const connected = this.isConnected();
        if (allSatisfied && !connected) {
            errors.push({
                type: 'disconnected_network',
                message: 'Nicht alle Inseln sind in einem einzigen Netzwerk miteinander verbunden.'
            });
        }

        const isValid = errors.length === 0;
        const isComplete = isValid && allSatisfied && connected;

        return {
            isValid,
            isComplete,
            allSatisfied,
            connected,
            errors
        };
    }

    /**
     * Alias für validateRules
     */
    validate() {
        return this.validateRules();
    }

    /**
     * Prüft ob das Puzzle vollständig und korrekt gelöst ist
     */
    isCompleted() {
        return this.validateRules().isComplete;
    }

    isSolved() {
        return this.isCompleted();
    }

    /**
     * Findet Fehler für das Hinweis- und Feedback-System
     */
    findMistakes() {
        // 1. Überbelegte Insel
        for (const isl of this.getIslandsList()) {
            const deg = this.getIslandDegree(isl.r, isl.c);
            if (deg > isl.value) {
                return {
                    type: 'error',
                    isMistake: true,
                    errorType: 'overfilled_island',
                    strategy: 'Überbelegte Insel',
                    title: 'Zu viele Brücken',
                    r: isl.r,
                    c: isl.c,
                    highlightCells: [{ r: isl.r, c: isl.c }],
                    message: `Insel (${isl.r + 1},${isl.c + 1}) hat ${deg} Brücken, darf aber nur ${isl.value} haben.`
                };
            }
        }

        // 2. Isolierte geschlossene Teilkomponente
        // Wenn eine Komponente alle ihre Inseln vollständig erfüllt hat, aber nicht alle Inseln umfasst,
        // kann sie sich niemals mehr mit dem Rest verbinden!
        const totalIslands = this.islands.size;
        if (totalIslands > 2) {
            const comps = this.getConnectedComponents();
            for (const comp of comps) {
                if (comp.length > 1 && comp.length < totalIslands) {
                    let compAllSatisfied = true;
                    for (const key of comp) {
                        const [r, c] = key.split(',').map(Number);
                        if (!this.isIslandSatisfied(r, c)) {
                            compAllSatisfied = false;
                            break;
                        }
                    }
                    if (compAllSatisfied) {
                        const firstCell = comp[0].split(',').map(Number);
                        return {
                            type: 'error',
                            isMistake: true,
                            errorType: 'isolated_subgraph',
                            strategy: 'Isoliertes Teilnetzwerk',
                            title: 'Isoliertes Teilnetzwerk',
                            r: firstCell[0],
                            c: firstCell[1],
                            highlightCells: comp.map(k => {
                                const [r, c] = k.split(',').map(Number);
                                return { r, c };
                            }),
                            message: `Dieses Insel-Netzwerk ist in sich abgeschlossen, verbindet aber nicht alle ${totalIslands} Inseln.`
                        };
                    }
                }
            }
        }

        // 3. Mismatch mit Referenzlösung
        if (this.solution) {
            for (const [key, count] of this.bridges.entries()) {
                if (count > 0) {
                    const solCount = this.solution.get(key) || 0;
                    if (count > solCount) {
                        const { r1, c1, r2, c2 } = HashiEngine.parseEdgeKey(key);
                        return {
                            type: 'error',
                            isMistake: true,
                            errorType: 'solution_mismatch',
                            strategy: 'Falsche Brücke',
                            title: 'Falsche Brücke',
                            r: r1,
                            c: c1,
                            edgeKey: key,
                            highlightCells: [{ r: r1, c: c1 }, { r: r2, c: c2 }],
                            message: `Zwischen (${r1 + 1},${c1 + 1}) und (${r2 + 1},${c2 + 1}) sind zu viele Brücken gesetzt.`
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Undo-Schritt
     */
    undo() {
        if (this.undoStack.length === 0) return false;
        const action = this.undoStack.pop();

        if (action.type === 'bridge') {
            this.bridges.set(action.key, action.oldCount);
            this.redoStack.push(action);
            return true;
        } else if (action.type === 'note') {
            this.notes.set(action.key, action.oldSet);
            this.redoStack.push(action);
            return true;
        }
        return false;
    }

    /**
     * Redo-Schritt
     */
    redo() {
        if (this.redoStack.length === 0) return false;
        const action = this.redoStack.pop();

        if (action.type === 'bridge') {
            this.bridges.set(action.key, action.newCount);
            this.undoStack.push(action);
            return true;
        } else if (action.type === 'note') {
            this.notes.set(action.key, action.newSet);
            this.undoStack.push(action);
            return true;
        }
        return false;
    }

    getFilledCount() {
        let count = 0;
        for (const isl of this.getIslandsList()) {
            if (this.isIslandSatisfied(isl.r, isl.c)) count++;
        }
        return count;
    }

    getTotalCells() {
        return this.islands.size;
    }
}
