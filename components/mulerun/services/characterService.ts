import type { Character } from '@shared/types';
import { CHARACTERS, getCharacter } from '@/data/characters';
import { apiRequest, isOfflineMode } from './api';

// 角色数据服务：离线用本地静态数据，在线走后端
export const characterService = {
  async getAll(): Promise<Character[]> {
    if (isOfflineMode) return CHARACTERS;
    const res = await apiRequest<Character[]>('/characters', { auth: false });
    return res.success && res.data ? res.data : CHARACTERS;
  },

  async getById(id: string): Promise<Character | undefined> {
    if (isOfflineMode) return getCharacter(id);
    const res = await apiRequest<Character>(`/characters/${id}`, { auth: false });
    return res.success && res.data ? res.data : getCharacter(id);
  },

  getByElement(element: string): Character[] {
    return CHARACTERS.filter((c) => c.element === element);
  },

  getByRarity(rarity: string): Character[] {
    return CHARACTERS.filter((c) => c.rarity === rarity);
  },
};
