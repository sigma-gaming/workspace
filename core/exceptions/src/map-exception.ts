import * as exceptions from './exceptions'

export function mapException(
  http: exceptions.HttpException<any>,
): exceptions.HttpException<unknown> {
  if (http.statusCode === 400 && http.payload && 'message' in http.payload) {
    return new exceptions.BadRequestException({ message: http.payload.message })
  }

  if (http.statusCode === 400 && http.payload && 'errors' in http.payload) {
    return new exceptions.ValidationException({ errors: http.payload.errors })
  }

  if (http.statusCode === 401) return new exceptions.NotAuthenticatedException()
  if (http.statusCode === 403) return new exceptions.UnauthorizedException()
  if (http.statusCode === 404) return new exceptions.NotFoundException()
  if (http.statusCode === 408) return new exceptions.TimeoutException()
  if (http.statusCode === 409) return new exceptions.ConflictException()
  if (http.statusCode === 422)
    return new exceptions.UnprocessableContentException()
  if (http.statusCode === 423) return new exceptions.ResourceLockedException()
  if (http.statusCode === 429) return new exceptions.TooManyRequestsException()
  if (http.statusCode === 500) return new exceptions.InternalServerException()
  if (http.statusCode === 503) return new exceptions.MaintenanceException()

  return new exceptions.InternalServerException()
}
