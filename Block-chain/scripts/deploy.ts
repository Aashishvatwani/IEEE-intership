import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying DocumentRegistry contract...");
  
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await DocumentRegistry.deploy();
  await registry.waitForDeployment();
  
  const contractAddress = await registry.getAddress();
  console.log("Contract deployed to:", contractAddress);
  
  // Save contract address and ABI for frontend
  const contractInfo = {
    address: contractAddress,
    abi: [
      "function storeDocument(string memory ipfsCID, bytes32 documentHash) public",
      "function verifyDocument(bytes32 documentHash) public view returns (bool, string memory, address, uint256)"
    ]
  };
  
  // Save to a JSON file
  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(contractInfo, null, 2));
  
  console.log("Contract info saved to:", deploymentPath);
  console.log("\n🎉 Deployment successful!");
  console.log("📋 Next steps:");
  console.log("1. Update your frontend to use the new contract address:");
  console.log(`   CONTRACT_ADDRESS = "${contractAddress}"`);
  console.log("2. Add localhost network to MetaMask:");
  console.log("   - Network Name: Hardhat Local");
  console.log("   - RPC URL: http://127.0.0.1:8545");
  console.log("   - Chain ID: 31337");
  console.log("   - Currency Symbol: ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
