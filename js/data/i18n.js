/**
 * Tango Internationalisierung (i18n)
 * Vollständige deutsche Übersetzung und Sprachdefinitionen
 */

export const translations = {
    de: {
        app_title: "Tango Logikrätsel",
        subtitle: "Minimalistisches Binärrätsel mit Sonne & Mond",
        
        // Navigation & Modi
        nav_campaign: "Kampagne",
        nav_daily: "Tagesrätsel",
        nav_free: "Freies Spiel",
        nav_tutorial: "Tutorial (Grundlagen)",
        nav_tutorial_pro: "Tutorial Pro (Mathe-Tricks)",
        nav_stats: "Statistiken",
        nav_settings: "Einstellungen",
        
        // Schwierigkeitsgrade
        diff_beginner: "Anfänger (4×4)",
        diff_easy: "Einfach (6×6)",
        diff_medium: "Mittel (6×6)",
        diff_hard: "Schwer (8×8)",
        diff_expert: "Experte (10×10)",

        // Spielaktionen
        btn_undo: "Rückgängig",
        btn_redo: "Wiederholen",
        btn_hint: "Hinweis",
        btn_restart: "Neustart",
        btn_notes: "Notizen",
        btn_check: "Prüfen",
        btn_next_level: "Nächstes Level",
        btn_back_menu: "Hauptmenü",
        btn_play_again: "Nochmal spielen",
        btn_continue: "Weiter",
        btn_start: "Starten",

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
        reveal_banner_hint: "Lösung wird angezeigt. Tippe auf Weiter oder das Gitter zum Fortfahren.",
        btn_retry_level: "Level wiederholen",
        error_title: "Regelverstoß",
        victory_title: "Glückwunsch!",
        victory_msg: "Du hast dieses Rätsel erfolgreich und fehlerfrei gelöst!",
        victory_time_msg: "Benötigte Zeit:",
        victory_perfect: "Perfekt gelöst ohne Hinweise!",

        // Regeln (Kurzform)
        rules_header: "Spielregeln & Abhängigkeiten",
        rule_1_title: "1. Keine 3er-Reihen",
        rule_1_desc: "Höchstens zwei gleiche Symbole (☀️☀️ oder 🌙🌙) dürfen waagerecht oder senkrecht aufeinanderfolgen.",
        rule_2_title: "2. Gleiche Anzahl",
        rule_2_desc: "Jede Zeile und Spalte enthält exakt gleich viele Sonnen wie Monde.",
        rule_3_title: "3. Gleichheitszeichen =",
        rule_3_desc: "Verbundene Nachbarfelder müssen dasselbe Symbol besitzen (beide ☀️ oder beide 🌙).",
        rule_4_title: "4. Gegenteilszeichen ×",
        rule_4_desc: "Verbundene Nachbarfelder müssen unterschiedliche Symbole besitzen (eine ☀️, ein 🌙).",
        rule_5_title: "5. Eindeutigkeit",
        rule_5_desc: "Keine zwei Zeilen und keine zwei Spalten dürfen vollständig identisch sein.",

        // Einstellungen
        settings_title: "Einstellungen",
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
        setting_input_mode: "Eingabemodus",
        setting_input_cycle: "Direkt (1× ☀️ / 2× & Halten 🌙 / 3× Löschen)",
        setting_input_keypad: "Ziffern- / Symbolleiste unten",
        setting_language: "Sprache",
        setting_reset_data: "Fortschritt zurücksetzen",
        setting_reset_confirm: "Möchtest du deinen Spielfortschritt wirklich zurücksetzen?",
        stats_reset_confirm: "Möchtest du deine Spielstatistik wirklich zurücksetzen?",

        // Statistiken
        stats_title: "Deine Statistiken",
        stats_total_played: "Gespielte Rätsel",
        stats_total_won: "Gelöste Rätsel",
        stats_total_lost: "Niederlagen / Aufgegeben",
        stats_win_rate: "Erfolgsquote",
        stats_best_time: "Bestzeit",
        stats_avg_time: "Durchschnittszeit",
        stats_current_streak: "Aktuelle Tages-Serie",
        stats_max_streak: "Längste Tages-Serie",
        stats_best_times_title: "⚡ Bestzeiten",
        stats_best_time_4: "Bestzeit 4×4",
        stats_best_time_6: "Bestzeit 6×6",
        stats_best_time_8: "Bestzeit 8×8",
        stats_best_time_10: "Bestzeit 10×10",
        stats_no_data: "Noch keine Spieldaten vorhanden.",

        // PWA Install Prompt
        pwa_install_title: "App installieren",
        pwa_install_desc: "Installiere Tango auf deinem Smartphone, um komplett offline und werbefrei zu spielen.",
        pwa_install_btn: "Jetzt installieren",
        pwa_dismiss: "Später",

        // Synchronisation & QR-Code
        nav_sync: "🔄 Spielstand übertragen & QR-Code",
        sync_title: "Spielstand synchronisieren",
        sync_tab_export: "📱 QR-Code / Senden",
        sync_tab_import: "📥 Empfangen / Laden",
        sync_export_desc: "Scanne diesen QR-Code mit einem anderen Gerät oder kopiere den Sync-Code, um deinen gesamten Fortschritt verlustfrei zu übertragen.",
        sync_import_desc: "Füge den Sync-Code oder den Inhalt einer Backup-Datei ein. Dein Fortschritt wird intelligent und verlustfrei mit bestehenden Daten zusammengeführt.",
        sync_btn_copy: "📋 Kopieren",
        sync_btn_copied: "✅ Kopiert!",
        sync_btn_download: "💾 Backup-Datei (.tango) speichern",
        sync_btn_paste: "📋 Aus Zwischenablage",
        sync_btn_merge: "🔄 Spielstand zusammenführen",
        sync_file_load: "📁 Datei laden",
        sync_success_title: "Erfolgreich synchronisiert!",
        sync_no_new_data: "Dein Spielstand ist bereits auf dem neuesten Stand.",

        // Tägliche Erinnerung & Benachrichtigungen
        setting_daily_reminder: "System-Benachrichtigung",
        setting_reminder_time: "Erinnerungszeit",
        setting_test_notif: "🔔 Test",
        reminder_banner_title: "Tagesrätsel wartet!",
        reminder_banner_desc: "Löse dein heutiges Rätsel für deine Serie.",
        reminder_btn_play: "Spielen",
        reminder_badge_new: "Neu",
        notif_title: "Tango Tagesrätsel",
        notif_body: "Dein heutiges Tagesrätsel wartet auf dich! ☀️🌙",
        notif_test_sent: "Systembenachrichtigung gesendet!",
        notif_permission_denied: "Benachrichtigungen sind im Browser blockiert. Bitte erlaube sie in den Berechtigungen.",

        // Menü Hub Tabs
        menu_tab_play: "Spielen",
        menu_tab_rules: "Regeln",
        menu_tab_stats: "Statistik",
        menu_tab_settings: "Optionen",
        stats_reset_btn: "Statistik zurücksetzen",
        confirm_title: "Sicherheitsabfrage",
        btn_cancel: "Abbrechen",
        btn_save: "Speichern",
        btn_confirm_reset: "Zurücksetzen",
        campaign_desc: "120 handgefertigte Logikrätsel",
        chapter_1: "Teil 1",
        chapter_2: "Teil 2",
        chapter_3: "Teil 3",
        chapter_4: "Teil 4",
        daily_desc: "Jeden Tag eine neue Herausforderung",
        free_desc: "4×4 bis 10×10, beliebige Stufe",
        free_size: "Gittergröße",
        free_diff: "Schwierigkeitsgrad",
        free_size_4: "4 × 4 (Schnell)",
        free_size_6: "6 × 6 (Klassisch)",
        free_size_8: "8 × 8 (Groß)",
        free_size_10: "10 × 10 (Gigant)",
        free_diff_easy: "Einfach",
        free_diff_medium: "Mittel",
        free_diff_hard: "Schwer"
    },
    en: {
        app_title: "Tango Logic Puzzle",
        subtitle: "Minimalist binary puzzle with Sun & Moon",
        nav_campaign: "Campaign",
        nav_daily: "Daily Puzzle",
        nav_free: "Free Play",
        nav_tutorial: "Tutorial",
        nav_stats: "Statistics",
        nav_settings: "Settings",
        diff_beginner: "Beginner (4×4)",
        diff_easy: "Easy (6×6)",
        diff_medium: "Medium (6×6)",
        diff_hard: "Hard (8×8)",
        diff_expert: "Expert (10×10)",
        btn_undo: "Undo",
        btn_redo: "Redo",
        btn_hint: "Hint",
        btn_restart: "Restart",
        btn_notes: "Notes",
        btn_check: "Check",
        btn_next_level: "Next Level",
        btn_back_menu: "Main Menu",
        btn_play_again: "Play Again",
        btn_continue: "Continue",
        btn_start: "Start",
        status_time: "Time",
        status_moves: "Moves",
        status_hints_used: "Hints",
        status_level: "Level",
        status_daily_date: "Daily Puzzle for",
        status_streak: "Streak",
        status_completed: "Solved!",
        hint_title: "Logical Hint",
        hint_error_title: "Mistake Found",
        hint_button_apply: "Apply Move",
        hint_button_fix: "Fix Cell",
        hint_limit_reached: "Maximum number of hints reached (3/3).",
        reveal_confirm_title: "Reveal Solution?",
        reveal_confirm_desc: "You have used all 3 hints. Do you want to surrender this puzzle and reveal the complete solution?\n\n⚠️ The next level will not be unlocked and a defeat will be recorded in your statistics.",
        btn_reveal_solution: "Reveal Solution",
        reveal_defeat_title: "Puzzle Surrendered",
        reveal_defeat_msg: "The solution has been revealed and mistakes highlighted in red. The next level remains locked and a defeat has been recorded in your statistics.",
        reveal_banner_hint: "Solution displayed. Tap Continue or the grid to proceed.",
        btn_retry_level: "Retry Level",
        error_title: "Rule Violation",
        victory_title: "Congratulations!",
        victory_msg: "You solved this puzzle perfectly!",
        victory_time_msg: "Time taken:",
        victory_perfect: "Solved without hints!",
        rules_header: "Game Rules & Dependencies",
        rule_1_title: "1. No 3 in a Row",
        rule_1_desc: "No more than two identical symbols (☀️☀️ or 🌙🌙) may appear consecutively in any row or column.",
        rule_2_title: "2. Equal Balance",
        rule_2_desc: "Each row and column must contain an equal number of suns and moons.",
        rule_3_title: "3. Equal Sign =",
        rule_3_desc: "Connected cells must have the exact same symbol (both ☀️ or both 🌙).",
        rule_4_title: "4. Opposite Sign ×",
        rule_4_desc: "Connected cells must have opposite symbols (one ☀️, one 🌙).",
        rule_5_title: "5. Uniqueness",
        rule_5_desc: "No two rows or columns can be completely identical.",
        settings_title: "Settings",
        setting_theme: "Theme",
        setting_theme_dark: "Modern Dark",
        setting_theme_amoled: "AMOLED Black",
        setting_theme_light: "Clean Light",
        setting_theme_wood: "Warm Wood",
        setting_theme_cyberpunk: "Cyberpunk Neon",
        setting_sound: "Sound Effects",
        setting_vibration: "Haptic Feedback",
        setting_vibration_strength: "Vibration Intensity",
        setting_vib_ultra: "Ultra Strong (Max)",
        setting_vib_strong: "Strong (Recommended)",
        setting_vib_medium: "Standard",
        setting_vib_soft: "Soft",
        setting_auto_check: "Highlight Mistakes Immediately",
        setting_input_mode: "Input Mode",
        setting_input_cycle: "Cycle Tap (Sun → Moon → Empty)",
        setting_input_keypad: "Bottom Selector Bar",
        setting_language: "Language",
        setting_reset_data: "Reset Progress",
        setting_reset_confirm: "Are you sure you want to reset all your campaign and streak progress?",
        stats_reset_confirm: "Are you sure you want to reset all your statistics?",
        stats_title: "Your Statistics",
        stats_total_played: "Puzzles Played",
        stats_total_won: "Puzzles Solved",
        stats_total_lost: "Puzzles Lost / Surrendered",
        stats_win_rate: "Win Rate",
        stats_best_time: "Best Time",
        stats_avg_time: "Average Time",
        stats_current_streak: "Current Daily Streak",
        stats_max_streak: "Max Daily Streak",
        stats_best_times_title: "⚡ Best Times",
        stats_best_time_4: "Best Time 4×4",
        stats_best_time_6: "Best Time 6×6",
        stats_best_time_8: "Best Time 8×8",
        stats_best_time_10: "Best Time 10×10",
        stats_no_data: "No game data recorded yet.",
        pwa_install_title: "Install App",
        pwa_install_desc: "Install Tango on your home screen for instant offline play.",
        pwa_install_btn: "Install Now",
        pwa_dismiss: "Later",

        // Sync & QR Code
        nav_sync: "🔄 Transfer & Sync Saves",
        sync_title: "Sync Game Save States",
        sync_tab_export: "📱 QR Code / Export",
        sync_tab_import: "📥 Receive / Import",
        sync_export_desc: "Scan this QR code with another device or copy the sync code to transfer your full progress losslessly.",
        sync_import_desc: "Paste the sync code or load a backup file. Your progress will be merged losslessly with existing local progress.",
        sync_btn_copy: "📋 Copy Code",
        sync_btn_copied: "✅ Copied!",
        sync_btn_download: "💾 Download Backup (.tango)",
        sync_btn_paste: "📋 Paste from Clipboard",
        sync_btn_merge: "🔄 Merge & Update Saves",
        sync_file_load: "📁 Load File",
        sync_success_title: "Successfully Synced!",
        sync_no_new_data: "Your save state is already fully up to date.",

        // Daily Reminder & Notifications
        setting_daily_reminder: "System Notification",
        setting_reminder_time: "Reminder Time",
        setting_test_notif: "🔔 Test",
        reminder_banner_title: "Daily Puzzle Ready!",
        reminder_banner_desc: "Solve today's puzzle to keep your streak.",
        reminder_btn_play: "Play",
        reminder_badge_new: "New",
        notif_title: "Tango Daily Puzzle",
        notif_body: "Today's daily puzzle is ready for you! ☀️🌙",
        notif_test_sent: "System notification sent!",
        notif_permission_denied: "Notifications blocked by browser. Please enable permissions.",

        // Menu Hub Tabs
        menu_tab_play: "Play",
        menu_tab_rules: "Rules",
        menu_tab_stats: "Stats",
        menu_tab_settings: "Options",
        stats_reset_btn: "Reset Statistics",
        confirm_title: "Confirmation",
        btn_cancel: "Cancel",
        btn_save: "Save",
        btn_confirm_reset: "Reset",
        campaign_desc: "120 handcrafted logic puzzles",
        chapter_1: "Part 1",
        chapter_2: "Part 2",
        chapter_3: "Part 3",
        chapter_4: "Part 4",
        daily_desc: "A fresh challenge every single day",
        free_desc: "4×4 to 10×10, custom difficulty",
        free_size: "Grid Size",
        free_diff: "Difficulty",
        free_size_4: "4 × 4 (Fast)",
        free_size_6: "6 × 6 (Classic)",
        free_size_8: "8 × 8 (Large)",
        free_size_10: "10 × 10 (Giant)",
        free_diff_easy: "Easy",
        free_diff_medium: "Medium",
        free_diff_hard: "Hard"
    }
};

let currentLang = 'de';

export function getLang() {
    return currentLang;
}

export function setLang(lang) {
    if (translations[lang]) {
        currentLang = lang;
        try {
            localStorage.setItem('tango_lang', lang);
        } catch (e) {
            console.warn('localStorage nicht verfügbar:', e);
        }
    }
}

export function t(key) {
    const dict = translations[currentLang] || translations.de;
    return dict[key] || key;
}

// Lade gespeicherte Sprache
try {
    const savedLang = localStorage.getItem('tango_lang');
    if (savedLang && translations[savedLang]) {
        currentLang = savedLang;
    }
} catch (e) {
    console.warn('localStorage konnte nicht gelesen werden:', e);
}

