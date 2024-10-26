import { Avatar, useMedia } from '@core/ui'
import { getUserInitials } from '@games/model'
import { Button, Menu, Modal, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { $$profile } from '../../entities/profile'
import { TelegramButton, VkButton } from '../../entities/provider'
import { $$user } from '../../entities/user'

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
  const userLoaded = useUnit($$user.$loaded)
  const profile = useUnit($$profile.$profile)
  const profileLoaded = useUnit($$profile.$loaded)
  const roles = useUnit($$user.$roles)
  const avatarSize = useAvatarSize()
  const loading = !userLoaded || !profileLoaded

  if (!userLoggedIn) {
    return <ExpiredProfile />
  }

  const initials = getUserInitials(profile?.name)

  return (
    <Menu
      width={240}
      position="bottom-end"
      offset={isMobile ? 32 : 16}
      disabled={loading}
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
            loading={loading}
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
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <Button size="md" onClick={open}>
        Войти в аккаунт
      </Button>

      <Modal
        title="Авторизация"
        opened={opened}
        onClose={close}
        size="xs"
        centered
      >
        <div className="flex flex-col gap-2">
          <VkButton size="md" fullWidth>
            Войти через VK ID
          </VkButton>
          <TelegramButton size="md" fullWidth>
            Войти через Telegram
          </TelegramButton>
        </div>
      </Modal>
    </>
  )
}
