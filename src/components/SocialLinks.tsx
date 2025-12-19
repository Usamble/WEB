import { motion } from 'framer-motion';
import { FaGift } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const SocialLinks = () => {
  const socialPlatforms: Array<{
    icon: any;
    title: string;
    description: string;
    buttonText: string;
    link: string;
    color: string;
    gradient: string;
    subLink?: string;
    subText?: string;
  }> = [
    {
      icon: FaXTwitter,
      title: 'X Community',
      description: 'Join the SNOWY community on X for news, memes, and daily drops',
      buttonText: 'Open X Community',
      link: 'https://x.com/i/communities/2002028191779901718',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600',
    },
  ];

  return (
    <section className="py-20 px-4 relative bg-gradient-to-b from-blue-50/50 via-white to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Join Community Section */}
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
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text">
              Join the SNOWY Community
            </h2>
            <motion.div 
              className="w-1.5 h-10 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"
              animate={{ height: [40, 50, 40] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </div>
          <p className="text-xl text-gray-600 font-medium">
            Connect with thousands of festive crypto enthusiasts
          </p>
        </motion.div>

        {/* Social Cards */}
        <div className="flex justify-center mb-12">
          {socialPlatforms.map((platform, index) => (
            <motion.div
              key={platform.title}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              whileHover={{ 
                scale: 1.05, 
                y: -8,
                transition: { duration: 0.2 }
              }}
              className="glass-card rounded-3xl p-6 hover:border-blue-400 relative overflow-hidden group w-full max-w-xl"
            >
              {/* Hover gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <platform.icon className={`text-5xl mb-4 ${platform.color}`} />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{platform.title}</h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">{platform.description}</p>
                <motion.a
                  href={platform.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`gradient-button text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center gap-2 w-full justify-center`}
                >
                  {platform.buttonText}
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ↗
                  </motion.span>
                </motion.a>
                {platform.subLink && (
                  <motion.a
                    href={platform.subLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03, x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-3 inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl border border-blue-200 bg-white text-blue-700 font-semibold text-sm shadow-sm"
                  >
                    {platform.subText || 'Community link'}
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                      ↗
                    </motion.span>
                  </motion.a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Spread the Winter Cheer Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card rounded-3xl p-12 text-center relative overflow-hidden border-2 border-blue-200 group"
          >
            {/* Animated background gradient */}
            <motion.div
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-cyan-100/50 to-blue-100/50 bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <FaGift className="text-6xl mx-auto mb-6 text-blue-600" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-900 gradient-text">
                Spread the Winter Cheer!
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-700 leading-relaxed">
                Share your snowman-ified profile picture on social media and tag us. 
                Let's make this holiday season unforgettable!
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['#SNOWYToken', '#SnowmanCoin', '#CryptoWinter'].map((hashtag, index) => (
                  <motion.span
                    key={hashtag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.1, 
                      y: -3,
                      rotate: [0, -5, 5, 0]
                    }}
                    className="glass-card hover:border-blue-400 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all duration-200 text-blue-600 border-2 border-blue-200 shadow-sm"
                  >
                    {hashtag}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialLinks;
