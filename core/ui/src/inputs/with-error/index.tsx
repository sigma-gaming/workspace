import { FloatingPosition, Popover } from '@mantine/core'
import { ReactNode, useRef } from 'react'
import { createFlipOptions } from '../../lib/popover'
import styles from './styles.module.css'

type Props = {
  error?: string | null
  position?: FloatingPosition
  children: ReactNode
}

export const WithError = ({ error, position, children }: Props) => {
  const lastErrorRef = useRef(error)
  if (error) lastErrorRef.current = error

  return (
    <Popover
      opened={Boolean(error)}
      zIndex={50}
      withArrow
      position={position}
      middlewares={{
        flip: createFlipOptions({
          fallbackPlacements: ['top-end', 'top', 'right', 'bottom'],
        }),
      }}
    >
      <Popover.Target>{children}</Popover.Target>

      <Popover.Dropdown className={styles.error}>
        {lastErrorRef.current}
      </Popover.Dropdown>
    </Popover>
  )
}
