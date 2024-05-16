import { observable } from '@trpc/server/observable'
import {
  maintenanceEvents,
  MaintenancePublicEvent,
} from '../../events/maintenance'
import { procedure } from '../trpc'

export const subscription = procedure.subscription(() => {
  return observable<MaintenancePublicEvent>((emit) => {
    const { unsubscribe } = maintenanceEvents.subscribePublic((event) => {
      emit.next(event)

      if (event.name === 'started') {
        emit.complete()
      }
    })

    return unsubscribe
  })
})
