/**
 * Akari (Light Up) DOM Renderer & SVG Asset Generator
 * Rendert das Gitter mit dynamischen Lichtstrahlen, Wänden,
 * SVG-Glühbirnen, Konflikt-Hervorhebungen und Theme-Effekten.
 */

import { AKARI_EMPTY, AKARI_BULB, AKARI_DOT } from './engine.js';
import { t } from '../../shared/i18n.js';

export class AkariRenderer {
    /**
     * Rendert das vollständige Akari-Board in den Zielcontainer
     */
    static renderBoard(container, engine, state, onCellInteraction) {
        container.innerHTML = '';

        const gridEl = document.createElement('div');
        gridEl.className = `akari-grid size-${engine.size}`;
        gridEl.style.display = 'grid';
        gridEl.style.gridTemplateColumns = `repeat(${engine.cols}, 1fr)`;
        gridEl.style.gridTemplateRows = `repeat(${engine.rows}, 1fr)`;

        const validation = engine.validateRules();
        let illumination = validation.illumination;
        const solution = state.solutionRevealed ? (engine.getSolution ? engine.getSolution() : engine.solution) : null;

        if (state.solutionRevealed && solution) {
            const solIllum = Array.from({ length: engine.rows }, () => Array(engine.cols).fill(0));
            for (let r = 0; r < engine.rows; r++) {
                for (let c = 0; c < engine.cols; c++) {
                    if (solution[r][c] === 1 && !engine.isWall(r, c)) {
                        solIllum[r][c]++;
                        for (let rr = r - 1; rr >= 0 && !engine.isWall(rr, c); rr--) solIllum[rr][c]++;
                        for (let rr = r + 1; rr < engine.rows && !engine.isWall(rr, c); rr++) solIllum[rr][c]++;
                        for (let cc = c - 1; cc >= 0 && !engine.isWall(r, cc); cc--) solIllum[r][cc]++;
                        for (let cc = c + 1; cc < engine.cols && !engine.isWall(r, cc); cc++) solIllum[r][cc]++;
                    }
                }
            }
            illumination = solIllum;
        }

        for (let r = 0; r < engine.rows; r++) {
            for (let c = 0; c < engine.cols; c++) {
                const cellEl = document.createElement('div');
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                if (engine.isWall(r, c)) {
                    // Schwarze Wand
                    cellEl.className = 'akari-cell akari-wall';
                    const clue = engine.getWallClue(r, c);

                    if (clue !== null && clue >= 0) {
                        cellEl.classList.add('wall-numbered');
                        if (state.solutionRevealed || validation.wallSatisfied.has(`${r},${c}`)) {
                            cellEl.classList.add('wall-satisfied');
                        } else if (validation.wallErrors.has(`${r},${c}`)) {
                            cellEl.classList.add('wall-error');
                        }
                        cellEl.innerHTML = `<span class="wall-clue-digit">${clue}</span>`;
                    }
                } else {
                    // Weißes Feld
                    cellEl.className = 'akari-cell akari-white';
                    const cellVal = engine.grid[r][c];
                    const isLit = illumination[r][c] > 0;

                    if (isLit) {
                        cellEl.classList.add('is-lit');
                    }

                    if (state.solutionRevealed && solution) {
                        const solVal = solution[r][c] === 1 ? AKARI_BULB : AKARI_DOT;
                        if (cellVal === AKARI_EMPTY) {
                            cellEl.classList.add('cell-revealed-solution');
                            if (solVal === AKARI_BULB) {
                                cellEl.classList.add('is-bulb', 'revealed-ghost');
                                cellEl.innerHTML = this.getSymbolSvg(AKARI_BULB, 'akari-bulb-svg ghost-bulb');
                            } else {
                                cellEl.classList.add('is-dot', 'revealed-ghost');
                                cellEl.innerHTML = this.getSymbolSvg(AKARI_DOT, 'akari-dot-svg ghost-dot');
                            }
                        } else if (cellVal === solVal) {
                            cellEl.classList.add('cell-revealed-correct');
                            if (cellVal === AKARI_BULB) {
                                cellEl.classList.add('is-bulb');
                                cellEl.innerHTML = this.getSymbolSvg(AKARI_BULB, 'akari-bulb-svg');
                            } else {
                                cellEl.classList.add('is-dot');
                                cellEl.innerHTML = this.getSymbolSvg(AKARI_DOT, 'akari-dot-svg');
                            }
                        } else {
                            cellEl.classList.add('cell-revealed-error');
                            if (cellVal === AKARI_BULB) {
                                cellEl.innerHTML = `
                                    <span class="wrong-marker-cross">✕</span>
                                    ${this.getSymbolSvg(AKARI_BULB, 'akari-bulb-svg wrong-bulb')}
                                    <div class="revealed-correct-sub">
                                        <span class="mini-badge">•</span>
                                    </div>
                                `;
                            } else {
                                cellEl.innerHTML = `
                                    <span class="wrong-marker-cross">✕</span>
                                    ${this.getSymbolSvg(AKARI_DOT, 'akari-dot-svg wrong-dot')}
                                    <div class="revealed-correct-sub">
                                        <span class="mini-badge">💡</span>
                                    </div>
                                `;
                            }
                        }
                    } else {
                        if (cellVal === AKARI_BULB) {
                            cellEl.classList.add('is-bulb');
                            if (validation.conflicts.has(`${r},${c}`)) {
                                cellEl.classList.add('has-conflict');
                            }
                            cellEl.innerHTML = this.getSymbolSvg(AKARI_BULB, 'akari-bulb-svg');
                        } else if (cellVal === AKARI_DOT) {
                            cellEl.classList.add('is-dot');
                            cellEl.innerHTML = this.getSymbolSvg(AKARI_DOT, 'akari-dot-svg');
                        } else if (engine.notes[r][c] && engine.notes[r][c].has(AKARI_DOT)) {
                            cellEl.classList.add('is-note-dot');
                            cellEl.innerHTML = `<span class="mini-dot">•</span>`;
                        }

                        // Selektion / Fokus
                        if (state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c) {
                            cellEl.classList.add('selected');
                        }

                        // Hinweis-Animation
                        if (state.hintPlacedCell && state.hintPlacedCell.r === r && state.hintPlacedCell.c === c) {
                            cellEl.classList.add('hint-pulse');
                        }

                        // Interaktion verbinden
                        if (typeof onCellInteraction === 'function') {
                            onCellInteraction(cellEl, r, c);
                        }
                    }
                }

                gridEl.appendChild(cellEl);
            }
        }

        container.appendChild(gridEl);
    }

