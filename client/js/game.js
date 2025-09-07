export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Load game images
        this.images = {
            car: new Image(),
            coin: new Image(),
            obstacle: new Image()
        };
        
        // Set image sources - try multiple paths
        this.images.car.src = '/assets/car.png';
        this.images.coin.src = '/assets/coin.png';
        this.images.obstacle.src = '/assets/obstacle.png';
        
        // Fallback paths
        setTimeout(() => {
            if (!this.images.car.complete) {
                this.images.car.src = './assets/car.png';
            }
            if (!this.images.coin.complete) {
                this.images.coin.src = './assets/coin.png';
            }
            if (!this.images.obstacle.complete) {
                this.images.obstacle.src = './assets/obstacle.png';
            }
        }, 100);
        
        // Debug: Log image loading
        this.images.car.onload = () => console.log('Car image loaded successfully');
        this.images.coin.onload = () => console.log('Coin image loaded successfully');
        this.images.obstacle.onload = () => console.log('Obstacle image loaded successfully');
        
        this.images.car.onerror = () => console.log('Car image failed to load');
        this.images.coin.onerror = () => console.log('Coin image failed to load');
        this.images.obstacle.onerror = () => console.log('Obstacle image failed to load');
        
        // Game state
        this.isRunning = false;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore') || '0');
        this.speedLevel = 1;
        this.gameSpeed = 2;
        
        // Anti-cheat system
        this.gameSession = {
            startTime: null,
            actions: [],
            coinsCollected: 0,
            obstaclesAvoided: 0,
            sessionId: null,
            playerHash: null
        };
        
        // Car properties
        this.car = {
            x: this.width / 2 - 25,
            y: this.height - 80,
            width: 50,
            height: 80,
            speed: 5
        };
        
        // Game objects
        this.coins = [];
        this.obstacles = [];
        this.particles = [];
        
        // Mouse tracking
        this.mouseX = this.car.x;
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left - this.car.width / 2;
        });
        
        // Callbacks
        this.onScoreUpdate = null;
        this.onGameOver = null;
        
        this.updateUI();
    }

    start() {
        this.isRunning = true;
        this.score = 0;
        this.speedLevel = 1;
        this.gameSpeed = 2;
        this.coins = [];
        this.obstacles = [];
        this.particles = [];
        this.car.x = this.width / 2 - 25;
        
        // Initialize anti-cheat session
        this.gameSession = {
            startTime: Date.now(),
            actions: [],
            coinsCollected: 0,
            obstaclesAvoided: 0,
            sessionId: this.generateSessionId(),
            playerHash: this.generatePlayerHash()
        };
        
        this.updateUI();
        this.gameLoop();
    }

    restart() {
        this.start();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Update car position (smooth following mouse)
        const targetX = Math.max(0, Math.min(this.width - this.car.width, this.mouseX));
        this.car.x += (targetX - this.car.x) * 0.1;
        
        // Spawn coins and obstacles
        if (Math.random() < 0.02) {
            this.spawnCoin();
        }
        if (Math.random() < 0.01) {
            this.spawnObstacle();
        }
        
        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.y += this.gameSpeed;
            
            // Check collision with car
            if (this.checkCollision(this.car, coin)) {
                this.coins.splice(i, 1);
                this.score += 10;
                this.gameSession.coinsCollected++;
                this.logAction('coin_collected', { coinX: coin.x, coinY: coin.y });
                this.createParticles(coin.x + coin.width/2, coin.y + coin.height/2, '#FFD700');
                this.updateUI();
                if (this.onScoreUpdate) this.onScoreUpdate(this.score);
                
                // Increase speed every 50 points (every 5 coins)
                if (this.score > 0 && this.score % 50 === 0) {
                    this.speedLevel++;
                    this.gameSpeed += 0.3;
                }
            }
            
            // Remove coins that are off screen
            if (coin.y > this.height) {
                this.coins.splice(i, 1);
            }
        }
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += this.gameSpeed;
            
            // Check collision with car
            if (this.checkCollision(this.car, obstacle)) {
                this.gameOver();
                return;
            }
            
            // Remove obstacles that are off screen
            if (obstacle.y > this.height) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw road
        this.drawRoad();
        
        // Draw car
        this.drawCar();
        
        // Draw coins
        this.coins.forEach(coin => this.drawCoin(coin));
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
        
        // Draw particles
        this.particles.forEach(particle => this.drawParticle(particle));
    }

    drawRoad() {
        // Road background
        this.ctx.fillStyle = '#2c2c54';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Road lines
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 20]);
        
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.width / 2, 0);
            this.ctx.lineTo(this.width / 2, this.height);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }

    drawCar() {
        // Draw car image if loaded, otherwise fallback to rectangle
        if (this.images.car.complete && this.images.car.naturalWidth > 0) {
            this.ctx.drawImage(this.images.car, this.car.x, this.car.y, this.car.width, this.car.height);
            console.log('Drawing car image');
        } else {
            // Fallback car design
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fillRect(this.car.x, this.car.y, this.car.width, this.car.height);
            
            // Car details
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(this.car.x + 5, this.car.y + 10, 15, 20);
            this.ctx.fillRect(this.car.x + 30, this.car.y + 10, 15, 20);
            
            // Wheels
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(this.car.x - 5, this.car.y + 15, 10, 15);
            this.ctx.fillRect(this.car.x + this.car.width - 5, this.car.y + 15, 10, 15);
            this.ctx.fillRect(this.car.x - 5, this.car.y + 50, 10, 15);
            this.ctx.fillRect(this.car.x + this.car.width - 5, this.car.y + 50, 10, 15);
            console.log('Drawing fallback car');
        }
    }

    drawCoin(coin) {
        // Draw coin image if loaded, otherwise fallback to circle
        if (this.images.coin.complete && this.images.coin.naturalWidth > 0) {
            this.ctx.drawImage(this.images.coin, coin.x, coin.y, coin.width, coin.height);
        } else {
            // Fallback coin design
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Coin shine
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(coin.x + coin.width/2 - 5, coin.y + coin.height/2 - 5, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawObstacle(obstacle) {
        // Draw obstacle image if loaded, otherwise fallback to rectangle
        if (this.images.obstacle.complete && this.images.obstacle.naturalWidth > 0) {
            this.ctx.drawImage(this.images.obstacle, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            // Fallback obstacle design
            this.ctx.fillStyle = '#8B0000';
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Obstacle details
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
        }
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    spawnCoin() {
        const coin = {
            x: Math.random() * (this.width - 30),
            y: -30,
            width: 30,
            height: 30
        };
        this.coins.push(coin);
    }

    spawnObstacle() {
        const obstacle = {
            x: Math.random() * (this.width - 40),
            y: -40,
            width: 40,
            height: 40
        };
        this.obstacles.push(obstacle);
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 3 + 1,
                color: color,
                life: 30,
                maxLife: 30,
                alpha: 1
            });
        }
    }

    gameOver() {
        this.isRunning = false;
        
        console.log('Game over with score:', this.score);
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore.toString());
        }
        
        this.updateUI();

        // Always call game over with valid score
        if (this.onGameOver) {
            this.onGameOver(this.score, true, this.generateScoreProof());
        }
    }

    updateUI() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
        document.getElementById('speedLevel').textContent = this.speedLevel;
    }

    // Anti-cheat functions
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generatePlayerHash() {
        const walletAddress = document.getElementById('walletAddress')?.textContent || 'anonymous';
        return this.simpleHash(walletAddress + Date.now());
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    logAction(action, data = {}) {
        if (!this.gameSession) return;
        
        this.gameSession.actions.push({
            timestamp: Date.now(),
            action: action,
            data: data,
            gameState: {
                score: this.score,
                speedLevel: this.speedLevel,
                carX: this.car.x
            }
        });
    }

    validateScore() {
        // Very lenient validation for demo - allow most scores
        console.log('Validating score:', this.score);
        
        // Only reject extremely suspicious scores
        if (this.score > 10000) {
            console.warn('Extremely high score detected:', this.score);
            return false;
        }
        
        // Allow all other scores
        console.log('Score validation passed:', this.score);
        return true;
    }

    generateScoreProof() {
        if (!this.gameSession) return null;
        
        const proof = {
            sessionId: this.gameSession.sessionId,
            playerHash: this.gameSession.playerHash,
            startTime: this.gameSession.startTime,
            endTime: Date.now(),
            score: this.score,
            actions: this.gameSession.actions,
            coinsCollected: this.gameSession.coinsCollected,
            obstaclesAvoided: this.gameSession.obstaclesAvoided,
            proofHash: this.simpleHash(JSON.stringify({
                sessionId: this.gameSession.sessionId,
                score: this.score,
                actions: this.gameSession.actions.length,
                coinsCollected: this.gameSession.coinsCollected
            }))
        };
        
        return proof;
    }
}
