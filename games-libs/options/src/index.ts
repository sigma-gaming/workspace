import { createOptionsToken } from '@core/di'

export type GamesCacheOptions = {
  version: string
}

export const GamesCacheOptionsToken =
  createOptionsToken<GamesCacheOptions>('GamesCacheOptions')

type GamesDbOptions = {
  url: string
  logger?: boolean
}

export const GamesDbOptionsToken =
  createOptionsToken<GamesDbOptions>('GamesDbOptions')

export type GamesRedisOptions = {
  host: string
  password: string
}

export const GamesRedisOptionsToken =
  createOptionsToken<GamesRedisOptions>('GamesRedisOptions')

export type SessionOptions = {
  domain: string
  jwt: { secret: string }
  cookie?: {
    idKey?: string
    expiresKey?: string
  }
}

export const SessionOptionsToken = createOptionsToken<SessionOptions>(
  'SessionOptionsToken',
)

export type TelegramBotOptions = {
  token: string
}

export const TelegramBotOptionsToken = createOptionsToken<TelegramBotOptions>(
  'TelegramBotOptionsToken',
)

export type VkOptions = {
  groupToken: string
  serviceToken: string
}

export const VkOptionsToken = createOptionsToken<VkOptions>('VkOptionsToken')
