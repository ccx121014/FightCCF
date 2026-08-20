// 元素系统配置：9 种元素，克制关系与元素反应
export type ElementType =
  | 'thunder'
  | 'water'
  | 'ice'
  | 'nature'
  | 'dark'
  | 'fire'
  | 'earth'
  | 'wind'
  | 'light';

export type ElementalReactionType =
  | 'superconduct' // 超导
  | 'overload' // 过载
  | 'vaporize' // 蒸发
  | 'melt' // 融化
  | 'electro_charged' // 感电
  | 'frozen' // 冻结
  | 'swirl' // 扩散
  | 'crystallize' // 结晶
  | 'burning' // 燃烧
  | 'quicken'; // 激化

export interface ElementConfig {
  id: ElementType;
  name: string;
  nameEn: string;
  color: string;
  glow: string;
  /** 克制的目标元素（对其造成额外伤害） */
  strongAgainst: ElementType[];
  /** 被克制的元素 */
  weakAgainst: ElementType[];
  /** 可参与触发的元素反应 */
  reactions: ElementalReactionType[];
}

export const ELEMENTS: Record<ElementType, ElementConfig> = {
  thunder: {
    id: 'thunder',
    name: '雷',
    nameEn: 'Thunder',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.6)',
    strongAgainst: ['water'],
    weakAgainst: ['ice'],
    reactions: ['electro_charged', 'overload', 'superconduct'],
  },
  water: {
    id: 'water',
    name: '水',
    nameEn: 'Water',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.6)',
    strongAgainst: ['fire'],
    weakAgainst: ['light'],
    reactions: ['vaporize', 'electro_charged', 'frozen'],
  },
  ice: {
    id: 'ice',
    name: '冰',
    nameEn: 'Ice',
    color: '#7dd3fc',
    glow: 'rgba(125,211,252,0.6)',
    strongAgainst: ['thunder'],
    weakAgainst: ['fire'],
    reactions: ['frozen', 'melt', 'superconduct'],
  },
  nature: {
    id: 'nature',
    name: '草',
    nameEn: 'Nature',
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.6)',
    strongAgainst: ['water'],
    weakAgainst: ['fire'],
    reactions: ['swirl', 'burning', 'crystallize'],
  },
  dark: {
    id: 'dark',
    name: '暗',
    nameEn: 'Dark',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.6)',
    strongAgainst: ['nature'],
    weakAgainst: ['light'],
    reactions: ['quicken', 'burning', 'overload'],
  },
  fire: {
    id: 'fire',
    name: '火',
    nameEn: 'Fire',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.6)',
    strongAgainst: ['ice'],
    weakAgainst: ['water'],
    reactions: ['vaporize', 'overload', 'burning'],
  },
  earth: {
    id: 'earth',
    name: '岩',
    nameEn: 'Earth',
    color: '#d97706',
    glow: 'rgba(217,119,6,0.6)',
    strongAgainst: ['thunder'],
    weakAgainst: ['wind'],
    reactions: ['crystallize', 'swirl', 'overload'],
  },
  wind: {
    id: 'wind',
    name: '风',
    nameEn: 'Wind',
    color: '#2dd4bf',
    glow: 'rgba(45,212,191,0.6)',
    strongAgainst: ['fire'],
    weakAgainst: ['earth'],
    reactions: ['swirl', 'overload', 'quicken'],
  },
  light: {
    id: 'light',
    name: '光',
    nameEn: 'Light',
    color: '#fde047',
    glow: 'rgba(253,224,71,0.6)',
    strongAgainst: ['dark'],
    weakAgainst: ['dark'],
    reactions: ['quicken', 'burning', 'crystallize'],
  },
};

// 元素克制伤害加成
export const ELEMENT_ADVANTAGE_MULTIPLIER = 1.25;
export const ELEMENT_DISADVANTAGE_MULTIPLIER = 0.8;

export interface ReactionConfig {
  id: ElementalReactionType;
  name: string;
  /** 触发所需的两个元素（无序） */
  trigger: [ElementType, ElementType];
  /** 伤害倍率加成 */
  multiplier: number;
  description: string;
}

export const ELEMENTAL_REACTIONS: ReactionConfig[] = [
  {
    id: 'vaporize',
    name: '蒸发',
    trigger: ['fire', 'water'],
    multiplier: 2.0,
    description: '火与水结合，造成巨额爆发伤害',
  },
  {
    id: 'melt',
    name: '融化',
    trigger: ['fire', 'ice'],
    multiplier: 2.0,
    description: '火焰融化冰霜，造成高额伤害',
  },
  {
    id: 'overload',
    name: '过载',
    trigger: ['fire', 'thunder'],
    multiplier: 1.75,
    description: '雷火过载爆炸，附带范围伤害',
  },
  {
    id: 'electro_charged',
    name: '感电',
    trigger: ['thunder', 'water'],
    multiplier: 1.5,
    description: '雷电导入水中，造成持续感电伤害',
  },
  {
    id: 'superconduct',
    name: '超导',
    trigger: ['thunder', 'ice'],
    multiplier: 1.5,
    description: '超导反应，降低目标防御',
  },
  {
    id: 'frozen',
    name: '冻结',
    trigger: ['water', 'ice'],
    multiplier: 1.0,
    description: '冻结目标，使其无法行动',
  },
  {
    id: 'swirl',
    name: '扩散',
    trigger: ['wind', 'fire'],
    multiplier: 1.2,
    description: '风将元素扩散至周围敌人',
  },
  {
    id: 'crystallize',
    name: '结晶',
    trigger: ['earth', 'fire'],
    multiplier: 1.0,
    description: '生成结晶护盾，吸收伤害',
  },
  {
    id: 'burning',
    name: '燃烧',
    trigger: ['fire', 'nature'],
    multiplier: 1.5,
    description: '点燃草木，造成持续灼烧',
  },
  {
    id: 'quicken',
    name: '激化',
    trigger: ['dark', 'nature'],
    multiplier: 1.6,
    description: '催化反应，强化下一次攻击',
  },
];

/** 判断攻击方元素对防守方元素是否有克制优势 */
export function getElementMultiplier(attacker: ElementType, defender: ElementType): number {
  const cfg = ELEMENTS[attacker];
  if (cfg.strongAgainst.includes(defender)) return ELEMENT_ADVANTAGE_MULTIPLIER;
  if (cfg.weakAgainst.includes(defender)) return ELEMENT_DISADVANTAGE_MULTIPLIER;
  return 1.0;
}

/** 查找两个元素能触发的反应 */
export function findReaction(a: ElementType, b: ElementType): ReactionConfig | null {
  return (
    ELEMENTAL_REACTIONS.find(
      (r) =>
        (r.trigger[0] === a && r.trigger[1] === b) ||
        (r.trigger[0] === b && r.trigger[1] === a)
    ) ?? null
  );
}
