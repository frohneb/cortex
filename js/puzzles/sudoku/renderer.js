/**
 * Sudoku Visual Renderer
 * Zeichnet das harmonische, nahtlose Sudoku-Gitter (4×4, 9×9, 16×16 Hexadezimal)
 * mit durchgehenden Block-Rändern, Notizen-Gittern, Keypad und Lösungsaufdeckung.
 */

import { SUDOKU_EMPTY } from './engine.js';
import { SUDOKU_TUTORIAL_STEPS } from './data/tutorial.js';
import { SUDOKU_TUTORIAL_ADVANCED_STEPS } from './data/tutorial_advanced.js';

export class SudokuRenderer {
    static getSymbolSvg(val, extraClass = '', size = 9) {
        if (val > 0) {
            const char = size === 16 ? ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'][val - 1] : val;
            return `<span class="sudoku-digit-badge ${extraClass}">${char}</span>`;
        }
        return '';
    }

    static countRemaining(engine, val) {
        let placed = 0;
        for (let r = 0; r < engine.size; r++) {
            for (let c = 0; c < engine.size; c++) {
                if (engine.grid[r][c] === val) placed++;
            }
        }
        return Math.max(0, engine.size - placed);
    }

    static renderBoard(container, engine, state, onCellInteraction) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const size = engine.size;
        // Nahtloses einheitliches Gitter (Zero-Gap CSS Grid)
        const gridEl = document.createElement('div');
        gridEl.className = `sudoku-grid size-${size}`;
        gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        gridEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        gridEl.style.setProperty('--grid-size', size);
        gridEl.style.setProperty('--box-w', engine.boxW);
        gridEl.style.setProperty('--box-h', engine.boxH);

        const validation = state.autoCheck ? engine.validateRules() : { conflictCells: new Set() };
        const solution = state.solutionRevealed ? engine.getSolution() : null;

        const selCell = state.selectedCell;
        const selVal = (selCell && engine.grid[selCell.r]) ? engine.grid[selCell.r][selCell.c] : SUDOKU_EMPTY;
        const peers = selCell ? engine.getPeers(selCell.r, selCell.c) : new Set();

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'sudoku-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                const val = engine.grid[r][c];
                const isLocked = engine.locked[r][c];
                const isConflict = !state.solutionRevealed && validation.conflictCells.has(`${r},${c}`);
                const isSelected = !state.solutionRevealed && selCell && selCell.r === r && selCell.c === c;
                const isHintShimmer = !state.solutionRevealed && state.hintPlacedCell && state.hintPlacedCell.r === r && state.hintPlacedCell.c === c;
                const isPeer = !state.solutionRevealed && peers.has(`${r},${c}`);
                const isSameValue = !state.solutionRevealed && selVal > 0 && val === selVal;

                // Durchgehende, nahtlose Block-Ränder
                if ((c + 1) % engine.boxW === 0 && c < size - 1) cellEl.classList.add('box-edge-right');
                if ((r + 1) % engine.boxH === 0 && r < size - 1) cellEl.classList.add('box-edge-bottom');

                if (isLocked) cellEl.classList.add('locked');
                if (isConflict) cellEl.classList.add('conflict');
                if (isSelected) cellEl.classList.add('selected');
                if (isPeer && !isSelected) cellEl.classList.add('peer-highlight');
                if (isSameValue && !isSelected) cellEl.classList.add('same-value-highlight');
                if (isHintShimmer) cellEl.classList.add('hint-shimmer');

                const displayChar = engine.formatValue(val);

