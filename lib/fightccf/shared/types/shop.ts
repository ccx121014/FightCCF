import type { RarityType } from '../constants/rarities';

export type ItemType =
  | 'consumable'
  | 'material'
  | 'currency_pack'
  | 'character_shard'
  | 'skin'
  | 'boost';

export type CurrencyKind = 'gold' | 'diamond' | 'honor';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: RarityType;
  iconColor: string;
  effect: Record<string, unknown>;
}

export interface ShopProduct {
  id: string;
  itemId: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: RarityType;
  costGold: number;
  costDiamond: number;
  costHonor?: number;
  discount?: number;
  limitPerUser?: number;
  iconColor: string;
}

export interface Purchase {
  id: string;
  itemId: string;
  currency: CurrencyKind;
  price: number;
  quantity: number;
  timestamp: string;
}

export interface GiftCode {
  code: string;
  rewards: { itemId: string; quantity: number }[];
  expiresAt: string;
}

export interface DailyDeal {
  products: ShopProduct[];
  refreshAt: string;
}

export interface WeeklyFeatured {
  products: ShopProduct[];
  endsAt: string;
}
