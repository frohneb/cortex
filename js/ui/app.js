/**
 * Tango Main UI Controller
 * Verbindet Spiellogik, Rendering, Touch-Interaktion, Audio und Lokalisierung.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE, TangoEngine } from '../core/engine.js';
import { TangoSolver } from '../core/solver.js';
import { TUTORIAL_STEPS } from '../data/tutorial.js';
import { TUTORIAL_PRO_STEPS } from '../data/tutorial_pro.js';
import { getCampaignLevel, getDailyPuzzle } from '../data/levels.js';
import { t, setLang, getLang } from '../data/i18n.js';
import { audio } from './audio.js';
import { animations } from './animations.js';

export function getSunSvg(extraClass = '') {
    return `<svg class="tango-symbol tango-sun ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="1.6" x2="12" y2="3.8"/><line x1="12" y1="20.2" x2="12" y2="22.4"/><line x1="1.6" y1="12" x2="3.8" y2="12"/><line x1="20.2" y1="12" x2="22.4" y2="12"/><line x1="4.6" y1="4.6" x2="6.2" y2="6.2"/><line x1="17.8" y1="17.8" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.2" y2="17.8"/><line x1="17.8" y1="6.2" x2="19.4" y2="4.6"/></g></svg>`;
}

export function getMoonSvg(extraClass = '') {
    return `<svg class="tango-symbol tango-moon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 12.5A9.5 9.5 0 1 1 11.5 2.5a7.5 7.5 0 0 0 10 10z" fill="currentColor"/></svg>`;
}

export class TangoApp {
    constructor() {
        this.engine = new TangoEngine(6);
        this.currentMode = 'campaign'; // 'campaign' | 'daily' | 'free' | 'tutorial'
        this.campaignLevelIndex = 0;
        this.selectedCampaignChapter = 0;
        this.tutorialStepIndex = 0;
        this.selectedCell = null;
        this.isNoteMode = false;
        
        // Timer & Statistiken
        this.timerInterval = null;
        this.secondsElapsed = 0;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.isGameActive = false;
        this.ignoreClickUntil = 0;

        // Einstellungen
        this.autoCheck = true;
        this.inputMode = 'cycle'; // 'cycle' | 'keypad'
        this.currentTheme = 'dark';
        this.reminderEnabled = false;
        this.reminderTime = '09:00';
        this.reminderDismissed = false;

        this.init();
    }

    init() {
        // Globaler Fehler-Handler
        window.addEventListener('error', (e) => {
            const container = document.getElementById('debugErrorBanner');
            const msgEl = document.getElementById('debugErrorText');
            if (container && msgEl) {
                container.style.display = 'block';
                msgEl.textContent = `Fehler: ${e.message || e}`;
            }
        });
        window.addEventListener('unhandledrejection', (e) => {
            const container = document.getElementById('debugErrorBanner');
            const msgEl = document.getElementById('debugErrorText');
            if (container && msgEl) {
                container.style.display = 'block';
                msgEl.textContent = `Promise Fehler: ${e.reason?.message || e.reason}`;
            }
        });

        this.loadSettings();
        this.applyTheme(this.currentTheme);
        animations.init(document.getElementById('confettiCanvas'));
        this.bindEvents();
        this.updateI18n();
        this.checkDailyReminder();
        this.checkDailySystemNotification();
        this.notifCheckInterval = setInterval(() => this.checkDailySystemNotification(), 30000);

        // Starte mit der Kampagne oder dem Tutorial falls neu
        const completedLevels = this.getCompletedLevels();
        if (completedLevels.length === 0) {
            this.startTutorial(0);
        } else {
            this.startCampaignLevel(completedLevels.length);
        }
    }

    loadSettings() {
        try {
            const savedTheme = localStorage.getItem('tango_theme');
            if (savedTheme) this.currentTheme = savedTheme;

            const savedAutoCheck = localStorage.getItem('tango_auto_check');
            if (savedAutoCheck !== null) this.autoCheck = savedAutoCheck === 'true';

            const savedInput = localStorage.getItem('tango_input_mode');
            if (savedInput) this.inputMode = savedInput;

            const savedRem = localStorage.getItem('tango_reminder_enabled');
            if (savedRem !== null) this.reminderEnabled = savedRem === 'true';

            const savedRemTime = localStorage.getItem('tango_reminder_time');
            if (savedRemTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(savedRemTime)) {
                this.reminderTime = savedRemTime;
            }
        } catch (e) {
            console.warn('localStorage konnte nicht gelesen werden:', e);
        }
    }

    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        this.currentTheme = theme;
        try {
            localStorage.setItem('tango_theme', theme);
        } catch (e) {}
    }

    updateI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
    }

    bindEvents() {
        // Navigation / Menüs
        document.getElementById('btnMenu').addEventListener('click', () => this.openMenuTab('play'));
        document.getElementById('btnCloseMenu').addEventListener('click', () => this.toggleModal('menuModal', false));

        // Menü-Hub Tabs
        document.getElementById('tabMenuPlay')?.addEventListener('click', () => this.switchMenuTab('play'));
        document.getElementById('tabMenuRules')?.addEventListener('click', () => this.switchMenuTab('rules'));
        document.getElementById('tabMenuStats')?.addEventListener('click', () => this.switchMenuTab('stats'));
        document.getElementById('tabMenuSettings')?.addEventListener('click', () => this.switchMenuTab('settings'));

        document.getElementById('btnSettings')?.addEventListener('click', () => this.openMenuTab('settings'));
        document.getElementById('btnCloseSettings')?.addEventListener('click', () => this.toggleModal('settingsModal', false));
        document.getElementById('btnStats')?.addEventListener('click', () => this.openMenuTab('stats'));
        document.getElementById('btnCloseStats')?.addEventListener('click', () => this.toggleModal('statsModal', false));
        document.getElementById('btnRules')?.addEventListener('click', () => this.openMenuTab('rules'));
        document.getElementById('btnCloseRules')?.addEventListener('click', () => this.toggleModal('rulesModal', false));

        // Spielmodi-Auswahl im Menü
        document.getElementById('navTutorial')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startTutorial(0);
        });
        document.getElementById('navTutorialPro')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startTutorialPro(0);
        });
        document.getElementById('navCampaign').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.openLevelSelectModal();
        });
        document.getElementById('navDaily').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.startDailyPuzzle();
        });
        document.getElementById('navFree').addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.openFreePlayModal();
        });

        // Spiel-Aktionen
        document.getElementById('btnUndo').addEventListener('click', () => this.handleUndo());
        document.getElementById('btnRedo').addEventListener('click', () => this.handleRedo());
        document.getElementById('btnHint').addEventListener('click', () => this.handleHint());
        document.getElementById('btnRestart').addEventListener('click', () => this.restartCurrentPuzzle());
        document.getElementById('btnNotes').addEventListener('click', () => this.toggleNoteMode());

        // Keypad-Eingaben
        document.getElementById('keypadSun')?.addEventListener('click', () => this.applyKeypadInput(SUN));
        document.getElementById('keypadMoon')?.addEventListener('click', () => this.applyKeypadInput(MOON));
        document.getElementById('keypadClear')?.addEventListener('click', () => this.applyKeypadInput(EMPTY));

        // Dialog-Aktionen
        document.getElementById('btnVictoryNext').addEventListener('click', () => {
            this.toggleModal('victoryModal', false);
            if (this.currentMode === 'tutorial') {
                if (this.tutorialStepIndex + 1 < TUTORIAL_STEPS.length) {
                    this.startTutorial(this.tutorialStepIndex + 1);
                } else {
                    this.startTutorialPro(0);
                }
            } else if (this.currentMode === 'tutorial_pro') {
                if (this.tutorialStepIndex + 1 < TUTORIAL_PRO_STEPS.length) {
                    this.startTutorialPro(this.tutorialStepIndex + 1);
                } else {
                    this.startCampaignLevel(0);
                }
            } else if (this.currentMode === 'campaign') {
                this.startCampaignLevel(this.campaignLevelIndex + 1);
            } else {
                this.openLevelSelectModal();
            }
        });

        document.getElementById('btnHintApply').addEventListener('click', () => {
            if (this.currentHint) {
                this.engine.setCellValue(this.currentHint.r, this.currentHint.c, this.currentHint.value);
                audio.playSun();
                this.renderGrid();
                this.toggleModal('hintModal', false);
                this.checkCompletion();
            }
        });
        document.getElementById('btnCloseHint').addEventListener('click', () => this.toggleModal('hintModal', false));
        document.getElementById('btnCloseLevelSelect')?.addEventListener('click', () => this.toggleModal('levelSelectModal', false));

        // Kampagnen-Kapitel Tabs
        const chapterTabs = document.getElementById('campaignChapterTabs');
        if (chapterTabs) {
            chapterTabs.addEventListener('click', (e) => {
                const btn = e.target.closest('.chapter-tab-btn');
                if (!btn) return;
                const chapter = parseInt(btn.dataset.chapter, 10);
                if (!isNaN(chapter)) {
                    this.switchCampaignChapter(chapter);
                }
            });
        }

        // Settings Dialog Listener
        document.getElementById('settingThemeSelect')?.addEventListener('change', (e) => this.applyTheme(e.target.value));
        document.getElementById('settingSoundToggle')?.addEventListener('change', (e) => audio.setSound(e.target.checked));
        document.getElementById('settingVibrationToggle')?.addEventListener('change', (e) => audio.setVibration(e.target.checked));
        document.getElementById('settingVibStrengthSelect')?.addEventListener('change', (e) => audio.setVibrationStrength(e.target.value));
        document.getElementById('settingAutoCheckToggle')?.addEventListener('change', (e) => {
            this.autoCheck = e.target.checked;
            localStorage.setItem('tango_auto_check', this.autoCheck);
            this.renderGrid();
        });
        document.getElementById('settingLanguageSelect')?.addEventListener('change', (e) => {
            setLang(e.target.value);
            this.updateI18n();
        });
        document.getElementById('settingReminderToggle')?.addEventListener('change', (e) => {
            this.setReminderEnabled(e.target.checked);
        });
        document.getElementById('settingReminderTimeInput')?.addEventListener('change', (e) => {
            this.setReminderTime(e.target.value);
        });
        document.getElementById('btnExportCalendarReminder')?.addEventListener('click', () => {
            this.exportCalendarReminder();
        });
        document.getElementById('btnPlayDailyFromReminder')?.addEventListener('click', () => {
            this.dismissReminderBanner();
            this.startDailyPuzzle();
        });
        document.getElementById('btnCloseDailyReminder')?.addEventListener('click', () => {
            this.dismissReminderBanner();
        });

        // Spielstand zurücksetzen (mit schicker In-Game Sicherheitsabfrage)
        document.getElementById('btnResetProgress')?.addEventListener('click', async () => {
            const confirmed = await this.showConfirmDialog({
                title: t('setting_reset_data'),
                message: t('setting_reset_confirm'),
                confirmText: t('btn_confirm_reset'),
                cancelText: t('btn_cancel'),
                isDanger: true
            });
            if (confirmed) {
                try {
                    localStorage.removeItem('tango_campaign_completed');
                    localStorage.removeItem('tango_campaign_stars');
                    localStorage.removeItem('tango_daily_completed');
                    localStorage.removeItem('tango_daily_streak');
                    localStorage.removeItem('tango_daily_history');
                } catch (e) {}
                this.toggleModal('settingsModal', false);
                this.toggleModal('menuModal', false);
                audio.playClear();
                this.checkDailyReminder();
            }
        });

        // Statistik zurücksetzen (mit schicker In-Game Sicherheitsabfrage)
        const handleResetStats = async () => {
            const confirmed = await this.showConfirmDialog({
                title: t('stats_reset_btn'),
                message: t('stats_reset_confirm'),
                confirmText: t('btn_confirm_reset'),
                cancelText: t('btn_cancel'),
                isDanger: true
            });
            if (confirmed) {
                try {
                    localStorage.removeItem('tango_stats');
                } catch (e) {}
                this.updateMenuStats();
                audio.playClear();
            }
        };
        document.getElementById('btnResetStats')?.addEventListener('click', handleResetStats);
        document.getElementById('btnResetStatsModal')?.addEventListener('click', handleResetStats);
    }

    startTimer() {
        this.stopTimer();
        this.secondsElapsed = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            if (this.isGameActive) {
                this.secondsElapsed++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
        const el = document.getElementById('gameTimer');
        if (el) el.textContent = `${mins}:${secs}`;
    }

    startTutorial(stepIndex = 0) {
        this.currentMode = 'tutorial';
        this.tutorialStepIndex = stepIndex;
        const step = TUTORIAL_STEPS[stepIndex];
        
        this.engine.loadPuzzle({
            size: step.size,
            initialGrid: step.initialGrid,
            hEdges: step.hEdges,
            vEdges: step.vEdges
        });

        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.isGameActive = true;
        this.startTimer();

        // Tutorial-Header einblenden & nach oben scrollen
        this.scrollToTop();
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) {
            tutHeader.scrollTop = 0;
            tutHeader.style.display = 'block';
            document.getElementById('tutTitle').textContent = step.title;
            document.getElementById('tutSubtitle').textContent = step.subtitle;
            const mathBadge = document.getElementById('tutMathPrinciple');
            if (mathBadge) mathBadge.style.display = 'none';
            document.getElementById('tutDesc').innerHTML = step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        document.getElementById('levelTitle').textContent = `Tutorial ${stepIndex + 1}/${TUTORIAL_STEPS.length}`;

        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startTutorialPro(stepIndex = 0) {
        this.currentMode = 'tutorial_pro';
        this.tutorialStepIndex = stepIndex;
        const step = TUTORIAL_PRO_STEPS[stepIndex];
        
        this.engine.loadPuzzle({
            size: step.size,
            initialGrid: step.initialGrid,
            hEdges: step.hEdges,
            vEdges: step.vEdges
        });

        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.isGameActive = true;
        this.startTimer();

        this.scrollToTop();
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) {
            tutHeader.scrollTop = 0;
            tutHeader.style.display = 'block';
            document.getElementById('tutTitle').textContent = step.title;
            document.getElementById('tutSubtitle').textContent = step.subtitle;
            const mathBadge = document.getElementById('tutMathPrinciple');
            if (mathBadge) {
                mathBadge.style.display = 'block';
                mathBadge.textContent = step.mathPrinciple;
            }
            document.getElementById('tutDesc').innerHTML = step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        document.getElementById('levelTitle').textContent = `Tutorial Pro ${stepIndex + 1}/${TUTORIAL_PRO_STEPS.length}`;

        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startCampaignLevel(levelIndex) {
        this.currentMode = 'campaign';
        this.campaignLevelIndex = levelIndex;
        const level = getCampaignLevel(levelIndex);

        this.engine.loadPuzzle(level);
        this.scrollToTop();
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.isGameActive = true;
        this.startTimer();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        document.getElementById('levelTitle').textContent = `${t('status_level')} ${levelIndex + 1}`;
        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startDailyPuzzle() {
        this.currentMode = 'daily';
        const today = new Date().toISOString().slice(0, 10);
        const puzzle = getDailyPuzzle(today);

        this.engine.loadPuzzle(puzzle);
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.isGameActive = true;
        this.startTimer();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        document.getElementById('levelTitle').textContent = `${t('nav_daily')} (${today})`;
        this.renderGrid();
        this.updateKeypadVisibility();
    }

    startFreePlay(size, difficulty) {
        this.currentMode = 'free';
        const generated = TangoGenerator.generatePuzzle({ size, difficulty });

        this.engine.loadPuzzle(generated);
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.isGameActive = true;
        this.startTimer();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        document.getElementById('levelTitle').textContent = `${t('nav_free')} ${size}×${size}`;
        this.renderGrid();
        this.updateKeypadVisibility();
    }

    restartCurrentPuzzle() {
        this.engine.loadPuzzle({
            size: this.engine.size,
            initialGrid: this.engine.initialGrid,
            hEdges: this.engine.hEdges,
            vEdges: this.engine.vEdges
        });
        this.selectedCell = null;
        this.movesCount = 0;
        this.startTimer();
        this.renderGrid();
        audio.playClear();
    }

    toggleNoteMode() {
        this.isNoteMode = !this.isNoteMode;
        const btn = document.getElementById('btnNotes');
        if (btn) btn.classList.toggle('active', this.isNoteMode);
        audio.vibrate(30);
    }

    updateKeypadVisibility() {
        const keypadEl = document.getElementById('gameKeypad');
        if (keypadEl) {
            keypadEl.style.display = (this.inputMode === 'keypad') ? 'flex' : 'none';
        }
    }

    scrollToTop() {
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.scrollTop = 0;
        const appRoot = document.getElementById('appRoot');
        if (appRoot) appRoot.scrollTop = 0;
        window.scrollTo(0, 0);
    }

    renderGrid() {
        const container = document.getElementById('boardContainer');
        if (!container) return;

        container.innerHTML = '';
        const size = this.engine.size;
        container.style.setProperty('--grid-size', size);

        // Erstelle Gitter-Element
        const gridEl = document.createElement('div');
        gridEl.className = `tango-grid size-${size}`;

        const validation = this.autoCheck ? this.engine.validateRules() : { conflictCells: new Set() };

        for (let r = 0; r < size; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'grid-row';

            for (let c = 0; c < size; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'grid-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                const val = this.engine.grid[r][c];
                const isLocked = this.engine.locked[r][c];
                const isConflict = validation.conflictCells.has(`${r},${c}`);
                const isSelected = this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c;

                if (isLocked) cellEl.classList.add('locked');
                if (isConflict) cellEl.classList.add('conflict');
                if (isSelected) cellEl.classList.add('selected');

                if (val === SUN) {
                    cellEl.classList.add('val-sun');
                    cellEl.innerHTML = `<span class="icon-sun">${getSunSvg('cell-sun')}</span>`;
                } else if (val === MOON) {
                    cellEl.classList.add('val-moon');
                    cellEl.innerHTML = `<span class="icon-moon">${getMoonSvg('cell-moon')}</span>`;
                } else {
                    // Marker für Tutorial-Zielzellen
                    const tutStep = (this.currentMode === 'tutorial') ? TUTORIAL_STEPS[this.tutorialStepIndex] : (this.currentMode === 'tutorial_pro' ? TUTORIAL_PRO_STEPS[this.tutorialStepIndex] : null);
                    const targetCellInfo = (tutStep && tutStep.targetCells) ? tutStep.targetCells.find(t => t.r === r && t.c === c) : null;
                    if (targetCellInfo) {
                        cellEl.classList.add('tutorial-target');
                        const ghostEl = document.createElement('span');
                        ghostEl.className = `target-ghost ${targetCellInfo.val === SUN ? 'ghost-sun' : 'ghost-moon'}`;
                        ghostEl.innerHTML = targetCellInfo.val === SUN ? getSunSvg('ghost-icon') : getMoonSvg('ghost-icon');
                        cellEl.appendChild(ghostEl);
                    } else {
                        // Zeige eventuelle Notizen
                        const notes = this.engine.notes[r][c];
                        if (notes && notes.size > 0) {
                            const noteEl = document.createElement('div');
                            noteEl.className = 'cell-notes';
                            if (notes.has(SUN)) noteEl.innerHTML += `<span class="mini-sun">${getSunSvg('mini-icon')}</span>`;
                            if (notes.has(MOON)) noteEl.innerHTML += `<span class="mini-moon">${getMoonSvg('mini-icon')}</span>`;
                            cellEl.appendChild(noteEl);
                        }
                    }
                }

                // Event Listener für Zelle (Klick & Gedrückt halten)
                this.attachCellEvents(cellEl, r, c);

                // Horizontale Kante rechts neben der Zelle (falls vorhanden)
                if (c < size - 1) {
                    const hEdge = this.engine.hEdges[r][c];
                    if (hEdge !== EDGE_NONE) {
                        const edgeEl = document.createElement('div');
                        edgeEl.className = `edge-marker edge-h ${hEdge === EDGE_EQUAL ? 'edge-equal' : 'edge-opposite'}`;
                        edgeEl.textContent = hEdge === EDGE_EQUAL ? '=' : '×';
                        cellEl.appendChild(edgeEl);
                    }
                }

                // Vertikale Kante unterhalb der Zelle (falls vorhanden)
                if (r < size - 1) {
                    const vEdge = this.engine.vEdges[r][c];
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

    attachCellEvents(cellEl, r, c) {
        let holdTimer = null;
        let didLongPress = false;
        let startX = 0;
        let startY = 0;

        const startHold = (clientX, clientY) => {
            if (!this.isGameActive || this.engine.locked[r][c]) return;
            didLongPress = false;
            startX = clientX;
            startY = clientY;

            holdTimer = setTimeout(() => {
                didLongPress = true;
                this.handleCellLongPress(r, c);
            }, 350); // 350ms für gedrückt halten = Mond
        };

        const cancelHold = () => {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
        };

        // Pointer Events (Mobile & Desktop)
        cellEl.addEventListener('pointerdown', (e) => {
            startHold(e.clientX, e.clientY);
        });

        cellEl.addEventListener('pointermove', (e) => {
            if (holdTimer) {
                const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
                if (dist > 10) cancelHold();
            }
        });

        cellEl.addEventListener('pointerup', () => cancelHold());
        cellEl.addEventListener('pointercancel', () => cancelHold());
        cellEl.addEventListener('pointerleave', () => cancelHold());

        // Normaler Klick / Tipp
        cellEl.addEventListener('click', (e) => {
            if (didLongPress) {
                didLongPress = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            this.handleCellClick(r, c, e);
        });
    }

    /**
     * Gedrückt halten = Direkt Mond (🌙) setzen
     */
    handleCellLongPress(r, c) {
        if (!this.isGameActive || this.engine.locked[r][c]) return;

        this.ignoreClickUntil = Date.now() + 500; // Block fake click after long press release
        this.selectedCell = { r, c };

        if (this.isNoteMode) {
            this.engine.setCellValue(r, c, MOON, true);
        } else {
            this.engine.setCellValue(r, c, MOON);
            this.movesCount++;
            audio.playMoon();
        }

        this.renderGrid();
        this.checkCompletion();
    }

    handleCellClick(r, c, e) {
        if (Date.now() < this.ignoreClickUntil) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            return;
        }

        if (!this.isGameActive || this.engine.locked[r][c]) return;

        this.selectedCell = { r, c };

        if (this.inputMode === 'keypad') {
            this.renderGrid();
            return;
        }

        // Bedienkonzept:
        // 1x Tippen = ☀️ (Sonne)
        // 2x Tippen = 🌙 (Mond)
        // 3x Tippen = Löschen (Empty)
        if (this.isNoteMode) {
            // Notiz-Zyklus: Leer -> ☀️ (Sonne) -> 🌙 (Mond) -> ☀️🌙 (Beide) -> Leer (Löschen)
            this.engine.cycleNoteValue(r, c);
            audio.playClear();
        } else {
            const nextVal = this.engine.cycleCellValue(r, c);
            this.movesCount++;
            if (nextVal === SUN) audio.playSun();
            else if (nextVal === MOON) audio.playMoon();
            else audio.playClear();
        }

        this.renderGrid();
        this.checkCompletion();
    }

    applyKeypadInput(val) {
        if (!this.selectedCell || !this.isGameActive) return;
        const { r, c } = this.selectedCell;
        if (this.engine.locked[r][c]) return;

        this.engine.setCellValue(r, c, val, this.isNoteMode);
        this.movesCount++;

        if (val === SUN) audio.playSun();
        else if (val === MOON) audio.playMoon();
        else audio.playClear();

        this.renderGrid();
        this.checkCompletion();
    }

    handleUndo() {
        const action = this.engine.undo();
        if (action) {
            audio.playClear();
            this.renderGrid();
        }
    }

    handleRedo() {
        const action = this.engine.redo();
        if (action) {
            audio.playClear();
            this.renderGrid();
        }
    }

    handleHint() {
        if (!this.isGameActive) return;

        const MAX_HINTS = 3;
        const applyBtn = document.getElementById('btnHintApply');
        const hintTitleEl = document.querySelector('#hintModal .modal-title');

        if (this.hintsUsed >= MAX_HINTS) {
            if (applyBtn) applyBtn.style.display = 'none';
            if (hintTitleEl) hintTitleEl.textContent = `${t('hint_title')} (3/3)`;
            document.getElementById('hintText').textContent = t('hint_limit_reached');
            this.currentHint = null;
            this.toggleModal('hintModal', true);
            audio.playError();
            return;
        }

        const hint = TangoSolver.findLogicalHint(this.engine);
        if (hint) {
            this.currentHint = hint;
            this.hintsUsed++;
            audio.playHint();

            if (applyBtn) applyBtn.style.display = 'inline-block';
            if (hintTitleEl) hintTitleEl.textContent = `${t('hint_title')} (${this.hintsUsed}/${MAX_HINTS})`;
            document.getElementById('hintText').textContent = hint.message;
            this.toggleModal('hintModal', true);

            // Markiere die betroffenen Zellen temporär
            this.renderGrid();
            if (hint.highlightCells) {
                hint.highlightCells.forEach(cell => {
                    const el = document.querySelector(`.grid-cell[data-r="${cell.r}"][data-c="${cell.c}"]`);
                    if (el) el.classList.add('hint-highlight');
                });
            }
        }
    }

    checkCompletion() {
        if (this.currentMode === 'tutorial' || this.currentMode === 'tutorial_pro') {
            const steps = this.currentMode === 'tutorial' ? TUTORIAL_STEPS : TUTORIAL_PRO_STEPS;
            const step = steps[this.tutorialStepIndex];
            let stepSuccess = true;
            if (step && step.targetCells) {
                for (const target of step.targetCells) {
                    if (this.engine.grid[target.r][target.c] !== target.val) {
                        stepSuccess = false;
                        break;
                    }
                }
            }
            if (stepSuccess) {
                this.onLevelVictory(step.explanation || '');
            }
            return;
        }

        if (this.engine.isCompleted()) {
            this.onLevelVictory();
        }
    }

    onLevelVictory() {
        this.isGameActive = false;
        this.stopTimer();
        audio.playVictory();
        animations.launchConfetti();

        // Statistiken & Fortschritt speichern (Tutorials nicht in Statistik aufnehmen)
        if (this.currentMode === 'campaign') {
            this.saveCampaignProgress(this.campaignLevelIndex);
            this.recordGameStats(true);
        } else if (this.currentMode === 'daily') {
            this.saveDailyProgress();
            this.recordGameStats(true);
        } else if (this.currentMode === 'free') {
            this.recordGameStats(true);
        }

        const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
        document.getElementById('victoryTime').textContent = `${mins}:${secs}`;
        document.getElementById('victoryMoves').textContent = this.movesCount;

        const expEl = document.getElementById('victoryExplanation');
        if (expEl) {
            if (this.currentMode === 'tutorial' || this.currentMode === 'tutorial_pro') {
                const steps = this.currentMode === 'tutorial' ? TUTORIAL_STEPS : TUTORIAL_PRO_STEPS;
                const step = steps[this.tutorialStepIndex];
                expEl.textContent = step.explanation || '';
                expEl.style.display = step.explanation ? 'block' : 'none';
            } else {
                expEl.style.display = 'none';
            }
        }

        setTimeout(() => {
            this.toggleModal('victoryModal', true);
        }, 400);
    }

    getCompletedLevels() {
        try {
            return JSON.parse(localStorage.getItem('tango_campaign_completed') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveCampaignProgress(lvlIndex) {
        try {
            const completed = this.getCompletedLevels();
            if (!completed.includes(lvlIndex)) {
                completed.push(lvlIndex);
                localStorage.setItem('tango_campaign_completed', JSON.stringify(completed));
            }
        } catch (e) {}
    }

    saveDailyProgress() {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const history = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
            if (!history.includes(today)) {
                history.push(today);
                localStorage.setItem('tango_daily_history', JSON.stringify(history));
            }
            this.checkDailyReminder();
        } catch (e) {}
    }

    recordGameStats(won) {
        // Tutorials und Tutorial Pro fließen nicht in die Statistik oder Bestzeiten ein
        if (this.currentMode === 'tutorial' || this.currentMode === 'tutorial_pro') {
            return;
        }
        try {
            const stats = JSON.parse(localStorage.getItem('tango_stats') || '{"played":0,"won":0,"bestTime":null,"totalTime":0}');
            stats.played++;
            if (won) {
                stats.won++;
                stats.totalTime += this.secondsElapsed;
                if (stats.bestTime === null || this.secondsElapsed < stats.bestTime) {
                    stats.bestTime = this.secondsElapsed;
                }
            }
            localStorage.setItem('tango_stats', JSON.stringify(stats));
        } catch (e) {}
    }

    openLevelSelectModal() {
        if (typeof this.campaignLevelIndex === 'number' && this.campaignLevelIndex >= 0) {
            this.selectedCampaignChapter = Math.min(3, Math.max(0, Math.floor(this.campaignLevelIndex / 30)));
        }
        this.renderCampaignLevelGrid();
        this.toggleModal('levelSelectModal', true);
    }

    switchCampaignChapter(chapter) {
        this.selectedCampaignChapter = Math.min(3, Math.max(0, chapter));
        audio.playClear();
        this.renderCampaignLevelGrid();
    }

    renderCampaignLevelGrid() {
        const tabs = document.querySelectorAll('#campaignChapterTabs .chapter-tab-btn');
        tabs.forEach((tab) => {
            const chap = parseInt(tab.dataset.chapter, 10);
            if (chap === this.selectedCampaignChapter) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        const list = document.getElementById('levelGridList');
        if (!list) return;
        list.innerHTML = '';

        const completed = this.getCompletedLevels();
        const startLvl = this.selectedCampaignChapter * 30;
        const endLvl = startLvl + 30;

        for (let i = startLvl; i < endLvl; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-item-btn';
            const isDone = completed.includes(i);
            const isUnlocked = i === 0 || completed.includes(i - 1) || isDone;

            btn.disabled = !isUnlocked;
            if (isDone) btn.classList.add('completed');
            if (isUnlocked) btn.classList.add('unlocked');

            btn.innerHTML = `<span class="lvl-num">${i + 1}</span>${isDone ? '<span class="lvl-star">⭐</span>' : ''}`;
            btn.addEventListener('click', () => {
                this.toggleModal('levelSelectModal', false);
                this.startCampaignLevel(i);
            });
            list.appendChild(btn);
        }
    }

    openFreePlayModal() {
        this.toggleModal('freePlayModal', true);
        const btnStart = document.getElementById('btnStartFreePlay');
        if (btnStart) {
            btnStart.onclick = () => {
                const size = parseInt(document.getElementById('freePlaySizeSelect').value, 10);
                const diff = document.getElementById('freePlayDiffSelect').value;
                this.toggleModal('freePlayModal', false);
                this.startFreePlay(size, diff);
            };
        }
        const btnClose = document.getElementById('btnCloseFreePlay');
        if (btnClose) {
            btnClose.onclick = () => this.toggleModal('freePlayModal', false);
        }
    }

    openSettingsModal() {
        const themeSel = document.getElementById('settingThemeSelect');
        if (themeSel) themeSel.value = this.currentTheme;

        const sndToggle = document.getElementById('settingSoundToggle');
        if (sndToggle) sndToggle.checked = audio.enabled;

        const vibToggle = document.getElementById('settingVibrationToggle');
        if (vibToggle) vibToggle.checked = audio.vibrationEnabled;

        const vibStrengthSel = document.getElementById('settingVibStrengthSelect');
        if (vibStrengthSel) vibStrengthSel.value = audio.vibrationStrength;

        const chkToggle = document.getElementById('settingAutoCheckToggle');
        if (chkToggle) chkToggle.checked = this.autoCheck;

        const langSel = document.getElementById('settingLanguageSelect');
        if (langSel) langSel.value = getLang();

        const remToggle = document.getElementById('settingReminderToggle');
        if (remToggle) remToggle.checked = this.reminderEnabled;

        const remTimeInput = document.getElementById('settingReminderTimeInput');
        if (remTimeInput) remTimeInput.value = this.reminderTime;

        const remTimeRow = document.getElementById('settingReminderTimeRow');
        if (remTimeRow) remTimeRow.style.display = this.reminderEnabled ? 'flex' : 'none';

        const calExportRow = document.getElementById('settingCalendarExportRow');
        if (calExportRow) calExportRow.style.display = this.reminderEnabled ? 'flex' : 'none';

        this.toggleModal('settingsModal', true);
    }

    openStatsModal() {
        const stats = JSON.parse(localStorage.getItem('tango_stats') || '{"played":0,"won":0,"bestTime":null,"totalTime":0}');
        document.getElementById('statPlayed').textContent = stats.played;
        document.getElementById('statWon').textContent = stats.won;
        document.getElementById('statWinRate').textContent = stats.played > 0 ? `${Math.round((stats.won / stats.played) * 100)}%` : '0%';
        
        if (stats.bestTime !== null) {
            const mins = Math.floor(stats.bestTime / 60).toString().padStart(2, '0');
            const secs = (stats.bestTime % 60).toString().padStart(2, '0');
            document.getElementById('statBestTime').textContent = `${mins}:${secs}`;
        } else {
            document.getElementById('statBestTime').textContent = '-';
        }

        this.toggleModal('statsModal', true);
    }

    setReminderEnabled(enabled) {
        this.reminderEnabled = enabled;
        try {
            localStorage.setItem('tango_reminder_enabled', enabled);
        } catch (e) {}
        const remTimeRow = document.getElementById('settingReminderTimeRow');
        if (remTimeRow) remTimeRow.style.display = enabled ? 'flex' : 'none';
        const calExportRow = document.getElementById('settingCalendarExportRow');
        if (calExportRow) calExportRow.style.display = enabled ? 'flex' : 'none';
        
        if (enabled) {
            this.requestNotificationPermission();
            if (window.AndroidNotification && typeof window.AndroidNotification.scheduleDailyReminder === 'function') {
                const [remH, remM] = this.reminderTime.split(':').map(Number);
                try {
                    window.AndroidNotification.scheduleDailyReminder(remH, remM);
                } catch (e) {}
            }
        } else {
            if (window.AndroidNotification && typeof window.AndroidNotification.cancelDailyReminder === 'function') {
                try {
                    window.AndroidNotification.cancelDailyReminder();
                } catch (e) {}
            }
        }
        this.checkDailyReminder();
    }

    setReminderTime(timeStr) {
        if (/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
            this.reminderTime = timeStr;
            try {
                localStorage.setItem('tango_reminder_time', timeStr);
            } catch (e) {}
            if (this.reminderEnabled && window.AndroidNotification && typeof window.AndroidNotification.scheduleDailyReminder === 'function') {
                const [remH, remM] = timeStr.split(':').map(Number);
                try {
                    window.AndroidNotification.scheduleDailyReminder(remH, remM);
                } catch (e) {}
            }
            this.checkDailyReminder();
        }
    }

    openMenuTab(tabName = 'play') {
        this.toggleModal('menuModal', true);
        this.switchMenuTab(tabName);
    }

    switchMenuTab(tabName) {
        const tabs = ['play', 'rules', 'stats', 'settings'];
        tabs.forEach(t => {
            const btn = document.getElementById(`tabMenu${t.charAt(0).toUpperCase() + t.slice(1)}`);
            const sec = document.getElementById(`menuSec${t.charAt(0).toUpperCase() + t.slice(1)}`);
            if (btn) btn.classList.toggle('active', t === tabName);
            if (sec) sec.style.display = t === tabName ? 'flex' : 'none';
        });

        if (tabName === 'stats') {
            this.updateMenuStats();
        } else if (tabName === 'settings') {
            this.updateMenuSettings();
        }
    }

    updateMenuStats() {
        let stats = { played: 0, won: 0, bestTime: null, totalTime: 0 };
        try {
            stats = JSON.parse(localStorage.getItem('tango_stats') || '{"played":0,"won":0,"bestTime":null,"totalTime":0}');
        } catch (e) {}
        
        const statP = document.getElementById('statPlayed');
        const statW = document.getElementById('statWon');
        const statR = document.getElementById('statWinRate');
        const statB = document.getElementById('statBestTime');

        if (statP) statP.textContent = stats.played;
        if (statW) statW.textContent = stats.won;
        if (statR) statR.textContent = stats.played > 0 ? `${Math.round((stats.won / stats.played) * 100)}%` : '0%';
        if (statB) {
            if (stats.bestTime !== null) {
                const mins = Math.floor(stats.bestTime / 60).toString().padStart(2, '0');
                const secs = (stats.bestTime % 60).toString().padStart(2, '0');
                statB.textContent = `${mins}:${secs}`;
            } else {
                statB.textContent = '-';
            }
        }
    }

    updateMenuSettings() {
        const themeSel = document.getElementById('settingThemeSelect');
        if (themeSel) themeSel.value = this.currentTheme;

        const sndToggle = document.getElementById('settingSoundToggle');
        if (sndToggle) sndToggle.checked = audio.enabled;

        const vibToggle = document.getElementById('settingVibrationToggle');
        if (vibToggle) vibToggle.checked = audio.vibrationEnabled;

        const vibStrengthSel = document.getElementById('settingVibStrengthSelect');
        if (vibStrengthSel) vibStrengthSel.value = audio.vibrationStrength;

        const chkToggle = document.getElementById('settingAutoCheckToggle');
        if (chkToggle) chkToggle.checked = this.autoCheck;

        const langSel = document.getElementById('settingLanguageSelect');
        if (langSel) langSel.value = getLang();

        const remToggle = document.getElementById('settingReminderToggle');
        if (remToggle) remToggle.checked = this.reminderEnabled;

        const remTimeInput = document.getElementById('settingReminderTimeInput');
        if (remTimeInput) remTimeInput.value = this.reminderTime;

        const remTimeRow = document.getElementById('settingReminderTimeRow');
        if (remTimeRow) remTimeRow.style.display = this.reminderEnabled ? 'flex' : 'none';

        const calExportRow = document.getElementById('settingCalendarExportRow');
        if (calExportRow) calExportRow.style.display = this.reminderEnabled ? 'flex' : 'none';
    }

    requestNotificationPermission() {
        if (window.AndroidNotification) return; // Android NotificationBridge regelt Permissions nativ
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                Notification.requestPermission().catch(() => {});
            } catch (e) {}
        }
    }

    sendSystemNotification(title, body) {
        if (window.AndroidNotification && typeof window.AndroidNotification.showNotification === 'function') {
            try {
                window.AndroidNotification.showNotification(title, body);
                return true;
            } catch (e) {
                console.warn('AndroidNotification Fehler:', e);
            }
        }

        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.showNotification(title, {
                            body: body,
                            icon: './assets/icons/icon-192.png',
                            badge: './assets/icons/icon-192.png',
                            vibrate: [100, 50, 100],
                            tag: 'tango-daily-alarm',
                            renotify: true
                        });
                    }).catch(() => {
                        new Notification(title, { body: body, icon: './assets/icons/icon-192.png' });
                    });
                } else {
                    new Notification(title, { body: body, icon: './assets/icons/icon-192.png' });
                }
                return true;
            } catch (e) {
                console.warn('System-Benachrichtigung konnte nicht erstellt werden:', e);
            }
        }
        return false;
    }

    testSystemNotification() {
        if (window.AndroidNotification && typeof window.AndroidNotification.showNotification === 'function') {
            try {
                window.AndroidNotification.showNotification(t('notif_title'), t('notif_body'));
                alert(t('notif_test_sent'));
                return;
            } catch (e) {
                console.warn('Android Test-Notification Fehler:', e);
            }
        }

        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                        this.sendSystemNotification(t('notif_title'), t('notif_body'));
                        alert(t('notif_test_sent'));
                    } else {
                        alert(t('notif_permission_denied'));
                    }
                }).catch(() => {
                    alert(t('notif_permission_denied'));
                });
            } else if (Notification.permission === 'granted') {
                this.sendSystemNotification(t('notif_title'), t('notif_body'));
                alert(t('notif_test_sent'));
            } else {
                alert(t('notif_permission_denied'));
            }
            return;
        }

        alert(t('notif_test_sent'));
    }

    checkDailySystemNotification() {
        if (!this.reminderEnabled) return;
        const today = new Date().toISOString().slice(0, 10);
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
        } catch (e) {}
        if (history.includes(today)) return; // Heute bereits abgeschlossen

        let lastNotif = '';
        try {
            lastNotif = localStorage.getItem('tango_last_notif_date') || '';
        } catch (e) {}
        if (lastNotif === today) return; // Heute bereits alarmiert

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [remHour, remMinute] = this.reminderTime.split(':').map(Number);

        if (currentHour > remHour || (currentHour === remHour && currentMinute >= remMinute)) {
            const sent = this.sendSystemNotification(t('notif_title'), t('notif_body'));
            if (sent) {
                try {
                    localStorage.setItem('tango_last_notif_date', today);
                } catch (e) {}
            }
        }
    }

    checkDailyReminder() {
        const today = new Date().toISOString().slice(0, 10);
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('tango_daily_history') || '[]');
        } catch (e) {}

        const isTodaySolved = history.includes(today);
        const badge = document.getElementById('dailyBadge');
        if (badge) badge.style.display = isTodaySolved ? 'none' : 'inline-block';

        const banner = document.getElementById('dailyReminderBanner');
        if (isTodaySolved || !this.reminderEnabled || this.reminderDismissed) {
            if (banner) banner.style.display = 'none';
            return;
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [remHour, remMinute] = this.reminderTime.split(':').map(Number);

        if (currentHour > remHour || (currentHour === remHour && currentMinute >= remMinute)) {
            if (banner) banner.style.display = 'flex';
        } else {
            if (banner) banner.style.display = 'none';
        }
    }

    dismissReminderBanner() {
        this.reminderDismissed = true;
        const banner = document.getElementById('dailyReminderBanner');
        if (banner) banner.style.display = 'none';
    }

    exportCalendarReminder() {
        try {
            const [remHour, remMinute] = this.reminderTime.split(':').map(Number);
            const pad = (n) => String(n).padStart(2, '0');
            const d = new Date();
            const dtStart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(remHour)}${pad(remMinute)}00`;
            const icsContent = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//Tango//Daily Reminder//DE",
                "CALSCALE:GREGORIAN",
                "METHOD:PUBLISH",
                "BEGIN:VEVENT",
                `UID:tango-daily-${Date.now()}@tango.game`,
                `DTSTAMP:${dtStart}Z`,
                `DTSTART:${dtStart}`,
                `RRULE:FREQ=DAILY;INTERVAL=1`,
                "SUMMARY:Tango Tagesrätsel",
                "DESCRIPTION:Zeit für dein tägliches Tango Logikrätsel!",
                "BEGIN:VALARM",
                "ACTION:DISPLAY",
                "DESCRIPTION:Tango Tagesrätsel wartet auf dich!",
                "TRIGGER:-PT0M",
                "END:VALARM",
                "END:VEVENT",
                "END:VCALENDAR"
            ].join("\r\n");

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tango-tagesraetsel-erinnerung.ics`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert(t('reminder_calendar_saved'));
        } catch (e) {
            alert("Fehler beim Erstellen der Kalender-Datei: " + e.message);
        }
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
    }

    showConfirmDialog({ title, message, confirmText, cancelText, isDanger = true }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const msgEl = document.getElementById('confirmMessage');
            const okBtn = document.getElementById('btnConfirmOk');
            const cancelBtn = document.getElementById('btnConfirmCancel');

            if (!modal) {
                resolve(false);
                return;
            }

            if (titleEl) titleEl.textContent = title || t('confirm_title');
            if (msgEl) msgEl.textContent = message || '';
            if (okBtn) {
                okBtn.textContent = confirmText || t('btn_confirm_reset');
                okBtn.className = isDanger ? 'danger-btn' : 'primary-btn';
            }
            if (cancelBtn) cancelBtn.textContent = cancelText || t('btn_cancel');

            const cleanup = (result) => {
                modal.style.display = 'none';
                if (okBtn) okBtn.onclick = null;
                if (cancelBtn) cancelBtn.onclick = null;
                resolve(result);
            };

            if (okBtn) okBtn.onclick = () => cleanup(true);
            if (cancelBtn) cancelBtn.onclick = () => cleanup(false);

            modal.style.display = 'flex';
        });
    }
}

// Sichere Initialisierung der App
function initApp() {
    if (window.tangoApp) return; // Bereits initialisiert
    try {
        window.tangoApp = new TangoApp();

        // Service Worker registrieren für Offline-Betrieb & PWA
        if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('./sw.js').catch(err => {
                console.warn('Service Worker Registrierungsfehler:', err);
            });
        }
    } catch (err) {
        console.error('Fehler beim Starten der TangoApp:', err);
    }
}

// Falls das DOM bereits geladen ist (bei ES-Modulen häufig), direkt starten
if (document.readyState !== 'loading') {
    initApp();
} else {
    window.addEventListener('DOMContentLoaded', initApp);
}
