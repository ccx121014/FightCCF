import type { ElementType } from '@shared/constants';
import { Skill, type SkillContext } from './Skill';
import { ProfileSkill } from './ProfileSkill';
import { getProfile, type SkillDef } from './attackProfiles';

// 技能注册与调度：普攻 + 三个主动技能。
// 具体表现由角色的算法攻击档案（attackProfiles）驱动，
// 每个算法角色拥有专属的普攻与三技能行为。
export class SkillManager {
  readonly basic: Skill;
  readonly skills: Skill[]; // [技能一, 技能二, 终极]
  private activationLock = 0; // 激活锁，防止连发

  constructor(element: ElementType, characterId?: string) {
    const profile = getProfile(characterId);

    // 将普攻档案转换为通用 SkillDef 供 ProfileSkill 执行
    const basicDef: SkillDef = {
      id: 'basic_attack',
      name: '普通攻击',
      description: '一记快速的近战攻击',
      behavior: profile.basic.behavior,
      pose: profile.basic.pose,
      effect: profile.basic.effect,
      energyCost: 0,
      cooldown: 0.45,
      damageMultiplier: 1.0,
      range: profile.basic.range ?? 96,
      aoe: false,
      hits: profile.basic.hits,
      delay: profile.basic.delay,
    };

    this.basic = new ProfileSkill(basicDef, element, true);
    this.skills = profile.skills.map((def) => new ProfileSkill(def, element, false));
  }

  update(dt: number): void {
    this.basic.update(dt);
    this.skills.forEach((s) => s.update(dt));
    if (this.activationLock > 0) this.activationLock -= dt;
  }

  private get locked(): boolean {
    return this.activationLock > 0;
  }

  useBasic(ctx: SkillContext, energy: number): boolean {
    void energy;
    if (this.locked || !this.basic.isReady) return false;
    const ok = this.basic.execute(ctx);
    if (ok) this.activationLock = 0.25;
    return ok;
  }

  /**
   * 使用第 index 个技能（0/1/2）。
   * 返回消耗的能量（0 表示未成功）。
   */
  useSkill(index: number, ctx: SkillContext, energy: number): number {
    if (this.locked) return 0;
    const skill = this.skills[index];
    if (!skill || !skill.canUse(energy)) return 0;
    const ok = skill.execute(ctx);
    if (!ok) return 0;
    this.activationLock = 0.5;
    return skill.config.energyCost;
  }

  getSkill(index: number): Skill | undefined {
    return this.skills[index];
  }
}
