export type Enemy = {
  x: number;
  y: number;
  speed: number;
  color: string;
  lane: number;
  targetLane?: number;
  indicator?: 'left' | 'right' | null;
  indicatorTimer?: number;
  isChangingLane?: boolean;
  hasChangedLane?: boolean;
  willOvertake?: boolean;
  overtakeTriggerY?: number;
};

export type GameMode = 'day' | 'night';
export type ControlType = 'buttons' | 'hanging';

export type CarStyle = 'sedan' | 'sports' | 'taxi' | 'police' | 'supercar' | 'muscle';

export type Car = {
  id: string;
  name: string;
  category: string;
  color: string;
  secondaryColor?: string;
  accentColor?: string;
  style: CarStyle;
  maxSpeed: number;
  handling: number;
  acceleration: number;
  requiredScore: number;
  coinPrice: number;
  description: string;
};

export type Coin = {
  id: number;
  x: number;
  y: number;
};

export type FloatingText = {
  id: number;
  x: number;
  y: number;
  text: string;
  opacity: number;
};

export type GameState = {
  playerX: number;
  playerY: number;
  speed: number;
  score: number;
  coins: Coin[];
  coinsCollected: number;
  floatingTexts: FloatingText[];
  enemies: Enemy[];
  roadLines: number[];
  gameOver: boolean;
  isPlaying: boolean;
  isPaused?: boolean;
  keys: { [key: string]: boolean };
};
