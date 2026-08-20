import { memo } from 'react';

export interface SkillSlot {
  key: string;
  name: string;
  energyCost: number;
  cooldownRatio: number;
  cooldownRemaining: number;
  ready: boolean;
  color: string;
}

interface Props {
  slots: SkillSlot[];
  energy: number;
  onTap?: (index: number) => void;
}

function SkillBarComp({ slots, energy, onTap }: Props) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {slots.map((s, i) => {
        const affordable = energy >= s.energyCost && s.ready;
        return (
          <button
            key={s.key}
            onClick={() => onTap?.(i)}
            style={{
              position: 'relative',
              width: 58,
              height: 58,
              borderRadius: 12,
              border: `2px solid ${affordable ? s.color : 'rgba(255,255,255,0.15)'}`,
              background: affordable
                ? `linear-gradient(160deg, ${s.color}33, rgba(0,0,0,0.4))`
                : 'rgba(0,0,0,0.45)',
              boxShadow: affordable ? `0 0 14px ${s.color}66` : 'none',
              overflow: 'hidden',
              transition: 'all 0.15s ease',
              opacity: s.energyCost > energy ? 0.5 : 1,
            }}
          >
            {/* 冷却遮罩 */}
            {s.cooldownRatio > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.65)',
                  height: `${s.cooldownRatio * 100}%`,
                  top: 0,
                }}
              />
            )}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{s.key}</span>
              <span style={{ fontSize: 9, color: '#7dd3fc', fontWeight: 700 }}>⚡{s.energyCost}</span>
              {s.cooldownRemaining > 0 && (
                <span style={{ position: 'absolute', fontSize: 16, fontWeight: 900, color: '#fff' }}>
                  {s.cooldownRemaining.toFixed(1)}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export const SkillBar = memo(SkillBarComp);
