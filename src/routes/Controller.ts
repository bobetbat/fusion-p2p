import type { Request, Response, NextFunction } from 'express'
import ApiError from '../errors/ApiError'
import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk';

const sdk = new FusionSDK({
  url: 'https://fusion.1inch.io',
  network: NetworkEnum.ETHEREUM
})

//const orders = {}
export const Controller = {
  getActiveOrders: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.query // Assuming the parameters are passed in the request body
      const orders = await sdk.getActiveOrders(params)
      res.json(orders) // Return the response as JSON
      
    } catch (error) {
      // Handle any errors that occurred during the process
      const apiError = new ApiError("Error", error.message);
      next(apiError);
    }
  },
}
