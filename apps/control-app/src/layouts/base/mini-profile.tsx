import { Avatar, LinkButton, useMedia } from '@core/ui'
import { getUserInitials } from '@games/model'
import { Menu, Text } from '@mantine/core'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { $$profile } from '../../entities/profile'
import { $$user } from '../../entities/user'
import { env } from '../../shared/env'

function useAvatarSize() {
  const fromLg = useMedia({ from: 'lg' })
  const fromMd = useMedia({ from: 'sm' })
  if (fromLg) return 56
  if (fromMd) return 50
  return 44
}

export const MiniProfile = () => {
  const isMobile = useMedia({ to: 'md' })
  const userLoggedIn = useUnit($$user.$loggedIn)
  const userLoading = useUnit($$user.$loading)
  const profile = useUnit($$profile.$profile)
  const roles = useUnit($$user.$roles)
  const avatarSize = useAvatarSize()

  if (!userLoggedIn) {
    return <ExpiredProfile />
  }

  const initials = getUserInitials(profile?.name)

  return (
    <Menu
      width={240}
      position="bottom-end"
      offset={isMobile ? 32 : 16}
      disabled={userLoading}
      zIndex={250}
    >
      <Menu.Target>
        <div
          role="menu"
          className="flex gap-3 md:gap-4 items-center justify-end cursor-pointer rounded-xl !outline-offset-4"
        >
          <Avatar
            src={profile?.image}
            alt="Аватар пользователя"
            renderRoot={({ children, className, ...props }) => (
              <button
                name="Меню пользователя"
                className={clsx(className, 'outline-none')}
                {...props}
              >
                {children}
              </button>
            )}
            size={avatarSize}
            loading={userLoading}
            fallback={initials}
            bordered={true}
          />
        </div>
      </Menu.Target>

      <Menu.Dropdown p="xs">
        {profile && (
          <div className="px-3 py-2">
            <Text className="text-ellipsis overflow-hidden" fw={500}>
              {profile.name}
            </Text>
            {profile.username && (
              <Text
                className="text-ellipsis overflow-hidden"
                size="sm"
                c="dark.2"
              >
                @{profile.username}
              </Text>
            )}
            <p className="mt-2 text-sm">Роли: {roles.join(', ')}</p>
          </div>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}

export const ExpiredProfile = () => {
  const query = new URLSearchParams()
  query.set('view', 'sign-in')
  query.set('returnUrl', env.controlApp.url)

  return (
    <LinkButton size="md" to={`${env.gamesApp.url}?${query.toString()}`}>
      Войти в аккаунт
    </LinkButton>
  )
}
