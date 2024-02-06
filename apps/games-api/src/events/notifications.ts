import { NotificationsQueuePayload } from '@libs/games-queue'
import { createEvents, internalEvent } from '../shared/lib/events'

const events = {
  received: internalEvent<NotificationsQueuePayload>(),
}

export const notificationsEvents = createEvents(events)
