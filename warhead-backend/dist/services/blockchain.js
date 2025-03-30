"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize Alchemy provider
const provider = new ethers_1.ethers.JsonRpcProvider(process.env.NETWORK_RPC_URL);
// Initialize wallet
const wallet = new ethers_1.ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
// MissileNFT contract interface (ABI)
const MISSILE_NFT_ABI = [
    "function mint(address to, uint256 missileType) public returns (uint256)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function transferFrom(address from, address to, uint256 tokenId) public",
    "function getMissileType(uint256 tokenId) public view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];
// Initialize contract
const missileContract = new ethers_1.ethers.Contract(process.env.CONTRACT_ADDRESS, MISSILE_NFT_ABI, wallet);
class BlockchainService {
    /**
     * Mint a new missile NFT
     * @param playerAddress The address to mint the missile to
     * @param missileType The type of missile to mint
     * @returns The token ID of the minted missile
     */
    static async mintMissile(playerAddress, missileType) {
        try {
            const tx = await missileContract.mint(playerAddress, missileType);
            const receipt = await tx.wait();
            // Find the Transfer event to get the token ID
            const event = receipt.logs.find((log) => log.fragment?.name === 'Transfer');
            if (!event)
                throw new Error('Mint event not found');
            const tokenId = event.args[2];
            return Number(tokenId);
        }
        catch (error) {
            console.error('Error minting missile:', error);
            throw error;
        }
    }
    /**
     * Transfer a missile NFT
     * @param from The current owner's address
     * @param to The recipient's address
     * @param tokenId The token ID to transfer
     */
    static async transferMissile(from, to, tokenId) {
        try {
            const tx = await missileContract.transferFrom(from, to, tokenId);
            await tx.wait();
        }
        catch (error) {
            console.error('Error transferring missile:', error);
            throw error;
        }
    }
    /**
     * Get the owner of a missile NFT
     * @param tokenId The token ID to check
     * @returns The owner's address
     */
    static async getMissileOwner(tokenId) {
        try {
            return await missileContract.ownerOf(tokenId);
        }
        catch (error) {
            console.error('Error getting missile owner:', error);
            throw error;
        }
    }
    /**
     * Get the type of a missile NFT
     * @param tokenId The token ID to check
     * @returns The missile type
     */
    static async getMissileType(tokenId) {
        try {
            const type = await missileContract.getMissileType(tokenId);
            return Number(type);
        }
        catch (error) {
            console.error('Error getting missile type:', error);
            throw error;
        }
    }
}
exports.BlockchainService = BlockchainService;
