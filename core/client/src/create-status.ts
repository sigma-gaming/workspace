import { Effect } from 'effector'
import { status } from 'patronum'

export function createStatus(effect: Effect<any, any, any>) {
  const $status = status(effect)
  const $loading = $status.map((status) => status === 'pending')
  const $succeeded = $status.map((status) => status === 'done')
  const $failed = $status.map((status) => status === 'fail')
  return { $loading, $succeeded, $failed }
}
