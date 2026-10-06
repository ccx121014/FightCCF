import { NextResponse } from 'next/server'
import { and, asc, count, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpActions, pvpMatches, pvpSpectators } from '@/lib/db/schema'

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function GET(request: Request) {
  const userId = await currentUser()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const matchId = new URL(request.url).searchParams.get('matchId')
  if (!matchId) return NextResponse.json({ error: '缺少对局 ID' }, { status: 400 })
  const [match] = await db.select().from(pvpMatches).where(eq(pvpMatches.id, matchId)).limit(1)
  if (!match) return NextResponse.json({ error: '对局不存在' }, { status: 404 })
  const timeline = await db.select().from(pvpActions).where(eq(pvpActions.matchId, matchId)).orderBy(asc(pvpActions.seq))
  const [spectators] = await db.select({ total: count() }).from(pvpSpectators).where(eq(pvpSpectators.matchId, matchId))
  return NextResponse.json({ match, timeline, spectatorCount: Number(spectators?.total ?? 0), replayable: match.status === 'finished' })
}

export async function POST(request: Request) {
  const userId = await currentUser()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const body = await request.json() as { matchId?: string; intent?: 'join' | 'leave' }
  if (!body.matchId || !body.intent) return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  const [match] = await db.select().from(pvpMatches).where(eq(pvpMatches.id, body.matchId)).limit(1)
  if (!match) return NextResponse.json({ error: '对局不存在' }, { status: 404 })
  if (match.playerOneId === userId || match.playerTwoId === userId) return NextResponse.json({ error: '对局玩家不能占用观战席位' }, { status: 409 })
  if (body.intent === 'leave') {
    await db.delete(pvpSpectators).where(and(eq(pvpSpectators.matchId, match.id), eq(pvpSpectators.userId, userId)))
    return NextResponse.json({ watching: false })
  }
  const [existing] = await db.select({ id: pvpSpectators.id }).from(pvpSpectators).where(and(eq(pvpSpectators.matchId, match.id), eq(pvpSpectators.userId, userId))).limit(1)
  if (existing) return NextResponse.json({ watching: true })
  const [spectatorCount] = await db.select({ total: count() }).from(pvpSpectators).where(eq(pvpSpectators.matchId, match.id))
  if (Number(spectatorCount?.total ?? 0) >= 8) return NextResponse.json({ error: '观战席位已满' }, { status: 409 })
  await db.insert(pvpSpectators).values({ id: crypto.randomUUID(), matchId: match.id, userId })
  return NextResponse.json({ watching: true }, { status: 201 })
}
