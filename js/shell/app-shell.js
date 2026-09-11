/**
 * Cortex App-Shell & Unified Game Controller
 * Verwaltet Puzzle-Plugins, Menü-Hub, Spielmodi, Timer, Audio,
 * Statistiken, Themes, Notizen und Modals.
 */

import { StorageManager, StorageKeys } from '../shared/storage.js';
import { GameTimer, formatTime } from '../shared/timer.js';
import { StatsManager, calculateStreaks } from '../shared/stats.js';
import { ThemeManager, THEMES } from '../shared/themes.js';
import { audio } from '../shared/audio.js';
import { animations } from '../shared/animations.js';
import { t, setLang, getLang } from '../shared/i18n.js';
import { puzzleRegistry } from './puzzle-registry.js';

import { TangoPlugin } from '../puzzles/tango/index.js';
import { SudokuPlugin } from '../puzzles/sudoku/index.js';
import { AkariPlugin } from '../puzzles/akari/index.js';
import { NonogramPlugin } from '../puzzles/nonogram/index.js';
import { SlitherlinkPlugin } from '../puzzles/slitherlink/index.js';
import { MinesweeperPlugin } from '../puzzles/minesweeper/index.js';
import { getSunSvg, getMoonSvg } from '../puzzles/tango/renderer.js';

export { formatTime, calculateStreaks, getSunSvg, getMoonSvg };

export class CortexApp {
    constructor() {
        // Storage Migration
        StorageManager.checkAndMigrate();

        // Plugins registrieren
        puzzleRegistry.register(AkariPlugin);
        puzzleRegistry.register(NonogramPlugin);
        puzzleRegistry.register(SlitherlinkPlugin);
        puzzleRegistry.register(SudokuPlugin);
        puzzleRegistry.register(TangoPlugin);
        puzzleRegistry.register(MinesweeperPlugin);

        // Aktives Plugin laden
        const savedPluginId = StorageManager.getItem(StorageKeys.ACTIVE_PUZZLE, 'tango');
        this.activePlugin = puzzleRegistry.activate(savedPluginId);
        this.engine = this.activePlugin.createEngine();

        this.currentMode = 'campaign'; // 'campaign' | 'daily' | 'free' | 'tutorial' | 'tutorial_pro' | 'tutorial_patterns' | 'tutorial_advanced'
        this.campaignLevelIndex = 0;
        this.selectedCampaignChapter = 0;
        this.tutorialSectionId = 'basics';
        this.tutorialStepIndex = 0;
        this.selectedCell = null;
        this.isNoteMode = false;

        // Timer & Statistiken
        this.timer = new GameTimer((seconds, formatted) => {
            const el = document.getElementById('gameTimer');
            if (el) el.textContent = formatted;
            this.secondsElapsed = seconds;
        });
        this.secondsElapsed = 0;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.currentHint = null;
        this.hintPlacedCell = null;
        this.solutionRevealed = false;
        this.isGameActive = false;
        this.ignoreClickUntil = 0;
        this.currentPuzzleData = null;

        // Einstellungen
        this.autoCheck = StorageManager.getItem(StorageKeys.AUTO_CHECK, 'true') === 'true';
        this.cellZoom = StorageManager.getItem(StorageKeys.CELL_ZOOM, 'true') === 'true';
        this.cellZoomLevel = StorageManager.getItem(StorageKeys.CELL_ZOOM_LEVEL, '1.5');
        this.inputMode = StorageManager.getItem(StorageKeys.INPUT_MODE, 'cycle');
        this.currentTheme = ThemeManager.getCurrentTheme();
        this.reminderEnabled = StorageManager.getItem(StorageKeys.REMINDER_ENABLED, 'false') === 'true';
        this.reminderTime = StorageManager.getItem(StorageKeys.REMINDER_TIME, '09:00');
        this.reminderDismissed = false;

        // Freies Spiel Voreinstellungen
        this.freePlaySize = (this.activePlugin && this.activePlugin.id === 'sudoku') ? 9 : 6;
        this.freePlayDiff = 'medium';

        // Statistik Tab Filter ('all' | 'tango' | 'sudoku')
        this.activeStatsTab = 'all';

        this.init();
    }

    init() {
        // Globaler Error Handler
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

        ThemeManager.applyTheme(this.currentTheme);
        const canvas = document.getElementById('confettiCanvas');
        if (canvas) animations.init(canvas);

        this.bindEvents();
        this.updateI18n();
        this.checkDailyReminder();
        this.checkDailySystemNotification();
        this.notifCheckInterval = setInterval(() => this.checkDailySystemNotification(), 30000);

        // Prüfe auf wiederherstellbaren Zwischenstand
        const restored = this.restoreActiveGameState();
        if (!restored) {
            // Starte Spielstand im Hintergrund vorbereitet
            const completed = this.getCompletedLevels();
            this.prepareCampaignLevel(completed.length < 120 ? completed.length : 0);

            // Beim Start sofort die "Alle Rätsel" Übersicht als Startseite öffnen
            this.openPuzzleSelectModal();
            this.timer.stop();
            this.isGameActive = false;
        }
    }

    getState() {
        return {
            currentMode: this.currentMode,
            campaignLevelIndex: this.campaignLevelIndex,
            tutorialStepIndex: this.tutorialStepIndex,
            selectedCell: this.selectedCell,
            hintPlacedCell: this.hintPlacedCell,
            currentHint: this.currentHint,
            isNoteMode: this.isNoteMode,
            autoCheck: this.autoCheck,
            cellZoom: this.cellZoom,
            cellZoomLevel: this.cellZoomLevel,
            solutionRevealed: this.solutionRevealed,
            inputMode: this.inputMode
        };
    }

    switchPlugin(pluginId) {
        if (!puzzleRegistry.get(pluginId)) return;
        this.activePlugin = puzzleRegistry.activate(pluginId);
        StorageManager.setItem(StorageKeys.ACTIVE_PUZZLE, pluginId);

        // Freies Spiel Default-Größen anpassen
        const sizes = this.activePlugin.getSizes();
        if (sizes && sizes.length > 0) {
            if (pluginId === 'sudoku') {
                this.freePlaySize = 9;
            } else if (pluginId === 'nonogram') {
                this.freePlaySize = 10;
            } else if (pluginId === 'tango') {
                this.freePlaySize = 6;
            } else if (pluginId === 'minesweeper') {
                this.freePlaySize = 8;
            } else {
                this.freePlaySize = sizes[0].id;
            }
        }

        // Header & Menü aktualisieren
        this.updateHeader();
        this.updateMenuPlayTab();
        this.updateRulesContent();
        this.updateFreePlayLabels();

        // Bereite Kampagnen-Level des gewählten Puzzles im Hintergrund vor
        const completed = this.getCompletedLevels();
        this.prepareCampaignLevel(completed.length < 120 ? completed.length : 0);
    }

    restoreSelectedPlugin() {
        const savedId = StorageManager.getItem(StorageKeys.ACTIVE_PUZZLE) || 'tango';
        if (this.activePlugin.id !== savedId && puzzleRegistry.get(savedId)) {
            this.activePlugin = puzzleRegistry.activate(savedId);
            this.updateHeader();
            this.updateMenuPlayTab();
            this.updateRulesContent();
            this.updateFreePlayLabels();
        }
    }

    updateHeader() {
        const appTitleEl = document.querySelector('.menu-hub-title-box .modal-title');
        if (appTitleEl) appTitleEl.textContent = `Cortex – ${this.activePlugin.name}`;

        const iconEl = document.getElementById('activePuzzleIcon');
        const nameEl = document.getElementById('activePuzzleName');
        if (iconEl) iconEl.textContent = this.activePlugin.icon;
        if (nameEl) nameEl.textContent = this.activePlugin.name;
    }

    openPuzzleSelectModal() {
        this.restoreSelectedPlugin();
        this.renderPuzzleSelectGrid();
        this.toggleModal('puzzleSelectModal', true);
    }

    renderPuzzleSelectGrid() {
        const grid = document.getElementById('puzzleSelectionGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const all = puzzleRegistry.getAll().slice().sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
        for (const p of all) {
            const card = document.createElement('div');
            card.className = `puzzle-select-card ${p.id === this.activePlugin.id ? 'active' : ''}`;
            card.innerHTML = `
                <span class="puzzle-icon">${p.icon}</span>
                <span class="puzzle-name">${p.name}</span>
                <span class="puzzle-desc">${p.description}</span>
                ${p.badge ? `<span class="puzzle-badge">${p.badge}</span>` : ''}
            `;
            card.addEventListener('click', () => {
                audio.vibrate(25);
                audio.playClear();
                this.toggleModal('puzzleSelectModal', false);
                this.switchPlugin(p.id);
                this.openMenuTab('play');
            });
            grid.appendChild(card);
        }

        // Vorschau auf kommende Puzzles
        const upcoming = [
            { name: 'Star Battle', icon: '⭐', desc: 'Sternenschlacht & Regionen' },
            { name: 'Futoshiki', icon: '📐', desc: 'Ungleichungs-Gitter' },
            { name: 'Tents & Trees', icon: '⛺', desc: 'Zelte & Bäume' }
        ];
        for (const u of upcoming) {
            const card = document.createElement('div');
            card.className = 'puzzle-select-card coming-soon';
            card.innerHTML = `
                <span class="puzzle-icon">${u.icon}</span>
                <span class="puzzle-name">${u.name}</span>
                <span class="puzzle-desc">${u.desc}</span>
                <span class="puzzle-badge" style="background:rgba(255,255,255,0.1); border-color:var(--border-color); color:var(--text-secondary);">Demnächst</span>
            `;
            grid.appendChild(card);
        }
    }

    updateI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
        this.updateHeader();
        this.updateMenuSettings();
        this.updateFreePlayLabels();
        this.updateRulesContent();
        this.updateMenuPlayTab();
    }

