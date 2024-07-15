import { LoadingOverlay } from '@mantine/core'
import { useRive } from '@rive-app/react-canvas'
import { useUnit } from 'effector-react'
import { memo, useEffect } from 'react'
import { $$dicePage } from '../model'

export const AnimatedDice = memo(() => {
  const loaded = useUnit($$dicePage.$animationLoaded)

  const { rive, RiveComponent } = useRive({
    src: '/games/dice.riv',
    onLoad: () => $$dicePage.animationLoaded(),
    onPlay: () => $$dicePage.animationStarted(),
    onStop: () => $$dicePage.animationFinished(),
  })

  useEffect(() => {
    $$dicePage.riveChanged(rive)
  }, [rive])

  return (
    <div className="w-full">
      <LoadingOverlay
        className="h-full"
        visible={!loaded}
        loaderProps={{ size: 'xl' }}
      />
      <RiveComponent className="h-64" />
    </div>
  )
})
