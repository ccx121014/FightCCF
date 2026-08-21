import { BATTLE_CONFIG, type ElementType } from '@shared/constants';
import type { BattlePhase, BattleRating } from '@shared/types';
import { BattleUnit } from '../entities/BattleUnit';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { SkillManager } from '../skills/SkillManager';
import type { SkillContext } from '../skills/Skill';
import { EnergySystem } from './EnergySystem';
import { ComboSystem } from './ComboSystem';
import { ElementalSystem } from './ElementalSystem';
import { DamageCalculator } from './DamageCalculator';
import type { DamageNumber, HitEffect, UnitConfig } from '../types';
import { drawStickFigure, drawBattlefield, drawHitEffect, drawDamageNumber, drawUnitHealthBar } from './renderer';
import { drawEnemyForm, hasEnemyForm } from './enemyForms';

export interface BattleSetup {
  player: UnitConfig;
  enemies: { config: UnitConfig; x: number; y: number }[];
  width: number;
  height: number;
  /** 本关时间限制（秒），缺省回退到全局配置 */
  timeLimit?: number;
}

// 综合评级结果（含各维度分项，供结算界面展示）
export interface RatingResult {
  rating: BattleRating;
  score: number;
  timeScore: number;
  hpScore: number;
  comboScore: number;
  hpRatio: number;
}

export class BattleManager {
  phase: BattlePhase = 'waiting';
  readonly timeLimit: number;
  timeRemaining: number;

  player!: Player;
  enemies: Enemy[] = [];

  energy: EnergySystem;
  combo: ComboSystem;
  elemental: ElementalSystem;
  skills: SkillManager;

  private width: number;
  private height: number;

  private damageNumbers: DamageNumber[] = [];
  private hitEffects: HitEffect[] = [];
  private effectIdSeq = 0;
  private totalDamage = 0;

  private startTime = 0;
  private endCallback?: (victory: boolean) => void;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private dashCooldown = 0;
  private basicChainStep = 0;
  private basicChainTimer = 0;
  private guardTimer = 0;
  private parryTimer = 0;
  private hitStopTimer = 0;
  private algorithmScore = 0;

  constructor(setup: BattleSetup, playerElement: ElementType) {
    this.width = setup.width;
    this.height = setup.height;
    this.timeLimit = setup.timeLimit ?? BATTLE_CONFIG.timeLimit;
    this.timeRemaining = this.timeLimit;
    this.energy = new EnergySystem(0);
    this.combo = new ComboSystem();
    this.elemental = new ElementalSystem();
    this.skills = new SkillManager(playerElement, setup.player.characterId);

    this.player = new Player(setup.player, { x: setup.width * 0.28, y: setup.height * 0.6 });
    this.enemies = setup.enemies.map(
      (e) => new Enemy(e.config, { x: e.x, y: e.y }, 'aggressive')
    );
  }

  onEnd(cb: (victory: boolean) => void): void {
    this.endCallback = cb;
  }

  start(): void {
    this.phase = 'playing';
    this.startTime = performance.now();
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
  }

  get aliveEnemies(): Enemy[] {
    return this.enemies.filter((e) => e.isAlive);
  }

  get elapsedTime(): number {
    return this.timeLimit - this.timeRemaining;
  }

  get maxCombo(): number {
    return this.combo.max;
  }

  get damageDealt(): number {
    return this.totalDamage;
  }

  get algorithmScoreValue(): number {
    return this.algorithmScore;
  }

  get combatState(): { chain: number; guarding: boolean; parrying: boolean } {
    return { chain: this.basicChainStep, guarding: this.guardTimer > 0, parrying: this.parryTimer > 0 };
  }

  // ---- 玩家操作入口 ----
  private buildContext(caster: BattleUnit, targets: BattleUnit[]): SkillContext {
    const deal: SkillContext['dealDamage'] = (attacker, target, mult, element, isSkill) =>
      this.applyDamage(attacker, target, mult, element, isSkill);
    return {
      caster,
      targets,
      dealDamage: deal,
      spawnEffect: (x, y, type, color, radius, opts) =>
        this.spawnEffect(x, y, type, color, radius, opts),
      scheduleHit: (attacker, getTarget, mult, element, delay, onHit, multFn) => {
        this.scheduledHits.push({
          timer: delay,
          fn: () => {
            const target = getTarget();
            if (!target || !target.isAlive) return;
            const m = multFn ? multFn(target) : mult;
            this.applyDamage(attacker, target, m, element, attacker.isPlayer);
            if (onHit) onHit(target);
          },
        });
      },
      scheduleHitCustom: (fn, delay) => {
        this.scheduledHits.push({
          timer: delay,
          fn: () => fn(caster, deal),
        });
      },
      setPose: (pose) => {
        caster.currentPose = pose;
      },
    };
  }

