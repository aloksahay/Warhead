const API_URL = 'http://localhost:3000/api';

export interface Player {
  id: string;
  wallet_address: string;
  nickname: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseService {
  static async createPlayer(walletAddress: string, nickname: string): Promise<Player | null> {
    try {
      const response = await fetch(`${API_URL}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress, nickname }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create player');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating player:', error);
      return null;
    }
  }

  static async getPlayerByWallet(walletAddress: string): Promise<Player | null> {
    try {
      const response = await fetch(`${API_URL}/players/${walletAddress}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get player');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting player:', error);
      return null;
    }
  }

  static async isNicknameAvailable(nickname: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/players/check-nickname/${nickname}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check nickname');
      }

      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking nickname:', error);
      return false;
    }
  }
} 