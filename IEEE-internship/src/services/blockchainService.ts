import { ethers } from "ethers";

// You'll need to place the ABI file in your src folder or public folder
// For now, I'll create a placeholder - you should replace this with your actual ABI
const ABI = [
  "function storeDocument(string memory ipfsCID, bytes32 documentHash) public",
  "function verifyDocument(bytes32 documentHash) public view returns (bool, string memory, address, uint256)"
];

// Use your deployed contract address here
const CONTRACT_ADDRESS = "0xE7299D52290B8E115c5145A2cd09693E7A6b8d79"; // Sepolia testnet

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Check if MetaMask is available without connecting
export function isMetaMaskAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

export async function connectWallet(): Promise<ethers.BrowserProvider> {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask not installed. Please install MetaMask to use blockchain features.");
  }

  try {
    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" });
    return new ethers.BrowserProvider(window.ethereum);
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("User rejected the connection request");
    }
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
}

export async function storeDocument(ipfsCID: string, documentHash: string): Promise<ethers.TransactionReceipt> {
  const startTime = performance.now();
  console.log('🔗 Starting blockchain storage transaction...');
  
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask not available. Please install MetaMask to store documents on blockchain.");
  }

  try {
    const connectStartTime = performance.now();
    console.log('👛 Connecting to wallet...');
    const provider = await connectWallet();
    const connectEndTime = performance.now();
    console.log(`✅ Wallet connected in ${(connectEndTime - connectStartTime).toFixed(2)}ms`);
    
    const signerStartTime = performance.now();
    const signer = await provider.getSigner();
    const signerEndTime = performance.now();
    console.log(`✅ Signer obtained in ${(signerEndTime - signerStartTime).toFixed(2)}ms`);
    
    const contractStartTime = performance.now();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const contractEndTime = performance.now();
    console.log(`✅ Contract instance created in ${(contractEndTime - contractStartTime).toFixed(2)}ms`);

    // Estimate gas before sending transaction
    const gasStartTime = performance.now();
    console.log('⛽ Estimating gas...');
    const gasEstimate = await contract.storeDocument.estimateGas(ipfsCID, documentHash);
    const gasEndTime = performance.now();
    console.log(`✅ Gas estimated: ${gasEstimate.toString()} in ${(gasEndTime - gasStartTime).toFixed(2)}ms`);
    
    const txStartTime = performance.now();
    console.log('📤 Sending transaction to blockchain...');
    const tx = await contract.storeDocument(ipfsCID, documentHash, {
      gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
    });
    const txSentTime = performance.now();
    console.log(`✅ Transaction sent in ${(txSentTime - txStartTime).toFixed(2)}ms, hash: ${tx.hash}`);
    
    console.log('⏳ Waiting for transaction confirmation...');
    const waitStartTime = performance.now();
    const receipt = await tx.wait();
    const waitEndTime = performance.now();
    console.log(`✅ Transaction confirmed in ${(waitEndTime - waitStartTime).toFixed(2)}ms`);
    
    const totalTime = performance.now() - startTime;
    console.log(`🏁 Total blockchain storage completed in ${totalTime.toFixed(2)}ms`);
    
    return receipt;
  } catch (error: any) {
    const errorTime = performance.now() - startTime;
    console.error(`❌ Blockchain storage failed after ${errorTime.toFixed(2)}ms:`, error);
    
    if (error.code === 4001) {
      throw new Error("Transaction rejected by user");
    }
    throw new Error(`Failed to store document: ${error.message}`);
  }
}

export async function verifyDocument(documentHash: string): Promise<{
  isValid: boolean;
  ipfsCID: string;
  uploader: string;
  timestamp: number;
}> {
  try {
    console.log('Starting blockchain verification...');
    console.log('Document Hash received:', documentHash);
    console.log('Hash type:', typeof documentHash);
    console.log('Hash length:', documentHash?.length);
    
    // Validate hash format
    if (!documentHash || typeof documentHash !== 'string') {
      throw new Error('Invalid hash: must be a non-empty string');
    }
    
    if (!documentHash.startsWith('0x')) {
      throw new Error('Invalid hash format: must start with 0x');
    }
    
    if (documentHash.length !== 66) { // 0x + 64 hex characters
      throw new Error(`Invalid hash length: expected 66 characters, got ${documentHash.length}`);
    }
    
    // Check if hash contains only valid hex characters
    const hexPattern = /^0x[0-9a-fA-F]{64}$/;
    if (!hexPattern.test(documentHash)) {
      throw new Error('Invalid hash format: contains non-hex characters');
    }
    
    // For verification, try different providers in order of preference
    let provider: ethers.Provider;
    
    if (isMetaMaskAvailable()) {
      // First try: Use MetaMask provider (for Sepolia testnet)
      provider = new ethers.BrowserProvider(window.ethereum);
      console.log('Using MetaMask provider...');
      
      try {
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.name || network.chainId);
        
        // Check if we're on the right network (Sepolia = 11155111)
        if (network.chainId !== 11155111n) {
          console.warn('Warning: Not connected to Sepolia testnet. Current chain ID:', network.chainId);
        }
      } catch (metaMaskError) {
        console.log('MetaMask network connection failed:', metaMaskError);
        throw new Error('Cannot connect to blockchain via MetaMask. Please ensure MetaMask is connected to Sepolia testnet.');
      }
    } else {
      // Fallback: Try local hardhat network for development
      try {
        provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        console.log('MetaMask not available, using local Hardhat network...');
        
        // Test the connection
        await provider.getNetwork();
        console.log('Successfully connected to local network');
      } catch (localError) {
        console.log('Local network not available:', localError);
        throw new Error('Cannot connect to blockchain. Please install MetaMask and connect to Sepolia testnet, or start the local Hardhat network.');
      }
    }
    
    console.log('Creating contract instance...');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    
    console.log('Calling contract verifyDocument method...');
    const result = await contract.verifyDocument(documentHash);
    console.log('Contract call result:', result);
    
    const returnValue = {
      isValid: result[0],
      ipfsCID: result[1],
      uploader: result[2],
      timestamp: Number(result[3])
    };
    
    console.log('Parsed verification result:', returnValue);
    return returnValue;
  } catch (error: any) {
    console.error('Blockchain verification error:', error);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific cases
    if (error.code === 'BAD_DATA' && error.message.includes('value="0x"')) {
      // Document not found on blockchain - this is not necessarily an error
      console.log('Document not found on blockchain, returning false');
      return {
        isValid: false,
        ipfsCID: '',
        uploader: '',
        timestamp: 0
      };
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message.includes('connection')) {
      throw new Error('Cannot connect to blockchain network. Please ensure the blockchain node is running.');
    }
    
    if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Contract call failed. The contract may not be deployed or the network may be incorrect.');
    }
    
    throw new Error(`Failed to verify document: ${error.message}`);
  }
}

// Helper function to check if wallet is connected
export async function isWalletConnected(): Promise<boolean> {
  if (!isMetaMaskAvailable()) {
    return false;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch (error) {
    return false;
  }
}

// Helper function to get current account
export async function getCurrentAccount(): Promise<string | null> {
  if (!isMetaMaskAvailable()) {
    return null;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    return null;
  }
}

// Helper function to get network info
export async function getNetworkInfo(): Promise<{ chainId: string; networkName: string } | null> {
  if (!isMetaMaskAvailable()) {
    return null;
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const networkNames: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
      '0x7a69': 'Hardhat Local'
    };
    
    return {
      chainId,
      networkName: networkNames[chainId] || 'Unknown Network'
    };
  } catch (error) {
    return null;
  }
}