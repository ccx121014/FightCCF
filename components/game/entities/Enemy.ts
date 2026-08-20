import { BattleUnit } from './BattleUnit';
import type { UnitConfig, Vector2 } from '../types';

export type EnemyBehavior = 'aggressive' | 'ranged' | 'defensive';
export type EnemySkillKind = 'binary-search' | 'hash-collision' | 'dag-chain' | 'mst-bind' | 'max-flow-cut' | 'segment-query';

export interface EnemySkillConfig {
  kind: EnemySkillKind;
  name: string;
  cooldown: number;
  range: number;
  damageMultiplier: number;
  telegraph: number;
}

// 敌人 AI：简易状态机（追击 / 攻击 / 算法技能）
export class Enemy extends BattleUnit {
  behavior: EnemyBehavior;
  attackCooldown = 0;
  attackRange = 70;
  skillCooldown = 1.5 + Math.random() * 2;
  skillWindup = 0;
  activeSkill: EnemySkillConfig | null = null;
  readonly skill: EnemySkillConfig;
  private decisionTimer = 0;
  private strafeDir = 1;

  constructor(cfg: UnitConfig, pos: Vector2, behavior: EnemyBehavior = 'aggressive') {
    super({ ...cfg, isPlayer: false }, pos);
    this.behavior = behavior;
    this.radius = 26;
    const skills: Record<string, EnemySkillConfig> = {
      binary_search: { kind: 'binary-search', name: '二分查找', cooldown: 4.2, range: 320, damageMultiplier: 1.35, telegraph: 0.55 },
      hash_table: { kind: 'hash-collision', name: '哈希冲突', cooldown: 5.5, range: 260, damageMultiplier: 1.5, telegraph: 0.7 },
      topological_sort: { kind: 'dag-chain', name: '依赖链', cooldown: 6.2, range: 280, damageMultiplier: 1.45, telegraph: 0.8 },
      minimum_spanning_tree: { kind: 'mst-bind', name: '最小代价连边', cooldown: 7.5, range: 180, damageMultiplier: 1.65, telegraph: 0.9 },
      max_flow: { kind: 'max-flow-cut', name: '最小割', cooldown: 8.5, range: 340, damageMultiplier: 1.85, telegraph: 1.0 },
      segment_tree: { kind: 'segment-query', name: '区间查询', cooldown: 5.8, range: 250, damageMultiplier: 1.55, telegraph: 0.65 },
    };
    this.skill = skills[cfg.characterId ?? ''] ?? { kind: 'binary-search', name: '边界检查', cooldown: 6, range: 220, damageMultiplier: 1.25, telegraph: 0.65 };
  }

  /** 返回本帧是否发起了一次普通攻击；技能由 BattleManager 根据 skillCast 处理。 */
  think(dt: number, target: BattleUnit, bounds: { w: number; h: number }): boolean {
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    if (this.skillWindup > 0) {
      this.skillWindup -= dt;
      this.velocity = { x: 0, y: 0 };
      if (this.skillWindup <= 0) this.activeSkill = null;
      return false;
    }
    if (!this.isAlive || !target.isAlive) {
      this.velocity = { x: 0, y: 0 };
      return false;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 1.2 + Math.random() * 1.0;
      this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    const dx = target.pos.x - this.pos.x;
    const dy = target.pos.y - this.pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.faceTowards(target.pos.x);

    const speed = this.stats.speed;
    let attacked = false;

    if (this.skillCooldown <= 0 && dist <= this.skill.range && Math.random() < 0.035 * dt * 60) {
      this.activeSkill = this.skill;
      this.skillWindup = this.skill.telegraph;
      this.setAnimation('skill', this.skill.telegraph + 0.2);
      this.skillCooldown = this.skill.cooldown;
      return false;
    }

    if (this.animState === 'attack' || this.animState === 'skill' || this.animState === 'hurt') {
      this.velocity = { x: 0, y: 0 };
      return false;
    }

    if (dist > this.attackRange) {
      // 追击目标，带一点侧移使动作更自然
      const nx = dx / dist;
      const ny = dy / dist;
      this.velocity.x = nx * speed + -ny * this.strafeDir * speed * 0.3;
      this.velocity.y = ny * speed + nx * this.strafeDir * speed * 0.3;
      this.setAnimation('walk');
    } else {
      // 进入攻击范围
      this.velocity = { x: 0, y: 0 };
      if (this.attackCooldown <= 0) {
        this.setAnimation('attack', 0.4);
        this.attackCooldown = 1.4 + Math.random() * 0.6;
        attacked = true;
      } else {
        // 冷却中：此处 animState 不可能为 attack/hurt（已在前面提前返回）
        this.setAnimation('idle');
      }
    }

    void bounds;
    return attacked;
  }
}
