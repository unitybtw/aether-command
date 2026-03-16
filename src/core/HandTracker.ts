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

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.7,
            minHandPresenceConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        this.isInitialized = true;
        console.log("[Aether Tracker] Hand Landmarker initialized.");
    }

    private frameCount: number = 0;
    private lastHandCount: number = 0;

    public detect(video: HTMLVideoElement, timestamp: number): HandResults | null {
        if (!this.handLandmarker || !this.isInitialized) return null;

        /** 
         * ADAPTIVE OPTIMIZATION:
         * 1. If no hands detected last frame, check EVERY frame to catch hands Entering.
         * 2. If hands are present, skip every other frame to save CPU.
         */
        this.frameCount++;
        if (this.lastHandCount > 0 && this.frameCount % 2 !== 0) {
            return null; 
        }

        const results = this.handLandmarker.detectForVideo(video, timestamp);
        this.lastHandCount = results.landmarks ? results.landmarks.length : 0;
        
        return {
            landmarks: results.landmarks || [],
            worldLandmarks: results.worldLandmarks || [],
            handedness: results.handedness || []
        };
    }
}
