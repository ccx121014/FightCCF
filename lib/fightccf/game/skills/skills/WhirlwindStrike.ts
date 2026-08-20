import { Skill, type SkillContext, type SkillConfig } from '../Skill';
import { ELEMENTS, type ElementType } from '@shared/constants';

// 旋风打击：原地旋转的范围攻击
export class WhirlwindStrike extends Skill {
  constructor(element: ElementType) {
    const config: SkillConfig = {
      id: 'whirlwind_strike',
      name: '旋风打击',
      description: '旋转身体，攻击周围所有敌人',
      energyCost: 35,
      cooldown: 6,
      damageMultiplier: 1.4,
      element,
      animationType: 'whirlwind',
      range: 165,
      isAoe: true,
    };
    super(config);
  }

  execute(ctx: SkillContext): boolean {
    const { caster, targets, dealDamage, spawnEffect } = ctx;
    caster.setAnimation('skill', 0.55);
    const color = ELEMENTS[this.config.element].color;

    spawnEffect(caster.pos.x, caster.pos.y, 'ring', color, this.config.range);

    const hit = targets.filter((t) => t.isAlive && caster.distanceTo(t) <= this.config.range);
    for (const t of hit) {
      dealDamage(caster, t, this.config.damageMultiplier, this.config.element, true);
      spawnEffect(t.pos.x, t.pos.y, 'burst', color, 30);
    }
    this['startCooldown']();
    return true;
  }
}
