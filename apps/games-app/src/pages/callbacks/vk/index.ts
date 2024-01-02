import './model.ts'
import { routes } from '../../../routing'
import { RouteRecord } from '../../../routing/types.ts'
import { VkCallbackPageView } from './view.tsx'

export const VkCallbackRoute: RouteRecord = {
  route: routes.vkCallback,
  view: VkCallbackPageView,
}