  playerBasicAttack(): void {
    if (this.phase !== 'playing' || !this.player.isAlive || this.guardTimer > 0) return;
    const now = performance.now() / 1000;
    this.basicChainStep = this.basicChainTimer > now ? (this.basicChainStep % 4) + 1 : 1;
    this.basicChainTimer = now + 0.72;
    const ctx = this.buildContext(this.player, this.aliveEnemies);
    this.skills.useBasic(ctx, this.energy.current);
    this.player.setAnimation(this.basicChainStep === 4 ? 'skill' : 'attack', 0.24);
    this.player.currentPose = this.basicChainStep === 4 ? 'thrust' : 'punch';
    this.algorithmScore += this.basicChainStep * 2;
    if (this.basicChainStep === 4) {
      this.addScreenShake(0.18, 7);
      const direction = this.player.facing === 'right' ? 1 : -1;
      this.spawnEffect(this.player.pos.x + direction * 35, this.player.pos.y, 'pierce', '#fbbf24', 48, { angle: direction });
    }
  }

  playerGuard(): void {
    if (this.phase !== 'playing' || !this.player.isAlive) return;
    this.guardTimer = Math.max(this.guardTimer, 0.45);
    this.parryTimer = 0.16;
    this.player.setAnimation('skill', 0.45);
    this.player.currentPose = 'guard';
  }

  playerUseSkill(index: number): void {
    if (this.phase !== 'playing' || !this.player.isAlive) return;
    const ctx = this.buildContext(this.player, this.aliveEnemies);
    const cost = this.skills.useSkill(index, ctx, this.energy.current);
    if (cost > 0) this.energy.consume(cost);
  }

  /** 算法位移：用于追击、拉开距离和取消站桩输出。 */
  playerDash(direction = this.player.facing === 'right' ? 1 : -1): void {
    if (this.phase !== 'playing' || !this.player.isAlive || this.dashCooldown > 0) return;
    this.dashCooldown = 0.8;
    this.player.invincibleTimer = Math.max(this.player.invincibleTimer, 0.16);
    this.player.knockback.x = direction * 520;
    this.player.setAnimation('walk', 0.16);
    this.spawnEffect(this.player.pos.x, this.player.pos.y, 'ring', '#38bdf8', 34);
  }

  // ---- 伤害施加 ----
  private applyDamage(
    attacker: BattleUnit,
    target: BattleUnit,
    multiplier: number,
    element: ElementType,
    isSkill: boolean
  ): void {
    if (!target.isAlive) return;
    const isPlayerAttack = attacker.isPlayer;

    const elem = this.elemental.resolve(element, target.element);
    const comboBonus = isPlayerAttack ? this.combo.getDamageBonus() : 0;
    const forceCrit = isPlayerAttack ? this.combo.isForceCrit() : false;

    const result = DamageCalculator.calculate({
      attacker,
      defender: target,
      skillMultiplier: multiplier,
      comboBonus,
      forceCrit,
      elementMultiplier: elem.multiplier,
      reaction: elem.reaction?.name,
    });

    // 击退/硬直分级：普攻只轻推且不打断（避免远程把敌人一直击退到近不了身），
    // 技能才有明显击退与受击硬直。敌人打玩家统一用轻微击退。
    let knockback: number;
    let stagger: boolean;
    if (isPlayerAttack) {
      knockback = isSkill ? 1 : 0.25;
      stagger = isSkill;
    } else {
      knockback = 0.5;
      stagger = true;
    }
    if (!isPlayerAttack && this.guardTimer > 0) {
      if (this.parryTimer > 0) {
        this.algorithmScore += 12;
        this.combo.hit();
        this.spawnDamageNumber(attacker.pos.x, attacker.pos.y - attacker.radius - 12, 0, true, '#22d3ee', 'PARITY CHECK');
        this.spawnEffect(attacker.pos.x, attacker.pos.y, 'ring', '#22d3ee', 42);
        attacker.takeDamage(Math.max(1, Math.round(result.amount * 0.55)), this.player.pos.x, { knockback: 1.2, stagger: true });
        this.addScreenShake(0.28, 11);
        return;
      }
      this.spawnEffect(this.player.pos.x, this.player.pos.y, 'grid', '#60a5fa', 32);
      return;
    }

    const applied = target.takeDamage(result.amount, attacker.pos.x, { knockback, stagger });
    if (!applied) return;

    if (isPlayerAttack) {
      this.combo.hit();
      this.energy.onHit();
      this.totalDamage += result.amount;
      this.addScreenShake(isSkill ? 0.25 : 0.12, isSkill ? 8 : 4);
      this.hitStopTimer = Math.max(this.hitStopTimer, isSkill ? 0.075 : 0.035);
      if (isSkill) this.algorithmScore += 5;
    } else {
      this.addScreenShake(0.15, 5);
      this.hitStopTimer = Math.max(this.hitStopTimer, 0.045);
    }

    // 伤害数字
    this.spawnDamageNumber(
      target.pos.x,
      target.pos.y - target.radius - 12,
      result.amount,
      result.isCrit,
      isPlayerAttack ? '#ffe066' : '#ff8888',
      elem.reaction?.name
    );
  }

