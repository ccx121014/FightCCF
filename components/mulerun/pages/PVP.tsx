import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCharacterStore } from '@/stores/characterStore';
import { getCharacter, CHARACTERS } from '@/data/characters';
import { getRankByRating, RANK_ORDER, RANKS, RANK_RULES } from '@shared/constants';
import type { PVPMode } from '@shared/types';
import { StickAvatar } from '@/components/StickAvatar';
import { PVPService } from '@/services/pvpService';
import { isOfflineMode } from '@/services/api';
import { PvpArena } from '@/components/mulerun/PvpArena';

type Phase = 'lobby' | 'queue' | 'matched' | 'battle' | 'result';

interface OpponentInfo {
  name: string;
  rating: number;
  characterId: string;
}

export default function PVP() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addCurrency = useAuthStore((s) => s.addCurrency);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const selected = getCharacter(selectedId);

  const [phase, setPhase] = useState<Phase>('lobby');
  const [mode, setMode] = useState<PVPMode>('ranked');
  const [queueTime, setQueueTime] = useState(0);
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [matchResult, setMatchResult] = useState<{ win: boolean; ratingChange: number } | null>(null);
  const [rating, setRating] = useState(user?.pvpRating ?? 1200);
  const [battleHp, setBattleHp] = useState({ mine: 100, opponent: 100 });
  const [battleTime, setBattleTime] = useState(90);
  const [battleCombo, setBattleCombo] = useState(0);

  const serviceRef = useRef<PVPService | null>(null);
  const queueTimerRef = useRef<number>(0);
  const matchTimerRef = useRef<number>(0);

  const rank = getRankByRating(rating);

  useEffect(() => {
    if (phase !== 'battle') return;
    const timer = window.setInterval(() => setBattleTime((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'battle' && battleTime === 0) finishBattle(false);
  }, [battleTime, phase]);

  useEffect(() => {
    return () => {
      clearInterval(queueTimerRef.current);
      clearTimeout(matchTimerRef.current);
      serviceRef.current?.disconnect();
    };
  }, []);

  function startQueue() {
    setPhase('queue');
    setQueueTime(0);
    queueTimerRef.current = window.setInterval(() => setQueueTime((t) => t + 1), 1000);

    // 在线模式：尝试真实 WebSocket 匹配
    if (!isOfflineMode && user) {
      const svc = new PVPService(useAuthStore.getState().token ?? '');
      serviceRef.current = svc;
      svc.connect()
        .then(() => {
          svc.joinQueue(user.id, user.username, rating, mode, selectedId);
        })
        .catch(() => {
          // 连接失败退回本地模拟
          simulateMatch();
        });
      svc.on((msg) => {
        if (msg.type === 'match_start') {
          const p = msg.payload as { opponent: OpponentInfo };
          onMatched(p.opponent);
        }
      });
      // 超时保护：3-5 秒无匹配则本地模拟
      matchTimerRef.current = window.setTimeout(simulateMatch, 4000);
    } else {
      // 离线：模拟匹配
      const delay = 1500 + Math.random() * 2000;
      matchTimerRef.current = window.setTimeout(simulateMatch, delay);
    }
  }

  function simulateMatch() {
    clearTimeout(matchTimerRef.current);
    // 生成一个 rating 相近的 AI 对手
    const range = rank.matchRange;
    const oppRating = Math.max(0, rating + Math.round((Math.random() - 0.5) * range * 2));
    const oppChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    const names = ['AlgoMaster', '常数优化', 'DP_God', '打表选手', '暴力出奇迹', '卡常怪', 'OI退役选手', 'ACMer'];
    onMatched({
      name: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 99),
      rating: oppRating,
      characterId: oppChar.id,
    });
  }

  function onMatched(opp: OpponentInfo) {
    clearInterval(queueTimerRef.current);
    setOpponent(opp);
    setPhase('matched');
  }

  function cancelQueue() {
    clearInterval(queueTimerRef.current);
    clearTimeout(matchTimerRef.current);
    serviceRef.current?.leaveQueue();
    serviceRef.current?.disconnect();
    serviceRef.current = null;
    setPhase('lobby');
  }

  function startBattle() {
    setBattleHp({ mine: 100, opponent: 100 });
    setBattleTime(90);
    setBattleCombo(0);
    setPhase('battle');
  }

  async function performAttack(style: 'combo' | 'skill') {
    if (!opponent || phase !== 'battle') return;
    const damage = style === 'skill' ? 18 + Math.floor(Math.random() * 10) : 8 + Math.floor(Math.random() * 7);
    const counter = 5 + Math.floor(Math.random() * 11);
    const nextOpponent = Math.max(0, battleHp.opponent - damage);
    const nextMine = Math.max(0, battleHp.mine - counter);
    const nextCombo = style === 'combo' ? battleCombo + 1 : 0;
    setBattleHp({ mine: nextMine, opponent: nextOpponent });
    setBattleCombo(nextCombo);
    if (nextOpponent === 0 || nextMine === 0) finishBattle(nextOpponent === 0);
  }

  async function finishBattle(win: boolean) {
    if (phase !== 'battle' || !opponent) return;
    const higher = opponent.rating > rating ? RANK_RULES.higherRankBonus : 0;
    const ratingChange = win ? RANK_RULES.winBase + higher : mode === 'ranked' ? RANK_RULES.loseBase : 0;
    if (mode === 'ranked') setRating((r) => Math.max(0, r + ratingChange));
    if (win) addCurrency({ honorPoints: 30, gold: 100 });
    const response = await fetch('/api/game/pvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ victory: win, mode, ratingChange, combo: battleCombo, score: Math.min(100, (win ? 55 : 20) + battleCombo * 4 + Math.round(battleTime / 6)) }) }).catch(() => null);
    if (response?.ok && mode === 'ranked') {
      const data = await response.json() as { ratingChange?: number };
      const serverRatingChange = data.ratingChange;
      if (typeof serverRatingChange === 'number') setRating((r) => Math.max(0, r - ratingChange + serverRatingChange));
    }
    setMatchResult({ win, ratingChange });
    setPhase('result');
  }

  return (
    <div className="page">
      <h1 className="page-title">竞技对战</h1>
      <p className="page-sub">与其他算法战士实时较量，冲击更高段位</p>

      {/* 段位卡 */}
      <div className="card" style={{ padding: 20, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16, background: `linear-gradient(120deg, ${rank.color}22, transparent 60%), linear-gradient(180deg, var(--bg-2), var(--bg-1))`, borderColor: rank.color }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${rank.color}, ${rank.color}66)`, fontSize: 30, boxShadow: `0 0 18px ${rank.color}66` }}>
          🏆
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: rank.color }}>{rank.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>段位分 {rating}</div>
        </div>
      </div>

      {phase === 'lobby' && (
        <>
          {/* 模式选择 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <ModeButton active={mode === 'ranked'} onClick={() => setMode('ranked')} title="排位赛" desc="影响段位分" icon="⚔️" />
            <ModeButton active={mode === 'casual'} onClick={() => setMode('casual')} title="休闲赛" desc="轻松对战" icon="🎮" />
          </div>

          {/* 出战角色 */}
          <div className="panel" style={{ padding: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <StickAvatar color={selected?.avatarColor ?? '#fff'} element={selected?.element ?? 'fire'} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>出战角色</div>
              <div style={{ fontWeight: 800 }}>{selected?.name}</div>
            </div>
            <button style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }} onClick={() => navigate('/characters')}>更换</button>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', height: 52, fontSize: 16 }} onClick={startQueue}>
            开始匹配
          </button>

          {/* 段位阶梯 */}
          <div style={{ marginTop: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: 'var(--text-dim)' }}>段位阶梯</h3>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {RANK_ORDER.map((t) => {
                const r = RANKS[t];
                const isCurrent = r.id === rank.id;
                return (
                  <div key={t} style={{ flexShrink: 0, textAlign: 'center', opacity: isCurrent ? 1 : 0.5 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: isCurrent ? r.color : 'var(--bg-3)', fontSize: 18, border: isCurrent ? `2px solid ${r.color}` : '1px solid var(--border)' }}>
                      🏅
                    </div>
                    <div style={{ fontSize: 10, marginTop: 3, color: isCurrent ? r.color : 'var(--text-mute)', fontWeight: 700 }}>{r.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {phase === 'queue' && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 18px' }} />
          <div style={{ fontSize: 18, fontWeight: 800 }}>正在匹配对手...</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>
            {mode === 'ranked' ? '排位赛' : '休闲赛'} · 已等待 {queueTime}s
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={cancelQueue}>取消匹配</button>
        </div>
      )}

      {phase === 'matched' && opponent && (
        <div className="card" style={{ padding: 24, animation: 'pop 0.4s ease' }}>
          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 16 }}>
            匹配成功!
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <FighterSide name={user?.username ?? '你'} rating={rating} charId={selectedId} />
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-2)' }}>VS</div>
            <FighterSide name={opponent.name} rating={opponent.rating} charId={opponent.characterId} mirror />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', height: 50, marginTop: 24, fontSize: 16 }} onClick={startBattle}>
            开战!
          </button>
        </div>
      )}

      {phase === 'battle' && opponent && (
        <PvpArena />
      )}
      {phase === 'result' && matchResult && (
        <div className="card" style={{ padding: 32, textAlign: 'center', animation: 'pop 0.4s ease' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{matchResult.win ? '🎉' : '💀'}</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: matchResult.win ? '#4ade80' : '#f43f5e' }}>
            {matchResult.win ? '胜利' : '失败'}
          </h2>
          {mode === 'ranked' && (
            <div style={{ fontSize: 16, marginTop: 10, fontWeight: 800, color: matchResult.ratingChange >= 0 ? '#4ade80' : '#f43f5e' }}>
              段位分 {matchResult.ratingChange >= 0 ? '+' : ''}{matchResult.ratingChange}
            </div>
          )}
          {matchResult.win && (
            <div style={{ fontSize: 13, color: 'var(--gold)', marginTop: 6 }}>🎖️ +30 荣誉 · 🪙 +100</div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setPhase('lobby'); setMatchResult(null); setOpponent(null); }}>
              返回
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setPhase('lobby'); setMatchResult(null); startQueue(); }}>
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BattleBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div style={{ margin: '10px 0' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}><span>{label}</span><span>{value}%</span></div><div style={{ height: 8, borderRadius: 99, background: 'var(--bg-3)', overflow: 'hidden', marginTop: 5 }}><div style={{ width: `${value}%`, height: '100%', background: color, transition: 'width .2s ease' }} /></div></div>;
}

function computePower(charId: string): number {
  const c = getCharacter(charId);
  if (!c) return 1000;
  const s = c.baseStats;
  return s.hp * 0.5 + s.attack * 3 + s.defense * 2 + s.speed + s.critRate * 500;
}

function ModeButton({ active, onClick, title, desc, icon }: { active: boolean; onClick: () => void; title: string; desc: string; icon: string }) {
  return (
    <button
      onClick={onClick}
      className="card"
      style={{ flex: 1, padding: 16, textAlign: 'center', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'rgba(245,158,11,0.1)' : undefined }}
    >
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4, color: active ? 'var(--accent)' : 'var(--text)' }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{desc}</div>
    </button>
  );
}

function FighterSide({ name, rating, charId, mirror }: { name: string; rating: number; charId: string; mirror?: boolean }) {
  const c = getCharacter(charId);
  return (
    <div style={{ textAlign: 'center', transform: mirror ? 'scaleX(-1)' : undefined }}>
      <div style={{ transform: mirror ? 'scaleX(-1)' : undefined }}>
        <StickAvatar color={c?.avatarColor ?? '#fff'} element={c?.element ?? 'fire'} size={64} pose="attack" />
        <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4, maxWidth: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{rating} 分</div>
      </div>
    </div>
  );
}
