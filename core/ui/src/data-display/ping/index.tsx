import { useRef } from 'react'
import { useLazyAnimate } from '../../animations'
import { Icons } from '../../general/icons'
import styles from './styles.module.css'

function calculateLevel(ping: number) {
  if (ping >= 300) return 1
  if (ping >= 200) return 2
  if (ping >= 100) return 3
  return 4
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

  return (
    <div className={styles.root} data-level={level}>
      <span ref={nodeRef} />
      <Icons.Wifi level={level} width={12} height={12} />
    </div>
  )
}
