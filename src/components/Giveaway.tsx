import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGift, FaShare, FaCopy, FaCheck } from 'react-icons/fa';
import { enterGiveaway, getGiveawayStats, getReferralCode } from '../services/giveawayApi';
import { useWallet } from '../hooks/useWallet';
import { useTokenBalance } from '../hooks/useTokenBalance';
import toast from 'react-hot-toast';

const Giveaway = () => {
  const [stats, setStats] = useState({
    entryCount: 0,
    totalWeight: 0,
    generateEntries: 0,
    holdEntries: 0,
    shareEntries: 0,
    referEntries: 0,
  });
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { walletAddress, isConnected } = useWallet();
  const { hasToken } = useTokenBalance();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsData, referralData] = await Promise.all([
          getGiveawayStats(walletAddress || undefined),
          getReferralCode(walletAddress || undefined).catch(() => null),
        ]);
        setStats(statsData);
        if (referralData) {
          setReferralCode(referralData.referralCode);
          setReferralLink(referralData.referralLink);
        }
      } catch (error) {
        console.error('Error fetching giveaway data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  const handleEnter = async (method: string) => {
    try {
      await enterGiveaway(method, undefined, walletAddress || undefined);
      toast.success(`Entered via ${method}! 🎉`);
      
      // Refresh stats
      const statsData = await getGiveawayStats(walletAddress || undefined);
      setStats(statsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to enter giveaway');
    }
  };

  const handleCopyReferral = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref && isConnected) {
      // Auto-enter via referral
      enterGiveaway('refer', ref, walletAddress || undefined).catch(console.error);
    }
  }, [isConnected, walletAddress]);

  return (
    <section id="giveaway" className="py-20 px-4 relative bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text mb-4">
            Weekly Giveaway
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter to win SNOWY tokens and exclusive rewards! Each action increases your chances.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Entry Methods */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-6 md:p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Enter Giveaway</h3>
            <div className="space-y-4">
              <motion.button
                onClick={() => handleEnter('generate')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full glass-card hover:bg-white p-4 rounded-xl text-left flex items-center justify-between border-2 border-blue-200 hover:border-blue-400"
              >
                <div>
                  <div className="font-bold text-gray-900">Generate a Snowy</div>
                  <div className="text-sm text-gray-600">Create your Snowy avatar</div>
                </div>
                <FaGift className="text-blue-600 text-2xl" />
              </motion.button>

              <motion.button
                onClick={() => handleEnter('hold')}
                disabled={!hasToken}
                whileHover={hasToken ? { scale: 1.02 } : {}}
                whileTap={hasToken ? { scale: 0.98 } : {}}
                className={`w-full glass-card p-4 rounded-xl text-left flex items-center justify-between border-2 ${
                  hasToken
                    ? 'border-green-200 hover:border-green-400 hover:bg-white'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="font-bold text-gray-900">Hold SNOWY Tokens</div>
                  <div className="text-sm text-gray-600">
                    {hasToken ? 'You hold SNOWY tokens!' : 'Connect wallet with SNOWY tokens'}
                  </div>
                </div>
                <FaGift className={`text-2xl ${hasToken ? 'text-green-600' : 'text-gray-400'}`} />
              </motion.button>

              <motion.button
                onClick={() => handleEnter('share')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full glass-card hover:bg-white p-4 rounded-xl text-left flex items-center justify-between border-2 border-blue-200 hover:border-blue-400"
              >
                <div>
                  <div className="font-bold text-gray-900">Share Snowy Content</div>
                  <div className="text-sm text-gray-600">Share on social media</div>
                </div>
                <FaShare className="text-blue-600 text-2xl" />
              </motion.button>
            </div>
          </motion.div>

          {/* Stats & Referral */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Entries</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Entries:</span>
                    <span className="text-2xl font-black text-blue-600">{stats.entryCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Entry Weight:</span>
                    <span className="text-2xl font-black text-purple-600">{stats.totalWeight}</span>
                  </div>
                  <div className="pt-4 border-t border-blue-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Generate:</span>
                      <span className="font-semibold">{stats.generateEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hold:</span>
                      <span className="font-semibold">{stats.holdEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Share:</span>
                      <span className="font-semibold">{stats.shareEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referrals:</span>
                      <span className="font-semibold">{stats.referEntries}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Referral */}
            {referralCode && (
              <div className="glass-card rounded-3xl p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Referral Link</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share this link to get bonus entries when others join!
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 p-3 bg-white border-2 border-blue-200 rounded-xl text-sm"
                  />
                  <motion.button
                    onClick={handleCopyReferral}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="gradient-button text-white px-4 py-3 rounded-xl"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                  </motion.button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                  <div className="text-xs font-mono text-gray-700 break-all">{referralCode}</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Giveaway;

