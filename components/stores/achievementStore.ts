import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AchievementState {
  // 已领取奖励的成就 id 集合
  claimed: Record<string, boolean>;

  isClaimed: (id: string) => boolean;
  claim: (id: string) => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      claimed: {},

      isClaimed(id) {
        return !!get().claimed[id];
      },

      claim(id) {
        set({ claimed: { ...get().claimed, [id]: true } });
      },
    }),
    { name: 'fightccf_achievements' }
  )
);
