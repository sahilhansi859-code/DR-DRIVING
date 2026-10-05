import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause,
  RotateCcw, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Car as CarIcon,
  Home,
  Coins
} from 'lucide-react';
import { Enemy, GameState, GameMode, CarStyle } from './types';
import { SettingsModal } from './components/SettingsModal';
import { CarGarageModal } from './components/CarGarageModal';
import { CARS_LIST } from './data/cars';
import drDrivingBgImg from './assets/images/dr_driving_bg_notext_1789052245745.jpg';
import drDrivingGameIcon from './assets/images/dr_driving_nano_logo_1789057268392.jpg';

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 560;
const ROAD_LEFT = 16;
const ROAD_WIDTH = CANVAS_WIDTH - 32; // 288px
const ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH; // 304px
const TOTAL_LANES = 5;
const LANE_WIDTH = ROAD_WIDTH / TOTAL_LANES; // 57.6px per lane
const CAR_WIDTH = 34;
const CAR_HEIGHT = 64;

const drawCoin = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) => {
  ctx.save();
  ctx.translate(x, y);

  // 3D wobble / rotation on horizontal axis
  const wobble = Math.cos(tick * 0.08);
  const scaleX = Math.abs(wobble) < 0.2 ? 0.2 : wobble;
  ctx.scale(scaleX, 1);

  // Outer golden glow
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 8;

  // Outer dark gold rim
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#b45309';
  ctx.fill();

  // Outer shiny gold ring
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();

  // Inner face with gradient
  ctx.beginPath();
  ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8.5);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.6, '#facc15');
  grad.addColorStop(1, '#eab308');
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner coin ring
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center star
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, 0.5);

  ctx.restore();
};

const drawFloatingText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opacity: number) => {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 6;
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
};

