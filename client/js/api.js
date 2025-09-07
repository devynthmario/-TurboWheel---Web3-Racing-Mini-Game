import axios from 'axios';

class ApiClient {
    constructor(baseURL = 'http://localhost:3000') {
        this.client = axios.create({
            baseURL: baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.client.get('/api/health');
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    // Get high scores
    async getHighScores() {
        try {
            const response = await this.client.get('/api/scores');
            return response.data.scores || [];
        } catch (error) {
            console.error('Failed to fetch high scores:', error);
            return [];
        }
    }

    // Submit score
    async submitScore(scoreData) {
        try {
            const response = await this.client.post('/api/scores', {
                player: scoreData.player,
                score: scoreData.score,
                gameId: scoreData.gameId || 'turbowheel_v1',
                timestamp: scoreData.timestamp || Date.now()
            });
            return response.data;
        } catch (error) {
            console.error('Failed to submit score:', error);
            throw error;
        }
    }

    // Get prize pool info
    async getPrizePool() {
        try {
            const response = await this.client.get('/api/prize-pool');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch prize pool:', error);
            return {
                total: '0.0',
                distribution: {
                    first: '50%',
                    second: '30%',
                    third: '20%'
                }
            };
        }
    }

    // Distribute prizes
    async distributePrizes() {
        try {
            const response = await this.client.post('/api/distribute-prizes');
            return response.data;
        } catch (error) {
            console.error('Failed to distribute prizes:', error);
            throw error;
        }
    }

    // Get game statistics
    async getStats() {
        try {
            const response = await this.client.get('/api/stats');
            return response.data.stats;
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            return {
                totalGames: 0,
                totalPlayers: 0,
                averageScore: 0,
                highestScore: 0,
                prizePool: '0.0'
            };
        }
    }
}

export { ApiClient };
