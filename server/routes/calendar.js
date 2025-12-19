import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// Reward types and assignment
const REWARD_TYPES = [
  'tokens',
  'nft_art',
  'whitelist',
  'collectible',
  'meme_pack',
];

// Get calendar status for user
router.get('/status', async (req, res) => {
  try {
    const sessionId = req.sessionId;
    const walletAddress = req.query.walletAddress;
    
    let userId = null;
    if (walletAddress) {
      const userResult = await query(
        'SELECT id FROM users WHERE wallet_address = $1',
        [walletAddress]
      );
      userId = userResult.rows[0]?.id || null;
    }
    
    // Get all calendar entries
    let result;
    if (userId) {
      result = await query(
        'SELECT * FROM advent_calendar WHERE user_id = $1 ORDER BY day',
        [userId]
      );
    } else {
      result = await query(
        'SELECT * FROM advent_calendar WHERE session_id = $1 ORDER BY day',
        [sessionId]
      );
    }
    
    const entries = result.rows;
    const currentDay = getCurrentDay();
    
    // Check unlock conditions for current day
    const canUnlock = await checkUnlockConditions(userId, sessionId, currentDay);
    
    res.json({
      currentDay,
      entries: entries.map(entry => ({
        day: entry.day,
        unlocked: entry.unlocked,
        claimed: entry.claimed,
        unlockMethod: entry.unlock_method,
        rewardType: entry.reward_type,
        rewardData: entry.reward_data,
      })),
      canUnlockToday: canUnlock,
    });
  } catch (error) {
    console.error('Get calendar status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get calendar status' });
  }
});

// Unlock calendar day
router.post('/unlock', async (req, res) => {
  try {
    const { day } = req.body;
    const sessionId = req.sessionId;
    const walletAddress = req.body.walletAddress;
    
    if (!day || day < 1 || day > 24) {
      return res.status(400).json({ error: 'Valid day (1-24) required' });
    }
    
    const currentDay = getCurrentDay();
    if (day > currentDay) {
      return res.status(400).json({ error: 'Cannot unlock future days' });
    }
    
    if (day < currentDay) {
      return res.status(400).json({ error: 'Day has already passed' });
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
    
    // Check if already unlocked
    let checkResult;
    if (userId) {
      checkResult = await query(
        'SELECT * FROM advent_calendar WHERE user_id = $1 AND day = $2',
        [userId, day]
      );
    } else {
      checkResult = await query(
        'SELECT * FROM advent_calendar WHERE session_id = $1 AND day = $2',
        [sessionId, day]
      );
    }
    
    if (checkResult.rows.length > 0 && checkResult.rows[0].unlocked) {
      return res.json({
        success: true,
        alreadyUnlocked: true,
        entry: checkResult.rows[0],
      });
    }
    
    // Check unlock conditions
    const unlockMethod = await checkUnlockConditions(userId, sessionId, day);
    if (!unlockMethod) {
      return res.status(403).json({ 
        error: 'Unlock conditions not met. Generate a Snowy, play the game, hold tokens, or share content.' 
      });
    }
    
    // Assign reward
    const rewardType = REWARD_TYPES[(day - 1) % REWARD_TYPES.length];
    const rewardData = {
      amount: day * 10, // Example: tokens amount
      description: `Day ${day} reward: ${rewardType}`,
    };
    
    // Create or update calendar entry
    if (checkResult.rows.length > 0) {
      await query(
        `UPDATE advent_calendar 
         SET unlocked = true, unlock_method = $1, reward_type = $2, reward_data = $3, unlocked_at = NOW() 
         WHERE (user_id = $4 OR session_id = $5) AND day = $6`,
        [unlockMethod, rewardType, JSON.stringify(rewardData), userId, sessionId, day]
      );
    } else {
      await query(
        `INSERT INTO advent_calendar 
         (user_id, session_id, day, unlocked, unlock_method, reward_type, reward_data, unlocked_at) 
         VALUES ($1, $2, $3, true, $4, $5, $6, NOW())`,
        [userId, sessionId, day, unlockMethod, rewardType, JSON.stringify(rewardData)]
      );
    }
    
    res.json({
      success: true,
      day,
      rewardType,
      rewardData,
      unlockMethod,
    });
  } catch (error) {
    console.error('Unlock calendar error:', error);
    res.status(500).json({ error: error.message || 'Failed to unlock calendar day' });
  }
});

// Claim calendar reward
router.post('/claim', async (req, res) => {
  try {
    const { day } = req.body;
    const sessionId = req.sessionId;
    const walletAddress = req.body.walletAddress;
    
    if (!day || day < 1 || day > 24) {
      return res.status(400).json({ error: 'Valid day (1-24) required' });
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
    
    // Get calendar entry
    let result;
    if (userId) {
      result = await query(
        'SELECT * FROM advent_calendar WHERE user_id = $1 AND day = $2',
        [userId, day]
      );
    } else {
      result = await query(
        'SELECT * FROM advent_calendar WHERE session_id = $1 AND day = $2',
        [sessionId, day]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Calendar entry not found' });
    }
    
    const entry = result.rows[0];
    
    if (!entry.unlocked) {
      return res.status(403).json({ error: 'Day must be unlocked before claiming' });
    }
    
    if (entry.claimed) {
      return res.json({
        success: true,
        alreadyClaimed: true,
        entry,
      });
    }
    
    // Mark as claimed
    await query(
      `UPDATE advent_calendar 
       SET claimed = true, claimed_at = NOW() 
       WHERE (user_id = $1 OR session_id = $2) AND day = $3`,
      [userId, sessionId, day]
    );
    
    res.json({
      success: true,
      day,
      rewardType: entry.reward_type,
      rewardData: entry.reward_data,
    });
  } catch (error) {
    console.error('Claim calendar error:', error);
    res.status(500).json({ error: error.message || 'Failed to claim reward' });
  }
});

// Check unlock conditions
async function checkUnlockConditions(userId, sessionId, day) {
  try {
    // Check if user has generated a Snowy
    let hasGenerated = false;
    if (userId) {
      const genResult = await query(
        'SELECT COUNT(*) as count FROM snowy_generations WHERE user_id = $1',
        [userId]
      );
      hasGenerated = parseInt(genResult.rows[0].count) > 0;
    } else {
      const genResult = await query(
        'SELECT COUNT(*) as count FROM snowy_generations WHERE session_id = $1',
        [sessionId]
      );
      hasGenerated = parseInt(genResult.rows[0].count) > 0;
    }
    
    if (hasGenerated) {
      return 'generated_snowy';
    }
    
    // Check if user has played the game
    let hasPlayed = false;
    if (userId) {
      const gameResult = await query(
        'SELECT COUNT(*) as count FROM game_scores WHERE user_id = $1',
        [userId]
      );
      hasPlayed = parseInt(gameResult.rows[0].count) > 0;
    } else {
      const gameResult = await query(
        'SELECT COUNT(*) as count FROM game_scores WHERE session_id = $1',
        [sessionId]
      );
      hasPlayed = parseInt(gameResult.rows[0].count) > 0;
    }
    
    if (hasPlayed) {
      return 'played_game';
    }
    
    // Note: Token holding and sharing would need additional checks
    // For now, we'll use the above two conditions
    
    return null;
  } catch (error) {
    console.error('Check unlock conditions error:', error);
    return null;
  }
}

// Get current day of December (1-24)
function getCurrentDay() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate(); // 1-31
  
  // Only return day if it's December
  if (month === 11 && day >= 1 && day <= 24) {
    return day;
  }
  
  // For testing or outside December, return 1
  return 1;
}

export default router;
