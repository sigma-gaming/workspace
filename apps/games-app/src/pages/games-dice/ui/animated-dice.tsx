import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { lazy, memo, Suspense } from 'react'
import { $$dicePage } from '../model.ts'

const AnimatedDiceRive = lazy(async () => {
  const { AnimatedDiceRive } = await import('./animated-dice-rive.tsx')
  return { default: AnimatedDiceRive }
})

const AnimatedStartRive = lazy(async () => {
  const { AnimatedStartRive } = await import('./animated-start-rive.tsx')
  return { default: AnimatedStartRive }
})

export const AnimatedDice = memo(() => {
  const started = useUnit($$dicePage.$started)
  const loaded = useUnit($$dicePage.$animationLoaded)

  return (
    <div className={clsx('w-full h-64', !loaded && 'invisible')}>
      <div className={clsx('w-full h-64', started && 'hidden')}>
        <Suspense fallback={null}>
          <AnimatedStartRive />
        </Suspense>
      </div>
      <div className={clsx('w-full h-64', !started && 'hidden')}>
        <Suspense fallback={null}>
          <AnimatedDiceRive />
        </Suspense>
      </div>
    </div>
  )
})
