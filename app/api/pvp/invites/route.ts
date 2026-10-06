import { NextResponse } from 'next/server'
import { and, desc, eq, gt } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpInvites, pvpMatches } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

function code() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const invites = await db.select().from(pvpInvites).where(and(eq(pvpInvites.recipientId, userId), eq(pvpInvites.status, 'pending'), gt(pvpInvites.expiresAt, new Date()))).orderBy(desc(pvpInvites.createdAt)).limit(20)
  return NextResponse.json({ invites })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const body = await request.json() as { intent?: 'create' | 'join'; matchId?: string; inviteCode?: string; recipientId?: string }
  if (body.intent === 'create') {
    const matchId = crypto.randomUUID()
    const inviteCode = code()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    const [match] = await db.insert(pvpMatches).values({ id: matchId, playerOneId: userId, inviteCode }).returning()
    const [invite] = await db.insert(pvpInvites).values({ id: crypto.randomUUID(), matchId, senderId: userId, recipientId: body.recipientId || null, inviteCode, expiresAt }).returning()
    return NextResponse.json({ match, invite }, { status: 201 })
  }
  if (body.intent === 'join') {
    const inviteCode = body.inviteCode?.trim().toUpperCase()
    if (!inviteCode || !/^[A-Z0-9]{8}$/.test(inviteCode)) return NextResponse.json({ error: '邀请码格式不正确' }, { status: 400 })
    const [invite] = await db.select().from(pvpInvites).where(and(eq(pvpInvites.inviteCode, inviteCode), eq(pvpInvites.status, 'pending'), gt(pvpInvites.expiresAt, new Date()))).limit(1)
    if (!invite || invite.senderId === userId) return NextResponse.json({ error: '邀请码无效或不能加入自己的房间' }, { status: 404 })
    if (invite.recipientId && invite.recipientId !== userId) return NextResponse.json({ error: '这是发给其他玩家的邀请' }, { status: 403 })
    const [match] = await db.update(pvpMatches).set({ playerTwoId: userId, status: 'ready', updatedAt: new Date() }).where(and(eq(pvpMatches.id, invite.matchId), eq(pvpMatches.status, 'waiting'))).returning()
    if (!match) return NextResponse.json({ error: '房间已开始或已满员' }, { status: 409 })
    await db.update(pvpInvites).set({ status: 'accepted' }).where(eq(pvpInvites.id, invite.id))
    return NextResponse.json({ match })
  }
  return NextResponse.json({ error: '无效请求' }, { status: 400 })
}
