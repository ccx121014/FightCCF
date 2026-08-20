import type { PVPTier } from '../constants/ranks';

export interface Currency {
  gold: number;
  diamond: number;
  honorPoints: number;
}

export interface UserStats {
  totalBattles: number;
  wins: number;
  losses: number;
  highestCombo: number;
  totalDamage: number;
  charactersOwned: number;
  levelsCompleted: number;
}

export interface Settings {
  notifications: boolean;
  sound: boolean;
  music: boolean;
  soundVolume: number;
  musicVolume: number;
  onlineStatus: 'online' | 'away' | 'offline';
  allowFriendRequests: boolean;
  language: 'zh-CN' | 'en-US';
  theme: 'dark' | 'light';
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  level: number;
  exp: number;
  currency: Currency;
  pvpRating: number;
  pvpRank: PVPTier;
  pvpStars: number;
  stats: UserStats;
  settings: Settings;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Profile {
  id: string;
  username: string;
  avatarUrl?: string;
  level: number;
  pvpRank: PVPTier;
  pvpRating: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Reward {
  gold?: number;
  diamond?: number;
  exp?: number;
  honorPoints?: number;
  items?: { itemId: string; quantity: number }[];
  characters?: string[];
}
