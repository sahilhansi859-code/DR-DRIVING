import React from 'react';
import { Volume2, Volume1, VolumeX, Plus, Minus, Music } from 'lucide-react';

interface VolumeControlProps {
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  isPlayingMusic: boolean;
  onVolumeChange: (newVol: number) => void;
  onToggleMute: () => void;
  onToggleMusicPlay: () => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  isPlayingMusic,
  onVolumeChange,
  onToggleMute,
  onToggleMusicPlay,
}) => {
  const currentVolumePercent = isMuted ? 0 : Math.round(volume * 100);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onVolumeChange(val);
  };

  const handleDecrease = () => {
    const next = Math.max(0, Math.round((volume - 0.1) * 10) / 10);
    onVolumeChange(next);
  };

  const handleIncrease = () => {
    const next = Math.min(1, Math.round((volume + 0.1) * 10) / 10);
    onVolumeChange(next);
  };

  const VolumeIcon = isMuted || volume === 0 
    ? VolumeX 
    : volume < 0.5 
    ? Volume1 
    : Volume2;

  return (
    <div 
      id="volume-control-container"
      className="bg-neutral-900/90 border border-neutral-700/80 backdrop-blur-md rounded-xl p-2.5 px-3.5 shadow-xl flex items-center gap-2.5 text-white select-none transition-all"
    >
      {/* Play/Pause Music button with pulsating badge */}
      <button
        id="toggle-music-play-btn"
        onClick={onToggleMusicPlay}
        className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
          isPlayingMusic 
            ? 'bg-blue-600/80 text-white shadow-sm shadow-blue-500/30' 
            : 'bg-neutral-800 text-neutral-400 hover:text-white'
        }`}
        title={isPlayingMusic ? 'Pause Background Music' : 'Play Background Music'}
        aria-label="Toggle Music Playback"
      >
        <Music size={16} className={isPlayingMusic ? 'animate-pulse' : ''} />
      </button>

      {/* Mute / Unmute Button */}
      <button
        id="toggle-mute-btn"
        onClick={onToggleMute}
        className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors flex items-center justify-center"
        title={isMuted ? 'Unmute' : 'Mute'}
        aria-label="Mute or Unmute"
      >
        <VolumeIcon size={18} className={isMuted ? 'text-red-400' : 'text-blue-400'} />
      </button>

      {/* Decrease Volume (-) */}
      <button
        id="volume-decrease-btn"
        onClick={handleDecrease}
        disabled={currentVolumePercent === 0}
        className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center text-neutral-200"
        title="Volume Down (-10%)"
        aria-label="Decrease Volume"
      >
        <Minus size={14} />
      </button>

      {/* Volume Slider */}
      <div className="flex items-center gap-2">
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleSliderChange}
          className="w-20 sm:w-24 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          title={`Volume: ${currentVolumePercent}%`}
          aria-label="Volume Slider"
        />
        <span 
          id="volume-percentage-text"
          className="font-mono text-xs font-bold text-neutral-300 min-w-[34px] text-right"
        >
          {currentVolumePercent}%
        </span>
      </div>

      {/* Increase Volume (+) */}
      <button
        id="volume-increase-btn"
        onClick={handleIncrease}
        disabled={currentVolumePercent === 100}
        className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center text-neutral-200"
        title="Volume Up (+10%)"
        aria-label="Increase Volume"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
