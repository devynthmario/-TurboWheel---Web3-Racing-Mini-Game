import { YellowSDK } from './web3.js';
import { ApiClient } from './api.js';

export class Dashboard {
    constructor() {
        this.yellowSDK = null;
        this.apiClient = new ApiClient();
        this.highScores = [];
        this.prizePool = null;
    }

    async init() {
        // Initialize will be called from main.js after Web3Manager is ready
        console.log('Dashboard initialized');
    }

    setWeb3Manager(web3Manager) {
        this.yellowSDK = new YellowSDK(web3Manager);
    }

    async loadHighScores() {
        console.log('Loading high scores...');
        
        try {
            // Get your current best score from localStorage
            const yourAddress = this.getPlayerAddress();
            const yourBestScore = parseInt(localStorage.getItem('bestScore') || '0');
            
            // Create example scores with your real score
            const exampleScores = [
                { score: Math.max(yourBestScore, 500), player: yourAddress, timestamp: Date.now() - 3600000 }, // Your real score
                { score: 1250, player: '0x8ba1f109551bD432803012645Hac136c', timestamp: Date.now() - 86400000 },
                { score: 980, player: '0x1234567890123456789012345678901234567890', timestamp: Date.now() - 172800000 },
                { score: 750, player: '0x9876543210987654321098765432109876543210', timestamp: Date.now() - 259200000 },
                { score: 650, player: '0x5555555555555555555555555555555555555555', timestamp: Date.now() - 345600000 }
            ];
            
            // Sort by score (highest first)
            exampleScores.sort((a, b) => b.score - a.score);
            
            this.highScores = exampleScores;
            console.log('High scores loaded with your score:', yourBestScore, this.highScores);
            
            this.updateHighScoresUI();
        } catch (error) {
            console.error('Error loading high scores:', error);
            this.highScores = [];
            this.updateHighScoresUI();
        }
    }

    async loadPrizePool() {
        try {
            // Simulate 1 ETH prize pool with specific distributions
            this.prizePool = {
                total: 1.0, // 1 ETH
                distribution: {
                    first: '0.5 ETH (50%)',
                    second: '0.3 ETH (30%)',
                    third: '0.2 ETH (20%)'
                }
            };
            this.updatePrizePoolUI();
        } catch (error) {
            console.error('Error loading prize pool:', error);
            // Fallback data
            this.prizePool = {
                total: 1.0,
                distribution: {
                    first: '0.5 ETH (50%)',
                    second: '0.3 ETH (30%)',
                    third: '0.2 ETH (20%)'
                }
            };
            this.updatePrizePoolUI();
        }
    }

