import { useRive } from '@rive-app/react-canvas'
import { $$dicePage } from '../model'

export const AnimatedStartRive = () => {
  const { RiveComponent } = useRive({
    src: '/games/dice_start.riv',
    autoplay: true,
    onLoad: () => $$dicePage.startLoaded(),
  })

  return <RiveComponent />
}
