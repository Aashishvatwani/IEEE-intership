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
