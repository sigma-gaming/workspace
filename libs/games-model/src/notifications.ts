import { z } from 'zod'

const NotificationColorSchema = z.enum(['info', 'success', 'warning', 'error'])

export const NotificationContentSchema = z.object({
  title: z.string(),
  message: z.string(),
  color: NotificationColorSchema.optional(),
  autoClose: z.union([z.number(), z.boolean()]).optional(),
  withCloseButton: z.boolean().optional(),
})

export type NotificationContent = z.infer<typeof NotificationContentSchema>
export type NotificationColor = z.infer<typeof NotificationColorSchema>

export function mapColor(kind: NotificationColor = 'info') {
  if (kind === 'warning') return 'orange'
  if (kind === 'success') return 'green'
  if (kind === 'error') return 'red'
  return 'primary'
}
