import { BATTLE_CONFIG } from '@shared/constants';
import type { BattleUnit } from '../entities/BattleUnit';

export interface DamageResult {
  amount: number;
  isCrit: boolean;
  elementMultiplier: number;
  reaction?: string;
}

export interface DamageParams {
  attacker: BattleUnit;
  defender: BattleUnit;
  skillMultiplier: number;
  comboBonus: number;
  forceCrit: boolean;
  elementMultiplier: number;
  reaction?: string;
}

// 伤害计算：攻击×倍率 - 防御×0.5，含暴击、连击、元素、随机浮动
export class DamageCalculator {
  static calculate(params: DamageParams): DamageResult {
    const { attacker, defender, skillMultiplier, comboBonus, forceCrit, elementMultiplier, reaction } = params;

    const atk = attacker.stats.attack;
    const def = defender.stats.defense;

    // 基础伤害
    let base = atk * skillMultiplier - def * BATTLE_CONFIG.defenseFactor;
    base = Math.max(base, atk * skillMultiplier * 0.15); // 至少造成技能伤害的 15%

    // 连击加成
    base *= 1 + comboBonus;

    // 元素加成
    base *= elementMultiplier;

    // 暴击判定
    const isCrit = forceCrit || Math.random() < attacker.stats.critRate;
    if (isCrit) base *= attacker.stats.critDamage;

    // 随机浮动
    const [lo, hi] = BATTLE_CONFIG.damageVariance;
    base *= lo + Math.random() * (hi - lo);

    const amount = Math.max(BATTLE_CONFIG.minDamage, Math.round(base));

    return { amount, isCrit, elementMultiplier, reaction };
  }
}
