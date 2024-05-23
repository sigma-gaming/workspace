import { getUserInitials } from '@games/model'
import { Avatar, useMedia } from '@libs/ui'
import { Button, Menu, Modal, rem, Skeleton, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCoins,
  IconLoader2,
  IconLogout,
  IconSettings,
  IconWallet,
} from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { animate } from 'framer-motion/dom'
import { useLayoutEffect, useRef } from 'react'
import { $$balance } from '../../entities/balance'
import { $$profile } from '../../entities/profile/index.ts'
import { TelegramButton, VkButton } from '../../entities/provider'
import { $$user } from '../../entities/user'
import { routes } from '../../routing'
import { formatRUB } from '../../shared/lib/format/currency.ts'

function useAvatarSize() {
  const fromLg = useMedia({ from: 'lg' })
  const fromMd = useMedia({ from: 'sm' })
  if (fromLg) return 56
  if (fromMd) return 50
  return 44
}

export const MiniProfile = () => {
  const isMobile = useMedia({ to: 'md' })
  const userExpired = useUnit($$user.$expired)
  const loggingOut = useUnit($$user.$loggingOut)
  const balanceDepositing = useUnit($$balance.$depositing)
  const balanceWithdrawing = useUnit($$balance.$withdrawing)
  const userLoading = useUnit($$user.$loading)
  const profile = useUnit($$profile.$profile)
  const balanceLoading = useUnit($$balance.$loading)
  const avatarSize = useAvatarSize()

  if (userExpired) {
    return <ExpiredProfile />
  }

  const initials = getUserInitials(profile?.name)

  return (
    <Menu
      width={240}
      position="bottom-end"
      offset={isMobile ? 32 : 16}
      disabled={userLoading}
    >
      <Menu.Target>
        <div className="flex gap-3 md:gap-4 items-center justify-end pl-4 cursor-pointer rounded-xl !outline-offset-4">
          <div className="flex flex-col gap-1.5 items-end">
            <Skeleton visible={balanceLoading} width="fit-content">
              <Text className="!leading-tight text-xs lg:text-sm" c="dimmed">
                Баланс
              </Text>
            </Skeleton>
            <Skeleton visible={balanceLoading} width="fit-content">
              <Text
                className="font-interface !leading-none text-lg lg:text-xl"
                fw={500}
                c="green.6"
              >
                <AnimatedBalance />
              </Text>
            </Skeleton>
          </div>

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
            <Text fw={500}>{profile.name}</Text>
            {profile.username && (
              <Text size="sm" c="dark.2">
                @{profile.username}
              </Text>
            )}
          </div>
        )}

        <Menu.Item
          className="text-green-400"
          onClick={() => $$balance.deposit()}
          closeMenuOnClick={false}
          disabled={balanceDepositing}
          leftSection={
            balanceDepositing ? (
              <IconLoader2
                className="animate-spin"
                style={{ width: rem(16), height: rem(16) }}
              />
            ) : (
              <IconWallet style={{ width: rem(16), height: rem(16) }} />
            )
          }
        >
          {balanceDepositing ? 'Пополняем баланс...' : 'Пополнить баланс'}
        </Menu.Item>

        <Menu.Item
          onClick={() => $$balance.withdraw()}
          closeMenuOnClick={false}
          disabled={balanceWithdrawing}
          leftSection={
            balanceWithdrawing ? (
              <IconLoader2
                className="animate-spin"
                style={{ width: rem(16), height: rem(16) }}
              />
            ) : (
              <IconCoins style={{ width: rem(16), height: rem(16) }} />
            )
          }
        >
          {balanceWithdrawing ? 'Выводим деньги...' : 'Вывести деньги'}
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
          onClick={() => $$user.logout()}
          disabled={loggingOut}
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

const AnimatedBalance = () => {
  const current = useUnit($$balance.$available)
  const loaded = useUnit($$balance.$loaded)
  const previousLoadedRef = useRef(loaded)
  const previousRef = useRef(current)
  const nodeRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return

    if (!previousLoadedRef.current && loaded) {
      previousLoadedRef.current = loaded
      previousRef.current = current
    }

    if (previousRef.current === current) {
      node.textContent = formatRUB(current / 100)
      return
    }

    const controls = animate(previousRef.current, current, {
      duration: 0.25,
      onUpdate(value) {
        node.textContent = formatRUB(value / 100)
      },
    })

    previousRef.current = current
    return () => controls.stop()
  }, [loaded, current])

  return <span ref={nodeRef} />
}
