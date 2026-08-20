import { BATTLE_CONFIG } from '@shared/constants';
import type { ElementType } from '@shared/constants';
import type { AnimationState, Facing, PoseStyle, UnitConfig, Vector2 } from '../types';

// 通用战斗单位：属性、位置、动画状态机
export class BattleUnit {
  id: string;
  name: string;
  element: ElementType;
  color: string;
  isPlayer: boolean;
  /** 图鉴 id：敌人据此选择「算法造型」渲染 */
  characterId?: string;

  hp: number;
  maxHp: number;
  /** 护盾值：先于生命承伤，随时间不衰减 */
  shield = 0;
  stats: {
    attack: number;
    defense: number;
    speed: number;
    critRate: number;
    critDamage: number;
  };

  pos: Vector2;
  facing: Facing = 'right';
  radius = 26;

  /** 当前出招姿态：由技能通过 setPose 设定，驱动火柴人肢体动作 */
  currentPose: PoseStyle = 'punch';
  /** 默认姿态（静止 / 普攻回落） */
  defaultPose: PoseStyle = 'punch';

  // 动画
  animState: AnimationState = 'idle';
  animTime = 0;
  animDuration = 0;

  // 状态
  isAlive = true;
  invincibleTimer = 0;
  hurtFlash = 0;
  attackWindup = 0; // 攻击前摇/命中判定标记

  // 位移速度（像素/秒）
  velocity: Vector2 = { x: 0, y: 0 };
  knockback: Vector2 = { x: 0, y: 0 };

  // 挥拳视觉进度
  attackProgress = 0;
  /** 出招序号：每次发起攻击/技能自增，用于渲染层做「连招变化」（换手/勾拳/上挑） */
  attackSeq = 0;

  constructor(cfg: UnitConfig, pos: Vector2) {
    this.id = cfg.id;
    this.name = cfg.name;
    this.element = cfg.element;
    this.color = cfg.color;
    this.isPlayer = cfg.isPlayer;
    this.characterId = cfg.characterId;
    this.maxHp = cfg.maxHp;
    this.hp = cfg.maxHp;
    this.stats = {
      attack: cfg.attack,
      defense: cfg.defense,
      speed: cfg.speed,
      critRate: cfg.critRate,
      critDamage: cfg.critDamage,
    };
    this.pos = { ...pos };
    if (cfg.attackStyle) {
      this.defaultPose = cfg.attackStyle;
      this.currentPose = cfg.attackStyle;
    }
  }

  get hpRatio(): number {
    return Math.max(0, this.hp / this.maxHp);
  }

  get invincible(): boolean {
    return this.invincibleTimer > 0;
  }

  setAnimation(state: AnimationState, duration = 0.35): void {
    // 死亡动画不可被打断
    if (this.animState === 'death') return;
    if (this.animState === state && state !== 'attack' && state !== 'skill') return;
    // 回落到静止/移动时恢复默认姿态
    if (state === 'idle' || state === 'walk') this.currentPose = this.defaultPose;
    this.animState = state;
    this.animTime = 0;
    this.animDuration = duration;
    if (state === 'attack' || state === 'skill') {
      this.attackProgress = 0;
      this.attackSeq += 1;
    }
  }

  /**
   * 承伤。
   * @param opts.knockback 击退强度系数（1 = 基准）；普攻应传很小值，避免把敌人一直推开
   * @param opts.stagger   是否进入受击硬直（打断动作/移动）；普攻默认不打断，敌人才能持续贴近
   */
  takeDamage(
    amount: number,
    fromX: number,
    opts?: { knockback?: number; stagger?: boolean }
  ): boolean {
    if (!this.isAlive || this.invincible) return false;
    // 护盾优先吸收
    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    this.hp = Math.max(0, this.hp - remaining);
    this.invincibleTimer = BATTLE_CONFIG.invincibleFrame;
    this.hurtFlash = 0.25;

    // 击退（基准从 180 下调到 150，再乘系数）
    const kb = opts?.knockback ?? 1;
    const stagger = opts?.stagger ?? true;
    const dir = this.pos.x >= fromX ? 1 : -1;
    this.knockback.x = dir * 150 * kb;

    if (this.hp <= 0) {
      this.die();
    } else if (stagger) {
      this.setAnimation('hurt', 0.22);
    }
    return true;
  }

  heal(amount: number): void {
    if (!this.isAlive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** 叠加护盾，上限为最大生命的 60% */
  addShield(amount: number): void {
    if (!this.isAlive) return;
    this.shield = Math.min(this.maxHp * 0.6, this.shield + amount);
  }

  die(): void {
    this.isAlive = false;
    this.setAnimation('death', 0.6);
    this.velocity = { x: 0, y: 0 };
  }

  faceTowards(targetX: number): void {
    this.facing = targetX >= this.pos.x ? 'right' : 'left';
  }

  update(dt: number, bounds: { w: number; h: number }): void {
    // 计时器
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    this.animTime += dt;

    // 攻击动画进度
    if (this.animState === 'attack' || this.animState === 'skill') {
      this.attackProgress = Math.min(1, this.animTime / this.animDuration);
      if (this.animTime >= this.animDuration) {
        this.setAnimation('idle');
      }
    }
    if (this.animState === 'hurt' && this.animTime >= this.animDuration) {
      if (this.isAlive) this.setAnimation('idle');
    }

    // 击退衰减
    this.pos.x += this.knockback.x * dt;
    this.pos.y += this.knockback.y * dt;
    this.knockback.x *= Math.pow(0.001, dt);
    this.knockback.y *= Math.pow(0.001, dt);
    if (Math.abs(this.knockback.x) < 1) this.knockback.x = 0;
    if (Math.abs(this.knockback.y) < 1) this.knockback.y = 0;

    // 速度位移
    this.pos.x += this.velocity.x * dt;
    this.pos.y += this.velocity.y * dt;

    // 边界约束
    const m = this.radius + 10;
    this.pos.x = Math.max(m, Math.min(bounds.w - m, this.pos.x));
    this.pos.y = Math.max(m + 40, Math.min(bounds.h - m, this.pos.y));
  }

  distanceTo(other: BattleUnit): number {
    return Math.hypot(other.pos.x - this.pos.x, other.pos.y - this.pos.y);
  }
}
