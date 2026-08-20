import type { ElementType } from '@shared/constants';
import type { BattleUnit } from '../entities/BattleUnit';
import type { HitEffectType, PoseStyle } from '../types';

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  cooldown: number;
  damageMultiplier: number;
  element: ElementType;
  animationType: string;
  range: number;
  isAoe: boolean;
}

/** 生成特效的可选参数（方向 / 目标点） */
export interface EffectOptions {
  angle?: number;
  tx?: number;
  ty?: number;
}

/** 由 BattleManager 提供的伤害施加函数签名 */
export type DealDamageFn = (
  attacker: BattleUnit,
  target: BattleUnit,
  multiplier: number,
  element: ElementType,
  isSkill: boolean
) => void;

export interface SkillContext {
  caster: BattleUnit;
  targets: BattleUnit[];
  /** 由 BattleManager 提供的伤害施加函数 */
  dealDamage: DealDamageFn;
  /** 生成命中特效 */
  spawnEffect: (x: number, y: number, type: HitEffectType, color: string, radius: number, opts?: EffectOptions) => void;
  /**
   * 延迟施加伤害（用于多段 / 蓄力 / 飞行道具），delay 单位秒。
   * multFn 可选：命中瞬间根据攻击者/目标动态计算倍率（处决 / 递增加成）。
   */
  scheduleHit: (
    attacker: BattleUnit,
    getTarget: () => BattleUnit | null,
    multiplier: number,
    element: ElementType,
    delay: number,
    onHit?: (target: BattleUnit) => void,
    multFn?: (target: BattleUnit) => number
  ) => void;
  /**
   * 延迟执行自定义命中逻辑（用于穿刺 / 范围 / 需要即时枚举目标的技能）。
   * 回调在到点时被调用，提供攻击者与 deal 施伤函数。
   */
  scheduleHitCustom: (
    fn: (attacker: BattleUnit, deal: DealDamageFn) => void,
    delay: number
  ) => void;
  /** 临时改变施法者出招姿态 */
  setPose: (pose: PoseStyle) => void;
}

// 技能抽象基类
export abstract class Skill {
  readonly config: SkillConfig;
  private cooldownTimer = 0;

  constructor(config: SkillConfig) {
    this.config = config;
  }

  get id(): string {
    return this.config.id;
  }

  get isReady(): boolean {
    return this.cooldownTimer <= 0;
  }

  get cooldownRatio(): number {
    return this.config.cooldown > 0 ? this.cooldownTimer / this.config.cooldown : 0;
  }

  get cooldownRemaining(): number {
    return Math.max(0, this.cooldownTimer);
  }

  update(dt: number): void {
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
  }

  canUse(energy: number): boolean {
    return this.isReady && energy >= this.config.energyCost;
  }

  protected startCooldown(): void {
    this.cooldownTimer = this.config.cooldown;
  }

  /** 由子类实现具体表现，返回是否成功释放 */
  abstract execute(ctx: SkillContext): boolean;
}
