# 🏎️ TurboWheel - Web3 Racing Mini-Game

A decentralized racing mini-game built with Web3 integration, featuring **Yellow Nitrolite SDK** and **ERC-7824 state channels** for on-chain score tracking and prize distribution.

![TurboWheel Game](https://img.shields.io/badge/Game-TurboWheel-blue)
![Web3](https://img.shields.io/badge/Web3-Enabled-green)
![Yellow SDK](https://img.shields.io/badge/Yellow-SDK-yellow)
![ERC-7824](https://img.shields.io/badge/ERC--7824-State%20Channels-orange)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🏆 Hackathon Alignment

**TurboWheel** is specifically designed for hackathons focusing on:
- **Yellow Protocol Integration**: Full Yellow Nitrolite SDK implementation
- **ERC-7824 State Channels**: On-chain game state management
- **Real-time Web3 Gaming**: WebSocket + blockchain integration
- **Prize Distribution**: Automated reward system using state channels
- **Open Source**: MIT licensed, hackathon-ready codebase

## 🎮 Game Features

- **Mouse-controlled racing**: Move your car left and right with mouse movement
- **Coin collection**: Collect coins for +10 points each
- **Dynamic difficulty**: Game speed increases every 50 points
- **Obstacle avoidance**: Avoid red obstacles or face Game Over
- **Score persistence**: Best scores saved locally and on-chain
- **Web3 integration**: Connect MetaMask wallet for on-chain features
- **Prize distribution**: Top 3 players split the prize pool (50%/30%/20%)

## 🏗️ Architecture

### Frontend
- **HTML5 Canvas**: Smooth 60fps game rendering
- **Tailwind CSS**: Modern, responsive UI design
- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **MetaMask Integration**: Web3 wallet connection
- **Yellow Nitrolite SDK**: State channel management

### Backend
- **Node.js + Express**: RESTful API server
- **In-memory storage**: Demo data persistence
- **CORS enabled**: Cross-origin request support
- **Real-time updates**: Live score and prize pool tracking

### Smart Contracts
- **ERC-7824 Compatible**: State channel implementation
- **OpenZeppelin**: Security-first contract development
- **Prize Distribution**: Automated top 3 player rewards
- **Score Verification**: On-chain score validation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MetaMask browser extension
- Git
- Sepolia testnet ETH (for full Web3 features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/turbowheel.git
   cd turbowheel
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   ```bash
   # Copy environment template
   cp server/env.example server/.env
   
   # Edit server/.env with your values:
   # SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   # PRIVATE_KEY=your_private_key_here
   # YELLOW_API_KEY=your_yellow_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health

### Game Controls
- **Connect Wallet**: Click "Connect MetaMask" to enable Web3 features
- **Mouse Movement**: Move car left/right
- **Start Game**: Click "Start Game" button (requires wallet connection)
- **Restart**: Click "Restart" after Game Over

### Yellow SDK Integration
- **State Channels**: Each game session creates an ERC-7824 state channel
- **Score Logging**: Real-time score updates logged to state channel
- **Prize Distribution**: Automated top 3 player rewards via state channels
- **WebSocket**: Real-time game updates and multiplayer support

## 🔧 Development Setup

### Project Structure
```
turbowheel/
├── client/                 # Frontend application
│   ├── js/
│   │   ├── main.js        # Main application logic
│   │   ├── game.js        # Game engine
│   │   ├── web3.js        # Web3 integration
│   │   └── dashboard.js   # Dashboard management
│   ├── index.html         # Main HTML file
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── server/                # Backend API
│   ├── index.js          # Express server
│   ├── package.json      # Backend dependencies
│   └── env.example       # Environment variables template
├── contracts/            # Smart contracts
│   ├── TurboWheelChannel.sol  # Main contract
│   ├── scripts/
│   │   └── deploy.js     # Deployment script
│   ├── hardhat.config.js # Hardhat configuration
│   └── package.json      # Contract dependencies
├── public/
│   └── assets/           # Game assets
│       ├── car.png       # Car sprite
│       ├── coin.png      # Coin sprite
│       └── obstacle.png  # Obstacle sprite
└── README.md
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=3000
NODE_ENV=development
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
YELLOW_API_KEY=your_yellow_api_key_here
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run client          # Start frontend only
npm run server          # Start backend only

# Building
npm run build           # Build frontend for production
npm start              # Start production server

# Smart Contracts
cd contracts
npm run compile        # Compile contracts
npm run test          # Run contract tests
npm run deploy:sepolia # Deploy to Sepolia testnet
```

## 🌐 Web3 Integration

### MetaMask Setup
1. Install MetaMask browser extension
2. Create or import a wallet
3. Switch to Sepolia testnet
4. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

### Yellow Nitrolite SDK
The game integrates with Yellow's Nitrolite SDK for:
- **State Channel Management**: Off-chain score tracking
- **ERC-7824 Compliance**: Standardized state channel protocol
- **Prize Distribution**: Automated reward distribution
- **Gas Optimization**: Reduced transaction costs

### Smart Contract Features
- **Score Submission**: Players pay 0.001 ETH to submit scores
- **Prize Pool**: Accumulated fees distributed to top players
- **Verification**: On-chain score validation
- **Transparency**: All transactions publicly verifiable

## 🎯 Game Mechanics

### Scoring System
- **Coins**: +10 points each
- **Speed Levels**: Increase every 50 points
- **Best Score**: Persisted locally and on-chain
- **Leaderboard**: Top 10 scores displayed

### Prize Distribution
- **1st Place**: 50% of prize pool
- **2nd Place**: 30% of prize pool
- **3rd Place**: 20% of prize pool
- **Minimum Players**: 3 players required for distribution

### Difficulty Progression
- **Level 1**: Base speed (2px/frame)
- **Level 2**: +0.5 speed (50+ points)
- **Level 3**: +0.5 speed (100+ points)
- **Continues**: +0.5 speed every 50 points

## 🚀 Deployment

### Frontend (Vercel)
1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Environment Variables (Vercel):**
   - `VITE_API_URL`: Your backend API URL
   - `VITE_CONTRACT_ADDRESS`: Deployed contract address
   - `VITE_NETWORK`: sepolia

### Backend (Render)
1. **Connect GitHub repository** to Render
2. **Set build settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `server`

3. **Environment Variables (Render):**
   - `PORT`: 3000
   - `NODE_ENV`: production
   - `SEPOLIA_RPC_URL`: Your Infura/Alchemy URL
   - `PRIVATE_KEY`: Your wallet private key
   - `YELLOW_API_KEY`: Your Yellow SDK API key

### Smart Contracts (Sepolia)
1. **Get Sepolia ETH** from [Sepolia Faucet](https://sepoliafaucet.com/)
2. **Deploy contracts:**
   ```bash
   cd contracts
   npm run deploy:sepolia
   ```
3. **Update contract addresses** in frontend configuration

## 🧪 Testing

### Local Testing
```bash
# Start local blockchain
npx hardhat node

# Deploy contracts locally
cd contracts
npm run deploy:localhost

# Start game with local contracts
npm run dev
```

### Contract Testing
```bash
cd contracts
npm run test
```

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated
- **Reentrancy Protection**: OpenZeppelin's ReentrancyGuard
- **Access Control**: Owner-only functions protected
- **Emergency Withdraw**: Owner can recover funds if needed
- **Score Verification**: On-chain score validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Yellow Protocol**: For the Nitrolite SDK
- **OpenZeppelin**: For secure smart contract libraries
- **Ethereum Foundation**: For the Sepolia testnet
- **MetaMask**: For Web3 wallet integration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/turbowheel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/turbowheel/discussions)
- **Email**: support@turbowheel.game

## 🎮 Play Now

Ready to race? Visit the live game at: [https://turbowheel.vercel.app](https://turbowheel.vercel.app)

---

**Built with ❤️ for the Web3 gaming community**