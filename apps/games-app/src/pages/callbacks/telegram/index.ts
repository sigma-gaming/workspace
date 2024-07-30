import './model.ts'
import { CenteredLayout } from '../../../layouts/centered'
import { createPage, routes } from '../../../routing'
import { TelegramCallbackPageView } from './view.tsx'

export const TelegramCallbackPage = createPage({
  title: 'Telegram',
  route: routes.telegramCallback,
  view: TelegramCallbackPageView,
  layout: CenteredLayout,
})
