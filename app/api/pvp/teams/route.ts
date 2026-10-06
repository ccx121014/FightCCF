import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpTeamInvites, pvpTeamMembers, pvpTeams } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const memberships = await db.select({ team: pvpTeams, role: pvpTeamMembers.role }).from(pvpTeamMembers).innerJoin(pvpTeams, eq(pvpTeams.id, pvpTeamMembers.teamId)).where(eq(pvpTeamMembers.userId, userId))
  const invites = await db.select({ invite: pvpTeamInvites, team: pvpTeams }).from(pvpTeamInvites).innerJoin(pvpTeams, eq(pvpTeams.id, pvpTeamInvites.teamId)).where(and(eq(pvpTeamInvites.inviteeId, userId), eq(pvpTeamInvites.status, 'pending')))
  return NextResponse.json({ memberships, invites })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const body = await request.json() as { intent?: string; name?: string; tag?: string; teamId?: string; inviteeId?: string; inviteId?: string }
  if (body.intent === 'create') {
    const name = body.name?.trim().slice(0, 32)
    const tag = body.tag?.trim().toUpperCase().slice(0, 5)
    if (!name || !tag) return NextResponse.json({ error: '请输入战队名称和标签' }, { status: 400 })
    const teamId = crypto.randomUUID()
    const [team] = await db.insert(pvpTeams).values({ id: teamId, name, tag, ownerId: userId }).returning()
    await db.insert(pvpTeamMembers).values({ id: crypto.randomUUID(), teamId, userId, role: 'owner' })
    return NextResponse.json({ team }, { status: 201 })
  }
  if (body.intent === 'invite') {
    if (!body.teamId || !body.inviteeId) return NextResponse.json({ error: '缺少战队或玩家' }, { status: 400 })
    const [membership] = await db.select().from(pvpTeamMembers).where(and(eq(pvpTeamMembers.teamId, body.teamId), eq(pvpTeamMembers.userId, userId))).limit(1)
    if (!membership || membership.role !== 'owner') return NextResponse.json({ error: '只有队长可以邀请成员' }, { status: 403 })
    const [invite] = await db.insert(pvpTeamInvites).values({ id: crypto.randomUUID(), teamId: body.teamId, inviterId: userId, inviteeId: body.inviteeId, expiresAt: new Date(Date.now() + 7 * 86400000) }).returning()
    return NextResponse.json({ invite }, { status: 201 })
  }
  if (body.intent === 'accept') {
    if (!body.inviteId) return NextResponse.json({ error: '缺少邀请' }, { status: 400 })
    const [invite] = await db.select().from(pvpTeamInvites).where(and(eq(pvpTeamInvites.id, body.inviteId), eq(pvpTeamInvites.inviteeId, userId), eq(pvpTeamInvites.status, 'pending'))).limit(1)
    if (!invite || invite.expiresAt < new Date()) return NextResponse.json({ error: '邀请已过期' }, { status: 410 })
    await db.insert(pvpTeamMembers).values({ id: crypto.randomUUID(), teamId: invite.teamId, userId, role: 'member' })
    await db.update(pvpTeamInvites).set({ status: 'accepted' }).where(eq(pvpTeamInvites.id, invite.id))
    return NextResponse.json({ accepted: true })
  }
  return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
}
