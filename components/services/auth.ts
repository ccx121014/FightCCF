import type { User, AuthResponse } from '@shared/types';
import { CURRENCY_CONFIG } from '@shared/constants';
import { apiRequest, isOfflineMode } from './api';

// 离线模式下的本地用户存储（用于沙盒/无后端预览）
const OFFLINE_USERS_KEY = 'fightccf_offline_users';

interface OfflineUserRecord {
  user: User;
  password: string;
}

function loadOfflineUsers(): Record<string, OfflineUserRecord> {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveOfflineUsers(users: Record<string, OfflineUserRecord>): void {
  localStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(users));
}

function makeDefaultUser(email: string, username: string): User {
  return {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    username,
    level: 1,
    exp: 0,
    currency: {
      gold: CURRENCY_CONFIG.startingGold,
      diamond: CURRENCY_CONFIG.startingDiamond,
      honorPoints: CURRENCY_CONFIG.startingHonor,
    },
    pvpRating: 1200,
    pvpRank: 'silver',
    pvpStars: 0,
    stats: {
      totalBattles: 0,
      wins: 0,
      losses: 0,
      highestCombo: 0,
      totalDamage: 0,
      charactersOwned: 3,
      levelsCompleted: 0,
    },
    settings: {
      notifications: true,
      sound: true,
      music: true,
      soundVolume: 70,
      musicVolume: 50,
      onlineStatus: 'online',
      allowFriendRequests: true,
      language: 'zh-CN',
      theme: 'dark',
    },
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

export const authService = {
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    if (isOfflineMode) {
      const users = loadOfflineUsers();
      if (Object.values(users).some((u) => u.user.email === email)) {
        throw new Error('该邮箱已被注册');
      }
      const user = makeDefaultUser(email, username);
      users[user.id] = { user, password };
      saveOfflineUsers(users);
      return { user, token: `offline_${user.id}` };
    }
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { email, username, password },
      auth: false,
    });
    if (!res.success || !res.data) throw new Error(res.error || '注册失败');
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    if (isOfflineMode) {
      const users = loadOfflineUsers();
      const record = Object.values(users).find((u) => u.user.email === email);
      if (!record) throw new Error('用户不存在，请先注册');
      if (record.password !== password) throw new Error('密码错误');
      record.user.lastLoginAt = new Date().toISOString();
      users[record.user.id] = record;
      saveOfflineUsers(users);
      return { user: record.user, token: `offline_${record.user.id}` };
    }
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    if (!res.success || !res.data) throw new Error(res.error || '登录失败');
    return res.data;
  },

  async getMe(): Promise<User | null> {
    if (isOfflineMode) return null; // 离线模式由本地 store 持有
    const res = await apiRequest<User>('/auth/me');
    return res.success && res.data ? res.data : null;
  },

  /** 离线模式下持久化用户变更（金币、进度等） */
  syncOfflineUser(user: User): void {
    if (!isOfflineMode) return;
    const users = loadOfflineUsers();
    if (users[user.id]) {
      users[user.id].user = user;
      saveOfflineUsers(users);
    }
  },
};
