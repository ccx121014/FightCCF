import { memo } from 'react';
import type { Character, UserCharacter } from '@shared/types';
import { RARITIES, ELEMENTS } from '@shared/constants';
import { StickAvatar } from './StickAvatar';

interface Props {
  character: Character;
  owned: boolean;
  isSelected: boolean;
  userChar?: UserCharacter;
  onSelect: () => void;
  onClose: () => void;
}

function CharacterDetailComp({ character, owned, isSelected, userChar, onSelect, onClose }: Props) {
  const rarity = RARITIES[character.rarity];
  const elem = ELEMENTS[character.element];
  const s = character.baseStats;

  const stats: { label: string; value: string }[] = [
    { label: '生命', value: `${s.hp}` },
    { label: '攻击', value: `${s.attack}` },
    { label: '防御', value: `${s.defense}` },
    { label: '速度', value: `${s.speed}` },
    { label: '暴击率', value: `${Math.round(s.critRate * 100)}%` },
    { label: '暴击伤害', value: `${Math.round(s.critDamage * 100)}%` },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(7,10,18,0.85)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'grid', placeItems: 'center', padding: 18, animation: 'fadeIn 0.2s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: '100%', maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', animation: 'pop 0.35s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* 头部 */}
        <div style={{ padding: 20, textAlign: 'center', background: `radial-gradient(circle at 50% 20%, ${rarity.glow}, transparent 65%)`, borderBottom: '1px solid var(--border-soft)' }}>
          <StickAvatar color={character.avatarColor} element={character.element} size={100} pose="victory" />
          <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{character.name}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{character.title}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <span className="chip" style={{ color: rarity.color }}>{rarity.name}</span>
            <span className="chip" style={{ color: elem.color }}>{elem.name}元素</span>
            {userChar && <span className="chip" style={{ color: 'var(--gold)' }}>Lv.{userChar.level}</span>}
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 16 }}>
            {character.description}
          </p>

          {/* 属性 */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
            {stats.map((st) => (
              <div key={st.label} className="panel" style={{ padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{st.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* 被动 */}
          <div className="panel" style={{ padding: 12, marginBottom: 12, borderLeft: `3px solid ${elem.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: elem.color, marginBottom: 2 }}>
              被动 · {character.passive.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{character.passive.description}</div>
          </div>

          {/* 技能 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {character.skills.map((sk, i) => (
              <div key={sk.id} className="panel" style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, background: elem.color, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900, color: '#0b0f1a', flexShrink: 0 }}>
                  {['J', 'K', 'L'][i]}
                </span>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 13 }}>{sk.name}</span>
                    <span style={{ fontSize: 10, color: '#7dd3fc' }}>⚡{sk.energyCost}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>×{sk.damageMultiplier}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sk.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 操作 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>关闭</button>
            {owned && (
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={onSelect} disabled={isSelected}>
                {isSelected ? '已出战' : '设为出战'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const CharacterDetail = memo(CharacterDetailComp);
