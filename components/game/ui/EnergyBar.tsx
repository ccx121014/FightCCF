import { memo } from 'react';

interface Props {
  current: number;
  max: number;
}

function EnergyBarComp({ current, max }: Props) {
  const ratio = Math.max(0, current / max);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#7dd3fc', fontWeight: 700 }}>
        <span>能量</span>
        <span>{Math.floor(current)} / {max}</span>
      </div>
      <div style={{ height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(56,189,248,0.25)' }}>
        <div
          style={{
            height: '100%',
            width: `${ratio * 100}%`,
            background: 'linear-gradient(90deg, #0ea5e9, #7dd3fc)',
            boxShadow: '0 0 10px rgba(56,189,248,0.7)',
            transition: 'width 0.1s linear',
            borderRadius: 6,
          }}
        />
      </div>
    </div>
  );
}

export const EnergyBar = memo(EnergyBarComp);
