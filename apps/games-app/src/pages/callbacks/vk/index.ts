import './model.ts'
import { CenteredLayout } from '../../../layouts/centered'
import { createPage, routes } from '../../../routing'
import { VkCallbackPageView } from './view.tsx'

export const VkCallbackPage = createPage({
  route: routes.vkCallback,
  view: VkCallbackPageView,
  layout: CenteredLayout,
})
