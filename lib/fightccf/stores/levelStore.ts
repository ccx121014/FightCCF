import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LevelProgress, BattleRating } from '@shared/types';
import { LEVELS } from '@/data/levels';

interface LevelState {
  progress: Record<string, LevelProgress>;

  saveResult: (levelId: string, rating: BattleRating, timeUsed: number, victory: boolean) => void;
  getProgress: (levelId: string) => LevelProgress | undefined;
  isUnlocked: (levelId: string) => boolean;
  getChapterStars: (chapter: number) => number;
  totalStars: () => number;
}

const RATING_STARS: Record<BattleRating, number> = { S: 3, A: 2, B: 1, C: 0 };

export const useLevelStore = create<LevelState>()(
  persist(
    (set, get) => ({
      progress: {},

      saveResult(levelId, rating, timeUsed, victory) {
        if (!victory || rating === 'C') return; // C 级或失败不保存进度
        const stars = RATING_STARS[rating];
        const prev = get().progress[levelId];
        const next: LevelProgress = {
          levelId,
          stars: Math.max(prev?.stars ?? 0, stars),
          bestTime: prev ? Math.min(prev.bestTime, timeUsed) : timeUsed,
          bestRating: prev && RATING_STARS[prev.bestRating] >= stars ? prev.bestRating : rating,
          completed: true,
          playCount: (prev?.playCount ?? 0) + 1,
          lastPlayedAt: new Date().toISOString(),
        };
        set({ progress: { ...get().progress, [levelId]: next } });
      },

      getProgress(levelId) {
        return get().progress[levelId];
      },

      isUnlocked(levelId) {
        const level = LEVELS.find((l) => l.id === levelId);
        if (!level) return false;
        // 每章第一关默认解锁
        if (level.levelNumber === 1) {
          if (level.chapter === 1) return true;
          // 后续章节需上一章 BOSS 通关
          const prevChapterLevels = LEVELS.filter((l) => l.chapter === level.chapter - 1);
          const boss = prevChapterLevels[prevChapterLevels.length - 1];
          return !!get().progress[boss.id]?.completed;
        }
        // 同章前一关通关
        const prevLevel = LEVELS.find(
          (l) => l.chapter === level.chapter && l.levelNumber === level.levelNumber - 1
        );
        return prevLevel ? !!get().progress[prevLevel.id]?.completed : false;
      },

      getChapterStars(chapter) {
        return LEVELS.filter((l) => l.chapter === chapter).reduce(
          (sum, l) => sum + (get().progress[l.id]?.stars ?? 0),
          0
        );
      },

      totalStars() {
        return Object.values(get().progress).reduce((s, p) => s + p.stars, 0);
      },
    }),
    { name: 'fightccf_levels' }
  )
);
