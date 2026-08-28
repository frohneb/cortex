/**
 * Cortex / Tango Main Application Controller
 * Re-exportiert alle Kernkomponenten und startet die App-Shell.
 */

import { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE, TangoEngine } from '../puzzles/tango/engine.js';
import { TangoSolver } from '../puzzles/tango/solver.js';
import { TangoGenerator } from '../puzzles/tango/generator.js';
import { getSunSvg, getMoonSvg } from '../puzzles/tango/renderer.js';
import { formatTime } from '../shared/timer.js';
import { calculateStreaks } from '../shared/stats.js';
import { CortexApp, TangoApp } from '../shell/app-shell.js';

export { EMPTY, SUN, MOON, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE, TangoEngine, TangoSolver, TangoGenerator, getSunSvg, getMoonSvg, formatTime, calculateStreaks, CortexApp, TangoApp };

// App-Initialisierung
export function initApp() {
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
