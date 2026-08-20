import type { ElementType } from '../constants/elements';
import type { ElementalReactionType } from '../constants/elements';
import type { CharacterStats } from './character';

export type BattlePhase = 'waiting' | 'playing' | 'paused' | 'ended';
export type BattleRating = 'S' | 'A' | 'B' | 'C';

export interface Buff {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  stat: keyof CharacterStats | 'all';
  value: number;
  duration: number;
  remaining: number;
}

export interface DamageRecord {
  amount: number;
  isCrit: boolean;
  element: ElementType;
  reaction?: ElementalReactionType;
  timestamp: number;
}

export interface BattleUnitState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  stats: CharacterStats;
  element: ElementType;
  buffs: Buff[];
  isAlive: boolean;
  position: { x: number; y: number };
}

export interface BattleState {
  phase: BattlePhase;
  timeRemaining: number;
  combo: number;
  player: BattleUnitState;
  enemies: BattleUnitState[];
  damageRecords: DamageRecord[];
}

export interface BattleResult {
  victory: boolean;
  rating: BattleRating;
  timeUsed: number;
  maxCombo: number;
  totalDamage: number;
  rewards: {
    gold: number;
    exp: number;
    items?: { itemId: string; quantity: number }[];
  };
}

export interface ElementalReaction {
  type: ElementalReactionType;
  multiplier: number;
  triggeredAt: number;
}
