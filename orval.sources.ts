export type Source = {
  file: string
  url: string
  watch: boolean
  targets: string[]
}

export const sources = {
  coreApi: {
    file: './openapi/core-api.json',
    url: 'https://api.sigma.local:5050/openapi/v1.json',
    watch: true,
    targets: ['./apps/games-app/src/shared/api/core/generated'],
  },
  coreWs: {
    file: './openapi/core-ws.json',
    url: 'https://ws.sigma.local:5070/openapi/v1.json',
    watch: true,
    targets: ['./apps/games-app/src/shared/api/core-ws/generated'],
  },
  accessApi: {
    file: './openapi/access-api.json',
    url: 'https://access.sigma.local:5120/openapi/v1.json',
    watch: true,
    targets: ['./apps/games-app/src/shared/api/access/generated'],
  },
  letsauthApi: {
    file: './openapi/letsauth-api.json',
    url: 'https://api.auth.local:5140/openapi/v1.json',
    watch: true,
    targets: ['./apps/letsauth/src/shared/api/auth/generated'],
  },
} satisfies Record<string, Source>
