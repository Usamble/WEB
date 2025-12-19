-- Snowy Meme Coin Database Schema
-- PostgreSQL database schema for user tracking, game scores, calendar, and giveaways

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password_hash TEXT,
  wallet_address VARCHAR(255) UNIQUE,
  session_id VARCHAR(255) UNIQUE,
  nickname VARCHAR(50) UNIQUE,
  referral_code VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- User sessions (for tracking without wallet)
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  wallet_address VARCHAR(255),
  login_nonce TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE SET NULL
);

-- Snowy generations
CREATE TABLE IF NOT EXISTS snowy_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  image_url TEXT NOT NULL,
  style VARCHAR(50),
  rarity_traits JSONB,
  snowy_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game scores
CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  score INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_run_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboards (updated via triggers or scheduled jobs)
CREATE TABLE IF NOT EXISTS leaderboards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE,
  daily_score INTEGER DEFAULT 0,
  weekly_score INTEGER DEFAULT 0,
  all_time_score INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(session_id)
);

-- Advent calendar unlocks and claims
CREATE TABLE IF NOT EXISTS advent_calendar (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 24),
  unlocked BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  unlock_method VARCHAR(50),
  reward_type VARCHAR(50),
  reward_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  unlocked_at TIMESTAMP,
  claimed_at TIMESTAMP,
  UNIQUE(user_id, day),
  UNIQUE(session_id, day)
);

-- Giveaway entries
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  referral_code VARCHAR(50),
  entry_method VARCHAR(50) NOT NULL,
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referrals tracking
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referred_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_id);
-- Ensure columns exist for older databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) UNIQUE;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS login_nonce TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
-- Ensure nickname column exists for older databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_snowy_user ON snowy_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_snowy_session ON snowy_generations(session_id);
CREATE INDEX IF NOT EXISTS idx_snowy_style ON snowy_generations(style);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_date ON game_scores(user_id, date);
CREATE INDEX IF NOT EXISTS idx_game_scores_session_date ON game_scores(session_id, date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily ON leaderboards(daily_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly ON leaderboards(weekly_score DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_user_day ON advent_calendar(user_id, day);
CREATE INDEX IF NOT EXISTS idx_calendar_session_day ON advent_calendar(session_id, day);
CREATE INDEX IF NOT EXISTS idx_giveaway_user ON giveaway_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_session ON giveaway_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

