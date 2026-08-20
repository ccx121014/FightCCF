import { Skill, type SkillContext, type SkillConfig } from './Skill';
import type { ElementType } from '@shared/constants';
import { ELEMENTS } from '@shared/constants';
import type { BattleUnit } from '../entities/BattleUnit';
import type { SkillDef } from './attackProfiles';

// 通用技能执行器：依据档案的 behavior 表现出不同的攻击方式。
export class ProfileSkill extends Skill {
  private def: SkillDef;
  private element: ElementType;
  private isBasic: boolean;
  private color: string;

  constructor(def: SkillDef, element: ElementType, isBasic = false) {
    const config: SkillConfig = {
      id: def.id,
      name: def.name,
      description: def.description,
      energyCost: def.energyCost,
      cooldown: def.cooldown,
      damageMultiplier: def.damageMultiplier,
      element,
      animationType: def.behavior,
      range: def.range,
      isAoe: def.aoe,
    };
    super(config);
    this.def = def;
    this.element = element;
    this.isBasic = isBasic;
    this.color = ELEMENTS[element].color;
  }

  // ---- 工具 ----
  private aliveInRange(ctx: SkillContext, range: number): BattleUnit[] {
    return ctx.targets
      .filter((t) => t.isAlive && ctx.caster.distanceTo(t) <= range)
      .sort((a, b) => ctx.caster.distanceTo(a) - ctx.caster.distanceTo(b));
  }

  /** 计算考虑处决 / 递增加成后的实际伤害倍率 */
  private mult(caster: BattleUnit, target: BattleUnit): number {
    let m = this.def.damageMultiplier;
    if (this.def.execThreshold && target.hpRatio <= this.def.execThreshold) {
      m *= 1 + (this.def.execBonus ?? 0);
    }
    if (this.def.escalatePerHpLost) {
      const lostSteps = Math.floor((1 - caster.hpRatio) * 10);
      m *= 1 + lostSteps * this.def.escalatePerHpLost;
    }
    return m;
  }

  private animDuration(): number {
    const { behavior, hits = 1, delay = 0.12 } = this.def;
    switch (behavior) {
      case 'melee':
      case 'projectile':
      case 'chain':
        return Math.max(0.3, hits * delay + 0.22);
      case 'dash':
        return 0.42;
      case 'pierce':
        return 0.4;
      case 'aoe':
        return hits > 1 ? hits * (delay || 0.16) + 0.24 : 0.5;
      case 'split':
        return 0.4;
      case 'buff':
        return 0.5;
      default:
        return 0.4;
    }
  }

  private playAnim(caster: BattleUnit, ctx: SkillContext): void {
    ctx.setPose(this.def.pose);
    caster.setAnimation(this.isBasic ? 'attack' : 'skill', this.animDuration());
  }

  execute(ctx: SkillContext): boolean {
    const { caster } = ctx;
    switch (this.def.behavior) {
      case 'melee':
        this.doMelee(ctx);
        break;
      case 'dash':
        this.doDash(ctx);
        break;
      case 'pierce':
        this.doPierce(ctx);
        break;
      case 'projectile':
        this.doProjectile(ctx);
        break;
      case 'aoe':
        this.doAoe(ctx);
        break;
      case 'chain':
        this.doChain(ctx);
        break;
      case 'split':
        this.doSplit(ctx);
        break;
      case 'buff':
        this.doBuff(ctx);
        break;
    }
    void caster;
    this.startCooldown();
    return true;
  }

  // ---- 近战多段：面向最近目标，连续拍击 ----
  private doMelee(ctx: SkillContext): void {
    const { caster, dealDamage, spawnEffect } = ctx;
    const inRange = this.aliveInRange(ctx, this.config.range);
    this.playAnim(caster, ctx);
    if (inRange.length === 0) return;
    const locked = inRange[0];
    caster.faceTowards(locked.pos.x);
    const hits = this.def.hits ?? 1;
    const delay = this.def.delay ?? 0.1;
    for (let i = 0; i < hits; i++) {
      ctx.scheduleHit(
        caster,
        () => (locked.isAlive ? locked : this.aliveInRange(ctx, this.config.range)[0] ?? null),
        this.def.damageMultiplier,
        this.element,
        i * delay,
        (t) => {
          const hx = (caster.pos.x + t.pos.x) / 2;
          const hy = (caster.pos.y + t.pos.y) / 2;
          spawnEffect(hx, hy, this.def.effect, this.color, 24 + i * 4);
        }
      );
    }
    void dealDamage;
  }

