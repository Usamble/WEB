import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');
const LOCAL_SCORES_KEY = 'snowyLocalScores';
const LOCAL_PLAYER_KEY = 'snowyLocalPlayerId';

type LocalScore = {
  playerId: string;
  walletAddress?: string;
  score: number;
  timestamp: number;
};

type LeaderboardEntry = {
  rank: number;
  wallet_address?: string;
  nickname?: string;
  daily_score: number;
  weekly_score: number;
  all_time_score: number;
};

const getLocalPlayerId = () => {
  if (typeof localStorage === 'undefined') return 'local-guest';
  const existing = localStorage.getItem(LOCAL_PLAYER_KEY);
  if (existing) return existing;
  const id = crypto?.randomUUID?.() || `guest-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(LOCAL_PLAYER_KEY, id);
  return id;
};

const readLocalScores = (): LocalScore[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeLocalScores = (scores: LocalScore[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores.slice(0, 200)));
};

const isSameDay = (ts: number) => {
  const a = new Date(ts);
  const b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const isWithinDays = (ts: number, days: number) => {
  const diff = Date.now() - ts;
  return diff <= days * 24 * 60 * 60 * 1000;
};

const fallbackSubmitScore = (score: number, walletAddress?: string) => {
  const playerId = walletAddress || getLocalPlayerId();
  const now = Date.now();
  const scores = readLocalScores();
  scores.unshift({ playerId, walletAddress, score, timestamp: now });
  writeLocalScores(scores);
  const dailyRunCount = scores.filter((s) => s.playerId === playerId && isSameDay(s.timestamp)).length;
  return {
    id: `local-${playerId}-${now}`,
    score,
    dailyRunCount,
    date: new Date(now).toISOString().split('T')[0],
  };
};

const computeLocalLeaderboard = (type: 'daily' | 'weekly' | 'alltime', limit: number): LeaderboardEntry[] => {
  const scores = readLocalScores();
  const cutoffFn =
    type === 'daily'
      ? isSameDay
      : type === 'weekly'
        ? (ts: number) => isWithinDays(ts, 7)
        : () => true;

  const grouped = new Map<string, { wallet?: string; best: number }>();
  for (const entry of scores) {
    if (!cutoffFn(entry.timestamp)) continue;
    const key = entry.walletAddress || entry.playerId;
    const current = grouped.get(key);
    const best = current ? Math.max(current.best, entry.score) : entry.score;
    grouped.set(key, { wallet: entry.walletAddress, best });
  }

  const leaderboard = Array.from(grouped.values())
    .sort((a, b) => b.best - a.best)
    .slice(0, limit)
    .map((row, idx) => ({
      rank: idx + 1,
      wallet_address: row.wallet,
      nickname: undefined,
      daily_score: type === 'daily' ? row.best : 0,
      weekly_score: type === 'weekly' ? row.best : 0,
      all_time_score: type === 'alltime' ? row.best : 0,
    }));

  return leaderboard;
};

const fallbackGetUserStats = (walletAddress?: string) => {
  const playerId = walletAddress || getLocalPlayerId();
  const scores = readLocalScores().filter((s) =>
    walletAddress ? s.walletAddress === walletAddress : (s.walletAddress || s.playerId) === playerId
  );
  const todayScores = scores.filter((s) => isSameDay(s.timestamp));
  const weeklyScores = scores.filter((s) => isWithinDays(s.timestamp, 7));
  return {
    dailyRunCount: todayScores.length,
    dailyBestScore: todayScores.reduce((m, s) => Math.max(m, s.score), 0),
    weeklyBestScore: weeklyScores.reduce((m, s) => Math.max(m, s.score), 0),
    allTimeBestScore: scores.reduce((m, s) => Math.max(m, s.score), 0),
    dailyRank: null,
  };
};

// Submit game score
export const submitScore = async (score: number, walletAddress?: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/game/submit-score`,
      {
        score,
        walletAddress,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Submit score error:', error);
    // Local fallback so the game keeps working without backend
    return fallbackSubmitScore(score, walletAddress);
  }
};

// Get leaderboard
export const getLeaderboard = async (type: 'daily' | 'weekly' | 'alltime' = 'daily', limit: number = 100) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/game/leaderboard`, {
      params: { type, limit },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    return {
      type,
      leaderboard: computeLocalLeaderboard(type, limit),
      source: 'local',
    };
  }
};

// Get user stats
export const getUserStats = async (walletAddress?: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/game/user-stats`, {
      params: { walletAddress },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Get user stats error:', error);
    return fallbackGetUserStats(walletAddress);
  }
};
