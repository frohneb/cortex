/**
 * Minesweeper Visual Renderer
 * Zeichnet das Minenfeld, Zellzustände (verdeckt, aufgedeckt, Flaggen, Minen, Explosionen),
 * Zahlenfarben und Animationen.
 */

import { CELL_HIDDEN, CELL_REVEALED, CELL_FLAGGED, CELL_EXPLODED } from './engine.js';
import { MINESWEEPER_I18N } from './data/i18n.js';

export function getFlagSvg(extraClass = '') {
    return `<svg class="minesweeper-symbol minesweeper-flag ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="#ef4444" stroke="#ef4444" />
        <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" stroke-width="2.5" />
    </svg>`;
}

export function getMineSvg(extraClass = '') {
    return `<svg class="minesweeper-symbol minesweeper-mine ${extraClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="6" fill="currentColor"/>
        <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="10" cy="10" r="1.5" fill="#ffffff" opacity="0.8"/>
    </svg>`;
}

export function getExplosionSvg(extraClass = '') {
    return `<svg class="minesweeper-symbol minesweeper-explosion ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 2l2.4 5.6L20 8l-4 4.5 1.2 5.9-5.2-3.2L6.8 18.4 8 12.5 4 8l5.6-.4L12 2z" fill="#f97316" stroke="#ef4444"/>
        <circle cx="12" cy="12" r="3" fill="#fbbf24"/>
    </svg>`;
}

export class MinesweeperRenderer {
    static getSymbolSvg(val, extraClass = '') {
        if (val === 'flag' || val === CELL_FLAGGED) return getFlagSvg(extraClass);
        if (val === 'mine' || val === CELL_EXPLODED) return getMineSvg(extraClass);
        return '';
    }

    static renderBoard(container, engine, state, onCellInteraction) {
        if (!container || !engine) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const rows = engine.rows;
        const cols = engine.cols;

        const gridEl = document.createElement('div');
        gridEl.className = `minesweeper-grid size-${rows}x${cols}`;
        gridEl.style.setProperty('--grid-rows', rows);
        gridEl.style.setProperty('--grid-cols', cols);

        const isGameOver = engine.status === 'lost' || state.solutionRevealed;
        const isGameWon = engine.status === 'won';

        for (let r = 0; r < rows; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'grid-row minesweeper-row';

            for (let c = 0; c < cols; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'grid-cell minesweeper-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                const val = engine.grid[r][c];
                const isMine = engine.mines[r][c];
                const adj = engine.adjacency[r][c];

                const isSelected = !isGameOver && state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c;
                const isHintShimmer = !isGameOver && state.hintPlacedCell && state.hintPlacedCell.r === r && state.hintPlacedCell.c === c;

                if (isSelected) cellEl.classList.add('selected');
                if (isHintShimmer) cellEl.classList.add('hint-shimmer');

                if (isGameOver) {
                    // Spielende durch Mine oder Lösung anzeigen
                    if (val === CELL_EXPLODED) {
                        cellEl.classList.add('cell-exploded');
                        cellEl.innerHTML = getExplosionSvg('icon-exploded');
                    } else if (isMine) {
                        if (val === CELL_FLAGGED) {
                            cellEl.classList.add('cell-flagged', 'cell-flagged-correct');
                            cellEl.innerHTML = getFlagSvg('icon-flag');
                        } else {
                            cellEl.classList.add('cell-mine-revealed');
                            cellEl.innerHTML = getMineSvg('icon-mine');
                        }
                    } else if (val === CELL_FLAGGED && !isMine) {
                        // Falsch gesetzte Flagge
                        cellEl.classList.add('cell-flagged-wrong');
                        cellEl.innerHTML = `<span class="wrong-flag-cross">✕</span>${getFlagSvg('icon-flag-dim')}`;
                    } else if (val === CELL_REVEALED) {
                        cellEl.classList.add('cell-revealed');
                        if (adj > 0) {
                            cellEl.classList.add(`mine-count-${adj}`);
                            cellEl.innerHTML = `<span class="cell-number">${adj}</span>`;
                        }
                    } else {
                        // Verdeckt gebliebene sichere Zelle
                        cellEl.classList.add('cell-hidden-over');
                        if (adj > 0) {
                            cellEl.innerHTML = `<span class="cell-ghost-number">${adj}</span>`;
                        }
                    }
                } else if (isGameWon) {
                    // Gewonnen!
                    if (isMine) {
                        cellEl.classList.add('cell-flagged', 'cell-won');
                        cellEl.innerHTML = getFlagSvg('icon-flag');
                    } else {
                        cellEl.classList.add('cell-revealed');
                        if (adj > 0) {
                            cellEl.classList.add(`mine-count-${adj}`);
                            cellEl.innerHTML = `<span class="cell-number">${adj}</span>`;
                        }
                    }
                } else {
                    // Regulärer Spielzustand
                    if (val === CELL_REVEALED) {
                        cellEl.classList.add('cell-revealed');
                        if (adj > 0) {
                            cellEl.classList.add(`mine-count-${adj}`);
                            cellEl.innerHTML = `<span class="cell-number">${adj}</span>`;
                        }
                    } else if (val === CELL_FLAGGED) {
                        cellEl.classList.add('cell-flagged');
                        cellEl.innerHTML = getFlagSvg('icon-flag');
                    } else {
                        // CELL_HIDDEN
                        cellEl.classList.add('cell-hidden');
                    }
                }

                if (typeof onCellInteraction === 'function') {
                    onCellInteraction(cellEl, r, c);
                }

                rowEl.appendChild(cellEl);
            }
            gridEl.appendChild(rowEl);
        }

        container.appendChild(gridEl);
    }

