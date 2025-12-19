import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaDollarSign, 
  FaLink, 
  FaChartLine, 
  FaChartBar, 
  FaTint, 
  FaLayerGroup,
  FaSync,
  FaPlus,
  FaMinus
} from 'react-icons/fa';
import { getTokenStats } from '../services/api';

interface TokenStats {
  priceUSD: string;
  priceSOL: string;
  change24h: string;
  liquidity: string;
  marketCap: string;
  volume24h: string;
  transactions: string;
  buys: string;
  sells: string;
  fdv: string;
}

const LiveStats = () => {
  const [stats, setStats] = useState<TokenStats>({
    priceUSD: '$0.000000',
    priceSOL: '0.000000 SOL',
    change24h: '0.00%',
    liquidity: '$0',
    marketCap: '$0',
    volume24h: '$0',
    transactions: '0',
    buys: '0',
    sells: '0',
    fdv: '$0',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      setError(null);
      const data = await getTokenStats();
      if (data) {
        setStats(data);
        setLastUpdate(new Date());
      } else {
        setError('Unable to fetch stats. Using cached data.');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch latest stats. Showing cached data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(false), 10000); // Auto-refresh every 10s

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPositive = parseFloat(stats.change24h.replace('%', '').replace('+', '')) >= 0;

  const statCards = [
    { icon: FaDollarSign, label: 'Price USD', value: stats.priceUSD, color: 'text-blue-600', bgGradient: 'from-blue-500 to-blue-600' },
    { icon: FaLink, label: 'Price SOL', value: stats.priceSOL, color: 'text-blue-600', bgGradient: 'from-blue-500 to-blue-600' },
    { 
      icon: FaChartLine, 
      label: '24h Change', 
      value: stats.change24h, 
      color: isPositive ? 'text-green-600' : 'text-red-600',
      bgGradient: isPositive ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
    },
    { icon: FaTint, label: 'Liquidity', value: stats.liquidity, color: 'text-cyan-600', bgGradient: 'from-cyan-500 to-cyan-600' },
    { icon: FaLayerGroup, label: 'Market Cap', value: stats.marketCap, color: 'text-blue-600', bgGradient: 'from-blue-500 to-blue-600' },
    { icon: FaSync, label: '24h Volume', value: stats.volume24h, color: 'text-cyan-600', bgGradient: 'from-cyan-500 to-cyan-600' },
    { icon: FaPlus, label: 'Transactions', value: stats.transactions, color: 'text-blue-600', bgGradient: 'from-blue-500 to-blue-600' },
    { icon: FaPlus, label: 'Buys', value: stats.buys, color: 'text-green-600', bgGradient: 'from-green-500 to-green-600' },
    { icon: FaMinus, label: 'Sells', value: stats.sells, color: 'text-red-600', bgGradient: 'from-red-500 to-red-600' },
    { icon: FaDollarSign, label: 'FDV', value: stats.fdv, color: 'text-cyan-600', bgGradient: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <section className="py-20 px-4 relative bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div 
              className="w-1.5 h-10 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"
              animate={{ height: [40, 50, 40] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ duration: 0.5 }}
            >
              <FaChartBar className="text-blue-600 text-4xl" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text">
              Live Token Stats
            </h2>
            <motion.div 
              className="w-1.5 h-10 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"
              animate={{ height: [40, 50, 40] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <p className="text-lg text-gray-600 font-medium">
              Real-time data from DexScreener
            </p>
            <motion.button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors disabled:opacity-50"
              title="Refresh stats"
            >
              <FaSync className={`text-xl ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            {lastUpdate && (
              <p className="text-sm text-gray-500">
                Updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"
            ></motion.div>
            <p className="mt-4 text-gray-600 font-medium">Loading stats...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="glass-card rounded-2xl p-5 hover:border-blue-400 group cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring" }}
                  >
                    <stat.icon className={`text-2xl mb-3 ${stat.color}`} />
                  </motion.div>
                  <motion.div
                    key={stat.value}
                    initial={{ scale: 1.2, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-bold text-gray-900 mb-1 font-mono"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LiveStats;
