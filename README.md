


# 📄 Web3 Document Verification System

A full-stack decentralized application that allows users to **upload documents**, **extract key data**, **store on IPFS**, **record hashes on the blockchain**, and **verify authenticity** using smart contracts and wallet login.

---

## 🚀 Features

| Function                           | Tools / Tech Stack                              |
| ---------------------------------- | ----------------------------------------------- |
| Upload & Extract Text              | `Tesseract.js` or `Google Document AI`          |
| Extract Specific Fields (Name, ID) | `Regex` or `OpenAI LLM`                         |
| Encrypt File                       | `Crypto-js`                                     |
| Store File                         | `IPFS` via `web3.storage` or `Pinata`           |
| Store Hash on Blockchain           | `Solidity`, `Hardhat`, `Amoy Testnet`           |
| Wallet Login                       | `Metamask`, `Wagmi`, `RainbowKit`               |
| Share & Verify                     | QR Code + Smart Contract lookup                 |

---

## 🧠 Architecture

```

project-root/
│
├── blockchain/                     # Hardhat project
│   ├── contracts/
│   │   ├── DocumentRegistry.sol    # Smart contract
│   ├── scripts/
│   │   ├── deploy.js               # Deploy contract
│   ├── artifacts/                  # Auto-generated (contains ABI)
│   ├── hardhat.config.js
│   └── package.json
│
├── client/                         # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadFile.jsx      # Upload + Encrypt + Store
│   │   │   ├── VerifyFile.jsx      # Verify document
│   │   ├── services/
│   │   │   ├── blockchainService.js # Ethers.js functions
│   │   │   ├── ipfsService.js      # IPFS upload/retrieve
│   │   │   ├── cryptoUtils.js      # AES encryption & SHA256 hash
│   │   │   ├── DocumentRegistryABI.json # ABI file
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
└── .env

````

---

## ⚙️ Installation

### **Backend (Hardhat)**
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
````

### **Frontend (React)**

```bash
cd client
npm install
npm start
```

---

## 🔑 Environment Variables

Create `.env` files in **both** folders:

### **For Blockchain**

```
INFURA_API_KEY=your-infura-key
PRIVATE_KEY=your-metamask-private-key
```

### **For React**

```
REACT_APP_WEB3STORAGE_TOKEN=your-web3storage-token
REACT_APP_CONTRACT_ADDRESS=deployed-contract-address
```

---

## ✅ How It Works

1. **Upload Document**

   * User selects file → encrypts with AES → calculates SHA-256 hash.

2. **Store on IPFS**

   * Encrypted file is uploaded to IPFS via Web3.Storage / Pinata.
   * Returns **CID**.

3. **Record on Blockchain**

   * `storeDocument(CID, hash)` is called on smart contract using Ethers.js.
   * Transaction stores:

     * Document hash
     * IPFS CID
     * Wallet address
     * Timestamp

4. **Verify Document**

   * User provides a document → system calculates hash → checks on-chain via `verifyDocument(hash)`.

---

## ✅ Smart Contract (DocumentRegistry.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentRegistry {
    struct Document {
        string ipfsCID;
        address owner;
        uint256 timestamp;
    }

    mapping(bytes32 => Document) private documents;

    event DocumentStored(bytes32 indexed documentHash, string ipfsCID, address indexed owner, uint256 timestamp);

    function storeDocument(string memory ipfsCID, bytes32 documentHash) public {
        require(documents[documentHash].timestamp == 0, "Document already exists");
        documents[documentHash] = Document(ipfsCID, msg.sender, block.timestamp);
        emit DocumentStored(documentHash, ipfsCID, msg.sender, block.timestamp);
    }

    function verifyDocument(bytes32 documentHash) public view returns (bool, string memory, address, uint256) {
        Document memory doc = documents[documentHash];
        if (doc.timestamp == 0) {
            return (false, "", address(0), 0);
        }
        return (true, doc.ipfsCID, doc.owner, doc.timestamp);
    }
}
```

---

## ✅ Tech Stack

* **Frontend:** React, TailwindCSS, Framer Motion
* **Backend:** Node.js, Hardhat, Ethers.js
* **Storage:** IPFS (Web3.Storage or Pinata)
* **Blockchain:** Polygon Amoy Testnet (via Infura)
* **Authentication:** MetaMask, Wagmi

---

## 📌 Future Enhancements

* ✅ QR code-based sharing & verification
* ✅ AI-based document parsing (Name, ID extraction)
* ✅ NFT certificates for documents
* ✅ Mobile DApp support

---

## 📜 License

This project is **MIT Licensed**.

---

```

---

✅ Do you want me to **add screenshots and badges (e.g., IPFS, Polygon, MetaMask, Hardhat)** to make it look professional for GitHub? Or should I also **write instructions for deploying the frontend on Vercel and smart contract on Amoy**?
```
