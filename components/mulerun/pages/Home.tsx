import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useLevelStore } from '@/stores/levelStore';
import { getCharacter } from '@/data/characters';
import { getRankByRating } from '@shared/constants';
import { StickAvatar } from '@/components/StickAvatar';

const QUICK_ENTRIES = [
  { path: '/levels', title: '闯关冒险', desc: '6 大章节 · 35 关', icon: '⚔️', color: '#f59e0b' },
  { path: '/gacha', title: '角色召唤', desc: '抽取传说算法', icon: '🎴', color: '#a855f7' },
  { path: '/pvp', title: '实时对战', desc: '排位与休闲', icon: '🏆', color: '#f43f5e' },
  { path: '/shop', title: '商店', desc: '道具与资源', icon: '🛒', color: '#4ade80' },
  { path: '/collection', title: '图鉴', desc: '角色收藏', icon: '📖', color: '#38bdf8' },
  { path: '/achievements', title: '成就', desc: '战绩里程碑', icon: '🎯', color: '#fbbf24' },
];

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const owned = useCharacterStore((s) => s.owned);
  const totalStars = useLevelStore((s) => s.totalStars());

  const selected = getCharacter(selectedId);
  const rank = getRankByRating(user?.pvpRating ?? 0);
  const winRate =
    user && user.stats.totalBattles > 0
      ? Math.round((user.stats.wins / user.stats.totalBattles) * 100)
      : 0;

  return (
    <div className="page">
      {/* 英雄横幅 */}
      <div
        className="card anim-in"
        style={{
          padding: 22,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background:
            'linear-gradient(120deg, rgba(245,158,11,0.14), rgba(244,63,94,0.12)), linear-gradient(180deg, var(--bg-2), var(--bg-1))',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ animation: 'float 3s ease-in-out infinite' }}>
          <StickAvatar
            color={selected?.avatarColor ?? '#f59e0b'}
            element={selected?.element ?? 'fire'}
            size={92}
            pose="victory"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>欢迎回来</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{user?.username}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="chip" style={{ color: 'var(--gold)' }}>Lv.{user?.level}</span>
            <span className="chip" style={{ color: rank.color }}>{rank.name}</span>
            <span className="chip" style={{ color: 'var(--accent)' }}>⭐ {totalStars}</span>
          </div>
        </div>
      </div>

      {/* 出战角色 */}
      <div className="panel anim-in" style={{ padding: 16, marginBottom: 18, animationDelay: '0.05s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 700 }}>当前出战</span>
          <button onClick={() => navigate('/characters')} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
            更换 →
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StickAvatar color={selected?.avatarColor ?? '#fff'} element={selected?.element ?? 'fire'} size={48} pose="idle" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{selected?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{selected?.title}</div>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid anim-in" style={{ gridTemplateColumns: 'repeat(3, 1fr)', animationDelay: '0.1s' }}>
        {QUICK_ENTRIES.map((e) => (
          <button
            key={e.path}
            onClick={() => navigate(e.path)}
            className="card"
            style={{ padding: '18px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'transform 0.15s ease, border-color 0.2s' }}
            onMouseDown={(ev) => (ev.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(ev) => (ev.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(ev) => (ev.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: 30, filter: `drop-shadow(0 0 10px ${e.color}88)` }}>{e.icon}</span>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{e.title}</span>
            <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{e.desc}</span>
          </button>
        ))}
      </div>

      {/* 战绩概览 */}
      <div className="grid anim-in" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 18, animationDelay: '0.15s' }}>
        <StatCard label="拥有角色" value={owned.length} suffix="名" color="#a855f7" />
        <StatCard label="总胜场" value={user?.stats.wins ?? 0} suffix="胜" color="#4ade80" />
        <StatCard label="胜率" value={winRate} suffix="%" color="#f59e0b" />
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: string }) {
  return (
    <div className="panel" style={{ padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>
        {value}
        <span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 2 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
