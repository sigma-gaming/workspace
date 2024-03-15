import { AccountSelect } from '@games/db-schema'

export type AccountPublic = Pick<
  AccountSelect,
  | 'provider'
  | 'providerUsername'
  | 'providerUserFirstName'
  | 'providerUserLastName'
  | 'providerUserImage'
>
