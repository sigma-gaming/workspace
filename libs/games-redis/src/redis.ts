import Client from 'ioredis'

export function createRedis(url: string) {
  return new Client(url)
}
