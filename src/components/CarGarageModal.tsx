import React, { useState } from 'react';
import { X, Car as CarIcon, Gauge, Zap, Compass, Check, Lock, Sparkles, ChevronLeft, ChevronRight, Coins } from 'lucide-react';
import { Car } from '../types';
import { CARS_LIST } from '../data/cars';

interface CarGarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCarId: string;
  onSelectCar: (carId: string) => void;
  highScore: number;
  coins?: number;
  onClaimCar?: (carId: string, coinPrice: number) => void;
}

export const CarGarageModal: React.FC<CarGarageModalProps> = ({
  isOpen,
  onClose,
  selectedCarId,
  onSelectCar,
  highScore,
  coins = 0,
  onClaimCar,
}) => {
  const [activeCarIndex, setActiveCarIndex] = useState(() => {
    const idx = CARS_LIST.findIndex(c => c.id === selectedCarId);
    return idx >= 0 ? idx : 0;
  });

  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  const [unlockedCarIds, setUnlockedCarIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dr_driving_claimed_cars');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    // Only starter car is unlocked by default
    return ['blue_cruiser'];
  });

  if (!isOpen) return null;

  const activeCar = CARS_LIST[activeCarIndex];
  const isSelected = selectedCarId === activeCar.id;
  const isUnlocked = unlockedCarIds.includes(activeCar.id) || activeCar.coinPrice === 0;
  const canAfford = (coins ?? 0) >= activeCar.coinPrice;

  const handleClaimCar = (car: Car) => {
    if (isUnlocked) {
      onSelectCar(car.id);
      return;
    }
    if (!canAfford) return;

    const updated = [...unlockedCarIds, car.id];
    setUnlockedCarIds(updated);
    localStorage.setItem('dr_driving_claimed_cars', JSON.stringify(updated));

    if (onClaimCar) {
      onClaimCar(car.id, car.coinPrice);
    } else {
      onSelectCar(car.id);
    }

    setClaimFeedback(`Claimed ${car.name}!`);
    setTimeout(() => {
      setClaimFeedback(null);
    }, 2000);
  };

  const handleNextCar = () => {
    setActiveCarIndex((prev) => (prev + 1) % CARS_LIST.length);
  };

  const handlePrevCar = () => {
    setActiveCarIndex((prev) => (prev - 1 + CARS_LIST.length) % CARS_LIST.length);
  };

  // Percent calculation for stats (based on max values in car range)
  const speedPercent = Math.min(100, Math.round((activeCar.maxSpeed / 19) * 100));
  const handlingPercent = Math.min(100, Math.round((activeCar.handling / 8) * 100));
  const accelPercent = Math.min(100, Math.round((activeCar.acceleration / 0.3) * 100));

  return (
    <div
      id="garage-modal-backdrop"
      className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="garage-modal-container"
        className="w-full max-w-[340px] max-h-[92vh] bg-neutral-900 border border-neutral-700/80 rounded-2xl p-4 shadow-2xl text-white select-none flex flex-col gap-3 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <CarIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight uppercase">Garage & Cars</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {coins !== undefined && (
              <div 
                id="garage-coins-badge"
                className="flex items-center gap-1.5 bg-neutral-950/80 border border-amber-500/40 px-2.5 py-1 rounded-lg text-amber-300 font-mono text-xs font-black shadow-sm"
                title="Your Coins"
              >
                <Coins size={14} className="text-amber-400" />
                <span>{coins}</span>
              </div>
            )}
            <button
              id="close-garage-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              aria-label="Close Garage"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3D-Like Showcase Box */}
        <div className="relative bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] shadow-inner overflow-hidden">
          {/* Background Stage Lights */}
          <div 
            className="absolute -top-10 w-48 h-48 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ backgroundColor: activeCar.color }}
          />

          {/* Carousel arrows */}
          <button
            id="garage-prev-car-btn"
            onClick={handlePrevCar}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-all shadow-md active:scale-95"
            aria-label="Previous Car"
          >
            <ChevronLeft size={18} />
          </button>
          
          <button
            id="garage-next-car-btn"
            onClick={handleNextCar}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-all shadow-md active:scale-95"
            aria-label="Next Car"
          >
            <ChevronRight size={18} />
          </button>

          {/* Visual SVG representation of the specific car model */}
          <div className="relative w-24 h-36 flex items-center justify-center my-1 drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]">
            <svg viewBox="0 0 50 85" className="w-full h-full">
              {/* Tires */}
              <rect x="2" y="10" width="5" height="16" rx="2" fill="#111827" />
              <rect x="43" y="10" width="5" height="16" rx="2" fill="#111827" />
              <rect x="2" y="55" width="5" height="16" rx="2" fill="#111827" />
              <rect x="43" y="55" width="5" height="16" rx="2" fill="#111827" />

              {/* Rims */}
              <rect x="3" y="14" width="3" height="8" rx="1" fill="#9ca3af" />
              <rect x="44" y="14" width="3" height="8" rx="1" fill="#9ca3af" />
              <rect x="3" y="59" width="3" height="8" rx="1" fill="#9ca3af" />
              <rect x="44" y="59" width="3" height="8" rx="1" fill="#9ca3af" />

              {/* Main Body */}
              <rect x="6" y="5" width="38" height="72" rx="9" fill={activeCar.color} />

              {/* Specific Car Style Details */}
              {activeCar.style === 'sports' && (
                <>
                  {/* Twin Racing Stripes */}
                  <rect x="21" y="5" width="3" height="72" fill="#ffffff" opacity="0.9" />
                  <rect x="26" y="5" width="3" height="72" fill="#ffffff" opacity="0.9" />
                  {/* Rear Spoiler */}
                  <rect x="5" y="73" width="40" height="5" rx="2" fill="#111827" />
                  <rect x="12" y="70" width="3" height="5" fill="#374151" />
                  <rect x="35" y="70" width="3" height="5" fill="#374151" />
                </>
              )}

              {activeCar.style === 'taxi' && (
                <>
                  {/* Checkered side strip */}
                  <rect x="8" y="38" width="34" height="4" fill="#1e293b" />
                  <rect x="10" y="38" width="4" height="4" fill="#ffffff" />
                  <rect x="18" y="38" width="4" height="4" fill="#ffffff" />
                  <rect x="26" y="38" width="4" height="4" fill="#ffffff" />
                  <rect x="34" y="38" width="4" height="4" fill="#ffffff" />
                  {/* TAXI Roof Sign */}
                  <rect x="17" y="32" width="16" height="6" rx="2" fill="#ffffff" stroke="#1e293b" strokeWidth="0.5" />
                  <text x="25" y="36.5" fontSize="3.5" fontWeight="bold" fill="#000000" textAnchor="middle">TAXI</text>
                </>
              )}

              {activeCar.style === 'police' && (
                <>
                  {/* White doors */}
                  <rect x="7" y="24" width="36" height="32" fill="#f8fafc" />
                  <text x="25" y="42" fontSize="5" fontWeight="black" fill="#09090b" textAnchor="middle">POLICE</text>
                  {/* Emergency Lightbar */}
                  <rect x="16" y="34" width="8" height="4" rx="1" fill="#ef4444" />
                  <rect x="26" y="34" width="8" height="4" rx="1" fill="#3b82f6" />
                  <rect x="24" y="34" width="2" height="4" fill="#ffffff" />
                </>
              )}

              {activeCar.style === 'supercar' && (
                <>
                  {/* Cyber Aero Accents */}
                  <path d="M 10 10 L 25 24 L 40 10" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
                  <rect x="15" y="68" width="20" height="4" rx="2" fill="#06b6d4" />
                  <polygon points="6,74 12,74 8,66" fill="#06b6d4" />
                  <polygon points="44,74 38,74 42,66" fill="#06b6d4" />
                </>
              )}

              {activeCar.style === 'muscle' && (
                <>
                  {/* Matte Orange Racing Hood Stripes */}
                  <rect x="18" y="5" width="5" height="40" fill="#f97316" />
                  <rect x="27" y="5" width="5" height="40" fill="#f97316" />
                  {/* Engine Hood Scoop */}
                  <rect x="20" y="14" width="10" height="7" rx="1.5" fill="#09090b" stroke="#f97316" strokeWidth="0.5" />
                </>
              )}

              {/* Windshield */}
              <rect x="10" y="20" width="30" height="15" rx="3" fill="#0f172a" />
              {/* Rear Window */}
              <rect x="12" y="56" width="26" height="11" rx="2" fill="#0f172a" />

              {/* Headlights */}
              <rect x="9" y="4" width="8" height="3" rx="1" fill="#fef08a" />
              <rect x="33" y="4" width="8" height="3" rx="1" fill="#fef08a" />

              {/* Taillights */}
              <rect x="9" y="74" width="8" height="3" rx="1" fill="#ef4444" />
              <rect x="33" y="74" width="8" height="3" rx="1" fill="#ef4444" />
            </svg>
          </div>
        </div>

        {/* Car Specs & Performance Bars */}
        <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl flex flex-col gap-2">
          {/* Top Speed */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-neutral-400 font-bold flex items-center gap-1">
                <Gauge size={13} className="text-blue-400" /> Top Speed
              </span>
              <span className="font-mono text-white font-semibold">{activeCar.maxSpeed} km/h</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${speedPercent}%` }}
              />
            </div>
          </div>

          {/* Handling */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-neutral-400 font-bold flex items-center gap-1">
                <Compass size={13} className="text-emerald-400" /> Handling & Grip
              </span>
              <span className="font-mono text-white font-semibold">{activeCar.handling} / 10</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${handlingPercent}%` }}
              />
            </div>
          </div>

          {/* Acceleration */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-neutral-400 font-bold flex items-center gap-1">
                <Zap size={13} className="text-amber-400" /> Acceleration
              </span>
              <span className="font-mono text-white font-semibold">+{Math.round(activeCar.acceleration * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${accelPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Car Selection Grid */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Select Model:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {CARS_LIST.map((car, idx) => {
              const isCurr = activeCarIndex === idx;
              const isEquipped = selectedCarId === car.id;
              const isCarUnlocked = unlockedCarIds.includes(car.id) || car.coinPrice === 0;

              return (
                <button
                  key={car.id}
                  id={`car-thumb-${car.id}`}
                  onClick={() => setActiveCarIndex(idx)}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all relative ${
                    isCurr
                      ? 'bg-neutral-800 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-neutral-950/70 border-neutral-800 hover:bg-neutral-800/60'
                  }`}
                  aria-label={`Select car option ${idx + 1}`}
                >
                  {isEquipped ? (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-neutral-950 p-0.5 rounded-full shadow z-10">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  ) : !isCarUnlocked && (
                    <div className="absolute top-1 right-1 text-neutral-400 bg-neutral-950/80 rounded-full p-0.5 z-10">
                      <Lock size={9} />
                    </div>
                  )}

                  {/* Miniature Top-down Car Visual */}
                  <svg viewBox="0 0 30 50" className="w-5 h-8 drop-shadow-sm my-0.5">
                    {/* Tires */}
                    <rect x="1" y="6" width="3" height="10" rx="1" fill="#111827" />
                    <rect x="26" y="6" width="3" height="10" rx="1" fill="#111827" />
                    <rect x="1" y="32" width="3" height="10" rx="1" fill="#111827" />
                    <rect x="26" y="32" width="3" height="10" rx="1" fill="#111827" />
                    {/* Body */}
                    <rect x="4" y="3" width="22" height="44" rx="5" fill={car.color} />
                    {(car.style === 'sports' || car.style === 'supercar') && (
                      <>
                        <rect x="12" y="3" width="2" height="44" fill="#ffffff" opacity="0.8" />
                        <rect x="16" y="3" width="2" height="44" fill="#ffffff" opacity="0.8" />
                      </>
                    )}
                    {/* Windshield */}
                    <rect x="7" y="13" width="16" height="8" rx="2" fill="#38bdf8" opacity="0.85" />
                    {/* Rear window */}
                    <rect x="8" y="32" width="14" height="4" rx="1" fill="#0f172a" opacity="0.8" />
                  </svg>

                  {/* Mini Badge Below Thumbnail */}
                  <div className="mt-0.5 flex items-center justify-center">
                    {car.coinPrice === 0 ? (
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter">
                        Free
                      </span>
                    ) : isCarUnlocked ? (
                      <span className="text-[8px] font-bold text-green-400 flex items-center gap-0.5">
                        <Check size={8} strokeWidth={3} /> Owned
                      </span>
                    ) : (
                      <span className="text-[8px] font-black text-amber-300 flex items-center gap-1 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                        <Coins size={9} className="text-amber-400" />
                        <span>{car.coinPrice}</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button: Equip / Claim with Coins / Locked */}
        <div className="mt-1 flex flex-col gap-1.5">
          {claimFeedback && (
            <div className="text-center text-xs font-black text-amber-300 animate-bounce">
              🎉 {claimFeedback}
            </div>
          )}

          {isSelected ? (
            <button
              id="equipped-car-btn"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-green-600/90 hover:bg-green-500 text-white font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-green-500/50 shadow-md transition-all active:scale-98"
            >
              <Check size={16} strokeWidth={3} /> SELECTED
            </button>
          ) : isUnlocked ? (
            <button
              id="equip-car-btn"
              onClick={() => {
                onSelectCar(activeCar.id);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98"
            >
              <Check size={16} strokeWidth={3} /> DRIVE THIS CAR
            </button>
          ) : canAfford ? (
            <button
              id="claim-car-btn"
              onClick={() => handleClaimCar(activeCar)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-neutral-950 font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/20 active:scale-98"
            >
              <Coins size={16} className="text-neutral-950" /> CLAIM FOR {activeCar.coinPrice} COINS
            </button>
          ) : (
            <button
              disabled
              id="locked-car-btn"
              className="w-full py-2.5 rounded-xl bg-neutral-800/80 text-neutral-400 font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 cursor-not-allowed border border-neutral-700/60"
            >
              <Lock size={15} className="text-neutral-400" /> NEED {activeCar.coinPrice} COINS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
