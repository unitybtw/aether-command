/**
 * GestureEngine.ts
 * Interprets hand landmark data into semantic gestures.
 */

export interface GestureState {
    isPinching: boolean;
    pinchStrength: number;
    velocity: { x: number, y: number };
    swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
    isFist: boolean;
    isOpenPalm: boolean;
}

export class GestureEngine {
    private lastWristPos: { x: number, y: number } | null = null;
    private velocity = { x: 0, y: 0 };

    public process(landmarks: any[]): GestureState {
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        const middleTip = landmarks[12];
        const middlePip = landmarks[10];
        const ringTip = landmarks[16];
        const ringPip = landmarks[14];
        const pinkyTip = landmarks[20];
        const pinkyPip = landmarks[18];

        // 1. Pinch Detection
        const dist = this.calculateDistance(thumbTip, indexTip);
        const isPinching = dist < 0.05;
        const pinchStrength = Math.max(0, 1 - (dist / 0.1));

        // 2. Velocity & Directional Swipe (Relative to screen)
        // Since webcam is mirrored, x changes direction
        let swipeDirection: 'left' | 'right' | 'up' | 'down' | null = null;
        if (this.lastWristPos) {
            this.velocity = {
                x: wrist.x - this.lastWristPos.x,
                y: wrist.y - this.lastWristPos.y
            };
            
            const thresh = 0.04; // Swipe speed threshold
            if (this.velocity.x > thresh) swipeDirection = 'left'; // Mirrored
            else if (this.velocity.x < -thresh) swipeDirection = 'right'; // Mirrored
            else if (this.velocity.y < -thresh) swipeDirection = 'up';
            else if (this.velocity.y > thresh) swipeDirection = 'down';
        }
        this.lastWristPos = { x: wrist.x, y: wrist.y };

        // 3. Pose Classification (Fist vs Open Palm)
        // Check if tips are below PIP joints (in Y space, higher Y is "lower" on screen)
        // Actually, using distance to wrist is safer than pure Y to handle hand rotation
        const isIndexFolded = this.calculateDistance(indexTip, wrist) < this.calculateDistance(indexPip, wrist);
        const isMiddleFolded = this.calculateDistance(middleTip, wrist) < this.calculateDistance(middlePip, wrist);
        const isRingFolded = this.calculateDistance(ringTip, wrist) < this.calculateDistance(ringPip, wrist);
        const isPinkyFolded = this.calculateDistance(pinkyTip, wrist) < this.calculateDistance(pinkyPip, wrist);

        const isFist = isIndexFolded && isMiddleFolded && isRingFolded && isPinkyFolded;
        const isOpenPalm = !isIndexFolded && !isMiddleFolded && !isRingFolded && !isPinkyFolded;

        return {
            isPinching,
            pinchStrength,
            velocity: this.velocity,
            swipeDirection,
            isFist,
            isOpenPalm
        };
    }

    private calculateDistance(p1: any, p2: any): number {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + 
            Math.pow(p1.y - p2.y, 2) + 
            Math.pow(p1.z - p2.z, 2)
        );
    }
}
