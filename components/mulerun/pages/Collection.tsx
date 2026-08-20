import { useState } from 'react';
import { CHARACTERS } from '@/data/characters';
import { useCharacterStore } from '@/stores/characterStore';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterDetail } from '@/components/CharacterDetail';
import { RARITY_ORDER, RARITIES, type RarityType } from '@shared/constants';
import type { Character } from '@shared/types';

export default function Collection() {
  const owned = useCharacterStore((s) => s.owned);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const select = useCharacterStore((s) => s.select);
  const [detail, setDetail] = useState<Character | null>(null);
  const [filter, setFilter] = useState<RarityType | 'all'>('all');

  const ownedIds = new Set(owned.map((c) => c.characterId));
  const shown = filter === 'all' ? CHARACTERS : CHARACTERS.filter((c) => c.rarity === filter);
  const collectRate = Math.round((ownedIds.size / CHARACTERS.length) * 100);

  return (
    <div className="page">
      <h1 className="page-title">角色图鉴</h1>
      <p className="page-sub">
        已收集 {ownedIds.size} / {CHARACTERS.length} · 完成度 {collectRate}%
      </p>

      {/* 收集进度 */}
      <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${collectRate}%`, background: 'var(--accent-grad)', transition: 'width 0.3s ease' }} />
      </div>

      {/* 稀有度筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <FilterChip label="全部" active={filter === 'all'} onClick={() => setFilter('all')} color="#e8ecf5" />
        {RARITY_ORDER.map((r) => (
          <FilterChip key={r} label={RARITIES[r].name} active={filter === r} onClick={() => setFilter(r)} color={RARITIES[r].color} />
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))' }}>
        {shown.map((c) => {
          const rec = owned.find((o) => o.characterId === c.id);
          const isOwned = ownedIds.has(c.id);
          return (
            <CharacterCard
              key={c.id}
              character={c}
              owned={isOwned}
              locked={!isOwned}
              stars={rec?.stars}
              selected={c.id === selectedId}
              onClick={() => setDetail(c)}
            />
          );
        })}
      </div>

      {detail && (
        <CharacterDetail
          character={detail}
          owned={ownedIds.has(detail.id)}
          isSelected={detail.id === selectedId}
          userChar={owned.find((o) => o.characterId === detail.id)}
          onSelect={() => { select(detail.id); setDetail(null); }}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        background: active ? color : 'var(--bg-2)',
        color: active ? '#0b0f1a' : 'var(--text-dim)',
        border: `1px solid ${active ? color : 'var(--border)'}`,
      }}
    >
      {label}
    </button>
  );
}
