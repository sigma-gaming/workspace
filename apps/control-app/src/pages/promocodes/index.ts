import { BaseLayout } from '../../layouts/base'
import { createPage, routes } from '../../routing/index.ts'
import { PromocodesPageView } from './view.tsx'

export const PromocodesPage = createPage({
  route: routes.promocodes,
  view: PromocodesPageView,
  layout: BaseLayout,
})
