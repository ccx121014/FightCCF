import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pvpRatings, user } from '@/lib/db/schema'

export async function GET() {
  const rows = await db
    .select({ userId: pvpRatings.userId, username: user.name, rating: pvpRatings.rating, wins: pvpRatings.wins, losses: pvpRatings.losses, season: pvpRatings.season })
    .from(pvpRatings)
    .innerJoin(user, eq(user.id, pvpRatings.userId))
    .orderBy(desc(pvpRatings.rating), desc(pvpRatings.wins))
    .limit(50)

  return NextResponse.json({ season: 'S1', leaderboard: rows })
}