                if (state.solutionRevealed && solution) {
                    const solVal = solution[r][c];
                    const solChar = engine.formatValue(solVal);

                    if (val === SUDOKU_EMPTY) {
                        cellEl.classList.add('cell-revealed-solution');
                        const ghost = document.createElement('span');
                        ghost.className = 'revealed-ghost ghost-digit';
                        ghost.textContent = solChar;
                        cellEl.appendChild(ghost);
                    } else if (val === solVal) {
                        cellEl.classList.add('val-digit', 'cell-revealed-correct');
                        const digitSpan = document.createElement('span');
                        digitSpan.className = 'icon-digit';
                        digitSpan.textContent = displayChar;
                        cellEl.appendChild(digitSpan);
                    } else {
                        cellEl.classList.add('val-digit', 'cell-revealed-error');
                        const crossSpan = document.createElement('span');
                        crossSpan.className = 'wrong-marker-cross';
                        crossSpan.textContent = '✕';
                        cellEl.appendChild(crossSpan);

                        const digitSpan = document.createElement('span');
                        digitSpan.className = 'icon-digit';
                        digitSpan.textContent = displayChar;
                        cellEl.appendChild(digitSpan);

                        const subDiv = document.createElement('div');
                        subDiv.className = 'revealed-correct-sub';
                        const badge = document.createElement('span');
                        badge.className = 'mini-badge badge-digit';
                        badge.textContent = solChar;
                        subDiv.appendChild(badge);
                        cellEl.appendChild(subDiv);
                    }
                } else if (val > 0) {
                    cellEl.classList.add('val-digit');
                    const digitSpan = document.createElement('span');
                    digitSpan.className = 'icon-digit';
                    digitSpan.textContent = displayChar;
                    cellEl.appendChild(digitSpan);
                } else {
                    // Tutorial Target
                    let tutStep = null;
                    if (state.currentMode === 'tutorial') {
                        tutStep = SUDOKU_TUTORIAL_STEPS[state.tutorialStepIndex];
                    } else if (state.currentMode === 'tutorial_pro' || state.currentMode === 'tutorial_advanced') {
                        tutStep = SUDOKU_TUTORIAL_ADVANCED_STEPS[state.tutorialStepIndex];
                    }

                    const targetCellInfo = (tutStep && tutStep.targetCells) ? tutStep.targetCells.find(t => t.r === r && t.c === c) : null;
                    if (targetCellInfo) {
                        cellEl.classList.add('tutorial-target');
                        const ghostEl = document.createElement('span');
                        ghostEl.className = 'target-ghost ghost-digit';
                        ghostEl.textContent = engine.formatValue(targetCellInfo.val);
                        cellEl.appendChild(ghostEl);
                    } else {
                        // Notizen
                        const notes = engine.notes[r][c];
                        if (notes && notes.size > 0) {
                            const noteGrid = document.createElement('div');
                            noteGrid.className = `sudoku-note-grid grid-${engine.maxValue}`;
                            for (let n = 1; n <= engine.maxValue; n++) {
                                const nSpan = document.createElement('span');
                                nSpan.className = 'note-digit';
                                nSpan.textContent = notes.has(n) ? engine.formatValue(n) : '';
                                noteGrid.appendChild(nSpan);
                            }
                            cellEl.appendChild(noteGrid);
                        }
                    }
                }

                if (typeof onCellInteraction === 'function') {
                    onCellInteraction(cellEl, r, c);
                }

