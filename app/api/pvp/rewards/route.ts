import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpRatings, pvpSeasonRewards } from '@/lib/db/schema'

const SEASON = 'S1'

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const [rating] = await db.select().from(pvpRatings).where(eq(pvpRatings.userId, user.id)).limit(1)
  const wins = rating?.wins ?? 0
  const rewardKey = wins >= 10 ? 'season-participation' : null
  const [reward] = rewardKey ? await db.select().from(pvpSeasonRewards).where(and(eq(pvpSeasonRewards.userId, user.id), eq(pvpSeasonRewards.season, SEASON), eq(pvpSeasonRewards.rewardKey, rewardKey))).limit(1) : []
  return NextResponse.json({ season: SEASON, reward: reward ?? (rewardKey ? { rewardKey, status: 'available' } : null), eligible: Boolean(rewardKey) })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const [rating] = await db.select().from(pvpRatings).where(eq(pvpRatings.userId, user.id)).limit(1)
  if ((rating?.wins ?? 0) < 10) return NextResponse.json({ error: '完成 10 场胜利后才可领取赛季奖励' }, { status: 409 })
  const rewardKey = 'season-participation'
  const [existing] = await db.select().from(pvpSeasonRewards).where(and(eq(pvpSeasonRewards.userId, user.id), eq(pvpSeasonRewards.season, SEASON), eq(pvpSeasonRewards.rewardKey, rewardKey))).limit(1)
  if (existing?.status === 'claimed') return NextResponse.json({ reward: existing, alreadyClaimed: true })
  const reward = existing ? (await db.update(pvpSeasonRewards).set({ status: 'claimed', claimedAt: new Date() }).where(eq(pvpSeasonRewards.id, existing.id)).returning())[0] : (await db.insert(pvpSeasonRewards).values({ id: crypto.randomUUID(), userId: user.id, season: SEASON, rewardKey, status: 'claimed', claimedAt: new Date() }).returning())[0]
  return NextResponse.json({ reward, claimed: true })
}
