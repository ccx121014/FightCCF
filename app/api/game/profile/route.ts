import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { gameCharacters, gameProfiles } from '@/lib/db/schema'

const preview = { id: 'preview-profile', userId: 'preview', coins: 1280, gems: 120, energy: 5, level: 12, xp: 2840 }

async function currentUser() { const session = await auth.api.getSession({ headers: await headers() }); return session?.user ?? null }

async function load(userId: string) {
  return db.transaction(async (tx) => {
    await tx.insert(gameProfiles).values({ id: crypto.randomUUID(), userId }).onConflictDoNothing({ target: gameProfiles.userId })
    const [profile] = await tx.select().from(gameProfiles).where(eq(gameProfiles.userId, userId)).limit(1)
    if (!profile) throw new Error('PROFILE_INIT_FAILED')
    const characters = await tx.select().from(gameCharacters).where(eq(gameCharacters.userId, userId))
    if (characters.length === 0) {
      await tx.insert(gameCharacters).values([
        { id: crypto.randomUUID(), userId, name: '数组剑士', role: '近战 / 连击', rarity: 'SSR', level: 12, power: 2840 },
        { id: crypto.randomUUID(), userId, name: '递归法师', role: '远程 / 控制', rarity: 'SR', level: 9, power: 2120 },
        { id: crypto.randomUUID(), userId, name: '图论猎手', role: '刺客 / 爆发', rarity: 'R', level: 7, power: 1680 },
      ])
    }
    return { ...(await tx.select().from(gameProfiles).where(eq(gameProfiles.userId, userId)).limit(1))[0], characters: await tx.select().from(gameCharacters).where(eq(gameCharacters.userId, userId)) }
  })
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ ...preview, authenticated: false })
  try { return NextResponse.json({ ...(await load(user.id)), authenticated: true }) }
  catch (error) { console.error('[v0] profile load failed', error); return NextResponse.json({ error: '玩家数据暂时无法读取' }, { status: 503 }) }
}

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: '请先登录后保存进度' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  try {
    const profile = await load(user.id)
    const numberOr = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
    const next = { coins: Math.max(0, Math.floor(numberOr(body.coins, profile.coins))), gems: Math.max(0, Math.floor(numberOr(body.gems, profile.gems))), energy: Math.max(0, Math.min(5, Math.floor(numberOr(body.energy, profile.energy)))), updatedAt: new Date() }
    await db.update(gameProfiles).set(next).where(and(eq(gameProfiles.id, profile.id), eq(gameProfiles.userId, user.id)))
    return NextResponse.json({ ...profile, ...next, authenticated: true })
  } catch (error) { console.error('[v0] profile save failed', error); return NextResponse.json({ error: '暂时无法保存进度' }, { status: 503 }) }
}
