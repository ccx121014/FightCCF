import type { ElementType } from '../constants/elements';
import type { RarityType } from '../constants/rarities';

export type CharacterType = 'warrior' | 'mage' | 'assassin' | 'support' | 'tank' | 'archer';

export type SkillType = 'active' | 'passive' | 'ultimate' | 'basic';

export type TargetType = 'single' | 'aoe' | 'self' | 'line' | 'random';

export type EffectType =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'shield'
  | 'stun'
  | 'dot';

export interface CharacterStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  element: ElementType;
  energyCost: number;
  cooldown: number;
  damageMultiplier: number;
  targetType: TargetType;
  effectType: EffectType;
  rangeValue: number;
  animationType: string;
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  effect: Record<string, unknown>;
}

export interface Equipment {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'accessory';
  stats: Partial<CharacterStats>;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  element: ElementType;
  rarity: RarityType;
  type: CharacterType;
  baseStats: CharacterStats;
  passive: Passive;
  skills: Skill[];
  unlockRequirement?: string;
  avatarColor: string;
}

export interface UserCharacter {
  id: string;
  characterId: string;
  level: number;
  exp: number;
  stars: number;
  isEquipped: boolean;
  obtainedAt: string;
}
