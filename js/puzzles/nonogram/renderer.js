/**
 * Nonogram Visual Renderer
 * Zeichnet das Spielfeld mit Zeilen- und Spaltenhinweisen, 5×5-Block-Trennlinien,
 * Auto-Cross-Out, dynamischer Mehrzeilen-Skalierung und Zoom-Unterstützung.
 */

import { NONO_EMPTY, NONO_FILLED, NONO_CROSS } from './engine.js';
import { NONOGRAM_TUTORIAL_STEPS } from './data/tutorial.js';

export class NonogramRenderer {
    static getSymbolSvg(val, extraClass = '') {
        if (val === NONO_FILLED) {
            return `<span class="nono-symbol nono-filled ${extraClass}">⬛</span>`;
        } else if (val === NONO_CROSS) {
            return `<span class="nono-symbol nono-cross ${extraClass}">✕</span>`;
        }
        return '';
    }

    static renderBoard(container, engine, state, onCellInteraction) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        container.classList.add('has-nonogram');

        const width = engine.width;
        const height = engine.height;

        const maxColClues = Math.max(1, ...engine.colClues.map(c => (c && c.length) ? c.length : 1));
        const maxRowClues = Math.max(1, ...engine.rowClues.map(c => (c && c.length) ? c.length : 1));

        const boardWrapper = document.createElement('div');
        boardWrapper.className = `nonogram-board size-${width}`;
        boardWrapper.style.setProperty('--grid-w', width);
        boardWrapper.style.setProperty('--grid-h', height);
        boardWrapper.style.setProperty('--max-col-clues', maxColClues);
        boardWrapper.style.setProperty('--max-row-clues', maxRowClues);

        // 1. Oben-Links: Leere Ecke
        const cornerEl = document.createElement('div');
        cornerEl.className = 'nonogram-corner';
        boardWrapper.appendChild(cornerEl);

        // 2. Oben: Spalten-Hinweise (Col Clues)
        const colCluesContainer = document.createElement('div');
        colCluesContainer.className = 'nonogram-col-clues';
        colCluesContainer.style.gridTemplateColumns = `repeat(${width}, minmax(0, 1fr))`;

        for (let c = 0; c < width; c++) {
            const clueBox = document.createElement('div');
            clueBox.className = 'col-clue-box';
            if ((c + 1) % 5 === 0 && c < width - 1) clueBox.classList.add('major-edge-right');

            const isSatisfied = engine.isColSatisfied(c);
            if (isSatisfied) clueBox.classList.add('clue-satisfied');

            const clues = engine.colClues[c] || [0];
            for (const num of clues) {
                const numEl = document.createElement('span');
                numEl.className = 'clue-num';
                numEl.textContent = num;
                clueBox.appendChild(numEl);
            }
            colCluesContainer.appendChild(clueBox);
        }
        boardWrapper.appendChild(colCluesContainer);

        // 3. Links: Zeilen-Hinweise (Row Clues)
        const rowCluesContainer = document.createElement('div');
        rowCluesContainer.className = 'nonogram-row-clues';
        rowCluesContainer.style.gridTemplateRows = `repeat(${height}, minmax(0, 1fr))`;

        for (let r = 0; r < height; r++) {
            const clueBox = document.createElement('div');
            clueBox.className = 'row-clue-box';
            if ((r + 1) % 5 === 0 && r < height - 1) clueBox.classList.add('major-edge-bottom');

            const isSatisfied = engine.isRowSatisfied(r);
            if (isSatisfied) clueBox.classList.add('clue-satisfied');

            const clues = engine.rowClues[r] || [0];
            for (const num of clues) {
                const numEl = document.createElement('span');
                numEl.className = 'clue-num';
                numEl.textContent = num;
                clueBox.appendChild(numEl);
            }
            rowCluesContainer.appendChild(clueBox);
        }
        boardWrapper.appendChild(rowCluesContainer);

        // 4. Haupt-Gitter (Cells)
        const gridEl = document.createElement('div');
        gridEl.className = `nonogram-grid size-${width}`;
        gridEl.style.gridTemplateColumns = `repeat(${width}, minmax(0, 1fr))`;
        gridEl.style.gridTemplateRows = `repeat(${height}, minmax(0, 1fr))`;

        const validation = state.autoCheck ? engine.validateRules() : { conflictCells: new Set() };
        const solution = state.solutionRevealed ? engine.getSolution() : null;

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'nonogram-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                const val = engine.grid[r][c];
                const isSelected = !state.solutionRevealed && state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c;
                const isHintShimmer = !state.solutionRevealed && state.hintPlacedCell && state.hintPlacedCell.r === r && state.hintPlacedCell.c === c;

                // 5er-Blocktrenner
                if ((c + 1) % 5 === 0 && c < width - 1) cellEl.classList.add('major-edge-right');
                if ((r + 1) % 5 === 0 && r < height - 1) cellEl.classList.add('major-edge-bottom');

                if (isSelected) {
                    cellEl.classList.add('selected');
                    if (state.cellZoom) {
                        cellEl.classList.add('cell-zoom');
                        cellEl.style.setProperty('--zoom-factor', state.cellZoomLevel || '1.5');
                    }
                }
                if (isHintShimmer) cellEl.classList.add('hint-shimmer');

