import { motion } from 'framer-motion';
import { FaGem, FaCrown, FaStar } from 'react-icons/fa';

interface RarityTraits {
  background: string;
  hat: string;
  eyes: string;
  rarity: string;
  rarityScore: number;
}

interface RarityDisplayProps {
  rarityTraits: RarityTraits | null;
  snowyId: string | null;
}

const RARITY_COLORS: { [key: string]: string } = {
  Legendary: 'from-yellow-400 to-orange-500',
  Epic: 'from-purple-400 to-pink-500',
  Rare: 'from-blue-400 to-cyan-500',
  Uncommon: 'from-green-400 to-emerald-500',
  Common: 'from-gray-400 to-gray-500',
};

const RARITY_ICONS: { [key: string]: any } = {
  Legendary: FaCrown,
  Epic: FaGem,
  Rare: FaStar,
  Uncommon: FaStar,
  Common: FaStar,
};

const RarityDisplay = ({ rarityTraits, snowyId }: RarityDisplayProps) => {
  if (!rarityTraits || !snowyId) return null;

  const Icon = RARITY_ICONS[rarityTraits.rarity] || FaStar;
  const gradientClass = RARITY_COLORS[rarityTraits.rarity] || RARITY_COLORS.Common;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`text-2xl bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`} />
        <h4 className="font-bold text-gray-900">Rarity: {rarityTraits.rarity}</h4>
        <span className="text-sm text-gray-600">({rarityTraits.rarityScore}/100)</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Background:</span>
          <span className="font-semibold text-gray-900">{rarityTraits.background}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Hat:</span>
          <span className="font-semibold text-gray-900">{rarityTraits.hat}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Eyes:</span>
          <span className="font-semibold text-gray-900">{rarityTraits.eyes}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Snowy ID:</span>
          <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-blue-200">
            {snowyId}
          </code>
        </div>
      </div>
    </motion.div>
  );
};

export default RarityDisplay;

