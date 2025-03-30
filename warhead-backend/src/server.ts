import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { SupabaseService } from './services/supabase';
import { PlayerService } from './services/PlayerService';

dotenv.config();

// Create Express app
export const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Authentication endpoints
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, nickname } = req.body;
  
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await SupabaseService.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname }
      }
    });

    if (authError) throw authError;

    // Create player record with wallet
    const player = await SupabaseService.createPlayer(authData.user!.id, nickname);

    res.status(201).json({
      user: authData.user,
      session: authData.session,
      player
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data, error } = await SupabaseService.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Get player data
    const player = await SupabaseService.getPlayer(data.user.id);

    res.json({
      ...data,
      player
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Game endpoints - all protected by Supabase Auth
app.post('/api/location', async (req, res) => {
  const { latitude, longitude } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    // Verify session with Supabase
    const { data: { user }, error: authError } = await SupabaseService.supabase.auth.getUser(authHeader.split(' ')[1]);
    if (authError || !user) throw new Error('Invalid session');

    // Update player location
    await SupabaseService.updatePlayerLocation(user.id, latitude, longitude);

    // Get nearby players
    const nearbyPlayers = await SupabaseService.getPlayersNearby(latitude, longitude, 5000); // 5km radius

    res.json({
      success: true,
      nearby_players: nearbyPlayers
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Missile endpoints
app.get('/api/missiles', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    // Verify session with Supabase
    const { data: { user }, error: authError } = await SupabaseService.supabase.auth.getUser(authHeader.split(' ')[1]);
    if (authError || !user) throw new Error('Invalid session');

    // Get player's missiles
    const missiles = await SupabaseService.getPlayerMissiles(user.id);

    res.json(missiles);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/missiles/launch', async (req, res) => {
  const { target_id, missile_id } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    // Verify session with Supabase
    const { data: { user }, error: authError } = await SupabaseService.supabase.auth.getUser(authHeader.split(' ')[1]);
    if (authError || !user) throw new Error('Invalid session');

    // Launch missile
    const result = await SupabaseService.launchMissile(missile_id, target_id, user.id);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Player endpoints
app.post('/api/players', async (req, res) => {
  try {
    const { walletAddress, nickname } = req.body;

    if (!walletAddress || !nickname) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: { walletAddress: !walletAddress, nickname: !nickname }
      });
    }

    // Check if nickname is available
    const isAvailable = await PlayerService.isNicknameAvailable(nickname);
    if (!isAvailable) {
      return res.status(409).json({
        error: 'Nickname already taken',
        details: { nickname }
      });
    }

    const player = await PlayerService.createPlayer(walletAddress, nickname);
    if (!player) {
      return res.status(500).json({
        error: 'Failed to create player',
        details: 'Player creation returned null'
      });
    }

    res.status(201).json(player);
  } catch (error: any) {
    console.error('Error creating player:', error);
    res.status(500).json({
      error: 'Failed to create player',
      details: error.message || 'Unknown error occurred'
    });
  }
});

app.get('/api/players/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const player = await PlayerService.getPlayerByWallet(walletAddress);

    if (!player) {
      return res.status(404).json({
        error: 'Player not found',
        details: { walletAddress }
      });
    }

    res.json(player);
  } catch (error: any) {
    console.error('Error getting player:', error);
    res.status(500).json({
      error: 'Failed to get player',
      details: error.message || 'Unknown error occurred'
    });
  }
});

app.get('/api/players/check-nickname/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;
    const isAvailable = await PlayerService.isNicknameAvailable(nickname);
    res.json({ available: isAvailable });
  } catch (error: any) {
    console.error('Error checking nickname:', error);
    res.status(500).json({
      error: 'Failed to check nickname availability',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message || 'An unexpected error occurred'
  });
});

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} 