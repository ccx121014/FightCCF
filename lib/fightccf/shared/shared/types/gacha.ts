import type { RarityType } from '../constants/rarities';

export type GachaPoolType = 'standard' | 'featured' | 'skin';

export interface GachaPool {
  id: string;
  name: string;
  type: GachaPoolType;
  description: string;
  bannerColor: string;
  featuredCharacterIds: string[];
  singleCost: number;
  tenCost: number;
  endTime?: string;
}

export interface PityState {
  poolId: string;
  sinceLegendary: number;
  sinceEpic: number;
  totalPulls: number;
}

export interface GachaRecord {
  id: string;
  poolId: string;
  characterId: string;
  rarity: RarityType;
  isNew: boolean;
  timestamp: string;
}

export interface GachaResult {
  records: GachaRecord[];
  pity: PityState;
}

export interface Wishlist {
  poolId: string;
  characterIds: string[];
}

export interface GachaEvent {
  id: string;
  name: string;
  poolId: string;
  startTime: string;
  endTime: string;
  bonusRate?: number;
}

export interface GachaStats {
  totalPulls: number;
  legendaryCount: number;
  epicCount: number;
  luckIndex: number;
}
