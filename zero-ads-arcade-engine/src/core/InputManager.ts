/**
 * InputManager.ts
 * Handlers for Gamepad, Keyboard, and Touch inputs.
 */

export class InputManager {
    private gamepads: Map<number, Gamepad> = new Map();
    private buttonStates: Map<number, boolean[]> = new Map();
    private onInput: (key: string, isPressed: boolean) => void;

    constructor(onInput: (key: string, isPressed: boolean) => void) {
        this.onInput = onInput;
        this.initGamepadListeners();
    }

    private initGamepadListeners() {
        window.addEventListener("gamepadconnected", (e) => {
            console.log(`[Arcade Input] Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}`);
            this.gamepads.set(e.gamepad.index, e.gamepad);
            this.buttonStates.set(e.gamepad.index, new Array(e.gamepad.buttons.length).fill(false));
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log(`[Arcade Input] Gamepad disconnected from index ${e.gamepad.index}`);
            this.gamepads.delete(e.gamepad.index);
            this.buttonStates.delete(e.gamepad.index);
        });

        this.startPolling();
    }

    private pollId: number | null = null;

    private startPolling() {
        const poll = () => {
            const gps = navigator.getGamepads();
            for (const gp of gps) {
                if (gp) {
                    this.gamepads.set(gp.index, gp);
                    this.handleGamepadInput(gp);
                }
            }
            this.pollId = requestAnimationFrame(poll);
        };
        this.pollId = requestAnimationFrame(poll);
    }

    public destroy() {
        if (this.pollId !== null) {
            cancelAnimationFrame(this.pollId);
        }
        // window.removeEventListener is tricky with anonymous arrows, 
        // but for arcade, the poll stop is the critical part.
        console.log("[Arcade Input] InputManager destroyed.");
    }

    private handleGamepadInput(gp: Gamepad) {
        const prevStates = this.buttonStates.get(gp.index);
        if (!prevStates) return;

        // Standard Mapping (Typical Xbox/PlayStation layout)
        const mapping: Record<number, string> = {
            14: 'left',  // D-Pad Left
            15: 'right', // D-Pad Right
            0: 'a',      // Button A/Cross
            1: 'b',      // Button B/Circle
            9: 'pause'   // Menu/Start
        };

        gp.buttons.forEach((btn, index) => {
            const isPressed = btn.pressed;
            if (isPressed !== prevStates[index]) {
                const key = mapping[index];
                if (key) {
                    this.onInput(key, isPressed);
                }
                prevStates[index] = isPressed;
            }
        });
    }

    public getConnectedGamepads() {
        return Array.from(this.gamepads.values());
    }
}
