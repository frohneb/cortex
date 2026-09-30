/**
 * Cortex Internationalisierung (i18n)
 * Zentrale Sprachverwaltung für die App-Shell und modulare Puzzle-Plugins.
 */

import { StorageManager, StorageKeys } from './storage.js';

let currentLang = 'de';

try {
    const saved = StorageManager.getItem(StorageKeys.LANGUAGE, localStorage.getItem('tango_lang'));
    if (saved === 'de' || saved === 'en') {
        currentLang = saved;
    }
} catch (e) {}

export const baseTranslations = {
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
        free_size_5: "5 × 5 (Kompakt)",
        free_size_6: "6 × 6 (Standard)",
        free_size_7: "7 × 7 (Fortgeschritten)",
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
        stats_best_time_5: "Bestzeit 5×5",
        stats_best_time_6: "Bestzeit 6×6",
        stats_best_time_7: "Bestzeit 7×7",
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
        free_size_5: "5 × 5 (Compact)",
        free_size_6: "6 × 6 (Standard)",
        free_size_7: "7 × 7 (Advanced)",
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
        stats_best_time_5: "Best Time 5×5",
        stats_best_time_6: "Best Time 6×6",
        stats_best_time_7: "Best Time 7×7",
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

export const pluginTranslations = {
    de: {},
    en: {}
};

export function registerTranslations(pluginId, translationsObj) {
    if (!translationsObj) return;
    if (translationsObj.de) {
        Object.assign(pluginTranslations.de, translationsObj.de);
    }
    if (translationsObj.en) {
        Object.assign(pluginTranslations.en, translationsObj.en);
    }
}

export function t(key, params = {}) {
    const langDict = { ...baseTranslations[currentLang], ...pluginTranslations[currentLang] };
    const fallbackDict = { ...baseTranslations.de, ...pluginTranslations.de };
    let text = langDict[key] || fallbackDict[key] || key;

    for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return text;
}

export function setLang(lang) {
    if (lang === 'de' || lang === 'en') {
        currentLang = lang;
        StorageManager.setItem(StorageKeys.LANGUAGE, lang);
        StorageManager.setItem('tango_lang', lang);
    }
}

export function getLang() {
    return currentLang;
}
