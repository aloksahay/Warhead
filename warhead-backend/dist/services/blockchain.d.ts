export declare class BlockchainService {
    /**
     * Mint a new missile NFT
     * @param playerAddress The address to mint the missile to
     * @param missileType The type of missile to mint
     * @returns The token ID of the minted missile
     */
    static mintMissile(playerAddress: string, missileType: number): Promise<number>;
    /**
     * Transfer a missile NFT
     * @param from The current owner's address
     * @param to The recipient's address
     * @param tokenId The token ID to transfer
     */
    static transferMissile(from: string, to: string, tokenId: number): Promise<void>;
    /**
     * Get the owner of a missile NFT
     * @param tokenId The token ID to check
     * @returns The owner's address
     */
    static getMissileOwner(tokenId: number): Promise<string>;
    /**
     * Get the type of a missile NFT
     * @param tokenId The token ID to check
     * @returns The missile type
     */
    static getMissileType(tokenId: number): Promise<number>;
}
