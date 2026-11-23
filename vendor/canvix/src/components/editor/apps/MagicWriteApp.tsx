// @ts-nocheck -- vendored from Canvix (MIT). See vendor/canvix/README.md.
'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Plus, RefreshCw, Wand2 } from 'lucide-react'
import { createTextElement } from '@canvix/lib/types'
import { placement } from '../add-element'
import { useEditorStore } from '@canvix/store/editor-store'
import { AppHeader, type AppPanelProps } from './registry'
import { cn } from '@canvix/lib/utils'
import { toast } from '@canvix/hooks/use-toast'

const KINDS = [
  { id: 'headline', label: 'Headline', fontSize: 64, bold: true },
  { id: 'tagline', label: 'Tagline', fontSize: 44, bold: true },
  { id: 'body', label: 'Body', fontSize: 28, bold: false },
  { id: 'social', label: 'Caption', fontSize: 30, bold: false },
] as const

const TONES = ['bold', 'playful', 'elegant', 'minimal', 'corporate', 'warm'] as const

const IDEAS = [
  'A poster for a summer music festival',
  'Instagram caption for a new coffee shop',
  'Headline for an eco-friendly water bottle',
  'Tagline for a fitness app launch',
]

export function MagicWriteApp({ onClose }: AppPanelProps) {
  const addElement = useEditorStore((s) => s.addElement)
  const pages = useEditorStore((s) => s.pages)
  const currentPage = useEditorStore((s) => s.currentPage)
  const width = useEditorStore((s) => s.width)
  const height = useEditorStore((s) => s.height)

  const [prompt, setPrompt] = useState('')
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('tagline')
  const [tone, setTone] = useState<(typeof TONES)[number]>('bold')
  const [options, setOptions] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    if (!prompt.trim() || busy) return
    setBusy(true)
    setError(null)
    setOptions([])
    try {
      const res = await fetch('/api/admin/studio/ai/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, kind, tone }),
      })
      const data = (await res.json()) as { options?: string[]; error?: string }
      if (!res.ok || !data.options) throw new Error(data.error ?? 'Generation failed')
      setOptions(data.options)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setBusy(false)
    }
  }

  const addToCanvas = (text: string) => {
    const preset = KINDS.find((k) => k.id === kind)!
    const pos = placement(Math.min(width * 0.7, 800), preset.fontSize, pages[currentPage].elements.length)
    addElement(
      createTextElement({
        ...pos,
        width: Math.min(width * 0.72, 820),
        height: preset.fontSize * 1.6,
        text,
        fontSize: preset.fontSize,
        bold: preset.bold,
        align: 'center',
      })
    )
    toast({ title: 'Added to canvas' })
  }

  return (
    <div>
      <AppHeader icon={Wand2} title="Magic Write" onClose={onClose} />

      <div
        className="rounded-xl border border-black/10 bg-black/[0.04] focus-within:border-[#7D2AE8] transition-colors p-3 mb-2.5"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
          rows={2}
          maxLength={500}
          placeholder="Describe what you need — e.g. “A poster tagline for a summer music festival”"
          className="w-full bg-transparent outline-none text-[12.5px] text-[#0E1318] resize-none placeholder:text-[#0E1318]/35"
          aria-label="Magic Write prompt"
        />
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              'h-7 rounded-lg text-[10.5px] font-semibold transition-colors',
              kind === k.id ? 'bg-[#7D2AE8] text-white' : 'bg-black/[0.05] text-[#0E1318]/60 hover:text-[#0E1318]'
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap mb-2.5">
        {TONES.map((t) => (
          <button
            key={t}
            onClick={() => setTone(t)}
            className={cn(
              'h-6 px-2.5 rounded-full text-[10px] font-semibold border transition-colors capitalize',
              tone === t ? 'bg-black/[0.16] text-[#0E1318] border-black/25' : 'text-[#0E1318]/55 border-black/10 hover:text-[#0E1318]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={busy || !prompt.trim()}
        className="w-full h-10 rounded-xl bg-gradient-to-r from-[#7D2AE8] to-[#9B6BFF] text-white text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-110 transition-all"
        aria-label="Generate copy"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {busy ? 'Writing…' : 'Generate 3 options'}
      </button>

      {error && (
        <div className="mt-2.5">
          <p className="text-[11px] text-[#FF8095]">{error}</p>
          {/* v0.23.1: text-slot failures often mean "no key" */}
          <p className="text-[10.5px] text-[#0E1318]/45 mt-1 leading-snug">
            Tip: add your own AI key in <span className="text-[#0E1318]/75 font-medium">Profile &amp; AI keys</span> (account menu) — your key is used before this
            instance&apos;s providers.
          </p>
        </div>
      )}

      {options.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-[#0E1318]/60 uppercase tracking-wide">Results</span>
            <button
              onClick={generate}
              className="text-[10px] text-[#0E1318]/50 hover:text-[#0E1318] flex items-center gap-1"
              aria-label="Regenerate"
            >
              <RefreshCw size={10} /> Regenerate
            </button>
          </div>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => addToCanvas(opt)}
              className="group w-full text-left rounded-xl border border-black/10 bg-black/[0.04] hover:border-[#7D2AE8] p-2.5 transition-colors"
              role="button"
              aria-label={`Add option ${i + 1}`}
            >
              <p className="text-[12px] text-[#0E1318]/90 leading-snug">{opt}</p>
              <span className="hidden group-hover:flex items-center gap-1 mt-1.5 text-[10px] font-bold text-[#00C4CC]">
                <Plus size={10} /> Add to canvas
              </span>
            </button>
          ))}
        </div>
      )}

      {options.length === 0 && !busy && !error && (
        <div className="mt-3.5">
          <p className="text-[10.5px] font-bold text-[#0E1318]/60 uppercase tracking-wide mb-1.5">Try asking for…</p>
          <div className="space-y-1">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                onClick={() => setPrompt(idea)}
                className="block w-full text-left text-[11.5px] text-[#0E1318]/55 hover:text-[#0E1318] rounded-lg border border-black/[0.07] hover:border-black/20 px-2.5 py-1.5 transition-colors"
              >
                “{idea}”
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
