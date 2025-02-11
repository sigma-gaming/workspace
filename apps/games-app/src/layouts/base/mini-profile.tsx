import { Avatar, useMedia } from '@core/ui'
import { getUserInitials } from '@games/model'
import { Button, Menu, Modal, rem, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCoins,
  IconLogout,
  IconSettings,
  IconWallet,
} from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { $$profile } from '../../entities/profile/index.ts'
import { TelegramButton, VkButton } from '../../entities/provider'
import { $$session } from '../../entities/session/index.ts'
import { $$user } from '../../entities/user'
import { routes } from '../../routing'
import { $$paymentModal } from '../../widgets/payment-modal'
import { Balance } from './balance.tsx'

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
  const userDetailsLoaded = useUnit($$profile.$loaded)
  const userDetails = useUnit($$profile.$userDetails)
  const avatarSize = useAvatarSize()

  const loading = !userLoaded || !userDetailsLoaded

  if (!userLoggedIn) {
    return <ExpiredProfile />
  }

  const initials = getUserInitials(userDetails?.profile.name)

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
          className="flex gap-3 md:gap-4 items-center justify-end pl-4 cursor-pointer rounded-xl !outline-offset-4"
        >
          <Balance />

          <Avatar
            src={userDetails?.profile.image}
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
        {userDetails && (
          <div className="px-3 py-2">
            <Text className="text-ellipsis overflow-hidden" fw={500}>
              {userDetails.profile.name}
            </Text>
            {userDetails.profile.username && (
              <Text
                className="text-ellipsis overflow-hidden"
                size="sm"
                c="dark.2"
              >
                @{userDetails.profile.username}
              </Text>
            )}
          </div>
        )}

        <Menu.Item
          className="text-green-400"
          onClick={() => $$paymentModal.openDeposit()}
          leftSection={
            <IconWallet style={{ width: rem(16), height: rem(16) }} />
          }
        >
          Пополнить баланс
        </Menu.Item>

        <Menu.Item
          onClick={() => $$paymentModal.openWithdraw()}
          leftSection={
            <IconCoins style={{ width: rem(16), height: rem(16) }} />
          }
        >
          Вывести деньги
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          component={Link}
          to={routes.settings}
          leftSection={
            <IconSettings style={{ width: rem(16), height: rem(16) }} />
          }
        >
          Настройки
        </Menu.Item>
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
          <VkButton action="sign-in" size="md" fullWidth>
            Войти через VK ID
          </VkButton>
          <TelegramButton action="sign-in" size="md" fullWidth>
            Войти через Telegram
          </TelegramButton>
        </div>
      </Modal>
    </>
  )
}
