import { Skill, type SkillContext, type SkillConfig } from '../Skill';
import { ELEMENTS, type ElementType } from '@shared/constants';

// 终极打击：消耗全部能量的毁灭性元素爆发
export class UltimateStrike extends Skill {
  constructor(element: ElementType) {
    const config: SkillConfig = {
      id: 'ultimate_strike',
      name: '终极打击',
      description: '汇聚全部能量释放毁灭性爆发',
      energyCost: 50,
      cooldown: 12,
      damageMultiplier: 3.2,
      element,
      animationType: 'ultimate',
      range: 220,
      isAoe: true,
    };
    super(config);
  }

  execute(ctx: SkillContext): boolean {
    const { caster, targets, dealDamage, spawnEffect } = ctx;
    caster.setAnimation('skill', 0.75);
    const color = ELEMENTS[this.config.element].color;

    // 大范围元素爆发特效
    spawnEffect(caster.pos.x, caster.pos.y, 'ring', color, this.config.range);
    spawnEffect(caster.pos.x, caster.pos.y, 'burst', '#ffffff', 90);

    const hit = targets.filter((t) => t.isAlive && caster.distanceTo(t) <= this.config.range);
    for (const t of hit) {
      dealDamage(caster, t, this.config.damageMultiplier, this.config.element, true);
      spawnEffect(t.pos.x, t.pos.y, 'burst', color, 50);
    }
    this['startCooldown']();
    return true;
  }
}
