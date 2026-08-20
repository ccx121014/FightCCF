import { ELEMENTS } from '@shared/constants';
import type { BattleUnit } from '../entities/BattleUnit';

// ============================================================
// 算法造型敌人：每个算法角色化身为「长得像该算法」的怪物。
// 树 -> 分叉树；数组 -> 柱状条；图 -> 节点连边；波 -> 正弦波……
// 统一由 FormCtx 提供动画参数，各造型函数只负责「画自己」。
// ============================================================

export interface FormCtx {
  cx: number;
  cy: number; // 视觉中心（含 bob）
  t: number; // animTime
  dir: 1 | -1;
  color: string;
  glow: string;
  R: number; // 体型半径基准
  acting: boolean;
  ext: number; // 攻击伸展 0->1
  wind: number; // 攻击前摇 0->1
  hurt: boolean;
  hpRatio: number;
  alpha: number;
  flicker: number;
}

/** 造型注册表：characterId -> 绘制函数 */
type FormFn = (ctx: CanvasRenderingContext2D, f: FormCtx) => void;
const FORMS: Record<string, FormFn> = {};

export function hasEnemyForm(characterId: string | undefined): boolean {
  return !!characterId && characterId in FORMS;
}

/** 敌人造型主入口：计算动画参数并分发到具体造型 */
export function drawEnemyForm(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
  const fn = unit.characterId ? FORMS[unit.characterId] : undefined;
  if (!fn) return;

  const t = unit.animTime;
  const dir: 1 | -1 = unit.facing === 'right' ? 1 : -1;
  const alpha = unit.isAlive ? 1 : Math.max(0, 1 - unit.animTime / 0.6);
  const flicker = unit.invincible && unit.isAlive ? (Math.floor(t * 30) % 2 === 0 ? 0.5 : 1) : 1;

  const acting = unit.animState === 'attack' || unit.animState === 'skill';
  const p = acting ? unit.attackProgress : 0;
  const wind = acting ? Math.min(1, p / 0.4) : 0;
  const ext = acting ? (p < 0.4 ? 0 : (p - 0.4) / 0.6) : 0;
  const hurt = unit.animState === 'hurt';

  // 待机呼吸浮动 / 死亡下沉
  let bob = Math.sin(t * 2.4) * 3;
  if (unit.animState === 'walk') bob = Math.abs(Math.sin(t * 9)) * -4;
  if (!unit.isAlive) bob += unit.animTime * 30;

  const R = unit.radius * 1.15;
  const f: FormCtx = {
    cx: unit.pos.x,
    cy: unit.pos.y + bob,
    t,
    dir,
    color: unit.color,
    glow: ELEMENTS[unit.element].glow,
    R,
    acting,
    ext,
    wind,
    hurt,
    hpRatio: unit.hpRatio,
    alpha,
    flicker,
  };

  ctx.save();
  ctx.globalAlpha = alpha * flicker;

  // 地面阴影
  ctx.save();
  ctx.globalAlpha = alpha * 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(unit.pos.x, unit.pos.y + R * 0.95, R * 0.85, R * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 攻击时整体向目标扑进的位移（Alan Becker 式发力）
  const lungeX = acting ? f.dir * (ext * 14 - wind * 6) : 0;
  const hurtX = hurt ? -f.dir * 6 : 0;
  ctx.translate(lungeX + hurtX, 0);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = f.glow;
  ctx.shadowBlur = acting ? 20 : 12;

  fn(ctx, f);

  ctx.restore();
}

// ---------- 通用小工具 ----------
function stroke(ctx: CanvasRenderingContext2D, color: string, w: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
}

// 一双会随攻击/受击变化的眼睛，给怪物注入「生命感」
function drawEyes(ctx: CanvasRenderingContext2D, f: FormCtx, ex: number, ey: number, size: number): void {
  const gap = size * 1.6;
  const angry = f.acting || f.hurt;
  ctx.save();
  ctx.shadowBlur = 0;
  for (const s of [-1, 1]) {
    const x = ex + s * gap * f.dir + (f.dir > 0 ? size * 0.4 : -size * 0.4);
    ctx.fillStyle = '#0b0f1a';
    ctx.beginPath();
    ctx.ellipse(x, ey, size * (angry ? 0.7 : 1), size * (angry ? 1.1 : 1), 0, 0, Math.PI * 2);
    ctx.fill();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x - size * 0.25 * f.dir, ey - size * 0.3, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  // 愤怒眉
  if (angry) {
    stroke(ctx, '#0b0f1a', size * 0.5);
    for (const s of [-1, 1]) {
      const x = ex + s * gap * f.dir + (f.dir > 0 ? size * 0.4 : -size * 0.4);
      ctx.beginPath();
      ctx.moveTo(x - size * 0.7, ey - size * 1.3);
      ctx.lineTo(x + size * 0.7 * f.dir, ey - size * 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 受击/攻击时的能量描边脉冲
function bodyLine(f: FormCtx): number {
  return f.R * 0.16 * (f.hurt ? 1.3 : 1);
}

// registerForm 便捷函数
function register(id: string, fn: FormFn): void {
  FORMS[id] = fn;
}

// ============================================================
// 各算法造型（实现见下）
// ============================================================

// —— 冒泡排序：一串上浮的气泡叠成的软体 ——
register('bubble_sort', (ctx, f) => {
  const { cx, cy, R, t } = f;
  // 依大小排列的气泡（越往上越小，呼应「上浮」）
  const bubbles = [
    { dx: 0, dy: R * 0.55, r: R * 0.62 },
    { dx: -R * 0.28, dy: -R * 0.05, r: R * 0.44 },
    { dx: R * 0.32, dy: -R * 0.12, r: R * 0.4 },
    { dx: 0, dy: -R * 0.6, r: R * 0.32 },
  ];
  stroke(ctx, f.color, bodyLine(f));
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    const wob = Math.sin(t * 3 + i) * R * 0.05;
    ctx.fillStyle = i % 2 === 0 ? f.color : withAlpha(f.color, 0.55);
    ctx.beginPath();
    ctx.arc(cx + b.dx + wob, cy + b.dy - (f.acting ? f.ext * R * 0.1 : 0), b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // 上浮的小气泡
  ctx.save();
  ctx.shadowBlur = 0;
  stroke(ctx, withAlpha('#ffffff', 0.5), 2);
  for (let i = 0; i < 3; i++) {
    const rise = ((t * 40 + i * 30) % (R * 2.4));
    ctx.beginPath();
    ctx.arc(cx + Math.sin(t * 2 + i) * R * 0.4, cy + R * 0.6 - rise, R * 0.08 + i * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  drawEyes(ctx, f, cx, cy - R * 0.6, R * 0.12);
});

function withAlpha(hex: string, a: number): string {
  // #rrggbb -> rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// —— 快速排序：一柄「基准之刃」，攻击时劈开成左右两半 ——
register('quick_sort', (ctx, f) => {
  const { cx, cy, R, dir } = f;
  const split = f.acting ? f.ext * R * 0.55 : Math.sin(f.t * 2) * R * 0.05;
  stroke(ctx, f.color, bodyLine(f));
  // 左右两块「分区」
  for (const s of [-1, 1]) {
    ctx.fillStyle = s < 0 ? f.color : withAlpha(f.color, 0.55);
    ctx.beginPath();
    ctx.moveTo(cx + s * split, cy - R * 0.7);
    ctx.lineTo(cx + s * (split + R * 0.7), cy);
    ctx.lineTo(cx + s * split, cy + R * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // 中央基准刃
  ctx.save();
  stroke(ctx, '#e2e8f0', R * 0.14);
  ctx.beginPath();
  ctx.moveTo(cx, cy - R * (0.9 + f.ext * 0.4));
  ctx.lineTo(cx, cy + R * 0.9);
  ctx.stroke();
  // 刃尖
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.14, cy - R * (0.9 + f.ext * 0.4));
  ctx.lineTo(cx + R * 0.14, cy - R * (0.9 + f.ext * 0.4));
  ctx.lineTo(cx, cy - R * (1.15 + f.ext * 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawEyes(ctx, f, cx + dir * R * 0.1, cy - R * 0.15, R * 0.11);
});

// —— 二分查找：一只不断折半锁定的「瞄准之眼」 ——
register('binary_search', (ctx, f) => {
  const { cx, cy, R } = f;
  // 外层收敛括号（区间边界向中间夹）
  const conv = f.acting ? f.ext : (Math.sin(f.t * 1.6) * 0.5 + 0.5) * 0.4;
  stroke(ctx, f.color, bodyLine(f));
  ctx.fillStyle = withAlpha(f.color, 0.5);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 中点十字准星
  ctx.save();
  stroke(ctx, '#e2e8f0', R * 0.08);
  const b = R * (0.85 - conv * 0.4);
  ctx.beginPath();
  ctx.moveTo(cx - b, cy); ctx.lineTo(cx + b, cy);
  ctx.moveTo(cx, cy - b); ctx.lineTo(cx, cy + b);
  ctx.stroke();
  // 收敛括号
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * b, cy - R * 0.4);
    ctx.lineTo(cx + s * (b - R * 0.12), cy - R * 0.4);
    ctx.lineTo(cx + s * (b - R * 0.12), cy + R * 0.4);
    ctx.lineTo(cx + s * b, cy + R * 0.4);
    ctx.stroke();
  }
  ctx.restore();
  // 中央大眼（瞳孔随攻击收缩 -> 锁定）
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0b0f1a';
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = f.acting ? '#f87171' : '#e2e8f0';
  ctx.beginPath();
  ctx.arc(cx, cy, R * (0.13 - conv * 0.06), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

// —— 迪杰斯特拉：发光的图节点核心，向外松弛出最短路径边 ——
register('dijkstra', (ctx, f) => {
  const { cx, cy, R, t } = f;
  const nodes = 6;
  // 外围节点
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < nodes; i++) {
    const a = (Math.PI * 2 * i) / nodes + t * 0.3;
    const rr = R * (0.85 + Math.sin(t * 2 + i) * 0.08);
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.85 });
  }
  // 松弛的边（攻击时点亮）
  stroke(ctx, withAlpha(f.color, f.acting ? 0.9 : 0.5), R * 0.08);
  for (const p of pts) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  // 节点
  ctx.fillStyle = f.color;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  // 发光核心
  ctx.save();
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.arc(cx, cy, R * (0.34 + (f.acting ? f.ext * 0.12 : 0)), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawEyes(ctx, f, cx, cy - R * 0.02, R * 0.1);
});

// —— DFS：一条一往无前的深潜藤蔓 / 长脖蛇形 ——
register('dfs', (ctx, f) => {
  const { cx, cy, R, dir, t } = f;
  // 身体是一条向前伸展的分段曲线（攻击时猛地拉长探出）
  const reach = R * (1.2 + (f.acting ? f.ext * 1.4 : 0));
  const seg = 7;
  stroke(ctx, f.color, bodyLine(f) * 1.1);
  ctx.beginPath();
  const headPts: { x: number; y: number } = { x: cx, y: cy };
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const x = cx + dir * reach * u;
    const y = cy - R * 0.2 + Math.sin(u * Math.PI * 1.5 + t * 3) * R * 0.28 * (1 - u * 0.5);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    if (i === seg) { headPts.x = x; headPts.y = y; }
  }
  ctx.stroke();
  // 尾部根须
  stroke(ctx, withAlpha(f.color, 0.6), R * 0.08);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - dir * R * 0.4, cy + R * 0.7 * s + R * 0.3);
    ctx.stroke();
  }
  // 尖头（探路的头）
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.moveTo(headPts.x + dir * R * 0.35, headPts.y);
  ctx.lineTo(headPts.x - dir * R * 0.2, headPts.y - R * 0.26);
  ctx.lineTo(headPts.x - dir * R * 0.2, headPts.y + R * 0.26);
  ctx.closePath();
  ctx.fill();
  drawEyes(ctx, f, headPts.x - dir * R * 0.02, headPts.y, R * 0.09);
});

// —— BFS：一层层向外扩散的方格波节点 ——
register('bfs', (ctx, f) => {
  const { cx, cy, R, t } = f;
  const layers = 3;
  stroke(ctx, withAlpha(f.color, 0.9), R * 0.06);
  // 逐层扩散的方格环
  for (let L = layers; L >= 1; L--) {
    const phase = f.acting ? f.ext : (t * 0.5) % 1;
    const rr = R * (0.3 + L * 0.28) * (1 + (L === layers ? phase * 0.15 : 0));
    ctx.globalAlpha = f.alpha * f.flicker * (0.4 + 0.2 * (layers - L));
    const cells = 4 + L * 2;
    for (let i = 0; i < cells; i++) {
      const a = (Math.PI * 2 * i) / cells;
      const bx = cx + Math.cos(a) * rr;
      const by = cy + Math.sin(a) * rr * 0.85;
      const sz = R * 0.16;
      ctx.fillStyle = (i % 2 === 0) ? f.color : withAlpha(f.color, 0.4);
      ctx.fillRect(bx - sz / 2, by - sz / 2, sz, sz);
      ctx.strokeRect(bx - sz / 2, by - sz / 2, sz, sz);
    }
  }
  ctx.globalAlpha = f.alpha * f.flicker;
  // 源点核心方块
  ctx.fillStyle = '#e2e8f0';
  const c = R * 0.34;
  ctx.fillRect(cx - c / 2, cy - c / 2, c, c);
  stroke(ctx, f.color, R * 0.08);
  ctx.strokeRect(cx - c / 2, cy - c / 2, c, c);
  drawEyes(ctx, f, cx, cy, R * 0.08);
});

// —— 动态规划：不断向上累积的记忆化状态方块塔 ——
register('dynamic_programming', (ctx, f) => {
  const { cx, cy, R } = f;
  // 越战越强：残血越低塔越高越亮
  const boost = 1 + (1 - f.hpRatio) * 0.5;
  const rows = 4;
  stroke(ctx, f.color, bodyLine(f) * 0.9);
  for (let r = 0; r < rows; r++) {
    const wCells = rows - r;
    const bw = R * 0.34;
    const y = cy + R * 0.7 - r * bw * boost;
    for (let c = 0; c < wCells; c++) {
      const x = cx - (wCells - 1) * bw * 0.5 + c * bw;
      const lit = (r + c) % 2 === 0;
      ctx.fillStyle = lit ? f.color : withAlpha(f.color, 0.45);
      ctx.fillRect(x - bw * 0.44, y - bw * 0.44, bw * 0.88, bw * 0.88);
      ctx.strokeRect(x - bw * 0.44, y - bw * 0.44, bw * 0.88, bw * 0.88);
    }
  }
  // 顶端最优解光块（攻击时下砸位移）
  ctx.save();
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#fff7cc';
  const topY = cy + R * 0.7 - rows * R * 0.34 * boost + (f.acting ? f.ext * R * 0.4 : 0);
  const s = R * 0.3;
  ctx.fillRect(cx - s / 2, topY - s / 2, s, s);
  ctx.restore();
  drawEyes(ctx, f, cx, cy + R * 0.2, R * 0.1);
});

// —— 线段树：一棵由区间方块构成的二叉树 ——
register('segment_tree', (ctx, f) => {
  const { cx, cy, R } = f;
  const top = cy - R * 0.85;
  const bw = R * 0.42;
  // 根 -> 两子 -> 四孙 的结构线
  stroke(ctx, withAlpha(f.color, 0.7), R * 0.06);
  const node = (x: number, y: number, w: number, lit: boolean) => {
    ctx.fillStyle = lit ? f.color : withAlpha(f.color, 0.5);
    ctx.fillRect(x - w / 2, y - bw * 0.3, w, bw * 0.6);
    stroke(ctx, f.color, R * 0.05);
    ctx.strokeRect(x - w / 2, y - bw * 0.3, w, bw * 0.6);
  };
  const root = { x: cx, y: top };
  const midY = cy;
  const leafY = cy + R * 0.85;
  const l1 = { x: cx - R * 0.5, y: midY };
  const r1 = { x: cx + R * 0.5, y: midY };
  const leaves = [cx - R * 0.75, cx - R * 0.25, cx + R * 0.25, cx + R * 0.75];
  // 连线
  ctx.beginPath();
  ctx.moveTo(root.x, root.y); ctx.lineTo(l1.x, l1.y);
  ctx.moveTo(root.x, root.y); ctx.lineTo(r1.x, r1.y);
  ctx.moveTo(l1.x, l1.y); ctx.lineTo(leaves[0], leafY);
  ctx.moveTo(l1.x, l1.y); ctx.lineTo(leaves[1], leafY);
  ctx.moveTo(r1.x, r1.y); ctx.lineTo(leaves[2], leafY);
  ctx.moveTo(r1.x, r1.y); ctx.lineTo(leaves[3], leafY);
  ctx.stroke();
  // 节点（攻击时懒标记下推，逐层点亮）
  node(root.x, root.y, R * 1.5, true);
  node(l1.x, l1.y, R * 0.7, f.acting ? f.ext > 0.2 : true);
  node(r1.x, r1.y, R * 0.7, f.acting ? f.ext > 0.2 : true);
  for (let i = 0; i < 4; i++) node(leaves[i], leafY, R * 0.34, f.acting ? f.ext > 0.5 : (i % 2 === 0));
  drawEyes(ctx, f, cx, top, R * 0.12);
});

// —— KMP：一条模式串带，攻击时「失配指针」沿 next 数组回跳 ——
register('kmp', (ctx, f) => {
  const { cx, cy, R, dir, t } = f;
  const cells = 5;
  const cw = R * 0.42;
  const totalW = cells * cw;
  const y = cy;
  // 匹配指针（攻击时快速推进到末尾，随后回跳 —— 呼应 KMP 的失配回退）
  const scan = f.acting ? f.ext : (Math.sin(t * 1.4) * 0.5 + 0.5);
  const activeIdx = Math.min(cells - 1, Math.floor(scan * cells));
  stroke(ctx, f.color, bodyLine(f) * 0.7);
  for (let i = 0; i < cells; i++) {
    const bx = cx - totalW / 2 + i * cw + cw / 2;
    const lit = i <= activeIdx;
    ctx.fillStyle = lit ? f.color : withAlpha(f.color, 0.4);
    ctx.fillRect(bx - cw * 0.42, y - cw * 0.42, cw * 0.84, cw * 0.84);
    ctx.strokeRect(bx - cw * 0.42, y - cw * 0.42, cw * 0.84, cw * 0.84);
  }
  // 失配回跳弧（next 指针）
  ctx.save();
  ctx.shadowBlur = 0;
  stroke(ctx, '#f87171', R * 0.06);
  const from = cx - totalW / 2 + activeIdx * cw + cw / 2;
  const to = cx - totalW / 2 + cw / 2;
  const arcH = R * (0.5 + f.ext * 0.3);
  ctx.beginPath();
  ctx.moveTo(from, y - cw * 0.5);
  ctx.quadraticCurveTo((from + to) / 2, y - cw * 0.5 - arcH, to, y - cw * 0.5);
  ctx.stroke();
  // 箭头
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.moveTo(to, y - cw * 0.5);
  ctx.lineTo(to + R * 0.12, y - cw * 0.5 - R * 0.1);
  ctx.lineTo(to + R * 0.02, y - cw * 0.5 - R * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 扫描头（当前指针）
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#e2e8f0';
  const headX = cx - totalW / 2 + activeIdx * cw + cw / 2;
  ctx.beginPath();
  ctx.moveTo(headX, y + cw * 0.5);
  ctx.lineTo(headX - R * 0.12, y + cw * 0.85);
  ctx.lineTo(headX + R * 0.12, y + cw * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawEyes(ctx, f, cx + dir * R * 0.1, y - cw * 0.9, R * 0.11);
});

// —— 并查集：一群小节点被压缩到同一个根，攻击时全部收拢指向根 ——
register('union_find', (ctx, f) => {
  const { cx, cy, R, t } = f;
  const rootX = cx;
  const rootY = cy - R * 0.1;
  const kids = 6;
  // 路径压缩：攻击时所有子节点直接连向根并向内收拢
  const pull = f.acting ? f.ext : 0;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < kids; i++) {
    const a = (Math.PI * 2 * i) / kids + t * 0.25;
    const rr = R * (0.95 - pull * 0.45) * (1 + Math.sin(t * 2 + i) * 0.05);
    pts.push({ x: rootX + Math.cos(a) * rr, y: rootY + Math.sin(a) * rr * 0.85 });
  }
  // 指向根的边（压缩后越来越直）
  stroke(ctx, withAlpha(f.color, f.acting ? 0.95 : 0.55), R * 0.07);
  for (const p of pts) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(rootX, rootY);
    ctx.stroke();
  }
  // 子节点
  ctx.fillStyle = withAlpha(f.color, 0.75);
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  // 根节点（护盾坦克气质：外圈光环）
  ctx.save();
  ctx.shadowBlur = 22;
  stroke(ctx, '#e2e8f0', R * 0.08);
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.arc(rootX, rootY, R * (0.32 + f.ext * 0.06), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawEyes(ctx, f, rootX, rootY, R * 0.11);
});

// —— 贪心：一张不断吞噬的大嘴，攻击时猛地咬合 ——
register('greedy', (ctx, f) => {
  const { cx, cy, R, dir, t } = f;
  // 咬合：待机小幅张合，攻击时先大张（前摇）再猛咬（命中）
  const idleOpen = (Math.sin(t * 3) * 0.5 + 0.5) * 0.25 + 0.1;
  const open = f.acting ? (f.wind * 0.9 * (1 - f.ext) + 0.05) : idleOpen;
  const mouthAng = open * Math.PI * 0.9;
  const rr = R * 0.95;
  const faceA = dir > 0 ? 0 : Math.PI; // 嘴朝向
  // 身体（吃豆人式）
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, rr, faceA + mouthAng, faceA - mouthAng + Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, withAlpha('#000', 0.25), bodyLine(f) * 0.6);
  ctx.stroke();
  // 上下颚锯齿（贪婪的牙）
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e2e8f0';
  for (const s of [1, -1]) {
    const a = faceA + s * mouthAng;
    for (let i = 1; i <= 3; i++) {
      const u = i / 4;
      const tx = cx + Math.cos(a) * rr * u;
      const ty = cy + Math.sin(a) * rr * u;
      const nx = Math.cos(a + s * 0.4) * R * 0.1;
      const ny = Math.sin(a + s * 0.4) * R * 0.1;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - nx, ty - ny);
      ctx.lineTo(tx + Math.cos(a) * R * 0.14, ty + Math.sin(a) * R * 0.14);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
  // 被吞的金币（局部最优的战利品）
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fbbf24';
  for (let i = 0; i < 3; i++) {
    const dist = ((t * 60 + i * 40) % (R * 1.6)) + R * 0.6;
    const cxg = cx + Math.cos(faceA) * (R * 2.2 - dist);
    const cyg = cy + Math.sin(faceA) * (R * 2.2 - dist) - R * 0.1;
    ctx.globalAlpha = f.alpha * f.flicker * (1 - dist / (R * 2.2));
    ctx.beginPath();
    ctx.arc(cxg, cyg, R * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // 眼睛（在上颚上方）
  drawEyes(ctx, f, cx - dir * R * 0.15, cy - R * 0.5, R * 0.12);
});

// —— 字典树：一棵向上分叉的前缀树 ——
register('trie', (ctx, f) => {
  const { cx, cy, R } = f;
  const rootX = cx;
  const rootY = cy + R * 0.85;
  stroke(ctx, f.color, bodyLine(f) * 0.8);
  // 递归分叉（攻击时枝条伸展点亮）
  const grow = f.acting ? f.ext : 0;
  const branch = (x: number, y: number, ang: number, len: number, depth: number) => {
    if (depth <= 0) return;
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    ctx.lineWidth = R * 0.06 * depth;
    ctx.strokeStyle = withAlpha(f.color, 0.5 + 0.5 * (depth / 3));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // 节点
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(ex, ey, R * 0.08 * depth, 0, Math.PI * 2);
    ctx.fill();
    const spread = 0.5 + grow * 0.25;
    branch(ex, ey, ang - spread, len * 0.72, depth - 1);
    branch(ex, ey, ang + spread, len * 0.72, depth - 1);
  };
  branch(rootX, rootY, -Math.PI / 2, R * 0.7, 3);
  // 根节点（起始空前缀）
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(rootX, rootY, R * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawEyes(ctx, f, cx, cy - R * 0.15, R * 0.1);
});

// —— FFT：由叠加正弦波构成的波形体 ——
register('fft', (ctx, f) => {
  const { cx, cy, R, t } = f;
  const span = R * 1.3;
  // 攻击时频率/振幅骤增（蝴蝶变换的能量爆发）
  const amp = R * (0.45 + (f.acting ? f.ext * 0.4 : Math.sin(t * 2) * 0.05));
  const freqs = [
    { k: 2, a: 1.0, ph: t * 3 },
    { k: 4, a: 0.5, ph: -t * 4 },
    { k: 6, a: 0.28, ph: t * 5 },
  ];
  const waveY = (u: number) => {
    let y = 0;
    for (const w of freqs) y += Math.sin(u * Math.PI * w.k + w.ph) * w.a;
    return y / 1.6;
  };
  // 主波形（描两条相位相反的波，围出「体」）
  for (const sgn of [1, -1]) {
    ctx.strokeStyle = sgn > 0 ? f.color : withAlpha(f.color, 0.55);
    ctx.lineWidth = bodyLine(f) * 0.7;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const x = cx - span + u * span * 2;
      const y = cy + waveY(u) * amp * sgn;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // 频点亮斑（谱线）
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#e2e8f0';
  for (let i = 0; i < 5; i++) {
    const u = (i + 0.5) / 5;
    const x = cx - span + u * span * 2;
    const y = cy + waveY(u) * amp;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // 中央核心
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.fillStyle = withAlpha(f.color, 0.85);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawEyes(ctx, f, cx, cy, R * 0.1);
});

// —— 后缀自动机：由状态圆与转移弧组成的机器怪 ——
register('suffix_automaton', (ctx, f) => {
  const { cx, cy, R, t } = f;
  const states = [
    { x: cx - R * 0.7, y: cy - R * 0.3, r: R * 0.34 }, // 初始态
    { x: cx + R * 0.15, y: cy - R * 0.55, r: R * 0.26 },
    { x: cx + R * 0.7, y: cy - R * 0.05, r: R * 0.24 },
    { x: cx + R * 0.05, y: cy + R * 0.55, r: R * 0.26 },
    { x: cx - R * 0.65, y: cy + R * 0.45, r: R * 0.22 },
  ];
  // 转移弧（攻击时点亮流动）
  const flow = f.acting ? f.ext : (t * 0.4) % 1;
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2]];
  stroke(ctx, withAlpha(f.color, f.acting ? 0.9 : 0.5), R * 0.06);
  for (const [a, b] of edges) {
    const s = states[a], e = states[b];
    const mx = (s.x + e.x) / 2 + (e.y - s.y) * 0.18;
    const my = (s.y + e.y) / 2 - (e.x - s.x) * 0.18;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.quadraticCurveTo(mx, my, e.x, e.y);
    ctx.stroke();
  }
  // 沿一条边流动的「当前读入符号」光点
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#e2e8f0';
  const ei = Math.floor(flow * edges.length) % edges.length;
  const lp = (flow * edges.length) % 1;
  const [sa, sb] = edges[ei];
  const px = states[sa].x + (states[sb].x - states[sa].x) * lp;
  const py = states[sa].y + (states[sb].y - states[sa].y) * lp;
  ctx.beginPath();
  ctx.arc(px, py, R * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 状态圆（接受态描双圈）
  for (let i = 0; i < states.length; i++) {
    const s = states[i];
    ctx.fillStyle = i === 0 ? f.color : withAlpha(f.color, 0.55);
    stroke(ctx, '#e2e8f0', R * 0.05);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (i === 2 || i === 4) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  drawEyes(ctx, f, states[0].x, states[0].y, R * 0.1);
});
