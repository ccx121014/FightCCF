import { useState } from 'react';
import { GACHA_POOLS } from '@/data/gacha';
import { getCharacter } from '@/data/characters';
import { useGachaStore } from '@/stores/gachaStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useAuthStore } from '@/stores/authStore';
import { RARITIES, GACHA_CONFIG } from '@shared/constants';
import { StickAvatar } from '@/components/StickAvatar';
import type { GachaRecord } from '@shared/types';

export default function Gacha() {
  const [activePool, setActivePool] = useState(GACHA_POOLS[0].id);
  const [results, setResults] = useState<GachaRecord[] | null>(null);
  const [revealing, setRevealing] = useState(false);

  const pull = useGachaStore((s) => s.pull);
  const getPity = useGachaStore((s) => s.getPity);
  const owned = useCharacterStore((s) => s.owned);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const user = useAuthStore((s) => s.user);
  const spend = useAuthStore((s) => s.spendCurrency);

  const pool = GACHA_POOLS.find((p) => p.id === activePool)!;
  const pity = getPity(activePool);

  function doPull(count: 1 | 10) {
    const cost = count === 1 ? pool.singleCost : pool.tenCost;
    const isSkin = pool.type === 'skin';
    const canPay = isSkin
      ? spend({ honorPoints: cost })
      : spend({ diamond: cost });
    if (!canPay) {
      alert(isSkin ? '荣誉点数不足' : '钻石不足');
      return;
    }

    const ownedIds = owned.map((c) => c.characterId);
    const records = pull(activePool, count, ownedIds);
    // 入库
    records.forEach((r) => addCharacter(r.characterId));

    setRevealing(true);
    setResults(records);
    setTimeout(() => setRevealing(false), 600);
  }

  const currencyLabel = pool.type === 'skin' ? '荣誉' : '钻石';
  const currencyValue = pool.type === 'skin' ? user?.currency.honorPoints ?? 0 : user?.currency.diamond ?? 0;

  return (
    <div className="page">
      <h1 className="page-title">角色召唤</h1>
      <p className="page-sub">召唤强大的算法战士加入你的队伍</p>

      {/* 卡池切换 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {GACHA_POOLS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePool(p.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              fontWeight: 700,
              fontSize: 13,
              background: activePool === p.id ? p.bannerColor : 'var(--bg-2)',
              color: activePool === p.id ? '#0b0f1a' : 'var(--text-dim)',
              border: `1px solid ${activePool === p.id ? p.bannerColor : 'var(--border)'}`,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 卡池横幅 */}
      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 16,
          textAlign: 'center',
          background: `radial-gradient(circle at 50% 0%, ${pool.bannerColor}33, transparent 70%), linear-gradient(180deg, var(--bg-2), var(--bg-1))`,
          borderColor: pool.bannerColor,
        }}
      >
        {pool.featuredCharacterIds[0] ? (
          <div style={{ animation: 'float 3s ease-in-out infinite' }}>
            <StickAvatar
              color={getCharacter(pool.featuredCharacterIds[0])?.avatarColor ?? pool.bannerColor}
              element={getCharacter(pool.featuredCharacterIds[0])?.element ?? 'dark'}
              size={110}
              pose="victory"
            />
          </div>
        ) : (
          <div style={{ fontSize: 60 }}>🎴</div>
        )}
        <h2 style={{ fontSize: 20, fontWeight: 900, marginTop: 8, color: pool.bannerColor }}>{pool.name}</h2>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.5 }}>{pool.description}</p>
      </div>

      {/* 保底进度 */}
      <div className="panel" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-dim)', fontWeight: 700 }}>距离五星保底</span>
          <span style={{ color: '#fbbf24', fontWeight: 800 }}>
            {GACHA_CONFIG.legendaryPity - pity.sinceLegendary} 抽
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(pity.sinceLegendary / GACHA_CONFIG.legendaryPity) * 100}%`,
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 6 }}>
          {pity.sinceLegendary >= GACHA_CONFIG.softPityStart ? '⚡ 已进入软保底，五星概率大幅提升!' : `累计召唤 ${pity.totalPulls} 次`}
        </div>
      </div>

      {/* 召唤按钮 */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-ghost" style={{ flex: 1, height: 54, flexDirection: 'column', gap: 2 }} onClick={() => doPull(1)}>
          <span style={{ fontSize: 15 }}>单次召唤</span>
          <span style={{ fontSize: 11, color: pool.bannerColor }}>💎 {pool.singleCost} {currencyLabel}</span>
        </button>
        <button className="btn btn-primary" style={{ flex: 1.2, height: 54, flexDirection: 'column', gap: 2 }} onClick={() => doPull(10)}>
          <span style={{ fontSize: 15 }}>十连召唤</span>
          <span style={{ fontSize: 11 }}>💎 {pool.tenCost} {currencyLabel}</span>
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--text-dim)' }}>
        当前 {currencyLabel}：<span style={{ color: pool.bannerColor, fontWeight: 800 }}>{currencyValue}</span>
      </div>

      {/* 结果弹层 */}
      {results && (
        <GachaResultModal records={results} revealing={revealing} onClose={() => setResults(null)} />
      )}
    </div>
  );
}

function GachaResultModal({ records, revealing, onClose }: { records: GachaRecord[]; revealing: boolean; onClose: () => void }) {
  const best = records.reduce((acc, r) => {
    const order = { normal: 0, rare: 1, epic: 2, legendary: 3 };
    return order[r.rarity] > order[acc.rarity] ? r : acc;
  }, records[0]);
  const bestColor = RARITIES[best.rarity].color;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: `radial-gradient(circle at 50% 40%, ${bestColor}22, rgba(7,10,18,0.94))`,
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: records.length > 1 ? 'repeat(5, 1fr)' : '1fr',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {records.map((r, i) => {
            const char = getCharacter(r.characterId);
            const rarity = RARITIES[r.rarity];
            return (
              <div
                key={r.id}
                className="card"
                style={{
                  padding: '10px 4px',
                  animation: `pop 0.4s ${revealing ? i * 0.06 : 0}s both`,
                  borderColor: rarity.color,
                  boxShadow: r.rarity === 'legendary' ? `0 0 20px ${rarity.glow}` : undefined,
                  position: 'relative',
                }}
              >
                {r.isNew && (
                  <span style={{ position: 'absolute', top: 2, left: 2, fontSize: 8, fontWeight: 900, background: '#f43f5e', color: '#fff', padding: '1px 4px', borderRadius: 4, zIndex: 2 }}>
                    NEW
                  </span>
                )}
                <StickAvatar color={char?.avatarColor ?? '#fff'} element={char?.element ?? 'fire'} size={records.length > 1 ? 40 : 90} pose="idle" />
                <div style={{ fontSize: records.length > 1 ? 9 : 14, fontWeight: 700, color: rarity.color, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {char?.name}
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn btn-primary" style={{ minWidth: 160 }} onClick={onClose}>
          确定
        </button>
      </div>
    </div>
  );
}
