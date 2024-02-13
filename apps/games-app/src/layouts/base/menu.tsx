import { Card, rem, Text } from '@mantine/core'
import { IconCategory2, IconDice3 } from '@tabler/icons-react'
import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import { PropsWithChildren, ReactNode } from 'react'
import { routes } from '../../routing'

export const Menu = () => {
  return (
    <Card className="md:w-72 mx-4 md:mx-0 px-0 py-2 md:py-4 h-fit md:rounded-l-none">
      <MenuLink
        to={routes.home}
        icon={<IconCategory2 style={{ width: rem(24), height: rem(24) }} />}
      >
        Главная
      </MenuLink>
      <MenuLink
        to={routes.dicesGame}
        icon={<IconDice3 style={{ width: rem(24), height: rem(24) }} />}
      >
        Dices
      </MenuLink>
    </Card>
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
      className="px-4 md:px-10 py-2 md:py-3 inline-flex gap-4 text-center items-center"
      activeClassName="bg-sigma-100"
    >
      {icon}
      <Text className="text-md md:text-lg" fw={600}>
        {children}
      </Text>
    </Link>
  )
}
