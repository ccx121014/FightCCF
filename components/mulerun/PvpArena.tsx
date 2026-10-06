'use client'

import { useEffect, useRef, useState } from 'react'

type Fighter = { id: string; x: number; y: number; hp: number; facing: 1 | -1; action: string; combo: number }
type ArenaProps = {
  wsUrl?: string
  onBattleEnd?: (result: { win: boolean; reason: 'ko' | 'timeout' | 'disconnect' | 'surrender' }) => void
  onSurrender?: () => void
}

const INITIAL_FIGHTERS: Fighter[] = [
  { id: 'player', x: 28, y: 0, hp: 100, facing: 1, action: 'idle', combo: 0 },
  { id: 'opponent', x: 72, y: 0, hp: 100, facing: -1, action: 'idle', combo: 0 },
]

export function PvpArena({ wsUrl, onBattleEnd, onSurrender }: ArenaProps) {
  const socketRef = useRef<WebSocket | null>(null)
  const endedRef = useRef(false)

  function finishOnce(result: { win: boolean; reason: 'ko' | 'timeout' | 'disconnect' | 'surrender' }) {
    if (endedRef.current) return
    endedRef.current = true
    onBattleEnd?.(result)
  }
  const [status, setStatus] = useState('本地竞技场 · 对手已就位')
  const [roomId, setRoomId] = useState('local-room')
  const [playerId, setPlayerId] = useState('player')
  const [fighters, setFighters] = useState<Fighter[]>(INITIAL_FIGHTERS)
  const [timer, setTimer] = useState(90)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(false)

  useEffect(() => {
    if (!wsUrl) return
    let socket: WebSocket
    try {
      socket = new WebSocket(wsUrl)
      socketRef.current = socket
      socket.onopen = () => { setOnline(true); setStatus('匹配成功 · 实时对战'); setError('') }
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as { type: string; playerId?: string; roomId?: string; snapshot?: Fighter[] }
          if (message.playerId) setPlayerId(message.playerId)
          if (message.roomId) setRoomId(message.roomId)
          if (message.type === 'state' && message.snapshot) setFighters(message.snapshot)
          if (message.type === 'opponent_left') {
            setStatus('对手已断线 · 判定胜利')
            finishOnce({ win: true, reason: 'disconnect' })
          }
        } catch { setError('收到无法识别的对战数据') }
      }
      socket.onerror = () => { setOnline(false); setStatus('本地竞技场'); setError('实时服务暂不可用，已切换为本地演练') }
      socket.onclose = () => {
        setOnline(false)
        setStatus('连接已断开 · 可继续本地演练')
      }
    } catch { setError('实时服务暂不可用，已切换为本地演练') }
    return () => socket?.close()
  }, [wsUrl])

  useEffect(() => {
    const interval = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (timer !== 0) return
    setStatus('时间到 · 本局结束')
    finishOnce({ win: false, reason: 'timeout' })
  }, [timer])

  function updateLocal(action: string, direction = 0) {
    if (timer === 0 || online) return
    setFighters((current) => {
      const player = current.find((fighter) => fighter.id === 'player') ?? INITIAL_FIGHTERS[0]
      const opponent = current.find((fighter) => fighter.id === 'opponent') ?? INITIAL_FIGHTERS[1]
      const distance = Math.abs(player.x - opponent.x)
      const canHit = distance < 24
      const damage = action === 'skill' ? 18 : 9
      const nextPlayer: Fighter = { ...player, x: Math.max(8, Math.min(92, player.x + direction * 5)), action, combo: action === 'attack' ? player.combo + 1 : 0 }
      const nextOpponent: Fighter = { ...opponent, hp: canHit && (action === 'attack' || action === 'skill') ? Math.max(0, opponent.hp - damage) : opponent.hp, action: canHit ? 'hit' : 'idle' }
      if (nextOpponent.hp === 0) {
        setStatus('胜利 · 对手已被击败')
        window.setTimeout(() => finishOnce({ win: true, reason: 'ko' }), 0)
      }
      return [nextPlayer, nextOpponent]
    })
  }

  function send(action: string, dx = 0, jump = false) {
    if (online && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'input', roomId, action, dx, jump }))
      return
    }
    updateLocal(action, dx)
  }

  const mine = fighters.find((fighter) => fighter.id === playerId) ?? fighters[0]
  const opponent = fighters.find((fighter) => fighter.id !== playerId) ?? fighters[1]
  return <section className="mulerun-pvp-arena">
    <header className="arena-topbar"><span>{status}</span><strong>{String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}</strong></header>
    {error && <p className="arena-error" role="status">{error}</p>}
    <div className="arena-stage" role="application" aria-label="真人算法竞技场">
      <div className="arena-grid" />
      {opponent && <div className={`arena-fighter enemy ${opponent.action === 'hit' ? 'is-hit' : ''}`} style={{ left: `${opponent.x}%`, bottom: `${opponent.y + 32}px` }}><span className="algorithm-core">∇</span><b>{opponent.hp}</b></div>}
      {mine && <div className="arena-fighter player" style={{ left: `${mine.x}%`, bottom: `${mine.y + 32}px` }}><span className="algorithm-core">λ</span><b>{mine.hp}</b></div>}
    </div>
    <div className="arena-hud"><div><span>我方</span><progress value={mine?.hp ?? 100} max="100" /></div><div className="combo">COMBO {mine?.combo ?? 0}</div><div><span>对手</span><progress value={opponent?.hp ?? 100} max="100" /></div></div>
    <div className="arena-controls"><button aria-label="向左移动" onClick={() => send('move', -1)}>←</button><button onClick={() => send('jump', 0, true)}>跳跃</button><button className="attack" onClick={() => send('attack')}>连击</button><button className="skill" onClick={() => send('skill')}>算法技</button><button aria-label="向右移动" onClick={() => send('move', 1)}>→</button></div>
    <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10, color: '#fb7185' }} onClick={() => { if (window.confirm('确认投降本局？投降将直接判负。')) onSurrender?.() }}>投降</button>
  </section>
}
