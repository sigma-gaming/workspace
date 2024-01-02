import { Link } from 'atomic-router-react'
import { BaseLayout } from '../../layouts/base'
import { routes } from '../../routing'

export const HomePageView = () => {
  return (
    <BaseLayout>
      <Link to={routes.settings}>Test</Link>
    </BaseLayout>
  )
}
