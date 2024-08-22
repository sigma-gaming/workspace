import {
  BadRequestException,
  RouteException,
  TooManyRequestsException,
  ValidationException,
} from '@core/exceptions'
import { normalizeFieldErrors } from '@core/forms'
import { Mutation } from '@farfetched/core'
import { createEvent, sample, split } from 'effector'

export function createExceptionEvents(
  mutation: Mutation<any, any, RouteException<unknown>>,
) {
  const receivedApiError = sample({
    source: mutation.finished.failure,
    fn: ({ error }) => error,
  })

  const receivedFormErrors = createEvent<Partial<Record<string, string[]>>>()

  const {
    validation,
    badRequest,
    tooManyRequests,
    __: other,
  } = split(receivedApiError, {
    validation: (error): error is ValidationException =>
      error instanceof ValidationException,
    badRequest: (error): error is BadRequestException =>
      error instanceof BadRequestException,
    tooManyRequests: (error): error is TooManyRequestsException =>
      error instanceof TooManyRequestsException,
  })

  sample({
    source: validation,
    fn: ({ payload }) => {
      const { fieldErrors } = payload
      return normalizeFieldErrors(fieldErrors)
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
    formErrors: receivedFormErrors,
    other,
  }
}
