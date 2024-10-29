import { Icons, LinkButton, LinkButtonProps } from '@core/ui'
import { AccountProvider } from '@dbs/games-types'
import Cookies from 'js-cookie'
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

export function createSignInUrl(integration: 'vk' | 'telegram') {
  const params = new URLSearchParams()
  params.set('integration', integration)
  params.set('accessUrl', env.accessApi.url)
  params.set('returnUrl', location.href)
  const referralCampaign = Cookies.get('referralCampaign')
  if (referralCampaign) params.set('referralCampaign', referralCampaign)
  return `${env.authApi.url}/sigma/sign-in?${params.toString()}`
}

export function createLogoutUrl() {
  const params = new URLSearchParams()
  params.set('returnUrl', location.href)
  return `${env.accessApi.url}/logout?${params.toString()}`
}

export const VkButton = ({
  children = 'Войти через VK ID',
  ...rest
}: Partial<LinkButtonProps>) => {
  return (
    <LinkButton
      to={createSignInUrl('vk')}
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
      to={createSignInUrl('telegram')}
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
