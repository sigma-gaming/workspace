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
  controlApi: {
    file: './openapi/control-api.json',
    url: 'https://control-api.sigma.local:5090/openapi/v1.json',
    watch: true,
    targets: ['./apps/control-app/src/shared/api/control/generated'],
  },
  accessApi: {
    file: './openapi/access-api.json',
    url: 'https://access.sigma.local:5120/openapi/v1.json',
    watch: true,
    targets: [
      './apps/games-app/src/shared/api/access/generated',
      './apps/control-app/src/shared/api/access/generated',
    ],
  },
  letsauthApi: {
    file: './openapi/letsauth-api.json',
    url: 'https://api.auth.local:5140/openapi/v1.json',
    watch: true,
    targets: ['./apps/letsauth-app/src/shared/api/auth/generated'],
  },
  domainApi: {
    file: './openapi/domain-api.json',
    url: 'https://domain.sigma.local:5150/openapi/v1.json',
    watch: true,
    targets: ['./apps/games-bot/src/shared/api/domain/generated'],
  },
  affiliateApi: {
    file: './openapi/affiliate-api.json',
    url: 'https://affiliate.sigma.local:5160/openapi/v1.json',
    watch: true,
    targets: ['./apps/games-bot/src/shared/api/affiliate/generated'],
  },
} satisfies Record<string, Source>