                gridEl.appendChild(cellEl);
            }
        }

        container.appendChild(gridEl);
    }

    static renderKeypad(container, engine, state, onKeyInput) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const is16 = engine.size === 16;
        container.className = `game-keypad sudoku-keypad keypad-${engine.maxValue} ${is16 ? 'keypad-hex-layout' : ''}`;

        if (is16) {
            // 16x16: 2 Zeilen für optimale Smartphone-Bedienung
            const row1 = document.createElement('div');
            row1.className = 'keypad-hex-row';
            const row2 = document.createElement('div');
            row2.className = 'keypad-hex-row';

            for (let v = 1; v <= 16; v++) {
                const btn = document.createElement('button');
                btn.className = 'keypad-btn sudoku-key';
                btn.dataset.val = v;

                const remaining = SudokuRenderer.countRemaining(engine, v);
                if (remaining === 0) btn.classList.add('completed-digit');

                const char = engine.formatValue(v);
                
                const dSpan = document.createElement('span');
                dSpan.className = 'key-digit';
                dSpan.textContent = char;
                btn.appendChild(dSpan);

                const rSpan = document.createElement('span');
                rSpan.className = 'key-remaining';
                rSpan.textContent = remaining;
                btn.appendChild(rSpan);

                btn.addEventListener('click', () => onKeyInput && onKeyInput(v));

                if (v <= 8) {
                    row1.appendChild(btn);
                } else {
                    row2.appendChild(btn);
                }
            }

            // Löschen Button in Zeile 2
            const btnClear = document.createElement('button');
            btnClear.className = 'keypad-btn sudoku-key key-clear';
            btnClear.id = 'keypadClear';
            btnClear.setAttribute('aria-label', 'Löschen');
            const clearSpan = document.createElement('span');
            clearSpan.className = 'key-digit';
            clearSpan.textContent = '✕';
            btnClear.appendChild(clearSpan);
            btnClear.addEventListener('click', () => onKeyInput && onKeyInput(SUDOKU_EMPTY));
            row2.appendChild(btnClear);

            container.appendChild(row1);
            container.appendChild(row2);
        } else {
            // 4x4 / 9x9: 1 Zeile
            for (let v = 1; v <= engine.maxValue; v++) {
                const btn = document.createElement('button');
                btn.className = 'keypad-btn sudoku-key';
                btn.dataset.val = v;

                const remaining = SudokuRenderer.countRemaining(engine, v);
                if (remaining === 0) btn.classList.add('completed-digit');

                const char = engine.formatValue(v);

                const dSpan = document.createElement('span');
                dSpan.className = 'key-digit';
                dSpan.textContent = char;
                btn.appendChild(dSpan);

                const rSpan = document.createElement('span');
                rSpan.className = 'key-remaining';
                rSpan.textContent = remaining;
                btn.appendChild(rSpan);

                btn.addEventListener('click', () => onKeyInput && onKeyInput(v));
                container.appendChild(btn);
            }

            // Löschen-Button
            const btnClear = document.createElement('button');
            btnClear.className = 'keypad-btn sudoku-key key-clear';
            btnClear.id = 'keypadClear';
            btnClear.setAttribute('aria-label', 'Löschen');
            const clearSpan = document.createElement('span');
            clearSpan.className = 'key-digit';
            clearSpan.textContent = '✕';
            btnClear.appendChild(clearSpan);
            btnClear.addEventListener('click', () => onKeyInput && onKeyInput(SUDOKU_EMPTY));
            container.appendChild(btnClear);
        }
    }

    static getRulesHtml(lang = 'de') {
        if (lang === 'en') {
            return `
                <div class="rules-container">
                    <div class="rule-box">
                        <div class="rule-badge">1</div>
                        <div class="rule-content">
                            <strong>Rows</strong>
                            <p>Every row must contain all symbols (1–4, 1–9, or 0–F in 16×16 Hex) without duplicates.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">2</div>
                        <div class="rule-content">
                            <strong>Columns</strong>
                            <p>Every column must contain all symbols without duplicates.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">3</div>
                        <div class="rule-content">
                            <strong>Blocks (Sub-Grids)</strong>
                            <p>Every block (2×2 in 4×4, 3×3 in 9×9, 4×4 in 16×16) must contain each symbol exactly once.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">4</div>
                        <div class="rule-content">
                            <strong>Pure Deduction</strong>
                            <p>Every puzzle has exactly one unique solution. No guessing required!</p>
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
                        <strong>Zeilen</strong>
                        <p>Jede waagerechte Zeile muss alle Werte (1–4 bei 4×4, 1–9 bei 9×9, 0–F bei 16×16 Hex) ohne Wiederholungen enthalten.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">2</div>
                    <div class="rule-content">
                        <strong>Spalten</strong>
                        <p>Jede senkrechte Spalte muss alle Werte ohne Wiederholungen enthalten.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">3</div>
                    <div class="rule-content">
                        <strong>Blöcke (Boxen)</strong>
                        <p>Jeder fett umrandete Block (2×2 bei 4×4, 3×3 bei 9×9, 4×4 bei 16×16) muss jeden Wert exakt einmal enthalten.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">4</div>
                    <div class="rule-content">
                        <strong>Reine Logik & Eindeutigkeit</strong>
                        <p>Jedes Rätsel besitzt eine eindeutige Lösung und ist ohne Raten rein durch logische Deduktion lösbar.</p>
                    </div>
                </div>
            </div>
        `;
    }
}
