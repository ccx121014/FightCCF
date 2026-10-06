import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpBans, pvpMatches, pvpRiskEvents } from '@/lib/db/schema'

const adminEmails = new Set((process.env.PVP_ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean))

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.user || !adminEmails.has(session.user.email.toLowerCase())) return NextResponse.json({ error: '无权访问风控面板' }, { status: 403 })
  const limit = Math.min(100, Math.max(1, Number(new URL(request.url).searchParams.get('limit') ?? 50)))
  const events = await db.select({ event: pvpRiskEvents, matchStatus: pvpMatches.status }).from(pvpRiskEvents).leftJoin(pvpMatches, eq(pvpMatches.id, pvpRiskEvents.matchId)).orderBy(desc(pvpRiskEvents.createdAt)).limit(limit)
  return NextResponse.json({ events })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const body = await request.json() as { action?: 'record' | 'ban' | 'unban'; matchId?: string; eventType?: string; severity?: string; metadata?: Record<string, unknown>; userId?: string; reason?: string; banId?: string; expiresAt?: string }
  if (body.action === 'ban' || body.action === 'unban') {
    if (!adminEmails.has(session.user.email.toLowerCase())) return NextResponse.json({ error: '仅管理员可执行封禁操作' }, { status: 403 })
    if (body.action === 'unban' && body.banId) {
      const [ban] = await db.update(pvpBans).set({ status: 'revoked' }).where(eq(pvpBans.id, body.banId)).returning()
      return NextResponse.json({ ban })
    }
    if (!body.userId || !body.reason?.trim()) return NextResponse.json({ error: '封禁对象和原因不能为空' }, { status: 400 })
    const [ban] = await db.insert(pvpBans).values({ id: crypto.randomUUID(), userId: body.userId, adminId: session.user.id, reason: body.reason.trim().slice(0, 500), expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }).returning()
    return NextResponse.json({ ban }, { status: 201 })
  }
  if (!body.matchId || !body.eventType) return NextResponse.json({ error: '风控事件信息不完整' }, { status: 400 })
  const [match] = await db.select({ playerOneId: pvpMatches.playerOneId, playerTwoId: pvpMatches.playerTwoId }).from(pvpMatches).where(eq(pvpMatches.id, body.matchId)).limit(1)
  if (!match || (match.playerOneId !== session.user.id && match.playerTwoId !== session.user.id)) return NextResponse.json({ error: '无权记录此对局事件' }, { status: 403 })
  const eventType = body.eventType.slice(0, 64)
  const severity = ['low', 'medium', 'high'].includes(body.severity ?? '') ? body.severity! : 'low'
  const [event] = await db.insert(pvpRiskEvents).values({ id: crypto.randomUUID(), matchId: body.matchId, userId: session.user.id, eventType, severity, metadata: body.metadata ?? {} }).returning()
  return NextResponse.json({ event }, { status: 201 })
}
