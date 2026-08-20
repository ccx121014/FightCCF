import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { gameProfiles } from '@/lib/db/schema'

export async function GET() {
  const rows = await db.select({ userId: gameProfiles.userId, xp: gameProfiles.xp, level: gameProfiles.level }).from(gameProfiles).orderBy(desc(gameProfiles.xp)).limit(10)
  return NextResponse.json(rows.map((row, index) => ({ rank: index + 1, name: `算法旅者_${row.userId.slice(-3)}`, score: row.xp * 4 + row.level * 100, level: row.level })))
}
