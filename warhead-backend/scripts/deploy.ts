import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MissileNFT contract...");

  const MissileNFT = await ethers.getContractFactory("MissileNFT");
  const missileNFT = await MissileNFT.deploy();

  await missileNFT.waitForDeployment();
  const contractAddress = await missileNFT.getAddress();

  console.log(`MissileNFT deployed to: ${contractAddress}`);
  
  // Add a delay to ensure the contract is deployed and verified
  await new Promise(resolve => setTimeout(resolve, 30000));

  console.log("Deployment completed successfully!");
  console.log("Please update your .env file with the following:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 