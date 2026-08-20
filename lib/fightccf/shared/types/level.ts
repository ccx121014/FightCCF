import type { ElementType } from '../constants/elements';
import type { BattleRating } from './battle';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert' | 'legendary';

export interface EnemySpawn {
  characterId: string;
  level: number;
  count: number;
  hpMultiplier?: number;
  attackMultiplier?: number;
}

export interface LevelRewards {
  gold: number;
  exp: number;
  firstClearBonus?: {
    gold?: number;
    diamond?: number;
    characters?: string[];
  };
  items?: { itemId: string; quantity: number; chance: number }[];
}

export interface Level {
  id: string;
  chapter: number;
  levelNumber: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  element: ElementType;
  recommendedPower: number;
  enemies: EnemySpawn[];
  rewards: LevelRewards;
  /** 本关时间限制（秒）：60 / 90 / 120 / 150 */
  timeLimit: number;
  /** 星级评定时间阈值（秒），[S, A, B] */
  starTimes: [number, number, number];
}

export interface Chapter {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  element: ElementType;
  levelCount: number;
  unlockRequirement?: string;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  waves: EnemySpawn[][];
  rewards: LevelRewards;
}

export interface LevelProgress {
  levelId: string;
  stars: number;
  bestTime: number;
  bestRating: BattleRating;
  completed: boolean;
  playCount: number;
  lastPlayedAt?: string;
}

export interface Attempt {
  levelId: string;
  rating: BattleRating;
  timeUsed: number;
  victory: boolean;
  timestamp: string;
}
