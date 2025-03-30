export interface Player {
    id: string;
    wallet_address: string;
    nickname: string;
    created_at?: string;
    updated_at?: string;
}
export declare class PlayerService {
    static initializeDatabase(): Promise<void>;
    static createPlayer(walletAddress: string, nickname: string): Promise<Player | null>;
    static getPlayerByWallet(walletAddress: string): Promise<Player | null>;
    static isNicknameAvailable(nickname: string): Promise<boolean>;
}
