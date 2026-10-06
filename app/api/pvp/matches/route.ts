import { NextResponse } from 'next/server'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpActions, pvpMatches } from '@/lib/db/schema'

const ACTIONS = new Set(['ready', 'move_left', 'move_right', 'jump', 'attack', 'skill', 'skill_1', 'skill_2', 'surrender'])
const MAX_ACTION_LENGTH = 48
const ACTION_WINDOW_MS = 5000
const MAX_ACTIONS_PER_WINDOW = 30
const SKILL_COOLDOWN_MS = 900
const FAIR_MATCH_RULES = { normalizedStats: true, gachaBonuses: false }

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
    return NextResponse.json({ match, role: 'player_one', rules: FAIR_MATCH_RULES }, { status: 201 })
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

  if (intent === 'surrender') {
    if (match.playerOneId !== id && match.playerTwoId !== id) return jsonError('无权操作此对局', 403)
    if (match.status === 'finished') return jsonError('对局已结束', 409)
    await db.insert(pvpActions).values({ id: crypto.randomUUID(), matchId: match.id, userId: id, action: 'surrender', seq: 0 })
    const [updated] = await db.update(pvpMatches).set({ status: 'finished', updatedAt: new Date() }).where(and(eq(pvpMatches.id, match.id), sql`${pvpMatches.status} <> 'finished'`)).returning()
    return NextResponse.json({ match: updated, authoritative: true, winnerId: id === match.playerOneId ? match.playerTwoId : match.playerOneId, rules: FAIR_MATCH_RULES })
  }

  if (intent === 'action') {
    if (match.status !== 'active' && match.status !== 'ready') return jsonError('对局尚未开始', 409)
    if (!body.action || body.action.length > MAX_ACTION_LENGTH || !ACTIONS.has(body.action) || body.action === 'surrender') return jsonError('无效操作', 400)
    if (match.playerOneId !== id && match.playerTwoId !== id) return jsonError('无权操作此对局', 403)
    const windowStart = new Date(Date.now() - ACTION_WINDOW_MS)
    const recentActions = await db.select({ action: pvpActions.action, seq: pvpActions.seq, createdAt: pvpActions.createdAt }).from(pvpActions).where(and(eq(pvpActions.matchId, match.id), eq(pvpActions.userId, id), gte(pvpActions.createdAt, windowStart))).orderBy(desc(pvpActions.seq)).limit(MAX_ACTIONS_PER_WINDOW + 1)
    if (recentActions.length >= MAX_ACTIONS_PER_WINDOW) return jsonError('操作过于频繁，请降低输入频率', 429)
    if ((body.action === 'skill_1' || body.action === 'skill_2') && recentActions.some((item) => item.action === body.action && Date.now() - item.createdAt.getTime() < SKILL_COOLDOWN_MS)) return jsonError('技能冷却中', 429)
    const [last] = await db.select({ seq: pvpActions.seq }).from(pvpActions).where(eq(pvpActions.matchId, match.id)).orderBy(desc(pvpActions.seq)).limit(1)
    const seq = (last?.seq ?? 0) + 1
    const [saved] = await db.insert(pvpActions).values({ id: crypto.randomUUID(), matchId: match.id, userId: id, action: body.action, seq }).returning()
    const isPlayerOne = match.playerOneId === id
    const damage = body.action === 'skill' || body.action === 'skill_1' || body.action === 'skill_2' ? 18 : body.action === 'attack' ? 8 : 0
    const nextOpponentHp = Math.max(0, (isPlayerOne ? match.playerTwoHp : match.playerOneHp) - damage)
    const finished = nextOpponentHp === 0
    const updatedValues = isPlayerOne
      ? { playerTwoHp: nextOpponentHp, status: finished ? 'finished' : 'active', updatedAt: new Date() }
      : { playerOneHp: nextOpponentHp, status: finished ? 'finished' : 'active', updatedAt: new Date() }
    const [updated] = await db.update(pvpMatches).set(updatedValues).where(and(eq(pvpMatches.id, match.id), sql`${pvpMatches.status} <> 'finished'`)).returning()
    return NextResponse.json({ action: saved, match: updated, authoritative: true, damage, winnerId: finished ? id : null, serverTime: Date.now() })
  }

  if (intent === 'state') {
    if (match.playerOneId !== id && match.playerTwoId !== id) return jsonError('无权查看此对局', 403)
    const actions = await db.select().from(pvpActions).where(eq(pvpActions.matchId, match.id)).orderBy(pvpActions.seq)
    return NextResponse.json({ match, actions, serverTime: Date.now() })
  }

  return jsonError('不支持的 PvP 请求', 400)
}

export async function GET(request: Request) {
  const id = await userId()
  if (!id) return jsonError('请先登录', 401)
  const matchId = new URL(request.url).searchParams.get('matchId')
  if (matchId) {
    const [match] = await db.select().from(pvpMatches).where(eq(pvpMatches.id, matchId)).limit(1)
    if (!match) return jsonError('对局不存在', 404)
    if (match.playerOneId !== id && match.playerTwoId !== id) return jsonError('无权查看此对局', 403)
    const actions = await db.select().from(pvpActions).where(eq(pvpActions.matchId, match.id)).orderBy(pvpActions.seq)
    return NextResponse.json({ match, actions, serverTime: Date.now() })
  }
  const matches = await db.select({ id: pvpMatches.id, status: pvpMatches.status, createdAt: pvpMatches.createdAt }).from(pvpMatches).where(sql`${pvpMatches.status} = 'waiting'`).orderBy(desc(pvpMatches.createdAt)).limit(20)
  return NextResponse.json({ matches, rules: FAIR_MATCH_RULES })
}