  // ---- 突进：瞬步逼近目标后重击 ----
  private doDash(ctx: SkillContext): void {
    const { caster, spawnEffect } = ctx;
    const inRange = this.aliveInRange(ctx, this.config.range);
    this.playAnim(caster, ctx);
    if (inRange.length === 0) {
      const dir = caster.facing === 'right' ? 1 : -1;
      spawnEffect(caster.pos.x + dir * 60, caster.pos.y, this.def.effect, this.color, 40, { angle: dir > 0 ? 0 : Math.PI });
      return;
    }
    const target = inRange[0];
    caster.faceTowards(target.pos.x);
    const dir = target.pos.x >= caster.pos.x ? 1 : -1;
    caster.knockback.x = dir * 220; // 突进位移
    ctx.scheduleHit(
      caster,
      () => (target.isAlive ? target : this.aliveInRange(ctx, this.config.range)[0] ?? null),
      1,
      this.element,
      0.08,
      (t) => spawnEffect(t.pos.x, t.pos.y, this.def.effect, this.color, 46, { angle: dir > 0 ? 0 : Math.PI }),
      (t) => this.mult(caster, t)
    );
  }

  // ---- 直线穿刺：贯穿前方走廊中的所有敌人 ----
  private doPierce(ctx: SkillContext): void {
    const { caster, spawnEffect } = ctx;
    this.playAnim(caster, ctx);
    const nearest = this.aliveInRange(ctx, this.config.range * 1.2)[0];
    const dirX = nearest ? Math.sign(nearest.pos.x - caster.pos.x) || (caster.facing === 'right' ? 1 : -1) : caster.facing === 'right' ? 1 : -1;
    const dirY = nearest ? (nearest.pos.y - caster.pos.y) / (this.config.range) : 0;
    const angle = Math.atan2(dirY, dirX);
    if (dirX !== 0) caster.facing = dirX > 0 ? 'right' : 'left';

    const passes = this.def.hits ?? 1;
    const delay = this.def.delay ?? 0.2;
    for (let p = 0; p < passes; p++) {
      ctx.scheduleHitCustom(
        (attacker, deal) => {
          // 命中前方走廊内所有敌人
          const hitTargets = ctx.targets.filter((t) => {
            if (!t.isAlive) return false;
            const rx = t.pos.x - attacker.pos.x;
            const ry = t.pos.y - attacker.pos.y;
            const along = rx * Math.cos(angle) + ry * Math.sin(angle);
            const perp = Math.abs(-rx * Math.sin(angle) + ry * Math.cos(angle));
            return along > 0 && along <= this.config.range && perp <= 56;
          });
          for (const t of hitTargets) deal(attacker, t, this.mult(attacker, t), this.element, !this.isBasic);
          const ex = caster.pos.x + Math.cos(angle) * this.config.range;
          const ey = caster.pos.y + Math.sin(angle) * this.config.range;
          spawnEffect(caster.pos.x, caster.pos.y, this.def.effect, this.color, 12, { angle, tx: ex, ty: ey });
        },
        p * delay
      );
    }
  }

  // ---- 飞行道具：延迟命中的远程弹体 ----
  private doProjectile(ctx: SkillContext): void {
    const { caster, spawnEffect } = ctx;
    const minRange = this.isBasic ? this.def.minRange ?? 0 : 0;
    const inRange = this.aliveInRange(ctx, this.config.range).filter((target) => ctx.caster.distanceTo(target) >= minRange);
    this.playAnim(caster, ctx);
    if (inRange.length === 0) {
      const dir = caster.facing === 'right' ? 1 : -1;
      spawnEffect(caster.pos.x + dir * 40, caster.pos.y, this.def.effect, this.color, 16, { angle: dir > 0 ? 0 : Math.PI, tx: caster.pos.x + dir * 300, ty: caster.pos.y });
      return;
    }
    const hits = this.def.hits ?? 1;
    const delay = this.def.delay ?? 0.14;
    caster.faceTowards(inRange[0].pos.x);
    for (let i = 0; i < hits; i++) {
      const target = inRange[Math.min(i, inRange.length - 1)];
      const angle = Math.atan2(target.pos.y - caster.pos.y, target.pos.x - caster.pos.x);
      // 发射视觉
      spawnEffect(caster.pos.x, caster.pos.y - caster.radius * 0.2, this.def.effect, this.color, 14, { angle, tx: target.pos.x, ty: target.pos.y });
      ctx.scheduleHit(
        caster,
        () => (target.isAlive ? target : this.aliveInRange(ctx, this.config.range)[0] ?? null),
        this.def.damageMultiplier,
        this.element,
        (delay) * (i + 1),
        (t) => spawnEffect(t.pos.x, t.pos.y, 'hit', this.color, 22, { angle })
      );
    }
  }

