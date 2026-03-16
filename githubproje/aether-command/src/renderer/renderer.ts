import { HandTracker } from '../core/HandTracker';
import { GestureEngine } from '../core/GestureEngine';

// Type definition for our exposed electron API
declare global {
    interface Window {
        electronAPI: {
            triggerGestureAction: (action: string) => void;
            setLoginItem: (openAtLogin: boolean) => void;
            getLoginItem: () => Promise<boolean>;
        }
    }
}

class AetherCommandRenderer {
    private video: HTMLVideoElement;
    private tracker: HandTracker;
    private gesture: GestureEngine;
    private statusEl: HTMLElement;
    private logEl: HTMLElement;

    private isProcessing: boolean = false;
    private lastSeenTime: number = 0;
    private smoothedHands: any[][] = [];
    private lerpAmount: number = 0.5;
    private wasPinchingHands: boolean[] = [false, false];

    // Added state for new gestures to prevent spamming
    private wasSwipingLeft: boolean = false;
    private wasSwipingRight: boolean = false;
    private wasFist: boolean = false;
    private wasOpenPalm: boolean = false;

    constructor() {
        this.video = document.getElementById('webcam') as HTMLVideoElement;
        this.statusEl = document.getElementById('status')!;
        this.logEl = document.getElementById('log')!;
        
        this.tracker = new HandTracker();
        this.gesture = new GestureEngine();

        this.initCamera();
        this.setupSettingsUI();
    }

    private setupSettingsUI() {
        // Smoothing slider
        const smoothSlider = document.getElementById('setting-smoothing') as HTMLInputElement;
        if (smoothSlider) {
            smoothSlider.addEventListener('input', (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.lerpAmount = val;
                this.log(`Tracking Smoothing set to ${val}`);
            });
        }

        // Auto-Launch Checkbox
        const autoLaunchCb = document.getElementById('setting-autolaunch') as HTMLInputElement;
        if (autoLaunchCb) {
            // Get initial state
            window.electronAPI.getLoginItem().then(isEnabled => {
                autoLaunchCb.checked = isEnabled;
            });

            // Handle changes
            autoLaunchCb.addEventListener('change', (e) => {
                const isEnabled = (e.target as HTMLInputElement).checked;
                window.electronAPI.setLoginItem(isEnabled);
                this.log(`Launch at Login set to ${isEnabled}`);
            });
        }
    }

    private async initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: "user" } 
            });
            this.video.srcObject = stream;
            
            this.video.onloadeddata = async () => {
                this.statusEl.innerText = "Initializing AI Model...";
                await this.tracker.initialize();
                this.statusEl.innerText = "Aether Active";
                this.statusEl.style.color = "#00ff00";
                this.loop();
            };
        } catch (error) {
            console.error(error);
            this.statusEl.innerText = "Camera Access Denied";
            this.statusEl.style.color = "red";
        }
    }

    private log(msg: string) {
        this.logEl.innerText = msg;
        console.log(`[Gesture] ${msg}`);
    }

    private triggerSystem(action: string) {
        this.log(`Triggering Mac Action: ${action}`);
        window.electronAPI.triggerGestureAction(action);
    }

    private loop() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const rawResults = this.tracker.detect(this.video, performance.now());
            const now = performance.now();
            
            if (rawResults && rawResults.landmarks && rawResults.landmarks.length > 0) {
                this.lastSeenTime = now;
            } else if (now - this.lastSeenTime > 1000) {
                this.smoothedHands = [];
            }

            if (rawResults && rawResults.landmarks) {
                rawResults.landmarks.slice(0, 1).forEach((landmarks: any, hIdx: number) => {
                    // Smooth tracking
                    if (!this.smoothedHands[hIdx]) {
                        this.smoothedHands[hIdx] = landmarks.map((p: any) => ({...p}));
                    } else {
                        landmarks.forEach((pt: any, i: number) => {
                            const smoothed = this.smoothedHands[hIdx][i];
                            if (smoothed && pt) {
                                smoothed.x += (pt.x - smoothed.x) * this.lerpAmount;
                                smoothed.y += (pt.y - smoothed.y) * this.lerpAmount;
                                smoothed.z += (pt.z - smoothed.z) * this.lerpAmount;
                            }
                        });
                    }

                    const smoothed = this.smoothedHands[hIdx];
                    if (!smoothed) return;

                    const state = this.gesture.process(smoothed);

                    // Map Gestures to Electron IPC Calls based on UI Selection
                    
                    const getMapping = (id: string) => {
                        const el = document.getElementById(id) as HTMLSelectElement;
                        return el ? el.value : 'NONE';
                    };

                    // 1. PINCH
                    if (state.isPinching && !this.wasPinchingHands[hIdx]) {
                        const action = getMapping('map-pinch');
                        if (action !== 'NONE') this.triggerSystem(action);
                    }
                    this.wasPinchingHands[hIdx] = state.isPinching;

                    // 2. SWIPES (Left/Right mapped to the same UI dropdown)
                    const swipeAction = getMapping('map-swipe');
                    if (swipeAction !== 'NONE') {
                        if (state.swipeDirection === 'left' && !this.wasSwipingLeft) {
                            if (swipeAction === 'SPACES') this.triggerSystem('SWIPE_LEFT');
                            else this.triggerSystem(swipeAction);
                            this.wasSwipingLeft = true;
                        } else if (state.swipeDirection !== 'left') {
                            this.wasSwipingLeft = false;
                        }

                        if (state.swipeDirection === 'right' && !this.wasSwipingRight) {
                            if (swipeAction === 'SPACES') this.triggerSystem('SWIPE_RIGHT');
                            else this.triggerSystem(swipeAction);
                            this.wasSwipingRight = true;
                        } else if (state.swipeDirection !== 'right') {
                            this.wasSwipingRight = false;
                        }
                    } else {
                        this.wasSwipingLeft = false;
                        this.wasSwipingRight = false;
                    }

                    // 3. FIST
                    if (state.isFist && !this.wasFist) {
                        const action = getMapping('map-fist');
                        if (action !== 'NONE') this.triggerSystem(action);
                    }
                    this.wasFist = state.isFist;

                    // 4. OPEN PALM
                    if (state.isOpenPalm && !this.wasOpenPalm) {
                        const action = getMapping('map-palm');
                        if (action !== 'NONE') this.triggerSystem(action);
                    }
                    this.wasOpenPalm = state.isOpenPalm;
                });
            }

        } catch (error) {
            console.error("Loop Error:", error);
        } finally {
            this.isProcessing = false;
            requestAnimationFrame(() => this.loop());
        }
    }
}

// Start immediately on load
new AetherCommandRenderer();
