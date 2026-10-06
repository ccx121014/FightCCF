'use client'

import { useEffect, useRef, useState } from 'react'

type FighterState = 'idle' | 'run' | 'jump' | 'land' | 'hurt' | 'stun' | 'knockback' | 'down' | 'victory' | 'defeat'
type AttackPhase = 'none' | 'startup' | 'active' | 'recovery' | 'cancel'
type Fighter = { id: string; x: number; y: number; hp: number; facing: 1 | -1; action: string; combo: number; state?: FighterState; attackPhase?: AttackPhase; character?: '拳师' | '剑士' | '术士' | '游侠' }
type ArenaProps = { wsUrl?: string; matchId?: string; onReport?: (reason: string) => void }

export function PvpArena({ wsUrl = process.env.NEXT_PUBLIC_PVP_WS_URL ?? 'ws://localhost:8787', matchId = 'local-practice', onReport }: ArenaProps) {
  const socketRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState('正在匹配真人对手…')
  const [roomId, setRoomId] = useState<string>()
  const [playerId, setPlayerId] = useState<string>()
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [timer, setTimer] = useState(90)
  const [error, setError] = useState('')
  const [timeline, setTimeline] = useState<string[]>([])
  const [networkState, setNetworkState] = useState<'连接中' | '在线' | '离线'>('连接中')
  const [reportSent, setReportSent] = useState(false)
  const [latency, setLatency] = useState<number | null>(null)
  const reconnectAttempts = useRef(0)
  const pendingInputs = useRef<Array<{ seq: number; action: string; dx: number; jump: boolean }>>([])
  const inputSeq = useRef(0)
  const streamRef = useRef<EventSource | null>(null)
  const [effects, setEffects] = useState<Array<{ id: number; type: 'hit' | 'slash' | 'burst' | 'shield' | 'critical'; x: number; y: number; text?: string }>>([])
  const [cameraPulse, setCameraPulse] = useState(false)
  const [attackPhase, setAttackPhase] = useState<AttackPhase>('none')
  const comboTimer = useRef<number | null>(null)
  const effectId = useRef(0)

  function recordEvent(label: string) {
    setTimeline((events) => [`${new Date().toLocaleTimeString('zh-CN', { minute: '2-digit', second: '2-digit' })} · ${label}`, ...events].slice(0, 8))
  }

  useEffect(() => {
    const socket = new WebSocket(wsUrl)
    socketRef.current = socket
    socket.onopen = () => { setNetworkState('在线'); setStatus('匹配中 · 等待真人玩家') }
    socket.onmessage = (event) => {
      let message: { type: string; playerId?: string; roomId?: string; snapshot?: Fighter[] }
      try { message = JSON.parse(event.data) as typeof message } catch { setError('收到无效的实时消息'); return }
      if (message.type === 'queued') setPlayerId(message.playerId)
      if (message.type === 'matched') { setRoomId(message.roomId); setPlayerId(message.playerId); setStatus('对手已连接 · 开始战斗'); if (message.snapshot) setFighters(message.snapshot) }
      if (message.type === 'state' && message.snapshot) {
        const acknowledgedSeq = (message as typeof message & { ack?: number }).ack ?? inputSeq.current
        pendingInputs.current = pendingInputs.current.filter((input) => input.seq > acknowledgedSeq)
        setFighters((current) => {
          const serverSnapshot = message.snapshot!
          return serverSnapshot.map((fighter) => {
            if (fighter.id !== playerId) return fighter
            return pendingInputs.current.reduce((next, input) => ({
              ...next,
              x: Math.max(0, Math.min(980, next.x + input.dx * 8)),
              y: input.jump ? Math.min(180, next.y + 16) : next.y,
              action: input.action,
            }), fighter)
          })
        })
      }
      if (message.type === 'opponent_left') setStatus('对手已断线')
    }
    socket.onerror = () => { setNetworkState('离线'); setError('WebSocket 未连接，请启动 PVP 实时服务'); setStatus('离线') }
    socket.onclose = () => {
      setNetworkState('离线'); setStatus('连接已断开 · 正在尝试重连')
      if (reconnectAttempts.current < 3) {
        reconnectAttempts.current += 1
        setStatus(`连接已断开 · ${reconnectAttempts.current}/3 次重连准备中`)
      } else setStatus('连接已断开 · 可查看本地回放')
    }
    return () => { socket.close(); reconnectAttempts.current = 0 }
  }, [wsUrl])

  useEffect(() => {
    if (!matchId || matchId === 'local-practice') return
    const stream = new EventSource(`/api/pvp/matches/stream?matchId=${encodeURIComponent(matchId)}`)
    streamRef.current = stream
    stream.addEventListener('snapshot', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { match?: { playerOneHp: number; playerTwoHp: number; status: string } }
      if (!data.match) return
      setNetworkState('在线')
      setFighters((current) => current.map((fighter) => fighter.id === playerId ? { ...fighter, hp: data.match!.playerOneHp } : { ...fighter, hp: data.match!.playerTwoHp }))
      if (data.match.status === 'finished') setStatus('对局已结束 · 已同步最终结果')
    })
    stream.onerror = () => { setNetworkState('离线'); setError('实时快照连接断开，正在使用轮询恢复') }
    const measure = async () => {
      const started = performance.now()
      try { const response = await fetch(`/api/pvp/matches?matchId=${encodeURIComponent(matchId)}`, { cache: 'no-store' }); if (!response.ok) throw new Error('latency')
        setLatency(Math.round(performance.now() - started)); setNetworkState('在线')
      } catch { setNetworkState('离线') }
    }
    void measure(); const interval = window.setInterval(measure, 3000)
    return () => { window.clearInterval(interval); stream.close(); streamRef.current = null }
  }, [matchId, playerId])

  useEffect(() => { if (!roomId) return; const interval = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(interval) }, [roomId])

  function playImpactSound(kind: 'step' | 'hit' | 'skill' | 'hurt') {
    if (typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass(); const oscillator = context.createOscillator(); const gain = context.createGain()
    oscillator.type = kind === 'skill' ? 'sawtooth' : 'square'; oscillator.frequency.value = kind === 'hit' ? 180 : kind === 'hurt' ? 90 : kind === 'skill' ? 420 : 240
    gain.gain.setValueAtTime(0.035, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (kind === 'skill' ? 0.24 : 0.09)); oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.25)
  }

  function spawnEffect(type: 'hit' | 'slash' | 'burst' | 'shield' | 'critical', text?: string) {
    const target = opponent ?? mine
    if (!target) return
    const id = ++effectId.current
    setEffects((current) => [...current, { id, type, x: target.x, y: target.y + 50, text }])
    window.setTimeout(() => setEffects((current) => current.filter((effect) => effect.id !== id)), type === 'critical' ? 650 : 420)
  }

  function send(action: string, dx = 0, jump = false) {
    recordEvent(action === 'attack' ? '发动连击' : action === 'skill' ? '释放算法技' : action === 'jump' ? '跳跃' : dx < 0 ? '向左移动' : dx > 0 ? '向右移动' : '操作')
    if (action === 'attack' || action === 'heavy' || action === 'skill' || action === 'ultimate') {
      setAttackPhase('startup'); playImpactSound(action === 'skill' || action === 'ultimate' ? 'skill' : 'step')
      window.setTimeout(() => setAttackPhase('active'), 130)
      window.setTimeout(() => { setAttackPhase('recovery'); spawnEffect(action === 'ultimate' ? 'critical' : action === 'skill' ? 'burst' : action === 'heavy' ? 'slash' : 'hit', action === 'ultimate' ? '终结' : action === 'skill' ? 'ALGO!' : undefined); playImpactSound('hit'); setCameraPulse(true); window.setTimeout(() => setCameraPulse(false), 180) }, action === 'skill' ? 260 : 180)
      window.setTimeout(() => setAttackPhase('cancel'), 360)
      if (comboTimer.current) window.clearTimeout(comboTimer.current)
      comboTimer.current = window.setTimeout(() => setAttackPhase('none'), 520)
    } else if (action === 'jump') { playImpactSound('step'); setAttackPhase('none') } else if (dx !== 0) playImpactSound('step')
    const seq = ++inputSeq.current
    pendingInputs.current.push({ seq, action, dx, jump })
    setFighters((current) => current.map((fighter) => fighter.id === playerId ? { ...fighter, x: Math.max(0, Math.min(980, fighter.x + dx * 8)), y: jump ? Math.min(180, fighter.y + 16) : fighter.y, action } : fighter))
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !roomId) return
    socketRef.current.send(JSON.stringify({ type: 'input', roomId, action, dx, jump, seq, clientTime: Date.now() }))
  }

  const mine = fighters.find((fighter) => fighter.id === playerId)
  const opponent = fighters.find((fighter) => fighter.id !== playerId)
  return <section className="mulerun-pvp-arena">
    <header className="arena-topbar"><span>{status}</span><span style={{ fontSize: 11, color: networkState === '在线' ? '#4ade80' : '#f59e0b' }}>网络 {networkState}{latency !== null ? ` · ${latency}ms` : ''}</span><strong>{String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}</strong></header>
    {error && <p className="arena-error">{error}</p>}
    <div className={`arena-stage ${cameraPulse ? 'camera-pulse' : ''}`} role="application" aria-label="真人算法竞技场">
      <div className="arena-grid" />
      {effects.map((effect) => <div key={effect.id} className={`combat-effect effect-${effect.type}`} style={{ left: `${effect.x / 10}%`, bottom: `${effect.y}px` }}>{effect.type === 'critical' ? <strong>暴击 {effect.text}</strong> : effect.type === 'shield' ? '护盾破碎' : effect.type === 'slash' ? '╱' : effect.type === 'burst' ? '✦' : '✹'}</div>)}
      {opponent && <div className={`arena-fighter enemy state-${opponent.state ?? 'idle'} phase-${attackPhase}`} style={{ left: `${opponent.x / 10}%`, bottom: `${opponent.y + 32}px`, willChange: 'left, bottom' }}><span className="algorithm-core">{opponent.character === '剑士' ? '⚔' : opponent.character === '术士' ? '◇' : '∇'}</span><b>{opponent.hp}</b></div>}
      {mine && <div className={`arena-fighter player state-${mine.state ?? 'idle'} phase-${attackPhase}`} style={{ left: `${mine.x / 10}%`, bottom: `${mine.y + 32}px`, willChange: 'left, bottom' }}><span className="algorithm-core">{mine.character === '剑士' ? '⚔' : mine.character === '术士' ? '◇' : 'λ'}</span><b>{mine.hp}</b><i>{attackPhase !== 'none' ? attackPhase === 'active' ? '命中帧' : attackPhase === 'startup' ? '前摇' : attackPhase === 'recovery' ? '后摇' : '取消窗' : mine.state === 'hurt' ? '受击' : mine.state === 'down' ? '倒地' : ''}</i></div>}
    </div>
    <div className="arena-hud"><div><span>我方</span><progress value={mine?.hp ?? 100} max="100" /></div><div className="combo">COMBO {mine?.combo ?? 0}</div><div><span>对手</span><progress value={opponent?.hp ?? 100} max="100" /></div></div>
    <div className="arena-controls"><button aria-label="向左移动" onClick={() => send('move', -1)}>←</button><button onClick={() => send('jump', 0, true)}>跳跃</button><button className="attack" onClick={() => send('attack')}>轻攻击</button><button className="attack heavy" onClick={() => send('heavy')}>重攻击</button><button className="skill" onClick={() => send('skill')}>专属技</button><button className="skill ultimate" onClick={() => send('ultimate')}>终极技</button><button aria-label="向右移动" onClick={() => send('move', 1)}>→</button></div>
    {timeline.length > 0 && <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--border)', borderRadius: 10, fontSize: 11, color: 'var(--text-dim)' }}><strong>关键操作</strong>{timeline.map((event) => <div key={event}>{event}</div>)}</div>}
    <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10, color: '#fb7185' }} disabled={reportSent} onClick={() => { onReport?.('作弊'); setReportSent(true) }}>{reportSent ? '举报已提交' : '举报对手'}</button>
  </section>
}
