import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Reward } from '@shared/types';
import { CURRENCY_CONFIG } from '@shared/constants';
import { authService } from '@/services/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;

  // 货币/经验变更
  addCurrency: (delta: { gold?: number; diamond?: number; honorPoints?: number }) => void;
  spendCurrency: (cost: { gold?: number; diamond?: number; honorPoints?: number }) => boolean;
  addExp: (exp: number) => void;
  recordBattle: (win: boolean, combo: number, damage: number) => void;
}

function clamp(v: number, max: number): number {
  return Math.max(0, Math.min(max, v));
}

// 经验升级曲线
function expForLevel(level: number): number {
  return 100 + (level - 1) * 80;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      async login(email, password) {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authService.login(email, password);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (e) {
          set({ isLoading: false, error: e instanceof Error ? e.message : '登录失败' });
          throw e;
        }
      },

      async register(email, username, password) {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authService.register(email, username, password);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (e) {
          set({ isLoading: false, error: e instanceof Error ? e.message : '注册失败' });
          throw e;
        }
      },

      logout() {
        set({ user: null, token: null, isAuthenticated: false });
      },

      async checkAuth() {
        const { token, user } = get();
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        // 离线 token 直接信任本地用户
        if (token.startsWith('offline_')) {
          set({ isAuthenticated: !!user });
          return;
        }
        // 在线：带超时的校验
        try {
          const fresh = await Promise.race([
            authService.getMe(),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
          ]);
          if (fresh) {
            set({ user: fresh, isAuthenticated: true });
          } else {
            set({ isAuthenticated: !!user });
          }
        } catch {
          // 校验失败保留本地态，避免误登出
          set({ isAuthenticated: !!user });
        }
      },

      clearError() {
        set({ error: null });
      },

      addCurrency(delta) {
        const { user } = get();
        if (!user) return;
        const currency = {
          gold: clamp(user.currency.gold + (delta.gold ?? 0), CURRENCY_CONFIG.maxGold),
          diamond: clamp(user.currency.diamond + (delta.diamond ?? 0), CURRENCY_CONFIG.maxDiamond),
          honorPoints: Math.max(0, user.currency.honorPoints + (delta.honorPoints ?? 0)),
        };
        const updated = { ...user, currency };
        set({ user: updated });
        authService.syncOfflineUser(updated);
      },

      spendCurrency(cost) {
        const { user } = get();
        if (!user) return false;
        const g = cost.gold ?? 0;
        const d = cost.diamond ?? 0;
        const h = cost.honorPoints ?? 0;
        if (user.currency.gold < g || user.currency.diamond < d || user.currency.honorPoints < h) {
          return false;
        }
        const updated = {
          ...user,
          currency: {
            gold: user.currency.gold - g,
            diamond: user.currency.diamond - d,
            honorPoints: user.currency.honorPoints - h,
          },
        };
        set({ user: updated });
        authService.syncOfflineUser(updated);
        return true;
      },

      addExp(exp) {
        const { user } = get();
        if (!user) return;
        let level = user.level;
        let curExp = user.exp + exp;
        while (curExp >= expForLevel(level)) {
          curExp -= expForLevel(level);
          level += 1;
        }
        const updated = { ...user, level, exp: curExp };
        set({ user: updated });
        authService.syncOfflineUser(updated);
      },

      recordBattle(win, combo, damage) {
        const { user } = get();
        if (!user) return;
        const stats = {
          ...user.stats,
          totalBattles: user.stats.totalBattles + 1,
          wins: user.stats.wins + (win ? 1 : 0),
          losses: user.stats.losses + (win ? 0 : 1),
          highestCombo: Math.max(user.stats.highestCombo, combo),
          totalDamage: user.stats.totalDamage + damage,
        };
        const updated = { ...user, stats };
        set({ user: updated });
        authService.syncOfflineUser(updated);
      },
    }),
    {
      name: 'fightccf_auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);

export type { Reward };
