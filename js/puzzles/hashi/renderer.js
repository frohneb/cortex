/**
 * Hashiwokakero (Bridges / Brücken) Visual Renderer
 * SVG-basierte Vektorgrafik mit Insel-Knoten, 1er/2er-Brückenlinien,
 * Wisch-/Tap-Interaktion, Status-Glow bei Erfüllung und Fehler-Pulsieren.
 */

import {
    HashiEngine,
    HASHI_BRIDGE_NONE,
    HASHI_BRIDGE_SINGLE,
    HASHI_BRIDGE_DOUBLE
} from './engine.js';

export function getHashiSymbolSvg(extraClass = '') {
    return `<svg class="hashi-symbol-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="18" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>
        <line x1="9.5" y1="10.5" x2="14.5" y2="10.5" stroke="currentColor" stroke-width="1.8"/>
        <line x1="9.5" y1="13.5" x2="14.5" y2="13.5" stroke="currentColor" stroke-width="1.8"/>
    </svg>`;
}

export class HashiRenderer {
    static getSymbolSvg(val, extraClass = '') {
        return getHashiSymbolSvg(extraClass);
    }

    /**
     * Rendert das vollständige SVG-Spielfeld
     */
    static renderBoard(container, engine, state, onCellInteraction) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const rows = engine.rows;
        const cols = engine.cols;

        const boardWrap = document.createElement('div');
        boardWrap.className = `hashi-board-wrapper hashi-grid-${cols}x${rows}`;
        boardWrap.id = 'hashiBoard';
        boardWrap.style.touchAction = 'none';

        const cellSize = 56;
        const pad = 36;
        const totalW = (cols - 1) * cellSize + pad * 2;
        const totalH = (rows - 1) * cellSize + pad * 2;
        const islandRadius = 18;

        const getX = (c) => pad + c * cellSize;
        const getY = (r) => pad + r * cellSize;

        let svgHtml = `<svg class="hashi-svg" viewBox="0 0 ${totalW} ${totalH}" preserveAspectRatio="xMidYMid meet">`;