    /**
     * Rendert das optionale Keypad / Aktionsleiste
     */
    static renderKeypad(container, engine, state, onKeyInput) {
        container.innerHTML = '';

        const keypad = document.createElement('div');
        keypad.className = 'akari-keypad';

        // 1. Glühbirne (💡)
        const btnBulb = document.createElement('button');
        btnBulb.className = 'akari-key-btn key-bulb';
        btnBulb.setAttribute('aria-label', 'Glühbirne');
        btnBulb.innerHTML = `${this.getSymbolSvg(AKARI_BULB, '', 22)}<span class="key-lbl">Lampe</span>`;
        btnBulb.addEventListener('click', () => onKeyInput(AKARI_BULB));

        // 2. Punkt (•)
        const btnDot = document.createElement('button');
        btnDot.className = 'akari-key-btn key-dot';
        btnDot.setAttribute('aria-label', 'Punkt');
        btnDot.innerHTML = `${this.getSymbolSvg(AKARI_DOT, '', 16)}<span class="key-lbl">Punkt</span>`;
        btnDot.addEventListener('click', () => onKeyInput(AKARI_DOT));

        // 3. Löschen (✕)
        const btnClear = document.createElement('button');
        btnClear.className = 'akari-key-btn key-clear';
        btnClear.setAttribute('aria-label', 'Löschen');
        btnClear.innerHTML = `<span style="font-size: 1.2rem; line-height:1;">✕</span><span class="key-lbl">Leeren</span>`;
        btnClear.addEventListener('click', () => onKeyInput(AKARI_EMPTY));

        keypad.appendChild(btnBulb);
        keypad.appendChild(btnDot);
        keypad.appendChild(btnClear);

        container.appendChild(keypad);
    }

