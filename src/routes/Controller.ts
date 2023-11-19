import type { Request, Response, NextFunction } from 'express'
import ApiError from '../errors/ApiError'
import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk';
import createWaku from '../waku';
import { waitForRemotePeer, Protocols, createDecoder } from "@waku/sdk"

const sdk = new FusionSDK({
  url: 'https://fusion.1inch.io',
  network: NetworkEnum.ETHEREUM
})

function paginate(array: any[], page_size: number, page_number: number) {
  // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
  return array.slice((page_number - 1) * page_size, page_number * page_size)
}
//const orders = {}
export const Controller = {
  getActiveOrders: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query // Assuming the parameters are passed in the request body
      const params: {page: number, limit: number } = { 
        page: queryParams.page ? Number(queryParams.page) : 1,
        limit: queryParams.limit ? Number(queryParams.limit) : 10,
      }

      const node = await createWaku()
      await waitForRemotePeer(node, [Protocols.Store])
      const contentTopic = "/fusionOrderBook"
      // Create a message decoder
      const decoder = createDecoder(contentTopic)
      // Create the store query
      const storeQuery = node.store.queryGenerator([decoder]);
      const items: any[] = []
      // Process the messages
      for await (const messagesPromises of storeQuery) {
          // Fulfil the messages promises
          const messages = await Promise.all(messagesPromises
              .map(async (p) => {
                  const msg = await p
                  // Render the message/payload in your application
                  if (msg) {
                    items.push(msg.payload)
                  }
              })
          )
      }
      //The queryGenerator() function always returns the oldest messages in a page first.
      const filteredOrders = paginate(items, params.limit, params.page)
      const orders = {items: filteredOrders, meta: {totalItems: items.length, currentPage: params.page, itemsPerPage: params.limit, totalPages: Math.ceil(items.length / params.limit)}}
      res.json(orders) // Return the response as JSON
      
    } catch (error) {
      // Handle any errors that occurred during the process
      const apiError = new ApiError("Error", error.message);
      next(apiError);
    }
  },
}
