import type { NextFunction, Request, Response } from 'express'
import ApiError from '../errors/ApiError'
import logger from '../utils/logger'

export const apiErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err)

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      errors: [err.toJSON()],
    })
  }

  return res.status(500).json({
    errors: [
      {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Internal Server Error. Our team is already notified about the issue.',
      },
    ],
  })
}
