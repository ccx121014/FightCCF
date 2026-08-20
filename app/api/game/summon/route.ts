import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { gameCharacters, gameProfiles } from '@/lib/db/schema'

const pool = [
  { name: '二分骑士', role: '近战 / 破防', rarity: 'SR', power: 1980 },
  { name: '哈希游侠', role: '远程 / 标记', rarity: 'R', power: 1520 },
  { name: 'DP 圣徒', role: '辅助 / 增益', rarity: 'SSR', power: 2460 },
]

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: '请先登录后进行召唤' }, { status: 401 })
  const cost = 300
  const character = pool[Math.floor(Math.random() * pool.length)]
  try {
    const result = await db.transaction(async (tx) => {
      const [profile] = await tx.select().from(gameProfiles).where(eq(gameProfiles.userId, userId)).limit(1)
      if (!profile) throw new Error('PROFILE_NOT_FOUND')
      if (profile.coins < cost) throw new Error('INSUFFICIENT_COINS')
      const updated = await tx.update(gameProfiles).set({ coins: profile.coins - cost, updatedAt: new Date() }).where(and(eq(gameProfiles.id, profile.id), eq(gameProfiles.userId, userId), eq(gameProfiles.coins, profile.coins))).returning({ coins: gameProfiles.coins })
      if (!updated[0]) throw new Error('RETRY')
      await tx.insert(gameCharacters).values({ id: crypto.randomUUID(), userId, ...character, level: 1 })
      return updated[0]
    })
    return NextResponse.json({ ...character, coins: result.coins, message: `获得：${character.name}` })
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'INSUFFICIENT_COINS') return NextResponse.json({ error: '金币不足' }, { status: 400 })
    if (code === 'PROFILE_NOT_FOUND') return NextResponse.json({ error: '玩家档案尚未初始化' }, { status: 404 })
    return NextResponse.json({ error: '召唤失败，请重试' }, { status: 409 })
  }
}
