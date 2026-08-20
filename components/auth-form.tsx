'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '')
    const password = String(data.get('password') ?? '')
    const name = String(data.get('name') ?? '')
    try {
      const result = isSignUp ? await signUp.email({ email, password, name }) : await signIn.email({ email, password })
      if (result.error) setError(result.error.message ?? (isSignUp ? '注册失败，请稍后重试' : '登录失败，请检查账号密码'))
      else {
        if (isSignUp) {
          const profileResponse = await fetch('/api/game/profile', { cache: 'no-store' })
          if (!profileResponse.ok) throw new Error('GAME_PROFILE_INIT_FAILED')
        }
        router.push('/'); router.refresh()
      }
    } catch (error) {
      console.error('[v0] auth flow failed', error)
      setError(isSignUp ? '注册成功但游戏档案初始化失败，请重新进入大厅' : '登录失败，请检查账号密码')
    } finally { setPending(false) }
  }

  return <main className="grid min-h-screen place-items-center bg-background px-5 py-10"><form onSubmit={submit} className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-sm"><div><p className="font-mono text-xs tracking-[.3em] text-primary">FIGHTCCF ACCESS</p><h1 className="mt-2 text-3xl font-black">{isSignUp ? '创建算法旅者' : '登录算法旅者'}</h1><p className="mt-2 text-sm text-muted-foreground">{isSignUp ? '建立你的竞赛格斗档案。' : '继续你的竞赛格斗进度。'}</p></div>{isSignUp && <label className="flex flex-col gap-2 text-sm font-medium">昵称<input required minLength={2} name="name" autoComplete="name" className="rounded-lg border border-border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>}<label className="flex flex-col gap-2 text-sm font-medium">邮箱<input required type="email" name="email" autoComplete="email" className="rounded-lg border border-border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary" /></label><label className="flex flex-col gap-2 text-sm font-medium">密码<input required minLength={8} type="password" name="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} className="rounded-lg border border-border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={pending} className="rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{pending ? '处理中…' : isSignUp ? '创建账号' : '进入大厅'}</button><p className="text-center text-sm text-muted-foreground">{isSignUp ? '已有账号？' : '还没有账号？'} <Link className="font-semibold text-primary" href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? '立即登录' : '注册账号'}</Link></p></form></main>
}
