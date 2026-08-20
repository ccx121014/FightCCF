import { memo } from 'react';

interface Props {
  current: number;
  max: number;
  label?: string;
}

function HealthBarComp({ current, max, label }: Props) {
  const ratio = Math.max(0, current / max);
  let color = '#4ade80';
  if (ratio <= 0.3) color = '#f43f5e';
  else if (ratio <= 0.6) color = '#fbbf24';

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, color: '#cbd5e1', fontWeight: 700 }}>
          <span>{label}</span>
          <span>{Math.ceil(current)} / {max}</span>
        </div>
      )}
      <div style={{ height: 16, background: 'rgba(0,0,0,0.5)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div
          style={{
            height: '100%',
            width: `${ratio * 100}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 12px ${color}99`,
            transition: 'width 0.15s ease',
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  );
}

export const HealthBar = memo(HealthBarComp);
