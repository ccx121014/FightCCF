import { memo } from 'react';

interface Props {
  combo: number;
  windowRatio: number;
}

function ComboDisplayComp({ combo, windowRatio }: Props) {
  if (combo < 2) return null;

  let tier = '#e8ecf5';
  if (combo >= 10) tier = '#f43f5e';
  else if (combo >= 6) tier = '#f59e0b';
  else if (combo >= 3) tier = '#fbbf24';

  const scale = 1 + Math.min(combo, 20) * 0.02;

  return (
    <div
      style={{
        position: 'absolute',
        top: '22%',
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        textAlign: 'center',
        pointerEvents: 'none',
        transition: 'transform 0.1s ease',
      }}
    >
      <div style={{ fontSize: 46, fontWeight: 900, color: tier, textShadow: `0 0 20px ${tier}, 0 2px 4px rgba(0,0,0,0.8)`, lineHeight: 1 }}>
        {combo}
        <span style={{ fontSize: 20, marginLeft: 4 }}>COMBO</span>
      </div>
      {combo >= 10 && (
        <div style={{ fontSize: 13, color: '#f43f5e', fontWeight: 800, marginTop: 2, textShadow: '0 0 8px #f43f5e' }}>
          必暴击!
        </div>
      )}
      <div style={{ width: 90, height: 4, margin: '6px auto 0', background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${windowRatio * 100}%`, background: tier, transition: 'width 0.05s linear' }} />
      </div>
    </div>
  );
}

export const ComboDisplay = memo(ComboDisplayComp);
