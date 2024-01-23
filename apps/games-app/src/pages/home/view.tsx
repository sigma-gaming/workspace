import { Link } from 'atomic-router-react'
import { routes } from '../../routing'

export const HomePageView = () => {
  return <Link to={routes.dicesGame}>DICES</Link>
}
