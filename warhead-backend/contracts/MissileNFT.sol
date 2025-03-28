// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MissileNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Missile types and their prices (in wei)
    mapping(uint256 => uint256) public missileTypePrices;

    constructor() ERC721("MissileNFT", "MSSL") Ownable(msg.sender) {
        // Initialize missile type prices
        missileTypePrices[1] = 0.01 ether; // Basic missile
        missileTypePrices[2] = 0.02 ether; // Advanced missile
        missileTypePrices[3] = 0.05 ether; // Super missile
    }

    function mintMissile(uint256 missileType, string memory tokenURI) public payable returns (uint256) {
        require(missileType >= 1 && missileType <= 3, "Invalid missile type");
        require(msg.value >= missileTypePrices[missileType], "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Refund excess payment
        if (msg.value > missileTypePrices[missileType]) {
            payable(msg.sender).transfer(msg.value - missileTypePrices[missileType]);
        }

        return tokenId;
    }

    function getMissilePrice(uint256 missileType) public view returns (uint256) {
        require(missileType >= 1 && missileType <= 3, "Invalid missile type");
        return missileTypePrices[missileType];
    }

    function updateMissilePrice(uint256 missileType, uint256 newPrice) public onlyOwner {
        require(missileType >= 1 && missileType <= 3, "Invalid missile type");
        missileTypePrices[missileType] = newPrice;
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 