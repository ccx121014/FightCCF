import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpReports } from '@/lib/db/schema'
import { headers } from 'next/headers'

const reasons = new Set(['作弊', '辱骂', '消极比赛', '异常断线', '其他'])

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const body = await request.json() as { matchId?: string; reason?: string; details?: string }
  if (!body.matchId || !body.reason || !reasons.has(body.reason)) return NextResponse.json({ error: '举报信息不完整' }, { status: 400 })
  const [report] = await db.insert(pvpReports).values({ id: crypto.randomUUID(), matchId: body.matchId, reporterId: session.user.id, reason: body.reason, details: (body.details ?? '').slice(0, 500) }).returning({ id: pvpReports.id })
  return NextResponse.json({ report, accepted: true }, { status: 201 })
}
