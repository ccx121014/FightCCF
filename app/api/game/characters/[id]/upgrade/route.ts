import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { gameCharacters, gameProfiles } from '@/lib/db/schema'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const { id } = await params
  const [character] = await db.select().from(gameCharacters).where(and(eq(gameCharacters.id, id), eq(gameCharacters.userId, userId))).limit(1)
  const [profile] = await db.select().from(gameProfiles).where(eq(gameProfiles.userId, userId)).limit(1)
  if (!character || !profile) return NextResponse.json({ error: '角色不存在' }, { status: 404 })
  const cost = character.level * 120
  if (profile.coins < cost) return NextResponse.json({ error: '金币不足' }, { status: 400 })
  const level = character.level + 1
  const power = character.power + 160
  await db.update(gameCharacters).set({ level, power }).where(and(eq(gameCharacters.id, id), eq(gameCharacters.userId, userId)))
  await db.update(gameProfiles).set({ coins: profile.coins - cost, updatedAt: new Date() }).where(and(eq(gameProfiles.id, profile.id), eq(gameProfiles.userId, userId)))
  return NextResponse.json({ character: { ...character, level, power }, coins: profile.coins - cost, cost })
}
