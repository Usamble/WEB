import { motion } from 'framer-motion';
import { FaSnowflake } from 'react-icons/fa';

const SNOWY_STYLES = {
  DEFAULT: 'default',
  ELF: 'elf',
  MAFIA: 'mafia',
  REINDEER: 'reindeer',
  RICH: 'rich',
  DEGENERATE: 'degenerate',
} as const;

export type SnowyStyle = typeof SNOWY_STYLES[keyof typeof SNOWY_STYLES];

// Export values for runtime use
export const SnowyStyle = SNOWY_STYLES;

interface StyleSelectorProps {
  selectedStyle: SnowyStyle;
  onStyleChange: (style: SnowyStyle) => void;
}

const STYLES: { value: SnowyStyle; label: string; emoji: string; description: string }[] = [
  { value: 'default', label: 'Classic', emoji: '⛄', description: 'Traditional snowman' },
  { value: 'elf', label: 'Snowy Elf', emoji: '🧝', description: 'Playful and festive' },
  { value: 'mafia', label: 'Snowy Mafia', emoji: '🕴️', description: 'Cool and calculated' },
  { value: 'reindeer', label: 'Snowy Reindeer', emoji: '🦌', description: 'Loyal and strong' },
  { value: 'rich', label: 'Snowy Rich', emoji: '💰', description: 'Sophisticated and successful' },
  { value: 'degenerate', label: 'Snowy Degenerate', emoji: '🎲', description: 'Wild and free' },
];

const StyleSelector = ({ selectedStyle, onStyleChange }: StyleSelectorProps) => {
  return (
    <div className="mb-6">
      <label className="block text-gray-700 font-semibold mb-3 text-sm">
        Choose Your Snowy Style:
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {STYLES.map((style) => (
          <motion.button
            key={style.value}
            onClick={() => onStyleChange(style.value)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              selectedStyle === style.value
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            <div className="text-3xl mb-2">{style.emoji}</div>
            <div className="font-bold text-gray-900 text-sm">{style.label}</div>
            <div className="text-xs text-gray-600 mt-1">{style.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
