import { Link } from 'atomic-router-react'
import { routes } from '../../routing'

export const TestPage = () => {
  return <Link to={routes.home}>Home</Link>
}
