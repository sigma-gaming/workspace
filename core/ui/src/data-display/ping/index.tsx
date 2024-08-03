import { useRef } from 'react'
import { useLazyAnimate } from '../../animations'
import { Icons } from '../../general/icons'
import { Badge } from '../badge'

function calculateLevel(ping: number) {
  if (ping >= 300) return 1
  if (ping >= 200) return 2
  if (ping >= 100) return 3
  return 4
}

function getBadgeColor(level: 1 | 2 | 3 | 4) {
  if (level === 1) return 'red'
  if (level === 2) return 'orange'
  if (level === 3) return 'yellow'
  return 'green'
}

type Props = {
  ping: number
}

export const Ping = ({ ping }: Props) => {
  if (ping === -1) return null
  return <LoadedPing ping={ping} />
}

const LoadedPing = ({ ping }: Props) => {
  const nodeRef = useRef<HTMLSpanElement>(null)

  useLazyAnimate(ping, {
    duration: 0.5,
    onUpdate: () => {
      return (ping) => {
        const node = nodeRef.current
        if (!node) return
        node.textContent = `${Math.ceil(ping)} ms`
      }
    },
  })

  const level = calculateLevel(ping)
  const color = getBadgeColor(level)

  return (
    <Badge
      color={color}
      right={
        <Icons.Connection
          className="shrink-0"
          level={level}
          width={14}
          height={14}
        />
      }
    >
      <span ref={nodeRef} />
    </Badge>
  )
}
