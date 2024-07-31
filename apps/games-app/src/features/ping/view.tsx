import { Ping } from '@core/ui'
import { useUnit } from 'effector-react'
import { $$ping } from './model'

const PingView = () => {
  const ping = useUnit($$ping.$ping)
  return <Ping ping={ping} />
}

export { PingView as Ping }
