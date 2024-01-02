import { routes } from '../../routing'
import { RouteRecord } from '../../routing/types.ts'
import { TelegramRedirectPageView } from './view.tsx'

export const TelegramRedirectRoute: RouteRecord = {
  route: routes.telegramRedirect,
  view: TelegramRedirectPageView,
}
