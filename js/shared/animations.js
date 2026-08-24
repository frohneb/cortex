/**
 * Cortex Visual FX & Animations
 * Konfetti-Partikel und Siegesanimationen auf einem HTML5-Canvas.
 */

export class AnimationManager {
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

export const animations = new AnimationManager();
