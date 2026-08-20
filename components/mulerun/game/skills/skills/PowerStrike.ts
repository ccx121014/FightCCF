import { Skill, type SkillContext, type SkillConfig } from '../Skill';
import { ELEMENTS, type ElementType } from '@shared/constants';

// 强力打击：向前突进的单体重击
export class PowerStrike extends Skill {
  constructor(element: ElementType) {
    const config: SkillConfig = {
      id: 'power_strike',
      name: '强力打击',
      description: '突进并造成一次高伤害重击',
      energyCost: 20,
      cooldown: 3,
      damageMultiplier: 1.8,
      element,
      animationType: 'power_strike',
      range: 130,
      isAoe: false,
    };
    super(config);
  }

  execute(ctx: SkillContext): boolean {
    const { caster, targets, dealDamage, spawnEffect } = ctx;
    const inRange = targets
      .filter((t) => t.isAlive && caster.distanceTo(t) <= this.config.range)
      .sort((a, b) => caster.distanceTo(a) - caster.distanceTo(b));

    caster.setAnimation('skill', 0.45);
    const color = ELEMENTS[this.config.element].color;

    if (inRange.length > 0) {
      const target = inRange[0];
      caster.faceTowards(target.pos.x);
      // 突进
      const dir = target.pos.x >= caster.pos.x ? 1 : -1;
      caster.knockback.x = dir * 120;
      dealDamage(caster, target, this.config.damageMultiplier, this.config.element, true);
      spawnEffect(target.pos.x, target.pos.y, 'slash', color, 44);
    } else {
      spawnEffect(caster.pos.x + (caster.facing === 'right' ? 60 : -60), caster.pos.y, 'slash', color, 40);
    }
    this['startCooldown']();
    return true;
  }
}
