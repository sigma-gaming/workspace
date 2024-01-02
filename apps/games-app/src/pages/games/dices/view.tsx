import { Link } from 'atomic-router-react'
import { BaseLayout } from '../../../layouts/base'
import { routes } from '../../../routing'

export const DicesGamePageView = () => {
  return (
    <BaseLayout>
      <Link to={routes.home}>Go to Home</Link>
    </BaseLayout>
  )
}
