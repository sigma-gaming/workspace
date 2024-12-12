export enum AuthenticateOutcome {
  SignedIn = 'signed-in',
  SignedUp = 'signed-up',
  Connected = 'connected',
  NotAuthenticated = 'not-authenticated',
}

export type AuthenticateOutput =
  | { outcome: AuthenticateOutcome.Connected }
  | { outcome: AuthenticateOutcome.NotAuthenticated }
  | {
      outcome: AuthenticateOutcome.SignedIn | AuthenticateOutcome.SignedUp
      code: string
    }

export type AccessTokenResponse = {
  accessToken: string
  sessionExpiresAt: string
}
