import { NextResponse } from 'next/server'
import { and, desc, eq, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpFriendships } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const friendships = await db.select().from(pvpFriendships).where(or(eq(pvpFriendships.requesterId, userId), eq(pvpFriendships.addresseeId, userId))).orderBy(desc(pvpFriendships.updatedAt)).limit(50)
  return NextResponse.json({ friendships })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const body = await request.json() as { intent?: 'request' | 'accept'; friendId?: string; friendshipId?: string }
  if (body.intent === 'request') {
    if (!body.friendId || body.friendId === userId) return NextResponse.json({ error: '好友 ID 无效' }, { status: 400 })
    const [friendship] = await db.insert(pvpFriendships).values({ id: crypto.randomUUID(), requesterId: userId, addresseeId: body.friendId }).returning()
    return NextResponse.json({ friendship }, { status: 201 })
  }
  if (body.intent === 'accept' && body.friendshipId) {
    const [friendship] = await db.update(pvpFriendships).set({ status: 'accepted', updatedAt: new Date() }).where(and(eq(pvpFriendships.id, body.friendshipId), eq(pvpFriendships.addresseeId, userId), eq(pvpFriendships.status, 'pending'))).returning()
    if (!friendship) return NextResponse.json({ error: '好友申请不存在或无权处理' }, { status: 404 })
    return NextResponse.json({ friendship })
  }
  return NextResponse.json({ error: '无效请求' }, { status: 400 })
}
