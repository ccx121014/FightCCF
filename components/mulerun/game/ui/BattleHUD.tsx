import { memo } from 'react';
import { HealthBar } from './HealthBar';
import { EnergyBar } from './EnergyBar';
import { SkillBar, type SkillSlot } from './SkillBar';
import { ComboDisplay } from './ComboDisplay';

export interface HUDState {
  playerName: string;
  playerHp: number;
  playerMaxHp: number;
  energy: number;
  maxEnergy: number;
  combo: number;
  comboWindow: number;
  timeRemaining: number;
  skills: SkillSlot[];
}

interface Props {
  state: HUDState;
  onSkillTap?: (index: number) => void;
  onBasicTap?: () => void;
}

function BattleHUDComp({ state, onSkillTap, onBasicTap }: Props) {
  const lowTime = state.timeRemaining <= 10;
  return (
    <>
      {/* 顶部：计时器 */}
      <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: lowTime ? '#f43f5e' : '#fff',
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
            animation: lowTime ? 'pulse 0.6s infinite' : undefined,
          }}
        >
          {Math.ceil(state.timeRemaining)}
        </div>
      </div>

      {/* 连击 */}
      <ComboDisplay combo={state.combo} windowRatio={state.comboWindow} />

      {/* 底部：玩家状态与技能 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '14px 16px calc(14px + env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, rgba(7,10,18,0.92), rgba(7,10,18,0))',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ maxWidth: 340, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <HealthBar current={state.playerHp} max={state.playerMaxHp} label={state.playerName} />
          <EnergyBar current={state.energy} max={state.maxEnergy} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={onBasicTap}
            style={{
              width: 58,
              height: 58,
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.5)',
              background: 'linear-gradient(160deg, rgba(255,255,255,0.2), rgba(0,0,0,0.4))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>I</span>
            <span style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 700 }}>攻击</span>
          </button>
          <SkillBar slots={state.skills} energy={state.energy} onTap={onSkillTap} />
        </div>
      </div>
    </>
  );
}

export const BattleHUD = memo(BattleHUDComp);
