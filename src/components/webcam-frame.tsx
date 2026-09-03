'use client'

import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Modern Polaroid Magic Frame.
 * Replaces the heavy skeuomorphic brown frame with a clean, soft white bordered container
 * with rounded corners (border-radius: 24px), subtle warm shadows, and a friendly status indicator.
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
        'relative rounded-[24px] bg-white p-3 md:p-4 shadow-xl shadow-stone-400/20 border-2 border-amber-100/60 transition-all',
        className,
      )}
    >
      {/* Top Status Strip */}
      <div className="mb-2.5 flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-all',
              recording
                ? 'animate-pulse bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'bg-emerald-400',
            )}
            aria-hidden="true"
          />
          <span className="text-xs font-bold text-stone-600 tracking-wide">
            {recording ? '카메라 촬영 준비 완료' : '사진 확인'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-500/80 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>마법 렌즈</span>
        </div>
      </div>

      {/* Lens / Viewport Container with Soft Rounded Corners */}
      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-b from-amber-50/50 via-rose-50/30 to-amber-50/50 ring-1 ring-stone-200/70 shadow-inner">
        <div className="aspect-[4/3] w-full">{children}</div>
      </div>

      {/* Bottom Friendly Note */}
      <div className="mt-2.5 flex items-center justify-center">
        <span className="text-[0.75rem] font-medium text-stone-400">
          ✨ 가족과 함께 행복한 표정을 지어보세요 ✨
        </span>
      </div>
    </div>
  )
}
