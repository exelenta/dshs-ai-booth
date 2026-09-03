import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Step = {
  id: number
  label: string
}

export function StepIndicator({
  steps,
  current,
}: {
  steps: Step[]
  current: number
}) {
  return (
    <ol className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => {
        const isDone = step.id < current
        const isActive = step.id === current
        return (
          <li key={step.id} className="flex items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 shadow-sm',
                  isDone &&
                    'border border-amber-300 bg-amber-400 text-white',
                  isActive &&
                    'scale-110 border-2 border-amber-500 bg-amber-500 text-white ring-4 ring-amber-400/20',
                  !isDone &&
                    !isActive &&
                    'border border-stone-200 bg-white/80 text-stone-400',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.id}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-semibold transition-colors sm:block',
                  isActive ? 'text-amber-800' : 'text-stone-500',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'mb-5 h-1 w-6 rounded-full transition-colors duration-300 sm:w-10',
                  isDone ? 'bg-amber-400' : 'bg-stone-200',
                )}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
