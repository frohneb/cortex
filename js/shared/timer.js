/**
 * Cortex Game Timer
 * Präzise Zeitmessung für Rätsel.
 */

export function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds === null || isNaN(seconds) || seconds < 0) {
        return '-';
    }
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

export class GameTimer {
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
