import { ethers } from "ethers";

// You'll need to place the ABI file in your src folder or public folder
// For now, I'll create a placeholder - you should replace this with your actual ABI
const ABI = [
  "function storeDocument(string memory ipfsCID, bytes32 documentHash) public",
  "function verifyDocument(bytes32 documentHash) public view returns (bool, string memory, address, uint256)"
];

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet(): Promise<ethers.BrowserProvider> {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      return new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error}`);
    }
  }
  throw new Error("MetaMask not installed");
}

export async function storeDocument(ipfsCID: string, documentHash: string): Promise<ethers.TransactionReceipt> {
  try {
    const provider = await connectWallet();
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const tx = await contract.storeDocument(ipfsCID, documentHash);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    throw new Error(`Failed to store document: ${error}`);
  }
}

export async function verifyDocument(documentHash: string): Promise<{
  isValid: boolean;
  ipfsCID: string;
  uploader: string;
  timestamp: number;
}> {
  try {
    // Use a public RPC provider for read operations
    const provider = new ethers.JsonRpcProvider("https://polygon-amoy.infura.io/v3/YOUR_INFURA_KEY");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    
    const result = await contract.verifyDocument(documentHash);
    
    return {
      isValid: result[0],
      ipfsCID: result[1],
      uploader: result[2],
      timestamp: Number(result[3])
    };
  } catch (error) {
    throw new Error(`Failed to verify document: ${error}`);
  }
}

// Helper function to check if wallet is connected
export async function isWalletConnected(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0;
    } catch (error) {
      return false;
    }
  }
  return false;
}

// Helper function to get current account
export async function getCurrentAccount(): Promise<string | null> {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      return null;
    }
  }
  return null;
}