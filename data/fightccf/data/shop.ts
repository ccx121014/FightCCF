import type { ShopProduct, Item } from '@shared/types';

export const ITEMS: Item[] = [
  { id: 'exp_potion', name: '经验药水', description: '使用后获得 500 角色经验', type: 'consumable', rarity: 'rare', iconColor: '#4ade80', effect: { exp: 500 } },
  { id: 'gold_pouch', name: '金币袋', description: '打开获得 300 金币', type: 'consumable', rarity: 'normal', iconColor: '#fbbf24', effect: { gold: 300 } },
  { id: 'diamond_pack_s', name: '小钻石包', description: '获得 300 钻石', type: 'currency_pack', rarity: 'epic', iconColor: '#38bdf8', effect: { diamond: 300 } },
  { id: 'char_shard', name: '通用角色碎片', description: '可兑换任意稀有角色', type: 'character_shard', rarity: 'epic', iconColor: '#a855f7', effect: { shard: 1 } },
  { id: 'energy_drink', name: '能量饮料', description: '战斗开局能量 +30', type: 'boost', rarity: 'rare', iconColor: '#38bdf8', effect: { startEnergy: 30 } },
  { id: 'revive_stone', name: '复活石', description: '战斗失败时自动复活一次', type: 'consumable', rarity: 'legendary', iconColor: '#f43f5e', effect: { revive: 1 } },
];

export const SHOP_PRODUCTS: ShopProduct[] = [
  { id: 'sp_exp', itemId: 'exp_potion', name: '经验药水', description: '角色经验 +500', type: 'consumable', rarity: 'rare', costGold: 800, costDiamond: 0, iconColor: '#4ade80', limitPerUser: 10 },
  { id: 'sp_gold', itemId: 'gold_pouch', name: '金币袋', description: '获得 300 金币', type: 'consumable', rarity: 'normal', costGold: 0, costDiamond: 20, iconColor: '#fbbf24' },
  { id: 'sp_diamond', itemId: 'diamond_pack_s', name: '小钻石包', description: '获得 300 钻石', type: 'currency_pack', rarity: 'epic', costGold: 0, costDiamond: 0, costHonor: 500, iconColor: '#38bdf8', limitPerUser: 1 },
  { id: 'sp_shard', itemId: 'char_shard', name: '通用碎片', description: '兑换稀有角色', type: 'character_shard', rarity: 'epic', costGold: 0, costDiamond: 300, iconColor: '#a855f7', limitPerUser: 5 },
  { id: 'sp_energy', itemId: 'energy_drink', name: '能量饮料', description: '开局能量 +30', type: 'boost', rarity: 'rare', costGold: 500, costDiamond: 0, iconColor: '#38bdf8' },
  { id: 'sp_revive', itemId: 'revive_stone', name: '复活石', description: '失败自动复活', type: 'consumable', rarity: 'legendary', costGold: 0, costDiamond: 120, discount: 0.2, iconColor: '#f43f5e', limitPerUser: 3 },
];

export const ITEM_MAP: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
