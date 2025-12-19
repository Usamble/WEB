import { useState, useEffect, useRef, useCallback } from 'react';
import { submitScore, getUserStats } from '../services/gameApi';
import { useWallet } from './useWallet';

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  levelIndex: number;
  playerY: number;
  playerVelocity: number;
  jumpsLeft: number;
  dashCharges: number;
  dashRechargeAt: number;
  dashActiveUntil: number;
  isSliding: boolean;
  slideEndTime: number;
  platforms: Platform[];
  obstacles: Obstacle[];
  collectibles: Collectible[];
  gameSpeed: number;
  combo: number; // Combo multiplier for consecutive collects
  lastCollectTime: number; // Track time of last collectible
  shields: number;
  invulnerableUntil: number;
  magnetUntil: number;
  currentEvent: 'none' | 'frenzy' | 'blizzard';
  eventEndsAt: number;
  startGraceUntil: number;
  challenges: Challenge[];
  activePhase: PhaseName;
  phaseEndsAt: number;
}

export type Obstacle = {
  id: string;
  x: number;
  y: number;
  type: 'bear' | 'rug' | 'taxman';
  width: number;
  height: number;
};

export type Collectible = {
  id: string;
  x: number;
  y: number;
  type: 'snowflake' | 'gift' | 'shield' | 'magnet';
  width: number;
  height: number;
};

export type Platform = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Challenge = {
  id: string;
  type: 'collect_snow' | 'collect_gift' | 'survive';
  target: number;
  progress: number;
  reward: 'shield' | 'magnet' | 'points' | 'dash';
  completed: boolean;
  description: string;
};

type PhaseName = 'calm' | 'heat' | 'reward';

type SpawnPattern = 'wave' | 'collectible_cluster' | 'mixed' | 'gap' | 'stairs';

type WaveConfig = {
  pattern: SpawnPattern;
  obstacleCount: number;
  collectibleCount: number;
  spacing: number;
  delay: number;
};

type LevelConfig = {
  name: string;
  minScore: number;
  speedCap: number;
  spawnMultiplier: number;
  flyingChance: number;
  skyFrom: string;
  skyTo: string;
  groundFrom: string;
  groundTo: string;
  accentGradient: string;
  overlay: 'clear' | 'forest' | 'blizzard';
};

const LEVEL_COUNT = 100;

const overlayForLevel = (index: number): LevelConfig['overlay'] => {
  const mod = index % 3;
  if (mod === 1) return 'forest';
  if (mod === 2) return 'blizzard';
  return 'clear';
};

const createLevel = (index: number): LevelConfig => {
  const t = index / (LEVEL_COUNT - 1); // 0..1 progression
  const minScore = Math.floor(index * 180 + index * index * 4); // slowly steeper curve
  const speedCap = 2 + t * 3; // 2 -> 5
  const spawnMultiplier = 1 + t * 0.8; // 1 -> 1.8
  const flyingChance = Math.min(0.2 + t * 0.65, 0.85);
  const hue = (index * 11) % 360;
  const skyFrom = `hsl(${hue}, 80%, ${90 - t * 20}%)`;
  const skyTo = `hsl(${(hue + 20) % 360}, 75%, ${75 - t * 25}%)`;
  const groundFrom = `hsl(${(hue + 140) % 360}, 70%, ${40 - t * 10}%)`;
  const groundTo = `hsl(${(hue + 120) % 360}, 70%, ${55 - t * 15}%)`;
  const accentGradient = `linear-gradient(90deg, hsl(${hue},80%,60%), hsl(${(hue + 35) % 360},80%,55%), hsl(${(hue + 70) % 360},80%,60%))`;

  return {
    name: `Level ${index + 1}`,
    minScore,
    speedCap,
    spawnMultiplier,
    flyingChance,
    skyFrom,
    skyTo,
    groundFrom,
    groundTo,
    accentGradient,
    overlay: overlayForLevel(index),
  };
};

export const LEVELS: LevelConfig[] = Array.from({ length: LEVEL_COUNT }, (_, i) => createLevel(i));

const getLevelIndex = (score: number) => {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) {
      idx = i;
      break;
    }
  }
  return idx;
};

