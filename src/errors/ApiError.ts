import BaseError from './BaseError'

export default class ApiError extends BaseError {
  readonly code: string
  readonly status: number

  constructor(
    code: string,
    message: string,
    status?: number,
  ) {
    super(message)
    this.code = code
    this.status = status || 400
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
    }
  }
}
