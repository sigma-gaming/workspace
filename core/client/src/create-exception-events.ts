import {
  BadRequestException,
  CloudflareChallengeException,
  HttpException,
  isException,
  NotAuthenticatedException,
  TooManyRequestsException,
  ValidationException,
} from '@core/exceptions'
import { normalizeFieldErrors } from '@core/forms'
import { Mutation } from '@farfetched/core'
import { createEvent, sample, split } from 'effector'

export function createExceptionEvents(
  mutation: Mutation<any, any, HttpException>,
) {
  const receivedApiError = sample({
    source: mutation.finished.failure,
    fn: ({ error }) => error,
  })

  const receivedFormErrors = createEvent<Partial<Record<string, string[]>>>()

  const {
    validation,
    badRequest,
    notAuthenticated,
    tooManyRequests,
    cloudflareChallenge,
    __: other,
  } = split(receivedApiError, {
    validation: (error): error is ValidationException =>
      isException(error, ValidationException),
    badRequest: (error): error is BadRequestException =>
      isException(error, BadRequestException),
    tooManyRequests: (error): error is TooManyRequestsException =>
      isException(error, TooManyRequestsException),
    notAuthenticated: (error): error is NotAuthenticatedException =>
      isException(error, NotAuthenticatedException),
    cloudflareChallenge: (error): error is CloudflareChallengeException =>
      isException(error, CloudflareChallengeException),
  })

  sample({
    source: validation,
    fn: ({ payload }) => {
      return normalizeFieldErrors(payload.errors)
    },
    target: receivedFormErrors,
  })

  sample({
    source: badRequest,
    filter: (error) => Boolean(error.payload?.path),
    fn: ({ payload }) => {
      const errors: Record<string, string[]> = {}
      const { path = ['root'], message } = payload
      errors[path.join('.')] = [message]
      return errors
    },
    target: receivedFormErrors,
  })

  const badRequestMessage = sample({
    source: badRequest,
    filter: (error) => !error.payload?.path,
    fn: ({ payload }) => payload.message,
  })

  return {
    badRequest,
    badRequestMessage,
    tooManyRequests,
    notAuthenticated,
    formErrors: receivedFormErrors,
    cloudflareChallenge,
    other,
  }
}
