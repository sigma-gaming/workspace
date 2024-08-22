import { BaseLayout } from '../../layouts/base/index.ts'
import { createAuthenticatedPage, routes } from '../../routing/index.ts'
import { BonusesPageView } from './view.tsx'

export const BonusesPage = createAuthenticatedPage({
  title: 'Бонусы',
  route: routes.bonuses,
  view: BonusesPageView,
  layout: BaseLayout,
})
