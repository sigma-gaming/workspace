import { Menu, MenuLink, MenuSection } from '@core/ui'
import { rem } from '@mantine/core'
import { IconCategory2, IconDice3 } from '@tabler/icons-react'
import { routes } from '../../routing'

export const BaseLayoutMenu = ({ onNavigate }: { onNavigate?: () => void }) => {
  return (
    <Menu onNavigate={onNavigate}>
      <MenuLink
        to={routes.home}
        icon={<IconCategory2 style={{ width: rem(24), height: rem(24) }} />}
      >
        Главная
      </MenuLink>
      <MenuSection label="Игры">
        <MenuLink
          to={routes.diceGame}
          icon={<IconDice3 style={{ width: rem(24), height: rem(24) }} />}
        >
          Dice
        </MenuLink>
      </MenuSection>
    </Menu>
  )
}
