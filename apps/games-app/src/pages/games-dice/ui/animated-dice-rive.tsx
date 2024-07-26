import { useRive } from '@rive-app/react-canvas'
import { useEffect } from 'react'
import { $$dicePage } from '../model'

export const AnimatedDiceRive = () => {
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
    <div className="w-full h-full max-h-64">
      <RiveComponent />
    </div>
  )
}
