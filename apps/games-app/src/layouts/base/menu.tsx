import { rem, Text, Title } from '@mantine/core'
import { IconCategory2, IconDice3 } from '@tabler/icons-react'
import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import { PropsWithChildren, ReactNode } from 'react'
import { routes } from '../../routing'

export const Menu = () => {
  return (
    <div className="flex flex-col gap-1">
      <MenuLink
        to={routes.home}
        icon={<IconCategory2 style={{ width: rem(24), height: rem(24) }} />}
      >
        Главная
      </MenuLink>
      <MenuSection label="Игры">
        <MenuLink
          to={routes.dicesGame}
          icon={<IconDice3 style={{ width: rem(24), height: rem(24) }} />}
        >
          Dices
        </MenuLink>
      </MenuSection>
    </div>
  )
}

const MenuSection = ({
  label,
  children,
}: PropsWithChildren<{ label: string }>) => {
  return (
    <div className="flex flex-col gap-1 mt-4">
      <Title
        className="px-4 uppercase text-sm mb-1 font-interface"
        order={3}
        c="#434460"
      >
        {label}
      </Title>
      {children}
    </div>
  )
}

const MenuLink = ({
  to,
  icon,
  children,
}: PropsWithChildren<{
  to: RouteInstance<RouteParams>
  icon: ReactNode
}>) => {
  return (
    <Link
      to={to}
      className="px-4 py-3 flex gap-4 items-center rounded-2xl text-[#B6B7CE] bg-[#221F2C] hover:bg-[#292636] transition-colors"
      activeClassName="text-white bg-sigma-100 hover:bg-sigma-100"
    >
      <div className="opacity-75">{icon}</div>
      <Text className="text-md md:text-lg font-interface" fw={500}>
        {children}
      </Text>
    </Link>
  )
}
