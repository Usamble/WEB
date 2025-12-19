import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';

const router = Router();

// Create giveaway entry
router.post('/enter', async (req: Request, res: Response) => {
  try {
    const { entryMethod, referralCode } = req.body;
    const sessionId = (req as any).sessionId;
    const walletAddress = req.body.walletAddress;
    
    if (!entryMethod) {
      return res.status(400).json({ error: 'Entry method required' });
    }
    
    const validMethods = ['generate', 'hold', 'share', 'refer'];
    if (!validMethods.includes(entryMethod)) {
      return res.status(400).json({ error: 'Invalid entry method' });
    }
    
    // Get user ID
    let userId = null;
    if (walletAddress) {
      const userResult = await query(
        'SELECT id FROM users WHERE wallet_address = $1',
        [walletAddress]
      );
      userId = userResult.rows[0]?.id || null;
    }
    
    // Calculate entry weight
    let weight = 1;
    if (entryMethod === 'refer') {
      weight = 2; // Referrals get double weight
    }
    
    // If this is a referral entry, track the referral
    if (entryMethod === 'refer' && referralCode) {
      // Find referrer
      const referrerResult = await query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode]
      );
      
      if (referrerResult.rows.length > 0 && userId) {
        const referrerId = referrerResult.rows[0].id;
        
        // Check if referral already exists
        const existingRef = await query(
          'SELECT * FROM referrals WHERE referred_user_id = $1',
          [userId]
        );
        
        if (existingRef.rows.length === 0 && referrerId !== userId) {
          // Create referral record
          await query(
            `INSERT INTO referrals (referrer_user_id, referred_user_id, referral_code) 
             VALUES ($1, $2, $3)`,
            [referrerId, userId, referralCode]
          );
          
          // Give bonus weight to referrer
          await query(
            `INSERT INTO giveaway_entries (user_id, session_id, entry_method, weight) 
             VALUES ($1, NULL, 'referral_bonus', 1)`,
            [referrerId]
          );
        }
      }
    }
    
    // Create entry
    const result = await query(
      `INSERT INTO giveaway_entries (user_id, session_id, referral_code, entry_method, weight) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, sessionId, referralCode || null, entryMethod, weight]
    );
    
    res.json({
      success: true,
      entry: result.rows[0],
    });
  } catch (error: any) {
    console.error('Enter giveaway error:', error);
    res.status(500).json({ error: error.message || 'Failed to enter giveaway' });
  }
});

// Get user's giveaway stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const sessionId = (req as any).sessionId;
    const walletAddress = req.query.walletAddress as string;
    
    let userId = null;
    if (walletAddress) {
      const userResult = await query(
        'SELECT id FROM users WHERE wallet_address = $1',
        [walletAddress]
      );
      userId = userResult.rows[0]?.id || null;
    }
    
    let result;
    if (userId) {
      result = await query(
        `SELECT 
          COUNT(*) as entry_count,
          SUM(weight) as total_weight,
          COUNT(CASE WHEN entry_method = 'generate' THEN 1 END) as generate_entries,
          COUNT(CASE WHEN entry_method = 'hold' THEN 1 END) as hold_entries,
          COUNT(CASE WHEN entry_method = 'share' THEN 1 END) as share_entries,
          COUNT(CASE WHEN entry_method = 'refer' THEN 1 END) as refer_entries
         FROM giveaway_entries 
         WHERE user_id = $1`,
        [userId]
      );
    } else {
      result = await query(
        `SELECT 
          COUNT(*) as entry_count,
          SUM(weight) as total_weight,
          COUNT(CASE WHEN entry_method = 'generate' THEN 1 END) as generate_entries,
          COUNT(CASE WHEN entry_method = 'hold' THEN 1 END) as hold_entries,
          COUNT(CASE WHEN entry_method = 'share' THEN 1 END) as share_entries,
          COUNT(CASE WHEN entry_method = 'refer' THEN 1 END) as refer_entries
         FROM giveaway_entries 
         WHERE session_id = $1`,
        [sessionId]
      );
    }
    
    const stats = result.rows[0];
    
    res.json({
      entryCount: parseInt(stats.entry_count) || 0,
      totalWeight: parseInt(stats.total_weight) || 0,
      generateEntries: parseInt(stats.generate_entries) || 0,
      holdEntries: parseInt(stats.hold_entries) || 0,
      shareEntries: parseInt(stats.share_entries) || 0,
      referEntries: parseInt(stats.refer_entries) || 0,
    });
  } catch (error: any) {
    console.error('Get giveaway stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get giveaway stats' });
  }
});

// Get user's referral code
router.get('/referral-code', async (req: Request, res: Response) => {
  try {
    const sessionId = (req as any).sessionId;
    const walletAddress = req.query.walletAddress as string;
    
    let referralCode = null;
    
    if (walletAddress) {
      const userResult = await query(
        'SELECT referral_code FROM users WHERE wallet_address = $1',
        [walletAddress]
      );
      referralCode = userResult.rows[0]?.referral_code || null;
    } else {
      // Get from session
      const sessionResult = await query(
        'SELECT wallet_address FROM user_sessions WHERE session_id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length > 0 && sessionResult.rows[0].wallet_address) {
        const userResult = await query(
          'SELECT referral_code FROM users WHERE wallet_address = $1',
          [sessionResult.rows[0].wallet_address]
        );
        referralCode = userResult.rows[0]?.referral_code || null;
      }
    }
    
    if (!referralCode) {
      return res.status(404).json({ error: 'Referral code not found. Connect wallet to get one.' });
    }
    
    res.json({
      referralCode,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?ref=${referralCode}`,
    });
  } catch (error: any) {
    console.error('Get referral code error:', error);
    res.status(500).json({ error: error.message || 'Failed to get referral code' });
  }
});

// Admin: Export participants
router.get('/admin/export', async (req: Request, res: Response) => {
  try {
    // Basic admin check (should be enhanced with proper auth)
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const result = await query(
      `SELECT 
        u.wallet_address,
        u.referral_code,
        COUNT(ge.id) as entry_count,
        SUM(ge.weight) as total_weight
       FROM giveaway_entries ge
       LEFT JOIN users u ON ge.user_id = u.id
       GROUP BY u.id, u.wallet_address, u.referral_code
       ORDER BY total_weight DESC`
    );
    
    res.json({
      participants: result.rows,
      totalParticipants: result.rows.length,
    });
  } catch (error: any) {
    console.error('Export participants error:', error);
    res.status(500).json({ error: error.message || 'Failed to export participants' });
  }
});

export default router;

