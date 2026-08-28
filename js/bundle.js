/**
 * Cortex Combined Monolithic Bundle
 * 100% kompatibel mit allen mobilen WebViews, iOS Safari und Android Chrome
 */
(function() {
  'use strict';

// === Source: js\shared\puzzle-interface.js ===
/**
 * Cortex Puzzle Plugin Interface Definition & Types
 * Jedes Puzzle-Plugin implementiert diesen Vertrag.
 */

/**
 * @typedef {Object} PuzzleSizeOption
 * @property {string|number} id
 * @property {string} label
 * @property {number} gridSize
 */

/**
 * @typedef {Object} PuzzleDifficultyOption
 * @property {string} id
 * @property {string} label
 */

/**
 * @typedef {Object} PuzzlePlugin
 * @property {string} id - Eindeutige ID (z.B. 'tango', 'sudoku')
 * @property {string} name - Anzeigename (z.B. 'Tango', 'Sudoku')
 * @property {string} icon - Emoji / Kurzicon (z.B. '☀️🌙', '🔢')
 * @property {string} description - Kurzbeschreibung für Selektor
 * @property {string} [badge] - Optionales Badge (z.B. 'Neu', 'Beliebt')
 * @property {Function} getSizes - () => PuzzleSizeOption[]
 * @property {Function} getDifficulties - () => PuzzleDifficultyOption[]
 * @property {Function} getValues - () => number[]
 * @property {Function} getInputConfig - () => { type: 'cycle'|'keypad', keys?: number[] }
 * @property {Function} createEngine - (size: number) => Object
 * @property {Function} generatePuzzle - (opts: {size: number, difficulty: string, seed?: number}) => Object
 * @property {Function} solvePuzzle - (engine: Object, maxSolutions?: number) => any[]
 * @property {Function} renderBoard - (container: HTMLElement, engine: Object, state: Object, onCellInteraction?: Function) => void
 * @property {Function} renderKeypad - (container: HTMLElement, engine: Object, state: Object, onKeyInput?: Function) => void
 * @property {Function} getSymbolSvg - (value: number, extraClass?: string) => string
 * @property {Function} getHint - (engine: Object, options?: Object) => Object|null
 * @property {Function} getRules - (lang: string) => string
 * @property {Function} getCampaignConfig - () => { totalLevels: number, chapters: Array }
 * @property {Function} getCampaignLevel - (levelIndex: number) => Object
 * @property {Function} getDailyConfig - (dateStr: string) => Object
 * @property {Function} getTutorialSteps - () => { sections: Array<{ id: string, name: string, steps: Array }> }
 * @property {Function} getI18nStrings - (lang: string) => Object
 */

const PuzzleInterfaceVersion = '1.0.0';

// === Source: js\shared\storage.js ===
/**
 * Cortex Storage Manager
 * Zentralisierte, ausfallsichere LocalStorage-Verwaltung mit automatischer
 * Migration von älteren Tango-Versionen (tango_* -> cortex_*).
 */

const PREFIX = 'cortex_';

const StorageKeys = {
    MIGRATED: `${PREFIX}migrated`,
    
    // Globale Einstellungen
    THEME: `${PREFIX}theme`,
    SOUND: `${PREFIX}sound`,
    VIBRATION: `${PREFIX}vibration`,
    VIBRATION_STRENGTH: `${PREFIX}vibration_strength`,
    AUTO_CHECK: `${PREFIX}auto_check`,
    CELL_ZOOM: `${PREFIX}cell_zoom`,
    CELL_ZOOM_LEVEL: `${PREFIX}cell_zoom_level`,
    INPUT_MODE: `${PREFIX}input_mode`,
    LANGUAGE: `${PREFIX}language`,
    ACTIVE_PUZZLE: `${PREFIX}active_puzzle`,
    
    // Tägliche Erinnerungen & Benachrichtigungen
    REMINDER_ENABLED: `${PREFIX}reminder_enabled`,
    REMINDER_TIME: `${PREFIX}reminder_time`,
    LAST_NOTIF_DATE: `${PREFIX}last_notif_date`,

    // Globales Tagesrätsel-Tracking
    DAILY_HISTORY: `${PREFIX}daily_history`,

    // Aktiver Zwischenstand / Laufendes Spiel
    ACTIVE_SESSION: `${PREFIX}active_session`,

    // Puzzle-spezifische Key-Factory
    puzzleKey: (puzzleId, key) => `${PREFIX}p_${puzzleId}_${key}`
};

class StorageManager {
    /**
     * Führt eine einmütige Migration von 'tango_*' Keys zu 'cortex_*' durch.
     */
    static checkAndMigrate() {
        try {
            if (localStorage.getItem(StorageKeys.MIGRATED) === '1') {
                return;
            }

            // Globale Einstellungen migrieren
            const globalMappings = [
                ['tango_theme', StorageKeys.THEME],
                ['tango_sound', StorageKeys.SOUND],
                ['tango_vibration', StorageKeys.VIBRATION],
                ['tango_vibration_strength', StorageKeys.VIBRATION_STRENGTH],
                ['tango_auto_check', StorageKeys.AUTO_CHECK],
                ['tango_input_mode', StorageKeys.INPUT_MODE],
                ['tango_reminder_enabled', StorageKeys.REMINDER_ENABLED],
                ['tango_reminder_time', StorageKeys.REMINDER_TIME],
                ['tango_last_notif_date', StorageKeys.LAST_NOTIF_DATE],
                ['tango_daily_history', StorageKeys.DAILY_HISTORY]
            ];

            for (const [oldKey, newKey] of globalMappings) {
                const val = localStorage.getItem(oldKey);
                if (val !== null && localStorage.getItem(newKey) === null) {
                    localStorage.setItem(newKey, val);
                }
            }

            // Tango-spezifische Spielstände migrieren
            const tangoSpecific = [
                ['tango_campaign_completed', StorageKeys.puzzleKey('tango', 'campaign_completed')],
                ['tango_campaign_stars', StorageKeys.puzzleKey('tango', 'campaign_stars')],
                ['tango_stats', StorageKeys.puzzleKey('tango', 'stats')]
            ];

            for (const [oldKey, newKey] of tangoSpecific) {
                const val = localStorage.getItem(oldKey);
                if (val !== null && localStorage.getItem(newKey) === null) {
                    localStorage.setItem(newKey, val);
                }
            }

            // Aktives Puzzle initial auf 'tango' setzen, falls nicht gesetzt
            if (!localStorage.getItem(StorageKeys.ACTIVE_PUZZLE)) {
                localStorage.setItem(StorageKeys.ACTIVE_PUZZLE, 'tango');
            }

            localStorage.setItem(StorageKeys.MIGRATED, '1');
        } catch (e) {
            console.warn('StorageManager Migration Warnung:', e);
        }
    }

    static getItem(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            return val !== null ? val : fallback;
        } catch (e) {
            return fallback;
        }
    }

    static setItem(key, value) {
        try {
            localStorage.setItem(key, String(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    static getJSON(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            if (val === null) return fallback;
            return JSON.parse(val);
        } catch (e) {
            return fallback;
        }
    }

    static setJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Setzt alle Daten eines bestimmten Puzzles zurück
     */
    static resetPuzzleData(puzzleId) {
        try {
            localStorage.removeItem(StorageKeys.puzzleKey(puzzleId, 'campaign_completed'));
            localStorage.removeItem(StorageKeys.puzzleKey(puzzleId, 'campaign_stars'));
            localStorage.removeItem(StorageKeys.puzzleKey(puzzleId, 'stats'));
            const activeSession = StorageManager.getJSON(StorageKeys.ACTIVE_SESSION, null);
            if (activeSession && activeSession.pluginId === puzzleId) {
                localStorage.removeItem(StorageKeys.ACTIVE_SESSION);
            }
            // Für Tango auch Legacy Keys bereinigen
            if (puzzleId === 'tango') {
                localStorage.removeItem('tango_campaign_completed');
                localStorage.removeItem('tango_campaign_stars');
                localStorage.removeItem('tango_stats');
            }
        } catch (e) {}
    }

    /**
     * Setzt alle Statistiken zurück
     */
    static resetAllStats(puzzleIds = ['tango', 'sudoku', 'akari', 'nonogram', 'slitherlink']) {
        try {
            for (const pid of puzzleIds) {
                localStorage.removeItem(StorageKeys.puzzleKey(pid, 'stats'));
            }
            localStorage.removeItem('tango_stats');
        } catch (e) {}
    }
}

// === Source: js\shared\timer.js ===
/**
 * Cortex Game Timer
 * Präzise Zeitmessung für Rätsel.
 */

function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds === null || isNaN(seconds) || seconds < 0) {
        return '-';
    }
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

class GameTimer {
    constructor(onTick = null) {
        this.secondsElapsed = 0;
        this.timerInterval = null;
        this.onTick = onTick;
        this.isRunning = false;
    }

    start(initialSeconds = 0) {
        this.stop();
        this.secondsElapsed = initialSeconds;
        this.isRunning = true;
        if (this.onTick) this.onTick(this.secondsElapsed, this.getFormatted());

        this.timerInterval = setInterval(() => {
            if (this.isRunning) {
                this.secondsElapsed++;
                if (this.onTick) this.onTick(this.secondsElapsed, this.getFormatted());
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    reset() {
        this.stop();
        this.secondsElapsed = 0;
        if (this.onTick) this.onTick(0, '00:00');
    }

    getFormatted() {
        return formatTime(this.secondsElapsed);
    }
}

// === Source: js\shared\stats.js ===
/**
 * Cortex Statistics & Streaks Module
 * Berechnet aggregierte Statistiken, Streaks und Bestzeiten.
 */



function calculateStreaks(history = [], todayStr = null) {
    if (!Array.isArray(history) || history.length === 0) {
        return { currentStreak: 0, maxStreak: 0 };
    }

    const validDates = history.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (validDates.length === 0) {
        return { currentStreak: 0, maxStreak: 0 };
    }

    const parseToUtcDays = (dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
    };

    const uniqueDays = Array.from(new Set(validDates.map(parseToUtcDays))).sort((a, b) => a - b);
    if (uniqueDays.length === 0) {
        return { currentStreak: 0, maxStreak: 0 };
    }

    let maxStreak = 0;
    let currentRun = 0;
    let prevDay = null;

    for (const day of uniqueDays) {
        if (prevDay !== null && day === prevDay + 1) {
            currentRun++;
        } else {
            currentRun = 1;
        }
        if (currentRun > maxStreak) {
            maxStreak = currentRun;
        }
        prevDay = day;
    }

    const now = new Date();
    const todayFormatted = todayStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDay = parseToUtcDays(todayFormatted);

    const daySet = new Set(uniqueDays);
    let currentStreak = 0;

    if (daySet.has(todayDay)) {
        let check = todayDay;
        while (daySet.has(check)) {
            currentStreak++;
            check--;
        }
    } else if (daySet.has(todayDay - 1)) {
        let check = todayDay - 1;
        while (daySet.has(check)) {
            currentStreak++;
            check--;
        }
    } else {
        currentStreak = 0;
    }

    return { currentStreak, maxStreak };
}

class StatsManager {
    /**
     * Lädt die Statistiken für ein bestimmtes Puzzle
     */
    static getPuzzleStats(puzzleId) {
        const defaultStats = {
            played: 0,
            won: 0,
            lost: 0,
            bestTime: null,
            bestTimes: {},
            totalTime: 0
        };
        const key = StorageKeys.puzzleKey(puzzleId, 'stats');
        return StorageManager.getJSON(key, defaultStats);
    }

    /**
     * Speichert einen Spielabschluss (Gewonnen/Aufgegeben) für ein Puzzle
     */
    static recordGame(puzzleId, size, secondsElapsed, won = true) {
        const stats = this.getPuzzleStats(puzzleId);
        stats.played = (stats.played || 0) + 1;

        if (won) {
            stats.won = (stats.won || 0) + 1;
            stats.totalTime = (stats.totalTime || 0) + secondsElapsed;

            if (stats.bestTime === null || secondsElapsed < stats.bestTime) {
                stats.bestTime = secondsElapsed;
            }

            const sizeKey = String(size);
            if (!stats.bestTimes) stats.bestTimes = {};
            if (stats.bestTimes[sizeKey] === null || stats.bestTimes[sizeKey] === undefined || secondsElapsed < stats.bestTimes[sizeKey]) {
                stats.bestTimes[sizeKey] = secondsElapsed;
            }
        } else {
            stats.lost = (stats.lost || 0) + 1;
        }

        StorageManager.setJSON(StorageKeys.puzzleKey(puzzleId, 'stats'), stats);

        // Für Abwärtskompatibilität auch altes tango_stats synchron halten
        if (puzzleId === 'tango') {
            StorageManager.setJSON('tango_stats', stats);
        }

        return stats;
    }

    /**
     * Berechnet die Gesamt-Statistiken über alle Puzzles hinweg
     */
    static getAggregatedStats(puzzleIds = ['tango', 'sudoku', 'akari']) {
        let totalPlayed = 0;
        let totalWon = 0;
        let totalLost = 0;
        let totalTime = 0;
        let bestOverallTime = null;

        const aggregatedBestTimes = {};
        for (const id of puzzleIds) {
            const s = this.getPuzzleStats(id);
            totalPlayed += s.played || 0;
            totalWon += s.won || 0;
            totalLost += s.lost || 0;
            totalTime += s.totalTime || 0;
            if (s.bestTime !== null && s.bestTime !== undefined) {
                if (bestOverallTime === null || s.bestTime < bestOverallTime) {
                    bestOverallTime = s.bestTime;
                }
            }
            if (s.bestTimes) {
                for (const [sizeKey, timeVal] of Object.entries(s.bestTimes)) {
                    if (timeVal !== null && timeVal !== undefined) {
                        if (aggregatedBestTimes[sizeKey] === undefined || timeVal < aggregatedBestTimes[sizeKey]) {
                            aggregatedBestTimes[sizeKey] = timeVal;
                        }
                    }
                }
            }
        }

        const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;
        const dailyHistory = StorageManager.getJSON(StorageKeys.DAILY_HISTORY, []);
        const streaks = calculateStreaks(dailyHistory);

        return {
            played: totalPlayed,
            won: totalWon,
            lost: totalLost,
            winRate: `${winRate}%`,
            winRateNum: winRate,
            totalTime,
            bestTime: bestOverallTime,
            bestTimes: aggregatedBestTimes,
            streaks
        };
    }
}

// === Source: js\shared\themes.js ===
/**
 * Cortex Themes Manager
 * 5 handgefertigte Farbwelten: Dark, AMOLED, Light, Wood, Cyberpunk.
 */



const THEMES = [
    { id: 'dark', labelKey: 'setting_theme_dark', subtitle: 'Ausgewogen & modern' },
    { id: 'amoled', labelKey: 'setting_theme_amoled', subtitle: 'Tiefschwarz & stromsparend' },
    { id: 'light', labelKey: 'setting_theme_light', subtitle: 'Hell & minimalistisch' },
    { id: 'wood', labelKey: 'setting_theme_wood', subtitle: 'Natürliche Holztöne' },
    { id: 'cyberpunk', labelKey: 'setting_theme_cyberpunk', subtitle: 'Futuristisch & leuchtend' }
];

class ThemeManager {
    static getCurrentTheme() {
        return StorageManager.getItem(StorageKeys.THEME, 'dark');
    }

    static applyTheme(themeName) {
        const valid = THEMES.some(t => t.id === themeName) ? themeName : 'dark';
        document.body.className = `theme-${valid}`;
        StorageManager.setItem(StorageKeys.THEME, valid);
        // Auch für Legacy Kompatibilität
        StorageManager.setItem('tango_theme', valid);
        return valid;
    }
}

// === Source: js\shared\audio.js ===
/**
 * Cortex Web Audio Synthesizer
 * Erzeugt hochwertige, latenzfreie Soundeffekte ohne externe MP3/WAV-Dateien.
 */



class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.vibrationEnabled = true;
        this.vibrationStrength = 'medium';

        try {
            const savedSound = StorageManager.getItem(StorageKeys.SOUND, localStorage.getItem('tango_sound'));
            if (savedSound !== null) this.enabled = savedSound === 'true';

            const savedVib = StorageManager.getItem(StorageKeys.VIBRATION, localStorage.getItem('tango_vibration'));
            if (savedVib !== null) this.vibrationEnabled = savedVib === 'true';

            const savedVibStr = StorageManager.getItem(StorageKeys.VIBRATION_STRENGTH, localStorage.getItem('tango_vibration_strength'));
            if (savedVibStr !== null) this.vibrationStrength = savedVibStr;
        } catch (e) {
            console.warn('localStorage in audio.js nicht zugreifbar:', e);
        }
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSound(enabled) {
        this.enabled = enabled;
        StorageManager.setItem(StorageKeys.SOUND, enabled);
        StorageManager.setItem('tango_sound', enabled);
    }

    setVibration(enabled) {
        this.vibrationEnabled = enabled;
        StorageManager.setItem(StorageKeys.VIBRATION, enabled);
        StorageManager.setItem('tango_vibration', enabled);
    }

    setVibrationStrength(strength) {
        this.vibrationStrength = strength;
        StorageManager.setItem(StorageKeys.VIBRATION_STRENGTH, strength);
        StorageManager.setItem('tango_vibration_strength', strength);
        this.vibrate(40);
    }

    getVibrationMultiplier() {
        switch (this.vibrationStrength) {
            case 'ultra': return 2.2;
            case 'strong': return 1.5;
            case 'soft': return 0.5;
            case 'medium':
            default: return 1.0;
        }
    }

    vibrate(pattern = 70) {
        if (this.vibrationEnabled && 'vibrate' in navigator) {
            try {
                const mult = this.getVibrationMultiplier();
                let scaledPattern;
                if (typeof pattern === 'number') {
                    scaledPattern = Math.max(30, Math.round(pattern * mult));
                } else if (Array.isArray(pattern)) {
                    scaledPattern = pattern.map((val, idx) => {
                        return (idx % 2 === 0) ? Math.max(30, Math.round(val * mult)) : val;
                    });
                } else {
                    scaledPattern = pattern;
                }
                navigator.vibrate(scaledPattern);
            } catch (e) {
                // Ignore if not permitted
            }
        }
    }

    playSun() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
        this.vibrate(70);
    }

    playBulb() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Warmer Aufglüh-Ton (440Hz -> 660Hz E5 Ping)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.06);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
        this.vibrate(55);
    }

    playMoon() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
        this.vibrate(95);
    }

    playDigit(val = 1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Harmonische Frequenzskala für Ziffern 1 bis 9 (Pentatonisch / C-Dur)
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
        const freq = scale[(val - 1) % scale.length] || 440;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.06);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
        this.vibrate(40);
    }

    playClear() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
        this.vibrate(50);
    }

    playHint() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [587.33, 880, 1174.66]; // D5, A5, D6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.18, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.25);
        });
        this.vibrate([70, 50, 90]);
    }

    playError() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(110, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
        this.vibrate([100, 50, 100, 50, 100]);
    }

    playVictory() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chords = [
            { freq: 261.63, time: 0.0, dur: 0.15 },
            { freq: 329.63, time: 0.12, dur: 0.15 },
            { freq: 392.00, time: 0.24, dur: 0.18 },
            { freq: 523.25, time: 0.40, dur: 0.60 }
        ];

        chords.forEach(c => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(c.freq, now + c.time);

            gain.gain.setValueAtTime(0.25, now + c.time);
            gain.gain.exponentialRampToValueAtTime(0.001, now + c.time + c.dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + c.time);
            osc.stop(now + c.time + c.dur);
        });

        this.vibrate([80, 50, 90, 50, 120, 60, 200]);
    }
}

const audio = new AudioManager();

// === Source: js\shared\animations.js ===
/**
 * Cortex Visual FX & Animations
 * Konfetti-Partikel und Siegesanimationen auf einem HTML5-Canvas.
 */

class AnimationManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animId = null;
    }

    init(canvas) {
        this.canvas = canvas;
        if (canvas) {
            this.ctx = canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    launchConfetti() {
        if (!this.canvas || !this.ctx) return;
        this.resize();
        this.particles = [];

        const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#ffd700'];
        const count = 120;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.canvas.width * 0.5 + (Math.random() - 0.5) * 50,
                y: this.canvas.height * 0.4 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.9) * 18 - 4,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.35,
                opacity: 1,
                shape: Math.random() > 0.4 ? 'rect' : 'circle'
            });
        }

        if (this.animId) cancelAnimationFrame(this.animId);
        this.render();
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let activeParticles = 0;
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.98;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.008;

            if (p.opacity > 0 && p.y < this.canvas.height + 50) {
                activeParticles++;
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, p.opacity);
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.fillStyle = p.color;

                if (p.shape === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                }

                this.ctx.restore();
            }
        }

        if (activeParticles > 0) {
            this.animId = requestAnimationFrame(() => this.render());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

const animations = new AnimationManager();

// === Source: js\shared\i18n.js ===
/**
 * Cortex Internationalisierung (i18n)
 * Zentrale Sprachverwaltung für die App-Shell und modulare Puzzle-Plugins.
 */



let currentLang = 'de';

try {
    const saved = StorageManager.getItem(StorageKeys.LANGUAGE, localStorage.getItem('tango_lang'));
    if (saved === 'de' || saved === 'en') {
        currentLang = saved;
    }
} catch (e) {}

const baseTranslations = {
    de: {
        app_title: "Cortex Logikrätsel",
        subtitle: "Deine minimalistische Rätselsammlung",
        
        // Navigation & Modi
        nav_puzzles: "Rätsel-Auswahl",
        nav_campaign: "Kampagne",
        nav_daily: "Tagesrätsel",
        nav_free: "Freies Spiel",
        nav_tutorial: "Grundlagen",
        nav_tutorial_pro: "Mathematik",
        nav_tutorial_patterns: "Muster",
        sudoku_tut_advanced: "Fortgeschritten",
        nav_stats: "Statistiken",
        nav_settings: "Optionen",
        btn_switch_puzzle: "Anderes Rätsel wählen",
        btn_back_to_all_puzzles: "Alle Rätsel",
        puzzle_select_title: "Wähle dein Rätsel",
        puzzle_all_btn: "Alle Rätsel ▾",
        puzzle_select_desc: "Vollständig offline, werbefrei und logisch deduzierbar.",
        
        // Kampagnen-Tabs & Kapitel
        campaign_tab_1: "Kapitel 1",
        campaign_tab_2: "Kapitel 2",
        campaign_tab_3: "Kapitel 3",
        campaign_tab_4: "Kapitel 4",
        chapter_1: "Kapitel 1",
        chapter_2: "Kapitel 2",
        chapter_3: "Kapitel 3",
        chapter_4: "Kapitel 4",
        campaign_desc: "120 handgefertigte Level",
        daily_desc: "Täglich wechselnde Herausforderung",
        free_desc: "Individuelle Größe & Stufe",

        // Schwierigkeitsgrade
        diff_beginner: "Anfänger",
        diff_easy: "Einfach",
        diff_medium: "Mittel",
        diff_hard: "Schwer",
        diff_expert: "Meister",

        // Spielaktionen
        btn_undo: "Rückgängig",
        btn_redo: "Wiederholen",
        btn_hint: "Hinweis",
        btn_restart: "Neustart",
        btn_notes: "Notizen",
        btn_zoom: "Zoom",
        btn_check: "Prüfen",
        btn_next_level: "Nächstes Level",
        btn_back_menu: "Hauptmenü",
        btn_play_again: "Nochmal spielen",
        btn_continue: "Weiter",
        btn_start: "Starten",
        btn_save: "Speichern",

        // Status & Timer
        status_time: "Zeit",
        status_moves: "Züge",
        status_hints_used: "Hinweise",
        status_level: "Level",
        status_daily_date: "Tagesrätsel vom",
        status_streak: "Serie",
        status_completed: "Gelöst!",

        // Hinweise & Feedback
        hint_title: "Logischer Hinweis",
        hint_error_title: "Fehler gefunden",
        hint_button_apply: "Zug ausführen",
        hint_button_fix: "Feld korrigieren",
        hint_limit_reached: "Maximale Anzahl an Hinweisen für dieses Level erreicht (3/3).",
        reveal_confirm_title: "Lösung aufdecken?",
        reveal_confirm_desc: "Du hast alle 3 Hinweise verbraucht. Möchtest du das Rätsel aufgeben und die vollständige Lösung aufdecken?\n\n⚠️ Das nächste Level wird dabei nicht freigeschaltet und in der Statistik wird eine Niederlage vermerkt.",
        btn_reveal_solution: "Lösung aufdecken",
        reveal_defeat_title: "Rätsel aufgegeben",
        reveal_defeat_msg: "Die Lösung wurde hinterlegt und Fehler wurden rot markiert. Das nächste Level bleibt gesperrt und in deiner Statistik wurde eine Niederlage verbucht.",
        reveal_banner_hint: "Lösung wird angezeigt. Tippe auf Weiter zum Fortfahren.",
        btn_retry_level: "Level wiederholen",
        error_title: "Regelverstoß",
        victory_title: "Glückwunsch!",
        victory_msg: "Du hast dieses Rätsel erfolgreich und fehlerfrei gelöst!",
        victory_time_msg: "Benötigte Zeit:",
        victory_perfect: "Perfekt gelöst ohne Hinweise!",

        // Menü Hub Tabs
        menu_tab_play: "Spielen",
        menu_tab_rules: "Regeln",
        menu_tab_stats: "Statistik",
        menu_tab_settings: "Optionen",

        // Regeln (Header & Fallbacks)
        rules_header: "Spielregeln & Logik",
        rule_1_title: "1. Gleiche Anzahl pro Zeile & Spalte",
        rule_1_desc: "Jede Zeile und Spalte muss exakt gleich viele Sonnen ☀️ wie Monde 🌙 enthalten (z. B. 3☀️ & 3🌙 bei 6×6).",
        rule_2_title: "2. Maximal 2 gleiche Symbole nebeneinander",
        rule_2_desc: "Niemals dürfen 3 gleiche Symbole horizontal oder vertikal aufeinanderfolgen (kein ☀️☀️☀️ oder 🌙🌙🌙).",
        rule_3_title: "3. Gleichheitszeichen =",
        rule_3_desc: "Verbundene Nachbarfelder müssen dasselbe Symbol besitzen (beide ☀️ oder beide 🌙).",
        rule_4_title: "4. Gegenteilszeichen ×",
        rule_4_desc: "Verbundene Nachbarfelder müssen unterschiedliche Symbole besitzen (eine ☀️, ein 🌙).",
        rule_5_title: "5. Eindeutigkeit",
        rule_5_desc: "Keine zwei Zeilen und keine zwei Spalten dürfen vollständig identisch sein.",

        // Einstellungen
        settings_title: "Optionen",
        setting_theme: "Farbdesign",
        setting_theme_dark: "Modern Dark",
        setting_theme_amoled: "AMOLED Schwarz",
        setting_theme_light: "Hell / Clean",
        setting_theme_wood: "Warmes Holz",
        setting_theme_cyberpunk: "Cyberpunk Neon",
        setting_sound: "Soundeffekte",
        setting_vibration: "Haptisches Feedback (Vibration)",
        setting_vibration_strength: "Vibrationsstärke",
        setting_vib_ultra: "Ultra kräftig (Maximal)",
        setting_vib_strong: "Kräftig (Empfohlen)",
        setting_vib_medium: "Standard",
        setting_vib_soft: "Sanft",
        setting_auto_check: "Fehler sofort hervorheben",
        setting_cell_zoom: "Zellen-Zoom bei Auswahl",
        setting_cell_zoom_level: "Zoom-Stufe",
        setting_zoom_125: "1,25× (Dezent)",
        setting_zoom_150: "1,50× (Standard)",
        setting_zoom_175: "1,75× (Stark)",
        setting_zoom_200: "2,00× (Maximal)",
        setting_daily_reminder: "System-Benachrichtigung",
        setting_input_mode: "Eingabemodus",
        setting_input_cycle: "Direkt durchtippen",
        setting_input_keypad: "Ziffern- / Symbolleiste unten",
        setting_language: "Sprache",
        setting_reset_data: "Spielstand zurücksetzen",
        setting_reset_confirm: "Möchtest du deinen Kampagnen-Fortschritt für dieses Puzzle wirklich unwiderruflich löschen?",
        btn_confirm_reset: "Ja, zurücksetzen",
        btn_cancel: "Abbrechen",
        confirm_title: "Bestätigung erforderlich",

        // Freies Spiel Dialog
        free_title: "Freies Spiel konfigurieren",
        free_size: "Gittergröße",
        free_size_4: "4 × 4 (Mini)",
        free_size_6: "6 × 6 (Standard)",
        free_size_8: "8 × 8 (Groß)",
        free_size_9: "9 × 9 (Klassisch)",
        free_size_10: "10 × 10 (Maxi)",
        free_size_16: "16 × 16 (Hexadezimal)",
        free_diff: "Schwierigkeitsgrad",
        free_diff_easy: "Einfach",
        free_diff_medium: "Mittel",
        free_diff_hard: "Schwer",
        free_btn_start: "Rätsel starten",

        // Statistiken
        stats_title: "Statistiken",
        stats_tab_all: "Gesamt",
        stats_total_played: "Gespielt",
        stats_total_won: "Gelöst",
        stats_total_lost: "Aufgegeben",
        stats_win_rate: "Gewinnquote",
        stats_current_streak: "Aktuelle Tages-Serie",
        stats_max_streak: "Längste Tages-Serie",
        stats_best_times_title: "⚡ Bestzeiten",
        stats_best_time_prefix: "Bestzeit",
        stats_best_times: "Bestzeiten",
        stats_best_time: "Beste Gesamtzeit",
        stats_best_time_4: "Bestzeit 4×4",
        stats_best_time_6: "Bestzeit 6×6",
        stats_best_time_8: "Bestzeit 8×8",
        stats_best_time_9: "Bestzeit 9×9",
        stats_best_time_10: "Bestzeit 10×10",
        stats_best_time_12: "Bestzeit 12×12",
        stats_best_time_14: "Bestzeit 14×14",
        stats_best_time_16: "Bestzeit 16×16",
        stats_total_time: "Gesamte Spielzeit",
        stats_reset_btn: "Statistiken zurücksetzen",
        stats_reset_confirm: "Möchtest du alle Spielstatistiken und Serien wirklich auf 0 zurücksetzen?",

        // Tägliche Erinnerung & Benachrichtigungen
        setting_reminder: "Tägliche Erinnerung",
        setting_reminder_time: "Erinnerungszeit",
        reminder_banner_title: "Tagesrätsel wartet!",
        reminder_banner_desc: "Löse dein heutiges Rätsel für deine Serie.",
        reminder_btn_play: "Jetzt spielen",
        reminder_badge_new: "Neu",
        notif_title: "🧠 Cortex Tagesrätsel",
        notif_body: "Dein neues Tagesrätsel wartet auf dich! Halte deine Serie am Leben.",
        notif_test_btn: "Test-Alarm senden",
        notif_test_sent: "Test-Benachrichtigung wurde ausgelöst.",
        notif_permission_denied: "Benachrichtigungsberechtigung wurde abgelehnt.",
        daily_replay_title: "Tagesrätsel bereits gelöst",
        daily_replay_confirm: "Du hast das heutige Tagesrätsel bereits erfolgreich gelöst! Möchtest du es zur Übung erneut spielen? (Die Serie bleibt unberührt)",
        daily_btn_replay: "Erneut spielen"
    },
    en: {
        app_title: "Cortex Logic Puzzles",
        subtitle: "Your minimalist puzzle collection",
        
        // Navigation & Modes
        nav_puzzles: "Select Puzzle",
        nav_campaign: "Campaign",
        nav_daily: "Daily Puzzle",
        nav_free: "Free Play",
        nav_tutorial: "Basics",
        nav_tutorial_pro: "Math",
        nav_tutorial_patterns: "Patterns",
        sudoku_tut_advanced: "Advanced",
        nav_stats: "Statistics",
        nav_settings: "Settings",
        btn_switch_puzzle: "Choose Another Puzzle",
        btn_back_to_all_puzzles: "All Puzzles",
        puzzle_select_title: "Choose Your Puzzle",
        puzzle_all_btn: "All Puzzles ▾",
        puzzle_select_desc: "Fully offline, ad-free and purely logical.",
        
        // Campaign tabs & chapters
        campaign_tab_1: "Chapter 1",
        campaign_tab_2: "Chapter 2",
        campaign_tab_3: "Chapter 3",
        campaign_tab_4: "Chapter 4",
        chapter_1: "Chapter 1",
        chapter_2: "Chapter 2",
        chapter_3: "Chapter 3",
        chapter_4: "Chapter 4",
        campaign_desc: "120 handcrafted levels",
        daily_desc: "Daily changing challenge",
        free_desc: "Custom size & difficulty",

        // Difficulties
        diff_beginner: "Beginner",
        diff_easy: "Easy",
        diff_medium: "Medium",
        diff_hard: "Hard",
        diff_expert: "Master",

        // Game actions
        btn_undo: "Undo",
        btn_redo: "Redo",
        btn_hint: "Hint",
        btn_restart: "Restart",
        btn_notes: "Notes",
        btn_zoom: "Zoom",
        btn_check: "Check",
        btn_next_level: "Next Level",
        btn_back_menu: "Main Menu",
        btn_play_again: "Play Again",
        btn_continue: "Continue",
        btn_start: "Start",
        btn_save: "Save",

        // Status & Timer
        status_time: "Time",
        status_moves: "Moves",
        status_hints_used: "Hints",
        status_level: "Level",
        status_daily_date: "Daily Puzzle from",
        status_streak: "Streak",
        status_completed: "Completed!",

        // Hints & Feedback
        hint_title: "Logical Hint",
        hint_error_title: "Mistake Found",
        hint_button_apply: "Apply Move",
        hint_button_fix: "Fix Cell",
        hint_limit_reached: "Maximum hints reached for this level (3/3).",
        reveal_confirm_title: "Reveal Solution?",
        reveal_confirm_desc: "You have used all 3 hints. Do you want to forfeit and reveal the full solution?\n\n⚠️ Next level will not unlock and a defeat will be recorded.",
        btn_reveal_solution: "Reveal Solution",
        reveal_defeat_title: "Puzzle Forfeited",
        reveal_defeat_msg: "The solution is revealed with mistakes highlighted. Next level remains locked.",
        reveal_banner_hint: "Solution displayed. Tap Continue to proceed.",
        btn_retry_level: "Retry Level",
        error_title: "Rule Violation",
        victory_title: "Congratulations!",
        victory_msg: "You successfully solved this puzzle!",
        victory_time_msg: "Time taken:",
        victory_perfect: "Solved perfectly without hints!",

        // Menu Hub Tabs
        menu_tab_play: "Play",
        menu_tab_rules: "Rules",
        menu_tab_stats: "Stats",
        menu_tab_settings: "Settings",

        // Rules Header & Fallbacks
        rules_header: "Rules & Logic",
        rule_1_title: "1. Equal Number per Row & Column",
        rule_1_desc: "Each row and column must contain an equal number of suns ☀️ and moons 🌙.",
        rule_2_title: "2. Max 2 Consecutive Identical Symbols",
        rule_2_desc: "Never place 3 matching symbols in a row or column (no ☀️☀️☀️ or 🌙🌙🌙).",
        rule_3_title: "3. Equal Sign =",
        rule_3_desc: "Connected adjacent cells must have the same symbol.",
        rule_4_title: "4. Opposite Sign ×",
        rule_4_desc: "Connected adjacent cells must have opposite symbols.",
        rule_5_title: "5. Uniqueness",
        rule_5_desc: "No two rows and no two columns can be completely identical.",

        // Settings
        settings_title: "Settings",
        setting_theme: "Theme",
        setting_theme_dark: "Modern Dark",
        setting_theme_amoled: "AMOLED Black",
        setting_theme_light: "Light / Clean",
        setting_theme_wood: "Warm Wood",
        setting_theme_cyberpunk: "Cyberpunk Neon",
        setting_sound: "Sound Effects",
        setting_vibration: "Haptic Feedback (Vibration)",
        setting_vibration_strength: "Vibration Strength",
        setting_vib_ultra: "Ultra Strong (Max)",
        setting_vib_strong: "Strong (Recommended)",
        setting_vib_medium: "Standard",
        setting_vib_soft: "Soft",
        setting_auto_check: "Highlight Mistakes Immediately",
        setting_cell_zoom: "Cell Zoom on Selection",
        setting_cell_zoom_level: "Zoom Level",
        setting_zoom_125: "1.25× (Subtle)",
        setting_zoom_150: "1.50× (Standard)",
        setting_zoom_175: "1.75× (Strong)",
        setting_zoom_200: "2.00× (Maximum)",
        setting_daily_reminder: "System Notification",
        setting_input_mode: "Input Mode",
        setting_input_cycle: "Direct Tap Cycle",
        setting_input_keypad: "Bottom Number / Symbol Bar",
        setting_language: "Language",
        setting_reset_data: "Reset Progress",
        setting_reset_confirm: "Are you sure you want to permanently delete your campaign progress for this puzzle?",
        btn_confirm_reset: "Yes, Reset",
        btn_cancel: "Cancel",
        confirm_title: "Confirmation Required",

        // Free play modal
        free_title: "Configure Free Play",
        free_size: "Grid Size",
        free_size_4: "4 × 4 (Mini)",
        free_size_6: "6 × 6 (Standard)",
        free_size_8: "8 × 8 (Large)",
        free_size_9: "9 × 9 (Classic)",
        free_size_10: "10 × 10 (Maxi)",
        free_size_16: "16 × 16 (Hexadecimal)",
        free_diff: "Difficulty",
        free_diff_easy: "Easy",
        free_diff_medium: "Medium",
        free_diff_hard: "Hard",
        free_btn_start: "Start Puzzle",

        // Stats
        stats_title: "Statistics",
        stats_tab_all: "Overall",
        stats_total_played: "Played",
        stats_total_won: "Won",
        stats_total_lost: "Lost",
        stats_win_rate: "Win Rate",
        stats_current_streak: "Current Daily Streak",
        stats_max_streak: "Longest Daily Streak",
        stats_best_times_title: "⚡ Best Times",
        stats_best_time_prefix: "Best Time",
        stats_best_times: "Best Times",
        stats_best_time: "Best Overall Time",
        stats_best_time_4: "Best Time 4×4",
        stats_best_time_6: "Best Time 6×6",
        stats_best_time_8: "Best Time 8×8",
        stats_best_time_9: "Best Time 9×9",
        stats_best_time_10: "Best Time 10×10",
        stats_best_time_12: "Best Time 12×12",
        stats_best_time_14: "Best Time 14×14",
        stats_best_time_16: "Best Time 16×16",
        stats_total_time: "Total Playtime",
        stats_reset_btn: "Reset Statistics",
        stats_reset_confirm: "Do you really want to reset all game stats and streaks to zero?",

        // Notifications
        setting_reminder: "Daily Reminder",
        setting_reminder_time: "Reminder Time",
        reminder_banner_title: "Daily Puzzle is Ready!",
        reminder_banner_desc: "Solve today's puzzle to maintain your streak.",
        reminder_btn_play: "Play Now",
        reminder_badge_new: "New",
        notif_title: "🧠 Cortex Daily Puzzle",
        notif_body: "Your daily logic challenge is waiting! Keep your streak alive.",
        notif_test_btn: "Send Test Notification",
        notif_test_sent: "Test notification sent.",
        notif_permission_denied: "Notification permission denied.",
        daily_replay_title: "Daily Puzzle Already Solved",
        daily_replay_confirm: "You already solved today's daily puzzle! Do you want to play again for practice? (Your streak won't be affected)",
        daily_btn_replay: "Play Again"
    }
};

const pluginTranslations = {
    de: {},
    en: {}
};

function registerTranslations(pluginId, translationsObj) {
    if (!translationsObj) return;
    if (translationsObj.de) {
        Object.assign(pluginTranslations.de, translationsObj.de);
    }
    if (translationsObj.en) {
        Object.assign(pluginTranslations.en, translationsObj.en);
    }
}

function t(key, params = {}) {
    const langDict = { ...baseTranslations[currentLang], ...pluginTranslations[currentLang] };
    const fallbackDict = { ...baseTranslations.de, ...pluginTranslations.de };
    let text = langDict[key] || fallbackDict[key] || key;

    for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return text;
}

function setLang(lang) {
    if (lang === 'de' || lang === 'en') {
        currentLang = lang;
        StorageManager.setItem(StorageKeys.LANGUAGE, lang);
        StorageManager.setItem('tango_lang', lang);
    }
}

function getLang() {
    return currentLang;
}

// === Source: js\puzzles\akari\engine.js ===
/**
 * Akari (Light Up) Puzzle Engine
 * Verwaltet den Gitter-Zustand, Wände, Lichtstrahl-Ausbreitung,
 * Regelvalidierung, Undo/Redo und Notizen.
 */

const AKARI_EMPTY = 0;
const AKARI_BULB = 1;
const AKARI_DOT = 2;

class AkariEngine {
    constructor(size = 7) {
        this.size = size;
        this.rows = size;
        this.cols = size;

        // walls[r][c]: null = weißes Feld, -1 = unnummerierte Wand, 0..4 = nummerierte Wand
        this.walls = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        // grid[r][c]: 0 = Leer, 1 = Lampe 💡, 2 = Punkt •
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(AKARI_EMPTY));
        // locked[r][c]: true für schwarze Wände, false für weiße Felder
        this.locked = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        // notes[r][c]: Set von Notizen/Kandidaten
        this.notes = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => new Set()));

        this.initialGrid = null;
        this.initialWalls = null;
        this.solution = null;

        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Prüft, ob eine Koordinate eine Wand ist
     */
    isWall(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
        return this.walls[r][c] !== null;
    }

    /**
     * Gibt den Wand-Hinweis zurück (0..4, -1 für unnummeriert, oder null)
     */
    getWallClue(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
        return this.walls[r][c];
    }

    /**
     * Gibt alle 4 orthogonalen Nachbarn einer Zelle zurück
     */
    getOrthogonalNeighbors(r, c) {
        const neighbors = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    /**
     * Gibt alle weißen Zellen in der Sichtlinie (Sterne-Kreuz) einer Zelle zurück
     */
    getRayCells(r, c) {
        if (this.isWall(r, c)) return [];
        const cells = [{ r, c }];

        // Oben
        for (let rr = r - 1; rr >= 0; rr--) {
            if (this.isWall(rr, c)) break;
            cells.push({ r: rr, c });
        }
        // Unten
        for (let rr = r + 1; rr < this.rows; rr++) {
            if (this.isWall(rr, c)) break;
            cells.push({ r: rr, c });
        }
        // Links
        for (let cc = c - 1; cc >= 0; cc--) {
            if (this.isWall(r, cc)) break;
            cells.push({ r, c: cc });
        }
        // Rechts
        for (let cc = c + 1; cc < this.cols; cc++) {
            if (this.isWall(r, cc)) break;
            cells.push({ r, c: cc });
        }

        return cells;
    }

    /**
     * Berechnet die Ausleuchtungs-Matrix (wie viele Lampen jede Zelle beleuchten)
     * Gibt ein 2D-Array [r][c] zurück.
     */
    computeIllumination() {
        const illumination = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === AKARI_BULB && !this.isWall(r, c)) {
                    // Lampe beleuchtet sich selbst
                    illumination[r][c]++;

                    // Strahlen in 4 Richtungen aussenden
                    // Oben
                    for (let rr = r - 1; rr >= 0; rr--) {
                        if (this.isWall(rr, c)) break;
                        illumination[rr][c]++;
                    }
                    // Unten
                    for (let rr = r + 1; rr < this.rows; rr++) {
                        if (this.isWall(rr, c)) break;
                        illumination[rr][c]++;
                    }
                    // Links
                    for (let cc = c - 1; cc >= 0; cc--) {
                        if (this.isWall(r, cc)) break;
                        illumination[r][cc]++;
                    }
                    // Rechts
                    for (let cc = c + 1; cc < this.cols; cc++) {
                        if (this.isWall(r, cc)) break;
                        illumination[r][cc]++;
                    }
                }
            }
        }

        return illumination;
    }

    /**
     * Setzt den Wert einer Zelle (0 = Leer, 1 = Lampe, 2 = Punkt)
     */
    setCellValue(r, c, val, isNote = false) {
        if (this.isWall(r, c) || this.locked[r][c]) return false;

        const oldVal = this.grid[r][c];
        const oldNotes = new Set(this.notes[r][c]);

        if (isNote) {
            if (val === AKARI_DOT) {
                if (this.notes[r][c].has(AKARI_DOT)) {
                    this.notes[r][c].delete(AKARI_DOT);
                } else {
                    this.notes[r][c].add(AKARI_DOT);
                }
            } else if (val === AKARI_EMPTY) {
                this.notes[r][c].clear();
            }
            this.pushUndo({ r, c, oldVal, newVal: oldVal, oldNotes, newNotes: new Set(this.notes[r][c]) });
            return true;
        }

        if (oldVal === val) return true;

        this.pushUndo({ r, c, oldVal, newVal: val, oldNotes, newNotes: new Set() });
        this.grid[r][c] = val;
        this.notes[r][c].clear();
        return true;
    }

    /**
     * Schaltet den Wert einer Zelle zyklisch durch: Leer -> Lampe -> Punkt -> Leer
     */
    cycleCellValue(r, c) {
        if (this.isWall(r, c) || this.locked[r][c]) return this.grid[r][c];

        const current = this.grid[r][c];
        let nextVal = AKARI_EMPTY;
        if (current === AKARI_EMPTY) {
            nextVal = AKARI_BULB;
        } else if (current === AKARI_BULB) {
            nextVal = AKARI_DOT;
        } else {
            nextVal = AKARI_EMPTY;
        }

        this.setCellValue(r, c, nextVal);
        return nextVal;
    }

    /**
     * Schaltet den Notizen-Modus für eine Zelle um (Punkt setzen/entfernen)
     */
    cycleNoteValue(r, c) {
        if (this.isWall(r, c) || this.locked[r][c]) return;
        this.setCellValue(r, c, AKARI_DOT, true);
    }

    pushUndo(action) {
        this.undoStack.push(action);
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        const action = this.undoStack.pop();
        this.grid[action.r][action.c] = action.oldVal;
        this.notes[action.r][action.c] = new Set(action.oldNotes);
        this.redoStack.push(action);
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        const action = this.redoStack.pop();
        this.grid[action.r][action.c] = action.newVal;
        this.notes[action.r][action.c] = new Set(action.newNotes);
        this.undoStack.push(action);
        return true;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Setzt das Spielfeld auf die Ausgangsbelegung zurück
     */
    restart() {
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(AKARI_EMPTY));
        this.notes = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Lädt ein Puzzle
     * @param {Object} puzzleData - { size, walls: Array<Array<number|null>>, grid?: Array<Array<number>>, solution?: Array<Array<number>> }
     */
    loadPuzzle(puzzleData) {
        this.size = puzzleData.size || (puzzleData.walls ? puzzleData.walls.length : 7);
        this.rows = this.size;
        this.cols = this.size;

        this.walls = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(AKARI_EMPTY));
        this.locked = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.notes = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => new Set()));

        if (puzzleData.walls) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const w = puzzleData.walls[r][c];
                    if (w !== null && w !== undefined && w !== '') {
                        this.walls[r][c] = typeof w === 'number' ? w : parseInt(w, 10);
                        this.locked[r][c] = true;
                    } else {
                        this.walls[r][c] = null;
                        this.locked[r][c] = false;
                    }
                }
            }
        }

        if (puzzleData.initialGrid) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (!this.isWall(r, c) && puzzleData.initialGrid[r][c]) {
                        this.grid[r][c] = puzzleData.initialGrid[r][c];
                    }
                }
            }
        }

        this.initialWalls = JSON.parse(JSON.stringify(this.walls));
        this.initialGrid = JSON.parse(JSON.stringify(this.grid));
        this.solution = puzzleData.solution ? JSON.parse(JSON.stringify(puzzleData.solution)) : null;

        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Prüft auf Fehler (Kollisionen, überfüllte Wände oder Abweichungen von der Lösung)
     */
    findMistakes() {
        const val = this.validateRules();
        if (val.conflicts.size > 0) {
            const first = Array.from(val.conflicts)[0].split(',').map(Number);
            return {
                type: 'error_conflict',
                strategy: 'Fehler: Kollidierende Lampen',
                title: 'Fehler: Kollidierende Lampen',
                r: first[0],
                c: first[1],
                value: AKARI_EMPTY,
                expectedVal: AKARI_EMPTY,
                highlightCells: [{ r: first[0], c: first[1] }],
                message: `Zwei Lampen stehen in direkter Sichtlinie zueinander. Entferne die fehlerhafte Lampe bei Zeile ${first[0] + 1}, Spalte ${first[1] + 1}.`,
                description: `Zwei Lampen stehen in direkter Sichtlinie zueinander. Entferne die fehlerhafte Lampe bei Zeile ${first[0] + 1}, Spalte ${first[1] + 1}.`
            };
        }
        if (val.wallErrors.size > 0) {
            const first = Array.from(val.wallErrors)[0].split(',').map(Number);
            const wr = first[0];
            const wc = first[1];
            const clue = this.walls[wr][wc];
            const neighbors = this.getOrthogonalNeighbors(wr, wc);
            const wrongNeighbor = neighbors.find(n => {
                if (this.isWall(n.r, n.c)) return false;
                const isBulb = this.grid[n.r][n.c] === AKARI_BULB;
                const shouldBeBulb = this.solution ? this.solution[n.r][n.c] === 1 : false;
                return isBulb && !shouldBeBulb;
            }) || neighbors.find(n => !this.isWall(n.r, n.c) && this.grid[n.r][n.c] === AKARI_BULB) || neighbors[0];

            const targetR = wrongNeighbor ? wrongNeighbor.r : wr;
            const targetC = wrongNeighbor ? wrongNeighbor.c : wc;

            return {
                type: 'error_wall_overflow',
                strategy: 'Fehlerhafte Lampe entfernen',
                title: 'Fehlerhafte Lampe entfernen',
                r: targetR,
                c: targetC,
                value: AKARI_EMPTY,
                expectedVal: AKARI_EMPTY,
                highlightCells: [{ r: wr, c: wc }, ...neighbors],
                message: `Die Wand bei Zeile ${wr + 1}, Spalte ${wc + 1} mit Zahl ${clue} hat zu viele Lampen in ihrer Nachbarschaft. Entferne die überzählige Lampe bei (${targetR + 1}, ${targetC + 1}).`,
                description: `Die Wand bei Zeile ${wr + 1}, Spalte ${wc + 1} mit Zahl ${clue} hat zu viele Lampen in ihrer Nachbarschaft. Entferne die überzählige Lampe bei (${targetR + 1}, ${targetC + 1}).`
            };
        }
        if (this.solution) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (!this.isWall(r, c)) {
                        const playerVal = this.grid[r][c];
                        const solVal = this.solution[r][c] === 1 ? AKARI_BULB : AKARI_DOT;
                        if (playerVal === AKARI_BULB && solVal !== AKARI_BULB) {
                            return {
                                type: 'solution_mismatch',
                                strategy: 'Fehlerhafte Lampe',
                                title: 'Fehlerhafte Lampe',
                                r, c,
                                value: AKARI_EMPTY,
                                expectedVal: AKARI_EMPTY,
                                highlightCells: [{ r, c }],
                                message: `Auf Feld (${r + 1}, ${c + 1}) darf laut Spiellogik keine Lampe stehen. Entferne die Lampe.`,
                                description: `Auf Feld (${r + 1}, ${c + 1}) darf laut Spiellogik keine Lampe stehen. Entferne die Lampe.`
                            };
                        } else if (playerVal === AKARI_DOT && solVal === AKARI_BULB) {
                            return {
                                type: 'solution_mismatch',
                                strategy: 'Fehlerhafter Ausschluss',
                                title: 'Fehlerhafter Ausschluss',
                                r, c,
                                value: AKARI_BULB,
                                expectedVal: AKARI_BULB,
                                highlightCells: [{ r, c }],
                                message: `Auf Feld (${r + 1}, ${c + 1}) wurde fälschlicherweise ein Ausschluss (•) gesetzt, obwohl hier eine Lampe benötigt wird.`,
                                description: `Auf Feld (${r + 1}, ${c + 1}) wurde fälschlicherweise ein Ausschluss (•) gesetzt, obwohl hier eine Lampe benötigt wird.`
                            };
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Validiert alle Regeln und gibt Status-Informationen zurück
     */
    validateRules() {
        const errors = [];
        const conflicts = new Set(); // Koordinaten "r,c" von kollidierenden Lampen
        const wallErrors = new Set(); // Koordinaten "r,c" von verletzten Wänden
        const wallSatisfied = new Set(); // Koordinaten "r,c" von voll erfüllten Wänden

        const illumination = this.computeIllumination();

        // 1. Lampen-Kollisionen (zwei Lampen im selben Strahlengang)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === AKARI_BULB && !this.isWall(r, c)) {
                    if (illumination[r][c] > 1) {
                        conflicts.add(`${r},${c}`);
                        errors.push(`Lampe bei (${r + 1}, ${c + 1}) strahlt eine andere Lampe an.`);
                    }
                }
            }
        }

        // 2. Wand-Nachbarschaftszahlen überprüfen
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const clue = this.walls[r][c];
                if (clue !== null && clue >= 0) {
                    const neighbors = this.getOrthogonalNeighbors(r, c);
                    let bulbCount = 0;
                    let emptyCount = 0;

                    for (const n of neighbors) {
                        if (!this.isWall(n.r, n.c)) {
                            if (this.grid[n.r][n.c] === AKARI_BULB) {
                                bulbCount++;
                            } else if (this.grid[n.r][n.c] === AKARI_EMPTY) {
                                emptyCount++;
                            }
                        }
                    }

                    if (bulbCount > clue) {
                        wallErrors.add(`${r},${c}`);
                        errors.push(`Wand (${r + 1}, ${c + 1}) mit Zahl ${clue} hat zu viele Lampen (${bulbCount}).`);
                    } else if (bulbCount + emptyCount < clue) {
                        wallErrors.add(`${r},${c}`);
                        errors.push(`Wand (${r + 1}, ${c + 1}) mit Zahl ${clue} kann nicht mehr genug Lampen erhalten.`);
                    } else if (bulbCount === clue) {
                        wallSatisfied.add(`${r},${c}`);
                    }
                }
            }
        }

        // 3. Ausleuchtung aller weißen Zellen prüfen
        let allWhiteLit = true;
        let whiteCount = 0;
        let litCount = 0;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.isWall(r, c)) {
                    whiteCount++;
                    if (illumination[r][c] > 0) {
                        litCount++;
                    } else {
                        allWhiteLit = false;
                    }
                }
            }
        }

        // 4. Prüfen, ob alle nummerierten Wände exakt erfüllt sind
        let allWallsSatisfied = true;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const clue = this.walls[r][c];
                if (clue !== null && clue >= 0) {
                    if (!wallSatisfied.has(`${r},${c}`)) {
                        allWallsSatisfied = false;
                        break;
                    }
                }
            }
            if (!allWallsSatisfied) break;
        }

        const isComplete = allWhiteLit && conflicts.size === 0 && wallErrors.size === 0 && allWallsSatisfied;
        const isValid = conflicts.size === 0 && wallErrors.size === 0;

        return {
            isValid,
            isComplete,
            errors,
            conflicts,
            wallErrors,
            wallSatisfied,
            illumination,
            whiteCount,
            litCount
        };
    }

    /**
     * Prüft, ob das Akari-Rätsel vollständig und fehlerfrei gelöst ist
     */
    isCompleted() {
        return this.validateRules().isComplete;
    }

    /**
     * Gibt die Anzahl der gesetzten Lampen/Marker zurück
     */
    getFilledCount() {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.isWall(r, c) && this.grid[r][c] !== AKARI_EMPTY) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Gibt die Lösung des Akari-Rätsels zurück
     */
    getSolution() {
        if (this.solution) return this.solution;
        return null;
    }

    /**
     * Erstellt eine tiefe Kopie der Engine
     */
    clone() {
        const cloned = new AkariEngine(this.size);
        cloned.walls = JSON.parse(JSON.stringify(this.walls));
        cloned.grid = JSON.parse(JSON.stringify(this.grid));
        cloned.locked = JSON.parse(JSON.stringify(this.locked));
        cloned.notes = this.notes.map(row => row.map(cellSet => new Set(cellSet)));
        cloned.initialGrid = this.initialGrid ? JSON.parse(JSON.stringify(this.initialGrid)) : null;
        cloned.initialWalls = this.initialWalls ? JSON.parse(JSON.stringify(this.initialWalls)) : null;
        cloned.solution = this.solution ? JSON.parse(JSON.stringify(this.solution)) : null;
        return cloned;
    }
}

// === Source: js\puzzles\akari\solver.js ===
/**
 * Akari (Light Up) Solver & Smart Hint Engine
 * Findet Lösungen via Backtracking & Constraint-Propagation
 * und liefert didaktisch verständliche, schrittweise logische Hinweise.
 */



class AkariSolver {
    /**
     * Löst ein Akari-Rätsel und gibt bis zu maxSolutions Lösungen zurück.
     * Jede Lösung ist eine 2D-Matrix [r][c] mit 1 (Lampe) oder 0 (keine Lampe).
     */
    static solve(engine, maxSolutions = 2) {
        const rows = engine.rows;
        const cols = engine.cols;

        // White cells list
        const whiteCells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!engine.isWall(r, c)) {
                    whiteCells.push({ r, c });
                }
            }
        }

        // boardState[r][c]: 0 = unentschieden, 1 = Lampe, 2 = keine Lampe (Punkt/Wand)
        const boardState = Array.from({ length: rows }, () => Array(cols).fill(0));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.isWall(r, c)) {
                    boardState[r][c] = -1; // Wand
                }
            }
        }

        const solutions = [];

        function getRayIndices(r, c) {
            const indices = [{ r, c }];
            for (let rr = r - 1; rr >= 0 && !engine.isWall(rr, c); rr--) indices.push({ r: rr, c });
            for (let rr = r + 1; rr < rows && !engine.isWall(rr, c); rr++) indices.push({ r: rr, c });
            for (let cc = c - 1; cc >= 0 && !engine.isWall(r, cc); cc--) indices.push({ r, c: cc });
            for (let cc = c + 1; cc < cols && !engine.isWall(r, cc); cc++) indices.push({ r, c: cc });
            return indices;
        }

        function propagate(state) {
            let changed = true;
            while (changed) {
                changed = false;

                // 1. Wand-Bedingungen
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const clue = engine.walls[r][c];
                        if (clue !== null && clue >= 0) {
                            const neighbors = engine.getOrthogonalNeighbors(r, c);
                            let bulbs = 0;
                            let emptyNeighbors = [];

                            for (const n of neighbors) {
                                if (state[n.r][n.c] === 1) bulbs++;
                                else if (state[n.r][n.c] === 0) emptyNeighbors.push(n);
                            }

                            if (bulbs > clue) return false; // Widerspruch
                            if (bulbs + emptyNeighbors.length < clue) return false; // Widerspruch

                            if (bulbs === clue && emptyNeighbors.length > 0) {
                                for (const n of emptyNeighbors) {
                                    state[n.r][n.c] = 2; // keine Lampe
                                    changed = true;
                                }
                            } else if (bulbs + emptyNeighbors.length === clue && emptyNeighbors.length > 0) {
                                for (const n of emptyNeighbors) {
                                    state[n.r][n.c] = 1; // Lampe erzwingen
                                    // Alle Zellen im Strahlengang der neuen Lampe dürfen keine Lampe mehr sein
                                    const rays = getRayIndices(n.r, n.c);
                                    for (const rc of rays) {
                                        if (rc.r === n.r && rc.c === n.c) continue;
                                        if (state[rc.r][rc.c] === 1) return false; // Kollision
                                        if (state[rc.r][rc.c] === 0) {
                                            state[rc.r][rc.c] = 2;
                                            changed = true;
                                        }
                                    }
                                    changed = true;
                                }
                            }
                        }
                    }
                }

                // 2. Lampen-Kollisionen prüfen & Strahlen ausschließen
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (state[r][c] === 1) {
                            const rays = getRayIndices(r, c);
                            for (const rc of rays) {
                                if (rc.r === r && rc.c === c) continue;
                                if (state[rc.r][rc.c] === 1) return false; // Kollision
                                if (state[rc.r][rc.c] === 0) {
                                    state[rc.r][rc.c] = 2;
                                    changed = true;
                                }
                            }
                        }
                    }
                }

                // 3. Unbeleuchtete Zellen prüfen
                for (const cell of whiteCells) {
                    const rays = getRayIndices(cell.r, cell.c);
                    let isLit = false;
                    let candidateSpots = [];

                    for (const rc of rays) {
                        if (state[rc.r][rc.c] === 1) {
                            isLit = true;
                            break;
                        }
                        if (state[rc.r][rc.c] === 0) {
                            candidateSpots.push(rc);
                        }
                    }

                    if (!isLit) {
                        if (candidateSpots.length === 0) return false; // Kann nie beleuchtet werden!
                        if (candidateSpots.length === 1) {
                            const target = candidateSpots[0];
                            state[target.r][target.c] = 1;
                            changed = true;
                        }
                    }
                }
            }
            return true;
        }

        function isFullValid(state) {
            // Alle Wände erfüllt?
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const clue = engine.walls[r][c];
                    if (clue !== null && clue >= 0) {
                        const neighbors = engine.getOrthogonalNeighbors(r, c);
                        let bulbs = 0;
                        for (const n of neighbors) {
                            if (state[n.r][n.c] === 1) bulbs++;
                        }
                        if (bulbs !== clue) return false;
                    }
                }
            }

            // Alle weißen Zellen beleuchtet?
            for (const cell of whiteCells) {
                const rays = getRayIndices(cell.r, cell.c);
                let lit = false;
                for (const rc of rays) {
                    if (state[rc.r][rc.c] === 1) {
                        lit = true;
                        break;
                    }
                }
                if (!lit) return false;
            }

            return true;
        }

        function backtrack(state) {
            if (solutions.length >= maxSolutions) return;

            const copy = state.map(row => [...row]);
            if (!propagate(copy)) return;

            // Finde nächste freie Zelle
            let bestCell = null;
            let minBranching = Infinity;

            for (const cell of whiteCells) {
                if (copy[cell.r][cell.c] === 0) {
                    // Heuristik: Zelle neben nummerierter Wand bevorzugen
                    const neighbors = engine.getOrthogonalNeighbors(cell.r, cell.c);
                    let wallAdjScore = 0;
                    for (const n of neighbors) {
                        if (engine.walls[n.r][n.c] !== null && engine.walls[n.r][n.c] >= 0) {
                            wallAdjScore += 5;
                        }
                    }

                    const score = 10 - wallAdjScore;
                    if (score < minBranching) {
                        minBranching = score;
                        bestCell = cell;
                    }
                }
            }

            if (!bestCell) {
                if (isFullValid(copy)) {
                    const sol = Array.from({ length: rows }, () => Array(cols).fill(0));
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (copy[r][c] === 1) sol[r][c] = 1;
                        }
                    }
                    solutions.push(sol);
                }
                return;
            }

            // Zweig 1: Lampe setzen
            const branch1 = copy.map(row => [...row]);
            branch1[bestCell.r][bestCell.c] = 1;
            backtrack(branch1);

            if (solutions.length >= maxSolutions) return;

            // Zweig 2: Keine Lampe (Punkt)
            const branch2 = copy.map(row => [...row]);
            branch2[bestCell.r][bestCell.c] = 2;
            backtrack(branch2);
        }

        backtrack(boardState);
        return solutions;
    }

    /**
     * Findet einen logischen Hinweis für den aktuellen Spielstand
     */
    static findLogicalHint(engine, options = {}) {
        const rows = engine.rows;
        const cols = engine.cols;
        const focusCell = options.focusCell || null;

        // 1. FEHLER-ERKENNUNG ZUERST (Kollisionen, Überfüllungen, Widersprüche zur Lösung)
        const mistake = engine.findMistakes();
        if (mistake) return mistake;

        const illumination = engine.computeIllumination();
        const candidates = [];

        // 2. REGEL 1: 0er-Wände (alle noch leeren Nachbarn müssen Punkte sein)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.walls[r][c] === 0) {
                    const neighbors = engine.getOrthogonalNeighbors(r, c);
                    for (const n of neighbors) {
                        if (!engine.isWall(n.r, n.c) && engine.grid[n.r][n.c] === AKARI_EMPTY) {
                            candidates.push({
                                type: 'wall_zero',
                                strategy: '0er-Wand: Ausschluss',
                                title: '0er-Wand: Ausschluss',
                                r: n.r,
                                c: n.c,
                                value: AKARI_DOT,
                                expectedVal: AKARI_DOT,
                                highlightCells: [{ r: n.r, c: n.c }, { r, c }],
                                message: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} hat die Zahl 0. Keines ihrer Nachbarfelder darf eine Lampe enthalten. Setze einen Punkt (•).`,
                                description: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} hat die Zahl 0. Keines ihrer Nachbarfelder darf eine Lampe enthalten. Setze einen Punkt (•).`
                            });
                        }
                    }
                }
            }
        }

        // 3. REGEL 2: Erfüllte Wände (restliche leere Nachbarn müssen Punkte sein)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.walls[r][c];
                if (clue !== null && clue > 0) {
                    const neighbors = engine.getOrthogonalNeighbors(r, c);
                    let bulbs = 0;
                    const emptyNeighbors = [];

                    for (const n of neighbors) {
                        if (!engine.isWall(n.r, n.c)) {
                            if (engine.grid[n.r][n.c] === AKARI_BULB) bulbs++;
                            else if (engine.grid[n.r][n.c] === AKARI_EMPTY) emptyNeighbors.push(n);
                        }
                    }

                    if (bulbs === clue && emptyNeighbors.length > 0) {
                        for (const target of emptyNeighbors) {
                            candidates.push({
                                type: 'wall_satisfied',
                                strategy: 'Wand erfüllt',
                                title: 'Wand erfüllt',
                                r: target.r,
                                c: target.c,
                                value: AKARI_DOT,
                                expectedVal: AKARI_DOT,
                                highlightCells: [{ r: target.r, c: target.c }, { r, c }],
                                message: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} hat bereits alle ${clue} erforderlichen Lampen. Das Feld (${target.r + 1}, ${target.c + 1}) kann keine Lampe sein. Setze einen Punkt (•).`,
                                description: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} hat bereits alle ${clue} erforderlichen Lampen. Das Feld (${target.r + 1}, ${target.c + 1}) kann keine Lampe sein. Setze einen Punkt (•).`
                            });
                        }
                    }
                }
            }
        }

        // 4. REGEL 3: Erzwungene Lampen (Restbedarf = freie Nachbarn)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.walls[r][c];
                if (clue !== null && clue > 0) {
                    const neighbors = engine.getOrthogonalNeighbors(r, c);
                    let bulbs = 0;
                    const emptyNeighbors = [];

                    for (const n of neighbors) {
                        if (!engine.isWall(n.r, n.c)) {
                            if (engine.grid[n.r][n.c] === AKARI_BULB) bulbs++;
                            else if (engine.grid[n.r][n.c] === AKARI_EMPTY) emptyNeighbors.push(n);
                        }
                    }

                    const needed = clue - bulbs;
                    if (needed > 0 && emptyNeighbors.length === needed) {
                        for (const target of emptyNeighbors) {
                            candidates.push({
                                type: 'wall_forced_bulb',
                                strategy: 'Erzwungene Lampe',
                                title: 'Erzwungene Lampe',
                                r: target.r,
                                c: target.c,
                                value: AKARI_BULB,
                                expectedVal: AKARI_BULB,
                                highlightCells: [{ r: target.r, c: target.c }, { r, c }],
                                message: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} benötigt noch ${needed} Lampe(n) und hat genau ${emptyNeighbors.length} freie Nachbarfelder. Setze hier eine Lampe (💡).`,
                                description: `Die Wand bei Zeile ${r + 1}, Spalte ${c + 1} benötigt noch ${needed} Lampe(n) und hat genau ${emptyNeighbors.length} freie Nachbarfelder. Setze hier eine Lampe (💡).`
                            });
                        }
                    }
                }
            }
        }

        // 5. REGEL 4: Einsame unbeleuchtete Zelle (kann nur von genau 1 Zelle beleuchtet werden)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!engine.isWall(r, c) && illumination[r][c] === 0) {
                    const rays = engine.getRayCells(r, c);
                    const spots = [];

                    for (const rc of rays) {
                        if (engine.grid[rc.r][rc.c] === AKARI_EMPTY) {
                            spots.push(rc);
                        }
                    }

                    if (spots.length === 1) {
                        const target = spots[0];
                        candidates.push({
                            type: 'lonely_unlit',
                            strategy: 'Einzige Beleuchtung',
                            title: 'Einzige Beleuchtung',
                            r: target.r,
                            c: target.c,
                            value: AKARI_BULB,
                            expectedVal: AKARI_BULB,
                            highlightCells: [{ r: target.r, c: target.c }, { r, c }],
                            message: `Das unbeleuchtete Feld bei (${r + 1}, ${c + 1}) kann nur noch durch eine Lampe auf Position (${target.r + 1}, ${target.c + 1}) erleuchtet werden!`,
                            description: `Das unbeleuchtete Feld bei (${r + 1}, ${c + 1}) kann nur noch durch eine Lampe auf Position (${target.r + 1}, ${target.c + 1}) erleuchtet werden!`
                        });
                    }
                }
            }
        }

        // Wenn deduktive Kandidaten vorliegen:
        if (candidates.length > 0) {
            if (focusCell) {
                const focused = candidates.find(h => h.r === focusCell.r && h.c === focusCell.c);
                if (focused) return focused;
            }
            return candidates[0];
        }

        // 6. FALLBACK: Solver-Lösung konsultieren
        let sol = engine.solution;
        if (!sol) {
            const cleanEngine = new AkariEngine(engine.size);
            cleanEngine.loadPuzzle({
                size: engine.size,
                walls: engine.initialWalls || engine.walls
            });
            const solutions = AkariSolver.solve(cleanEngine, 1);
            if (solutions.length > 0) {
                sol = solutions[0];
            }
        }

        if (sol) {
            // Falls focusCell gewählt und leer ist
            if (focusCell && !engine.isWall(focusCell.r, focusCell.c) && engine.grid[focusCell.r][focusCell.c] === AKARI_EMPTY) {
                const targetVal = sol[focusCell.r][focusCell.c] === 1 ? AKARI_BULB : AKARI_DOT;
                const isBulb = targetVal === AKARI_BULB;
                return {
                    type: isBulb ? 'solution_bulb' : 'solution_dot',
                    strategy: isBulb ? 'Logische Lampe' : 'Logischer Ausschluss',
                    title: isBulb ? 'Logische Lampe' : 'Logischer Ausschluss',
                    r: focusCell.r,
                    c: focusCell.c,
                    value: targetVal,
                    expectedVal: targetVal,
                    highlightCells: [{ r: focusCell.r, c: focusCell.c }],
                    message: isBulb
                        ? `Auf dem ausgewählten Feld (${focusCell.r + 1}, ${focusCell.c + 1}) muss eine Lampe (💡) platziert werden.`
                        : `Auf dem ausgewählten Feld (${focusCell.r + 1}, ${focusCell.c + 1}) darf keine Lampe stehen. Setze einen Punkt (•).`,
                    description: isBulb
                        ? `Auf dem ausgewählten Feld (${focusCell.r + 1}, ${focusCell.c + 1}) muss eine Lampe (💡) platziert werden.`
                        : `Auf dem ausgewählten Feld (${focusCell.r + 1}, ${focusCell.c + 1}) darf keine Lampe stehen. Setze einen Punkt (•).`
                };
            }

            // Ansonsten erstes leeres Feld
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (!engine.isWall(r, c) && engine.grid[r][c] === AKARI_EMPTY) {
                        const targetVal = sol[r][c] === 1 ? AKARI_BULB : AKARI_DOT;
                        const isBulb = targetVal === AKARI_BULB;
                        return {
                            type: isBulb ? 'solution_bulb' : 'solution_dot',
                            strategy: isBulb ? 'Logische Lampe' : 'Logischer Ausschluss',
                            title: isBulb ? 'Logische Lampe' : 'Logischer Ausschluss',
                            r,
                            c,
                            value: targetVal,
                            expectedVal: targetVal,
                            highlightCells: [{ r, c }],
                            message: isBulb
                                ? `Auf Feld (${r + 1}, ${c + 1}) muss eine Lampe (💡) platziert werden, um die Ausleuchtung zu sichern.`
                                : `Feld (${r + 1}, ${c + 1}) darf keine Lampe enthalten. Setze einen Punkt (•).`,
                            description: isBulb
                                ? `Auf Feld (${r + 1}, ${c + 1}) muss eine Lampe (💡) platziert werden, um die Ausleuchtung zu sichern.`
                                : `Feld (${r + 1}, ${c + 1}) darf keine Lampe enthalten. Setze einen Punkt (•).`
                        };
                    }
                }
            }
        }

        return null;
    }
}

// === Source: js\puzzles\akari\generator.js ===
/**
 * Akari (Light Up) Procedural Puzzle Generator
 * Generiert deterministisch eindeutige, lösbare Akari-Rätsel
 * in verschiedenen Schwierigkeitsgraden und Gittergrößen.
 */




class AkariGenerator {
    /**
     * Pseudo-Random Number Generator (LCG / Mulberry32)
     */
    static createPrng(seed) {
        let s = Math.floor(Math.abs(seed)) % 2147483647;
        if (s === 0) s = 123456789;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    /**
     * Generiert ein eindeutiges Akari-Rätsel
     * @param {Object} opts - { size: number, difficulty: 'easy'|'medium'|'hard', seed?: number }
     */
    static generatePuzzle(opts = {}) {
        const size = opts.size || 7;
        const difficulty = opts.difficulty || 'medium';
        const seed = opts.seed !== undefined ? opts.seed : Math.floor(Math.random() * 10000000);
        const rand = this.createPrng(seed);

        const rows = size;
        const cols = size;

        // Wand-Dichte nach Größe und Stufe
        let wallRatio = 0.20;
        if (size <= 6) wallRatio = 0.18;
        else if (size >= 10) wallRatio = 0.22;

        const totalCells = rows * cols;
        const targetWallCount = Math.max(3, Math.floor(totalCells * wallRatio));

        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            attempts++;

            // 1. Wände mit 180° Rotationssymmetrie platzieren
            const walls = Array.from({ length: rows }, () => Array(cols).fill(null));
            let placedWalls = 0;

            const candidateCoords = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    candidateCoords.push({ r, c });
                }
            }
            // Shuffle
            for (let i = candidateCoords.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                [candidateCoords[i], candidateCoords[j]] = [candidateCoords[j], candidateCoords[i]];
            }

            for (const { r, c } of candidateCoords) {
                if (placedWalls >= targetWallCount) break;
                const symR = rows - 1 - r;
                const symC = cols - 1 - c;

                if (walls[r][c] === null && walls[symR][symC] === null) {
                    walls[r][c] = -1; // Unnummerierte Wand
                    walls[symR][symC] = -1;
                    placedWalls += (r === symR && c === symC) ? 1 : 2;
                }
            }

            // 2. Erzeuge eine gültige Lampen-Konfiguration
            const engine = new AkariEngine(size);
            engine.loadPuzzle({ size, walls });

            // Finde eine Lösung mit dem Solver
            const solutions = AkariSolver.solve(engine, 1);
            if (solutions.length === 0) continue;

            const solution = solutions[0];

            // 3. Berechne alle tatsächlichen Nachbar-Lampen-Zahlen für alle Wände
            const fullClues = Array.from({ length: rows }, () => Array(cols).fill(null));
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (walls[r][c] !== null) {
                        const neighbors = engine.getOrthogonalNeighbors(r, c);
                        let bulbs = 0;
                        for (const n of neighbors) {
                            if (!engine.isWall(n.r, n.c) && solution[n.r][n.c] === 1) {
                                bulbs++;
                            }
                        }
                        fullClues[r][c] = bulbs;
                    }
                }
            }

            // 4. Decke Wand-Zahlen auf basierend auf Schwierigkeit
            // easy: ~75% nummeriert, medium: ~50%, hard: ~30%
            let clueProb = 0.50;
            if (difficulty === 'easy') clueProb = 0.75;
            else if (difficulty === 'hard') clueProb = 0.32;

            const puzzleWalls = Array.from({ length: rows }, () => Array(cols).fill(null));
            const wallList = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (walls[r][c] !== null) {
                        wallList.push({ r, c });
                        if (rand() < clueProb) {
                            puzzleWalls[r][c] = fullClues[r][c];
                        } else {
                            puzzleWalls[r][c] = -1; // unnummeriert
                        }
                    }
                }
            }

            // 5. Teste Eindeutigkeit
            const testEngine = new AkariEngine(size);
            testEngine.loadPuzzle({ size, walls: puzzleWalls });

            let testSols = AkariSolver.solve(testEngine, 2);

            // Falls nicht eindeutig: decke schrittweise weitere Wände auf
            if (testSols.length !== 1) {
                // Shuffle unnummerierte Wände
                const unnumbered = wallList.filter(w => puzzleWalls[w.r][w.c] === -1);
                for (let i = unnumbered.length - 1; i > 0; i--) {
                    const j = Math.floor(rand() * (i + 1));
                    [unnumbered[i], unnumbered[j]] = [unnumbered[j], unnumbered[i]];
                }

                for (const w of unnumbered) {
                    puzzleWalls[w.r][w.c] = fullClues[w.r][w.c];
                    testEngine.loadPuzzle({ size, walls: puzzleWalls });
                    testSols = AkariSolver.solve(testEngine, 2);
                    if (testSols.length === 1) break;
                }
            }

            if (testSols.length === 1) {
                return {
                    size,
                    difficulty,
                    seed,
                    walls: puzzleWalls,
                    initialGrid: Array.from({ length: rows }, () => Array(cols).fill(AKARI_EMPTY)),
                    solution
                };
            }
        }

        // Robuster Fallback: Strukturierte Standard-Vorlage
        return this.getFallbackPuzzle(size, difficulty);
    }

    /**
     * Fallback-Puzzle Generator bei Timeout
     */
    static getFallbackPuzzle(size = 7, difficulty = 'medium') {
        const walls = Array.from({ length: size }, () => Array(size).fill(null));
        // Ein paar Standard-Wände
        const mid = Math.floor(size / 2);
        walls[1][1] = 1;
        walls[1][size - 2] = -1;
        walls[size - 2][1] = -1;
        walls[size - 2][size - 2] = 2;
        if (size >= 7) {
            walls[mid][mid] = 0;
        }

        const engine = new AkariEngine(size);
        engine.loadPuzzle({ size, walls });
        const sols = AkariSolver.solve(engine, 1);
        const solution = sols.length > 0 ? sols[0] : Array.from({ length: size }, () => Array(size).fill(0));

        return {
            size,
            difficulty,
            walls,
            initialGrid: Array.from({ length: size }, () => Array(size).fill(AKARI_EMPTY)),
            solution
        };
    }
}

// === Source: js\puzzles\akari\renderer.js ===
/**
 * Akari (Light Up) DOM Renderer & SVG Asset Generator
 * Rendert das Gitter mit dynamischen Lichtstrahlen, Wänden,
 * SVG-Glühbirnen, Konflikt-Hervorhebungen und Theme-Effekten.
 */




class AkariRenderer {
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

// === Source: js\puzzles\akari\data\i18n.js ===
/**
 * Akari-spezifische Übersetzungen (DE & EN)
 */

const AKARI_I18N = {
    de: {
        akari_title: "Akari",
        akari_desc: "Lichtstrahlen & Glühbirnen auf Wänden",
        akari_btn_clear: "Leeren",
        akari_btn_bulb: "Lampe",
        akari_btn_dot: "Punkt",
        akari_rules_title: "Akari Regeln",
        akari_chapter_1: "Glühwürmchen",
        akari_chapter_2: "Laternenstadt",
        akari_chapter_3: "Lichtkuppel",
        akari_chapter_4: "Photonen-Palast",
        akari_tut_basics: "Grundlagen",
        akari_tut_advanced: "Fortgeschritten"
    },
    en: {
        akari_title: "Akari",
        akari_desc: "Light rays & bulbs with wall numbers",
        akari_btn_clear: "Clear",
        akari_btn_bulb: "Bulb",
        akari_btn_dot: "Dot",
        akari_rules_title: "Akari Rules",
        akari_chapter_1: "Fireflies",
        akari_chapter_2: "Lantern City",
        akari_chapter_3: "Light Dome",
        akari_chapter_4: "Photon Palace",
        akari_tut_basics: "Basics",
        akari_tut_advanced: "Advanced"
    }
};

// === Source: js\puzzles\akari\data\levels.js ===
/**
 * Akari Level & Tagesrätsel-Generierung
 * 120 deterministisch generierte Kampagnen-Level in 4 Kapiteln (6×6, 8×8, 10×10, 12×12/14×14)
 * und synchrones Tagesrätsel.
 */



function getAkariCampaignLevel(levelIndex) {
    // 120 Level in 4 Kapiteln:
    // Kapitel 1 (0–29): Glühwürmchen (Level 1–15: 6×6 Easy, Level 16–25: 6×6 Medium, Level 26–30: 7×7 Easy)
    // Kapitel 2 (30–59): Laternenstadt (Level 31–45: 8×8 Easy, Level 46–60: 8×8 Medium)
    // Kapitel 3 (60–89): Lichtkuppel (Level 61–75: 10×10 Medium, Level 76–90: 10×10 Hard)
    // Kapitel 4 (90–119): Photonen-Palast (Level 91–105: 12×12 Medium, Level 106–120: 14×14 Hard)

    let size, difficulty;
    if (levelIndex < 15) {
        size = 6;
        difficulty = 'easy';
    } else if (levelIndex < 25) {
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 30) {
        size = 7;
        difficulty = 'easy';
    } else if (levelIndex < 45) {
        size = 8;
        difficulty = 'easy';
    } else if (levelIndex < 60) {
        size = 8;
        difficulty = 'medium';
    } else if (levelIndex < 75) {
        size = 10;
        difficulty = 'medium';
    } else if (levelIndex < 90) {
        size = 10;
        difficulty = 'hard';
    } else if (levelIndex < 105) {
        size = 12;
        difficulty = 'medium';
    } else {
        size = 14;
        difficulty = 'hard';
    }

    const seed = 50000 + (levelIndex + 1) * 313;
    const generated = AkariGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1} (${size}×${size})`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Akari-Tagesrätsel basierend auf dem Datum
 */
function getAkariDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10) + 333;
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);

    // Werktags 8x8 Medium, Wochenende 10x10 Hard
    const size = isWeekend ? 10 : 8;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = AkariGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        date: dateStr,
        name: `Tagesrätsel: Akari (${dateStr})`,
        tier: isWeekend ? 'Wochenende (Meister)' : 'Werktag',
        ...generated
    };
}

// === Source: js\puzzles\akari\data\tutorial.js ===
/**
 * Akari Grundlagen-Tutorial (8 Lektionen)
 * Führt schrittweise in Lichtstrahlen, Wände, Wandzahlen und Ausleuchtung ein.
 */

const AKARI_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Das Licht der Glühbirne",
        subtitle: "Horizontale & vertikale Strahlen",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 2, c: 2, val: 1 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Glühlampen (💡) senden helle Lichtstrahlen **horizontal und vertikal** über das gesamte Spielfeld aus.\n\nTippe auf die Mitte (Zeile 3, Spalte 3), um eine Lampe zu setzen.",
        explanation: "Hervorragend! Die Lampe beleuchtet sofort ihre gesamte Zeile und Spalte."
    },
    {
        id: 2,
        title: "2. Schwarze Wände",
        subtitle: "Hindernisse für Licht",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, -1, null, null],
            [null, -1, null, -1, null],
            [null, null, -1, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, null, 0, null, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 2, c: 2, val: 1 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, null, 1, null, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Schwarze Wände **blockieren** das Licht. Strahlen stoppen an der Wand.\n\nPlatziere die Lampe im Zentrum. Siehe wie die 4 Wände den Lichtstrahl eingrenzen.",
        explanation: "Genau! Wände teilen das Gitter in separate Sichtbereiche auf."
    },
    {
        id: 3,
        title: "3. Kein Blenden",
        subtitle: "Keine zwei Lampen in einer Sichtlinie",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, -1, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [1, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 2, c: 4, val: 1 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [1, 0, null, 0, 1],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Zwei Lampen dürfen sich **niemals** gegenseitig anstrahlen.\n\nRechts von der Wand darf eine zweite Lampe stehen, da die schwarze Wand in der Mitte das Blenden verhindert. Setze eine Lampe auf (Zeile 3, Spalte 5).",
        explanation: "Sehr gut! Durch die Wand dazwischen ist diese Platzierung absolut regelkonform."
    },
    {
        id: 4,
        title: "4. Wandzahlen (0 bis 4)",
        subtitle: "Orthogonale Lampenzählung",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, 2, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 2, c: 3, val: 1 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, null, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Eine Zahl auf einer Wand gibt an, wie viele Lampen **orthogonal direkt angrenzen** (oben, unten, links, rechts).\n\nDie Wand '2' hat oben bereits 1 Lampe. Setze die zweite Lampe rechts daneben (Zeile 3, Spalte 4).",
        explanation: "Perfekt! Die Wand '2' ist damit vollständig erfüllt und leuchtet dezent auf."
    },
    {
        id: 5,
        title: "5. Die 0-Wand & Ausschluss",
        subtitle: "Punkte setzen zur Markierung",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, 0, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 2, val: 2 },
            { r: 1, c: 1, val: 2 },
            { r: 1, c: 3, val: 2 },
            { r: 2, c: 2, val: 2 }
        ],
        solution: [
            [0, 0, 2, 0, 0],
            [0, 2, null, 2, 0],
            [0, 0, 2, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "An einer Wand mit der Zahl **0** darf **keine einzige Lampe** angrenzen!\n\nMarkiere alle 4 angrenzenden Nachbarfelder mit Punkten (•) durch 2-maliges Antippen.",
        explanation: "Klasse! Punkte helfen dir, sichere Felder für spätere Züge zu reservieren."
    },
    {
        id: 6,
        title: "6. Die 4-Wand & Volle Belegung",
        subtitle: "Erzwungene Platzierung",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, 4, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 1, c: 2, val: 1 },
            { r: 2, c: 1, val: 1 },
            { r: 2, c: 3, val: 1 },
            { r: 3, c: 2, val: 1 }
        ],
        solution: [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, null, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Eine Wand mit **4** hat nur 4 orthogonale Nachbarn. Daher muss **jedes einzelne** Nachbarfeld eine Lampe (💡) sein!\n\nSetze alle 4 Lampen um die '4'.",
        explanation: "Wunderbar! 4er-Wände sind immer ein sofortiger, sicherer Startpunkt."
    },
    {
        id: 7,
        title: "7. Vollständige Ausleuchtung",
        subtitle: "Jedes weiße Feld muss Licht erhalten",
        size: 5,
        walls: [
            [-1, null, null, null, -1],
            [null, null, null, null, null],
            [null, null, 0, null, null],
            [null, null, null, null, null],
            [-1, null, null, null, -1]
        ],
        initialGrid: [
            [null, 0, 0, 0, null],
            [0, 0, 2, 0, 0],
            [0, 2, null, 2, 0],
            [0, 0, 2, 0, 0],
            [null, 0, 0, 0, null]
        ],
        solution: [
            [null, 1, 0, 1, null],
            [1, 0, 2, 0, 1],
            [0, 2, null, 2, 0],
            [1, 0, 2, 0, 1],
            [null, 1, 0, 1, null]
        ],
        description: "Alle weißen Felder müssen am Ende beleuchtet sein. Platziere Lampen strategisch an den Rändern, um das gesamte Gitter strahlen zu lassen.",
        explanation: "Toll gemacht! Das gesamte 5×5 Gitter ist nun lückenlos ausgeleuchtet."
    },
    {
        id: 8,
        title: "8. Erstes vollständiges Rätsel",
        subtitle: "Kombiniere alle Regeln",
        size: 5,
        walls: [
            [null, 1, null, null, null],
            [null, null, null, null, -1],
            [null, -1, 1, null, null],
            [-1, null, null, null, null],
            [null, null, null, 2, null]
        ],
        initialGrid: [
            [0, null, 0, 0, 0],
            [0, 0, 0, 0, null],
            [0, null, null, 0, 0],
            [null, 0, 0, 0, 0],
            [0, 0, 0, null, 0]
        ],
        solution: [
            [0, null, 0, 1, 0],
            [1, 0, 0, 0, null],
            [0, null, null, 0, 1],
            [null, 0, 1, 0, 0],
            [0, 0, 0, null, 1]
        ],
        description: "Löse dein erstes vollständiges 5×5 Akari-Rätsel! Nutze die Wandzahlen und die Ausleuchtungs-Prüfung.",
        explanation: "Herzlichen Glückwunsch! Du beherrschst die Grundlagen von Akari perfekt."
    }
];

// === Source: js\puzzles\akari\data\tutorial_advanced.js ===
/**
 * Akari Fortgeschrittenes Tutorial (6 Lektionen)
 * Didaktische Meister-Strategien: Ecken, Wand-Interferenzen und Strahlenausschluss.
 */

const AKARI_TUTORIAL_ADVANCED_STEPS = [
    {
        id: 1,
        title: "1. Die 3er-Wand am Rand",
        subtitle: "Erzwungene Belegung bei 3 Nachbarn",
        size: 5,
        walls: [
            [null, 3, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, null, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 0, val: 1 },
            { r: 0, c: 2, val: 1 },
            { r: 1, c: 1, val: 1 }
        ],
        solution: [
            [1, null, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Wenn eine **3er-Wand** direkt am Außenrand liegt, hat sie nur genau 3 weiße Nachbarfelder (links, rechts, unten). Alle 3 müssen daher **zwingend Lampen** sein!\n\nSetze alle 3 Lampen um die '3'.",
        explanation: "Exzellent! Rand-3er sind wie 4er im Zentrum: Alle verfügbaren Felder werden sofort Lampen."
    },
    {
        id: 2,
        title: "2. Geteilte Sichtlinien",
        subtitle: "Ausschluss durch Strahlengang",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, 1, null, 1, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, null, 0, null, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 1, c: 2, val: 2 }],
        solution: [
            [0, 0, 0, 0, 0],
            [0, null, 2, null, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Zwei '1'-Wände teilen sich die Zelle dazwischen (Zeile 2, Spalte 3). Wenn dort eine Lampe stünde, würde sie **beide** Wände gleichzeitig erfüllen – aber keine weiteren Nachbarn zulassen.\n\nMarkiere das Zwischenfeld als Punkt (•), falls andere Lampen notwendig sind.",
        explanation: "Sehr scharf deduziert! Geteilte Nachbarzellen sind oft der Schlüssel zu kniffligen Mustern."
    },
    {
        id: 3,
        title: "3. Die einsame Zelle",
        subtitle: "Einzige Rettung für unbeleuchtete Felder",
        size: 5,
        walls: [
            [-1, null, -1, null, null],
            [null, -1, null, null, null],
            [-1, null, -1, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [null, 0, null, 0, 0],
            [0, null, 0, 0, 0],
            [null, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 0, c: 1, val: 1 }],
        solution: [
            [null, 1, null, 0, 0],
            [0, null, 0, 0, 0],
            [null, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Das Feld bei (Zeile 1, Spalte 2) ist von 3 Seiten durch Wände und Ränder umschlossen. Es kann **nur** durch sich selbst beleuchtet werden, da unterhalb eine Wand liegt!\n\nSetze eine Lampe auf (1, 2).",
        explanation: "Genial! Unbeleuchtete 'Sackgassen' erzwingen oft direkte Lampen."
    },
    {
        id: 4,
        title: "4. Wand-Interferenz (1 neben 2)",
        subtitle: "Schrittweise Reduktion",
        size: 5,
        walls: [
            [null, null, null, null, null],
            [null, 1, 2, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, null, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 2, val: 1 },
            { r: 1, c: 3, val: 1 }
        ],
        solution: [
            [0, 0, 1, 0, 0],
            [0, null, null, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Die '2' benötigt 2 Lampen. Da sie sich Nachbarn mit der '1' teilt, kann maximal 1 Lampe auf den geteilten Feldern liegen. Das bedeutet: Mindestens eine Lampe muss auf der rechten oder oberen Seite der '2' liegen!\n\nSetze Lampen oben (1, 3) und rechts (2, 4) von der '2'.",
        explanation: "Perfekt analysiert! Kombinierte Wandbetrachtung löst selbst schwierigste Level."
    },
    {
        id: 5,
        title: "5. Diagonale Wand-Einschlüsse",
        subtitle: "Schräg versetzte Wände",
        size: 5,
        walls: [
            [null, 1, null, null, null],
            [null, null, 1, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        initialGrid: [
            [0, null, 0, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [{ r: 0, c: 2, val: 2 }],
        solution: [
            [0, null, 2, 0, 0],
            [0, 0, null, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Zwei diagonal versetzte '1'-Wände: Die gemeinsame Ecke bei (Zeile 1, Spalte 3) würde beide Wände gleichzeitig erfüllen. Wenn ein anderer Nachbar besetzt wird, markiere die Ecke als Punkt (•).",
        explanation: "Großartig! Diagonale Beziehungen sind ein mächtiges Werkzeug für Meister."
    },
    {
        id: 6,
        title: "6. Meister-Deduktion",
        subtitle: "Vollständiges Experten-Szenario",
        size: 6,
        walls: [
            [null, 0, null, null, 2, null],
            [null, null, null, null, null, null],
            [null, -1, null, 1, null, null],
            [null, null, 2, null, -1, null],
            [null, null, null, null, null, null],
            [null, 1, null, null, 0, null]
        ],
        initialGrid: [
            [0, null, 0, 0, null, 0],
            [0, 0, 0, 0, 0, 0],
            [0, null, 0, null, 0, 0],
            [0, 0, null, 0, null, 0],
            [0, 0, 0, 0, 0, 0],
            [0, null, 0, 0, null, 0]
        ],
        solution: [
            [0, null, 1, 0, null, 1],
            [1, 0, 0, 0, 1, 0],
            [0, null, 0, null, 0, 0],
            [0, 0, null, 0, null, 0],
            [0, 1, 0, 0, 0, 1],
            [1, null, 0, 1, null, 0]
        ],
        description: "Wende alle gelernten Meister-Techniken an, um dieses anspruchsvolle 6×6 Akari-Meisterrätsel vollständig zu lösen!",
        explanation: "Hervorragend! Du bist nun ein wahrer Akari-Großmeister."
    }
];

// === Source: js\puzzles\akari\index.js ===
/**
 * Akari (Light Up) Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Akari (6×6, 8×8, 10×10, 12×12, 14×14).
 */










const AkariPlugin = {
    id: 'akari',
    name: 'Akari',
    icon: '💡',
    description: 'Lichtstrahlen & Glühbirnen auf Wänden',
    cssPath: './css/puzzles/akari.css',

    getSizes: () => [
        { id: 6, label: '6 × 6 (Kompakt)', gridSize: 6 },
        { id: 8, label: '8 × 8 (Klassisch)', gridSize: 8 },
        { id: 10, label: '10 × 10 (Meister)', gridSize: 10 },
        { id: 14, label: '14 × 14 (Gigant)', gridSize: 14 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [AKARI_EMPTY, AKARI_BULB, AKARI_DOT],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: false,
        keys: [AKARI_EMPTY, AKARI_BULB, AKARI_DOT]
    }),

    createEngine: (size = 8) => new AkariEngine(size),
    generatePuzzle: (opts) => AkariGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => AkariSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => AkariRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => AkariRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass, size) => AkariRenderer.getSymbolSvg(val, extraClass, size),

    getHint: (engine, options) => AkariSolver.findLogicalHint(engine, options),
    getRules: (lang) => AkariRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Glühwürmchen', levelRange: [0, 29], desc: '6×6 & 7×7 Grundlagen' },
            { id: 1, name: 'Laternenstadt', levelRange: [30, 59], desc: '8×8 Klassische Straßen' },
            { id: 2, name: 'Lichtkuppel', levelRange: [60, 89], desc: '10×10 Meister-Architektur' },
            { id: 3, name: 'Photonen-Palast', levelRange: [90, 119], desc: '12×12 & 14×14 Giganten' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getAkariCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getAkariDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: AKARI_TUTORIAL_STEPS, badge: '8 Lektionen' },
            { id: 'advanced', name: 'Fortgeschritten', steps: AKARI_TUTORIAL_ADVANCED_STEPS, badge: '6 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => AKARI_I18N[lang] || {}
};

// === Source: js\puzzles\nonogram\engine.js ===
/**
 * Nonogram (Picross / Griddlers) Engine
 * Verwaltet Gitterzustände (0=Leer, 1=Gefüllt, 2=Kreuz), Zeilen- & Spaltenhinweise,
 * Undo/Redo, Live-Validierung und Fortschrittsüberprüfung.
 */

const NONO_EMPTY = 0;
const NONO_FILLED = 1;
const NONO_CROSS = 2;

class NonogramEngine {
    constructor(size = 10, height = null) {
        this.width = size;
        this.height = height || size;
        this.size = size;

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.target = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.locked = Array.from({ length: this.height }, () => Array(this.width).fill(false));
        this.notes = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => new Set()));

        this.rowClues = Array.from({ length: this.height }, () => [0]);
        this.colClues = Array.from({ length: this.width }, () => [0]);

        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Berechnet die Clues für eine gegebene 1D-Reihe von Werten (0 oder 1)
     */
    static calculateLineClues(line) {
        const clues = [];
        let currentCount = 0;
        for (const val of line) {
            if (val === NONO_FILLED) {
                currentCount++;
            } else if (currentCount > 0) {
                clues.push(currentCount);
                currentCount = 0;
            }
        }
        if (currentCount > 0) {
            clues.push(currentCount);
        }
        return clues.length > 0 ? clues : [0];
    }

    /**
     * Setzt den Spielzustand auf den Anfangszustand zurück (leert das Spielfeld, behält Vorgaben)
     */
    restart() {
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.notes = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Lädt ein Puzzle (aus Kampagne, Tagesrätsel, Generator oder Tutorial)
     */
    loadPuzzle(puzzleData) {
        if (!puzzleData) return;
        const size = puzzleData.size || (puzzleData.rowClues ? puzzleData.rowClues.length : (puzzleData.target ? puzzleData.target.length : (puzzleData.initialGrid ? puzzleData.initialGrid.length : 10)));
        this.width = size;
        this.height = size;
        this.size = size;

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.target = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.locked = Array.from({ length: this.height }, () => Array(this.width).fill(false));
        this.notes = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => new Set()));
        this.undoStack = [];
        this.redoStack = [];

        if (puzzleData.target) {
            this.initFromTarget(puzzleData.target, puzzleData.locked || null);
        } else if (puzzleData.rowClues && puzzleData.colClues) {
            this.initFromClues(puzzleData.rowClues, puzzleData.colClues, puzzleData.solution || null);
        } else if (puzzleData.solution) {
            this.initFromTarget(puzzleData.solution, puzzleData.locked || null);
        } else if (puzzleData.initialGrid && puzzleData.initialGrid.some(r => r.some(v => v > 0))) {
            this.initFromTarget(puzzleData.initialGrid, puzzleData.locked || null);
        }

        if (puzzleData.grid) {
            this.grid = puzzleData.grid.map(row => [...row]);
        }

        this.initialGrid = JSON.parse(JSON.stringify(this.grid));
        this.initialTarget = this.target ? JSON.parse(JSON.stringify(this.target)) : null;
        this.initialRowClues = this.rowClues ? JSON.parse(JSON.stringify(this.rowClues)) : null;
        this.initialColClues = this.colClues ? JSON.parse(JSON.stringify(this.colClues)) : null;
        this.solution = this.target ? JSON.parse(JSON.stringify(this.target)) : null;
    }

    /**
     * Initialisiert das Rätsel anhand eines Lösungs-Bitmaps
     */
    initFromTarget(targetGrid, lockedGrid = null) {
        this.height = targetGrid.length;
        this.width = targetGrid[0].length;
        this.size = Math.max(this.width, this.height);

        this.target = targetGrid.map(row => [...row]);
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.locked = lockedGrid ? lockedGrid.map(row => [...row]) : Array.from({ length: this.height }, () => Array(this.width).fill(false));

        // Clues aus dem Target-Grid berechnen
        this.rowClues = [];
        for (let r = 0; r < this.height; r++) {
            this.rowClues.push(NonogramEngine.calculateLineClues(this.target[r]));
        }

        this.colClues = [];
        for (let c = 0; c < this.width; c++) {
            const col = [];
            for (let r = 0; r < this.height; r++) {
                col.push(this.target[r][c]);
            }
            this.colClues.push(NonogramEngine.calculateLineClues(col));
        }

        // Falls Zellen gesperrt sind, übernehmen
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (this.locked[r][c]) {
                    this.grid[r][c] = this.target[r][c];
                }
            }
        }
    }

    /**
     * Initialisiert das Rätsel direkt aus Clues
     */
    initFromClues(rowClues, colClues, targetGrid = null) {
        this.height = rowClues.length;
        this.width = colClues.length;
        this.size = Math.max(this.width, this.height);

        this.rowClues = rowClues.map(c => (c.length === 0 ? [0] : [...c]));
        this.colClues = colClues.map(c => (c.length === 0 ? [0] : [...c]));

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
        this.locked = Array.from({ length: this.height }, () => Array(this.width).fill(false));
        this.target = targetGrid ? targetGrid.map(row => [...row]) : Array.from({ length: this.height }, () => Array(this.width).fill(NONO_EMPTY));
    }

    setCellValue(r, c, val, isNote = false) {
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) return false;
        if (this.locked[r][c]) return false;

        const oldVal = this.grid[r][c];
        if (oldVal === val) return false;

        this.undoStack.push({ r, c, oldVal, newVal: val });
        this.redoStack = [];
        this.grid[r][c] = val;
        return true;
    }

    cycleCellValue(r, c, reverse = false) {
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) return 0;
        if (this.locked[r][c]) return this.grid[r][c];

        const current = this.grid[r][c];
        let next;
        if (!reverse) {
            // 0 -> 1 -> 2 -> 0
            next = current === NONO_EMPTY ? NONO_FILLED : (current === NONO_FILLED ? NONO_CROSS : NONO_EMPTY);
        } else {
            // 0 -> 2 -> 1 -> 0
            next = current === NONO_EMPTY ? NONO_CROSS : (current === NONO_CROSS ? NONO_FILLED : NONO_EMPTY);
        }

        this.undoStack.push({ r, c, oldVal: current, newVal: next });
        this.redoStack = [];
        this.grid[r][c] = next;
        return next;
    }

    cycleNoteValue(r, c) {
        return this.cycleCellValue(r, c, true);
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        const action = this.undoStack.pop();
        this.grid[action.r][action.c] = action.oldVal;
        this.redoStack.push(action);
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        const action = this.redoStack.pop();
        this.grid[action.r][action.c] = action.newVal;
        this.undoStack.push(action);
        return true;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    clear() {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (!this.locked[r][c]) {
                    this.grid[r][c] = NONO_EMPTY;
                }
            }
        }
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Prüft, ob eine Zeile exakt die geforderten Hinweise erfüllt
     */
    isRowSatisfied(r) {
        if (r < 0 || r >= this.height) return false;
        const currentClues = NonogramEngine.calculateLineClues(this.grid[r]);
        const targetClues = this.rowClues[r];
        if (currentClues.length !== targetClues.length) return false;
        for (let i = 0; i < currentClues.length; i++) {
            if (currentClues[i] !== targetClues[i]) return false;
        }
        return true;
    }

    /**
     * Prüft, ob eine Spalte exakt die geforderten Hinweise erfüllt
     */
    isColSatisfied(c) {
        if (c < 0 || c >= this.width) return false;
        const col = [];
        for (let r = 0; r < this.height; r++) {
            col.push(this.grid[r][c]);
        }
        const currentClues = NonogramEngine.calculateLineClues(col);
        const targetClues = this.colClues[c];
        if (currentClues.length !== targetClues.length) return false;
        for (let i = 0; i < currentClues.length; i++) {
            if (currentClues[i] !== targetClues[i]) return false;
        }
        return true;
    }

    /**
     * Prüft, ob das gesamte Nonogramm vollständig und fehlerfrei gelöst ist
     */
    isSolved() {
        // Alle Zeilen und Spalten müssen exakt übereinstimmen
        for (let r = 0; r < this.height; r++) {
            if (!this.isRowSatisfied(r)) return false;
        }
        for (let c = 0; c < this.width; c++) {
            if (!this.isColSatisfied(c)) return false;
        }
        return true;
    }

    isCompleted() {
        return this.isSolved();
    }

    findMistakes() {
        const mistakes = [];
        if (this.target && this.target.length > 0) {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === NONO_FILLED && this.target[r][c] !== NONO_FILLED) {
                        mistakes.push({ r, c, currentVal: NONO_FILLED, expectedVal: NONO_CROSS });
                    } else if (this.grid[r][c] === NONO_CROSS && this.target[r][c] === NONO_FILLED) {
                        mistakes.push({ r, c, currentVal: NONO_CROSS, expectedVal: NONO_FILLED });
                    }
                }
            }
        }
        return mistakes;
    }

    /**
     * Prüft Fehler und Konflikte für AutoCheck
     */
    validateRules() {
        const conflictCells = new Set();
        const satisfiedRows = new Set();
        const satisfiedCols = new Set();

        for (let r = 0; r < this.height; r++) {
            if (this.isRowSatisfied(r)) {
                satisfiedRows.add(r);
            }
        }

        for (let c = 0; c < this.width; c++) {
            if (this.isColSatisfied(c)) {
                satisfiedCols.add(c);
            }
        }

        // Falls Target-Grid vorhanden, falsche gefüllte Kacheln markieren
        if (this.target && this.target.length > 0) {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === NONO_FILLED && this.target[r][c] !== NONO_FILLED) {
                        conflictCells.add(`${r},${c}`);
                    }
                }
            }
        }

        return { conflictCells, satisfiedRows, satisfiedCols, isValid: conflictCells.size === 0 };
    }

    getSolution() {
        return this.target.map(row => [...row]);
    }

    clone() {
        const cloned = new NonogramEngine(this.width, this.height);
        cloned.grid = this.grid.map(row => [...row]);
        cloned.target = this.target.map(row => [...row]);
        cloned.locked = this.locked.map(row => [...row]);
        cloned.rowClues = this.rowClues.map(c => [...c]);
        cloned.colClues = this.colClues.map(c => [...c]);
        cloned.undoStack = [...this.undoStack];
        cloned.redoStack = [...this.redoStack];
        return cloned;
    }
}

// === Source: js\puzzles\nonogram\solver.js ===
/**
 * Nonogram (Picross / Griddlers) Solver
 * Implementiert einen hochperformanten Line-Solver für logische Deduktionen,
 * Eindeutigkeitsprüfungen und interaktive Hinweise.
 */



class NonogramSolver {
    /**
     * Generiert alle gültigen Belegungen einer Zeile/Spalte passend zu den Clues und dem aktuellen Zustand.
     */
    static getValidLinePossibilities(length, clues, currentLine = null) {
        if (clues.length === 0 || (clues.length === 1 && clues[0] === 0)) {
            // Komplett leere Zeile (nur Kreuze / Nullen)
            if (currentLine && currentLine.some(v => v === NONO_FILLED)) {
                return [];
            }
            return [Array(length).fill(0)];
        }

        const results = [];
        const numBlocks = clues.length;

        function placeBlock(blockIdx, startPos, currentAssignment) {
            if (blockIdx === numBlocks) {
                // Rest mit 0 auffüllen
                const fullLine = [...currentAssignment, ...Array(length - currentAssignment.length).fill(0)];
                
                // Prüfen ob kompatibel mit currentLine
                if (currentLine) {
                    for (let i = 0; i < length; i++) {
                        if (currentLine[i] === NONO_FILLED && fullLine[i] !== 1) return;
                        if (currentLine[i] === NONO_CROSS && fullLine[i] !== 0) return;
                    }
                }
                results.push(fullLine);
                return;
            }

            const blockSize = clues[blockIdx];
            // Verbleibender Platz für nachfolgende Blöcke berechnen
            let remainingSpace = 0;
            for (let i = blockIdx + 1; i < numBlocks; i++) {
                remainingSpace += clues[i] + 1; // Blockgröße + mind. 1 Lücke
            }

            const maxStart = length - remainingSpace - blockSize;

            for (let pos = startPos; pos <= maxStart; pos++) {
                // Prüfen ob die Lücken vor dem Block gültig sind
                let valid = true;
                const zeroesCount = pos - currentAssignment.length;
                if (currentLine) {
                    for (let i = 0; i < zeroesCount; i++) {
                        const idx = currentAssignment.length + i;
                        if (currentLine[idx] === NONO_FILLED) {
                            valid = false;
                            break;
                        }
                    }
                }
                if (!valid) continue;

                // Prüfen ob der Block selbst gültig ist
                if (currentLine) {
                    for (let i = 0; i < blockSize; i++) {
                        const idx = pos + i;
                        if (currentLine[idx] === NONO_CROSS) {
                            valid = false;
                            break;
                        }
                    }
                }
                if (!valid) continue;

                // Block platzieren
                const nextAssignment = [
                    ...currentAssignment,
                    ...Array(pos - currentAssignment.length).fill(0),
                    ...Array(blockSize).fill(1)
                ];

                // Wenn nicht der letzte Block, muss mind. 1 Lücke (0) folgen
                if (blockIdx < numBlocks - 1) {
                    const separatorIdx = nextAssignment.length;
                    if (currentLine && currentLine[separatorIdx] === NONO_FILLED) {
                        continue;
                    }
                    nextAssignment.push(0);
                }

                placeBlock(blockIdx + 1, nextAssignment.length, nextAssignment);
            }
        }

        placeBlock(0, 0, []);
        return results;
    }

    /**
     * Führt eine logische Schnittmengen-Reduktion auf einer einzelnen Zeile aus
     */
    static deduceLine(length, clues, currentLine) {
        const possibilities = NonogramSolver.getValidLinePossibilities(length, clues, currentLine);
        if (possibilities.length === 0) {
            return { error: true, deductions: [] };
        }

        const mustFill = [];
        const mustCross = [];

        for (let i = 0; i < length; i++) {
            if (currentLine[i] !== NONO_EMPTY) continue;

            const allOnes = possibilities.every(p => p[i] === 1);
            const allZeroes = possibilities.every(p => p[i] === 0);

            if (allOnes) {
                mustFill.push(i);
            } else if (allZeroes) {
                mustCross.push(i);
            }
        }

        return { error: false, mustFill, mustCross, count: possibilities.length };
    }

    /**
     * Findet einen logischen Hinweis (Hint) für den Spieler
     */
    static findLogicalHint(engine) {
        // 0. Zuerst Fehler erkennen
        const mistakes = engine.findMistakes ? engine.findMistakes() : [];
        if (mistakes.length > 0) {
            const m = mistakes[0];
            const isWrongFill = m.currentVal === NONO_FILLED;
            return {
                type: 'solution_mismatch',
                strategy: 'Fehlerhafte Markierung',
                title: 'Fehler korrigieren',
                r: m.r,
                c: m.c,
                val: m.expectedVal,
                value: m.expectedVal,
                expectedVal: m.expectedVal,
                message: isWrongFill 
                    ? `Das Feld (${m.r + 1}, ${m.c + 1}) ist fälschlicherweise gefüllt. Es sollte mit einem Kreuz (✕) markiert werden.`
                    : `Auf Feld (${m.r + 1}, ${m.c + 1}) wurde fälschlicherweise ein Kreuz gesetzt, obwohl es gefüllt (⬛) werden muss.`,
                description: isWrongFill 
                    ? `Das Feld (${m.r + 1}, ${m.c + 1}) ist fälschlicherweise gefüllt. Es sollte mit einem Kreuz (✕) markiert werden.`
                    : `Auf Feld (${m.r + 1}, ${m.c + 1}) wurde fälschlicherweise ein Kreuz gesetzt, obwohl es gefüllt (⬛) werden muss.`,
                explanation: isWrongFill ? `Falsch gefülltes Feld (${m.r + 1}, ${m.c + 1})` : `Falsch durchkreuztes Feld (${m.r + 1}, ${m.c + 1})`
            };
        }

        // 1. Zeilen durchsuchen
        for (let r = 0; r < engine.height; r++) {
            const line = engine.grid[r];
            const clues = engine.rowClues[r];
            const res = NonogramSolver.deduceLine(engine.width, clues, line);

            if (!res.error && res.mustFill.length > 0) {
                const c = res.mustFill[0];
                return {
                    r,
                    c,
                    val: NONO_FILLED,
                    value: NONO_FILLED,
                    expectedVal: NONO_FILLED,
                    type: 'fill',
                    strategy: 'Logische Zeilen-Deduktion',
                    title: 'Zeilen-Deduktion',
                    message: `In Zeile ${r + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`,
                    description: `In Zeile ${r + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`,
                    explanation: `In Zeile ${r + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`
                };
            }
            if (!res.error && res.mustCross.length > 0) {
                const c = res.mustCross[0];
                return {
                    r,
                    c,
                    val: NONO_CROSS,
                    value: NONO_CROSS,
                    expectedVal: NONO_CROSS,
                    type: 'cross',
                    strategy: 'Logischer Zeilen-Ausschluss',
                    title: 'Zeilen-Ausschluss',
                    message: `In Zeile ${r + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`,
                    description: `In Zeile ${r + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`,
                    explanation: `In Zeile ${r + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`
                };
            }
        }

        // 2. Spalten durchsuchen
        for (let c = 0; c < engine.width; c++) {
            const col = [];
            for (let r = 0; r < engine.height; r++) {
                col.push(engine.grid[r][c]);
            }
            const clues = engine.colClues[c];
            const res = NonogramSolver.deduceLine(engine.height, clues, col);

            if (!res.error && res.mustFill.length > 0) {
                const r = res.mustFill[0];
                return {
                    r,
                    c,
                    val: NONO_FILLED,
                    value: NONO_FILLED,
                    expectedVal: NONO_FILLED,
                    type: 'fill',
                    strategy: 'Logische Spalten-Deduktion',
                    title: 'Spalten-Deduktion',
                    message: `In Spalte ${c + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`,
                    description: `In Spalte ${c + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`,
                    explanation: `In Spalte ${c + 1} muss Feld (${r + 1}, ${c + 1}) sicher gefüllt werden (Hinweis: ${clues.join(' ')}).`
                };
            }
            if (!res.error && res.mustCross.length > 0) {
                const r = res.mustCross[0];
                return {
                    r,
                    c,
                    val: NONO_CROSS,
                    value: NONO_CROSS,
                    expectedVal: NONO_CROSS,
                    type: 'cross',
                    strategy: 'Logischer Spalten-Ausschluss',
                    title: 'Spalten-Ausschluss',
                    message: `In Spalte ${c + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`,
                    description: `In Spalte ${c + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`,
                    explanation: `In Spalte ${c + 1} kann Feld (${r + 1}, ${c + 1}) kein Pixel sein. Setze ein Kreuz (✕).`
                };
            }
        }

        // 3. Fallback auf Target
        if (engine.target && engine.target.length > 0) {
            for (let r = 0; r < engine.height; r++) {
                for (let c = 0; c < engine.width; c++) {
                    if (engine.grid[r][c] === NONO_EMPTY) {
                        const targetVal = engine.target[r][c] === 1 ? NONO_FILLED : NONO_CROSS;
                        return {
                            r,
                            c,
                            val: targetVal,
                            value: targetVal,
                            expectedVal: targetVal,
                            type: targetVal === NONO_FILLED ? 'fill' : 'cross',
                            strategy: 'Nächster Schritt',
                            title: 'Nächster Schritt',
                            message: `Setze Feld (${r + 1}, ${c + 1}) auf ${targetVal === NONO_FILLED ? 'Gefüllt (⬛)' : 'Kreuz (✕)'}.`,
                            description: `Setze Feld (${r + 1}, ${c + 1}) auf ${targetVal === NONO_FILLED ? 'Gefüllt (⬛)' : 'Kreuz (✕)'}.`,
                            explanation: `Setze Feld (${r + 1}, ${c + 1}) auf ${targetVal === NONO_FILLED ? 'Gefüllt (⬛)' : 'Kreuz (✕)'}.`
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Löst das Nonogramm rein durch logische Deduktion (ohne Raten)
     * Gibt true zurück, wenn rein logisch vollständig lösbar.
     */
    static solveLogical(engine) {
        const testGrid = Array.from({ length: engine.height }, () => Array(engine.width).fill(NONO_EMPTY));
        let changed = true;

        while (changed) {
            changed = false;

            // Zeilen
            for (let r = 0; r < engine.height; r++) {
                const res = NonogramSolver.deduceLine(engine.width, engine.rowClues[r], testGrid[r]);
                if (res.error) return { solvable: false, grid: testGrid };

                for (const c of res.mustFill) {
                    testGrid[r][c] = NONO_FILLED;
                    changed = true;
                }
                for (const c of res.mustCross) {
                    testGrid[r][c] = NONO_CROSS;
                    changed = true;
                }
            }

            // Spalten
            for (let c = 0; c < engine.width; c++) {
                const col = [];
                for (let r = 0; r < engine.height; r++) {
                    col.push(testGrid[r][c]);
                }
                const res = NonogramSolver.deduceLine(engine.height, engine.colClues[c], col);
                if (res.error) return { solvable: false, grid: testGrid };

                for (const r of res.mustFill) {
                    testGrid[r][c] = NONO_FILLED;
                    changed = true;
                }
                for (const r of res.mustCross) {
                    testGrid[r][c] = NONO_CROSS;
                    changed = true;
                }
            }
        }

        // Prüfen ob alle Felder bestimmt sind
        const isComplete = testGrid.every(row => row.every(val => val !== NONO_EMPTY));
        return { solvable: isComplete, grid: testGrid };
    }

    /**
     * Findet alle Lösungen (zur Eindeutigkeitsprüfung)
     */
    static solve(engine, maxSolutions = 2) {
        const logicalRes = NonogramSolver.solveLogical(engine);
        if (logicalRes.solvable) {
            return [logicalRes.grid.map(row => row.map(v => (v === NONO_FILLED ? 1 : 0)))];
        }

        const solutions = [];

        function backtrack(r, c, currentGrid) {
            if (solutions.length >= maxSolutions) return;

            if (r === engine.height) {
                // Prüfen ob alle Spalten gültig sind
                for (let colIdx = 0; colIdx < engine.width; colIdx++) {
                    const col = currentGrid.map(row => row[colIdx]);
                    const clues = NonogramEngine.calculateLineClues(col);
                    const targetClues = engine.colClues[colIdx];
                    if (clues.length !== targetClues.length || clues.some((v, i) => v !== targetClues[i])) {
                        return;
                    }
                }
                solutions.push(currentGrid.map(row => [...row]));
                return;
            }

            const nextR = c + 1 === engine.width ? r + 1 : r;
            const nextC = c + 1 === engine.width ? 0 : c + 1;

            if (c === 0) {
                // Belegungen für die ganze Zeile ermitteln
                const possibilities = NonogramSolver.getValidLinePossibilities(engine.width, engine.rowClues[r]);
                for (const poss of possibilities) {
                    currentGrid[r] = poss;
                    backtrack(r + 1, 0, currentGrid);
                    if (solutions.length >= maxSolutions) return;
                }
            }
        }

        backtrack(0, 0, Array.from({ length: engine.height }, () => Array(engine.width).fill(0)));
        return solutions;
    }
}

// === Source: js\puzzles\nonogram\generator.js ===
/**
 * Nonogram Generator
 * Erzeugt eindeutig lösbare Pixel- und Logik-Rätsel deterministisch über Seeds
 * oder aus vordefinierten Pixel-Art Vorlagen.
 */




class NonogramGenerator {
    /**
     * Einfacher deterministischer Pseudo-Zufallsgenerator (Mulberry32)
     */
    static createRng(seed) {
        let s = seed >>> 0;
        return function() {
            s |= 0;
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Erzeugt ein Nonogramm-Rätsel
     */
    static generatePuzzle(options = {}) {
        const size = options.size || 10;
        const difficulty = options.difficulty || 'medium';
        const seed = options.seed !== undefined ? options.seed : Math.floor(Math.random() * 1000000);
        const rng = NonogramGenerator.createRng(seed);

        const targetDensity = difficulty === 'easy' ? 0.60 : (difficulty === 'medium' ? 0.50 : 0.42);

        for (let attempt = 0; attempt < 50; attempt++) {
            const target = Array.from({ length: size }, () => Array(size).fill(0));
            const isSymmetric = rng() > 0.4;

            for (let r = 0; r < size; r++) {
                const maxC = isSymmetric ? Math.ceil(size / 2) : size;
                for (let c = 0; c < maxC; c++) {
                    const prob = targetDensity + (rng() - 0.5) * 0.2;
                    const val = rng() < prob ? 1 : 0;
                    target[r][c] = val;
                    if (isSymmetric) {
                        target[r][size - 1 - c] = val;
                    }
                }
            }

            // Sicherstellen dass keine Zeile/Spalte komplett leer ist
            for (let r = 0; r < size; r++) {
                if (target[r].every(v => v === 0)) {
                    target[r][Math.floor(rng() * size)] = 1;
                }
            }
            for (let c = 0; c < size; c++) {
                if (target.every(row => row[c] === 0)) {
                    target[Math.floor(rng() * size)][c] = 1;
                }
            }

            const engine = new NonogramEngine(size);
            engine.initFromTarget(target);

            // Logische Lösbarkeit prüfen
            const solveRes = NonogramSolver.solveLogical(engine);
            if (solveRes.solvable) {
                return {
                    size,
                    difficulty,
                    seed,
                    target,
                    rowClues: engine.rowClues,
                    colClues: engine.colClues,
                    grid: Array.from({ length: size }, () => Array(size).fill(0)),
                    locked: Array.from({ length: size }, () => Array(size).fill(false))
                };
            }
        }

        // Robuster Fallback: Strukturierte geometrische Vorlage
        const fallbackTarget = Array.from({ length: size }, (_, r) =>
            Array.from({ length: size }, (_, c) => ((r + c) % 2 === 0 || r === c || r === size - 1 - c ? 1 : 0))
        );
        const engine = new NonogramEngine(size);
        engine.initFromTarget(fallbackTarget);

        return {
            size,
            difficulty,
            seed,
            target: fallbackTarget,
            rowClues: engine.rowClues,
            colClues: engine.colClues,
            grid: Array.from({ length: size }, () => Array(size).fill(0)),
            locked: Array.from({ length: size }, () => Array(size).fill(false))
        };
    }
}

// === Source: js\puzzles\nonogram\renderer.js ===
/**
 * Nonogram Visual Renderer
 * Zeichnet das Spielfeld mit Zeilen- und Spaltenhinweisen, 5×5-Block-Trennlinien,
 * Auto-Cross-Out, dynamischer Mehrzeilen-Skalierung und Zoom-Unterstützung.
 */




class NonogramRenderer {
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
                const isConflict = !state.solutionRevealed && validation.conflictCells.has(`${r},${c}`);
                const isSelected = !state.solutionRevealed && state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c;
                const isHintShimmer = !state.solutionRevealed && state.hintPlacedCell && state.hintPlacedCell.r === r && state.hintPlacedCell.c === c;

                // 5er-Blocktrenner
                if ((c + 1) % 5 === 0 && c < width - 1) cellEl.classList.add('major-edge-right');
                if ((r + 1) % 5 === 0 && r < height - 1) cellEl.classList.add('major-edge-bottom');

                if (isConflict) cellEl.classList.add('conflict');
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

// === Source: js\puzzles\nonogram\data\i18n.js ===
/**
 * Nonogram-spezifische Übersetzungen (DE & EN)
 */

const NONOGRAM_I18N = {
    de: {
        nonogram_title: "Nonogramm",
        nonogram_desc: "Pixel-Rätsel mit Zahlenhinweisen",
        nonogram_btn_fill: "Füllen",
        nonogram_btn_cross: "Kreuz",
        nonogram_btn_clear: "Leeren",
        nonogram_rules_title: "Nonogramm Regeln",
        nonogram_chapter_1: "Einsteiger (5×5)",
        nonogram_chapter_2: "Galerie I (10×10)",
        nonogram_chapter_3: "Komplexe Kunst (10×10 & 15×15)",
        nonogram_chapter_4: "Meister-Galerie (15×15)",
        nonogram_tut_basics: "Grundlagen",
        nonogram_tut_advanced: "Fortgeschritten"
    },
    en: {
        nonogram_title: "Nonogram",
        nonogram_desc: "Pixel puzzle with number clues",
        nonogram_btn_fill: "Fill",
        nonogram_btn_cross: "Cross",
        nonogram_btn_clear: "Clear",
        nonogram_rules_title: "Nonogram Rules",
        nonogram_chapter_1: "Beginner (5×5)",
        nonogram_chapter_2: "Gallery I (10×10)",
        nonogram_chapter_3: "Complex Art (10×10 & 15×15)",
        nonogram_chapter_4: "Master Gallery (15×15)",
        nonogram_tut_basics: "Basics",
        nonogram_tut_advanced: "Advanced"
    }
};

// === Source: js\puzzles\nonogram\data\levels.js ===
/**
 * Nonogram Level & Tagesrätsel-Generierung
 * 120 handgefertigte & prozedurale Kampagnen-Level in 4 Kapiteln (5×5, 10×10, 15×15)
 * und synchrones tägliches Rätsel (Werktags 10×10, Wochenende 15×15 Meister).
 */



// Vordefinierte ikonische 5x5 Pixel-Motive für Kapitel 1
const PREDEFINED_5X5 = [
    // 1: Herz ❤️
    [
        [0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0]
    ],
    // 2: Haus 🏠
    [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1]
    ],
    // 3: Pfeil ➔
    [
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0]
    ],
    // 4: Smiley 🙂
    [
        [0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ],
    // 5: Stern ⭐
    [
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [0, 1, 0, 1, 0]
    ],
    // 6: Tasse ☕
    [
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0]
    ],
    // 7: Pilz 🍄
    [
        [0, 1, 1, 1, 0],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0]
    ],
    // 8: Diamant 💎
    [
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0]
    ]
];

function getNonogramCampaignLevel(levelIndex) {
    // 120 Level in 4 Kapiteln:
    // Kapitel 1 (0–29): Einsteiger 5×5 (Level 1–30)
    // Kapitel 2 (30–59): Galerie I 10×10 (Level 31–60)
    // Kapitel 3 (60–89): Komplexe Kunst (Level 61–75: 10×10, Level 76–90: 15×15)
    // Kapitel 4 (90–119): Meister-Galerie 15×15 (Level 91–120)

    let size, difficulty;

    if (levelIndex < 30) {
        size = 5;
        difficulty = levelIndex < 15 ? 'easy' : (levelIndex < 25 ? 'medium' : 'hard');
        
        // Vordefinierte Handcraft-Level für die ersten Level
        if (levelIndex < PREDEFINED_5X5.length) {
            const target = PREDEFINED_5X5[levelIndex];
            const generated = NonogramGenerator.generatePuzzle({ size: 5, difficulty: 'easy', seed: 1000 + levelIndex });
            generated.target = target;
            generated.rowClues = [];
            for (let r = 0; r < 5; r++) {
                const clues = [];
                let cnt = 0;
                for (let c = 0; c < 5; c++) {
                    if (target[r][c] === 1) cnt++;
                    else if (cnt > 0) { clues.push(cnt); cnt = 0; }
                }
                if (cnt > 0) clues.push(cnt);
                generated.rowClues.push(clues.length > 0 ? clues : [0]);
            }
            generated.colClues = [];
            for (let c = 0; c < 5; c++) {
                const clues = [];
                let cnt = 0;
                for (let r = 0; r < 5; r++) {
                    if (target[r][c] === 1) cnt++;
                    else if (cnt > 0) { clues.push(cnt); cnt = 0; }
                }
                if (cnt > 0) clues.push(cnt);
                generated.colClues.push(clues.length > 0 ? clues : [0]);
            }
            return {
                id: levelIndex + 1,
                tier: difficulty,
                name: `Level ${levelIndex + 1} (5×5)`,
                ...generated
            };
        }
    } else if (levelIndex < 60) {
        size = 10;
        difficulty = levelIndex < 45 ? 'easy' : 'medium';
    } else if (levelIndex < 75) {
        size = 10;
        difficulty = 'hard';
    } else if (levelIndex < 90) {
        size = 15;
        difficulty = 'medium';
    } else {
        size = 15;
        difficulty = levelIndex < 105 ? 'medium' : 'hard';
    }

    const seed = 50000 + (levelIndex + 1) * 739;
    const generated = NonogramGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1} (${size}×${size})`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Nonogramm-Tagesrätsel basierend auf dem Datum
 */
function getNonogramDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10) + 888;
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);

    // Werktags 10x10, Wochenende 15x15 Meister
    const size = isWeekend ? 15 : 10;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = NonogramGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        size,
        tier: difficulty,
        name: `Tagesrätsel (${size}×${size})`,
        ...generated
    };
}

// === Source: js\puzzles\nonogram\data\tutorial.js ===
/**
 * Nonogramm Grundlagen-Tutorial (5 Lektionen)
 * Führt schrittweise in Zahlenhinweise, Vollzeilen, Überlappungen und Kreuze ein.
 */

const NONOGRAM_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Vollständige Zeilen (Vollblock)",
        subtitle: "Maximale Blockgröße",
        size: 5,
        rowClues: [[5], [0], [0], [0], [0]],
        colClues: [[1], [1], [1], [1], [1]],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 0, val: 1 },
            { r: 0, c: 1, val: 1 },
            { r: 0, c: 2, val: 1 },
            { r: 0, c: 3, val: 1 },
            { r: 0, c: 4, val: 1 }
        ],
        solution: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Wenn ein Zahlenhinweis genau der Zeilenlänge entspricht (hier **5** in einem 5×5 Gitter), müssen **alle Felder dieser Zeile gefüllt werden**.\n\nFülle alle 5 Felder der obersten Zeile.",
        explanation: "Perfekt! Die oberste Zeile ist komplett gefüllt und erfüllt ihren Hinweis 5."
    },
    {
        id: 2,
        title: "2. Leere Zeilen (Die Null 0)",
        subtitle: "Ausschließen mit Kreuzen",
        size: 5,
        rowClues: [[5], [0], [0], [0], [0]],
        colClues: [[1], [1], [1], [1], [1]],
        initialGrid: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 1, c: 0, val: 2 },
            { r: 1, c: 1, val: 2 },
            { r: 1, c: 2, val: 2 },
            { r: 1, c: 3, val: 2 },
            { r: 1, c: 4, val: 2 }
        ],
        solution: [
            [1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Ein Hinweis von **0** bedeutet, dass in dieser Zeile kein einziges Feld gefüllt sein darf. Markiere alle Felder mit einem Kreuz (❌), um sie als sicher leer auszuschließen.\n\nSetze in Zeile 2 überall Kreuze.",
        explanation: "Ausgezeichnet! Kreuze helfen dir, unberührte Bereiche sicher abzugrenzen."
    },
    {
        id: 3,
        title: "3. Die Überlappungs-Regel (Overlap)",
        subtitle: "Schnittmengen finden",
        size: 5,
        rowClues: [[5], [2, 2], [4], [0], [0]],
        colClues: [[1], [1], [1], [1], [1]],
        initialGrid: [
            [1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 2, c: 1, val: 1 },
            { r: 2, c: 2, val: 1 },
            { r: 2, c: 3, val: 1 }
        ],
        solution: [
            [1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Ein 4er-Block in einer 5er-Zeile kann ganz links (Feld 1–4) oder ganz rechts (Feld 2–5) liegen. Die mittleren 3 Felder (Spalten 2, 3, 4) sind **in beiden Fällen sicher gefüllt**!\n\nFülle die 3 mittleren Felder in Zeile 3.",
        explanation: "Klasse! Die Schnittmenge ist eine der wichtigsten Techniken beim Lösen von Nonogrammen."
    },
    {
        id: 4,
        title: "4. Mehrere Blöcke & Lücken",
        subtitle: "Mindestabstand von 1 Feld",
        size: 5,
        rowClues: [[5], [2, 2], [4], [0], [0]],
        colClues: [[1], [1], [1], [1], [1]],
        initialGrid: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 1, c: 0, val: 1 },
            { r: 1, c: 1, val: 1 },
            { r: 1, c: 2, val: 2 },
            { r: 1, c: 3, val: 1 },
            { r: 1, c: 4, val: 1 }
        ],
        solution: [
            [1, 1, 1, 1, 1],
            [1, 1, 2, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        description: "Der Hinweis **2 2** benötigt 2 + 1 (Lücke) + 2 = 5 Felder. Die Platzierung ist exakt vorgegeben: 2 gefüllt, Mitte frei (❌), 2 gefüllt.\n\nFülle Zeile 2 entsprechend aus.",
        explanation: "Hervorragend! Zwischen zwei separaten Blöcken muss immer mindestens 1 leeres Feld liegen."
    },
    {
        id: 5,
        title: "5. Erstes komplettes Motiv: Das Herz",
        subtitle: "Zusammenspiel von Zeilen & Spalten",
        size: 5,
        rowClues: [
            [1, 1],
            [5],
            [5],
            [3],
            [1]
        ],
        colClues: [
            [3],
            [4],
            [4],
            [4],
            [3]
        ],
        initialGrid: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        targetCells: [
            { r: 0, c: 1, val: 1 },
            { r: 0, c: 3, val: 1 },
            { r: 1, c: 0, val: 1 },
            { r: 1, c: 1, val: 1 },
            { r: 1, c: 2, val: 1 },
            { r: 1, c: 3, val: 1 },
            { r: 1, c: 4, val: 1 },
            { r: 2, c: 0, val: 1 },
            { r: 2, c: 1, val: 1 },
            { r: 2, c: 2, val: 1 },
            { r: 2, c: 3, val: 1 },
            { r: 2, c: 4, val: 1 },
            { r: 3, c: 1, val: 1 },
            { r: 3, c: 2, val: 1 },
            { r: 3, c: 3, val: 1 },
            { r: 4, c: 2, val: 1 }
        ],
        solution: [
            [0, 1, 0, 1, 0],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0]
        ],
        description: "Kombiniere Zeilen- und Spaltenhinweise, um das Pixel-Herz ❤️ zu vollenden.\n\nFülle die richtigen Felder aus!",
        explanation: "Fantastisch! Du hast dein erstes Nonogramm gelöst und das Herz enthüllt!"
    }
];

// === Source: js\puzzles\nonogram\index.js ===
/**
 * Nonogram (Picross / Griddlers) Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Nonogramm (5×5, 10×10, 15×15).
 */









const NonogramPlugin = {
    id: 'nonogram',
    name: 'Nonogramm',
    icon: '🖼️',
    description: 'Pixel-Rätsel mit Zahlenhinweisen',
    cssPath: './css/puzzles/nonogram.css',

    getSizes: () => [
        { id: 5, label: '5 × 5 (Mini)', gridSize: 5 },
        { id: 10, label: '10 × 10 (Klassisch)', gridSize: 10 },
        { id: 15, label: '15 × 15 (Meister)', gridSize: 15 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [NONO_EMPTY, NONO_FILLED, NONO_CROSS],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: true,
        keys: [NONO_FILLED, NONO_CROSS, NONO_EMPTY]
    }),

    createEngine: (size = 10) => new NonogramEngine(size),
    generatePuzzle: (opts) => NonogramGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => NonogramSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => NonogramRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => NonogramRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass, size) => NonogramRenderer.getSymbolSvg(val, extraClass, size),

    getHint: (engine, options) => NonogramSolver.findLogicalHint(engine, options),
    getRules: (lang) => NonogramRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Einsteiger (5×5)', levelRange: [0, 29], desc: '5×5 Mini-Formate & Grundlagen' },
            { id: 1, name: 'Galerie I (10×10)', levelRange: [30, 59], desc: '10×10 Klassische Pixel-Art' },
            { id: 2, name: 'Komplexe Kunst', levelRange: [60, 89], desc: '10×10 & 15×15 Meistermotive' },
            { id: 3, name: 'Meister-Galerie', levelRange: [90, 119], desc: '15×15 Großformate & Meisterwerke' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getNonogramCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getNonogramDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: NONOGRAM_TUTORIAL_STEPS, badge: '5 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => NONOGRAM_I18N[lang] || {}
};

// === Source: js\puzzles\slitherlink\engine.js ===
/**
 * Slitherlink Engine - Cortex Puzzle Platform
 * Verwaltet den Kanten-Zustand, Punktegrad, Schleifen-Topologie und Validierung.
 */

class SlitherlinkEngine {
    constructor(size = 5) {
        this.size = size;
        this.rows = size;
        this.cols = size;
        this.clues = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.initialClues = null;

        // Kanten-Zustände: 0 = Leer, 1 = Linie (Teil der Schleife), 2 = Kreuz (✕ / Kein Pfad)
        this.hEdges = Array(this.rows + 1).fill(0).map(() => Array(this.cols).fill(0));
        this.vEdges = Array(this.rows).fill(0).map(() => Array(this.cols + 1).fill(0));

        this.initialHEdges = null;
        this.initialVEdges = null;

        // Notizen (Kandidaten)
        this.hNotes = Array(this.rows + 1).fill(null).map(() => Array(this.cols).fill(null).map(() => new Set()));
        this.vNotes = Array(this.rows).fill(null).map(() => Array(this.cols + 1).fill(null).map(() => new Set()));

        this.undoStack = [];
        this.redoStack = [];
        this.solution = null;
    }

    loadPuzzle(puzzleData) {
        this.size = puzzleData.size || (puzzleData.clues ? puzzleData.clues.length : 5);
        this.rows = puzzleData.rows || this.size;
        this.cols = puzzleData.cols || this.size;

        this.clues = puzzleData.clues ? puzzleData.clues.map(row => [...row]) : Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.initialClues = this.clues.map(row => [...row]);

        this.hEdges = Array(this.rows + 1).fill(0).map(() => Array(this.cols).fill(0));
        this.vEdges = Array(this.rows).fill(0).map(() => Array(this.cols + 1).fill(0));

        if (puzzleData.initialHEdges) {
            this.hEdges = puzzleData.initialHEdges.map(row => [...row]);
        }
        if (puzzleData.initialVEdges) {
            this.vEdges = puzzleData.initialVEdges.map(row => [...row]);
        }

        this.initialHEdges = this.hEdges.map(row => [...row]);
        this.initialVEdges = this.vEdges.map(row => [...row]);

        this.hNotes = Array(this.rows + 1).fill(null).map(() => Array(this.cols).fill(null).map(() => new Set()));
        this.vNotes = Array(this.rows).fill(null).map(() => Array(this.cols + 1).fill(null).map(() => new Set()));

        this.undoStack = [];
        this.redoStack = [];
        this.solution = puzzleData.solution || null;
    }

    restart() {
        if (this.initialClues) {
            this.clues = this.initialClues.map(row => [...row]);
        }
        if (this.initialHEdges) {
            this.hEdges = this.initialHEdges.map(row => [...row]);
        } else {
            this.hEdges = Array(this.rows + 1).fill(0).map(() => Array(this.cols).fill(0));
        }
        if (this.initialVEdges) {
            this.vEdges = this.initialVEdges.map(row => [...row]);
        } else {
            this.vEdges = Array(this.rows).fill(0).map(() => Array(this.cols + 1).fill(0));
        }

        this.hNotes = Array(this.rows + 1).fill(null).map(() => Array(this.cols).fill(null).map(() => new Set()));
        this.vNotes = Array(this.rows).fill(null).map(() => Array(this.cols + 1).fill(null).map(() => new Set()));

        this.undoStack = [];
        this.redoStack = [];
    }

    getEdge(type, r, c) {
        if (type === 'h') {
            if (r >= 0 && r <= this.rows && c >= 0 && c < this.cols) return this.hEdges[r][c];
        } else if (type === 'v') {
            if (r >= 0 && r < this.rows && c >= 0 && c <= this.cols) return this.vEdges[r][c];
        }
        return 0;
    }

    setEdge(type, r, c, val, isNote = false) {
        if (type === 'h') {
            if (r < 0 || r > this.rows || c < 0 || c >= this.cols) return false;
            const oldVal = this.hEdges[r][c];
            const oldNotes = new Set(this.hNotes[r][c]);

            if (isNote) {
                if (this.hNotes[r][c].has(val)) this.hNotes[r][c].delete(val);
                else this.hNotes[r][c].add(val);
            } else {
                if (oldVal === val) return false;
                this.hEdges[r][c] = val;
                if (val !== 0) this.hNotes[r][c].clear();
            }

            this.undoStack.push({
                type, r, c, isNote,
                oldVal, newVal: this.hEdges[r][c],
                oldNotes, newNotes: new Set(this.hNotes[r][c])
            });
            this.redoStack = [];
            return true;
        } else if (type === 'v') {
            if (r < 0 || r >= this.rows || c < 0 || c > this.cols) return false;
            const oldVal = this.vEdges[r][c];
            const oldNotes = new Set(this.vNotes[r][c]);

            if (isNote) {
                if (this.vNotes[r][c].has(val)) this.vNotes[r][c].delete(val);
                else this.vNotes[r][c].add(val);
            } else {
                if (oldVal === val) return false;
                this.vEdges[r][c] = val;
                if (val !== 0) this.vNotes[r][c].clear();
            }

            this.undoStack.push({
                type, r, c, isNote,
                oldVal, newVal: this.vEdges[r][c],
                oldNotes, newNotes: new Set(this.vNotes[r][c])
            });
            this.redoStack = [];
            return true;
        }
        return false;
    }

    cycleEdge(type, r, c, isNote = false) {
        const cur = this.getEdge(type, r, c);
        if (isNote) {
            // Im Notizenmodus schalten wir zwischen Kreuz-Notiz hin und her
            return this.setEdge(type, r, c, 2, true);
        }
        // Zyklus: 0 (Leer) -> 1 (Linie) -> 2 (Kreuz) -> 0 (Leer)
        const next = (cur + 1) % 3;
        this.setEdge(type, r, c, next, false);
        return next;
    }

    undo() {
        if (this.undoStack.length === 0) return null;
        const action = this.undoStack.pop();

        if (action.type === 'h') {
            this.hEdges[action.r][action.c] = action.oldVal;
            this.hNotes[action.r][action.c] = new Set(action.oldNotes);
        } else if (action.type === 'v') {
            this.vEdges[action.r][action.c] = action.oldVal;
            this.vNotes[action.r][action.c] = new Set(action.oldNotes);
        }

        this.redoStack.push(action);
        return action;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();

        if (action.type === 'h') {
            this.hEdges[action.r][action.c] = action.newVal;
            this.hNotes[action.r][action.c] = new Set(action.newNotes);
        } else if (action.type === 'v') {
            this.vEdges[action.r][action.c] = action.newVal;
            this.vNotes[action.r][action.c] = new Set(action.newNotes);
        }

        this.undoStack.push(action);
        return action;
    }

    /**
     * Ermittelt alle anliegenden Kanten eines Punkts (Vertex vr, vc)
     * vr in [0, rows], vc in [0, cols]
     */
    getVertexEdges(vr, vc) {
        const edges = [];
        // Links (Horizontal)
        if (vc > 0) edges.push({ type: 'h', r: vr, c: vc - 1, val: this.hEdges[vr][vc - 1], otherVertex: { vr, vc: vc - 1 } });
        // Rechts (Horizontal)
        if (vc < this.cols) edges.push({ type: 'h', r: vr, c: vc, val: this.hEdges[vr][vc], otherVertex: { vr, vc: vc + 1 } });
        // Oben (Vertikal)
        if (vr > 0) edges.push({ type: 'v', r: vr - 1, c: vc, val: this.vEdges[vr - 1][vc], otherVertex: { vr: vr - 1, vc } });
        // Unten (Vertikal)
        if (vr < this.rows) edges.push({ type: 'v', r: vr, c: vc, val: this.vEdges[vr][vc], otherVertex: { vr: vr + 1, vc } });
        return edges;
    }

    /**
     * Gibt den Linien-Grad eines Punkts zurück (Anzahl der Kanten mit val === 1)
     */
    getVertexDegree(vr, vc) {
        const edges = this.getVertexEdges(vr, vc);
        return edges.filter(e => e.val === 1).length;
    }

    /**
     * Gibt die 4 Kanten einer Zelle (r, c) zurück
     */
    getCellEdges(r, c) {
        return [
            { type: 'h', r: r, c: c, val: this.hEdges[r][c] },         // Top
            { type: 'h', r: r + 1, c: c, val: this.hEdges[r + 1][c] }, // Bottom
            { type: 'v', r: r, c: c, val: this.vEdges[r][c] },         // Left
            { type: 'v', r: r, c: c + 1, val: this.vEdges[r][c + 1] }  // Right
        ];
    }

    getCellEdgeCount(r, c) {
        return this.getCellEdges(r, c).filter(e => e.val === 1).length;
    }

    getCellCrossCount(r, c) {
        return this.getCellEdges(r, c).filter(e => e.val === 2).length;
    }

    /**
     * Überprüft, ob das Rätsel vollständig und fehlerfrei gelöst ist.
     */
    isCompleted() {
        // 1. Alle Zahlenhinweise müssen exakt erfüllt sein
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const clue = this.clues[r][c];
                if (clue !== null && clue !== undefined) {
                    if (this.getCellEdgeCount(r, c) !== clue) {
                        return false;
                    }
                }
            }
        }

        // 2. Jeder Punkt muss Grad 0 oder Grad 2 haben (keine Sackgassen / keine Verzweigungen)
        let activeVertices = 0;
        let totalLineEdges = 0;

        for (let r = 0; r <= this.rows; r++) {
            for (let c = 0; c <= this.cols; c++) {
                const deg = this.getVertexDegree(r, c);
                if (deg !== 0 && deg !== 2) {
                    return false;
                }
                if (deg === 2) activeVertices++;
            }
        }

        // Zähle Linienkanten
        for (let r = 0; r <= this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.hEdges[r][c] === 1) totalLineEdges++;
            }
        }
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c <= this.cols; c++) {
                if (this.vEdges[r][c] === 1) totalLineEdges++;
            }
        }

        if (totalLineEdges === 0 || activeVertices === 0) return false;
        if (totalLineEdges !== activeVertices) return false;

        // 3. Zusammenhängende Einzelschleife prüfen (Single Connected Loop via DFS)
        let startVertex = null;
        for (let r = 0; r <= this.rows; r++) {
            for (let c = 0; c <= this.cols; c++) {
                if (this.getVertexDegree(r, c) === 2) {
                    startVertex = { r, c };
                    break;
                }
            }
            if (startVertex) break;
        }

        if (!startVertex) return false;

        const visitedVertices = new Set();
        let current = startVertex;
        let prev = null;
        let loopEdgeCount = 0;

        while (current) {
            const key = `${current.r},${current.c}`;
            visitedVertices.add(key);

            const connected = this.getVertexEdges(current.r, current.c).filter(e => e.val === 1);
            let next = null;

            for (const edge of connected) {
                const neighbor = { r: edge.otherVertex.vr, c: edge.otherVertex.vc };
                if (!prev || (neighbor.r !== prev.r || neighbor.c !== prev.c)) {
                    next = neighbor;
                    break;
                }
            }

            loopEdgeCount++;

            if (!next) return false;
            if (next.r === startVertex.r && next.c === startVertex.c) {
                // Schleife hat sich geschlossen!
                break;
            }

            if (visitedVertices.has(`${next.r},${next.c}`)) {
                // Unerwartete Kreuzung / Zweig
                return false;
            }

            prev = current;
            current = next;
        }

        // Es müssen alle Linienkanten in dieser einen Schleife enthalten sein
        return loopEdgeCount === totalLineEdges && visitedVertices.size === activeVertices;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkEngine };
}

// === Source: js\puzzles\slitherlink\solver.js ===
/**
 * Slitherlink Solver & Hint Engine - Cortex Puzzle Platform
 * Deduktive Logik, schrittweise Lösungsstrategien und Eindeutigkeitsprüfung.
 */

class SlitherlinkSolver {
    /**
     * Ermittelt den nächsten logischen Tipp für den Spieler
     */
    static getHint(engine, options = {}) {
        const rows = engine.rows;
        const cols = engine.cols;

        // 1. FEHLER-PRÜFUNG
        // 1a. Zelle mit zu vielen Linien
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.clues[r][c];
                if (clue !== null && clue !== undefined) {
                    const lines = engine.getCellEdgeCount(r, c);
                    if (lines > clue) {
                        return {
                            type: 'error_too_many_lines',
                            r, c,
                            title: 'Zu viele Linien',
                            strategy: 'Regelverletzung',
                            message: `Die Zelle (${r + 1}, ${c + 1}) hat bereits ${lines} Linien, darf aber nur ${clue} haben.`
                        };
                    }
                    const crosses = engine.getCellCrossCount(r, c);
                    if (4 - crosses < clue) {
                        return {
                            type: 'error_not_enough_edges',
                            r, c,
                            title: 'Zahl unerreichbar',
                            strategy: 'Regelverletzung',
                            message: `Die Zelle (${r + 1}, ${c + 1}) kann die geforderte Zahl ${clue} durch zu viele Kreuze nicht mehr erreichen.`
                        };
                    }
                }
            }
        }

        // 1b. Punkt mit mehr als 2 Linien
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const deg = engine.getVertexDegree(vr, vc);
                if (deg > 2) {
                    return {
                        type: 'error_vertex_branch',
                        vr, vc,
                        title: 'Unerlaubte Verzweigung',
                        strategy: 'Regelverletzung',
                        message: `Am Punkt (${vr + 1}, ${vc + 1}) treffen ${deg} Linien zusammen. Es sind maximal genau 2 Linien erlaubt.`
                    };
                }
            }
        }

        // 1c. Abweichungen von der Gesamtlösung (falsche Linien oder falsche Kreuze)
        let sol = engine.solution;
        if (!sol && typeof SlitherlinkSolver.solve === 'function') {
            const sols = SlitherlinkSolver.solve(engine.clues, 1);
            if (sols && sols.length > 0) sol = sols[0];
        }

        if (sol) {
            if (sol.hEdges) {
                for (let r = 0; r <= rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const curVal = engine.hEdges[r][c];
                        const solVal = sol.hEdges[r][c];
                        if (curVal === 1 && solVal !== 1) {
                            return {
                                type: 'error_wrong_edge',
                                edgeType: 'h',
                                r, c,
                                value: 2,
                                expectedVal: 2,
                                title: 'Fehlerhafte Linie korrigieren',
                                strategy: 'Fehler korrigieren',
                                message: `Die horizontale Kante bei (${r + 1}, ${c + 1}) ist kein Teil der Lösungsschleife. Entferne sie oder setze ein Kreuz (✕).`
                            };
                        } else if (curVal === 2 && solVal === 1) {
                            return {
                                type: 'error_wrong_cross',
                                edgeType: 'h',
                                r, c,
                                value: 1,
                                expectedVal: 1,
                                title: 'Fehlerhaftes Kreuz korrigieren',
                                strategy: 'Fehler korrigieren',
                                message: `Die horizontale Kante bei (${r + 1}, ${c + 1}) wurde fälschlicherweise durchkreuzt, ist aber Teil der Lösungsschleife.`
                            };
                        }
                    }
                }
            }
            if (sol.vEdges) {
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c <= cols; c++) {
                        const curVal = engine.vEdges[r][c];
                        const solVal = sol.vEdges[r][c];
                        if (curVal === 1 && solVal !== 1) {
                            return {
                                type: 'error_wrong_edge',
                                edgeType: 'v',
                                r, c,
                                value: 2,
                                expectedVal: 2,
                                title: 'Fehlerhafte Linie korrigieren',
                                strategy: 'Fehler korrigieren',
                                message: `Die vertikale Kante bei (${r + 1}, ${c + 1}) ist kein Teil der Lösungsschleife. Entferne sie oder setze ein Kreuz (✕).`
                            };
                        } else if (curVal === 2 && solVal === 1) {
                            return {
                                type: 'error_wrong_cross',
                                edgeType: 'v',
                                r, c,
                                value: 1,
                                expectedVal: 1,
                                title: 'Fehlerhaftes Kreuz korrigieren',
                                strategy: 'Fehler korrigieren',
                                message: `Die vertikale Kante bei (${r + 1}, ${c + 1}) wurde fälschlicherweise durchkreuzt, ist aber Teil der Lösungsschleife.`
                            };
                        }
                    }
                }
            }
        }

        // 2. BASIS-STRATEGIEN
        // 2a. 0er-Zelle: Alle noch leeren Kanten müssen ✕ werden
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.clues[r][c] === 0) {
                    const edges = engine.getCellEdges(r, c);
                    for (const edge of edges) {
                        if (edge.val === 0) {
                            return {
                                type: 'clue_0',
                                edgeType: edge.type,
                                r: edge.r, c: edge.c,
                                value: 2, // Kreuz
                                title: '0er-Zelle sperren',
                                strategy: 'Basis: Null-Regel',
                                message: `Um eine 0 dürfen keine Linien verlaufen. Alle 4 Kanten müssen durchkreuzt werden.`
                            };
                        }
                    }
                }
            }
        }

        // 2b. Erfüllte Zahlen: Übrige Kanten auf ✕ setzen
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.clues[r][c];
                if (clue !== null && clue !== undefined) {
                    const lines = engine.getCellEdgeCount(r, c);
                    if (lines === clue) {
                        const edges = engine.getCellEdges(r, c);
                        for (const edge of edges) {
                            if (edge.val === 0) {
                                return {
                                    type: 'clue_satisfied',
                                    edgeType: edge.type,
                                    r: edge.r, c: edge.c,
                                    value: 2,
                                    title: 'Zahl bereits erfüllt',
                                    strategy: 'Basis: Vollständige Zahl',
                                    message: `Die Zahl ${clue} in Zelle (${r + 1}, ${c + 1}) hat bereits alle ${clue} Linien. Die restlichen Kanten müssen ✕ sein.`
                                };
                            }
                        }
                    }
                }
            }
        }

        // 2c. Erzwungene Linien: Wenn verbleibende leere Kanten exakt der fehlenden Linienanzahl entsprechen
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.clues[r][c];
                if (clue !== null && clue !== undefined) {
                    const lines = engine.getCellEdgeCount(r, c);
                    const crosses = engine.getCellCrossCount(r, c);
                    const remainingEmpty = 4 - lines - crosses;
                    const needed = clue - lines;

                    if (needed > 0 && remainingEmpty === needed) {
                        const edges = engine.getCellEdges(r, c);
                        for (const edge of edges) {
                            if (edge.val === 0) {
                                return {
                                    type: 'clue_forced_lines',
                                    edgeType: edge.type,
                                    r: edge.r, c: edge.c,
                                    value: 1, // Linie
                                    title: 'Zwingende Linien',
                                    strategy: 'Basis: Kantenmangel',
                                    message: `Die Zelle (${r + 1}, ${c + 1}) benötigt noch ${needed} Linie(n) und hat genau ${remainingEmpty} freie Kante(n). Diese müssen Linien sein.`
                                };
                            }
                        }
                    }
                }
            }
        }

        // 3. PUNKTGRAD-LOGIK (Vertices)
        // 3a. Punkt hat 2 Linien -> alle anderen anstoßenden Kanten müssen ✕ sein
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const edges = engine.getVertexEdges(vr, vc);
                const lines = edges.filter(e => e.val === 1).length;
                if (lines === 2) {
                    for (const edge of edges) {
                        if (edge.val === 0) {
                            return {
                                type: 'vertex_full',
                                edgeType: edge.type,
                                r: edge.r, c: edge.c,
                                value: 2,
                                title: 'Punkt ist voll',
                                strategy: 'Punktegrad: Exakt 2 Linien',
                                message: `Am Punkt (${vr + 1}, ${vc + 1}) treffen bereits 2 Linien zusammen. Alle weiteren Kanten müssen ✕ sein.`
                            };
                        }
                    }
                }
            }
        }

        // 3b. Linienfortführung: Punkt hat 1 Linie und nur noch 1 offene Kante -> Linie MUSS dort weitergehen!
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const edges = engine.getVertexEdges(vr, vc);
                const lines = edges.filter(e => e.val === 1).length;
                const emptyEdges = edges.filter(e => e.val === 0);

                if (lines === 1 && emptyEdges.length === 1) {
                    const nextEdge = emptyEdges[0];
                    return {
                        type: 'vertex_continuation',
                        edgeType: nextEdge.type,
                        r: nextEdge.r, c: nextEdge.c,
                        value: 1,
                        title: 'Linie fortführen',
                        strategy: 'Punktegrad: Pfadfortsetzung',
                        message: `Die Schleife am Punkt (${vr + 1}, ${vc + 1}) darf nicht abbrechen. Sie muss entlang der einzigen offenen Kante weitergehen.`
                    };
                }
            }
        }

        // 3c. Sackgassen-Vermeidung: Punkt hat 3 Kreuze (✕) -> 4. Kante kann keine Linie halten -> MUSS ✕ sein
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const edges = engine.getVertexEdges(vr, vc);
                const lines = edges.filter(e => e.val === 1).length;
                const crosses = edges.filter(e => e.val === 2).length;
                const emptyEdges = edges.filter(e => e.val === 0);

                if (lines === 0 && crosses === edges.length - 1 && emptyEdges.length === 1) {
                    const lastEdge = emptyEdges[0];
                    return {
                        type: 'vertex_dead_end',
                        edgeType: lastEdge.type,
                        r: lastEdge.r, c: lastEdge.c,
                        value: 2,
                        title: 'Sackgasse ausschließen',
                        strategy: 'Punktegrad: Keine Sackgasse',
                        message: `Am Punkt (${vr + 1}, ${vc + 1}) sind fast alle Kanten blockiert. Eine einzelne Linie hierhin würde eine Sackgasse bilden.`
                    };
                }
            }
        }

        // 4. MUSTER-LOGIK (3er in Ecken & Paare)
        // 4a. 3 in der Ecke
        const corners = [
            { r: 0, c: 0, outerH: { r: 0, c: 0 }, outerV: { r: 0, c: 0 } },
            { r: 0, c: cols - 1, outerH: { r: 0, c: cols - 1 }, outerV: { r: 0, c: cols } },
            { r: rows - 1, c: 0, outerH: { r: rows, c: 0 }, outerV: { r: rows - 1, c: 0 } },
            { r: rows - 1, c: cols - 1, outerH: { r: rows, c: cols - 1 }, outerV: { r: rows - 1, c: cols } }
        ];

        for (const corner of corners) {
            if (engine.clues[corner.r][corner.c] === 3) {
                if (engine.hEdges[corner.outerH.r][corner.outerH.c] === 0) {
                    return {
                        type: 'corner_3',
                        edgeType: 'h',
                        r: corner.outerH.r, c: corner.outerH.c,
                        value: 1,
                        title: '3 in der Spielfeldecke',
                        strategy: 'Muster: Eck-Dreier',
                        message: `Eine 3 in einer Ecke erzwingt zwingend die beiden äußeren Kanten als Linien.`
                    };
                }
                if (engine.vEdges[corner.outerV.r][corner.outerV.c] === 0) {
                    return {
                        type: 'corner_3',
                        edgeType: 'v',
                        r: corner.outerV.r, c: corner.outerV.c,
                        value: 1,
                        title: '3 in der Spielfeldecke',
                        strategy: 'Muster: Eck-Dreier',
                        message: `Eine 3 in einer Ecke erzwingt zwingend die beiden äußeren Kanten als Linien.`
                    };
                }
            }
        }

        // 4b. Benachbarte 3er (Horizontal 3-3)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                if (engine.clues[r][c] === 3 && engine.clues[r][c + 1] === 3) {
                    // Gemeinsame Mittelkante (vEdge r, c+1) muss 1 sein
                    if (engine.vEdges[r][c + 1] === 0) {
                        return {
                            type: 'adjacent_3',
                            edgeType: 'v',
                            r, c: c + 1,
                            value: 1,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Zwei nebeneinanderliegende 3er teilen sich immer eine gemeinsame Linie in der Mitte.`
                        };
                    }
                    // Äußere Kanten
                    if (engine.vEdges[r][c] === 0) {
                        return {
                            type: 'adjacent_3',
                            edgeType: 'v',
                            r, c,
                            value: 1,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Bei zwei benachbarten 3ern müssen auch die parallelen Außenkanten Linien sein.`
                        };
                    }
                    if (engine.vEdges[r][c + 2] === 0) {
                        return {
                            type: 'adjacent_3',
                            edgeType: 'v',
                            r, c: c + 2,
                            value: 1,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Bei zwei benachbarten 3ern müssen auch die parallelen Außenkanten Linien sein.`
                        };
                    }
                }
            }
        }

        // 4c. Benachbarte 3er (Vertikal 3 / 3)
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols; c++) {
                if (engine.clues[r][c] === 3 && engine.clues[r + 1][c] === 3) {
                    if (engine.hEdges[r + 1][c] === 0) {
                        return {
                            type: 'adjacent_3',
                            edgeType: 'h',
                            r: r + 1, c,
                            value: 1,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Zwei übereinanderliegende 3er teilen sich immer eine gemeinsame horizontale Linie.`
                        };
                    }
                    if (engine.hEdges[r][c] === 0) {
                        return {
                            type: 'adjacent_3',
                            edgeType: 'h',
                            r, c,
                            value: 1,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Bei zwei übereinanderliegenden 3ern müssen auch die oberen und unteren Außenkanten Linien sein.`
                        };
                    }
                    if (engine.hEdges[r + 2][c] === 0) {
                        return {
                            type: 'adjacent_3',
                            edgeType: 'h',
                            r: r + 2, c,
                            value: 1,
                            title: 'Benachbarte 3er',
                            strategy: 'Muster: 3er-Nachbarschaft',
                            message: `Bei zwei übereinanderliegenden 3ern müssen auch die oberen und unteren Außenkanten Linien sein.`
                        };
                    }
                }
            }
        }

        // 5. VORAUSSCHAUENDE LÖSUNG (FALLBACK VIA SOLVER-LÖSUNG)
        if (engine.solution) {
            if (engine.solution.hEdges) {
                for (let r = 0; r <= rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const solVal = engine.solution.hEdges[r][c];
                        const curVal = engine.hEdges[r][c];
                        if (curVal === 0 && solVal !== undefined) {
                            return {
                                type: 'solution_step',
                                edgeType: 'h',
                                r, c,
                                value: solVal === 1 ? 1 : 2,
                                title: solVal === 1 ? 'Linien-Schritt' : 'Kante ausschließen',
                                strategy: 'Logische Schlussfolgerung',
                                message: solVal === 1 
                                    ? `Die horizontale Kante (${r + 1}, ${c + 1}) ist Teil der eindeutigen Gesamtschleife.`
                                    : `Die horizontale Kante (${r + 1}, ${c + 1}) kann nicht Teil der Schleife sein und erhält ein Kreuz.`
                            };
                        }
                    }
                }
            }
            if (engine.solution.vEdges) {
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c <= cols; c++) {
                        const solVal = engine.solution.vEdges[r][c];
                        const curVal = engine.vEdges[r][c];
                        if (curVal === 0 && solVal !== undefined) {
                            return {
                                type: 'solution_step',
                                edgeType: 'v',
                                r, c,
                                value: solVal === 1 ? 1 : 2,
                                title: solVal === 1 ? 'Linien-Schritt' : 'Kante ausschließen',
                                strategy: 'Logische Schlussfolgerung',
                                message: solVal === 1 
                                    ? `Die vertikale Kante (${r + 1}, ${c + 1}) ist Teil der eindeutigen Gesamtschleife.`
                                    : `Die vertikale Kante (${r + 1}, ${c + 1}) kann nicht Teil der Schleife sein und erhält ein Kreuz.`
                            };
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Findet alle Lösungen für ein Slitherlink-Puzzle (zur Eindeutigkeitsprüfung).
     */
    static solve(clues, maxSolutions = 2) {
        const rows = clues.length;
        const cols = clues[0].length;

        const hEdges = Array(rows + 1).fill(0).map(() => Array(cols).fill(0));
        const vEdges = Array(rows).fill(0).map(() => Array(cols + 1).fill(0));

        const allEdges = [];
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                allEdges.push({ type: 'h', r, c });
            }
        }
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                allEdges.push({ type: 'v', r, c });
            }
        }

        const solutions = [];

        function checkVertex(vr, vc) {
            let lines = 0;
            let empty = 0;

            if (vc > 0) { if (hEdges[vr][vc - 1] === 1) lines++; else if (hEdges[vr][vc - 1] === 0) empty++; }
            if (vc < cols) { if (hEdges[vr][vc] === 1) lines++; else if (hEdges[vr][vc] === 0) empty++; }
            if (vr > 0) { if (vEdges[vr - 1][vc] === 1) lines++; else if (vEdges[vr - 1][vc] === 0) empty++; }
            if (vr < rows) { if (vEdges[vr][vc] === 1) lines++; else if (vEdges[vr][vc] === 0) empty++; }

            if (lines > 2) return false;
            if (lines === 1 && empty === 0) return false;
            return true;
        }

        function checkCell(r, c) {
            const clue = clues[r][c];
            if (clue === null || clue === undefined) return true;

            const edges = [hEdges[r][c], hEdges[r + 1][c], vEdges[r][c], vEdges[r][c + 1]];
            const lines = edges.filter(e => e === 1).length;
            const empty = edges.filter(e => e === 0).length;

            if (lines > clue) return false;
            if (lines + empty < clue) return false;
            return true;
        }

        function isValidFullLoop() {
            let activeVertices = 0;
            let totalLines = 0;
            let startV = null;

            for (let vr = 0; vr <= rows; vr++) {
                for (let vc = 0; vc <= cols; vc++) {
                    let deg = 0;
                    if (vc > 0 && hEdges[vr][vc - 1] === 1) deg++;
                    if (vc < cols && hEdges[vr][vc] === 1) deg++;
                    if (vr > 0 && vEdges[vr - 1][vc] === 1) deg++;
                    if (vr < rows && vEdges[vr][vc] === 1) deg++;

                    if (deg !== 0 && deg !== 2) return false;
                    if (deg === 2) {
                        activeVertices++;
                        if (!startV) startV = { r: vr, c: vc };
                    }
                }
            }

            for (let r = 0; r <= rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (hEdges[r][c] === 1) totalLines++;
                }
            }
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c <= cols; c++) {
                    if (vEdges[r][c] === 1) totalLines++;
                }
            }

            if (totalLines === 0 || activeVertices === 0) return false;
            if (totalLines !== activeVertices) return false;

            // DFS Schleifenzusammenhang
            const visited = new Set();
            let cur = startV;
            let prev = null;
            let count = 0;

            while (cur) {
                visited.add(`${cur.r},${cur.c}`);
                count++;

                const neighbors = [];
                if (cur.c > 0 && hEdges[cur.r][cur.c - 1] === 1) neighbors.push({ r: cur.r, c: cur.c - 1 });
                if (cur.c < cols && hEdges[cur.r][cur.c] === 1) neighbors.push({ r: cur.r, c: cur.c + 1 });
                if (cur.r > 0 && vEdges[cur.r - 1][cur.c] === 1) neighbors.push({ r: cur.r - 1, c: cur.c });
                if (cur.r < rows && vEdges[cur.r][cur.c] === 1) neighbors.push({ r: cur.r + 1, c: cur.c });

                let next = null;
                for (const n of neighbors) {
                    if (!prev || (n.r !== prev.r || n.c !== prev.c)) {
                        next = n;
                        break;
                    }
                }

                if (!next) return false;
                if (next.r === startV.r && next.c === startV.c) break;
                if (visited.has(`${next.r},${next.c}`)) return false;

                prev = cur;
                cur = next;
            }

            return count === totalLines && visited.size === activeVertices;
        }

        function backtrack(idx) {
            if (solutions.length >= maxSolutions) return;

            if (idx === allEdges.length) {
                // Alle Kanten belegt -> prüfe Zahlen und Schleife
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const clue = clues[r][c];
                        if (clue !== null && clue !== undefined) {
                            const count = [hEdges[r][c], hEdges[r + 1][c], vEdges[r][c], vEdges[r][c + 1]].filter(e => e === 1).length;
                            if (count !== clue) return;
                        }
                    }
                }
                if (isValidFullLoop()) {
                    solutions.push({
                        hEdges: hEdges.map(row => [...row]),
                        vEdges: vEdges.map(row => [...row])
                    });
                }
                return;
            }

            const edge = allEdges[idx];
            const choices = [1, 2]; // Versuche erst Linie, dann Kreuz

            for (const val of choices) {
                if (edge.type === 'h') hEdges[edge.r][edge.c] = val;
                else vEdges[edge.r][edge.c] = val;

                // Schnelle Konsistenzprüfung betroffener Vertices und Zellen
                let ok = true;
                if (edge.type === 'h') {
                    if (!checkVertex(edge.r, edge.c) || !checkVertex(edge.r, edge.c + 1)) ok = false;
                    if (ok && edge.r > 0 && !checkCell(edge.r - 1, edge.c)) ok = false;
                    if (ok && edge.r < rows && !checkCell(edge.r, edge.c)) ok = false;
                } else {
                    if (!checkVertex(edge.r, edge.c) || !checkVertex(edge.r + 1, edge.c)) ok = false;
                    if (ok && edge.c > 0 && !checkCell(edge.r, edge.c - 1)) ok = false;
                    if (ok && edge.c < cols && !checkCell(edge.r, edge.c)) ok = false;
                }

                if (ok) {
                    backtrack(idx + 1);
                }

                if (edge.type === 'h') hEdges[edge.r][edge.c] = 0;
                else vEdges[edge.r][edge.c] = 0;

                if (solutions.length >= maxSolutions) return;
            }
        }

        backtrack(0);
        return solutions;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkSolver };
}

// === Source: js\puzzles\slitherlink\generator.js ===
/**
 * Slitherlink Generator - Cortex Puzzle Platform
 * Prozedurale Erstellung eindeutig lösbarer Slitherlink-Rätsel verschiedener Schwierigkeitsgrade.
 */



class SlitherlinkGenerator {
    /**
     * Generiert ein neues Slitherlink-Rätsel mit garantierter eindeutiger Lösung.
     */
    static generate({ size = 5, difficulty = 'medium' }) {
        const rows = size;
        const cols = size;

        // Erstelle eine zufällige, nicht-selbstschneidende geschlossene Schleife
        let loop = this.generateRandomLoop(rows, cols);
        if (!loop) {
            // Fallback auf Standard-Polygon
            loop = this.createDefaultLoop(rows, cols);
        }

        // Berechne alle Zellzahlen aus der Schleife
        const fullClues = Array(rows).fill(null).map((_, r) => 
            Array(cols).fill(null).map((_, c) => {
                const count = [
                    loop.hEdges[r][c],
                    loop.hEdges[r + 1][c],
                    loop.vEdges[r][c],
                    loop.vEdges[r][c + 1]
                ].filter(val => val === 1).length;
                return count;
            })
        );

        // Entferne Hinweise entsprechend dem Schwierigkeitsgrad
        const targetClueRatio = difficulty === 'easy' ? 0.60 : (difficulty === 'hard' ? 0.35 : 0.48);
        const clues = fullClues.map(row => [...row]);

        // Mische die Zellen-Koordinaten
        const cellCoords = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                cellCoords.push({ r, c });
            }
        }
        for (let i = cellCoords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cellCoords[i], cellCoords[j]] = [cellCoords[j], cellCoords[i]];
        }

        const totalCells = rows * cols;
        const targetCluesCount = Math.max(Math.floor(totalCells * targetClueRatio), size + 2);

        let currentCluesCount = totalCells;
        for (const coord of cellCoords) {
            if (currentCluesCount <= targetCluesCount) break;

            const saved = clues[coord.r][coord.c];
            clues[coord.r][coord.c] = null;

            // Überprüfe Eindeutigkeit
            const solutions = SlitherlinkSolver.solve(clues, 2);
            if (solutions.length !== 1) {
                // Nicht eindeutig lösbar -> Hinweis wieder einsetzen
                clues[coord.r][coord.c] = saved;
            } else {
                currentCluesCount--;
            }
        }

        return {
            size,
            rows,
            cols,
            difficulty,
            clues,
            solution: {
                hEdges: loop.hEdges,
                vEdges: loop.vEdges
            }
        };
    }

    /**
     * Erzeugt eine zufällige geschlossene Schleife durch schrittweises Erweitern
     */
    static generateRandomLoop(rows, cols) {
        // Starte mit einem kleinen 2x2 Rechteck in der Mitte
        const hEdges = Array(rows + 1).fill(0).map(() => Array(cols).fill(0));
        const vEdges = Array(rows).fill(0).map(() => Array(cols + 1).fill(0));

        const minR = Math.floor(rows / 4);
        const minC = Math.floor(cols / 4);
        const w = Math.max(2, Math.floor(cols / 2));
        const h = Math.max(2, Math.floor(rows / 2));

        for (let c = minC; c < minC + w; c++) {
            hEdges[minR][c] = 1;
            hEdges[minR + h][c] = 1;
        }
        for (let r = minR; r < minR + h; r++) {
            vEdges[r][minC] = 1;
            vEdges[r][minC + w] = 1;
        }

        // Führe zufällige Verformungen durch (Kanten-Ausbeulungen / Dehnungen)
        const iterations = rows * cols * 2;
        for (let it = 0; it < iterations; it++) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);

            // Zähle Kanten der Zelle
            const count = [
                hEdges[r][c],
                hEdges[r + 1][c],
                vEdges[r][c],
                vEdges[r][c + 1]
            ].filter(v => v === 1).length;

            // Wenn Zelle 1 Kante hat: wir können sie umklappen (1 -> 3), wenn dadurch eine gültige Schleife bleibt
            if (count === 1) {
                // Probiere Invertierung
                hEdges[r][c] = 1 - hEdges[r][c];
                hEdges[r + 1][c] = 1 - hEdges[r + 1][c];
                vEdges[r][c] = 1 - vEdges[r][c];
                vEdges[r][c + 1] = 1 - vEdges[r][c + 1];

                if (!this.isValidLoopGraph(hEdges, vEdges, rows, cols)) {
                    // Zurückrollen
                    hEdges[r][c] = 1 - hEdges[r][c];
                    hEdges[r + 1][c] = 1 - hEdges[r + 1][c];
                    vEdges[r][c] = 1 - vEdges[r][c];
                    vEdges[r][c + 1] = 1 - vEdges[r][c + 1];
                }
            }
        }

        return { hEdges, vEdges };
    }

    static isValidLoopGraph(hEdges, vEdges, rows, cols) {
        let activeVertices = 0;
        let totalLines = 0;
        let startV = null;

        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                let deg = 0;
                if (vc > 0 && hEdges[vr][vc - 1] === 1) deg++;
                if (vc < cols && hEdges[vr][vc] === 1) deg++;
                if (vr > 0 && vEdges[vr - 1][vc] === 1) deg++;
                if (vr < rows && vEdges[vr][vc] === 1) deg++;

                if (deg !== 0 && deg !== 2) return false;
                if (deg === 2) {
                    activeVertices++;
                    if (!startV) startV = { r: vr, c: vc };
                }
            }
        }

        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (hEdges[r][c] === 1) totalLines++;
            }
        }
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                if (vEdges[r][c] === 1) totalLines++;
            }
        }

        if (totalLines === 0 || activeVertices === 0 || totalLines !== activeVertices) return false;

        const visited = new Set();
        let cur = startV;
        let prev = null;
        let count = 0;

        while (cur) {
            visited.add(`${cur.r},${cur.c}`);
            count++;

            const neighbors = [];
            if (cur.c > 0 && hEdges[cur.r][cur.c - 1] === 1) neighbors.push({ r: cur.r, c: cur.c - 1 });
            if (cur.c < cols && hEdges[cur.r][cur.c] === 1) neighbors.push({ r: cur.r, c: cur.c + 1 });
            if (cur.r > 0 && vEdges[cur.r - 1][cur.c] === 1) neighbors.push({ r: cur.r - 1, c: cur.c });
            if (cur.r < rows && vEdges[cur.r][cur.c] === 1) neighbors.push({ r: cur.r + 1, c: cur.c });

            let next = null;
            for (const n of neighbors) {
                if (!prev || (n.r !== prev.r || n.c !== prev.c)) {
                    next = n;
                    break;
                }
            }

            if (!next) return false;
            if (next.r === startV.r && next.c === startV.c) break;
            if (visited.has(`${next.r},${next.c}`)) return false;

            prev = cur;
            cur = next;
        }

        return count === totalLines && visited.size === activeVertices;
    }

    static createDefaultLoop(rows, cols) {
        const hEdges = Array(rows + 1).fill(0).map(() => Array(cols).fill(0));
        const vEdges = Array(rows).fill(0).map(() => Array(cols + 1).fill(0));

        // Rechteck um die äußeren Kanten
        for (let c = 0; c < cols; c++) {
            hEdges[0][c] = 1;
            hEdges[rows][c] = 1;
        }
        for (let r = 0; r < rows; r++) {
            vEdges[r][0] = 1;
            vEdges[r][cols] = 1;
        }

        return { hEdges, vEdges };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkGenerator };
}

// === Source: js\puzzles\slitherlink\renderer.js ===
/**
 * Slitherlink Renderer - Cortex Puzzle Platform
 * Responsive SVG-Visualisierung mit Wischsteuerung (Drag-to-Draw / Swipe),
 * Ecken- & Kanten-Hitboxen und Theme-Glow-Effekten.
 */

class SlitherlinkRenderer {
    /**
     * Rendert das vollständige Slitherlink-Board in den Zielcontainer
     */
    static renderBoard(container, engine, state, onCellInteraction) {
        container.innerHTML = '';
        const rows = engine.rows;
        const cols = engine.cols;

        const boardWrap = document.createElement('div');
        boardWrap.className = `slitherlink-board-wrapper slitherlink-grid-${cols}x${rows}`;
        boardWrap.id = 'slitherlinkBoard';
        boardWrap.style.touchAction = 'none';

        const solution = state.solutionRevealed ? (engine.getSolution ? engine.getSolution() : engine.solution) : null;

        const pad = 24;
        const totalW = cols * 100 + pad * 2;
        const totalH = rows * 100 + pad * 2;
        let svgHtml = `<svg class="slitherlink-svg" viewBox="${-pad} ${-pad} ${totalW} ${totalH}" preserveAspectRatio="xMidYMid meet">`;

        // 1. ZELLEN-LAYER (Zahlenhinweise)
        svgHtml += `<g class="slitherlink-cells-layer">`;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const clue = engine.clues[r][c];
                const count = engine.getCellEdgeCount(r, c);
                const isSatisfied = clue !== null && count === clue;
                const isViolated = clue !== null && count > clue;

                svgHtml += `<g class="slitherlink-cell-group ${isSatisfied ? 'satisfied' : ''} ${isViolated ? 'violated' : ''}" data-r="${r}" data-c="${c}">`;
                svgHtml += `<rect x="${c * 100 + 12}" y="${r * 100 + 12}" width="76" height="76" class="slitherlink-cell-bg" rx="12"></rect>`;
                if (clue !== null && clue !== undefined) {
                    svgHtml += `<text x="${c * 100 + 50}" y="${r * 100 + 52}" class="slitherlink-clue-text clue-${clue}" text-anchor="middle" dominant-baseline="central">${clue}</text>`;
                }
                svgHtml += `</g>`;
            }
        }
        svgHtml += `</g>`;

        // 2. KANTEN-LAYER (Horizontal & Vertikal)
        svgHtml += `<g class="slitherlink-edges-layer">`;

        // Horizontale Kanten
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                let val = engine.hEdges[r][c];
                if (solution && solution.hEdges) {
                    val = solution.hEdges[r][c];
                }
                const hasNote = engine.hNotes[r][c] && engine.hNotes[r][c].has(2);
                const x1 = c * 100;
                const y1 = r * 100;
                const x2 = (c + 1) * 100;
                const y2 = r * 100;

                svgHtml += `<g class="slitherlink-edge-group slitherlink-edge-h val-${val} ${hasNote ? 'has-note' : ''}" data-edge-type="h" data-r="${r}" data-c="${c}">`;
                svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-hitzone" stroke-width="42" stroke="transparent" stroke-linecap="round"></line>`;

                if (val === 1) {
                    svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-line" stroke-width="8" stroke-linecap="round"></line>`;
                } else if (val === 2 || hasNote) {
                    const midX = (x1 + x2) / 2;
                    const midY = y1;
                    svgHtml += `<g class="slitherlink-edge-cross ${hasNote ? 'is-note' : ''}">`;
                    svgHtml += `<line x1="${midX - 8}" y1="${midY - 8}" x2="${midX + 8}" y2="${midY + 8}"></line>`;
                    svgHtml += `<line x1="${midX - 8}" y1="${midY + 8}" x2="${midX + 8}" y2="${midY - 8}"></line>`;
                    svgHtml += `</g>`;
                } else {
                    svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-guide" stroke-width="2"></line>`;
                }
                svgHtml += `</g>`;
            }
        }

        // Vertikale Kanten
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                let val = engine.vEdges[r][c];
                if (solution && solution.vEdges) {
                    val = solution.vEdges[r][c];
                }
                const hasNote = engine.vNotes[r][c] && engine.vNotes[r][c].has(2);
                const x1 = c * 100;
                const y1 = r * 100;
                const x2 = c * 100;
                const y2 = (r + 1) * 100;

                svgHtml += `<g class="slitherlink-edge-group slitherlink-edge-v val-${val} ${hasNote ? 'has-note' : ''}" data-edge-type="v" data-r="${r}" data-c="${c}">`;
                svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-hitzone" stroke-width="42" stroke="transparent" stroke-linecap="round"></line>`;

                if (val === 1) {
                    svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-line" stroke-width="8" stroke-linecap="round"></line>`;
                } else if (val === 2 || hasNote) {
                    const midX = x1;
                    const midY = (y1 + y2) / 2;
                    svgHtml += `<g class="slitherlink-edge-cross ${hasNote ? 'is-note' : ''}">`;
                    svgHtml += `<line x1="${midX - 8}" y1="${midY - 8}" x2="${midX + 8}" y2="${midY + 8}"></line>`;
                    svgHtml += `<line x1="${midX - 8}" y1="${midY + 8}" x2="${midX + 8}" y2="${midY - 8}"></line>`;
                    svgHtml += `</g>`;
                } else {
                    svgHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-guide" stroke-width="2"></line>`;
                }
                svgHtml += `</g>`;
            }
        }
        svgHtml += `</g>`;

        // 3. GITTERPUNKTE (Vertices)
        svgHtml += `<g class="slitherlink-dots-layer">`;
        for (let vr = 0; vr <= rows; vr++) {
            for (let vc = 0; vc <= cols; vc++) {
                const deg = engine.getVertexDegree(vr, vc);
                const isError = deg > 2;
                const rRadius = isError ? 7 : (deg === 2 ? 6 : 5);
                svgHtml += `<circle cx="${vc * 100}" cy="${vr * 100}" r="${rRadius}" class="slitherlink-dot deg-${deg} ${isError ? 'dot-error' : ''}"></circle>`;
            }
        }
        svgHtml += `</g>`;

        svgHtml += `</svg>`;
        boardWrap.innerHTML = svgHtml;
        container.appendChild(boardWrap);

        // Wisch- und Klick-Gestensteuerung
        this.setupDragToDraw(boardWrap, engine, state);
    }

    /**
     * Wischsteuerung: Kontinuierliches Zeichnen beim Ziehen über Kanten (Drag-to-Draw)
     */
    static setupDragToDraw(wrapper, engine, state) {
        let isDragging = false;
        let isDragActive = false;
        let didLongPress = false;
        let dragMode = null; // 1 = Linie, 2 = Kreuz, 0 = Leer
        let startEdge = null;
        let lastEdgeKey = null;
        let activePointerId = null;
        let startX = 0;
        let startY = 0;
        let longPressTimer = null;

        const getApp = () => window.cortexApp || window.tangoApp || window.app;

        const updateEdgeElement = (type, r, c) => {
            const group = wrapper.querySelector(`.slitherlink-edge-group[data-edge-type="${type}"][data-r="${r}"][data-c="${c}"]`);
            if (!group) return;
            const val = engine.getEdge(type, r, c);
            const hasNote = (type === 'h' ? engine.hNotes[r][c] : engine.vNotes[r][c])?.has(2);
            const x1 = type === 'h' ? c * 100 : c * 100;
            const y1 = type === 'h' ? r * 100 : r * 100;
            const x2 = type === 'h' ? (c + 1) * 100 : c * 100;
            const y2 = type === 'h' ? r * 100 : (r + 1) * 100;

            group.setAttribute('class', `slitherlink-edge-group slitherlink-edge-${type} val-${val} ${hasNote ? 'has-note' : ''}`);

            let innerHtml = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-hitzone" stroke-width="42" stroke="transparent" stroke-linecap="round"></line>`;
            if (val === 1) {
                innerHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-line" stroke-width="8" stroke-linecap="round"></line>`;
            } else if (val === 2 || hasNote) {
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                innerHtml += `<g class="slitherlink-edge-cross ${hasNote ? 'is-note' : ''}">`;
                innerHtml += `<line x1="${midX - 8}" y1="${midY - 8}" x2="${midX + 8}" y2="${midY + 8}"></line>`;
                innerHtml += `<line x1="${midX - 8}" y1="${midY + 8}" x2="${midX + 8}" y2="${midY - 8}"></line>`;
                innerHtml += `</g>`;
            } else {
                innerHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="slitherlink-edge-guide" stroke-width="2"></line>`;
            }
            group.innerHTML = innerHtml;
        };

        const getEdgeFromPoint = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                const group = el.closest('.slitherlink-edge-group');
                if (group) {
                    return {
                        type: group.dataset.edgeType,
                        r: parseInt(group.dataset.r, 10),
                        c: parseInt(group.dataset.c, 10)
                    };
                }
            }
            return null;
        };

        const onPointerDown = (e) => {
            if (state.solutionRevealed) return;
            if (activePointerId !== null && activePointerId !== e.pointerId) return;

            const edge = getEdgeFromPoint(e.clientX, e.clientY);
            if (!edge) return;

            isDragging = true;
            isDragActive = false;
            didLongPress = false;
            activePointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            startEdge = edge;
            lastEdgeKey = `${edge.type}_${edge.r}_${edge.c}`;

            // Rechtsklick: Direkt Kreuz (✕) setzen / entfernen
            if (e.button === 2) {
                const curVal = engine.getEdge(edge.type, edge.r, edge.c);
                const newVal = (curVal === 2 ? 0 : 2);
                engine.setEdge(edge.type, edge.r, edge.c, newVal, false);
                updateEdgeElement(edge.type, edge.r, edge.c);
                didLongPress = true;
                if (newVal === 2 && typeof audio !== 'undefined' && audio.vibrate) audio.vibrate(25);
                else if (typeof audio !== 'undefined' && audio.playClear) audio.playClear();
                const app = getApp();
                if (app) {
                    app.movesCount++;
                    app.checkCompletion();
                    app.saveActiveGameState();
                }
                return;
            }

            // Notiz-Modus
            if (state.isNoteMode) {
                dragMode = 2;
                engine.setEdge(edge.type, edge.r, edge.c, 2, true);
                updateEdgeElement(edge.type, edge.r, edge.c);
                didLongPress = true;
                if (typeof audio !== 'undefined' && audio.vibrate) audio.vibrate(25);
                const app = getApp();
                if (app) {
                    app.movesCount++;
                    app.checkCompletion();
                    app.saveActiveGameState();
                }
                return;
            }

            // Long Press (300ms) für schnelles und zuverlässiges Setzen von Kreuzen (✕)
            longPressTimer = setTimeout(() => {
                didLongPress = true;
                const curVal = engine.getEdge(edge.type, edge.r, edge.c);
                const newVal = (curVal === 2 ? 0 : 2);
                engine.setEdge(edge.type, edge.r, edge.c, newVal, false);
                dragMode = newVal;
                updateEdgeElement(edge.type, edge.r, edge.c);
                if (newVal === 2 && typeof audio !== 'undefined' && audio.vibrate) audio.vibrate(35);
                else if (typeof audio !== 'undefined' && audio.playClear) audio.playClear();
                const app = getApp();
                if (app) {
                    app.movesCount++;
                    app.checkCompletion();
                    app.saveActiveGameState();
                }
            }, 300);
        };

        const onPointerMove = (e) => {
            if (!isDragging || activePointerId !== e.pointerId || state.solutionRevealed) return;

            const dist = Math.hypot(e.clientX - startX, e.clientY - startY);

            // Wenn Bewegung größer als Jitter-Toleranz (12px): Long-Press abbrechen und Wischmodus starten
            if (dist > 12) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }

                if (!isDragActive && !didLongPress && startEdge) {
                    isDragActive = true;
                    const curVal = engine.getEdge(startEdge.type, startEdge.r, startEdge.c);
                    dragMode = (curVal === 1 ? 0 : 1);
                    engine.setEdge(startEdge.type, startEdge.r, startEdge.c, dragMode, false);
                    updateEdgeElement(startEdge.type, startEdge.r, startEdge.c);
                    if (dragMode === 1 && typeof audio !== 'undefined' && audio.playSun) audio.playSun();
                    else if (typeof audio !== 'undefined' && audio.playClear) audio.playClear();
                    const app = getApp();
                    if (app) {
                        app.movesCount++;
                        app.checkCompletion();
                        app.saveActiveGameState();
                    }
                }

                const edge = getEdgeFromPoint(e.clientX, e.clientY);
                if (!edge) return;

                const key = `${edge.type}_${edge.r}_${edge.c}`;
                if (key !== lastEdgeKey) {
                    lastEdgeKey = key;
                    const mode = (dragMode !== null ? dragMode : 1);

                    if (state.isNoteMode) {
                        engine.setEdge(edge.type, edge.r, edge.c, 2, true);
                    } else {
                        engine.setEdge(edge.type, edge.r, edge.c, mode, false);
                    }

                    updateEdgeElement(edge.type, edge.r, edge.c);

                    if (typeof audio !== 'undefined') {
                        if (mode === 1 && audio.playSun) audio.playSun();
                        else if (mode === 2 && audio.vibrate) audio.vibrate(20);
                        else if (audio.playClear) audio.playClear();
                    }

                    const app = getApp();
                    if (app) {
                        app.movesCount++;
                        app.checkCompletion();
                        app.saveActiveGameState();
                    }
                }
            }
        };

        const onPointerEnd = (e) => {
            if (activePointerId === e.pointerId) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }

                // Kurzes Antippen (Tap): 0 -> 1 -> 2 -> 0 durchschalten
                if (!didLongPress && !isDragActive && startEdge) {
                    const curVal = engine.getEdge(startEdge.type, startEdge.r, startEdge.c);
                    const newVal = (curVal === 0 ? 1 : (curVal === 1 ? 2 : 0));
                    engine.setEdge(startEdge.type, startEdge.r, startEdge.c, newVal, false);
                    updateEdgeElement(startEdge.type, startEdge.r, startEdge.c);

                    if (typeof audio !== 'undefined') {
                        if (newVal === 1 && audio.playSun) audio.playSun();
                        else if (newVal === 2 && audio.vibrate) audio.vibrate(25);
                        else if (audio.playClear) audio.playClear();
                    }

                    const app = getApp();
                    if (app) {
                        app.movesCount++;
                        app.checkCompletion();
                        app.saveActiveGameState();
                    }
                }

                isDragging = false;
                isDragActive = false;
                didLongPress = false;
                startEdge = null;
                activePointerId = null;
                lastEdgeKey = null;
                dragMode = null;

                const app = getApp();
                if (app) {
                    app.renderGrid();
                    app.checkCompletion();
                    app.saveActiveGameState();
                }
            }
        };

        wrapper.addEventListener('pointerdown', onPointerDown);
        wrapper.addEventListener('pointermove', onPointerMove);
        wrapper.addEventListener('pointerup', onPointerEnd);
        wrapper.addEventListener('pointercancel', onPointerEnd);
        wrapper.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    static renderKeypad(container, engine, state, onKeyAction) {
        container.innerHTML = '';
        const keys = [
            { val: 1, label: 'Linie', icon: '―', cls: 'keypad-line' },
            { val: 2, label: 'Kreuz', icon: '✕', cls: 'keypad-cross' },
            { val: 0, label: 'Leeren', icon: '⌫', cls: 'keypad-clear' }
        ];

        for (const k of keys) {
            const btn = document.createElement('button');
            btn.className = `keypad-btn ${k.cls}`;
            btn.innerHTML = `<span class="keypad-icon">${k.icon}</span><span class="keypad-label">${k.label}</span>`;
            btn.addEventListener('click', () => {
                onKeyAction(k.val);
            });
            container.appendChild(btn);
        }
    }

    static getSymbolSvg(val, extraClass = '', size = 24) {
        if (val === 1) {
            return `<svg class="symbol-svg ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;
        } else if (val === 2) {
            return `<svg class="symbol-svg ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
        }
        return '';
    }

    static getRulesHtml(lang = 'de') {
        if (lang === 'en') {
            return `
                <div class="rules-container">
                    <div class="rule-box">
                        <div class="rule-badge">1</div>
                        <div class="rule-content">
                            <strong>Single Closed Loop</strong>
                            <p>Connect the dots horizontally and vertically to form a single continuous, non-intersecting loop without loose ends or branches.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">2</div>
                        <div class="rule-content">
                            <strong>Clue Numbers (0 to 3)</strong>
                            <p>A number in a cell indicates exactly how many of its 4 boundary edges are part of the loop. Empty cells have no edge restrictions.</p>
                        </div>
                    </div>
                    <div class="rule-box">
                        <div class="rule-badge">3</div>
                        <div class="rule-content">
                            <strong>No Branching (Vertex Degree 2 or 0)</strong>
                            <p>At every dot, exactly 2 lines meet (the loop passes through) or 0 lines meet. T-junctions, crosses, and dead ends are forbidden.</p>
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
                        <strong>Eine geschlossene Schleife</strong>
                        <p>Verbinde die Gitterpunkte horizontal und vertikal zu einem einzigen, zusammenhängenden und geschlossenen Rundweg. Es darf keine Abzweigungen, Kreuzungen oder isolierten Nebenschleifen geben.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">2</div>
                    <div class="rule-content">
                        <strong>Zahlenhinweise (0 bis 3)</strong>
                        <p>Eine Zahl in einer Zelle gibt exakt an, wie viele ihrer 4 Kanten Teil der Schleife sein müssen. Um eine 0 darf keine Linie verlaufen. Leere Zellen haben keine Einschränkung.</p>
                    </div>
                </div>
                <div class="rule-box">
                    <div class="rule-badge">3</div>
                    <div class="rule-content">
                        <strong>Genau 2 Linien pro Punkt</strong>
                        <p>An jedem Punkt der Schleife treffen immer genau 2 Linien zusammen (der Weg läuft durch). Sackgassen oder 3-Wege-Verzweigungen sind nicht erlaubt.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkRenderer };
}

// === Source: js\puzzles\slitherlink\data\i18n.js ===
/**
 * Slitherlink-spezifische Übersetzungen (DE & EN)
 */

const SLITHERLINK_I18N = {
    de: {
        slitherlink_title: "Slitherlink",
        slitherlink_desc: "Verbinde die Punkte zu einer geschlossenen Schleife",
        slitherlink_btn_line: "Linie",
        slitherlink_btn_cross: "Kreuz",
        slitherlink_btn_clear: "Leeren",
        slitherlink_rules_title: "Slitherlink Regeln",
        slitherlink_chapter_1: "Einstieg (4×4 & 5×5)",
        slitherlink_chapter_2: "Pfadfinder (6×6 & 7×7)",
        slitherlink_chapter_3: "Labyrinth (8×8)",
        slitherlink_chapter_4: "Meister-Zirkel (10×10)",
        slitherlink_tut_basics: "Grundlagen",
        slitherlink_tut_advanced: "Meistermuster"
    },
    en: {
        slitherlink_title: "Slitherlink",
        slitherlink_desc: "Connect the dots to form a single continuous loop",
        slitherlink_btn_line: "Line",
        slitherlink_btn_cross: "Cross",
        slitherlink_btn_clear: "Clear",
        slitherlink_rules_title: "Slitherlink Rules",
        slitherlink_chapter_1: "Introduction (4×4 & 5×5)",
        slitherlink_chapter_2: "Pathfinder (6×6 & 7×7)",
        slitherlink_chapter_3: "Labyrinth (8×8)",
        slitherlink_chapter_4: "Master Circle (10×10)",
        slitherlink_tut_basics: "Basics",
        slitherlink_tut_advanced: "Master Patterns"
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SLITHERLINK_I18N };
}

// === Source: js\puzzles\slitherlink\data\levels.js ===
/**
 * Slitherlink Kampagnen-Level (120 Level)
 * Kapitel 1: 4x4 & 5x5 (L1-30) - Grundlagen & Aufbau
 * Kapitel 2: 6x6 (L31-60) - Fortgeschritten
 * Kapitel 3: 8x8 (L61-90) - Meister
 * Kapitel 4: 10x10 (L91-120) - Großmeister
 * Jedes Level ist garantiert 100% eindeutig lösbar.
 */

const SLITHERLINK_LEVELS = [
  {
    "id": 1,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        2,
        null,
        3,
        3
      ],
      [
        1,
        null,
        2,
        2
      ],
      [
        null,
        3,
        2,
        null
      ],
      [
        2,
        null,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 2,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        3,
        1,
        null,
        2
      ],
      [
        3,
        null,
        1,
        2
      ],
      [
        null,
        null,
        3,
        2
      ],
      [
        null,
        1,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          1
        ],
        [
          1,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 3,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        null,
        3,
        null,
        2
      ],
      [
        null,
        3,
        null,
        2
      ],
      [
        null,
        2,
        0,
        1
      ],
      [
        1,
        2,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 4,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        2,
        2,
        null,
        3
      ],
      [
        2,
        null,
        2,
        null
      ],
      [
        null,
        2,
        0,
        null
      ],
      [
        null,
        0,
        0,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 5,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        3,
        2,
        null,
        0
      ],
      [
        2,
        null,
        2,
        null
      ],
      [
        1,
        1,
        1,
        null
      ],
      [
        null,
        null,
        1,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 6,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        1,
        2,
        1,
        3
      ],
      [
        null,
        1,
        null,
        null
      ],
      [
        null,
        0,
        null,
        null
      ],
      [
        2,
        1,
        2,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 7,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        null,
        null,
        null,
        null
      ],
      [
        3,
        1,
        1,
        3
      ],
      [
        3,
        0,
        1,
        null
      ],
      [
        2,
        2,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 8,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        null,
        1,
        1,
        2
      ],
      [
        null,
        0,
        1,
        2
      ],
      [
        null,
        null,
        3,
        null
      ],
      [
        3,
        1,
        3,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 9,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        null,
        2,
        2,
        2
      ],
      [
        null,
        2,
        0,
        null
      ],
      [
        1,
        2,
        0,
        null
      ],
      [
        null,
        null,
        3,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 10,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        2,
        null,
        null,
        2
      ],
      [
        3,
        null,
        0,
        3
      ],
      [
        null,
        1,
        2,
        null
      ],
      [
        3,
        2,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 11,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        0,
        0,
        null,
        0
      ],
      [
        0,
        null,
        3,
        null
      ],
      [
        2,
        2,
        0,
        3
      ],
      [
        null,
        1,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 12,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        1,
        3,
        1,
        null
      ],
      [
        1,
        null,
        2,
        3
      ],
      [
        3,
        null,
        null,
        3
      ],
      [
        null,
        null,
        3,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 13,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        null,
        2,
        1,
        3
      ],
      [
        2,
        1,
        null,
        2
      ],
      [
        3,
        null,
        3,
        null
      ],
      [
        2,
        null,
        3,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 14,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        null,
        null,
        null,
        0
      ],
      [
        null,
        3,
        2,
        1
      ],
      [
        2,
        0,
        1,
        null
      ],
      [
        null,
        1,
        2,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 15,
    "size": 4,
    "difficulty": "easy",
    "clues": [
      [
        0,
        null,
        0,
        1
      ],
      [
        1,
        null,
        2,
        3
      ],
      [
        null,
        2,
        1,
        null
      ],
      [
        null,
        3,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 16,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        null,
        null,
        0,
        null,
        1
      ],
      [
        null,
        0,
        1,
        null,
        null
      ],
      [
        null,
        3,
        null,
        1,
        2
      ],
      [
        null,
        2,
        1,
        null,
        null
      ],
      [
        3,
        2,
        2,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 17,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        2,
        null,
        null,
        null,
        1
      ],
      [
        3,
        null,
        1,
        1,
        3
      ],
      [
        null,
        3,
        null,
        null,
        2
      ],
      [
        null,
        3,
        1,
        2,
        null
      ],
      [
        null,
        1,
        null,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 18,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        3,
        null,
        2,
        1,
        1
      ],
      [
        null,
        1,
        null,
        3,
        null
      ],
      [
        null,
        1,
        null,
        null,
        null
      ],
      [
        1,
        2,
        3,
        1,
        2
      ],
      [
        null,
        null,
        null,
        3,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 19,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        3,
        2,
        null,
        1,
        0
      ],
      [
        3,
        1,
        null,
        2,
        null
      ],
      [
        null,
        null,
        null,
        null,
        2
      ],
      [
        2,
        0,
        0,
        null,
        2
      ],
      [
        null,
        null,
        null,
        null,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 20,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        1,
        2,
        3,
        null,
        null
      ],
      [
        null,
        2,
        3,
        null,
        0
      ],
      [
        null,
        2,
        null,
        null,
        1
      ],
      [
        null,
        null,
        1,
        2,
        2
      ],
      [
        0,
        1,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 21,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        1,
        null,
        null,
        2,
        null
      ],
      [
        null,
        1,
        null,
        0,
        2
      ],
      [
        1,
        1,
        null,
        2,
        3
      ],
      [
        2,
        null,
        2,
        null,
        null
      ],
      [
        1,
        null,
        null,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 22,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        null,
        null,
        2,
        2,
        null
      ],
      [
        3,
        null,
        null,
        null,
        1
      ],
      [
        2,
        null,
        0,
        1,
        1
      ],
      [
        2,
        null,
        1,
        3,
        null
      ],
      [
        2,
        null,
        null,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 23,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        2,
        null,
        2,
        1,
        null
      ],
      [
        2,
        null,
        null,
        1,
        1
      ],
      [
        null,
        null,
        null,
        3,
        null
      ],
      [
        1,
        2,
        null,
        null,
        1
      ],
      [
        null,
        0,
        2,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 24,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        1,
        2,
        null,
        1,
        null
      ],
      [
        1,
        null,
        null,
        2,
        null
      ],
      [
        2,
        2,
        1,
        2,
        3
      ],
      [
        2,
        null,
        null,
        null,
        1
      ],
      [
        null,
        null,
        null,
        null,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 25,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        null,
        null,
        null,
        null,
        null
      ],
      [
        3,
        1,
        2,
        3,
        2
      ],
      [
        1,
        null,
        null,
        1,
        2
      ],
      [
        null,
        null,
        2,
        2,
        2
      ],
      [
        0,
        null,
        null,
        null,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 26,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        null,
        1,
        null,
        3,
        1
      ],
      [
        null,
        2,
        null,
        null,
        2
      ],
      [
        1,
        1,
        1,
        null,
        null
      ],
      [
        1,
        3,
        null,
        null,
        3
      ],
      [
        0,
        null,
        null,
        null,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 27,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        null,
        2,
        null,
        1,
        null
      ],
      [
        null,
        1,
        2,
        3,
        null
      ],
      [
        2,
        3,
        null,
        null,
        0
      ],
      [
        null,
        null,
        null,
        1,
        0
      ],
      [
        2,
        1,
        null,
        1,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 28,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        3,
        null,
        2,
        null,
        null
      ],
      [
        2,
        null,
        2,
        null,
        0
      ],
      [
        2,
        null,
        2,
        null,
        null
      ],
      [
        null,
        1,
        1,
        2,
        3
      ],
      [
        3,
        null,
        null,
        null,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 29,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        null,
        null,
        null,
        1,
        1
      ],
      [
        2,
        1,
        1,
        1,
        2
      ],
      [
        null,
        null,
        1,
        null,
        null
      ],
      [
        null,
        null,
        null,
        1,
        1
      ],
      [
        0,
        2,
        3,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 30,
    "size": 5,
    "difficulty": "medium",
    "clues": [
      [
        null,
        1,
        2,
        2,
        null
      ],
      [
        1,
        null,
        null,
        2,
        null
      ],
      [
        null,
        null,
        3,
        null,
        2
      ],
      [
        3,
        null,
        null,
        0,
        1
      ],
      [
        null,
        1,
        2,
        null,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 31,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        null,
        2,
        1,
        1,
        null
      ],
      [
        1,
        null,
        1,
        2,
        2,
        null
      ],
      [
        0,
        null,
        2,
        2,
        null,
        1
      ],
      [
        null,
        0,
        null,
        null,
        null,
        2
      ],
      [
        0,
        null,
        null,
        3,
        null,
        3
      ],
      [
        0,
        1,
        null,
        null,
        1,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 32,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        1,
        null,
        null,
        2,
        2,
        null
      ],
      [
        0,
        2,
        1,
        1,
        null,
        null
      ],
      [
        1,
        2,
        null,
        null,
        1,
        2
      ],
      [
        2,
        1,
        2,
        null,
        null,
        2
      ],
      [
        null,
        null,
        null,
        null,
        null,
        2
      ],
      [
        null,
        3,
        null,
        null,
        2,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 33,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        0,
        null,
        null,
        1,
        null,
        2
      ],
      [
        0,
        null,
        3,
        1,
        null,
        2
      ],
      [
        1,
        null,
        2,
        null,
        0,
        null
      ],
      [
        1,
        null,
        2,
        null,
        2,
        null
      ],
      [
        null,
        null,
        1,
        2,
        null,
        null
      ],
      [
        null,
        2,
        2,
        null,
        1,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 34,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        3,
        3,
        null,
        3,
        2,
        null
      ],
      [
        null,
        null,
        null,
        null,
        1,
        2
      ],
      [
        2,
        1,
        null,
        null,
        null,
        null
      ],
      [
        null,
        3,
        null,
        null,
        0,
        2
      ],
      [
        null,
        null,
        1,
        0,
        null,
        null
      ],
      [
        3,
        2,
        3,
        3,
        3,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 35,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        1,
        3,
        null,
        2,
        3,
        null
      ],
      [
        1,
        null,
        null,
        null,
        1,
        null
      ],
      [
        null,
        null,
        1,
        1,
        null,
        null
      ],
      [
        2,
        1,
        null,
        1,
        0,
        2
      ],
      [
        null,
        2,
        null,
        1,
        null,
        null
      ],
      [
        3,
        2,
        null,
        null,
        2,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 36,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        1,
        1,
        null,
        null,
        2,
        null
      ],
      [
        null,
        2,
        3,
        1,
        0,
        null
      ],
      [
        2,
        0,
        2,
        null,
        1,
        2
      ],
      [
        2,
        2,
        null,
        null,
        1,
        2
      ],
      [
        null,
        null,
        null,
        null,
        null,
        3
      ],
      [
        3,
        null,
        null,
        0,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 37,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        2,
        2,
        null,
        3,
        null
      ],
      [
        1,
        null,
        1,
        null,
        1,
        null
      ],
      [
        null,
        null,
        1,
        2,
        1,
        2
      ],
      [
        null,
        2,
        null,
        null,
        null,
        null
      ],
      [
        2,
        3,
        3,
        2,
        null,
        null
      ],
      [
        3,
        1,
        null,
        2,
        3,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 38,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        2,
        null,
        null,
        3,
        null
      ],
      [
        null,
        0,
        1,
        2,
        null,
        3
      ],
      [
        2,
        null,
        null,
        null,
        null,
        null
      ],
      [
        1,
        null,
        1,
        null,
        1,
        1
      ],
      [
        0,
        null,
        3,
        null,
        1,
        null
      ],
      [
        0,
        1,
        3,
        1,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 39,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        0,
        0,
        1,
        2,
        2,
        3
      ],
      [
        0,
        null,
        null,
        null,
        3,
        2
      ],
      [
        null,
        3,
        null,
        1,
        null,
        3
      ],
      [
        null,
        1,
        null,
        2,
        null,
        null
      ],
      [
        1,
        1,
        null,
        null,
        null,
        null
      ],
      [
        1,
        null,
        null,
        1,
        0,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 40,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        null,
        2,
        1,
        null,
        null
      ],
      [
        null,
        2,
        null,
        1,
        0,
        2
      ],
      [
        null,
        3,
        2,
        null,
        2,
        null
      ],
      [
        0,
        null,
        null,
        2,
        1,
        null
      ],
      [
        null,
        2,
        1,
        null,
        3,
        2
      ],
      [
        3,
        null,
        null,
        2,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 41,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        1,
        1,
        1,
        1,
        null
      ],
      [
        2,
        2,
        null,
        null,
        null,
        3
      ],
      [
        1,
        1,
        2,
        3,
        1,
        null
      ],
      [
        3,
        null,
        null,
        null,
        null,
        1
      ],
      [
        null,
        null,
        null,
        null,
        null,
        2
      ],
      [
        2,
        2,
        3,
        null,
        null,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 42,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        0,
        2,
        null,
        null,
        1,
        null
      ],
      [
        null,
        2,
        null,
        3,
        2,
        3
      ],
      [
        null,
        1,
        null,
        2,
        2,
        1
      ],
      [
        null,
        null,
        2,
        2,
        3,
        null
      ],
      [
        3,
        null,
        null,
        1,
        null,
        null
      ],
      [
        null,
        0,
        null,
        0,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 43,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        2,
        3,
        1,
        0,
        2,
        null
      ],
      [
        null,
        3,
        null,
        1,
        null,
        null
      ],
      [
        null,
        2,
        null,
        3,
        1,
        1
      ],
      [
        null,
        2,
        null,
        null,
        null,
        1
      ],
      [
        null,
        null,
        1,
        1,
        null,
        null
      ],
      [
        null,
        3,
        2,
        2,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 44,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        3,
        2,
        null,
        1,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        0,
        3
      ],
      [
        1,
        null,
        null,
        null,
        1,
        2
      ],
      [
        1,
        null,
        2,
        null,
        null,
        2
      ],
      [
        null,
        2,
        2,
        null,
        0,
        null
      ],
      [
        1,
        0,
        0,
        null,
        2,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 45,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        0,
        null,
        null,
        3,
        null,
        null
      ],
      [
        null,
        null,
        2,
        null,
        null,
        3
      ],
      [
        0,
        1,
        3,
        1,
        1,
        2
      ],
      [
        null,
        null,
        2,
        null,
        null,
        2
      ],
      [
        null,
        2,
        2,
        null,
        null,
        null
      ],
      [
        1,
        null,
        1,
        0,
        1,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 46,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        null,
        null,
        null,
        1,
        3
      ],
      [
        1,
        1,
        1,
        0,
        null,
        null
      ],
      [
        null,
        0,
        0,
        null,
        3,
        1
      ],
      [
        1,
        0,
        1,
        null,
        null,
        2
      ],
      [
        null,
        null,
        3,
        2,
        null,
        null
      ],
      [
        3,
        null,
        null,
        1,
        1,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 47,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        1,
        null,
        2,
        2,
        null,
        null
      ],
      [
        3,
        1,
        null,
        2,
        1,
        1
      ],
      [
        2,
        null,
        1,
        null,
        1,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        1,
        3,
        1,
        1,
        null,
        3
      ],
      [
        null,
        2,
        null,
        1,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 48,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        2,
        1,
        null,
        2,
        2
      ],
      [
        2,
        0,
        1,
        3,
        null,
        null
      ],
      [
        2,
        0,
        0,
        null,
        null,
        null
      ],
      [
        null,
        null,
        0,
        null,
        null,
        1
      ],
      [
        0,
        null,
        null,
        0,
        1,
        1
      ],
      [
        null,
        null,
        1,
        null,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 49,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        2,
        3,
        null,
        3,
        null
      ],
      [
        null,
        3,
        2,
        null,
        1,
        3
      ],
      [
        2,
        null,
        1,
        null,
        null,
        null
      ],
      [
        1,
        null,
        2,
        1,
        0,
        2
      ],
      [
        0,
        null,
        null,
        null,
        null,
        2
      ],
      [
        null,
        null,
        0,
        1,
        null,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 50,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        3,
        null,
        2,
        null,
        2,
        null
      ],
      [
        null,
        1,
        2,
        null,
        3,
        2
      ],
      [
        3,
        null,
        null,
        2,
        2,
        3
      ],
      [
        2,
        1,
        null,
        null,
        null,
        null
      ],
      [
        null,
        3,
        3,
        null,
        2,
        null
      ],
      [
        null,
        1,
        null,
        1,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1,
          1,
          1
        ],
        [
          1,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 51,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        2,
        null,
        2,
        null,
        null,
        2
      ],
      [
        2,
        null,
        2,
        2,
        null,
        2
      ],
      [
        1,
        1,
        null,
        null,
        null,
        null
      ],
      [
        2,
        1,
        0,
        null,
        1,
        null
      ],
      [
        1,
        null,
        3,
        null,
        null,
        1
      ],
      [
        0,
        null,
        null,
        null,
        2,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1,
          1,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 52,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        2,
        2,
        null,
        2,
        3,
        2
      ],
      [
        null,
        null,
        null,
        null,
        null,
        2
      ],
      [
        null,
        null,
        1,
        0,
        0,
        null
      ],
      [
        3,
        2,
        null,
        null,
        0,
        null
      ],
      [
        null,
        2,
        null,
        1,
        0,
        2
      ],
      [
        0,
        0,
        null,
        null,
        3,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 53,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        0,
        0,
        null,
        2,
        null
      ],
      [
        1,
        null,
        null,
        2,
        2,
        null
      ],
      [
        null,
        2,
        1,
        null,
        null,
        0
      ],
      [
        null,
        3,
        2,
        3,
        1,
        null
      ],
      [
        null,
        1,
        null,
        2,
        null,
        null
      ],
      [
        null,
        2,
        null,
        3,
        3,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 54,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        2,
        2,
        1,
        null,
        null,
        1
      ],
      [
        null,
        null,
        null,
        3,
        null,
        null
      ],
      [
        null,
        null,
        2,
        null,
        1,
        null
      ],
      [
        2,
        2,
        3,
        null,
        1,
        2
      ],
      [
        2,
        3,
        1,
        null,
        1,
        1
      ],
      [
        null,
        3,
        2,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 55,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        2,
        0,
        2,
        2,
        null
      ],
      [
        null,
        null,
        null,
        null,
        1,
        null
      ],
      [
        1,
        1,
        3,
        null,
        2,
        null
      ],
      [
        null,
        null,
        null,
        null,
        3,
        null
      ],
      [
        2,
        2,
        3,
        1,
        null,
        1
      ],
      [
        3,
        null,
        3,
        null,
        2,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          1,
          0,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 56,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        2,
        0,
        1,
        2,
        null
      ],
      [
        null,
        2,
        null,
        null,
        2,
        3
      ],
      [
        2,
        2,
        null,
        null,
        null,
        null
      ],
      [
        1,
        2,
        null,
        0,
        0,
        2
      ],
      [
        3,
        3,
        null,
        null,
        2,
        2
      ],
      [
        null,
        null,
        2,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 57,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        1,
        null,
        3,
        3,
        null,
        null
      ],
      [
        3,
        null,
        null,
        2,
        0,
        1
      ],
      [
        null,
        null,
        null,
        null,
        1,
        1
      ],
      [
        2,
        null,
        3,
        2,
        null,
        null
      ],
      [
        2,
        null,
        2,
        2,
        null,
        2
      ],
      [
        3,
        null,
        1,
        null,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 58,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        2,
        null,
        null,
        2,
        2
      ],
      [
        null,
        null,
        null,
        1,
        null,
        1
      ],
      [
        2,
        2,
        0,
        null,
        3,
        null
      ],
      [
        1,
        3,
        2,
        null,
        null,
        null
      ],
      [
        null,
        3,
        0,
        2,
        1,
        0
      ],
      [
        null,
        2,
        null,
        null,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 59,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        null,
        null,
        null,
        2,
        0
      ],
      [
        2,
        null,
        0,
        0,
        3,
        1
      ],
      [
        1,
        3,
        null,
        1,
        null,
        0
      ],
      [
        null,
        1,
        null,
        1,
        1,
        null
      ],
      [
        1,
        null,
        1,
        2,
        1,
        null
      ],
      [
        null,
        null,
        1,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 60,
    "size": 6,
    "difficulty": "medium",
    "clues": [
      [
        null,
        1,
        null,
        null,
        1,
        0
      ],
      [
        null,
        null,
        3,
        null,
        1,
        null
      ],
      [
        2,
        null,
        1,
        null,
        1,
        3
      ],
      [
        2,
        1,
        null,
        null,
        null,
        2
      ],
      [
        null,
        1,
        null,
        1,
        null,
        null
      ],
      [
        2,
        2,
        3,
        2,
        3,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 61,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        0,
        null,
        null,
        null,
        2,
        2,
        null
      ],
      [
        3,
        1,
        1,
        null,
        null,
        2,
        2,
        3
      ],
      [
        null,
        1,
        null,
        1,
        1,
        1,
        0,
        null
      ],
      [
        null,
        3,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        1,
        null,
        null,
        null,
        null,
        1,
        0,
        3
      ],
      [
        null,
        null,
        3,
        1,
        2,
        1,
        null,
        null
      ],
      [
        null,
        2,
        null,
        1,
        2,
        null,
        null,
        0
      ],
      [
        null,
        3,
        1,
        1,
        3,
        2,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 62,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        2,
        2,
        null,
        2,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        2,
        null,
        null,
        null,
        0
      ],
      [
        1,
        2,
        1,
        1,
        2,
        null,
        3,
        null
      ],
      [
        0,
        null,
        1,
        0,
        2,
        3,
        null,
        2
      ],
      [
        1,
        null,
        1,
        null,
        1,
        2,
        null,
        2
      ],
      [
        null,
        null,
        null,
        3,
        null,
        2,
        null,
        null
      ],
      [
        null,
        3,
        1,
        1,
        null,
        1,
        null,
        3
      ],
      [
        null,
        null,
        0,
        null,
        0,
        null,
        1,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 63,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        null,
        null,
        1,
        null,
        2,
        3,
        3
      ],
      [
        3,
        1,
        null,
        2,
        null,
        0,
        2,
        null
      ],
      [
        1,
        null,
        null,
        2,
        null,
        null,
        null,
        null
      ],
      [
        null,
        2,
        null,
        null,
        3,
        2,
        null,
        1
      ],
      [
        null,
        1,
        null,
        null,
        null,
        1,
        2,
        null
      ],
      [
        2,
        null,
        1,
        1,
        null,
        1,
        null,
        2
      ],
      [
        3,
        null,
        null,
        null,
        3,
        2,
        null,
        2
      ],
      [
        2,
        null,
        1,
        null,
        0,
        2,
        3,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 64,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        2,
        null,
        2,
        null,
        null,
        null,
        1
      ],
      [
        null,
        2,
        1,
        2,
        null,
        1,
        null,
        1
      ],
      [
        3,
        null,
        null,
        null,
        null,
        1,
        2,
        3
      ],
      [
        null,
        2,
        3,
        null,
        2,
        2,
        1,
        1
      ],
      [
        null,
        0,
        null,
        null,
        null,
        null,
        null,
        0
      ],
      [
        null,
        1,
        3,
        1,
        2,
        null,
        null,
        null
      ],
      [
        2,
        null,
        2,
        2,
        null,
        3,
        2,
        null
      ],
      [
        0,
        1,
        1,
        null,
        null,
        null,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 65,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        1,
        null,
        3,
        null,
        null,
        1,
        2,
        null
      ],
      [
        2,
        null,
        null,
        1,
        2,
        3,
        null,
        2
      ],
      [
        3,
        1,
        null,
        null,
        null,
        null,
        1,
        null
      ],
      [
        null,
        3,
        null,
        2,
        null,
        null,
        1,
        null
      ],
      [
        null,
        2,
        null,
        null,
        2,
        1,
        3,
        null
      ],
      [
        null,
        3,
        3,
        2,
        3,
        null,
        2,
        null
      ],
      [
        0,
        1,
        null,
        3,
        null,
        1,
        0,
        null
      ],
      [
        0,
        0,
        null,
        null,
        0,
        null,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 66,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        null,
        1,
        null,
        null,
        2,
        2,
        1
      ],
      [
        2,
        null,
        2,
        1,
        1,
        null,
        2,
        3
      ],
      [
        1,
        0,
        2,
        3,
        2,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        1,
        null,
        null,
        null,
        null
      ],
      [
        null,
        2,
        null,
        1,
        null,
        2,
        1,
        2
      ],
      [
        null,
        1,
        3,
        1,
        1,
        1,
        null,
        2
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        2
      ],
      [
        null,
        0,
        2,
        2,
        null,
        null,
        2,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 67,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        null,
        3,
        null,
        2,
        null,
        2,
        3
      ],
      [
        null,
        null,
        0,
        null,
        1,
        2,
        null,
        2
      ],
      [
        0,
        null,
        1,
        0,
        null,
        null,
        null,
        2
      ],
      [
        0,
        1,
        2,
        0,
        null,
        null,
        0,
        null
      ],
      [
        0,
        1,
        null,
        1,
        null,
        1,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        2,
        2,
        2
      ],
      [
        2,
        1,
        1,
        null,
        null,
        3,
        null,
        2
      ],
      [
        null,
        1,
        1,
        1,
        null,
        null,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          1,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 68,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        3,
        1,
        null,
        1,
        0,
        null,
        null,
        null
      ],
      [
        3,
        1,
        null,
        2,
        null,
        1,
        3,
        null
      ],
      [
        3,
        null,
        null,
        2,
        null,
        null,
        null,
        3
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        1,
        3,
        3,
        1,
        1,
        3,
        null,
        2
      ],
      [
        null,
        null,
        null,
        1,
        1,
        2,
        null,
        1
      ],
      [
        null,
        1,
        null,
        null,
        1,
        null,
        2,
        2
      ],
      [
        null,
        2,
        1,
        3,
        1,
        0,
        null,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 69,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        0,
        1,
        3,
        1,
        3,
        1,
        null,
        null
      ],
      [
        null,
        0,
        null,
        2,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        1,
        1,
        null,
        null,
        0
      ],
      [
        0,
        null,
        2,
        3,
        null,
        1,
        null,
        null
      ],
      [
        1,
        2,
        null,
        1,
        0,
        1,
        2,
        null
      ],
      [
        null,
        null,
        1,
        null,
        null,
        1,
        3,
        null
      ],
      [
        1,
        3,
        2,
        null,
        null,
        null,
        null,
        null
      ],
      [
        0,
        1,
        null,
        0,
        0,
        2,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 70,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        1,
        0,
        null,
        null,
        1,
        null,
        null
      ],
      [
        null,
        null,
        2,
        null,
        null,
        2,
        2,
        0
      ],
      [
        null,
        2,
        null,
        null,
        1,
        null,
        1,
        0
      ],
      [
        3,
        null,
        2,
        null,
        null,
        null,
        3,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        2,
        1,
        null
      ],
      [
        2,
        null,
        1,
        2,
        2,
        2,
        null,
        null
      ],
      [
        2,
        0,
        2,
        2,
        3,
        2,
        2,
        null
      ],
      [
        2,
        2,
        null,
        null,
        1,
        null,
        2,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 71,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        0,
        0,
        0,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        0,
        0,
        null,
        null,
        2,
        2
      ],
      [
        null,
        0,
        null,
        1,
        3,
        3,
        1,
        1
      ],
      [
        3,
        2,
        0,
        null,
        1,
        2,
        null,
        null
      ],
      [
        2,
        2,
        3,
        2,
        1,
        null,
        null,
        null
      ],
      [
        null,
        2,
        null,
        null,
        null,
        1,
        1,
        3
      ],
      [
        null,
        2,
        1,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        2,
        0,
        1,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 72,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        0,
        null,
        2,
        null,
        null,
        0,
        0,
        null
      ],
      [
        2,
        2,
        1,
        0,
        3,
        null,
        null,
        null
      ],
      [
        null,
        null,
        0,
        1,
        null,
        null,
        3,
        null
      ],
      [
        null,
        2,
        null,
        null,
        null,
        null,
        1,
        null
      ],
      [
        0,
        2,
        1,
        null,
        1,
        null,
        0,
        3
      ],
      [
        null,
        null,
        1,
        null,
        1,
        3,
        null,
        null
      ],
      [
        2,
        2,
        3,
        null,
        2,
        2,
        3,
        1
      ],
      [
        null,
        2,
        0,
        null,
        null,
        null,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 73,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        0,
        1,
        1,
        1,
        2,
        null,
        null
      ],
      [
        0,
        null,
        3,
        null,
        1,
        null,
        1,
        3
      ],
      [
        0,
        null,
        null,
        2,
        2,
        null,
        null,
        null
      ],
      [
        2,
        null,
        2,
        1,
        1,
        null,
        null,
        1
      ],
      [
        null,
        0,
        null,
        null,
        2,
        null,
        null,
        0
      ],
      [
        2,
        0,
        null,
        1,
        null,
        null,
        1,
        null
      ],
      [
        3,
        2,
        3,
        2,
        null,
        null,
        1,
        null
      ],
      [
        null,
        null,
        2,
        2,
        null,
        null,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 74,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        2,
        0,
        null,
        null,
        3,
        null,
        null
      ],
      [
        null,
        2,
        1,
        1,
        2,
        null,
        1,
        null
      ],
      [
        null,
        null,
        1,
        1,
        2,
        null,
        1,
        null
      ],
      [
        1,
        null,
        null,
        null,
        1,
        null,
        2,
        null
      ],
      [
        null,
        1,
        null,
        2,
        null,
        null,
        null,
        1
      ],
      [
        3,
        2,
        null,
        3,
        1,
        null,
        1,
        2
      ],
      [
        null,
        0,
        1,
        3,
        1,
        null,
        1,
        null
      ],
      [
        0,
        0,
        null,
        null,
        null,
        null,
        3,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 75,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        3,
        null,
        null,
        2,
        2,
        2,
        2,
        3
      ],
      [
        2,
        2,
        null,
        null,
        2,
        null,
        null,
        2
      ],
      [
        0,
        null,
        null,
        1,
        null,
        2,
        null,
        null
      ],
      [
        0,
        null,
        0,
        null,
        null,
        0,
        null,
        1
      ],
      [
        null,
        1,
        null,
        null,
        null,
        1,
        null,
        null
      ],
      [
        2,
        3,
        3,
        null,
        1,
        0,
        1,
        1
      ],
      [
        2,
        null,
        null,
        1,
        null,
        1,
        null,
        1
      ],
      [
        2,
        1,
        null,
        null,
        null,
        1,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 76,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        3,
        null,
        null,
        1,
        0,
        null,
        null,
        0
      ],
      [
        null,
        1,
        null,
        null,
        1,
        0,
        null,
        null
      ],
      [
        1,
        0,
        1,
        3,
        null,
        null,
        0,
        0
      ],
      [
        null,
        null,
        null,
        null,
        2,
        1,
        null,
        null
      ],
      [
        null,
        2,
        null,
        null,
        1,
        2,
        1,
        0
      ],
      [
        null,
        2,
        3,
        null,
        null,
        1,
        2,
        2
      ],
      [
        null,
        null,
        1,
        2,
        1,
        null,
        1,
        2
      ],
      [
        0,
        null,
        1,
        null,
        2,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 77,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        3,
        2,
        null,
        null,
        3,
        null,
        null,
        1
      ],
      [
        2,
        null,
        2,
        1,
        null,
        2,
        null,
        3
      ],
      [
        3,
        null,
        2,
        null,
        1,
        0,
        null,
        null
      ],
      [
        null,
        0,
        null,
        2,
        null,
        null,
        null,
        1
      ],
      [
        null,
        0,
        1,
        3,
        null,
        2,
        0,
        null
      ],
      [
        2,
        null,
        null,
        null,
        null,
        1,
        0,
        0
      ],
      [
        3,
        1,
        0,
        2,
        null,
        null,
        null,
        null
      ],
      [
        3,
        null,
        2,
        2,
        1,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 78,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        0,
        null,
        1,
        null,
        2,
        null,
        null,
        3
      ],
      [
        null,
        null,
        null,
        1,
        2,
        2,
        2,
        null
      ],
      [
        2,
        2,
        1,
        null,
        null,
        null,
        3,
        null
      ],
      [
        null,
        1,
        null,
        2,
        null,
        null,
        null,
        1
      ],
      [
        2,
        null,
        null,
        1,
        null,
        1,
        3,
        null
      ],
      [
        1,
        1,
        1,
        2,
        0,
        0,
        1,
        2
      ],
      [
        null,
        0,
        0,
        2,
        2,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        1,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 79,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        0,
        1,
        null,
        0,
        null,
        null,
        null,
        3
      ],
      [
        null,
        null,
        2,
        2,
        null,
        1,
        1,
        3
      ],
      [
        2,
        0,
        1,
        2,
        null,
        0,
        null,
        null
      ],
      [
        null,
        null,
        null,
        2,
        null,
        2,
        null,
        null
      ],
      [
        null,
        2,
        1,
        2,
        null,
        null,
        null,
        3
      ],
      [
        null,
        null,
        2,
        3,
        null,
        null,
        2,
        null
      ],
      [
        0,
        null,
        null,
        2,
        null,
        1,
        3,
        1
      ],
      [
        1,
        null,
        null,
        2,
        null,
        1,
        2,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 80,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        3,
        null,
        2,
        null,
        1,
        null,
        3,
        1
      ],
      [
        null,
        2,
        2,
        null,
        null,
        null,
        2,
        null
      ],
      [
        null,
        3,
        2,
        2,
        null,
        2,
        null,
        2
      ],
      [
        2,
        1,
        1,
        2,
        null,
        null,
        null,
        3
      ],
      [
        null,
        1,
        1,
        null,
        null,
        1,
        1,
        2
      ],
      [
        null,
        1,
        2,
        null,
        1,
        0,
        null,
        2
      ],
      [
        1,
        null,
        null,
        2,
        1,
        null,
        null,
        null
      ],
      [
        0,
        null,
        null,
        2,
        1,
        2,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          1,
          1,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          1,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 81,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        1,
        null,
        1,
        null,
        2,
        2,
        null
      ],
      [
        2,
        null,
        3,
        null,
        null,
        null,
        null,
        2
      ],
      [
        null,
        null,
        0,
        null,
        1,
        null,
        3,
        2
      ],
      [
        2,
        null,
        null,
        3,
        1,
        1,
        null,
        3
      ],
      [
        2,
        null,
        1,
        null,
        1,
        0,
        null,
        1
      ],
      [
        3,
        null,
        2,
        null,
        null,
        1,
        null,
        null
      ],
      [
        2,
        null,
        0,
        1,
        null,
        null,
        3,
        3
      ],
      [
        null,
        null,
        1,
        2,
        3,
        null,
        null,
        2
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 82,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        2,
        3,
        null,
        2,
        3,
        null,
        3,
        null
      ],
      [
        3,
        null,
        null,
        null,
        null,
        1,
        1,
        null
      ],
      [
        null,
        2,
        null,
        0,
        null,
        null,
        2,
        null
      ],
      [
        null,
        1,
        2,
        null,
        null,
        1,
        2,
        1
      ],
      [
        1,
        1,
        3,
        null,
        null,
        null,
        null,
        null
      ],
      [
        2,
        null,
        1,
        0,
        0,
        2,
        null,
        3
      ],
      [
        null,
        0,
        0,
        null,
        null,
        null,
        null,
        null
      ],
      [
        2,
        1,
        null,
        1,
        2,
        2,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          1,
          1,
          0,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 83,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        null,
        3,
        null,
        null,
        2,
        0,
        0
      ],
      [
        null,
        0,
        null,
        null,
        null,
        2,
        null,
        null
      ],
      [
        0,
        null,
        2,
        1,
        null,
        null,
        3,
        null
      ],
      [
        null,
        2,
        2,
        null,
        2,
        2,
        1,
        1
      ],
      [
        1,
        null,
        null,
        null,
        1,
        2,
        null,
        null
      ],
      [
        null,
        null,
        1,
        0,
        null,
        0,
        2,
        null
      ],
      [
        null,
        2,
        null,
        2,
        1,
        null,
        3,
        null
      ],
      [
        null,
        1,
        0,
        null,
        1,
        1,
        0,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 84,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        2,
        3,
        1,
        null,
        null,
        null,
        null
      ],
      [
        2,
        null,
        3,
        null,
        null,
        3,
        null,
        1
      ],
      [
        2,
        null,
        1,
        null,
        null,
        1,
        null,
        null
      ],
      [
        null,
        null,
        1,
        0,
        1,
        1,
        1,
        null
      ],
      [
        3,
        null,
        3,
        1,
        null,
        2,
        null,
        null
      ],
      [
        2,
        null,
        null,
        2,
        null,
        2,
        null,
        2
      ],
      [
        null,
        2,
        1,
        null,
        1,
        null,
        null,
        3
      ],
      [
        null,
        1,
        1,
        3,
        2,
        null,
        1,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 85,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        null,
        3,
        2,
        2,
        3,
        null,
        0
      ],
      [
        2,
        null,
        2,
        2,
        null,
        null,
        2,
        1
      ],
      [
        null,
        2,
        2,
        null,
        2,
        3,
        3,
        null
      ],
      [
        null,
        null,
        1,
        null,
        null,
        null,
        1,
        null
      ],
      [
        null,
        null,
        2,
        2,
        null,
        null,
        null,
        3
      ],
      [
        2,
        null,
        null,
        2,
        null,
        null,
        1,
        null
      ],
      [
        2,
        1,
        3,
        null,
        3,
        null,
        1,
        null
      ],
      [
        null,
        1,
        2,
        null,
        2,
        null,
        1,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 86,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        1,
        null,
        2,
        1,
        null,
        null,
        null,
        null
      ],
      [
        1,
        null,
        2,
        2,
        3,
        null,
        0,
        null
      ],
      [
        2,
        1,
        2,
        null,
        1,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        1,
        null,
        null,
        0
      ],
      [
        1,
        1,
        null,
        2,
        null,
        1,
        1,
        null
      ],
      [
        3,
        null,
        null,
        2,
        1,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        1,
        null,
        0,
        null,
        3
      ],
      [
        0,
        0,
        0,
        1,
        2,
        2,
        2,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 87,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        null,
        2,
        3,
        2,
        null,
        3,
        2
      ],
      [
        null,
        null,
        3,
        0,
        2,
        null,
        2,
        null
      ],
      [
        null,
        1,
        null,
        1,
        0,
        null,
        null,
        null
      ],
      [
        3,
        null,
        null,
        1,
        1,
        1,
        null,
        1
      ],
      [
        null,
        null,
        1,
        null,
        1,
        1,
        null,
        2
      ],
      [
        null,
        null,
        0,
        null,
        null,
        null,
        1,
        null
      ],
      [
        1,
        1,
        0,
        null,
        2,
        3,
        null,
        null
      ],
      [
        null,
        3,
        2,
        null,
        null,
        1,
        0,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 88,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        0,
        0,
        null,
        3,
        3,
        3,
        2,
        null
      ],
      [
        1,
        null,
        2,
        null,
        null,
        null,
        1,
        3
      ],
      [
        null,
        3,
        1,
        2,
        null,
        2,
        null,
        3
      ],
      [
        null,
        null,
        null,
        3,
        1,
        2,
        null,
        null
      ],
      [
        1,
        null,
        null,
        null,
        null,
        null,
        null,
        3
      ],
      [
        0,
        2,
        null,
        0,
        1,
        2,
        1,
        3
      ],
      [
        null,
        null,
        1,
        null,
        2,
        2,
        null,
        null
      ],
      [
        null,
        1,
        null,
        null,
        2,
        null,
        3,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 89,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        null,
        2,
        1,
        3,
        null,
        3,
        1
      ],
      [
        2,
        2,
        0,
        1,
        null,
        null,
        null,
        null
      ],
      [
        1,
        null,
        null,
        null,
        null,
        null,
        0,
        2
      ],
      [
        0,
        0,
        3,
        null,
        0,
        1,
        null,
        null
      ],
      [
        1,
        null,
        2,
        null,
        null,
        null,
        2,
        null
      ],
      [
        2,
        null,
        null,
        3,
        1,
        null,
        1,
        2
      ],
      [
        null,
        2,
        1,
        null,
        1,
        null,
        1,
        2
      ],
      [
        null,
        0,
        null,
        1,
        2,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          1,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 90,
    "size": 8,
    "difficulty": "hard",
    "clues": [
      [
        null,
        1,
        null,
        null,
        null,
        null,
        2,
        null
      ],
      [
        3,
        2,
        2,
        1,
        1,
        null,
        1,
        2
      ],
      [
        null,
        2,
        2,
        1,
        3,
        null,
        null,
        null
      ],
      [
        2,
        null,
        null,
        null,
        null,
        null,
        3,
        3
      ],
      [
        2,
        1,
        null,
        null,
        0,
        0,
        null,
        2
      ],
      [
        null,
        null,
        null,
        2,
        1,
        1,
        null,
        null
      ],
      [
        1,
        null,
        0,
        null,
        null,
        1,
        null,
        null
      ],
      [
        0,
        0,
        null,
        3,
        null,
        1,
        2,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 91,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        3,
        null,
        1,
        1,
        3,
        null,
        0,
        null,
        null,
        null
      ],
      [
        2,
        2,
        2,
        2,
        null,
        null,
        null,
        2,
        3,
        1
      ],
      [
        null,
        null,
        null,
        null,
        null,
        2,
        null,
        2,
        3,
        1
      ],
      [
        null,
        3,
        1,
        null,
        null,
        1,
        1,
        null,
        null,
        null
      ],
      [
        1,
        3,
        1,
        null,
        0,
        null,
        0,
        null,
        2,
        1
      ],
      [
        0,
        null,
        1,
        null,
        null,
        null,
        1,
        2,
        null,
        null
      ],
      [
        null,
        3,
        2,
        null,
        null,
        1,
        null,
        null,
        1,
        null
      ],
      [
        1,
        null,
        1,
        null,
        1,
        1,
        null,
        null,
        null,
        null
      ],
      [
        0,
        2,
        null,
        3,
        null,
        null,
        null,
        3,
        null,
        1
      ],
      [
        null,
        null,
        3,
        1,
        null,
        null,
        2,
        null,
        null,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          1,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 92,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        null,
        3,
        1,
        null,
        2,
        null,
        null,
        0,
        0
      ],
      [
        0,
        null,
        2,
        1,
        0,
        2,
        2,
        0,
        0,
        0
      ],
      [
        0,
        null,
        null,
        null,
        1,
        null,
        null,
        1,
        null,
        1
      ],
      [
        null,
        0,
        null,
        null,
        null,
        null,
        null,
        2,
        null,
        2
      ],
      [
        0,
        null,
        0,
        0,
        null,
        null,
        null,
        null,
        0,
        null
      ],
      [
        0,
        null,
        0,
        null,
        null,
        null,
        null,
        3,
        null,
        null
      ],
      [
        0,
        0,
        null,
        3,
        1,
        3,
        null,
        null,
        1,
        0
      ],
      [
        0,
        0,
        null,
        2,
        2,
        null,
        2,
        null,
        null,
        null
      ],
      [
        0,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        3,
        null
      ],
      [
        null,
        0,
        0,
        0,
        1,
        null,
        0,
        1,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 93,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        3,
        2,
        null,
        3,
        null,
        null,
        1,
        null,
        null
      ],
      [
        null,
        null,
        2,
        null,
        null,
        0,
        null,
        null,
        null,
        2
      ],
      [
        null,
        0,
        null,
        2,
        1,
        null,
        null,
        null,
        1,
        2
      ],
      [
        null,
        0,
        1,
        2,
        null,
        null,
        1,
        2,
        1,
        3
      ],
      [
        0,
        0,
        null,
        2,
        1,
        1,
        null,
        null,
        1,
        null
      ],
      [
        null,
        1,
        null,
        null,
        1,
        null,
        2,
        null,
        2,
        null
      ],
      [
        1,
        3,
        1,
        null,
        1,
        null,
        2,
        1,
        1,
        null
      ],
      [
        null,
        null,
        null,
        0,
        null,
        null,
        null,
        2,
        null,
        2
      ],
      [
        null,
        3,
        null,
        null,
        null,
        2,
        3,
        null,
        1,
        1
      ],
      [
        null,
        null,
        2,
        3,
        null,
        null,
        1,
        null,
        0,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 94,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        null,
        null,
        null,
        null,
        null,
        0,
        0,
        null,
        0
      ],
      [
        null,
        0,
        0,
        0,
        null,
        1,
        0,
        null,
        null,
        0
      ],
      [
        0,
        0,
        null,
        0,
        null,
        null,
        2,
        null,
        2,
        null
      ],
      [
        0,
        0,
        0,
        null,
        3,
        null,
        null,
        null,
        3,
        1
      ],
      [
        null,
        null,
        0,
        null,
        2,
        1,
        null,
        null,
        2,
        0
      ],
      [
        null,
        null,
        null,
        1,
        null,
        null,
        3,
        null,
        null,
        null
      ],
      [
        1,
        2,
        1,
        null,
        null,
        null,
        2,
        1,
        2,
        null
      ],
      [
        3,
        null,
        3,
        null,
        1,
        null,
        2,
        null,
        2,
        null
      ],
      [
        null,
        null,
        1,
        null,
        0,
        null,
        1,
        null,
        1,
        null
      ],
      [
        0,
        null,
        null,
        0,
        null,
        0,
        null,
        null,
        0,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0,
          1,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 95,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        1,
        0,
        null,
        0,
        0,
        0,
        null,
        null,
        null,
        3
      ],
      [
        null,
        2,
        null,
        null,
        1,
        0,
        null,
        0,
        1,
        2
      ],
      [
        2,
        1,
        2,
        null,
        null,
        2,
        null,
        0,
        null,
        null
      ],
      [
        null,
        1,
        null,
        1,
        0,
        null,
        1,
        null,
        3,
        null
      ],
      [
        null,
        3,
        null,
        null,
        1,
        null,
        2,
        null,
        3,
        null
      ],
      [
        null,
        1,
        2,
        null,
        null,
        1,
        null,
        1,
        null,
        null
      ],
      [
        null,
        null,
        null,
        1,
        null,
        3,
        3,
        null,
        1,
        null
      ],
      [
        0,
        null,
        null,
        2,
        1,
        null,
        null,
        null,
        1,
        1
      ],
      [
        0,
        null,
        null,
        3,
        null,
        null,
        null,
        null,
        0,
        0
      ],
      [
        null,
        0,
        null,
        null,
        0,
        0,
        null,
        0,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 96,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        null,
        null,
        null,
        0,
        0,
        null,
        null,
        0,
        null
      ],
      [
        null,
        0,
        0,
        null,
        null,
        0,
        0,
        0,
        0,
        null
      ],
      [
        null,
        0,
        null,
        1,
        0,
        0,
        null,
        0,
        0,
        0
      ],
      [
        0,
        null,
        2,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        2,
        null,
        1,
        0,
        null,
        2,
        2,
        null,
        1,
        null
      ],
      [
        null,
        0,
        null,
        null,
        0,
        null,
        1,
        0,
        2,
        2
      ],
      [
        null,
        0,
        null,
        null,
        null,
        0,
        0,
        2,
        null,
        0
      ],
      [
        3,
        null,
        null,
        2,
        2,
        null,
        null,
        null,
        null,
        0
      ],
      [
        null,
        null,
        2,
        null,
        null,
        null,
        3,
        null,
        null,
        0
      ],
      [
        null,
        2,
        3,
        null,
        3,
        null,
        null,
        0,
        0,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 97,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        0,
        1,
        null,
        null,
        3,
        null,
        0,
        null,
        null
      ],
      [
        0,
        null,
        null,
        null,
        3,
        1,
        0,
        null,
        null,
        0
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        2,
        null
      ],
      [
        0,
        1,
        2,
        1,
        null,
        2,
        2,
        null,
        2,
        3
      ],
      [
        null,
        2,
        null,
        3,
        null,
        null,
        2,
        null,
        1,
        1
      ],
      [
        null,
        null,
        null,
        1,
        null,
        1,
        2,
        1,
        0,
        null
      ],
      [
        null,
        3,
        1,
        0,
        0,
        null,
        null,
        0,
        0,
        null
      ],
      [
        1,
        null,
        1,
        null,
        1,
        1,
        2,
        null,
        0,
        null
      ],
      [
        null,
        null,
        1,
        null,
        null,
        null,
        2,
        null,
        null,
        null
      ],
      [
        0,
        1,
        1,
        null,
        1,
        2,
        2,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 98,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        null,
        0,
        null,
        0,
        0,
        null,
        0,
        0,
        null
      ],
      [
        3,
        2,
        1,
        null,
        null,
        0,
        null,
        0,
        null,
        0
      ],
      [
        2,
        1,
        null,
        1,
        0,
        null,
        0,
        0,
        null,
        0
      ],
      [
        null,
        null,
        1,
        null,
        2,
        null,
        null,
        null,
        null,
        0
      ],
      [
        3,
        1,
        0,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        3,
        2,
        null,
        0,
        3,
        1,
        null
      ],
      [
        null,
        null,
        3,
        null,
        3,
        null,
        1,
        null,
        0,
        0
      ],
      [
        null,
        null,
        null,
        2,
        2,
        null,
        1,
        null,
        null,
        0
      ],
      [
        null,
        null,
        null,
        null,
        2,
        null,
        3,
        null,
        0,
        0
      ],
      [
        0,
        0,
        0,
        null,
        1,
        null,
        null,
        0,
        0,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 99,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        0,
        null,
        0,
        null,
        null,
        null,
        2,
        null,
        3
      ],
      [
        null,
        null,
        null,
        null,
        2,
        2,
        0,
        1,
        null,
        null
      ],
      [
        null,
        null,
        1,
        2,
        2,
        null,
        null,
        2,
        2,
        null
      ],
      [
        1,
        3,
        null,
        null,
        1,
        0,
        null,
        null,
        null,
        null
      ],
      [
        null,
        2,
        1,
        null,
        3,
        null,
        3,
        2,
        2,
        2
      ],
      [
        null,
        null,
        3,
        null,
        null,
        0,
        null,
        null,
        1,
        3
      ],
      [
        2,
        1,
        2,
        1,
        null,
        1,
        null,
        null,
        3,
        null
      ],
      [
        2,
        1,
        null,
        null,
        null,
        2,
        0,
        1,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        1,
        2,
        null,
        2,
        null,
        0
      ],
      [
        3,
        null,
        null,
        null,
        1,
        1,
        null,
        null,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 100,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        null,
        0,
        0,
        0,
        null,
        null,
        null,
        0,
        null
      ],
      [
        0,
        0,
        0,
        null,
        null,
        1,
        0,
        null,
        0,
        null
      ],
      [
        null,
        0,
        null,
        0,
        2,
        null,
        1,
        null,
        null,
        0
      ],
      [
        0,
        0,
        0,
        null,
        null,
        null,
        1,
        null,
        0,
        null
      ],
      [
        0,
        null,
        null,
        2,
        null,
        null,
        null,
        3,
        2,
        null
      ],
      [
        null,
        null,
        null,
        0,
        null,
        3,
        null,
        1,
        null,
        2
      ],
      [
        null,
        3,
        null,
        null,
        null,
        null,
        null,
        0,
        0,
        1
      ],
      [
        null,
        null,
        2,
        2,
        1,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        0,
        null,
        2,
        null,
        3,
        null,
        null,
        2,
        2
      ],
      [
        0,
        0,
        0,
        0,
        1,
        null,
        0,
        null,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 101,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        null,
        null,
        0,
        null,
        1,
        2,
        null,
        null,
        1
      ],
      [
        1,
        2,
        null,
        null,
        null,
        1,
        null,
        null,
        3,
        null
      ],
      [
        1,
        null,
        null,
        2,
        null,
        1,
        null,
        1,
        2,
        2
      ],
      [
        null,
        null,
        null,
        null,
        1,
        null,
        3,
        null,
        2,
        null
      ],
      [
        null,
        null,
        2,
        3,
        null,
        null,
        2,
        3,
        3,
        null
      ],
      [
        null,
        2,
        2,
        2,
        null,
        1,
        0,
        null,
        null,
        2
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        2,
        null,
        null,
        2
      ],
      [
        0,
        0,
        1,
        null,
        2,
        2,
        1,
        2,
        2,
        2
      ],
      [
        null,
        0,
        1,
        null,
        null,
        2,
        3,
        2,
        null,
        null
      ],
      [
        null,
        null,
        0,
        null,
        3,
        null,
        null,
        null,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 102,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        1,
        1,
        1,
        null,
        2,
        2,
        null,
        null,
        2,
        null
      ],
      [
        null,
        1,
        null,
        2,
        null,
        1,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        0,
        null,
        null,
        null,
        0,
        1,
        1
      ],
      [
        2,
        null,
        0,
        1,
        2,
        1,
        null,
        2,
        null,
        0
      ],
      [
        2,
        2,
        2,
        null,
        1,
        null,
        null,
        1,
        null,
        1
      ],
      [
        null,
        2,
        null,
        1,
        null,
        3,
        2,
        null,
        3,
        null
      ],
      [
        null,
        1,
        2,
        null,
        2,
        null,
        null,
        null,
        1,
        null
      ],
      [
        3,
        null,
        null,
        2,
        null,
        3,
        null,
        null,
        0,
        null
      ],
      [
        null,
        1,
        null,
        null,
        null,
        2,
        3,
        null,
        null,
        1
      ],
      [
        0,
        0,
        0,
        null,
        null,
        null,
        null,
        null,
        2,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0
        ],
        [
          1,
          1,
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ]
      ]
    }
  },
  {
    "id": 103,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        3,
        3,
        1,
        null,
        null,
        3,
        null,
        1,
        null
      ],
      [
        1,
        2,
        null,
        null,
        1,
        null,
        null,
        1,
        null,
        0
      ],
      [
        3,
        null,
        null,
        2,
        1,
        2,
        null,
        null,
        2,
        1
      ],
      [
        1,
        null,
        null,
        2,
        1,
        2,
        3,
        null,
        null,
        null
      ],
      [
        null,
        1,
        1,
        null,
        null,
        null,
        null,
        null,
        null,
        3
      ],
      [
        null,
        2,
        3,
        null,
        null,
        0,
        null,
        null,
        1,
        1
      ],
      [
        3,
        null,
        null,
        null,
        3,
        null,
        3,
        null,
        null,
        null
      ],
      [
        3,
        1,
        3,
        2,
        2,
        2,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        1,
        null,
        2,
        null,
        null,
        1
      ],
      [
        null,
        1,
        null,
        2,
        3,
        2,
        2,
        2,
        null,
        3
      ]
    ],
    "solution": {
      "hEdges": [
        [
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          1,
          1,
          1,
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 104,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        0,
        1,
        3,
        3,
        3,
        2,
        null,
        null,
        null
      ],
      [
        null,
        0,
        null,
        null,
        1,
        1,
        3,
        null,
        0,
        null
      ],
      [
        0,
        null,
        2,
        null,
        1,
        3,
        2,
        null,
        null,
        0
      ],
      [
        null,
        null,
        2,
        null,
        1,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        2,
        null,
        null,
        1,
        2,
        2
      ],
      [
        0,
        1,
        2,
        2,
        null,
        null,
        0,
        0,
        null,
        null
      ],
      [
        0,
        null,
        1,
        null,
        0,
        2,
        null,
        1,
        null,
        2
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        1,
        null
      ],
      [
        null,
        null,
        0,
        0,
        0,
        null,
        2,
        0,
        1,
        2
      ],
      [
        null,
        null,
        0,
        null,
        0,
        null,
        2,
        3,
        2,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 105,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        null,
        0,
        null,
        1,
        null,
        null,
        0,
        0,
        null
      ],
      [
        3,
        2,
        2,
        null,
        null,
        null,
        2,
        2,
        null,
        null
      ],
      [
        null,
        null,
        2,
        1,
        1,
        2,
        null,
        null,
        3,
        2
      ],
      [
        2,
        2,
        null,
        2,
        null,
        1,
        null,
        1,
        null,
        1
      ],
      [
        null,
        null,
        null,
        0,
        null,
        2,
        2,
        null,
        null,
        2
      ],
      [
        2,
        2,
        0,
        null,
        null,
        null,
        2,
        null,
        null,
        null
      ],
      [
        null,
        null,
        1,
        null,
        0,
        2,
        null,
        null,
        2,
        1
      ],
      [
        null,
        null,
        0,
        1,
        null,
        1,
        null,
        null,
        null,
        0
      ],
      [
        1,
        2,
        2,
        null,
        null,
        null,
        null,
        null,
        0,
        null
      ],
      [
        null,
        null,
        1,
        null,
        0,
        1,
        1,
        0,
        0,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 106,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        null,
        null,
        null,
        0,
        null,
        null,
        0,
        null,
        0
      ],
      [
        0,
        null,
        0,
        0,
        null,
        null,
        1,
        1,
        null,
        null
      ],
      [
        null,
        1,
        null,
        null,
        null,
        2,
        3,
        3,
        1,
        0
      ],
      [
        null,
        3,
        null,
        1,
        null,
        1,
        2,
        2,
        null,
        null
      ],
      [
        1,
        null,
        2,
        3,
        2,
        1,
        null,
        null,
        0,
        null
      ],
      [
        2,
        null,
        null,
        1,
        null,
        null,
        null,
        0,
        1,
        1
      ],
      [
        null,
        null,
        0,
        0,
        null,
        0,
        2,
        null,
        null,
        null
      ],
      [
        2,
        null,
        null,
        1,
        null,
        1,
        1,
        null,
        null,
        null
      ],
      [
        null,
        1,
        null,
        null,
        2,
        2,
        2,
        1,
        null,
        1
      ],
      [
        1,
        null,
        0,
        null,
        1,
        null,
        null,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          1
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 107,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        null,
        0,
        0,
        1,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        0,
        null,
        null,
        3,
        1,
        null,
        0
      ],
      [
        null,
        0,
        0,
        1,
        2,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        0,
        null,
        null,
        1,
        null,
        1,
        0,
        0,
        null
      ],
      [
        null,
        null,
        0,
        2,
        2,
        3,
        null,
        0,
        null,
        null
      ],
      [
        3,
        null,
        2,
        null,
        1,
        null,
        null,
        null,
        0,
        0
      ],
      [
        2,
        2,
        null,
        null,
        null,
        0,
        1,
        2,
        null,
        null
      ],
      [
        null,
        null,
        2,
        null,
        1,
        1,
        0,
        2,
        2,
        null
      ],
      [
        null,
        null,
        2,
        2,
        3,
        3,
        1,
        null,
        null,
        1
      ],
      [
        3,
        null,
        1,
        null,
        1,
        null,
        null,
        2,
        1,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 108,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        0,
        null,
        null,
        null,
        0,
        null,
        0,
        0,
        0
      ],
      [
        1,
        0,
        null,
        null,
        null,
        null,
        null,
        0,
        0,
        0
      ],
      [
        3,
        null,
        null,
        null,
        3,
        null,
        null,
        1,
        null,
        null
      ],
      [
        2,
        null,
        3,
        null,
        null,
        2,
        2,
        null,
        null,
        0
      ],
      [
        null,
        1,
        1,
        null,
        null,
        1,
        2,
        null,
        null,
        0
      ],
      [
        2,
        null,
        null,
        null,
        0,
        null,
        null,
        1,
        2,
        2
      ],
      [
        0,
        null,
        null,
        0,
        null,
        3,
        null,
        null,
        null,
        null
      ],
      [
        0,
        2,
        null,
        null,
        1,
        2,
        null,
        null,
        null,
        null
      ],
      [
        1,
        null,
        2,
        3,
        3,
        null,
        1,
        2,
        null,
        2
      ],
      [
        null,
        1,
        1,
        0,
        null,
        null,
        null,
        null,
        2,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ]
      ]
    }
  },
  {
    "id": 109,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        2,
        3,
        null,
        null,
        null,
        1,
        3,
        3,
        3
      ],
      [
        null,
        2,
        2,
        null,
        1,
        null,
        null,
        1,
        null,
        null
      ],
      [
        1,
        null,
        null,
        1,
        2,
        null,
        3,
        2,
        3,
        null
      ],
      [
        1,
        null,
        null,
        2,
        null,
        null,
        2,
        null,
        null,
        2
      ],
      [
        null,
        null,
        null,
        3,
        null,
        null,
        null,
        2,
        1,
        1
      ],
      [
        null,
        1,
        null,
        null,
        0,
        1,
        3,
        null,
        1,
        null
      ],
      [
        null,
        3,
        null,
        1,
        0,
        null,
        null,
        null,
        3,
        2
      ],
      [
        3,
        null,
        null,
        null,
        2,
        null,
        3,
        null,
        null,
        null
      ],
      [
        1,
        3,
        null,
        2,
        null,
        null,
        null,
        0,
        null,
        null
      ],
      [
        1,
        null,
        null,
        2,
        null,
        2,
        null,
        1,
        0,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          1,
          1,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 110,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        null,
        null,
        null,
        1,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        0,
        null,
        null,
        null,
        2,
        2,
        1,
        null,
        null
      ],
      [
        null,
        null,
        1,
        2,
        1,
        3,
        null,
        null,
        0,
        0
      ],
      [
        null,
        1,
        null,
        null,
        null,
        1,
        null,
        1,
        null,
        null
      ],
      [
        null,
        2,
        2,
        3,
        2,
        null,
        2,
        3,
        2,
        0
      ],
      [
        null,
        1,
        null,
        1,
        null,
        null,
        2,
        1,
        2,
        null
      ],
      [
        null,
        2,
        null,
        null,
        null,
        2,
        null,
        null,
        null,
        3
      ],
      [
        3,
        2,
        null,
        1,
        2,
        null,
        null,
        null,
        1,
        null
      ],
      [
        null,
        0,
        null,
        null,
        3,
        2,
        2,
        null,
        1,
        null
      ],
      [
        0,
        0,
        null,
        null,
        0,
        1,
        2,
        3,
        1,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 111,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        null,
        null,
        null,
        3,
        3,
        null,
        1,
        null,
        1
      ],
      [
        1,
        3,
        3,
        2,
        0,
        null,
        null,
        null,
        1,
        1
      ],
      [
        null,
        null,
        null,
        0,
        null,
        0,
        null,
        null,
        3,
        1
      ],
      [
        1,
        null,
        1,
        0,
        0,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        3,
        1,
        1,
        null,
        2,
        0,
        0,
        null
      ],
      [
        null,
        1,
        2,
        1,
        null,
        null,
        null,
        null,
        0,
        0
      ],
      [
        null,
        3,
        3,
        null,
        1,
        2,
        null,
        0,
        null,
        null
      ],
      [
        null,
        2,
        null,
        null,
        null,
        null,
        null,
        null,
        0,
        0
      ],
      [
        null,
        2,
        null,
        1,
        3,
        1,
        2,
        null,
        0,
        null
      ],
      [
        null,
        2,
        1,
        2,
        null,
        3,
        null,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 112,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        null,
        null,
        1,
        null,
        null,
        0,
        0,
        0,
        null
      ],
      [
        0,
        1,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        1,
        null,
        null,
        1,
        0,
        2,
        null,
        1,
        null,
        0
      ],
      [
        0,
        null,
        null,
        1,
        null,
        2,
        2,
        null,
        null,
        1
      ],
      [
        1,
        1,
        1,
        null,
        3,
        null,
        null,
        null,
        null,
        2
      ],
      [
        null,
        2,
        3,
        null,
        null,
        null,
        1,
        2,
        1,
        1
      ],
      [
        null,
        1,
        null,
        null,
        3,
        null,
        null,
        null,
        2,
        null
      ],
      [
        2,
        null,
        2,
        2,
        2,
        1,
        null,
        null,
        null,
        1
      ],
      [
        null,
        2,
        2,
        null,
        null,
        null,
        null,
        0,
        0,
        null
      ],
      [
        null,
        3,
        2,
        3,
        2,
        null,
        0,
        0,
        null,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          1
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 113,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        0,
        0,
        null,
        1,
        null,
        null,
        2,
        1,
        0
      ],
      [
        null,
        null,
        null,
        null,
        0,
        2,
        null,
        null,
        1,
        null
      ],
      [
        0,
        null,
        0,
        1,
        1,
        2,
        null,
        null,
        0,
        0
      ],
      [
        null,
        0,
        null,
        2,
        null,
        2,
        1,
        null,
        null,
        null
      ],
      [
        null,
        0,
        null,
        null,
        1,
        3,
        null,
        null,
        null,
        3
      ],
      [
        0,
        null,
        1,
        null,
        null,
        null,
        1,
        2,
        null,
        3
      ],
      [
        null,
        0,
        null,
        null,
        3,
        2,
        2,
        3,
        2,
        3
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        3,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        0,
        1,
        0,
        null,
        null
      ],
      [
        0,
        0,
        null,
        0,
        0,
        null,
        null,
        0,
        0,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 114,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        2,
        1,
        null,
        null,
        2,
        null,
        null,
        0,
        null
      ],
      [
        1,
        2,
        2,
        3,
        null,
        1,
        null,
        0,
        null,
        null
      ],
      [
        null,
        2,
        2,
        null,
        null,
        0,
        2,
        2,
        0,
        null
      ],
      [
        2,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        0
      ],
      [
        3,
        null,
        1,
        null,
        3,
        1,
        null,
        null,
        3,
        null
      ],
      [
        null,
        null,
        1,
        1,
        1,
        null,
        null,
        3,
        null,
        null
      ],
      [
        0,
        null,
        1,
        1,
        2,
        null,
        null,
        2,
        null,
        3
      ],
      [
        null,
        null,
        3,
        2,
        null,
        null,
        2,
        2,
        null,
        null
      ],
      [
        0,
        0,
        1,
        0,
        0,
        0,
        null,
        null,
        1,
        1
      ],
      [
        null,
        0,
        null,
        null,
        null,
        null,
        1,
        3,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          1,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          1
        ]
      ],
      "vEdges": [
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1
        ]
      ]
    }
  },
  {
    "id": 115,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        0,
        null,
        null,
        null,
        null,
        null,
        3,
        2,
        3
      ],
      [
        null,
        null,
        null,
        null,
        null,
        2,
        null,
        2,
        null,
        2
      ],
      [
        null,
        null,
        0,
        null,
        3,
        0,
        1,
        null,
        2,
        null
      ],
      [
        0,
        null,
        1,
        null,
        2,
        null,
        0,
        null,
        1,
        2
      ],
      [
        null,
        3,
        null,
        null,
        2,
        null,
        1,
        1,
        2,
        1
      ],
      [
        null,
        1,
        2,
        null,
        null,
        null,
        null,
        2,
        1,
        0
      ],
      [
        null,
        null,
        null,
        null,
        2,
        1,
        1,
        null,
        null,
        0
      ],
      [
        null,
        3,
        null,
        1,
        2,
        3,
        1,
        null,
        null,
        1
      ],
      [
        null,
        null,
        null,
        3,
        null,
        2,
        1,
        2,
        1,
        null
      ],
      [
        null,
        0,
        0,
        null,
        1,
        null,
        2,
        null,
        null,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 116,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        null,
        null,
        1,
        null,
        null,
        0,
        0,
        null,
        null
      ],
      [
        null,
        1,
        2,
        null,
        0,
        null,
        1,
        0,
        0,
        0
      ],
      [
        null,
        3,
        null,
        1,
        1,
        null,
        2,
        null,
        null,
        null
      ],
      [
        null,
        2,
        1,
        null,
        0,
        null,
        1,
        2,
        null,
        0
      ],
      [
        null,
        null,
        null,
        1,
        null,
        null,
        null,
        null,
        null,
        0
      ],
      [
        null,
        2,
        null,
        null,
        null,
        1,
        null,
        0,
        null,
        2
      ],
      [
        null,
        2,
        1,
        2,
        1,
        1,
        null,
        null,
        null,
        2
      ],
      [
        0,
        null,
        1,
        2,
        2,
        null,
        2,
        null,
        1,
        1
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        2,
        2,
        1,
        null
      ],
      [
        null,
        null,
        null,
        0,
        1,
        null,
        3,
        null,
        1,
        1
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 117,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        null,
        null,
        2,
        null,
        3,
        2,
        0,
        1,
        0
      ],
      [
        null,
        null,
        2,
        null,
        3,
        null,
        2,
        null,
        3,
        null
      ],
      [
        null,
        null,
        1,
        2,
        1,
        null,
        null,
        null,
        null,
        3
      ],
      [
        0,
        null,
        null,
        2,
        null,
        null,
        null,
        2,
        2,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        2,
        null,
        2,
        0,
        0
      ],
      [
        0,
        null,
        null,
        1,
        null,
        null,
        2,
        null,
        1,
        null
      ],
      [
        null,
        null,
        2,
        null,
        1,
        null,
        null,
        1,
        null,
        null
      ],
      [
        0,
        1,
        2,
        null,
        2,
        null,
        null,
        0,
        null,
        0
      ],
      [
        0,
        0,
        1,
        1,
        null,
        null,
        0,
        null,
        0,
        null
      ],
      [
        0,
        null,
        null,
        0,
        0,
        0,
        null,
        0,
        0,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 118,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        0,
        null,
        null,
        0,
        null,
        1,
        null,
        null,
        null
      ],
      [
        0,
        null,
        0,
        0,
        null,
        2,
        3,
        null,
        null,
        null
      ],
      [
        1,
        1,
        1,
        null,
        null,
        null,
        null,
        2,
        0,
        null
      ],
      [
        null,
        1,
        null,
        2,
        1,
        3,
        null,
        null,
        1,
        null
      ],
      [
        null,
        null,
        null,
        null,
        1,
        null,
        1,
        1,
        null,
        1
      ],
      [
        2,
        2,
        null,
        null,
        0,
        1,
        3,
        2,
        1,
        null
      ],
      [
        null,
        3,
        2,
        2,
        null,
        2,
        1,
        null,
        3,
        null
      ],
      [
        null,
        1,
        0,
        null,
        null,
        1,
        null,
        0,
        1,
        null
      ],
      [
        null,
        null,
        null,
        0,
        null,
        null,
        0,
        null,
        0,
        null
      ],
      [
        null,
        null,
        null,
        0,
        null,
        0,
        null,
        0,
        0,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 119,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        0,
        2,
        3,
        2,
        null,
        1,
        null,
        3,
        1,
        null
      ],
      [
        1,
        null,
        1,
        null,
        null,
        2,
        1,
        null,
        null,
        null
      ],
      [
        1,
        null,
        null,
        1,
        null,
        2,
        null,
        2,
        null,
        null
      ],
      [
        3,
        2,
        2,
        3,
        3,
        null,
        null,
        null,
        null,
        null
      ],
      [
        2,
        null,
        1,
        null,
        null,
        null,
        1,
        null,
        0,
        3
      ],
      [
        3,
        null,
        null,
        null,
        1,
        null,
        2,
        2,
        null,
        null
      ],
      [
        3,
        null,
        1,
        0,
        null,
        1,
        null,
        null,
        null,
        null
      ],
      [
        3,
        1,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        2
      ],
      [
        3,
        null,
        1,
        2,
        1,
        1,
        null,
        1,
        null,
        0
      ],
      [
        null,
        null,
        3,
        1,
        null,
        null,
        0,
        null,
        0,
        0
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          0,
          1,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          0,
          0
        ],
        [
          1,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ]
    }
  },
  {
    "id": 120,
    "size": 10,
    "difficulty": "master",
    "clues": [
      [
        null,
        0,
        2,
        2,
        2,
        2,
        null,
        1,
        0,
        null
      ],
      [
        0,
        null,
        3,
        null,
        3,
        null,
        1,
        null,
        null,
        null
      ],
      [
        0,
        null,
        null,
        null,
        null,
        null,
        0,
        0,
        null,
        0
      ],
      [
        1,
        null,
        2,
        2,
        null,
        2,
        1,
        null,
        null,
        null
      ],
      [
        2,
        2,
        2,
        null,
        null,
        1,
        null,
        1,
        0,
        null
      ],
      [
        null,
        null,
        null,
        1,
        null,
        null,
        null,
        3,
        null,
        null
      ],
      [
        3,
        3,
        1,
        0,
        1,
        null,
        null,
        2,
        null,
        0
      ],
      [
        null,
        null,
        null,
        2,
        null,
        2,
        1,
        1,
        null,
        1
      ],
      [
        0,
        null,
        null,
        null,
        null,
        null,
        2,
        1,
        3,
        null
      ],
      [
        null,
        null,
        1,
        null,
        0,
        null,
        2,
        null,
        3,
        null
      ]
    ],
    "solution": {
      "hEdges": [
        [
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          1,
          1,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0
        ]
      ],
      "vEdges": [
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          1,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          1,
          1,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          1,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ]
      ]
    }
  }
];

function getSlitherlinkCampaignLevel(levelId) {
    const id = parseInt(levelId, 10);
    return SLITHERLINK_LEVELS.find(l => l.id === id) || SLITHERLINK_LEVELS[0];
}

function getSlitherlinkDailyPuzzle(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % SLITHERLINK_LEVELS.length;
    return SLITHERLINK_LEVELS[idx];
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SLITHERLINK_LEVELS,
        getSlitherlinkCampaignLevel,
        getSlitherlinkDailyPuzzle
    };
}

// === Source: js\puzzles\slitherlink\data\tutorial.js ===
/**
 * Slitherlink Grundlagen-Tutorial (6 Schritte)
 * Führt schrittweise in 0er-Zellen, 3er-Ecken, Punktgrad-2 und geschlossene Rundwege ein.
 */

const SLITHERLINK_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Das Ziel: Eine geschlossene Schleife",
        subtitle: "Verbinde die Punkte",
        size: 3,
        clues: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [1, 1, 1],
            [0, 0, 0],
            [0, 0, 0],
            [1, 1, 1]
        ],
        initialVEdges: [
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 1, 1],
                [0, 0, 0],
                [0, 0, 0],
                [1, 1, 1]
            ],
            vEdges: [
                [1, 0, 0, 1],
                [1, 0, 0, 1],
                [1, 0, 0, 1]
            ]
        },
        description: "Das Ziel von Slitherlink ist es, **einen einzigen geschlossenen Rundweg (Schleife)** entlang der Gitterpunkte zu zeichnen.\n\nSchließe die Schleife, indem du die beiden fehlenden vertikalen Kanten in der untersten Reihe einzeichnest (durch Antippen oder Wischen).",
        explanation: "Perfekt! Die Schleife ist geschlossen und verbindet die Punkte ohne Abzweigungen."
    },
    {
        id: 2,
        title: "2. Die Null-Regel (0)",
        subtitle: "Keine Kanten erlaubt",
        size: 3,
        clues: [
            [null, 0, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [0, 2, 0],
                [0, 2, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [0, 2, 2, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Eine Zahl in einer Zelle gibt an, **wie viele der 4 Kanten** Teil der Schleife sein müssen.\n\nUm eine **0** darf **keine einzige Kante** verlaufen! Markiere alle 4 Kanten der 0 mit einem Kreuz (✕), z. B. durch langes Drücken oder zweimaliges Antippen.",
        explanation: "Sehr gut! Um eine 0 herum sind alle Kanten sofort gesperrt."
    },
    {
        id: 3,
        title: "3. Dreier in der Ecke (3)",
        subtitle: "Erzwungene Außenkanten",
        size: 3,
        clues: [
            [3, null, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [1, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Befindet sich eine **3** in einer Spielfeldecke, müssen die **beiden äußeren Kanten der Ecke zwingend Linien** sein.\n\n*Hinweis:* Welche der beiden Innenkanten die 3. Linie der Zelle wird, entscheidet sich erst später im Spielverlauf – die 2 Außenkanten sind jedoch sofort zu 100 % sicher!\n\nZeichne die beiden äußeren Kanten oben links ein.",
        explanation: "Exzellent! Der Eckpunkt muss genau 2 Linien haben – daher sind die beiden Außenkanten sofort zwingend gesetzt, noch bevor die dritte Kante feststeht."
    },
    {
        id: 4,
        title: "4. Exakt 2 Linien pro Punkt",
        subtitle: "Keine Sackgassen, keine Kreuzungen",
        size: 3,
        clues: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [1, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 1, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [1, 0, 0, 0],
                [1, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "An jedem Punkt der Schleife treffen **immer genau 2 Linien** zusammen.\n\nDie Linie darf an den Enden nicht einfach aufhören. Verlängere die beiden offenen Enden nach rechts und nach unten.",
        explanation: "Klasse! Ein Linienende muss immer weitergeführt werden, bis sich die Schleife schließt."
    },
    {
        id: 5,
        title: "5. Benachbarte Dreier (3-3)",
        subtitle: "Mittel- und Außenlinien",
        size: 3,
        clues: [
            [3, 3, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 1, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Liegen zwei **3er direkt nebeneinander**, muss die **gemeinsame Kante in der Mitte** sowie die beiden **äußeren Kanten** gezeichnet werden.\n\nZeichne die 3 vertikalen Kanten und die oberen Kanten ein.",
        explanation: "Großartig! Dies ist eines der wichtigsten Standardmuster in Slitherlink."
    },
    {
        id: 6,
        title: "6. Deine erste vollständige Schleife",
        subtitle: "Kombiniere alle Regeln",
        size: 3,
        clues: [
            [2, 1, 2],
            [1, 0, 1],
            [2, 1, 2]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 1, 1],
                [0, 0, 0],
                [0, 0, 0],
                [1, 1, 1]
            ],
            vEdges: [
                [1, 0, 0, 1],
                [1, 0, 0, 1],
                [1, 0, 0, 1]
            ]
        },
        requiresFullLoop: true,
        description: "Nutze die 0 in der Mitte und die Hinweise am Rand, um die vollständige 3×3-Schleife zu zeichnen.",
        explanation: "Herzlichen Glückwunsch! Du beherrschst die Grundlagen von Slitherlink."
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SLITHERLINK_TUTORIAL_STEPS };
}

// === Source: js\puzzles\slitherlink\data\tutorial_adv.js ===
/**
 * Slitherlink Fortgeschrittene Lektionen & Meister-Muster (6 Lektionen)
 * Diagonale 3er, 1er an Ecken, Dead-End-Ausschluss und Schleifen-Vermeidung.
 */

const SLITHERLINK_TUTORIAL_ADVANCED_STEPS = [
    {
        id: 1,
        title: "1. Diagonale Dreier",
        subtitle: "Gegenüberliegende Ecken",
        size: 3,
        clues: [
            [3, null, null],
            [null, 3, null],
            [null, null, null]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [1, 0, 0],
                [0, 0, 0],
                [0, 1, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [1, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Berühren sich zwei **3er diagonal an einer Ecke**, müssen die beiden jeweils **äußeren Kanten** Linien sein.",
        explanation: "Hervorragend! Die Diagonale erzwingt den Fluss der Schleife um die Berührungsecke herum."
    },
    {
        id: 2,
        title: "2. 1er an der Ecke",
        subtitle: "Keine äußere Spitze",
        size: 3,
        clues: [
            [1, null, null],
            [null, null, null],
            [null, null, null]
        ],
        initialHEdges: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        initialVEdges: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        solution: {
            hEdges: [
                [2, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            vEdges: [
                [2, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        description: "Steht eine **1 in der Spielfeldecke**, können die beiden äußeren Kanten der Ecke niemals gleichzeitig Linien sein. Setzt man eine Außenlinie, müsste auch die zweite da sein (Sackgasse am Eckpunkt) $\rightarrow$ Die beiden äußeren Eckenkanten können markiert werden.",
        explanation: "Exzellent kombiniert!"
    },
    {
        id: 3,
        title: "3. Teilschleifen-Vermeidung (Sub-Loops)",
        subtitle: "Kein verfrühter Kreis",
        size: 4,
        clues: [
            [2, 2, null, null],
            [2, 2, null, null],
            [null, null, 2, 2],
            [null, null, 2, 2]
        ],
        initialHEdges: [
            [1, 1, 0, 0],
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 1, 1],
            [0, 0, 1, 1]
        ],
        initialVEdges: [
            [1, 0, 1, 0, 0],
            [1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1],
            [0, 0, 1, 0, 1]
        ],
        solution: {
            hEdges: [
                [1, 1, 0, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 1]
            ],
            vEdges: [
                [1, 0, 1, 0, 0],
                [1, 0, 1, 0, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1]
            ]
        },
        description: "Zwei offene Linienenden dürfen sich **niemals vorzeitig schließen**, wenn noch weitere Zahlen im Gitter unverbunden bleiben.",
        explanation: "Sehr gut! Es darf nur genau eine einzige Gesamtschleife geben."
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SLITHERLINK_TUTORIAL_ADVANCED_STEPS };
}

// === Source: js\puzzles\slitherlink\index.js ===
/**
 * Slitherlink Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Slitherlink (4×4 bis 10×10).
 */










const SlitherlinkPlugin = {
    id: 'slitherlink',
    name: 'Slitherlink',
    icon: '➿',
    description: 'Schleifen-Rätsel mit Zahlenhinweisen',
    cssPath: './css/puzzles/slitherlink.css',

    getSizes: () => [
        { id: 4, label: '4 × 4 (Mini)', gridSize: 4 },
        { id: 6, label: '6 × 6 (Klassisch)', gridSize: 6 },
        { id: 8, label: '8 × 8 (Labyrinth)', gridSize: 8 },
        { id: 10, label: '10 × 10 (Meister)', gridSize: 10 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [0, 1, 2],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: false,
        keys: [0, 1, 2]
    }),

    createEngine: (size = 6) => new SlitherlinkEngine(size),
    generatePuzzle: (opts) => SlitherlinkGenerator.generate(opts),
    solvePuzzle: (engine, max = 1) => SlitherlinkSolver.solve(engine.clues, max),

    renderBoard: (container, engine, state, onCell) => SlitherlinkRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => SlitherlinkRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass, size) => SlitherlinkRenderer.getSymbolSvg(val, extraClass, size),

    getHint: (engine, options) => SlitherlinkSolver.getHint(engine, options),
    getRules: (lang) => SlitherlinkRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Einstieg (4×4 & 5×5)', levelRange: [0, 29], desc: 'Grundlagen, 0er & Eck-3er' },
            { id: 1, name: 'Pfadfinder (6×6 & 7×7)', levelRange: [30, 59], desc: 'Punktgrad & Linienfortführung' },
            { id: 2, name: 'Labyrinth (8×8)', levelRange: [60, 89], desc: 'Verzweigungen & Sub-Loop-Ausschluss' },
            { id: 3, name: 'Meister-Zirkel (10×10)', levelRange: [90, 119], desc: 'Große Schleifen & Paritätslogik' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getSlitherlinkCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getSlitherlinkDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: SLITHERLINK_TUTORIAL_STEPS, badge: '6 Lektionen' },
            { id: 'advanced', name: 'Meistermuster', steps: SLITHERLINK_TUTORIAL_ADVANCED_STEPS, badge: '3 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => SLITHERLINK_I18N[lang] || {}
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SlitherlinkPlugin };
}

// === Source: js\puzzles\sudoku\engine.js ===
/**
 * Sudoku Game Engine
 * Unterstützt 4×4 (2×2 Boxen), 9×9 (3×3 Boxen) und 16×16 (4×4 Boxen, Hexadezimal 0–F).
 * Verwaltet Spielfeld, Notizen, Undo/Redo, Regelvalidierung und Peer-Ermittlung.
 */

const SUDOKU_EMPTY = 0;

const HEX_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

function formatSudokuValue(val, size = 9) {
    if (!val || val <= 0) return '';
    if (size === 16) {
        return HEX_DIGITS[val - 1] || `${val}`;
    }
    return `${val}`;
}

class SudokuEngine {
    constructor(size = 9) {
        this.size = size;
        this.maxValue = size;
        
        // Box-Dimensionen
        if (size === 4) {
            this.boxW = 2;
            this.boxH = 2;
        } else if (size === 16) {
            this.boxW = 4;
            this.boxH = 4;
        } else {
            this.boxW = 3;
            this.boxH = 3;
        }

        this.grid = Array(size).fill(0).map(() => Array(size).fill(SUDOKU_EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(SUDOKU_EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));

        this.undoStack = [];
        this.redoStack = [];
        this.solution = null;
    }

    /**
     * Setzt das Spielfeld auf die Ausgangsbelegung zurück
     */
    restart() {
        this.grid = this.initialGrid.map(row => [...row]);
        this.notes = Array(this.size).fill(0).map(() => Array(this.size).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];
    }

    loadPuzzle({ size = 9, initialGrid, solution = null }) {
        this.size = size;
        this.maxValue = size;

        if (size === 4) {
            this.boxW = 2;
            this.boxH = 2;
        } else if (size === 16) {
            this.boxW = 4;
            this.boxH = 4;
        } else {
            this.boxW = 3;
            this.boxH = 3;
        }

        this.grid = Array(size).fill(0).map(() => Array(size).fill(SUDOKU_EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(SUDOKU_EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];
        this.solution = solution ? solution.map(row => [...row]) : null;

        if (initialGrid) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const val = initialGrid[r][c];
                    if (val > 0) {
                        this.grid[r][c] = val;
                        this.initialGrid[r][c] = val;
                        this.locked[r][c] = true;
                    }
                }
            }
        }
    }

    formatValue(val) {
        return formatSudokuValue(val, this.size);
    }

    getSolution() {
        if (this.solution) return this.solution;
        if (typeof SudokuSolver !== 'undefined' && SudokuSolver.solve) {
            const sol = SudokuSolver.solve(this, 1);
            if (sol && sol.length > 0) {
                this.solution = sol[0].map(row => [...row]);
                return this.solution;
            }
        }
        return null;
    }

    getBox(r, c) {
        const startR = Math.floor(r / this.boxH) * this.boxH;
        const startC = Math.floor(c / this.boxW) * this.boxW;
        return {
            startR,
            startC,
            endR: startR + this.boxH,
            endC: startC + this.boxW
        };
    }

    getPeers(r, c) {
        const peers = new Set();
        // Zeile
        for (let cc = 0; cc < this.size; cc++) {
            if (cc !== c) peers.add(`${r},${cc}`);
        }
        // Spalte
        for (let rr = 0; rr < this.size; rr++) {
            if (rr !== r) peers.add(`${rr},${c}`);
        }
        // Box
        const box = this.getBox(r, c);
        for (let rr = box.startR; rr < box.endR; rr++) {
            for (let cc = box.startC; cc < box.endC; cc++) {
                if (rr !== r || cc !== c) peers.add(`${rr},${cc}`);
            }
        }
        return peers;
    }

    setCellValue(r, c, val, isNote = false) {
        if (this.locked[r][c]) return false;

        if (isNote) {
            if (val <= 0 || val > this.maxValue) return false;
            const cellNotes = this.notes[r][c];
            const prevNotes = new Set(cellNotes);
            if (cellNotes.has(val)) {
                cellNotes.delete(val);
            } else {
                cellNotes.add(val);
            }
            this.undoStack.push({
                type: 'note',
                r, c,
                prevNotes,
                nextNotes: new Set(cellNotes)
            });
            this.redoStack = [];
            return true;
        }

        const prevVal = this.grid[r][c];
        const prevNotes = new Set(this.notes[r][c]);

        if (prevVal === val && prevNotes.size === 0) return false;

        this.undoStack.push({
            type: 'cell',
            r, c,
            prevVal,
            nextVal: val,
            prevNotes
        });
        this.redoStack = [];

        this.grid[r][c] = val;
        this.notes[r][c].clear();

        // Automatisch Notizen in Peers bereinigen wenn Zahl gesetzt wird
        if (val > 0) {
            for (const peerStr of this.getPeers(r, c)) {
                const [pr, pc] = peerStr.split(',').map(Number);
                if (this.notes[pr][pc].has(val)) {
                    this.notes[pr][pc].delete(val);
                }
            }
        }

        return true;
    }

    cycleCellValue(r, c) {
        if (this.locked[r][c]) return null;
        const current = this.grid[r][c];
        let next = (current + 1) % (this.maxValue + 1);
        this.setCellValue(r, c, next);
        return next;
    }

    undo() {
        if (this.undoStack.length === 0) return null;
        const action = this.undoStack.pop();
        this.redoStack.push(action);

        if (action.type === 'cell') {
            this.grid[action.r][action.c] = action.prevVal;
            this.notes[action.r][action.c] = new Set(action.prevNotes);
        } else if (action.type === 'note') {
            this.notes[action.r][action.c] = new Set(action.prevNotes);
        }
        return action;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();
        this.undoStack.push(action);

        if (action.type === 'cell') {
            this.grid[action.r][action.c] = action.nextVal;
        } else if (action.type === 'note') {
            this.notes[action.r][action.c] = new Set(action.nextNotes);
        }
        return action;
    }

    validateRules() {
        const errors = [];
        const conflictCells = new Set();

        // 1. Zeilen-Duplikate
        for (let r = 0; r < this.size; r++) {
            const seen = new Map();
            for (let c = 0; c < this.size; c++) {
                const v = this.grid[r][c];
                if (v === SUDOKU_EMPTY) continue;
                if (seen.has(v)) {
                    conflictCells.add(`${r},${c}`);
                    conflictCells.add(`${r},${seen.get(v)}`);
                    errors.push({
                        rule: 'row_duplicate',
                        row: r,
                        value: v,
                        message: `Ziffer ${this.formatValue(v)} kommt mehrfach in Zeile ${r + 1} vor`
                    });
                } else {
                    seen.set(v, c);
                }
            }
        }

        // 2. Spalten-Duplikate
        for (let c = 0; c < this.size; c++) {
            const seen = new Map();
            for (let r = 0; r < this.size; r++) {
                const v = this.grid[r][c];
                if (v === SUDOKU_EMPTY) continue;
                if (seen.has(v)) {
                    conflictCells.add(`${r},${c}`);
                    conflictCells.add(`${seen.get(v)},${c}`);
                    errors.push({
                        rule: 'col_duplicate',
                        col: c,
                        value: v,
                        message: `Ziffer ${this.formatValue(v)} kommt mehrfach in Spalte ${c + 1} vor`
                    });
                } else {
                    seen.set(v, r);
                }
            }
        }

        // 3. Block-/Box-Duplikate
        for (let br = 0; br < this.size; br += this.boxH) {
            for (let bc = 0; bc < this.size; bc += this.boxW) {
                const seen = new Map();
                for (let r = br; r < br + this.boxH; r++) {
                    for (let c = bc; c < bc + this.boxW; c++) {
                        const v = this.grid[r][c];
                        if (v === SUDOKU_EMPTY) continue;
                        if (seen.has(v)) {
                            const [pr, pc] = seen.get(v);
                            conflictCells.add(`${r},${c}`);
                            conflictCells.add(`${pr},${pc}`);
                            errors.push({
                                rule: 'box_duplicate',
                                value: v,
                                message: `Ziffer ${this.formatValue(v)} kommt mehrfach im Block vor`
                            });
                        } else {
                            seen.set(v, [r, c]);
                        }
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            conflictCells
        };
    }

    findMistakes() {
        const sol = this.getSolution();
        const ruleCheck = this.validateRules();

        if (!ruleCheck.isValid && ruleCheck.errors.length > 0) {
            const firstErr = ruleCheck.errors[0];
            const conflictArr = Array.from(ruleCheck.conflictCells || []).map(str => {
                const [r, c] = str.split(',').map(Number);
                return { r, c };
            });

            const targetCell = conflictArr.find(pos => !this.locked[pos.r][pos.c]) || conflictArr[0];
            const r = targetCell ? targetCell.r : 0;
            const c = targetCell ? targetCell.c : 0;
            const expectedVal = sol ? sol[r][c] : 0;

            return {
                type: 'rule_violation',
                strategy: 'Regelverstoß korrigieren',
                title: 'Regelverstoß korrigieren',
                r, c,
                currentVal: this.grid[r][c],
                value: expectedVal,
                expectedVal,
                highlightCells: conflictArr.length > 0 ? conflictArr : [{ r, c }],
                message: `Regelverstoß: ${firstErr.message}. Bitte korrigiere oder entferne das Symbol an Position (${r + 1},${c + 1}).`
            };
        }

        if (sol) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const current = this.grid[r][c];
                    if (current !== SUDOKU_EMPTY && !this.locked[r][c] && current !== sol[r][c]) {
                        return {
                            type: 'solution_mismatch',
                            strategy: 'Fehlerhafte Zahl korrigieren',
                            title: 'Fehlerhafte Zahl korrigieren',
                            r, c,
                            currentVal: current,
                            value: sol[r][c],
                            expectedVal: sol[r][c],
                            highlightCells: [{ r, c }],
                            message: `Fehler im Lösungsweg: An Position (${r + 1},${c + 1}) wurde ${this.formatValue(current)} gesetzt. Laut der Logik und Abhängigkeiten gehört dort ${this.formatValue(sol[r][c])} hin.`
                        };
                    }
                }
            }
        }

        return null;
    }

    isCompleted() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === SUDOKU_EMPTY) return false;
            }
        }
        return this.validateRules().isValid;
    }

    getFilledCount() {
        let count = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== SUDOKU_EMPTY) count++;
            }
        }
        return count;
    }

    getTotalCells() {
        return this.size * this.size;
    }
}

// === Source: js\puzzles\sudoku\solver.js ===
/**
 * Sudoku Solver & Strategic Hint Engine
 * Löst Sudokus (4×4, 9×9, 16×16 Hexadezimal) via Backtracking & Constraint-Propagation,
 * verifiziert Eindeutigkeit und findet didaktisch erklärte Lösungsschritte (10+ Strategien).
 */



class SudokuSolver {
    /**
     * Berechnet die verbleibenden Kandidaten für jede Zelle
     */
    static computeCandidates(engine) {
        const size = engine.size;
        const candidates = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (engine.grid[r][c] !== SUDOKU_EMPTY) continue;

                for (let v = 1; v <= engine.maxValue; v++) {
                    candidates[r][c].add(v);
                }

                // Peers eliminieren
                for (const peerStr of engine.getPeers(r, c)) {
                    const [pr, pc] = peerStr.split(',').map(Number);
                    const peerVal = engine.grid[pr][pc];
                    if (peerVal !== SUDOKU_EMPTY) {
                        candidates[r][c].delete(peerVal);
                    }
                }
            }
        }
        return candidates;
    }

    /**
     * Findet den didaktisch und strategisch besten logischen Hinweis
     */
    static findLogicalHint(engine, options = {}) {
        const mistakes = engine.findMistakes();
        if (mistakes) return mistakes;

        const candidates = SudokuSolver.computeCandidates(engine);
        const focusCell = options.focusCell || null;

        // 1. Strategie: Naked Single (Eindeutiger Kandidat)
        const nakedSingles = [];
        for (let r = 0; r < engine.size; r++) {
            for (let c = 0; c < engine.size; c++) {
                if (engine.grid[r][c] === SUDOKU_EMPTY && candidates[r][c].size === 1) {
                    const val = Array.from(candidates[r][c])[0];
                    nakedSingles.push({
                        type: 'naked_single',
                        strategy: 'Naked Single (Letzte Option)',
                        r, c, value: val,
                        highlightCells: [{ r, c }],
                        message: `In Feld (${r + 1},${c + 1}) ist nur noch ${engine.formatValue(val)} möglich, da alle anderen Werte bereits in derselben Zeile, Spalte oder im Block vorkommen.`
                    });
                }
            }
        }

        if (nakedSingles.length > 0) {
            if (focusCell) {
                const focused = nakedSingles.find(h => h.r === focusCell.r && h.c === focusCell.c);
                if (focused) return focused;
            }
            return nakedSingles[0];
        }

        // 2. Strategie: Hidden Single in Zeilen
        for (let r = 0; r < engine.size; r++) {
            for (let v = 1; v <= engine.maxValue; v++) {
                const possibleCols = [];
                for (let c = 0; c < engine.size; c++) {
                    if (engine.grid[r][c] === SUDOKU_EMPTY && candidates[r][c].has(v)) {
                        possibleCols.push(c);
                    }
                }
                if (possibleCols.length === 1) {
                    const c = possibleCols[0];
                    return {
                        type: 'hidden_single_row',
                        strategy: 'Hidden Single (Zeile)',
                        r, c, value: v,
                        highlightCells: [{ r, c }],
                        message: `In Zeile ${r + 1} kann der Wert ${engine.formatValue(v)} ausschließlich auf Feld (${r + 1},${c + 1}) platziert werden, da er in allen anderen Feldern dieser Zeile blockiert ist.`
                    };
                }
            }
        }

        // 3. Strategie: Hidden Single in Spalten
        for (let c = 0; c < engine.size; c++) {
            for (let v = 1; v <= engine.maxValue; v++) {
                const possibleRows = [];
                for (let r = 0; r < engine.size; r++) {
                    if (engine.grid[r][c] === SUDOKU_EMPTY && candidates[r][c].has(v)) {
                        possibleRows.push(r);
                    }
                }
                if (possibleRows.length === 1) {
                    const r = possibleRows[0];
                    return {
                        type: 'hidden_single_col',
                        strategy: 'Hidden Single (Spalte)',
                        r, c, value: v,
                        highlightCells: [{ r, c }],
                        message: `In Spalte ${c + 1} kann der Wert ${engine.formatValue(v)} ausschließlich auf Feld (${r + 1},${c + 1}) platziert werden, da er in allen anderen Feldern dieser Spalte blockiert ist.`
                    };
                }
            }
        }

        // 4. Strategie: Hidden Single im Block / Box
        for (let br = 0; br < engine.size; br += engine.boxH) {
            for (let bc = 0; bc < engine.size; bc += engine.boxW) {
                for (let v = 1; v <= engine.maxValue; v++) {
                    const possibleCells = [];
                    for (let r = br; r < br + engine.boxH; r++) {
                        for (let c = bc; c < bc + engine.boxW; c++) {
                            if (engine.grid[r][c] === SUDOKU_EMPTY && candidates[r][c].has(v)) {
                                possibleCells.push({ r, c });
                            }
                        }
                    }
                    if (possibleCells.length === 1) {
                        const { r, c } = possibleCells[0];
                        return {
                            type: 'hidden_single_box',
                            strategy: 'Hidden Single (Block)',
                            r, c, value: v,
                            highlightCells: [{ r, c }],
                            message: `In diesem Block kann der Wert ${engine.formatValue(v)} ausschließlich auf Feld (${r + 1},${c + 1}) gesetzt werden.`
                        };
                    }
                }
            }
        }

        // 5. Fallback: Lösungs-orientierter Hinweis
        const sol = engine.getSolution();
        if (sol) {
            for (let r = 0; r < engine.size; r++) {
                for (let c = 0; c < engine.size; c++) {
                    if (engine.grid[r][c] === SUDOKU_EMPTY) {
                        return {
                            type: 'direct_step',
                            strategy: 'Logischer Deduktionsschritt',
                            r, c,
                            value: sol[r][c],
                            highlightCells: [{ r, c }],
                            message: `Durch logisches Ausschließen in Zeile, Spalte und Block gehört auf Feld (${r + 1},${c + 1}) der Wert ${engine.formatValue(sol[r][c])}.`
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Findet alle Lösungen via Backtracking mit MRV Heuristik (Minimum Remaining Values)
     */
    static solve(engine, maxSolutions = 2) {
        const size = engine.size;
        const boxH = engine.boxH;
        const boxW = engine.boxW;
        const grid = engine.grid.map(row => [...row]);
        const solutions = [];

        function isValid(r, c, val) {
            for (let i = 0; i < size; i++) {
                if (grid[r][i] === val) return false;
                if (grid[i][c] === val) return false;
            }
            const startR = Math.floor(r / boxH) * boxH;
            const startC = Math.floor(c / boxW) * boxW;
            for (let rr = startR; rr < startR + boxH; rr++) {
                for (let cc = startC; cc < startC + boxW; cc++) {
                    if (grid[rr][cc] === val) return false;
                }
            }
            return true;
        }

        function findBestEmptyCell() {
            let minCandidates = 999;
            let best = null;

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === SUDOKU_EMPTY) {
                        let candCount = 0;
                        for (let v = 1; v <= size; v++) {
                            if (isValid(r, c, v)) candCount++;
                        }
                        if (candCount === 0) return { r: -1, c: -1 }; // Widerspruch
                        if (candCount < minCandidates) {
                            minCandidates = candCount;
                            best = { r, c };
                            if (minCandidates === 1) return best;
                        }
                    }
                }
            }
            return best;
        }

        function backtrack() {
            if (solutions.length >= maxSolutions) return;

            const cell = findBestEmptyCell();
            if (cell && cell.r === -1) return;
            if (!cell) {
                solutions.push(grid.map(row => [...row]));
                return;
            }

            const { r, c } = cell;
            for (let val = 1; val <= size; val++) {
                if (isValid(r, c, val)) {
                    grid[r][c] = val;
                    backtrack();
                    grid[r][c] = SUDOKU_EMPTY;
                    if (solutions.length >= maxSolutions) return;
                }
            }
        }

        backtrack();
        return solutions;
    }
}

// === Source: js\puzzles\sudoku\generator.js ===
/**
 * Sudoku Puzzle Generator
 * Erzeugt prozedural eindeutig lösbare Sudokus (4×4, 9×9, 16×16 Hexadezimal)
 * und Schwierigkeitsgrade mit deterministischer Seed-Unterstützung und 180° Rotationssymmetrie.
 */




class SudokuGenerator {
    static seededRandom(seed) {
        let s = Math.abs(seed) % 2147483647;
        if (s <= 0) s += 2147483646;
        return function() {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    static shuffle(array, rng) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    /**
     * Erzeugt ein volles, 100% regelkonformes Lösungs-Board
     */
    static generateFullBoard(size, rng = Math.random) {
        const boxH = size === 4 ? 2 : (size === 16 ? 4 : 3);
        const boxW = size === 4 ? 2 : (size === 16 ? 4 : 3);

        // Basis-Shift Gitter
        const grid = Array(size).fill(0).map(() => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = ((r % boxH) * boxW + Math.floor(r / boxH) + c) % size + 1;
            }
        }

        // 1. Ziffern-Permutation (Zufällige Ziffern-Zuordnung via Fisher-Yates)
        const digits = [];
        for (let i = 1; i <= size; i++) digits.push(i);
        SudokuGenerator.shuffle(digits, rng);

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = digits[grid[r][c] - 1];
            }
        }

        // 2. Zeilen innerhalb von Blöcken tauschen
        for (let b = 0; b < size; b += boxH) {
            for (let i = 0; i < boxH; i++) {
                const swapWith = b + Math.floor(rng() * boxH);
                const curRow = b + i;
                const temp = grid[curRow];
                grid[curRow] = grid[swapWith];
                grid[swapWith] = temp;
            }
        }

        // 3. Spalten innerhalb von Blöcken tauschen
        for (let b = 0; b < size; b += boxW) {
            for (let i = 0; i < boxW; i++) {
                const swapWith = b + Math.floor(rng() * boxW);
                const curCol = b + i;
                for (let r = 0; r < size; r++) {
                    const temp = grid[r][curCol];
                    grid[r][curCol] = grid[r][swapWith];
                    grid[r][swapWith] = temp;
                }
            }
        }

        return grid;
    }

    /**
     * Erzeugt ein spielbares Sudoku mit garantiert eindeutiger Lösung
     */
    static generatePuzzle({ size = 9, difficulty = 'medium', seed = null }) {
        const rng = seed !== null ? SudokuGenerator.seededRandom(seed) : Math.random;
        
        let fullSolution = null;
        const testEngine = new SudokuEngine(size);

        // Volles, fehlerfreies Brett erzeugen
        for (let attempt = 0; attempt < 5; attempt++) {
            fullSolution = SudokuGenerator.generateFullBoard(size, rng);
            testEngine.loadPuzzle({ size, initialGrid: fullSolution });
            if (testEngine.validateRules().isValid) break;
        }

        // Ziel-Clues nach Größe & Schwierigkeit
        let targetClues;
        if (size === 4) {
            targetClues = difficulty === 'easy' ? 8 : (difficulty === 'medium' ? 6 : 4);
        } else if (size === 16) {
            targetClues = difficulty === 'easy' ? 140 : (difficulty === 'medium' ? 120 : 105);
        } else {
            // 9x9
            targetClues = difficulty === 'easy' ? 36 : (difficulty === 'medium' ? 30 : 25);
        }

        const puzzleGrid = fullSolution.map(row => [...row]);

        // Paarweise symmetrische Positionen (180° Rotationssymmetrie)
        const pairs = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const symR = size - 1 - r;
                const symC = size - 1 - c;
                if ((r < symR) || (r === symR && c <= symC)) {
                    pairs.push({ p1: { r, c }, p2: { r: symR, c: symC } });
                }
            }
        }
        SudokuGenerator.shuffle(pairs, rng);

        let currentClues = size * size;

        for (const pair of pairs) {
            if (currentClues <= targetClues) break;
            const { p1, p2 } = pair;
            if (puzzleGrid[p1.r][p1.c] === SUDOKU_EMPTY) continue;

            const val1 = puzzleGrid[p1.r][p1.c];
            const val2 = puzzleGrid[p2.r][p2.c];

            puzzleGrid[p1.r][p1.c] = SUDOKU_EMPTY;
            puzzleGrid[p2.r][p2.c] = SUDOKU_EMPTY;

            testEngine.loadPuzzle({ size, initialGrid: puzzleGrid });
            const sols = SudokuSolver.solve(testEngine, 2);

            if (sols.length !== 1) {
                // Nicht mehr eindeutig -> wiederherstellen
                puzzleGrid[p1.r][p1.c] = val1;
                puzzleGrid[p2.r][p2.c] = val2;
            } else {
                currentClues -= (p1.r === p2.r && p1.c === p2.c) ? 1 : 2;
            }
        }

        return {
            size,
            initialGrid: puzzleGrid,
            solution: fullSolution,
            difficulty
        };
    }
}

// === Source: js\puzzles\sudoku\renderer.js ===
/**
 * Sudoku Visual Renderer
 * Zeichnet das harmonische, nahtlose Sudoku-Gitter (4×4, 9×9, 16×16 Hexadezimal)
 * mit durchgehenden Block-Rändern, Notizen-Gittern, Keypad und Lösungsaufdeckung.
 */





class SudokuRenderer {
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
        gridEl.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
        gridEl.style.gridTemplateRows = `repeat(${size}, minmax(0, 1fr))`;
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
                if (isSelected) {
                    cellEl.classList.add('selected');
                    if (state.cellZoom !== false) {
                        cellEl.classList.add('cell-zoom');
                        cellEl.style.setProperty('--zoom-factor', state.cellZoomLevel || '1.5');
                    }
                }
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

// === Source: js\puzzles\sudoku\data\i18n.js ===
/**
 * Sudoku-spezifische Übersetzungen (DE & EN)
 */

const SUDOKU_I18N = {
    de: {
        sudoku_title: "Sudoku",
        sudoku_desc: "Klassisches Zahlenrätsel (4×4, 6×6, 9×9)",
        sudoku_btn_clear: "Löschen",
        sudoku_rules_title: "Sudoku Regeln",
        sudoku_chapter_1: "Einsteiger",
        sudoku_chapter_2: "Fortgeschritten",
        sudoku_chapter_3: "Klassisch",
        sudoku_chapter_4: "Meister",
        sudoku_tut_basics: "Grundlagen",
        sudoku_tut_advanced: "Fortgeschritten"
    },
    en: {
        sudoku_title: "Sudoku",
        sudoku_desc: "Classic number puzzle (4×4, 6×6, 9×9)",
        sudoku_btn_clear: "Clear",
        sudoku_rules_title: "Sudoku Rules",
        sudoku_chapter_1: "Beginner",
        sudoku_chapter_2: "Advanced",
        sudoku_chapter_3: "Classic",
        sudoku_chapter_4: "Master",
        sudoku_tut_basics: "Basics",
        sudoku_tut_advanced: "Advanced"
    }
};

// === Source: js\puzzles\sudoku\data\levels.js ===
/**
 * Sudoku Level & Tagesrätsel-Generierung
 * 120 prozedural generierte Kampagnen-Level in 4 Kapiteln (4×4, 9×9, 16×16 Hexadezimal)
 * und synchrones Tagesrätsel (Werktags 9×9, Wochenende 16×16 Hexadezimal).
 */



function getSudokuCampaignLevel(levelIndex) {
    // 120 Level in 4 Kapiteln:
    // Kapitel 1 (0–29): Einsteiger 4×4 (Level 1–15: Easy, Level 16–25: Medium, Level 26–30: Hard)
    // Kapitel 2 (30–59): Klassisch Leicht 9×9 (Level 31–60: Easy)
    // Kapitel 3 (60–89): Klassisch Anspruchsvoll 9×9 (Level 61–75: Medium, Level 76–90: Hard)
    // Kapitel 4 (90–119): Meister & Hexadezimal (Level 91–105: 9×9 Meister, Level 106–120: 16×16 Hexadezimal)

    let size, difficulty;
    if (levelIndex < 15) {
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 25) {
        size = 4;
        difficulty = 'medium';
    } else if (levelIndex < 30) {
        size = 4;
        difficulty = 'hard';
    } else if (levelIndex < 60) {
        size = 9;
        difficulty = 'easy';
    } else if (levelIndex < 75) {
        size = 9;
        difficulty = 'medium';
    } else if (levelIndex < 105) {
        size = 9;
        difficulty = 'hard';
    } else {
        // Level 106–120: 16×16 Hexadezimal Meister
        size = 16;
        difficulty = levelIndex < 112 ? 'easy' : (levelIndex < 117 ? 'medium' : 'hard');
    }

    const seed = 9000 + (levelIndex + 1) * 137;
    const generated = SudokuGenerator.generatePuzzle({ size, difficulty, seed });

    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1} (${size === 16 ? '16×16 Hex' : `${size}×${size}`})`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Sudoku-Tagesrätsel basierend auf dem Datum
 */
function getSudokuDailyPuzzle(dateStr) {
    const seed = parseInt(dateStr.replace(/-/g, ''), 10) + 777;
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
    
    // Werktags 9x9, Wochenende 16x16 Hexadezimal Meister
    const size = isWeekend ? 16 : 9;
    const difficulty = isWeekend ? 'medium' : 'hard';

    const generated = SudokuGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: `daily_sudoku_${dateStr}`,
        date: dateStr,
        name: `Sudoku Tagesrätsel (${size === 16 ? '16×16 Hex' : '9×9'}, ${dateStr})`,
        ...generated
    };
}

// === Source: js\puzzles\sudoku\data\tutorial.js ===
/**
 * Sudoku Grundlagen-Tutorial (10 Lektionen)
 * Führt schrittweise in Zeilen, Spalten, Blöcke, Notizen und 9×9 Klassik ein.
 */

const SUDOKU_TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Das Sudoku-Gitter",
        subtitle: "Zeilen & Zahlen",
        size: 4,
        initialGrid: [
            [1, 2, 3, 0],
            [3, 4, 1, 2],
            [2, 1, 4, 3],
            [4, 3, 2, 1]
        ],
        targetCells: [{ r: 0, c: 3, val: 4 }],
        description: "In jeder Zeile muss jede Zahl von 1 bis 4 genau einmal vorkommen. In der ersten Zeile fehlen noch: **4**.\n\nTippe auf das markierte Feld und wähle die **4**.",
        explanation: "Sehr gut! Jede Zeile darf keine doppelten Zahlen enthalten."
    },
    {
        id: 2,
        title: "2. Spalten-Regel",
        subtitle: "Senkrechte Vollständigkeit",
        size: 4,
        initialGrid: [
            [1, 2, 3, 4],
            [3, 0, 1, 2],
            [2, 1, 4, 3],
            [4, 3, 2, 1]
        ],
        targetCells: [{ r: 1, c: 1, val: 4 }],
        description: "Auch in jeder **Spalte** darf jede Ziffer nur einmal stehen. In Spalte 2 fehlt noch die **4**.",
        explanation: "Klasse! Zeilen und Spalten folgen demselben Ausschlussprinzip."
    },
    {
        id: 3,
        title: "3. 2×2 Block-Regel",
        subtitle: "Räumliche Einheiten",
        size: 4,
        initialGrid: [
            [1, 2, 3, 4],
            [3, 4, 1, 2],
            [2, 1, 4, 0],
            [4, 3, 2, 1]
        ],
        targetCells: [{ r: 2, c: 3, val: 3 }],
        description: "Jeder fett umrandete **2×2-Block** enthält ebenfalls alle Zahlen von 1 bis 4 genau einmal. Im unteren rechten Block fehlt noch die **3**.",
        explanation: "Perfekt! Die 3 Hauptregeln sind: Zeile, Spalte und Block."
    },
    {
        id: 4,
        title: "4. Naked Single (Eindeutiger Rest)",
        subtitle: "Kombiniertes Ausschließen",
        size: 4,
        initialGrid: [
            [1, 2, 3, 4],
            [0, 4, 1, 2],
            [2, 0, 4, 3],
            [4, 3, 2, 1]
        ],
        targetCells: [
            { r: 1, c: 0, val: 3 },
            { r: 2, c: 1, val: 1 }
        ],
        description: "Prüfe für jedes leere Feld die Peers (Zeile, Spalte und Block). Es bleibt jeweils nur eine einzige gültige Zahl übrig.",
        explanation: "Ausgezeichnet! Wenn nur noch eine Zahl erlaubt ist, spricht man vom 'Naked Single'."
    },
    {
        id: 5,
        title: "5. Hidden Single in Zeile",
        subtitle: "Wo kann die Zahl hin?",
        size: 4,
        initialGrid: [
            [0, 0, 1, 2],
            [1, 2, 3, 4],
            [2, 1, 4, 3],
            [4, 3, 2, 1]
        ],
        targetCells: [
            { r: 0, c: 0, val: 3 },
            { r: 0, c: 1, val: 4 }
        ],
        description: "In Zeile 1 fehlen 3 und 4. Da in Spalte 1 bereits eine 4 steht, kann die 4 nur in Feld (1,2) platziert werden.",
        explanation: "Genau! Manchmal schaut man nicht darauf, was in eine Zelle passt, sondern wo eine Zahl zwingend hin muss ('Hidden Single')."
    },
    {
        id: 6,
        title: "6. Das klassische 9×9 Gitter",
        subtitle: "Zahlen 1 bis 9 & 3×3 Blöcke",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 0]
        ],
        targetCells: [{ r: 8, c: 8, val: 9 }],
        description: "Im klassischen 9×9 Sudoku nutzt man die Ziffern 1 bis 9 und 3×3-Blöcke. Setze die letzte fehlende Ziffer in der letzten Zeile: die **9**.",
        explanation: "Hervorragend! Das klassische 9×9 Sudoku funktioniert nach genau denselben Prinzipien."
    },
    {
        id: 7,
        title: "7. Hidden Single im 3×3 Block",
        subtitle: "Kreuzweises Scannen",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 0, 9]
        ],
        targetCells: [{ r: 8, c: 7, val: 7 }],
        description: "Finde die verbleibende Position für die **7** im unteren rechten Block.",
        explanation: "Perfekt! Cross-Hatching ermöglicht schnelles Finden von Hidden Singles."
    },
    {
        id: 8,
        title: "8. Notizen-System (Kandidaten)",
        subtitle: "Möglichkeiten festhalten",
        size: 4,
        initialGrid: [
            [1, 2, 3, 4],
            [3, 4, 1, 2],
            [2, 1, 0, 0],
            [4, 3, 2, 1]
        ],
        targetCells: [
            { r: 2, c: 2, val: 4 },
            { r: 2, c: 3, val: 3 }
        ],
        description: "Nutze den Notizen-Modus (Stift-Symbol), um mögliche Zahlen einzutragen und schrittweise zu eliminieren.",
        explanation: "Klasse! Notizen sind das wichtigste Werkzeug für anspruchsvolle Sudokus."
    },
    {
        id: 9,
        title: "9. Peer-Ausschluss im 9×9",
        subtitle: "Zeile, Spalte & Block gleichzeitig",
        size: 9,
        initialGrid: [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ],
        targetCells: [{ r: 0, c: 2, val: 4 }],
        description: "Betrachte Feld (1,3): In Zeile 1 stehen 5, 3, 7. In Spalte 3 stehen 8. Im Block stehen 5, 3, 6, 9, 8. Setze die logisch zwingende Ziffer.",
        explanation: "Stark gelöst!"
    },
    {
        id: 10,
        title: "10. Erstes komplettes 4×4 Rätsel",
        subtitle: "Alles zusammen anwenden",
        size: 4,
        initialGrid: [
            [0, 2, 0, 4],
            [3, 0, 1, 0],
            [0, 1, 0, 3],
            [4, 0, 2, 0]
        ],
        description: "Löse dieses 4×4 Rätsel vollständig mit allen erlernten Regeln.",
        explanation: "Fantastisch! Du hast die Sudoku-Grundlagen meisterhaft abgeschlossen!"
    }
];

// === Source: js\puzzles\sudoku\data\tutorial_advanced.js ===
/**
 * Sudoku Fortgeschrittenen-Tutorial (8 Lektionen)
 * Didaktische Einführung in 9×9 Meistertechniken & 16×16 Hexadezimal-Sudokus.
 */

const SUDOKU_TUTORIAL_ADVANCED_STEPS = [
    {
        id: 1,
        title: "1. Naked Pair (Offenes Paar)",
        subtitle: "Zwei Felder, dieselben zwei Zahlen",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [0, 4, 5, 2, 8, 6, 1, 7, 0]
        ],
        targetCells: [
            { r: 8, c: 0, val: 3 },
            { r: 8, c: 8, val: 9 }
        ],
        description: "Wenn zwei Felder in einer Zeile oder einem Block nur dieselben zwei Kandidaten haben, müssen diese dort stehen. Setze die fehlenden Zahlen in der letzten Zeile.",
        explanation: "Sehr gut! Das Naked Pair ist eine der wichtigsten fortgeschrittenen Techniken."
    },
    {
        id: 2,
        title: "2. Hidden Pair (Verstecktes Paar)",
        subtitle: "Zwei Zahlen an nur zwei Stellen",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 0, 3, 0],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [
            { r: 7, c: 6, val: 6 },
            { r: 7, c: 8, val: 5 }
        ],
        description: "Wenn zwei Ziffern in einer Zeile nur noch auf zwei Feldern platziert werden können, müssen sie dorthin.",
        explanation: "Ausgezeichnet verstanden!"
    },
    {
        id: 3,
        title: "3. Pointing Pair (Block → Zeile)",
        subtitle: "Gefangene Kandidaten",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 0, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [{ r: 8, c: 1, val: 4 }],
        description: "Liegen alle Kandidaten einer Zahl innerhalb eines Blocks auf derselben Zeile, darf diese Zahl nirgendwo sonst auf dieser Zeile außerhalb des Blocks vorkommen.",
        explanation: "Perfekt! Das nennt man 'Pointing Pair'."
    },
    {
        id: 4,
        title: "4. Box-Line Reduction (Linie → Block)",
        subtitle: "Umgekehrte Block-Ausrichtung",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 0, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [{ r: 4, c: 4, val: 5 }],
        description: "Wenn in einer Zeile eine Zahl nur innerhalb eines bestimmten Blocks vorkommen kann, kann sie nirgendwo sonst in diesem Block stehen.",
        explanation: "Klasse logische Kombination!"
    },
    {
        id: 5,
        title: "5. Naked Triple (Offenes Dreierpack)",
        subtitle: "3 Felder, 3 Zahlen",
        size: 9,
        initialGrid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [0, 0, 0, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [
            { r: 6, c: 0, val: 9 },
            { r: 6, c: 1, val: 6 },
            { r: 6, c: 2, val: 1 }
        ],
        description: "Drei Felder teilen sich eine Teilmenge aus 3 Ziffern. Löse die drei Felder im linken unteren Block.",
        explanation: "Hervorragend erkannt!"
    },
    {
        id: 6,
        title: "6. Das X-Wing Prinzip",
        subtitle: "Rechteck-Formationen in 2 Zeilen/Spalten",
        size: 9,
        initialGrid: [
            [0, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        targetCells: [{ r: 0, c: 0, val: 5 }],
        description: "Wenn eine Ziffer in genau zwei Zeilen an denselben beiden Spaltenpositionen auftritt, bildet sie ein Rechteck ('X-Wing'). Setze die fehlende Ziffer in der linken oberen Ecke.",
        explanation: "Das X-Wing-Muster ist eines der elegantesten Sudoku-Gesetze!"
    },
    {
        id: 7,
        title: "7. Vollständiges 9×9 Meisterstück",
        subtitle: "Klassische Deduktion",
        size: 9,
        initialGrid: [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ],
        description: "Löse dieses klassische 9×9 Sudoku vollständig mit logischer Deduktion und Notizen.",
        explanation: "Super! Du hast das 9×9 Sudoku meisterhaft gelöst!"
    },
    {
        id: 8,
        title: "8. 16×16 Hexadezimal-Sudoku",
        subtitle: "Werte 0 bis F & 4×4 Blöcke",
        size: 16,
        initialGrid: [
            [1,  2,  3,  4,   5,  6,  7,  8,   9, 10, 11, 12,  13, 14, 15,  0],
            [5,  6,  7,  8,   9, 10, 11, 12,  13, 14, 15, 16,   1,  2,  3,  4],
            [9, 10, 11, 12,  13, 14, 15, 16,   1,  2,  3,  4,   5,  6,  7,  8],
            [13, 14, 15, 16,  1,  2,  3,  4,   5,  6,  7,  8,   9, 10, 11, 12],

            [2,  3,  4,  1,   6,  7,  8,  5,  10, 11, 12,  9,  14, 15, 16, 13],
            [6,  7,  8,  5,  10, 11, 12,  9,  14, 15, 16, 13,   2,  3,  4,  1],
            [10, 11, 12,  9,  14, 15, 16, 13,   2,  3,  4,  1,   6,  7,  8,  5],
            [14, 15, 16, 13,   2,  3,  4,  1,   6,  7,  8,  5,  10, 11, 12,  9],

            [3,  4,  1,  2,   7,  8,  5,  6,  11, 12,  9, 10,  15, 16, 13, 14],
            [7,  8,  5,  6,  11, 12,  9, 10,  15, 16, 13, 14,   3,  4,  1,  2],
            [11, 12,  9, 10,  15, 16, 13, 14,   3,  4,  1,  2,   7,  8,  5,  6],
            [15, 16, 13, 14,   3,  4,  1,  2,   7,  8,  5,  6,  11, 12,  9, 10],

            [4,  1,  2,  3,   8,  5,  6,  7,  12,  9, 10, 11,  16, 13, 14, 15],
            [8,  5,  6,  7,  12,  9, 10, 11,  16, 13, 14, 15,   4,  1,  2,  3],
            [12,  9, 10, 11,  16, 13, 14, 15,   4,  1,  2,  3,   8,  5,  6,  7],
            [16, 13, 14, 15,   4,  1,  2,  3,   8,  5,  6,  7,  12,  9, 10, 11]
        ],
        targetCells: [{ r: 0, c: 15, val: 16 }],
        description: "Im gigantischen 16×16 Hexadezimal-Sudoku nutzt man die Werte **0 bis F** in 4×4-Blöcken. Setze den fehlenden Hex-Wert **F** (16. Wert) in Zeile 1!",
        explanation: "Hut ab! Du beherrschst nun alle Sudoku-Größen bis zum 16×16 Hexadezimal-Meister!"
    }
];

// === Source: js\puzzles\sudoku\index.js ===
/**
 * Sudoku Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Sudoku (4×4, 9×9, 16×16 Hexadezimal).
 */










const SudokuPlugin = {
    id: 'sudoku',
    name: 'Sudoku',
    icon: '🔢',
    description: 'Zahlen- & Hex-Logik mit Zeilen, Spalten & Blöcken',
    cssPath: './css/puzzles/sudoku.css',

    getSizes: () => [
        { id: 4, label: '4 × 4 (Mini)', gridSize: 4 },
        { id: 9, label: '9 × 9 (Klassisch)', gridSize: 9 },
        { id: 16, label: '16 × 16 (Hexadezimal)', gridSize: 16 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],

    getInputConfig: () => ({
        type: 'keypad',
        allowKeypad: true,
        keys: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, SUDOKU_EMPTY]
    }),

    createEngine: (size = 9) => new SudokuEngine(size),
    generatePuzzle: (opts) => SudokuGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => SudokuSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => SudokuRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => SudokuRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass, size) => SudokuRenderer.getSymbolSvg(val, extraClass, size),

    getHint: (engine, options) => SudokuSolver.findLogicalHint(engine, options),
    getRules: (lang) => SudokuRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Einsteiger', levelRange: [0, 29], desc: '4×4 Mini Grundlagen' },
            { id: 1, name: 'Klassisch Leicht', levelRange: [30, 59], desc: '9×9 Einstieg & Entspannung' },
            { id: 2, name: 'Klassisch Meister', levelRange: [60, 89], desc: '9×9 Fortgeschrittene Deduktion' },
            { id: 3, name: 'Hexadezimal', levelRange: [90, 119], desc: '9×9 Meister & 16×16 Hex-Giganten' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getSudokuCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getSudokuDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: SUDOKU_TUTORIAL_STEPS, badge: '10 Lektionen' },
            { id: 'advanced', name: 'Fortgeschritten', steps: SUDOKU_TUTORIAL_ADVANCED_STEPS, badge: '8 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => SUDOKU_I18N[lang] || {}
};

// === Source: js\puzzles\tango\engine.js ===
/**
 * Tango Game Engine
 * Repräsentiert das Spielfeld, Zellwerte, Kantenbedingungen und Validierungsregeln.
 */

const EMPTY = 0;
const SUN = 1;   // ☀️
const MOON = 2;  // 🌙

const EDGE_NONE = 0;
const EDGE_EQUAL = 1;     // = (Müssen identisch sein)
const EDGE_OPPOSITE = 2;  // × (Müssen gegenteilig sein)

class TangoEngine {
    constructor(size = 6) {
        this.size = size;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        
        // Horizontale Kanten: size x (size - 1)
        this.hEdges = Array(size).fill(0).map(() => Array(size - 1).fill(EDGE_NONE));
        // Vertikale Kanten: (size - 1) x size
        this.vEdges = Array(size - 1).fill(0).map(() => Array(size).fill(EDGE_NONE));
        
        // Notizen (Bleistiftmodus): Set pro Zelle
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));

        // History für Undo / Redo
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Setzt das Spielfeld auf die Ausgangsbelegung zurück
     */
    restart() {
        this.grid = this.initialGrid.map(row => [...row]);
        this.notes = Array(this.size).fill(0).map(() => Array(this.size).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Lädt ein Level mit vorgegebenen Zellen und Kanten
     */
    loadPuzzle({ size, initialGrid, hEdges, vEdges, solution }) {
        this.size = size;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.initialGrid = Array(size).fill(0).map(() => Array(size).fill(EMPTY));
        this.locked = Array(size).fill(0).map(() => Array(size).fill(false));
        this.notes = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new Set()));
        this.undoStack = [];
        this.redoStack = [];
        this.solution = solution ? solution.map(row => [...row]) : null;

        this.hEdges = hEdges ? hEdges.map(row => [...row]) : Array(size).fill(0).map(() => Array(size - 1).fill(EDGE_NONE));
        this.vEdges = vEdges ? vEdges.map(row => [...row]) : Array(size - 1).fill(0).map(() => Array(size).fill(EDGE_NONE));

        if (initialGrid) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (initialGrid[r][c] !== EMPTY) {
                        this.grid[r][c] = initialGrid[r][c];
                        this.initialGrid[r][c] = initialGrid[r][c];
                        this.locked[r][c] = true;
                    }
                }
            }
        }
    }

    /**
     * Gibt die Lösung des aktuellen Puzzles zurück oder berechnet sie
     */
    getSolution() {
        if (this.solution) return this.solution;
        if (typeof TangoSolver !== 'undefined' && TangoSolver.solve) {
            const sol = TangoSolver.solve(this, 1);
            if (sol && sol.length > 0) {
                this.solution = sol[0].map(row => [...row]);
                return this.solution;
            }
        }
        return null;
    }

    /**
     * Findet Fehler im bisherigen Lösungsweg des Spielers:
     * 1. Regelverletzungen (z. B. 3er-Reihe, Kantenkonflikt, Balance-Überschreitung)
     * 2. Abweichungen von der echten Lösung (grid[r][c] !== solution[r][c])
     */
    findMistakes() {
        const sol = this.getSolution();
        const ruleCheck = this.validateRules();

        // 1. Priorität: Direkte Regelverletzungen
        if (!ruleCheck.isValid && ruleCheck.errors.length > 0) {
            const firstErr = ruleCheck.errors[0];
            const conflictArr = Array.from(ruleCheck.conflictCells || []).map(str => {
                const [r, c] = str.split(',').map(Number);
                return { r, c };
            });

            let targetCell = conflictArr.find(pos => !this.locked[pos.r][pos.c]) || conflictArr[0];
            if (!targetCell && firstErr.cells && firstErr.cells.length > 0) {
                targetCell = firstErr.cells.find(pos => !this.locked[pos.r][pos.c]) || firstErr.cells[0];
            }
            if (!targetCell && firstErr.row !== undefined && firstErr.cols) {
                targetCell = { r: firstErr.row, c: firstErr.cols.find(c => !this.locked[firstErr.row][c]) ?? firstErr.cols[0] };
            }
            if (!targetCell && firstErr.col !== undefined && firstErr.rows) {
                targetCell = { r: firstErr.rows.find(r => !this.locked[r][firstErr.col]) ?? firstErr.rows[0], c: firstErr.col };
            }

            const r = targetCell ? targetCell.r : 0;
            const c = targetCell ? targetCell.c : 0;
            const expectedVal = sol ? sol[r][c] : (this.grid[r][c] === SUN ? MOON : SUN);

            return {
                type: 'rule_violation',
                strategy: 'Regelverstoß korrigieren',
                title: 'Regelverstoß korrigieren',
                r, c,
                currentVal: this.grid[r][c],
                value: expectedVal,
                expectedVal,
                highlightCells: conflictArr.length > 0 ? conflictArr : [{ r, c }],
                message: `Regelverstoß: ${firstErr.message}. Bitte korrigiere oder entferne das Symbol an Position (${r + 1},${c + 1}).`
            };
        }

        // 2. Priorität: Vom Spieler gesetzte Felder, die nicht zur Gesamtlösung passen
        if (sol) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const current = this.grid[r][c];
                    if (current !== EMPTY && !this.locked[r][c] && current !== sol[r][c]) {
                        const wrongName = current === SUN ? 'Sonne' : 'Mond';
                        const correctName = sol[r][c] === SUN ? 'Sonne' : 'Mond';
                        return {
                            type: 'solution_mismatch',
                            strategy: 'Fehlerhaftes Symbol korrigieren',
                            title: 'Fehlerhaftes Symbol korrigieren',
                            r, c,
                            currentVal: current,
                            value: sol[r][c],
                            expectedVal: sol[r][c],
                            highlightCells: [{ r, c }],
                            message: `Fehler im Lösungsweg: An Position (${r + 1},${c + 1}) wurde fälschlicherweise ein ${wrongName} gesetzt. Laut der Logik und Abhängigkeiten gehört dort ein ${correctName} hin.`
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Setzt den Wert einer Zelle mit Undo-Unterstützung
     */
    setCellValue(r, c, val, isNote = false) {
        if (this.locked[r][c]) return false;

        if (isNote) {
            // Notiz umschalten
            const cellNotes = this.notes[r][c];
            const prevNotes = new Set(cellNotes);
            if (cellNotes.has(val)) {
                cellNotes.delete(val);
            } else {
                cellNotes.add(val);
            }
            this.undoStack.push({
                type: 'note',
                r, c,
                prevNotes,
                nextNotes: new Set(cellNotes)
            });
            this.redoStack = [];
            return true;
        }

        const prevVal = this.grid[r][c];
        const prevNotes = new Set(this.notes[r][c]);

        // Keine Änderung und keine Notizen zu löschen -> abbrechen
        if (prevVal === val && prevNotes.size === 0) return false;

        this.undoStack.push({
            type: 'cell',
            r, c,
            prevVal,
            nextVal: val,
            prevNotes
        });
        this.redoStack = [];

        this.grid[r][c] = val;
        // Im normalen Spielmodus Notizen der Zelle immer leeren
        this.notes[r][c].clear();
        return true;
    }

    /**
     * Schaltet Notizen einer Zelle durch:
     * Keine Notiz -> ☀️ (Sonne) -> 🌙 (Mond) -> ☀️🌙 (Beide) -> Leer (Löschen)
     */
    cycleNoteValue(r, c) {
        if (this.locked[r][c]) return null;

        // Falls ein fester Wert vorhanden war, diesen leeren
        if (this.grid[r][c] !== EMPTY) {
            this.setCellValue(r, c, EMPTY);
        }

        const cellNotes = this.notes[r][c];
        const prevNotes = new Set(cellNotes);
        const hasSun = cellNotes.has(SUN);
        const hasMoon = cellNotes.has(MOON);

        let nextNotes = new Set();
        if (!hasSun && !hasMoon) {
            nextNotes.add(SUN);
        } else if (hasSun && !hasMoon) {
            nextNotes.add(MOON);
        } else if (!hasSun && hasMoon) {
            nextNotes.add(SUN);
            nextNotes.add(MOON);
        } else {
            // Beide aktiv -> Löschen (leere Notizen)
            nextNotes = new Set();
        }

        this.notes[r][c] = new Set(nextNotes);
        this.undoStack.push({
            type: 'note',
            r, c,
            prevNotes,
            nextNotes: new Set(nextNotes)
        });
        this.redoStack = [];
        return nextNotes;
    }

    /**
     * Schaltet den Wert einer Zelle durch: EMPTY -> SUN -> MOON -> EMPTY
     */
    cycleCellValue(r, c) {
        if (this.locked[r][c]) return null;
        const current = this.grid[r][c];
        let next;
        if (current === EMPTY) next = SUN;
        else if (current === SUN) next = MOON;
        else next = EMPTY;
        this.setCellValue(r, c, next);
        return next;
    }

    undo() {
        if (this.undoStack.length === 0) return null;
        const action = this.undoStack.pop();
        this.redoStack.push(action);

        if (action.type === 'cell') {
            this.grid[action.r][action.c] = action.prevVal;
            this.notes[action.r][action.c] = new Set(action.prevNotes);
        } else if (action.type === 'note') {
            this.notes[action.r][action.c] = new Set(action.prevNotes);
        }
        return action;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();
        this.undoStack.push(action);

        if (action.type === 'cell') {
            this.grid[action.r][action.c] = action.nextVal;
        } else if (action.type === 'note') {
            this.notes[action.r][action.c] = new Set(action.nextNotes);
        }
        return action;
    }

    /**
     * Prüft alle Regeln und gibt eine strukturierte Liste an Fehlern zurück
     */
    validateRules() {
        const errors = [];
        const maxPerLine = this.size / 2;
        const conflictCells = new Set();

        // 1. Regel: Keine drei gleichen Symbole hintereinander
        // Horizontal
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size - 2; c++) {
                const v1 = this.grid[r][c], v2 = this.grid[r][c+1], v3 = this.grid[r][c+2];
                if (v1 !== EMPTY && v1 === v2 && v2 === v3) {
                    conflictCells.add(`${r},${c}`);
                    conflictCells.add(`${r},${c+1}`);
                    conflictCells.add(`${r},${c+2}`);
                    errors.push({
                        rule: 'three_in_a_row',
                        orientation: 'horizontal',
                        row: r,
                        cols: [c, c+1, c+2],
                        symbol: v1,
                        message: `Drei gleiche Symbole hintereinander in Zeile ${r+1}`
                    });
                }
            }
        }

        // Vertikal
        for (let c = 0; c < this.size; c++) {
            for (let r = 0; r < this.size - 2; r++) {
                const v1 = this.grid[r][c], v2 = this.grid[r+1][c], v3 = this.grid[r+2][c];
                if (v1 !== EMPTY && v1 === v2 && v2 === v3) {
                    conflictCells.add(`${r},${c}`);
                    conflictCells.add(`${r+1},${c}`);
                    conflictCells.add(`${r+2},${c}`);
                    errors.push({
                        rule: 'three_in_a_row',
                        orientation: 'vertical',
                        col: c,
                        rows: [r, r+1, r+2],
                        symbol: v1,
                        message: `Drei gleiche Symbole untereinander in Spalte ${c+1}`
                    });
                }
            }
        }

        // 2. Regel: Balance (Maximal N/2 Sonnen und Monde)
        // Zeilen
        for (let r = 0; r < this.size; r++) {
            let suns = 0, moons = 0;
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === SUN) suns++;
                else if (this.grid[r][c] === MOON) moons++;
            }
            if (suns > maxPerLine) {
                for (let c = 0; c < this.size; c++) if (this.grid[r][c] === SUN) conflictCells.add(`${r},${c}`);
                errors.push({
                    rule: 'balance',
                    type: 'row',
                    index: r,
                    symbol: SUN,
                    count: suns,
                    max: maxPerLine,
                    message: `Zu viele Sonnen in Zeile ${r+1} (${suns}/${maxPerLine})`
                });
            }
            if (moons > maxPerLine) {
                for (let c = 0; c < this.size; c++) if (this.grid[r][c] === MOON) conflictCells.add(`${r},${c}`);
                errors.push({
                    rule: 'balance',
                    type: 'row',
                    index: r,
                    symbol: MOON,
                    count: moons,
                    max: maxPerLine,
                    message: `Zu viele Monde in Zeile ${r+1} (${moons}/${maxPerLine})`
                });
            }
        }

        // Spalten
        for (let c = 0; c < this.size; c++) {
            let suns = 0, moons = 0;
            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] === SUN) suns++;
                else if (this.grid[r][c] === MOON) moons++;
            }
            if (suns > maxPerLine) {
                for (let r = 0; r < this.size; r++) if (this.grid[r][c] === SUN) conflictCells.add(`${r},${c}`);
                errors.push({
                    rule: 'balance',
                    type: 'col',
                    index: c,
                    symbol: SUN,
                    count: suns,
                    max: maxPerLine,
                    message: `Zu viele Sonnen in Spalte ${c+1} (${suns}/${maxPerLine})`
                });
            }
            if (moons > maxPerLine) {
                for (let r = 0; r < this.size; r++) if (this.grid[r][c] === MOON) conflictCells.add(`${r},${c}`);
                errors.push({
                    rule: 'balance',
                    type: 'col',
                    index: c,
                    symbol: MOON,
                    count: moons,
                    max: maxPerLine,
                    message: `Zu viele Monde in Spalte ${c+1} (${moons}/${maxPerLine})`
                });
            }
        }

        // 3. Regel: Kantenbedingungen (= und ×)
        // Horizontale Kanten
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size - 1; c++) {
                const edge = this.hEdges[r][c];
                if (edge === EDGE_NONE) continue;
                const v1 = this.grid[r][c], v2 = this.grid[r][c+1];
                if (v1 !== EMPTY && v2 !== EMPTY) {
                    if (edge === EDGE_EQUAL && v1 !== v2) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${r},${c+1}`);
                        errors.push({
                            rule: 'edge_constraint',
                            edgeType: '=',
                            cells: [{r, c}, {r, c: c+1}],
                            message: `Gleichheitszeichen (=) zwischen (${r+1},${c+1}) und (${r+1},${c+2}) verletzt`
                        });
                    } else if (edge === EDGE_OPPOSITE && v1 === v2) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${r},${c+1}`);
                        errors.push({
                            rule: 'edge_constraint',
                            edgeType: '×',
                            cells: [{r, c}, {r, c: c+1}],
                            message: `Gegenteilszeichen (×) zwischen (${r+1},${c+1}) und (${r+1},${c+2}) verletzt`
                        });
                    }
                }
            }
        }

        // Vertikale Kanten
        for (let r = 0; r < this.size - 1; r++) {
            for (let c = 0; c < this.size; c++) {
                const edge = this.vEdges[r][c];
                if (edge === EDGE_NONE) continue;
                const v1 = this.grid[r][c], v2 = this.grid[r+1][c];
                if (v1 !== EMPTY && v2 !== EMPTY) {
                    if (edge === EDGE_EQUAL && v1 !== v2) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${r+1},${c}`);
                        errors.push({
                            rule: 'edge_constraint',
                            edgeType: '=',
                            cells: [{r, c}, {r: r+1, c}],
                            message: `Gleichheitszeichen (=) zwischen (${r+1},${c+1}) und (${r+2},${c+1}) verletzt`
                        });
                    } else if (edge === EDGE_OPPOSITE && v1 === v2) {
                        conflictCells.add(`${r},${c}`);
                        conflictCells.add(`${r+1},${c}`);
                        errors.push({
                            rule: 'edge_constraint',
                            edgeType: '×',
                            cells: [{r, c}, {r: r+1, c}],
                            message: `Gegenteilszeichen (×) zwischen (${r+1},${c+1}) und (${r+2},${c+1}) verletzt`
                        });
                    }
                }
            }
        }

        // 4. Regel: Keine identischen Zeilen / Spalten (nur wenn voll)
        const rowStrings = [];
        for (let r = 0; r < this.size; r++) {
            const isFull = this.grid[r].every(v => v !== EMPTY);
            if (isFull) {
                const str = this.grid[r].join('');
                rowStrings.push({ r, str });
            }
        }
        for (let i = 0; i < rowStrings.length; i++) {
            for (let j = i + 1; j < rowStrings.length; j++) {
                if (rowStrings[i].str === rowStrings[j].str) {
                    for (let c = 0; c < this.size; c++) {
                        conflictCells.add(`${rowStrings[i].r},${c}`);
                        conflictCells.add(`${rowStrings[j].r},${c}`);
                    }
                    errors.push({
                        rule: 'unique_rows',
                        rows: [rowStrings[i].r, rowStrings[j].r],
                        message: `Zeilen ${rowStrings[i].r + 1} und ${rowStrings[j].r + 1} sind identisch`
                    });
                }
            }
        }

        const colStrings = [];
        for (let c = 0; c < this.size; c++) {
            let isFull = true;
            let str = '';
            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] === EMPTY) {
                    isFull = false;
                    break;
                }
                str += this.grid[r][c];
            }
            if (isFull) {
                colStrings.push({ c, str });
            }
        }
        for (let i = 0; i < colStrings.length; i++) {
            for (let j = i + 1; j < colStrings.length; j++) {
                if (colStrings[i].str === colStrings[j].str) {
                    for (let r = 0; r < this.size; r++) {
                        conflictCells.add(`${r},${colStrings[i].c}`);
                        conflictCells.add(`${r},${colStrings[j].c}`);
                    }
                    errors.push({
                        rule: 'unique_cols',
                        cols: [colStrings[i].c, colStrings[j].c],
                        message: `Spalten ${colStrings[i].c + 1} und ${colStrings[j].c + 1} sind identisch`
                    });
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            conflictCells
        };
    }

    /**
     * Prüft, ob das Board vollständig und fehlerfrei gelöst ist
     */
    isCompleted() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === EMPTY) return false;
            }
        }
        const val = this.validateRules();
        return val.isValid;
    }

    getFilledCount() {
        let count = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== EMPTY) count++;
            }
        }
        return count;
    }

    getTotalCells() {
        return this.size * this.size;
    }
}

// === Source: js\puzzles\tango\solver.js ===
/**
 * Tango Solver & Hint Engine
 * Findet logische Züge mit verständlichen deutschen Erklärungen
 * und validiert die Eindeutigkeit von Rätseln via Backtracking.
 */



class TangoSolver {
    /**
     * Sucht den strategisch besten nächsten logisch zwingenden Schritt.
     * Sammelt alle verfügbaren logischen Züge, bewertet sie nach Kaskaden-Tiefe,
     * Engpass-Bedeutung und optionalem Spieler-Fokus, und gibt den besten Tipp zurück.
     * 
     * @param {TangoEngine} engine
     * @param {Object} [options={}]
     * @param {{r: number, c: number}|null} [options.focusCell=null]
     */
    static findLogicalHint(engine, options = {}) {
        const mistakes = engine.findMistakes ? engine.findMistakes() : null;
        if (mistakes) return mistakes;

        const size = engine.size;
        const maxPerLine = size / 2;
        const grid = engine.grid;
        const candidates = [];

        // 1. Logik-Schritt: Zwei gleiche Symbole nebeneinander -> Kanten müssen das Gegenteil sein
        // Horizontal: [S, S, _] -> [S, S, M] oder [_, S, S] -> [M, S, S]
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                const v = grid[r][c];
                if (v !== EMPTY && v === grid[r][c+1]) {
                    const opposite = v === SUN ? MOON : SUN;
                    const symName = v === SUN ? 'Sonnen' : 'Monde';
                    const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                    // Links daneben
                    if (c > 0 && grid[r][c-1] === EMPTY) {
                        candidates.push({
                            type: 'avoid_three',
                            r, c: c - 1,
                            value: opposite,
                            highlightCells: [{r, c: c-1}, {r, c}, {r, c: c+1}],
                            message: `In Zeile ${r+1} stehen zwei ${symName} nebeneinander. Um eine Dreierreihe zu verhindern, muss links davon ein ${oppName} stehen.`
                        });
                    }
                    // Rechts daneben
                    if (c + 2 < size && grid[r][c+2] === EMPTY) {
                        candidates.push({
                            type: 'avoid_three',
                            r, c: c + 2,
                            value: opposite,
                            highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                            message: `In Zeile ${r+1} stehen zwei ${symName} nebeneinander. Um eine Dreierreihe zu verhindern, muss rechts davon ein ${oppName} stehen.`
                        });
                    }
                }
            }
        }

        // Vertikal: [S, S, _]^T
        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 1; r++) {
                const v = grid[r][c];
                if (v !== EMPTY && v === grid[r+1][c]) {
                    const opposite = v === SUN ? MOON : SUN;
                    const symName = v === SUN ? 'Sonnen' : 'Monde';
                    const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                    // Oben drüber
                    if (r > 0 && grid[r-1][c] === EMPTY) {
                        candidates.push({
                            type: 'avoid_three',
                            r: r - 1, c,
                            value: opposite,
                            highlightCells: [{r: r-1, c}, {r, c}, {r: r+1, c}],
                            message: `In Spalte ${c+1} stehen zwei ${symName} untereinander. Um eine Dreierreihe zu verhindern, muss darüber ein ${oppName} stehen.`
                        });
                    }
                    // Unten drunter
                    if (r + 2 < size && grid[r+2][c] === EMPTY) {
                        candidates.push({
                            type: 'avoid_three',
                            r: r + 2, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                            message: `In Spalte ${c+1} stehen zwei ${symName} untereinander. Um eine Dreierreihe zu verhindern, muss darunter ein ${oppName} stehen.`
                        });
                    }
                }
            }
        }

        // 2. Logik-Schritt: Lücke zwischen zwei gleichen Symbolen (S, _, S) -> Mitte muss Gegenteil sein
        // Horizontal
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 2; c++) {
                const v1 = grid[r][c], v2 = grid[r][c+1], v3 = grid[r][c+2];
                if (v1 !== EMPTY && v1 === v3 && v2 === EMPTY) {
                    const opposite = v1 === SUN ? MOON : SUN;
                    const symName = v1 === SUN ? 'Sonnen' : 'Monde';
                    const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                    candidates.push({
                        type: 'sandwich',
                        r, c: c + 1,
                        value: opposite,
                        highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                        message: `In Zeile ${r+1} umschließen zwei ${symName} ein leeres Feld. Um drei gleiche Symbole zu vermeiden, muss in die Mitte ein ${oppName}.`
                    });
                }
            }
        }

        // Vertikal
        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 2; r++) {
                const v1 = grid[r][c], v2 = grid[r+1][c], v3 = grid[r+2][c];
                if (v1 !== EMPTY && v1 === v3 && v2 === EMPTY) {
                    const opposite = v1 === SUN ? MOON : SUN;
                    const symName = v1 === SUN ? 'Sonnen' : 'Monde';
                    const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                    candidates.push({
                        type: 'sandwich',
                        r: r + 1, c,
                        value: opposite,
                        highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                        message: `In Spalte ${c+1} umschließen zwei ${symName} ein leeres Feld. Um drei gleiche Symbole zu vermeiden, muss in die Mitte ein ${oppName}.`
                    });
                }
            }
        }

        // 3. Logik-Schritt: Kantenbedingungen (= und ×) mit direkt bekanntem Nachbarn
        // Horizontale Kanten
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                const edge = engine.hEdges[r][c];
                if (edge === EDGE_NONE) continue;
                const v1 = grid[r][c], v2 = grid[r][c+1];
                if (v1 !== EMPTY && v2 === EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v1 : (v1 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    candidates.push({
                        type: 'edge_direct',
                        r, c: c + 1,
                        value: targetVal,
                        highlightCells: [{r, c}, {r, c: c+1}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+1},${c+2}) bestimmt, dass rechts ein ${targetName} gesetzt werden muss.`
                    });
                } else if (v1 === EMPTY && v2 !== EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v2 : (v2 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    candidates.push({
                        type: 'edge_direct',
                        r, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r, c: c+1}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+1},${c+2}) bestimmt, dass links ein ${targetName} gesetzt werden muss.`
                    });
                }
            }
        }

        // Vertikale Kanten
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                const edge = engine.vEdges[r][c];
                if (edge === EDGE_NONE) continue;
                const v1 = grid[r][c], v2 = grid[r+1][c];
                if (v1 !== EMPTY && v2 === EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v1 : (v1 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    candidates.push({
                        type: 'edge_direct',
                        r: r + 1, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r: r+1, c}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+2},${c+1}) bestimmt, dass darunter ein ${targetName} gesetzt werden muss.`
                    });
                } else if (v1 === EMPTY && v2 !== EMPTY) {
                    const targetVal = (edge === EDGE_EQUAL) ? v2 : (v2 === SUN ? MOON : SUN);
                    const targetName = targetVal === SUN ? 'Sonne' : 'Mond';
                    const relName = edge === EDGE_EQUAL ? 'Gleichheitszeichen (=)' : 'Gegenteilszeichen (×)';
                    candidates.push({
                        type: 'edge_direct',
                        r, c,
                        value: targetVal,
                        highlightCells: [{r, c}, {r: r+1, c}],
                        message: `Das ${relName} zwischen (${r+1},${c+1}) und (${r+2},${c+1}) bestimmt, dass darüber ein ${targetName} gesetzt werden muss.`
                    });
                }
            }
        }

        // 4. Logik-Schritt: Zeilen- / Spalten-Vollständigkeit (Balance-Auffüllung)
        // Zeilen
        for (let r = 0; r < size; r++) {
            let suns = 0, moons = 0;
            const emptyCols = [];
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === SUN) suns++;
                else if (grid[r][c] === MOON) moons++;
                else emptyCols.push(c);
            }
            if (emptyCols.length > 0) {
                if (suns === maxPerLine) {
                    for (const c of emptyCols) {
                        candidates.push({
                            type: 'balance_fill',
                            r, c,
                            value: MOON,
                            highlightCells: emptyCols.map(col => ({r, c: col})),
                            message: `In Zeile ${r+1} sind bereits alle ${maxPerLine} Sonnen gesetzt. Alle restlichen leeren Felder müssen daher Monde sein.`
                        });
                    }
                }
                if (moons === maxPerLine) {
                    for (const c of emptyCols) {
                        candidates.push({
                            type: 'balance_fill',
                            r, c,
                            value: SUN,
                            highlightCells: emptyCols.map(col => ({r, c: col})),
                            message: `In Zeile ${r+1} sind bereits alle ${maxPerLine} Monde gesetzt. Alle restlichen leeren Felder müssen daher Sonnen sein.`
                        });
                    }
                }
            }
        }

        // Spalten
        for (let c = 0; c < size; c++) {
            let suns = 0, moons = 0;
            const emptyRows = [];
            for (let r = 0; r < size; r++) {
                if (grid[r][c] === SUN) suns++;
                else if (grid[r][c] === MOON) moons++;
                else emptyRows.push(r);
            }
            if (emptyRows.length > 0) {
                if (suns === maxPerLine) {
                    for (const r of emptyRows) {
                        candidates.push({
                            type: 'balance_fill',
                            r, c,
                            value: MOON,
                            highlightCells: emptyRows.map(row => ({r: row, c})),
                            message: `In Spalte ${c+1} sind bereits alle ${maxPerLine} Sonnen gesetzt. Alle restlichen leeren Felder müssen daher Monde sein.`
                        });
                    }
                }
                if (moons === maxPerLine) {
                    for (const r of emptyRows) {
                        candidates.push({
                            type: 'balance_fill',
                            r, c,
                            value: SUN,
                            highlightCells: emptyRows.map(row => ({r: row, c})),
                            message: `In Spalte ${c+1} sind bereits alle ${maxPerLine} Monde gesetzt. Alle restlichen leeren Felder müssen daher Sonnen sein.`
                        });
                    }
                }
            }
        }

        // 5. Fortgeschrittene Kanten-Logik (Horizontale & Vertikale Kaskaden)
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                if (engine.hEdges[r][c] === EDGE_EQUAL) {
                    // Links daneben ausgefüllt
                    if (c > 0 && grid[r][c-1] !== EMPTY && grid[r][c] === EMPTY && grid[r][c+1] === EMPTY) {
                        const vPrev = grid[r][c-1];
                        const opposite = vPrev === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const prevName = vPrev === SUN ? 'Sonne' : 'Mond';
                        candidates.push({
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r, c: c-1}, {r, c}, {r, c: c+1}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r+1},${c}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                        candidates.push({
                            type: 'edge_cascade',
                            r, c: c + 1,
                            value: opposite,
                            highlightCells: [{r, c: c-1}, {r, c}, {r, c: c+1}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r+1},${c}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                    }
                    // Rechts daneben ausgefüllt
                    if (c + 2 < size && grid[r][c+2] !== EMPTY && grid[r][c] === EMPTY && grid[r][c+1] === EMPTY) {
                        const vNext = grid[r][c+2];
                        const opposite = vNext === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const nextName = vNext === SUN ? 'Sonne' : 'Mond';
                        candidates.push({
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${nextName} wie an (${r+1},${c+3}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                        candidates.push({
                            type: 'edge_cascade',
                            r, c: c + 1,
                            value: opposite,
                            highlightCells: [{r, c}, {r, c: c+1}, {r, c: c+2}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+1},${c+2}) ein '=' steht, sind beide gleich. Wären sie eine ${nextName} wie an (${r+1},${c+3}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                    }
                }
            }
        }

        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 1; r++) {
                if (engine.vEdges[r][c] === EDGE_EQUAL) {
                    // Oben drüber ausgefüllt
                    if (r > 0 && grid[r-1][c] !== EMPTY && grid[r][c] === EMPTY && grid[r+1][c] === EMPTY) {
                        const vPrev = grid[r-1][c];
                        const opposite = vPrev === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const prevName = vPrev === SUN ? 'Sonne' : 'Mond';
                        candidates.push({
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r: r-1, c}, {r, c}, {r: r+1, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                        candidates.push({
                            type: 'edge_cascade',
                            r: r + 1, c,
                            value: opposite,
                            highlightCells: [{r: r-1, c}, {r, c}, {r: r+1, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${prevName} wie an (${r},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                    }
                    // Unten drunter ausgefüllt
                    if (r + 2 < size && grid[r+2][c] !== EMPTY && grid[r][c] === EMPTY && grid[r+1][c] === EMPTY) {
                        const vNext = grid[r+2][c];
                        const opposite = vNext === SUN ? MOON : SUN;
                        const oppName = opposite === SUN ? 'Sonne' : 'Mond';
                        const nextName = vNext === SUN ? 'Sonne' : 'Mond';
                        candidates.push({
                            type: 'edge_cascade',
                            r, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${nextName} wie an (${r+3},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                        candidates.push({
                            type: 'edge_cascade',
                            r: r + 1, c,
                            value: opposite,
                            highlightCells: [{r, c}, {r: r+1, c}, {r: r+2, c}],
                            message: `Kanten-Kaskade: Da an (${r+1},${c+1}) und (${r+2},${c+1}) ein '=' steht, sind beide gleich. Wären sie eine ${nextName} wie an (${r+3},${c+1}), entstünde eine 3er-Reihe. Daher müssen beide ein ${oppName} sein!`
                        });
                    }
                }
            }
        }

        // 6. Zeilen- & Spalten-Duplikat Ausschluss (Unizitäts-Beweis)
        // Zeilen-Unizität
        for (let r1 = 0; r1 < size; r1++) {
            const isFull1 = grid[r1].every(v => v !== EMPTY);
            if (!isFull1) continue;
            const str1 = grid[r1].join('');

            for (let r2 = 0; r2 < size; r2++) {
                if (r1 === r2) continue;
                const emptyIndices = [];
                for (let c = 0; c < size; c++) {
                    if (grid[r2][c] === EMPTY) emptyIndices.push(c);
                }
                if (emptyIndices.length === 1 || emptyIndices.length === 2) {
                    for (const candVal of [SUN, MOON]) {
                        const testRow = [...grid[r2]];
                        testRow[emptyIndices[0]] = candVal;
                        if (emptyIndices.length === 2) {
                            const remainingVal = candVal === SUN ? MOON : SUN;
                            testRow[emptyIndices[1]] = remainingVal;
                        }
                        if (testRow.join('') === str1) {
                            const oppVal = candVal === SUN ? MOON : SUN;
                            const oppName = oppVal === SUN ? 'Sonne' : 'Mond';
                            const candName = candVal === SUN ? 'Sonne' : 'Mond';
                            candidates.push({
                                type: 'row_uniqueness',
                                r: r2, c: emptyIndices[0],
                                value: oppVal,
                                highlightCells: [{r: r1, c: 0}, {r: r2, c: emptyIndices[0]}],
                                message: `Unizitäts-Axiom: Würde an Position (${r2+1},${emptyIndices[0]+1}) ein ${candName} gesetzt, würde Zeile ${r2+1} exakt identisch zu Zeile ${r1+1} werden! Um ein Zeilen-Duplikat zu verhindern, muss dort ein ${oppName} stehen.`
                            });
                        }
                    }
                }
            }
        }

        // Spalten-Unizität
        for (let c1 = 0; c1 < size; c1++) {
            let isFull1 = true;
            let str1 = '';
            for (let r = 0; r < size; r++) {
                if (grid[r][c1] === EMPTY) { isFull1 = false; break; }
                str1 += grid[r][c1];
            }
            if (!isFull1) continue;

            for (let c2 = 0; c2 < size; c2++) {
                if (c1 === c2) continue;
                const emptyIndices = [];
                for (let r = 0; r < size; r++) {
                    if (grid[r][c2] === EMPTY) emptyIndices.push(r);
                }
                if (emptyIndices.length === 1 || emptyIndices.length === 2) {
                    for (const candVal of [SUN, MOON]) {
                        const testCol = [];
                        for (let r = 0; r < size; r++) testCol.push(grid[r][c2]);
                        testCol[emptyIndices[0]] = candVal;
                        if (emptyIndices.length === 2) {
                            const remainingVal = candVal === SUN ? MOON : SUN;
                            testCol[emptyIndices[1]] = remainingVal;
                        }
                        if (testCol.join('') === str1) {
                            const oppVal = candVal === SUN ? MOON : SUN;
                            const oppName = oppVal === SUN ? 'Sonne' : 'Mond';
                            const candName = candVal === SUN ? 'Sonne' : 'Mond';
                            candidates.push({
                                type: 'col_uniqueness',
                                r: emptyIndices[0], c: c2,
                                value: oppVal,
                                highlightCells: [{r: 0, c: c1}, {r: emptyIndices[0], c: c2}],
                                message: `Unizitäts-Axiom: Würde an Position (${emptyIndices[0]+1},${c2+1}) ein ${candName} gesetzt, würde Spalte ${c2+1} exakt identisch zu Spalte ${c1+1} werden! Um ein Spalten-Duplikat zu verhindern, muss dort ein ${oppName} stehen.`
                            });
                        }
                    }
                }
            }
        }

        // --- Strategische Bewertung und Deduplizierung aller Kandidaten ---
        if (candidates.length > 0) {
            const cellMap = new Map();
            const priorityOrder = ['edge_cascade', 'row_uniqueness', 'col_uniqueness', 'sandwich', 'avoid_three', 'edge_direct', 'balance_fill'];

            for (const cand of candidates) {
                const key = `${cand.r},${cand.c}`;
                if (!cellMap.has(key)) {
                    cellMap.set(key, { ...cand, deductionCount: 1 });
                } else {
                    const existing = cellMap.get(key);
                    existing.deductionCount++;
                    if (priorityOrder.indexOf(cand.type) < priorityOrder.indexOf(existing.type)) {
                        existing.type = cand.type;
                        existing.highlightCells = cand.highlightCells;
                        existing.message = cand.message;
                    }
                }
            }

            const uniqueCandidates = Array.from(cellMap.values());
            uniqueCandidates.forEach(cand => {
                cand._score = TangoSolver.computeHintScore(cand, engine, options) + (cand.deductionCount - 1) * 8;
            });

            uniqueCandidates.sort((a, b) => b._score - a._score);
            const best = uniqueCandidates[0];
            delete best._score;
            delete best.deductionCount;
            const typeTitles = {
                'avoid_three': 'Dreierreihe verhindern',
                'sandwich': 'Lücke füllen (Sandwich)',
                'balance_fill': 'Reihen-Balance',
                'line_balance': 'Reihen-Balance',
                'edge_equal': 'Gleichheits-Kante (=)',
                'edge_opposite': 'Gegenteils-Kante (×)',
                'edge_direct': 'Kanten-Deduktion',
                'edge_cascade': 'Kanten-Kaskade',
                'row_uniqueness': 'Eindeutige Zeile',
                'col_uniqueness': 'Eindeutige Spalte',
                'proof_by_contradiction': 'Widerspruchs-Beweis',
                'advanced_deduction': 'Logische Deduktion'
            };
            best.strategy = best.strategy || typeTitles[best.type] || 'Logischer Schritt';
            best.title = best.title || best.strategy;
            return best;
        }

        // 7. Ausführlicher Widerspruchs-Beweis (Widerspruchs-Test auf jedem leeren Feld)
        const contradictionCandidates = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === EMPTY) {
                    for (const testVal of [SUN, MOON]) {
                        grid[r][c] = testVal;
                        const check = engine.validateRules();
                        grid[r][c] = EMPTY; // Rückgängig machen

                        if (!check.isValid && check.errors && check.errors.length > 0) {
                            const err = check.errors[0];
                            const correctVal = testVal === SUN ? MOON : SUN;
                            const correctName = correctVal === SUN ? 'Sonne' : 'Mond';
                            const wrongName = testVal === SUN ? 'Sonne' : 'Mond';
                            contradictionCandidates.push({
                                type: 'proof_by_contradiction',
                                strategy: 'Widerspruchs-Beweis',
                                title: 'Widerspruchs-Beweis',
                                r, c,
                                value: correctVal,
                                highlightCells: [{r, c}],
                                message: `Widerspruchs-Beweis: Würde an Position (${r+1},${c+1}) ein ${wrongName} gesetzt, führte dies sofort zu einem Regelverstoß (${err.message}). Daher MUSS an Position (${r+1},${c+1}) ein ${correctName} stehen!`
                            });
                        }
                    }
                }
            }
        }

        if (contradictionCandidates.length > 0) {
            contradictionCandidates.forEach(cand => {
                cand._score = TangoSolver.computeHintScore(cand, engine, options);
            });
            contradictionCandidates.sort((a, b) => b._score - a._score);
            const best = contradictionCandidates[0];
            delete best._score;
            best.strategy = best.strategy || 'Widerspruchs-Beweis';
            best.title = best.title || best.strategy;
            return best;
        }

        // 8. Letzte Absicherung via Solver-Ergebnis mit strategischer Positionsauswahl
        const sol = TangoSolver.solve(engine);
        if (sol && sol.length > 0) {
            const firstSol = sol[0];
            const fallbackCandidates = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === EMPTY) {
                        const val = firstSol[r][c];
                        const name = val === SUN ? 'Sonne' : 'Mond';
                        fallbackCandidates.push({
                            type: 'advanced_deduction',
                            strategy: 'Logische Schlussfolgerung',
                            title: 'Logische Schlussfolgerung',
                            r, c,
                            value: val,
                            highlightCells: [{r, c}],
                            message: `Tiefe Ausschluss-Logik: Aus der Gesamtschau der Zeilen-, Spalten- und Kanten-Abhängigkeiten folgt zwingend ein ${name} an Position (${r+1},${c+1}).`
                        });
                    }
                }
            }

            if (fallbackCandidates.length > 0) {
                fallbackCandidates.forEach(cand => {
                    cand._score = TangoSolver.computeHintScore(cand, engine, options);
                });
                fallbackCandidates.sort((a, b) => b._score - a._score);
                const best = fallbackCandidates[0];
                delete best._score;
                best.strategy = best.strategy || 'Logische Schlussfolgerung';
                best.title = best.title || best.strategy;
                return best;
            }
        }

        return null;
    }

    /**
     * Berechnet den strategischen Wert eines Hinweises.
     * Berücksichtigt Kaskaden-Effekt (Anzahl neuer Folgeschritte), Engpässe,
     * Kanten-Constraints und optionalen Spieler-Fokus.
     */
    static computeHintScore(candidate, engine, options = {}) {
        let score = 0;
        const size = engine.size;
        const grid = engine.grid;
        const { r, c, value, type } = candidate;
        const focusCell = options.focusCell;

        // 1. Kaskaden-Tiefe: Simuliere den Zug und zähle neue sofortige Folgeschritte
        grid[r][c] = value;
        const followUps = TangoSolver._countTrivialFollowUps(engine, r, c);
        grid[r][c] = EMPTY; // Rückgängig machen
        score += Math.min(followUps * 12, 60);

        // 2. Engpass-Bonus: Zeilen / Spalten, die fast voll sind
        let emptyInRow = 0, emptyInCol = 0;
        for (let i = 0; i < size; i++) {
            if (grid[r][i] === EMPTY) emptyInRow++;
            if (grid[i][c] === EMPTY) emptyInCol++;
        }
        if (emptyInRow === 1) score += 25;
        else if (emptyInRow === 2) score += 15;
        else if (emptyInRow === 3) score += 8;

        if (emptyInCol === 1) score += 25;
        else if (emptyInCol === 2) score += 15;
        else if (emptyInCol === 3) score += 8;

        // 3. Spieler-Fokus: Bonus für Nähe zur aktuell ausgewählten Zelle
        if (focusCell && typeof focusCell.r === 'number' && typeof focusCell.c === 'number') {
            const distR = Math.abs(r - focusCell.r);
            const distC = Math.abs(c - focusCell.c);
            const manhattanDist = distR + distC;

            if (r === focusCell.r && c === focusCell.c) {
                score += 35; // Exakte Zelle, die der Spieler anvisiert
            } else if (r === focusCell.r || c === focusCell.c) {
                score += 20; // Selbe Zeile oder Spalte des Spielers
            } else if (manhattanDist <= 2) {
                score += 12; // Unmittelbares Nachbarfeld
            }
        }

        // 4. Kanten-Bedeutung / Constraint-Hebel
        let adjacentEdges = 0;
        if (c > 0 && engine.hEdges[r][c - 1] !== EDGE_NONE) adjacentEdges++;
        if (c < size - 1 && engine.hEdges[r][c] !== EDGE_NONE) adjacentEdges++;
        if (r > 0 && engine.vEdges[r - 1][c] !== EDGE_NONE) adjacentEdges++;
        if (r < size - 1 && engine.vEdges[r][c] !== EDGE_NONE) adjacentEdges++;
        score += adjacentEdges * 8;

        // 5. Lehrreichere / stärkere Muster bevorzugen
        if (type === 'edge_cascade') score += 16;
        else if (type === 'row_uniqueness' || type === 'col_uniqueness') score += 20;
        else if (type === 'sandwich') score += 10;
        else if (type === 'avoid_three') score += 8;
        else if (type === 'edge_direct') score += 8;
        else if (type === 'balance_fill') {
            if (emptyInRow > 2 && emptyInCol > 2) {
                score -= 10;
            }
        }

        // 6. Zentralitäts-Bonus (innenliegende Felder verbinden mehr Achsen)
        if (r > 0 && r < size - 1 && c > 0 && c < size - 1) {
            score += 6;
        }

        return score;
    }

    /**
     * Zählt, wie viele leere Zellen durch das Setzen von (targetR, targetC)
     * unmittelbar durch Basisregeln lösbar werden.
     */
    static _countTrivialFollowUps(engine, targetR, targetC) {
        const size = engine.size;
        const maxPerLine = size / 2;
        const grid = engine.grid;
        const solvableCells = new Set();

        // 1. Dreierreihen-Vermeidung & Sandwich in betroffener Zeile targetR
        for (let c = 0; c < size; c++) {
            if (c < size - 1 && grid[targetR][c] !== EMPTY && grid[targetR][c] === grid[targetR][c+1]) {
                if (c > 0 && grid[targetR][c-1] === EMPTY) solvableCells.add(`${targetR},${c-1}`);
                if (c + 2 < size && grid[targetR][c+2] === EMPTY) solvableCells.add(`${targetR},${c+2}`);
            }
            if (c < size - 2 && grid[targetR][c] !== EMPTY && grid[targetR][c] === grid[targetR][c+2] && grid[targetR][c+1] === EMPTY) {
                solvableCells.add(`${targetR},${c+1}`);
            }
        }

        // 2. Dreierreihen-Vermeidung & Sandwich in betroffener Spalte targetC
        for (let r = 0; r < size; r++) {
            if (r < size - 1 && grid[r][targetC] !== EMPTY && grid[r][targetC] === grid[r+1][targetC]) {
                if (r > 0 && grid[r-1][targetC] === EMPTY) solvableCells.add(`${r-1},${targetC}`);
                if (r + 2 < size && grid[r+2][targetC] === EMPTY) solvableCells.add(`${r+2},${targetC}`);
            }
            if (r < size - 2 && grid[r][targetC] !== EMPTY && grid[r][targetC] === grid[r+2][targetC] && grid[r+1][targetC] === EMPTY) {
                solvableCells.add(`${r+1},${targetC}`);
            }
        }

        // 3. Direkte Kantenbedingungen in Zeile targetR
        for (let c = 0; c < size - 1; c++) {
            if (engine.hEdges[targetR][c] !== EDGE_NONE) {
                const v1 = grid[targetR][c], v2 = grid[targetR][c+1];
                if (v1 !== EMPTY && v2 === EMPTY) solvableCells.add(`${targetR},${c+1}`);
                else if (v1 === EMPTY && v2 !== EMPTY) solvableCells.add(`${targetR},${c}`);
            }
        }

        // 4. Direkte Kantenbedingungen in Spalte targetC
        for (let r = 0; r < size - 1; r++) {
            if (engine.vEdges[r][targetC] !== EDGE_NONE) {
                const v1 = grid[r][targetC], v2 = grid[r+1][targetC];
                if (v1 !== EMPTY && v2 === EMPTY) solvableCells.add(`${r+1},${targetC}`);
                else if (v1 === EMPTY && v2 !== EMPTY) solvableCells.add(`${r},${targetC}`);
            }
        }

        // 5. Balance in Zeile targetR
        let sunsR = 0, moonsR = 0;
        for (let c = 0; c < size; c++) {
            if (grid[targetR][c] === SUN) sunsR++;
            else if (grid[targetR][c] === MOON) moonsR++;
        }
        if (sunsR === maxPerLine || moonsR === maxPerLine) {
            for (let c = 0; c < size; c++) {
                if (grid[targetR][c] === EMPTY) solvableCells.add(`${targetR},${c}`);
            }
        }

        // 6. Balance in Spalte targetC
        let sunsC = 0, moonsC = 0;
        for (let r = 0; r < size; r++) {
            if (grid[r][targetC] === SUN) sunsC++;
            else if (grid[r][targetC] === MOON) moonsC++;
        }
        if (sunsC === maxPerLine || moonsC === maxPerLine) {
            for (let r = 0; r < size; r++) {
                if (grid[r][targetC] === EMPTY) solvableCells.add(`${r},${targetC}`);
            }
        }

        solvableCells.delete(`${targetR},${targetC}`);
        return solvableCells.size;
    }

    /**
     * Backtracking Solver zur Ermittlung aller Lösungen
     */
    static solve(engine, maxSolutions = 2) {
        const size = engine.size;
        const solutions = [];
        const grid = engine.grid.map(row => [...row]);
        const hEdges = engine.hEdges;
        const vEdges = engine.vEdges;
        const maxPerLine = size / 2;

        function isValid(r, c) {
            // Horizontal 3 in a row
            for (let i = Math.max(0, c - 2); i <= Math.min(c, size - 3); i++) {
                const v1 = grid[r][i], v2 = grid[r][i+1], v3 = grid[r][i+2];
                if (v1 !== EMPTY && v1 === v2 && v2 === v3) return false;
            }
            // Vertical 3 in a row
            for (let i = Math.max(0, r - 2); i <= Math.min(r, size - 3); i++) {
                const v1 = grid[i][c], v2 = grid[i+1][c], v3 = grid[i+2][c];
                if (v1 !== EMPTY && v1 === v2 && v2 === v3) return false;
            }
            // Row balance
            let suns = 0, moons = 0;
            for (let j = 0; j < size; j++) {
                if (grid[r][j] === SUN) suns++;
                else if (grid[r][j] === MOON) moons++;
            }
            if (suns > maxPerLine || moons > maxPerLine) return false;

            // Col balance
            suns = 0; moons = 0;
            for (let i = 0; i < size; i++) {
                if (grid[i][c] === SUN) suns++;
                else if (grid[i][c] === MOON) moons++;
            }
            if (suns > maxPerLine || moons > maxPerLine) return false;

            // Horizontal edges for cell (r, c)
            if (c > 0 && hEdges[r][c-1] !== EDGE_NONE && grid[r][c-1] !== EMPTY) {
                const edge = hEdges[r][c-1];
                if (edge === EDGE_EQUAL && grid[r][c-1] !== grid[r][c]) return false;
                if (edge === EDGE_OPPOSITE && grid[r][c-1] === grid[r][c]) return false;
            }
            if (c < size - 1 && hEdges[r][c] !== EDGE_NONE && grid[r][c+1] !== EMPTY) {
                const edge = hEdges[r][c];
                if (edge === EDGE_EQUAL && grid[r][c] !== grid[r][c+1]) return false;
                if (edge === EDGE_OPPOSITE && grid[r][c] === grid[r][c+1]) return false;
            }

            // Vertical edges for cell (r, c)
            if (r > 0 && vEdges[r-1][c] !== EDGE_NONE && grid[r-1][c] !== EMPTY) {
                const edge = vEdges[r-1][c];
                if (edge === EDGE_EQUAL && grid[r-1][c] !== grid[r][c]) return false;
                if (edge === EDGE_OPPOSITE && grid[r-1][c] === grid[r][c]) return false;
            }
            if (r < size - 1 && vEdges[r][c] !== EDGE_NONE && grid[r+1][c] !== EMPTY) {
                const edge = vEdges[r][c];
                if (edge === EDGE_EQUAL && grid[r][c] !== grid[r+1][c]) return false;
                if (edge === EDGE_OPPOSITE && grid[r][c] === grid[r+1][c]) return false;
            }

            return true;
        }

        function backtrack(idx) {
            if (solutions.length >= maxSolutions) return;
            if (idx === size * size) {
                // Check duplicate rows/cols
                const rowStrs = new Set();
                for (let r = 0; r < size; r++) {
                    rowStrs.add(grid[r].join(''));
                }
                if (rowStrs.size !== size) return;

                const colStrs = new Set();
                for (let c = 0; c < size; c++) {
                    let colStr = '';
                    for (let r = 0; r < size; r++) colStr += grid[r][c];
                    colStrs.add(colStr);
                }
                if (colStrs.size !== size) return;

                solutions.push(grid.map(row => [...row]));
                return;
            }

            const r = Math.floor(idx / size);
            const c = idx % size;

            if (grid[r][c] !== EMPTY) {
                backtrack(idx + 1);
            } else {
                for (const val of [SUN, MOON]) {
                    grid[r][c] = val;
                    if (isValid(r, c)) {
                        backtrack(idx + 1);
                    }
                    grid[r][c] = EMPTY;
                }
            }
        }

        backtrack(0);
        return solutions;
    }
}

// === Source: js\puzzles\tango\generator.js ===
/**
 * Tango Puzzle Generator
 * Erzeugt prozedural eindeutig lösbare Tango-Rätsel verschiedener Größen und Schwierigkeitsgrade.
 */




class TangoGenerator {
    /**
     * Erzeugt einen deterministischen Pseudo-Zufallszahlengenerator aus einem Seed
     */
    static seededRandom(seed) {
        let s = seed;
        return function() {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    /**
     * Erzeugt ein volles, gültiges Lösungs-Board
     */
    static generateFullBoard(size, rng = Math.random) {
        const engine = new TangoEngine(size);
        const maxPerLine = size / 2;
        const grid = engine.grid;

        // Finde ein valides volles Board per randomisiertem Backtracking
        function fill(r, c) {
            if (r === size) {
                // Prüfe Zeilen-Duplikate
                const rowStrs = new Set();
                for (let i = 0; i < size; i++) rowStrs.add(grid[i].join(''));
                if (rowStrs.size !== size) return false;

                // Prüfe Spalten-Duplikate
                const colStrs = new Set();
                for (let j = 0; j < size; j++) {
                    let colStr = '';
                    for (let i = 0; i < size; i++) colStr += grid[i][j];
                    colStrs.add(colStr);
                }
                if (colStrs.size !== size) return false;

                return true;
            }

            const nextR = (c + 1 < size) ? r : r + 1;
            const nextC = (c + 1 < size) ? c + 1 : 0;

            const values = rng() > 0.5 ? [SUN, MOON] : [MOON, SUN];
            for (const val of values) {
                grid[r][c] = val;

                // Validierung
                let valid = true;
                // Horizontal 3 in a row
                if (c >= 2 && grid[r][c-1] === val && grid[r][c-2] === val) valid = false;
                // Vertical 3 in a row
                if (valid && r >= 2 && grid[r-1][c] === val && grid[r-2][c] === val) valid = false;

                // Row balance
                if (valid) {
                    let cnt = 0;
                    for (let j = 0; j <= c; j++) if (grid[r][j] === val) cnt++;
                    if (cnt > maxPerLine) valid = false;
                }
                // Col balance
                if (valid) {
                    let cnt = 0;
                    for (let i = 0; i <= r; i++) if (grid[i][c] === val) cnt++;
                    if (cnt > maxPerLine) valid = false;
                }

                if (valid && fill(nextR, nextC)) return true;
                grid[r][c] = EMPTY;
            }
            return false;
        }

        fill(0, 0);
        return grid.map(row => [...row]);
    }

    /**
     * Erstellt ein spielbares Puzzle mit eindeutiger Lösung
     */
    static generatePuzzle({ size = 6, difficulty = 'medium', seed = null }) {
        const rng = seed !== null ? TangoGenerator.seededRandom(seed) : Math.random;
        const fullSolution = TangoGenerator.generateFullBoard(size, rng);

        // Kanten-Kandidaten aus der Lösung extrahieren
        const hEdges = Array(size).fill(0).map(() => Array(size - 1).fill(EDGE_NONE));
        const vEdges = Array(size - 1).fill(0).map(() => Array(size).fill(EDGE_NONE));

        const hEdgePositions = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                hEdgePositions.push({ r, c, type: 'h' });
            }
        }
        const vEdgePositions = [];
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                vEdgePositions.push({ r, c, type: 'v' });
            }
        }

        // Shuffle Kantenpositionen
        hEdgePositions.sort(() => rng() - 0.5);
        vEdgePositions.sort(() => rng() - 0.5);

        // Bestimme Kantenanzahl je nach Schwierigkeit
        let maxEdges;
        let targetClues;
        if (size === 4) {
            maxEdges = difficulty === 'easy' ? 4 : 2;
            targetClues = difficulty === 'easy' ? 4 : 2;
        } else if (size === 6) {
            maxEdges = difficulty === 'easy' ? 8 : (difficulty === 'medium' ? 5 : 3);
            targetClues = difficulty === 'easy' ? 10 : (difficulty === 'medium' ? 6 : 4);
        } else if (size === 8) {
            maxEdges = difficulty === 'medium' ? 10 : 6;
            targetClues = difficulty === 'medium' ? 14 : 10;
        } else {
            maxEdges = 14;
            targetClues = 18;
        }

        let edgeCount = 0;
        for (const pos of [...hEdgePositions, ...vEdgePositions]) {
            if (edgeCount >= maxEdges) break;
            if (pos.type === 'h') {
                const v1 = fullSolution[pos.r][pos.c];
                const v2 = fullSolution[pos.r][pos.c + 1];
                const edgeType = (v1 === v2) ? EDGE_EQUAL : EDGE_OPPOSITE;
                // Leichte Tendenz zu '=' da es visuell intuitiv ist
                if (rng() > 0.4 || edgeType === EDGE_EQUAL) {
                    hEdges[pos.r][pos.c] = edgeType;
                    edgeCount++;
                }
            } else {
                const v1 = fullSolution[pos.r][pos.c];
                const v2 = fullSolution[pos.r + 1][pos.c];
                const edgeType = (v1 === v2) ? EDGE_EQUAL : EDGE_OPPOSITE;
                if (rng() > 0.4 || edgeType === EDGE_EQUAL) {
                    vEdges[pos.r][pos.c] = edgeType;
                    edgeCount++;
                }
            }
        }

        // Starte mit allen Zellen aus der Lösung und entferne schrittweise Felder
        const puzzleGrid = fullSolution.map(row => [...row]);
        const testEngine = new TangoEngine(size);
        testEngine.loadPuzzle({ size, initialGrid: puzzleGrid, hEdges, vEdges });

        // Erstelle eine Zufallsreihenfolge aller Zellen
        const cells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                cells.push({ r, c });
            }
        }
        cells.sort(() => rng() - 0.5);

        let currentClues = size * size;
        for (const cell of cells) {
            if (currentClues <= targetClues) break;
            const origVal = puzzleGrid[cell.r][cell.c];
            puzzleGrid[cell.r][cell.c] = EMPTY;

            testEngine.loadPuzzle({ size, initialGrid: puzzleGrid, hEdges, vEdges });
            const solutions = TangoSolver.solve(testEngine, 2);

            // Wenn das Rätsel mehrdeutig wird, stelle das Feld wieder her
            if (solutions.length !== 1) {
                puzzleGrid[cell.r][cell.c] = origVal;
            } else {
                currentClues--;
            }
        }

        return {
            size,
            initialGrid: puzzleGrid,
            solution: fullSolution,
            hEdges,
            vEdges,
            difficulty
        };
    }
}

// === Source: js\puzzles\tango\renderer.js ===
/**
 * Tango Visual Renderer
 * Zeichnet das Gitter, Kantenbedingungen, Sonnen-, Mond- und Geistersymbole.
 */






function getSunSvg(extraClass = '') {
    return `<svg class="tango-symbol tango-sun ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="1.6" x2="12" y2="3.8"/><line x1="12" y1="20.2" x2="12" y2="22.4"/><line x1="1.6" y1="12" x2="3.8" y2="12"/><line x1="20.2" y1="12" x2="22.4" y2="12"/><line x1="4.6" y1="4.6" x2="6.2" y2="6.2"/><line x1="17.8" y1="17.8" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.2" y2="17.8"/><line x1="17.8" y1="6.2" x2="19.4" y2="4.6"/></g></svg>`;
}

function getMoonSvg(extraClass = '') {
    return `<svg class="tango-symbol tango-moon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 12.5A9.5 9.5 0 1 1 11.5 2.5a7.5 7.5 0 0 0 10 10z" fill="currentColor"/></svg>`;
}

class TangoRenderer {
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

// === Source: js\puzzles\tango\data\levels.js ===
/**
 * Tango Level & Tagesrätsel-Generierung
 */




function getTangoCampaignLevel(levelIndex) {
    // Bestimme Gittergröße und Schwierigkeitsgrad nach Level-Fortschritt (120 Level in 4 Kapiteln)
    let size, difficulty;
    if (levelIndex < 10) {
        // Kapitel 1: Level 1–10 (4×4 Einfach)
        size = 4;
        difficulty = 'easy';
    } else if (levelIndex < 20) {
        // Kapitel 1: Level 11–20 (6×6 Einfach)
        size = 6;
        difficulty = 'easy';
    } else if (levelIndex < 30) {
        // Kapitel 1: Level 21–30 (6×6 Mittel)
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 45) {
        // Kapitel 2: Level 31–45 (6×6 Mittel)
        size = 6;
        difficulty = 'medium';
    } else if (levelIndex < 60) {
        // Kapitel 2: Level 46–60 (6×6 Schwer)
        size = 6;
        difficulty = 'hard';
    } else if (levelIndex < 75) {
        // Kapitel 3: Level 61–75 (8×8 Mittel)
        size = 8;
        difficulty = 'medium';
    } else if (levelIndex < 90) {
        // Kapitel 3: Level 76–90 (8×8 Schwer)
        size = 8;
        difficulty = 'hard';
    } else if (levelIndex < 105) {
        // Kapitel 4: Level 91–105 (8×8 Meister)
        size = 8;
        difficulty = 'hard';
    } else {
        // Kapitel 4: Level 106–120 (10×10 Meister)
        size = 10;
        difficulty = 'hard';
    }

    // Deterministischer Seed pro Level
    const seed = 5000 + (levelIndex + 1) * 113;
    const generated = TangoGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: levelIndex + 1,
        tier: difficulty,
        name: `Level ${levelIndex + 1}`,
        ...generated
    };
}

/**
 * Erzeugt das synchrone Tagesrätsel basierend auf dem Datum (JJJJ-MM-TT)
 */
function getTangoDailyPuzzle(dateStr) {
    // Wandle Datum in Integer-Seed um (z.B. "2026-08-21" -> 20260821)
    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    // Wähle Größe je nach Wochentag (Wochenende = 8x8, Werktags = 6x6)
    const date = new Date(dateStr);
    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
    const size = isWeekend ? 8 : 6;
    const difficulty = isWeekend ? 'hard' : 'medium';

    const generated = TangoGenerator.generatePuzzle({ size, difficulty, seed });
    return {
        id: `daily_${dateStr}`,
        date: dateStr,
        name: `Tagesrätsel (${dateStr})`,
        ...generated
    };
}

// === Source: js\puzzles\tango\data\tutorial.js ===
/**
 * Tango Interaktives Tutorial
 * 6 aufeinander aufbauende Lektionen mit detaillierter deutscher Erklärung
 */



const TUTORIAL_STEPS = [
    {
        id: 1,
        title: "1. Sonne ☀️ & Mond 🌙",
        subtitle: "Die Grundlagen und Steuerung",
        description: `Willkommen bei **Tango**!\n\nDein Ziel ist es, das Gitter mit **Sonnen (☀️)** und **Monden (🌙)** zu füllen.\n\n**Bedienung**:\n- **1× Tippen** = **Sonne ☀️**\n- **2× Tippen oder gedrückt halten** = **Mond 🌙**\n- **3× Tippen** = **Löschen**\n\n*Aufgabe: Setze auf das markierte Feld oben links eine Sonne und daneben einen Mond.*`,
        size: 4,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, SUN, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 0, val: SUN}, {r: 0, c: 1, val: MOON}],
        explanation: "Perfekt! Du hast die Steuerung verinnerlicht."
    },
    {
        id: 2,
        title: "2. Regel: Keine 3er-Reihen",
        subtitle: "Vermeide drei gleiche Symbole in einer Reihe",
        description: `Weder waagerecht noch senkrecht dürfen **mehr als zwei gleiche Symbole** aufeinanderfolgen (kein ☀️☀️☀️ und kein 🌙🌙🌙).\n\n1. Stehen **zwei Sonnen** nebeneinander (☀️☀️_), muss das nächste Feld ein **Mond 🌙** sein.\n2. Umschließen zwei Monde eine Lücke (🌙_🌙), muss dazwischen eine **Sonne ☀️** stehen.\n\n*Aufgabe: Verhindere die 3er-Reihen in Zeile 1 und Zeile 3.*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, MOON, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 2, val: MOON}, {r: 2, c: 1, val: SUN}],
        explanation: "Hervorragend! Du hast erfolgreich Dreierreihen verhindert."
    },
    {
        id: 3,
        title: "3. Regel: Balance (Gleiche Anzahl)",
        subtitle: "Jede Zeile und Spalte hat genau gleich viele Sonnen und Monde",
        description: `In einem 4×4 Gitter müssen in jeder Zeile und jeder Spalte **genau 2 Sonnen und 2 Monde** vorkommen (bei 6×6 sind es 3 und 3).\n\nWenn in einer Reihe bereits alle Sonnen gesetzt sind, müssen alle restlichen freien Felder Monde sein!\n\n*Aufgabe: Vervollständige die erste Zeile und die erste Spalte.*`,
        size: 4,
        initialGrid: [
            [SUN, MOON, SUN, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 3, val: MOON}, {r: 3, c: 0, val: MOON}],
        explanation: "Klasse! Zeilen- und Spalten-Balance ist das Herzstück des Spiels."
    },
    {
        id: 4,
        title: "4. Abhängigkeit: Das Gleichheitszeichen =",
        subtitle: "Verbundene Zellen haben dasselbe Symbol",
        description: `Ein **` + '=' + `** zwischen zwei Feldern bedeutet, dass beide Felder **exakt dasselbe Symbol** tragen müssen.\n\n- Ist ein Feld eine **Sonne ☀️**, muss das verbundene Feld ebenfalls eine **Sonne ☀️** sein.\n- Ist ein Feld ein **Mond 🌙**, muss das verbundene Feld ebenfalls ein **Mond 🌙** sein.\n\n*Aufgabe: Nutze das Gleichheitszeichen, um die rechten Felder auszufüllen.*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: SUN}, {r: 1, c: 1, val: MOON}],
        explanation: "Sehr gut! Das Gleichheitszeichen koppelt zwei Zellen direkt aneinander."
    },
    {
        id: 5,
        title: "5. Abhängigkeit: Das Gegenteilszeichen ×",
        subtitle: "Verbundene Zellen müssen unterschiedlich sein",
        description: `Ein **×** zwischen zwei Feldern bedeutet, dass die beiden Felder **unterschiedliche Symbole** tragen müssen.\n\n- Ist ein Feld eine **Sonne ☀️**, ist das Partnerfeld ein **Mond 🌙**.\n- Ist ein Feld ein **Mond 🌙**, ist das Partnerfeld eine **Sonne ☀️**.\n\n*Aufgabe: Nutze die ×-Markierung, um die Partnerfelder zu bestimmen.*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 2, c: 2, val: SUN}],
        explanation: "Exzellent! Mit dem Gegenteilszeichen lassen sich Paare sofort auflösen."
    },
    {
        id: 6,
        title: "6. Meisterprüfung: Erstes volles Rätsel",
        subtitle: "Kombiniere alle Regeln zum Lösen dieses 4×4 Gitters",
        description: `Jetzt kennst du alle Regeln:\n1. **Keine 3er-Reihen** (weder ☀️☀️☀️ noch 🌙🌙🌙)\n2. **Balance** (2 Sonnen & 2 Monde pro Zeile und Spalte)\n3. **= (Gleich)** & **× (Gegenteil)**\n\n*Aufgabe: Löse dieses komplette 4×4 Rätsel von Anfang bis Ende!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, SUN, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [MOON, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: null, // Muss komplett gelöst werden
        explanation: "Herzlichen Glückwunsch! Du hast das Tutorial gemeistert und bist bereit für die Kampagne und das tägliche Rätsel!"
    }
];

// === Source: js\puzzles\tango\data\tutorial_patterns.js ===
/**
 * Tango Tutorial Regelmäßigkeiten & Meister-Muster
 * Tiefgehende Lektionen zu feldgrößenspezifischen Gesetzen,
 * 1-5-Regel, Doppel-Inversion, Lookahead-Sperre, 2D-Interferenz,
 * Domino-Zerlegungen, Paar-Budgets und Unizitäts-Axiomen.
 */



const TUTORIAL_PATTERNS_STEPS = [
    {
        id: 1,
        title: "Muster 1: 4×4 Paar-Inversion",
        subtitle: "Budget-Erschöpfung im Mini-Gitter",
        mathPrinciple: "4×4 Paar-Inversion: 2 Sonnen verbrauchen Zeilen-Budget ⟹ Rest = Monde",
        description: `**Das Prinzip (4×4)**:\nIn einem 4×4 Gitter dürfen in jeder Zeile und Spalte genau **2 Sonnen** und **2 Monde** stehen. Sobald ein Paar aus zwei gleichen Symbolen existiert (\`☀️ ☀️ _ _\`), MÜSSEN die verbleibenden beiden Felder zwingend das **gegenteilige Paar** (\`🌙 🌙\`) sein!\n\n**Mathematischer Beweis**:\nDas Zeilen-Budget beträgt maximal 2 Sonnen. Zwei Sonnen verbrauchen das gesamte Kontingent (2 - 2 = 0). Für die restlichen 2 Felder verbleiben ausschließlich Monde.\n\n*Übung: Fülle die verbleibenden Felder in Zeile 1 und Zeile 3 durch Paar-Inversion aus!*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 2, val: MOON },
            { r: 0, c: 3, val: MOON },
            { r: 2, c: 0, val: SUN },
            { r: 2, c: 1, val: SUN }
        ],
        explanation: "Exzellent! Im 4x4 Gitter kippt ein Paar sofort alle restlichen Felder ins Gegenteil."
    },
    {
        id: 2,
        title: "Muster 2: 6×6 Paar-Limit",
        subtitle: "Maximal ein Paar desselben Symbols pro Zeile",
        mathPrinciple: "6×6 Paar-Limit: Max. 1 Sonnen-Paar pro 6er-Reihe erlaubt",
        description: `**Das Prinzip (6×6)**:\nIn einer 6er-Reihe (3 Sonnen, 3 Monde) kann es **höchstens EIN Sonnen-Paar** (\`☀️ ☀️\`) und **höchstens EIN Mond-Paar** (\`🌙 🌙\`) geben, da zwei Paare bereits 2 + 2 = 4 Symbole erfordern würden.\n\n**Mathematischer Beweis**:\nIn Zeile 1 stehen bereits das Sonnen-Paar an Pos 1–2 und eine 3. Sonne an Pos 4 (\`☀️ ☀️ 🌙 ☀️ _ _\`). Das Sonnen-Budget von 3 ist komplett aufgebraucht! Das durch \`[=]\` verbundene Paar an Pos 5–6 MUSS zwingend ein Mond-Paar (\`🌙 🌙\`) sein.\n\n*Übung: Bestimme den Wert des [=] Paares an Position 5 und 6!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 4, val: MOON },
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Brillant kombiniert! Da 6x6 maximal 1 Sonnen-Paar erlaubt und alle 3 Sonnen platziert sind, muss das [=] Paar aus Monden bestehen."
    },
    {
        id: 3,
        title: "Muster 3: Die 1-5-Regel (Rand-Abstand)",
        subtitle: "Verhinderung von Dreierketten in der Zeilenmitte",
        mathPrinciple: "1-5-Regel: Pos 1 = Pos 5 = ☀️ ⟹ Pos 6 = 🌙 (Mitte 2-3-4 vor 🌙🌙🌙 geschützt)",
        description: `**Das Prinzip (6×6)**:\nTragen in einer 6er-Reihe **Position 1 und Position 5 dasselbe Symbol** (z. B. \`☀️ _ _ _ ☀️ _\`), MUSS **Position 6 zwingend das Gegenteil** (\`🌙\`) sein!\n\n**Mathematischer Beweis**:\nWürde man an Position 6 ebenfalls eine Sonne setzen, stünden an Pos 5 und 6 zwei Sonnen (\`☀️ ☀️\`). Zusammen mit Position 1 wären alle 3 Sonnen der Zeile verbraucht. Die verbleibenden 3 Felder in der Mitte (Pos 2, 3, 4) müssten alle Monde sein (\`🌙 🌙 🌙\`) – eine verbotene 3er-Kette! Folglich MUSS Position 6 ein Mond (\`🌙\`) sein.\n\n*Übung: Bestimme Feld 6 in Zeile 1 und Feld 1 in Zeile 3 mit der 1-5-Regel!*`,
        size: 6,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 5, val: MOON },
            { r: 2, c: 0, val: SUN }
        ],
        explanation: "Hervorragend! Die 1-5-Regel sichert das Außenfeld, ohne dass die 3 mittleren Felder bekannt sein müssen."
    },
    {
        id: 4,
        title: "Muster 4: Die doppelte [×]-Kaskade",
        subtitle: "Zwei Negationen heben sich auf: ¬(¬A) = A",
        mathPrinciple: "Doppel-Inversion: (A [×] B [×] C) ⟹ A = C (Außenfelder identisch)",
        description: `**Das Prinzip**:\nSind drei Felder hintereinander durch zwei Gegenteils-Kanten verbunden (\`A [×] B [×] C\`), sind die beiden **Außenfelder A und C immer exakt GLEICH**!\n\n**Mathematischer Beweis**:\nFeld B ist das Gegenteil von A. Feld C ist wiederum das Gegenteil von B. Die doppelte Negation hebt sich auf: Ist Feld A eine Sonne \`☀️\`, ist Feld B ein Mond \`🌙\` und Feld C zwingend wieder eine Sonne \`☀️\`.\n\n*Übung: Löse die Kette in Zeile 1 über die Doppel-Inversion auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: MOON },
            { r: 0, c: 2, val: SUN }
        ],
        explanation: "Perfekt! Bei [×][×] haben die Außenfelder stets denselben Wert."
    },
    {
        id: 5,
        title: "Muster 5: Der Kanten-Vorausschau-Ausschluss",
        subtitle: "Verhinderung von 3er-Reihen über Gleichheits-Kopplung",
        mathPrinciple: "Lookahead-Sperre: (_ = _) ☀️ ⟹ Paar MUSS 🌙🌙 sein (Schutz vor ☀️☀️☀️)",
        description: `**Das Prinzip**:\nLiegen zwei durch \`[=]\` verbundene leere Felder direkt neben einem bekannten Symbol (\`_ = _ ☀️\`), MÜSSEN beide leeren Felder sofort das **Gegenteil** (\`🌙 🌙\`) annehmen!\n\n**Mathematischer Beweis**:\nWürden die beiden verbundenen Felder Sonnen annehmen, entstünde mit der Nachbarsonne sofort die unzulässige 3er-Reihe \`☀️ ☀️ ☀️\`. Folglich muss das gekoppelte Paar zwingend aus zwei Monden (\`🌙 🌙\`) bestehen.\n\n*Übung: Bestimme die beiden verbundenen Felder in Zeile 1!*`,
        size: 4,
        initialGrid: [
            [EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 0, val: MOON },
            { r: 0, c: 1, val: MOON }
        ],
        explanation: "Brillant! Durch die Kanten-Vorausschau löst du das Paar sofort ohne Raten auf."
    },
    {
        id: 6,
        title: "Muster 6: 6×6 Domino-Zerlegung (3-Blöcke-×)",
        subtitle: "Globales Zähl-Axiom disjunkter Gegenteilspaare",
        mathPrinciple: "6×6 Domino-Parität: Zwei [×]-Blöcke binden 2☀️ + 2🌙 ⟹ Block 3 = 1☀️ + 1🌙",
        description: `**Das Prinzip (6×6)**:\nJede 6er-Reihe lässt sich in drei 2er-Blöcke unterteilen: (Pos 1–2), (Pos 3–4), (Pos 5–6). Jedes \`[×]\` auf einem Block bindet exakt 1 Sonne und 1 Mond.\n\n**Mathematischer Beweis**:\nLiegen auf zwei Blöcken \`[×]\`-Kanten, sind bereits 2 Sonnen und 2 Monde vergeben. Für den 3. Block verbleibt genau **1 Sonne und 1 Mond**. Ist ein Feld des 3. Blocks bekannt, folgt das Nachbarfeld sofort als Inversion!\n\n*Übung: Bestimme Feld 6 in Zeile 1 mit Hilfe der Domino-Zerlegung!*`,
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, EMPTY, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Perfekt! Die beiden [×]-Dominos verbrauchen 2 Sonnen & 2 Monde – Feld 6 muss der Gegenpart zu Feld 5 sein."
    },
    {
        id: 7,
        title: "Muster 7: Budget-Kanten-Inkompatibilität",
        subtitle: "Abgleich zwischen Rest-Budget und Kanten-Typ",
        mathPrinciple: "Paritäts-Filter: Rest-Budget 1☀️ + 1🌙 schließt [=] aus ⟹ Erzwingt [×]",
        description: `**Das Prinzip**:\nSind in einer 6er-Reihe bereits 2 Sonnen und 2 Monde gesetzt (\`☀️ ☀️ 🌙 🌙 _ _\`), verbleiben genau **1 Sonne und 1 Mond**.\n\n**Mathematischer Beweis**:\nAuf den letzten beiden Feldern kann niemals ein \`[=]\` liegen, da \`[=]\` zwei identische Symbole verlangt. Eine \`[×]\`-Kante hingegen passt exakt zum Rest-Budget. Ist Feld 6 durch die schneidende Spalte als Mond (\`🌙\`) festgelegt, folgt Feld 5 sofort als Sonne (\`☀️\`)!\n\n*Übung: Nutze die Gegenteilskante, um Zeile 1 zu vollenden!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, SUN],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, SUN],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 4, val: SUN },
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Perfekt kombiniert! Der Paritäts-Filter verbindet Zeilen-Budget und Kantenlogik nahtlos."
    },
    {
        id: 8,
        title: "Muster 8: 2D-Kanten-Kreuzung (Eck-Interferenz)",
        subtitle: "Gleichzeitige Kanten horizontal und vertikal",
        mathPrinciple: "2D-Interferenz: (x = y) horizontal ∧ (x × z) vertikal ⟹ y und z sind Gegenteile",
        description: `**Das Prinzip**:\nGeht von einem Feld $X$ eine horizontale \`[=]\`-Kante nach rechts und eine vertikale \`[×]\`-Kante nach unten, **müssen der rechte und der untere Nachbar untereinander immer GEGENTEILE sein**!\n\n**Mathematischer Beweis**:\nDer rechte Nachbar $Y$ hat denselben Wert wie $X$ ($Y = X$). Der untere Nachbar $Z$ hat den gegenteiligen Wert ($Z = \\text{Gegenteil von } X$). Folglich ist $Z$ immer das Gegenteil von $Y$.\n\n*Übung: Löse die Nachbarfelder der Ecke (0,0) auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: SUN },
            { r: 1, c: 0, val: MOON }
        ],
        explanation: "Exzellent! 2D-Kanten-Interferenz koppelt Zeilen und Spalten über Ecken."
    },
    {
        id: 9,
        title: "Muster 9: Rand-Dopplung & 3er-Restfeld",
        subtitle: "Verhinderung verdeckter 3er-Ketten",
        mathPrinciple: "Restfeld-Ausschluss: [☀️☀️ 🌙🌙 _ _] ⟹ Pos 5 = ☀️, Pos 6 = 🌙 (3er-Schutz)",
        description: `**Das Prinzip (6×6)**:\nSteht am Zeilenanfang ein Paar \`[☀️ ☀️ 🌙 🌙 _ _]\`, fehlen in der Zeile noch genau **1 Sonne und 1 Mond**.\n\n**Mathematischer Beweis**:\nWürde an Position 5 ein Mond gesetzt, stünden dort drei Monde (\`🌙 🌙 🌙\`). Um die verbotene 3er-Kette zu verhindern, MUSS Position 5 die verbleibende Sonne (\`☀️\`) und Position 6 der Mond (\`🌙\`) sein!\n\n*Übung: Verhindere die 3er-Kette im Restfeld von Zeile 1!*`,
        size: 6,
        initialGrid: [
            [SUN, SUN, MOON, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 4, val: SUN },
            { r: 0, c: 5, val: MOON }
        ],
        explanation: "Hervorragend! Durch das 3er-Verbot muss die verbleibende Sonne an Position 5 stehen."
    },
    {
        id: 10,
        title: "Muster 10: Das 14-Muster-Gesetz",
        subtitle: "Strikte Zeilen-Unizität in 6×6",
        mathPrinciple: "6×6 Eindeutigkeit: 14 Zeilenmuster ⟹ Duplikate strikt verboten",
        description: `**Das Prinzip (6×6)**:\nEs gibt mathematisch überhaupt nur **14 gültige Zeilenmuster** für ein 6er-Gitter. Da 6 Zeilen im Gitter vorkommen, ist die Wahrscheinlichkeit für Duplikate extrem hoch.\n\n**Mathematischer Beweis**:\nZeile 1 ist \`☀️ 🌙 ☀️ 🌙 🌙 ☀️\`. Zeile 2 beginnt mit \`☀️ 🌙 ☀️ 🌙 _ _\`. Würde man für die Lücken \`🌙 ☀️\` wählen, wäre Zeile 2 identisch zu Zeile 1. Nach dem Unizitäts-Axiom MUSS daher zwingend \`☀️ 🌙\` gesetzt werden!\n\n*Übung: Fülle Zeile 2 so aus, dass kein Duplikat zu Zeile 1 entsteht!*`,
        size: 6,
        initialGrid: [
            [SUN, MOON, SUN, MOON, MOON, SUN],
            [SUN, MOON, SUN, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 1, c: 4, val: SUN },
            { r: 1, c: 5, val: MOON }
        ],
        explanation: "Perfekt! Das Unizitäts-Gesetz schließt das Zeilenduplikat zwingend aus."
    },
    {
        id: 11,
        title: "Muster 11: Skalierendes Paar-Budget (8×8)",
        subtitle: "Budget von 2 Paaren pro Zeile",
        mathPrinciple: "8×8 Paar-Budget: Max. 2 Sonnen-Paare (2×2=4) ⟹ Rest = Monde",
        description: `**Das Prinzip (8×8)**:\nIn einem 8×8 Gitter (4 Sonnen, 4 Monde) darf es maximal **zwei Sonnen-Paare** geben (2 × 2 = 4).\n\n**Mathematischer Beweis**:\nSind in einer Zeile bereits zwei Sonnen-Paare gesetzt (\`☀️ ☀️\` an Pos 1-2 und Pos 5-6), ist das Sonnen-Budget von 4 vollständig erschöpft. Die verbleibenden leeren Felder an Pos 7 und 8 MÜSSEN Monde sein!\n\n*Übung: Fülle die verbleibenden Felder am Ende der 8er-Zeile auf!*`,
        size: 8,
        initialGrid: [
            [SUN, SUN, MOON, MOON, SUN, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 6, val: MOON },
            { r: 0, c: 7, val: MOON }
        ],
        explanation: "Klasse! Bei 8x8 verbrauchen 2 Sonnen-Paare das gesamte Budget von 4 Sonnen."
    },
    {
        id: 12,
        title: "Muster 12: 10×10 Paar-Limit",
        subtitle: "Maximal 2 Paare desselben Symbols bei 5er-Budget",
        mathPrinciple: "10×10 Paar-Budget: Max. 2 Sonnen-Paare (2×2=4 < 5) ⟹ 5. Sonne ist Einzelsymbol",
        description: `**Das Prinzip (10×10)**:\nIn einem 10×10 Gitter (5 Sonnen, 5 Monde) darf es **maximal ZWEI Sonnen-Paare** und **maximal ZWEI Mond-Paare** pro Zeile geben!\n\n**Mathematischer Beweis**:\nDrei Paare würden $3 \\times 2 = 6$ Symbole verbrauchen. Da das Zeilenkontingent genau 5 Sonnen beträgt, können höchstens 2 Paare ($2 \\times 2 = 4$) existieren. Die 5. Sonne MUSS als einzelnes isoliertes Symbol stehen.\n\n*Übung: Fülle die verbleibenden beiden Felder am Ende der 10er-Zeile auf!*`,
        size: 10,
        initialGrid: [
            [SUN, SUN, MOON, MOON, SUN, SUN, MOON, SUN, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 8, val: MOON },
            { r: 0, c: 9, val: MOON }
        ],
        explanation: "Grandios! Bei 10x10 verbrauchen 2 Paare + 1 Einzelsonne das gesamte Budget von 5 Sonnen."
    },
    {
        id: 13,
        title: "Muster 13: Die universell verbotene =-Kette",
        subtitle: "Transitives Verbot von Doppel-Gleichheitskanten",
        mathPrinciple: "Axiom: Verbot von Doppel-Gleichheitsketten (= = Verstoß gegen 3er-Regel)",
        description: `**Das Prinzip (Alle Feldgrößen)**:\nZwei aufeinanderfolgende Gleichheitszeichen (\`_ = _ = _\`) sind auf JEDER Feldgröße strikt unzulässig!\n\n**Mathematischer Beweis**:\nSind Feld 1 und Feld 2 gleich und Feld 2 und Feld 3 ebenfalls gleich, müssten alle 3 Felder dasselbe Symbol tragen. Dies erzwingt eine verbotene 3er-Kette. Folglich kann nach einem \`[=]\` niemals sofort ein zweites \`[=]\` folgen – dort MUSS immer ein \`[×]\` oder keine Kante liegen.\n\n*Übung: Da Feld 1 und 2 durch [=] gleich sind, MUSS Feld 3 das Gegenteil sein!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: SUN },
            { r: 0, c: 2, val: MOON }
        ],
        explanation: "Exzellent! Nach jedem [=] muss das nächste Feld das Gegenteil sein, um 3er-Ketten zu meiden."
    },
    {
        id: 14,
        title: "Muster 14: Meisterprüfung der Regelmäßigkeiten",
        subtitle: "Wende alle Feldgrößen-Gesetze auf ein 6×6 Gitter an",
        mathPrinciple: "Synthese aller Axiome: 1-5-Regel + Doppel-Inversion + Domino-Zerlegung + Paar-Limits",
        description: `**Die Meisterprüfung**:\nNutze alle gelernten Regelmäßigkeiten:\n1. **1-5-Regel & Paar-Budget**\n2. **Doppel-Inversion & Domino-Parität**\n3. **3er-Sperre & Zeilen-Unizität**\n\n*Aufgabe: Löse dieses anspruchsvolle 6×6 Gitter fehlerfrei!*`,
        size: 6,
        initialGrid: [
            [EMPTY, EMPTY, SUN, EMPTY, MOON, EMPTY],
            [EMPTY, MOON, EMPTY, MOON, EMPTY, MOON],
            [MOON, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, SUN, EMPTY],
            [EMPTY, EMPTY, MOON, EMPTY, MOON, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_EQUAL, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_EQUAL],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_OPPOSITE, EDGE_OPPOSITE, EDGE_OPPOSITE],
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_EQUAL, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: null, // Komplett lösen
        explanation: "Grandios! Du hast alle Feldgrößen-Gesetze und Meister-Muster gemeistert und bist nun ein wahrer Tango-Großmeister!"
    }
];

// === Source: js\puzzles\tango\data\tutorial_pro.js ===
/**
 * Tango Tutorial Pro - Mathematische & Logische Profi-Techniken
 * Erklärt fortgeschrittene Lösungsstrategien mit mathematischen Beweisen und interaktiven Übungen.
 */



const TUTORIAL_PRO_STEPS = [
    {
        id: 1,
        title: "Pro 1: Das Sandwich-Prinzip (Parität)",
        subtitle: "Mathematische Dreier-Sperre in Lücken",
        mathPrinciple: "Ausschluss durch Dreier-Verbot: Niemals 3 gleiche Symbole in Reihe",
        description: `**Das Prinzip**:\nWenn zwei identische Symbole ein leeres Feld umschließen (\`☀️ _ ☀️\` oder \`🌙 _ 🌙\`), MUSS dazwischen das gegenteilige Symbol stehen.\n\n**Mathematischer Beweis**:\nWürde man in die Lücke dasselbe Symbol setzen, entstünde eine Kette aus drei gleichen Symbolen (\`☀️☀️☀️\`). Da die maximale Kettenlänge laut Tango-Regeln maximal 2 beträgt, existiert nur genau eine Belegung für die Lücke.\n\n*Übung: Vervollständige die Sandwich-Lücken in Zeile 1 und Spalte 4!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, SUN, MOON],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, MOON],
            [EMPTY, EMPTY, EMPTY, SUN]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 1, c: 3, val: SUN}],
        explanation: "Mathematisch korrekt! Das Sandwich-Prinzip sichert die Belegung ohne Raten."
    },
    {
        id: 2,
        title: "Pro 2: Die Kanten-Kaskade (Kopplungs-Logik)",
        subtitle: "Vorzeichen-Vererbung über Gleichheitsketten",
        mathPrinciple: "Kanten-Kopplung: [=] nach Symbol A erzwingt Gegenteil",
        description: `**Das Prinzip**:\nZwei durch ein Gleichheitszeichen verbundene Felder (\`[=]\`) bilden ein gekoppeltes Paar mit identischem Wert. Steht direkt davor ein bekanntes Symbol (z. B. eine Sonne ☀️), MÜSSEN beide verbundenen Felder das Gegenteil (🌙 🌙) annehmen.\n\n**Mathematischer Beweis**:\nWürden beide Felder denselben Wert wie das Nachbarfeld annehmen, entstünde eine unzulässige 3er-Reihe (☀️ ☀️ ☀️). Folglich müssen beide Felder zwingend das entgegengesetzte Symbol tragen.\n\n*Übung: Nutze das Gleichheitszeichen [=] in Zeile 1, um die beiden leeren Felder rechts von der Sonne auszufüllen!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_EQUAL, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 1, val: MOON}, {r: 0, c: 2, val: MOON}],
        explanation: "Perfekt bewiesen! Die Kanten-Kaskade hebelt zwei leere Felder gleichzeitig aus."
    },
    {
        id: 3,
        title: "Pro 3: Taubenschlag-Prinzip (Zeilen-Balance)",
        subtitle: "Abzählende Zeilen- und Spaltenvollständigkeit",
        mathPrinciple: "Zeilen-Balance: Summe Sonnen = N/2 ⟹ Rest = Monde",
        description: `**Das Prinzip**:\nIn jedem Gitter enthält jede Zeile und Spalte exakt gleich viele Sonnen wie Monde (z. B. je 2 bei 4×4, je 3 bei 6×6). Sobald alle Sonnen einer Reihe platziert sind, MÜSSEN alle restlichen leeren Felder Monde sein.\n\n**Mathematischer Beweis**:\nIst das Kontingent an Sonnen für eine Zeile vollständig erschöpft, verbleiben 0 freie Kapazitäten für weitere Sonnen. Nach dem Abzähl- und Balance-Prinzip müssen alle verbleibenden leeren Felder mit Monden aufgefüllt werden.\n\n*Übung: Fülle die verbleibenden Felder in Zeile 1 und Spalte 1 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, SUN, EMPTY, EMPTY],
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [{r: 0, c: 2, val: MOON}, {r: 0, c: 3, val: MOON}, {r: 2, c: 0, val: MOON}, {r: 3, c: 0, val: MOON}],
        explanation: "Exzellent! Das Taubenschlag-Prinzip liefert die verbleibenden Felder sofort."
    },
    {
        id: 4,
        title: "Pro 4: Indirekte Gegenteils-Kopplung (× Inversion)",
        subtitle: "Vorzeichenumkehr über Gegenteilskanten",
        mathPrinciple: "Inversions-Logik: [×] schaltet Symbol um (☀️ ↔ 🌙)",
        description: `**Das Prinzip**:\nEin Gegenteilszeichen (\`[×]\`) schaltet den logischen Zustand direkt um: Ist eine Seite bekannt, ist die andere Seite zwingend das Gegenteil.\n\n**Mathematischer Beweis**:\nIn einem binären System mit nur zwei Symbolen (☀️ und 🌙) erzwingt die Kante [×] stets unterschiedliche Werte. Ist ein Nachbar eine Sonne ☀️, folgt unausweichlich, dass der verbundene Partner ein Mond 🌙 sein muss.\n\n*Übung: Löse die Gegenteilskanten [×] in Zeile 1 und Spalte 2 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: MOON },
            { r: 2, c: 1, val: SUN }
        ],
        explanation: "Klasse! Inversion über Gegenteilskanten ist die schnellste Umkehr-Logik."
    },
    {
        id: 5,
        title: "Pro 5: Ausschluss identischer Zeilen",
        subtitle: "Verhinderung von Zeilen-Duplikaten",
        mathPrinciple: "Eindeutigkeit: Keine zwei Zeilen dürfen identisch sein",
        description: `**Das Prinzip**:\nKeine zwei Zeilen dürfen vollständig identisch belegt sein. Wenn eine Belegung eine identische Zeile erzeugen würde, MUSS die alternative Belegung gewählt werden.\n\n**Mathematischer Beweis**:\nZeile 1 ist \`☀️ 🌙 ☀️ 🌙\`. Zeile 2 beginnt mit \`☀️ 🌙 _ _\`. Die Belegung \`☀️ 🌙\` für die Lücken würde Zeile 2 identisch zu Zeile 1 machen (Zeile 1 = Zeile 2). Daher MUSS nach der Eindeutigkeits-Regel die Belegung \`🌙 ☀️\` gewählt werden.\n\n*Übung: Vervollständige Zeile 2 so, dass sie NICHT identisch zu Zeile 1 wird!*`,
        size: 4,
        initialGrid: [
            [SUN, MOON, SUN, MOON],
            [SUN, MOON, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 1, c: 2, val: MOON },
            { r: 1, c: 3, val: SUN }
        ],
        explanation: "Brillant! Der Ausschluss identischer Zeilen löst knifflige Endspiele ohne Raten."
    },
    {
        id: 6,
        title: "Pro 6: Das Rand-Doppel-Prinzip",
        subtitle: "Doppelseitige Klammerung von Pärchen",
        mathPrinciple: "Rand-Einschluss: Pärchen [☀️☀️] wird von [🌙] eingeklammert",
        description: `**Das Prinzip**:\nWenn zwei gleiche Symbole nebeneinander stehen (\`_ ☀️ ☀️ _\`), MÜSSEN BEIDE Außenfelder das Gegenteil sein (\`🌙 ☀️ ☀️ 🌙\`).\n\n**Mathematischer Beweis**:\nWürde eines der Außenfelder auch eine Sonne \`☀️\` sein, entstünde sofort die verbotene 3er-Kette \`☀️ ☀️ ☀️\`. Folglich müssen BEIDE Außenpositionen zwingend Monde \`🌙\` sein.\n\n*Übung: Klammere das Sonnen-Paar in Zeile 1 mit Monden ein!*`,
        size: 4,
        initialGrid: [
            [EMPTY, SUN, SUN, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 0, val: MOON },
            { r: 0, c: 3, val: MOON }
        ],
        explanation: "Perfekt! Zwei gleiche Symbole schließen stets beide Außenfelder mit dem Gegenteil ein."
    },
    {
        id: 7,
        title: "Pro 7: Das Paritäts-Trippel (2-aus-3 Logik)",
        subtitle: "Gegenteils-Kanten als Zähleinheit",
        mathPrinciple: "Parität: [×] bindet 1☀️ + 1🌙 ⟹ 4. Feld ist bestimmt",
        description: `**Das Prinzip**:\nZwei durch \`[×]\` verbundene Felder enthalten garantiert genau 1 Sonne und 1 Mond. Steht vor dem Paar eine Sonne \`☀️\`, ist für die Zeile bereits die 2. Sonne vergeben — das 4. Feld MUSS ein Mond \`🌙\` sein!\n\n**Mathematischer Beweis**:\nDie \`[×]\`-Kante bindet exakt 1 Sonne + 1 Mond. Da Position 1 bereits eine \`☀️\` ist, enthält die 3er-Gruppe (Pos 1–3) zusammen bereits 2 Sonnen (das Maximum bei 4×4). Daher kann das 4. Feld an Position 4 keine Sonne mehr sein und MUSS ein Mond \`🌙\` werden.\n\n*Übung: Bestimme das 4. Feld in Zeile 1 durch die 2-aus-3 Logik!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_NONE, EDGE_OPPOSITE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 3, val: MOON }
        ],
        explanation: "Genial! Die 2-aus-3 Logik lässt dich das 4. Feld bestimmen, ohne das Paar selbst zu lösen."
    },
    {
        id: 8,
        title: "Pro 8: Die 2×2 Quadrat-Kanten-Schleife",
        subtitle: "Kanten-Algebra in Blöcken",
        mathPrinciple: "Eck-Kopplung: Zwei [×] an einer Zelle erzwingen Gleichheit",
        description: `**Das Prinzip**:\nWenn eine Zelle (z. B. oben links) mit zwei Nachbarn über \`[×]\` verbunden ist, müssen beide Nachbarn untereinander exakt GLEICH sein.\n\n**Mathematischer Beweis**:\nBeide Nachbarfelder sind das Gegenteil derselben Ausgangszelle. Da es nur 2 Symbole gibt, haben beide Nachbarn denselben Wert. Ist die Eckzelle eine \`☀️\`, MÜSSEN beide Nachbarfelder Monde \`🌙\` sein!\n\n*Übung: Löse die beiden Nachbarfelder in Zeile 1 und Spalte 1 auf!*`,
        size: 4,
        initialGrid: [
            [SUN, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        hEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        vEdges: [
            [EDGE_OPPOSITE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE],
            [EDGE_NONE, EDGE_NONE, EDGE_NONE, EDGE_NONE]
        ],
        targetCells: [
            { r: 0, c: 1, val: MOON },
            { r: 1, c: 0, val: MOON }
        ],
        explanation: "Meisterklasse! Kanten-Algebra in 2x2 Blöcken durchschaut komplexe Abhängigkeiten blitzschnell."
    }
];

// === Source: js\puzzles\tango\index.js ===
/**
 * Tango Puzzle Plugin Definition
 * Implementiert das Cortex PuzzlePlugin-Interface für Tango (Takuzu / Binairo).
 */










const TangoPlugin = {
    id: 'tango',
    name: 'Tango',
    icon: '☀️🌙',
    description: 'Binärrätsel mit Sonne & Mond',
    cssPath: './css/puzzles/tango.css',

    getSizes: () => [
        { id: 4, label: '4 × 4 (Mini)', gridSize: 4 },
        { id: 6, label: '6 × 6 (Standard)', gridSize: 6 },
        { id: 8, label: '8 × 8 (Groß)', gridSize: 8 },
        { id: 10, label: '10 × 10 (Meister)', gridSize: 10 }
    ],

    getDifficulties: () => [
        { id: 'easy', label: 'Einfach' },
        { id: 'medium', label: 'Mittel' },
        { id: 'hard', label: 'Schwer' }
    ],

    getValues: () => [SUN, MOON],

    getInputConfig: () => ({
        type: 'cycle',
        allowKeypad: true,
        keys: [SUN, MOON, EMPTY]
    }),

    createEngine: (size = 6) => new TangoEngine(size),
    generatePuzzle: (opts) => TangoGenerator.generatePuzzle(opts),
    solvePuzzle: (engine, max = 1) => TangoSolver.solve(engine, max),

    renderBoard: (container, engine, state, onCell) => TangoRenderer.renderBoard(container, engine, state, onCell),
    renderKeypad: (container, engine, state, onKey) => TangoRenderer.renderKeypad(container, engine, state, onKey),
    getSymbolSvg: (val, extraClass) => TangoRenderer.getSymbolSvg(val, extraClass),

    getHint: (engine, options) => TangoSolver.findLogicalHint(engine, options),
    getRules: (lang) => TangoRenderer.getRulesHtml(lang),

    getCampaignConfig: () => ({
        totalLevels: 120,
        chapters: [
            { id: 0, name: 'Kapitel 1', levelRange: [0, 29], desc: '4×4 & 6×6 Grundlagen' },
            { id: 1, name: 'Kapitel 2', levelRange: [30, 59], desc: '6×6 Fortgeschritten' },
            { id: 2, name: 'Kapitel 3', levelRange: [60, 89], desc: '8×8 Herausforderung' },
            { id: 3, name: 'Kapitel 4', levelRange: [90, 119], desc: '8×8 & 10×10 Meister' }
        ]
    }),

    getCampaignLevel: (levelIndex) => getTangoCampaignLevel(levelIndex),
    getDailyConfig: (dateStr) => getTangoDailyPuzzle(dateStr),

    getTutorialSteps: () => ({
        sections: [
            { id: 'basics', name: 'Grundlagen', steps: TUTORIAL_STEPS, badge: '6 Lektionen' },
            { id: 'math', name: 'Mathematik', steps: TUTORIAL_PRO_STEPS, badge: '8 Lektionen' },
            { id: 'patterns', name: 'Muster', steps: TUTORIAL_PATTERNS_STEPS, badge: '14 Lektionen' }
        ]
    }),

    getI18nStrings: (lang) => ({})
};

// === Source: js\shell\puzzle-registry.js ===


class PuzzleRegistry {
    constructor() {
        this._plugins = new Map();
        this._activeId = null;
        this._loadedCss = new Set();
    }

    /**
     * Registriert ein Puzzle-Plugin nach Validierung
     */
    register(plugin) {
        if (!plugin || !plugin.id) {
            throw new Error('Ungültiges Puzzle-Plugin: id fehlt');
        }
        this._plugins.set(plugin.id, plugin);
        if (typeof plugin.getI18nStrings === 'function') {
            registerTranslations(plugin.id, {
                de: plugin.getI18nStrings('de'),
                en: plugin.getI18nStrings('en')
            });
        }
    }

    /**
     * Gibt alle registrierten Plugins zurück
     */
    getAll() {
        return Array.from(this._plugins.values());
    }

    /**
     * Holt ein Plugin anhand der ID
     */
    get(id) {
        return this._plugins.get(id) || null;
    }

    /**
     * Aktiviert ein Plugin und lädt bei Bedarf dessen CSS
     */
    activate(id) {
        const plugin = this._plugins.get(id);
        if (!plugin) {
            console.warn(`Plugin "${id}" nicht gefunden, falle auf "tango" zurück.`);
            return this.activate('tango');
        }

        this._activeId = id;

        // CSS Stylesheet dynamisch prüfen/einbinden falls vorhanden
        if (plugin.cssPath && !this._loadedCss.has(plugin.cssPath) && typeof document !== 'undefined') {
            const existingLink = document.querySelector(`link[data-puzzle-id="${id}"]`);
            if (!existingLink) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = plugin.cssPath;
                link.dataset.puzzleId = id;
                document.head.appendChild(link);
            }
            this._loadedCss.add(plugin.cssPath);
        }

        return plugin;
    }

    /**
     * Gibt das aktuell aktive Plugin zurück
     */
    getActive() {
        if (!this._activeId) {
            this._activeId = 'tango';
        }
        return this._plugins.get(this._activeId) || this.getAll()[0];
    }

    /**
     * Ermittelt deterministisch das Tages-Puzzle für ein gegebenes Datum
     */
    getRandomForDaily(dateStr) {
        const all = this.getAll();
        if (all.length === 0) return null;
        const seed = parseInt(dateStr.replace(/-/g, ''), 10);
        const index = seed % all.length;
        return all[index];
    }
}

const puzzleRegistry = new PuzzleRegistry();

// === Source: js\shell\app-shell.js ===
/**
 * Cortex App-Shell & Unified Game Controller
 * Verwaltet Puzzle-Plugins, Menü-Hub, Spielmodi, Timer, Audio,
 * Statistiken, Themes, Notizen und Modals.
 */



















class CortexApp {
    constructor() {
        // Storage Migration
        StorageManager.checkAndMigrate();

        // Plugins registrieren
        puzzleRegistry.register(AkariPlugin);
        puzzleRegistry.register(NonogramPlugin);
        puzzleRegistry.register(SlitherlinkPlugin);
        puzzleRegistry.register(SudokuPlugin);
        puzzleRegistry.register(TangoPlugin);

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

        // Direktes Durchschalten (Cycle-Modus für Tango, Akari & Nonogram)
        if (this.isNoteMode) {
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
        const allStats = StatsManager.getAggregatedStats(['tango', 'sudoku', 'akari']);
        const tangoStats = StatsManager.getPuzzleStats('tango');
        const sudokuStats = StatsManager.getPuzzleStats('sudoku');
        const akariStats = StatsManager.getPuzzleStats('akari');

        let displayStats = allStats;
        const currentTab = this.activeStatsTab || 'all';

        if (currentTab === 'tango') {
            displayStats = tangoStats;
        } else if (currentTab === 'sudoku') {
            displayStats = sudokuStats;
        } else if (currentTab === 'akari') {
            displayStats = akariStats;
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

const TangoApp = CortexApp;

// === Source: js\ui\app.js ===
/**
 * Cortex / Tango Main Application Controller
 * Re-exportiert alle Kernkomponenten und startet die App-Shell.
 */











// App-Initialisierung
function initApp() {
    if (window.cortexApp || window.tangoApp) return;
    try {
        const app = new CortexApp();
        window.cortexApp = app;
        window.tangoApp = app;
        window.app = app;

        if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('./sw.js').catch(err => {
                console.warn('Service Worker Registrierungsfehler:', err);
            });
        }
    } catch (err) {
        console.error('Fehler beim Starten von Cortex:', err);
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') {
        initApp();
    } else {
        window.addEventListener('DOMContentLoaded', initApp);
    }
}

// === Global Exports for Window & Tests ===
if (typeof window !== 'undefined') {
  window.CortexApp = CortexApp;
  window.TangoApp = TangoApp;
  if (typeof TangoEngine !== 'undefined') window.TangoEngine = TangoEngine;
  if (typeof TangoSolver !== 'undefined') window.TangoSolver = TangoSolver;
  if (typeof TangoGenerator !== 'undefined') window.TangoGenerator = TangoGenerator;
  if (typeof TangoPlugin !== 'undefined') window.TangoPlugin = TangoPlugin;
  if (typeof SudokuEngine !== 'undefined') window.SudokuEngine = SudokuEngine;
  if (typeof SudokuSolver !== 'undefined') window.SudokuSolver = SudokuSolver;
  if (typeof SudokuGenerator !== 'undefined') window.SudokuGenerator = SudokuGenerator;
  if (typeof SudokuPlugin !== 'undefined') window.SudokuPlugin = SudokuPlugin;
  if (typeof AkariEngine !== 'undefined') window.AkariEngine = AkariEngine;
  if (typeof AkariSolver !== 'undefined') window.AkariSolver = AkariSolver;
  if (typeof AkariGenerator !== 'undefined') window.AkariGenerator = AkariGenerator;
  if (typeof AkariPlugin !== 'undefined') window.AkariPlugin = AkariPlugin;
  if (typeof NonogramEngine !== 'undefined') window.NonogramEngine = NonogramEngine;
  if (typeof NonogramSolver !== 'undefined') window.NonogramSolver = NonogramSolver;
  if (typeof NonogramGenerator !== 'undefined') window.NonogramGenerator = NonogramGenerator;
  if (typeof NonogramPlugin !== 'undefined') window.NonogramPlugin = NonogramPlugin;
  if (typeof puzzleRegistry !== 'undefined') window.puzzleRegistry = puzzleRegistry;
}

})();