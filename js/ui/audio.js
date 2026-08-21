/**
 * Tango Web Audio Synthesizer
 * Erzeugt hochwertige, latenzfreie Soundeffekte ohne externe MP3/WAV-Dateien.
 */

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.vibrationEnabled = true;
        this.vibrationStrength = 'medium'; // Standardmäßig auf Standard gesetzt

        // Lade Einstellungen
        try {
            const savedSound = localStorage.getItem('tango_sound');
            if (savedSound !== null) this.enabled = savedSound === 'true';

            const savedVib = localStorage.getItem('tango_vibration');
            if (savedVib !== null) this.vibrationEnabled = savedVib === 'true';

            const savedVibStr = localStorage.getItem('tango_vibration_strength');
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
        try {
            localStorage.setItem('tango_sound', enabled);
        } catch (e) {}
    }

    setVibration(enabled) {
        this.vibrationEnabled = enabled;
        try {
            localStorage.setItem('tango_vibration', enabled);
        } catch (e) {}
    }

    setVibrationStrength(strength) {
        this.vibrationStrength = strength;
        try {
            localStorage.setItem('tango_vibration_strength', strength);
        } catch (e) {}
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
        // Siegesfanfare: C4, E4, G4, C5 mit kurzem Sustain
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

export const audio = new AudioManager();
