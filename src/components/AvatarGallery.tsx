import { motion } from 'framer-motion';
import { FaImage } from 'react-icons/fa';

interface AvatarGalleryProps {
  selectedAvatar: string | null;
  onAvatarSelect: (avatarUrl: string) => void;
}

// Predefined avatar URLs (these would be hosted images in production)
const AVATARS = [
  { id: 'avatar1', url: '/avatars/avatar1.png', name: 'Classic Snowman' },
  { id: 'avatar2', url: '/avatars/avatar2.png', name: 'Elf Snowman' },
  { id: 'avatar3', url: '/avatars/avatar3.png', name: 'Mafia Snowman' },
  { id: 'avatar4', url: '/avatars/avatar4.png', name: 'Reindeer Snowman' },
  { id: 'avatar5', url: '/avatars/avatar5.png', name: 'Rich Snowman' },
  { id: 'avatar6', url: '/avatars/avatar6.png', name: 'Degenerate Snowman' },
];

const AvatarGallery = ({ selectedAvatar, onAvatarSelect }: AvatarGalleryProps) => {
  return (
    <div className="mb-6">
      <label className="block text-gray-700 font-semibold mb-3 text-sm">
        Or Select a Predefined Avatar:
      </label>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {AVATARS.map((avatar) => (
          <motion.button
            key={avatar.id}
            onClick={() => onAvatarSelect(avatar.url)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`aspect-square rounded-xl border-2 overflow-hidden transition-all duration-300 ${
              selectedAvatar === avatar.url
                ? 'border-blue-500 ring-2 ring-blue-300'
                : 'border-blue-200 hover:border-blue-400'
            }`}
            title={avatar.name}
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
              <FaImage className="text-2xl text-blue-400" />
            </div>
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Click an avatar to use it as your base image
      </p>
    </div>
  );
};

export default AvatarGallery;

