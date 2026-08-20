// 稀有度配置：4 档
export type RarityType = 'normal' | 'rare' | 'epic' | 'legendary';

export interface RarityConfig {
  id: RarityType;
  name: string;
  nameEn: string;
  stars: number;
  color: string;
  gradient: [string, string];
  glow: string;
  /** 抽卡权重 */
  weight: number;
  /** 出售价格（金币） */
  sellPrice: number;
  /** 升级消耗基数 */
  upgradeCost: number;
  /** 进化成本（钻石） */
  evolveCost: number;
}

export const RARITIES: Record<RarityType, RarityConfig> = {
  normal: {
    id: 'normal',
    name: '普通',
    nameEn: 'Normal',
    stars: 2,
    color: '#94a3b8',
    gradient: ['#64748b', '#94a3b8'],
    glow: 'rgba(148,163,184,0.5)',
    weight: 700,
    sellPrice: 50,
    upgradeCost: 100,
    evolveCost: 0,
  },
  rare: {
    id: 'rare',
    name: '稀有',
    nameEn: 'Rare',
    stars: 3,
    color: '#38bdf8',
    gradient: ['#0ea5e9', '#38bdf8'],
    glow: 'rgba(56,189,248,0.5)',
    weight: 250,
    sellPrice: 200,
    upgradeCost: 300,
    evolveCost: 50,
  },
  epic: {
    id: 'epic',
    name: '史诗',
    nameEn: 'Epic',
    stars: 4,
    color: '#a855f7',
    gradient: ['#9333ea', '#c084fc'],
    glow: 'rgba(168,85,247,0.6)',
    weight: 45,
    sellPrice: 800,
    upgradeCost: 800,
    evolveCost: 150,
  },
  legendary: {
    id: 'legendary',
    name: '传说',
    nameEn: 'Legendary',
    stars: 5,
    color: '#fbbf24',
    gradient: ['#f59e0b', '#fde047'],
    glow: 'rgba(251,191,36,0.7)',
    weight: 5,
    sellPrice: 3000,
    upgradeCost: 2000,
    evolveCost: 500,
  },
};

export const RARITY_ORDER: RarityType[] = ['normal', 'rare', 'epic', 'legendary'];

export function getRarityConfig(rarity: RarityType): RarityConfig {
  return RARITIES[rarity];
}