    updateRulesContent() {
        const rulesSec = document.getElementById('menuSecRules');
        if (!rulesSec) return;
        const html = this.activePlugin.getRules(getLang());
        rulesSec.innerHTML = `<h3 style="margin-bottom:12px; font-size:1.1rem; color:var(--accent-sun);">${this.activePlugin.name} ${t('menu_tab_rules')}</h3>` + html;
    }

    updateMenuPlayTab() {
        this.updateHeader();
        
        // Aktive Karte im Menü hervorheben
        const cardTango = document.getElementById('btnSelectTango');
        const cardSudoku = document.getElementById('btnSelectSudoku');
        if (cardTango) cardTango.classList.toggle('active', this.activePlugin.id === 'tango');
        if (cardSudoku) cardSudoku.classList.toggle('active', this.activePlugin.id === 'sudoku');

        const tutTutPro = document.getElementById('navTutorialPro');
        const tutPatterns = document.getElementById('navTutorialPatterns');

        const tutSteps = this.activePlugin.getTutorialSteps ? this.activePlugin.getTutorialSteps() : null;
        const sections = tutSteps?.sections || [];

        if (sections.length > 1) {
            if (tutTutPro) {
                tutTutPro.style.display = 'flex';
                const textEl = tutTutPro.querySelector('.tut-btn-text');
                if (textEl) {
                    textEl.textContent = sections[1].name;
                }
            }
        } else {
            if (tutTutPro) tutTutPro.style.display = 'none';
        }

        if (sections.length > 2) {
            if (tutPatterns) {
                tutPatterns.style.display = 'flex';
                const textEl = tutPatterns.querySelector('.tut-btn-text');
                if (textEl) {
                    textEl.textContent = sections[2].name;
                }
            }
        } else {
            if (tutPatterns) tutPatterns.style.display = 'none';
        }
    }

