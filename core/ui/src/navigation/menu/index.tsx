import { Text } from '@mantine/core'
import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { createContext, PropsWithChildren, ReactNode, useContext } from 'react'

type MenuContext = {
  onNavigate?: () => void
}

type MenuProps = {
  className?: string
  onNavigate?: () => void
}

const MenuContext = createContext<MenuContext>({} as MenuContext)

export const Menu = ({
  className,
  children,
  onNavigate,
}: PropsWithChildren<MenuProps>) => {
  return (
    <MenuContext.Provider value={{ onNavigate }}>
      <div className={clsx(className, 'flex flex-col gap-2 select-none')}>
        {children}
      </div>
    </MenuContext.Provider>
  )
}

export const MenuSection = ({
  label,
  children,
}: PropsWithChildren<{ label: string }>) => {
  return (
    <div className="flex flex-col gap-2 mt-4">
      <h3 className="px-4 text-base font-medium mb-1 text-[color:var(--mantine-color-dimmed)]">
        {label}
      </h3>
      {children}
    </div>
  )
}

export const MenuLink = ({
  to,
  icon,
  children,
}: PropsWithChildren<{
  to: RouteInstance<RouteParams>
  icon: ReactNode
}>) => {
  const { onNavigate } = useContext(MenuContext)

  return (
    <Link
      to={to}
      className="px-4 py-4 md:py-3 flex gap-4 items-center rounded-2xl text-[#B6B7CE] bg-[#221F2C] hover:bg-[#292636] active:translate-y-px transition-colors focus-visible:outline-primary"
      activeClassName="cursor-default text-white bg-primary-7 hover:bg-primary-7 active:transform-none"
      onClick={onNavigate}
    >
      <div className="opacity-75">{icon}</div>
      <Text className="text-md md:text-lg" fw={500}>
        {children}
      </Text>
    </Link>
  )
}
