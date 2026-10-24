/**
 * SumGrid Visual Renderer
 * Zeichnet das Spielfeld mit Ziffernkacheln, Zeilen- & Spalten-Zielsummen,
 * Live-Statusindikatoren (Erfüllt, Überschritten, Ausstehend) und Keypad.
 */

import { SUMGRID_NEUTRAL, SUMGRID_KEEP, SUMGRID_CROSS } from './engine.js';

export class SumGridRenderer {
    static getSymbolSvg(val, extraClass = '') {
        if (val === SUMGRID_KEEP) {
            return `<span class="sumgrid-symbol sumgrid-sym-keep ${extraClass}">✓</span>`;
        } else if (val === SUMGRID_CROSS) {
            return `<span class="sumgrid-symbol sumgrid-sym-cross ${extraClass}">✕</span>`;
        }
        return '';
    }

    static renderBoard(container, engine, state, onCellInteraction) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        container.classList.add('has-sumgrid');

        const size = engine.size;
        const boardWrapper = document.createElement('div');
        boardWrapper.className = `sumgrid-board size-${size}`;
        boardWrapper.style.setProperty('--grid-size', size);

        const selCell = state.selectedCell;
        const hintCell = state.hintPlacedCell;
        const solution = engine.solution;

        // Grid-Layout: (size + 1) Zeilen x (size + 1) Spalten
        // Zeilen 0..size-1, Spalten 0..size-1: Zahlenkacheln
        // Spalte size: Zeilen-Zielsummen
        // Zeile size: Spalten-Zielsummen
        // Ecke (size, size): Corner-Badge

