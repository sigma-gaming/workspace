import clsx from 'clsx'
import { ReactNode } from 'react'
import styles from './styles.module.css'

export type BadgeColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'emerald'
  | 'sky'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'amber'
  | 'fuchsia'
  | 'violet'
  | 'teal'
  | 'lime'

type Props = {
  className?: string
  color?: BadgeColor
  left?: ReactNode
  right?: ReactNode
  children?: ReactNode
}

export const Badge = ({
  className,
  color = 'green',
  left,
  right,
  children,
}: Props) => {
  return (
    <div className={clsx(className, styles.root)} data-color={color}>
      {left}
      {children}
      {right}
    </div>
  )
}
