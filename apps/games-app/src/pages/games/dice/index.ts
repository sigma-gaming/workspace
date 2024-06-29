import { BaseLayout } from '../../../layouts/base/index.ts'
import { createPage, routes } from '../../../routing/index.ts'
import { DiceGamePageView } from './view.tsx'

export const DiceGamePage = createPage({
  route: routes.diceGame,
  view: DiceGamePageView,
  layout: BaseLayout,
})
