import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useLevelStore } from '@/stores/levelStore';
import { useAchievementStore } from '@/stores/achievementStore';
import { ACHIEVEMENTS, computeAchievementProgress } from '@/data/achievements';
import type { Achievement, AchievementCategory, Reward } from '@shared/types';

const CATEGORIES: { id: AchievementCategory | 'all'; name: string; icon: string }[] = [
  { id: 'all', name: '全部', icon: '🎯' },
  { id: 'battle', name: '战斗', icon: '⚔️' },
  { id: 'collection', name: '收集', icon: '📖' },
  { id: 'progression', name: '进度', icon: '📈' },
  { id: 'special', name: '特殊', icon: '✨' },
];

function rewardLabel(reward: Reward): string {
  const parts: string[] = [];
  if (reward.gold) parts.push(`🪙 ${reward.gold}`);
  if (reward.diamond) parts.push(`💎 ${reward.diamond}`);
  if (reward.honorPoints) parts.push(`🎖️ ${reward.honorPoints}`);
  if (reward.exp) parts.push(`✨ ${reward.exp} 经验`);
  return parts.join(' · ');
}

export default function Achievements() {
  const user = useAuthStore((s) => s.user);
  const addCurrency = useAuthStore((s) => s.addCurrency);
  const addExp = useAuthStore((s) => s.addExp);
  const owned = useCharacterStore((s) => s.owned);
  const totalStars = useLevelStore((s) => s.totalStars());
  const claimed = useAchievementStore((s) => s.claimed);
  const claim = useAchievementStore((s) => s.claim);

  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const progressInput = {
    totalBattles: user?.stats.totalBattles ?? 0,
    wins: user?.stats.wins ?? 0,
    highestCombo: user?.stats.highestCombo ?? 0,
    totalDamage: user?.stats.totalDamage ?? 0,
    ownedCount: owned.length,
    totalStars,
    level: user?.level ?? 1,
    pvpRating: user?.pvpRating ?? 0,
    gold: user?.currency.gold ?? 0,
  };

  const withProgress = ACHIEVEMENTS.map((a) => {
    const progress = computeAchievementProgress(a.id, progressInput);
    const completed = progress >= a.target;
    return { ach: a, progress, completed, claimed: !!claimed[a.id] };
  });

  const completedCount = withProgress.filter((w) => w.completed).length;
  const shown = filter === 'all' ? withProgress : withProgress.filter((w) => w.ach.category === filter);

  function handleClaim(a: Achievement) {
    if (claimed[a.id]) return;
    claim(a.id);
    const { gold, diamond, honorPoints, exp } = a.reward;
    if (gold || diamond || honorPoints) addCurrency({ gold, diamond, honorPoints });
    if (exp) addExp(exp);
    setToast(`领取成功：${rewardLabel(a.reward)}`);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="page">
      <h1 className="page-title">成就系统</h1>
      <p className="page-sub">
        已完成 {completedCount} / {ACHIEVEMENTS.length} 项成就
      </p>

      {/* 总进度条 */}
      <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
        <div
          style={{
            height: '100%',
            width: `${(completedCount / ACHIEVEMENTS.length) * 100}%`,
            background: 'var(--accent-grad)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* 分类筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              background: filter === c.id ? 'var(--accent)' : 'var(--bg-2)',
              color: filter === c.id ? '#0b0f1a' : 'var(--text-dim)',
              border: `1px solid ${filter === c.id ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* 成就列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(({ ach, progress, completed, claimed: isClaimed }) => {
          const pct = Math.min(100, (progress / ach.target) * 100);
          return (
            <div
              key={ach.id}
              className="card"
              style={{
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: completed ? 1 : 0.85,
                borderColor: completed ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24,
                  background: completed ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'var(--bg-3)',
                  filter: completed ? 'none' : 'grayscale(0.6)',
                }}
              >
                {ach.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{ach.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 1 }}>{ach.description}</div>
                <div style={{ height: 5, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: completed ? '#4ade80' : 'var(--accent)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>
                    {Math.min(progress, ach.target).toLocaleString()} / {ach.target.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--gold)' }}>{rewardLabel(ach.reward)}</span>
                </div>
              </div>
              <button
                className={completed && !isClaimed ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ flexShrink: 0, height: 34, fontSize: 12, minWidth: 62 }}
                disabled={!completed || isClaimed}
                onClick={() => handleClaim(ach)}
              >
                {isClaimed ? '已领取' : completed ? '领取' : '未完成'}
              </button>
            </div>
          );
        })}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            padding: '10px 20px',
            borderRadius: 999,
            background: 'var(--bg-elev)',
            border: '1px solid var(--accent)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: 'var(--shadow)',
            animation: 'fadeInUp 0.25s ease',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
