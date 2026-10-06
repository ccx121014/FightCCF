import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpRatings } from '@/lib/db/schema'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const [rating] = await db.select().from(pvpRatings).where(eq(pvpRatings.userId, session.user.id)).limit(1)
  return NextResponse.json({
    season: rating?.season ?? 'S1',
    rating: rating?.rating ?? 1200,
    wins: rating?.wins ?? 0,
    losses: rating?.losses ?? 0,
    nextReward: rating && rating.rating >= 1500 ? '赛季精英补给箱' : '赛季参与奖励',
  })
}