const GRAVITY = 1.0; // Medium gravity
const JUMP_STRENGTH = 18; // Balanced jump
const GROUND_Y = 56; // Ground surface height from bottom so characters stand above the green bar
const MAX_JUMP_HEIGHT = 150; // Maximum jump height
const PLAYER_SIZE = 40;
const MAX_JUMPS = 2; // Allow double jump
const SLIDE_DURATION = 600;
const INVULNERABLE_MS = 1400;
const MAGNET_DURATION = 4500;
const MAX_DASHES = 2;
const DASH_COOLDOWN_MS = 5000;
const DASH_DURATION_MS = 700;
const STAIR_STEP_HEIGHT = 22;
const STAIR_STEP_WIDTH = 90;
const BASE_GAME_SPEED = 1.1; // Calmer starting speed
const OBSTACLE_SPEED = 8; // Moderate base speed
const COLLECTIBLE_SPEED = 8; // Moderate base speed
const SHIELD_SPAWN_CHANCE = 0.1;
const MAGNET_SPAWN_CHANCE = 0.08;
const EVENT_MIN_DELAY_MS = 12000;
const EVENT_MAX_DELAY_MS = 18000;
const EVENT_DURATION_MS = 6000;
const PHASE_DURATION_MS = 18000;
type UpgradeType = 'shield' | 'dash' | 'magnet' | 'speed' | 'startSpeed' | 'skinFrost' | 'skinBlaze';
type LootKind = 'shield' | 'magnet' | 'dash' | 'points';
const UPGRADE_COSTS: Record<UpgradeType, number> = {
  shield: 150,
  dash: 120,
  magnet: 100,
  speed: 80,
  startSpeed: 220,
  skinFrost: 180,
  skinBlaze: 180,
};

