// 键盘输入管理：支持持续按键查询与按下触发回调
type KeyCallback = () => void;

export class InputManager {
  private pressed = new Set<string>();
  private downCallbacks = new Map<string, KeyCallback[]>();
  private attached = false;

  attach(): void {
    if (this.attached) return;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) return;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.pressed.clear();
    this.downCallbacks.clear();
    this.attached = false;
  }

  /** 注册某个键按下时触发的回调 */
  onKeyPress(key: string, cb: KeyCallback): void {
    const k = key.toLowerCase();
    const list = this.downCallbacks.get(k) ?? [];
    list.push(cb);
    this.downCallbacks.set(k, list);
  }

  isDown(key: string): boolean {
    return this.pressed.has(key.toLowerCase());
  }

  /** 归一化的移动向量 */
  getMoveVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.isDown('a') || this.isDown('arrowleft')) x -= 1;
    if (this.isDown('d') || this.isDown('arrowright')) x += 1;
    if (this.isDown('w') || this.isDown('arrowup')) y -= 1;
    if (this.isDown('s') || this.isDown('arrowdown')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    // 阻止方向键与空格滚动页面
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    if (!this.pressed.has(k)) {
      const cbs = this.downCallbacks.get(k);
      if (cbs) cbs.forEach((cb) => cb());
    }
    this.pressed.add(k);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.pressed.delete(e.key.toLowerCase());
  };

  private onBlur = (): void => {
    this.pressed.clear();
  };
}