        // 1. LAYER: HINTERGRUND-GITTERPUNKTE
        svgHtml += `<g class="hashi-bg-dots">`;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!engine.hasIsland(r, c)) {
                    svgHtml += `<circle cx="${getX(c)}" cy="${getY(r)}" r="1.5" class="hashi-grid-dot"/>`;
                }
            }
        }
        svgHtml += `</g>`;

        // 2. LAYER: BRÜCKEN
        svgHtml += `<g class="hashi-bridges-layer">`;
        const activeBridges = state.solutionRevealed && engine.getSolution() ?
            engine.getSolution() : engine.bridges;

        for (const [key, count] of activeBridges.entries()) {
            if (count <= 0) continue;
            const { r1, c1, r2, c2 } = HashiEngine.parseEdgeKey(key);
            const x1 = getX(c1);
            const y1 = getY(r1);
            const x2 = getX(c2);
            const y2 = getY(r2);
            const isHoriz = r1 === r2;

            const isHintEdge = !state.solutionRevealed && state.currentHint &&
                (state.currentHint.edgeKey === key);

            svgHtml += `<g class="hashi-bridge-group bridge-count-${count} ${isHintEdge ? 'hint-highlight-edge' : ''}" data-edge-key="${key}">`;

            if (count === HASHI_BRIDGE_SINGLE) {
                svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="hashi-bridge-line single"/>`;
            } else if (count === HASHI_BRIDGE_DOUBLE) {
                const offset = 4;
                if (isHoriz) {
                    svgHtml += `<line x1="${x1}" y1="${y1 - offset}" x2="${x2}" y2="${y2 - offset}" class="hashi-bridge-line double"/>`;
                    svgHtml += `<line x1="${x1}" y1="${y1 + offset}" x2="${x2}" y2="${y2 + offset}" class="hashi-bridge-line double"/>`;
                } else {
                    svgHtml += `<line x1="${x1 - offset}" y1="${y1}" x2="${x2 - offset}" y2="${y2}" class="hashi-bridge-line double"/>`;
                    svgHtml += `<line x1="${x1 + offset}" y1="${y1}" x2="${x2 + offset}" y2="${y2}" class="hashi-bridge-line double"/>`;
                }
            }
            svgHtml += `</g>`;
        }
        svgHtml += `</g>`;

        // 3. LAYER: INTERAKTIONS-HITBOXEN FÜR KANTEN
        svgHtml += `<g class="hashi-hitboxes-layer">`;
        const allPossibleEdges = engine.getAllPossibleEdges();
        for (const edgeKey of allPossibleEdges) {
            const { r1, c1, r2, c2 } = HashiEngine.parseEdgeKey(edgeKey);
            const x1 = getX(c1);
            const y1 = getY(r1);
            const x2 = getX(c2);
            const y2 = getY(r2);

            svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="hashi-edge-hitbox" stroke="transparent" stroke-width="24" cursor="pointer" data-edge-key="${edgeKey}"/>`;
        }
        svgHtml += `</g>`;

        // 4. LAYER: INSELN
        svgHtml += `<g class="hashi-islands-layer">`;
        const selectedIsland = state.selectedIsland || null;

        for (const isl of engine.getIslandsList()) {
            const cx = getX(isl.c);
            const cy = getY(isl.r);
            const degree = engine.getIslandDegree(isl.r, isl.c);
            const isSatisfied = degree === isl.value;
            const isOverfilled = degree > isl.value;
            const isSelected = selectedIsland && selectedIsland.r === isl.r && selectedIsland.c === isl.c;

            const isHintTarget = !state.solutionRevealed && state.currentHint &&
                state.currentHint.highlightCells &&
                state.currentHint.highlightCells.some(h => h.r === isl.r && h.c === isl.c);

            const groupClasses = `hashi-island-group ${isSatisfied ? 'satisfied' : ''} ${isOverfilled ? 'overfilled' : ''} ${isSelected ? 'selected' : ''} ${isHintTarget ? 'hint-target' : ''}`;

            svgHtml += `<g class="${groupClasses}" data-r="${isl.r}" data-c="${isl.c}" cursor="pointer">`;
            if (isSatisfied || isSelected || isHintTarget) {
                svgHtml += `<circle cx="${cx}" cy="${cy}" r="${islandRadius + 4}" class="hashi-island-glow-ring"/>`;
            }
            svgHtml += `<circle cx="${cx}" cy="${cy}" r="${islandRadius}" class="hashi-island-circle"/>`;
            svgHtml += `<text x="${cx}" y="${cy + 1}" text-anchor="middle" dominant-baseline="central" class="hashi-island-text">${isl.value}</text>`;
            svgHtml += `</g>`;
        }
        svgHtml += `</g>`;

        svgHtml += `</svg>`;
        boardWrap.innerHTML = svgHtml;

        // Event-Listener an die DOM-Elemente binden
        // 1. Kanten-Hitboxen
        const hitLines = boardWrap.querySelectorAll('.hashi-edge-hitbox');
        hitLines.forEach(hitLine => {
            const edgeKey = hitLine.dataset.edgeKey;
            const { r1, c1, r2, c2 } = HashiEngine.parseEdgeKey(edgeKey);
            hitLine.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state.solutionRevealed) return;
                engine.cycleBridge(r1, c1, r2, c2);
                if (typeof onCellInteraction === 'function') {
                    onCellInteraction({ type: 'bridge_cycle', r1, c1, r2, c2 });
                }
            });
        });

        // 2. Insel-Gruppen
        const islandGroups = boardWrap.querySelectorAll('.hashi-island-group');
        islandGroups.forEach(g => {
            const r = Number(g.dataset.r);
            const c = Number(g.dataset.c);
            g.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state.solutionRevealed) return;

                if (!state.selectedIsland) {
                    state.selectedIsland = { r, c };
                    HashiRenderer.renderBoard(container, engine, state, onCellInteraction);
                } else if (state.selectedIsland.r === r && state.selectedIsland.c === c) {
                    state.selectedIsland = null;
                    HashiRenderer.renderBoard(container, engine, state, onCellInteraction);
                } else {
                    const prev = state.selectedIsland;
                    const neighbors = engine.getOrthogonalNeighbors(prev.r, prev.c);
                    const isNeighbor = neighbors.some(n => n.r === r && n.c === c);

                    if (isNeighbor) {
                        engine.cycleBridge(prev.r, prev.c, r, c);
                        state.selectedIsland = null;
                        if (typeof onCellInteraction === 'function') {
                            onCellInteraction({ type: 'bridge_cycle', r1: prev.r, c1: prev.c, r2: r, c2: c });
                        }
                    } else {
                        state.selectedIsland = { r, c };
                        HashiRenderer.renderBoard(container, engine, state, onCellInteraction);
                    }
                }
            });
        });

        container.appendChild(boardWrap);
    }

    /**
     * Keypad-Rendering (für Hashi minimal / Status-Keypad)
     */
    static renderKeypad(container, engine, state, onKeyInput) {
        if (!container) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const bar = document.createElement('div');
        bar.className = 'hashi-action-bar';

        const infoSpan = document.createElement('span');
        infoSpan.className = 'hashi-action-info';
        infoSpan.textContent = state.selectedIsland ?
            `Insel (${state.selectedIsland.r + 1},${state.selectedIsland.c + 1}) gewählt — tippe Nachbar an` :
            'Tippe auf zwei Inseln oder eine Linie, um Brücken zu bauen';
        bar.appendChild(infoSpan);

        if (state.selectedIsland) {
            const deselectBtn = document.createElement('button');
            deselectBtn.className = 'hashi-deselect-btn';
            deselectBtn.textContent = '✕ Abwählen';
            deselectBtn.addEventListener('click', () => {
                state.selectedIsland = null;
                if (typeof onKeyInput === 'function') onKeyInput(null);
            });
            bar.appendChild(deselectBtn);
        }

        container.appendChild(bar);
    }

    /**
     * Spielregeln im Modal
     */
    static getRules(lang = 'de') {
        if (lang === 'en') {
            return `<div class="rules-content">
                <h3>Hashiwokakero (Bridges) Rules</h3>
                <ul>
                    <li><strong>Islands:</strong> The circles are islands. The number indicates how many bridges must connect to that island.</li>
                    <li><strong>Bridges:</strong> Bridges run only horizontally or vertically between islands. Between any two islands, there can be at most <strong>two bridges</strong>.</li>
                    <li><strong>No Crossings:</strong> Bridges may never cross each other or pass through another island.</li>
                    <li><strong>Single Connected Network:</strong> When finished, all islands must be connected into one single network.</li>
                </ul>
            </div>`;
        }
        return `<div class="rules-content">
            <h3>Hashiwokakero (Brücken) Regeln</h3>
            <ul>
                <li><strong>Inseln:</strong> Die Kreise stellen Inseln dar. Die Zahl zeigt, wie viele Brücken genau an dieser Insel anliegen müssen.</li>
                <li><strong>Brücken:</strong> Brücken verlaufen ausschließlich waagerecht oder senkrecht. Zwischen zwei Inseln sind maximal <strong>zwei parallele Brücken</strong> erlaubt.</li>
                <li><strong>Kreuzungsverbot:</strong> Brücken dürfen sich niemals kreuzen und dürfen nicht durch andere Inseln hindurchführen.</li>
                <li><strong>Zusammenhängendes Netz:</strong> Am Ende müssen alle Inseln über das Brückennetz miteinander verbunden sein (keine isolierten Inselgruppen).</li>
            </ul>
        </div>`;
    }
}
