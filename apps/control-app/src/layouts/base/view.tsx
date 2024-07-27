import { Menu, MenuLink, MenuSection } from '@core/ui'
import { rem, Title } from '@mantine/core'
import {
  IconBarrierBlock,
  IconCoins,
  IconDashboard,
  IconNotification,
} from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import { PropsWithChildren } from 'react'
import { routes } from '../../routing/index.ts'
import { Logo } from './logo.tsx'

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-full flex flex-col">
      <Left />
      <main className="pl-[280px] pr-6 pt-[104px] pb-6">{children}</main>
    </div>
  )
}

const Left = () => {
  return (
    <div className="fixed top-0 left-0 bottom-0 w-[280px] p-6">
      <Link
        to={routes.dashboard}
        className="w-full flex items-center justify-center gap-2 p-2 mb-4"
      >
        <Logo />
        <h1 className="hidden md:block font-text text-2xl font-medium">
          Sigma
        </h1>
      </Link>
      <Menu>
        <MenuLink
          to={routes.dashboard}
          icon={<IconDashboard style={{ width: rem(24), height: rem(24) }} />}
        >
          Главная
        </MenuLink>
        <MenuLink
          to={routes.budget}
          icon={<IconCoins style={{ width: rem(24), height: rem(24) }} />}
        >
          Бюджет
        </MenuLink>
        <MenuLink
          to={routes.notifications}
          icon={
            <IconNotification style={{ width: rem(24), height: rem(24) }} />
          }
        >
          Уведомления
        </MenuLink>
        <MenuSection label="Обслуживание">
          <MenuLink
            to={routes.maintenance}
            icon={
              <IconBarrierBlock style={{ width: rem(24), height: rem(24) }} />
            }
          >
            Тех. работы
          </MenuLink>
        </MenuSection>
      </Menu>
    </div>
  )
}
