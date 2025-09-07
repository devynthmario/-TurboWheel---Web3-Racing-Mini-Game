const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TurboWheelChannel", function () {
  let turboWheelChannel;
  let owner;
  let player1;
  let player2;
  let player3;

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();
    
    const TurboWheelChannel = await ethers.getContractFactory("TurboWheelChannel");
    turboWheelChannel = await TurboWheelChannel.deploy();
    await turboWheelChannel.waitForDeployment();
  });

  describe("Channel Management", function () {
    it("Should create a new channel", async function () {
      const channelId = ethers.keccak256(ethers.toUtf8Bytes("test-channel"));
      
      await expect(turboWheelChannel.createChannel(channelId))
        .to.emit(turboWheelChannel, "ChannelCreated")
        .withArgs(channelId, owner.address);
    });

    it("Should not allow creating duplicate channels", async function () {
      const channelId = ethers.keccak256(ethers.toUtf8Bytes("test-channel"));
      
      await turboWheelChannel.createChannel(channelId);
      
      await expect(turboWheelChannel.createChannel(channelId))
        .to.be.revertedWith("Channel already exists");
    });
  });

  describe("Score Submission", function () {
    let channelId;

    beforeEach(async function () {
      channelId = ethers.keccak256(ethers.toUtf8Bytes("test-channel"));
      await turboWheelChannel.createChannel(channelId);
    });

    it("Should submit a score successfully", async function () {
      const score = 1000;
      const gameId = "turbowheel_v1";
      const fee = ethers.parseEther("0.001");

      await expect(turboWheelChannel.connect(player1).submitScore(
        channelId,
        score,
        gameId,
        { value: fee }
      ))
        .to.emit(turboWheelChannel, "ScoreSubmitted")
        .withArgs(channelId, player1.address, score);
    });

    it("Should reject zero scores", async function () {
      const score = 0;
      const gameId = "turbowheel_v1";
      const fee = ethers.parseEther("0.001");

      await expect(turboWheelChannel.connect(player1).submitScore(
        channelId,
        score,
        gameId,
        { value: fee }
      ))
        .to.be.revertedWith("Score must be greater than 0");
    });

    it("Should reject insufficient fees", async function () {
      const score = 1000;
      const gameId = "turbowheel_v1";
      const fee = ethers.parseEther("0.0005"); // Less than required

      await expect(turboWheelChannel.connect(player1).submitScore(
        channelId,
        score,
        gameId,
        { value: fee }
      ))
        .to.be.revertedWith("Insufficient fee for prize pool");
    });
  });

  describe("Prize Distribution", function () {
    let channelId;

    beforeEach(async function () {
      channelId = ethers.keccak256(ethers.toUtf8Bytes("test-channel"));
      await turboWheelChannel.createChannel(channelId);

      // Submit scores for 3 players
      const fee = ethers.parseEther("0.001");
      
      await turboWheelChannel.connect(player1).submitScore(
        channelId,
        3000,
        "turbowheel_v1",
        { value: fee }
      );
      
      await turboWheelChannel.connect(player2).submitScore(
        channelId,
        2000,
        "turbowheel_v1",
        { value: fee }
      );
      
      await turboWheelChannel.connect(player3).submitScore(
        channelId,
        1000,
        "turbowheel_v1",
        { value: fee }
      );
    });

    it("Should distribute prizes correctly", async function () {
      const totalPrize = ethers.parseEther("0.003");
      const firstPrize = totalPrize * 50n / 100n; // 50%
      const secondPrize = totalPrize * 30n / 100n; // 30%
      const thirdPrize = totalPrize * 20n / 100n; // 20%

      const initialBalance1 = await ethers.provider.getBalance(player1.address);
      const initialBalance2 = await ethers.provider.getBalance(player2.address);
      const initialBalance3 = await ethers.provider.getBalance(player3.address);

      await expect(turboWheelChannel.connect(player1).distributePrizes(channelId))
        .to.emit(turboWheelChannel, "PrizeDistributed");

      const finalBalance1 = await ethers.provider.getBalance(player1.address);
      const finalBalance2 = await ethers.provider.getBalance(player2.address);
      const finalBalance3 = await ethers.provider.getBalance(player3.address);

      // Check that players received their prizes (accounting for gas costs)
      expect(finalBalance1).to.be.gt(initialBalance1);
      expect(finalBalance2).to.be.gt(initialBalance2);
      expect(finalBalance3).to.be.gt(initialBalance3);
    });

    it("Should not allow distribution with less than 3 players", async function () {
      const newChannelId = ethers.keccak256(ethers.toUtf8Bytes("new-channel"));
      await turboWheelChannel.createChannel(newChannelId);

      await expect(turboWheelChannel.connect(player1).distributePrizes(newChannelId))
        .to.be.revertedWith("Not enough players for prize distribution");
    });
  });

  describe("Getters", function () {
    let channelId;

    beforeEach(async function () {
      channelId = ethers.keccak256(ethers.toUtf8Bytes("test-channel"));
      await turboWheelChannel.createChannel(channelId);
    });

    it("Should return top scores", async function () {
      const fee = ethers.parseEther("0.001");
      
      await turboWheelChannel.connect(player1).submitScore(
        channelId,
        1000,
        "turbowheel_v1",
        { value: fee }
      );
      
      await turboWheelChannel.connect(player2).submitScore(
        channelId,
        2000,
        "turbowheel_v1",
        { value: fee }
      );

      const topScores = await turboWheelChannel.getTopScores(channelId, 2);
      
      expect(topScores).to.have.length(2);
      expect(topScores[0].score).to.equal(2000); // Highest score first
      expect(topScores[1].score).to.equal(1000);
    });

    it("Should return prize pool amount", async function () {
      const fee = ethers.parseEther("0.001");
      
      await turboWheelChannel.connect(player1).submitScore(
        channelId,
        1000,
        "turbowheel_v1",
        { value: fee }
      );

      const prizePool = await turboWheelChannel.getPrizePool();
      expect(prizePool).to.equal(fee);
    });

    it("Should return player best score", async function () {
      const fee = ethers.parseEther("0.001");
      
      await turboWheelChannel.connect(player1).submitScore(
        channelId,
        1000,
        "turbowheel_v1",
        { value: fee }
      );
      
      await turboWheelChannel.connect(player1).submitScore(
        channelId,
        500,
        "turbowheel_v1",
        { value: fee }
      );

      const bestScore = await turboWheelChannel.getPlayerBestScore(player1.address);
      expect(bestScore).to.equal(1000); // Should keep the highest score
    });
  });
});
