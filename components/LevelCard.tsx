import { memo } from 'react';
import type { Level } from '@shared/types';
import { ELEMENTS } from '@shared/constants';

interface Props {
  level: Level;
  stars: number;
  unlocked: boolean;
  bestRating?: string;
  onClick: () => void;
}

function LevelCardComp({ level, stars, unlocked, bestRating, onClick }: Props) {
  const elem = ELEMENTS[level.element];
  const isBoss = level.description.includes('首领');

  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
      className="card"
      style={{
        padding: 14,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: unlocked ? 1 : 0.5,
        cursor: unlocked ? 'pointer' : 'not-allowed',
        borderColor: isBoss ? elem.color : 'var(--border)',
        borderWidth: isBoss ? 2 : 1,
        position: 'relative',
      }}
    >
      {/* 关卡编号徽章 */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: unlocked
            ? `linear-gradient(135deg, ${elem.color}, ${elem.color}88)`
            : 'var(--bg-3)',
          fontWeight: 900,
          fontSize: 18,
          color: unlocked ? '#0b0f1a' : 'var(--text-mute)',
          flexShrink: 0,
          boxShadow: unlocked ? `0 0 14px ${elem.glow}` : 'none',
        }}
      >
        {unlocked ? (isBoss ? '👑' : level.levelNumber) : '🔒'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{level.name}</span>
          {bestRating && bestRating !== 'C' && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: bestRating === 'S' ? '#fbbf24' : '#38bdf8',
                border: `1px solid ${bestRating === 'S' ? '#fbbf24' : '#38bdf8'}`,
                borderRadius: 5,
                padding: '0 4px',
              }}
            >
              {bestRating}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
          推荐战力 {level.recommendedPower}
        </div>
        {/* 星级 */}
        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
          {[1, 2, 3].map((i) => (
            <span key={i} style={{ fontSize: 13, color: i <= stars ? '#fbbf24' : 'var(--bg-3)' }}>
              ★
            </span>
          ))}
        </div>
      </div>

      {unlocked && <span style={{ color: 'var(--text-mute)', fontSize: 18 }}>›</span>}
    </button>
  );
}

export const LevelCard = memo(LevelCardComp);
