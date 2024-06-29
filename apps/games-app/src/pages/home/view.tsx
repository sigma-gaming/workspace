import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import { routes } from '../../routing'
import diceSrc from './assets/dice.png'
import pincode from './assets/pincode.png'

export const HomePageView = () => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <GameCard route={routes.diceGame} label="Dice" imageSrc={diceSrc} />
      <GameCard route={routes.diceGame} label="Pincode" imageSrc={pincode} />
    </div>
  )
}

interface GameCardProps {
  route: RouteInstance<RouteParams>
  label: string
  imageSrc: string
}

const GameCard = ({ route, label, imageSrc }: GameCardProps) => {
  return (
    <Link
      to={route}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        height: '100%',
        minHeight: 80,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <img src={imageSrc} alt={label} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '12px 16px',
          background:
            'linear-gradient(to top, rgba(23, 24, 36, 0.75) 7%, rgba(23, 24, 36, 0.25) 50%, transparent 100%)',
        }}
      >
        <span className="text-white font-interface font-[500] text-xl">
          {label}
        </span>
      </div>
    </Link>
  )
}
