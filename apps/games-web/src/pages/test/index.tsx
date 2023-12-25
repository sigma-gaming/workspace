import { createPage } from '@effectify/core/client'
import { routes } from '../../routing'
import { TestPageView } from './page'

export const TestPage = createPage({
  route: routes.test,
  meta: {
    head: () => (
      <>
        <title>Sigma Games - Test</title>
      </>
    ),
  },
  view: {
    render: TestPageView,
  },
})
