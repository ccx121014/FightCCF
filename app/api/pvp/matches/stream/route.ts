import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pvpActions, pvpMatches } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  const matchId = new URL(request.url).searchParams.get('matchId')
  if (!userId || !matchId) return new Response('未授权或缺少对局 ID', { status: 401 })

  const [match] = await db.select().from(pvpMatches).where(and(eq(pvpMatches.id, matchId), eq(pvpMatches.playerOneId, userId))).limit(1)
  const [ownedMatch] = match ? [match] : await db.select().from(pvpMatches).where(and(eq(pvpMatches.id, matchId), eq(pvpMatches.playerTwoId, userId))).limit(1)
  if (!ownedMatch) return new Response('对局不存在', { status: 404 })

  const encoder = new TextEncoder()
  let closed = false
  let lastSeq = Number(new URL(request.url).searchParams.get('after') ?? 0)
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`))
      const poll = async () => {
        if (closed) return
        try {
          const [current] = await db.select().from(pvpMatches).where(eq(pvpMatches.id, matchId)).limit(1)
          const actions = await db.select().from(pvpActions).where(eq(pvpActions.matchId, matchId)).orderBy(asc(pvpActions.seq))
          const fresh = actions.filter((action) => action.seq > lastSeq)
          if (fresh.length) { lastSeq = fresh[fresh.length - 1].seq; send('actions', fresh) }
          send('snapshot', { match: current, serverTime: Date.now() })
          if (current?.status === 'finished') send('finished', { match: current })
        } catch { send('error', { message: '实时快照暂时不可用' }) }
        if (!closed) setTimeout(poll, 1000)
      }
      send('ready', { matchId })
      void poll()
    },
    cancel() { closed = true },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } })
}
