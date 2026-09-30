/**
 * Crowns (Queens) Visual Renderer
 * Zeichnet das farbige Regionsgitter, Kronen, X-Markierungen,
 * Tutorial-Ghosts, Keypad und Regeltext.
 */

import { CROWNS_EMPTY, CROWNS_CROWN, CROWNS_X } from './engine.js';
import { CROWNS_TUTORIAL_STEPS } from './data/tutorial.js';

export function getCrownSvg(extraClass = '') {
    return `<svg class="crowns-symbol crowns-crown-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 19h19l-2-8-3.5 3.5L12 8l-4 6.5L4.5 11l-2 8z" fill="currentColor"/><rect x="2.5" y="19" width="19" height="2.5" rx="0.5" fill="currentColor"/><circle cx="4.5" cy="9.5" r="1.5" fill="currentColor"/><circle cx="12" cy="6" r="1.5" fill="currentColor"/><circle cx="19.5" cy="9.5" r="1.5" fill="currentColor"/></svg>`;
}

export function getXSvg(extraClass = '') {
    return `<svg class="crowns-symbol crowns-x-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`;
}

export class CrownsRenderer {
    static getSymbolSvg(val, extraClass = '') {
        if (val === CROWNS_CROWN) return getCrownSvg(extraClass);
        if (val === CROWNS_X) return getXSvg(extraClass);
        return '';
    }