    static renderKeypad(container, engine, state, onKeyInput) {
        if (!container) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        const pad = document.createElement('div');
        pad.className = 'minesweeper-keypad';

        const btnReveal = document.createElement('button');
        btnReveal.className = 'minesweeper-action-btn reveal-btn active';
        btnReveal.innerHTML = `<span class="btn-icon">⛏️</span><span class="btn-label">Aufdecken</span>`;
        btnReveal.addEventListener('click', () => {
            if (typeof onKeyInput === 'function') onKeyInput(CELL_REVEALED);
        });

        const btnFlag = document.createElement('button');
        btnFlag.className = 'minesweeper-action-btn flag-btn';
        btnFlag.innerHTML = `<span class="btn-icon">🚩</span><span class="btn-label">Flagge</span>`;
        btnFlag.addEventListener('click', () => {
            if (typeof onKeyInput === 'function') onKeyInput(CELL_FLAGGED);
        });

        pad.appendChild(btnReveal);
        pad.appendChild(btnFlag);
        container.appendChild(pad);
    }

    static getRulesHtml(lang = 'de') {
        const t = MINESWEEPER_I18N[lang] || MINESWEEPER_I18N.de;
        return `
            <div class="rules-modal-content minesweeper-rules">
                <h3>${t.minesweeper_rules_title}</h3>
                <p>${t.minesweeper_rules_p1}</p>
                <ul>
                    <li><strong>Zahlen:</strong> ${t.minesweeper_rules_p2}</li>
                    <li><strong>0er-Kettenreaktion:</strong> ${t.minesweeper_rules_p3}</li>
                    <li><strong>Flaggen:</strong> ${t.minesweeper_rules_p4}</li>
                </ul>
                <div class="rules-example-box" style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                    <div class="minesweeper-cell cell-revealed mine-count-1" style="width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-weight:bold; font-size:1.4rem;">1</div>
                    <div class="minesweeper-cell cell-revealed mine-count-2" style="width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-weight:bold; font-size:1.4rem;">2</div>
                    <div class="minesweeper-cell cell-revealed mine-count-3" style="width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-weight:bold; font-size:1.4rem;">3</div>
                    <div class="minesweeper-cell cell-flagged" style="width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; border-radius:6px;">${getFlagSvg('')}</div>
                </div>
            </div>
        `;
    }
}
