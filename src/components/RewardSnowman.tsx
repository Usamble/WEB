import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaCoins } from 'react-icons/fa';
import { getTokenStats } from '../services/api';

const RewardSnowman = () => {
  const [marketCap, setMarketCap] = useState(0);
  const [targetMarketCap] = useState(1000000); // $1M target
  const [timeUntilDistribution, setTimeUntilDistribution] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isDistributionDay, setIsDistributionDay] = useState(false);

  useEffect(() => {
    const fetchMarketCap = async () => {
      try {
        const stats = await getTokenStats();
        if (stats?.marketCap) {
          // Parse market cap (remove $ and K/M suffixes)
          const capStr = stats.marketCap.replace('$', '').replace(',', '');
          let cap = parseFloat(capStr);
          if (capStr.includes('K')) {
            cap = cap * 1000;
          } else if (capStr.includes('M')) {
            cap = cap * 1000000;
          }
          setMarketCap(cap);
        }
      } catch (error) {
        console.error('Error fetching market cap:', error);
      }
    };

    fetchMarketCap();
    const interval = setInterval(fetchMarketCap, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculateTimeUntilDistribution = () => {
      const now = new Date().getTime();
      const distributionDate = new Date(new Date().getFullYear(), 11, 24, 0, 0, 0).getTime();
      
      // If distribution date has passed this year, use next year
      const target = distributionDate > now ? distributionDate : new Date(new Date().getFullYear() + 1, 11, 24, 0, 0, 0).getTime();
      
      const difference = target - now;

      if (difference > 0) {
        setTimeUntilDistribution({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
        setIsDistributionDay(false);
      } else {
        setIsDistributionDay(true);
      }
    };

    calculateTimeUntilDistribution();
    const interval = setInterval(calculateTimeUntilDistribution, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate fill percentage (based on market cap growth)
  const fillPercentage = Math.min(100, (marketCap / targetMarketCap) * 100);
  
  // Also fill based on time (if market cap doesn't reach target, still fill by Dec 24)
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 24);
  const yearProgress = ((now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())) * 100;
  const timeBasedFill = Math.min(100, Math.max(0, yearProgress));
  
  // Use the higher of the two (market cap or time-based)
  const finalFillPercentage = Math.max(fillPercentage, timeBasedFill);

  return (
    <section className="py-20 px-4 relative bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden">
      {/* Advanced background effects */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl"
        />
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
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
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <FaGift className="text-blue-600 text-4xl" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text">
              Reward Snowman
            </h2>
            <motion.div 
              className="w-1.5 h-10 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"
              animate={{ height: [40, 50, 40] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The snowman fills up as the market grows! When it reaches full or on December 24th, 
            rewards will be distributed to all SNOWY holders! 🎁
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden group"
        >
          {/* Animated background gradients */}
          <motion.div
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 bg-gradient-to-r from-blue-100/30 via-cyan-100/30 to-blue-100/30 bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
          
          <div className="relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Snowman Visual with ring */}
              <div className="flex flex-col items-center">
                <div className="relative w-64 h-64 mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-sky-50 to-blue-100 shadow-inner"></div>
                  <div
                    className="absolute inset-2 rounded-full shadow"
                    style={{
                      background: `conic-gradient(#0ea5e9 ${finalFillPercentage}%, #e5e7eb ${finalFillPercentage}% 100%)`,
                    }}
                  ></div>
                  <div className="absolute inset-6 rounded-full bg-white flex items-center justify-center shadow-md">
                    <motion.div
                      animate={{ y: [-4, 4, -4] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="text-7xl"
                    >
                      ⛄
                    </motion.div>
                  </div>
                  <motion.div
                    className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center"
                    key={Math.round(finalFillPercentage)}
                    initial={{ scale: 1.2, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="text-4xl font-black text-blue-600 mb-1 gradient-text">
                      {Math.round(finalFillPercentage)}%
                    </div>
                    <div className="text-sm text-gray-600 font-semibold">Progress to Fill</div>
                  </motion.div>
                </div>

                {/* Market Cap Info */}
                <motion.div 
                  className="text-center mt-10 bg-white/80 px-5 py-4 rounded-2xl shadow border border-blue-100"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <FaCoins className="text-blue-600" />
                    </motion.div>
                    <span className="text-sm text-gray-600 font-semibold">Current Market Cap</span>
                  </div>
                  <motion.div
                    key={marketCap}
                    initial={{ scale: 1.1, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    ${(marketCap / 1000).toFixed(0)}K
                  </motion.div>
                  <div className="text-sm text-gray-500 mt-1">
                    Target: ${(targetMarketCap / 1000000).toFixed(1)}M
                  </div>
                </motion.div>
              </div>

              {/* Right Side - Countdown and Info */}
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {isDistributionDay ? (
                    <motion.div
                      key="distribution"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-6xl mb-4"
                      >
                        🎉
                      </motion.div>
                      <h3 className="text-3xl font-black text-green-600 mb-4 gradient-text">
                        Distribution Day!
                      </h3>
                      <p className="text-lg text-gray-700 mb-6">
                        Rewards are being distributed to all SNOWY holders!
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="gradient-button text-white px-8 py-4 rounded-xl font-bold inline-block"
                      >
                        Claim Your Rewards
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="countdown"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                        Time Until Distribution
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Days', value: timeUntilDistribution.days, color: 'from-blue-500 to-blue-600' },
                          { label: 'Hours', value: timeUntilDistribution.hours, color: 'from-cyan-500 to-cyan-600' },
                          { label: 'Mins', value: timeUntilDistribution.minutes, color: 'from-blue-500 to-cyan-500' },
                          { label: 'Secs', value: timeUntilDistribution.seconds, color: 'from-cyan-500 to-blue-500' },
                        ].map((unit, index) => (
                          <motion.div
                            key={unit.label}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, type: "spring" }}
                            whileHover={{ scale: 1.1, y: -5 }}
                            className={`bg-gradient-to-br ${unit.color} rounded-xl p-4 text-center shadow-xl relative overflow-hidden group`}
                          >
                            <motion.div
                              key={unit.value}
                              initial={{ scale: 1.3, opacity: 0.5 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="text-3xl font-black text-white mb-1 relative z-10"
                            >
                              {String(unit.value).padStart(2, '0')}
                            </motion.div>
                            <div className="text-xs text-white/90 font-semibold uppercase relative z-10">
                              {unit.label}
                            </div>
                            {/* Shimmer effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="glass-card rounded-xl p-6 border-2 border-blue-200 relative overflow-hidden group"
                >
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/30 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <FaGift className="text-blue-600" />
                    </motion.div>
                    How It Works
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-600 relative z-10">
                    {[
                      `Snowman fills as market cap grows toward ${(targetMarketCap / 1000000).toFixed(1)}M`,
                      'Or automatically fills by December 24th',
                      'Rewards distributed to all SNOWY token holders',
                      'Hold SNOWY tokens to be eligible!',
                    ].map((text, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                          className="text-blue-600 font-bold text-lg"
                        >
                          •
                        </motion.span>
                        <span>{text}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RewardSnowman;