    bindEvents() {
        // Navigation / Menüs
        document.getElementById('btnMenu')?.addEventListener('click', () => this.openMenuTab('play'));
        document.getElementById('btnCloseMenu')?.addEventListener('click', () => this.toggleModal('menuModal', false));
        document.getElementById('btnCloseHint')?.addEventListener('click', () => this.toggleModal('hintModal', false));
        document.getElementById('btnCloseRules')?.addEventListener('click', () => this.toggleModal('rulesModal', false));

        // Zurück zu "Alle Rätsel" Button
        document.getElementById('btnBackToAllPuzzles')?.addEventListener('click', () => {
            audio.vibrate(25);
            audio.playClear();
            this.toggleModal('menuModal', false);
            this.openPuzzleSelectModal();
        });

        // Puzzle Switcher Modal
        document.getElementById('btnOpenPuzzleSelect')?.addEventListener('click', () => {
            this.openPuzzleSelectModal();
        });
        document.getElementById('btnClosePuzzleSelect')?.addEventListener('click', () => {
            this.toggleModal('puzzleSelectModal', false);
            this.openMenuTab('play');
        });

        // Menü-Hub Tabs
        document.getElementById('tabMenuPlay')?.addEventListener('click', () => this.switchMenuTab('play'));
        document.getElementById('tabMenuRules')?.addEventListener('click', () => this.switchMenuTab('rules'));
        document.getElementById('tabMenuStats')?.addEventListener('click', () => this.switchMenuTab('stats'));
        document.getElementById('tabMenuSettings')?.addEventListener('click', () => this.switchMenuTab('settings'));

        // Stats Sub-Tabs
        document.querySelectorAll('.stats-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.stats-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeStatsTab = btn.dataset.statsTab || 'all';
                this.updateMenuStats();
            });
        });

        // Spielmodi-Auswahl im Menü
        document.getElementById('navTutorial')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.restoreSelectedPlugin();
            this.startTutorial(0);
        });
        document.getElementById('navTutorialPro')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.restoreSelectedPlugin();
            this.startTutorialPro(0);
        });
        document.getElementById('navTutorialPatterns')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.restoreSelectedPlugin();
            this.startTutorialPatterns(0);
        });
        document.getElementById('navCampaign')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.restoreSelectedPlugin();
            this.openLevelSelectModal();
        });
        document.getElementById('navDaily')?.addEventListener('click', () => {
            this.requestStartDailyPuzzle();
        });
        document.getElementById('navFree')?.addEventListener('click', () => {
            this.toggleModal('menuModal', false);
            this.restoreSelectedPlugin();
            this.openFreePlayModal();
        });

        // Spiel-Aktionen
        document.getElementById('btnUndo')?.addEventListener('click', () => this.handleUndo());
        document.getElementById('btnRedo')?.addEventListener('click', () => this.handleRedo());
        document.getElementById('btnHint')?.addEventListener('click', () => this.handleHint());
        document.getElementById('btnRestart')?.addEventListener('click', () => this.restartCurrentPuzzle());
        document.getElementById('btnNotes')?.addEventListener('click', () => this.toggleNoteMode());
        document.getElementById('btnZoom')?.addEventListener('click', () => this.toggleCellZoom());

        // Dialog-Aktionen (Victory / Next)
        document.getElementById('btnVictoryNext')?.addEventListener('click', () => {
            this.toggleModal('victoryModal', false);
            const tutSteps = this.activePlugin.getTutorialSteps();

            if (this.currentMode === 'tutorial') {
                const basicsSteps = tutSteps.sections.find(s => s.id === 'basics')?.steps || [];
                if (this.tutorialStepIndex + 1 < basicsSteps.length) {
                    this.startTutorial(this.tutorialStepIndex + 1);
                } else if (tutSteps.sections.length > 1) {
                    this.startTutorialPro(0);
                } else {
                    this.startCampaignLevel(0);
                }
            } else if (this.currentMode === 'tutorial_pro' || this.currentMode === 'tutorial_advanced') {
                const secondSec = tutSteps.sections[1]?.steps || [];
                if (this.tutorialStepIndex + 1 < secondSec.length) {
                    this.startTutorialPro(this.tutorialStepIndex + 1);
                } else if (tutSteps.sections.length > 2) {
                    this.startTutorialPatterns(0);
                } else {
                    this.startCampaignLevel(0);
                }
            } else if (this.currentMode === 'tutorial_patterns') {
                const thirdSec = tutSteps.sections[2]?.steps || [];
                if (this.tutorialStepIndex + 1 < thirdSec.length) {
                    this.startTutorialPatterns(this.tutorialStepIndex + 1);
                } else {
                    this.startCampaignLevel(0);
                }
            } else if (this.currentMode === 'campaign') {
                this.startCampaignLevel(this.campaignLevelIndex + 1);
            } else if (this.currentMode === 'free') {
                this.openFreePlayModal();
            } else if (this.currentMode === 'daily') {
                this.restoreSelectedPlugin();
                const completed = this.getCompletedLevels();
                this.startCampaignLevel(completed.length < 120 ? completed.length : 0);
            } else {
                this.restoreSelectedPlugin();
                this.openMenuTab('play');
            }
        });

        document.getElementById('btnCloseHint')?.addEventListener('click', () => this.toggleModal('hintModal', false));
        document.getElementById('btnCloseLevelSelect')?.addEventListener('click', () => this.toggleModal('levelSelectModal', false));

        // Sicherheitsabfrage & Lösungsaufdeckung Listener
        document.getElementById('btnCancelReveal')?.addEventListener('click', () => this.toggleModal('confirmRevealModal', false));
        document.getElementById('btnConfirmReveal')?.addEventListener('click', () => this.revealSolutionAndSurrender());
        document.getElementById('btnProceedToDefeatModal')?.addEventListener('click', () => {
            if (Date.now() < this.ignoreClickUntil) return;
            this.openSolutionRevealedModal();
        });
        document.getElementById('btnRevealRestart')?.addEventListener('click', () => {
            this.toggleModal('solutionRevealedModal', false);
            this.restartCurrentPuzzle();
        });
        document.getElementById('btnRevealMenu')?.addEventListener('click', () => {
            this.toggleModal('solutionRevealedModal', false);
            if (this.currentMode === 'campaign') {
                this.openLevelSelectModal();
            } else if (this.currentMode === 'free') {
                this.openFreePlayModal();
            } else {
                this.openMenuTab('play');
            }
        });

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

        // Settings Picker Buttons
        document.getElementById('btnThemePicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('setting_theme'),
                options: THEMES.map(th => ({ value: th.id, label: t(th.labelKey), subtitle: th.subtitle })),
                currentValue: this.currentTheme,
                onSelect: (val) => this.applyTheme(val)
            });
        });

        document.getElementById('btnVibPicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('setting_vibration_strength'),
                options: [
                    { value: 'medium', label: t('setting_vib_medium'), subtitle: 'Standard-Haptik' },
                    { value: 'strong', label: t('setting_vib_strong'), subtitle: 'Kräftiges Feedback' },
                    { value: 'ultra', label: t('setting_vib_ultra'), subtitle: 'Maximaler Impuls' },
                    { value: 'soft', label: t('setting_vib_soft'), subtitle: 'Dezenter Klick' }
                ],
                currentValue: audio.vibrationStrength,
                onSelect: (val) => {
                    audio.setVibrationStrength(val);
                    this.updateMenuSettings();
                }
            });
        });

        document.getElementById('btnLangPicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('setting_language'),
                options: [
                    { value: 'de', label: 'Deutsch', subtitle: 'German' },
                    { value: 'en', label: 'English', subtitle: 'Englisch' }
                ],
                currentValue: getLang(),
                onSelect: (val) => {
                    setLang(val);
                    this.updateI18n();
                }
            });
        });

        document.getElementById('btnCellZoomLevelPicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('setting_cell_zoom_level'),
                options: [
                    { value: '1.25', label: t('setting_zoom_125'), subtitle: 'Dezente Vergrößerung' },
                    { value: '1.5', label: t('setting_zoom_150'), subtitle: 'Standard-Vergrößerung' },
                    { value: '1.75', label: t('setting_zoom_175'), subtitle: 'Starke Vergrößerung' },
                    { value: '2.0', label: t('setting_zoom_200'), subtitle: 'Maximale Vergrößerung' }
                ],
                currentValue: this.cellZoomLevel,
                onSelect: (val) => {
                    this.cellZoomLevel = val;
                    StorageManager.setItem(StorageKeys.CELL_ZOOM_LEVEL, val);
                    this.updateMenuSettings();
                    this.renderGrid();
                }
            });
        });

        document.getElementById('btnTimePicker')?.addEventListener('click', () => {
            this.openCustomTimePickerModal(this.reminderTime, (newTime) => {
                this.setReminderTime(newTime);
                this.updateMenuSettings();
            });
        });

        document.getElementById('btnCloseCustomSelect')?.addEventListener('click', () => {
            this.toggleModal('customSelectModal', false);
        });

        // Freies Spiel Picker Buttons
        document.getElementById('btnFreePlaySizePicker')?.addEventListener('click', () => {
            const sizeOptions = this.activePlugin.getSizes().map(s => ({
                value: s.id,
                label: s.label,
                subtitle: `${s.gridSize} × ${s.gridSize} Gitter`
            }));
            this.openCustomSelectModal({
                title: t('free_size'),
                options: sizeOptions,
                currentValue: this.freePlaySize,
                onSelect: (val) => {
                    this.freePlaySize = val;
                    this.updateFreePlayLabels();
                }
            });
        });

        document.getElementById('btnFreePlayDiffPicker')?.addEventListener('click', () => {
            this.openCustomSelectModal({
                title: t('free_diff'),
                options: [
                    { value: 'easy', label: t('free_diff_easy'), subtitle: 'Für Einsteiger' },
                    { value: 'medium', label: t('free_diff_medium'), subtitle: 'Standard-Herausforderung' },
                    { value: 'hard', label: t('free_diff_hard'), subtitle: 'Für Fortgeschrittene' }
                ],
                currentValue: this.freePlayDiff,
                onSelect: (val) => {
                    this.freePlayDiff = val;
                    this.updateFreePlayLabels();
                }
            });
        });

        // Toggles in Settings
        document.getElementById('settingSoundToggle')?.addEventListener('change', (e) => audio.setSound(e.target.checked));
        document.getElementById('settingVibrationToggle')?.addEventListener('change', (e) => audio.setVibration(e.target.checked));
        document.getElementById('settingAutoCheckToggle')?.addEventListener('change', (e) => {
            this.autoCheck = e.target.checked;
            StorageManager.setItem(StorageKeys.AUTO_CHECK, this.autoCheck);
            StorageManager.setItem('tango_auto_check', this.autoCheck);
            this.renderGrid();
        });
        document.getElementById('settingCellZoomToggle')?.addEventListener('change', (e) => {
            this.cellZoom = e.target.checked;
            StorageManager.setItem(StorageKeys.CELL_ZOOM, this.cellZoom);
            this.updateMenuSettings();
            this.updateZoomButton();
            this.renderGrid();
        });
        document.getElementById('settingReminderToggle')?.addEventListener('change', (e) => {
            this.setReminderEnabled(e.target.checked);
        });
        document.getElementById('btnPlayDailyFromReminder')?.addEventListener('click', () => {
            this.dismissReminderBanner();
            this.requestStartDailyPuzzle();
        });
        document.getElementById('btnCloseDailyReminder')?.addEventListener('click', () => {
            this.dismissReminderBanner();
        });

        // Reset Buttons
        document.getElementById('btnResetProgress')?.addEventListener('click', async () => {
            const confirmed = await this.showConfirmDialog({
                title: t('setting_reset_data'),
                message: t('setting_reset_confirm'),
                confirmText: t('btn_confirm_reset'),
                cancelText: t('btn_cancel'),
                isDanger: true
            });
            if (confirmed) {
                StorageManager.resetPuzzleData(this.activePlugin.id);
                this.clearActiveGameState();
                this.toggleModal('settingsModal', false);
                this.toggleModal('menuModal', false);
                audio.playClear();
                this.checkDailyReminder();
            }
        });

        const handleResetStats = async () => {
            const confirmed = await this.showConfirmDialog({
                title: t('stats_reset_btn'),
                message: t('stats_reset_confirm'),
                confirmText: t('btn_confirm_reset'),
                cancelText: t('btn_cancel'),
                isDanger: true
            });
            if (confirmed) {
                StorageManager.resetAllStats();
                this.updateMenuStats();
                audio.playClear();
            }
        };
        document.getElementById('btnResetStats')?.addEventListener('click', handleResetStats);
        document.getElementById('btnResetStatsModal')?.addEventListener('click', handleResetStats);

        // Lifecycle: Zwischenstand beim Verlassen, Schließen oder Minimieren sichern
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveActiveGameState();
            }
        });
        window.addEventListener('beforeunload', () => this.saveActiveGameState());
        window.addEventListener('pagehide', () => this.saveActiveGameState());
    }

    applyTheme(theme) {
        ThemeManager.applyTheme(theme);
        this.currentTheme = theme;
        this.updateMenuSettings();
    }

    renderGrid() {
        const container = document.getElementById('boardContainer');
        if (!container) return;
        container.className = 'board-container';
        container.removeAttribute('style');
        container.innerHTML = '';

        this.activePlugin.renderBoard(container, this.engine, this.getState(), (cellEl, r, c) => {
            this.attachCellEvents(cellEl, r, c);
        });

        this.renderKeypad();
    }

    renderKeypad() {
        const keypadContainer = document.getElementById('gameKeypad');
        if (!keypadContainer) return;

        const inputConfig = this.activePlugin.getInputConfig();
        if (inputConfig.type === 'keypad' || this.inputMode === 'keypad') {
            keypadContainer.style.display = 'flex';
            this.activePlugin.renderKeypad(keypadContainer, this.engine, this.getState(), (val) => {
                this.applyKeypadInput(val);
            });
        } else {
            keypadContainer.style.display = 'none';
        }
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
            }, 350);
        };

        const cancelHold = () => {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
        };

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

        cellEl.addEventListener('click', (e) => {
            if (didLongPress || (this.ignoreClickUntil && Date.now() < this.ignoreClickUntil)) {
                didLongPress = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            this.handleCellClick(r, c, e);
        });
    }

    handleCellClick(r, c) {
        if (this.ignoreClickUntil && Date.now() < this.ignoreClickUntil) return;
        if (!this.isGameActive || this.engine.locked[r][c]) {
            if (this.engine.locked[r][c]) {
                this.selectedCell = { r, c };
                this.renderGrid();
            }
            return;
        }

        const isSameCell = this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c;
        this.selectedCell = { r, c };
        this.hintPlacedCell = null;

        const inputConfig = this.activePlugin.getInputConfig();

        if (inputConfig.type === 'keypad') {
            // Wenn dieselbe Zelle nochmals angetippt wird: Wert direkt weiterschalten
            if (isSameCell) {
                if (this.isNoteMode) {
                    audio.vibrate(20);
                } else {
                    const nextVal = this.engine.cycleCellValue(r, c);
                    this.movesCount++;
                    if (nextVal > 0) {
                        audio.playDigit(nextVal);
                    } else {
                        audio.playClear();
                    }
                    this.renderGrid();
                    this.checkCompletion();
                    return;
                }
            }
            this.renderGrid();
            audio.vibrate(20);
            return;
        }

        // Direktes Durchschalten (Cycle-Modus für Tango, Akari & Nonogram, Tap-Aufdecken für Minesweeper)
        if (this.activePlugin.id === 'minesweeper') {
            if (this.isNoteMode) {
                this.engine.toggleFlag(r, c);
                audio.vibrate(30);
                this.movesCount++;
            } else {
                const res = this.engine.reveal(r, c);
                if (res) {
                    this.movesCount++;
                    if (res.result === 'defeat') {
                        this.isGameActive = false;
                        this.timer.stop();
                        audio.playError();
                        audio.vibrate(80);
                        if (this.currentMode === 'campaign' || this.currentMode === 'free') {
                            StatsManager.recordGame(this.activePlugin.id, this.engine.size, this.secondsElapsed, false);
                        }
                        this.renderGrid();
                        this.clearActiveGameState();
                        return;
                    } else {
                        audio.playClear();
                    }
                }
            }
        } else if (this.isNoteMode) {
            this.engine.cycleNoteValue(r, c);
            audio.vibrate(25);
        } else {
            const nextVal = this.engine.cycleCellValue(r, c);
            this.movesCount++;
            if (this.activePlugin.id === 'akari') {
                if (nextVal === 1) audio.playBulb();
                else if (nextVal === 2) audio.vibrate(25);
                else audio.playClear();
            } else if (this.activePlugin.id === 'nonogram') {
                if (nextVal === 1) audio.playSun();
                else if (nextVal === 2) audio.vibrate(25);
                else audio.playClear();
            } else {
                if (nextVal === 1) audio.playSun();
                else if (nextVal === 2) audio.playMoon();
                else audio.playClear();
            }
        }

        this.renderGrid();
        this.checkCompletion();
        this.saveActiveGameState();
    }

    handleCellLongPress(r, c) {
        if (!this.isGameActive || this.engine.locked[r][c]) return;

        this.ignoreClickUntil = Date.now() + 600;
        this.selectedCell = { r, c };
        this.hintPlacedCell = null;

        if (this.activePlugin.id === 'tango') {
            if (this.isNoteMode) {
                this.engine.setCellValue(r, c, 2, true);
            } else {
                this.engine.setCellValue(r, c, 2);
                this.movesCount++;
                audio.playMoon();
            }
        } else if (this.activePlugin.id === 'akari') {
            if (this.isNoteMode) {
                this.engine.setCellValue(r, c, 2, true);
            } else {
                this.engine.setCellValue(r, c, 2);
                this.movesCount++;
                audio.vibrate(30);
            }
        } else if (this.activePlugin.id === 'nonogram') {
            if (this.isNoteMode) {
                this.engine.setCellValue(r, c, 2, true);
            } else {
                this.engine.setCellValue(r, c, 2);
                this.movesCount++;
                audio.vibrate(30);
            }
        } else if (this.activePlugin.id === 'minesweeper') {
            this.engine.toggleFlag(r, c);
            this.movesCount++;
            audio.vibrate(30);
        }

        this.renderGrid();
        this.checkCompletion();
        this.saveActiveGameState();
    }

    applyKeypadInput(val) {
        if (!this.isGameActive) return;

        // Falls noch keine Zelle gewählt ist: wähle erste leere Zelle
        if (!this.selectedCell) {
            for (let r = 0; r < this.engine.size; r++) {
                for (let c = 0; c < this.engine.size; c++) {
                    if (!this.engine.locked[r][c] && this.engine.grid[r][c] === 0) {
                        this.selectedCell = { r, c };
                        break;
                    }
                }
                if (this.selectedCell) break;
            }
        }
        if (!this.selectedCell) return;

        const { r, c } = this.selectedCell;
        if (this.engine.locked[r][c]) return;

        this.hintPlacedCell = null;

        if (this.isNoteMode) {
            this.engine.setCellValue(r, c, val, true);
            audio.vibrate(25);
        } else {
            this.engine.setCellValue(r, c, val);
            this.movesCount++;
            if (val === 0) {
                audio.playClear();
            } else if (this.activePlugin.id === 'tango') {
                if (val === 1) audio.playSun();
                else if (val === 2) audio.playMoon();
            } else if (this.activePlugin.id === 'akari') {
                if (val === 1) audio.playBulb();
                else if (val === 2) audio.vibrate(25);
            } else {
                audio.playDigit(val);
            }
        }

        this.renderGrid();
        this.checkCompletion();
        this.saveActiveGameState();
    }

    prepareCampaignLevel(levelIndex) {
        this.currentMode = 'campaign';
        this.campaignLevelIndex = levelIndex;
        const level = this.activePlugin.getCampaignLevel(levelIndex);
        this.currentPuzzleData = level;

        this.engine = this.activePlugin.createEngine(level.size);
        this.engine.loadPuzzle(level);

        this.scrollToTop();
        this.selectedCell = null;
        this.hintPlacedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = false;
        this.timer.stop();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        const levelTitleEl = document.getElementById('levelTitle');
        if (levelTitleEl) {
            levelTitleEl.textContent = `${this.activePlugin.name} ${t('status_level')} ${levelIndex + 1}`;
        }

        this.renderGrid();
    }

    startCampaignLevel(levelIndex) {
        this.prepareCampaignLevel(levelIndex);
        this.isGameActive = true;
        this.timer.start();
        this.saveActiveGameState();
    }

    startTutorial(stepIndex = 0) {
        this.currentMode = 'tutorial';
        this.tutorialSectionId = 'basics';
        this.tutorialStepIndex = stepIndex;

        const tutData = this.activePlugin.getTutorialSteps();
        const step = tutData.sections.find(s => s.id === 'basics')?.steps[stepIndex];
        if (!step) {
            this.startCampaignLevel(0);
            return;
        }
        this.currentPuzzleData = step;

        this.engine = this.activePlugin.createEngine(step.size);
        this.engine.loadPuzzle(step);

        this.selectedCell = null;
        this.hintPlacedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.timer.start();

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
        document.getElementById('levelTitle').textContent = `${this.activePlugin.name} Grundlagen ${stepIndex + 1}`;

        this.renderGrid();
        this.saveActiveGameState();
    }

    startTutorialPro(stepIndex = 0) {
        this.currentMode = 'tutorial_pro';
        this.tutorialSectionId = 'math';
        this.tutorialStepIndex = stepIndex;

        const tutData = this.activePlugin.getTutorialSteps();
        const sec = tutData.sections[1];
        const step = sec?.steps[stepIndex];
        if (!step) {
            this.startCampaignLevel(0);
            return;
        }
        this.currentPuzzleData = step;

        this.engine = this.activePlugin.createEngine(step.size);
        this.engine.loadPuzzle(step);

        this.selectedCell = null;
        this.hintPlacedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.timer.start();

        this.scrollToTop();
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) {
            tutHeader.scrollTop = 0;
            tutHeader.style.display = 'block';
            document.getElementById('tutTitle').textContent = step.title;
            document.getElementById('tutSubtitle').textContent = step.subtitle;
            const mathBadge = document.getElementById('tutMathPrinciple');
            if (mathBadge) {
                mathBadge.style.display = step.mathPrinciple ? 'block' : 'none';
                mathBadge.textContent = step.mathPrinciple || '';
            }
            document.getElementById('tutDesc').innerHTML = step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        document.getElementById('levelTitle').textContent = `${this.activePlugin.name} ${sec.name} ${stepIndex + 1}`;

        this.renderGrid();
        this.saveActiveGameState();
    }

    startTutorialPatterns(stepIndex = 0) {
        this.currentMode = 'tutorial_patterns';
        this.tutorialSectionId = 'patterns';
        this.tutorialStepIndex = stepIndex;

        const tutData = this.activePlugin.getTutorialSteps();
        const sec = tutData.sections[2];
        const step = sec?.steps[stepIndex];
        if (!step) {
            this.startCampaignLevel(0);
            return;
        }
        this.currentPuzzleData = step;

        this.engine = this.activePlugin.createEngine(step.size);
        this.engine.loadPuzzle(step);

        this.selectedCell = null;
        this.hintPlacedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.timer.start();

        this.scrollToTop();
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) {
            tutHeader.scrollTop = 0;
            tutHeader.style.display = 'block';
            document.getElementById('tutTitle').textContent = step.title;
            document.getElementById('tutSubtitle').textContent = step.subtitle;
            const mathBadge = document.getElementById('tutMathPrinciple');
            if (mathBadge) {
                mathBadge.style.display = step.mathPrinciple ? 'block' : 'none';
                mathBadge.textContent = step.mathPrinciple || '';
            }
            document.getElementById('tutDesc').innerHTML = step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        document.getElementById('levelTitle').textContent = `${this.activePlugin.name} Muster ${stepIndex + 1}`;

        this.renderGrid();
        this.saveActiveGameState();
    }

    async requestStartDailyPuzzle() {
        const today = new Date().toISOString().slice(0, 10);
        if (this.isDailyPuzzleCompleted(today)) {
            const confirmed = await this.showConfirmDialog({
                title: t('daily_replay_title'),
                message: t('daily_replay_confirm'),
                confirmText: t('daily_btn_replay'),
                cancelText: t('btn_cancel'),
                isDanger: false
            });
            if (!confirmed) return;
        }
        this.toggleModal('menuModal', false);
        this.startDailyPuzzle();
    }

    startDailyPuzzle() {
        this.currentMode = 'daily';
        const today = new Date().toISOString().slice(0, 10);
        this.dailyDate = today;

        // Rotiere deterministisch zwischen allen registrierten Puzzles
        const dailyPlugin = puzzleRegistry.getRandomForDaily(today);
        if (dailyPlugin.id !== this.activePlugin.id) {
            this.activePlugin = puzzleRegistry.activate(dailyPlugin.id);
        }

        const puzzle = this.activePlugin.getDailyConfig(today);
        this.currentPuzzleData = puzzle;
        this.engine = this.activePlugin.createEngine(puzzle.size);
        this.engine.loadPuzzle(puzzle);

        this.selectedCell = null;
        this.hintPlacedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.timer.start();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        const dailyTitleEl = document.getElementById('levelTitle');
        if (dailyTitleEl) {
            dailyTitleEl.textContent = `${t('nav_daily')}: ${this.activePlugin.name} (${today})`;
        }
        this.renderGrid();
        this.saveActiveGameState();
    }

    startFreePlay(size, difficulty) {
        this.currentMode = 'free';
        this.freePlaySize = size;
        this.freePlayDiff = difficulty;
        const generated = this.activePlugin.generatePuzzle({ size, difficulty });
        this.currentPuzzleData = generated;

        this.engine = this.activePlugin.createEngine(size);
        this.engine.loadPuzzle(generated);

        this.selectedCell = null;
        this.hintPlacedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.timer.start();

        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.style.display = 'none';

        const freeTitleEl = document.getElementById('levelTitle');
        if (freeTitleEl) {
            freeTitleEl.textContent = `${this.activePlugin.name} ${t('nav_free')} ${size}×${size}`;
        }
        this.renderGrid();
        this.saveActiveGameState();
    }

    restartCurrentPuzzle() {
        if (typeof this.engine.restart === 'function') {
            this.engine.restart();
        } else {
            this.engine.loadPuzzle({
                size: this.engine.size,
                target: this.engine.target || this.engine.initialTarget,
                rowClues: this.engine.rowClues || this.engine.initialRowClues,
                colClues: this.engine.colClues || this.engine.initialColClues,
                initialGrid: this.engine.initialGrid,
                walls: this.engine.initialWalls || this.engine.walls,
                hEdges: this.engine.hEdges,
                vEdges: this.engine.vEdges,
                solution: this.engine.solution
            });
        }
        this.selectedCell = null;
        this.hintPlacedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.solutionRevealed = false;
        this.hideSolutionBanner();
        this.isGameActive = true;
        this.timer.start();
        this.renderGrid();
        audio.playClear();
        this.saveActiveGameState();
    }

    handleUndo() {
        if (!this.isGameActive) return;
        const res = this.engine.undo();
        if (res) {
            audio.playClear();
            this.renderGrid();
            this.saveActiveGameState();
        }
    }

    handleRedo() {
        if (!this.isGameActive) return;
        const res = this.engine.redo();
        if (res) {
            audio.playClear();
            this.renderGrid();
            this.saveActiveGameState();
        }
    }

    handleHint() {
        if (!this.isGameActive || this.solutionRevealed) return;

        const MAX_HINTS = 3;
        if (this.hintsUsed >= MAX_HINTS) {
            this.toggleModal('confirmRevealModal', true);
            return;
        }

        const hint = this.activePlugin.getHint(this.engine, { focusCell: this.selectedCell });
        if (!hint) {
            alert(t('hint_none_found') || 'Kein eindeutiger logischer Schritt gefunden.');
            return;
        }

        this.hintsUsed++;
        this.currentHint = hint;
        audio.playHint();

        const titleEl = document.getElementById('hintModalTitle');
        const descEl = document.getElementById('hintModalDesc');
        const btnApply = document.getElementById('btnHintApply');

        if (titleEl) titleEl.textContent = hint.strategy || hint.title || t('hint_title');
        if (descEl) descEl.textContent = hint.message || hint.description || '';

        if (btnApply) {
            const hasMove = (hint.value !== undefined || hint.expectedVal !== undefined);
            btnApply.style.display = hasMove ? 'block' : 'none';
            btnApply.onclick = () => {
                audio.vibrate(25);
                this.toggleModal('hintModal', false);

                const valToSet = hint.value !== undefined ? hint.value : hint.expectedVal;

                if (hint.edgeType !== undefined && hint.r !== undefined && hint.c !== undefined && valToSet !== undefined) {
                    // Slitherlink Kanten-Hinweis
                    if (typeof this.engine.setEdge === 'function') {
                        this.engine.setEdge(hint.edgeType, hint.r, hint.c, valToSet, false);
                    }
                    this.movesCount++;
                    if (valToSet === 1) {
                        audio.playSun ? audio.playSun() : audio.playClear();
                    } else {
                        audio.playClear();
                    }
                    this.renderGrid();
                    this.checkCompletion();
                    this.saveActiveGameState();
                } else if (hint.r !== undefined && hint.c !== undefined && valToSet !== undefined) {
                    this.selectedCell = { r: hint.r, c: hint.c };
                    this.hintPlacedCell = { r: hint.r, c: hint.c };
                    if (typeof this.engine.setCellValue === 'function') {
                        this.engine.setCellValue(hint.r, hint.c, valToSet);
                    }
                    this.movesCount++;
                    if (this.activePlugin.id === 'tango') {
                        if (valToSet === 1) audio.playSun();
                        else if (valToSet === 2) audio.playMoon();
                    } else if (this.activePlugin.id === 'akari') {
                        if (valToSet === 1) audio.playBulb();
                        else audio.playClear();
                    } else if (this.activePlugin.id === 'nonogram') {
                        if (valToSet === 1) audio.playBulb ? audio.playBulb() : audio.playSun();
                        else audio.playClear();
                    } else if (this.activePlugin.id === 'minesweeper') {
                        if (valToSet === 1) audio.playClear();
                        else audio.vibrate(30);
                    } else {
                        audio.playDigit(valToSet);
                    }
                    this.renderGrid();
                    this.checkCompletion();
                    this.saveActiveGameState();
                }
            };
        }

        this.renderGrid();
        this.toggleModal('hintModal', true);
    }

    revealSolutionAndSurrender() {
        this.toggleModal('confirmRevealModal', false);
        this.solutionRevealed = true;
        this.isGameActive = false;
        this.timer.stop();
        audio.playError();

        if (this.currentMode === 'campaign' || this.currentMode === 'free') {
            StatsManager.recordGame(this.activePlugin.id, this.engine.size, this.secondsElapsed, false);
        }

        this.renderGrid();
        const banner = document.getElementById('solutionRevealedBanner');
        if (banner) banner.style.display = 'flex';
    }

    openSolutionRevealedModal() {
        this.hideSolutionBanner();
        const formatted = formatTime(this.secondsElapsed);
        const revealTimeEl = document.getElementById('revealTime');
        const revealMovesEl = document.getElementById('revealMoves');
        if (revealTimeEl) revealTimeEl.textContent = formatted;
        if (revealMovesEl) revealMovesEl.textContent = this.movesCount;

        this.toggleModal('solutionRevealedModal', true);
    }

    hideSolutionBanner() {
        const banner = document.getElementById('solutionRevealedBanner');
        if (banner) banner.style.display = 'none';
    }

    checkCompletion() {
        const tutSections = this.activePlugin.getTutorialSteps().sections;
        let activeTutStep = null;

        if (this.currentMode === 'tutorial') {
            activeTutStep = tutSections.find(s => s.id === 'basics')?.steps[this.tutorialStepIndex];
        } else if (this.currentMode === 'tutorial_pro' || this.currentMode === 'tutorial_advanced') {
            activeTutStep = tutSections[1]?.steps[this.tutorialStepIndex];
        } else if (this.currentMode === 'tutorial_patterns') {
            activeTutStep = tutSections[2]?.steps[this.tutorialStepIndex];
        }

        if (activeTutStep) {
            let stepSuccess = true;
            if (this.activePlugin.id === 'slitherlink') {
                if (activeTutStep.solution) {
                    let tutDone = true;
                    if (activeTutStep.solution.hEdges) {
                        for (let r = 0; r <= this.engine.rows; r++) {
                            for (let c = 0; c < this.engine.cols; c++) {
                                const req = activeTutStep.solution.hEdges[r][c];
                                if (req > 0 && this.engine.hEdges[r][c] !== req) {
                                    tutDone = false;
                                    break;
                                }
                            }
                            if (!tutDone) break;
                        }
                    }
                    if (tutDone && activeTutStep.solution.vEdges) {
                        for (let r = 0; r < this.engine.rows; r++) {
                            for (let c = 0; c <= this.engine.cols; c++) {
                                const req = activeTutStep.solution.vEdges[r][c];
                                if (req > 0 && this.engine.vEdges[r][c] !== req) {
                                    tutDone = false;
                                    break;
                                }
                            }
                            if (!tutDone) break;
                        }
                    }
                    if (tutDone && (activeTutStep.requiresFullLoop || (this.currentMode === 'tutorial' && activeTutStep.id === 6))) {
                        tutDone = this.engine.isCompleted();
                    }
                    stepSuccess = tutDone;
                } else {
                    stepSuccess = this.engine.isCompleted();
                }
            } else if (activeTutStep.targetCells) {
                for (const target of activeTutStep.targetCells) {
                    if (this.engine.grid && this.engine.grid[target.r][target.c] !== target.val) {
                        stepSuccess = false;
                        break;
                    }
                }
            } else {
                stepSuccess = this.engine.isCompleted();
            }
            if (stepSuccess) {
                this.onLevelVictory(activeTutStep.explanation || '');
            }
            return;
        }

        if (this.engine.isCompleted()) {
            this.onLevelVictory();
        }
    }

    onLevelVictory(customExplanation = null) {
        this.isGameActive = false;
        this.timer.stop();
        this.clearActiveGameState();
        audio.playVictory();
        animations.launchConfetti();

        if (this.currentMode === 'campaign') {
            this.saveCampaignProgress(this.campaignLevelIndex);
            StatsManager.recordGame(this.activePlugin.id, this.engine.size, this.secondsElapsed, true);
        } else if (this.currentMode === 'daily') {
            this.saveDailyProgress();
            StatsManager.recordGame(this.activePlugin.id, this.engine.size, this.secondsElapsed, true);
        } else if (this.currentMode === 'free') {
            StatsManager.recordGame(this.activePlugin.id, this.engine.size, this.secondsElapsed, true);
        }

        const formatted = formatTime(this.secondsElapsed);
        const victoryTime = document.getElementById('victoryTime');
        const victoryMoves = document.getElementById('victoryMoves');
        if (victoryTime) victoryTime.textContent = formatted;
        if (victoryMoves) victoryMoves.textContent = this.movesCount;

        const expEl = document.getElementById('victoryExplanation');
        if (expEl) {
            expEl.textContent = customExplanation || '';
            expEl.style.display = customExplanation ? 'block' : 'none';
        }

        setTimeout(() => {
            this.toggleModal('victoryModal', true);
        }, 400);
    }

    clearActiveGameState() {
        StorageManager.removeItem(StorageKeys.ACTIVE_SESSION);
    }

    getEnginePuzzleData() {
        if (!this.engine) return null;
        if (this.activePlugin.id === 'tango') {
            return {
                size: this.engine.size,
                initialGrid: this.engine.initialGrid,
                hEdges: this.engine.hEdges,
                vEdges: this.engine.vEdges,
                solution: this.engine.solution
            };
        } else if (this.activePlugin.id === 'sudoku') {
            return {
                size: this.engine.size,
                initialGrid: this.engine.initialGrid,
                solution: this.engine.solution
            };
        } else if (this.activePlugin.id === 'akari') {
            return {
                size: this.engine.size,
                walls: this.engine.initialWalls || this.engine.walls,
                solution: this.engine.solution
            };
        } else if (this.activePlugin.id === 'nonogram') {
            return {
                size: this.engine.size,
                rowClues: this.engine.rowClues || this.engine.initialRowClues,
                colClues: this.engine.colClues || this.engine.initialColClues,
                target: this.engine.target || this.engine.initialTarget,
                initialGrid: this.engine.initialGrid,
                solution: this.engine.solution
            };
        } else if (this.activePlugin.id === 'slitherlink') {
            return {
                size: this.engine.size,
                rows: this.engine.rows,
                cols: this.engine.cols,
                clues: this.engine.clues,
                hEdges: this.engine.hEdges,
                vEdges: this.engine.vEdges,
                solution: this.engine.solution
            };
        } else if (this.activePlugin.id === 'minesweeper') {
            return {
                size: this.engine.size,
                rows: this.engine.rows,
                cols: this.engine.cols,
                mineCount: this.engine.mineCount,
                mines: this.engine.mines,
                initialGrid: this.engine.initialGrid,
                solution: this.engine.solution
            };
        }
        return null;
    }

    saveActiveGameState() {
        if (!this.engine || !this.isGameActive) return;

        const puzzleData = this.currentPuzzleData || this.getEnginePuzzleData();
        if (!puzzleData) return;

        const session = {
            pluginId: this.activePlugin.id,
            currentMode: this.currentMode,
            campaignLevelIndex: this.campaignLevelIndex,
            dailyDate: this.dailyDate || new Date().toISOString().slice(0, 10),
            tutorialSectionId: this.tutorialSectionId,
            tutorialStepIndex: this.tutorialStepIndex,
            freePlaySize: this.freePlaySize,
            freePlayDiff: this.freePlayDiff,
            puzzleData: puzzleData,
            engineState: {
                grid: this.engine.grid ? this.engine.grid.map(row => [...row]) : null,
                notes: this.engine.notes ? this.engine.notes.map(row => row.map(set => Array.from(set || []))) : null,
                hEdges: this.engine.hEdges ? this.engine.hEdges.map(row => [...row]) : null,
                vEdges: this.engine.vEdges ? this.engine.vEdges.map(row => [...row]) : null,
                hNotes: this.engine.hNotes ? this.engine.hNotes.map(row => row.map(set => Array.from(set || []))) : null,
                vNotes: this.engine.vNotes ? this.engine.vNotes.map(row => row.map(set => Array.from(set || []))) : null,
                undoStack: this.engine.undoStack ? this.engine.undoStack.map(action => ({ ...action })) : [],
                redoStack: this.engine.redoStack ? this.engine.redoStack.map(action => ({ ...action })) : []
            },
            secondsElapsed: this.secondsElapsed || (this.timer ? this.timer.secondsElapsed : 0),
            movesCount: this.movesCount || 0,
            hintsUsed: this.hintsUsed || 0,
            isNoteMode: !!this.isNoteMode,
            selectedCell: this.selectedCell ? { ...this.selectedCell } : null,
            solutionRevealed: !!this.solutionRevealed,
            isGameActive: this.isGameActive,
            savedAt: Date.now()
        };

        StorageManager.setJSON(StorageKeys.ACTIVE_SESSION, session);
    }

    restoreActiveGameState() {
        const session = StorageManager.getJSON(StorageKeys.ACTIVE_SESSION, null);
        if (!session || !session.pluginId || !session.puzzleData) return false;

        const plugin = puzzleRegistry.get(session.pluginId);
        if (!plugin) return false;

        this.activePlugin = puzzleRegistry.activate(session.pluginId);
        this.currentMode = session.currentMode || 'campaign';
        this.campaignLevelIndex = session.campaignLevelIndex ?? 0;
        this.dailyDate = session.dailyDate || new Date().toISOString().slice(0, 10);
        this.tutorialSectionId = session.tutorialSectionId || 'basics';
        this.tutorialStepIndex = session.tutorialStepIndex ?? 0;
        this.freePlaySize = session.freePlaySize || 6;
        this.freePlayDiff = session.freePlayDiff || 'medium';
        this.currentPuzzleData = session.puzzleData;

        // Engine erstellen und Puzzle laden
        const puzzleSize = session.puzzleData.size || session.puzzleData.walls?.length || 6;
        this.engine = this.activePlugin.createEngine(puzzleSize);
        this.engine.loadPuzzle(session.puzzleData);

        // Spielerstand (Gitter, Notizen, Kanten, Undo/Redo) wiederherstellen
        if (session.engineState?.grid && Array.isArray(session.engineState.grid)) {
            this.engine.grid = session.engineState.grid.map(row => [...row]);
        }
        if (session.engineState?.notes && Array.isArray(session.engineState.notes)) {
            this.engine.notes = session.engineState.notes.map(row => row.map(arr => new Set(arr || [])));
        }
        if (session.engineState?.hEdges && Array.isArray(session.engineState.hEdges)) {
            this.engine.hEdges = session.engineState.hEdges.map(row => [...row]);
        }
        if (session.engineState?.vEdges && Array.isArray(session.engineState.vEdges)) {
            this.engine.vEdges = session.engineState.vEdges.map(row => [...row]);
        }
        if (session.engineState?.hNotes && Array.isArray(session.engineState.hNotes)) {
            this.engine.hNotes = session.engineState.hNotes.map(row => row.map(arr => new Set(arr || [])));
        }
        if (session.engineState?.vNotes && Array.isArray(session.engineState.vNotes)) {
            this.engine.vNotes = session.engineState.vNotes.map(row => row.map(arr => new Set(arr || [])));
        }
        if (Array.isArray(session.engineState?.undoStack)) {
            this.engine.undoStack = session.engineState.undoStack;
        }
        if (Array.isArray(session.engineState?.redoStack)) {
            this.engine.redoStack = session.engineState.redoStack;
        }
        if (typeof this.engine.recalculateCounts === 'function') {
            this.engine.recalculateCounts();
        }

        this.secondsElapsed = session.secondsElapsed || 0;
        this.movesCount = session.movesCount || 0;
        this.hintsUsed = session.hintsUsed || 0;
        this.isNoteMode = !!session.isNoteMode;
        this.selectedCell = session.selectedCell || null;
        this.solutionRevealed = !!session.solutionRevealed;
        this.isGameActive = session.isGameActive !== false;

        // Timer fortsetzen falls aktiv
        if (this.isGameActive) {
            this.timer.start(this.secondsElapsed);
        } else {
            this.timer.stop();
            this.timer.secondsElapsed = this.secondsElapsed;
        }

        // UI-Elemente aktualisieren
        this.updateHeader();
        this.updateMenuPlayTab();
        this.updateRulesContent();

        const tutHeader = document.getElementById('tutorialBanner');
        if (this.currentMode.startsWith('tutorial')) {
            const tutSteps = this.activePlugin.getTutorialSteps ? this.activePlugin.getTutorialSteps() : null;
            const sec = tutSteps?.sections?.find(s => s.id === this.tutorialSectionId) || tutSteps?.sections?.[0];
            const step = sec?.steps?.[this.tutorialStepIndex];
            if (tutHeader && step) {
                tutHeader.style.display = 'block';
                document.getElementById('tutTitle').textContent = step.title;
                document.getElementById('tutSubtitle').textContent = step.subtitle;
                const mathBadge = document.getElementById('tutMathPrinciple');
                if (mathBadge) {
                    mathBadge.style.display = step.mathPrinciple ? 'block' : 'none';
                    mathBadge.textContent = step.mathPrinciple || '';
                }
                document.getElementById('tutDesc').innerHTML = step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            }
            const lvlTitleEl = document.getElementById('levelTitle');
            if (lvlTitleEl) {
                lvlTitleEl.textContent = `${this.activePlugin.name} ${sec?.name || 'Grundlagen'} ${this.tutorialStepIndex + 1}`;
            }
        } else if (this.currentMode === 'daily') {
            if (tutHeader) tutHeader.style.display = 'none';
            const lvlTitleEl = document.getElementById('levelTitle');
            if (lvlTitleEl) {
                lvlTitleEl.textContent = `${t('nav_daily')}: ${this.activePlugin.name} (${this.dailyDate})`;
            }
        } else if (this.currentMode === 'free') {
            if (tutHeader) tutHeader.style.display = 'none';
            const lvlTitleEl = document.getElementById('levelTitle');
            if (lvlTitleEl) {
                lvlTitleEl.textContent = `${this.activePlugin.name} ${t('nav_free')} ${this.engine.size}×${this.engine.size}`;
            }
        } else {
            // Campaign
            if (tutHeader) tutHeader.style.display = 'none';
            const lvlTitleEl = document.getElementById('levelTitle');
            if (lvlTitleEl) {
                lvlTitleEl.textContent = `${this.activePlugin.name} ${t('status_level')} ${this.campaignLevelIndex + 1}`;
            }
        }

        const noteBtn = document.getElementById('btnNotes');
        if (noteBtn) noteBtn.classList.toggle('active', this.isNoteMode);

        this.renderGrid();
        return true;
    }

    getCompletedLevels() {
        const key = StorageKeys.puzzleKey(this.activePlugin.id, 'campaign_completed');
        const completed = StorageManager.getJSON(key, null);
        if (completed !== null) return completed;
        // Fallback für Tango
        if (this.activePlugin.id === 'tango') {
            return StorageManager.getJSON('tango_campaign_completed', []);
        }
        return [];
    }

    saveCampaignProgress(lvlIndex) {
        const completed = this.getCompletedLevels();
        if (!completed.includes(lvlIndex)) {
            completed.push(lvlIndex);
            const key = StorageKeys.puzzleKey(this.activePlugin.id, 'campaign_completed');
            StorageManager.setJSON(key, completed);
            if (this.activePlugin.id === 'tango') {
                StorageManager.setJSON('tango_campaign_completed', completed);
            }
        }
    }

    isDailyPuzzleCompleted(dateStr = new Date().toISOString().slice(0, 10)) {
        const history = StorageManager.getJSON(StorageKeys.DAILY_HISTORY, StorageManager.getJSON('tango_daily_history', []));
        return Array.isArray(history) && history.includes(dateStr);
    }

    saveDailyProgress() {
        const today = new Date().toISOString().slice(0, 10);
        const history = StorageManager.getJSON(StorageKeys.DAILY_HISTORY, StorageManager.getJSON('tango_daily_history', []));
        if (!history.includes(today)) {
            history.push(today);
            StorageManager.setJSON(StorageKeys.DAILY_HISTORY, history);
            StorageManager.setJSON('tango_daily_history', history);
        }
        this.checkDailyReminder();
    }

    openLevelSelectModal() {
        this.restoreSelectedPlugin();
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
            tab.classList.toggle('active', chap === this.selectedCampaignChapter);
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

    updateFreePlayLabels() {
        const validSizes = this.activePlugin.getSizes().map(s => s.id);
        if (!validSizes.includes(this.freePlaySize)) {
            this.freePlaySize = this.activePlugin.id === 'sudoku' ? 9 : (validSizes.includes(6) ? 6 : validSizes[0]);
        }
        const lblSize = document.getElementById('lblFreePlaySizeValue');
        if (lblSize) {
            const sizeObj = this.activePlugin.getSizes().find(s => s.id === this.freePlaySize);
            lblSize.textContent = sizeObj ? sizeObj.label : `${this.freePlaySize} × ${this.freePlaySize}`;
        }
        const lblDiff = document.getElementById('lblFreePlayDiffValue');
        if (lblDiff) {
            lblDiff.textContent = t(`free_diff_${this.freePlayDiff}`) || this.freePlayDiff;
        }
    }

    openFreePlayModal() {
        this.restoreSelectedPlugin();
        this.updateFreePlayLabels();
        this.toggleModal('freePlayModal', true);
        const btnStart = document.getElementById('btnStartFreePlay');
        if (btnStart) {
            btnStart.onclick = () => {
                this.toggleModal('freePlayModal', false);
                this.startFreePlay(this.freePlaySize, this.freePlayDiff);
            };
        }
        const btnClose = document.getElementById('btnCloseFreePlay');
        if (btnClose) {
            btnClose.onclick = () => this.toggleModal('freePlayModal', false);
        }
    }

    openCustomSelectModal({ title, options, currentValue, onSelect }) {
        const titleEl = document.getElementById('customSelectTitle');
        const listEl = document.getElementById('customSelectOptionsList');
        if (titleEl) titleEl.textContent = title;
        if (!listEl) return;

        listEl.innerHTML = '';
        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'custom-select-item';
            if (opt.value === currentValue) item.classList.add('selected');

            const contentDiv = document.createElement('div');
            contentDiv.className = 'select-item-content';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'select-item-title';
            titleDiv.textContent = opt.label;
            contentDiv.appendChild(titleDiv);

            if (opt.subtitle) {
                const subDiv = document.createElement('div');
                subDiv.className = 'select-item-subtitle';
                subDiv.textContent = opt.subtitle;
                contentDiv.appendChild(subDiv);
            }

            const radioDiv = document.createElement('div');
            radioDiv.className = 'select-item-radio';
            const dotDiv = document.createElement('div');
            dotDiv.className = 'radio-dot';
            radioDiv.appendChild(dotDiv);

            item.appendChild(contentDiv);
            item.appendChild(radioDiv);

            item.addEventListener('click', () => {
                audio.vibrate(25);
                audio.playClear();
                this.toggleModal('customSelectModal', false);
                if (typeof onSelect === 'function') {
                    onSelect(opt.value);
                }
            });
            listEl.appendChild(item);
        });

        this.toggleModal('customSelectModal', true);
    }

    openCustomTimePickerModal(currentTimeStr, onSave) {
        let [h, m] = (currentTimeStr || '09:00').split(':').map(Number);
        if (isNaN(h)) h = 9;
        if (isNaN(m)) m = 0;

        const updateDisplay = () => {
            const hStr = h.toString().padStart(2, '0');
            const mStr = m.toString().padStart(2, '0');
            const hDisplay = document.getElementById('timeHourDisplay');
            const mDisplay = document.getElementById('timeMinuteDisplay');
            if (hDisplay) hDisplay.textContent = hStr;
            if (mDisplay) mDisplay.textContent = mStr;

            const fullTime = `${hStr}:${mStr}`;
            document.querySelectorAll('.time-preset-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.time === fullTime);
            });
        };

        document.getElementById('btnHourUp').onclick = () => { h = (h + 1) % 24; audio.vibrate(20); updateDisplay(); };
        document.getElementById('btnHourDown').onclick = () => { h = (h - 1 + 24) % 24; audio.vibrate(20); updateDisplay(); };
        document.getElementById('btnMinuteUp').onclick = () => { m = (m + 5) % 60; audio.vibrate(20); updateDisplay(); };
        document.getElementById('btnMinuteDown').onclick = () => { m = (m - 5 + 60) % 60; audio.vibrate(20); updateDisplay(); };

        document.querySelectorAll('.time-preset-btn').forEach(btn => {
            btn.onclick = () => {
                const parts = btn.dataset.time.split(':').map(Number);
                h = parts[0];
                m = parts[1];
                audio.vibrate(25);
                updateDisplay();
            };
        });

        const btnSave = document.getElementById('btnSaveTimePicker');
        if (btnSave) {
            btnSave.onclick = () => {
                audio.vibrate(30);
                const fullTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                this.toggleModal('customTimePickerModal', false);
                if (typeof onSave === 'function') onSave(fullTime);
            };
        }

        document.getElementById('btnCancelTimePicker').onclick = () => this.toggleModal('customTimePickerModal', false);
        document.getElementById('btnCloseTimePicker').onclick = () => this.toggleModal('customTimePickerModal', false);

        updateDisplay();
        this.toggleModal('customTimePickerModal', true);
    }

    openMenuTab(tabName = 'play') {
        this.restoreSelectedPlugin();
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
        } else if (tabName === 'rules') {
            this.updateRulesContent();
        }
    }

    updateMenuStats() {
        const allStats = StatsManager.getAggregatedStats(['tango', 'sudoku', 'akari', 'nonogram', 'slitherlink', 'minesweeper']);
        const tangoStats = StatsManager.getPuzzleStats('tango');
        const sudokuStats = StatsManager.getPuzzleStats('sudoku');
        const akariStats = StatsManager.getPuzzleStats('akari');
        const nonogramStats = StatsManager.getPuzzleStats('nonogram');
        const slitherlinkStats = StatsManager.getPuzzleStats('slitherlink');
        const minesweeperStats = StatsManager.getPuzzleStats('minesweeper');

        let displayStats = allStats;
        const currentTab = this.activeStatsTab || 'all';

        if (currentTab === 'tango') {
            displayStats = tangoStats;
        } else if (currentTab === 'sudoku') {
            displayStats = sudokuStats;
        } else if (currentTab === 'akari') {
            displayStats = akariStats;
        } else if (currentTab === 'nonogram') {
            displayStats = nonogramStats;
        } else if (currentTab === 'slitherlink') {
            displayStats = slitherlinkStats;
        } else if (currentTab === 'minesweeper') {
            displayStats = minesweeperStats;
        }
        displayStats.winRate = displayStats.played > 0 ? `${Math.round((displayStats.won / displayStats.played) * 100)}%` : '0%';

        const dailyHistory = StorageManager.getJSON(StorageKeys.DAILY_HISTORY, []);
        const streaks = calculateStreaks(dailyHistory);

        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setTxt('statPlayed', displayStats.played || 0);
        setTxt('statWon', displayStats.won || 0);
        setTxt('statWinRate', displayStats.winRate || '0%');
        setTxt('statCurrentStreak', `${streaks.currentStreak} 🔥`);
        setTxt('statMaxStreak', `${streaks.maxStreak} 🏆`);

        // Bestzeiten dynamisch nach aktuellem Tab rendern
        const grid = document.getElementById('statsBestTimesGrid');
        if (grid) {
            while (grid.firstChild) grid.removeChild(grid.firstChild);
            const bTimes = displayStats.bestTimes || {};

            let sizesToShow = [];
            if (currentTab === 'sudoku') {
                sizesToShow = [
                    { id: 4, labelKey: 'stats_best_time_4' },
                    { id: 9, labelKey: 'stats_best_time_9' },
                    { id: 16, labelKey: 'stats_best_time_16' }
                ];
            } else if (currentTab === 'tango') {
                sizesToShow = [
                    { id: 4, labelKey: 'stats_best_time_4' },
                    { id: 6, labelKey: 'stats_best_time_6' },
                    { id: 8, labelKey: 'stats_best_time_8' },
                    { id: 10, labelKey: 'stats_best_time_10' }
                ];
            } else if (currentTab === 'akari') {
                sizesToShow = [
                    { id: 6, labelKey: 'stats_best_time_6' },
                    { id: 8, labelKey: 'stats_best_time_8' },
                    { id: 10, labelKey: 'stats_best_time_10' },
                    { id: 14, labelKey: 'stats_best_time_14' }
                ];
            } else if (currentTab === 'minesweeper') {
                sizesToShow = [
                    { id: 8, labelKey: 'stats_best_time_8' },
                    { id: 12, labelKey: 'stats_best_time_12' },
                    { id: 16, labelKey: 'stats_best_time_16' },
                    { id: 30, labelKey: 'stats_best_time_30' }
                ];
            } else {
                // Gesamt-Tab
                sizesToShow = [
                    { id: 4, labelKey: 'stats_best_time_4' },
                    { id: 6, labelKey: 'stats_best_time_6' },
                    { id: 8, labelKey: 'stats_best_time_8' },
                    { id: 9, labelKey: 'stats_best_time_9' },
                    { id: 10, labelKey: 'stats_best_time_10' },
                    { id: 14, labelKey: 'stats_best_time_14' },
                    { id: 16, labelKey: 'stats_best_time_16' }
                ];
            }

            sizesToShow.forEach(sz => {
                const card = document.createElement('div');
                card.className = 'stat-card';

                const valSpan = document.createElement('span');
                valSpan.className = 'stat-val';
                valSpan.textContent = formatTime(bTimes[String(sz.id)]);

                const lblSpan = document.createElement('span');
                lblSpan.className = 'stat-lbl';
                let labelText = t(sz.labelKey);
                if (!labelText || labelText === sz.labelKey) {
                    const prefix = t('stats_best_time_prefix') || (getLang() === 'en' ? 'Best Time' : 'Bestzeit');
                    labelText = `${prefix} ${sz.id}×${sz.id}`;
                }
                lblSpan.textContent = labelText;

                card.appendChild(valSpan);
                card.appendChild(lblSpan);
                grid.appendChild(card);
            });
        }
    }

    updateMenuSettings() {
        const lblTheme = document.getElementById('lblThemeValue');
        if (lblTheme) {
            const th = THEMES.find(t => t.id === this.currentTheme);
            lblTheme.textContent = th ? t(th.labelKey) : this.currentTheme;
        }

        const lblVib = document.getElementById('lblVibValue');
        if (lblVib) lblVib.textContent = t(`setting_vib_${audio.vibrationStrength}`) || audio.vibrationStrength;

        const lblLang = document.getElementById('lblLangValue');
        if (lblLang) lblLang.textContent = getLang() === 'de' ? 'Deutsch' : 'English';

        const lblTime = document.getElementById('lblTimeValue');
        if (lblTime) lblTime.textContent = this.reminderTime;

        const sndToggle = document.getElementById('settingSoundToggle');
        if (sndToggle) sndToggle.checked = audio.enabled;

        const vibToggle = document.getElementById('settingVibrationToggle');
        if (vibToggle) vibToggle.checked = audio.vibrationEnabled;

        const chkToggle = document.getElementById('settingAutoCheckToggle');
        if (chkToggle) chkToggle.checked = this.autoCheck;

        const zoomToggle = document.getElementById('settingCellZoomToggle');
        if (zoomToggle) zoomToggle.checked = this.cellZoom;

        const zoomRow = document.getElementById('settingCellZoomLevelRow');
        if (zoomRow) zoomRow.style.display = this.cellZoom ? 'flex' : 'none';

        const lblZoomLevel = document.getElementById('lblCellZoomLevelValue');
        if (lblZoomLevel) {
            const zoomLabels = {
                '1.25': t('setting_zoom_125'),
                '1.5': t('setting_zoom_150'),
                '1.75': t('setting_zoom_175'),
                '2.0': t('setting_zoom_200')
            };
            lblZoomLevel.textContent = zoomLabels[this.cellZoomLevel] || `${this.cellZoomLevel}×`;
        }

        const remToggle = document.getElementById('settingReminderToggle');
        if (remToggle) remToggle.checked = this.reminderEnabled;

        const remTimeRow = document.getElementById('settingReminderTimeRow');
        if (remTimeRow) remTimeRow.style.display = this.reminderEnabled ? 'flex' : 'none';

        this.updateZoomButton();
    }

    updateSettingsTab() {
        this.updateMenuSettings();
    }

    setReminderEnabled(enabled) {
        this.reminderEnabled = enabled;
        StorageManager.setItem(StorageKeys.REMINDER_ENABLED, enabled);
        StorageManager.setItem('tango_reminder_enabled', enabled);

        const remTimeRow = document.getElementById('settingReminderTimeRow');
        if (remTimeRow) remTimeRow.style.display = enabled ? 'flex' : 'none';

        if (enabled && window.AndroidNotification?.scheduleDailyReminder) {
            const [h, m] = this.reminderTime.split(':').map(Number);
            try { window.AndroidNotification.scheduleDailyReminder(h, m); } catch (e) {}
        } else if (!enabled && window.AndroidNotification?.cancelDailyReminder) {
            try { window.AndroidNotification.cancelDailyReminder(); } catch (e) {}
        }
        this.checkDailyReminder();
    }

    setReminderTime(timeStr) {
        if (/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
            this.reminderTime = timeStr;
            StorageManager.setItem(StorageKeys.REMINDER_TIME, timeStr);
            StorageManager.setItem('tango_reminder_time', timeStr);
            if (this.reminderEnabled && window.AndroidNotification?.scheduleDailyReminder) {
                const [h, m] = timeStr.split(':').map(Number);
                try { window.AndroidNotification.scheduleDailyReminder(h, m); } catch (e) {}
            }
            this.checkDailyReminder();
        }
    }

    checkDailyReminder() {
        const today = new Date().toISOString().slice(0, 10);
        const isSolved = this.isDailyPuzzleCompleted(today);

        const badge = document.getElementById('dailyBadge');
        if (badge) badge.style.display = isSolved ? 'none' : 'inline-block';

        const banner = document.getElementById('dailyReminderBanner');
        if (isSolved || !this.reminderEnabled || this.reminderDismissed) {
            if (banner) banner.style.display = 'none';
            return;
        }

        const now = new Date();
        const [remH, remM] = this.reminderTime.split(':').map(Number);
        if (now.getHours() > remH || (now.getHours() === remH && now.getMinutes() >= remM)) {
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

    checkDailySystemNotification() {
        if (!this.reminderEnabled) return;
        const today = new Date().toISOString().slice(0, 10);
        if (this.isDailyPuzzleCompleted(today)) return;

        const lastNotif = StorageManager.getItem(StorageKeys.LAST_NOTIF_DATE, '');
        if (lastNotif === today) return;

        const now = new Date();
        const [remH, remM] = this.reminderTime.split(':').map(Number);
        if (now.getHours() > remH || (now.getHours() === remH && now.getMinutes() >= remM)) {
            if (window.AndroidNotification?.showNotification) {
                try {
                    window.AndroidNotification.showNotification(t('notif_title'), t('notif_body'));
                    StorageManager.setItem(StorageKeys.LAST_NOTIF_DATE, today);
                } catch (e) {}
            }
        }
    }

    toggleNoteMode() {
        this.isNoteMode = !this.isNoteMode;
        const btn = document.getElementById('btnNotes');
        if (btn) btn.classList.toggle('active', this.isNoteMode);
        audio.vibrate(30);
    }

    toggleCellZoom() {
        this.cellZoom = !this.cellZoom;
        StorageManager.setItem(StorageKeys.CELL_ZOOM, this.cellZoom);
        this.updateZoomButton();
        this.updateMenuSettings();
        this.renderGrid();
        audio.vibrate(25);
    }

    updateZoomButton() {
        const btn = document.getElementById('btnZoom');
        if (btn) btn.classList.toggle('active', !!this.cellZoom);
    }

    scrollToTop() {
        const tutHeader = document.getElementById('tutorialBanner');
        if (tutHeader) tutHeader.scrollTop = 0;
        const appRoot = document.getElementById('appRoot');
        if (appRoot) appRoot.scrollTop = 0;
        window.scrollTo(0, 0);
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = show ? 'flex' : 'none';
    }

    showConfirmDialog({ title, message, confirmText, cancelText, isDanger = true }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            if (!modal) { resolve(false); return; }

            const titleEl = document.getElementById('confirmTitle');
            const msgEl = document.getElementById('confirmMessage');
            const okBtn = document.getElementById('btnConfirmOk');
            const cancelBtn = document.getElementById('btnConfirmCancel');

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

export const TangoApp = CortexApp;
