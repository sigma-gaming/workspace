import { Account } from '@games/db-schema'

export type AccountPublic = Pick<
  Account,
  | 'provider'
  | 'providerUsername'
  | 'providerUserFirstName'
  | 'providerUserLastName'
  | 'providerUserImage'
>
