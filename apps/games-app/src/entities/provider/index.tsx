import { Icons, LinkButton, LinkButtonProps } from '@core/ui'
import Cookies from 'js-cookie'
import { AccountProvider } from '../../shared/api/core'
import { env } from '../../shared/env'

type ProviderInfo = {
  label: string
  profileUrl: string
}

export const ProviderInfoMap: Record<AccountProvider, ProviderInfo> = {
  [AccountProvider.Vk]: {
    label: 'ВКонтакте',
    profileUrl: 'https://vk.com/{{id}}',
  },
  [AccountProvider.Telegram]: {
    label: 'Telegram',
    profileUrl: 'https://t.me/{{id}}',
  },
}

export function createSignInUrl(
  integration: 'vk' | 'telegram',
  action: 'sign-in' | 'connect',
) {
  const params = new URLSearchParams()
  params.set('action', action)
  params.set('integration', integration)
  params.set('accessUrl', env.accessApi.url)
  params.set('returnUrl', location.href)
  const referralCampaign = Cookies.get('referralCampaign')
  if (referralCampaign) params.set('referralCampaign', referralCampaign)
  return `${env.authApi.url}/sigma/gateway?${params.toString()}`
}

export function createLogoutUrl() {
  const params = new URLSearchParams()
  params.set('returnUrl', location.href)
  return `${env.accessApi.url}/logout?${params.toString()}`
}

type SocialButtonProps = Partial<LinkButtonProps> & {
  action: 'sign-in' | 'connect'
}

export const VkButton = ({
  action,
  children = 'Войти через VK ID',
  ...rest
}: SocialButtonProps) => {
  return (
    <LinkButton
      to={createSignInUrl('vk', action)}
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
  action,
  children = 'Войти через Telegram',
  ...rest
}: SocialButtonProps) => {
  return (
    <LinkButton
      to={createSignInUrl('telegram', action)}
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
