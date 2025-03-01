export class HttpException<TPayload = unknown> extends Error {
  statusCode: number
  payload: TPayload
  response?: Response

  constructor(statusCode: number, payload: TPayload, response?: Response) {
    super('HTTP exception')
    this.statusCode = statusCode
    this.payload = payload
    this.response = response
  }
}

export class MaintenanceException extends HttpException<void> {
  message = 'Maintenance mode enabled'

  constructor(payload: void) {
    super(503, payload)
  }
}

export class InternalServerException extends HttpException<void> {
  message = 'Internal server error'

  constructor() {
    super(500)
  }
}

export class CloudflareChallengeException extends HttpException<void> {
  message = 'Cloudflare challenge'

  constructor() {
    super(403)
  }
}

export class ResourceLockedException extends HttpException<void> {
  message = 'Resource is locked'

  constructor() {
    super(423)
  }
}

export class NotFoundException extends HttpException<void> {
  message = 'Not found'

  constructor() {
    super(404)
  }
}

export class TimeoutException extends HttpException<void> {
  message = 'Timed out'

  constructor() {
    super(408)
  }
}

export class ConflictException extends HttpException<void> {
  message = 'Conflict'

  constructor() {
    super(409)
  }
}

export class UnprocessableContentException extends HttpException<void> {
  message = 'Unprocessable content'

  constructor() {
    super(422)
  }
}

export class TooManyRequestsException extends HttpException<void> {
  message = 'Too many requests'

  constructor() {
    super(429)
  }
}

export class TooManyConnectionsException extends HttpException<void> {
  message = 'Too many connections'

  constructor() {
    super(429)
  }
}

export enum SocketRejectionReason {
  TooManyConnections = 'TooManyConnections',
  Unknown = 'Unknown',
}

export class UnauthorizedException extends HttpException<void> {
  message = 'Not authorized'

  constructor() {
    super(403)
  }
}

export class NotAuthenticatedException extends HttpException<void> {
  message = 'Not authenticated'

  constructor() {
    super(401)
  }
}

export class SessionExpiredException extends HttpException<void> {
  message = 'Session expired'

  constructor() {
    super(401)
  }
}

type BadRequestExceptionPayload = {
  path?: string[]
  message: string
}

export class BadRequestException extends HttpException<BadRequestExceptionPayload> {
  message = 'Bad request'

  constructor(payload: BadRequestExceptionPayload) {
    super(400, payload)
  }
}

type ValidationExceptionPayload = {
  errors: Record<string, string[] | undefined>
}

export class ValidationException extends HttpException<ValidationExceptionPayload> {
  message = 'Validation error'

  constructor(payload: ValidationExceptionPayload) {
    super(400, payload)
  }
}
