import { useClientMountedEvent } from '@libs/ssr-bindings'
import { Link } from 'atomic-router-react'
import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { v4 } from 'uuid'
import { $$user } from '../../entities/user'
import { BaseLayout } from '../../layouts/base'
import { routes } from '../../routing'
import { gamesApi } from '../../shared/api/games'
import { env } from '../../shared/env'

function useTelegramUrl() {
  const params = new URLSearchParams()
  params.set('bot_id', env.telegram.botId)
  params.set('origin', env.gamesWeb.url)
  params.set('embed', '0')
  params.set('request_access', 'write')
  params.set('return_to', `${env.gamesWeb.url}/redirect/telegram`)
  return `https://oauth.telegram.org/auth?${params.toString()}`
}

function useVkUrl() {
  const params = new URLSearchParams()
  params.set('uuid', v4())
  params.set('app_id', env.vk.appId)
  params.set('redirect_uri', `${env.gamesApi.url}/trpc/auth.callbacks.vk`)
  params.set('response_type', 'silent_token')
  return `https://id.vk.com/auth?${params.toString()}`
}

export const HomePageView = () => {
  useClientMountedEvent($$user.request)

  const user = useUnit($$user.$user)
  const telegramUrl = useTelegramUrl()
  const vkUrl = useVkUrl()

  const socialButtons = [
    {
      label: 'Telegram',
      url: telegramUrl,
    },
    {
      label: 'VK',
      url: vkUrl,
    },
  ]

  return (
    <BaseLayout>
      <Link to={routes.test}>Test</Link>
      {socialButtons.map(({ label, url }) => {
        return (
          <button
            key={label}
            onClick={() => {
              location.href = url
            }}
          >
            {user ? 'Привязать' : 'Войти через'} {label}
          </button>
        )
      })}
      {user?.profile && (
        <div>
          {user.profile.image && (
            <img
              src={user.profile.image}
              alt="Avatar"
              width={100}
              height={100}
            />
          )}
          <div>{user.profile.name}</div>
        </div>
      )}
    </BaseLayout>
  )
}
