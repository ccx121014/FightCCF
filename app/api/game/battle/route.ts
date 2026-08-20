import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { battleRecords, gameProfiles } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: '请先登录后开始战斗' }, { status: 401 })
  const profile = await db.select().from(gameProfiles).where(eq(gameProfiles.userId, userId)).limit(1)
  if (!profile[0]) return NextResponse.json({ error: '玩家档案尚未初始化' }, { status: 404 })
  if (profile[0].energy < 1) return NextResponse.json({ error: '体力不足，请稍后再来' }, { status: 400 })
  const payload = await request.json().catch(() => ({})) as { victory?: boolean; rating?: string; timeUsed?: number; maxCombo?: number; score?: number }
  const victory = payload.victory !== false
  const rating = payload.rating ?? (victory ? 'B' : 'C')
  const score = Math.max(0, Math.round(payload.score ?? (victory ? 60 : 0)))
  const reward = victory ? Math.round(120 + Math.min(180, score * 1.2)) : 30
  const xp = victory ? Math.round(80 + score * 0.7) : 20
  const next = { energy: profile[0].energy - 1, coins: profile[0].coins + reward, xp: profile[0].xp + xp, updatedAt: new Date() }
  await db.update(gameProfiles).set(next).where(and(eq(gameProfiles.id, profile[0].id), eq(gameProfiles.userId, userId)))
  await db.insert(battleRecords).values({ id: crypto.randomUUID(), userId, result: victory ? rating : 'C', reward, score })
  return NextResponse.json({ ...next, reward, xp, rating, score, message: victory ? `战斗胜利，评级 ${rating}` : '战斗失败，获得参与奖励' })
}
