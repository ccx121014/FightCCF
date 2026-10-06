'use client'

import { useEffect, useRef, useState } from 'react'

type Fighter = { id: string; x: number; y: number; hp: number; facing: 1 | -1; action: string; combo: number }
type ArenaProps = { wsUrl?: string; matchId?: string; onReport?: (reason: string) => void }

export function PvpArena({ wsUrl = process.env.NEXT_PUBLIC_PVP_WS_URL ?? 'ws://localhost:8787', onReport }: ArenaProps) {
  const socketRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState('正在匹配真人对手…')
  const [roomId, setRoomId] = useState<string>()
  const [playerId, setPlayerId] = useState<string>()
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [timer, setTimer] = useState(90)
  const [error, setError] = useState('')
  const [timeline, setTimeline] = useState<string[]>([])

  function recordEvent(label: string) {
    setTimeline((events) => [`${new Date().toLocaleTimeString('zh-CN', { minute: '2-digit', second: '2-digit' })} · ${label}`, ...events].slice(0, 8))
  }

  useEffect(() => {
    const socket = new WebSocket(wsUrl)
    socketRef.current = socket
    socket.onopen = () => setStatus('匹配中 · 等待真人玩家')
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as { type: string; playerId?: string; roomId?: string; snapshot?: Fighter[] }
      if (message.type === 'queued') setPlayerId(message.playerId)
      if (message.type === 'matched') { setRoomId(message.roomId); setPlayerId(message.playerId); setStatus('对手已连接 · 开始战斗'); if (message.snapshot) setFighters(message.snapshot) }
      if (message.type === 'state' && message.snapshot) setFighters(message.snapshot)
      if (message.type === 'opponent_left') setStatus('对手已断线')
    }
    socket.onerror = () => { setError('WebSocket 未连接，请启动 PVP 实时服务'); setStatus('离线') }
    return () => socket.close()
  }, [wsUrl])

  useEffect(() => { if (!roomId) return; const interval = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(interval) }, [roomId])

  function send(action: string, dx = 0, jump = false) {
    recordEvent(action === 'attack' ? '发动连击' : action === 'skill' ? '释放算法技' : action === 'jump' ? '跳跃' : dx < 0 ? '向左移动' : dx > 0 ? '向右移动' : '操作')
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !roomId) return
    socketRef.current.send(JSON.stringify({ type: 'input', roomId, action, dx, jump }))
  }

  const mine = fighters.find((fighter) => fighter.id === playerId)
  const opponent = fighters.find((fighter) => fighter.id !== playerId)
  return <section className="mulerun-pvp-arena">
    <header className="arena-topbar"><span>{status}</span><strong>{String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}</strong></header>
    {error && <p className="arena-error">{error}</p>}
    <div className="arena-stage" role="application" aria-label="真人算法竞技场">
      <div className="arena-grid" />
      {opponent && <div className="arena-fighter enemy" style={{ left: `${opponent.x / 10}%`, bottom: `${opponent.y + 32}px` }}><span className="algorithm-core">∇</span><b>{opponent.hp}</b></div>}
      {mine && <div className="arena-fighter player" style={{ left: `${mine.x / 10}%`, bottom: `${mine.y + 32}px` }}><span className="algorithm-core">λ</span><b>{mine.hp}</b></div>}
    </div>
    <div className="arena-hud"><div><span>我方</span><progress value={mine?.hp ?? 100} max="100" /></div><div className="combo">COMBO {mine?.combo ?? 0}</div><div><span>对手</span><progress value={opponent?.hp ?? 100} max="100" /></div></div>
    <div className="arena-controls"><button onClick={() => send('move', -1)}>←</button><button onClick={() => send('jump', 0, true)}>跳跃</button><button className="attack" onClick={() => send('attack')}>连击</button><button className="skill" onClick={() => send('skill')}>算法技</button><button onClick={() => send('move', 1)}>→</button></div>
    {timeline.length > 0 && <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--border)', borderRadius: 10, fontSize: 11, color: 'var(--text-dim)' }}><strong>关键操作</strong>{timeline.map((event) => <div key={event}>{event}</div>)}</div>}
    <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10, color: '#fb7185' }} onClick={() => onReport?.('作弊')}>举报对手</button>
  </section>
}
