import { Menu, MenuLink, MenuSection } from '@core/ui'
import { rem } from '@mantine/core'
import {
  IconBarrierBlock,
  IconCoins,
  IconDashboard,
  IconNotification,
} from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { $$user } from '../../entities/user'
import { routes } from '../../routing'

export const BaseLayoutMenu = () => {
  const isAdmin = useUnit($$user.$isAdmin)

  return (
    <Menu>
      <MenuLink
        to={routes.dashboard}
        icon={<IconDashboard style={{ width: rem(24), height: rem(24) }} />}
      >
        Главная
      </MenuLink>
      {isAdmin && (
        <MenuLink
          to={routes.budget}
          icon={<IconCoins style={{ width: rem(24), height: rem(24) }} />}
        >
          Бюджет
        </MenuLink>
      )}
      {isAdmin && (
        <MenuLink
          to={routes.notifications}
          icon={
            <IconNotification style={{ width: rem(24), height: rem(24) }} />
          }
        >
          Уведомления
        </MenuLink>
      )}
      {isAdmin && (
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
      )}
    </Menu>
  )
}
