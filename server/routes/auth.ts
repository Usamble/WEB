import { Router, Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { randomBytes } from 'crypto';
import nacl from 'tweetnacl';
import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';
import { getUserFromWallet } from '../middleware/session.js';

const router = Router();

const isValidSolanaAddress = (address?: string) => {
  if (!address || typeof address !== 'string') return false;
  try {
    const key = new PublicKey(address);
    // PublicKey constructor validates length/base58; this extra check ensures it is on curve
    return PublicKey.isOnCurve(key.toBytes());
  } catch {
    return false;
  }
};

const buildLoginMessage = (sessionId: string, nonce: string) =>
  `Snowy Login\nSession: ${sessionId}\nNonce: ${nonce}\nThis action is free and does not submit a transaction.`;

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

// Get or create user session
router.post('/session', async (req: Request, res: Response) => {
  try {
    const sessionId = (req as any).sessionId;
    const walletAddress = req.body.walletAddress;
    
    if (walletAddress) {
      if (!isValidSolanaAddress(walletAddress)) {
        return res.status(400).json({ error: 'Invalid Solana wallet address' });
      }
      // Link wallet to session
      const user = await getUserFromWallet(walletAddress);
      
      // Update session with wallet
      await query(
        'UPDATE user_sessions SET wallet_address = $1 WHERE session_id = $2',
        [walletAddress, sessionId]
      );
      
      return res.json({
        sessionId,
        userId: user.id,
        walletAddress: user.wallet_address,
        referralCode: user.referral_code,
      });
    }
    
    // Return session info
    const sessionResult = await query(
      'SELECT * FROM user_sessions WHERE session_id = $1',
      [sessionId]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = sessionResult.rows[0];
    
    // Get user if wallet is linked
    let user = null;
    if (session.wallet_address) {
      const userResult = await query(
        'SELECT * FROM users WHERE wallet_address = $1',
        [session.wallet_address]
      );
      user = userResult.rows[0] || null;
    }
    
    res.json({
      sessionId,
      walletAddress: session.wallet_address,
      userId: user?.id || null,
      referralCode: user?.referral_code || null,
    });
  } catch (error: any) {
    console.error('Session error:', error);
    res.status(500).json({ error: error.message || 'Failed to get session' });
  }
});

// Username/password register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, walletAddress, nickname } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (walletAddress && !isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }
    if (nickname && (nickname.length < 3 || nickname.length > 24)) {
      return res.status(400).json({ error: 'Nickname must be 3-24 characters' });
    }

    // Check unique username
    const exists = await query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Username already taken' });

    const passwordHash = await hashPassword(password);
    const referralCode = `SNOWY-${username.substring(0, 8).toUpperCase()}`;

    const user = await query(
      `INSERT INTO users (username, password_hash, wallet_address, nickname, referral_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, wallet_address, nickname, referral_code`,
      [username.trim(), passwordHash, walletAddress || null, nickname || null, referralCode]
    );

    // Tie session to wallet if provided
    if (walletAddress) {
      await query(
        'UPDATE user_sessions SET wallet_address = $1 WHERE session_id = $2',
        [walletAddress, req.cookies?.sessionId]
      );
    }

    return res.json({ user: user.rows[0] });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Failed to register' });
  }
});

// Username/password login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, walletAddress } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const userRes = await query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );
    const user = userRes.rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Optional wallet attach/update
    if (walletAddress) {
      if (!isValidSolanaAddress(walletAddress)) {
        return res.status(400).json({ error: 'Invalid Solana wallet address' });
      }
      await query(
        'UPDATE users SET wallet_address = $1 WHERE id = $2',
        [walletAddress, user.id]
      );
      await query(
        'UPDATE user_sessions SET wallet_address = $1 WHERE session_id = $2',
        [walletAddress, (req as any).sessionId]
      );
    }

    res.json({
      id: user.id,
      username: user.username,
      walletAddress: walletAddress || user.wallet_address,
      nickname: user.nickname,
      referralCode: user.referral_code,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Failed to login' });
  }
});

// Wallet login challenge (returns nonce + message to sign)
router.get('/wallet-challenge', async (req: Request, res: Response) => {
  try {
    const sessionId = (req as any).sessionId;
    const nonce = randomBytes(16).toString('hex');

    await query(
      `UPDATE user_sessions SET login_nonce = $1 WHERE session_id = $2`,
      [nonce, sessionId]
    );

    res.json({
      sessionId,
      nonce,
      message: buildLoginMessage(sessionId, nonce),
    });
  } catch (error: any) {
    console.error('Wallet challenge error:', error);
    res.status(500).json({ error: error.message || 'Failed to create challenge' });
  }
});

