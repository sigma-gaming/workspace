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
} satisfies Record<string, Source>
