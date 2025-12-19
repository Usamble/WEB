import { Router } from 'express';
import { query } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Generate unique Snowy ID
function generateSnowyId() {
  return `SNOWY-${uuidv4().toUpperCase().replace(/-/g, '').substring(0, 16)}`;
}

// Generate rarity traits from Snowy ID
function generateRarityTraits(snowyId) {
  const hash = snowyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const backgrounds = ['Winter Forest', 'Snowy Mountain', 'Ice Cave', 'Northern Lights', 'Christmas Town'];
  const hats = ['Top Hat', 'Beanie', 'Crown', 'Santa Hat', 'Elf Cap'];
  const eyes = ['Coal', 'Diamond', 'Emerald', 'Ruby', 'Sapphire'];
  
  const background = backgrounds[hash % backgrounds.length];
  const hat = hats[(hash * 2) % hats.length];
  const eyesType = eyes[(hash * 3) % eyes.length];
  
  // Calculate rarity (0-100)
  const rarity = (hash % 100);
  let rarityTier = 'Common';
  if (rarity >= 90) rarityTier = 'Legendary';
  else if (rarity >= 70) rarityTier = 'Epic';
  else if (rarity >= 50) rarityTier = 'Rare';
  else if (rarity >= 30) rarityTier = 'Uncommon';
  
  return {
    background,
    hat,
    eyes: eyesType,
    rarity: rarityTier,
    rarityScore: rarity,
  };
}

// Save Snowy generation
router.post('/save', async (req, res) => {
  try {
    const { imageUrl, style } = req.body;
    const sessionId = req.sessionId;
    const walletAddress = req.body.walletAddress;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }
    
    // Generate Snowy ID and rarity
    const snowyId = generateSnowyId();
    const rarityTraits = generateRarityTraits(snowyId);
    
    // Get user ID if wallet is provided
    let userId = null;
    if (walletAddress) {
      const userResult = await query(
        'SELECT id FROM users WHERE wallet_address = $1',
        [walletAddress]
      );
      userId = userResult.rows[0]?.id || null;
    }
    
    // Save generation
    const result = await query(
      `INSERT INTO snowy_generations 
       (id, user_id, session_id, image_url, style, rarity_traits, snowy_id) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, sessionId, imageUrl, style || 'default', JSON.stringify(rarityTraits), snowyId]
    );
    
    res.json({
      id: result.rows[0].id,
      snowyId,
      rarityTraits,
      imageUrl,
      style: style || 'default',
    });
  } catch (error) {
    console.error('Save Snowy error:', error);
    res.status(500).json({ error: error.message || 'Failed to save Snowy' });
  }
});

// Get user's Snowy generations
router.get('/my-snowys', async (req, res) => {
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
    
    let result;
    if (userId) {
      result = await query(
        'SELECT * FROM snowy_generations WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
    } else {
      result = await query(
        'SELECT * FROM snowy_generations WHERE session_id = $1 ORDER BY created_at DESC',
        [sessionId]
      );
    }
    
    res.json(result.rows.map(row => ({
      ...row,
      rarity_traits: typeof row.rarity_traits === 'string' 
        ? JSON.parse(row.rarity_traits) 
        : row.rarity_traits,
    })));
  } catch (error) {
    console.error('Get Snowys error:', error);
    res.status(500).json({ error: error.message || 'Failed to get Snowys' });
  }
});

// Get Snowy by ID
router.get('/:snowyId', async (req, res) => {
  try {
    const { snowyId } = req.params;
    
    const result = await query(
      'SELECT * FROM snowy_generations WHERE snowy_id = $1',
      [snowyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Snowy not found' });
    }
    
    const snowy = result.rows[0];
    res.json({
      ...snowy,
      rarity_traits: typeof snowy.rarity_traits === 'string' 
        ? JSON.parse(snowy.rarity_traits) 
        : snowy.rarity_traits,
    });
  } catch (error) {
    console.error('Get Snowy error:', error);
    res.status(500).json({ error: error.message || 'Failed to get Snowy' });
  }
});

// Get gallery (public Snowys)
router.get('/gallery/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const style = req.query.style;
    const offset = (page - 1) * limit;
    
    let queryText = 'SELECT * FROM snowy_generations WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (style && style !== 'all') {
      queryText += ` AND style = $${paramIndex}`;
      params.push(style);
      paramIndex++;
    }
    
    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(queryText, params);
    
    res.json({
      snowys: result.rows.map(row => ({
        ...row,
        rarity_traits: typeof row.rarity_traits === 'string' 
          ? JSON.parse(row.rarity_traits) 
          : row.rarity_traits,
      })),
      page,
      limit,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ error: error.message || 'Failed to get gallery' });
  }
});

export default router;
