import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { FaUpload, FaDownload, FaTimes } from 'react-icons/fa';
import { FaWandMagicSparkles, FaXTwitter } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { generateSnowmanAvatar } from '../services/aiGeneration';
import { saveSnowyGeneration } from '../services/snowyApi';
import { useWallet } from '../hooks/useWallet';
import { useTokenBalance } from '../hooks/useTokenBalance';
import StyleSelector, { SnowyStyle, type SnowyStyle as SnowyStyleType } from './StyleSelector';
import AvatarGallery from './AvatarGallery';
import RarityDisplay from './RarityDisplay';
import TokenGate from './TokenGate';

const Snowyify = () => {
  const MAX_GENERATIONS_PER_DAY = 5;
  const generationKey = 'snowyify-generation-usage';

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<SnowyStyleType>(SnowyStyle.DEFAULT);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [snowyId, setSnowyId] = useState<string | null>(null);
  const [rarityTraits, setRarityTraits] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasWatermark, setHasWatermark] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConnected, walletAddress } = useWallet();
  const { hasToken } = useTokenBalance();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      toast.error('Please upload a PNG or JPG image');
    }
  };

  const handleGenerate = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(generationKey) : null;
      const parsed = stored ? (JSON.parse(stored) as { date: string; count: number }) : { date: today, count: 0 };
      const currentCount = parsed.date === today ? parsed.count : 0;
      if (currentCount >= MAX_GENERATIONS_PER_DAY) {
        toast.error('Daily generation limit reached. Try again tomorrow.');
        return;
      }
    } catch {
      // ignore
    }

    const imageToUse = uploadedImage || selectedAvatar;
    if (!imageToUse && !textDescription.trim()) {
      toast.error('Please upload an image, select an avatar, or enter a description');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedAvatar(null);
    setSnowyId(null);
    setRarityTraits(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const increment = prev < 50 ? 15 : prev < 80 ? 8 : 3;
        return Math.min(prev + increment, 95);
      });
    }, 400);

    try {
      const result = await generateSnowmanAvatar(imageToUse, textDescription, selectedStyle);
      clearInterval(progressInterval);
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setGeneratedAvatar(result);
      try {
        const saved = await saveSnowyGeneration(result, selectedStyle, walletAddress || undefined);
        setSnowyId(saved.snowyId);
        setRarityTraits(saved.rarityTraits);
        setHasWatermark(!hasToken);
      } catch (saveError) {
        console.warn('Failed to save Snowy:', saveError);
      }
      toast.success('🎉 Avatar ready!', {
        style: {
          background: '#fff',
          color: '#3b82f6',
          border: '1px solid #3b82f6',
          fontSize: '16px',
          padding: '16px',
        },
        duration: 4000,
      });
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem(generationKey);
          const parsed = stored ? (JSON.parse(stored) as { date: string; count: number }) : { date: today, count: 0 };
          const currentCount = parsed.date === today ? parsed.count : 0;
          localStorage.setItem(generationKey, JSON.stringify({ date: today, count: currentCount + 1 }));
        }
      } catch {
        // ignore
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(0);
      let errorMessage = 'Generation failed. Please try again.';
      if (error?.message) {
        if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          errorMessage = '⏱️ Generation took too long. The AI model might be busy. Please try again in a moment.';
        } else if (error.message.includes('loading') || error.message.includes('Model')) {
          errorMessage = '🤖 AI model is loading. Please wait a moment and try again.';
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = '🚦 Too many requests. Please wait a moment before trying again.';
        } else if (error.message.includes('token') || error.message.includes('API')) {
          errorMessage = '🔑 API configuration issue. Please check your API keys.';
        }
      }
      toast.error(errorMessage, {
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #dc2626',
          fontSize: '14px',
          padding: '16px',
        },
        duration: 5000,
      });
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedAvatar) return;
    if (hasWatermark && !isConnected) {
      toast.error('Connect wallet and hold SNOWY tokens for HD download');
      return;
    }
    const link = document.createElement('a');
    link.href = generatedAvatar;
    link.download = `snowy-${snowyId || 'avatar'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded!');
  };

  const handleShare = () => {
    if (!generatedAvatar) return;
    const text = `Check out my SNOWY avatar! #SNOWYToken #SnowmanCoin #CryptoWinter`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const clearImage = () => {
    setUploadedImage(null);
    setSelectedAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="snowyify" className="py-20 px-4 relative bg-white overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10 opacity-30 pointer-events-none">
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
              <FaWandMagicSparkles className="text-blue-600 text-4xl" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text">
              Snowify Your Profile
            </h2>
            <motion.div 
              className="w-1.5 h-10 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"
              animate={{ height: [40, 50, 40] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Transform your profile picture into a festive 3D cartoon snowman using AI magic! 
            <br />
            <span className="text-blue-600 font-bold">100% FREE - No payment required!</span>
            <br />
            <span className="text-sm text-gray-500 mt-2 inline-block">
              ⏱️ AI transformations take 30-50 seconds - worth the wait for your festive 3D makeover!
            </span>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative z-10">
              <motion.h3 
                whileHover={{ x: 5 }}
                className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaUpload className="text-blue-600" />
                </motion.div>
                Upload Your Photo
              </motion.h3>
              <p className="text-gray-600 mb-6 text-sm">Choose a clear photo for best results.</p>

              <motion.div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                animate={{
                  scale: isDragging ? 1.02 : 1,
                  borderColor: isDragging ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.3)',
                }}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-12 text-center cursor-pointer hover:bg-blue-50/50 transition-all duration-300 mb-6 relative overflow-hidden group/upload"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <AnimatePresence mode="wait">
                  {uploadedImage ? (
                    <motion.div
                      key="image"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative"
                    >
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="max-w-full max-h-64 mx-auto rounded-xl border-2 border-blue-200 shadow-lg"
                      />
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2.5 hover:bg-red-600 shadow-lg"
                      >
                        <FaTimes />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        <FaUpload className="text-6xl text-blue-300 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-gray-700 font-semibold mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <StyleSelector selectedStyle={selectedStyle} onStyleChange={setSelectedStyle} />
              <AvatarGallery selectedAvatar={selectedAvatar} onAvatarSelect={handleAvatarSelect} />

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Or describe what you want:</label>
                <motion.textarea
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder="E.g., 'A friendly snowman with a red scarf'"
                  className="w-full p-4 border-2 border-blue-200 bg-white rounded-xl focus:border-blue-400 focus:outline-none resize-none text-gray-900 placeholder-gray-400 transition-all duration-300"
                  rows={3}
                  whileFocus={{ scale: 1.01 }}
                />
              </div>

              <motion.button
                onClick={handleGenerate}
                disabled={isGenerating || (!uploadedImage && !selectedAvatar && !textDescription.trim())}
                whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="gradient-button w-full text-white font-bold px-8 py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <motion.div
                  animate={isGenerating ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isGenerating ? Infinity : 0, ease: 'linear' }}
                >
                  <FaWandMagicSparkles />
                </motion.div>
                <span>{isGenerating ? 'Generating...' : 'Transform to Snowman!'}</span>
              </motion.button>
              
              {!isGenerating && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center gap-1.5"
                >
                  <span className="text-base">⏱️</span>
                  <span className="font-medium">AI transformations take 30-50 seconds</span>
                </motion.p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden group"
          >
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-100/30 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <motion.h3 whileHover={{ x: 5 }} className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity }}>
                  <FaWandMagicSparkles className="text-cyan-600" />
                </motion.div>
                Your Snowman Avatar
              </motion.h3>
              <p className="text-gray-600 mb-6 text-sm">Your transformed snowman profile picture.</p>

              <div className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center min-h-[400px] flex items-center justify-center mb-6 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                      <div className="mb-6">
                        <div className="w-full bg-blue-100 border-2 border-blue-200 rounded-full h-4 mb-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                            className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 h-4 rounded-full relative overflow-hidden"
                          >
                            <motion.div
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                          </motion.div>
                        </div>
                        <p className="text-gray-600 text-sm font-medium">{progress}% - Generating your unique snowman...</p>
                      </div>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></motion.div>
                    </motion.div>
                  ) : generatedAvatar ? (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.8, rotateY: -180 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="relative">
                      <div className="relative">
                        <motion.img
                          src={generatedAvatar}
                          alt="Generated Snowman Avatar"
                          className="max-w-full max-h-96 mx-auto rounded-2xl border-2 border-blue-200 shadow-2xl"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: 'spring' }}
                        />
                        {hasWatermark && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 text-white px-4 py-2 rounded-lg font-bold text-sm rotate-[-15deg]">SNOWY</div>
                          </div>
                        )}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-2 shadow-lg">
                          <FaCheck />
                        </motion.div>
                      </div>
                      <RarityDisplay rarityTraits={rarityTraits} />
                    </motion.div>
                  ) : (
                    <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-gray-600">
                      <p className="text-lg font-bold">Your snowman-ified picture will appear here</p>
                      <p className="text-sm text-gray-500 mt-2">Upload a photo and click transform</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {generatedAvatar && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex gap-4">
                    {hasWatermark ? (
                      <motion.button
                        onClick={handleDownload}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 glass-card hover:bg-white text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-blue-200 hover:border-blue-400"
                      >
                        <FaDownload />
                        Download (Watermarked)
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handleDownload}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 gradient-button text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2"
                      >
                        <FaDownload />
                        Download HD
                      </motion.button>
                    )}
                    <motion.button
                      onClick={handleShare}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 glass-card hover:bg-white text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-blue-200 hover:border-blue-400"
                    >
                      <FaXTwitter />
                      Share on X
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Coming soon overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-4">
        <div className="glass-card max-w-2xl w-full text-center p-8 rounded-3xl border border-blue-100 shadow-xl bg-white/95">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text mb-4">Snowify Your Profile</h2>
          <p className="text-2xl font-black text-blue-600">Coming soon</p>
        </div>
      </div>
    </section>
  );
};

export default Snowyify;
