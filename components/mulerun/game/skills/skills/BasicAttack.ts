import { Skill, type SkillContext, type SkillConfig } from '../Skill';
import type { ElementType } from '@shared/constants';

// 普通攻击：近战拳击，无能量消耗
export class BasicAttack extends Skill {
  constructor(element: ElementType) {
    const config: SkillConfig = {
      id: 'basic_attack',
      name: '普通攻击',
      description: '一记快速的近战拳击',
      energyCost: 0,
      cooldown: 0.45,
      damageMultiplier: 1.0,
      element,
      animationType: 'attack',
      range: 90,
      isAoe: false,
    };
    super(config);
  }

  execute(ctx: SkillContext): boolean {
    const { caster, targets, dealDamage, spawnEffect } = ctx;
    const inRange = targets
      .filter((t) => t.isAlive && caster.distanceTo(t) <= this.config.range)
      .sort((a, b) => caster.distanceTo(a) - caster.distanceTo(b));

    if (inRange.length === 0) {
      // 空挥也进入冷却，但不产生伤害
      caster.setAnimation('attack', 0.3);
      this['startCooldown']();
      return true;
    }

    const target = inRange[0];
    caster.faceTowards(target.pos.x);
    caster.setAnimation('attack', 0.3);
    dealDamage(caster, target, this.config.damageMultiplier, this.config.element, false);
    const hx = (caster.pos.x + target.pos.x) / 2;
    const hy = (caster.pos.y + target.pos.y) / 2;
    spawnEffect(hx, hy, 'hit', '#ffffff', 22);
    this['startCooldown']();
    return true;
  }
}
