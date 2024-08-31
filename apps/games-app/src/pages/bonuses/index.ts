import { BaseLayout } from '../../layouts/base/index.ts'
import { createPage, routes } from '../../routing/index.ts'
import { BonusesPageView } from './view.tsx'

export const BonusesPage = createPage({
  title: 'Бонусы',
  route: routes.bonuses,
  view: BonusesPageView,
  layout: BaseLayout,
})
