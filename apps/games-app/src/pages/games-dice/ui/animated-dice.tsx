import { LoadingOverlay } from '@mantine/core'
import { useUnit } from 'effector-react'
import { lazy, memo, Suspense } from 'react'
import { $$dicePage } from '../model'

export const AnimatedDiceRive = lazy(async () => {
  const { AnimatedDiceRive } = await import('./animated-dice-rive.tsx')
  return { default: AnimatedDiceRive }
})

export const AnimatedDice = memo(() => {
  const loaded = useUnit($$dicePage.$animationLoaded)

  return (
    <div className="w-full h-64">
      <LoadingOverlay
        className="h-full"
        visible={!loaded}
        loaderProps={{ size: 'xl' }}
      />
      <Suspense fallback={null}>
        <AnimatedDiceRive />
      </Suspense>
    </div>
  )
})
