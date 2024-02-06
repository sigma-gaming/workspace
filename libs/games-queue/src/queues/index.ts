import { RMQ } from '../rmq'
import { createNotificationsQueue } from './notifications'

export function createQueues(rmq: RMQ) {
  return {
    notifications: createNotificationsQueue(rmq),
  }
}
