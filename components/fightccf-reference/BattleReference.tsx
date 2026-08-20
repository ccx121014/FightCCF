import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameEngine } from '@/game';
import type { BattleSetup } from '@/game';
import type { UnitConfig } from '@/game/types';
import { BattleHUD, type HUDState } from '@/game/ui/BattleHUD';
import { BattleResult } from '@/components/BattleResult';
import { getLevel, LEVELS } from '@/data/levels';
import { getCharacter } from '@/data/characters';
import { getProfile } from '@/game/skills/attackProfiles';
import { useCharacterStore } from '@/stores/characterStore';
import { useLevelStore } from '@/stores/levelStore';
import { useAuthStore } from '@/stores/authStore';
import type { BattleRating } from '@shared/types';

interface ResultData {
  victory: boolean;
  rating: BattleRating;
  timeUsed: number;
  maxCombo: number;
  totalDamage: number;
  gold: number;
  exp: number;
  isNewRecord: boolean;
  hpRatio: number;
  scoreBreakdown: { time: number; hp: number; combo: number; total: number };
}

export default function Battle() {
  const { levelId } = useParams();
  const navigate = useNavigate();

  const selectedId = useCharacterStore((s) => s.selectedId);
  const ownedChars = useCharacterStore((s) => s.owned);
  const saveResult = useLevelStore((s) => s.saveResult);
  const getProgress = useLevelStore((s) => s.getProgress);
  const addCurrency = useAuthStore((s) => s.addCurrency);
  const addExp = useAuthStore((s) => s.addExp);
  const recordBattle = useAuthStore((s) => s.recordBattle);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const isMountedRef = useRef(true);
  const rafRef = useRef(0);
  const resolvedRef = useRef(false);

  const [hud, setHud] = useState<HUDState | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);

  const level = levelId ? getLevel(levelId) : undefined;
  const playerChar = getCharacter(selectedId);

  // 计算出战角色等级加成
  const ownedRecord = ownedChars.find((c) => c.characterId === selectedId);
  const charLevel = ownedRecord?.level ?? 1;

  const buildSetup = useCallback(
    (w: number, h: number): BattleSetup | null => {
      if (!level || !playerChar) return null;

      const lvlMul = 1 + (charLevel - 1) * 0.08;
      const player: UnitConfig = {
        id: 'player',
        name: playerChar.name,
        element: playerChar.element,
        color: playerChar.avatarColor,
        maxHp: Math.round(playerChar.baseStats.hp * lvlMul),
        attack: Math.round(playerChar.baseStats.attack * lvlMul),
        defense: Math.round(playerChar.baseStats.defense * lvlMul),
        speed: playerChar.baseStats.speed * 1.6, // 移动速度（像素/秒）缩放
        critRate: playerChar.baseStats.critRate,
        critDamage: playerChar.baseStats.critDamage,
        isPlayer: true,
        characterId: playerChar.id,
        attackStyle: getProfile(playerChar.id).pose,
      };

      const enemies: BattleSetup['enemies'] = [];
      level.enemies.forEach((spawn) => {
        const ec = getCharacter(spawn.characterId);
        if (!ec) return;
        const eMul = 1 + (spawn.level - 1) * 0.04;
        for (let i = 0; i < spawn.count; i++) {
          enemies.push({
            config: {
              id: `enemy_${spawn.characterId}_${i}`,
              name: ec.name,
              element: ec.element,
              color: ec.avatarColor,
              maxHp: Math.round(ec.baseStats.hp * eMul * (spawn.hpMultiplier ?? 1)),
              attack: Math.round(ec.baseStats.attack * eMul * (spawn.attackMultiplier ?? 1)),
              defense: Math.round(ec.baseStats.defense * eMul),
              speed: ec.baseStats.speed * 1.1,
              critRate: ec.baseStats.critRate,
              critDamage: ec.baseStats.critDamage,
              isPlayer: false,
              characterId: spawn.characterId,
              attackStyle: getProfile(spawn.characterId).pose,
            },
            x: w * (0.68 + i * 0.1),
            y: h * (0.5 + (i % 2) * 0.18),
          });
        }
      });

      return { player, enemies, width: w, height: h, timeLimit: level.timeLimit };
    },
    [level, playerChar, charLevel]
  );

  const finishBattle = useCallback(
    (victory: boolean) => {
      if (resolvedRef.current || !engineRef.current || !level) return;
      resolvedRef.current = true;
      const battle = engineRef.current.battle;
      const timeUsed = battle.elapsedTime;
      const maxCombo = battle.maxCombo;
      const totalDamage = battle.damageDealt;
      const ratingInfo = battle.computeRating(level.starTimes);
      const rating: BattleRating = victory ? ratingInfo.rating : 'C';
      const hpRatio = victory ? ratingInfo.hpRatio : 0;
      const scoreBreakdown = {
        time: ratingInfo.timeScore,
        hp: ratingInfo.hpScore,
        combo: ratingInfo.comboScore,
        total: victory ? ratingInfo.score : 0,
      };

      // 奖励
      let gold = 0;
      let exp = 0;
      if (victory && rating !== 'C') {
        const mul = rating === 'S' ? 1.5 : rating === 'A' ? 1.2 : 1.0;
        gold = Math.round(level.rewards.gold * mul);
        exp = Math.round(level.rewards.exp * mul);
      }

      const prev = getProgress(level.id);
      const isNewRecord = victory && rating !== 'C' && (!prev || timeUsed < prev.bestTime);

      // 保存进度与账号变更
      saveResult(level.id, rating, timeUsed, victory);
      recordBattle(victory, maxCombo, totalDamage);
      if (gold || exp) {
        addCurrency({ gold });
        addExp(exp);
      }

      if (isMountedRef.current) {
        setResult({ victory, rating, timeUsed, maxCombo, totalDamage, gold, exp, isNewRecord, hpRatio, scoreBreakdown });
      }
    },
    [level, getProgress, saveResult, recordBattle, addCurrency, addExp]
  );

  // 初始化引擎
  useEffect(() => {
    isMountedRef.current = true;
    resolvedRef.current = false;

    if (!level || !playerChar || !canvasRef.current || !containerRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const setup = buildSetup(w, h);
    if (!setup) return;

    const engine = new GameEngine(canvas, setup, playerChar.element);
    engineRef.current = engine;

    engine.onBattleEnd((victory) => finishBattle(victory));

    // HUD 同步（独立 RAF，不干扰引擎循环）
    const syncHud = () => {
      if (!isMountedRef.current || !engineRef.current) return;
      const b = engineRef.current.battle;
      const sm = b.skills;
      setHud({
        playerName: b.player.name,
        playerHp: b.player.hp,
        playerMaxHp: b.player.maxHp,
        energy: b.energy.current,
        maxEnergy: b.energy.maxEnergy,
        combo: b.combo.count,
        comboWindow: b.combo.windowRatio,
        timeRemaining: b.timeRemaining,
        skills: [0, 1, 2].map((i) => {
          const sk = sm.getSkill(i)!;
          return {
            key: ['J', 'K', 'L'][i],
            name: sk.config.name,
            energyCost: sk.config.energyCost,
            cooldownRatio: sk.cooldownRatio,
            cooldownRemaining: sk.cooldownRemaining,
            ready: sk.isReady,
            color: playerChar.avatarColor,
          };
        }),
      });
      rafRef.current = requestAnimationFrame(syncHud);
    };
    rafRef.current = requestAnimationFrame(syncHud);

    // 倒计时后开始
    let cd = 3;
    setCountdown(cd);
    const timer = setInterval(() => {
      cd -= 1;
      if (!isMountedRef.current) {
        clearInterval(timer);
        return;
      }
      if (cd <= 0) {
        clearInterval(timer);
        setStarted(true);
        engine.start();
      } else {
        setCountdown(cd);
      }
    }, 800);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      cancelAnimationFrame(rafRef.current);
      engine.stop();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  const handleRetry = useCallback(() => {
    // 重新加载本关
    setResult(null);
    resolvedRef.current = false;
    navigate(0);
  }, [navigate]);

  const handleNext = useCallback(() => {
    if (!level) return;
    const idx = LEVELS.findIndex((l) => l.id === level.id);
    const next = LEVELS[idx + 1];
    if (next) {
      navigate(`/battle/${next.id}`);
    } else {
      navigate('/levels');
    }
  }, [level, navigate]);

  if (!level || !playerChar) {
    return (
      <div className="center-screen">
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ marginBottom: 16 }}>关卡不存在</p>
          <button className="btn btn-primary" onClick={() => navigate('/levels')}>返回选关</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0b1120', touchAction: 'none' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* 退出按钮 */}
      <button
        onClick={() => navigate('/levels')}
        style={{ position: 'absolute', top: 12, left: 12, zIndex: 60, padding: '6px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: '#fff', fontSize: 13, fontWeight: 700 }}
      >
        ‹ 退出
      </button>

      {/* 关卡名 */}
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 55, textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{level.name}</div>
      </div>

      {/* HUD */}
      {started && hud && !result && (
        <BattleHUD
          state={hud}
          onBasicTap={() => engineRef.current?.triggerBasic()}
          onSkillTap={(i) => engineRef.current?.triggerSkill(i)}
        />
      )}

      {/* 倒计时 */}
      {!started && !result && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 70, background: 'rgba(7,10,18,0.5)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 90, fontWeight: 900, color: '#f59e0b', textShadow: '0 0 40px rgba(245,158,11,0.6)', animation: 'pop 0.4s ease', lineHeight: 1 }} key={countdown}>
              {countdown}
            </div>
            <div style={{ marginTop: 12, color: '#cbd5e1', fontSize: 14 }}>
              WASD 移动 · I 攻击 · J/K/L 技能
            </div>
            <div style={{ marginTop: 6, color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>
              限时 {level.timeLimit} 秒 · 快速通关且少受伤才能拿高分
            </div>
          </div>
        </div>
      )}

      {/* 结算 */}
      {result && (
        <BattleResult
          victory={result.victory}
          rating={result.rating}
          timeUsed={result.timeUsed}
          maxCombo={result.maxCombo}
          totalDamage={result.totalDamage}
          rewards={{ gold: result.gold, exp: result.exp }}
          playerColor={playerChar.avatarColor}
          playerElement={playerChar.element}
          isNewRecord={result.isNewRecord}
          hpRatio={result.hpRatio}
          scoreBreakdown={result.scoreBreakdown}
          onRetry={handleRetry}
          onNext={result.victory ? handleNext : undefined}
          onExit={() => navigate('/levels')}
        />
      )}
    </div>
  );
}
