import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaRedo, FaTrophy } from 'react-icons/fa';
import { LEVELS, useSnowyRun } from '../hooks/useSnowyRun';
import { useWallet } from '../hooks/useWallet';
import { login, register } from '../services/authApi';
import toast from 'react-hot-toast';

const SnowyRun = () => {
  const playfieldRef = useRef<HTMLDivElement>(null);
  const [playfieldWidth, setPlayfieldWidth] = useState(960);
  const { gameState, startGame, jump, slide, dash, pauseGame, dailyRunCount, canPlay, nextLevelScore, currentLevel, lootboxReward, claimLootbox, pendingLootEffect, purchaseUpgrade, playerSkin, unlockedSkins } = useSnowyRun(playfieldWidth);
  const { walletAddress, connectWallet, isAuthenticating } = useWallet();
  const [guestMode, setGuestMode] = useState(false);
  const [authComplete, setAuthComplete] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [manualWallet, setManualWallet] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const now = Date.now();
  const isInvulnerable = gameState.invulnerableUntil > now || gameState.dashActiveUntil > now;
  const isDashing = gameState.dashActiveUntil > now;
  const magnetActive = gameState.magnetUntil > now;
  const skinClass =
    playerSkin === 'frost'
      ? 'drop-shadow-[0_0_16px_rgba(59,130,246,0.55)] saturate-[1.05]'
      : playerSkin === 'blaze'
        ? 'drop-shadow-[0_0_16px_rgba(248,113,113,0.6)] saturate-[1.1]'
        : 'drop-shadow-[0_3px_6px_rgba(0,0,0,0.2)]';
  const upgradeOptions = [
    { key: 'startSpeed' as const, label: 'Start Speed Boost', desc: 'Begin faster each run', cost: 220 },
    { key: 'skinFrost' as const, label: 'Frost Look', desc: 'Cool blue glow', cost: 180, owned: unlockedSkins.frost },
    { key: 'skinBlaze' as const, label: 'Blaze Look', desc: 'Warm ember glow', cost: 180, owned: unlockedSkins.blaze },
  ];
  const currentLevelStart = currentLevel?.minScore ?? 0;
  const levelSpan = nextLevelScore ? Math.max(1, nextLevelScore - currentLevelStart) : 1;
  const nextLevelProgress = nextLevelScore
    ? Math.min(1, Math.max(0, (gameState.score - currentLevelStart) / levelSpan))
    : 1;
  const levelTheme = {
    skyFrom: currentLevel?.skyFrom || '#e6f4ff',
    skyTo: currentLevel?.skyTo || '#c9e9ff',
    groundFrom: currentLevel?.groundFrom || '#0f9c50',
    groundTo: currentLevel?.groundTo || '#17b55a',
    accentGradient: currentLevel?.accentGradient || 'linear-gradient(90deg, #38bdf8, #0ea5e9, #6366f1)',
    overlay: currentLevel?.overlay || 'clear',
  };
  
  // Derive types from gameState
  type Obstacle = NonNullable<typeof gameState.obstacles[0]>;
  type Collectible = NonNullable<typeof gameState.collectibles[0]>;
  type Platform = NonNullable<typeof gameState.platforms[0]>;

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!authComplete) return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (gameState.isGameOver) {
          startGame();
        } else if (gameState.isPlaying) {
          jump();
        } else {
          startGame();
        }
      } else if (e.code === 'ArrowDown' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        slide();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        dash();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [authComplete, gameState.isPlaying, gameState.isGameOver, startGame, jump, slide, dash]);

  // If a wallet connects, mark auth as complete and exit guest mode
  useEffect(() => {
    if (walletAddress) {
      setGuestMode(false);
      setAuthComplete(true);
      setShowAuthForm(false);
    }
  }, [walletAddress]);

  // Keep guest play from ever re-triggering the auth prompt in-session
  useEffect(() => {
    if (guestMode) {
      setAuthComplete(true);
      setShowAuthForm(false);
    }
  }, [guestMode]);

  const closeAuthModal = () => {
    setAuthLoading(false);
    setShowAuthForm(false);
  };

  // Track playfield width so spawns enter fully from the right
  useEffect(() => {
    const updateWidth = () => {
      if (playfieldRef.current) {
        setPlayfieldWidth(playfieldRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const renderObstacle = (obstacle: Obstacle) => {
    const emoji = obstacle.type === 'bear' ? '🐻' : obstacle.type === 'rug' ? '🧸' : '👔';
    const gradient =
      obstacle.type === 'bear'
        ? 'linear-gradient(135deg, #fef08a 0%, #facc15 60%, #f59e0b 100%)'
        : obstacle.type === 'rug'
          ? 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 60%, #c084fc 100%)'
          : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 60%, #38bdf8 100%)';
    return (
      <div
        key={obstacle.id}
        className="absolute z-10 flex items-center justify-center"
        style={{
          left: `${obstacle.x}px`,
          bottom: `${obstacle.y}px`,
          width: `${obstacle.width}px`,
          height: `${obstacle.height}px`,
          borderRadius: '12px',
          background: gradient,
          boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
          color: '#1f2937',
          fontSize: '28px',
        }}
      >
        {emoji}
      </div>
    );
  };

  const renderCollectible = (collectible: Collectible) => {
    const emojis = { snowflake: '❄️', gift: '🎁', shield: '🛡️', magnet: '🧲' };
    const colors = {
      snowflake: 'from-cyan-100 via-white to-blue-100',
      gift: 'from-amber-100 via-amber-200 to-amber-300',
      shield: 'from-emerald-100 via-emerald-200 to-emerald-300',
      magnet: 'from-indigo-100 via-indigo-200 to-indigo-300',
    } as const;
    return (
      <motion.div
        key={collectible.id}
        initial={{ scale: 0.9, opacity: 0.8 }}
        animate={{ scale: 1.05, opacity: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute z-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
        style={{
          left: `${collectible.x}px`,
          bottom: `${collectible.y}px`,
          width: `${collectible.width}px`,
          height: `${collectible.height}px`,
          borderRadius: '50%',
          backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
        }}
      >
        <div
          className={`w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br ${colors[collectible.type]}`}
          style={{ borderRadius: '50%' }}
        >
          {emojis[collectible.type]}
        </div>
      </motion.div>
    );
  };

  const renderPlatform = (platform: Platform) => {
    return (
      <div
        key={platform.id}
        className="absolute rounded-md bg-gradient-to-r from-slate-200/90 via-white/90 to-slate-200/90 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
        style={{
          left: `${platform.x}px`,
          bottom: `${platform.y}px`,
          width: `${platform.width}px`,
          height: `${platform.height}px`,
        }}
      />
    );
  };

  return (
    <section id="snowy-run" className="py-20 px-4 relative bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 gradient-text mb-4">
            Snowy Run
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Endless runner game! Collect snowflakes and gifts, avoid obstacles. One free run per day!
          </p>
        </motion.div>

        <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
          {/* Game Canvas */}
          <div 
            className="relative rounded-2xl overflow-hidden cursor-pointer border border-white/60 shadow-inner" 
            style={{ height: '400px' }}
            ref={playfieldRef}
            onClick={() => {
              if (!authComplete) {
                setShowAuthForm(true);
                return;
              }
              if (gameState.isGameOver) {
                startGame();
              } else if (gameState.isPlaying && !gameState.isPaused) {
                jump();
              } else if (!gameState.isPlaying) {
                startGame();
              }
            }}
        >
          {/* Parallax background layers */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(180deg, ${levelTheme.skyFrom} 0%, ${levelTheme.skyTo} 70%)` }}
            />
            {levelTheme.overlay === 'clear' && (
              <>
                <div className="absolute top-6 left-4 text-5xl opacity-30">☁️</div>
                <div className="absolute top-10 right-6 text-4xl opacity-25">☁️</div>
                <div className="absolute bottom-24 left-0 right-0 h-24 bg-gradient-to-r from-blue-100/70 via-white/40 to-blue-100/70 rounded-full blur-2xl scale-110" />
              </>
            )}
            {levelTheme.overlay === 'forest' && (
              <>
                <div className="absolute bottom-24 left-0 right-0 h-20 bg-gradient-to-t from-emerald-800/60 via-emerald-700/50 to-transparent blur-md" />
                  <div className="absolute bottom-16 left-6 text-4xl opacity-50">🌲</div>
                  <div className="absolute bottom-18 left-24 text-4xl opacity-40">🌲</div>
                  <div className="absolute bottom-20 right-16 text-4xl opacity-45">🌲</div>
                  <div className="absolute top-8 left-4 text-4xl opacity-25">❄️</div>
                </>
              )}
              {levelTheme.overlay === 'blizzard' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0b1224]/80 via-[#0e1a2e]/60 to-[#0e1a2e]/30" />
                  <div className="absolute top-4 left-6 text-4xl opacity-50">🌙</div>
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                </>
              )}
            </div>

            {/* HUD */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-white/85 backdrop-blur px-3 py-1 rounded-full border border-white/60 shadow-sm">
                  <span className="text-xs font-semibold text-blue-700">Level {gameState.levelIndex + 1} / {LEVELS.length}</span>
                  <span className="text-sm font-bold text-gray-800">{currentLevel?.name}</span>
                </div>
                {nextLevelScore && (
                  <div className="w-44 bg-white/70 backdrop-blur rounded-full h-2 overflow-hidden border border-white/70">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${nextLevelProgress * 100}%`, backgroundImage: levelTheme.accentGradient }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {gameState.currentEvent !== 'none' && (
                  <div className="flex items-center gap-2 bg-black/55 text-white px-3 py-2 rounded-full backdrop-blur border border-white/20 shadow-lg">
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {gameState.currentEvent === 'frenzy' ? 'Gift Frenzy' : 'Blizzard Rush'}
                    </span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {Math.max(0, Math.ceil((gameState.eventEndsAt - now) / 1000))}s
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur border border-blue-100 text-blue-700 shadow-sm">
                    🦘 Jumps: <span className="text-gray-900 font-bold">{gameState.jumpsLeft}/2</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur border border-amber-100 text-amber-700 shadow-sm">
                    ⚡ Dash: <span className="text-gray-900 font-bold">{gameState.dashCharges}/2</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur border border-emerald-100 text-emerald-700 shadow-sm">
                    🛡️ Shields: <span className="text-gray-900 font-bold">{gameState.shields}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur shadow-sm border ${magnetActive ? 'bg-indigo-100/90 border-indigo-300 text-indigo-800' : 'bg-white/85 border-indigo-100 text-indigo-700'}`}>
                    🧲 Magnet: <span className={`font-bold ${magnetActive ? 'text-indigo-900' : 'text-gray-900'}`}>{magnetActive ? 'ON' : 'off'}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/85 backdrop-blur border border-white/60 shadow-md">
                <span className="text-xs font-semibold text-gray-500">Score</span>
                <span className="text-xl font-black text-gray-900">{gameState.score}</span>
                <span className="text-[11px] font-semibold text-gray-500">Speed {gameState.gameSpeed.toFixed(1)}x</span>
              </div>
            </div>

            {/* Ground */}
            <div
              className="absolute bottom-0 left-0 right-0 border-t-4 border-emerald-800 shadow-[0_-8px_20px_rgba(0,0,0,0.15)]"
              style={{
                height: '56px',
                background: `linear-gradient(to top, ${levelTheme.groundFrom}, ${levelTheme.groundTo})`,
              }}
            ></div>
            <div className="absolute bottom-[56px] left-0 right-0 h-3 bg-gradient-to-r from-white/40 via-white/20 to-white/40 opacity-70" />

            {/* Player */}
            {magnetActive && (
              <motion.div
                className="absolute z-10"
                style={{
                  left: '82px',
                  bottom: `${gameState.playerY - 6}px`,
                  width: '72px',
                  height: '72px',
                }}
                animate={{ scale: [0.95, 1.1, 0.95], opacity: [0.3, 0.65, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-full h-full rounded-full border-2 border-indigo-300/70 bg-indigo-200/10 shadow-[0_0_16px_rgba(99,102,241,0.3)]" />
              </motion.div>
            )}
            <motion.div
              className="absolute z-20"
              style={{
                left: '92px',
                bottom: `${gameState.playerY - 4}px`,
                width: '56px',
                height: gameState.isSliding ? '32px' : '56px',
                transform: gameState.isSliding ? 'scaleY(0.75)' : 'scaleY(1)',
              }}
              animate={gameState.isPlaying ? { y: [0, -5, 0] } : {}}
              transition={{ duration: 0.5, repeat: gameState.isPlaying ? Infinity : 0 }}
            >
              {isDashing && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-gradient-to-r from-amber-300/60 to-transparent blur-md rounded-full" />
              )}
              <img
                src="/images/hero/snowy-pepe-run.png"
                alt="Snowy runner"
                className={
                  isDashing
                    ? `w-full h-full object-contain ${skinClass} drop-shadow-[0_0_14px_rgba(250,204,21,0.9)]`
                    : isInvulnerable
                      ? `w-full h-full object-contain ${skinClass} drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]`
                      : `w-full h-full object-contain ${skinClass}`
                }
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/hero/snowy-pepe.png';
                }}
                draggable={false}
              />
            </motion.div>

            {/* Platforms */}
            {gameState.platforms.map(renderPlatform)}

            {/* Obstacles */}
            {gameState.obstacles.map(renderObstacle)}

            {/* Collectibles */}
            {gameState.collectibles.map(renderCollectible)}

            {/* Game Over Overlay */}
            <AnimatePresence>
              {gameState.isGameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-2xl p-8 text-center max-w-md"
                  >
                    <FaTrophy className="text-5xl text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-3xl font-black text-gray-900 mb-2">Game Over!</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-6">Score: {gameState.score}</p>
                    <motion.button
                      onClick={startGame}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="gradient-button text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 mx-auto"
                    >
                      <FaRedo />
                      Play Again
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auth modal */}
            <AnimatePresence>
              {showAuthForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-40"
                  onClick={closeAuthModal}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAuthMode('login')}
                          type="button"
                          className={`px-3 py-2 rounded-lg text-sm font-bold ${
                            authMode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Login
                        </button>
                        <button
                          onClick={() => setAuthMode('register')}
                          type="button"
                          className={`px-3 py-2 rounded-lg text-sm font-bold ${
                            authMode === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Register
                        </button>
                      </div>
                      <button type="button" className="text-sm text-gray-500" onClick={closeAuthModal}>
                        Close
                      </button>
                    </div>
                    <form
                      className="grid gap-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setAuthLoading(true);
                        try {
                          if (authMode === 'login') {
                            await login(username, password, manualWallet || undefined);
                            setGuestMode(false);
                            setAuthComplete(true);
                            setShowAuthForm(false);
                            toast.success('Logged in');
                          } else {
                            await register(username, password, manualWallet || undefined, nickname || undefined);
                            setGuestMode(false);
                            setAuthComplete(true);
                            setShowAuthForm(false);
                            toast.success('Registered');
                          }
                        } catch (error: any) {
                          toast.error(error?.response?.data?.error || 'Auth failed');
                        } finally {
                          setAuthLoading(false);
                        }
                      }}
                    >
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">Username</label>
                          <input
                            className="w-full border rounded-lg px-3 py-2"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700">Password</label>
                          <input
                            type="password"
                            className="w-full border rounded-lg px-3 py-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        {authMode === 'register' && (
                          <div>
                            <label className="text-xs font-semibold text-gray-700">Nickname (optional)</label>
                            <input
                              className="w-full border rounded-lg px-3 py-2"
                              value={nickname}
                              onChange={(e) => setNickname(e.target.value)}
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-semibold text-gray-700">Wallet address (optional)</label>
                          <input
                            className="w-full border rounded-lg px-3 py-2"
                            value={manualWallet}
                            onChange={(e) => setManualWallet(e.target.value)}
                            placeholder="Solana address"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={authLoading}
                          className="gradient-button text-white font-bold px-5 py-3 rounded-xl disabled:opacity-60"
                        >
                          {authLoading ? 'Working...' : authMode === 'login' ? 'Login' : 'Register'}
                        </button>
                        <button
                          type="button"
                          onClick={closeAuthModal}
                          className="px-4 py-3 rounded-xl border font-semibold text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lootbox Overlay */}
            <AnimatePresence>
              {lootboxReward && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center z-30"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 text-center shadow-2xl max-w-sm w-full"
                  >
                    <div className="text-4xl mb-3">🎁</div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Loot Drop!</h3>
                    <p className="text-gray-700 mb-4">{lootboxReward}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={claimLootbox}
                      className="gradient-button text-white font-bold px-6 py-2 rounded-lg"
                    >
                      Claim
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign-in overlay */}
            {!authComplete && (
              <div className="absolute inset-0 bg-white/85 backdrop-blur flex items-center justify-center z-30">
                <div className="text-center space-y-3">
                  <p className="text-lg font-bold text-gray-800">Sign in to play</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={connectWallet}
                          disabled={isAuthenticating}
                          className="gradient-button text-white font-bold px-6 py-3 rounded-xl disabled:opacity-60"
                        >
                          {isAuthenticating ? 'Connecting...' : 'Wallet sign-in'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAuthForm(true)}
                          className="glass-card px-5 py-3 rounded-xl font-bold text-gray-800 border"
                        >
                          Login/Register
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setGuestMode(true);
                            setAuthComplete(true);
                            setShowAuthForm(false);
                          }}
                          className="glass-card px-5 py-3 rounded-xl font-bold text-gray-800 border"
                        >
                          Play as Guest
                        </motion.button>
                      </div>
                </div>
              </div>
            )}

            {/* Start Screen */}
            <AnimatePresence>
              {!gameState.isPlaying && !gameState.isGameOver && authComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center z-10"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                  >
                    <h3 className="text-3xl font-black text-white mb-4">Ready to Run?</h3>
                    <motion.button
                      onClick={startGame}
                      disabled={!canPlay}
                      whileHover={{ scale: canPlay ? 1.05 : 1 }}
                      whileTap={{ scale: canPlay ? 0.95 : 1 }}
                      className="gradient-button text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                    >
                      <FaPlay />
                      Start Game
                    </motion.button>
                    {!canPlay && (
                      <p className="text-white mt-4 text-sm">
                        Daily limit reached. Connect wallet with SNOWY tokens for unlimited plays!
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pause Overlay */}
            <AnimatePresence>
              {gameState.isPaused && gameState.isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
                >
                  <div className="text-center">
                    <h3 className="text-3xl font-black text-white mb-4">Paused</h3>
                    <motion.button
                      onClick={pauseGame}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="gradient-button text-white font-bold px-8 py-3 rounded-xl"
                    >
                      Resume
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Game Info */}
          <div className="mt-6 flex items-center justify-between">
            <div className="space-y-1">
              {gameState.combo > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg font-bold text-blue-600"
                >
                  🔥 Combo x{gameState.combo}!
                </motion.div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end">
              {!authComplete ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setGuestMode(true);
                      setAuthComplete(true);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                  >
                    Guest mode
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={connectWallet}
                    disabled={isAuthenticating}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-blue-200 bg-white shadow-sm disabled:opacity-60"
                  >
                    {isAuthenticating ? 'Connecting...' : 'Connect wallet'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAuthForm(true)}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-blue-200 bg-white shadow-sm"
                  >
                    Login/Register
                  </motion.button>
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-full">
                    {walletAddress ? `Wallet: ${walletAddress.slice(0,4)}...${walletAddress.slice(-4)}` : guestMode ? 'Guest mode' : 'Signed in'}
                  </span>
                  {!walletAddress && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={connectWallet}
                      disabled={isAuthenticating}
                      className="px-4 py-2 rounded-full text-sm font-semibold border border-blue-200 bg-white shadow-sm disabled:opacity-60"
                    >
                      {isAuthenticating ? 'Connecting...' : 'Connect wallet'}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setGuestMode(false);
                      setShowAuthForm(true);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-blue-200 bg-white shadow-sm"
                  >
                    Login/Register
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setGuestMode(true);
                      setAuthComplete(true);
                      setShowAuthForm(false);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-blue-200 bg-white shadow-sm"
                  >
                    Play as Guest
                  </motion.button>
                </>
              )}
              {gameState.isPlaying && (
                <motion.button
                  onClick={dash}
                  disabled={gameState.dashCharges <= 0}
                  whileHover={{ scale: gameState.dashCharges > 0 ? 1.03 : 1 }}
                  whileTap={{ scale: gameState.dashCharges > 0 ? 0.97 : 1 }}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-amber-200 bg-white shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  ⚡ Dash
                </motion.button>
              )}
              {gameState.isPlaying && (
                <motion.button
                  onClick={pauseGame}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-blue-200 bg-white shadow-sm"
                >
                  {gameState.isPaused ? <FaPlay /> : <FaPause />}
                </motion.button>
              )}
              {pendingLootEffect && (
                <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-full">
                  Loot ready: {pendingLootEffect.label}
                </div>
              )}
            </div>
          </div>

          {/* Challenges HUD */}
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {gameState.challenges.map((c) => {
              const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
              return (
                <div key={c.id} className="glass-card p-3 rounded-xl border border-white/40">
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                    <span>{c.description}</span>
                    {c.completed ? <span className="text-emerald-600 font-bold">Done</span> : <span>{pct}%</span>}
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Reward: {c.reward}</div>
                </div>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-gray-600">
            <p className="font-semibold mb-2">Controls:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Press <kbd className="px-2 py-1 bg-white rounded border">Space</kbd> or click to jump</li>
              <li>Double jump is available (2 jumps per landing)</li>
              <li>Press <kbd className="px-2 py-1 bg-white rounded border">S</kbd> / <kbd className="px-2 py-1 bg-white rounded border">↓</kbd> to slide under high obstacles</li>
              <li>Use <kbd className="px-2 py-1 bg-white rounded border">Shift</kbd> / <kbd className="px-2 py-1 bg-white rounded border">D</kbd> to dash through danger (limited charges)</li>
              <li>Collect ❄️ snowflakes (+10 points) and 🎁 gifts (+50 points)</li>
              <li>Grab 🛡️ for an extra hit and 🧲 to attract collectibles for a few seconds</li>
              <li>Ride staircase platforms (appear in waves) to climb like Geometry Dash</li>
              <li>Avoid 🐻 bears, 🧸 rugs, and 👔 taxman</li>
              <li>There are 100 levels—keep scoring to climb! Events (Frenzy/Blizzard) shake things up.</li>
              {!authComplete && <li>Sign in or play as guest to start.</li>}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SnowyRun;
