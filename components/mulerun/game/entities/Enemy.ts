import { BattleUnit } from './BattleUnit';
import type { UnitConfig, Vector2 } from '../types';

export type EnemyBehavior = 'aggressive' | 'ranged' | 'defensive';

// 敌人 AI：简易状态机（追击 / 攻击 / 后撤）
export class Enemy extends BattleUnit {
  behavior: EnemyBehavior;
  attackCooldown = 0;
  attackRange = 70;
  private decisionTimer = 0;
  private strafeDir = 1;

  constructor(cfg: UnitConfig, pos: Vector2, behavior: EnemyBehavior = 'aggressive') {
    super({ ...cfg, isPlayer: false }, pos);
    this.behavior = behavior;
    this.radius = 26;
  }

  /** 返回本帧是否发起了一次攻击（命中判定由 BattleManager 处理） */
  think(dt: number, target: BattleUnit, bounds: { w: number; h: number }): boolean {
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

    if (this.animState === 'attack' || this.animState === 'hurt') {
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