// Wallet login verify
router.post('/wallet-verify', async (req: Request, res: Response) => {
  try {
    const sessionId = (req as any).sessionId;
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({ error: 'walletAddress and signature required' });
    }
    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    const result = await query(
      'SELECT login_nonce FROM user_sessions WHERE session_id = $1',
      [sessionId]
    );
    const nonce = result.rows[0]?.login_nonce;
    if (!nonce) {
      return res.status(400).json({ error: 'No pending challenge; fetch /auth/wallet-challenge first' });
    }

    const message = buildLoginMessage(sessionId, nonce);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');
    const pubkey = new PublicKey(walletAddress);
    const ok = nacl.sign.detached.verify(messageBytes, signatureBytes, pubkey.toBytes());
    if (!ok) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // Clear nonce to prevent replay
    await query(
      'UPDATE user_sessions SET login_nonce = NULL, wallet_address = $1 WHERE session_id = $2',
      [walletAddress, sessionId]
    );

    // Create or fetch user
    const user = await getUserFromWallet(walletAddress);

    res.json({
      sessionId,
      walletAddress,
      userId: user.id,
      nickname: user.nickname || null,
      referralCode: user.referral_code || null,
    });
  } catch (error: any) {
    console.error('Wallet verify error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify signature' });
  }
});

// Create/update profile (nickname + wallet)
router.post('/profile', async (req: Request, res: Response) => {
  try {
    const sessionId = (req as any).sessionId;
    const { walletAddress, nickname } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'walletAddress is required' });
    }
    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 3 || nickname.trim().length > 24) {
      return res.status(400).json({ error: 'Nickname must be 3-24 characters' });
    }

    const cleanNickname = nickname.trim();

    // Ensure nickname uniqueness
    const nicknameTaken = await query(
      'SELECT id FROM users WHERE LOWER(nickname) = LOWER($1) AND wallet_address != $2',
      [cleanNickname, walletAddress]
    );
    if (nicknameTaken.rows.length > 0) {
      return res.status(409).json({ error: 'Nickname already taken' });
    }

    // Upsert user with nickname + wallet
    const existingUser = await query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    let user;
    if (existingUser.rows.length > 0) {
      user = await query(
        `UPDATE users 
         SET nickname = $1, last_active = NOW() 
         WHERE wallet_address = $2
         RETURNING *`,
        [cleanNickname, walletAddress]
      );
    } else {
      const referralCode = `SNOWY-${walletAddress.substring(0, 8).toUpperCase()}`;
      user = await query(
        `INSERT INTO users (wallet_address, nickname, referral_code, session_id) 
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [walletAddress, cleanNickname, referralCode, sessionId]
      );
    }

    // Tie session to wallet for later lookups
    await query(
      'UPDATE user_sessions SET wallet_address = $1 WHERE session_id = $2',
      [walletAddress, sessionId]
    );

    const row = user.rows[0];
    return res.json({
      id: row.id,
      walletAddress: row.wallet_address,
      nickname: row.nickname,
      referralCode: row.referral_code,
    });
  } catch (error: any) {
    console.error('Profile save error:', error);
    res.status(500).json({ error: error.message || 'Failed to save profile' });
  }
});

// Get user info
router.get('/user', async (req: Request, res: Response) => {
  try {
    const sessionId = (req as any).sessionId;
    const walletAddress = req.query.walletAddress as string;
    
    let user;
    
    if (walletAddress) {
      const result = await query(
        'SELECT * FROM users WHERE wallet_address = $1',
        [walletAddress]
      );
      user = result.rows[0];
    } else {
      // Get user from session
      const sessionResult = await query(
        'SELECT wallet_address FROM user_sessions WHERE session_id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length > 0 && sessionResult.rows[0].wallet_address) {
        const result = await query(
          'SELECT * FROM users WHERE wallet_address = $1',
          [sessionResult.rows[0].wallet_address]
        );
        user = result.rows[0];
      }
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get stats
    const [generations, gameScores, calendarUnlocks, giveawayEntries] = await Promise.all([
      query('SELECT COUNT(*) as count FROM snowy_generations WHERE user_id = $1', [user.id]),
      query('SELECT MAX(score) as best_score, COUNT(*) as games_played FROM game_scores WHERE user_id = $1', [user.id]),
      query('SELECT COUNT(*) as count FROM advent_calendar WHERE user_id = $1 AND unlocked = true', [user.id]),
      query('SELECT COUNT(*) as count, SUM(weight) as total_weight FROM giveaway_entries WHERE user_id = $1', [user.id]),
    ]);
    
    res.json({
      id: user.id,
      walletAddress: user.wallet_address,
      referralCode: user.referral_code,
      createdAt: user.created_at,
      stats: {
        generations: parseInt(generations.rows[0].count),
        bestGameScore: gameScores.rows[0].best_score || 0,
        gamesPlayed: parseInt(gameScores.rows[0].games_played),
        calendarUnlocks: parseInt(calendarUnlocks.rows[0].count),
        giveawayEntries: parseInt(giveawayEntries.rows[0].count),
        giveawayWeight: parseInt(giveawayEntries.rows[0].total_weight) || 0,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

export default router;
