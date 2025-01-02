export enum UserType {
  Authenticated = 'authenticated',
  Guest = 'guest',
  Unknown = 'unknown',
}

export enum EmitScope {
  Socket = 'socket',
  Global = 'global',
  Local = 'local',
  User = 'user',
  UserOptimized = 'user_optimized',
}
