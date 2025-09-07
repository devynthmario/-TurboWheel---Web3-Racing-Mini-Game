import { ethers } from 'ethers';

export class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.isConnected = false;
        this.chainId = null;
    }

    async init() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accounts[0];
                    this.updateUI();
                }
            });

            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                this.chainId = parseInt(chainId, 16);
                this.updateUI();
            });

            // Check if already connected
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.signer = await this.provider.getSigner();
                    this.isConnected = true;
                    this.chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
                    this.updateUI();
                }
            } catch (error) {
                console.error('Error checking existing connection:', error);
            }
        } else {
            console.warn('MetaMask not detected');
        }
    }

    async connectWallet() {
        if (!window.ethereum) {
            alert('Please install MetaMask to connect your wallet');
            return;
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                this.account = accounts[0];
                this.signer = await this.provider.getSigner();
                this.isConnected = true;
                this.chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
                
                // Switch to Sepolia testnet if not already
                if (this.chainId !== 11155111) {
                    await this.switchToSepolia();
                }
                
                this.updateUI();
                console.log('Wallet connected:', this.account);
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            if (error.code === 4001) {
                alert('Please connect your wallet to continue');
            }
        }
    }

    async switchToSepolia() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
            });
        } catch (switchError) {
            // If the chain doesn't exist, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0xaa36a7',
                            chainName: 'Sepolia',
                            rpcUrls: ['https://sepolia.infura.io/v3/'],
                            nativeCurrency: {
                                name: 'SepoliaETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                        }]
                    });
                } catch (addError) {
                    console.error('Error adding Sepolia network:', addError);
                }
            }
        }
    }

    disconnect() {
        this.account = null;
        this.signer = null;
        this.isConnected = false;
        this.chainId = null;
        this.updateUI();
    }

    updateUI() {
        const walletElement = document.getElementById('walletAddress');
        const connectButton = document.getElementById('connectWallet');
        
        if (this.isConnected && this.account) {
            const shortAddress = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
            walletElement.textContent = shortAddress;
            connectButton.textContent = 'Disconnect';
            connectButton.onclick = () => this.disconnect();
        } else {
            walletElement.textContent = 'Not Connected';
            connectButton.textContent = 'Connect MetaMask';
            connectButton.onclick = () => this.connectWallet();
        }
    }

    getAccount() {
        return this.account;
    }

    getSigner() {
        return this.signer;
    }

    getProvider() {
        return this.provider;
    }

    isWalletConnected() {
        return this.isConnected;
    }
}

// Yellow Nitrolite SDK Integration
export class YellowSDK {
    constructor(web3Manager) {
        this.web3Manager = web3Manager;
        this.channel = null;
        this.isInitialized = false;
    }

    async init() {
        if (!this.web3Manager.isWalletConnected()) {
            throw new Error('Wallet not connected');
        }

        try {
            // Initialize Yellow Nitrolite SDK
            // Note: This is a placeholder implementation
            // In a real implementation, you would use the actual Yellow SDK
            this.channel = {
                id: `channel_${Date.now()}`,
                participants: [this.web3Manager.getAccount()],
                state: {
                    scores: [],
                    prizePool: '0',
                    lastUpdate: Date.now()
                }
            };
            
            this.isInitialized = true;
            console.log('Yellow SDK initialized');
        } catch (error) {
            console.error('Error initializing Yellow SDK:', error);
            throw error;
        }
    }

    async submitScore(score) {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            // Submit score to state channel
            const scoreData = {
                player: this.web3Manager.getAccount(),
                score: score,
                timestamp: Date.now(),
                gameId: 'turbowheel_v1'
            };

            // Update channel state
            this.channel.state.scores.push(scoreData);
            this.channel.state.lastUpdate = Date.now();

            // In a real implementation, this would update the ERC-7824 state channel
            console.log('Score submitted to state channel:', scoreData);
            
            return scoreData;
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    }

    async getHighScores() {
        if (!this.isInitialized) {
            await this.init();
        }

        // Return top scores from state channel
        return this.channel.state.scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }

    async getPrizePool() {
        if (!this.isInitialized) {
            await this.init();
        }

        // Calculate prize pool based on state channel
        const totalScores = this.channel.state.scores.length;
        const basePrize = '0.01'; // 0.01 ETH base prize
        const prizePool = ethers.parseEther((parseFloat(basePrize) * totalScores).toString());
        
        return {
            total: ethers.formatEther(prizePool),
            distribution: {
                first: '50%',
                second: '30%',
                third: '20%'
            }
        };
    }

    async distributePrizes() {
        if (!this.isInitialized) {
            await this.init();
        }

        const highScores = await this.getHighScores();
        const prizePool = await this.getPrizePool();
        
        if (highScores.length < 3) {
            throw new Error('Not enough players for prize distribution');
        }

        const prizes = {
            first: ethers.parseEther((parseFloat(prizePool.total) * 0.5).toString()),
            second: ethers.parseEther((parseFloat(prizePool.total) * 0.3).toString()),
            third: ethers.parseEther((parseFloat(prizePool.total) * 0.2).toString())
        };

        // In a real implementation, this would trigger the ERC-7824 state channel settlement
        console.log('Prize distribution:', {
            first: { player: highScores[0].player, amount: ethers.formatEther(prizes.first) },
            second: { player: highScores[1].player, amount: ethers.formatEther(prizes.second) },
            third: { player: highScores[2].player, amount: ethers.formatEther(prizes.third) }
        });

        return prizes;
    }
}
