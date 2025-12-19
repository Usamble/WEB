import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';

// Generate or retrieve session ID
export const sessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for existing session in cookie or header
    let sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = uuidv4();
    }
    
    // Store session ID in request for use in routes
    (req as any).sessionId = sessionId;
    
    // Set session cookie (30 days expiry)
    res.cookie('sessionId', sessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    
    // Update or create session in database
    try {
      await query(
        `INSERT INTO user_sessions (session_id, last_active) 
         VALUES ($1, NOW()) 
         ON CONFLICT (session_id) 
         DO UPDATE SET last_active = NOW()`,
        [sessionId]
      );
    } catch (error: any) {
      // Silently ignore database errors if database isn't available
      if (error.code === '28000' || error.code === '3D000' || error.code === 'ECONNREFUSED' || error.code === '42P01') {
        // Database not available - continue without session tracking
        return;
      }
      console.warn('Session tracking error (non-critical):', error.message);
    }
    
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next();
  }
};

// Validate session exists
export const validateSession = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = (req as any).sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Session required' });
  }
  
  try {
    const result = await query(
      'SELECT * FROM user_sessions WHERE session_id = $1',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ error: 'Session validation failed' });
  }
};

// Get or create user from wallet address
export const getUserFromWallet = async (walletAddress: string) => {
  try {
    // Try to get existing user
    let result = await query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [walletAddress]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // Create new user
    const sessionId = uuidv4();
    const referralCode = generateReferralCode(walletAddress);
    
    result = await query(
      `INSERT INTO users (wallet_address, session_id, referral_code) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [walletAddress, sessionId, referralCode]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting/creating user:', error);
    throw error;
  }
};

// Generate referral code from wallet address
function generateReferralCode(walletAddress: string): string {
  // Use first 8 chars of wallet address + hash
  const hash = walletAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `SNOWY-${walletAddress.substring(0, 8).toUpperCase()}-${hash.toString(36).toUpperCase().substring(0, 4)}`;
}

