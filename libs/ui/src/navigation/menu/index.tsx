import { Text, Title } from '@mantine/core'
import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { createContext, PropsWithChildren, ReactNode, useContext } from 'react'

interface MenuContext {
  onNavigate?: () => void
}

interface MenuProps {
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
      <div className={clsx(className, 'flex flex-col gap-1')}>{children}</div>
    </MenuContext.Provider>
  )
}

export const MenuSection = ({
  label,
  children,
}: PropsWithChildren<{ label: string }>) => {
  return (
    <div className="flex flex-col gap-1 mt-4">
      <Title
        className="px-4 uppercase text-sm mb-1 font-interface text-[color:var(--mantine-color-dimmed)]"
        order={3}
      >
        {label}
      </Title>
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
      className="px-4 py-4 md:py-3 flex gap-4 items-center rounded-2xl text-[#B6B7CE] bg-[#221F2C] hover:bg-[#292636] active:translate-y-px transition-colors focus:outline-primary"
      activeClassName="cursor-default text-white bg-primary-7 hover:bg-primary-7 active:transform-none"
      onClick={onNavigate}
    >
      <div className="opacity-75">{icon}</div>
      <Text className="text-md md:text-lg font-interface" fw={500}>
        {children}
      </Text>
    </Link>
  )
}
