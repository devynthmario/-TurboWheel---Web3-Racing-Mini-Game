const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TurboWheel contracts...");

  // Get the contract factory
  const TurboWheelChannel = await ethers.getContractFactory("TurboWheelChannel");

  // Deploy the contract
  const turboWheelChannel = await TurboWheelChannel.deploy();

  await turboWheelChannel.waitForDeployment();

  const contractAddress = await turboWheelChannel.getAddress();

  console.log("TurboWheelChannel deployed to:", contractAddress);
  console.log("Contract owner:", await turboWheelChannel.owner());

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: contractAddress,
    deployer: (await ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Verify contract on Etherscan (if on testnet/mainnet)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await turboWheelChannel.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
