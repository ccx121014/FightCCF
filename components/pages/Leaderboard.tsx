import { useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useLevelStore } from '@/stores/levelStore';
import { getRankByRating } from '@shared/constants';
import { getCharacter, CHARACTERS } from '@/data/characters';
import { StickAvatar } from '@/components/StickAvatar';

type Board = 'rating' | 'stars' | 'level';

interface Entry {
  id: string;
  name: string;
  characterId: string;
  rating: number;
  stars: number;
  level: number;
  isMe?: boolean;
}

const AI_NAMES = [
  'AlgoMaster', '常数优化大师', 'DP_God', '打表选手', '暴力出奇迹', '卡常怪物',
  'OI退役老兵', 'ACMer_Pro', '线段树杀手', '树上跑图', '贪心不亏', '二分永远滴神',
  '后缀自动机', 'KMP战神', '并查集之光', 'FFT狂魔', '最短路王者', '状压DP',
];

// 生成一批稳定的 AI 榜单（同一会话内不变）
function makeAIEntries(): Entry[] {
  // 使用固定种子式伪随机，保证渲染稳定
  let seed = 20260812;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const charIds = CHARACTERS.map((c) => c.id);
  return AI_NAMES.map((name, i) => {
    const base = 8200 - i * 260 - Math.floor(rand() * 120);
    return {
      id: `ai_${i}`,
      name,
      characterId: charIds[Math.floor(rand() * charIds.length)],
      rating: Math.max(200, base),
      stars: Math.max(0, 90 - i * 4 - Math.floor(rand() * 6)),
      level: Math.max(1, 55 - i * 2 - Math.floor(rand() * 4)),
    };
  });
}

const TABS: { id: Board; name: string; icon: string }[] = [
  { id: 'rating', name: '段位分', icon: '🏆' },
  { id: 'stars', name: '星星数', icon: '⭐' },
  { id: 'level', name: '等级', icon: '📈' },
];

export default function Leaderboard() {
  const user = useAuthStore((s) => s.user);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const totalStars = useLevelStore((s) => s.totalStars());
  const [tab, setTab] = useState<Board>('rating');

  const ranked = useMemo(() => {
    const ai = makeAIEntries();
    const me: Entry = {
      id: 'me',
      name: user?.username ?? '你',
      characterId: selectedId,
      rating: user?.pvpRating ?? 1200,
      stars: totalStars,
      level: user?.level ?? 1,
      isMe: true,
    };
    const all = [...ai, me];
    const key: keyof Entry = tab;
    return [...all].sort((a, b) => (b[key] as number) - (a[key] as number));
  }, [user, selectedId, totalStars, tab]);

  const myRank = ranked.findIndex((e) => e.isMe) + 1;

  function valueOf(e: Entry): string {
    if (tab === 'rating') return `${e.rating} 分`;
    if (tab === 'stars') return `⭐ ${e.stars}`;
    return `Lv.${e.level}`;
  }

  return (
    <div className="page">
      <h1 className="page-title">排行榜</h1>
      <p className="page-sub">与全服算法战士一较高下</p>

      {/* 我的排名卡 */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'linear-gradient(120deg, rgba(245,158,11,0.14), transparent 60%), linear-gradient(180deg, var(--bg-2), var(--bg-1))',
          borderColor: 'var(--accent)',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', minWidth: 46, textAlign: 'center' }}>
          #{myRank}
        </div>
        <StickAvatar color={getCharacter(selectedId)?.avatarColor ?? '#fff'} element={getCharacter(selectedId)?.element ?? 'fire'} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>{user?.username ?? '你'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {getRankByRating(user?.pvpRating ?? 0).name} · 我的排名
          </div>
        </div>
      </div>

      {/* 榜单切换 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              background: tab === t.id ? 'var(--accent)' : 'var(--bg-2)',
              color: tab === t.id ? '#0b0f1a' : 'var(--text-dim)',
              border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      {/* 榜单列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ranked.slice(0, 30).map((e, i) => {
          const c = getCharacter(e.characterId);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
          const rankColor = getRankByRating(e.rating).color;
          return (
            <div
              key={e.id}
              className="panel"
              style={{
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderColor: e.isMe ? 'var(--accent)' : 'var(--border)',
                background: e.isMe ? 'rgba(245,158,11,0.1)' : undefined,
              }}
            >
              <div style={{ width: 34, textAlign: 'center', fontSize: medal ? 22 : 15, fontWeight: 900, color: i < 3 ? 'var(--gold)' : 'var(--text-dim)' }}>
                {medal ?? i + 1}
              </div>
              <StickAvatar color={c?.avatarColor ?? '#fff'} element={c?.element ?? 'fire'} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.name} {e.isMe && <span style={{ fontSize: 11, color: 'var(--accent)' }}>(我)</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{c?.name}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 13, color: tab === 'rating' ? rankColor : 'var(--text)' }}>
                {valueOf(e)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
