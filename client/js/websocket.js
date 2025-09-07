import io from 'socket.io-client';

export class WebSocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.gameSession = null;
    }

    connect(serverUrl = 'http://localhost:3000') {
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to game server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from game server');
            this.isConnected = false;
        });

        this.socket.on('game-joined', (data) => {
            console.log('Game joined:', data);
            this.gameSession = data.session;
        });

        this.socket.on('player-joined', (data) => {
            console.log('Player joined:', data);
        });

        this.socket.on('score-updated', (data) => {
            console.log('Score updated:', data);
        });

        this.socket.on('game-ended', (data) => {
            console.log('Game ended:', data);
        });

        this.socket.on('player-left', (data) => {
            console.log('Player left:', data);
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        return this.socket;
    }

    joinGame(playerData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-game', playerData);
        } else {
            console.error('WebSocket not connected');
        }
    }

    updateScore(scoreData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('score-update', scoreData);
        } else {
            console.error('WebSocket not connected');
        }
    }

    endGame(gameData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('game-over', gameData);
        } else {
            console.error('WebSocket not connected');
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.gameSession = null;
        }
    }

    getGameSession() {
        return this.gameSession;
    }

    isSocketConnected() {
        return this.isConnected;
    }
}
