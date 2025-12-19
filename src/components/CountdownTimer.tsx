import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days, color: 'from-blue-600 to-cyan-500' },
    { label: 'HOURS', value: timeLeft.hours, color: 'from-cyan-500 to-blue-500' },
    { label: 'MINUTES', value: timeLeft.minutes, color: 'from-purple-600 to-pink-500' },
    { label: 'SECONDS', value: timeLeft.seconds, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <section className="pt-12 pb-8 px-4 relative">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaCalendarAlt className="text-blue-400 text-2xl md:text-3xl" />
            <FaClock className="text-cyan-400 text-2xl md:text-3xl" />
            <h2 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
              Countdown to Christmas
            </h2>
          </div>
          <p className="text-lg md:text-xl text-blue-200 mb-6 font-medium">
            Get ready for the most wonderful time of the year! 🎄
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {timeUnits.map((unit, index) => (
              <motion.div
                key={unit.label}
                initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                className="relative group"
              >
                <div className={`bg-gradient-to-br ${unit.color} rounded-2xl p-4 md:p-6 shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-cyan-500/50 border-2 border-white/20`}>
                  <div className="text-4xl md:text-6xl font-black text-white mb-2 drop-shadow-lg">
                    {String(unit.value).padStart(2, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-bold text-white/90 uppercase tracking-wider">
                    {unit.label}
                  </div>
                </div>
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${unit.color} blur-2xl opacity-0 group-hover:opacity-50 -z-10 transition-opacity duration-300`}></div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CountdownTimer;
