// PVP 段位配置：8 段位
export type PVPTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'grandmaster'
  | 'challenger';

export interface RankConfig {
  id: PVPTier;
  name: string;
  nameEn: string;
  color: string;
  /** 段位分范围 [min, max]，max 为 Infinity 表示无上限 */
  ratingRange: [number, number];
  /** 升段所需星级 */
  starsToPromote: number;
  /** 匹配段位分范围 */
  matchRange: number;
}

export const RANKS: Record<PVPTier, RankConfig> = {
  bronze: {
    id: 'bronze',
    name: '青铜',
    nameEn: 'Bronze',
    color: '#b45309',
    ratingRange: [0, 999],
    starsToPromote: 3,
    matchRange: 200,
  },
  silver: {
    id: 'silver',
    name: '白银',
    nameEn: 'Silver',
    color: '#94a3b8',
    ratingRange: [1000, 1999],
    starsToPromote: 3,
    matchRange: 250,
  },
  gold: {
    id: 'gold',
    name: '黄金',
    nameEn: 'Gold',
    color: '#fbbf24',
    ratingRange: [2000, 2999],
    starsToPromote: 4,
    matchRange: 300,
  },
  platinum: {
    id: 'platinum',
    name: '铂金',
    nameEn: 'Platinum',
    color: '#2dd4bf',
    ratingRange: [3000, 3999],
    starsToPromote: 4,
    matchRange: 350,
  },
  diamond: {
    id: 'diamond',
    name: '钻石',
    nameEn: 'Diamond',
    color: '#38bdf8',
    ratingRange: [4000, 4999],
    starsToPromote: 5,
    matchRange: 400,
  },
  master: {
    id: 'master',
    name: '大师',
    nameEn: 'Master',
    color: '#a855f7',
    ratingRange: [5000, 5999],
    starsToPromote: 10,
    matchRange: 500,
  },
  grandmaster: {
    id: 'grandmaster',
    name: '宗师',
    nameEn: 'Grandmaster',
    color: '#ec4899',
    ratingRange: [6000, 7999],
    starsToPromote: 20,
    matchRange: 600,
  },
  challenger: {
    id: 'challenger',
    name: '王者',
    nameEn: 'Challenger',
    color: '#f43f5e',
    ratingRange: [8000, Infinity],
    starsToPromote: 100,
    matchRange: 800,
  },
};

export const RANK_ORDER: PVPTier[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'master',
  'grandmaster',
  'challenger',
];

// 段位分规则
export const RANK_RULES = {
  winBase: 20,
  loseBase: -15,
  maxWinStreakBonus: 15,
  higherRankBonus: 10,
  seasonDays: 90,
  inactiveDays: 7,
  dailyDecay: 5,
  maxDecay: 50,
};

export function getRankByRating(rating: number): RankConfig {
  for (const tier of RANK_ORDER) {
    const cfg = RANKS[tier];
    if (rating >= cfg.ratingRange[0] && rating <= cfg.ratingRange[1]) {
      return cfg;
    }
  }
  return RANKS.challenger;
}
