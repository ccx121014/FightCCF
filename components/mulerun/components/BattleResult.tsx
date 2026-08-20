import { memo } from 'react';
import type { BattleRating } from '@shared/types';
import { StickAvatar } from './StickAvatar';
import type { ElementType } from '@shared/constants';

interface Props {
  victory: boolean;
  rating: BattleRating;
  timeUsed: number;
  maxCombo: number;
  totalDamage: number;
  rewards: { gold: number; exp: number };
  playerColor: string;
  playerElement: ElementType;
  isNewRecord?: boolean;
  hpRatio?: number;
  scoreBreakdown?: { time: number; hp: number; combo: number; total: number };
  onRetry: () => void;
  onNext?: () => void;
  onExit: () => void;
}

const RATING_COLOR: Record<BattleRating, string> = {
  S: '#fbbf24',
  A: '#a855f7',
  B: '#38bdf8',
  C: '#94a3b8',
};

function BattleResultComp(props: Props) {
  const { victory, rating, timeUsed, maxCombo, totalDamage, rewards, playerColor, playerElement, hpRatio, scoreBreakdown } = props;
  const ratingColor = RATING_COLOR[rating];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,10,18,0.9)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.3s ease',
        padding: 20,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: 28, textAlign: 'center', animation: 'pop 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <StickAvatar color={playerColor} element={playerElement} size={80} pose={victory ? 'victory' : 'idle'} />
        </div>

        <h2 style={{ fontSize: 30, fontWeight: 900, color: victory ? '#4ade80' : '#f43f5e', textShadow: `0 0 20px ${victory ? '#4ade80' : '#f43f5e'}66` }}>
          {victory ? '胜利!' : '失败'}
        </h2>

        {victory && (
          <div style={{ margin: '14px 0' }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: ratingColor, lineHeight: 1, textShadow: `0 0 30px ${ratingColor}88`, animation: 'pop 0.5s 0.2s both' }}>
              {rating}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              评级{scoreBreakdown ? ` · 综合 ${scoreBreakdown.total} 分` : ''}
            </div>
          </div>
        )}

        {/* 评分构成：让「为什么是这个评级」一目了然 */}
        {victory && scoreBreakdown && (
          <div className="panel" style={{ padding: '10px 12px', marginBottom: 6 }}>
            <ScoreRow label="速度" value={scoreBreakdown.time} max={40} color="#38bdf8" />
            <ScoreRow label="残血" value={scoreBreakdown.hp} max={40} color="#4ade80" hint={hpRatio !== undefined ? `${Math.round(hpRatio * 100)}%` : undefined} />
            <ScoreRow label="连击" value={scoreBreakdown.combo} max={20} color="#fbbf24" />
          </div>
        )}

        {props.isNewRecord && victory && (
          <div className="chip" style={{ color: '#fbbf24', margin: '0 auto 14px' }}>🎉 新纪录!</div>
        )}

        {/* 战斗统计 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, margin: '14px 0' }}>
          <ResultStat label="用时" value={`${timeUsed.toFixed(1)}s`} />
          <ResultStat label="最高连击" value={`${maxCombo}`} />
          <ResultStat label="总伤害" value={`${totalDamage}`} />
        </div>

        {/* 奖励 */}
        {victory && rating !== 'C' && (
          <div className="panel" style={{ padding: 12, marginBottom: 18, display: 'flex', justifyContent: 'center', gap: 18 }}>
            <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 15 }}>🪙 +{rewards.gold}</span>
            <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 15 }}>✦ +{rewards.exp} EXP</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={props.onExit}>
            退出
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={props.onRetry}>
            重试
          </button>
          {victory && props.onNext && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={props.onNext}>
              下一关
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max, color, hint }: { label: string; value: number; max: number; color: string; hint?: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '3px 0' }}>
      <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 30, textAlign: 'left', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', width: 52, textAlign: 'right', flexShrink: 0 }}>
        {value}/{max}{hint ? ` ${hint}` : ''}
      </span>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ padding: '10px 4px' }}>
      <div style={{ fontSize: 17, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export const BattleResult = memo(BattleResultComp);
