import { Account } from '@libs/games-db-schema'

export type AccountPublic = Pick<
  Account,
  | 'provider'
  | 'providerUsername'
  | 'providerUserFirstName'
  | 'providerUserLastName'
  | 'providerUserImage'
>
