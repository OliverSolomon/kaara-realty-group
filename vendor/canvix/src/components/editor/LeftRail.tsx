// @ts-nocheck -- vendored from Canvix (MIT). See vendor/canvix/README.md.
'use client'

import { useMemo } from 'react'
import { LayoutTemplate, Shapes, Type, Upload, Palette, Layers, Wrench, FolderOpen, LayoutGrid, BookMarked, Image, Video, AudioLines } from 'lucide-react'
import { useEditorStore, type PanelId } from '@canvix/store/editor-store'
import { cn } from '@canvix/lib/utils'
import { useIsMobile } from '@canvix/hooks/use-mobile'
import { useStockVideo } from '@canvix/hooks/use-stock-video'
import { Tip } from './tooltip'

/** Canva-2026 rail: up to 10 tabs (72×72), 72px wide — Templates / Elements / Text / Brand / Uploads / Photos / Videos / Tools / Projects / Apps.
 *  Videos (v0.15 R6) is provider-gated: the tab is rendered only when
 *  /api/admin/studio/stock-video/available says the instance has a stock-video key —
 *  no provider = feature hidden, everything else works (the F2b pattern). */
const PANELS: { id: Exclude<PanelId, null>; label: string; icon: typeof LayoutTemplate }[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'brand', label: 'Brand', icon: BookMarked },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'photos', label: 'Photos', icon: Image },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'audio', label: 'Audio', icon: AudioLines },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'apps', label: 'Apps', icon: LayoutGrid },
]

export function LeftRail({ vertical = true }: { vertical?: boolean }) {
  const panel = useEditorStore((s) => s.panel)
  const setPanel = useEditorStore((s) => s.setPanel)
  void useIsMobile()

  // v0.15 (R6): fail-closed visibility — the probe starts false, so an
  // unkeyed instance never flashes the tab; a keyed instance reveals it
  // once the (cached, module-level) answer lands
  const stockVideo = useStockVideo()
  const panels = useMemo(
    () => PANELS.filter((p) => !['brand', 'photos', 'videos', 'audio', 'apps'].includes(p.id)),
    [stockVideo.available],
  )

  return (
    <nav
      className={cn(
        'bg-[#1D1F26] shrink-0 z-30 border-r border-white/[0.06]',
        vertical ? 'w-[72px] flex flex-col items-center pt-1 gap-0.5' : 'flex items-center justify-around px-2 h-14 overflow-x-auto cv-scroll-dark'
      )}
      aria-label="Editor tools"
    >
      {panels.map((p) => {
        const active = panel === p.id
        return (
          <Tip key={p.id} label={p.label} side={vertical ? 'right' : 'top'}>
            <button
              onClick={() => setPanel(p.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors text-white/60 hover:text-white',
                vertical ? 'w-[72px] h-[72px] rounded-2xl' : 'w-16 h-11 shrink-0 rounded-xl',
                active && 'bg-[#2A2C35] text-white'
              )}
              aria-label={p.label}
              aria-pressed={active}
            >
              <p.icon size={22} strokeWidth={active ? 2.2 : 1.9} />
              <span className="text-[10px] font-medium leading-none">{p.label}</span>
            </button>
          </Tip>
        )
      })}
    </nav>
  )
}

void Palette
void Layers
