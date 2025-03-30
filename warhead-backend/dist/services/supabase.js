"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class SupabaseService {
    /**
     * Create a new player after signup
     */
    static async createPlayer(userId, nickname) {
        // Generate a new wallet for the player
        const wallet = ethers_1.ethers.Wallet.createRandom();
        const { data, error } = await this.supabase
            .from('players')
            .insert({
            id: userId,
            nickname,
            wallet_address: wallet.address
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Get player by ID
     */
    static async getPlayer(playerId) {
        const { data, error } = await this.supabase
            .from('players')
            .select()
            .eq('id', playerId)
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Get all players within a radius (in meters) of a point
     */
    static async getPlayersNearby(latitude, longitude, radiusMeters) {
        const { data, error } = await this.supabase
            .rpc('get_players_within_radius', {
            p_latitude: latitude,
            p_longitude: longitude,
            p_radius: radiusMeters
        });
        if (error)
            throw error;
        return data;
    }
    /**
     * Update player location
     */
    static async updatePlayerLocation(userId, latitude, longitude) {
        const { error } = await this.supabase
            .rpc('update_player_location', {
            p_latitude: latitude,
            p_longitude: longitude
        });
        if (error)
            throw error;
    }
    /**
     * Get all missiles owned by a player
     */
    static async getPlayerMissiles(playerId) {
        const { data, error } = await this.supabase
            .from('missiles')
            .select()
            .eq('owner_id', playerId);
        if (error)
            throw error;
        return data;
    }
    /**
     * Launch a missile at a target
     */
    static async launchMissile(missileId, targetId, userId) {
        const { data, error } = await this.supabase
            .rpc('launch_missile', {
            p_missile_id: missileId,
            p_target_id: targetId,
            p_user_id: userId
        });
        if (error)
            throw error;
        return data;
    }
    /**
     * Subscribe to missile impacts on a player
     */
    static subscribeToImpacts(playerId, callback) {
        return this.supabase
            .channel('missile-impacts')
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'missile_impacts',
            filter: `target_id=eq.${playerId}`
        }, (payload) => {
            const impact = payload.new;
            callback({ new: impact });
        })
            .subscribe();
    }
    /**
     * Subscribe to player status changes
     */
    static subscribeToPlayerUpdates(playerId, callback) {
        return this.supabase
            .channel('player-updates')
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'players',
            filter: `id=eq.${playerId}`
        }, (payload) => {
            const player = payload.new;
            callback({ new: player });
        })
            .subscribe();
    }
    /**
     * Subscribe to missile status changes
     */
    static subscribeToMissileUpdates(ownerId, callback) {
        return this.supabase
            .channel('missile-updates')
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'missiles',
            filter: `owner_id=eq.${ownerId}`
        }, (payload) => {
            const missile = payload.new;
            callback({ new: missile });
        })
            .subscribe();
    }
}
exports.SupabaseService = SupabaseService;
// Initialize and expose Supabase client
SupabaseService.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