    static renderBoard(container, engine, state, onCellInteraction) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);
        const size = engine.size;

        const gridEl = document.createElement('div');
        gridEl.className = `crowns-grid size-${size}`;
        gridEl.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
        gridEl.style.gridTemplateRows = `repeat(${size}, minmax(0, 1fr))`;
        gridEl.style.setProperty('--grid-size', size);

        const validation = state.autoCheck ? engine.validateRules() : { conflictCells: new Set() };
        const solution = state.solutionRevealed ? engine.getSolution() : null;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'grid-cell crowns-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                // Region-Farbe als Hintergrund
                const regionId = engine.regions[r][c];
                const regionColor = engine.regionColors[regionId] || '#888';
                cellEl.style.setProperty('--region-color', regionColor);
                cellEl.classList.add(`region-${regionId}`);

                const val = engine.grid[r][c];
                const isConflict = !state.solutionRevealed && validation.conflictCells.has(`${r},${c}`);
                const isSelected = !state.solutionRevealed && state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c;
                const isHintShimmer = !state.solutionRevealed && state.hintPlacedCell && state.hintPlacedCell.r === r && state.hintPlacedCell.c === c;
                const isHintHighlight = !state.solutionRevealed && state.currentHint?.highlightCells?.some(h => h.r === r && h.c === c);

                if (isConflict) cellEl.classList.add('conflict');
                if (isSelected) cellEl.classList.add('selected');
                if (isHintShimmer) cellEl.classList.add('hint-shimmer');
                if (isHintHighlight) cellEl.classList.add('hint-highlight');

                if (state.solutionRevealed && solution) {
                    const solVal = solution[r][c];
                    if (solVal === CROWNS_CROWN) {
                        if (val === CROWNS_CROWN) {
                            cellEl.classList.add('cell-revealed-correct');
                            cellEl.innerHTML = `<span class="icon-crown">${getCrownSvg('cell-crown')}</span>`;
                        } else {
                            cellEl.classList.add('cell-revealed-solution');
                            cellEl.innerHTML = `<span class="revealed-ghost ghost-crown">${getCrownSvg('ghost-icon')}</span>`;
                        }
                    } else if (val === CROWNS_CROWN) {
                        cellEl.classList.add('cell-revealed-error');
                        cellEl.innerHTML = `<span class="wrong-marker-cross">✕</span><span class="icon-crown">${getCrownSvg('cell-crown')}</span>`;
                    }
                } else if (val === CROWNS_CROWN) {
                    cellEl.classList.add('val-crown');
                    cellEl.innerHTML = `<span class="icon-crown">${getCrownSvg('cell-crown')}</span>`;
                } else if (val === CROWNS_X) {
                    cellEl.classList.add('val-x');
                    cellEl.innerHTML = `<span class="icon-x">${getXSvg('cell-x')}</span>`;
                } else {
                    // Leere Zelle - Tutorial-Ghost oder Notizen
                    let tutStep = null;
                    if (state.currentMode === 'tutorial' || state.currentMode === 'tutorial_crowns') {
                        tutStep = CROWNS_TUTORIAL_STEPS[state.tutorialStepIndex];
                    }

                    const targetCellInfo = (tutStep && tutStep.targetCells) ? tutStep.targetCells.find(t => t.r === r && t.c === c) : null;
                    if (targetCellInfo) {
                        cellEl.classList.add('tutorial-target');
                        const ghostEl = document.createElement('span');
                        ghostEl.className = 'target-ghost ghost-crown';
                        ghostEl.innerHTML = targetCellInfo.val === CROWNS_CROWN ? getCrownSvg('ghost-icon') : getXSvg('ghost-icon');
                        cellEl.appendChild(ghostEl);
                    } else {
                        // Notizen
                        const notes = engine.notes[r][c];
                        if (notes && notes.size > 0) {
                            const noteEl = document.createElement('div');
                            noteEl.className = 'cell-notes';
                            if (notes.has(CROWNS_CROWN)) noteEl.innerHTML += `<span class="mini-crown">${getCrownSvg('mini-icon')}</span>`;
                            cellEl.appendChild(noteEl);
                        }
                    }
                }

                // Event Listener
                if (typeof onCellInteraction === 'function') {
                    onCellInteraction(cellEl, r, c);
                }

                gridEl.appendChild(cellEl);
            }
        }

        // SVG Overlay für 100% gleichmäßige Rasterlinien und Regionen-Grenzen
        let linesSvg = '';
        for (let i = 1; i < size; i++) {
            const pos = i * 100;
            linesSvg += `<line x1="${pos}" y1="0" x2="${pos}" y2="${size * 100}" class="crowns-grid-line" />`;
            linesSvg += `<line x1="0" y1="${pos}" x2="${size * 100}" y2="${pos}" class="crowns-grid-line" />`;
        }

        let pathD = '';
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                if (engine.regions[r][c] !== engine.regions[r][c + 1]) {
                    const x = (c + 1) * 100;
                    pathD += `M ${x} ${r * 100} L ${x} ${(r + 1) * 100} `;
                }
            }
        }
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                if (engine.regions[r][c] !== engine.regions[r + 1][c]) {
                    const y = (r + 1) * 100;
                    pathD += `M ${c * 100} ${y} L ${(c + 1) * 100} ${y} `;
                }
            }
        }

        const borderPathSvg = pathD.trim() ? `<path d="${pathD.trim()}" class="crowns-region-borders" />` : '';

        const overlayWrapper = document.createElement('div');
        overlayWrapper.innerHTML = `<svg class="crowns-grid-overlay" viewBox="0 0 ${size * 100} ${size * 100}" preserveAspectRatio="none" aria-hidden="true"><g class="crowns-grid-lines">${linesSvg}</g>${borderPathSvg}</svg>`;
        gridEl.appendChild(overlayWrapper.firstElementChild);

        container.appendChild(gridEl);
    }

    static renderKeypad(container, engine, state, onKeyInput) {
        if (!container) return;
        container.innerHTML = '';

        const keypad = document.createElement('div');
        keypad.className = 'game-keypad crowns-keypad';
        keypad.id = 'gameKeypad';

        const btnCrown = document.createElement('button');
        btnCrown.className = 'keypad-btn';
        btnCrown.id = 'keypadCrown';
        btnCrown.setAttribute('aria-label', 'Krone');
        btnCrown.innerHTML = getCrownSvg('keypad-crown');
        btnCrown.addEventListener('click', () => onKeyInput && onKeyInput(CROWNS_CROWN));

        const btnX = document.createElement('button');
        btnX.className = 'keypad-btn';
        btnX.id = 'keypadX';
        btnX.setAttribute('aria-label', 'Eliminieren');
        btnX.innerHTML = getXSvg('keypad-x');
        btnX.addEventListener('click', () => onKeyInput && onKeyInput(CROWNS_X));

        const btnClear = document.createElement('button');
        btnClear.className = 'keypad-btn';
        btnClear.id = 'keypadClear';
        btnClear.setAttribute('aria-label', 'Löschen');
        btnClear.textContent = '⌫';
        btnClear.addEventListener('click', () => onKeyInput && onKeyInput(CROWNS_EMPTY));

        keypad.appendChild(btnCrown);
        keypad.appendChild(btnX);
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
                            <strong>One crown per row</strong>
                            <p>Each row must contain exactly one crown 👑.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">2</div>
                        <div class="rule-content">
                            <strong>One crown per column</strong>
                            <p>Each column must contain exactly one crown 👑.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">3</div>
                        <div class="rule-content">
                            <strong>One crown per color region</strong>
                            <p>Each colored region must contain exactly one crown 👑.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">4</div>
                        <div class="rule-content">
                            <strong>No touching</strong>
                            <p>Crowns may not be placed in adjacent cells — neither horizontally, vertically, nor diagonally.</p>
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
                        <strong>Eine Krone pro Zeile</strong>
                        <p>Jede Zeile muss genau eine Krone 👑 enthalten.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">2</div>
                    <div class="rule-content">
                        <strong>Eine Krone pro Spalte</strong>
                        <p>Jede Spalte muss genau eine Krone 👑 enthalten.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">3</div>
                    <div class="rule-content">
                        <strong>Eine Krone pro Farbregion</strong>
                        <p>Jede farbige Region muss genau eine Krone 👑 enthalten.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">4</div>
                    <div class="rule-content">
                        <strong>Keine Berührung</strong>
                        <p>Kronen dürfen sich weder waagerecht, senkrecht noch diagonal berühren.</p>
                    </div>
                </div>
            </div>
        `;
    }
}
