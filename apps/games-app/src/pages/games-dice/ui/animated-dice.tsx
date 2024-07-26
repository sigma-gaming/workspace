import { lazy, memo, Suspense } from 'react'

export const AnimatedDiceRive = lazy(async () => {
  const { AnimatedDiceRive } = await import('./animated-dice-rive.tsx')
  return { default: AnimatedDiceRive }
})

export const AnimatedDice = memo(() => {
  return (
    <Suspense fallback={null}>
      <AnimatedDiceRive />
    </Suspense>
  )
})
