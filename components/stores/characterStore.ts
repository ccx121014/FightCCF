import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserCharacter } from '@shared/types';
import { CHARACTERS } from '@/data/characters';

interface CharacterState {
  owned: UserCharacter[]; // 拥有的角色
  selectedId: string; // 当前出战角色
  initialized: boolean;

  init: () => void;
  addCharacter: (characterId: string) => { isNew: boolean };
  select: (characterId: string) => void;
  levelUp: (characterId: string, amount?: number) => void;
  isOwned: (characterId: string) => boolean;
}

// 初始赠送三个入门角色
const STARTER_IDS = ['bubble_sort', 'binary_search', 'quick_sort'];

function makeUserCharacter(characterId: string): UserCharacter {
  return {
    id: `uc_${characterId}_${Date.now()}`,
    characterId,
    level: 1,
    exp: 0,
    stars: CHARACTERS.find((c) => c.id === characterId)?.rarity === 'legendary' ? 5 : 1,
    isEquipped: false,
    obtainedAt: new Date().toISOString(),
  };
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      owned: [],
      selectedId: 'bubble_sort',
      initialized: false,

      init() {
        if (get().initialized) return;
        const owned = STARTER_IDS.map(makeUserCharacter);
        owned[0].isEquipped = true;
        set({ owned, selectedId: STARTER_IDS[0], initialized: true });
      },

      addCharacter(characterId) {
        const { owned } = get();
        const existing = owned.find((c) => c.characterId === characterId);
        if (existing) {
          // 重复获得转化为星级/经验
          const updated = owned.map((c) =>
            c.characterId === characterId ? { ...c, stars: Math.min(c.stars + 1, 6) } : c
          );
          set({ owned: updated });
          return { isNew: false };
        }
        set({ owned: [...owned, makeUserCharacter(characterId)] });
        return { isNew: true };
      },

      select(characterId) {
        const { owned } = get();
        if (!owned.some((c) => c.characterId === characterId)) return;
        set({
          selectedId: characterId,
          owned: owned.map((c) => ({ ...c, isEquipped: c.characterId === characterId })),
        });
      },

      levelUp(characterId, amount = 1) {
        set({
          owned: get().owned.map((c) =>
            c.characterId === characterId ? { ...c, level: c.level + amount } : c
          ),
        });
      },

      isOwned(characterId) {
        return get().owned.some((c) => c.characterId === characterId);
      },
    }),
    { name: 'fightccf_characters' }
  )
);
