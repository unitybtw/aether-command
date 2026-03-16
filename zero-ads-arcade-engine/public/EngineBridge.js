/**
 * EngineBridge.js (Compiled/Simplified for Demo)
 */
export class EngineBridge {
    constructor(gameId) {
        this.gameId = gameId;
        this.scoreElement = document.getElementById('score-display');
        this.initListeners();
    }

    initListeners() {
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (data && data.source === 'ARCADE_ENGINE_GAME') {
                this.handleGameMessage(data.payload);
            }
        });
    }

    handleGameMessage(event) {
        console.log(`[Arcade Engine] Received:`, event);
        
        switch (event.type) {
            case 'SCORE_UPDATE':
                this.updateUI(event.value);
                break;
            case 'GAME_OVER':
                alert("GAME OVER! Score: " + event.value);
                break;
            case 'GAME_READY':
                console.log("Game is ready to play!");
                break;
        }
    }

    updateUI(score) {
        if (this.scoreElement) {
            this.scoreElement.innerText = "SCORE: " + score.toString().padStart(5, '0');
        }
    }
}
