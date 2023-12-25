import { Link } from 'atomic-router-react'
import { useUnit } from 'effector-react'
import { routes } from '../../routing'
import { $testPage } from './model'

export const TestPageView = () => {
  const number = useUnit($testPage.$number)

  return (
    <div>
      <h1>Test Page</h1>
      <p>Number: {number}</p>
      <Link to={routes.home}>Home</Link>
    </div>
  )
}