    async submitScore(score) {
        try {
            if (this.yellowSDK) {
                await this.yellowSDK.submitScore(score);
                // Reload high scores after submission
                await this.loadHighScores();
                await this.loadPrizePool();
            } else {
                // Try API first, then fallback to local storage
                try {
                    await this.apiClient.submitScore({
                        player: this.getPlayerAddress(),
                        score: score,
                        gameId: 'turbowheel_v1',
                        timestamp: Date.now()
                    });
                    // Reload data after successful API submission
                    await this.loadHighScores();
                    await this.loadPrizePool();
                } catch (apiError) {
                    console.error('API submission failed, using local storage:', apiError);
                    this.addScoreToLocalStorage(score);
                }
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            // Fallback to local storage
            this.addScoreToLocalStorage(score);
        }
    }

    addScoreToLocalStorage(score) {
        const playerAddress = this.getPlayerAddress();
        const scoreData = {
            player: playerAddress,
            score: score,
            timestamp: Date.now(),
            gameId: 'turbowheel_v1'
        };

        // Get existing high scores
        let highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
        
        // If no existing scores, create example scores
        if (highScores.length === 0) {
            highScores = [
                { score: 1250, player: '0x8ba1f109551bD432803012645Hac136c', timestamp: Date.now() - 86400000 },
                { score: 980, player: '0x1234567890123456789012345678901234567890', timestamp: Date.now() - 172800000 },
                { score: 750, player: '0x9876543210987654321098765432109876543210', timestamp: Date.now() - 259200000 },
                { score: 650, player: '0x5555555555555555555555555555555555555555', timestamp: Date.now() - 345600000 }
            ];
        }
        
        // Remove any existing score from the same player
        highScores = highScores.filter(s => s.player !== playerAddress);
        
        // Add new score
        highScores.push(scoreData);
        
        // Sort by score (highest first)
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep top 10
        highScores = highScores.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('highScores', JSON.stringify(highScores));
        
        // Update UI
        this.highScores = highScores;
        this.updateHighScoresUI();
        
        console.log('Score added to high scores:', scoreData);
        console.log('Updated high scores:', this.highScores);
    }

    getPlayerAddress() {
        // Try to get from Web3Manager, fallback to 'Anonymous'
        const walletElement = document.getElementById('walletAddress');
        if (walletElement && walletElement.textContent !== 'Not Connected') {
            return walletElement.textContent;
        }
        
        // If no wallet connected, use a demo address
        return '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    }

    updateScore(score) {
        document.getElementById('currentScore').textContent = score;
    }

    updateBestScore(score) {
        const bestScoreElement = document.getElementById('bestScore');
        const currentBest = parseInt(bestScoreElement.textContent);
        if (score > currentBest) {
            bestScoreElement.textContent = score;
        }
    }

    updateHighScoresUI() {
        const highScoresElement = document.getElementById('highScores');
        console.log('Updating high scores UI, scores:', this.highScores);
        
        if (!highScoresElement) {
            console.error('highScores element not found!');
            return;
        }
        
        if (this.highScores.length === 0) {
            highScoresElement.innerHTML = `
                <div class="text-white/60 text-center py-4">No scores yet - Be the first!</div>
            `;
            return;
        }

        const scoresHTML = this.highScores.slice(0, 5).map((scoreData, index) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
            const player = scoreData.player.length > 10 
                ? `${scoreData.player.slice(0, 6)}...${scoreData.player.slice(-4)}`
                : scoreData.player;
            const timeAgo = this.getTimeAgo(scoreData.timestamp);
            
            // Highlight current player's score
            const currentPlayer = this.getPlayerAddress();
            const isCurrentPlayer = scoreData.player === currentPlayer;
            const bgColor = isCurrentPlayer ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-800';
            
            return `<div class="flex justify-between items-center p-2 ${bgColor} rounded mb-2 ${isCurrentPlayer ? 'ring-2 ring-blue-400' : ''}">
                <div class="flex items-center space-x-2">
                    <span class="text-xl">${rankEmoji}</span>
                    <div>
                        <div class="font-bold text-white">${scoreData.score} pts</div>
                        <div class="text-xs ${isCurrentPlayer ? 'text-blue-100' : 'text-gray-400'}">${player} ${isCurrentPlayer ? '(You!)' : ''}</div>
                    </div>
                </div>
                <div class="text-xs ${isCurrentPlayer ? 'text-blue-100' : 'text-gray-500'}">${timeAgo}</div>
            </div>`;
        }).join('');

        highScoresElement.innerHTML = scoresHTML;
        console.log('High scores UI updated');
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    updatePrizePoolUI() {
        const prizePoolElement = document.getElementById('prizePool');
        
        if (this.prizePool) {
            prizePoolElement.innerHTML = `
                <div class="bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 rounded-lg">
                    <h3 class="text-lg font-bold text-white mb-2">🏆 Prize Pool</h3>
                    <div class="text-white">
                        <div class="text-2xl font-bold">${this.prizePool.total} ETH</div>
                        <div class="text-sm mt-2 space-y-1">
                            <div>🥇 1st Place: ${this.prizePool.distribution.first}</div>
                            <div>🥈 2nd Place: ${this.prizePool.distribution.second}</div>
                            <div>🥉 3rd Place: ${this.prizePool.distribution.third}</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            prizePoolElement.innerHTML = `
                <div class="bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 rounded-lg">
                    <h3 class="text-lg font-bold text-white mb-2">🏆 Prize Pool</h3>
                    <div class="text-white">
                        <div class="text-2xl font-bold">1.0 ETH</div>
                        <div class="text-sm mt-2 space-y-1">
                            <div>🥇 1st Place: 0.5 ETH (50%)</div>
                            <div>🥈 2nd Place: 0.3 ETH (30%)</div>
                            <div>🥉 3rd Place: 0.2 ETH (20%)</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async distributePrizes() {
        if (!this.yellowSDK) {
            alert('Web3 connection required for prize distribution');
            return;
        }

        try {
            const prizes = await this.yellowSDK.distributePrizes();
            alert(`Prizes distributed successfully! Check the console for details.`);
            console.log('Prizes distributed:', prizes);
        } catch (error) {
            console.error('Error distributing prizes:', error);
            alert('Error distributing prizes: ' + error.message);
        }
    }
}
