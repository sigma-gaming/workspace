import { Icons, LinkButton, LinkButtonProps } from '@core/ui'
import { AccountProvider } from '@dbs/games-types'
import { v4 } from 'uuid'
import { env } from '../../shared/env'

type ProviderInfo = {
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

export type AuthFlow = 'sign-in' | 'connect'

type Meta = {
  flow: AuthFlow
  returnUrl: string
}

const META_KEY = 'auth/meta'

function saveMeta({ flow }: Pick<Meta, 'flow'>) {
  if (typeof window === 'undefined') return '/'
  const returnUrl = window.location.pathname + window.location.search
  const meta: Meta = { flow, returnUrl }
  window.localStorage.setItem(META_KEY, JSON.stringify(meta))
}

export function getMeta() {
  if (typeof window === 'undefined') return null
  const json = window.localStorage.getItem(META_KEY)
  if (!json) return null
  return JSON.parse(json) as Meta
}

export function clearMeta() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(META_KEY)
}

export function createTelegramUrl() {
  const params = new URLSearchParams()
  params.set('bot_id', env.telegram.botId)
  params.set('origin', env.gamesApp.url)
  params.set('embed', '0')
  params.set('request_access', 'write')
  params.set('return_to', `${env.gamesApp.url}/callbacks/telegram`)
  return `https://oauth.telegram.org/auth?${params.toString()}`
}

export function createVkUrl() {
  const params = new URLSearchParams()
  params.set('uuid', v4())
  params.set('app_id', env.vk.appId)
  params.set('response_type', 'silent_token')
  params.set('redirect_uri', `${env.gamesApp.url}/callbacks/vk`)
  return `https://id.vk.com/auth?${params.toString()}`
}

type AuthButtonProps = Partial<LinkButtonProps> & Pick<Meta, 'flow'>

export const VkButton = ({
  flow,
  children = 'Войти через VK ID',
  ...rest
}: AuthButtonProps) => {
  return (
    <LinkButton
      to={createVkUrl()}
      onClick={() => saveMeta({ flow })}
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
  flow,
  children = 'Войти через Telegram',
  ...rest
}: AuthButtonProps) => {
  return (
    <LinkButton
      to={createTelegramUrl()}
      onClick={() => saveMeta({ flow })}
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
