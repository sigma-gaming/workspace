import clsx from 'clsx'
import { ReactNode } from 'react'
import styles from './styles.module.css'

const Root = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => {
  return <table className={clsx(styles.table, className)}>{children}</table>
}

const Head = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => {
  return <thead className={className}>{children}</thead>
}

const Body = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => {
  return <tbody className={className}>{children}</tbody>
}

const Row = ({
  className,
  children,
  animated = false,
}: {
  className?: string
  animated?: boolean
  children: ReactNode
}) => {
  return (
    <tr className={clsx(className, styles.row)} data-animated={animated}>
      {children}
    </tr>
  )
}

export type TableCellTextColor = 'default' | 'primary' | 'success' | 'failure'

const Cell = ({
  className: extraClassName,
  as = 'td',
  children,
  textSize = as === 'th' ? 'xs' : 'sm',
  textColor = 'default',
  align = 'left',
  hidden = false,
}: {
  as?: 'th' | 'td'
  className?: string
  children?: ReactNode
  textSize?: 'sm' | 'xs'
  textColor?: TableCellTextColor
  align?: 'left' | 'center' | 'right'
  hidden?: boolean
}) => {
  if (hidden) {
    return null
  }

  const className = clsx(
    extraClassName,
    'h-11 px-4 md:px-6 py-2 text-ellipsis',
    as === 'th' && 'uppercase font-medium',
    textSize === 'xs' && 'text-xs',
    textSize === 'sm' && 'text-sm',
    textColor === 'default' && 'text-[#9494a5]',
    textColor === 'primary' && 'text-[#fcf8f9]',
    textColor === 'success' && 'text-green-400',
    textColor === 'failure' && 'text-red-400',
    align === 'left' && 'text-left',
    align === 'center' && 'text-center',
    align === 'right' && 'text-right',
  )

  const Element = as

  return <Element className={className}>{children}</Element>
}

export const Table = Object.assign(Root, { Head, Body, Row, Cell })
