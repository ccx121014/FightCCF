import { memo } from 'react';
import type { Character } from '@shared/types';
import { RARITIES, ELEMENTS } from '@shared/constants';
import { StickAvatar } from './StickAvatar';

interface Props {
  character: Character;
  owned?: boolean;
  stars?: number;
  selected?: boolean;
  locked?: boolean;
  onClick?: () => void;
}

function CharacterCardComp({ character, owned = true, stars, selected, locked, onClick }: Props) {
  const rarity = RARITIES[character.rarity];
  const elem = ELEMENTS[character.element];

  return (
    <button
      onClick={onClick}
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        border: selected ? `2px solid ${rarity.color}` : `1px solid var(--border)`,
        boxShadow: selected ? `0 0 18px ${rarity.glow}` : undefined,
        opacity: owned ? 1 : 0.5,
        textAlign: 'center',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* 稀有度顶条 */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${rarity.gradient[0]}, ${rarity.gradient[1]})` }} />

      {/* 元素角标 */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: elem.color,
          display: 'grid',
          placeItems: 'center',
          fontSize: 11,
          fontWeight: 900,
          color: '#0b0f1a',
          zIndex: 2,
        }}
        title={elem.name}
      >
        {elem.name}
      </div>

      {/* 头像区 */}
      <div
        style={{
          padding: '14px 0 6px',
          background: `radial-gradient(circle at 50% 40%, ${rarity.glow}, transparent 70%)`,
        }}
      >
        <StickAvatar color={character.avatarColor} element={character.element} size={68} pose="idle" />
      </div>

      {/* 信息 */}
      <div style={{ padding: '4px 8px 12px' }}>
        <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {character.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 4 }}>{character.title}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          {Array.from({ length: rarity.stars }).map((_, i) => (
            <span key={i} style={{ fontSize: 10, color: (stars ?? rarity.stars) > i ? rarity.color : 'var(--bg-3)' }}>
              ★
            </span>
          ))}
        </div>
      </div>

      {locked && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(7,10,18,0.6)', fontSize: 26 }}>
          🔒
        </div>
      )}
    </button>
  );
}

export const CharacterCard = memo(CharacterCardComp);
