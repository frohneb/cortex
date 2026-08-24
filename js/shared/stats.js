/**
 * Cortex Statistics & Streaks Module
 * Berechnet aggregierte Statistiken, Streaks und Bestzeiten.
 */

import { StorageManager, StorageKeys } from './storage.js';

export function calculateStreaks(history = [], todayStr = null) {
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

export class StatsManager {
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