    /**
     * Liefert optimierte SVG-Symbole für Glühbirnen und Marker
     */
    static getSymbolSvg(val, extraClass = '', size = 24) {
        if (val === AKARI_BULB) {
            return `
                <svg class="akari-symbol akari-bulb ${extraClass}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">
                    <!-- Glühbirnen-Kontur & Sockel -->
                    <path d="M9 21h6m-5 0v-1.5m4 1.5v-1.5M8 17h8m-9-6a5 5 0 1 1 10 0c0 2-1 3.5-1.8 4.5-.4.5-.6 1.5-.6 2.5H9.4c0-1-.2-2-.6-2.5C8 14.5 7 13 7 11z" 
                          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <!-- Glühfaden / Glow Kern -->
                    <path d="M10 11a2 2 0 0 1 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <!-- Lichtstrahlen-Akzente -->
                    <circle cx="12" cy="11" r="2" fill="currentColor" opacity="0.6"/>
                </svg>
            `;
        }

        if (val === AKARI_DOT) {
            return `
                <svg class="akari-symbol akari-dot ${extraClass}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">
                    <circle cx="12" cy="12" r="4.5" fill="currentColor"/>
                </svg>
            `;
        }

        return '';
    }

    /**
     * Erzeugt das HTML für das Regeln-Modal
     */
    static getRulesHtml(lang = 'de') {
        if (lang === 'en') {
            return `
                <div class="rules-container">
                    <div class="rule-box">
                        <div class="rule-badge">1</div>
                        <div class="rule-content">
                            <strong>Light up all White Cells</strong>
                            <p>Place light bulbs (💡) on white cells. Light rays travel horizontally and vertically until they hit a black wall or the grid boundary.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">2</div>
                        <div class="rule-content">
                            <strong>No Bulb Clashes</strong>
                            <p>No two light bulbs may illuminate each other. A bulb cannot be in the direct line of sight of another bulb.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">3</div>
                        <div class="rule-content">
                            <strong>Wall Numbers (0 to 4)</strong>
                            <p>A number on a black wall indicates exactly how many light bulbs must be placed in its orthogonally adjacent neighbors (up, down, left, right).</p>
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
                        <strong>Vollständige Ausleuchtung</strong>
                        <p>Platziere Glühlampen (💡) auf weißen Feldern. Jede Lampe sendet Lichtstrahlen horizontal und vertikal aus, bis sie auf eine schwarze Wand oder den Außenrand trifft. Alle weißen Felder müssen erleuchtet sein.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">2</div>
                    <div class="rule-content">
                        <strong>Kein Blenden (Keine Kollisionen)</strong>
                        <p>Zwei Glühlampen dürfen sich niemals gegenseitig anstrahlen. Zwischen zwei Lampen in derselben Zeile oder Spalte muss sich mindestens eine schwarze Wand befinden.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">3</div>
                    <div class="rule-content">
                        <strong>Wand-Zahlen (0 bis 4)</strong>
                        <p>Eine Zahl auf einem schwarzen Block gibt exakt an, wie viele Glühlampen sich auf den direkt orthogonal angrenzenden Feldern (oben, unten, links, rechts) befinden müssen. Wände ohne Zahl haben keine Einschränkung.</p>
                    </div>
                </div>
            </div>
        `;
    }
}
