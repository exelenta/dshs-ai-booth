'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Retro camera-styled viewfinder. Renders its children (video / image / status)
 * inside a warm faux-leather + brushed-metal border with a top control strip.
 */
export function WebcamFrame({
  children,
  recording = false,
  className,
}: {
  children: ReactNode
  recording?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative rounded-[1.75rem] p-3 shadow-xl',
        'bg-[oklch(0.42_0.05_45)]',
        'ring-1 ring-[oklch(0.3_0.04_45)]',
        className,
      )}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, oklch(0.44 0.05 45) 0 6px, oklch(0.4 0.05 45) 6px 12px)',
      }}
    >
      {/* top control strip */}
      <div className="mb-3 flex items-center justify-between rounded-full bg-[oklch(0.32_0.04_45)] px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              recording
                ? 'animate-pulse bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                : 'bg-[oklch(0.55_0.05_45)]',
            )}
            aria-hidden="true"
          />
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-[oklch(0.82_0.03_60)]">
            {recording ? 'Live' : 'Standby'}
          </span>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-6 rounded-full bg-[oklch(0.5_0.05_45)]" />
          <span className="h-1.5 w-3 rounded-full bg-[oklch(0.5_0.05_45)]" />
        </div>
      </div>

      {/* lens / viewport */}
      <div className="relative overflow-hidden rounded-[1.25rem] bg-[oklch(0.2_0.02_250)] ring-2 ring-[oklch(0.28_0.04_45)]">
        <div className="aspect-[4/3] w-full">{children}</div>
        {/* corner brackets */}
        {['left-3 top-3 border-l-2 border-t-2', 'right-3 top-3 border-r-2 border-t-2', 'left-3 bottom-3 border-l-2 border-b-2', 'right-3 bottom-3 border-r-2 border-b-2'].map(
          (pos) => (
            <span
              key={pos}
              className={cn(
                'pointer-events-none absolute h-5 w-5 rounded-[2px] border-white/70',
                pos,
              )}
              aria-hidden="true"
            />
          ),
        )}
      </div>

      {/* bottom label */}
      <div className="mt-3 flex items-center justify-center">
        <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-[oklch(0.78_0.03_60)]">
          Spirited Booth · Model GB-88
        </span>
      </div>
    </div>
  )
}
