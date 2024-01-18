import {
  Avatar,
  Button,
  Group,
  Menu,
  Modal,
  rem,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCategory2,
  IconCoins,
  IconCreditCard,
  IconLoader2,
  IconLogout,
  IconSettings,
  IconWallet,
} from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import { useUnit } from 'effector-react'
import { PropsWithChildren, SVGProps } from 'react'
import { $$balance } from '../../entities/balance'
import { TelegramButton, VkButton } from '../../entities/provider'
import { $$user } from '../../entities/user'
import { routes } from '../../routing'
import { formatRUB } from '../../shared/lib/format/currency.ts'
import { LinkButton } from '../../shared/ui/general/link-button'
import css from './styles.module.css'

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex flex-col px-4 pb-8">
      <Header />
      <div className="flex flex-col md:flex-row gap-8">
        <Left />
        <main className="grow">{children}</main>
      </div>
    </div>
  )
}

const Left = () => {
  return (
    <aside className="hidden md:flex w-64 flex-col gap-4">
      <LinkButton
        to={routes.home}
        size="lg"
        color="#4a115e"
        leftSection={
          <IconCategory2 style={{ width: rem(24), height: rem(24) }} />
        }
        activeClassName={css.leftLinkActive}
      >
        Главная
      </LinkButton>
      <LinkButton
        to={routes.dicesGame}
        size="lg"
        color="#4a115e"
        leftSection={
          <IconCreditCard style={{ width: rem(24), height: rem(24) }} />
        }
        activeClassName={css.leftLinkActive}
      >
        PIN Code
      </LinkButton>
    </aside>
  )
}

const Header = () => {
  return (
    <header className="flex gap-6 items-center justify-between py-6 md:py-8">
      <div className="md:w-64 md:px-5 flex gap-[10px] items-center">
        <Link
          to={routes.home}
          className="md:w-full md:px-4 flex items-center justify-between"
        >
          <Logo />
          <Title className="hidden md:block" order={1} size={40}>
            Sigma
          </Title>
        </Link>
      </div>
      <Profile />
    </header>
  )
}

const Profile = () => {
  const [opened, { open, close }] = useDisclosure(false)
  const userLoading = useUnit($$user.$loading)
  const userExpired = useUnit($$user.$expired)
  const profile = useUnit($$user.$profile)
  const loggingOut = useUnit($$user.$loggingOut)
  const balance = useUnit($$balance.$available)
  const balanceLoading = useUnit($$balance.$loading)
  const balanceDepositing = useUnit($$balance.$depositing)

  if (userExpired) {
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

  return (
    <Menu width={240} position="bottom-end" offset={16} disabled={userLoading}>
      <Menu.Target>
        <div className="flex gap-4 items-center pl-4 cursor-pointer">
          <Stack gap={6} align="end">
            <Skeleton visible={balanceLoading} width="fit-content" radius="sm">
              <Text className="leading-none" size="sm" c="dimmed">
                Баланс
              </Text>
            </Skeleton>
            <Skeleton visible={balanceLoading} width="fit-content">
              <Text
                className="font-interface leading-none"
                size="xl"
                fw={500}
                c="green.6"
              >
                {formatRUB(balance / 100)}
              </Text>
            </Skeleton>
          </Stack>

          <Skeleton visible={userLoading} height={56} circle>
            <Avatar
              src={profile?.image}
              component="button"
              name="Меню пользователя"
              size={48}
              classNames={{
                root: 'm-1 outline outline-2 outline-offset-2 outline-sigma-600',
              }}
            />
          </Skeleton>
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
          c="green.6"
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
          c="red.6"
          onClick={() => $$user.logout()}
          closeMenuOnClick={false}
          disabled={loggingOut}
          leftSection={
            loggingOut ? (
              <IconLoader2
                className="animate-spin"
                style={{ width: rem(16), height: rem(16) }}
              />
            ) : (
              <IconLogout style={{ width: rem(16), height: rem(16) }} />
            )
          }
        >
          {loggingOut ? 'Выходим из аккаунта...' : 'Выйти из аккаунта'}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

const Logo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="7" cy="8" r="4.5" stroke="#FA00FF" strokeWidth="3" />
      <path
        d="M13.5 3.5L7.5 3.5H7.02494C4.33453 3.5 2.23229 5.82295 2.5 8.5V8.5"
        stroke="url(#paint0_linear_4_4)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id="paint0_linear_4_4"
          x1="7"
          y1="3.5"
          x2="2.5"
          y2="8.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B00E4" />
          <stop offset="1" stopColor="#9B00E4" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
