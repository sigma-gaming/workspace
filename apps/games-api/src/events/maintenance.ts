import { createEvents, publicEvent, PublicEventOf } from '@libs/events'

const events = {
  started: publicEvent<void>(),
}

export const maintenanceEvents = createEvents(events)

export type MaintenancePublicEvent = PublicEventOf<typeof events>
