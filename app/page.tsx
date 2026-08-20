'use client'

import dynamic from 'next/dynamic'

const MuleRunShell = dynamic(
  () => import('@/components/mulerun/MuleRunShell').then((mod) => mod.MuleRunShell),
  { ssr: false, loading: () => <div className="center-screen"><div className="loading-spinner" /></div> },
)

export default function Page() {
  return <MuleRunShell />
}
