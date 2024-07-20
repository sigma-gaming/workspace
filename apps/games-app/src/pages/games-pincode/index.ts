import { GameLayout } from '../../layouts/game/view.tsx'
import { createPage, routes } from '../../routing/index.ts'
import { PincodeGamePageView } from './view.tsx'

export const PincodeGamePage = createPage({
  title: 'Pincode',
  route: routes.pincodeGame,
  view: PincodeGamePageView,
  layout: GameLayout,
})
