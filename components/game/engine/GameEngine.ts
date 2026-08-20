import { GameLoop } from './GameLoop';
import { InputManager } from './InputManager';
import { BattleManager, type BattleSetup } from '../battle/BattleManager';
import type { ElementType } from '@shared/constants';

// 顶层引擎：持有 Canvas、循环、输入、战斗
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private loop: GameLoop;
  private input: InputManager;
  battle: BattleManager;

  private onStateChange?: () => void;

  constructor(canvas: HTMLCanvasElement, setup: BattleSetup, playerElement: ElementType) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 Canvas 2D 上下文');
    this.ctx = ctx;

    this.input = new InputManager();
    this.battle = new BattleManager(setup, playerElement);
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render(),
      60
    );

    this.bindInput();
  }

  setStateChangeCallback(cb: () => void): void {
    this.onStateChange = cb;
  }

  onBattleEnd(cb: (victory: boolean) => void): void {
    this.battle.onEnd(cb);
  }

  private bindInput(): void {
    this.input.attach();
    // 攻击 I，技能 J/K/L
    this.input.onKeyPress('i', () => this.battle.playerBasicAttack());
    this.input.onKeyPress('j', () => this.battle.playerUseSkill(0));
    this.input.onKeyPress('k', () => this.battle.playerUseSkill(1));
    this.input.onKeyPress('l', () => this.battle.playerUseSkill(2));
    // 闪身与替身：更接近手游的主动防守和位移节奏
    this.input.onKeyPress('shift', () => this.battle.playerDash());
    this.input.onKeyPress('q', () => this.battle.playerSubstitute());
    // 触屏/无障碍额外键位
    this.input.onKeyPress(' ', () => this.battle.playerBasicAttack());
  }

  start(): void {
    this.battle.start();
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.input.detach();
  }

  /** 外部触发技能（供触屏按钮调用） */
  triggerBasic(): void {
    this.battle.playerBasicAttack();
  }
  triggerSkill(index: number): void {
    this.battle.playerUseSkill(index);
  }

  private update(dt: number): void {
    const move = this.input.getMoveVector();
    this.battle.update(dt, { move });
    if (this.onStateChange) this.onStateChange();
  }

  private render(): void {
    const dpr = window.devicePixelRatio || 1;
    // 逻辑尺寸
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.battle.render(this.ctx);
  }
}
