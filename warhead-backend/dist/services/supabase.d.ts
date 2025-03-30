import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
export interface Player {
    id: string;
    nickname: string;
    wallet_address: string;
    location: any;
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
    target_location?: any;
    created_at: string;
    updated_at: string;
}
export interface MissileImpact {
    id: number;
    missile_id: number;
    target_id: string;
    damage: number;
    impact_location: any;
    impact_time: string;
}
export declare class SupabaseService {
    static readonly supabase: SupabaseClient;
    /**
     * Create a new player after signup
     */
    static createPlayer(userId: string, nickname: string): Promise<Player>;
    /**
     * Get player by ID
     */
    static getPlayer(playerId: string): Promise<Player | null>;
    /**
     * Get all players within a radius (in meters) of a point
     */
    static getPlayersNearby(latitude: number, longitude: number, radiusMeters: number): Promise<Player[]>;
    /**
     * Update player location
     */
    static updatePlayerLocation(userId: string, latitude: number, longitude: number): Promise<void>;
    /**
     * Get all missiles owned by a player
     */
    static getPlayerMissiles(playerId: string): Promise<Missile[]>;
    /**
     * Launch a missile at a target
     */
    static launchMissile(missileId: number, targetId: string, userId: string): Promise<{
        success: boolean;
        missile_id: number;
        impact_id: number;
        damage: number;
        target_id: string;
    }>;
    /**
     * Subscribe to missile impacts on a player
     */
    static subscribeToImpacts(playerId: string, callback: (payload: {
        new: MissileImpact;
    }) => void): RealtimeChannel;
    /**
     * Subscribe to player status changes
     */
    static subscribeToPlayerUpdates(playerId: string, callback: (payload: {
        new: Player;
    }) => void): RealtimeChannel;
    /**
     * Subscribe to missile status changes
     */
    static subscribeToMissileUpdates(ownerId: string, callback: (payload: {
        new: Missile;
    }) => void): RealtimeChannel;
}
