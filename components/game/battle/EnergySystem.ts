import { BATTLE_CONFIG } from '@shared/constants';

// 能量系统：最大 100，每秒自动回复，命中敌人额外回复
export class EnergySystem {
  private energy: number;
  private readonly max = BATTLE_CONFIG.maxEnergy;
  private regenMultiplier = 1;

  constructor(startEnergy = 0) {
    this.energy = Math.min(startEnergy, this.max);
  }

  get current(): number {
    return this.energy;
  }

  get maxEnergy(): number {
    return this.max;
  }

  get ratio(): number {
    return this.energy / this.max;
  }

  setRegenMultiplier(m: number): void {
    this.regenMultiplier = m;
  }

  update(dt: number): void {
    this.add(BATTLE_CONFIG.energyRegenPerSec * this.regenMultiplier * dt);
  }

  onHit(): void {
    this.add(BATTLE_CONFIG.energyOnHit);
  }

  add(amount: number): void {
    this.energy = Math.min(this.max, this.energy + amount);
  }

  canAfford(cost: number): boolean {
    return this.energy >= cost;
  }

  consume(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.energy = Math.max(0, this.energy - cost);
    return true;
  }
}
