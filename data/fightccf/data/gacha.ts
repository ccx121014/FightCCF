import type { GachaPool } from '@shared/types';

export const GACHA_POOLS: GachaPool[] = [
  {
    id: 'standard',
    name: '标准召唤',
    type: 'standard',
    description: '常驻卡池，包含所有已实装角色，五星保底 90 抽。',
    bannerColor: '#38bdf8',
    featuredCharacterIds: [],
    singleCost: 120,
    tenCost: 1080,
  },
  {
    id: 'featured_sam',
    name: '限时 UP · 终焉构造',
    type: 'featured',
    description: '本期 UP：后缀自动机（传说）。五星概率提升，必为 UP 角色。',
    bannerColor: '#a855f7',
    featuredCharacterIds: ['suffix_automaton'],
    singleCost: 120,
    tenCost: 1080,
    endTime: '2026-09-30T00:00:00Z',
  },
  {
    id: 'skin_pool',
    name: '皮肤召唤',
    type: 'skin',
    description: '角色专属皮肤与外观道具，使用荣誉点数召唤。',
    bannerColor: '#fbbf24',
    featuredCharacterIds: ['dynamic_programming', 'fft'],
    singleCost: 150,
    tenCost: 1350,
  },
];

export function getPool(id: string): GachaPool | undefined {
  return GACHA_POOLS.find((p) => p.id === id);
}