                if (state.solutionRevealed && solution) {
                    const solVal = solution[r][c];
                    if (solVal === 1) {
                        cellEl.classList.add('revealed-filled');
                    } else if (val === NONO_FILLED) {
                        cellEl.classList.add('revealed-error');
                        cellEl.textContent = '✕';
                    }
                } else if (val === NONO_FILLED) {
                    cellEl.classList.add('cell-filled');
                } else if (val === NONO_CROSS) {
                    cellEl.classList.add('cell-cross');
                    cellEl.textContent = '✕';
                } else {
                    // Tutorial Target
                    let tutStep = null;
                    if (state.currentMode === 'tutorial') {
                        tutStep = NONOGRAM_TUTORIAL_STEPS[state.tutorialStepIndex];
                    }
                    const targetCellInfo = (tutStep && tutStep.targetCells) ? tutStep.targetCells.find(t => t.r === r && t.c === c) : null;
                    if (targetCellInfo) {
                        cellEl.classList.add('tutorial-target');
                        if (targetCellInfo.val === NONO_FILLED) {
                            cellEl.classList.add('target-ghost-fill');
                        } else if (targetCellInfo.val === NONO_CROSS) {
                            cellEl.classList.add('target-ghost-cross');
                            cellEl.textContent = '✕';
                        }
                    }
                }

                if (typeof onCellInteraction === 'function') {
                    onCellInteraction(cellEl, r, c);
                }

                gridEl.appendChild(cellEl);
            }
        }

        boardWrapper.appendChild(gridEl);
        container.appendChild(boardWrapper);
    }

    static renderKeypad(container, engine, state, onKeyInput) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        container.className = 'game-keypad nonogram-keypad';

        // 1. Button: Füllen ⬛
        const btnFill = document.createElement('button');
        btnFill.className = 'keypad-btn nono-key-btn key-fill';
        btnFill.innerHTML = '<span class="key-icon">⬛</span><span class="key-label">Füllen</span>';
        btnFill.addEventListener('click', () => onKeyInput && onKeyInput(NONO_FILLED));
        container.appendChild(btnFill);

        // 2. Button: Kreuz ❌
        const btnCross = document.createElement('button');
        btnCross.className = 'keypad-btn nono-key-btn key-cross';
        btnCross.innerHTML = '<span class="key-icon">✕</span><span class="key-label">Kreuz</span>';
        btnCross.addEventListener('click', () => onKeyInput && onKeyInput(NONO_CROSS));
        container.appendChild(btnCross);

        // 3. Button: Löschen / Leeren
        const btnClear = document.createElement('button');
        btnClear.className = 'keypad-btn nono-key-btn key-clear';
        btnClear.innerHTML = '<span class="key-icon">↺</span><span class="key-label">Leeren</span>';
        btnClear.addEventListener('click', () => onKeyInput && onKeyInput(NONO_EMPTY));
        container.appendChild(btnClear);
    }

    static getRulesHtml(lang = 'de') {
        if (lang === 'en') {
            return `
                <div class="rules-container">
                    <div class="rule-box">
                        <div class="rule-badge">1</div>
                        <div class="rule-content">
                            <strong>Numbers describe filled blocks</strong>
                            <p>The numbers beside each row and above each column indicate groups of consecutive filled squares.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">2</div>
                        <div class="rule-content">
                            <strong>Order &amp; Sequence</strong>
                            <p>Blocks appear in the exact order shown. For example, "2 3" means a block of 2, followed later by a block of 3.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">3</div>
                        <div class="rule-content">
                            <strong>At least 1 empty space</strong>
                            <p>Between any two filled blocks in the same line, there must be at least one empty square (marked with ✕).</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">4</div>
                        <div class="rule-content">
                            <strong>Pure Deduction</strong>
                            <p>Every puzzle has a unique picture solution that can be found purely by logical reasoning without guessing!</p>
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
                        <strong>Zahlen beschreiben gefüllte Blöcke</strong>
                        <p>Die Zahlen am Rand geben an, wie viele zusammenhängende Kästchen in der jeweiligen Zeile oder Spalte gefüllt werden müssen.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">2</div>
                    <div class="rule-content">
                        <strong>Reihenfolge einhalten</strong>
                        <p>Die Blöcke treten exakt in der Reihenfolge der Zahlen auf. Ein Hinweis „2 3“ bedeutet: Erst ein 2er-Block, später ein 3er-Block.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">3</div>
                    <div class="rule-content">
                        <strong>Mindestens 1 Lücke</strong>
                        <p>Zwischen zwei separaten gefüllten Blöcken muss immer mindestens ein freies Feld liegen (mit ✕ markierbar).</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">4</div>
                    <div class="rule-content">
                        <strong>Eindeutiges Pixel-Bild</strong>
                        <p>Jedes Rätsel besitzt genau eine eindeutige Lösung und enthüllt bei Erfolg eine schöne Pixel-Art-Illustration.</p>
                    </div>
                </div>
            </div>
        `;
    }
}
