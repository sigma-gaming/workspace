import z from 'zod'
import { createQueue } from '../queue'
import { RMQ } from '../rmq'

export const NotificationTargetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('personal'),
    userId: z.string(),
  }),
  z.object({
    type: z.literal('global'),
  }),
])

export const NotificationContentSchema = z.object({
  title: z.string(),
  message: z.string(),
  color: z.enum(['info', 'success', 'warning', 'error']).optional(),
  autoClose: z.union([z.number(), z.boolean()]).optional(),
  withCloseButton: z.boolean().optional(),
})

export type NotificationsQueuePayload = {
  target: z.infer<typeof NotificationTargetSchema>
  content: z.infer<typeof NotificationContentSchema>
}

export type NotificationsQueueOutput = {
  sent: boolean
}

export function createNotificationsQueue(rmq: RMQ) {
  return createQueue<NotificationsQueuePayload, NotificationsQueueOutput>(rmq, {
    name: 'notifications',
  })
}
