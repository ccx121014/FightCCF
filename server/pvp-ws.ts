import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'node:crypto'

type Fighter = { id: string; x: number; y: number; hp: number; facing: 1 | -1; action: string; combo: number }
type Room = { id: string; clients: Map<string, WebSocket>; fighters: Map<string, Fighter>; lastTick: number }

const rooms = new Map<string, Room>()
const queue: Array<{ id: string; socket: WebSocket }> = []

function broadcast(room: Room, payload: unknown) {
  const message = JSON.stringify(payload)
  for (const socket of room.clients.values()) if (socket.readyState === WebSocket.OPEN) socket.send(message)
}

function createRoom(a: { id: string; socket: WebSocket }, b: { id: string; socket: WebSocket }) {
  const room: Room = { id: randomUUID(), clients: new Map([[a.id, a.socket], [b.id, b.socket]]), fighters: new Map([[a.id, { id: a.id, x: 220, y: 0, hp: 100, facing: 1, action: 'idle', combo: 0 }], [b.id, { id: b.id, x: 760, y: 0, hp: 100, facing: -1, action: 'idle', combo: 0 }]]), lastTick: Date.now() }
  rooms.set(room.id, room)
  for (const [id, socket] of room.clients) { socket.send(JSON.stringify({ type: 'matched', roomId: room.id, playerId: id, snapshot: [...room.fighters.values()] })) }
}

export function createPvpWebSocketServer(port = Number(process.env.PVP_WS_PORT ?? 8787)) {
  const wss = new WebSocketServer({ port })
  wss.on('connection', (socket) => {
    const playerId = randomUUID()
    socket.send(JSON.stringify({ type: 'queued', playerId }))
    const opponent = queue.shift()
    if (opponent) createRoom({ id: opponent.id, socket: opponent.socket }, { id: playerId, socket })
    else queue.push({ id: playerId, socket })

    socket.on('message', (raw) => {
      let message: { type: string; roomId?: string; action?: string; dx?: number; jump?: boolean }
      try { message = JSON.parse(raw.toString()) } catch { return }
      const room = message.roomId ? rooms.get(message.roomId) : undefined
      if (!room || !room.clients.has(playerId)) return
      const fighter = room.fighters.get(playerId)
      if (!fighter) return
      if (message.type === 'input') {
        fighter.x = Math.max(80, Math.min(900, fighter.x + Math.max(-1, Math.min(1, message.dx ?? 0)) * 18))
        fighter.y = message.jump ? 120 : 0
        fighter.facing = (message.dx ?? 0) >= 0 ? 1 : -1
        fighter.action = message.action ?? 'run'
        if (message.action === 'attack' || message.action === 'skill') {
          fighter.combo = Math.min(10, fighter.combo + 1)
          const target = [...room.fighters.values()].find((candidate) => candidate.id !== playerId)
          if (target && Math.abs(target.x - fighter.x) < (message.action === 'skill' ? 250 : 135)) target.hp = Math.max(0, target.hp - (message.action === 'skill' ? 18 : 8 + fighter.combo))
        }
        broadcast(room, { type: 'state', snapshot: [...room.fighters.values()], serverTime: Date.now() })
      }
    })
    socket.on('close', () => {
      const index = queue.findIndex((item) => item.id === playerId)
      if (index >= 0) queue.splice(index, 1)
      for (const room of rooms.values()) if (room.clients.has(playerId)) { broadcast(room, { type: 'opponent_left' }); rooms.delete(room.id) }
    })
  })
  return wss
}

if (process.env.PVP_WS_AUTOSTART === 'true') createPvpWebSocketServer()