  private spawnDamageNumber(
    x: number,
    y: number,
    value: number,
    isCrit: boolean,
    color: string,
    reaction?: string
  ): void {
    this.damageNumbers.push({
      id: this.effectIdSeq++,
      value,
      x: x + (Math.random() - 0.5) * 16,
      y,
      vy: -60,
      life: 0,
      maxLife: isCrit ? 1.0 : 0.8,
      isCrit,
      color: isCrit ? '#ff4d4d' : color,
      reaction,
    });
  }

  private spawnEffect(
    x: number,
    y: number,
    type: HitEffect['type'],
    color: string,
    radius: number,
    opts?: { angle?: number; tx?: number; ty?: number }
  ): void {
    const longLived: HitEffect['type'][] = ['ring', 'arrow', 'wave', 'segment', 'chain', 'pierce', 'split', 'grid'];
    this.hitEffects.push({
      id: this.effectIdSeq++,
      x,
      y,
      life: 0,
      maxLife: longLived.includes(type) ? 0.4 : 0.3,
      radius,
      color,
      type,
      angle: opts?.angle,
      tx: opts?.tx,
      ty: opts?.ty,
    });
  }

  private addScreenShake(duration: number, intensity: number): void {
    this.shakeTimer = Math.max(this.shakeTimer, duration);
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  // ---- 主更新 ----
  update(dt: number, input: { move: { x: number; y: number }; dash?: boolean; guard?: boolean }): void {
    if (this.phase !== 'playing') return;
    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      this.updateEffects(dt * 0.25);
      return;
    }

    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.guardTimer = Math.max(0, this.guardTimer - dt);
    this.parryTimer = Math.max(0, this.parryTimer - dt);
    this.basicChainTimer = Math.max(0, this.basicChainTimer - dt);
    if (input.guard) this.playerGuard();
    if (input.dash) this.playerDash(input.move.x || (this.player.facing === 'right' ? 1 : -1));

    // 倒计时
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.finish(this.aliveEnemies.length === 0);
      return;
    }

    // 系统更新
    this.energy.update(dt);
    this.combo.update(dt);
    this.skills.update(dt);

    // 玩家移动
    if (this.player.isAlive) {
      const speed = this.player.stats.speed;
      this.player.velocity.x = input.move.x * speed;
      this.player.velocity.y = input.move.y * speed;
      if (
        (input.move.x !== 0 || input.move.y !== 0) &&
        this.player.animState !== 'attack' &&
        this.player.animState !== 'skill' &&
        this.player.animState !== 'hurt'
      ) {
        this.player.setAnimation('walk');
        if (input.move.x !== 0) this.player.facing = input.move.x > 0 ? 'right' : 'left';
      } else if (
        input.move.x === 0 &&
        input.move.y === 0 &&
        this.player.animState === 'walk'
      ) {
        this.player.setAnimation('idle');
      }
    } else {
      this.player.velocity = { x: 0, y: 0 };
    }
    this.player.update(dt, { w: this.width, h: this.height });

    // 敌人 AI：多个敌人各自追击、普通攻击和算法技能
    for (const enemy of this.enemies) {
      const previousSkill = enemy.activeSkill;
      const didAttack = enemy.think(dt, this.player, { w: this.width, h: this.height });
      enemy.update(dt, { w: this.width, h: this.height });
      if (previousSkill && enemy.skillWindup <= 0 && this.player.isAlive) {
        this.scheduleEnemySkillHit(enemy, previousSkill);
      }
      if (didAttack && this.player.isAlive) {
        this.scheduleEnemyHit(enemy);
      }
    }

    // 特效更新
    this.updateEffects(dt);

    // 胜负判定
    if (this.player.isAlive && this.aliveEnemies.length === 0) {
      this.finish(true);
    } else if (!this.player.isAlive) {
      this.finish(false);
    }

