import { NotificationKind } from '../../../shared/api/control'

export function mapColor(kind: NotificationKind = NotificationKind.Info) {
  if (kind === NotificationKind.Warning) return 'orange'
  if (kind === NotificationKind.Success) return 'green'
  if (kind === NotificationKind.Failure) return 'red'
  return 'primary'
}
