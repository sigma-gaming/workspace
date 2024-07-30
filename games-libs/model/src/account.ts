import { AccountSelect } from '@dbs/games-schema'

export type AccountPublic = Pick<
  AccountSelect,
  | 'provider'
  | 'providerUsername'
  | 'providerUserFirstName'
  | 'providerUserLastName'
  | 'providerUserImage'
>
