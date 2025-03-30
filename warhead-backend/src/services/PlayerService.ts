import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Player {
  id: string;
  wallet_address: string;
  nickname: string;
  created_at?: string;
  updated_at?: string;
}

export class PlayerService {
  static async createPlayer(walletAddress: string, nickname: string): Promise<Player | null> {
    try {
      console.log(`Creating player with wallet: ${walletAddress}, nickname: ${nickname}`);

      const { data, error } = await supabase
        .from('players')
        .insert([{ wallet_address: walletAddress, nickname }])
        .select()
        .single();

      if (error) {
        console.error('Error creating player:', error);
        if (error.code === '23505') { // Unique violation
          throw new Error('Wallet address or nickname already exists');
        }
        throw new Error(`Failed to create player: ${error.message}`);
      }

      console.log('Player created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in createPlayer:', error);
      throw error;
    }
  }

  static async getPlayerByWallet(walletAddress: string): Promise<Player | null> {
    try {
      console.log(`Getting player with wallet: ${walletAddress}`);

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          console.log('Player not found');
          return null;
        }
        console.error('Error getting player:', error);
        throw new Error(`Failed to get player: ${error.message}`);
      }

      console.log('Player found:', data);
      return data;
    } catch (error: any) {
      console.error('Error in getPlayerByWallet:', error);
      throw error;
    }
  }

  static async isNicknameAvailable(nickname: string): Promise<boolean> {
    try {
      console.log(`Checking nickname availability: ${nickname}`);

      const { data, error } = await supabase
        .from('players')
        .select('nickname')
        .eq('nickname', nickname)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          console.log('Nickname is available');
          return true;
        }
        console.error('Error checking nickname:', error);
        throw new Error(`Failed to check nickname: ${error.message}`);
      }

      console.log('Nickname is taken');
      return false;
    } catch (error: any) {
      console.error('Error in isNicknameAvailable:', error);
      throw error;
    }
  }
} 