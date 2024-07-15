import { Menu, MenuLink, MenuSection } from '@core/ui'
import { routes } from '../../routing'
import { Icons } from '../../shared/ui/icons'

export const BaseLayoutMenu = ({ onNavigate }: { onNavigate?: () => void }) => {
  return (
    <Menu onNavigate={onNavigate}>
      <MenuLink to={routes.games} icon={<Icons.Play />}>
        Игры
      </MenuLink>
      <MenuSection label="Игры">
        <MenuLink to={routes.diceGame} icon={<Icons.Dice />}>
          Dice
        </MenuLink>
      </MenuSection>
    </Menu>
  )
}
