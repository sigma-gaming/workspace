import { Avatar, useMedia } from '@core/ui'
import { getUserInitials } from '@games/model'
import { Button, Menu, Modal, rem, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLogout } from '@tabler/icons-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { $$profile } from '../../entities/profile'
import { TelegramButton, VkButton } from '../../entities/provider'
import { $$session } from '../../entities/session'
import { $$user } from '../../entities/user'
import { AuthenticationAction } from '../../shared/api/access'

function useAvatarSize() {
  const fromLg = useMedia({ from: 'lg' })
  const fromMd = useMedia({ from: 'sm' })
  if (fromLg) return 56
  if (fromMd) return 50
  return 44
}

export const MiniProfile = () => {
  const isMobile = useMedia({ to: 'md' })
  const userLoggedIn = useUnit($$session.$loggedIn)
  const userLoaded = useUnit($$user.$loaded)
  const details = useUnit($$profile.$userDetails)
  const detailsLoaded = useUnit($$profile.$loaded)
  const roles = useUnit($$user.$roles)
  const avatarSize = useAvatarSize()
  const loading = !userLoaded || !detailsLoaded

  if (!userLoggedIn) {
    return <ExpiredProfile />
  }

  const initials = getUserInitials(details?.profile.name)

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
            src={details?.profile.image}
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
        {details && (
          <div className="px-3 py-2">
            <Text className="text-ellipsis overflow-hidden" fw={500}>
              {details.profile.name}
            </Text>
            {details.profile.username && (
              <Text
                className="text-ellipsis overflow-hidden"
                size="sm"
                c="dark.2"
              >
                @{details.profile.username}
              </Text>
            )}
            <p className="mt-2 text-sm">Роли: {roles.join(', ')}</p>
          </div>
        )}

        <Menu.Divider />

        <Menu.Item
          className="text-red-400"
          onClick={() => $$session.logout()}
          leftSection={
            <IconLogout style={{ width: rem(16), height: rem(16) }} />
          }
        >
          Выйти из аккаунта
        </Menu.Item>
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
          <VkButton action={AuthenticationAction.SignIn} size="md" fullWidth>
            Войти через VK ID
          </VkButton>
          <TelegramButton
            action={AuthenticationAction.SignIn}
            size="md"
            fullWidth
          >
            Войти через Telegram
          </TelegramButton>
        </div>
      </Modal>
    </>
  )
}
