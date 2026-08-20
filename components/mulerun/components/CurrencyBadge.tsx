import { memo } from 'react';

interface Props {
  type: 'gold' | 'diamond' | 'honor';
  value: number;
}

const CONFIG = {
  gold: { icon: '🪙', color: '#fbbf24' },
  diamond: { icon: '💎', color: '#38bdf8' },
  honor: { icon: '🎖️', color: '#a855f7' },
};

function format(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function CurrencyBadgeComp({ type, value }: Props) {
  const cfg = CONFIG[type];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        fontSize: 13,
        fontWeight: 800,
        color: cfg.color,
      }}
    >
      <span style={{ fontSize: 13 }}>{cfg.icon}</span>
      {format(value)}
    </div>
  );
}

export const CurrencyBadge = memo(CurrencyBadgeComp);
