import React from 'react';
import { X, Sun, Moon, Settings, Disc } from 'lucide-react';
import { GameMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  volume?: number;
  isMuted?: boolean;
  isPlayingMusic: boolean;
  gameMode: GameMode;
  onVolumeChange?: (vol: number) => void;
  onToggleMute?: () => void;
  onToggleMusicPlay: () => void;
  onGameModeChange: (mode: GameMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isPlayingMusic,
  gameMode,
  onToggleMusicPlay,
  onGameModeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="settings-modal-backdrop"
      className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    >
      <div 
        id="settings-modal-container"
        className="w-full max-w-[310px] bg-neutral-900 border border-neutral-700/80 rounded-2xl p-5 shadow-2xl text-white select-none flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Settings size={18} />
            </div>
            <h2 className="text-lg font-black tracking-tight uppercase">Settings</h2>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            aria-label="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Music Section (ON / OFF Toggle) */}
        <div className="flex flex-col gap-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Disc size={15} className={`text-blue-400 ${isPlayingMusic ? 'animate-spin' : ''}`} />
              Background Music
            </span>
            <button
              id="settings-toggle-music"
              onClick={onToggleMusicPlay}
              className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                isPlayingMusic 
                  ? 'bg-green-500 text-neutral-950 shadow-sm shadow-green-500/40 font-black' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
              }`}
            >
              {isPlayingMusic ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 2. Mode (Day / Night) */}
        <div className="flex flex-col gap-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Environment Mode
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="mode-day-btn"
              onClick={() => onGameModeChange('day')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                gameMode === 'day'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              <Sun size={15} /> Day
            </button>
            <button
              id="mode-night-btn"
              onClick={() => onGameModeChange('night')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                gameMode === 'night'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              <Moon size={15} /> Night
            </button>
          </div>
        </div>

        {/* Done Button */}
        <button
          id="settings-done-btn"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-sm text-white tracking-wide transition-all shadow-lg active:scale-98"
        >
          APPLY & CLOSE
        </button>
      </div>
    </div>
  );
};
