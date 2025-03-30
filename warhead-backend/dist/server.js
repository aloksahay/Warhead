"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("./services/supabase");
const PlayerService_1 = require("./services/PlayerService");
dotenv_1.default.config();
// Create Express app
exports.app = (0, express_1.default)();
// Security middleware
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
exports.app.use(limiter);
// Body parsing middleware
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
exports.app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Authentication endpoints
exports.app.post('/api/auth/signup', async (req, res) => {
    const { email, password, nickname } = req.body;
    try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase_1.SupabaseService.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nickname }
            }
        });
        if (authError)
            throw authError;
        // Create player record with wallet
        const player = await supabase_1.SupabaseService.createPlayer(authData.user.id, nickname);
        res.status(201).json({
            user: authData.user,
            session: authData.session,
            player
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase_1.SupabaseService.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error)
            throw error;
        // Get player data
        const player = await supabase_1.SupabaseService.getPlayer(data.user.id);
        res.json({
            ...data,
            player
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Game endpoints - all protected by Supabase Auth
exports.app.post('/api/location', async (req, res) => {
    const { latitude, longitude } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    try {
        // Verify session with Supabase
        const { data: { user }, error: authError } = await supabase_1.SupabaseService.supabase.auth.getUser(authHeader.split(' ')[1]);
        if (authError || !user)
            throw new Error('Invalid session');
        // Update player location
        await supabase_1.SupabaseService.updatePlayerLocation(user.id, latitude, longitude);
        // Get nearby players
        const nearbyPlayers = await supabase_1.SupabaseService.getPlayersNearby(latitude, longitude, 5000); // 5km radius
        res.json({
            success: true,
            nearby_players: nearbyPlayers
        });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
});
// Missile endpoints
exports.app.get('/api/missiles', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    try {
        // Verify session with Supabase
        const { data: { user }, error: authError } = await supabase_1.SupabaseService.supabase.auth.getUser(authHeader.split(' ')[1]);
        if (authError || !user)
            throw new Error('Invalid session');
        // Get player's missiles
        const missiles = await supabase_1.SupabaseService.getPlayerMissiles(user.id);
        res.json(missiles);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.app.post('/api/missiles/launch', async (req, res) => {
    const { target_id, missile_id } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    try {
        // Verify session with Supabase
        const { data: { user }, error: authError } = await supabase_1.SupabaseService.supabase.auth.getUser(authHeader.split(' ')[1]);
        if (authError || !user)
            throw new Error('Invalid session');
        // Launch missile
        const result = await supabase_1.SupabaseService.launchMissile(missile_id, target_id, user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Player endpoints
exports.app.post('/api/players', async (req, res) => {
    try {
        const { walletAddress, nickname } = req.body;
        if (!walletAddress || !nickname) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: { walletAddress: !walletAddress, nickname: !nickname }
            });
        }
        // Check if nickname is available
        const isAvailable = await PlayerService_1.PlayerService.isNicknameAvailable(nickname);
        if (!isAvailable) {
            return res.status(409).json({
                error: 'Nickname already taken',
                details: { nickname }
            });
        }
        const player = await PlayerService_1.PlayerService.createPlayer(walletAddress, nickname);
        if (!player) {
            return res.status(500).json({
                error: 'Failed to create player',
                details: 'Player creation returned null'
            });
        }
        res.status(201).json(player);
    }
    catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({
            error: 'Failed to create player',
            details: error.message || 'Unknown error occurred'
        });
    }
});
exports.app.get('/api/players/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const player = await PlayerService_1.PlayerService.getPlayerByWallet(walletAddress);
        if (!player) {
            return res.status(404).json({
                error: 'Player not found',
                details: { walletAddress }
            });
        }
        res.json(player);
    }
    catch (error) {
        console.error('Error getting player:', error);
        res.status(500).json({
            error: 'Failed to get player',
            details: error.message || 'Unknown error occurred'
        });
    }
});
exports.app.get('/api/players/check-nickname/:nickname', async (req, res) => {
    try {
        const { nickname } = req.params;
        const isAvailable = await PlayerService_1.PlayerService.isNicknameAvailable(nickname);
        res.json({ available: isAvailable });
    }
    catch (error) {
        console.error('Error checking nickname:', error);
        res.status(500).json({
            error: 'Failed to check nickname availability',
            details: error.message || 'Unknown error occurred'
        });
    }
});
// Error handling middleware
exports.app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message || 'An unexpected error occurred'
    });
});
// Start server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    exports.app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