  // ---- 范围：以自身为中心，可多波扩散 ----
  private doAoe(ctx: SkillContext): void {
    const { caster, spawnEffect } = ctx;
    this.playAnim(caster, ctx);
    const waves = this.def.hits ?? 1;
    const delay = this.def.delay ?? 0.16;
    for (let w = 0; w < waves; w++) {
      const waveRange = this.config.range * (waves > 1 ? 0.6 + 0.4 * ((w + 1) / waves) : 1);
      ctx.scheduleHitCustom((attacker, deal) => {
        spawnEffect(attacker.pos.x, attacker.pos.y, this.def.effect, this.color, waveRange);
        const hit = ctx.targets.filter((t) => t.isAlive && attacker.distanceTo(t) <= waveRange);
        for (const t of hit) {
          deal(attacker, t, this.mult(attacker, t), this.element, !this.isBasic);
          spawnEffect(t.pos.x, t.pos.y, 'burst', this.color, 28);
        }
      }, w * delay);
    }
  }

  // ---- 连锁：在敌群间依次跳跃 ----
  private doChain(ctx: SkillContext): void {
    const { caster, spawnEffect } = ctx;
    this.playAnim(caster, ctx);
    const maxJumps = this.def.hits ?? 3;
    const delay = this.def.delay ?? 0.1;
    const chainRange = 180;
    // 预先计算连锁顺序（贪心取最近未命中）
    const order: BattleUnit[] = [];
    let from = caster;
    const pool = ctx.targets.filter((t) => t.isAlive);
    for (let j = 0; j < maxJumps; j++) {
      const cand = pool
        .filter((t) => !order.includes(t) && from.distanceTo(t) <= (j === 0 ? this.config.range : chainRange))
        .sort((a, b) => from.distanceTo(a) - from.distanceTo(b))[0];
      if (!cand) break;
      order.push(cand);
      from = cand;
    }
    let prev = caster;
    order.forEach((t, idx) => {
      const source = prev;
      ctx.scheduleHit(
        caster,
        () => (t.isAlive ? t : null),
        this.def.damageMultiplier,
        this.element,
        idx * delay,
        (tt) => spawnEffect(source.pos.x, source.pos.y, 'chain', this.color, 10, { tx: tt.pos.x, ty: tt.pos.y }),
        (tt) => this.mult(caster, tt)
      );
      prev = t;
    });
    if (order.length === 0) {
      spawnEffect(caster.pos.x, caster.pos.y, 'ring', this.color, this.config.range * 0.6);
    }
  }

  // ---- 分裂：同时命中多个不同目标（分叉） ----
  private doSplit(ctx: SkillContext): void {
    const { caster, spawnEffect } = ctx;
    this.playAnim(caster, ctx);
    const count = this.def.hits ?? 2;
    const targets = this.aliveInRange(ctx, this.config.range).slice(0, count);
    if (targets.length === 0) {
      const dir = caster.facing === 'right' ? 1 : -1;
      spawnEffect(caster.pos.x + dir * 40, caster.pos.y, this.def.effect, this.color, 16, { angle: dir > 0 ? 0 : Math.PI, tx: caster.pos.x + dir * 260, ty: caster.pos.y - 40 });
      return;
    }
    for (const t of targets) {
      const angle = Math.atan2(t.pos.y - caster.pos.y, t.pos.x - caster.pos.x);
      spawnEffect(caster.pos.x, caster.pos.y - caster.radius * 0.2, this.def.effect, this.color, 14, { angle, tx: t.pos.x, ty: t.pos.y });
      ctx.scheduleHit(
        caster,
        () => (t.isAlive ? t : null),
        this.def.damageMultiplier,
        this.element,
        0.12,
        (tt) => spawnEffect(tt.pos.x, tt.pos.y, 'hit', this.color, 22, { angle })
      );
    }
  }

  // ---- 增益：护盾 / 治疗 + 范围伤害 ----
  private doBuff(ctx: SkillContext): void {
    const { caster, spawnEffect } = ctx;
    this.playAnim(caster, ctx);
    if (this.def.shield) caster.addShield(this.def.shield * caster.maxHp);
    if (this.def.selfHeal) caster.heal(this.def.selfHeal * caster.maxHp);
    spawnEffect(caster.pos.x, caster.pos.y, this.def.effect, this.color, this.config.range * 0.7);
    const hit = this.aliveInRange(ctx, this.config.range);
    for (const t of hit) {
      ctx.scheduleHit(
        caster,
        () => (t.isAlive ? t : null),
        this.def.damageMultiplier,
        this.element,
        0.1,
        (tt) => spawnEffect(tt.pos.x, tt.pos.y, 'chain', this.color, 24, { tx: caster.pos.x, ty: caster.pos.y })
      );
    }
  }
}
