import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GachaRecord, PityState } from '@shared/types';
import type { RarityType } from '@shared/constants';
import { GACHA_CONFIG } from '@shared/constants';
import { CHARACTERS } from '@/data/characters';
import { getPool } from '@/data/gacha';

interface GachaState {
  pity: Record<string, PityState>;
  history: GachaRecord[];

  pull: (poolId: string, count: 1 | 10, ownedIds: string[]) => GachaRecord[];
  getPity: (poolId: string) => PityState;
}

function ensurePity(pity: Record<string, PityState>, poolId: string): PityState {
  return pity[poolId] ?? { poolId, sinceLegendary: 0, sinceEpic: 0, totalPulls: 0 };
}

// 稀有度权重抽取（含软保底）
function rollRarity(state: PityState): RarityType {
  // 硬保底
  if (state.sinceLegendary >= GACHA_CONFIG.legendaryPity - 1) return 'legendary';
  if (state.sinceEpic >= GACHA_CONFIG.epicPity - 1) {
    // 四星保底时仍可能直接出五星
    return Math.random() < 0.15 ? 'legendary' : 'epic';
  }

  const w = { ...GACHA_CONFIG.weights };
  // 软保底：75 抽后逐步提升五星概率
  if (state.sinceLegendary >= GACHA_CONFIG.softPityStart) {
    const boost = (state.sinceLegendary - GACHA_CONFIG.softPityStart + 1) * 60;
    w.legendary += boost;
  }

  const total = w.normal + w.rare + w.epic + w.legendary;
  let r = Math.random() * total;
  if ((r -= w.legendary) < 0) return 'legendary';
  if ((r -= w.epic) < 0) return 'epic';
  if ((r -= w.rare) < 0) return 'rare';
  return 'normal';
}

function pickCharacter(rarity: RarityType, poolId: string): string {
  const pool = getPool(poolId);
  // 限时池：五星必为 UP
  if (pool?.type === 'featured' && rarity === 'legendary' && pool.featuredCharacterIds.length) {
    if (Math.random() < 0.7) {
      return pool.featuredCharacterIds[Math.floor(Math.random() * pool.featuredCharacterIds.length)];
    }
  }
  const candidates = CHARACTERS.filter((c) => c.rarity === rarity);
  if (candidates.length === 0) {
    // 稀有度无角色时降级
    const fallback = CHARACTERS.filter((c) => c.rarity === 'rare');
    return fallback[Math.floor(Math.random() * fallback.length)].id;
  }
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

export const useGachaStore = create<GachaState>()(
  persist(
    (set, get) => ({
      pity: {},
      history: [],

      pull(poolId, count, ownedIds) {
        const state = { ...ensurePity(get().pity, poolId) };
        const results: GachaRecord[] = [];
        const seenNew = new Set(ownedIds);

        for (let i = 0; i < count; i++) {
          state.totalPulls += 1;
          state.sinceLegendary += 1;
          state.sinceEpic += 1;

          const rarity = rollRarity(state);
          if (rarity === 'legendary') {
            state.sinceLegendary = 0;
            state.sinceEpic = 0;
          } else if (rarity === 'epic') {
            state.sinceEpic = 0;
          }

          const characterId = pickCharacter(rarity, poolId);
          const isNew = !seenNew.has(characterId);
          seenNew.add(characterId);

          results.push({
            id: `g_${Date.now()}_${i}`,
            poolId,
            characterId,
            rarity,
            isNew,
            timestamp: new Date().toISOString(),
          });
        }

        set({
          pity: { ...get().pity, [poolId]: state },
          history: [...results, ...get().history].slice(0, 200),
        });
        return results;
      },

      getPity(poolId) {
        return ensurePity(get().pity, poolId);
      },
    }),
    { name: 'fightccf_gacha' }
  )
);
