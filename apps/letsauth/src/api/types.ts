export enum AuthenticateResult {
  SignedIn = 'signed-in',
  SignedUp = 'signed-up',
  Connected = 'connected',
}

export type AuthenticateResponse =
  | { result: AuthenticateResult.Connected }
  | {
      result: AuthenticateResult.SignedIn | AuthenticateResult.SignedUp
      code: string
    }

export type AccessTokenResponse = {
  accessToken: string
  sessionExpiresAt: string
}
