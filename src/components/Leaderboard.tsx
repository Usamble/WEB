import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaAward } from 'react-icons/fa';
import { getLeaderboard } from '../services/gameApi';
import { useWallet } from '../hooks/useWallet';
import { saveProfile } from '../services/profileApi';

interface LeaderboardEntry {
  rank: number;
  wallet_address?: string;
  nickname?: string;
  daily_score: number;
  weekly_score: number;
  all_time_score: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [type, setType] = useState<'daily' | 'weekly' | 'alltime'>('daily');
  const [source, setSource] = useState<'live' | 'local'>('live');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { walletAddress } = useWallet();

  useEffect(() => {
    if (walletAddress) {
      setWalletInput(walletAddress);
    }
  }, [walletAddress]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getLeaderboard(type);
        setLeaderboard(data.leaderboard || []);
        setSource(data.source === 'local' ? 'local' : 'live');
      } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        setError(error?.message || 'Failed to load leaderboard. Make sure backend is running.');
        setLeaderboard([]);
        setSource('local');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [type]);

  const getScore = (entry: LeaderboardEntry) => {
    switch (type) {
      case 'daily':
        return entry.daily_score;
      case 'weekly':
        return entry.weekly_score;
      case 'alltime':
        return entry.all_time_score;
      default:
        return 0;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <FaTrophy className="text-yellow-500" />;
    if (rank === 2) return <FaMedal className="text-gray-400" />;
    if (rank === 3) return <FaAward className="text-orange-500" />;
    return null;
  };

  const formatAddress = (address?: string) => {
    if (!address) return 'Anonymous';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  const displayName = (entry: LeaderboardEntry) => {
    if (entry.nickname) return entry.nickname;
    return formatAddress(entry.wallet_address);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    try {
      setSaving(true);
      await saveProfile(nickname.trim(), walletInput.trim());
      setSaveMessage('Profile saved! Leaderboard will show your nickname.');
      // Refresh leaderboard to display nickname
      const data = await getLeaderboard(type);
      setLeaderboard(data.leaderboard || []);
      setSource(data.source === 'local' ? 'local' : 'live');
    } catch (error: any) {
      setSaveMessage(error?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="leaderboard" className="py-20 px-4 relative bg-white overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text mb-4">
            Leaderboard
          </h2>
          <p className="text-lg text-gray-600">
            Top players in Snowy Run!
          </p>
        </motion.div>

        {/* Type Selector */}
        <div className="flex gap-2 mb-6 justify-center">
          {(['daily', 'weekly', 'alltime'] as const).map((t) => (
            <motion.button
              key={t}
              onClick={() => setType(t)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                type === t
                  ? 'gradient-button text-white'
                  : 'glass-card text-gray-700 hover:bg-white'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Profile Save */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Set nickname + wallet</h3>
          <p className="text-sm text-gray-600 mb-4">Leaderboard will show your nickname and wallet.</p>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSaveProfile}>
            <input
              type="text"
              placeholder="Nickname (3-24 chars)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 bg-white"
              required
              minLength={3}
              maxLength={24}
            />
            <input
              type="text"
              placeholder="Wallet address"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 bg-white"
              required
            />
            <div className="md:col-span-2 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={saving}
                className="gradient-button text-white font-bold px-5 py-3 rounded-lg disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </motion.button>
              {saveMessage && <span className="text-sm text-gray-700">{saveMessage}</span>}
            </div>
          </form>
        </div>

        {/* Current player summary */}
        {walletAddress && (
          <div className="glass-card rounded-3xl p-4 mb-6 border border-blue-100">
            {(() => {
              const currentEntry = leaderboard.find((e) => e.wallet_address === walletAddress);
              const score = currentEntry ? getScore(currentEntry) : 0;
              const rank = currentEntry?.rank ?? '–';
              return (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Your wallet</div>
                    <div className="text-sm font-bold text-gray-900">{formatAddress(walletAddress)}</div>
                    {currentEntry?.nickname && (
                      <div className="text-xs text-blue-700 font-semibold">Nickname: {currentEntry.nickname}</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Current score</div>
                    <div className="text-2xl font-black text-blue-600">{score.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Rank</div>
                    <div className="text-xl font-black text-gray-900">{rank}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Leaderboard List */}
        <div className="glass-card rounded-3xl p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading leaderboard...</p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-semibold mb-2">Error loading leaderboard</p>
              <p className="text-sm text-gray-600">{error}</p>
              <p className="text-xs text-gray-500 mt-4">
                Make sure the backend server is running on port 3001
              </p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No scores yet. Be the first to play!
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.wallet_address === walletAddress;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isCurrentUser
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300'
                        : 'bg-white hover:bg-blue-50/50 border border-blue-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[60px]">
                      {getRankIcon(entry.rank) || (
                        <span className="text-2xl font-black text-gray-400 w-8 text-center">
                          {entry.rank}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">
                        {displayName(entry)}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                      {entry.wallet_address && (
                        <div className="text-xs text-gray-500">{formatAddress(entry.wallet_address)}</div>
                      )}
                    </div>
                    <div className="text-2xl font-black text-blue-600">
                      {getScore(entry).toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Prize Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 glass-card rounded-xl p-6 text-center"
        >
          <h3 className="font-bold text-gray-900 mb-2">Prizes</h3>
          <p className="text-sm text-gray-600">
            Top players on weekly leaderboard may receive SNOWY token rewards! 🎁
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Leaderboard;
