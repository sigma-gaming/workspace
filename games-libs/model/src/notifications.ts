import { NotificationKind } from '@dbs/games-schema'
import { z } from 'zod'

export const NotificationSchema = z.object({
  expiresAt: z.string(),
  title: z.string(),
  message: z.string(),
  kind: z.nativeEnum(NotificationKind),
  autoClose: z.boolean(),
  autoCloseMs: z.number(),
  withCloseButton: z.boolean(),
  userId: z.string().uuid().optional().nullable(),
})

export function mapColor(kind: NotificationKind = NotificationKind.Info) {
  if (kind === NotificationKind.Warning) return 'orange'
  if (kind === NotificationKind.Success) return 'green'
  if (kind === NotificationKind.Failure) return 'red'
  return 'primary'
}
