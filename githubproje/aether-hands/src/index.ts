/**
 * index.ts
 * Main entry point for Aether-Hands.
 */

import { CameraProvider } from './core/CameraProvider.js';
import { HandTracker } from './core/HandTracker.js';

class AetherEngine {
    private camera: CameraProvider;
    private tracker: HandTracker;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.camera = new CameraProvider();
        this.tracker = new HandTracker();
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'aether-vfx-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        
        document.body.appendChild(this.canvas);
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error("Canvas context failed");
        this.ctx = context;

        this.init();
    }

    private async init() {
        console.log("[Aether] Booting engine...");
        await this.camera.initialize();
        await this.tracker.initialize();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.loop();
    }

    private resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    private loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const results = this.tracker.detect(this.camera.video, performance.now());
        
        if (results && results.landmarks) {
            this.drawSkeleton(results.landmarks);
        }

        requestAnimationFrame(() => this.loop());
    }

    private drawSkeleton(hands: any[][]) {
        this.ctx.save();
        // Mirror the canvas to match mirrored video
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);

        hands.forEach(landmarks => {
            // Draw points
            this.ctx.fillStyle = "#00e5ff";
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = "#00e5ff";

            landmarks.forEach(pt => {
                const x = pt.x * this.canvas.width;
                const y = pt.y * this.canvas.height;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });

            // Draw simple connections (simplified for now)
            this.ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            landmarks.forEach((pt, i) => {
                const x = pt.x * this.canvas.width;
                const y = pt.y * this.canvas.height;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            });
            this.ctx.stroke();
        });
        this.ctx.restore();
    }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    (window as any).aether = new AetherEngine();
});
