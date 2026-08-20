// 固定帧步长的游戏循环，基于 requestAnimationFrame
export type UpdateFn = (dt: number) => void;
export type RenderFn = (interp: number) => void;

export class GameLoop {
  private rafId = 0;
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly step: number; // 固定步长（秒）

  constructor(
    private update: UpdateFn,
    private render: RenderFn,
    fps = 60
  ) {
    this.step = 1 / fps;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  get isRunning(): boolean {
    return this.running;
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // 防止切换标签页后的大跳变
    if (frameTime > 0.25) frameTime = 0.25;

    this.accumulator += frameTime;
    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }
    this.render(this.accumulator / this.step);
    this.rafId = requestAnimationFrame(this.frame);
  };
}
