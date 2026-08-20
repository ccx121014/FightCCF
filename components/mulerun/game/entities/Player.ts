import { BattleUnit } from './BattleUnit';
import type { UnitConfig, Vector2 } from '../types';

export class Player extends BattleUnit {
  constructor(cfg: UnitConfig, pos: Vector2) {
    super({ ...cfg, isPlayer: true }, pos);
    this.radius = 28;
  }
}
