import { createEvents, publicEvent, PublicEventOf } from '@core/events'

const events = {
  started: publicEvent<void>(),
}

export const maintenanceEvents = createEvents(events)

export type MaintenancePublicEvent = PublicEventOf<typeof events>
