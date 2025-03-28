import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Database types
export interface Player {
  id: string;
  nickname: string;
  wallet_address: string;
  location: any; // PostGIS Point
  status: 'alive' | 'dead';
  shield_points: number;
  created_at: string;
  updated_at: string;
}

export interface Missile {
  id: number;
  token_id: number;
  type: number;
  owner_id: string;
  status: 'ready' | 'in_flight' | 'exploded' | 'destroyed';
  launch_time?: string;
  target_location?: any; // PostGIS Point
  created_at: string;
  updated_at: string;
}

export interface MissileImpact {
  id: number;
  missile_id: number;
  target_id: string;
  damage: number;
  impact_location: any; // PostGIS Point
  impact_time: string;
}

export class SupabaseService {
  // Initialize and expose Supabase client
  public static readonly supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  /**
   * Create a new player after signup
   */
  static async createPlayer(userId: string, nickname: string): Promise<Player> {
    // Generate a new wallet for the player
    const wallet = ethers.Wallet.createRandom();

    const { data, error } = await this.supabase
      .from('players')
      .insert({
        id: userId,
        nickname,
        wallet_address: wallet.address
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get player by ID
   */
  static async getPlayer(playerId: string): Promise<Player | null> {
    const { data, error } = await this.supabase
      .from('players')
      .select()
      .eq('id', playerId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all players within a radius (in meters) of a point
   */
  static async getPlayersNearby(latitude: number, longitude: number, radiusMeters: number): Promise<Player[]> {
    const { data, error } = await this.supabase
      .rpc('get_players_within_radius', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_radius: radiusMeters
      });

    if (error) throw error;
    return data;
  }

  /**
   * Update player location
   */
  static async updatePlayerLocation(userId: string, latitude: number, longitude: number): Promise<void> {
    const { error } = await this.supabase
      .rpc('update_player_location', {
        p_latitude: latitude,
        p_longitude: longitude
      });

    if (error) throw error;
  }

  /**
   * Get all missiles owned by a player
   */
  static async getPlayerMissiles(playerId: string): Promise<Missile[]> {
    const { data, error } = await this.supabase
      .from('missiles')
      .select()
      .eq('owner_id', playerId);

    if (error) throw error;
    return data;
  }

  /**
   * Launch a missile at a target
   */
  static async launchMissile(
    missileId: number,
    targetId: string,
    userId: string
  ): Promise<{
    success: boolean;
    missile_id: number;
    impact_id: number;
    damage: number;
    target_id: string;
  }> {
    const { data, error } = await this.supabase
      .rpc('launch_missile', {
        p_missile_id: missileId,
        p_target_id: targetId,
        p_user_id: userId
      });

    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to missile impacts on a player
   */
  static subscribeToImpacts(playerId: string, callback: (payload: { new: MissileImpact }) => void): RealtimeChannel {
    return this.supabase
      .channel('missile-impacts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'missile_impacts',
          filter: `target_id=eq.${playerId}`
        },
        (payload: any) => {
          const impact = payload.new as MissileImpact;
          callback({ new: impact });
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to player status changes
   */
  static subscribeToPlayerUpdates(playerId: string, callback: (payload: { new: Player }) => void): RealtimeChannel {
    return this.supabase
      .channel('player-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `id=eq.${playerId}`
        },
        (payload: any) => {
          const player = payload.new as Player;
          callback({ new: player });
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to missile status changes
   */
  static subscribeToMissileUpdates(ownerId: string, callback: (payload: { new: Missile }) => void): RealtimeChannel {
    return this.supabase
      .channel('missile-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missiles',
          filter: `owner_id=eq.${ownerId}`
        },
        (payload: any) => {
          const missile = payload.new as Missile;
          callback({ new: missile });
        }
      )
      .subscribe();
  }
} 