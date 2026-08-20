import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { battleRecords, gameProfiles } from '@/lib/db/schema'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { mode?: 'ranked' | 'casual'; victory?: boolean; score?: number; combo?: number }
  const profile = await db.select().from(gameProfiles).where(eq(gameProfiles.userId, userId)).limit(1)
  if (!profile[0]) return NextResponse.json({ error: '玩家档案尚未初始化' }, { status: 404 })
  if (profile[0].energy < 1) return NextResponse.json({ error: '体力不足' }, { status: 400 })
  const victory = body.victory === true
  const score = Math.max(0, Math.min(100, Math.round(body.score ?? 50)))
  const ratingChange = body.mode === 'casual' ? 0 : victory ? 18 + Math.round(score / 10) : -12
  const reward = victory ? 100 + Math.round(score * 2) : 25
  const next = { energy: profile[0].energy - 1, coins: profile[0].coins + reward, xp: profile[0].xp + (victory ? 100 : 25), updatedAt: new Date() }
  await db.update(gameProfiles).set(next).where(and(eq(gameProfiles.id, profile[0].id), eq(gameProfiles.userId, userId)))
  await db.insert(battleRecords).values({ id: crypto.randomUUID(), userId, result: victory ? 'PVP_WIN' : 'PVP_LOSS', reward, score })
  return NextResponse.json({ victory, score, ratingChange, reward, ...next })
}
