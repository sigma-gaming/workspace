import { Skeleton } from '@mantine/core'
import clsx from 'clsx'
import { PropsWithChildren, ReactNode, useState } from 'react'

type RootRenderProps = PropsWithChildren<{
  className: string
  style: React.CSSProperties
}>

interface Props {
  src?: string | null
  alt: string
  size: number
  fallback?: ReactNode
  loading?: boolean
  bordered?: boolean
  renderRoot?: (props: RootRenderProps) => ReactNode
}

export const Avatar = ({
  src,
  alt,
  size,
  fallback,
  loading = false,
  bordered = false,
  renderRoot = (props) => <div {...props} />,
}: Props) => {
  // const src = null
  const [failed, setFailed] = useState(false)

  if (loading) {
    return <Skeleton width={size} height={size} circle />
  }

  const showImage = src && !failed

  const content = showImage ? (
    <img
      className="rounded-full text-[0px]"
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  ) : (
    fallback
  )

  return renderRoot({
    className: clsx(
      'block shrink-0 rounded-full overflow-hidden',
      bordered && 'border-2 p-[2px] border-primary-5',
    ),
    style: {
      width: size,
      height: size,
      fontSize: Math.max(12, size / 2.5),
    },
    children: (
      <div
        className={clsx(
          'flex w-full h-full items-center justify-center rounded-full bg-[#363753] pointer-events-none',
          'font-interface font-medium text-[#b6b7ce] select-none',
        )}
      >
        {content}
      </div>
    ),
  })
}
