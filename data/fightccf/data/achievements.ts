import type { Achievement } from '@shared/types';

// 成就定义：分为战斗 / 收集 / 进度 / 特殊 四大类
// target 表示达成阈值，reward 为达成奖励
export const ACHIEVEMENTS: Achievement[] = [
  // —— 战斗类 ——
  {
    id: 'first_blood',
    name: '初出茅庐',
    description: '赢得你的第一场战斗',
    category: 'battle',
    icon: '🗡️',
    target: 1,
    reward: { gold: 200, exp: 50 },
  },
  {
    id: 'veteran_fighter',
    name: '身经百战',
    description: '累计参与 50 场战斗',
    category: 'battle',
    icon: '⚔️',
    target: 50,
    reward: { gold: 1000, diamond: 30 },
  },
  {
    id: 'winning_streak',
    name: '连战连捷',
    description: '累计获得 30 场胜利',
    category: 'battle',
    icon: '🏅',
    target: 30,
    reward: { gold: 1500, honorPoints: 50 },
  },
  {
    id: 'combo_master',
    name: '连击大师',
    description: '单场达成 30 连击',
    category: 'battle',
    icon: '💥',
    target: 30,
    reward: { diamond: 60, exp: 200 },
  },
  {
    id: 'damage_dealer',
    name: '伤害机器',
    description: '累计造成 100,000 点伤害',
    category: 'battle',
    icon: '🔥',
    target: 100000,
    reward: { gold: 2000, diamond: 50 },
  },

  // —— 收集类 ——
  {
    id: 'collector_novice',
    name: '收藏入门',
    description: '拥有 5 名算法战士',
    category: 'collection',
    icon: '📦',
    target: 5,
    reward: { gold: 500, diamond: 20 },
  },
  {
    id: 'collector_expert',
    name: '图鉴达人',
    description: '拥有 10 名算法战士',
    category: 'collection',
    icon: '📖',
    target: 10,
    reward: { diamond: 80, honorPoints: 30 },
  },
  {
    id: 'collector_master',
    name: '全图鉴收藏家',
    description: '集齐全部 14 名算法战士',
    category: 'collection',
    icon: '👑',
    target: 14,
    reward: { diamond: 300, honorPoints: 100 },
  },

  // —— 进度类 ——
  {
    id: 'star_hunter',
    name: '摘星之人',
    description: '累计收集 20 颗关卡星星',
    category: 'progression',
    icon: '⭐',
    target: 20,
    reward: { gold: 1000, diamond: 30 },
  },
  {
    id: 'star_conqueror',
    name: '星海征服者',
    description: '累计收集 60 颗关卡星星',
    category: 'progression',
    icon: '🌟',
    target: 60,
    reward: { diamond: 120, honorPoints: 60 },
  },
  {
    id: 'level_rise',
    name: '崭露头角',
    description: '账号等级达到 10 级',
    category: 'progression',
    icon: '📈',
    target: 10,
    reward: { gold: 800, exp: 100 },
  },
  {
    id: 'level_ascend',
    name: '登峰造极',
    description: '账号等级达到 30 级',
    category: 'progression',
    icon: '🚀',
    target: 30,
    reward: { diamond: 200, honorPoints: 80 },
  },

  // —— 特殊类 ——
  {
    id: 'rank_climber',
    name: '段位攀登者',
    description: '段位分达到 2000（黄金）',
    category: 'special',
    icon: '🏆',
    target: 2000,
    reward: { honorPoints: 100, diamond: 50 },
  },
  {
    id: 'rich_tycoon',
    name: '算法富豪',
    description: '持有金币达到 10,000',
    category: 'special',
    icon: '🪙',
    target: 10000,
    reward: { diamond: 40 },
  },
];

export type AchievementProgressInput = {
  totalBattles: number;
  wins: number;
  highestCombo: number;
  totalDamage: number;
  ownedCount: number;
  totalStars: number;
  level: number;
  pvpRating: number;
  gold: number;
};

// 根据当前玩家状态计算某成就的进度值
export function computeAchievementProgress(
  id: string,
  s: AchievementProgressInput
): number {
  switch (id) {
    case 'first_blood':
      return s.wins;
    case 'veteran_fighter':
      return s.totalBattles;
    case 'winning_streak':
      return s.wins;
    case 'combo_master':
      return s.highestCombo;
    case 'damage_dealer':
      return s.totalDamage;
    case 'collector_novice':
    case 'collector_expert':
    case 'collector_master':
      return s.ownedCount;
    case 'star_hunter':
    case 'star_conqueror':
      return s.totalStars;
    case 'level_rise':
    case 'level_ascend':
      return s.level;
    case 'rank_climber':
      return s.pvpRating;
    case 'rich_tycoon':
      return s.gold;
    default:
      return 0;
  }
}
