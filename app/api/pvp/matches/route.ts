import { NextResponse } from 'next/server'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpActions, pvpMatches } from '@/lib/db/schema'

const actions = new Set(['move', 'jump', 'attack', 'heavy', 'skill', 'ultimate', 'ready'])
const ATTACK_RULES: Record<string, { cooldown: number; damage: number; reach: number }> = {
  attack: { cooldown: 420, damage: 8, reach: 110 },
  heavy: { cooldown: 760, damage: 16, reach: 125 },
  skill: { cooldown: 1120, damage: 18, reach: 220 },
  ultimate: { cooldown: 1680, damage: 32, reach: 280 },
}
const damageFor = (action: string) => ATTACK_RULES[action]?.damage ?? 0

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function GET(request: Request) {
  const userId = await currentUser()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const matchId = new URL(request.url).searchParams.get('matchId')
  if (matchId) {
    const [match] = await db.select().from(pvpMatches).where(and(eq(pvpMatches.id, matchId), sql`${pvpMatches.playerOneId} = ${userId} OR ${pvpMatches.playerTwoId} = ${userId}`)).limit(1)
    if (!match) return NextResponse.json({ error: '对局不存在' }, { status: 404 })
    const timeline = await db.select().from(pvpActions).where(eq(pvpActions.matchId, match.id)).orderBy(asc(pvpActions.seq))
    return NextResponse.json({ match, timeline, serverTime: Date.now() })
  }
  const matches = await db.select({ id: pvpMatches.id, status: pvpMatches.status, createdAt: pvpMatches.createdAt }).from(pvpMatches).where(sql`${pvpMatches.status} in ('waiting', 'ready', 'active')`).orderBy(desc(pvpMatches.createdAt)).limit(20)
  return NextResponse.json({ matches })
}

export async function POST(request: Request) {
  const userId = await currentUser()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const body = await request.json() as { intent?: string; matchId?: string; action?: string; clientTime?: number; attackerX?: number; targetX?: number }
  const receivedAt = Date.now()
  if (body.intent === 'create') {
    const [match] = await db.insert(pvpMatches).values({ id: crypto.randomUUID(), playerOneId: userId }).returning()
    return NextResponse.json({ match }, { status: 201 })
  }
  if (body.clientTime && Math.abs(receivedAt - body.clientTime) > 30_000) return NextResponse.json({ error: '客户端时间漂移过大' }, { status: 400 })
  if (!body.matchId) return NextResponse.json({ error: '缺少房间 ID' }, { status: 400 })
  const [match] = await db.select().from(pvpMatches).where(eq(pvpMatches.id, body.matchId)).limit(1)
  if (!match) return NextResponse.json({ error: '对局不存在' }, { status: 404 })
  if (body.intent === 'join') {
    if (match.playerOneId === userId) return NextResponse.json({ error: '不能加入自己创建的房间' }, { status: 409 })
    if (match.status !== 'waiting') return NextResponse.json({ error: '房间不可加入' }, { status: 409 })
    if (match.playerTwoId && match.playerTwoId !== userId) return NextResponse.json({ error: '房间已满' }, { status: 409 })
    const [updated] = await db.update(pvpMatches).set({ playerTwoId: userId, status: 'ready', updatedAt: new Date() }).where(eq(pvpMatches.id, match.id)).returning()
    return NextResponse.json({ match: updated })
  }
  if (match.playerOneId !== userId && match.playerTwoId !== userId) return NextResponse.json({ error: '无权操作' }, { status: 403 })
  if (match.status === 'finished') return NextResponse.json({ error: '对局已结束' }, { status: 409 })
  if (body.action === 'ready' && match.playerTwoId && match.status === 'ready') return NextResponse.json({ match, serverTime: Date.now() })
  if (!body.action || !actions.has(body.action)) return NextResponse.json({ error: '无效操作' }, { status: 400 })
  const [lastUser] = await db.select({ createdAt: pvpActions.createdAt }).from(pvpActions).where(and(eq(pvpActions.matchId, match.id), eq(pvpActions.userId, userId))).orderBy(desc(pvpActions.seq)).limit(1)
  const [lastGlobal] = await db.select({ seq: pvpActions.seq }).from(pvpActions).where(eq(pvpActions.matchId, match.id)).orderBy(desc(pvpActions.seq)).limit(1)
  const rule = ATTACK_RULES[body.action]
  if (rule && (typeof body.attackerX !== 'number' || typeof body.targetX !== 'number' || Math.abs(body.attackerX - body.targetX) > rule.reach)) return NextResponse.json({ error: '目标不在攻击判定盒内' }, { status: 409 })
  if (rule && lastUser?.createdAt && Date.now() - lastUser.createdAt.getTime() < rule.cooldown) return NextResponse.json({ error: '攻击仍在动作冷却中' }, { status: 429 })
  const seq = (lastGlobal?.seq ?? 0) + 1
  await db.insert(pvpActions).values({ id: crypto.randomUUID(), matchId: match.id, userId, action: body.action, seq })
  const playerOne = match.playerOneId === userId
  const damage = damageFor(body.action)
  const nextHp = Math.max(0, (playerOne ? match.playerTwoHp : match.playerOneHp) - damage)
  const [updated] = await db.update(pvpMatches).set(playerOne ? { playerTwoHp: nextHp, status: nextHp === 0 ? 'finished' : 'active', updatedAt: new Date() } : { playerOneHp: nextHp, status: nextHp === 0 ? 'finished' : 'active', updatedAt: new Date() }).where(eq(pvpMatches.id, match.id)).returning()
  return NextResponse.json({ match: updated, damage, winnerId: nextHp === 0 ? userId : null, serverTime: Date.now() })
}
