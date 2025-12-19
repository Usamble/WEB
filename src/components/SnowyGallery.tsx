import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaShare, FaFilter } from 'react-icons/fa';
import { getMySnowys } from '../services/snowyApi';
import { useWallet } from '../hooks/useWallet';
import toast from 'react-hot-toast';

interface SnowyItem {
  id: string;
  snowy_id: string;
  image_url: string;
  style: string;
  rarity_traits: any;
  created_at: string;
}

const SnowyGallery = () => {
  const [snowys, setSnowys] = useState<SnowyItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { walletAddress } = useWallet();

  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      try {
        const data = await getMySnowys(walletAddress || undefined);
        setSnowys(data || []);
      } catch (error) {
        console.error('Error fetching gallery:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, [walletAddress]);

  const filteredSnowys = filter === 'all' 
    ? snowys 
    : snowys.filter(s => s.style === filter);

  const handleShare = (snowy: SnowyItem) => {
    const text = `Check out my SNOWY avatar! #SNOWYToken #SnowmanCoin`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin + '/snowy/' + snowy.snowy_id)}`;
    window.open(url, '_blank');
    toast.success('Share link opened!');
  };

  const styles = ['all', 'default', 'elf', 'mafia', 'reindeer', 'rich', 'degenerate'];

  return (
    <section id="gallery" className="py-20 px-4 relative bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text mb-4">
            Snowy Gallery
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse user-generated Snowy avatars from the community!
          </p>
        </motion.div>

        {/* Filter */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {styles.map((style) => (
            <motion.button
              key={style}
              onClick={() => setFilter(style)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filter === style
                  ? 'gradient-button text-white'
                  : 'glass-card text-gray-700 hover:bg-white'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading gallery...</p>
          </div>
        ) : filteredSnowys.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            No Snowys found. Be the first to generate one!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSnowys.map((snowy, index) => (
              <motion.div
                key={snowy.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl overflow-hidden group relative"
              >
                <div className="aspect-square relative">
                  <img
                    src={snowy.image_url}
                    alt={`Snowy ${snowy.snowy_id}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <motion.button
                      onClick={() => handleShare(snowy)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-white text-blue-600 p-3 rounded-full"
                    >
                      <FaShare />
                    </motion.button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs font-mono text-gray-600 mb-1">
                    {snowy.snowy_id.substring(0, 12)}...
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 capitalize">
                      {snowy.style}
                    </span>
                    {snowy.rarity_traits && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        snowy.rarity_traits.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-700' :
                        snowy.rarity_traits.rarity === 'Epic' ? 'bg-purple-100 text-purple-700' :
                        snowy.rarity_traits.rarity === 'Rare' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {snowy.rarity_traits.rarity}
                      </span>
                    )}
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

export default SnowyGallery;

