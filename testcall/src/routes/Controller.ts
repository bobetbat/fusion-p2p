import type { Request, Response, NextFunction } from 'express'
import ApiError from '../errors/ApiError'
import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk'
import axios from 'axios'

const sdk = new FusionSDK({
  url: 'http://localhost:3001',
  network: NetworkEnum.ETHEREUM
})

export const Controller = {
  getActiveOrders: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.query // Assuming the parameters are passed in the request body
      // const orders = await axios.get('http://localhost:3001/v1.0/1/order/active/', {
      //   params: params
      // })
      // console.log(orders.data)
      //res.json(orders.data)
      const orders = await sdk.getActiveOrders(params)
      res.json(orders)
       // Return the response as JSON
      
    } catch (error) {
      // Handle any errors that occurred during the process
      const apiError = new ApiError("Error", error.message)
      next(apiError);
    }
  },
}
