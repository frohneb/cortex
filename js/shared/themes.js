/**
 * Cortex Themes Manager
 * 5 handgefertigte Farbwelten: Dark, AMOLED, Light, Wood, Cyberpunk.
 */

import { StorageManager, StorageKeys } from './storage.js';

export const THEMES = [
    { id: 'dark', labelKey: 'setting_theme_dark', subtitle: 'Ausgewogen & modern' },
    { id: 'amoled', labelKey: 'setting_theme_amoled', subtitle: 'Tiefschwarz & stromsparend' },
    { id: 'light', labelKey: 'setting_theme_light', subtitle: 'Hell & minimalistisch' },
    { id: 'wood', labelKey: 'setting_theme_wood', subtitle: 'Natürliche Holztöne' },
    { id: 'cyberpunk', labelKey: 'setting_theme_cyberpunk', subtitle: 'Futuristisch & leuchtend' }
];

export class ThemeManager {
    static getCurrentTheme() {
        return StorageManager.getItem(StorageKeys.THEME, 'dark');
    }

    static applyTheme(themeName) {
        try {
            const valid = THEMES.some(t => t.id === themeName) ? themeName : 'dark';
            document.body.className = `theme-${valid}`;
            StorageManager.setItem(StorageKeys.THEME, valid);
            // Auch für Legacy Kompatibilität
            StorageManager.setItem('tango_theme', valid);
            return valid;
        } catch (e) {
            console.error('ThemeManager.applyTheme error:', e);
            return 'dark';
        }
    }
}
