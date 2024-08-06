import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import { routes } from '../../routing'
import diceSrc from './assets/dice.webp'
import pincode from './assets/pincode.webp'

export const GamesPageView = () => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <GameCard route={routes.diceGame} label="Dice" imageSrc={diceSrc} />
      <GameCard route={routes.pincodeGame} label="Pincode" imageSrc={pincode} />
    </div>
  )
}

type GameCardProps = {
  route: RouteInstance<RouteParams>
  label: string
  imageSrc: string
}

const GameCard = ({ route, label, imageSrc }: GameCardProps) => {
  return (
    <Link
      to={route}
      className="relative block w-full h-full aspect-square rounded-2xl overflow-hidden transition-all ease-in-out hover:opacity-90 hover:-translate-y-0.5 bg-[#232337] select-none"
    >
      <img
        src={imageSrc}
        alt={label}
        onError={(event) => (event.currentTarget.style.display = 'none')}
      />
      <div
        className="absolute top-0 left-0 w-full h-full flex items-end px-4 py-3"
        style={{
          background:
            'linear-gradient(to top, rgba(23, 24, 36, 0.75) 7%, rgba(23, 24, 36, 0.25) 50%, transparent 100%)',
        }}
      >
        <span className="text-white font-medium text-xl">{label}</span>
      </div>
    </Link>
  )
}
