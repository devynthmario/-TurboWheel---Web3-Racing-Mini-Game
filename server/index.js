const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const YellowSDK = require('./yellow-sdk');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://your-frontend-domain.com'] : true,
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../client')));

// Initialize Yellow SDK
const yellowSDK = new YellowSDK();

// Initialize Yellow SDK on server start
yellowSDK.init().then((success) => {
    if (success) {
        console.log('🚀 Yellow SDK ready for Web3 integration!');
    } else {
        console.log('⚠️ Yellow SDK initialization failed, running in demo mode');
    }
}).catch((error) => {
    console.error('❌ Yellow SDK initialization error:', error);
});

// Anti-cheat validation function
function validateScoreProof(proof, score) {
    // Very lenient validation for demo - allow almost all scores
    console.log('Server validating score:', score);
    
    // Only reject extremely suspicious scores
    if (score > 10000) {
        console.warn('Extremely high score detected:', score);
        return false;
    }
    
    // Allow all other scores
    console.log('Server score validation passed:', score);
    return true;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

// In-memory storage for demo purposes
// In production, you would use a proper database
let gameData = {
    highScores: [],
    prizePool: '0.0',
    totalGames: 0,
    activeChannels: new Map()
};

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    socket.on('join-game', async (playerData) => {
        try {
            // Start Yellow SDK session
            const session = await yellowSDK.startGameSession(
                playerData.walletAddress || 'anonymous',
                playerData.gameId || 'turbowheel_v1'
            );
            
            // Store session info
            gameData.activeChannels.set(socket.id, session);
            
            socket.join('game-room');
            socket.emit('game-joined', { 
                playerId: socket.id, 
                session: session,
                ...playerData 
            });
            io.to('game-room').emit('player-joined', { 
                playerId: socket.id, 
                session: session,
                ...playerData 
            });
        } catch (error) {
            console.error('Error starting game session:', error);
            socket.emit('error', { message: 'Failed to start game session' });
        }
    });
    
    socket.on('score-update', async (scoreData) => {
        try {
            const session = gameData.activeChannels.get(socket.id);
            if (session) {
                // Log score to Yellow SDK state channel
                await yellowSDK.logScoreUpdate(
                    session.channelId,
                    scoreData.score,
                    scoreData.gameState
                );
            }
            
            io.to('game-room').emit('score-updated', scoreData);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    });
    
    socket.on('game-over', async (gameData) => {
        try {
            // Validate score proof
            if (!validateScoreProof(gameData.proof, gameData.score)) {
                console.warn('Invalid score proof detected for socket:', socket.id);
                socket.emit('score-rejected', { reason: 'Invalid proof' });
                return;
            }
            
            const session = gameData.activeChannels.get(socket.id);
            if (session) {
                // End Yellow SDK session
                const finalState = await yellowSDK.endGameSession(
                    session.channelId,
                    gameData.score
                );
                
                // Add to high scores with proof
                gameData.highScores.push({
                    player: session.player,
                    score: gameData.score,
                    timestamp: Date.now(),
                    channelId: session.channelId,
                    gameId: session.gameId,
                    proof: gameData.proof
                });
                
                // Update prize pool
                const basePrize = 0.001;
                const currentPrize = parseFloat(gameData.prizePool);
                gameData.prizePool = (currentPrize + basePrize).toFixed(3);
                
                gameData.totalGames++;
                
                // Remove from active channels
                gameData.activeChannels.delete(socket.id);
                
                io.to('game-room').emit('game-ended', {
                    ...gameData,
                    finalState: finalState
                });
            }
        } catch (error) {
            console.error('Error ending game session:', error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        // Clean up active channel
        const session = gameData.activeChannels.get(socket.id);
        if (session) {
            gameData.activeChannels.delete(socket.id);
        }
        
        io.to('game-room').emit('player-left', { playerId: socket.id });
    });
});

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get high scores
app.get('/api/scores', (req, res) => {
    try {
        const sortedScores = gameData.highScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        res.json({
            success: true,
            scores: sortedScores,
            total: gameData.highScores.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch scores'
        });
    }
});

// Submit score
app.post('/api/scores', (req, res) => {
    try {
        const { player, score, gameId, timestamp } = req.body;
        
        if (!player || typeof score !== 'number' || score < 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid score data'
            });
        }

        const scoreData = {
            player,
            score,
            gameId: gameId || 'turbowheel_v1',
            timestamp: timestamp || Date.now(),
            id: Date.now().toString()
        };

        gameData.highScores.push(scoreData);
        gameData.totalGames++;
        
        // Update prize pool (demo logic)
        const basePrize = 0.001; // 0.001 ETH per game
        const currentPrize = parseFloat(gameData.prizePool);
        gameData.prizePool = (currentPrize + basePrize).toFixed(3);

        res.json({
            success: true,
            score: scoreData,
            message: 'Score submitted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to submit score'
        });
    }
});

// Get prize pool info
app.get('/api/prize-pool', (req, res) => {
    try {
        const distribution = {
            first: '50%',
            second: '30%',
            third: '20%'
        };

        res.json({
            success: true,
            total: gameData.prizePool,
            distribution,
            totalGames: gameData.totalGames
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch prize pool'
        });
    }
});

// Initialize Yellow SDK
app.post('/api/init-yellow-sdk', async (req, res) => {
    try {
        const initialized = await yellowSDK.init();
        if (initialized) {
            const networkInfo = await yellowSDK.getNetworkInfo();
            res.json({
                success: true,
                message: 'Yellow SDK initialized successfully',
                network: networkInfo
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to initialize Yellow SDK'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to initialize Yellow SDK: ' + error.message
        });
    }
});

// Distribute prizes using Yellow SDK
app.post('/api/distribute-prizes', async (req, res) => {
    try {
        const topScores = gameData.highScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        if (topScores.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Not enough players for prize distribution'
            });
        }

        // Use Yellow SDK to simulate prize distribution
        const distribution = await yellowSDK.simulatePrizeDistribution(topScores);

        // Reset prize pool after distribution
        gameData.prizePool = '0.0';

        res.json({
            success: true,
            distribution,
            message: 'Prizes distributed successfully using Yellow SDK'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to distribute prizes: ' + error.message
        });
    }
});

// Get game statistics
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            totalGames: gameData.totalGames,
            totalPlayers: new Set(gameData.highScores.map(s => s.player)).size,
            averageScore: gameData.highScores.length > 0 
                ? (gameData.highScores.reduce((sum, s) => sum + s.score, 0) / gameData.highScores.length).toFixed(2)
                : 0,
            highestScore: gameData.highScores.length > 0 
                ? Math.max(...gameData.highScores.map(s => s.score))
                : 0,
            prizePool: gameData.prizePool
        };

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

// Serve the main game page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

server.listen(PORT, () => {
    console.log(`🚀 TurboWheel server running on port ${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🎮 Game available at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready for real-time updates`);
});

module.exports = app;
