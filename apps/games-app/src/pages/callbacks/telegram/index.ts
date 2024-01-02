import './model.ts'
import { routes } from '../../../routing'
import { RouteRecord } from '../../../routing/types.ts'
import { TelegramCallbackPageView } from './view.tsx'

export const TelegramCallbackRoute: RouteRecord = {
  route: routes.telegramCallback,
  view: TelegramCallbackPageView,
}
