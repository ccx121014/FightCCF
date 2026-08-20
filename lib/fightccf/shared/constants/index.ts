// 全局业务常量
export * from './elements';
export * from './rarities';
export * from './ranks';

export const APP_CONFIG = {
  name: 'FightCCF',
  version: '1.0.0',
  description: '算法竞赛主题的 2D 实时格斗 Web 游戏',
  maxUsernameLength: 20,
  minUsernameLength: 3,
  minPasswordLength: 6,
};

export const CURRENCY_CONFIG = {
  startingGold: 1000,
  startingDiamond: 300,
  startingHonor: 0,
  maxGold: 9_999_999,
  maxDiamond: 999_999,
};

export const BATTLE_CONFIG = {
  fps: 60,
  timeLimit: 120, // 秒
  maxEnergy: 100,
  energyRegenPerSec: 2,
  energyOnHit: 10,
  comboWindow: 0.5, // 秒
  invincibleFrame: 0.3, // 受伤后无敌时间
  minDamage: 1,
  defenseFactor: 0.5,
  damageVariance: [0.9, 1.1] as [number, number],
  comboBonus: [
    { min: 3, max: 5, bonus: 0.1 },
    { min: 6, max: 9, bonus: 0.2 },
    { min: 10, max: Infinity, bonus: 0.3 },
  ],
  forceCritCombo: 10,
  skillEnergyCost: { skill1: 20, skill2: 35, skill3: 50 },
  ratings: {
    S: { multiplier: 1.5, label: 'S' },
    A: { multiplier: 1.2, label: 'A' },
    B: { multiplier: 1.0, label: 'B' },
    C: { multiplier: 0, label: 'C' },
  },
};

export const LEVEL_CONFIG = {
  chapters: 6,
  starRatings: 3,
  chapterNames: ['CSP-J', 'CSP-S', 'NOIP', '省选', 'NOI', '传说级'],
};

export const GACHA_CONFIG = {
  singlePullCost: 120, // 钻石
  tenPullCost: 1080,
  legendaryPity: 90, // 五星保底
  epicPity: 10, // 四星保底
  softPityStart: 75,
  wishlistSize: 10,
  weights: { normal: 700, rare: 250, epic: 45, legendary: 5 },
};

export const SHOP_CONFIG = {
  refreshHour: 4, // 每日 4 点刷新
  dailyDealCount: 6,
  weeklyFeaturedCount: 3,
};

export const SOCIAL_CONFIG = {
  maxFriends: 100,
  maxGuildMembers: 50,
  chatMessageMaxLength: 200,
};

export const ACHIEVEMENT_CONFIG = {
  categories: ['battle', 'collection', 'social', 'progression', 'special'],
};

export const PVP_CONFIG = {
  timeLimit: 120,
  queueCheckInterval: 1000, // ms
  modes: ['ranked', 'casual'] as const,
  maxRating: 10000,
};

export const NOTIFICATION_CONFIG = {
  types: ['system', 'friend', 'guild', 'reward', 'battle'],
};

export const RATE_LIMIT_CONFIG = {
  apiWindow: 15 * 60 * 1000,
  apiMax: 100,
  authWindow: 15 * 60 * 1000,
  authMax: 10,
};