    // 屏幕震���衰减
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }
  }

  private enemyHitQueue: { enemy: Enemy; timer: number; multiplier?: number }[] = [];
  private scheduledHits: { timer: number; fn: () => void }[] = [];

  private scheduleEnemyHit(enemy: Enemy): void {
    this.enemyHitQueue.push({ enemy, timer: 0.18 });
  }

  private scheduleEnemySkillHit(enemy: Enemy, skill: NonNullable<Enemy['activeSkill']>): void {
    const distance = enemy.distanceTo(this.player);
    if (distance > skill.range + 35) return;
    const effectByKind: Record<string, HitEffect['type']> = {
      'binary-search': 'arrow',
      'hash-collision': 'split',
      'dag-chain': 'chain',
      'mst-bind': 'segment',
      'max-flow-cut': 'pierce',
      'segment-query': 'grid',
    };
    this.spawnEffect(this.player.pos.x, this.player.pos.y, effectByKind[skill.kind] ?? 'burst', enemy.color, 46);
    this.enemyHitQueue.push({ enemy, timer: 0.08 });
    (this.enemyHitQueue[this.enemyHitQueue.length - 1] as { enemy: Enemy; timer: number } & { multiplier?: number }).multiplier = skill.damageMultiplier;
  }

  private updateEffects(dt: number): void {
    // 技能延迟命中队列（多段 / 蓄力 / 飞行道具 / 穿刺）
    this.scheduledHits = this.scheduledHits.filter((q) => {
      q.timer -= dt;
      if (q.timer <= 0) {
        q.fn();
        return false;
      }
      return true;
    });

    // 敌人攻击命中延迟
    this.enemyHitQueue = this.enemyHitQueue.filter((q) => {
      q.timer -= dt;
      if (q.timer <= 0) {
        if (q.enemy.isAlive && this.player.isAlive && q.enemy.distanceTo(this.player) <= q.enemy.attackRange + 20) {
          this.applyDamage(q.enemy, this.player, q.multiplier ?? 1.0, q.enemy.element, false);
          this.spawnEffect(this.player.pos.x, this.player.pos.y, 'hit', '#ff5555', 24);
        }
        return false;
      }
      return true;
    });

    this.damageNumbers = this.damageNumbers.filter((d) => {
      d.life += dt;
      d.y += d.vy * dt;
      d.vy += 40 * dt;
      return d.life < d.maxLife;
    });

    this.hitEffects = this.hitEffects.filter((e) => {
      e.life += dt;
      return e.life < e.maxLife;
    });
  }

  private finish(victory: boolean): void {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    if (this.endCallback) this.endCallback(victory);
  }

  // ---- 评级：多维度综合评分（速度 + 残血 + 连击），拿 S 很难 ----
  computeRating(starTimes: [number, number, number]): RatingResult {
    const hpRatio = this.player.hpRatio;
    const t = this.elapsedTime;
    const [sTime, aTime, bTime] = starTimes;

    // 1) 速度分（0~40）：starTimes[0] 内满分，随后线性衰减，超过 bTime 归零
    let timeScore: number;
    if (t <= sTime) timeScore = 40;
    else if (t >= bTime) timeScore = 0;
    else timeScore = 40 * (1 - (t - sTime) / (bTime - sTime));

    // 2) 残血分（0~40）：保留生命越多越高，且末段（>80%）有额外奖励曲线
    const hpScore = 40 * Math.pow(hpRatio, 0.8);

    // 3) 连击分（0~20）：以 targetCombo 连击封顶
    const targetCombo = 12;
    const comboScore = 20 * Math.min(1, this.maxCombo / targetCombo);
    const algorithmScore = Math.min(10, this.algorithmScore / 10);

    const score = Math.round(timeScore + hpScore + comboScore + algorithmScore);

    // 评级门槛：S 需要三项都表现优异（硬门槛防止「苟过」拿 S）
    let rating: BattleRating;
    if (score >= 85 && hpRatio >= 0.55 && t <= aTime && this.maxCombo >= 8 && this.algorithmScore >= 20) {
      rating = 'S';
    } else if (score >= 65 && hpRatio >= 0.3) {
      rating = 'A';
    } else {
      // 通关但表现平平 —— 至少 B（不再「过了就 S」）
      rating = 'B';
    }

    return {
      rating,
      score,
      timeScore: Math.round(timeScore),
      hpScore: Math.round(hpScore),
      comboScore: Math.round(comboScore),
      hpRatio,
    };
  }

  // ---- 渲染 ----
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // 屏幕震动
    if (this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(dx, dy);
    }

    drawBattlefield(ctx, this.width, this.height);

    // 单位（按 y 排序，实现前后遮挡）
    const units: BattleUnit[] = [this.player, ...this.enemies].sort(
      (a, b) => a.pos.y - b.pos.y
    );
    for (const u of units) {
      // 敌人若注册了「算法造型」，绘制造型 + 头顶血条；否则回退火柴人
      if (!u.isPlayer && hasEnemyForm(u.characterId)) {
        drawEnemyForm(ctx, u);
        if (u.isAlive) drawUnitHealthBar(ctx, u);
      } else {
        drawStickFigure(ctx, u);
      }
    }

    // 命中特效
    for (const e of this.hitEffects) {
      drawHitEffect(ctx, e);
    }

    // 伤害数字
    for (const d of this.damageNumbers) {
      drawDamageNumber(ctx, d);
    }

    ctx.restore();
  }
}
