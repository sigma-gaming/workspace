import { Icons, Menu, MenuLink, MenuSection } from '@core/ui'
import { routes } from '../../routing'

export const BaseLayoutMenu = ({ onNavigate }: { onNavigate?: () => void }) => {
  return (
    <Menu onNavigate={onNavigate}>
      <MenuLink to={routes.games} icon={<Icons.Play />}>
        Игры
      </MenuLink>
      <MenuSection label="Игры">
        <MenuLink
          to={routes.diceGame}
          icon={<Icons.Dice width={24} height={24} />}
        >
          Dice
        </MenuLink>
        <MenuLink
          to={routes.pincodeGame}
          icon={<Icons.Card width={24} height={24} />}
        >
          Pincode
        </MenuLink>
      </MenuSection>
    </Menu>
  )
}
