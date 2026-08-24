/**
 * Tango Visual Renderer
 * Zeichnet das Gitter, Kantenbedingungen, Sonnen-, Mond- und Geistersymbole.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE } from './engine.js';
import { TUTORIAL_STEPS } from './data/tutorial.js';
import { TUTORIAL_PRO_STEPS } from './data/tutorial_pro.js';
import { TUTORIAL_PATTERNS_STEPS } from './data/tutorial_patterns.js';

export function getSunSvg(extraClass = '') {
    return `<svg class="tango-symbol tango-sun ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="1.6" x2="12" y2="3.8"/><line x1="12" y1="20.2" x2="12" y2="22.4"/><line x1="1.6" y1="12" x2="3.8" y2="12"/><line x1="20.2" y1="12" x2="22.4" y2="12"/><line x1="4.6" y1="4.6" x2="6.2" y2="6.2"/><line x1="17.8" y1="17.8" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.2" y2="17.8"/><line x1="17.8" y1="6.2" x2="19.4" y2="4.6"/></g></svg>`;
}

export function getMoonSvg(extraClass = '') {
    return `<svg class="tango-symbol tango-moon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 12.5A9.5 9.5 0 1 1 11.5 2.5a7.5 7.5 0 0 0 10 10z" fill="currentColor"/></svg>`;
}

export class TangoRenderer {
    static getSymbolSvg(val, extraClass = '') {
        if (val === SUN) return getSunSvg(extraClass);
        if (val === MOON) return getMoonSvg(extraClass);
        return '';
    }

    static renderBoard(container, engine, state, onCellInteraction) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);
        const size = engine.size;

        const gridEl = document.createElement('div');
        gridEl.className = `tango-grid size-${size}`;
        gridEl.style.setProperty('--grid-size', size);

        const validation = state.autoCheck ? engine.validateRules() : { conflictCells: new Set() };
        const solution = state.solutionRevealed ? engine.getSolution() : null;

        for (let r = 0; r < size; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'grid-row';

            for (let c = 0; c < size; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'grid-cell tango-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                const val = engine.grid[r][c];
                const isLocked = engine.locked[r][c];
                const isConflict = !state.solutionRevealed && validation.conflictCells.has(`${r},${c}`);
                const isSelected = !state.solutionRevealed && state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c;
                const isHintShimmer = !state.solutionRevealed && state.hintPlacedCell && state.hintPlacedCell.r === r && state.hintPlacedCell.c === c;

                if (isLocked) cellEl.classList.add('locked');
                if (isConflict) cellEl.classList.add('conflict');
                if (isSelected) cellEl.classList.add('selected');
                if (isHintShimmer) cellEl.classList.add('hint-shimmer');

                if (state.solutionRevealed && solution) {
                    const solVal = solution[r][c];
                    if (val === EMPTY) {
                        cellEl.classList.add('cell-revealed-solution');
                        cellEl.innerHTML = `<span class="revealed-ghost ${solVal === SUN ? 'ghost-sun' : 'ghost-moon'}">${solVal === SUN ? getSunSvg('tango-sun') : getMoonSvg('tango-moon')}</span>`;
                    } else if (val === solVal) {
                        cellEl.classList.add(val === SUN ? 'val-sun' : 'val-moon', 'cell-revealed-correct');
                        cellEl.innerHTML = `<span class="${val === SUN ? 'icon-sun' : 'icon-moon'}">${val === SUN ? getSunSvg('cell-sun') : getMoonSvg('cell-moon')}</span>`;
                    } else {
                        cellEl.classList.add(val === SUN ? 'val-sun' : 'val-moon', 'cell-revealed-error');
                        const wrongIcon = val === SUN ? getSunSvg('cell-sun') : getMoonSvg('cell-moon');
                        const correctIcon = solVal === SUN ? getSunSvg('mini-icon') : getMoonSvg('mini-icon');
                        cellEl.innerHTML = `
                            <span class="wrong-marker-cross">✕</span>
                            <span class="${val === SUN ? 'icon-sun' : 'icon-moon'}">${wrongIcon}</span>
                            <div class="revealed-correct-sub">
                                <span class="mini-badge ${solVal === SUN ? 'badge-sun' : 'badge-moon'}">${correctIcon}</span>
                            </div>
                        `;
                    }
                } else if (val === SUN) {
                    cellEl.classList.add('val-sun');
                    cellEl.innerHTML = `<span class="icon-sun">${getSunSvg('cell-sun')}</span>`;
                } else if (val === MOON) {
                    cellEl.classList.add('val-moon');
                    cellEl.innerHTML = `<span class="icon-moon">${getMoonSvg('cell-moon')}</span>`;
                } else {
                    // Marker für Tutorial-Zielzellen
                    let tutStep = null;
                    if (state.currentMode === 'tutorial') {
                        tutStep = TUTORIAL_STEPS[state.tutorialStepIndex];
                    } else if (state.currentMode === 'tutorial_pro') {
                        tutStep = TUTORIAL_PRO_STEPS[state.tutorialStepIndex];
                    } else if (state.currentMode === 'tutorial_patterns') {
                        tutStep = TUTORIAL_PATTERNS_STEPS[state.tutorialStepIndex];
                    }

                    const targetCellInfo = (tutStep && tutStep.targetCells) ? tutStep.targetCells.find(t => t.r === r && t.c === c) : null;
                    if (targetCellInfo) {
                        cellEl.classList.add('tutorial-target');
                        const ghostEl = document.createElement('span');
                        ghostEl.className = `target-ghost ${targetCellInfo.val === SUN ? 'ghost-sun' : 'ghost-moon'}`;
                        ghostEl.innerHTML = targetCellInfo.val === SUN ? getSunSvg('ghost-icon') : getMoonSvg('ghost-icon');
                        cellEl.appendChild(ghostEl);
                    } else {
                        // Notizen
                        const notes = engine.notes[r][c];
                        if (notes && notes.size > 0) {
                            const noteEl = document.createElement('div');
                            noteEl.className = 'cell-notes';
                            if (notes.has(SUN)) noteEl.innerHTML += `<span class="mini-sun">${getSunSvg('mini-icon')}</span>`;
                            if (notes.has(MOON)) noteEl.innerHTML += `<span class="mini-moon">${getMoonSvg('mini-icon')}</span>`;
                            cellEl.appendChild(noteEl);
                        }
                    }
                }

                // Event Listener für Zelle
                if (typeof onCellInteraction === 'function') {
                    onCellInteraction(cellEl, r, c);
                }

                // Horizontale Kante rechts neben der Zelle
                if (c < size - 1) {
                    const hEdge = engine.hEdges[r][c];
                    if (hEdge !== EDGE_NONE) {
                        const edgeEl = document.createElement('div');
                        edgeEl.className = `edge-marker edge-h ${hEdge === EDGE_EQUAL ? 'edge-equal' : 'edge-opposite'}`;
                        edgeEl.textContent = hEdge === EDGE_EQUAL ? '=' : '×';
                        cellEl.appendChild(edgeEl);
                    }
                }

                // Vertikale Kante unterhalb der Zelle
                if (r < size - 1) {
                    const vEdge = engine.vEdges[r][c];
                    if (vEdge !== EDGE_NONE) {
                        const edgeEl = document.createElement('div');
                        edgeEl.className = `edge-marker edge-v ${vEdge === EDGE_EQUAL ? 'edge-equal' : 'edge-opposite'}`;
                        edgeEl.textContent = vEdge === EDGE_EQUAL ? '=' : '×';
                        cellEl.appendChild(edgeEl);
                    }
                }

                rowEl.appendChild(cellEl);
            }
            gridEl.appendChild(rowEl);
        }

        container.appendChild(gridEl);
    }

    static renderKeypad(container, engine, state, onKeyInput) {
        if (!container) return;
        container.innerHTML = '';

        const keypad = document.createElement('div');
        keypad.className = 'game-keypad tango-keypad';
        keypad.id = 'gameKeypad';

        const btnSun = document.createElement('button');
        btnSun.className = 'keypad-btn';
        btnSun.id = 'keypadSun';
        btnSun.setAttribute('aria-label', 'Sonne');
        btnSun.innerHTML = getSunSvg('tango-sun');
        btnSun.addEventListener('click', () => onKeyInput && onKeyInput(SUN));

        const btnMoon = document.createElement('button');
        btnMoon.className = 'keypad-btn';
        btnMoon.id = 'keypadMoon';
        btnMoon.setAttribute('aria-label', 'Mond');
        btnMoon.innerHTML = getMoonSvg('tango-moon');
        btnMoon.addEventListener('click', () => onKeyInput && onKeyInput(MOON));

        const btnClear = document.createElement('button');
        btnClear.className = 'keypad-btn';
        btnClear.id = 'keypadClear';
        btnClear.setAttribute('aria-label', 'Löschen');
        btnClear.textContent = '✕';
        btnClear.addEventListener('click', () => onKeyInput && onKeyInput(EMPTY));

        keypad.appendChild(btnSun);
        keypad.appendChild(btnMoon);
        keypad.appendChild(btnClear);

        container.appendChild(keypad);
    }

    static getRulesHtml(lang = 'de') {
        if (lang === 'en') {
            return `
                <div class="rules-container">
                    <div class="rule-box">
                        <div class="rule-badge">1</div>
                        <div class="rule-content">
                            <strong>Equal count per row & column</strong>
                            <p>Each row and column must contain the exact same number of suns ☀️ and moons 🌙 (e.g. 3☀️ & 3🌙 in 6×6).</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">2</div>
                        <div class="rule-content">
                            <strong>Max 2 consecutive identical symbols</strong>
                            <p>Never place 3 matching symbols in a row or column (no ☀️☀️☀️ or 🌙🌙🌙).</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">3</div>
                        <div class="rule-content">
                            <strong>Equal Sign =</strong>
                            <p>Connected adjacent cells must have the same symbol (both ☀️ or both 🌙).</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">4</div>
                        <div class="rule-content">
                            <strong>Opposite Sign ×</strong>
                            <p>Connected adjacent cells must have opposite symbols (one ☀️, one 🌙).</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">5</div>
                        <div class="rule-content">
                            <strong>Uniqueness</strong>
                            <p>No two rows and no two columns can be completely identical.</p>
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
                        <strong>Gleiche Anzahl pro Zeile & Spalte</strong>
                        <p>Jede Zeile und Spalte muss exakt gleich viele Sonnen ☀️ wie Monde 🌙 enthalten (z. B. 3☀️ & 3🌙 bei 6×6).</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">2</div>
                    <div class="rule-content">
                        <strong>Maximal 2 gleiche Symbole nebeneinander</strong>
                        <p>Niemals dürfen 3 gleiche Symbole horizontal oder vertikal aufeinanderfolgen (kein ☀️☀️☀️ oder 🌙🌙🌙).</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">3</div>
                    <div class="rule-content">
                        <strong>Gleichheitszeichen =</strong>
                        <p>Verbundene Nachbarfelder müssen dasselbe Symbol besitzen (beide ☀️ oder beide 🌙).</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">4</div>
                    <div class="rule-content">
                        <strong>Gegenteilszeichen ×</strong>
                        <p>Verbundene Nachbarfelder müssen unterschiedliche Symbole besitzen (eine ☀️, ein 🌙).</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">5</div>
                    <div class="rule-content">
                        <strong>Eindeutigkeit</strong>
                        <p>Keine zwei Zeilen und keine zwei Spalten dürfen vollständig identisch sein.</p>
                    </div>
                </div>
            </div>
        `;
    }
}
