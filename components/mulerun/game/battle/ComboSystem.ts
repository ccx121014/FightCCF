import { BATTLE_CONFIG } from '@shared/constants';

// 连击系统：0.5 秒连击窗口，分段加成，10 连击以上强制暴击
export class ComboSystem {
  private combo = 0;
  private maxCombo = 0;
  private timer = 0;
  private readonly window = BATTLE_CONFIG.comboWindow;

  get count(): number {
    return this.combo;
  }

  get max(): number {
    return this.maxCombo;
  }

  /** 命中时调用，刷新连击并重置窗口 */
  hit(): void {
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.timer = this.window;
  }

  update(dt: number): void {
    if (this.combo > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.combo = 0;
      }
    }
  }

  reset(): void {
    this.combo = 0;
    this.timer = 0;
  }

  /** 当前连击的伤害加成 */
  getDamageBonus(): number {
    for (const b of BATTLE_CONFIG.comboBonus) {
      if (this.combo >= b.min && this.combo <= b.max) return b.bonus;
    }
    return 0;
  }

  /** 是否触发强制暴击 */
  isForceCrit(): boolean {
    return this.combo >= BATTLE_CONFIG.forceCritCombo;
  }

  /** 连击窗口剩余比例，用于 UI */
  get windowRatio(): number {
    return this.combo > 0 ? Math.max(0, this.timer / this.window) : 0;
  }
}
