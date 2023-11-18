import helmet from 'helmet'
import cors from 'cors'
import express, { RequestHandler } from 'express'
import http from 'http'
import httpShutdown from 'http-shutdown'
import expressPinoLogger from 'express-pino-logger'
import 'express-async-errors'
import rateLimit from 'express-rate-limit'
import ApiV1Router from './routes'
import getConfig from './config'
import logger from './utils/logger'

require("dotenv").config();

const app = express()

const server = httpShutdown(new http.Server(app))

// Add Request logger https://github.com/pinojs/express-pino-logger
app.use(expressPinoLogger())

// Add cors
app.use(cors())

// Remove powered by header
app.set('x-powered-by', false)

app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  }) as RequestHandler,
)

// Sets "X-Content-Type-Options: nosniff"
app.use(helmet.noSniff() as RequestHandler)


// Routes
app.use('/orders/v1.0', ApiV1Router)

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 1 minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

//Limit only api calls, not swagger since 1 swagger call is 9 api calls
//Otherwise second swagger call will be limited
app.use('/v1.0', limiter) 

export const start = (): Promise<http.Server> => {
  logger.info(`Starting Express server [${getConfig().APP_ENV}]`)
  return new Promise((resolve) => {
    server.listen(getConfig().PORT, () => {
      logger.info('Express server listening on port ' + getConfig().PORT)
      resolve(server)
    })
  })
}

export const shutdown = (): Promise<void> => {
  logger.info('Stopping Express server')

  return new Promise((resolve) => {
    if (server) {
      return server.shutdown(() => {
        logger.info('Express server stopped')
        resolve()
      })
    }
    resolve()
  })
}