        const gridEl = document.createElement('div');
        gridEl.className = 'sumgrid-matrix';
        gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr) auto`;
        gridEl.style.gridTemplateRows = `repeat(${size}, 1fr) auto`;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const val = engine.grid[r][c];
                const num = engine.numbers[r][c];
                const isLocked = engine.locked[r][c];

                const cellEl = document.createElement('div');
                cellEl.className = 'sumgrid-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;
                cellEl.setAttribute('role', 'button');
                cellEl.setAttribute('aria-label', `Zeile ${r + 1}, Spalte ${c + 1}: ${num}`);

                if (isLocked) cellEl.classList.add('locked');

                // Auswahl & Hints
                if (selCell && selCell.r === r && selCell.c === c) {
                    cellEl.classList.add('selected');
                }
                if (hintCell && hintCell.r === r && hintCell.c === c) {
                    cellEl.classList.add('hint-shimmer');
                }

                // Zustand
                if (state.solutionRevealed && solution) {
                    const shouldKeep = solution[r][c] === 1;
                    if (shouldKeep) {
                        cellEl.classList.add('cell-keep', 'revealed-keep');
                    } else {
                        cellEl.classList.add('cell-cross', 'revealed-cross');
                    }
                } else if (val === SUMGRID_KEEP) {
                    cellEl.classList.add('cell-keep');
                } else if (val === SUMGRID_CROSS) {
                    cellEl.classList.add('cell-cross');
                } else {
                    cellEl.classList.add('cell-neutral');
                }

                // Kachelinhalt: Zahl
                const numSpan = document.createElement('span');
                numSpan.className = 'cell-num';
                numSpan.textContent = num;
                cellEl.appendChild(numSpan);

                // Notizen / Indikatoren
                if (engine.notes[r][c].size > 0 && val === SUMGRID_NEUTRAL) {
                    const noteDot = document.createElement('span');
                    noteDot.className = 'cell-note-dot';
                    cellEl.appendChild(noteDot);
                }

                if (typeof onCellInteraction === 'function') {
                    onCellInteraction(cellEl, r, c);
                }

                gridEl.appendChild(cellEl);
            }

            // Zeilenziel-Badge am rechten Rand
            const rowTargetBox = document.createElement('div');
            rowTargetBox.className = 'sumgrid-target row-target';
            const rowTarget = engine.getRowTarget(r);
            const rowCurrent = engine.getRowSum(r);
            const isRowSat = engine.isRowSatisfied(r);
            const isRowExc = engine.isRowExceeded(r);

            if (isRowSat) {
                rowTargetBox.classList.add('target-satisfied');
            } else if (isRowExc) {
                rowTargetBox.classList.add('target-exceeded');
            } else {
                rowTargetBox.classList.add('target-pending');
            }

            rowTargetBox.innerHTML = `
                <span class="target-val">${rowTarget}</span>
                ${isRowSat ? '<span class="target-status-icon">✓</span>' : ''}
                ${isRowExc ? '<span class="target-status-icon">⚠️</span>' : ''}
            `;
            gridEl.appendChild(rowTargetBox);
        }

        // Unterste Reihe: Spalten-Ziele
        for (let c = 0; c < size; c++) {
            const colTargetBox = document.createElement('div');
            colTargetBox.className = 'sumgrid-target col-target';
            const colTarget = engine.getColTarget(c);
            const colCurrent = engine.getColSum(c);
            const isColSat = engine.isColSatisfied(c);
            const isColExc = engine.isColExceeded(c);

            if (isColSat) {
                colTargetBox.classList.add('target-satisfied');
            } else if (isColExc) {
                colTargetBox.classList.add('target-exceeded');
            } else {
                colTargetBox.classList.add('target-pending');
            }

            colTargetBox.innerHTML = `
                <span class="target-val">${colTarget}</span>
                ${isColSat ? '<span class="target-status-icon">✓</span>' : ''}
                ${isColExc ? '<span class="target-status-icon">⚠️</span>' : ''}
            `;
            gridEl.appendChild(colTargetBox);
        }

        // Ecke unten-rechts: Corner-Badge
        const cornerBox = document.createElement('div');
        cornerBox.className = 'sumgrid-corner';
        cornerBox.innerHTML = '<span class="corner-icon">🧮</span>';
        gridEl.appendChild(cornerBox);

        boardWrapper.appendChild(gridEl);
        container.appendChild(boardWrapper);
    }

    static renderKeypad(container, engine, state, onKeyInput) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        container.className = 'game-keypad sumgrid-keypad';

        // 1. Button: Behalten (Zählt zur Summe)
        const btnKeep = document.createElement('button');
        btnKeep.type = 'button';
        btnKeep.className = 'keypad-btn sumgrid-key-btn key-keep';
        btnKeep.innerHTML = '<span class="key-icon">🟢</span><span class="key-label">Behalten</span>';
        btnKeep.addEventListener('click', () => onKeyInput && onKeyInput(SUMGRID_KEEP));
        container.appendChild(btnKeep);

        // 2. Button: Streichen (Ausgeschlossen)
        const btnCross = document.createElement('button');
        btnCross.type = 'button';
        btnCross.className = 'keypad-btn sumgrid-key-btn key-cross';
        btnCross.innerHTML = '<span class="key-icon">✕</span><span class="key-label">Streichen</span>';
        btnCross.addEventListener('click', () => onKeyInput && onKeyInput(SUMGRID_CROSS));
        container.appendChild(btnCross);

        // 3. Button: Zurücksetzen / Neutral
        const btnClear = document.createElement('button');
        btnClear.type = 'button';
        btnClear.className = 'keypad-btn sumgrid-key-btn key-clear';
        btnClear.innerHTML = '<span class="key-icon">↺</span><span class="key-label">Leeren</span>';
        btnClear.addEventListener('click', () => onKeyInput && onKeyInput(SUMGRID_NEUTRAL));
        container.appendChild(btnClear);
    }

    static getRulesHtml(lang = 'de') {
        if (lang === 'en') {
            return `
                <div class="rules-container">
                    <div class="rule-box">
                        <div class="rule-badge">1</div>
                        <div class="rule-content">
                            <strong>Target sums for rows &amp; columns</strong>
                            <p>Each row and column displays a target sum at the border that must be reached by the active numbers.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">2</div>
                        <div class="rule-content">
                            <strong>Keep or cross out numbers</strong>
                            <p>Tap a number once to keep it (counts towards the sum), tap again to cross it out (does not count).</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">3</div>
                        <div class="rule-content">
                            <strong>Exact match required</strong>
                            <p>A row or column turns green once its active numbers add up to the exact target sum. Avoid exceeding the target.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">4</div>
                        <div class="rule-content">
                            <strong>Deduction &amp; cross-influence</strong>
                            <p>Every decision in a row affects the corresponding column. Use logic to eliminate invalid numbers step by step.</p>
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
                        <strong>Zielsummen für Zeilen &amp; Spalten</strong>
                        <p>Am Rand jeder Zeile und jeder Spalte steht eine vorgegebene Zielsumme, die exakt erreicht werden muss.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">2</div>
                    <div class="rule-content">
                        <strong>Zahlen behalten oder streichen</strong>
                        <p>Tippe auf eine Zahl, um sie zu behalten (zählt zur Summe). Ein weiterer Tipp streicht die Zahl durch (zählt nicht).</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">3</div>
                    <div class="rule-content">
                        <strong>Exakte Treffer ohne Überhang</strong>
                        <p>Erreicht eine Zeile oder Spalte exakt ihr Ziel, leuchtet sie grün auf. Überschreitungen werden farblich gewarnt.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">4</div>
                    <div class="rule-content">
                        <strong>Wechselwirkung nutzen</strong>
                        <p>Jede Entscheidung in einer Zeile beeinflusst auch die jeweilige Spalte. Finde durch logischen Ausschluss die eindeutige Lösung.</p>
                    </div>
                </div>
            </div>
        `;
    }
}
