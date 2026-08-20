import type { ElementType } from '@shared/constants';

export interface Vector2 {
  x: number;
  y: number;
}

export type Facing = 'left' | 'right';

export type AnimationState =
  | 'idle'
  | 'walk'
  | 'attack'
  | 'skill'
  | 'hurt'
  | 'death';

// 出招姿态：驱动火柴人不同的肢体动作
export type PoseStyle =
  | 'punch' // 直拳连击（冒泡 / KMP）
  | 'slash' // 挥砍分割（快排 / 后缀自动机）
  | 'shoot' // 拉弓瞄准（二分）
  | 'cast' // 抬手施法（BFS / FFT / 线段树 / 迪杰斯特拉 / 字典树）
  | 'thrust' // 直线突刺（DFS）
  | 'guard' // 抱守聚合（并查集）
  | 'stomp'; // 蓄力下砸（动态规划 / 贪心）

export interface UnitConfig {
  id: string;
  name: string;
  element: ElementType;
  color: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
  isPlayer: boolean;
  /** 角色图鉴 id，用于加载算法攻击档案 */
  characterId?: string;
  /** 默认出招姿态（敌人渲染用） */
  attackStyle?: PoseStyle;
}

export interface DamageNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  isCrit: boolean;
  color: string;
  reaction?: string;
}

export type HitEffectType =
  | 'hit' // 星形冲击（普攻命中）
  | 'slash' // 弧形斩击
  | 'burst' // 爆裂圆
  | 'ring' // 扩散环
  | 'arrow' // 二分：飞行的箭 / 折半标记
  | 'bubble' // 冒泡：上浮的气泡
  | 'wave' // FFT：正弦波纹
  | 'segment' // 线段树：区间方块
  | 'chain' // 并查集 / 迪杰斯特拉：连接的节点链
  | 'pierce' // DFS / 快排：直线穿刺光束
  | 'split' // 字典树：分叉射线
  | 'grid'; // BFS：层层扩散的方格

export interface HitEffect {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  type: HitEffectType;
  /** 朝向角度（弧度），用于箭 / 穿刺 / 斩击等有方向的特效 */
  angle?: number;
  /** 目标点，用于连线类特效（chain / pierce） */
  tx?: number;
  ty?: number;
}

export interface SkillCastResult {
  success: boolean;
  reason?: string;
}

export interface BattleCallbacks {
  onStateChange?: () => void;
  onEnd?: (victory: boolean) => void;
}
