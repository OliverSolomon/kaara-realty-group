// @ts-nocheck -- vendored from Canvix (MIT). See vendor/canvix/README.md.
'use client'

import { create } from 'zustand'
import type { DesignRecord } from '@canvix/lib/types'
import { designPath, replaceUrl } from '@canvix/lib/design-url'

export type AppView = 'landing' | 'dashboard' | 'editor'

interface AppStore {
  view: AppView
  /** design to open in the editor (already fetched) */
  pendingDesign: DesignRecord | null
  goLanding: () => void
  goDashboard: () => void
  openEditor: (design: DesignRecord) => void
}

export const useAppStore = create<AppStore>((set) => ({
  view: 'landing',
  pendingDesign: null,
  // v0.11.4: the address bar follows the view — the editor lives at
  // /design/<id>, everything else resets to /. replaceState (not push)
  // because popstate is not routed in this SPA shell.
  goLanding: () => {
    set({ view: 'landing' })
    window.location.assign('/admin/design')
  },
  goDashboard: () => {
    set({ view: 'dashboard' })
    window.location.assign('/admin/design')
  },
  openEditor: (design) => {
    set({ view: 'editor', pendingDesign: design })
    if (design?.id) replaceUrl(designPath(design.id))
  },
}))
