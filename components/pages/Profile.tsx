import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useLevelStore } from '@/stores/levelStore';
import { getCharacter } from '@/data/characters';
import { getRankByRating } from '@shared/constants';
import { StickAvatar } from '@/components/StickAvatar';

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const owned = useCharacterStore((s) => s.owned);
  const totalStars = useLevelStore((s) => s.totalStars());

  if (!user) return null;
  const selected = getCharacter(selectedId);
  const rank = getRankByRating(user.pvpRating);
  const winRate = user.stats.totalBattles > 0 ? Math.round((user.stats.wins / user.stats.totalBattles) * 100) : 0;

  const stats = [
    { label: '等级', value: user.level, color: '#fbbf24' },
    { label: '拥有角色', value: owned.length, color: '#a855f7' },
    { label: '收集星星', value: totalStars, color: '#f59e0b' },
    { label: '总场次', value: user.stats.totalBattles, color: '#38bdf8' },
    { label: '胜场', value: user.stats.wins, color: '#4ade80' },
    { label: '胜率', value: `${winRate}%`, color: '#f43f5e' },
    { label: '最高连击', value: user.stats.highestCombo, color: '#2dd4bf' },
    { label: '总伤害', value: user.stats.totalDamage.toLocaleString(), color: '#f97316' },
  ];

  return (
    <div className="page">
      {/* 资料卡 */}
      <div
        className="card"
        style={{ padding: 22, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(120deg, rgba(245,158,11,0.12), transparent 60%), linear-gradient(180deg, var(--bg-2), var(--bg-1))' }}
      >
        <StickAvatar color={selected?.avatarColor ?? '#f59e0b'} element={selected?.element ?? 'fire'} size={80} pose="victory" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{user.username}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="chip" style={{ color: 'var(--gold)' }}>Lv.{user.level}</span>
            <span className="chip" style={{ color: rank.color }}>{rank.name} · {user.pvpRating}</span>
          </div>
        </div>
      </div>

      {/* 经验条 */}
      <div className="panel" style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-dim)', fontWeight: 700 }}>经验</span>
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{user.exp} / {100 + (user.level - 1) * 80}</span>
        </div>
        <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (user.exp / (100 + (user.level - 1) * 80)) * 100)}%`, background: 'var(--accent-grad)' }} />
        </div>
      </div>

      {/* 统计 */}
      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>战斗数据</h3>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 22 }}>
        {stats.map((s) => (
          <div key={s.label} className="panel" style={{ padding: '12px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 入口 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/achievements')}>🎯 成就系统</button>
        <button className="btn btn-ghost" onClick={() => navigate('/leaderboard')}>📊 排行榜</button>
        <button className="btn btn-ghost" onClick={() => navigate('/collection')}>📖 角色图鉴</button>
        <button
          className="btn btn-ghost"
          style={{ color: 'var(--danger)', borderColor: 'rgba(244,63,94,0.4)' }}
          onClick={() => { logout(); navigate('/login'); }}
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
