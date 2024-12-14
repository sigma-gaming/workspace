import { createOptionsToken } from '@core/di'
import { NatsOptions } from '@games/nats'
import { RedisOptions } from '@games/redis'

export type GamesCacheOptions = {
  version: string
}

export const GamesCacheOptionsToken =
  createOptionsToken<GamesCacheOptions>('GamesCacheOptions')

export type GamesDbOptions = {
  url: string
  logger?: boolean
}

export const GamesDbOptionsToken =
  createOptionsToken<GamesDbOptions>('GamesDbOptions')

export const GamesRedisOptionsToken =
  createOptionsToken<RedisOptions>('GamesRedisOptions')

export const GamesNatsOptionsToken =
  createOptionsToken<NatsOptions>('GamesNatsOptions')

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

export type BovapayOptions = {
  apiUrl: string
  apiKey: string
  callbackUrl: string
}

export const BovapayOptionsToken = createOptionsToken<BovapayOptions>(
  'BovapayOptionsToken',
)
