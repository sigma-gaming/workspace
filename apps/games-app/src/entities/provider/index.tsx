import { LinkButton, LinkButtonProps } from '@core/ui'
import { AccountProvider } from '@dbs/games-schema'
import { v4 } from 'uuid'
import { env } from '../../shared/env'
import { Icons } from '../../shared/ui/icons'

interface ProviderInfo {
  label: string
  profileUrl: string
}

export const ProviderInfoMap: Record<AccountProvider, ProviderInfo> = {
  [AccountProvider.VK]: {
    label: 'ВКонтакте',
    profileUrl: 'https://vk.com/{{id}}',
  },
  [AccountProvider.Telegram]: {
    label: 'Telegram',
    profileUrl: 'https://t.me/{{id}}',
  },
}

function defaultReturnTo() {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname + window.location.search
}

export function createTelegramUrl(returnTo = defaultReturnTo()) {
  const params = new URLSearchParams()
  params.set('bot_id', env.telegram.botId)
  params.set('origin', env.gamesApp.url)
  params.set('embed', '0')
  params.set('request_access', 'write')
  params.set(
    'return_to',
    `${env.gamesApp.url}/callbacks/telegram?path=${returnTo}`,
  )

  return `https://oauth.telegram.org/auth?${params.toString()}`
}

export function createVkUrl(returnTo = defaultReturnTo()) {
  const params = new URLSearchParams()
  params.set('uuid', v4())
  params.set('app_id', env.vk.appId)
  params.set('response_type', 'silent_token')
  params.set(
    'redirect_uri',
    `${env.gamesApp.url}/callbacks/vk/#path=${returnTo}`,
  )

  return `https://id.vk.com/auth?${params.toString()}`
}

export const VkButton = ({
  children = 'Войти через VK ID',
  ...rest
}: Partial<LinkButtonProps>) => {
  return (
    <LinkButton
      to={createVkUrl()}
      color="#3375F6"
      className="!outline-[#3375F6]"
      leftSection={<Icons.Vk />}
      rightSection={<span />}
      justify="space-between"
      {...rest}
    >
      {children}
    </LinkButton>
  )
}

export const TelegramButton = ({
  children = 'Войти через Telegram',
  ...rest
}: Partial<LinkButtonProps>) => {
  return (
    <LinkButton
      to={createTelegramUrl()}
      color="#51A2DD"
      className="!outline-[#51A2DD]"
      leftSection={<Icons.Telegram />}
      rightSection={<span />}
      justify="space-between"
      {...rest}
    >
      {children}
    </LinkButton>
  )
}
