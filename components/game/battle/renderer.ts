import { ELEMENTS } from '@shared/constants';
import type { BattleUnit } from '../entities/BattleUnit';
import type { DamageNumber, HitEffect } from '../types';

// ---- 战场背景：深色 + 网格 + 地平线 ----
export function drawBattlefield(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // 渐变背景
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0b1120');
  g.addColorStop(0.55, '#0e1526');
  g.addColorStop(1, '#141d33');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 顶部氛围光
  const glow = ctx.createRadialGradient(w / 2, -60, 20, w / 2, -60, h * 0.9);
  glow.addColorStop(0, 'rgba(245,158,11,0.10)');
  glow.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // 网格地面
  ctx.strokeStyle = 'rgba(120,150,200,0.08)';
  ctx.lineWidth = 1;
  const horizon = h * 0.4;
  // 横线（透视）
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const y = horizon + (h - horizon) * t * t;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // 竖线（透视汇聚）
  const vp = w / 2;
  for (let i = 0; i <= 16; i++) {
    const x = (w / 16) * i;
    ctx.beginPath();
    ctx.moveTo(vp + (x - vp) * 0.35, horizon);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // 地平线高光
  const hl = ctx.createLinearGradient(0, horizon - 2, 0, horizon + 40);
  hl.addColorStop(0, 'rgba(56,189,248,0.15)');
  hl.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(0, horizon - 2, w, 42);
}

// ---- 火柴人角色（Alan Becker 风格）----
export function drawStickFigure(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
  const { pos, radius } = unit;
  const t = unit.animTime;
  const color = unit.color;
  const elementGlow = ELEMENTS[unit.element].glow;

  // 死亡渐隐
  const alpha = unit.isAlive ? 1 : Math.max(0, 1 - unit.animTime / 0.6);
  // 无敌闪烁
  const flicker = unit.invincible && unit.isAlive ? (Math.floor(t * 30) % 2 === 0 ? 0.45 : 1) : 1;

  ctx.save();
  ctx.globalAlpha = alpha * flicker;

  const dir = unit.facing === 'right' ? 1 : -1;

  // 地面阴影
  ctx.save();
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + radius + 6, radius * 0.9, radius * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ---- 姿态解析 ----
  const acting = unit.animState === 'attack' || unit.animState === 'skill';
  const isSkill = unit.animState === 'skill';
  const p = acting ? unit.attackProgress : 0;
  // 前摇拉起 wind: 0->1，命中伸展 ext: 0(前摇结束)->1
  const wind = acting ? Math.min(1, p / 0.4) : 0;
  const ext = acting ? (p < 0.4 ? 0 : (p - 0.4) / 0.6) : 0;
  const pose = unit.currentPose;
  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

  // ---- 出招手感曲线（Alan Becker 式：蓄力 → 爆发过冲 → 跟随衰减）----
  const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
  const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  // 前摇：快速蓄满并保持（anticipation）
  const windE = acting ? easeOutCubic(wind) : 0;
  // 命中：迅速冲到 1.12 过冲，再回落到 0.85 停手 —— 这就是「衰」（follow-through）
  const strikeVal = (u: number): number => {
    if (u <= 0) return 0;
    if (u <= 0.45) return 1.12 * easeOutCubic(u / 0.45);
    return 1.12 + (0.85 - 1.12) * easeInOutCubic((u - 0.45) / 0.55);
  };
  const extSnap = acting ? strikeVal(ext) : 0;

  // 全身姿态修饰：躯干倾斜 / 蹲伏 / 呼吸
  let bob = 0;
  let lean = 0;
  let squashX = 1;
  let squashY = 1;
  if (unit.animState === 'idle') {
    bob = Math.sin(t * 3) * 2;
    squashY = 1 + Math.sin(t * 3) * 0.02;
  } else if (unit.animState === 'walk') {
    bob = Math.abs(Math.sin(t * 12)) * -4;
    lean = dir * 0.1;
  } else if (unit.animState === 'hurt') {
    lean = -dir * 0.22;
    squashX = 0.94;
    squashY = 1.06;
  } else if (unit.animState === 'death') {
    lean = dir * (0.1 + unit.animTime * 2.2);
  } else if (acting) {
    // 前摇后仰蓄力，命中时前倾过冲再回稳
    lean = dir * lerp(-0.16 * windE, 0.26, extSnap);
    if (pose === 'stomp') lean = dir * lerp(-0.22 * windE, 0.32, extSnap);
    // 蓄力瞬间轻微下蹲，命中瞬间弹起（squash & stretch）
    squashY = 1 - windE * 0.06 + Math.max(0, extSnap - 0.6) * 0.05;
    squashX = 1 + windE * 0.05;
  }

  // 步进冲刺：前摇收步、命中蹬地前扑、跟随回收（Alan Becker 发力感）
  const lunge = acting ? dir * (extSnap * 16 - windE * 7) : 0;
  const cx = pos.x + lunge;
  const cy = pos.y + bob;

  // 骨架关键点
  const headR = radius * 0.4;
  const neckY = cy - radius * 0.6;
  const shoulderY = neckY + radius * 0.14;
  const hipY = cy + radius * 0.5;
  const headCy = neckY - headR * 0.95;

  // 肢体分段长度（上臂/前臂、大腿/小腿）
  const upperArm = radius * 0.46;
  const foreArm = radius * 0.48;
  const thigh = radius * 0.52;
  const shin = radius * 0.54;

  ctx.translate(cx, cy);
  ctx.rotate(lean);
  ctx.scale(squashX, squashY);
  ctx.translate(-cx, -cy);

  // 发光描边
  ctx.shadowColor = elementGlow;
  ctx.shadowBlur = isSkill ? 24 : acting ? 16 : 10;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = radius * 0.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 正向运动学：绘制两段关节肢体，返回末端与朝向
  const limb = (ox: number, oy: number, a1: number, a2: number, l1: number, l2: number) => {
    const jx = ox + Math.sin(a1) * l1 * dir;
    const jy = oy + Math.cos(a1) * l1;
    const ex = jx + Math.sin(a1 + a2) * l2 * dir;
    const ey = jy + Math.cos(a1 + a2) * l2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(jx, jy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    return { x: ex, y: ey, faAbs: a1 + a2 };
  };

  // ---- 腿部（后腿在身后，先画）----
  let fLeg1 = 0.16, fLeg2 = 0.14, bLeg1 = -0.16, bLeg2 = 0.14;
  if (unit.animState === 'walk') {
    const s = Math.sin(t * 12);
    fLeg1 = 0.36 * s + 0.1; fLeg2 = 0.22;
    bLeg1 = -0.36 * s + 0.1; bLeg2 = 0.22;
  } else if (acting && pose === 'stomp') {
    // 蓄力提膝，命中蹬地下踏
    const k = lerp(0.45 * windE, 0.12, extSnap);
    fLeg1 = lerp(0.2, 0.34, extSnap); fLeg2 = k; bLeg1 = -0.26; bLeg2 = k;
  } else if (acting && pose === 'thrust') {
    // 弓步前刺：前腿随命中大幅蹬出
    fLeg1 = lerp(0.12, 0.66, extSnap); fLeg2 = 0.2; bLeg1 = lerp(-0.2, -0.55, extSnap); bLeg2 = lerp(0.2, 0.5, extSnap);
  } else if (acting && pose === 'slash') {
    fLeg1 = lerp(0.24, 0.44, extSnap); bLeg1 = lerp(-0.2, -0.34, extSnap); fLeg2 = 0.24; bLeg2 = 0.24;
  } else if (acting && pose === 'guard') {
    fLeg1 = 0.3; bLeg1 = -0.34; fLeg2 = 0.28; bLeg2 = 0.28;
  }
  ctx.save();
  ctx.globalAlpha = ctx.globalAlpha * 0.9;
  limb(cx, hipY, bLeg1, bLeg2, thigh, shin);
  ctx.restore();

  // 躯干
  ctx.beginPath();
  ctx.moveTo(cx, neckY);
  ctx.lineTo(cx, hipY);
  ctx.stroke();

  // 前腿
  limb(cx, hipY, fLeg1, fLeg2, thigh, shin);

  // ---- 手臂：依据姿态取前摇 / 命中角度 [fA1,fA2,bA1,bA2] ----
  let fA1 = 0.3, fA2 = 0.35, bA1 = -0.3, bA2 = 0.35;
  // 命中目标角（供挥击拖影采样复用）
  let poseW = [0.3, 0.35, -0.3, 0.35];
  let poseS = [0.3, 0.35, -0.3, 0.35];
  let meleeSwing = false; // 是否为近战挥击（画拖影）
  if (unit.animState === 'walk') {
    const s = Math.sin(t * 12);
    fA1 = 0.3 - s * 0.5; fA2 = 0.4;
    bA1 = -0.3 + s * 0.5; bA2 = 0.4;
  } else if (acting) {
    switch (pose) {
      case 'punch': {
        // 连招变化：直拳 / 交叉勾拳 / 上勾拳，依出招序号循环
        const combo = unit.attackSeq % 3;
        if (combo === 0) { poseW = [-0.5, 1.6, 0.4, 1.3]; poseS = [1.55, 0.02, -0.7, 1.5]; }        // 直拳
        else if (combo === 1) { poseW = [0.5, 1.4, -0.6, 1.4]; poseS = [-0.9, 1.5, 1.7, 0.05]; }     // 交叉后手拳
        else { poseW = [1.9, 1.7, 0.6, 1.2]; poseS = [2.5, 1.9, -0.5, 1.4]; }                         // 上勾拳
        meleeSwing = true;
        break;
      }
      case 'slash': {
        // 斜劈 / 反手横扫 交替
        const alt = unit.attackSeq % 2;
        if (alt === 0) { poseW = [-1.5, 0.3, -0.6, 0.8]; poseS = [1.25, 0.1, 0.2, 0.8]; }
        else { poseW = [1.5, 0.3, 0.6, 0.8]; poseS = [-1.1, 0.15, -0.3, 0.8]; }
        meleeSwing = true;
        break;
      }
      case 'shoot': poseW = [1.4, 0.0, 0.7, 1.4]; poseS = [1.4, 0.0, 1.15, 0.25]; break;
      case 'cast': poseW = [1.0, 0.25, 0.9, 0.3]; poseS = [1.35, 0.15, 1.2, 0.2]; break;
      case 'thrust': poseW = [0.2, 1.5, -0.2, 1.2]; poseS = [1.5, 0.05, 1.4, 0.1]; meleeSwing = true; break;
      case 'guard': poseW = [0.9, 1.2, 0.7, 1.2]; poseS = [0.7, 1.4, 0.55, 1.4]; break;
      case 'stomp': poseW = [-1.5, 0.1, -1.4, 0.15]; poseS = [1.6, 0.1, 1.5, 0.12]; meleeSwing = true; break;
    }
    // 蓄力用 windE 快速到位，命中用带过冲/回落的 extSnap —— 招式更「脆」更有跟随
    fA1 = lerp(lerp(0.3, poseW[0], windE), poseS[0], extSnap);
    fA2 = lerp(lerp(0.35, poseW[1], windE), poseS[1], extSnap);
    bA1 = lerp(lerp(-0.3, poseW[2], windE), poseS[2], extSnap);
    bA2 = lerp(lerp(0.35, poseW[3], windE), poseS[3], extSnap);
  }

  // 计算某个「命中���度」下前手末端位置（用于挥击拖影采样）
  const frontHandAt = (e: number): { x: number; y: number } => {
    const a1 = lerp(lerp(0.3, poseW[0], windE), poseS[0], e);
    const a2 = lerp(lerp(0.35, poseW[1], windE), poseS[1], e);
    const jx = cx + Math.sin(a1) * upperArm * dir;
    const jy = shoulderY + Math.cos(a1) * upperArm;
    return { x: jx + Math.sin(a1 + a2) * foreArm * dir, y: jy + Math.cos(a1 + a2) * foreArm };
  };

  // ---- 挥击拖影（smear）：命中阶段沿手部轨迹残留几道渐隐弧 ----
  if (acting && meleeSwing && ext > 0.35 && ext < 0.95) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.lineCap = 'round';
    const cur = strikeVal(ext);
    for (let i = 1; i <= 4; i++) {
      const back = strikeVal(Math.max(0, ext - i * 0.11));
      const a = (1 - i / 5) * 0.28;
      if (a <= 0) continue;
      const p0 = frontHandAt(back);
      const p1 = frontHandAt(cur - (cur - back) * 0.5);
      ctx.globalAlpha = alpha * flicker * a;
      ctx.strokeStyle = color;
      ctx.lineWidth = radius * 0.34 * (1 - i / 6);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 后臂（身后）
  ctx.save();
  ctx.globalAlpha = ctx.globalAlpha * 0.9;
  const backHand = limb(cx, shoulderY, bA1, bA2, upperArm, foreArm);
  ctx.restore();
  // 前臂（持械手）
  const frontHand = limb(cx, shoulderY, fA1, fA2, upperArm, foreArm);

  // ---- 手中武器 / 拳（呼应姿态）----
  drawPoseWeapon(ctx, pose, frontHand, backHand, dir, radius, color, ext, acting, alpha * flicker);

  // 头部（实心圆）
  ctx.beginPath();
  ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();

  // 头部高光
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.globalAlpha = alpha * 0.5 * flicker;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - headR * 0.3 * dir, headCy - headR * 0.35, headR * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();

  // 技能光环
  if (isSkill) {
    ctx.save();
    ctx.globalAlpha = alpha * (1 - unit.attackProgress) * 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = elementGlow;
    ctx.shadowBlur = 20;
    const r = radius + unit.attackProgress * 40;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 敌人信息：只保留血条和算法名称，不显示施法提示
  if (!unit.isPlayer && unit.isAlive) {
    drawUnitHealthBar(ctx, unit);
    ctx.save();
    ctx.font = `${Math.max(9, radius * 0.28)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(unit.characterId?.replaceAll('_', ' ') ?? 'ALGORITHM', unit.pos.x, unit.pos.y - radius - 24);
    ctx.restore();
  }
}

interface Hand { x: number; y: number; faAbs: number; }

// 依据出招姿态在手部绘制对应的武器 / 拳 / 法术辉光
function drawPoseWeapon(
  ctx: CanvasRenderingContext2D,
  pose: string,
  front: Hand,
  back: Hand,
  dir: number,
  radius: number,
  color: string,
  ext: number,
  acting: boolean,
  alpha: number
): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const ang = front.faAbs; // 前臂绝对角（0=下，右手系）
  // 将「关节角」转为屏幕方向向量（与 limb 一致：x=sin*dir, y=cos）
  const vx = Math.sin(ang) * dir;
  const vy = Math.cos(ang);

  switch (pose) {
    case 'slash': {
      // 快排分区刃：以 pivot 标记切开区间
      ctx.strokeStyle = color;
      ctx.lineWidth = radius * 0.08;
      ctx.setLineDash([radius * 0.18, radius * 0.12]);
      ctx.beginPath();
      ctx.moveTo(front.x - vy * radius * 0.5, front.y + vx * radius * 0.5);
      ctx.lineTo(front.x + vx * radius * 2.1, front.y + vy * radius * 2.1);
      ctx.stroke();
      ctx.setLineDash([]);
      // 长剑：沿前臂延长
      const bladeLen = radius * 1.5;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = radius * 0.16;
      ctx.beginPath();
      ctx.moveTo(front.x, front.y);
      ctx.lineTo(front.x + vx * bladeLen, front.y + vy * bladeLen);
      ctx.stroke();
      // 剑格
      ctx.strokeStyle = color;
      ctx.lineWidth = radius * 0.12;
      ctx.beginPath();
      ctx.moveTo(front.x - vy * radius * 0.22, front.y + vx * radius * 0.22);
      ctx.lineTo(front.x + vy * radius * 0.22, front.y - vx * radius * 0.22);
      ctx.stroke();
      break;
    }
    case 'thrust': {
      // DFS / 增广路探针：沿路径深入或贯穿残量网络
      ctx.strokeStyle = color;
      ctx.lineWidth = radius * 0.22;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(front.x - vx * radius * 0.75, front.y - vy * radius * 0.75);
      ctx.lineTo(front.x + vx * radius * 2.4, front.y + vy * radius * 2.4);
      ctx.stroke();
      // 长枪：细长直刺
      const spearLen = radius * 2.0;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = radius * 0.12;
      ctx.beginPath();
      ctx.moveTo(front.x - vx * radius * 0.5, front.y - vy * radius * 0.5);
      ctx.lineTo(front.x + vx * spearLen, front.y + vy * spearLen);
      ctx.stroke();
      // 枪尖
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(front.x + vx * spearLen, front.y + vy * spearLen, radius * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'shoot': {
      // 二分查询器：折半指针与区间弦
      ctx.strokeStyle = color;
      ctx.lineWidth = radius * 0.07;
      ctx.beginPath();
      ctx.moveTo(front.x - vx * radius * 0.7, front.y - vy * radius * 0.7);
      ctx.lineTo(front.x + vx * radius * 1.9, front.y + vy * radius * 1.9);
      ctx.stroke();
      // 弓：以前手为弓身，蓄力时拉弦
      const bowR = radius * 0.9;
      const bx = front.x;
      const by = front.y;
      const nx = -vy, ny = vx; // 法线
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = radius * 0.1;
      ctx.beginPath();
      ctx.arc(bx, by, bowR, Math.atan2(ny, nx) - 1.1, Math.atan2(ny, nx) + 1.1);
      ctx.stroke();
      // 弦
      const tipA = { x: bx + Math.cos(Math.atan2(ny, nx) - 1.1) * bowR, y: by + Math.sin(Math.atan2(ny, nx) - 1.1) * bowR };
      const tipB = { x: bx + Math.cos(Math.atan2(ny, nx) + 1.1) * bowR, y: by + Math.sin(Math.atan2(ny, nx) + 1.1) * bowR };
      const pull = acting ? (0.5 - ext * 0.5) : 0.2;
      const nockX = bx - vx * bowR * pull;
      const nockY = by - vy * bowR * pull;
      ctx.strokeStyle = 'rgba(226,232,240,0.7)';
      ctx.lineWidth = radius * 0.05;
      ctx.beginPath();
      ctx.moveTo(tipA.x, tipA.y);
      ctx.lineTo(nockX, nockY);
      ctx.lineTo(tipB.x, tipB.y);
      ctx.stroke();
      break;
    }
    case 'cast': {
      // 法术：双手间辉光球
      const mx = (front.x + back.x) / 2 + vx * radius * 0.4;
      const my = (front.y + back.y) / 2 + vy * radius * 0.4;
      const orbR = radius * (0.3 + (acting ? ext * 0.35 : 0.1));
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.arc(mx, my, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx, my, orbR * 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'stomp': {
      // 双手大锤：命中时向下
      const hammerLen = radius * 1.3;
      const hx = front.x + vx * hammerLen;
      const hy = front.y + vy * hammerLen;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = radius * 0.14;
      ctx.beginPath();
      ctx.moveTo(front.x, front.y);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(hx, hy, radius * 0.34, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'guard': {
      // 盾牌：护在身前
      const sx = front.x + vx * radius * 0.3;
      const sy = front.y + vy * radius * 0.3;
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.ellipse(sx, sy, radius * 0.36, radius * 0.5, Math.atan2(vy, vx), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = radius * 0.06;
      ctx.stroke();
      break;
    }
    case 'punch':
    default: {
      // 拳头 + 命中速度线
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(front.x, front.y, radius * 0.17, 0, Math.PI * 2);
      ctx.fill();
      if (acting && ext > 0.5) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = color;
        ctx.lineWidth = radius * 0.1;
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(front.x - vx * i * 8, front.y - vy * i * 8);
          ctx.lineTo(front.x - vx * (i * 8 + 10), front.y - vy * (i * 8 + 10));
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }
  }
  ctx.restore();
}

export function drawUnitHealthBar(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
  const w = 56;
  const h = 6;
  const x = unit.pos.x - w / 2;
  const y = unit.pos.y - unit.radius - 34;

  ctx.save();
  // 背景
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  const ratio = unit.hpRatio;
  let barColor = '#ff5555';
  if (ratio > 0.6) barColor = '#ff7b72';
  else if (ratio > 0.3) barColor = '#fbbf24';

  ctx.fillStyle = barColor;
  ctx.fillRect(x, y, w * ratio, h);

  // 名字
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '600 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(unit.name, unit.pos.x, y - 6);
  ctx.restore();
}

// ---- 命中特效 ----
export function drawHitEffect(ctx: CanvasRenderingContext2D, e: HitEffect): void {
  const p = e.life / e.maxLife;
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.strokeStyle = e.color;
  ctx.fillStyle = e.color;
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 16;

  switch (e.type) {
    case 'hit': {
      // 星形冲击
      const r = e.radius * (0.4 + p * 0.9);
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(a) * r * 0.4, e.y + Math.sin(a) * r * 0.4);
        ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
        ctx.stroke();
      }
      break;
    }
    case 'slash': {
      ctx.lineWidth = 5 * (1 - p);
      const r = e.radius;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, -0.6 + p, 1.2 + p);
      ctx.stroke();
      break;
    }
    case 'burst': {
      const r = e.radius * (0.3 + p * 1.1);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.stroke();
      // 内部填充
      ctx.globalAlpha = (1 - p) * 0.3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ring': {
      const r = e.radius * (0.5 + p * 0.6);
      ctx.lineWidth = 6 * (1 - p);
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'arrow': {
      // 二分：飞行的箭矢（沿 angle 拉出尾迹）
      const a = e.angle ?? 0;
      const len = e.radius;
      const tipX = e.tx ?? e.x + Math.cos(a) * len;
      const tipY = e.ty ?? e.y + Math.sin(a) * len;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      // 箭头
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - Math.cos(a - 0.4) * 10, tipY - Math.sin(a - 0.4) * 10);
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - Math.cos(a + 0.4) * 10, tipY - Math.sin(a + 0.4) * 10);
      ctx.stroke();
      break;
    }
    case 'bubble': {
      // 冒泡：上浮的气泡群
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const off = (i - 1.5) * 10;
        const rise = p * 26 + i * 4;
        const br = e.radius * 0.28 * (1 - p * 0.4) * (0.7 + (i % 2) * 0.5);
        ctx.beginPath();
        ctx.arc(e.x + off, e.y - rise, br, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'wave': {
      // FFT：正弦波束（沿 angle）
      const a = e.angle ?? 0;
      const len = e.radius;
      const amp = 12 * (1 - p);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let s = 0; s <= 1.001; s += 0.06) {
        const px = e.x + Math.cos(a) * len * s - Math.sin(a) * Math.sin(s * Math.PI * 4 + p * 8) * amp;
        const py = e.y + Math.sin(a) * len * s + Math.cos(a) * Math.sin(s * Math.PI * 4 + p * 8) * amp;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    }
    case 'segment': {
      // 线段树：一排区间方块
      const n = 4;
      const total = e.radius;
      const bw = total / n;
      ctx.lineWidth = 2;
      for (let i = 0; i < n; i++) {
        const bx = e.x - total / 2 + i * bw;
        const h = 18 * (1 - p) * (0.6 + (i % 2) * 0.6);
        ctx.globalAlpha = (1 - p) * (i % 2 === 0 ? 0.9 : 0.5);
        ctx.strokeRect(bx + 2, e.y - h / 2, bw - 4, h);
      }
      break;
    }
    case 'chain': {
      // 连锁 / 松弛：两点间的连线 + 节点
      const tx = e.tx ?? e.x;
      const ty = e.ty ?? e.y;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      for (const pt of [[e.x, e.y], [tx, ty]]) {
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 4 + e.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'pierce': {
      // DFS / 快排：贯穿光束
      const a = e.angle ?? 0;
      const len = e.radius;
      const tx = e.tx ?? e.x + Math.cos(a) * len;
      const ty = e.ty ?? e.y + Math.sin(a) * len;
      ctx.lineWidth = 8 * (1 - p);
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // 内芯
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * (1 - p);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      break;
    }
    case 'split': {
      // 字典树：分叉射线
      const a = e.angle ?? 0;
      const len = e.radius;
      const tx = e.tx ?? e.x + Math.cos(a) * len;
      const ty = e.ty ?? e.y + Math.sin(a) * len;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // 末端分叉
      for (const d of [-0.5, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(a + d) * 14, ty + Math.sin(a + d) * 14);
        ctx.stroke();
      }
      break;
    }
    case 'grid': {
      // BFS：层层扩散的方格波
      const r = e.radius * (0.4 + p * 0.9);
      ctx.lineWidth = 2.5 * (1 - p);
      ctx.strokeRect(e.x - r, e.y - r, r * 2, r * 2);
      const r2 = r * 0.6;
      ctx.globalAlpha = (1 - p) * 0.6;
      ctx.strokeRect(e.x - r2, e.y - r2, r2 * 2, r2 * 2);
      break;
    }
  }
  ctx.restore();
}

// ---- 伤害数字 ----
export function drawDamageNumber(ctx: CanvasRenderingContext2D, d: DamageNumber): void {
  const p = d.life / d.maxLife;
  ctx.save();
  ctx.globalAlpha = 1 - p * p;
  const scale = d.isCrit ? 1.4 + (1 - p) * 0.3 : 1;
  ctx.font = `800 ${Math.round(20 * scale)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.fillStyle = d.color;

  const text = d.isCrit ? `${d.value}!` : `${d.value}`;
  ctx.strokeText(text, d.x, d.y);
  ctx.fillText(text, d.x, d.y);

  if (d.reaction) {
    ctx.font = '700 12px system-ui';
    ctx.fillStyle = '#fff';
    ctx.strokeText(d.reaction, d.x, d.y - 20);
    ctx.fillText(d.reaction, d.x, d.y - 20);
  }
  ctx.restore();
}
