import { ZodIssue } from 'zod'

export class RouteException<TPayload = void> extends Error {
  name = 'RouteException'
  statusCode = 400
  payload: TPayload

  constructor(payload: TPayload) {
    super('Route exception')
    this.payload = payload
  }
}

export class MaintenanceException extends RouteException {
  name = 'MaintenanceException'
  statusCode = 503
  message = 'Maintenance mode enabled'
}

export class InternalServerException extends RouteException<{
  cause?: Error
} | void> {
  name = 'InternalServerException'
  statusCode = 500
  message = 'Internal server error'
}

export class ResourceLockedException extends RouteException {
  name = 'ResourceLockedException'
  statusCode = 423
  message = 'Resource is locked'
}

export class NotFoundException extends RouteException {
  name = 'NotFoundException'
  statusCode = 404
  message = 'Not found'
}

export class TimeoutException extends RouteException {
  name = 'TimeoutException'
  statusCode = 408
  message = 'Timed out'
}

export class ConflictException extends RouteException {
  name = 'ConflictException'
  statusCode = 409
  message = 'Conflict'
}

export class UnprocessableContentException extends RouteException {
  name = 'UnprocessableContentException'
  statusCode = 422
  message = 'Unprocessable content'
}

export class TooManyRequestsException extends RouteException {
  name = 'TooManyRequestsException'
  statusCode = 429
  message = 'Too many requests'
}

export class UnauthorizedException extends RouteException {
  name = 'UnauthorizedException'
  statusCode = 403
  message = 'Not authorized'
}

export class NotAuthenticatedException extends RouteException {
  name = 'NotAuthenticatedException'
  statusCode = 401
  message = 'Not authenticated'
}

export class SessionExpiredException extends RouteException {
  name = 'SessionExpiredException'
  statusCode = 401
  message = 'Session expired'
}

interface BadRequestExceptionPayload {
  path?: string[]
  message: string
}

export class BadRequestException extends RouteException<BadRequestExceptionPayload> {
  name = 'BadRequestException'
  statusCode = 400
  message = 'Bad request'
}

interface ValidationExceptionPayload {
  issues: ZodIssue[]
  fieldErrors: Record<string, string[] | undefined>
}

export class ValidationException extends RouteException<ValidationExceptionPayload> {
  name = 'ValidationException'
  statusCode = 400
  message = 'Validation error'
}
