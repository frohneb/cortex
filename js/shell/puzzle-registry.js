import { registerTranslations } from '../shared/i18n.js';

export class PuzzleRegistry {
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

export const puzzleRegistry = new PuzzleRegistry();
