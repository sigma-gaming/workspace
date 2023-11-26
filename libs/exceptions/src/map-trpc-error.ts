import { TRPCError } from '@trpc/server'
import {
  BadRequestException,
  ConflictException,
  InternalServerException,
  NotFoundException,
  TimeoutException,
  TooManyRequestsException,
  UnauthorizedException,
  UnprocessableContentException,
} from './exceptions'

export function mapTrpcErrorToException(error: TRPCError) {
  if (error.code === 'BAD_REQUEST') {
    return new BadRequestException({ message: error.message })
  }

  if (
    error.code === 'UNAUTHORIZED' ||
    error.code === 'FORBIDDEN' ||
    error.code === 'PRECONDITION_FAILED'
  ) {
    return new UnauthorizedException()
  }

  if (error.code === 'NOT_FOUND') {
    return new NotFoundException()
  }

  if (error.code === 'TIMEOUT') {
    return new TimeoutException()
  }

  if (error.code === 'CONFLICT') {
    return new ConflictException()
  }

  if (error.code === 'UNPROCESSABLE_CONTENT') {
    return new UnprocessableContentException()
  }

  if (error.code === 'TOO_MANY_REQUESTS') {
    return new TooManyRequestsException()
  }

  return new InternalServerException()
}
