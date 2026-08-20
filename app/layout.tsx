import { Analytics } from '@vercel/analytics/next'
import { Noto_Sans_SC, Geist_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'

const notoSans = Noto_Sans_SC({ subsets: ['latin'], variable: '--font-noto-sans-sc' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
import './globals.css'
import './mulerun.css'

export const metadata: Metadata = {
  title: 'FightCCF｜算法竞赛格斗场',
  description: '让算法成为你的武器。进入 FightCCF，训练、收集角色并挑战算法领域。',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#121522',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${notoSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
