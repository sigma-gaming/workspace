import { LazyWrapper } from '@core/ui'
import { Button } from '@mantine/core'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { lazy, memo } from 'react'
import { $$dicePage } from '../model.ts'

const AnimatedDiceRive = lazy(async () => {
  const { AnimatedDiceRive } = await import('./animated-dice-rive.tsx')
  return { default: AnimatedDiceRive }
})

const AnimatedStartRive = lazy(async () => {
  const { AnimatedStartRive } = await import('./animated-start-rive.tsx')
  return { default: AnimatedStartRive }
})

const FailureFallback = () => {
  return (
    <div className="h-full flex flex-col gap-2 items-center justify-center text-center">
      <p className="leading-tight">Не удалось загрузить&nbsp;анимацию</p>
      <p className="text-dimmed text-sm leading-tight">
        Попробуйте еще&nbsp;раз или&nbsp;напишите в&nbsp;поддержку
      </p>
      <Button
        className="mt-2"
        size="xs"
        onClick={() => {
          window.location.reload()
        }}
      >
        Обновить страницу
      </Button>
    </div>
  )
}

export const AnimatedDice = memo(() => {
  const started = useUnit($$dicePage.$started)
  const loading = useUnit($$dicePage.$animationLoading)

  return (
    <div className={clsx('w-full h-64', loading && 'invisible')}>
      <div className={clsx('w-full h-64', started && 'hidden')}>
        <LazyWrapper
          onFailure={$$dicePage.animationFailed}
          failureFallback={<FailureFallback />}
        >
          <AnimatedStartRive />
        </LazyWrapper>
      </div>
      <div className={clsx('w-full h-64', !started && 'hidden')}>
        <LazyWrapper
          onFailure={$$dicePage.animationFailed}
          failureFallback={<FailureFallback />}
        >
          <AnimatedDiceRive />
        </LazyWrapper>
      </div>
    </div>
  )
})
