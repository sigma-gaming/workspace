import { BaseLayout } from '../../layouts/base/index.ts'
import { createPage, routes } from '../../routing/index.ts'
import { AffiliatePageView } from './view.tsx'

export const AffiliatePage = createPage({
  title: 'Партнёрам',
  route: routes.affiliate,
  view: AffiliatePageView,
  layout: BaseLayout,
})
