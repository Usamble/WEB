import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaUnlock, FaGift, FaCheck } from 'react-icons/fa';
import { getCalendarStatus, unlockCalendarDay, claimCalendarReward } from '../services/calendarApi';
import { useWallet } from '../hooks/useWallet';
import toast from 'react-hot-toast';

interface CalendarEntry {
  day: number;
  unlocked: boolean;
  claimed: boolean;
  unlockMethod?: string;
  rewardType?: string;
  rewardData?: any;
}

const AdventCalendar = () => {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [canUnlockToday, setCanUnlockToday] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { walletAddress } = useWallet();

  useEffect(() => {
    const fetchCalendar = async () => {
      setIsLoading(true);
      try {
        const data = await getCalendarStatus(walletAddress || undefined);
        setEntries(data.entries || []);
        setCurrentDay(data.currentDay || 1);
        setCanUnlockToday(data.canUnlockToday || false);
      } catch (error) {
        console.error('Error fetching calendar:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendar();
  }, [walletAddress]);

  const handleUnlock = async (day: number) => {
    if (day > currentDay) {
      toast.error('Cannot unlock future days');
      return;
    }

    if (day < currentDay) {
      toast.error('Day has already passed');
      return;
    }

    try {
      const result = await unlockCalendarDay(day, walletAddress || undefined);
      toast.success(`Day ${day} unlocked! 🎉`);
      
      // Refresh calendar
      const data = await getCalendarStatus(walletAddress || undefined);
      setEntries(data.entries || []);
      setCanUnlockToday(data.canUnlockToday || false);
      setSelectedDay(day);
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlock day');
    }
  };

  const handleClaim = async (day: number) => {
    try {
      const result = await claimCalendarReward(day, walletAddress || undefined);
      toast.success(`Reward claimed! 🎁`);
      
      // Refresh calendar
      const data = await getCalendarStatus(walletAddress || undefined);
      setEntries(data.entries || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim reward');
    }
  };

  const getEntry = (day: number): CalendarEntry | undefined => {
    return entries.find((e) => e.day === day);
  };

  const getDayState = (day: number): 'locked' | 'unlockable' | 'unlocked' | 'claimed' => {
    if (day > currentDay) return 'locked';
    if (day < currentDay) {
      const entry = getEntry(day);
      if (entry?.claimed) return 'claimed';
      if (entry?.unlocked) return 'unlocked';
      return 'locked';
    }
    // Current day
    const entry = getEntry(day);
    if (entry?.claimed) return 'claimed';
    if (entry?.unlocked) return 'unlocked';
    return canUnlockToday ? 'unlockable' : 'locked';
  };

  const getRewardEmoji = (rewardType?: string) => {
    const emojis: { [key: string]: string } = {
      tokens: '🪙',
      nft_art: '🎨',
      whitelist: '✨',
      collectible: '🎁',
      meme_pack: '📦',
    };
    return emojis[rewardType || ''] || '🎁';
  };

  return (
    <section id="advent-calendar" className="py-20 px-4 relative bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text mb-4">
            Snowy Advent Calendar
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock rewards from December 20th to 24th! Generate a Snowy, play the game, or hold tokens to unlock.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {[20, 21, 22, 23, 24].map((day) => {
                const state = getDayState(day);
                const entry = getEntry(day);
                const isSelected = selectedDay === day;

                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: day * 0.02 }}
                    className="aspect-square"
                  >
                    <motion.button
                      onClick={() => {
                        if (state === 'unlockable') {
                          handleUnlock(day);
                        } else if (state === 'unlocked' && !entry?.claimed) {
                          handleClaim(day);
                        } else {
                          setSelectedDay(isSelected ? null : day);
                        }
                      }}
                      disabled={state === 'locked'}
                      whileHover={state !== 'locked' ? { scale: 1.05, y: -5 } : {}}
                      whileTap={state !== 'locked' ? { scale: 0.95 } : {}}
                      className={`w-full h-full rounded-xl border-2 transition-all relative overflow-hidden ${
                        state === 'locked'
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                          : state === 'unlockable'
                          ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 hover:border-yellow-500 shadow-lg'
                          : state === 'unlocked'
                          ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 hover:border-blue-500'
                          : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-400'
                      }`}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <div className="text-2xl font-black text-gray-900 mb-1">{day}</div>
                        {state === 'locked' && (
                          <FaLock className="text-gray-400 text-xl" />
                        )}
                        {state === 'unlockable' && (
                          <>
                            <FaUnlock className="text-yellow-600 text-xl mb-1" />
                            <div className="text-xs font-bold text-yellow-700">Click to Unlock!</div>
                          </>
                        )}
                        {state === 'unlocked' && !entry?.claimed && (
                          <>
                            <FaGift className="text-blue-600 text-2xl mb-1" />
                            <div className="text-xs font-bold text-blue-700">Click to Claim!</div>
                          </>
                        )}
                        {state === 'claimed' && (
                          <>
                            <FaCheck className="text-green-600 text-xl mb-1" />
                            <div className="text-xs font-bold text-green-700">Claimed!</div>
                          </>
                        )}
                        {entry?.rewardType && (
                          <div className="text-2xl mt-1">{getRewardEmoji(entry.rewardType)}</div>
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Day Info */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Day {selectedDay}</h3>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  {(() => {
                    const entry = getEntry(selectedDay);
                    const state = getDayState(selectedDay);
                    if (state === 'locked') {
                      return (
                        <div>
                          <p className="text-gray-600 mb-4">
                            This day is locked. Unlock it by:
                          </p>
                          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                            <li>Generating a Snowy avatar</li>
                            <li>Playing Snowy Run game</li>
                            <li>Holding SNOWY tokens</li>
                            <li>Sharing Snowy content</li>
                          </ul>
                        </div>
                      );
                    }
                    if (entry) {
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-3xl">{getRewardEmoji(entry.rewardType)}</span>
                            <div>
                              <div className="font-bold text-gray-900 capitalize">
                                {entry.rewardType?.replace('_', ' ')}
                              </div>
                              {entry.rewardData && (
                                <div className="text-sm text-gray-600">
                                  {entry.rewardData.description}
                                </div>
                              )}
                            </div>
                          </div>
                          {entry.unlocked && !entry.claimed && (
                            <motion.button
                              onClick={() => handleClaim(selectedDay)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="gradient-button text-white font-bold px-6 py-2 rounded-xl"
                            >
                              Claim Reward
                            </motion.button>
                          )}
                          {entry.claimed && (
                            <div className="text-green-600 font-bold">✓ Reward Claimed</div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdventCalendar;
