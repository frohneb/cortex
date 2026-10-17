/**
 * Futoshiki Visual Renderer
 * Zeichnet das (2N-1)×(2N-1) CSS-Grid mit Ziffernzellen, horizontalen & vertikalen
 * Ungleichungs-Pfeilen, Notizen-Minigrid, Keypad und didaktischem Regeltext.
 */

import {
    FutoshikiEngine,
    FUTOSHIKI_EMPTY,
    CONSTRAINT_NONE,
    CONSTRAINT_LT,
    CONSTRAINT_GT
} from './engine.js';

export function getFutoshikiLtSvg(extraClass = '') {
    return `<svg class="futoshiki-arrow-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.5 5.5L9 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

export function getFutoshikiGtSvg(extraClass = '') {
    return `<svg class="futoshiki-arrow-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.5 5.5L15 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

export function getFutoshikiUpSvg(extraClass = '') {
    return `<svg class="futoshiki-arrow-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.5 15.5L12 9l6.5 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

export function getFutoshikiDownSvg(extraClass = '') {
    return `<svg class="futoshiki-arrow-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.5 8.5L12 15l6.5-6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

export class FutoshikiRenderer {
    static getSymbolSvg(val, extraClass = '') {
        return `<span class="futoshiki-symbol ${extraClass}">${val || ''}</span>`;
    }

    /**
     * Zählt die noch zu platzierenden Instanzen einer Ziffer
     */
    static countRemaining(engine, digit) {
        let placed = 0;
        for (let r = 0; r < engine.size; r++) {
            for (let c = 0; c < engine.size; c++) {
                if (engine.grid[r][c] === digit) placed++;
            }
        }
        return Math.max(0, engine.size - placed);
    }

    /**
     * Rendert das Futoshiki-Board
     */
    static renderBoard(container, engine, state, onCellInteraction) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const size = engine.size;
        const totalGridDims = size * 2 - 1;

        const boardWrap = document.createElement('div');
        boardWrap.className = `futoshiki-board-wrapper futoshiki-size-${size}`;
        boardWrap.id = 'futoshikiBoard';

        const gridEl = document.createElement('div');
        gridEl.className = 'futoshiki-grid';
        gridEl.style.setProperty('--futoshiki-size', size);

        // Template: abwechselnd Zellen (1fr) und Kanten-Slots (auto)
        const colsTemplate = [];
        const rowsTemplate = [];
        for (let i = 0; i < totalGridDims; i++) {
            if (i % 2 === 0) {
                colsTemplate.push('minmax(0, 1fr)');
                rowsTemplate.push('minmax(0, 1fr)');
            } else {
                colsTemplate.push('auto');
                rowsTemplate.push('auto');
            }
        }
        gridEl.style.gridTemplateColumns = colsTemplate.join(' ');
        gridEl.style.gridTemplateRows = rowsTemplate.join(' ');

        // Validierung und Konflikte
        const validation = state.autoCheck ? engine.validateRules() : {
            rowErrors: [],
            colErrors: [],
            constraintErrors: []
        };

        const conflictCells = new Set();
        if (state.autoCheck) {
            for (const re of validation.rowErrors) {
                for (const col of re.dupCols) conflictCells.add(`${re.r},${col}`);
            }
            for (const ce of validation.colErrors) {
                for (const row of ce.dupRows) conflictCells.add(`${row},${ce.c}`);
            }
        }

        const solution = state.solutionRevealed ? engine.getSolution() : null;
        const selectedCell = !state.solutionRevealed ? state.selectedCell : null;

        for (let gridRow = 0; gridRow < totalGridDims; gridRow++) {
            for (let gridCol = 0; gridCol < totalGridDims; gridCol++) {
                const isCellRow = gridRow % 2 === 0;
                const isCellCol = gridCol % 2 === 0;

                // 1. ZIFFER-ZELLE
                if (isCellRow && isCellCol) {
                    const r = gridRow / 2;
                    const c = gridCol / 2;
                    const val = engine.grid[r][c];
                    const isLocked = engine.isLocked(r, c);

                    const cellEl = document.createElement('div');
                    cellEl.className = 'grid-cell futoshiki-cell';
                    cellEl.dataset.r = r;
                    cellEl.dataset.c = c;
                    cellEl.style.gridRow = `${gridRow + 1}`;
                    cellEl.style.gridColumn = `${gridCol + 1}`;

                    if (isLocked) cellEl.classList.add('cell-locked');
                    const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                    const isRelated = selectedCell && (selectedCell.r === r || selectedCell.c === c) && !isSelected;
                    const isSameVal = selectedCell && val > 0 && engine.grid[selectedCell.r][selectedCell.c] === val;
                    const isConflict = conflictCells.has(`${r},${c}`);

                    const isHintTarget = !state.solutionRevealed && state.currentHint &&
                        state.currentHint.highlightCells &&
                        state.currentHint.highlightCells.some(h => h.r === r && h.c === c);

                    if (isSelected) cellEl.classList.add('selected');
                    if (isRelated) cellEl.classList.add('highlight-related');
                    if (isSameVal) cellEl.classList.add('highlight-same-val');
                    if (isConflict) cellEl.classList.add('conflict');
                    if (isHintTarget) cellEl.classList.add('hint-target');

                    // Lösungsaufdeckung
                    if (state.solutionRevealed && solution) {
                        const solVal = solution[r][c];
                        if (val === solVal) {
                            cellEl.classList.add('cell-revealed-correct');
                            cellEl.innerHTML = `<span class="val-digit">${val}</span>`;
                        } else if (val === FUTOSHIKI_EMPTY) {
                            cellEl.classList.add('cell-revealed-solution');
                            cellEl.innerHTML = `<span class="ghost-digit">${solVal}</span>`;
                        } else {
                            cellEl.classList.add('cell-revealed-error');
                            cellEl.innerHTML = `<span class="wrong-val">${val}</span><span class="correct-sub">${solVal}</span>`;
                        }
                    } else if (val > 0) {
                        cellEl.classList.add('val-placed');
                        const span = document.createElement('span');
                        span.className = 'val-digit';
                        span.textContent = val;
                        cellEl.appendChild(span);
                    } else {
                        // Notizen
                        const notes = engine.notes[r][c];
                        if (notes && notes.size > 0) {
                            const noteGrid = document.createElement('div');
                            noteGrid.className = `futoshiki-note-grid grid-${size}`;
                            for (let n = 1; n <= size; n++) {
                                const nSpan = document.createElement('span');
                                nSpan.className = 'note-digit';
                                nSpan.textContent = notes.has(n) ? n : '';
                                noteGrid.appendChild(nSpan);
                            }
                            cellEl.appendChild(noteGrid);
                        }
                    }

                    if (typeof onCellInteraction === 'function') {
                        onCellInteraction(cellEl, r, c);
                    }

                    gridEl.appendChild(cellEl);
                }
                // 2. HORIZONTALE UNGLEICHUNG (zwischen r, c und r, c+1)
                else if (isCellRow && !isCellCol) {
                    const r = gridRow / 2;
                    const c = (gridCol - 1) / 2;
                    const rel = engine.getConstraintH(r, c);

                    const hEl = document.createElement('div');
                    hEl.className = 'futoshiki-constraint-h';
                    hEl.style.gridRow = `${gridRow + 1}`;
                    hEl.style.gridColumn = `${gridCol + 1}`;

                    if (rel === CONSTRAINT_LT) {
                        hEl.innerHTML = getFutoshikiLtSvg();
                    } else if (rel === CONSTRAINT_GT) {
                        hEl.innerHTML = getFutoshikiGtSvg();
                    }

                    // Prüfung auf Verletzung
                    if (state.autoCheck && rel) {
                        const v1 = engine.grid[r][c];
                        const v2 = engine.grid[r][c + 1];
                        if (v1 > 0 && v2 > 0) {
                            if ((rel === CONSTRAINT_LT && !(v1 < v2)) || (rel === CONSTRAINT_GT && !(v1 > v2))) {
                                hEl.classList.add('violated');
                            }
                        }
                    }

                    gridEl.appendChild(hEl);
                }
                // 3. VERTIKALE UNGLEICHUNG (zwischen r, c und r+1, c)
                else if (!isCellRow && isCellCol) {
                    const r = (gridRow - 1) / 2;
                    const c = gridCol / 2;
                    const rel = engine.getConstraintV(r, c);

                    const vEl = document.createElement('div');
                    vEl.className = 'futoshiki-constraint-v';
                    vEl.style.gridRow = `${gridRow + 1}`;
                    vEl.style.gridColumn = `${gridCol + 1}`;

                    if (rel === CONSTRAINT_LT) {
                        vEl.innerHTML = getFutoshikiUpSvg(); // oben < unten
                    } else if (rel === CONSTRAINT_GT) {
                        vEl.innerHTML = getFutoshikiDownSvg(); // oben > unten
                    }

                    // Prüfung auf Verletzung
                    if (state.autoCheck && rel) {
                        const v1 = engine.grid[r][c];
                        const v2 = engine.grid[r + 1][c];
                        if (v1 > 0 && v2 > 0) {
                            if ((rel === CONSTRAINT_LT && !(v1 < v2)) || (rel === CONSTRAINT_GT && !(v1 > v2))) {
                                vEl.classList.add('violated');
                            }
                        }
                    }

                    gridEl.appendChild(vEl);
                }
                // 4. KREUZUNGS-ECKE (Platzhalter)
                else {
                    const cornerEl = document.createElement('div');
                    cornerEl.className = 'futoshiki-corner-slot';
                    cornerEl.style.gridRow = `${gridRow + 1}`;
                    cornerEl.style.gridColumn = `${gridCol + 1}`;
                    gridEl.appendChild(cornerEl);
                }
            }
        }

        boardWrap.appendChild(gridEl);
        container.appendChild(boardWrap);
    }

    /**
     * Keypad-Rendering (Ziffern 1..N + Löschen)
     */
    static renderKeypad(container, engine, state, onKeyInput) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const size = engine.size;
        const keypadWrap = document.createElement('div');
        keypadWrap.className = 'futoshiki-keypad';

        // Ziffern-Buttons 1..N
        for (let v = 1; v <= size; v++) {
            const btn = document.createElement('button');
            btn.className = 'keypad-btn futoshiki-key';
            btn.dataset.val = v;

            const remaining = FutoshikiRenderer.countRemaining(engine, v);
            if (remaining === 0) btn.classList.add('completed-digit');

            const dSpan = document.createElement('span');
            dSpan.className = 'key-digit';
            dSpan.textContent = v;
            btn.appendChild(dSpan);

            const rSpan = document.createElement('span');
            rSpan.className = 'key-remaining';
            rSpan.textContent = remaining;
            btn.appendChild(rSpan);

            btn.addEventListener('click', () => {
                if (typeof onKeyInput === 'function') onKeyInput(v);
            });
            keypadWrap.appendChild(btn);
        }

        // Löschen-Button
        const btnClear = document.createElement('button');
        btnClear.className = 'keypad-btn futoshiki-key key-clear';
        btnClear.id = 'futoshikiKeypadClear';
        btnClear.setAttribute('aria-label', 'Löschen');

        const clearSpan = document.createElement('span');
        clearSpan.className = 'key-digit';
        clearSpan.textContent = '✕';
        btnClear.appendChild(clearSpan);

        btnClear.addEventListener('click', () => {
            if (typeof onKeyInput === 'function') onKeyInput(FUTOSHIKI_EMPTY);
        });
        keypadWrap.appendChild(btnClear);

        container.appendChild(keypadWrap);
    }

    /**
     * Spielregeln im Modal
     */
    static getRules(lang = 'de') {
        if (lang === 'en') {
            return `<div class="rules-content">
                <h3>Futoshiki Rules</h3>
                <ul>
                    <li><strong>Latin Square:</strong> Fill the grid so that each row and column contains the numbers 1 to N exactly once.</li>
                    <li><strong>Inequalities:</strong> Greater-than (&gt;) and less-than (&lt;) symbols indicate the relative value of adjacent cells.</li>
                    <li><strong>Clues:</strong> Some digits are given at the start and cannot be changed.</li>
                </ul>
            </div>`;
        }
        return `<div class="rules-content">
            <h3>Futoshiki Regeln</h3>
            <ul>
                <li><strong>Lateinisches Quadrat:</strong> Fülle das Gitter so aus, dass in jeder Zeile und jeder Spalte jede Zahl von 1 bis N genau einmal vorkommt.</li>
                <li><strong>Ungleichungen:</strong> Die Pfeilsymbole (&lt;, &gt;, ∧, ∨) zeigen an, welches der beiden benachbarten Felder größer bzw. kleiner sein muss.</li>
                <li><strong>Vorgegebene Zahlen:</strong> Vorgegebene Startzahlen sind fixiert und können nicht verändert werden.</li>
            </ul>
        </div>`;
    }
}
