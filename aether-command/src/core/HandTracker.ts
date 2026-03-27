/**
 * HandTracker.ts
 * Integrates MediaPipe Hand Landmarker for real-time tracking.
 */

import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface HandResults {
    landmarks: any[][];
    worldLandmarks: any[][];
    handedness: any[][];
}

export class HandTracker {
    private handLandmarker: HandLandmarker | null = null;
    private isInitialized: boolean = false;

    public async initialize() {
        if (this.isInitialized) return;
        console.log("[HandTracker] Starting initialization...");

        try {
            console.log("[HandTracker] Resolving fileset from CDN (v0.10.32)...");
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
            );
            console.log("[HandTracker] Fileset resolved.");

            console.log("[HandTracker] Creating HandLandmarker...");
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2, 
                minHandDetectionConfidence: 0.4,
                minHandPresenceConfidence: 0.4,
                minTrackingConfidence: 0.4
            });
            console.log("[HandTracker] HandLandmarker created successfully.");

            this.isInitialized = true;
        } catch (error) {
            console.error("[HandTracker] Initialization error:", error);
            throw error;
        }
    }

    public updateOptions(confidence: number) {
        if (!this.handLandmarker) return;
        this.handLandmarker.setOptions({
            minHandDetectionConfidence: confidence,
            minHandPresenceConfidence: confidence,
            minTrackingConfidence: confidence
        });
        console.log(`[HandTracker] Confidence updated to: ${confidence}`);
    }

    private frameCount: number = 0;
    private lastHandCount: number = 0;
    private lastHandFoundTime: number = Date.now();

    public detect(video: HTMLVideoElement, timestamp: number): HandResults | null {
        if (!this.handLandmarker || !this.isInitialized) return null;

        this.frameCount++;
        const now = Date.now();
        const timeSinceHand = now - this.lastHandFoundTime;

        // --- PASSIVE SLEEP LOGIC ---
        // If no hand for 10s -> 10 FPS (~skip 5/6 frames)
        // If no hand for 30s -> 5 FPS (~skip 11/12 frames)
        let skipFactor = 1;
        if (this.lastHandCount === 0) {
            if (timeSinceHand > 30000) skipFactor = 12;      // 5 FPS Extreme Sleep
            else if (timeSinceHand > 10000) skipFactor = 6;  // 10 FPS Passive Sleep
            else skipFactor = 3;                             // 20 FPS Searching
        }

        if (this.frameCount % skipFactor !== 0) return null;

        const results = this.handLandmarker.detectForVideo(video, timestamp);
        this.lastHandCount = results.landmarks ? results.landmarks.length : 0;
        
        if (this.lastHandCount > 0) {
            this.lastHandFoundTime = now;
        }
        
        return {
            landmarks: results.landmarks || [],
            worldLandmarks: results.worldLandmarks || [],
            handedness: results.handedness || []
        } as unknown as HandResults;
    }
}
