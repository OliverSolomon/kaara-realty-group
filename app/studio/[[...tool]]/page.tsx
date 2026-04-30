'use client'

import NextDynamic from 'next/dynamic'

const Studio = NextDynamic(() => import('./Studio'), { ssr: false })

export const dynamic = 'force-static'

export default function StudioPage() {
  return <Studio />
}
