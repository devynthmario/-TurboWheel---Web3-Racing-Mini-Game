const { ethers } = require('ethers');

/**
 * Yellow Nitrolite SDK Integration
 * ERC-7824 State Channel Implementation for TurboWheel
 */
class YellowSDK {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.channels = new Map(); // Active state channels
        this.isInitialized = false;
    }

    async init() {
        try {
            // Load environment variables
            require('dotenv').config();
            
            // Initialize provider for Sepolia testnet
            this.provider = new ethers.JsonRpcProvider(
                process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
            );

            // Initialize wallet if private key is provided
            if (process.env.PRIVATE_KEY) {
                this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
                console.log('✅ Yellow SDK initialized with wallet:', this.wallet.address);
            } else {
                console.log('⚠️ Yellow SDK initialized without wallet (read-only mode)');
            }

            // Log configuration
            console.log('🔧 Yellow SDK Configuration:');
            console.log('   Network:', process.env.YELLOW_NETWORK || 'sepolia');
            console.log('   API Key:', process.env.YELLOW_API_KEY ? '✅ Set' : '❌ Missing');
            console.log('   Channel Contract:', process.env.YELLOW_CHANNEL_CONTRACT || 'Not set');
            console.log('   Game ID:', process.env.GAME_ID || 'turbowheel_v1');

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Yellow SDK:', error);
            return false;
        }
    }

    /**
     * Start a new game session with state channel
     * @param {string} playerAddress - Player's wallet address
     * @param {string} gameId - Unique game identifier
     * @returns {Object} Channel information
     */
    async startGameSession(playerAddress, gameId = 'turbowheel_v1') {
        if (!this.isInitialized) {
            throw new Error('Yellow SDK not initialized');
        }

        const channelId = this.generateChannelId(playerAddress, gameId);
        const channel = {
            id: channelId,
            player: playerAddress,
            gameId: gameId,
            startTime: Date.now(),
            state: {
                nonce: 0,
                score: 0,
                actions: [],
                isActive: true
            },
            contract: null // Will be set when deploying to testnet
        };

        this.channels.set(channelId, channel);
        
        console.log(`Game session started for player ${playerAddress}, channel: ${channelId}`);
        
        return {
            channelId: channelId,
            player: playerAddress,
            gameId: gameId,
            startTime: channel.startTime
        };
    }

    /**
     * Log score update to state channel
     * @param {string} channelId - Channel identifier
     * @param {number} score - Current score
     * @param {Object} gameState - Additional game state
     */
    async logScoreUpdate(channelId, score, gameState = {}) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }

        if (!channel.state.isActive) {
            throw new Error('Channel is not active');
        }

        // Update channel state
        channel.state.nonce++;
        channel.state.score = score;
        channel.state.actions.push({
            type: 'score_update',
            score: score,
            timestamp: Date.now(),
            gameState: gameState
        });

        console.log(`Score updated in channel ${channelId}: ${score} points`);
        
        // In a real implementation, this would update the ERC-7824 state channel
        // For now, we'll simulate the state channel update
        return {
            channelId: channelId,
            nonce: channel.state.nonce,
            score: score,
            timestamp: Date.now()
        };
    }

    /**
     * End game session and close state channel
     * @param {string} channelId - Channel identifier
     * @param {number} finalScore - Final game score
     * @returns {Object} Final channel state
     */
    async endGameSession(channelId, finalScore) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }

        // Final state update
        channel.state.nonce++;
        channel.state.score = finalScore;
        channel.state.isActive = false;
        channel.state.actions.push({
            type: 'game_end',
            score: finalScore,
            timestamp: Date.now(),
            duration: Date.now() - channel.startTime
        });

        console.log(`Game session ended for channel ${channelId}, final score: ${finalScore}`);

        // In a real implementation, this would:
        // 1. Submit the final state to the ERC-7824 contract
        // 2. Trigger settlement if needed
        // 3. Distribute any prizes

        const finalState = {
            channelId: channelId,
            player: channel.player,
            gameId: channel.gameId,
            finalScore: finalScore,
            duration: Date.now() - channel.startTime,
            totalActions: channel.state.actions.length,
            nonce: channel.state.nonce
        };

        // Keep channel data for prize distribution
        // In production, this would be stored in a database
        return finalState;
    }

    /**
     * Get channel state
     * @param {string} channelId - Channel identifier
     * @returns {Object} Channel state
     */
    getChannelState(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            return null;
        }

        return {
            id: channel.id,
            player: channel.player,
            gameId: channel.gameId,
            isActive: channel.state.isActive,
            score: channel.state.score,
            nonce: channel.state.nonce,
            startTime: channel.startTime,
            actionCount: channel.state.actions.length
        };
    }

    /**
     * Get all active channels
     * @returns {Array} List of active channels
     */
    getActiveChannels() {
        const activeChannels = [];
        for (const [channelId, channel] of this.channels) {
            if (channel.state.isActive) {
                activeChannels.push(this.getChannelState(channelId));
            }
        }
        return activeChannels;
    }

    /**
     * Simulate prize distribution using top scores
     * @param {Array} topScores - Array of top scores
     * @returns {Object} Prize distribution
     */
    async simulatePrizeDistribution(topScores) {
        if (topScores.length < 3) {
            throw new Error('Need at least 3 players for prize distribution');
        }

        const totalPrize = ethers.parseEther('0.1'); // 0.1 ETH total prize pool
        const firstPrize = totalPrize * 50n / 100n; // 50%
        const secondPrize = totalPrize * 30n / 100n; // 30%
        const thirdPrize = totalPrize * 20n / 100n; // 20%

        const distribution = {
            totalPrize: ethers.formatEther(totalPrize),
            prizes: [
                {
                    position: 1,
                    player: topScores[0].player,
                    score: topScores[0].score,
                    amount: ethers.formatEther(firstPrize),
                    percentage: '50%'
                },
                {
                    position: 2,
                    player: topScores[1].player,
                    score: topScores[1].score,
                    amount: ethers.formatEther(secondPrize),
                    percentage: '30%'
                },
                {
                    position: 3,
                    player: topScores[2].player,
                    score: topScores[2].score,
                    amount: ethers.formatEther(thirdPrize),
                    percentage: '20%'
                }
            ],
            distributedAt: Date.now()
        };

        console.log('Prize distribution simulated:', distribution);
        return distribution;
    }

    /**
     * Generate unique channel ID
     * @param {string} playerAddress - Player address
     * @param {string} gameId - Game identifier
     * @returns {string} Channel ID
     */
    generateChannelId(playerAddress, gameId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return ethers.keccak256(
            ethers.toUtf8Bytes(`${playerAddress}-${gameId}-${timestamp}-${random}`)
        );
    }

    /**
     * Verify channel signature (placeholder for ERC-7824 verification)
     * @param {string} channelId - Channel ID
     * @param {Object} state - Channel state
     * @param {string} signature - Player signature
     * @returns {boolean} Verification result
     */
    async verifyChannelSignature(channelId, state, signature) {
        // In a real implementation, this would verify the ERC-7824 signature
        // For now, we'll return true as a placeholder
        console.log(`Verifying signature for channel ${channelId}`);
        return true;
    }

    /**
     * Get network information
     * @returns {Object} Network details
     */
    async getNetworkInfo() {
        if (!this.provider) {
            throw new Error('Provider not initialized');
        }

        const network = await this.provider.getNetwork();
        const blockNumber = await this.provider.getBlockNumber();
        const gasPrice = await this.provider.getFeeData();

        return {
            name: network.name,
            chainId: network.chainId.toString(),
            blockNumber: blockNumber,
            gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei'
        };
    }
}

module.exports = YellowSDK;
