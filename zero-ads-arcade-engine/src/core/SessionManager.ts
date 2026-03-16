/**
 * SessionManager.ts
 * Handles persistent game state and session metadata.
 */

export interface SessionData {
    gameId: string;
    highScore: number;
    lastPlayed: number;
    totalPlayTime: number; // In seconds
    sessionCount: number;
    version: string;
    customData: Record<string, any>;
}

export class SessionManager {
    private storageKey: string;

    constructor(gameId: string) {
        this.storageKey = `arcade_session_${gameId}`;
    }

    public saveSession(data: Partial<SessionData>) {
        const current = this.getSession();
        const updated: SessionData = {
            ...current,
            ...data,
            lastPlayed: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(updated));
    }

    public getSession(): SessionData {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                return JSON.parse(raw) as SessionData;
            } catch (e) {
                console.error("[Arcade Session] Failed to parse session data:", e);
            }
        }
        return {
            gameId: this.storageKey.replace('arcade_session_', ''),
            highScore: 0,
            lastPlayed: Date.now(),
            totalPlayTime: 0,
            sessionCount: 0,
            version: '1.0.0',
            customData: {}
        };
    }

    public clearSession() {
        localStorage.removeItem(this.storageKey);
    }
}
