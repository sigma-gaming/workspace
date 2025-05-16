import { BaseLayout } from '../../layouts/base/index.ts'
import { createPage, routes } from '../../routing/index.ts'
import { DepositPageView } from './view.tsx'

export const DepositPage = createPage({
  route: routes.games,
  view: DepositPageView,
  layout: BaseLayout,
})
