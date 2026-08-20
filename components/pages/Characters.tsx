import { useState } from 'react';
import { CHARACTERS } from '@/data/characters';
import { useCharacterStore } from '@/stores/characterStore';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterDetail } from '@/components/CharacterDetail';
import type { Character } from '@shared/types';

export default function Characters() {
  const owned = useCharacterStore((s) => s.owned);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const select = useCharacterStore((s) => s.select);

  const [detail, setDetail] = useState<Character | null>(null);

  const ownedIds = new Set(owned.map((c) => c.characterId));
  const ownedChars = CHARACTERS.filter((c) => ownedIds.has(c.id));

  return (
    <div className="page">
      <h1 className="page-title">我的角色</h1>
      <p className="page-sub">共拥有 {ownedChars.length} 名算法战士 · 点击查看详情或出战</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))' }}>
        {ownedChars.map((c) => {
          const rec = owned.find((o) => o.characterId === c.id);
          return (
            <CharacterCard
              key={c.id}
              character={c}
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
          onSelect={() => {
            select(detail.id);
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