export const useSnowyRun = (playfieldWidth = 900) => {
  const PERK_KEY = 'snowy-perks';
  const [startSpeedBonus, setStartSpeedBonus] = useState(0);
  const [playerSkin, setPlayerSkin] = useState<'default' | 'frost' | 'blaze'>('default');
  const [unlockedSkins, setUnlockedSkins] = useState({ frost: false, blaze: false });
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    levelIndex: 0,
    playerY: GROUND_Y,
    playerVelocity: 0,
    jumpsLeft: MAX_JUMPS,
    dashCharges: MAX_DASHES,
    dashRechargeAt: 0,
    dashActiveUntil: 0,
    isSliding: false,
    slideEndTime: 0,
    platforms: [],
    obstacles: [],
    collectibles: [],
    gameSpeed: BASE_GAME_SPEED + startSpeedBonus,
    combo: 0,
    lastCollectTime: 0,
    shields: 0,
    invulnerableUntil: 0,
    magnetUntil: 0,
    currentEvent: 'none',
    eventEndsAt: 0,
    startGraceUntil: 0,
    challenges: [],
    activePhase: 'calm',
    phaseEndsAt: 0,
  });

  const [dailyRunCount, setDailyRunCount] = useState(0);
  const [canPlay, setCanPlay] = useState(true);
  const [lootboxReward, setLootboxReward] = useState<string | null>(null);
  const [pendingLootEffect, setPendingLootEffect] = useState<{
    shields?: number;
    magnet?: boolean;
    dash?: boolean;
    bonusScore?: number;
    label: string;
    rewardKind?: LootKind;
  } | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastObstacleTime = useRef<number>(0);
  const lastCollectibleTime = useRef<number>(0);
  const currentWave = useRef<WaveConfig | null>(null);
  const waveStartTime = useRef<number>(0);
  const waveIndex = useRef<number>(0);
  const nextWaveTime = useRef<number>(0);
  const nextEventAt = useRef<number>(0);
  const nextPhaseAt = useRef<number>(0);
  const runCountSinceLoot = useRef<number>(0);
  const { walletAddress } = useWallet();
  const spawnStartX = Math.max(playfieldWidth + 40, 760);

  // Load persisted perks
  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem(PERK_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          startSpeedBonus?: number;
          playerSkin?: 'default' | 'frost' | 'blaze';
          unlockedSkins?: { frost?: boolean; blaze?: boolean };
        };
        if (parsed.startSpeedBonus !== undefined) setStartSpeedBonus(parsed.startSpeedBonus);
        if (parsed.playerSkin) setPlayerSkin(parsed.playerSkin);
        if (parsed.unlockedSkins) {
          setUnlockedSkins({
            frost: !!parsed.unlockedSkins.frost,
            blaze: !!parsed.unlockedSkins.blaze,
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist perks
  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(
        PERK_KEY,
        JSON.stringify({
          startSpeedBonus,
          playerSkin,
          unlockedSkins,
        })
      );
    } catch {
      // ignore
    }
  }, [startSpeedBonus, playerSkin, unlockedSkins]);

  // Pattern generator - creates consistent spawn patterns
  const generateWavePattern = useCallback((gameSpeed: number, level: LevelConfig): WaveConfig => {
    const patterns: SpawnPattern[] = ['wave', 'collectible_cluster', 'mixed', 'stairs'];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Base difficulty increases with game speed
    const difficultyMultiplier = Math.min(gameSpeed, 3);
    
    let obstacleCount = 0;
    let collectibleCount = 0;
    let spacing = 120; // Base spacing between objects in group
    let delay = 1500; // Base delay between waves
    
    switch (randomPattern) {
      case 'wave':
        // Wave of obstacles (1-3 obstacles)
        obstacleCount = Math.min(1 + Math.floor(difficultyMultiplier), 3);
        collectibleCount = 0;
        spacing = 100 + (difficultyMultiplier * 20);
        delay = 1200 - (difficultyMultiplier * 100);
        break;
      
      case 'collectible_cluster':
        // Cluster of collectibles (2-4 collectibles)
        obstacleCount = 0;
        collectibleCount = Math.min(2 + Math.floor(difficultyMultiplier), 4);
        spacing = 80 + (difficultyMultiplier * 15);
        delay = 1000 - (difficultyMultiplier * 80);
        break;
      
      case 'mixed':
        // Mixed pattern (1-2 obstacles + 1-2 collectibles)
        obstacleCount = Math.min(1 + Math.floor(difficultyMultiplier * 0.5), 2);
        collectibleCount = Math.min(1 + Math.floor(difficultyMultiplier * 0.5), 2);
        spacing = 110 + (difficultyMultiplier * 15);
        delay = 1100 - (difficultyMultiplier * 90);
        break;
      
      case 'stairs':
        // Staircase of platforms, minimal obstacles, few collectibles
        obstacleCount = 0;
        collectibleCount = Math.min(1 + Math.floor(difficultyMultiplier), 3);
        spacing = 95;
        delay = 1400 - (difficultyMultiplier * 80);
        break;
      
      case 'gap':
        // Gap - no spawn, just delay
        obstacleCount = 0;
        collectibleCount = 0;
        spacing = 0;
        delay = 800;
        break;
    }
    
    return {
      pattern: randomPattern,
      obstacleCount,
      collectibleCount,
      spacing: Math.max(spacing / level.spawnMultiplier, 80), // tighter spacing on higher levels
      delay: Math.max(delay / level.spawnMultiplier, 550), // faster waves on higher levels
    };
  }, []);

  // Check daily run limit
  const scheduleNextEvent = useCallback((from: number) => {
    const delay = Math.random() * (EVENT_MAX_DELAY_MS - EVENT_MIN_DELAY_MS) + EVENT_MIN_DELAY_MS;
    nextEventAt.current = from + delay;
  }, []);

  const generateChallenges = useCallback((): Challenge[] => {
    return [
      {
        id: 'c1',
        type: 'collect_snow',
        target: 8,
        progress: 0,
        reward: 'magnet',
        completed: false,
        description: 'Collect 8 snowflakes',
      },
      {
        id: 'c2',
        type: 'collect_gift',
        target: 3,
        progress: 0,
        reward: 'shield',
        completed: false,
        description: 'Grab 3 gifts',
      },
      {
        id: 'c3',
        type: 'survive',
        target: 25,
        progress: 0,
        reward: 'points',
        completed: false,
        description: 'Survive 25s',
      },
    ];
  }, []);

  useEffect(() => {
    const checkDailyLimit = async () => {
      try {
        const stats = await getUserStats(walletAddress || undefined);
        setDailyRunCount(stats.dailyRunCount);
        // Free users: 1 run per day, token holders: unlimited
        setCanPlay(true); // For now, allow unlimited (can be gated later)
      } catch (error) {
        console.error('Error checking daily limit:', error);
        setCanPlay(true);
      }
    };
    checkDailyLimit();
  }, [walletAddress]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const gameLoop = () => {
      setGameState((prev) => {
        // Update player physics
        // playerY is bottom position: 0 = ground, higher = in air
        let newPlayerY = prev.playerY + prev.playerVelocity;
        let newPlayerVelocity = prev.playerVelocity - GRAVITY; // Subtract gravity (pulls down)
        let newJumpsLeft = prev.jumpsLeft;
        let newDashCharges = prev.dashCharges;
        let newDashRechargeAt = prev.dashRechargeAt;
        let newDashActiveUntil = prev.dashActiveUntil;
        let newIsSliding = prev.isSliding;
        let newSlideEnd = prev.slideEndTime;
        const now = Date.now();
        const spawnLevelIndex = getLevelIndex(prev.score);
        const spawnLevel = LEVELS[spawnLevelIndex];
        const activeEvent = prev.currentEvent !== 'none' && now < prev.eventEndsAt ? prev.currentEvent : 'none';
        let newCurrentEvent = activeEvent as GameState['currentEvent'];
        let newEventEndsAt = prev.eventEndsAt;
        let newPhase = prev.activePhase;
        let newPhaseEndsAt = prev.phaseEndsAt;

        // Event lifecycle
        if (activeEvent === 'none' && nextEventAt.current && now >= nextEventAt.current) {
          newCurrentEvent = Math.random() > 0.5 ? 'frenzy' : 'blizzard';
          newEventEndsAt = now + EVENT_DURATION_MS;
        } else if (activeEvent !== 'none' && now >= prev.eventEndsAt) {
          newCurrentEvent = 'none';
          newEventEndsAt = 0;
          scheduleNextEvent(now);
        }

        // Phase cycle (calm -> heat -> reward)
        if (now >= prev.phaseEndsAt) {
          if (prev.activePhase === 'calm') newPhase = 'heat';
          else if (prev.activePhase === 'heat') newPhase = 'reward';
          else newPhase = 'calm';
          newPhaseEndsAt = now + PHASE_DURATION_MS;
        }

        const eventSpawnBoost = newCurrentEvent === 'frenzy' ? 1.15 : newCurrentEvent === 'blizzard' ? 1.08 : 1;
        const eventSpeedBoost = newCurrentEvent === 'blizzard' ? 1.15 : 1;
        const eventScoreBoost = newCurrentEvent === 'frenzy' ? 1.5 : 1;
        const phaseSpawnBoost = newPhase === 'heat' ? 1.15 : newPhase === 'reward' ? 0.9 : 1;
        const effectiveLevel = {
          ...spawnLevel,
          spawnMultiplier: spawnLevel.spawnMultiplier * eventSpawnBoost * phaseSpawnBoost,
        };

        // Dash management (recharge and expiry)
        if (newDashActiveUntil && now >= newDashActiveUntil) {
          newDashActiveUntil = 0;
        }
        if (newDashCharges < MAX_DASHES && newDashRechargeAt && now >= newDashRechargeAt) {
          newDashCharges += 1;
          newDashRechargeAt = newDashCharges < MAX_DASHES ? now + DASH_COOLDOWN_MS : 0;
        }

        // Ground collision - playerY can't go below 0
        if (newPlayerY <= GROUND_Y) {
          newPlayerY = GROUND_Y;
          newPlayerVelocity = 0;
          newJumpsLeft = MAX_JUMPS;
          newIsSliding = false;
          newSlideEnd = 0;
        }
        
        // Max jump height limit
        if (newPlayerY > MAX_JUMP_HEIGHT) {
          newPlayerY = MAX_JUMP_HEIGHT;
          newPlayerVelocity = 0;
        }

        // Slide expiration
        if (newIsSliding && now >= newSlideEnd) {
          newIsSliding = false;
          newSlideEnd = 0;
        }

        // Update obstacles - some move faster than others
        const newObstacles = prev.obstacles
          .map((obs) => {
            // Taxman moves faster, rug moves slower, bear is medium
            const speedMultiplier = obs.type === 'taxman' ? 1.3 : obs.type === 'rug' ? 0.9 : 1.0;
            return {
              ...obs,
              x: obs.x - OBSTACLE_SPEED * prev.gameSpeed * eventSpeedBoost * speedMultiplier,
            };
          })
          .filter((obs) => obs.x > -80);

        // Update platforms (move with world)
        const newPlatforms = prev.platforms
          .map((plat) => ({
            ...plat,
            x: plat.x - OBSTACLE_SPEED * prev.gameSpeed * 0.95,
          }))
          .filter((plat) => plat.x > -140);

        const playerHeight = newIsSliding ? PLAYER_SIZE * 0.6 : PLAYER_SIZE;
        const playerCenterX = 100 + PLAYER_SIZE / 2;
        const playerCenterY = newPlayerY + playerHeight / 2;
        const magnetActive = now < prev.magnetUntil;
        const magnetRange = Math.max(220, playfieldWidth * 0.45);

        // Update collectibles
        const newCollectibles = prev.collectibles
          .map((col) => {
            const dx = playerCenterX - (col.x + col.width / 2);
            const dy = playerCenterY - (col.y + col.height / 2);
            const dist = Math.hypot(dx, dy);
            const withinMagnet = magnetActive && dist < magnetRange;
            const pullStrength = withinMagnet ? (0.12 * (1 - dist / magnetRange)) : 0;

            return {
              ...col,
              x: col.x - (COLLECTIBLE_SPEED * prev.gameSpeed) - (magnetActive ? 1.2 : 0) + dx * pullStrength,
              y: col.y + dy * pullStrength,
            };
          })
          .filter((col) => col.x > -70);

        // Wave-based spawn system - consistent groups
        const obstacleTypes: Obstacle['type'][] = ['bear', 'rug', 'taxman'];
        const heights = { bear: 50, rug: 30, taxman: 60 };
        const widths = { bear: 50, rug: 80, taxman: 40 };
        const collectibleTypes: Collectible['type'][] = ['snowflake', 'gift'];
        
        // Initialize or get next wave
        if (!currentWave.current || now >= nextWaveTime.current) {
          currentWave.current = generateWavePattern(prev.gameSpeed, effectiveLevel);
          waveStartTime.current = now;
          nextWaveTime.current = now + currentWave.current.delay;
          waveIndex.current = 0;
        }
        
        const wave = currentWave.current;
        const timeSinceWaveStart = now - waveStartTime.current;
        const spawnDelay = 200; // Delay between objects in the same wave (ms)
        
        // Spawn obstacles in wave with consistent spacing
        for (let i = 0; i < wave.obstacleCount; i++) {
          const spawnTime = i * spawnDelay;
          const shouldSpawn = timeSinceWaveStart >= spawnTime && timeSinceWaveStart < spawnTime + 100;
          
          if (shouldSpawn) {
            // Check if this obstacle was already spawned
            const obstacleId = `obs-wave-${waveStartTime.current}-${i}`;
            const alreadySpawned = newObstacles.some(obs => obs.id === obstacleId);
            
            if (!alreadySpawned) {
              const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
              // Mix of ground and flying obstacles - more flying on higher levels
              const flyingChance = effectiveLevel.flyingChance;
              const isFlying = Math.random() > flyingChance;
              const baseY = isFlying 
                ? GROUND_Y + 70 + Math.random() * 80 
                : GROUND_Y + heights[type] + (Math.random() * 20 - 10);
              
              const newObstacle = {
                id: obstacleId,
                x: spawnStartX + (i * wave.spacing), // Spawn from just beyond the right edge
                y: baseY,
                type,
                width: widths[type],
                height: heights[type],
              };
              newObstacles.push(newObstacle);
            }
          }
        }
        
        // Spawn collectibles in wave with consistent spacing
        for (let i = 0; i < wave.collectibleCount; i++) {
          const spawnTime = (wave.obstacleCount + i) * spawnDelay;
          const shouldSpawn = timeSinceWaveStart >= spawnTime && timeSinceWaveStart < spawnTime + 100;
          
          if (shouldSpawn) {
            // Check if this collectible was already spawned
            const collectibleId = `col-wave-${waveStartTime.current}-${i}`;
            const alreadySpawned = newCollectibles.some(col => col.id === collectibleId);
            
            if (!alreadySpawned) {
              let type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
              // Occasionally spawn powerups instead of points
              if (Math.random() < SHIELD_SPAWN_CHANCE) {
                type = 'shield';
              } else if (Math.random() < MAGNET_SPAWN_CHANCE) {
                type = 'magnet';
              }
              // Consistent height variation
              const heightVariation = GROUND_Y + 80 + Math.random() * 120;

              const newCollectible = {
                id: collectibleId,
                x: spawnStartX + ((wave.obstacleCount + i) * wave.spacing), // Consistent spacing
                y: heightVariation,
                type,
                width: 30,
                height: 30,
              };
              newCollectibles.push(newCollectible);
            }
          }
        }

        // Spawn staircase platforms
        if (wave.pattern === 'stairs') {
          const steps = 3 + Math.floor(Math.random() * 3);
          for (let i = 0; i < steps; i++) {
            const spawnTime = i * spawnDelay;
            const shouldSpawn = timeSinceWaveStart >= spawnTime && timeSinceWaveStart < spawnTime + 100;
            if (shouldSpawn) {
              const platformId = `plat-wave-${waveStartTime.current}-${i}`;
              const alreadySpawned = newPlatforms.some((plat) => plat.id === platformId);
              if (!alreadySpawned) {
                const newPlatform = {
                  id: platformId,
                  x: spawnStartX + (i * wave.spacing),
                  y: GROUND_Y + i * STAIR_STEP_HEIGHT,
                  width: STAIR_STEP_WIDTH,
                  height: 18,
                };
                newPlatforms.push(newPlatform);
              }
            }
          }
        }

        // Check collisions using bottom coordinates with medium collision detection
        // Player: bottom from newPlayerY to newPlayerY + PLAYER_SIZE
        const playerBottomMin = newPlayerY;
        const playerBottomMax = newPlayerY + playerHeight;
        const collisionPadding = 5; // Medium collision detection
        const invulnerable = now < prev.invulnerableUntil || now < newDashActiveUntil || now < prev.startGraceUntil;

        // Land on platforms (and ground)
        const playerLeft = 100;
        const playerRight = 100 + PLAYER_SIZE;
        const supportPad = 8;
        let supportTop = GROUND_Y;
        newPlatforms.forEach((plat) => {
          const platLeft = plat.x;
          const platRight = plat.x + plat.width;
          const platTop = plat.y + plat.height;
          if (playerLeft + supportPad < platRight && playerRight - supportPad > platLeft) {
            supportTop = Math.max(supportTop, platTop);
          }
        });
        if (newPlayerVelocity <= 0 && newPlayerY <= supportTop && prev.playerY >= supportTop - 5) {
          newPlayerY = supportTop;
          newPlayerVelocity = 0;
          newJumpsLeft = MAX_JUMPS;
          newIsSliding = false;
          newSlideEnd = 0;
        }

        // Obstacle collisions - more precise
        let collidedObstacle: Obstacle | null = null;
        for (const obs of newObstacles) {
          const obsBottomMin = obs.y;
          const obsBottomMax = obs.y + obs.height;
          
          if (
            100 + collisionPadding < obs.x + obs.width - collisionPadding &&
            100 + playerHeight - collisionPadding > obs.x + collisionPadding &&
            playerBottomMin + collisionPadding < obsBottomMax - collisionPadding &&
            playerBottomMax - collisionPadding > obsBottomMin + collisionPadding
          ) {
            collidedObstacle = obs;
            break;
          }
        }

        if (collidedObstacle && !invulnerable) {
          if (prev.shields > 0) {
            // Use a shield and grant brief invulnerability
            return {
              ...prev,
              obstacles: newObstacles.filter((obs) => obs.id !== collidedObstacle!.id),
              shields: prev.shields - 1,
              invulnerableUntil: now + INVULNERABLE_MS,
              playerY: newPlayerY,
              playerVelocity: JUMP_STRENGTH * 0.6, // Small hop after impact
              jumpsLeft: Math.max(newJumpsLeft, 1),
              isSliding: false,
              slideEndTime: 0,
            };
          }

          return {
            ...prev,
            isGameOver: true,
            isPlaying: false,
          };
        }

        // Collectible collisions - more forgiving for collection with combo system
        let newScore = prev.score;
        let newCombo = prev.combo;
        let newShields = prev.shields;
        let newMagnetUntil = prev.magnetUntil;
        let newChallenges = prev.challenges.map((c) => ({ ...c }));
        const collectedIds: string[] = [];
        
        // Reset combo if too much time passed (2 seconds)
        if (now - prev.lastCollectTime > 2000) {
          newCombo = 0;
        }
        
        newCollectibles.forEach((col) => {
          // Collectible: bottom from col.y to col.y + col.height
          const colBottomMin = col.y;
          const colBottomMax = col.y + col.height;
          const collectPadding = now < prev.magnetUntil ? -30 : -10; // Magnet makes pickups easier
          
          // Check if rectangles overlap (X and Y) - easier to collect
          if (
            // X overlap with more forgiving padding
            100 + collectPadding < col.x + col.width - collectPadding &&
            100 + playerHeight - collectPadding > col.x + collectPadding &&
            // Y overlap (using bottom coordinates) with more forgiving padding
            playerBottomMin + collectPadding < colBottomMax - collectPadding &&
            playerBottomMax - collectPadding > colBottomMin + collectPadding
          ) {
            collectedIds.push(col.id);
            
            // Increase combo if collected quickly
            if (now - prev.lastCollectTime < 2000) {
              newCombo = Math.min(prev.combo + 1, 10); // Max combo of 10x
            } else {
              newCombo = 1; // Start new combo
            }
            
            // Base points
            const basePoints = col.type === 'gift' ? 50 : 10;
            // Speed bonus - medium at higher speeds
            const speedBonus = Math.floor(prev.gameSpeed * 2);
            // Combo multiplier (1x to 2x) - balanced reward
            const comboMultiplier = 1 + (newCombo * 0.1);

            if (col.type === 'shield') {
              newShields = Math.min(prev.shields + 1, 2);
              newScore += 15;
              newMagnetUntil = prev.magnetUntil; // unchanged
            } else if (col.type === 'magnet') {
              newMagnetUntil = now + MAGNET_DURATION;
              newScore += 20;
            } else {
              newScore += Math.floor((basePoints + speedBonus) * comboMultiplier * eventScoreBoost);
            }

            // Update challenges
            newChallenges = newChallenges.map((c) => {
              if (c.completed) return c;
              if (c.type === 'collect_snow' && col.type === 'snowflake') {
                const progress = Math.min(c.target, c.progress + 1);
                return { ...c, progress, completed: progress >= c.target };
              }
              if (c.type === 'collect_gift' && col.type === 'gift') {
                const progress = Math.min(c.target, c.progress + 1);
                return { ...c, progress, completed: progress >= c.target };
              }
              return c;
            });
          }
        });

        // Survive challenge ticking (~60 FPS approximation)
        newChallenges = newChallenges.map((c) => {
          if (c.completed) return c;
          if (c.type === 'survive') {
            const progress = Math.min(c.target, c.progress + 0.016);
            return { ...c, progress, completed: progress >= c.target };
          }
          return c;
        });

        // Grant rewards for newly completed challenges
        newChallenges.forEach((c) => {
          const wasCompleted = prev.challenges.find((pc) => pc.id === c.id)?.completed;
          if (!wasCompleted && c.completed) {
            if (c.reward === 'shield') {
              newShields = Math.min(newShields + 1, 2);
            } else if (c.reward === 'magnet') {
              newMagnetUntil = Math.max(newMagnetUntil, now + MAGNET_DURATION);
            } else if (c.reward === 'dash') {
              newDashCharges = Math.min(MAX_DASHES, newDashCharges + 1);
            } else if (c.reward === 'points') {
              newScore += 120;
            }
            // Haptic tap on reward
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(40);
            }
          }
        });

        const remainingCollectibles = newCollectibles.filter(
          (col) => !collectedIds.includes(col.id)
        ).slice(-60);
        const cappedObstacles = newObstacles.slice(-60);
        const cappedPlatforms = newPlatforms.slice(-20);

        const levelIndex = getLevelIndex(newScore);
        const level = LEVELS[levelIndex];
        // Increase game speed over time - smoother ramp with per-level caps + purchased start bonus
        const newGameSpeed = Math.min(level.speedCap, BASE_GAME_SPEED + startSpeedBonus + prev.score / 700);

        return {
          ...prev,
          playerY: newPlayerY,
          playerVelocity: newPlayerVelocity,
          obstacles: cappedObstacles,
          platforms: cappedPlatforms,
          collectibles: remainingCollectibles,
          score: newScore,
          gameSpeed: newGameSpeed,
          combo: collectedIds.length > 0 ? newCombo : (now - prev.lastCollectTime > 2000 ? 0 : prev.combo),
          lastCollectTime: collectedIds.length > 0 ? now : prev.lastCollectTime,
          jumpsLeft: newJumpsLeft,
          dashCharges: newDashCharges,
          dashRechargeAt: newDashRechargeAt,
          dashActiveUntil: newDashActiveUntil,
          isSliding: newIsSliding,
          slideEndTime: newSlideEnd,
          shields: newShields,
          invulnerableUntil: collidedObstacle
            ? now + INVULNERABLE_MS
            : prev.invulnerableUntil > now
              ? prev.invulnerableUntil
              : 0,
          magnetUntil: newMagnetUntil,
          levelIndex,
          currentEvent: newCurrentEvent,
          eventEndsAt: newCurrentEvent === 'none' ? 0 : newEventEndsAt,
          startGraceUntil: prev.startGraceUntil,
          challenges: newChallenges,
          activePhase: newPhase,
          phaseEndsAt: newPhaseEndsAt,
        };
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, spawnStartX]);

  const startGame = useCallback(() => {
    if (!canPlay) {
      return;
    }

    const now = Date.now();
    // Reset wave system
    currentWave.current = null;
    waveStartTime.current = 0;
    waveIndex.current = 0;
    nextWaveTime.current = 0;
    lastObstacleTime.current = 0;
    lastCollectibleTime.current = 0;
    scheduleNextEvent(Date.now());
    nextPhaseAt.current = now + PHASE_DURATION_MS;
    runCountSinceLoot.current += 1;

    // Apply pending loot effects
    let initialShields = 0;
    let initialMagnetUntil = 0;
    let initialDashCharges = MAX_DASHES;
    let initialScore = 0;
    if (pendingLootEffect) {
      if (pendingLootEffect.shields) initialShields = pendingLootEffect.shields;
      if (pendingLootEffect.magnet) initialMagnetUntil = now + MAGNET_DURATION;
      if (pendingLootEffect.dash) initialDashCharges = Math.min(MAX_DASHES, MAX_DASHES + 1);
      if (pendingLootEffect.bonusScore) initialScore = pendingLootEffect.bonusScore;
      setPendingLootEffect(null);
    }

    const baseSpeed = BASE_GAME_SPEED + startSpeedBonus;
    setGameState({
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: initialScore,
      levelIndex: 0,
      playerY: GROUND_Y,
      playerVelocity: 0,
      jumpsLeft: MAX_JUMPS,
      dashCharges: initialDashCharges,
      dashRechargeAt: 0,
      dashActiveUntil: 0,
      isSliding: false,
      slideEndTime: 0,
      platforms: [],
      obstacles: [],
      collectibles: [],
      gameSpeed: baseSpeed,
      combo: 0,
      lastCollectTime: 0,
      shields: initialShields,
      invulnerableUntil: 0,
      magnetUntil: initialMagnetUntil,
      currentEvent: 'none',
      eventEndsAt: 0,
      startGraceUntil: now + 1200,
      challenges: generateChallenges(),
      activePhase: 'calm',
      phaseEndsAt: now + PHASE_DURATION_MS,
    });
  }, [canPlay, scheduleNextEvent, generateChallenges, pendingLootEffect, startSpeedBonus]);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;
    if (gameState.jumpsLeft > 0) {
      setGameState((prev) => ({
        ...prev,
        playerVelocity: JUMP_STRENGTH, // Positive velocity = jumping up
        jumpsLeft: prev.jumpsLeft - 1,
        isSliding: false,
        slideEndTime: 0,
      }));
    }
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, gameState.jumpsLeft]);

  const slide = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;
    if (gameState.playerY <= GROUND_Y + 2) {
      const now = Date.now();
      setGameState((prev) => ({
        ...prev,
        isSliding: true,
        slideEndTime: now + SLIDE_DURATION,
        playerVelocity: Math.min(prev.playerVelocity, 0), // cancel upward momentum
      }));
    }
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, gameState.playerY]);

  const dash = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;
    const now = Date.now();
    setGameState((prev) => {
      if (prev.dashCharges <= 0) return prev;
      return {
        ...prev,
        dashCharges: prev.dashCharges - 1,
        dashRechargeAt: prev.dashCharges - 1 < MAX_DASHES ? now + DASH_COOLDOWN_MS : prev.dashRechargeAt || now + DASH_COOLDOWN_MS,
        dashActiveUntil: now + DASH_DURATION_MS,
        invulnerableUntil: Math.max(prev.invulnerableUntil, now + DASH_DURATION_MS),
      };
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver]);

  const pauseGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const purchaseUpgrade = useCallback((type: UpgradeType) => {
    const cost = UPGRADE_COSTS[type];
    setGameState((prev) => {
      if (!prev.isPlaying || prev.isGameOver) return prev;

      // Handle cosmetic unlocks separately so they can reuse unlocked state
      if (type === 'skinFrost' || type === 'skinBlaze') {
        const alreadyUnlocked = type === 'skinFrost' ? unlockedSkins.frost : unlockedSkins.blaze;
        if (!alreadyUnlocked && prev.score < cost) return prev;
        const nextScore = alreadyUnlocked ? prev.score : prev.score - cost;
        setUnlockedSkins((u) => ({
          ...u,
          frost: u.frost || type === 'skinFrost',
          blaze: u.blaze || type === 'skinBlaze',
        }));
        setPlayerSkin(type === 'skinFrost' ? 'frost' : 'blaze');
        return { ...prev, score: nextScore };
      }

      if (prev.score < cost) return prev;
      const now = Date.now();
      const nextState = {
        ...prev,
        score: prev.score - cost,
      };

      if (type === 'shield') {
        nextState.shields = Math.min(prev.shields + 1, 3);
      } else if (type === 'dash') {
        nextState.dashCharges = Math.min(prev.dashCharges + 1, MAX_DASHES + 1);
        nextState.dashRechargeAt = 0;
      } else if (type === 'magnet') {
        nextState.magnetUntil = Math.max(prev.magnetUntil, now + MAGNET_DURATION);
      } else if (type === 'speed') {
        const levelCap = LEVELS[Math.max(0, prev.levelIndex)].speedCap;
        nextState.gameSpeed = Math.min(prev.gameSpeed + 0.15, levelCap);
      } else if (type === 'startSpeed') {
        setStartSpeedBonus((bonus) => Math.min(bonus + 0.2, 1.2));
        const levelCap = LEVELS[Math.max(0, prev.levelIndex)].speedCap;
        nextState.gameSpeed = Math.min(prev.gameSpeed + 0.2, levelCap);
      }

      return nextState;
    });
  }, [unlockedSkins, startSpeedBonus]);

  const endGame = useCallback(async () => {
    try {
      const submitRes = await submitScore(gameState.score, walletAddress || undefined);
      if (submitRes?.dailyRunCount !== undefined) {
        setDailyRunCount(submitRes.dailyRunCount);
      }
      const stats = await getUserStats(walletAddress || undefined);
      setDailyRunCount(stats.dailyRunCount);
    } catch (error) {
      console.error('Error submitting score:', error);
    }

    // Lootbox reward (every 3 runs or big score)
    const shouldDropLoot = runCountSinceLoot.current >= 3 || gameState.score >= 600;
    if (shouldDropLoot) {
      runCountSinceLoot.current = 0;
      const rewards: { label: string; kind: LootKind }[] = [
        { label: 'Shield boost', kind: 'shield' },
        { label: 'Magnet boost', kind: 'magnet' },
        { label: 'Dash charge', kind: 'dash' },
        { label: '+200 points next run', kind: 'points' },
      ];
      const reward = rewards[Math.floor(Math.random() * rewards.length)];
      setLootboxReward(reward.label);
      setPendingLootEffect({ label: reward.label, rewardKind: reward.kind });
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([80, 40, 80]);
    }
  }, [gameState.score, walletAddress]);

  // Submit score when game ends
  useEffect(() => {
    if (gameState.isGameOver) {
      endGame();
    }
  }, [gameState.isGameOver, endGame]);

  const nextLevelScore = LEVELS[gameState.levelIndex + 1]?.minScore ?? null;
  const currentLevel = LEVELS[gameState.levelIndex];

  return {
    gameState,
    startGame,
    jump,
    slide,
    dash,
    pauseGame,
    dailyRunCount,
    canPlay,
    nextLevelScore,
    currentLevel,
    lootboxReward,
    claimLootbox: () => {
      if (!lootboxReward) return;
      const rewardName = lootboxReward;
      const effect: {
        shields?: number;
        magnet?: boolean;
        dash?: boolean;
        bonusScore?: number;
        label: string;
        rewardKind?: LootKind;
      } = { label: rewardName };
      if (rewardName === 'Shield boost') effect.shields = 1, effect.rewardKind = 'shield';
      if (rewardName === 'Magnet boost') effect.magnet = true, effect.rewardKind = 'magnet';
      if (rewardName === 'Dash charge') effect.dash = true, effect.rewardKind = 'dash';
      if (rewardName === '+200 points next run') effect.bonusScore = 200, effect.rewardKind = 'points';
      setPendingLootEffect(effect);
      setLootboxReward(null);
    },
    pendingLootEffect,
    purchaseUpgrade,
    playerSkin,
    unlockedSkins,
  };
};