const drawCar = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  color: string, 
  isHeadlightsOn: boolean = false,
  style: CarStyle = 'sedan',
  secondaryColor: string = '#ffffff',
  sirenTick: number = 0,
  indicator: 'left' | 'right' | null = null,
  isChangingLane: boolean = false
) => {
  const w = CAR_WIDTH;
  const h = CAR_HEIGHT;
  
  ctx.save();
  ctx.translate(x, y);

  // Subtle steering angle tilt when actively overtaking / changing lanes
  if (isChangingLane && indicator) {
    ctx.rotate(indicator === 'left' ? -0.075 : 0.075);
  }

  // Headlight beam effect in night mode
  if (isHeadlightsOn) {
    const grad = ctx.createLinearGradient(0, -h / 2, 0, -h / 2 - 130);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 5, -h / 2);
    ctx.lineTo(-w - 18, -h / 2 - 130);
    ctx.lineTo(w + 18, -h / 2 - 130);
    ctx.lineTo(w / 2 - 5, -h / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Underglow for Supercar
  if (style === 'supercar') {
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
  }

  // Tires
  ctx.fillStyle = '#111827';
  ctx.fillRect(-w / 2 - 2, -h / 2 + 10, 4, 15);
  ctx.fillRect(w / 2 - 2, -h / 2 + 10, 4, 15);
  ctx.fillRect(-w / 2 - 2, h / 2 - 25, 4, 15);
  ctx.fillRect(w / 2 - 2, h / 2 - 25, 4, 15);
  ctx.shadowBlur = 0;

  // Main Car Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 8);
  ctx.fill();

  // Custom visual details depending on Car Style
  if (style === 'sports') {
    // Twin Racing Stripes down the center
    ctx.fillStyle = secondaryColor || '#ffffff';
    ctx.fillRect(-3, -h / 2, 2.5, h);
    ctx.fillRect(1, -h / 2, 2.5, h);

    // Rear Downforce Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-w / 2 - 2, h / 2 - 3, w + 4, 4);
    ctx.fillStyle = '#374151';
    ctx.fillRect(-w / 4, h / 2 - 5, 2, 3);
    ctx.fillRect(w / 4 - 2, h / 2 - 5, 2, 3);
  } else if (style === 'taxi') {
    // Checkered roof decals
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-w / 2 + 3, -1, w - 6, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-12, -1, 4, 3);
    ctx.fillRect(-4, -1, 4, 3);
    ctx.fillRect(4, -1, 4, 3);
    ctx.fillRect(12, -1, 4, 3);

    // TAXI Roof Light
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8, -6, 16, 5);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 4px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, -2);
  } else if (style === 'police') {
    // White doors / roof panel
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-w / 2 + 2, -10, w - 4, 20);

    // Emergency Flashing Beacon
    const isRedLeft = Math.floor(sirenTick / 8) % 2 === 0;
    ctx.fillStyle = isRedLeft ? '#ef4444' : '#3b82f6';
    ctx.fillRect(-8, -5, 7, 4);
    ctx.fillStyle = isRedLeft ? '#3b82f6' : '#ef4444';
    ctx.fillRect(1, -5, 7, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -5, 2, 4);
  } else if (style === 'supercar') {
    // Neon aerodynamic front splitter & side fins
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(-w / 2, -h / 2, 6, 3);
    ctx.fillRect(w / 2 - 6, -h / 2, 6, 3);
    ctx.fillRect(-w / 2 - 1, -10, 2, 20);
    ctx.fillRect(w / 2 - 1, -10, 2, 20);
    // Rear Diffuser
    ctx.fillRect(-w / 2 + 4, h / 2 - 2, w - 8, 3);
  } else if (style === 'muscle') {
    // Orange hood stripes & bonnet scoop
    ctx.fillStyle = secondaryColor || '#f97316';
    ctx.fillRect(-6, -h / 2, 3.5, 28);
    ctx.fillRect(2.5, -h / 2, 3.5, 28);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-5, -h / 2 + 10, 10, 5);
  }

  // Windshield
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 4, -h / 2 + 15, w - 8, 15, 3);
  ctx.fill();

  // Rear window
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 6, h / 2 - 15, w - 12, 10, 2);
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-w / 2 + 4, -h / 2 - 2, 8, 4);
  ctx.fillRect(w / 2 - 12, -h / 2 - 2, 8, 4);
  
  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-w / 2 + 4, h / 2 - 2, 8, 4);
  ctx.fillRect(w / 2 - 12, h / 2 - 2, 8, 4);

  // Left / Right Turn Signal Indicators (Blink when overtaking)
  if (indicator) {
    const isBlinkOn = Math.floor(sirenTick / 6) % 2 === 0;
    if (isBlinkOn) {
      const isLeft = indicator === 'left';
      const cornerX = isLeft ? -w / 2 - 1 : w / 2 - 4;
      const sideX = isLeft ? -w / 2 - 3 : w / 2;

      ctx.save();
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fbbf24';

      // Front corner blinker
      ctx.fillRect(cornerX, -h / 2 - 2, 5, 5);
      // Side mirror blinker
      ctx.fillRect(sideX, -h / 2 + 14, 3, 6);
      // Rear corner blinker
      ctx.fillRect(cornerX, h / 2 - 3, 5, 5);

      // Small glowing directional chevron beside the car so player spots overtake intent clearly
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isLeft ? '‹' : '›', isLeft ? -w / 2 - 8 : w / 2 + 8, 0);
      ctx.restore();
    }
  }

  ctx.restore();
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [coinsDisplay, setCoinsDisplay] = useState(0);

  // Total Coins collected and saved
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    const saved = localStorage.getItem('dr_driving_total_coins');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  // Best High Score persistence
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('dr_driving_highscore');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  // Modals state: Settings & Car Garage
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGarageOpen, setIsGarageOpen] = useState(false);

  // Active Car selection
  const [selectedCarId, setSelectedCarId] = useState<string>(() => {
    const saved = localStorage.getItem('dr_driving_selected_car');
    return saved && CARS_LIST.some(c => c.id === saved) ? saved : CARS_LIST[0].id;
  });

  // Mode: Day or Night
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const saved = localStorage.getItem('dr_driving_mode');
    return (saved === 'night' || saved === 'day') ? saved : 'day';
  });

  // Audio system state
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('dr_driving_volume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('dr_driving_muted');
    return saved === 'true';
  });
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('dr_driving_music_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const crashAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMusicEnabledRef = useRef<boolean>(isMusicEnabled);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const coinAudioPool = useRef<HTMLAudioElement[]>([]);
  const coinAudioIndex = useRef<number>(0);

  // Preload coin sound elements so they play with zero latency
  useEffect(() => {
    const pool: HTMLAudioElement[] = [];
    for (let i = 0; i < 6; i++) {
      const a = new Audio('/coin-collect.wav');
      a.preload = 'auto';
      pool.push(a);
    }
    coinAudioPool.current = pool;
  }, []);

  // Initialize or resume Web Audio on user gesture
  const initOrResumeAudio = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      }
    } catch {}
  }, []);

  // Play crisp, vibrant arcade coin collect sound
  const playCoinSound = useCallback(() => {
    if (isMuted || volume === 0) return;

    // 1. Play from preloaded HTML5 audio pool (instant & independent of AudioContext state)
    try {
      if (coinAudioPool.current && coinAudioPool.current.length > 0) {
        const sound = coinAudioPool.current[coinAudioIndex.current % coinAudioPool.current.length];
        coinAudioIndex.current++;
        sound.volume = Math.min(1, Math.max(0.25, volume));
        sound.currentTime = 0;
        sound.play().catch(() => {});
      } else {
        const sound = new Audio('/coin-collect.wav');
        sound.volume = Math.min(1, Math.max(0.25, volume));
        sound.play().catch(() => {});
      }
    } catch {}

    // 2. Also trigger Web Audio synthesizer chime for rich layered coin sparkle
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        if (ctx.state === 'running') {
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';

          // Melodic two-step coin pickup (B5 -> E6)
          osc1.frequency.setValueAtTime(987.77, now);
          osc1.frequency.setValueAtTime(1318.51, now + 0.07);

          // Harmonic shimmer
          osc2.frequency.setValueAtTime(1975.53, now);
          osc2.frequency.setValueAtTime(2637.02, now + 0.07);

          const coinVol = Math.min(0.45, Math.max(0.12, volume * 0.45));
          gain.gain.setValueAtTime(coinVol, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.32);
          osc2.stop(now + 0.32);
        }
      }
    } catch {}
  }, [volume, isMuted]);

  // Sync ref and persist preference
  useEffect(() => {
    isMusicEnabledRef.current = isMusicEnabled;
    localStorage.setItem('dr_driving_music_enabled', isMusicEnabled ? 'true' : 'false');
  }, [isMusicEnabled]);
  
  const reqRef = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const nextCoinId = useRef<number>(1);
  const coinSpawnCounter = useRef<number>(0);

  const gameState = useRef<GameState>({
    playerX: ROAD_LEFT + LANE_WIDTH * 2.5,
    playerY: CANVAS_HEIGHT - 100,
    speed: 5,
    score: 0,
    coins: [],
    coinsCollected: 0,
    floatingTexts: [],
    enemies: [],
    roadLines: [0, 150, 300, 450, 600],
    gameOver: false,
    isPlaying: false,
    isPaused: false,
    keys: {}
  });

  // Initialize and manage continuous background music and sound effects
  useEffect(() => {
    const bgAudio = new Audio('/dr-driving-theme.mp3');
    bgAudio.loop = true;
    bgAudio.volume = isMuted ? 0 : volume;
    bgMusicRef.current = bgAudio;

    const crashAudio = new Audio('/dr-driving-crash.mp3');
    crashAudio.volume = isMuted ? 0 : volume;
    crashAudioRef.current = crashAudio;

    // Direct event sync with audio state
    const onPlay = () => setIsPlayingMusic(true);
    const onPause = () => setIsPlayingMusic(false);
    const onEnded = () => {
      // Loop backup: seamlessly restart if loop is interrupted
      if (isMusicEnabledRef.current) {
        bgAudio.currentTime = 0;
        bgAudio.play().catch(() => {});
      }
    };

    bgAudio.addEventListener('play', onPlay);
    bgAudio.addEventListener('pause', onPause);
    bgAudio.addEventListener('ended', onEnded);

    // If music is enabled by user, start playing
    if (isMusicEnabledRef.current) {
      bgAudio.play()
        .then(() => {
          setIsPlayingMusic(true);
        })
        .catch(() => {
          // Autoplay policy restriction - will start on first user interaction
        });
    }

    // Auto-resume music on any user interaction ONLY IF music is enabled
    const handleUserInteraction = () => {
      if (isMusicEnabledRef.current && bgAudio.paused) {
        bgAudio.play()
          .then(() => setIsPlayingMusic(true))
          .catch(() => {});
      }
    };

    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);

    // Auto-resume when tab becomes visible again if music is enabled
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMusicEnabledRef.current && bgAudio.paused) {
        bgAudio.play().then(() => setIsPlayingMusic(true)).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      bgAudio.pause();
      bgAudio.removeEventListener('play', onPlay);
      bgAudio.removeEventListener('pause', onPause);
      bgAudio.removeEventListener('ended', onEnded);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update volume and mute state dynamically
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = effectiveVol;
    }
    if (crashAudioRef.current) {
      crashAudioRef.current.volume = effectiveVol;
    }
    localStorage.setItem('dr_driving_volume', volume.toString());
    localStorage.setItem('dr_driving_muted', isMuted ? 'true' : 'false');
  }, [volume, isMuted]);

  // Persist settings changes
  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode);
    localStorage.setItem('dr_driving_mode', mode);
  };

  const handleSelectCar = (carId: string) => {
    setSelectedCarId(carId);
    localStorage.setItem('dr_driving_selected_car', carId);
  };

  const handleClaimCar = (carId: string, coinPrice: number) => {
    setTotalCoins(prev => {
      const remaining = Math.max(0, prev - coinPrice);
      localStorage.setItem('dr_driving_total_coins', remaining.toString());
      return remaining;
    });
    handleSelectCar(carId);
    playCoinSound();
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
    if (isMusicEnabledRef.current && bgMusicRef.current && bgMusicRef.current.paused) {
      bgMusicRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    if (isMusicEnabledRef.current && bgMusicRef.current && bgMusicRef.current.paused) {
      bgMusicRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  const handleToggleMusicPlay = () => {
    const nextState = !isMusicEnabled;
    setIsMusicEnabled(nextState);
    isMusicEnabledRef.current = nextState;
    localStorage.setItem('dr_driving_music_enabled', nextState ? 'true' : 'false');

    if (nextState) {
      // User turned music ON: Start immediately and keep playing
      if (bgMusicRef.current) {
        bgMusicRef.current.volume = isMuted ? 0 : volume;
        bgMusicRef.current.play()
          .then(() => setIsPlayingMusic(true))
          .catch(() => {});
      }
    } else {
      // User turned music OFF: Stop immediately and stay stopped
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        setIsPlayingMusic(false);
      }
    }
  };

  const handleKey = useCallback((key: string, isDown: boolean) => {
    if (isDown) {
      initOrResumeAudio();
    }
    gameState.current.keys[key] = isDown;
  }, [initOrResumeAudio]);

  const startGame = () => {
    initOrResumeAudio();
    if (isMusicEnabledRef.current && bgMusicRef.current && bgMusicRef.current.paused) {
      bgMusicRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }

    gameState.current = {
      playerX: ROAD_LEFT + LANE_WIDTH * 2.5,
      playerY: CANVAS_HEIGHT - 100,
      speed: 5,
      score: 0,
      coins: [],
      coinsCollected: 0,
      floatingTexts: [],
      enemies: [],
      roadLines: [0, 150, 300, 450, 600],
      gameOver: false,
      isPlaying: true,
      isPaused: false,
      keys: {}
    };
    setIsGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setScoreDisplay(0);
    setCoinsDisplay(0);
    coinSpawnCounter.current = 0;
  };

  const goToHome = () => {
    gameState.current = {
      playerX: ROAD_LEFT + LANE_WIDTH * 2.5,
      playerY: CANVAS_HEIGHT - 100,
      speed: 5,
      score: 0,
      coins: [],
      coinsCollected: 0,
      floatingTexts: [],
      enemies: [],
      roadLines: [0, 150, 300, 450, 600],
      gameOver: false,
      isPlaying: false,
      isPaused: false,
      keys: {}
    };
    setIsGameOver(false);
    setIsPlaying(false);
    setIsPaused(false);
    setScoreDisplay(0);
    setCoinsDisplay(0);
  };

  const togglePause = useCallback(() => {
    if (!gameState.current.isPlaying || gameState.current.gameOver) return;
    setIsPaused(prev => {
      const next = !prev;
      gameState.current.isPaused = next;
      return next;
    });
  }, []);

  const gameLoop = useCallback(() => {
    const state = gameState.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const currentCar = CARS_LIST.find(c => c.id === selectedCarId) || CARS_LIST[0];

    if (state.isPlaying && !state.gameOver && !state.isPaused) {
      // Input Handling powered by selected car's handling agility
      const handlingStep = currentCar.handling;
      if ((state.keys['ArrowLeft'] || state.keys['a']) && state.playerX > ROAD_LEFT + CAR_WIDTH / 2 + 4) {
        state.playerX -= handlingStep;
      }
      if ((state.keys['ArrowRight'] || state.keys['d']) && state.playerX < ROAD_RIGHT - CAR_WIDTH / 2 - 4) {
        state.playerX += handlingStep;
      }
      
      // Acceleration & Max Speed based on chosen car
      if (state.keys['ArrowUp'] || state.keys['w']) {
        state.speed = Math.min(state.speed + currentCar.acceleration, currentCar.maxSpeed);
      } else if (state.keys['ArrowDown'] || state.keys['s']) {
        state.speed = Math.max(state.speed - 0.28, 2);
      } else {
        // Auto return to cruise speed
        const cruiseSpeed = Math.min(5.5, currentCar.maxSpeed * 0.75);
        if (state.speed > cruiseSpeed + 0.1) state.speed -= 0.08;
        else if (state.speed < cruiseSpeed - 0.1) state.speed += 0.08;
      }

      // Update Score
      state.score += state.speed * 0.02;
      frameCount.current++;
      if (frameCount.current % 10 === 0) {
        const currentIntScore = Math.floor(state.score);
        setScoreDisplay(currentIntScore);
      }

      // Move Road Lines
      for (let i = 0; i < state.roadLines.length; i++) {
        state.roadLines[i] += state.speed;
        if (state.roadLines[i] > CANVAS_HEIGHT) {
          state.roadLines[i] -= CANVAS_HEIGHT + 150; 
        }
      }

      // Spawn Enemies across 5 lanes
      const spawnRate = Math.min(0.016 + (state.score / 9000), 0.045);
      if (Math.random() < spawnRate && state.enemies.length < 6) {
        const lane = Math.floor(Math.random() * TOTAL_LANES);
        const x = ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;
        
        const isOccupied = state.enemies.some(e => Math.abs(e.x - x) < LANE_WIDTH * 0.75 && e.y < 200);
        if (!isOccupied) {
          const colors = ['#e74c3c', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c', '#ffffff', '#3b82f6'];
          // Only a few cars (~20%) are eligible to perform a side overtake once score reaches 250+
          const willOvertake = Math.random() < 0.2;
          const overtakeTriggerY = 40 + Math.random() * 120;
          state.enemies.push({
            x,
            y: -100,
            speed: Math.random() * 2.2 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            lane,
            willOvertake,
            overtakeTriggerY,
            indicator: null,
            indicatorTimer: 0,
            isChangingLane: false,
            hasChangedLane: false,
          });
        }
      }

      // Update & Collide Enemies
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        enemy.y += (state.speed - enemy.speed * 0.4);

        // After score reaches 250, only a few eligible enemy cars signal left/right and side-overtake
        const anotherCarAlreadyOvertaking = state.enemies.some(
          other => other !== enemy && (other.indicator || other.isChangingLane)
        );

        if (
          state.score >= 250 &&
          enemy.willOvertake &&
          !enemy.hasChangedLane &&
          !enemy.indicator &&
          !anotherCarAlreadyOvertaking
        ) {
          const carAheadInLane = state.enemies.find(
            other =>
              other !== enemy &&
              other.lane === enemy.lane &&
              other.y < enemy.y &&
              enemy.y - other.y < 145
          );
          const shouldTriggerOvertake =
            Boolean(carAheadInLane) ||
            (enemy.y >= (enemy.overtakeTriggerY ?? 70) && enemy.y < 220);

          if (shouldTriggerOvertake) {
            const candidateLanes: number[] = [];
            if (enemy.lane > 0) candidateLanes.push(enemy.lane - 1);
            if (enemy.lane < TOTAL_LANES - 1) candidateLanes.push(enemy.lane + 1);

            // Randomize left/right preference
            if (candidateLanes.length === 2 && Math.random() < 0.5) {
              candidateLanes.reverse();
            }

            const safeTargetLane = candidateLanes.find(candLane => {
              const candX = ROAD_LEFT + candLane * LANE_WIDTH + LANE_WIDTH / 2;
              const blockedByEnemy = state.enemies.some(
                other =>
                  other !== enemy &&
                  (other.lane === candLane || other.targetLane === candLane || Math.abs(other.x - candX) < LANE_WIDTH * 0.8) &&
                  Math.abs(other.y - enemy.y) < CAR_HEIGHT * 1.65
              );
              const blockedSideByPlayer =
                Math.abs(state.playerX - candX) < LANE_WIDTH * 0.75 &&
                Math.abs(state.playerY - enemy.y) < CAR_HEIGHT * 0.95;
              return !blockedByEnemy && !blockedSideByPlayer;
            });

            if (safeTargetLane !== undefined) {
              enemy.targetLane = safeTargetLane;
              enemy.indicator = safeTargetLane < enemy.lane ? 'left' : 'right';
              // Blink indicator for ~22 frames before moving sideways so player sees turn signal
              enemy.indicatorTimer = 22;
              enemy.isChangingLane = false;
            } else if (enemy.y > 230) {
              enemy.hasChangedLane = true;
            }
          }
        }

        // Process active indicator & smooth lateral side-overtake movement
        if (enemy.indicator && enemy.targetLane !== undefined) {
          if (!enemy.isChangingLane) {
            enemy.indicatorTimer = (enemy.indicatorTimer ?? 0) - 1;
            if ((enemy.indicatorTimer ?? 0) <= 0) {
              const targetX = ROAD_LEFT + enemy.targetLane * LANE_WIDTH + LANE_WIDTH / 2;
              const stillClear = !state.enemies.some(
                other =>
                  other !== enemy &&
                  Math.abs(other.x - targetX) < LANE_WIDTH * 0.8 &&
                  Math.abs(other.y - enemy.y) < CAR_HEIGHT * 1.25
              );
              if (stillClear) {
                enemy.isChangingLane = true;
                // Slight speed boost during overtake
                enemy.speed = Math.min(enemy.speed + 0.55, 3.6);
              } else {
                enemy.indicator = null;
                enemy.targetLane = undefined;
                enemy.hasChangedLane = true;
              }
            }
          } else {
            const targetX = ROAD_LEFT + enemy.targetLane * LANE_WIDTH + LANE_WIDTH / 2;
            const lateralSpeed = 1.65;
            const diffX = targetX - enemy.x;
            if (Math.abs(diffX) <= lateralSpeed) {
              enemy.x = targetX;
              enemy.lane = enemy.targetLane;
              enemy.isChangingLane = false;
              enemy.hasChangedLane = true;
              enemy.indicator = null;
              enemy.targetLane = undefined;
            } else {
              enemy.x += Math.sign(diffX) * lateralSpeed;
            }
          }
        }

        // Prevent enemy cars in the same lane from overlapping each other vertically
        for (let j = 0; j < state.enemies.length; j++) {
          const other = state.enemies[j];
          if (
            other !== enemy &&
            Math.abs(other.x - enemy.x) < CAR_WIDTH * 0.8 &&
            other.y < enemy.y &&
            enemy.y - other.y < CAR_HEIGHT + 14
          ) {
            enemy.y = other.y + CAR_HEIGHT + 14;
            enemy.speed = Math.min(enemy.speed, other.speed);
          }
        }

        // AABB Collision
        const marginX = CAR_WIDTH * 0.75;
        const marginY = CAR_HEIGHT * 0.75;
        if (
          Math.abs(state.playerX - enemy.x) < marginX &&
          Math.abs(state.playerY - enemy.y) < marginY
        ) {
          state.gameOver = true;
          setIsGameOver(true);
          setIsPlaying(false);

          const finalScore = Math.floor(state.score);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('dr_driving_highscore', finalScore.toString());
          }

          if (crashAudioRef.current) {
            crashAudioRef.current.currentTime = 0;
            crashAudioRef.current.play().catch(() => {});
          }
        }

        if (enemy.y > CANVAS_HEIGHT + 100) {
          state.enemies.splice(i, 1);
        }
      }

      // Spawn Coins "thode thode" (spaced out intervals, 1 or occasionally 2 coins)
      coinSpawnCounter.current++;
      if (coinSpawnCounter.current >= 135 && state.coins.length < 5) {
        if (Math.random() < 0.35) {
          coinSpawnCounter.current = 0;
          const lane = Math.floor(Math.random() * TOTAL_LANES);
          const coinX = ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;

          // Check no enemy car is near the top spawn zone in this lane
          const nearEnemy = state.enemies.some(
            e => Math.abs(e.x - coinX) < LANE_WIDTH * 0.75 && e.y < 130
          );

          if (!nearEnemy) {
            const count = Math.random() < 0.25 ? 2 : 1;
            for (let c = 0; c < count; c++) {
              state.coins.push({
                id: nextCoinId.current++,
                x: coinX,
                y: -35 - c * 50,
              });
            }
          }
        }
      }

      // Update & Collide Coins with player car
      for (let i = state.coins.length - 1; i >= 0; i--) {
        const coin = state.coins[i];
        coin.y += state.speed;

        // Bounding check with player car
        const dx = Math.abs(state.playerX - coin.x);
        const dy = Math.abs(state.playerY - coin.y);
        if (dx < CAR_WIDTH / 2 + 8 && dy < CAR_HEIGHT / 2 + 8) {
          // Coin collected!
          state.coinsCollected += 1;
          const newCoinCount = state.coinsCollected;
          setCoinsDisplay(newCoinCount);
          setTotalCoins(prev => {
            const next = prev + 1;
            localStorage.setItem('dr_driving_total_coins', next.toString());
            return next;
          });

          playCoinSound();

          // Spawn floating +1 effect
          state.floatingTexts.push({
            id: Math.random(),
            x: coin.x,
            y: coin.y - 8,
            text: '+1',
            opacity: 1,
          });

          state.coins.splice(i, 1);
          continue;
        }

        if (coin.y > CANVAS_HEIGHT + 40) {
          state.coins.splice(i, 1);
        }
      }

      // Update Floating Texts (+1 feedback)
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.y -= 1.3;
        ft.opacity -= 0.03;
        if (ft.opacity <= 0) {
          state.floatingTexts.splice(i, 1);
        }
      }
    }

    // -- Drawing --
    const isNight = gameMode === 'night';
    
    // Road & Environment Colors based on Day/Night Mode
    ctx.fillStyle = isNight ? '#062817' : '#166534';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 5-Lane Asphalt Road
    ctx.fillStyle = isNight ? '#1e293b' : '#334155';
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, CANVAS_HEIGHT);

    // Road Edges (Rumble strips)
    ctx.fillStyle = isNight ? '#64748b' : '#cbd5e1';
    ctx.fillRect(ROAD_LEFT, 0, 4, CANVAS_HEIGHT);
    ctx.fillRect(ROAD_RIGHT - 4, 0, 4, CANVAS_HEIGHT);

    // 5-Lane Dividers (Dividing road into 5 lanes)
    ctx.fillStyle = isNight ? '#94a3b8' : '#cbd5e1';
    state.roadLines.forEach(y => {
      for (let l = 1; l < TOTAL_LANES; l++) {
        ctx.fillRect(ROAD_LEFT + LANE_WIDTH * l - 1.5, y, 3, 40);
      }
    });

    if (state.isPlaying || state.gameOver) {
      // Draw Coins on the road surface
      state.coins.forEach(coin => {
        drawCoin(ctx, coin.x, coin.y, frameCount.current);
      });

      // Draw Player's chosen car with unique livery & aerodynamic style
      drawCar(
        ctx, 
        state.playerX, 
        state.playerY, 
        currentCar.color, 
        isNight, 
        currentCar.style, 
        currentCar.secondaryColor,
        frameCount.current
      );

      // Draw Enemies (with left/right overtake indicators when active)
      state.enemies.forEach(enemy => {
        drawCar(
          ctx,
          enemy.x,
          enemy.y,
          enemy.color,
          isNight,
          'sedan',
          '#ffffff',
          frameCount.current,
          enemy.indicator ?? null,
          Boolean(enemy.isChangingLane)
        );
      });

      // Draw Floating Texts (+1 feedback) over cars
      state.floatingTexts.forEach(ft => {
        drawFloatingText(ctx, ft.text, ft.x, ft.y, ft.opacity);
      });

      // Night vignette overlay for atmospheric feel
      if (isNight) {
        const nightGrad = ctx.createRadialGradient(
          state.playerX, state.playerY - 20, 60,
          state.playerX, state.playerY - 20, 320
        );
        nightGrad.addColorStop(0, 'rgba(3, 7, 18, 0)');
        nightGrad.addColorStop(1, 'rgba(3, 7, 18, 0.7)');
        ctx.fillStyle = nightGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }

    reqRef.current = requestAnimationFrame(gameLoop);
  }, [gameMode, highScore, selectedCarId, playCoinSound]);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(gameLoop);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        togglePause();
        return;
      }
      handleKey(e.key, true);
    };
    const handleKeyUp = (e: KeyboardEvent) => handleKey(e.key, false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(reqRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameLoop, handleKey, togglePause]);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-neutral-950 flex flex-col items-center justify-center font-sans touch-none p-1 sm:p-3 select-none overscroll-none">
      
      {/* Main Game Screen */}
      <div 
        id="game-viewport-container"
        className="relative border-2 sm:border-4 md:border-[6px] border-neutral-800 rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl shadow-black flex items-center justify-center aspect-[320/560] h-full max-h-[calc(100dvh-12px)] max-w-[calc(100vw-8px)] sm:max-h-[640px] sm:max-w-[390px] w-auto"
      >
        
        {/* The Game Canvas */}
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          className="block w-full h-full object-contain pointer-events-none select-none" 
        />

        {/* Top Gameplay HUD: Score & Coins on Left & Pause Button on Right Corner */}
        {isPlaying && (
          <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex items-center justify-between">
            <div className="flex items-center gap-2 pointer-events-auto">
              <div 
                id="hud-score-display"
                className="font-mono text-white text-xs sm:text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-neutral-900/85 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-neutral-700/60 shadow-md"
              >
                SCORE: {scoreDisplay}
              </div>

              <div 
                id="hud-coins-display"
                className="font-mono text-amber-300 text-xs sm:text-sm font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-neutral-900/85 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-amber-500/50 shadow-md flex items-center gap-1.5"
              >
                <Coins size={15} className="text-amber-400" />
                <span>{coinsDisplay}</span>
              </div>
            </div>

            {/* Top Right Corner Pause Button */}
            {!isGameOver && (
              <button
                id="game-pause-btn"
                onClick={togglePause}
                className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900/85 hover:bg-neutral-800 text-white border border-neutral-700 shadow-xl shadow-black/70 transition-transform active:scale-95"
                title={isPaused ? "Resume Game" : "Pause Game"}
                aria-label={isPaused ? "Resume Game" : "Pause Game"}
              >
                {isPaused ? <Play size={18} className="text-green-400 ml-0.5" /> : <Pause size={18} className="text-amber-400" />}
              </button>
            )}
          </div>
        )}

        {/* Start Screen Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white p-5 text-center overflow-hidden">
            {/* Highlighted, Bright and Vibrant Background Image */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <img
                src={drDrivingBgImg}
                alt="Dr Driving Game Artwork"
                className="w-full h-full object-cover opacity-95 scale-105 contrast-115 saturate-125 brightness-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 via-transparent to-neutral-950/50" />
            </div>

            {/* TOP BAR: Left Corner = Settings Icon, Center = Total Coins, Right Corner = Cars Option */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-auto">
              {/* LEFT CORNER: Settings Icon Button */}
              <button
                id="start-screen-settings-btn"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 bg-neutral-900/85 hover:bg-neutral-800 border border-neutral-700/80 backdrop-blur-md px-3 py-2 rounded-xl text-neutral-200 hover:text-white transition-all shadow-xl active:scale-95 group"
                title="Open Settings (Music, Controls, Mode)"
                aria-label="Open Settings"
              >
                <Settings size={18} className="text-blue-400 group-hover:rotate-45 transition-transform duration-300" />
                <span className="text-xs font-bold tracking-wider uppercase">Settings</span>
              </button>

              {/* CENTER: Total Saved Coins */}
              <div 
                id="start-screen-total-coins-badge"
                className="flex items-center gap-1.5 bg-neutral-900/85 border border-amber-500/50 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-amber-300 font-mono text-xs font-black shadow-xl"
                title="Total Saved Coins"
              >
                <Coins size={14} className="text-amber-400" />
                <span>{totalCoins}</span>
              </div>

              {/* RIGHT CORNER: CARS Button */}
              <button
                id="start-screen-cars-btn"
                onClick={() => setIsGarageOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black px-3.5 py-2 rounded-xl transition-all shadow-xl active:scale-95 group border border-amber-300/80"
                title="Open Garage & Choose Cars"
                aria-label="Open Cars Garage"
              >
                <CarIcon size={18} className="group-hover:scale-110 transition-transform text-neutral-950" />
                <span className="text-xs font-black tracking-wider uppercase">CARS</span>
              </button>
            </div>

            {/* Centered Dr. Driving Logo Badge in upper-middle area */}
            <div className="absolute top-[21%] sm:top-[23%] left-0 right-0 flex flex-col items-center justify-center z-30 pointer-events-auto px-6">
              <div 
                id="start-screen-logo-badge"
                className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-black shadow-2xl shadow-black/90 ring-2 ring-black/70 bg-neutral-900 transition-transform duration-300 hover:scale-105"
              >
                <img
                  src={drDrivingGameIcon}
                  alt="Dr. Driving Game Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* DR. DRIVING Banner moved further down, just slightly above START GAME Button */}
            <div className="absolute top-[56%] sm:top-[57%] left-0 right-0 flex flex-col items-center justify-center z-30 pointer-events-auto px-6">
              <div className="bg-blue-600/95 border border-blue-400/50 px-6 py-2 rounded-xl rotate-[-1.5deg] shadow-xl shadow-blue-950/80 backdrop-blur-md">
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider italic text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  DR. DRIVING
                </h1>
              </div>

              <button 
                id="start-game-btn"
                onClick={startGame} 
                className="mt-7 sm:mt-8 flex items-center gap-2.5 bg-green-500 hover:bg-green-400 text-neutral-950 px-10 py-3.5 rounded-full font-black text-lg sm:text-xl transition-all active:scale-95 shadow-2xl shadow-green-950/90 border-2 border-green-300/70"
              >
                <Play fill="currentColor" size={22} /> START GAME
              </button>
            </div>

            {/* SK GAME'S Footer at top: 92% in center - Faint & Hazy (dhundla) */}
            <div 
              id="start-screen-sk-game"
              className="absolute left-0 right-0 flex items-center justify-center z-30 pointer-events-none px-4 -translate-y-1/2"
              style={{ top: '92%' }}
            >
              <span className="text-xs font-bold tracking-[0.25em] text-white/45 blur-[0.5px] uppercase select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                SK GAME'S
              </span>
            </div>
          </div>
        )}

        {/* Settings Modal Component */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          volume={volume}
          isMuted={isMuted}
          isPlayingMusic={isMusicEnabled}
          gameMode={gameMode}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleMusicPlay={handleToggleMusicPlay}
          onGameModeChange={handleGameModeChange}
        />

        {/* Cars / Garage Modal Component */}
        <CarGarageModal
          isOpen={isGarageOpen}
          onClose={() => setIsGarageOpen(false)}
          selectedCarId={selectedCarId}
          onSelectCar={handleSelectCar}
          highScore={highScore}
          coins={totalCoins}
          onClaimCar={handleClaimCar}
        />

        {/* Game Over Screen Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center z-20 text-white p-6 text-center animate-in fade-in duration-150">
            <AlertTriangle size={60} className="text-red-500 mb-3 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce" />
            <h2 className="text-3xl sm:text-4xl font-black mb-2 italic">CRASHED!</h2>
            <div className="bg-neutral-900/90 px-6 py-3 rounded-xl border border-neutral-700/70 mb-6 shadow-inner flex flex-col items-center min-w-[180px] gap-2">
              <div className="flex flex-col items-center">
                <span className="text-neutral-400 text-[11px] font-bold tracking-wider uppercase mb-0.5">CURRENT SCORE</span>
                <span className="text-3xl font-mono font-bold text-yellow-400">{scoreDisplay}</span>
              </div>

              <div className="flex items-center gap-1.5 border-t border-neutral-800/80 pt-2 w-full justify-center text-xs font-mono font-bold text-amber-300">
                <Coins size={14} className="text-amber-400" />
                COINS: {coinsDisplay}
              </div>

              {scoreDisplay >= highScore && scoreDisplay > 0 && (
                <span className="text-xs text-green-400 font-bold mt-0.5">🏆 NEW BEST HIGH SCORE!</span>
              )}
            </div>

            {/* Action Buttons: Play Again & Home Button underneath */}
            <div className="flex flex-col items-center gap-3 w-full max-w-[210px]">
              <button 
                id="play-again-btn"
                onClick={startGame} 
                className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 px-8 py-3.5 rounded-full font-black text-sm transition-transform active:scale-95 shadow-xl shadow-white/10"
              >
                <RotateCcw size={18} strokeWidth={3} /> PLAY AGAIN
              </button>

              <button 
                id="crashed-screen-home-btn"
                onClick={goToHome}
                className="w-full flex items-center justify-center gap-2 bg-neutral-900/90 hover:bg-neutral-800 text-white px-6 py-3 rounded-full font-bold text-sm transition-transform active:scale-95 border border-neutral-700 shadow-xl shadow-black/60"
              >
                <Home size={18} className="text-amber-400" /> HOME
              </button>
            </div>
          </div>
        )}

        {/* Game Paused Screen Overlay */}
        {isPlaying && !isGameOver && isPaused && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center z-40 text-white p-6 text-center animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center mb-3 shadow-xl shadow-amber-500/10">
              <Pause size={32} className="text-amber-400" />
            </div>
            
            <h2 className="text-3xl font-black italic tracking-wider mb-5">GAME PAUSED</h2>

            <div className="bg-neutral-900/90 px-6 py-3 rounded-xl border border-neutral-700/70 mb-6 shadow-inner flex flex-col items-center min-w-[180px] gap-2">
              <div className="flex flex-col items-center">
                <span className="text-neutral-400 text-[11px] font-bold tracking-wider uppercase mb-0.5">CURRENT SCORE</span>
                <span className="text-3xl font-mono font-bold text-yellow-400">{scoreDisplay}</span>
              </div>
              <div className="flex items-center gap-1.5 border-t border-neutral-800/80 pt-2 w-full justify-center text-xs font-mono font-bold text-amber-300">
                <Coins size={14} className="text-amber-400" />
                COINS: {coinsDisplay}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[210px]">
              {/* Resume Button */}
              <button
                id="pause-resume-btn"
                onClick={togglePause}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-neutral-950 px-6 py-3 rounded-full font-black text-sm transition-transform active:scale-95 shadow-xl shadow-green-950/60 border border-green-300/40"
              >
                <Play fill="currentColor" size={18} /> RESUME
              </button>

              {/* Restart Button */}
              <button
                id="pause-restart-btn"
                onClick={() => {
                  setIsPaused(false);
                  startGame();
                }}
                className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-3 rounded-full font-bold text-sm transition-transform active:scale-95 border border-neutral-700 shadow-md"
              >
                <RotateCcw size={16} /> RESTART
              </button>

              {/* Home Button to return directly to Start Screen */}
              <button
                id="pause-home-btn"
                onClick={goToHome}
                className="flex items-center justify-center gap-2 bg-neutral-900/90 hover:bg-neutral-800 text-white px-5 py-3 rounded-full font-bold text-sm transition-transform active:scale-95 border border-neutral-700 shadow-xl shadow-black/60"
              >
                <Home size={18} className="text-amber-400" /> HOME
              </button>
            </div>
          </div>
        )}

        {/* Mobile On-Screen Controls: Left & Right Corner Arrow Buttons */}
        {isPlaying && !isPaused && (
          <div className="absolute bottom-5 left-0 right-0 px-4 sm:px-6 flex justify-between items-end z-10 pointer-events-auto select-none">
            {/* Left Corner Arrow Button */}
            <button 
              id="steer-left-btn"
              onPointerDown={(e) => { e.preventDefault(); handleKey('ArrowLeft', true); }}
              onPointerUp={(e) => { e.preventDefault(); handleKey('ArrowLeft', false); }}
              onPointerLeave={(e) => { e.preventDefault(); handleKey('ArrowLeft', false); }}
              onTouchStart={(e) => { e.preventDefault(); handleKey('ArrowLeft', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleKey('ArrowLeft', false); }}
              className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center bg-neutral-900/85 hover:bg-neutral-800 border-2 border-neutral-600/90 rounded-full text-white backdrop-blur-md active:bg-blue-600 active:border-blue-400 active:scale-95 transition-all shadow-2xl shadow-black/80 touch-none select-none"
              aria-label="Steer Left"
              title="Steer Left"
            > 
              <ChevronLeft size={38} strokeWidth={2.5} /> 
            </button>

            {/* Right Corner Arrow Button */}
            <button 
              id="steer-right-btn"
              onPointerDown={(e) => { e.preventDefault(); handleKey('ArrowRight', true); }}
              onPointerUp={(e) => { e.preventDefault(); handleKey('ArrowRight', false); }}
              onPointerLeave={(e) => { e.preventDefault(); handleKey('ArrowRight', false); }}
              onTouchStart={(e) => { e.preventDefault(); handleKey('ArrowRight', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleKey('ArrowRight', false); }}
              className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center bg-neutral-900/85 hover:bg-neutral-800 border-2 border-neutral-600/90 rounded-full text-white backdrop-blur-md active:bg-blue-600 active:border-blue-400 active:scale-95 transition-all shadow-2xl shadow-black/80 touch-none select-none"
              aria-label="Steer Right"
              title="Steer Right"
            > 
              <ChevronRight size={38} strokeWidth={2.5} /> 
            </button>
          </div>
        )}
        
      </div>
      
      <p className="mt-2 text-neutral-500 text-xs sm:text-sm max-w-[340px] text-center hidden sm:block">
        Use on-screen Left & Right Arrow buttons or Keyboard (Arrow keys / A & D) to steer.
      </p>
    </div>
  );
}
