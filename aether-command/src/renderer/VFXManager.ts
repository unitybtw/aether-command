export class VFXManager {
    private ctx: CanvasRenderingContext2D;
    private particles: any[] = [];
    private MAX_PARTICLES = 50;
    private baseColor: string = "#00e5ff";

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    public draw() {
        this.ctx.save();
        this.ctx.globalCompositeOperation = "lighter";
        this.particles.forEach(p => {
            const alpha = Math.max(0, p.life).toFixed(2);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, Math.max(0, p.size * p.life), 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    public createBurst(x: number, y: number, count: number = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                life: 1.0
            });
        }
    }

    public drawSkeleton(landmarks: any[], width: number, height: number) {
        this.ctx.save();
        
        const connections = [
            [0, 1, 2, 3, 4], // Thumb
            [0, 5, 6, 7, 8], // Index
            [9, 10, 11, 12], // Middle
            [13, 14, 15, 16], // Ring
            [0, 17, 18, 19, 20], // Pinky
            [5, 9, 13, 17, 5] // Palm
        ];

        // Draw Glow
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = "#00e5ff";
        this.ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";

        connections.forEach(path => {
            this.ctx.beginPath();
            path.forEach((idx, i) => {
                const pt = landmarks[idx];
                const x = (1 - pt.x) * width;
                const y = pt.y * height;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            });
            this.ctx.stroke();
        });

        // Draw Joints
        this.ctx.fillStyle = "#fff";
        this.ctx.shadowBlur = 5;
        landmarks.forEach(pt => {
            const x = (1 - pt.x) * width;
            const y = pt.y * height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.restore();
    }
}
