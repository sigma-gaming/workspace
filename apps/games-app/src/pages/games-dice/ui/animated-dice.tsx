import { lazy, memo, Suspense } from 'react'

export const AnimatedDiceRive = lazy(async () => {
  const { AnimatedDiceRive } = await import('./animated-dice-rive.tsx')
  return { default: AnimatedDiceRive }
})

export const AnimatedDice = memo(() => {
  return (
    <div className="w-full h-64">
      <Suspense fallback={null}>
        <AnimatedDiceRive />
      </Suspense>
    </div>
  )
})
