/**
 * Cortex Storage Manager
 * Zentralisierte, ausfallsichere LocalStorage-Verwaltung mit automatischer
 * Migration von älteren Tango-Versionen (tango_* -> cortex_*).
 */

const PREFIX = 'cortex_';

export const StorageKeys = {
    MIGRATED: `${PREFIX}migrated`,
    
    // Globale Einstellungen
    THEME: `${PREFIX}theme`,
    SOUND: `${PREFIX}sound`,
    VIBRATION: `${PREFIX}vibration`,
    VIBRATION_STRENGTH: `${PREFIX}vibration_strength`,
    AUTO_CHECK: `${PREFIX}auto_check`,
    INPUT_MODE: `${PREFIX}input_mode`,
    LANGUAGE: `${PREFIX}language`,
    ACTIVE_PUZZLE: `${PREFIX}active_puzzle`,
    
    // Tägliche Erinnerungen & Benachrichtigungen
    REMINDER_ENABLED: `${PREFIX}reminder_enabled`,
    REMINDER_TIME: `${PREFIX}reminder_time`,
    LAST_NOTIF_DATE: `${PREFIX}last_notif_date`,

    // Globales Tagesrätsel-Tracking
    DAILY_HISTORY: `${PREFIX}daily_history`,

    // Puzzle-spezifische Key-Factory
    puzzleKey: (puzzleId, key) => `${PREFIX}p_${puzzleId}_${key}`
};

export class StorageManager {
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
    static resetAllStats(puzzleIds = ['tango', 'sudoku']) {
        try {
            for (const pid of puzzleIds) {
                localStorage.removeItem(StorageKeys.puzzleKey(pid, 'stats'));
            }
            localStorage.removeItem('tango_stats');
        } catch (e) {}
    }
}
