/**
 * Slitherlink Renderer - Cortex Puzzle Platform
 * Responsive SVG-Visualisierung mit Wischsteuerung (Drag-to-Draw / Swipe),
 * Ecken- & Kanten-Hitboxen und Theme-Glow-Effekten.
 */

export class SlitherlinkRenderer {
    /**
     * Rendert das vollständige Slitherlink-Board in den Zielcontainer
     */
    static renderBoard(container, engine, state, onCellInteraction) {
        container.innerHTML = '';
        const rows = engine.rows;
        const cols = engine.cols;

        const boardWrap = document.createElement('div');
        boardWrap.className = `slitherlink-board-wrapper slitherlink-grid-${cols}x${rows}`;
        boardWrap.id = 'slitherlinkBoard';
        boardWrap.style.touchAction = 'none';

        const solution = state.solutionRevealed ? (engine.getSolution ? engine.getSolution() : engine.solution) : null;

        const currentHint = state.currentHint;
        const hintPlacedEdge = state.hintPlacedEdge;

        const pad = 24;
        const totalW = cols * 100 + pad * 2;
        const totalH = rows * 100 + pad * 2;
        let svgHtml = `<svg class="slitherlink-svg" viewBox="${-pad} ${-pad} ${totalW} ${totalH}" preserveAspectRatio="xMidYMid meet">`;

        // 1. ZELLEN-LAYER (Zahlenhinweise)
        svgHtml += `<g class="slitherlink-cells-layer">`;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.clues[r][c];
                const count = engine.getCellEdgeCount(r, c);
                const isSatisfied = clue !== null && count === clue;
                const isViolated = clue !== null && count > clue;
                const isHintCell = !state.solutionRevealed && currentHint && (
                    (currentHint.cell && currentHint.cell.r === r && currentHint.cell.c === c) ||
                    (!currentHint.edgeType && currentHint.r === r && currentHint.c === c)
                );

                svgHtml += `<g class="slitherlink-cell-group ${isSatisfied ? 'satisfied' : ''} ${isViolated ? 'violated' : ''} ${isHintCell ? 'hint-target-cell' : ''}" data-r="${r}" data-c="${c}">`;
                svgHtml += `<rect x="${c * 100 + 12}" y="${r * 100 + 12}" width="76" height="76" class="slitherlink-cell-bg" rx="12"></rect>`;
                if (clue !== null && clue !== undefined) {
                    svgHtml += `<text x="${c * 100 + 50}" y="${r * 100 + 52}" class="slitherlink-clue-text clue-${clue}" text-anchor="middle" dominant-baseline="central">${clue}</text>`;
                }
                svgHtml += `</g>`;
            }
        }
        svgHtml += `</g>`;

        // 2. KANTEN-LAYER (Horizontal & Vertikal)
        svgHtml += `<g class="slitherlink-edges-layer">`;

        // Horizontale Kanten
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                let val = engine.hEdges[r][c];
                if (solution && solution.hEdges) {
                    val = solution.hEdges[r][c];
                }
                const hasNote = engine.hNotes[r][c] && engine.hNotes[r][c].has(2);
                const isHintEdge = !state.solutionRevealed && currentHint && currentHint.edgeType === 'h' && currentHint.r === r && currentHint.c === c;
                const isHintMistake = isHintEdge && (currentHint.isMistake || currentHint.type === 'error');
                const isHintPlaced = !state.solutionRevealed && hintPlacedEdge && hintPlacedEdge.type === 'h' && hintPlacedEdge.r === r && hintPlacedEdge.c === c;

                const x1 = c * 100;
                const y1 = r * 100;
                const x2 = (c + 1) * 100;
                const y2 = r * 100;

                let edgeClasses = `slitherlink-edge-group slitherlink-edge-h val-${val} ${hasNote ? 'has-note' : ''}`;
                if (isHintEdge) {
                    edgeClasses += ' hint-highlight' + (isHintMistake ? ' error-highlight' : '');
                }
                if (isHintPlaced) {
                    edgeClasses += ' hint-shimmer';
                }

                svgHtml += `<g class="${edgeClasses}" data-edge-type="h" data-r="${r}" data-c="${c}">`;
                svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-hitzone" stroke-width="42" stroke="transparent" stroke-linecap="round"></line>`;

                if (val === 1) {
                    svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-line" stroke-width="8" stroke-linecap="round"></line>`;
                } else if (val === 2 || hasNote) {
                    const midX = (x1 + x2) / 2;
                    const midY = y1;
                    svgHtml += `<g class="slitherlink-edge-cross ${hasNote ? 'is-note' : ''}">`;
                    svgHtml += `<line x1="${midX - 8}" y1="${midY - 8}" x2="${midX + 8}" y2="${midY + 8}"></line>`;
                    svgHtml += `<line x1="${midX - 8}" y1="${midY + 8}" x2="${midX + 8}" y2="${midY - 8}"></line>`;
                    svgHtml += `</g>`;
                } else {
                    if (isHintEdge && !isHintMistake) {
                        const expVal = currentHint.expectedVal !== undefined ? currentHint.expectedVal : currentHint.value;
                        if (expVal === 1) {
                            svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-line slitherlink-edge-ghost-line" stroke-width="7" stroke-linecap="round"></line>`;
                        } else if (expVal === 2) {
                            const midX = (x1 + x2) / 2;
                            const midY = y1;
                            svgHtml += `<g class="slitherlink-edge-cross ghost-cross">`;
                            svgHtml += `<line x1="${midX - 8}" y1="${midY - 8}" x2="${midX + 8}" y2="${midY + 8}"></line>`;
                            svgHtml += `<line x1="${midX - 8}" y1="${midY + 8}" x2="${midX + 8}" y2="${midY - 8}"></line>`;
                            svgHtml += `</g>`;
                        } else {
                            svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-guide" stroke-width="2"></line>`;
                        }
                    } else {
                        svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-guide" stroke-width="2"></line>`;
                    }
                }
                svgHtml += `</g>`;
            }
        }

        // Vertikale Kanten
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                let val = engine.vEdges[r][c];
                if (solution && solution.vEdges) {
                    val = solution.vEdges[r][c];
                }
                const hasNote = engine.vNotes[r][c] && engine.vNotes[r][c].has(2);
                const isHintEdge = !state.solutionRevealed && currentHint && currentHint.edgeType === 'v' && currentHint.r === r && currentHint.c === c;
                const isHintMistake = isHintEdge && (currentHint.isMistake || currentHint.type === 'error');
                const isHintPlaced = !state.solutionRevealed && hintPlacedEdge && hintPlacedEdge.type === 'v' && hintPlacedEdge.r === r && hintPlacedEdge.c === c;

                const x1 = c * 100;
                const y1 = r * 100;
                const x2 = c * 100;
                const y2 = (r + 1) * 100;

                let edgeClasses = `slitherlink-edge-group slitherlink-edge-v val-${val} ${hasNote ? 'has-note' : ''}`;
                if (isHintEdge) {
                    edgeClasses += ' hint-highlight' + (isHintMistake ? ' error-highlight' : '');
                }
                if (isHintPlaced) {
                    edgeClasses += ' hint-shimmer';
                }

                svgHtml += `<g class="${edgeClasses}" data-edge-type="v" data-r="${r}" data-c="${c}">`;
                svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-hitzone" stroke-width="42" stroke="transparent" stroke-linecap="round"></line>`;

                if (val === 1) {
                    svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-line" stroke-width="8" stroke-linecap="round"></line>`;
                } else if (val === 2 || hasNote) {
                    const midX = x1;
                    const midY = (y1 + y2) / 2;
                    svgHtml += `<g class="slitherlink-edge-cross ${hasNote ? 'is-note' : ''}">`;
                    svgHtml += `<line x1="${midX - 8}" y1="${midY - 8}" x2="${midX + 8}" y2="${midY + 8}"></line>`;
                    svgHtml += `<line x1="${midX - 8}" y1="${midY + 8}" x2="${midX + 8}" y2="${midY - 8}"></line>`;
                    svgHtml += `</g>`;
                } else {
                    if (isHintEdge && !isHintMistake) {
                        const expVal = currentHint.expectedVal !== undefined ? currentHint.expectedVal : currentHint.value;
                        if (expVal === 1) {
                            svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-line slitherlink-edge-ghost-line" stroke-width="7" stroke-linecap="round"></line>`;
                        } else if (expVal === 2) {
                            const midX = x1;
                            const midY = (y1 + y2) / 2;
                            svgHtml += `<g class="slitherlink-edge-cross ghost-cross">`;
                            svgHtml += `<line x1="${midX - 8}" y1="${midY - 8}" x2="${midX + 8}" y2="${midY + 8}"></line>`;
                            svgHtml += `<line x1="${midX - 8}" y1="${midY + 8}" x2="${midX + 8}" y2="${midY - 8}"></line>`;
                            svgHtml += `</g>`;
                        } else {
                            svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-guide" stroke-width="2"></line>`;
                        }
                    } else {
                        svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-guide" stroke-width="2"></line>`;
                    }
                }
                svgHtml += `</g>`;
            }
        }
        svgHtml += `</g>`;

        // 3. GITTERPUNKTE (Vertices)
        svgHtml += `<g class="slitherlink-dots-layer">`;
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const deg = engine.getVertexDegree(vr, vc);
                const isError = deg > 2;
                const rRadius = isError ? 7 : (deg === 2 ? 6 : 5);
                const isHintDot = !state.solutionRevealed && currentHint && (
                    (currentHint.vertex && currentHint.vertex.vr === vr && currentHint.vertex.vc === vc) ||
                    (!currentHint.edgeType && !currentHint.cell && currentHint.vr === vr && currentHint.vc === vc)
                );
                svgHtml += `<circle cx="${vc * 100}" cy="${vr * 100}" r="${rRadius}" class="slitherlink-dot deg-${deg} ${isError ? 'dot-error' : ''} ${isHintDot ? 'hint-target-dot' : ''}"></circle>`;
            }
        }
        svgHtml += `</g>`;

        svgHtml += `</svg>`;
        boardWrap.innerHTML = svgHtml;
        container.appendChild(boardWrap);

        // Wisch- und Klick-Gestensteuerung
        this.setupDragToDraw(boardWrap, engine, state);
    }

    /**
     * Wischsteuerung: Kontinuierliches Zeichnen beim Ziehen über Kanten (Drag-to-Draw)
     */
    static setupDragToDraw(wrapper, engine, state) {
        let isDragging = false;
        let isDragActive = false;
        let didLongPress = false;
        let dragMode = null; // 1 = Linie, 2 = Kreuz, 0 = Leer
        let startEdge = null;
        let lastEdgeKey = null;
        let activePointerId = null;
        let startX = 0;
        let startY = 0;
        let longPressTimer = null;

        const getApp = () => window.cortexApp || window.tangoApp || window.app;

        const updateEdgeElement = (type, r, c) => {
            const group = wrapper.querySelector(`.slitherlink-edge-group[data-edge-type="${type}"][data-r="${r}"][data-c="${c}"]`);
            if (!group) return;
            const val = engine.getEdge(type, r, c);
            const hasNote = (type === 'h' ? engine.hNotes[r][c] : engine.vNotes[r][c])?.has(2);
            const x1 = type === 'h' ? c * 100 : c * 100;
            const y1 = type === 'h' ? r * 100 : r * 100;
            const x2 = type === 'h' ? (c + 1) * 100 : c * 100;
            const y2 = type === 'h' ? r * 100 : (r + 1) * 100;

            group.setAttribute('class', `slitherlink-edge-group slitherlink-edge-${type} val-${val} ${hasNote ? 'has-note' : ''}`);

            let innerHtml = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-hitzone" stroke-width="42" stroke="transparent" stroke-linecap="round"></line>`;
            if (val === 1) {
                innerHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-line" stroke-width="8" stroke-linecap="round"></line>`;
            } else if (val === 2 || hasNote) {
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                innerHtml += `<g class="slitherlink-edge-cross ${hasNote ? 'is-note' : ''}">`;
                innerHtml += `<line x1="${midX - 8}" y1="${midY - 8}" x2="${midX + 8}" y2="${midY + 8}"></line>`;
                innerHtml += `<line x1="${midX - 8}" y1="${midY + 8}" x2="${midX + 8}" y2="${midY - 8}"></line>`;
                innerHtml += `</g>`;
            } else {
                innerHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-guide" stroke-width="2"></line>`;
            }
            group.innerHTML = innerHtml;
        };

        const getEdgeFromPoint = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                const group = el.closest('.slitherlink-edge-group');
                if (group) {
                    return {
                        type: group.dataset.edgeType,
                        r: parseInt(group.dataset.r, 10),
                        c: parseInt(group.dataset.c, 10)
                    };
                }
            }
            return null;
        };

        const onPointerDown = (e) => {
            if (state.solutionRevealed) return;
            if (activePointerId !== null && activePointerId !== e.pointerId) return;

            const edge = getEdgeFromPoint(e.clientX, e.clientY);
            if (!edge) return;

            // Aktive Hinweis-Markierungen aufheben, sobald der Spieler interagiert
            const app = getApp();
            if (app) {
                if (app.hintPlacedEdge || app.currentHint) {
                    app.hintPlacedEdge = null;
                    app.currentHint = null;
                    wrapper.querySelectorAll('.hint-shimmer, .hint-highlight, .error-highlight, .hint-target-cell, .hint-target-dot').forEach(el => {
                        el.classList.remove('hint-shimmer', 'hint-highlight', 'error-highlight', 'hint-target-cell', 'hint-target-dot');
                    });
                    wrapper.querySelectorAll('.slitherlink-edge-ghost-line, .ghost-cross').forEach(el => el.remove());
                }
            }

            isDragging = true;
            isDragActive = false;
            didLongPress = false;
            activePointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            startEdge = edge;
            lastEdgeKey = `${edge.type}_${edge.r}_${edge.c}`;

            // Rechtsklick: Direkt Kreuz (✕) setzen / entfernen
            if (e.button === 2) {
                const curVal = engine.getEdge(edge.type, edge.r, edge.c);
                const newVal = (curVal === 2 ? 0 : 2);
                engine.setEdge(edge.type, edge.r, edge.c, newVal, false);
                updateEdgeElement(edge.type, edge.r, edge.c);
                didLongPress = true;
                if (newVal === 2 && typeof audio !== 'undefined' && audio.vibrate) audio.vibrate(25);
                else if (typeof audio !== 'undefined' && audio.playClear) audio.playClear();
                const app = getApp();
                if (app) {
                    app.movesCount++;
                    app.checkCompletion();
                    app.saveActiveGameState();
                }
                return;
            }

            // Notiz-Modus
            if (state.isNoteMode) {
                dragMode = 2;
                engine.setEdge(edge.type, edge.r, edge.c, 2, true);
                updateEdgeElement(edge.type, edge.r, edge.c);
                didLongPress = true;
                if (typeof audio !== 'undefined' && audio.vibrate) audio.vibrate(25);
                const app = getApp();
                if (app) {
                    app.movesCount++;
                    app.checkCompletion();
                    app.saveActiveGameState();
                }
                return;
            }

            // Long Press (300ms) für schnelles und zuverlässiges Setzen von Kreuzen (✕)
            longPressTimer = setTimeout(() => {
                didLongPress = true;
                const curVal = engine.getEdge(edge.type, edge.r, edge.c);
                const newVal = (curVal === 2 ? 0 : 2);
                engine.setEdge(edge.type, edge.r, edge.c, newVal, false);
                dragMode = newVal;
                updateEdgeElement(edge.type, edge.r, edge.c);
                if (newVal === 2 && typeof audio !== 'undefined' && audio.vibrate) audio.vibrate(35);
                else if (typeof audio !== 'undefined' && audio.playClear) audio.playClear();
                const app = getApp();
                if (app) {
                    app.movesCount++;
                    app.checkCompletion();
                    app.saveActiveGameState();
                }
            }, 300);
        };

        const onPointerMove = (e) => {
            if (!isDragging || activePointerId !== e.pointerId || state.solutionRevealed) return;

            const dist = Math.hypot(e.clientX - startX, e.clientY - startY);

            // Wenn Bewegung größer als Jitter-Toleranz (12px): Long-Press abbrechen und Wischmodus starten
            if (dist > 12) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }

                if (!isDragActive && !didLongPress && startEdge) {
                    isDragActive = true;
                    const curVal = engine.getEdge(startEdge.type, startEdge.r, startEdge.c);
                    dragMode = (curVal === 1 ? 0 : 1);
                    engine.setEdge(startEdge.type, startEdge.r, startEdge.c, dragMode, false);
                    updateEdgeElement(startEdge.type, startEdge.r, startEdge.c);
                    if (dragMode === 1 && typeof audio !== 'undefined' && audio.playSun) audio.playSun();
                    else if (typeof audio !== 'undefined' && audio.playClear) audio.playClear();
                    const app = getApp();
                    if (app) {
                        app.movesCount++;
                        app.checkCompletion();
                        app.saveActiveGameState();
                    }
                }

                const edge = getEdgeFromPoint(e.clientX, e.clientY);
                if (!edge) return;

                const key = `${edge.type}_${edge.r}_${edge.c}`;
                if (key !== lastEdgeKey) {
                    lastEdgeKey = key;
                    const mode = (dragMode !== null ? dragMode : 1);

                    if (state.isNoteMode) {
                        engine.setEdge(edge.type, edge.r, edge.c, 2, true);
                    } else {
                        engine.setEdge(edge.type, edge.r, edge.c, mode, false);
                    }

                    updateEdgeElement(edge.type, edge.r, edge.c);

                    if (typeof audio !== 'undefined') {
                        if (mode === 1 && audio.playSun) audio.playSun();
                        else if (mode === 2 && audio.vibrate) audio.vibrate(20);
                        else if (audio.playClear) audio.playClear();
                    }

                    const app = getApp();
                    if (app) {
                        app.movesCount++;
                        app.checkCompletion();
                        app.saveActiveGameState();
                    }
                }
            }
        };

        const onPointerEnd = (e) => {
            if (activePointerId === e.pointerId) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }

                // Kurzes Antippen (Tap): 0 -> 1 -> 2 -> 0 durchschalten
                if (!didLongPress && !isDragActive && startEdge) {
                    const curVal = engine.getEdge(startEdge.type, startEdge.r, startEdge.c);
                    const newVal = (curVal === 0 ? 1 : (curVal === 1 ? 2 : 0));
                    engine.setEdge(startEdge.type, startEdge.r, startEdge.c, newVal, false);
                    updateEdgeElement(startEdge.type, startEdge.r, startEdge.c);

                    if (typeof audio !== 'undefined') {
                        if (newVal === 1 && audio.playSun) audio.playSun();
                        else if (newVal === 2 && audio.vibrate) audio.vibrate(25);
                        else if (audio.playClear) audio.playClear();
                    }

                    const app = getApp();
                    if (app) {
                        app.movesCount++;
                        app.checkCompletion();
                        app.saveActiveGameState();
                    }
                }

                isDragging = false;
                isDragActive = false;
                didLongPress = false;
                startEdge = null;
                activePointerId = null;
                lastEdgeKey = null;
                dragMode = null;

                const app = getApp();
                if (app) {
                    app.renderGrid();
                    app.checkCompletion();
                    app.saveActiveGameState();
                }
            }
        };

        wrapper.addEventListener('pointerdown', onPointerDown);
        wrapper.addEventListener('pointermove', onPointerMove);
        wrapper.addEventListener('pointerup', onPointerEnd);
        wrapper.addEventListener('pointercancel', onPointerEnd);
        wrapper.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    static renderKeypad(container, engine, state, onKeyAction) {
        container.innerHTML = '';
        const keys = [
            { val: 1, label: 'Linie', icon: '―', cls: 'keypad-line' },
            { val: 2, label: 'Kreuz', icon: '✕', cls: 'keypad-cross' },
            { val: 0, label: 'Leeren', icon: '⌫', cls: 'keypad-clear' }
        ];

        for (const k of keys) {
            const btn = document.createElement('button');
            btn.className = `keypad-btn ${k.cls}`;
            btn.innerHTML = `<span class="keypad-icon">${k.icon}</span><span class="keypad-label">${k.label}</span>`;
            btn.addEventListener('click', () => {
                onKeyAction(k.val);
            });
            container.appendChild(btn);
        }
    }

    static getSymbolSvg(val, extraClass = '', size = 24) {
        if (val === 1) {
            return `<svg class="symbol-svg ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;
        } else if (val === 2) {
            return `<svg class="symbol-svg ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
        }
        return '';
    }

    static getRulesHtml(lang = 'de') {
        if (lang === 'en') {
            return `
                <div class="rules-container">
                    <div class="rule-box">
                        <div class="rule-badge">1</div>
                        <div class="rule-content">
                            <strong>Single Closed Loop</strong>
                            <p>Connect the dots horizontally and vertically to form a single continuous, non-intersecting loop without loose ends or branches.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">2</div>
                        <div class="rule-content">
                            <strong>Clue Numbers (0 to 3)</strong>
                            <p>A number in a cell indicates exactly how many of its 4 boundary edges are part of the loop. Empty cells have no edge restrictions.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">3</div>
                        <div class="rule-content">
                            <strong>No Branching (Vertex Degree 2 or 0)</strong>
                            <p>At every dot, exactly 2 lines meet (the loop passes through) or 0 lines meet. T-junctions, crosses, and dead ends are forbidden.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="rules-container">
                <div class="rule-box">
                    <div class="rule-badge">1</div>
                    <div class="rule-content">
                        <strong>Eine geschlossene Schleife</strong>
                        <p>Verbinde die Gitterpunkte horizontal und vertikal zu einem einzigen, zusammenhängenden und geschlossenen Rundweg. Es darf keine Abzweigungen, Kreuzungen oder isolierten Nebenschleifen geben.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">2</div>
                    <div class="rule-content">
                        <strong>Zahlenhinweise (0 bis 3)</strong>
                        <p>Eine Zahl in einer Zelle gibt exakt an, wie viele ihrer 4 Kanten Teil der Schleife sein müssen. Um eine 0 darf keine Linie verlaufen. Leere Zellen haben keine Einschränkung.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">3</div>
                    <div class="rule-content">
                        <strong>Genau 2 Linien pro Punkt</strong>
                        <p>An jedem Punkt der Schleife treffen immer genau 2 Linien zusammen (der Weg läuft durch). Sackgassen oder 3-Wege-Verzweigungen sind nicht erlaubt.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkRenderer };
}
