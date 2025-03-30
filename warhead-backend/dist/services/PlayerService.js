"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
}
console.log('Initializing Supabase client with URL:', supabaseUrl);
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
class PlayerService {
    static async initializeDatabase() {
        try {
            console.log('Checking if players table exists...');
            // Check if table exists
            const { error: checkError } = await supabase
                .from('players')
                .select('id')
                .limit(1);
            if (checkError) {
                console.log('Error checking table:', checkError);
                if (checkError.code === '42P01') {
                    console.log('Table does not exist, creating...');
                    // Table doesn't exist, create it
                    const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.players (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              wallet_address TEXT NOT NULL UNIQUE,
              nickname TEXT NOT NULL UNIQUE,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS players_wallet_address_idx ON public.players(wallet_address);

            ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "Allow public read access" ON public.players
              FOR SELECT USING (true);

            CREATE POLICY "Allow public insert with unique constraints" ON public.players
              FOR INSERT WITH CHECK (
                NOT EXISTS (
                  SELECT 1 FROM public.players 
                  WHERE wallet_address = NEW.wallet_address 
                  OR nickname = NEW.nickname
                )
              );
          `;
                    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
                    if (createError) {
                        console.error('Error creating table:', createError);
                        throw new Error(`Failed to create table: ${createError.message}`);
                    }
                    console.log('Table created successfully');
                }
                else {
                    throw new Error(`Database check failed: ${checkError.message}`);
                }
            }
            else {
                console.log('Table already exists');
            }
        }
        catch (error) {
            console.error('Error initializing database:', error);
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }
    static async createPlayer(walletAddress, nickname) {
        try {
            console.log(`Creating player with wallet: ${walletAddress}, nickname: ${nickname}`);
            // Ensure database is initialized
            await this.initializeDatabase();
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
        }
        catch (error) {
            console.error('Error in createPlayer:', error);
            throw error;
        }
    }
    static async getPlayerByWallet(walletAddress) {
        try {
            console.log(`Getting player with wallet: ${walletAddress}`);
            // Ensure database is initialized
            await this.initializeDatabase();
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
        }
        catch (error) {
            console.error('Error in getPlayerByWallet:', error);
            throw error;
        }
    }
    static async isNicknameAvailable(nickname) {
        try {
            console.log(`Checking nickname availability: ${nickname}`);
            // Ensure database is initialized
            await this.initializeDatabase();
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
        }
        catch (error) {
            console.error('Error in isNicknameAvailable:', error);
            throw error;
        }
    }
}
exports.PlayerService = PlayerService;
