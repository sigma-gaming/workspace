import './model.ts'
import { createPage } from '@effectify/core/client'
import { routes } from '../../routing'
import { HomePageView } from './page'

export const HomePage = createPage({
  route: routes.home,
  meta: {
    head: () => (
      <>
        <title>Sigma Games - Home</title>
      </>
    ),
  },
  view: {
    render: HomePageView,
  },
  cache: {
    key: (params) => JSON.stringify(params),
    ttl: 120,
  },
})
