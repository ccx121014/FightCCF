import { NextResponse } from 'next/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpActions, pvpMatches } from '@/lib/db/schema'

const ACTIONS = new Set(['ready', 'move_left', 'move_right', 'jump', 'skill_1', 'skill_2', 'surrender'])
const MAX_ACTION_LENGTH = 48

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const id = await userId()
  if (!id) return jsonError('请先登录', 401)
  const body = await request.json().catch(() => ({})) as { intent?: string; matchId?: string; action?: string }
  const intent = body.intent ?? 'create'

  if (intent === 'create') {
    const matchId = crypto.randomUUID()
    const [match] = await db.insert(pvpMatches).values({ id: matchId, playerOneId: id, status: 'waiting' }).returning()
    return NextResponse.json({ match, role: 'player_one' }, { status: 201 })
  }

  if (!body.matchId) return jsonError('缺少对局 ID', 400)
  const [match] = await db.select().from(pvpMatches).where(eq(pvpMatches.id, body.matchId)).limit(1)
  if (!match) return jsonError('对局不存在', 404)

  if (intent === 'join') {
    if (match.status !== 'waiting') return jsonError('对局已开始或已结束', 409)
    if (match.playerOneId === id) return NextResponse.json({ match, role: 'player_one' })
    if (match.playerTwoId && match.playerTwoId !== id) return jsonError('对局已满', 409)
    const [updated] = await db.update(pvpMatches).set({ playerTwoId: id, status: 'ready', updatedAt: new Date() }).where(and(eq(pvpMatches.id, match.id), eq(pvpMatches.status, 'waiting'))).returning()
    return NextResponse.json({ match: updated, role: 'player_two' })
  }

  if (intent === 'action') {
    if (!body.action || body.action.length > MAX_ACTION_LENGTH || !ACTIONS.has(body.action)) return jsonError('无效操作', 400)
    if (match.status === 'finished') return jsonError('对局已结束', 409)
    if (match.playerOneId !== id && match.playerTwoId !== id) return jsonError('无权操作此对局', 403)
    const [last] = await db.select({ seq: pvpActions.seq }).from(pvpActions).where(eq(pvpActions.matchId, match.id)).orderBy(desc(pvpActions.seq)).limit(1)
    const seq = (last?.seq ?? 0) + 1
    const [saved] = await db.insert(pvpActions).values({ id: crypto.randomUUID(), matchId: match.id, userId: id, action: body.action, seq }).returning()
    if (body.action === 'surrender') {
      await db.update(pvpMatches).set({ status: 'finished', updatedAt: new Date() }).where(eq(pvpMatches.id, match.id))
    } else if (match.status === 'ready') {
      await db.update(pvpMatches).set({ status: 'active', updatedAt: new Date() }).where(eq(pvpMatches.id, match.id))
    }
    return NextResponse.json({ action: saved, authoritative: true, serverTime: Date.now() })
  }

  if (intent === 'state') {
    if (match.playerOneId !== id && match.playerTwoId !== id) return jsonError('无权查看此对局', 403)
    const actions = await db.select().from(pvpActions).where(eq(pvpActions.matchId, match.id)).orderBy(pvpActions.seq)
    return NextResponse.json({ match, actions, serverTime: Date.now() })
  }

  return jsonError('不支持的 PvP 请求', 400)
}

export async function GET() {
  const id = await userId()
  if (!id) return jsonError('请先登录', 401)
  const matches = await db.select().from(pvpMatches).where(sql`${pvpMatches.status} in ('waiting', 'ready', 'active')`).orderBy(desc(pvpMatches.createdAt)).limit(20)
  return NextResponse.json({ matches })
}
