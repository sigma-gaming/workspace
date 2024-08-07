import clsx from 'clsx'

type Props = {
  className?: string
}

export const Copyright = ({ className }: Props) => {
  return <p className={clsx(className, 'text-dimmed')}>Sigma Games © 2024</p>
}
