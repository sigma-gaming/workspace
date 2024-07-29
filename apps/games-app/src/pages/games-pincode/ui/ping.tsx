import { Ping as PingView } from '@core/ui'
import { useUnit } from 'effector-react'
import { $$pincodePage } from '../model'

export const Ping = () => {
  const ping = useUnit($$pincodePage.$ping)
  return <PingView ping={ping} />
}
