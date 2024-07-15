import { GameLayout } from '../../layouts/game/view.tsx'
import { createPage, routes } from '../../routing/index.ts'
import { DiceGamePageView } from './view.tsx'

export const DiceGamePage = createPage({
  title: 'Dice',
  route: routes.diceGame,
  view: DiceGamePageView,
  layout: GameLayout,
})
