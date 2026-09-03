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
                  'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300',
                  isDone &&
                    'border-amber-400 bg-amber-400 text-white',
                  isActive &&
                    'scale-110 border-primary bg-primary text-white ring-4 ring-primary/20',
                  !isDone &&
                    !isActive &&
                    'border-white/40 bg-white/20 text-white/70',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check className="h-4 w-4" /> : step.id}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-medium transition-colors sm:block',
                  isActive ? 'text-white' : 'text-white/60',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'mb-5 h-0.5 w-6 rounded-full transition-colors duration-300 sm:w-12',
                  isDone ? 'bg-amber-400' : 'bg-white/25',
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
