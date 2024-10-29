export enum AuthenticateResult {
  SignedIn = 'signed-in',
  SignedUp = 'signed-up',
  Connected = 'connected',
  NotAuthenticated = 'not-authenticated',
}

export type AuthenticateResponse =
  | { result: AuthenticateResult.Connected }
  | { result: AuthenticateResult.NotAuthenticated }
  | {
      result: AuthenticateResult.SignedIn | AuthenticateResult.SignedUp
      code: string
    }

export type AccessTokenResponse = {
  accessToken: string
  sessionExpiresAt: string
}
