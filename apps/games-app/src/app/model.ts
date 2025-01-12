import { $$notifications } from '@core/client'
import {
  NotAuthenticatedException,
  SocketRejectionReason,
} from '@core/exceptions'
import { createEffect, createEvent, sample } from 'effector'
import { createBrowserHistory } from 'history'
import Cookies from 'js-cookie'
import { $$affiliate } from '../entities/affiliate'
import { $$audio } from '../entities/audio'
import { $$balance } from '../entities/balance'
import { $$profile } from '../entities/profile'
import { $$session } from '../entities/session'
import { $$user } from '../entities/user'
import { $$maintenance } from '../features/maintenance'
import { $$notificationEvents } from '../features/notification-events'
import { removeQueryParam, router } from '../routing'
import { $$gamesWs } from '../shared/api/games-ws'
import { env } from '../shared/env'
import { $$chatWidget } from '../widgets/chat'

export const started = createEvent()

sample({
  clock: started,
  fn: () => createBrowserHistory(),
  target: router.setHistory,
})

sample({
  clock: started,
  target: [
    $$audio.initialize,
    $$notificationEvents.initialize,
    $$chatWidget.initialize,
    $$maintenance.startChecking,
  ],
})

sample({
  clock: started,
  filter: $$session.$loggedIn,
  target: [
    $$user.request,
    $$profile.request,
    $$balance.request,
    $$affiliate.request,
    $$session.refreshIfExpiringSoon,
  ],
})

sample({
  clock: $$user.failed,
  filter: (exception) => exception instanceof NotAuthenticatedException,
  target: $$session.clientLogout,
})

sample({
  clock: router.$query,
  fn: (query) => query.r,
  filter: (query) => Boolean(query.r),
  target: createEffect((code: string) => {
    Cookies.set('referralCampaign', code, {
      domain: env.domain,
      expires: 365,
    })
  }),
})

sample({
  clock: router.$query,
  filter: (query) => Boolean(query.new),
  target: $$notifications.show.prepend(() => ({
    color: 'green',
    title: 'Новый домен',
    message:
      'Вы были автоматически перенаправлены на новый домен. Используйте его для доступа к сайту.',
    autoClose: 10000,
  })),
})

sample({
  clock: router.$query,
  filter: (query) => Boolean(query.r),
  target: removeQueryParam.prepend(() => 'r'),
})

sample({
  clock: router.$query,
  filter: (query) => Boolean(query.new),
  target: removeQueryParam.prepend(() => 'new'),
})

sample({
  clock: $$gamesWs.rejected,
  filter: (reason) => reason === SocketRejectionReason.TooManyConnections,
  target: $$notifications.show.prepend(() => ({
    color: 'red',
    title: 'Слишком много подключений',
    message:
      'Некоторые функции могут не работать. Закройте лишние вкладки и попробуйте снова',
  })),
})

export const $$app = {
  started,
}
