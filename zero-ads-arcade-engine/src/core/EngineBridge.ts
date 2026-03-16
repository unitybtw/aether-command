/**
 * EngineBridge.ts
 * Bu dosya, ana sayfa ile iframe içindeki oyun arasındaki güvenli iletişimi sağlar.
 * Oyunun High Score'u veya durumunu ana sayfaya göndermesi için bir köprü görevi görür.
 */

import { SoundManager } from './SoundManager.js';
import { SessionManager } from './SessionManager.js';
import { InputManager } from './InputManager.js';

export type GameEventType = 'SCORE_UPDATE' | 'GAME_OVER' | 'GAME_READY' | 'LEVEL_UP' | 'PAUSE' | 'RESUME' | 'GAME_ERROR' | 'INPUT_EVENT';

export interface GameEvent {
    type: GameEventType;
    value: any;
    timestamp: number;
}

export class EngineBridge {
    private gameId: string;
    private targetOrigin: string;
    private handlers: Map<GameEventType, ((data: any) => void)[]> = new Map();
    public sound: SoundManager;
    public session: SessionManager;
    public input: InputManager;
    private iframe: HTMLIFrameElement | null = null;
    private startTime: number = Date.now();

    constructor(gameId: string, iframeId?: string, targetOrigin: string = '*') {
        this.gameId = gameId;
        this.targetOrigin = targetOrigin;
        
        // Environment check
        if (!window.localStorage) {
            console.error("[Arcade Engine] LocalStorage is not supported in this environment. Scoring will be disabled.");
        }

        this.sound = new SoundManager();
        this.session = new SessionManager(gameId);
        
        // Input Manager (Safe check for Gamepad API)
        this.input = new InputManager((key, isPressed) => {
            this.emitLocalEvent('INPUT_EVENT', { key, isPressed });
            this.sendToGame('INPUT_EVENT', { key, isPressed });
        });
        
        if (iframeId) {
            this.iframe = document.getElementById(iframeId) as HTMLIFrameElement;
            this.initErrorBoundary();
        }

        this.initSession();
        this.initListeners();
    }

    private initSession() {
        const data = this.session.getSession();
        this.session.saveSession({ sessionCount: (data.sessionCount || 0) + 1 });
        
        // Track play time on exit/visibility change
        window.addEventListener('beforeunload', () => this.syncSession());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this.syncSession();
        });
    }

    private syncSession() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const data = this.session.getSession();
        this.session.saveSession({ totalPlayTime: (data.totalPlayTime || 0) + elapsed });
        this.startTime = Date.now(); // Reset for next sync
    }

    private sendToGame(type: string, value: any) {
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage({
                source: 'ARCADE_ENGINE_HOST',
                payload: { type, value, timestamp: Date.now() }
            }, this.targetOrigin);
        }
    }

    private initErrorBoundary() {
        if (!this.iframe) return;

        this.iframe.onerror = (e) => {
            console.error(`[Arcade Engine] Iframe error detected for ${this.gameId}:`, e);
            this.emitLocalEvent('GAME_ERROR', { message: 'Iframe failed to load' });
        };

        // Check for empty src or blocked content
        setTimeout(() => {
            if (this.iframe && (!this.iframe.src || this.iframe.src === 'about:blank')) {
                this.emitLocalEvent('GAME_ERROR', { message: 'Iframe source is invalid' });
            }
        }, 2000);
    }

    private emitLocalEvent(type: GameEventType | 'GAME_ERROR', value: any) {
        const handlers = this.handlers.get(type as GameEventType);
        if (handlers) {
            handlers.forEach(h => h(value));
        }
    }

    public off(type: GameEventType, handler: (data: any) => void) {
        const eventHandlers = this.handlers.get(type);
        if (eventHandlers) {
            this.handlers.set(type, eventHandlers.filter(h => h !== handler));
        }
    }

    public destroy() {
        this.syncSession();
        this.input.destroy();
        window.removeEventListener('message', this.messageListener);
        window.removeEventListener('beforeunload', this.syncSession);
        // Additional cleanup for handlers
        this.handlers.clear();
        console.log(`[Arcade Engine] Bridge for ${this.gameId} destroyed.`);
    }

    private messageListener = (event: MessageEvent) => {
        // Security check: Only process messages from the allowed origin
        if (this.targetOrigin !== '*' && event.origin !== this.targetOrigin) {
            console.warn(`[Arcade Engine] Blocking message from unauthorized origin: ${event.origin}`);
            return;
        }

        const data = event.data;
        if (data && data.source === 'ARCADE_ENGINE_GAME') {
            this.handleGameMessage(data.payload as GameEvent, event.origin);
        }
    }

    private initListeners() {
        window.addEventListener('message', this.messageListener);
    }

    private handleGameMessage(event: GameEvent, senderOrigin: string) {
        // Double check origin if not wildcard
        if (this.targetOrigin !== '*' && senderOrigin !== this.targetOrigin) return;

        console.log(`[Arcade Engine] Event: ${event.type}`, event.value);
        
        const eventHandlers = this.handlers.get(event.type);
        if (eventHandlers) {
            eventHandlers.forEach(handler => handler(event.value));
        }

        // Default handling for critical events
        if (event.type === 'SCORE_UPDATE') {
            this.syncScore(event.value);
        }
    }

    private syncScore(score: number) {
        localStorage.setItem(`arcade_score_${this.gameId}`, score.toString());
    }
}
