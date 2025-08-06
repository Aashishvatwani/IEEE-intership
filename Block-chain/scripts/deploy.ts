import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main() {
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await DocumentRegistry.deploy();
  await registry.waitForDeployment();
  console.log("Contract deployed to:", await registry.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
