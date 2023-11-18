import * as express from 'express'
import cors from 'cors'
import type { RequestHandler } from 'express'
import getConfig from '../config'
import { apiErrorHandler } from '../utils/apiErrorHandler'
import { Controller } from './Controller'
import { NetworkEnum } from '../constants'
export const ApiRouter = express
  .Router({ mergeParams: true })
  .use(cors())
  .use(express.json() as RequestHandler)

  // Health check
  .get('/ping', (req, res, next) => {
    return res.send(`pong (${getConfig().APP_ENV})`)
  })

  .get(`/orderbook/`, Controller.getActiveOrders)
 
  // Handle API Errors
  .use(apiErrorHandler)

export default ApiRouter
