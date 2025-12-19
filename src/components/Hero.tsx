import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaShoppingCart, FaSnowflake, FaWallet } from 'react-icons/fa';
import { useWallet } from '../hooks/useWallet';

const Hero = () => {
  const PUMPFUN_URL = import.meta.env.VITE_PUMPFUN_URL || 'https://pump.fun';
  const { isConnected, walletAddress, isAuthenticating, connectWallet, disconnectWallet } = useWallet();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const christmas = new Date(new Date().getFullYear(), 11, 25, 0, 0, 0).getTime();
      const target = christmas > now ? christmas : new Date(new Date().getFullYear() + 1, 11, 25, 0, 0, 0).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden bg-gradient-to-br from-[#c7ebff] via-white to-[#fff7ed]">
      {/* Advanced background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-sky-300/25 rounded-full blur-3xl morphing-blob"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl morphing-blob"
        />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute inset-x-[-10%] top-16 h-32 bg-gradient-to-r from-transparent via-amber-100/50 to-transparent blur-3xl opacity-70" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 180 }}
        className="absolute top-8 right-8 z-20"
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: 1 }}
          className="glass-card rounded-3xl p-5 shadow-2xl pulse-glow border border-blue-200"
        >
          <div className="text-sm font-black text-blue-600 mb-3 text-center uppercase tracking-[0.2em]">
            🎄 Christmas
          </div>
          <div className="flex gap-3">
            {[
              { label: 'D', value: timeLeft.days },
              { label: 'H', value: timeLeft.hours },
              { label: 'M', value: timeLeft.minutes },
              { label: 'S', value: timeLeft.seconds },
            ].map((unit) => (
              <motion.div
                key={unit.label}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <motion.div
                  key={unit.value}
                  initial={{ scale: 1.15, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl px-3.5 py-2 min-w-[46px] shadow-lg"
                >
                  <div className="text-base font-black text-white leading-tight">
                    {String(unit.value).padStart(2, '0')}
                  </div>
                </motion.div>
                <div className="text-[10px] text-gray-600 mt-1 font-semibold uppercase">
                  {unit.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8"
            >
              {/* Badge with animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="inline-block mb-6"
              >
                <span className="text-xs font-black text-white bg-gradient-to-r from-rose-500 via-amber-400 to-sky-400 px-4 py-2 rounded-full border border-white/40 shadow-lg shadow-rose-200/40">
                  MEME COIN
                </span>
              </motion.div>

              {/* Animated title */}
              <h1 className="text-7xl md:text-[140px] font-black mb-6 leading-[0.9] tracking-tight">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-400 to-sky-500 animate-[gradient_3s_ease_infinite] bg-[length:220%_auto]">
                  SNOWY
                </span>
              </h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <p className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
                  Meme coin with a live arcade game
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              {!isConnected ? (
                <motion.button
                  onClick={connectWallet}
                  disabled={isAuthenticating}
                  whileHover={{ scale: isAuthenticating ? 1 : 1.05 }}
                  whileTap={{ scale: isAuthenticating ? 1 : 0.95 }}
                  className="gradient-button text-white font-bold px-10 py-5 rounded-xl text-lg flex items-center justify-center gap-3 relative group disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Signing...</span>
                    </>
                  ) : (
                    <>
                      <FaWallet className="text-xl relative z-10" />
                      <span className="relative z-10">Connect/Sign in with wallet</span>
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  onClick={disconnectWallet}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-card hover:bg-white text-gray-900 px-10 py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 border-2 border-green-200 hover:border-green-400"
                  title={walletAddress || ''}
                >
                  <FaWallet className="text-xl" />
                  <span className="truncate max-w-[200px]">
                    {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connected'}
                  </span>
                </motion.button>
              )}
              <motion.a
                href={PUMPFUN_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="gradient-button text-white font-bold px-10 py-5 rounded-xl text-lg flex items-center justify-center gap-3 relative group"
              >
                <FaShoppingCart className="text-xl relative z-10" />
                <span className="relative z-10">Buy SNOWY</span>
              </motion.a>
              <div className="relative">
                <span className="absolute -top-4 -right-2 z-20 bg-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg shadow-amber-200">
                  Coming soon
                </span>
                <div
                  className="glass-card text-gray-400 px-10 py-5 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 border-2 border-amber-200 bg-white/80"
                  style={{ cursor: 'not-allowed' }}
                  aria-disabled="true"
                  title="Coming soon"
                >
                  <FaSnowflake className="text-xl text-blue-400" />
                  <span>Snowy-ify Your Pic</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Snowman with advanced effects */}
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            style={{ y, opacity }}
            className="lg:col-span-5 flex justify-center items-center relative"
          >
            <div className="relative w-full max-w-[32rem]">
              <div className="absolute -left-10 -top-12 w-52 h-52 bg-gradient-to-br from-sky-200/70 via-white/50 to-amber-200/70 blur-3xl rounded-full" />
              <div className="absolute -right-12 -bottom-16 w-60 h-60 bg-gradient-to-br from-rose-200/60 via-white/40 to-sky-200/60 blur-3xl rounded-full" />
              <div className="absolute inset-0 rounded-[36px] border border-white/40 bg-white/30 shadow-[0_24px_80px_rgba(59,130,246,0.25)]" />

              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                className="relative bg-white/90 rounded-[32px] border border-white/70 shadow-2xl backdrop-blur-xl p-4 md:p-6 overflow-hidden"
              >
                <div className="absolute left-6 top-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-sky-100 text-xs font-bold text-sky-700 shadow-sm">
                  <FaSnowflake className="text-sky-500" />
                  Fresh drop
                </div>
                <div className="absolute right-6 bottom-6 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 text-white text-xs font-black shadow-lg shadow-rose-200/50">
                  Meme-ready
                </div>
                <div className="absolute inset-x-8 -top-12 h-32 bg-gradient-to-b from-amber-100/50 via-transparent to-transparent rotate-[-2deg]" />
                <div className="absolute inset-4 rounded-[28px] bg-gradient-to-br from-white/80 via-white/60 to-white/30" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_45%,rgba(14,165,233,0.15),transparent_65%)]" />
                <motion.img
                  src="/images/hero/snowy-pepe-bg.png"
                  alt="Snowy meme snowman with red beanie and striped scarf on soft vignette background"
                  className="relative z-10 w-full max-h-[26rem] object-contain mx-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.25)]"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 220 }}
                />
              </motion.div>

              {/* Floating snowflakes with better animation */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: 360,
                    scale: [1, 1.4, 1],
                    opacity: [0.3, 0.8, 0.3],
                    y: [0, -18, 0],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.3,
                  }}
                  className="absolute text-3xl text-sky-400/80"
                  style={{
                    top: `${12 + i * 12}%`,
                    left: `${i % 2 === 0 ? '-6%' : '106%'}`,
                  }}
                >
                  ❄
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
