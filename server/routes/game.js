import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// Submit game score
router.post('/submit-score', async (req, res) => {
  try {
    const { score } = req.body;
    const sessionId = req.sessionId;
    const walletAddress = req.body.walletAddress;
    
    if (!score || typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Valid score required' });
    }
    
    // Upsert user if wallet is provided
    let userId = null;
    if (walletAddress) {
      const userResult = await query(
        `INSERT INTO users (wallet_address, last_active)
         VALUES ($1, NOW())
         ON CONFLICT (wallet_address) DO UPDATE SET last_active = NOW()
         RETURNING id`,
        [walletAddress]
      );
      userId = userResult.rows[0]?.id || null;
    }
    
    // Get today's run count
    const today = new Date().toISOString().split('T')[0];
    const runCountResult = await query(
      `SELECT COUNT(*) as count FROM game_scores 
       WHERE (user_id = $1 OR session_id = $2) AND date = $3`,
      [userId, sessionId, today]
    );
    
    const dailyRunCount = parseInt(runCountResult.rows[0].count) + 1;
    
    // Save score
    const result = await query(
      `INSERT INTO game_scores (user_id, session_id, score, date, daily_run_count) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, sessionId, score, today, dailyRunCount]
    );
    
    // Update leaderboard
    await updateLeaderboard(userId, sessionId, score);
    
    res.json({
      id: result.rows[0].id,
      score,
      dailyRunCount,
      date: today,
    });
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit score' });
  }
});

// Update leaderboard
async function updateLeaderboard(userId, sessionId, score) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart();
    
    // Get best daily score
    const dailyResult = await query(
      `SELECT MAX(score) as max_score FROM game_scores 
       WHERE (user_id = $1 OR session_id = $2) AND date = $3`,
      [userId, sessionId, today]
    );
    const dailyScore = parseInt(dailyResult.rows[0].max_score) || 0;
    
    // Get best weekly score
    const weeklyResult = await query(
      `SELECT MAX(score) as max_score FROM game_scores 
       WHERE (user_id = $1 OR session_id = $2) AND date >= $3`,
      [userId, sessionId, weekStart]
    );
    const weeklyScore = parseInt(weeklyResult.rows[0].max_score) || 0;
    
    // Get all-time best
    const allTimeResult = await query(
      `SELECT MAX(score) as max_score FROM game_scores 
       WHERE user_id = $1 OR session_id = $2`,
      [userId, sessionId]
    );
    const allTimeScore = parseInt(allTimeResult.rows[0].max_score) || 0;
    
    // Upsert leaderboard
    if (userId) {
      await query(
        `INSERT INTO leaderboards (user_id, session_id, daily_score, weekly_score, all_time_score, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           daily_score = GREATEST(leaderboards.daily_score, $3),
           weekly_score = GREATEST(leaderboards.weekly_score, $4),
           all_time_score = GREATEST(leaderboards.all_time_score, $5),
           updated_at = NOW()`,
        [userId, sessionId, dailyScore, weeklyScore, allTimeScore]
      );
    } else {
      await query(
        `INSERT INTO leaderboards (session_id, daily_score, weekly_score, all_time_score, updated_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         ON CONFLICT (session_id) 
         DO UPDATE SET 
           daily_score = GREATEST(leaderboards.daily_score, $2),
           weekly_score = GREATEST(leaderboards.weekly_score, $3),
           all_time_score = GREATEST(leaderboards.all_time_score, $4),
           updated_at = NOW()`,
        [sessionId, dailyScore, weeklyScore, allTimeScore]
      );
    }
  } catch (error) {
    console.error('Leaderboard update error:', error);
  }
}

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const type = (req.query.type) || 'daily';
    const limit = parseInt(req.query.limit) || 100;
    
    let orderBy = 'daily_score DESC';
    if (type === 'weekly') {
      orderBy = 'weekly_score DESC';
    } else if (type === 'alltime') {
      orderBy = 'all_time_score DESC';
    }
    
    const result = await query(
      `SELECT 
        l.*,
        u.wallet_address,
        u.nickname,
        u.referral_code
       FROM leaderboards l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.daily_score > 0 OR l.weekly_score > 0 OR l.all_time_score > 0
       ORDER BY ${orderBy}
       LIMIT $1`,
      [limit]
    );
    
    // Add ranks
    const leaderboard = result.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
    
    res.json({
      type,
      leaderboard,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    // Return empty leaderboard instead of error if database is not available
    if (error.code === '28000' || error.code === '3D000' || error.code === 'ECONNREFUSED') {
      return res.json({
        type,
        leaderboard: [],
      });
    }
    res.status(500).json({ error: error.message || 'Failed to get leaderboard' });
  }
});

// Get user stats
router.get('/user-stats', async (req, res) => {
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
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's run count
    const runCountResult = await query(
      `SELECT COUNT(*) as count FROM game_scores 
       WHERE (user_id = $1 OR session_id = $2) AND date = $3`,
      [userId, sessionId, today]
    );
    const dailyRunCount = parseInt(runCountResult.rows[0].count);
    
    // Get best scores
    const [dailyBest, weeklyBest, allTimeBest, leaderboardRank] = await Promise.all([
      query(
        `SELECT MAX(score) as score FROM game_scores 
         WHERE (user_id = $1 OR session_id = $2) AND date = $3`,
        [userId, sessionId, today]
      ),
      query(
        `SELECT MAX(score) as score FROM game_scores 
         WHERE (user_id = $1 OR session_id = $2) AND date >= $3`,
        [userId, sessionId, getWeekStart()]
      ),
      query(
        `SELECT MAX(score) as score FROM game_scores 
         WHERE user_id = $1 OR session_id = $2`,
        [userId, sessionId]
      ),
      query(
        `SELECT COUNT(*) + 1 as rank FROM leaderboards 
         WHERE daily_score > (
           SELECT COALESCE(MAX(daily_score), 0) FROM leaderboards 
           WHERE user_id = $1 OR session_id = $2
         )`,
        [userId, sessionId]
      ),
    ]);
    
    res.json({
      dailyRunCount,
      dailyBestScore: parseInt(dailyBest.rows[0].score) || 0,
      weeklyBestScore: parseInt(weeklyBest.rows[0].score) || 0,
      allTimeBestScore: parseInt(allTimeBest.rows[0].score) || 0,
      dailyRank: parseInt(leaderboardRank.rows[0].rank) || null,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user stats' });
  }
});

// Helper function to get week start (Monday)
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export default router;
