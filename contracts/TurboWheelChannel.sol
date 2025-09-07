// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TurboWheelChannel
 * @dev ERC-7824 compatible state channel for TurboWheel game
 * This contract manages game scores and prize distribution through state channels
 */
contract TurboWheelChannel is ReentrancyGuard, Ownable {
    
    struct GameScore {
        address player;
        uint256 score;
        uint256 timestamp;
        string gameId;
        bool verified;
    }
    
    struct PrizeDistribution {
        address first;
        address second;
        address third;
        uint256 totalPrize;
        uint256 distributedAt;
        bool distributed;
    }
    
    struct ChannelState {
        uint256 nonce;
        GameScore[] scores;
        uint256 prizePool;
        uint256 lastUpdate;
        bool isActive;
    }
    
    // State variables
    mapping(bytes32 => ChannelState) public channels;
    mapping(address => uint256) public playerScores;
    mapping(address => uint256) public playerWinnings;
    
    PrizeDistribution[] public prizeDistributions;
    uint256 public totalPrizePool;
    uint256 public constant PRIZE_FEE = 0.001 ether; // 0.001 ETH per game
    uint256 public constant FIRST_PRIZE_PERCENT = 50;
    uint256 public constant SECOND_PRIZE_PERCENT = 30;
    uint256 public constant THIRD_PRIZE_PERCENT = 20;
    
    // Events
    event ChannelCreated(bytes32 indexed channelId, address indexed creator);
    event ScoreSubmitted(bytes32 indexed channelId, address indexed player, uint256 score);
    event PrizeDistributed(uint256 indexed distributionId, address first, address second, address third, uint256 totalAmount);
    event PrizePoolUpdated(uint256 newTotal);
    
    // Modifiers
    modifier onlyChannelParticipant(bytes32 channelId) {
        require(channels[channelId].isActive, "Channel not active");
        _;
    }
    
    modifier validScore(uint256 score) {
        require(score > 0, "Score must be greater than 0");
        _;
    }
    
    /**
     * @dev Create a new state channel for the game
     * @param channelId Unique identifier for the channel
     */
    function createChannel(bytes32 channelId) external {
        require(!channels[channelId].isActive, "Channel already exists");
        
        channels[channelId] = ChannelState({
            nonce: 0,
            scores: new GameScore[](0),
            prizePool: 0,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        emit ChannelCreated(channelId, msg.sender);
    }
    
    /**
     * @dev Submit a game score to the state channel
     * @param channelId The channel to submit the score to
     * @param score The player's score
     * @param gameId The game identifier
     */
    function submitScore(
        bytes32 channelId,
        uint256 score,
        string calldata gameId
    ) external payable onlyChannelParticipant(channelId) validScore(score) {
        require(msg.value >= PRIZE_FEE, "Insufficient fee for prize pool");
        
        ChannelState storage channel = channels[channelId];
        
        // Create new score entry
        GameScore memory newScore = GameScore({
            player: msg.sender,
            score: score,
            timestamp: block.timestamp,
            gameId: gameId,
            verified: true
        });
        
        channel.scores.push(newScore);
        channel.nonce++;
        channel.prizePool += msg.value;
        channel.lastUpdate = block.timestamp;
        
        // Update player's best score
        if (score > playerScores[msg.sender]) {
            playerScores[msg.sender] = score;
        }
        
        totalPrizePool += msg.value;
        
        emit ScoreSubmitted(channelId, msg.sender, score);
        emit PrizePoolUpdated(totalPrizePool);
    }
    
    /**
     * @dev Get the top scores from a channel
     * @param channelId The channel to query
     * @param limit Maximum number of scores to return
     * @return Array of top scores
     */
    function getTopScores(bytes32 channelId, uint256 limit) 
        external 
        view 
        returns (GameScore[] memory) 
    {
        ChannelState storage channel = channels[channelId];
        require(channel.isActive, "Channel not active");
        
        // Sort scores by score value (descending)
        GameScore[] memory sortedScores = new GameScore[](channel.scores.length);
        for (uint256 i = 0; i < channel.scores.length; i++) {
            sortedScores[i] = channel.scores[i];
        }
        
        // Simple bubble sort (for demo purposes)
        for (uint256 i = 0; i < sortedScores.length - 1; i++) {
            for (uint256 j = 0; j < sortedScores.length - i - 1; j++) {
                if (sortedScores[j].score < sortedScores[j + 1].score) {
                    GameScore memory temp = sortedScores[j];
                    sortedScores[j] = sortedScores[j + 1];
                    sortedScores[j + 1] = temp;
                }
            }
        }
        
        // Return top scores up to limit
        uint256 returnLength = limit < sortedScores.length ? limit : sortedScores.length;
        GameScore[] memory topScores = new GameScore[](returnLength);
        
        for (uint256 i = 0; i < returnLength; i++) {
            topScores[i] = sortedScores[i];
        }
        
        return topScores;
    }
    
    /**
     * @dev Distribute prizes to top 3 players
     * @param channelId The channel to distribute prizes from
     */
    function distributePrizes(bytes32 channelId) 
        external 
        onlyChannelParticipant(channelId) 
        nonReentrant 
    {
        ChannelState storage channel = channels[channelId];
        require(channel.scores.length >= 3, "Not enough players for prize distribution");
        require(channel.prizePool > 0, "No prize pool to distribute");
        
        // Get top 3 scores
        GameScore[] memory topScores = this.getTopScores(channelId, 3);
        
        uint256 totalPrize = channel.prizePool;
        uint256 firstPrize = (totalPrize * FIRST_PRIZE_PERCENT) / 100;
        uint256 secondPrize = (totalPrize * SECOND_PRIZE_PERCENT) / 100;
        uint256 thirdPrize = (totalPrize * THIRD_PRIZE_PERCENT) / 100;
        
        // Distribute prizes
        payable(topScores[0].player).transfer(firstPrize);
        payable(topScores[1].player).transfer(secondPrize);
        payable(topScores[2].player).transfer(thirdPrize);
        
        // Record distribution
        PrizeDistribution memory distribution = PrizeDistribution({
            first: topScores[0].player,
            second: topScores[1].player,
            third: topScores[2].player,
            totalPrize: totalPrize,
            distributedAt: block.timestamp,
            distributed: true
        });
        
        prizeDistributions.push(distribution);
        
        // Update player winnings
        playerWinnings[topScores[0].player] += firstPrize;
        playerWinnings[topScores[1].player] += secondPrize;
        playerWinnings[topScores[2].player] += thirdPrize;
        
        // Reset channel prize pool
        channel.prizePool = 0;
        totalPrizePool -= totalPrize;
        
        emit PrizeDistributed(
            prizeDistributions.length - 1,
            topScores[0].player,
            topScores[1].player,
            topScores[2].player,
            totalPrize
        );
    }
    
    /**
     * @dev Get current prize pool amount
     * @return Current total prize pool
     */
    function getPrizePool() external view returns (uint256) {
        return totalPrizePool;
    }
    
    /**
     * @dev Get player's best score
     * @param player The player's address
     * @return Player's best score
     */
    function getPlayerBestScore(address player) external view returns (uint256) {
        return playerScores[player];
    }
    
    /**
     * @dev Get player's total winnings
     * @param player The player's address
     * @return Player's total winnings
     */
    function getPlayerWinnings(address player) external view returns (uint256) {
        return playerWinnings[player];
    }
    
    /**
     * @dev Get total number of prize distributions
     * @return Number of distributions
     */
    function getDistributionCount() external view returns (uint256) {
        return prizeDistributions.length;
    }
    
    /**
     * @dev Emergency function to withdraw contract balance (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        totalPrizePool += msg.value;
        emit PrizePoolUpdated(totalPrizePool);
    }
}
