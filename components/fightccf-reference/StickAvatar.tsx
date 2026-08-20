import { memo } from 'react';
import { ELEMENTS, type ElementType } from '@shared/constants';

interface Props {
  color: string;
  element: ElementType;
  size?: number;
  pose?: 'idle' | 'attack' | 'victory';
}

// SVG 火柴人头像，用于角色卡片/选择等静态展示
function StickAvatarComp({ color, element, size = 80, pose = 'idle' }: Props) {
  const glow = ELEMENTS[element]?.glow ?? 'rgba(255,255,255,0.4)';
  const sw = size * 0.09;

  // 根据姿势调整手臂
  const armRight =
    pose === 'attack'
      ? 'M50 44 L74 40'
      : pose === 'victory'
        ? 'M50 44 L68 24'
        : 'M50 44 L66 56';
  const armLeft = pose === 'victory' ? 'M50 44 L32 24' : 'M50 44 L34 56';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ filter: `drop-shadow(0 0 ${size * 0.08}px ${glow})`, overflow: 'visible' }}
    >
      {/* 阴影 */}
      <ellipse cx="50" cy="92" rx={size * 0.25} ry={size * 0.05} fill="rgba(0,0,0,0.35)" />
      <g
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
      >
        {/* 头 */}
        <circle cx="50" cy="24" r="12" />
        {/* 躯干 */}
        <path d="M50 36 L50 62" fill="none" />
        {/* 手臂 */}
        <path d={armLeft} fill="none" />
        <path d={armRight} fill="none" />
        {/* 腿 */}
        <path d="M50 62 L38 86" fill="none" />
        <path d="M50 62 L62 86" fill="none" />
      </g>
      {/* 头部高光 */}
      <circle cx="45" cy="20" r="3.5" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

export const StickAvatar = memo(StickAvatarComp);
